/**
 * GPT-Live voice session.
 *
 * Full-duplex speech with `gpt-live-1`, connected over WebRTC. Audio flows
 * directly between the browser and OpenAI; this module never sees the API key --
 * SDP negotiation is brokered by the `admin-agent` Edge Function, which holds it.
 *
 * CLIENT DELEGATION. GPT-Live is configured with `delegation: { type: "client" }`,
 * so when the owner asks for something the model does not answer it itself --
 * it raises a delegation event and we run the request through the SAME text
 * agent used by the composer. That is the whole point: a spoken instruction
 * produces identical tool calls, proposals and audit rows as a typed one, and
 * the voice model has no path to a write that skips the approval gate.
 *
 * Delegation carries no task text (OpenAI: "the delegation event contains
 * metadata, not task text"), so we accumulate transcript deltas and send the
 * recent transcript to the backend with the delegation.
 */

import { supabase } from '../../lib/supabase';
import type { VoiceReply } from './useAssistant';

export type VoiceState = 'idle' | 'connecting' | 'live' | 'error';

export interface VoiceEvents {
    onState: (state: VoiceState, detail?: string) => void;
    /** Live captions so the panel can show what is being said. */
    onTranscript: (entry: { role: 'user' | 'assistant'; text: string; final: boolean }) => void;
    /** A backend reply is ready; return the text for GPT-Live to say aloud. */
    onDelegation: (task: string) => Promise<VoiceReply>;
    onError: (message: string) => void;
    /** 0..1 microphone loudness, for a level meter. */
    onLevel?: (level: number) => void;
}

interface TranscriptLine {
    role: 'user' | 'assistant';
    text: string;
}

/** Keeps a delegated task bounded without losing the recent thread. */
const MAX_TRANSCRIPT_LINES = 24;
const DELEGATION_TIMEOUT_MS = 120_000;
/** Commentary appends are limited to 500 tokens per event. */
const MAX_SPOKEN_CHARS = 1_200;

export class VoiceSession {
    private pc: RTCPeerConnection | null = null;
    private dc: RTCDataChannel | null = null;
    private mic: MediaStream | null = null;
    private audio: HTMLAudioElement | null = null;
    private transcript: TranscriptLine[] = [];
    private replyBuffer = '';
    private writeBuffer = '';
    private delegating = false;
    private stopped = false;
    private startedTimer: ReturnType<typeof setTimeout> | null = null;
    private levelRaf = 0;
    private levelCtx: AudioContext | null = null;

    constructor(private events: VoiceEvents) {}

    get active(): boolean {
        return !!this.pc && !this.stopped;
    }

    private markLive(): void {
        if (this.startedTimer) {
            clearTimeout(this.startedTimer);
            this.startedTimer = null;
        }
        console.info('[TuuBeetuu voice] session live');
        this.events.onState('live');
    }

    /**
     * Measures microphone loudness purely for UI feedback.
     *
     * This exists because "connected but nothing happens" is otherwise
     * indistinguishable from "the microphone is not picking you up" -- and on a
     * phone there is no console to check. A separate AudioContext is used rather
     * than touching the WebRTC send track, so this cannot affect the audio that
     * reaches OpenAI.
     */
    private startLevelMeter(): void {
        if (!this.events.onLevel || !this.mic) return;
        try {
            const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
            if (!Ctor) return;

            const ctx: AudioContext = new Ctor();
            this.levelCtx = ctx;
            const source = ctx.createMediaStreamSource(this.mic);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.75;
            source.connect(analyser);

            const buf = new Uint8Array(analyser.fftSize);
            const tick = () => {
                if (this.stopped || !this.events.onLevel) return;
                this.levelRaf = requestAnimationFrame(tick);
                analyser.getByteTimeDomainData(buf);
                let sum = 0;
                for (let i = 0; i < buf.length; i++) {
                    const v = (buf[i] - 128) / 128;
                    sum += v * v;
                }
                this.events.onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 3.2));
            };
            this.levelRaf = requestAnimationFrame(tick);
        } catch (err) {
            // Feedback only -- never let the meter break a working session.
            console.warn('[TuuBeetuu voice] level meter unavailable:', err);
        }
    }

    private stopLevelMeter(): void {
        if (this.levelRaf) {
            cancelAnimationFrame(this.levelRaf);
            this.levelRaf = 0;
        }
        try {
            this.levelCtx?.close();
        } catch { /* already closed */ }
        this.levelCtx = null;
        this.events.onLevel?.(0);
    }

    /**
     * Mic permission is requested BEFORE the SDP offer, because that is what
     * makes the audio track available to add to the peer connection.
     */
    async start(): Promise<void> {
        this.stopped = false;
        this.events.onState('connecting');

        try {
            // Browsers only allow getUserMedia on a secure origin or localhost.
            if (!window.isSecureContext) {
                throw new Error(
                    'Microphone access needs https:// or http://localhost. Voice will not work on a plain http address.',
                );
            }
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('This browser does not expose microphone access.');
            }

            const pc = new RTCPeerConnection();
            this.pc = pc;

            // Playback target for the model's voice.
            //
            // This element MUST be attached to the document. A detached <audio>
            // with a MediaStream source is unreliable across browsers and fails
            // silently, which presents as "connected but no sound". It is kept
            // visually hidden rather than using `display: none`, since a
            // display-none element may not be treated as playing media.
            const audio = document.createElement('audio');
            audio.autoplay = true;
            audio.setAttribute('playsinline', 'true');
            audio.style.position = 'fixed';
            audio.style.width = '1px';
            audio.style.height = '1px';
            audio.style.opacity = '0';
            audio.style.pointerEvents = 'none';
            audio.style.left = '-9999px';
            document.body.appendChild(audio);
            this.audio = audio;

            let trackCount = 0;
            pc.addEventListener('track', (event) => {
                trackCount += 1;
                console.info(
                    `[TuuBeetuu voice] remote track #${trackCount}: kind=${event.track.kind} ` +
                        `muted=${event.track.muted} state=${event.track.readyState}`,
                );

                // Remote audio can be silent for the first moment; wait until the
                // track is actually unmuted before deciding playback failed.
                event.track.addEventListener('unmute', () => {
                    console.info('[TuuBeetuu voice] remote audio track unmuted');
                });

                audio.srcObject = new MediaStream([event.track]);
                audio.play().then(
                    () => console.info('[TuuBeetuu voice] playback started'),
                    (err) => {
                        const message =
                            'Connected, but the browser blocked audio playback ' +
                            `(${err?.name ?? 'error'}). Click anywhere on the page, then toggle the mic again.`;
                        console.error('[TuuBeetuu voice]', message);
                        this.events.onState('error', message);
                        this.events.onError(message);
                    },
                );
            });

            // If the peer connects but never negotiates an audio track there is
            // nothing to play, which otherwise looks identical to "no sound".
            pc.addEventListener('connectionstatechange', () => {
                console.info('[TuuBeetuu voice] connection state:', pc.connectionState);
            });

            this.mic = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.info('[TuuBeetuu voice] microphone acquired:', this.mic.getAudioTracks().length, 'track(s)');
            for (const track of this.mic.getAudioTracks()) {
                pc.addTrack(track, this.mic);
            }

            this.startLevelMeter();

            // The event channel must exist before the offer is created.
            const dc = pc.createDataChannel('oai-events');
            this.dc = dc;
            dc.addEventListener('message', (e) => this.handleEvent(JSON.parse(e.data)));
            dc.addEventListener('close', () => {
                if (!this.stopped) this.events.onState('idle', 'Session closed.');
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await this.waitForIceGathering(pc);

            const sdp = pc.localDescription?.sdp;
            if (!sdp) throw new Error('Failed to build a WebRTC offer.');

            const { data, error } = await supabase.functions.invoke('admin-agent', {
                body: { action: 'live', sdp },
            });

            if (error) {
                let detail = error.message || 'Could not start the voice session.';
                try {
                    const raw = await (error as any)?.context?.json?.();
                    if (raw) detail = [raw.detail, raw.hint].filter(Boolean).join(' ') || raw.error || detail;
                } catch { /* not JSON */ }
                throw new Error(detail);
            }
            if (data?.error) throw new Error(data.detail || data.error);
            if (typeof data?.sdp !== 'string') {
                throw new Error('The server did not return an SDP answer.');
            }

            await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
            console.info('[TuuBeetuu voice] SDP answer applied; waiting for session.started');

            // The HTTP request starts the session, so `session.started` should
            // follow promptly. If it never does, say so rather than leaving the
            // UI showing "listening" while nothing is happening.
            this.startedTimer = setTimeout(() => {
                if (this.stopped) return;
                const message =
                    'Connected to OpenAI but the session never started. The server accepted the ' +
                    'SDP, so this is usually a model name or account-access problem. Check the ' +
                    'Edge Function logs and that LIVE_MODEL is available to your account.';
                console.error('[TuuBeetuu voice]', message);
                this.events.onState('error', message);
                this.events.onError(message);
            }, 20_000);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.stop(false);
            this.events.onState('error', message);
            this.events.onError(message);
        }
    }

    /**
     * Tears everything down. `notify` is false when called from within start()'s
     * own error path, which reports its own state and must not be overwritten by
     * a second 'idle' transition.
     */
    stop(notify = true): void {
        this.stopped = true;
        if (this.startedTimer) {
            clearTimeout(this.startedTimer);
            this.startedTimer = null;
        }
        this.stopLevelMeter();
        try {
            this.dc?.close();
        } catch { /* already closed */ }
        try {
            this.mic?.getTracks().forEach((t) => t.stop());
        } catch { /* already stopped */ }
        try {
            this.pc?.close();
        } catch { /* already closed */ }
        if (this.audio) {
            this.audio.srcObject = null;
            // Remove the element we appended to the document.
            this.audio.remove();
        }
        this.dc = null;
        this.pc = null;
        this.mic = null;
        this.audio = null;
        this.transcript = [];
        this.replyBuffer = '';
        this.writeBuffer = '';
        this.delegating = false;
        if (notify) this.events.onState('idle');
    }

    private waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
        if (pc.iceGatheringState === 'complete') return Promise.resolve();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                pc.removeEventListener('icegatheringstatechange', onState);
                reject(new Error('Timed out while gathering network candidates.'));
            }, 10_000);
            const onState = () => {
                if (pc.iceGatheringState !== 'complete') return;
                clearTimeout(timeout);
                pc.removeEventListener('icegatheringstatechange', onState);
                resolve();
            };
            pc.addEventListener('icegatheringstatechange', onState);
            onState();
        });
    }

    private send(event: Record<string, unknown>): void {
        if (this.dc?.readyState !== 'open') {
            console.warn('[TuuBeetuu voice] dropped event, data channel not open:', event.type, this.dc?.readyState);
            return;
        }
        console.debug('[TuuBeetuu voice] ->', event.type);
        this.dc.send(JSON.stringify(event));
    }

    private pushTranscript(role: 'user' | 'assistant', text: string): void {
        const last = this.transcript[this.transcript.length - 1];
        if (last && last.role === role) {
            last.text = `${last.text}${text}`;
        } else {
            this.transcript.push({ role, text });
        }
        if (this.transcript.length > MAX_TRANSCRIPT_LINES) {
            this.transcript = this.transcript.slice(-MAX_TRANSCRIPT_LINES);
        }
    }

    private renderTranscript(): string {
        return this.transcript
            .map((l) => `${l.role === 'user' ? 'Owner' : 'Tuu Beetuu'}: ${l.text}`)
            .join('\n');
    }

    private handleEvent(event: any): void {
        if (this.stopped || !event?.type) return;

        // Every event is logged. If the event names this integration expects
        // differ from what the API actually sends, this is how it becomes
        // visible instead of presenting as "connected but silent".
        console.debug('[TuuBeetuu voice] <-', event.type);

        switch (event.type) {
            case 'session.started':
                this.markLive();
                return;

            case 'session.closed':
                this.events.onState('idle', 'Conversation ended.');
                this.stop(false);
                return;

            case 'error':
                this.events.onError(
                    event?.error?.message || event?.message || 'The voice session reported an error.',
                );
                return;

            // ---- live captions -------------------------------------------
            case 'session.input_transcript.delta':
                this.pushTranscript('user', String(event.delta ?? ''));
                this.events.onTranscript({ role: 'user', text: String(event.delta ?? ''), final: false });
                return;

            case 'session.output_transcript.delta':
                this.pushTranscript('assistant', String(event.delta ?? ''));
                this.events.onTranscript({ role: 'assistant', text: String(event.delta ?? ''), final: false });
                return;

            // ---- delegation ---------------------------------------------
            case 'session.delegation.created':
                void this.runDelegation(String(event?.delegation?.id ?? ''));
                return;

            default:
                return;
        }
    }

    /**
     * The backend half of client delegation. Note the fail-safe: if anything
     * goes wrong we return nothing to GPT-Live rather than inventing an answer,
     * and we never report a change as done -- a proposal only exists once the
     * deterministic backend created it.
     */
    private async runDelegation(delegationId: string): Promise<void> {
        if (this.delegating) return;
        this.delegating = true;
        this.writeBuffer = '';

        // Say something so the line is not silent while the backend works.
        this.send({
            type: 'session.thinking.append',
            event_id: `progress_${Date.now()}`,
            delegation_id: delegationId || null,
            content: 'Checking the shop records now.',
        });

        try {
            const task = this.renderTranscript().trim();
            if (!task) {
                this.append(delegationId, 'I did not catch that. Could you say it again?');
                return;
            }

            const reply = await this.withTimeout(this.events.onDelegation(task), DELEGATION_TIMEOUT_MS);

            if (reply.error) {
                this.append(delegationId, `I could not complete that. ${reply.error}`);
                return;
            }

            const spoken = (reply.proposal ? reply.spoken : reply.answer) || '';
            this.append(delegationId, spoken);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.append(delegationId, `That took too long or failed. ${message}`);
        } finally {
            this.delegating = false;
        }
    }

    private append(delegationId: string, content: string): void {
        const trimmed = content.trim();
        if (!trimmed) return;
        this.send({
            type: 'session.commentary.append',
            event_id: `result_${Date.now()}`,
            delegation_id: delegationId || null,
            content: trimmed.slice(0, MAX_SPOKEN_CHARS),
        });
    }

    private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('The backend did not respond in time.')), ms);
            promise.then(
                (v) => { clearTimeout(timer); resolve(v); },
                (e) => { clearTimeout(timer); reject(e); },
            );
        });
    }
}

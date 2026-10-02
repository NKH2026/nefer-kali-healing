/**
 * The assistant conversation UI, shared by two presentations:
 *
 *   mode="page"     the full /admin/assistant route
 *   mode="widget"   the floating panel available on every admin page
 *
 * It holds no state of its own -- everything comes from useAssistant(), so the
 * two modes are literally the same conversation and switching between them
 * never loses context.
 *
 * The 3D character is rendered ONLY in page mode. A floating widget would
 * otherwise create a second WebGL context alongside any the page already has,
 * and would pull the three.js chunk for users who only ever use the widget.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Send, Loader2, Sparkles, AlertTriangle, Wrench, User as UserIcon,
    ShieldAlert, Check, ArrowRight, Undo2, Mic, MicOff,
    ExternalLink, GitPullRequest, UploadCloud, Paperclip, X as XIcon, ImageIcon, Eye,
} from 'lucide-react';
import {
    useAssistant, SUGGESTIONS, THINKING_LINES, prettyTool, riskStyles, renderValue,
    type Proposal,
} from './useAssistant';
import { VoiceSession, type VoiceState } from './voiceSession';
import { uploadAsset, assetsContext, ACCEPTED_TYPES, MAX_UPLOAD_BYTES, type UploadedAsset } from '../../lib/uploads';

// Three.js is ~140 kB gzipped. The scene is code-split so it only downloads for
// the full-page view -- storefront visitors and widget-only users never pay.
const TuuBeetuu = React.lazy(() => import('./TuuBeetuu'));

interface Props {
    mode: 'page' | 'widget';
    className?: string;
}

/** Small animated mushroom mark, used in the widget header instead of WebGL. */
export const ToadstoolGlyph: React.FC<{ size?: number; className?: string }> = ({ size = 30, className }) => (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
        <defs>
            <radialGradient id="tb-cap" cx="42%" cy="34%" r="70%">
                <stop offset="0%" stopColor="#ffd9fb" />
                <stop offset="34%" stopColor="#c77dff" />
                <stop offset="68%" stopColor="#7b2ff7" />
                <stop offset="100%" stopColor="#2fbfa8" />
            </radialGradient>
            <radialGradient id="tb-stem" cx="50%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#fff3ff" />
                <stop offset="65%" stopColor="#c9a9ff" />
                <stop offset="100%" stopColor="#6d3bbf" />
            </radialGradient>
            <filter id="tb-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.6" result="b" />
                <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        {/* stem */}
        <path
            d="M20.5 26c-.6 5.5-1.6 8.6-3.4 11.4 1.9 1.5 11.9 1.5 14.4 0C29.6 34.6 28.4 31.5 27.8 26z"
            fill="url(#tb-stem)"
            opacity="0.95"
        />
        {/* cap */}
        <path
            d="M24 6.5C14.3 6.5 6 13.4 6 21.2c0 2.1 1.4 3.5 3.6 3.9 3.2.6 25.6.6 28.8 0 2.2-.4 3.6-1.8 3.6-3.9C42 13.4 33.7 6.5 24 6.5z"
            fill="url(#tb-cap)"
            filter="url(#tb-glow)"
        />
        {/* spots */}
        <circle cx="15.5" cy="15.5" r="2.5" fill="#fff8ff" opacity="0.92" />
        <circle cx="24" cy="12.4" r="1.9" fill="#fff8ff" opacity="0.8" />
        <circle cx="32.6" cy="16.6" r="2.2" fill="#fff8ff" opacity="0.86" />
        <circle cx="20.4" cy="19.6" r="1.4" fill="#eafffb" opacity="0.7" />
        {/* eye glints on the stem, giving it a face without literal eyes */}
        <ellipse cx="20.4" cy="31.6" rx="1.25" ry="1.7" fill="#1b1030" opacity="0.75" />
        <ellipse cx="27.6" cy="31.6" rx="1.25" ry="1.7" fill="#1b1030" opacity="0.75" />
        <path d="M22 35.6q2 1.4 4 0" stroke="#1b1030" strokeWidth="1.1" fill="none" opacity="0.6" strokeLinecap="round" />
    </svg>
);

/** Ambient colour wash behind the transcript. Kept very faint: these sit
 *  behind semi-transparent cards, so anything stronger bleeds into the text. */
const AuraBackdrop: React.FC = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
            className="absolute -top-16 -left-10 w-48 h-48 rounded-full blur-3xl opacity-[0.10]"
            style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }}
        />
        <div
            className="absolute top-1/3 -right-12 w-40 h-40 rounded-full blur-3xl opacity-[0.08]"
            style={{ background: 'radial-gradient(circle, #2fbfa8, transparent 70%)' }}
        />
        <div
            className="absolute -bottom-10 left-1/4 w-44 h-44 rounded-full blur-3xl opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #ff77e1, transparent 70%)' }}
        />
    </div>
);

/** Theme proposals carry hue numbers, and "Primary hue 265 to 310" tells you
 *  nothing about what you are about to approve. Render the actual colour. */
const HUE_FIELDS = new Set(['hue1', 'hue2', 'hue3']);

const FieldValue: React.FC<{ field: string; value: unknown; muted?: boolean }> = ({ field, value, muted }) => {
    const swatch = HUE_FIELDS.has(field) && typeof value === 'number' ? `hsl(${value} 75% 60%)` : null;
    return (
        <span className="inline-flex items-center gap-1.5 min-w-0">
            {swatch && (
                <span
                    className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/20"
                    style={{ backgroundColor: swatch }}
                    aria-hidden="true"
                />
            )}
            <span className={muted ? 'text-gray-400 line-through truncate' : 'text-white font-medium truncate'}>
                {renderValue(value)}
            </span>
        </span>
    );
};

const ProposalCard: React.FC<{
    turnId: string;
    proposal: Proposal;
    state?: string;
    note?: string;
    sourcePreview?: {
        previewUrl: string | null;
        prUrl: string | null;
        branch: string;
        note: string;
    };
    onAct: (turnId: string, proposal: Proposal, action: 'apply' | 'undo') => void;
    onPublish: (turnId: string, proposal: Proposal) => void;
    onDiscard: (turnId: string) => void;
    compact: boolean;
}> = ({ turnId, proposal, state, note, sourcePreview, onAct, onPublish, onDiscard, compact }) => (
    <div className="rounded-xl border border-purple-500/30 bg-purple-950/25 overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/40 to-fuchsia-900/20">
            <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert size={13} className="text-fuchsia-300 flex-shrink-0" />
                <span className="text-[10px] font-urbanist font-semibold text-purple-100 uppercase tracking-wider">
                    {sourcePreview ? 'Preview built' : 'Proposed change'}
                </span>
            </div>
            <span
                className={`text-[9px] font-urbanist uppercase tracking-wide px-2 py-0.5 rounded-full border ${riskStyles[proposal.risk] ?? riskStyles.medium}`}
            >
                {proposal.risk}
            </span>
        </div>

        <div className={`${compact ? 'px-3 py-2.5' : 'px-4 py-3'} space-y-2.5`}>
            <p className="text-sm font-urbanist text-gray-100">{proposal.summary}</p>

            <div className="space-y-1.5">
                {proposal.preview?.map((f, i) => (
                    <div
                        key={`${f.field}-${i}`}
                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs font-urbanist bg-black/40 rounded-lg px-2.5 py-2"
                    >
                        <div className="min-w-0">
                            <div className="text-gray-500 text-[9px] uppercase tracking-wide truncate">{f.label}</div>
                            <FieldValue field={f.field} value={f.before} muted />
                        </div>
                        <ArrowRight size={12} className="text-fuchsia-400 flex-shrink-0" />
                        <div className="min-w-0">
                            <div className="text-gray-500 text-[9px] uppercase tracking-wide">becomes</div>
                            <FieldValue field={f.field} value={f.after} />
                        </div>
                    </div>
                ))}
            </div>

            {state === 'pending' && (
                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    <button
                        onClick={() => onAct(turnId, proposal, 'apply')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-urbanist font-semibold transition-all shadow-lg shadow-purple-900/40"
                    >
                        <Check size={13} />
                        {proposal.tool_name === 'propose_page_edit' ? 'Build preview' : 'Apply this change'}
                    </button>
                    <button
                        onClick={() => onDiscard(turnId)}
                        className="px-3 py-2 rounded-lg border border-white/15 text-gray-400 hover:text-white text-xs font-urbanist transition-colors"
                    >
                        Discard
                    </button>
                    <span className="text-[10px] font-urbanist text-gray-600 ml-auto">
                        expires {new Date(proposal.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )}

            {/* Source edits: the preview link, then a separate publish step. */}
            {sourcePreview && state === 'applied' && (
                <div className="space-y-2 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {sourcePreview.previewUrl ? (
                            <a
                                href={sourcePreview.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-urbanist font-semibold hover:bg-white/20 transition-colors"
                            >
                                <ExternalLink size={12} />
                                Open preview
                            </a>
                        ) : (
                            <span className="text-[11px] font-urbanist text-amber-300/90">
                                No preview URL — check the pull request instead.
                            </span>
                        )}
                        {sourcePreview.prUrl && (
                            <a
                                href={sourcePreview.prUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white text-[11px] font-urbanist transition-colors"
                            >
                                <GitPullRequest size={11} />
                                Pull request
                            </a>
                        )}
                    </div>

                    {sourcePreview.note && (
                        <p className="text-[11px] font-urbanist text-gray-500">{sourcePreview.note}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => onPublish(turnId, proposal)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-urbanist font-semibold transition-colors"
                        >
                            <UploadCloud size={13} />
                            Publish to the live site
                        </button>
                        <button
                            onClick={() => onAct(turnId, proposal, 'undo')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white text-[11px] font-urbanist transition-colors"
                        >
                            <Undo2 size={11} /> Discard preview
                        </button>
                    </div>
                </div>
            )}

            {state === 'published' && (
                <div className="flex items-center gap-1.5 text-xs font-urbanist text-emerald-300 pt-0.5">
                    <Check size={13} /> Published to the live site
                </div>
            )}

            {/* Non-source changes keep the simple applied/undo pair. */}
            {state === 'applied' && !sourcePreview && (
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-urbanist text-emerald-300">
                        <Check size={13} /> Applied
                    </span>
                    {proposal.reversible && (
                        <button
                            onClick={() => onAct(turnId, proposal, 'undo')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white text-[11px] font-urbanist transition-colors"
                        >
                            <Undo2 size={11} /> Undo
                        </button>
                    )}
                </div>
            )}

            {state === 'undone' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-urbanist text-gray-400">
                    <Undo2 size={13} /> Reverted
                </span>
            )}

            {state === 'discarded' && (
                <span className="text-xs font-urbanist text-gray-500">Discarded</span>
            )}

            {state === 'failed' && (
                <div className="text-xs font-urbanist text-red-300 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                    {note}
                </div>
            )}

            {note && state !== 'failed' && (
                <p className="text-[11px] font-urbanist text-gray-500">{note}</p>
            )}
        </div>
    </div>
);

const AssistantPanel: React.FC<Props> = ({ mode, className = '' }) => {
    const { controller } = useAssistant();
    const { turns, busy, mood, thinkingLine, send, sendForVoice, actOnProposal, publishPageEdit, discardProposal, isEmpty } = controller;

    const [input, setInput] = React.useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ---- voice ----------------------------------------------------------
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const [caption, setCaption] = useState<string>('');
    const [level, setLevel] = useState(0);
    const voiceRef = useRef<VoiceSession | null>(null);

    const compact = mode === 'widget';

    // ---- attachments (Option A: assets the assistant can reference) -------
    const [attached, setAttached] = useState<UploadedAsset[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const onFilesPicked = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploadError(null);
        setUploading(true);
        try {
            // Sequential, so a rejection part-way through does not leave an
            // ambiguous set of half-uploaded files.
            const added: UploadedAsset[] = [];
            for (const file of Array.from(files)) {
                added.push(await uploadAsset(file));
            }
            setAttached((prev) => [...prev, ...added]);
        } catch (err: any) {
            setUploadError(err?.message || 'That file could not be uploaded.');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [turns, busy]);

    // Focus the composer when the widget opens.
    useEffect(() => {
        if (compact) inputRef.current?.focus();
    }, [compact]);

    // Never leave the microphone open if the panel goes away.
    useEffect(() => () => voiceRef.current?.stop(false), []);

    const toggleVoice = async () => {
        if (voiceState === 'live' || voiceState === 'connecting') {
            voiceRef.current?.stop();
            voiceRef.current = null;
            setCaption('');
            setLevel(0);
            return;
        }

        setVoiceError(null);
        setCaption('');
        setLevel(0);
        const session = new VoiceSession({
            onState: (state, detail) => {
                setVoiceState(state);
                if (state === 'error' && detail) setVoiceError(detail);
                if (state === 'live') setVoiceError(null);
                if (state === 'idle') setLevel(0);
            },
            onTranscript: ({ role, text }) => {
                setCaption(role === 'user' ? `You: ${text}` : `Tuu Beetuu: ${text}`);
            },
            // Delegated work goes through the same agent as typed messages.
            onDelegation: (task) => sendForVoice(task),
            onError: (message) => setVoiceError(message),
            onLevel: setLevel,
        });
        voiceRef.current = session;
        await session.start();
    };

    const voiceBusy = voiceState === 'connecting';
    const voiceLive = voiceState === 'live';

    const submit = () => {
        if (busy || uploading) return;
        const text = input.trim();
        // An attachment on its own is a valid message: the owner may just be
        // handing over a file for later use.
        if (!text && attached.length === 0) return;

        // Assets are described to the assistant as plain text appended to the
        // message, since it has no vision capability.
        const payload = attached.length
            ? `${text || 'I have attached some files.'}${assetsContext(attached)}`
            : text;

        send(payload);
        setInput('');
        setAttached([]);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const shellClass = useMemo(() => {
        if (compact) {
            return 'flex flex-col h-full min-h-0';
        }
        return 'flex flex-col h-[calc(100vh-8rem)] max-w-4xl';
    }, [compact]);

    return (
        <div className={`${shellClass} ${className}`}>
            {/* Header — only the full page presents the 3D character */}
            {mode === 'page' && (
                <div className="mb-6 flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                        <div
                            className="absolute left-1/2 -translate-x-1/2 bottom-1 w-32 h-6 rounded-full blur-xl opacity-60 pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse, rgba(160,90,255,0.75), transparent 70%)' }}
                        />
                        <React.Suspense
                            fallback={
                                <div
                                    className="relative rounded-full"
                                    style={{
                                        width: 124,
                                        height: 124,
                                        background:
                                            'radial-gradient(circle at 50% 42%, rgba(160,90,255,0.35), rgba(10,10,10,0) 68%)',
                                    }}
                                />
                            }
                        >
                            <TuuBeetuu mood={mood} size={124} className="relative" />
                        </React.Suspense>
                    </div>

                    <div className="min-w-0 pt-1">
                        <h1 className="text-2xl md:text-3xl font-cinzel mb-1 flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-fuchsia-200 to-teal-200">
                            Tuu Beetuu
                            <Sparkles className="w-4 h-4 text-fuchsia-300/80" />
                        </h1>
                        <p className="text-gray-400 font-urbanist text-sm">
                            Galactic mushroom of the archive. Ask about products, orders, reviews,
                            events or settings.
                        </p>
                        <div className="mt-3 flex items-start gap-2 text-xs font-urbanist text-purple-200/90 bg-purple-900/15 border border-purple-500/25 rounded-lg px-3 py-2">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                                Tuu Beetuu looks things up freely, but <strong>nothing changes until you click Apply</strong> on
                                a proposal. Every applied change can be undone.
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Transcript */}
            <div ref={scrollRef} className="relative flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
                <AuraBackdrop />

                <div className="relative space-y-4">
                    {isEmpty && (
                        <div className="space-y-3">
                            <p className="text-gray-500 font-urbanist text-sm">
                                {compact ? 'Ask me anything about the shop:' : 'Try one of these:'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => send(s)}
                                        className="text-left text-sm font-urbanist px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:border-fuchsia-500/40 hover:text-white transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {turns.map((turn) => (
                        <div key={turn.id} className="flex gap-3">
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-urbanist font-bold ${turn.role === 'user'
                                    ? 'bg-white/10 text-gray-300'
                                    : 'bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white'
                                    }`}
                                aria-hidden="true"
                            >
                                {turn.role === 'user' ? <UserIcon size={14} /> : 'TB'}
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                                {turn.error ? (
                                    <div className="text-sm font-urbanist text-red-300 bg-red-900/20 border border-red-500/30 rounded-lg px-3.5 py-2.5">
                                        {turn.error}
                                    </div>
                                ) : (
                                    <div className="text-sm font-urbanist text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                                        {turn.content}
                                    </div>
                                )}

                                {!!turn.tools?.length && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {turn.tools.map((t, i) => (
                                            <span
                                                key={`${t.name}-${i}`}
                                                title={t.error ?? `took ${t.ms}ms`}
                                                className={`inline-flex items-center gap-1.5 text-[10px] font-urbanist px-2 py-0.5 rounded-full border ${t.ok
                                                    ? 'bg-white/5 border-white/10 text-gray-400'
                                                    : 'bg-red-900/20 border-red-500/30 text-red-300'
                                                    }`}
                                            >
                                                <Wrench size={9} />
                                                {prettyTool(t.name)}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {turn.warning && (
                                    <div className="flex items-start gap-2 text-xs font-urbanist text-amber-300/90 bg-amber-900/15 border border-amber-500/25 rounded-lg px-3 py-2">
                                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                        {turn.warning}
                                    </div>
                                )}

                                {turn.proposal && (
                                    <ProposalCard
                                        turnId={turn.id}
                                        proposal={turn.proposal}
                                        state={turn.proposalState}
                                        note={turn.proposalNote}
                                        sourcePreview={turn.sourcePreview}
                                        onAct={actOnProposal}
                                        onPublish={publishPageEdit}
                                        onDiscard={discardProposal}
                                        compact={compact}
                                    />
                                )}
                            </div>
                        </div>
                    ))}

                    {busy && (
                        <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white text-[11px] font-urbanist font-bold flex items-center justify-center flex-shrink-0">
                                TB
                            </div>
                            <div className="text-sm font-urbanist text-purple-200/70 flex items-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span key={thinkingLine} className="animate-pulse">
                                    {THINKING_LINES[thinkingLine]}…
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Composer */}
            <div className={`${compact ? 'pt-3 mt-3' : 'mt-4 pt-4'} border-t border-white/10`}>
                {/* Voice status / captions */}
                {(voiceLive || voiceBusy || voiceError || caption) && (
                    <div
                        className={`mb-2.5 flex items-start gap-2 text-[11px] font-urbanist rounded-lg px-3 py-2 border ${
                            voiceError
                                ? 'text-red-300 bg-red-900/20 border-red-500/30'
                                : voiceLive
                                    ? 'text-fuchsia-200 bg-fuchsia-900/15 border-fuchsia-500/30'
                                    : 'text-purple-200/80 bg-purple-900/15 border-purple-500/25'
                        }`}
                    >
                        {voiceError ? (
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        ) : (
                            <span className="relative flex w-2 h-2 mt-1 flex-shrink-0">
                                <span
                                    className={`absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 ${
                                        voiceLive ? 'animate-ping' : ''
                                    } opacity-75`}
                                />
                                <span className="relative inline-flex rounded-full w-2 h-2 bg-fuchsia-400" />
                            </span>
                        )}
                        <span className="min-w-0 break-words">
                            {voiceError
                                ? voiceError
                                : voiceBusy
                                    ? 'Connecting to GPT-Live…'
                                    : caption || 'Listening — speak out loud. Typing goes to the text assistant instead.'}
                        </span>

                        {/* Mic level. On a phone there is no console, so "it can't
                            hear me" has to be visible here. */}
                        {voiceLive && !voiceError && (
                            <span className="ml-auto flex-shrink-0 flex items-center gap-[3px] h-4" aria-hidden="true">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <span
                                        key={i}
                                        className="w-[3px] rounded-full transition-all duration-75"
                                        style={{
                                            height: `${Math.round(4 + Math.min(1, Math.max(0, level * 5 - i * 0.8)) * 12)}px`,
                                            backgroundColor:
                                                level * 5 > i * 0.8
                                                    ? 'rgb(232 121 249)'
                                                    : 'rgba(255,255,255,0.15)',
                                        }}
                                    />
                                ))}
                            </span>
                        )}
                    </div>
                )}

                {/* Attached files, uploaded and ready to reference */}
                {(attached.length > 0 || uploading || uploadError) && (
                    <div className="mb-2.5 space-y-1.5">
                        {uploadError && (
                            <div className="flex items-start gap-2 text-[11px] font-urbanist text-red-300 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                <span className="min-w-0 break-words">{uploadError}</span>
                            </div>
                        )}

                        {uploading && (
                            <div className="flex items-center gap-2 text-[11px] font-urbanist text-purple-200/80">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Uploading…
                            </div>
                        )}

                        {attached.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {attached.map((a) => (
                                    <span
                                        key={a.id}
                                        className="inline-flex items-center gap-1.5 max-w-full text-[11px] font-urbanist bg-white/5 border border-white/15 rounded-lg pl-2 pr-1 py-1"
                                        title={a.publicUrl}
                                    >
                                        {a.mimeType.startsWith('image/') ? (
                                            <img
                                                src={a.publicUrl}
                                                alt=""
                                                className="w-5 h-5 rounded object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <ImageIcon size={12} className="text-gray-400 flex-shrink-0" />
                                        )}
                                        <span className="truncate max-w-[11rem] text-gray-300">{a.fileName}</span>
                                        {a.mimeType.startsWith('image/') && (
                                            <button
                                                onClick={() => {
                                                    // Ask directly, so looking at an image is one
                                                    // action rather than composing a sentence.
                                                    send(`What is in the image "${a.fileName}"?`);
                                                    setAttached([]);
                                                }}
                                                title="Ask Tuu Beetuu what this image shows"
                                                aria-label={`Describe ${a.fileName}`}
                                                className="p-0.5 rounded text-gray-500 hover:text-fuchsia-300 transition-colors"
                                            >
                                                <Eye size={11} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setAttached((prev) => prev.filter((x) => x.id !== a.id))}
                                            aria-label={`Remove ${a.fileName}`}
                                            className="p-0.5 rounded text-gray-500 hover:text-white transition-colors"
                                        >
                                            <XIcon size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_TYPES.join(',')}
                        onChange={(e) => void onFilesPicked(e.target.files)}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        title={`Attach a file (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)`}
                        aria-label="Attach a file"
                        className="flex-shrink-0 p-2.5 rounded-lg border bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-fuchsia-500/40 disabled:opacity-40 transition-all"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={toggleVoice}
                        title={voiceLive ? 'End voice conversation' : 'Talk to Tuu Beetuu'}
                        aria-label={voiceLive ? 'End voice conversation' : 'Start voice conversation'}
                        className={`flex-shrink-0 p-2.5 rounded-lg border transition-all ${
                            voiceLive || voiceBusy
                                ? 'bg-fuchsia-600/30 border-fuchsia-400/60 text-fuchsia-200'
                                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-fuchsia-500/40'
                        }`}
                    >
                        {voiceBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : voiceLive ? (
                            <MicOff className="w-4 h-4" />
                        ) : (
                            <Mic className="w-4 h-4" />
                        )}
                    </button>

                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        rows={compact ? 1 : 2}
                        placeholder={voiceLive ? 'Speaking… or type instead' : compact ? 'Ask Tuu Beetuu…' : 'Ask Tuu Beetuu about the shop... (Enter to send, Shift+Enter for a new line)'}
                        className={`flex-1 bg-black/50 border border-white/10 rounded-lg ${compact ? 'px-3 py-2.5' : 'px-4 py-3'} text-white font-urbanist text-sm placeholder:text-gray-500 focus:border-fuchsia-500/50 focus:outline-none resize-none transition-colors`}
                    />
                    <button
                        onClick={submit}
                        disabled={busy || uploading || (!input.trim() && attached.length === 0)}
                        aria-label="Send"
                        className={`flex items-center gap-2 ${compact ? 'px-3 py-2.5' : 'px-5 py-3'} bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-urbanist font-medium text-sm text-white transition-all`}
                    >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {!compact && 'Send'}
                    </button>
                </div>
                {!compact && (
                    <p className="mt-2 text-[11px] font-urbanist text-gray-600">
                        Answers come from your live store data. Conversations are stored for audit.
                        Voice is billed by OpenAI per minute of conversation.
                    </p>
                )}
            </div>
        </div>
    );
};

export default AssistantPanel;

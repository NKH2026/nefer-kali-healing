/**
 * Shared chat state for the admin assistant.
 *
 * The state lives in a context provider mounted at the admin layout, so a single
 * conversation follows the admin from page to page: open it on Products, ask
 * something, navigate to Orders, and the thread is still there.
 *
 * The hook owns all the network logic. The panel component owns only rendering,
 * which is what lets the identical conversation be presented as either a full
 * page or a floating widget.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Mood } from '../../components/admin/TuuBeetuu';

export interface ToolTrace {
    name: string;
    ok: boolean;
    ms: number;
    error: string | null;
}

export interface PreviewField {
    field: string;
    label: string;
    before: unknown;
    after: unknown;
}

export interface Proposal {
    id: string;
    tool_name: string;
    summary: string;
    preview: PreviewField[];
    risk: string;
    reversible: boolean;
    expires_at: string;
    status: string;
}

export interface ChatTurn {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    tools?: ToolTrace[];
    warning?: string | null;
    error?: string | null;
    proposal?: Proposal | null;
    /** Set once the admin has acted on the card, so it stops being interactive. */
    proposalState?: 'pending' | 'applied' | 'undone' | 'discarded' | 'failed' | 'published';
    proposalNote?: string;
    /**
     * For source edits: where the preview lives and whether it has been merged.
     * Present after Apply, and used to offer the publish step.
     */
    sourcePreview?: {
        previewUrl: string | null;
        prUrl: string | null;
        branch: string;
        note: string;
    };
}

export const SUGGESTIONS = [
    'How is the shop doing right now?',
    'What reviews are waiting for moderation?',
    'Show me any products that are low on stock',
    'What events are coming up?',
    'Are there any orders still pending?',
];

/** Tuu Beetuu's voice while working. Rotates so long waits feel alive. */
export const THINKING_LINES = [
    'Tuning the mycelial network',
    'Reading the galactic spores',
    'Consulting the cosmic cap',
    'Threading the hyphae',
];

/** Tool names are snake_case identifiers from the registry; make them readable. */
export const prettyTool = (name: string) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const riskStyles: Record<string, string> = {
    low: 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300',
    medium: 'bg-amber-900/20 border-amber-500/30 text-amber-300',
    high: 'bg-red-900/20 border-red-500/30 text-red-300',
};

/** Renders a before/after value so booleans and empty strings read clearly. */
export const renderValue = (v: unknown): string => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'string' && v.trim() === '') return '(empty)';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
};

/** Pulls the Edge Function's own diagnostic out of a FunctionsHttpError. */
async function describeFunctionError(error: unknown): Promise<string> {
    let detail = (error as { message?: string })?.message || 'Request failed.';
    try {
        const raw = await (error as any)?.context?.json?.();
        if (raw) {
            detail =
                [raw.detail, raw.hint, raw.fix].filter(Boolean).join('\n\n') ||
                raw.error ||
                detail;
            if (raw.your_user_id) {
                detail += `\n\nSigned in as: ${raw.your_email ?? '?'} (${raw.your_user_id})`;
            }
        }
    } catch {
        // context was not JSON; keep the original message
    }
    return detail;
}

export interface AssistantController {
    turns: ChatTurn[];
    busy: boolean;
    mood: Mood;
    thinkingLine: number;
    /** True while a proposal is awaiting the admin's decision. */
    hasPendingProposal: boolean;
    send: (text: string) => Promise<void>;
    /**
     * Same backend call as `send`, but returns the result so the voice layer can
     * speak it and announce a proposal. Used by GPT-Live delegation.
     */
    sendForVoice: (text: string) => Promise<VoiceReply>;
    actOnProposal: (turnId: string, proposal: Proposal, action: 'apply' | 'undo') => Promise<void>;
    /** Publish an already-previewed source edit. Separate from Apply on purpose. */
    publishPageEdit: (turnId: string, proposal: Proposal) => Promise<void>;
    discardProposal: (turnId: string) => void;
    /** True before the first message of a session. */
    isEmpty: boolean;
}

export interface VoiceReply {
    /** What to say aloud. Already worded for speech. */
    spoken: string;
    answer: string;
    /** Present when this request produced a change awaiting approval. */
    proposal: { id: string; summary: string } | null;
    error: string | null;
}

function useAssistantController(): AssistantController {
    const [turns, setTurns] = useState<ChatTurn[]>([]);
    const [busy, setBusy] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [mood, setMood] = useState<Mood>('idle');
    const [thinkingLine, setThinkingLine] = useState(0);

    // Rotate Tuu Beetuu's thinking line while it works.
    useEffect(() => {
        if (!busy) return;
        const id = setInterval(() => setThinkingLine((i) => (i + 1) % THINKING_LINES.length), 2600);
        return () => clearInterval(id);
    }, [busy]);

    const hasPendingProposal = useMemo(
        () => turns.some((t) => t.proposal && t.proposalState === 'pending'),
        [turns],
    );

    const resolvedMood: Mood = busy ? 'thinking' : hasPendingProposal ? 'proposing' : mood;

    /**
     * The shared chat path. Both the typed composer and voice delegation go
     * through here, so a spoken request and a typed one produce identical tool
     * calls, proposals and audit records.
     */
    const runChat = useCallback(
        async (message: string): Promise<VoiceReply> => {
            setBusy(true);
            setTurns((prev) => [
                ...prev,
                { id: `u-${Date.now()}`, role: 'user', content: message },
            ]);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error('Your admin session expired. Sign in again.');

                const { data, error } = await supabase.functions.invoke('admin-agent', {
                    body: { message, session_id: sessionId },
                });

                if (error) throw new Error(await describeFunctionError(error));
                if (data?.error) throw new Error(data.detail || data.error);

                if (data?.session_id) setSessionId(data.session_id);

                const answer: string = data?.answer ?? 'No answer produced.';
                const proposal = data?.proposal ?? null;

                setTurns((prev) => [
                    ...prev,
                    {
                        id: `a-${Date.now()}`,
                        role: 'assistant',
                        content: answer,
                        tools: data?.tools_used ?? [],
                        warning: data?.warning ?? null,
                        proposal,
                        proposalState: proposal ? 'pending' : undefined,
                    },
                ]);

                setMood(proposal ? 'happy' : 'idle');

                return {
                    spoken: proposal
                        ? `I have prepared a change for your approval: ${data.proposal.summary}. ` +
                          `Nothing has been changed yet. Please confirm it on screen.`
                        : answer,
                    answer,
                    proposal: proposal
                        ? { id: String(proposal.id), summary: String(proposal.summary) }
                        : null,
                    error: null,
                };
            } catch (err: any) {
                const message2 = err?.message || 'Something went wrong talking to the assistant.';
                setMood('alarmed');
                setTimeout(() => setMood('idle'), 2600);
                setTurns((prev) => [
                    ...prev,
                    {
                        id: `e-${Date.now()}`,
                        role: 'assistant',
                        content: '',
                        error: message2,
                    },
                ]);
                return { spoken: '', answer: '', proposal: null, error: message2 };
            } finally {
                setBusy(false);
            }
        },
        [sessionId],
    );

    const send = useCallback(
        async (text: string) => {
            const message = text.trim();
            if (!message) return;
            await runChat(message);
        },
        [runChat],
    );

    const sendForVoice = useCallback(
        async (text: string): Promise<VoiceReply> => {
            const message = text.trim();
            if (!message) {
                return { spoken: '', answer: '', proposal: null, error: 'Empty request.' };
            }
            return runChat(message);
        },
        [runChat],
    );

    /**
     * Approve or reverse a proposal. This is the only path that writes.
     * The model has no tool that reaches this endpoint's apply action.
     */
    const actOnProposal = useCallback(
        async (turnId: string, proposal: Proposal, action: 'apply' | 'undo') => {
            setTurns((prev) =>
                prev.map((t) =>
                    t.id === turnId
                        ? { ...t, proposalNote: action === 'apply' ? 'Applying…' : 'Undoing…' }
                        : t,
                ),
            );

            try {
                const { data, error } = await supabase.functions.invoke('admin-agent', {
                    body: { action, action_id: proposal.id },
                });

                if (error) throw new Error(await describeFunctionError(error));
                if (data?.error) throw new Error(data.detail || data.error);

                const applied = action === 'apply';
                setMood(applied ? 'happy' : 'idle');
                setTimeout(() => setMood('idle'), 2200);

                // A source edit "applies" to a preview, not to the live site.
                // Surface the branch and preview link so it can be reviewed and
                // then published with a second, deliberate click.
                const isSource =
                    applied && data?.result?.stage === 'preview_ready' && data?.result?.branch;

                setTurns((prev) =>
                    prev.map((t) =>
                        t.id === turnId
                            ? {
                                ...t,
                                proposalState: applied ? 'applied' : 'undone',
                                sourcePreview: isSource
                                    ? {
                                        previewUrl: data.result.preview_url ?? null,
                                        prUrl: data.result.pr_url ?? null,
                                        branch: String(data.result.branch),
                                        note: String(data.result.preview_note ?? ''),
                                    }
                                    : t.sourcePreview,
                                proposalNote: applied
                                    ? isSource
                                        ? 'Preview built. Nothing is live until you publish it.'
                                        : `Applied. ${data?.reversible ? 'You can undo this.' : 'This cannot be undone.'}`
                                    : 'Undone — the previous values were restored.',
                            }
                            : t,
                    ),
                );
            } catch (err: any) {
                setMood('alarmed');
                setTimeout(() => setMood('idle'), 2600);
                setTurns((prev) =>
                    prev.map((t) =>
                        t.id === turnId
                            ? { ...t, proposalState: 'failed', proposalNote: err?.message || 'That did not work.' }
                            : t,
                    ),
                );
            }
        },
        [],
    );

    /**
     * Publishes a previewed source edit. This is the only path that makes a
     * source change reach customers, so it is a separate, explicit click rather
     * than something folded into Apply.
     */
    const publishPageEdit = useCallback(
        async (turnId: string, proposal: Proposal) => {
            setTurns((prev) =>
                prev.map((t) => (t.id === turnId ? { ...t, proposalNote: 'Publishing…' } : t)),
            );
            try {
                const { data, error } = await supabase.functions.invoke('admin-agent', {
                    body: { action: 'merge', action_id: proposal.id },
                });
                if (error) throw new Error(await describeFunctionError(error));
                if (data?.error) throw new Error(data.detail || data.error);

                setMood('happy');
                setTimeout(() => setMood('idle'), 2200);
                setTurns((prev) =>
                    prev.map((t) =>
                        t.id === turnId
                            ? {
                                ...t,
                                proposalState: 'published',
                                proposalNote:
                                    data?.result?.note ??
                                    'Published. Vercel is deploying to production now.',
                            }
                            : t,
                    ),
                );
            } catch (err: any) {
                setMood('alarmed');
                setTimeout(() => setMood('idle'), 2600);
                setTurns((prev) =>
                    prev.map((t) =>
                        t.id === turnId
                            ? { ...t, proposalState: 'failed', proposalNote: err?.message || 'Publish failed.' }
                            : t,
                    ),
                );
            }
        },
        [],
    );

    const discardProposal = useCallback((turnId: string) => {        // Purely local: a proposal that is never applied simply expires. Not
        // calling the server keeps "Discard" from being able to do anything.
        setTurns((prev) =>
            prev.map((t) =>
                t.id === turnId
                    ? { ...t, proposalState: 'discarded', proposalNote: 'Discarded — nothing was changed.' }
                    : t,
            ),
        );
    }, []);

    return {
        turns,
        busy,
        mood: resolvedMood,
        thinkingLine,
        hasPendingProposal,
        send,
        sendForVoice,
        actOnProposal,
        publishPageEdit,
        discardProposal,
        isEmpty: turns.length === 0,
    };
}

// ---------------------------------------------------------------------------
// Provider

interface AssistantContextValue {
    controller: AssistantController;
    open: boolean;
    setOpen: (v: boolean) => void;
    toggle: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const controller = useAssistantController();
    const [open, setOpen] = useState(false);

    const value = useMemo<AssistantContextValue>(
        () => ({
            controller,
            open,
            setOpen,
            toggle: () => setOpen((v) => !v),
        }),
        [controller, open],
    );

    return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
};

export function useAssistant(): AssistantContextValue {
    const ctx = useContext(AssistantContext);
    if (!ctx) {
        throw new Error('useAssistant must be used inside <AssistantProvider>.');
    }
    return ctx;
}

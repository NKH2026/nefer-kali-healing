/**
 * Marketing drafts and publishing (Tier 3).
 *
 * The assistant can draft. Only the owner can send, and this page is where that
 * happens. Two deliberate frictions exist because a send cannot be undone:
 *
 *   1. The full text is shown before the send control appears at all. There is
 *      no "send" button sitting next to a draft the owner has not read.
 *   2. The confirmation requires typing the word SEND, not clicking a button.
 *      A mis-click on an irreversible action is exactly the failure this
 *      prevents.
 *
 * Nothing here is reachable by the agent: the model has no tool that calls the
 * `publish` action.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Send, Loader2, AlertTriangle, Check, Trash2, FileText, Eye,
    ChevronDown, ChevronUp, ShieldAlert,
} from 'lucide-react';

interface Draft {
    id: string;
    channel: string;
    subject: string | null;
    body: string;
    notes: string | null;
    status: 'draft' | 'approved' | 'sending' | 'sent' | 'failed' | 'discarded';
    created_at: string;
    published_at: string | null;
    publish_error: string | null;
    publisher: string | null;
    publish_ref: string | null;
}

const CHANNEL_LABEL: Record<string, string> = {
    newsletter: 'Newsletter',
    instagram: 'Instagram',
    facebook: 'Facebook',
    blog_social: 'Social (blog promo)',
    partner_outreach: 'Partner outreach',
    press: 'Press',
    other: 'Other',
};

/**
 * Channels that cannot be sent automatically. Shown plainly rather than being
 * hidden behind a button that then fails.
 */
const MANUAL_ONLY: Record<string, string> = {
    partner_outreach: 'Personal emails — copy this and send it yourself.',
    press: 'Press notes go to humans — copy this and send it yourself.',
};

const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-white/5 border-white/15 text-gray-300',
    approved: 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300',
    sending: 'bg-amber-900/20 border-amber-500/30 text-amber-300',
    sent: 'bg-purple-900/25 border-purple-500/30 text-purple-200',
    failed: 'bg-red-900/20 border-red-500/30 text-red-300',
    discarded: 'bg-white/5 border-white/10 text-gray-500',
};

const AdminDrafts: React.FC = () => {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    // Send confirmation state, keyed to one draft at a time.
    const [confirming, setConfirming] = useState<string | null>(null);
    const [confirmText, setConfirmText] = useState('');
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    const load = async () => {
        try {
            const { data, error: err } = await supabase
                .from('marketing_drafts')
                .select('*')
                .order('created_at', { ascending: false });
            if (err) throw err;
            setDrafts((data ?? []) as Draft[]);
        } catch (e: any) {
            setError(e?.message ?? 'Could not load drafts.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    const setStatus = async (id: string, status: Draft['status']) => {
        setError(null);
        const { error: err } = await supabase.from('marketing_drafts').update({ status }).eq('id', id);
        if (err) { setError(err.message); return; }
        await load();
    };

    const send = async (draft: Draft) => {
        setSending(true);
        setError(null);
        setNotice(null);
        try {
            const { data, error: fnError } = await supabase.functions.invoke('admin-agent', {
                body: { action: 'publish', draft_id: draft.id },
            });

            if (fnError) {
                let detail = fnError.message || 'Send failed.';
                try {
                    const raw = await (fnError as any)?.context?.json?.();
                    if (raw) detail = [raw.detail, raw.hint].filter(Boolean).join(' ') || raw.error || detail;
                } catch { /* not JSON */ }
                throw new Error(detail);
            }
            if (data?.error) throw new Error(data.detail || data.error);

            setNotice(
                data?.note ??
                    'Reported as sent. This cannot be undone — check the destination to confirm it arrived.',
            );
            setConfirming(null);
            setConfirmText('');
            await load();
        } catch (e: any) {
            setError(e?.message ?? 'Send failed.');
            await load();
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <div className="text-white font-urbanist">Loading drafts…</div>;
    }

    const pending = drafts.filter((d) => d.status === 'approved' || d.status === 'failed');
    const rest = drafts.filter((d) => !(d.status === 'approved' || d.status === 'failed'));

    const renderDraft = (d: Draft) => {
        const isOpen = expanded === d.id;
        const manualOnly = MANUAL_ONLY[d.channel];
        const canSend = (d.status === 'approved' || d.status === 'failed') && !manualOnly;
        const isConfirming = confirming === d.id;

        return (
            <div
                key={d.id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-colors hover:border-purple-500/30"
            >
                <div className="flex items-start gap-3 px-4 py-3">
                    <FileText size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-urbanist text-white">
                                {d.subject || '(no subject)'}
                            </span>
                            <span className={`text-[10px] font-urbanist uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLE[d.status] ?? STATUS_STYLE.draft}`}>
                                {d.status}
                            </span>
                            <span className="text-[10px] font-urbanist text-gray-500">
                                {CHANNEL_LABEL[d.channel] ?? d.channel}
                            </span>
                        </div>
                        <p className="text-xs font-urbanist text-gray-500 mt-1">
                            {new Date(d.created_at).toLocaleString()}
                            {d.published_at ? ` · sent ${new Date(d.published_at).toLocaleString()}` : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => setExpanded(isOpen ? null : d.id)}
                        aria-label={isOpen ? 'Collapse' : 'Expand'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                </div>

                {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                        {/* The full text, always before any send control. */}
                        <div className="bg-black/50 rounded-lg px-3 py-3 max-h-80 overflow-y-auto tb-scroll-dark">
                            <pre className="whitespace-pre-wrap break-words text-sm font-urbanist text-gray-200">
                                {d.body}
                            </pre>
                        </div>

                        {d.notes && (
                            <p className="text-[11px] font-urbanist text-gray-500">Notes: {d.notes}</p>
                        )}

                        {d.publish_error && (
                            <div className="flex items-start gap-2 text-xs font-urbanist text-red-300 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                                <span className="min-w-0 break-words">
                                    Last attempt failed: {d.publish_error}
                                </span>
                            </div>
                        )}

                        {d.status === 'sent' && (
                            <p className="text-[11px] font-urbanist text-gray-500">
                                Sent via {d.publisher ?? 'unknown'}
                                {d.publish_ref ? ` · reference ${d.publish_ref}` : ''}
                            </p>
                        )}

                        {manualOnly && d.status !== 'sent' && (
                            <div className="flex items-start gap-2 text-xs font-urbanist text-amber-300/90 bg-amber-900/15 border border-amber-500/25 rounded-lg px-3 py-2">
                                <ShieldAlert size={13} className="flex-shrink-0 mt-0.5" />
                                <span>{manualOnly}</span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {d.status === 'draft' && (
                                <button
                                    onClick={() => setStatus(d.id, 'approved')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-urbanist font-semibold transition-colors"
                                >
                                    <Check size={12} /> Approve for sending
                                </button>
                            )}

                            {canSend && !isConfirming && (
                                <button
                                    onClick={() => { setConfirming(d.id); setConfirmText(''); }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-urbanist font-semibold transition-colors"
                                >
                                    <Send size={12} /> Send now…
                                </button>
                            )}

                            {d.status !== 'sent' && d.status !== 'discarded' && (
                                <button
                                    onClick={() => setStatus(d.id, 'discarded')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-gray-400 hover:text-white text-[11px] font-urbanist transition-colors"
                                >
                                    <Trash2 size={11} /> Discard
                                </button>
                            )}
                        </div>

                        {/* The irreversible-action confirmation */}
                        {isConfirming && (
                            <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-3 space-y-2">
                                <div className="flex items-start gap-2 text-xs font-urbanist text-red-200">
                                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                    <span>
                                        This will send <strong>the text shown above</strong> and{' '}
                                        <strong>cannot be undone or recalled</strong>. Read it once more,
                                        then type <strong>SEND</strong> to confirm.
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="Type SEND to confirm"
                                        autoComplete="off"
                                        className="flex-1 bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-sm font-urbanist text-white placeholder:text-gray-600 focus:border-red-500/50 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => void send(d)}
                                        disabled={confirmText.trim().toUpperCase() !== 'SEND' || sending}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-urbanist font-semibold transition-colors"
                                    >
                                        {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                        Send
                                    </button>
                                    <button
                                        onClick={() => { setConfirming(null); setConfirmText(''); }}
                                        className="px-3 py-2 rounded-lg border border-white/15 text-gray-400 hover:text-white text-xs font-urbanist transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-2xl md:text-3xl font-cinzel text-white mb-2">Drafts &amp; Publishing</h1>
                <p className="text-gray-400 font-urbanist text-sm">
                    Copy Tuu Beetuu has written, and anything you have approved for sending.
                </p>
                <div className="mt-3 flex items-start gap-2 text-xs font-urbanist text-amber-300/90 bg-amber-900/15 border border-amber-500/25 rounded-lg px-3 py-2">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                        Tuu Beetuu writes drafts but <strong>cannot send anything</strong>. Sending is
                        irreversible, so it always stays your action — and requires typing SEND to confirm.
                    </span>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2 text-sm font-urbanist text-red-300 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">{error}</span>
                </div>
            )}

            {notice && (
                <div className="flex items-start gap-2 text-sm font-urbanist text-emerald-300 bg-emerald-900/20 border border-emerald-500/30 rounded-lg px-4 py-3">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">{notice}</span>
                </div>
            )}

            {drafts.length === 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-8 text-center">
                    <Eye className="w-6 h-6 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-urbanist text-sm">No drafts yet.</p>
                    <p className="text-gray-600 font-urbanist text-xs mt-1">
                        Ask Tuu Beetuu to write a newsletter, a social post or a partner email.
                    </p>
                </div>
            )}

            {pending.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-cinzel text-emerald-300">Ready to send</h2>
                    {pending.map(renderDraft)}
                </div>
            )}

            {rest.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-cinzel text-gray-300">
                        {pending.length > 0 ? 'Everything else' : 'All drafts'}
                    </h2>
                    {rest.map(renderDraft)}
                </div>
            )}
        </div>
    );
};

export default AdminDrafts;

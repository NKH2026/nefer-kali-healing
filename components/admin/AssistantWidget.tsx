/**
 * The floating Tuu Beetuu launcher, available on every admin page.
 *
 * Renders a fixed-position animated toadstool button plus the collapsible
 * widget. Mounted once by AdminLayout, so the conversation survives navigation
 * between admin pages.
 *
 * The button is an SVG mark rather than the WebGL character on purpose: a
 * persistent WebGL context on every admin page would cost battery and could
 * collide with the scene on /admin/assistant. The live 3D character appears
 * when the widget is open on a page that is not already showing it.
 */

import React, { useEffect, lazy, Suspense } from 'react';
import { X, Sparkles, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAssistant } from './useAssistant';
import AssistantPanel, { ToadstoolGlyph } from './AssistantPanel';

// Loaded only when the widget is actually opened.
const TuuBeetuu = lazy(() => import('./TuuBeetuu'));

const AssistantWidget: React.FC = () => {
    const { controller, open, setOpen, toggle } = useAssistant();
    const { mood, hasPendingProposal } = controller;

    // Escape closes the panel -- expected of any overlay.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, setOpen]);

    return (
        <>
            {/* ---------------------------------------------------------- launcher */}
            <button
                onClick={toggle}
                aria-label={open ? 'Close Tuu Beetuu' : 'Ask Tuu Beetuu'}
                aria-expanded={open}
                className={`fixed z-[70] bottom-5 right-5 lg:bottom-7 lg:right-7 group
                    w-16 h-16 rounded-full grid place-items-center
                    transition-transform duration-300 hover:scale-110 active:scale-95
                    ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                style={{
                    background:
                        'radial-gradient(circle at 50% 40%, rgba(168,85,247,0.35), rgba(10,10,10,0.9) 72%)',
                    border: '1px solid rgba(200,140,255,0.35)',
                    boxShadow: '0 0 28px rgba(168,85,247,0.35), inset 0 0 18px rgba(255,119,225,0.15)',
                }}
            >
                {/* slow-rotating conic aura */}
                <span
                    className="absolute inset-[-6px] rounded-full opacity-70 blur-md animate-spin"
                    style={{
                        background:
                            'conic-gradient(from 0deg, #a855f7, #2fbfa8, #ff77e1, #ffcf6b, #a855f7)',
                        animationDuration: '9s',
                        zIndex: -1,
                    }}
                    aria-hidden="true"
                />
                <span className="relative block group-hover:animate-bounce" style={{ animationDuration: '2s' }}>
                    <ToadstoolGlyph size={38} />
                </span>

                {/* A pending change demands attention. */}
                {hasPendingProposal && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-fuchsia-500 border-2 border-[#0a0a0a] animate-ping" />
                )}
            </button>

            {/* ------------------------------------------------------------ widget */}
            <div
                className={`fixed z-[69] bottom-0 right-0 lg:bottom-7 lg:right-7
                    w-full sm:w-[27rem] h-[78vh] sm:h-[34rem] max-h-[calc(100vh-2rem)]
                    transition-all duration-300 ease-out origin-bottom-right
                    ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3 pointer-events-none'}`}
                role="dialog"
                aria-label="Tuu Beetuu assistant"
                aria-hidden={!open}
            >
                {/* gradient border shell */}
                <div
                    className="h-full p-[1.5px] rounded-t-2xl sm:rounded-2xl overflow-hidden"
                    style={{
                        background:
                            'linear-gradient(140deg, rgba(168,85,247,0.85), rgba(47,191,168,0.6), rgba(255,119,225,0.8), rgba(255,207,107,0.5))',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(168,85,247,0.25)',
                    }}
                >
                    {/* Opaque background is applied as an inline style on purpose.
                        `bg-[#0b0812]/97` (arbitrary colour + opacity modifier) is
                        dropped by the Tailwind build, which left this panel with no
                        background at all and let the gradient border bleed through. */}
                    <div
                        className="h-full rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl tb-scroll-dark"
                        style={{ backgroundColor: 'rgba(11, 8, 18, 0.985)' }}
                    >
                        {/* widget header */}
                        <div className="relative flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-950/60 via-fuchsia-950/30 to-teal-950/40">
                            <div className="relative flex-shrink-0 w-10 h-10 grid place-items-center">
                                <span
                                    className="absolute inset-0 rounded-full blur-md opacity-70"
                                    style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.8), transparent 70%)' }}
                                    aria-hidden="true"
                                />
                                <Suspense
                                    fallback={
                                        <span className="relative">
                                            <ToadstoolGlyph size={30} />
                                        </span>
                                    }
                                >
                                    <TuuBeetuu mood={mood} size={40} className="relative -mt-1" />
                                </Suspense>
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="font-cinzel text-sm bg-clip-text text-transparent bg-gradient-to-r from-purple-100 via-fuchsia-200 to-teal-200 leading-tight">
                                    Tuu Beetuu
                                </p>
                                <p className="text-[11px] font-urbanist text-gray-400 truncate">
                                    {hasPendingProposal
                                        ? 'A change awaits your approval'
                                        : 'Keeper of the archive'}
                                </p>
                            </div>

                            <Link
                                to="/admin/assistant"
                                onClick={() => setOpen(false)}
                                title="Open full page"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <Maximize2 size={15} />
                            </Link>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* the shared conversation */}
                        <div className="flex-1 min-h-0 px-4 pt-3 pb-4">
                            <AssistantPanel mode="widget" />
                        </div>

                        <div className="flex items-center justify-center gap-1.5 pb-2 text-[10px] font-urbanist text-gray-600">
                            <Sparkles size={9} />
                            Nothing changes without your approval
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AssistantWidget;

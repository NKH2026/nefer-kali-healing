import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
// @ts-ignore — untyped JS modules
import { bootJyotishaLoka } from '../jyotisha-loka/boot.js';
// @ts-ignore
import { TOUR_STOPS } from '../jyotisha-loka/engine/shots.js';

/**
 * /loka-preview — the full-page tour, with the world behind the document.
 *
 * ── How the pieces divide ────────────────────────────────────────────────────
 *
 * The world knows how to FLY. This page knows how to SCROLL. Neither knows about
 * the other's job, and the only word they share is a stop id.
 *
 *   scroll ──> IntersectionObserver ──> active id ──> world.goTo(id)
 *   rail click ──> scrollIntoView ─────────┘
 *   1-8 key   ──> scrollIntoView ─────────┘
 *
 * Scroll is the single source of truth, which is the whole point: a nav click
 * moves the page, the page notifies the world, the world flies. If a click flew
 * the camera directly, the scrollbar would be lying about where you are — and
 * a scrollbar that lies is worse than a slower transition.
 *
 * The camera move is a fixed-duration tween per stop, not a scrub of scroll
 * progress. That keeps the motion identical whether you flicked the wheel or
 * pressed a key, and it removes the velocity coupling that makes scroll-driven
 * 3D nauseating. The cost: the camera does not track the scrollbar continuously
 * within a section. With full-viewport stops, nothing is lost.
 */

type Stop = {
  id: string;
  label: string;
  path: string;
  kicker: string;
  title: string;
  blurb: string;
};

const STOPS = TOUR_STOPS as Stop[];

/** Respect the OS setting: a cross-worlding camera move is a vestibular trigger. */
const reducedMotion = () =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const LokaPreview: React.FC = () => {
  const mount = useRef<HTMLDivElement>(null);
  const world = useRef<{ goTo: (id: string, opts?: { immediate?: boolean }) => void } | null>(null);
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  /**
   * On its own preview URL this page is an internal tool and must never be
   * indexed. Embedded on the real home page it IS the home page, so it takes
   * the ordinary title and no robots directive — otherwise flipping the flag
   * on would quietly de-index the site.
   */
  const isPreview = pathname !== '/';

  /**
   * `?stop=wellness` opens the tour already at a district. Useful for sending
   * someone straight to one scene, and for looking at a single shot without
   * scrolling the whole journey.
   */
  const requested = params.get('stop');
  const opening = requested && STOPS.some((s) => s.id === requested) ? requested : STOPS[0]?.id ?? 'home';

  const [active, setActive] = useState(opening);
  const [ready, setReady] = useState(false);
  const firstShot = useRef(true);

  // ---- the world
  useEffect(() => {
    if (!mount.current) return undefined;
    let dispose: (() => void) | null = null;
    try {
      dispose = bootJyotishaLoka({
        mount: mount.current,
        mode: 'tour',
        // This page draws its own navigation; the world draws no chrome.
        chrome: false,
        onReady: (handle: any) => {
          world.current = handle;
          setReady(true);
        },
      });
    } catch (err) {
      console.error('[Loka preview] could not open:', err);
    }
    return () => {
      world.current = null;
      dispose?.();
    };
  }, []);

  // ---- scroll -> active stop
  useEffect(() => {
    const sections = STOPS
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return undefined;

    /**
     * Every section's visibility ratio is tracked, and the most visible wins.
     * Reading only `entry.isIntersecting` is not enough: entries arrive for
     * changed sections only, so the outgoing one can win a tie by arriving last.
     */
    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target.id, entry.intersectionRatio);
        let bestId = '';
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
        }
        if (bestId) setActive(bestId);
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1], rootMargin: '-12% 0px -12% 0px' },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // ---- land on the requested stop, if one was asked for.
  //
  // Deliberately INSTANT, and deliberately by offset rather than scrollIntoView:
  // someone who asked for one district does not want to watch the page scroll to
  // it, and a smooth scroll that is still travelling when the observer runs just
  // gets overruled back to the first section.
  useEffect(() => {
    if (opening === STOPS[0]?.id) return;
    const el = document.getElementById(opening);
    if (!el) return;
    window.scrollTo(0, el.offsetTop);
    setActive(opening);
  }, [opening]);

  // ---- active stop -> camera
  useEffect(() => {
    if (!ready) return;
    // The first shot is always cut to, never flown to: arriving at a deep link
    // should not begin with a two-second flight from somewhere else.
    const immediate = firstShot.current || reducedMotion();
    firstShot.current = false;
    world.current?.goTo(active, { immediate });
  }, [active, ready]);

  /** Move the PAGE. The camera follows the page; it never leads it. */
  const jump = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: reducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  // ---- land on the requested stop, if one was asked for.
  //
  // Deferred a frame: the router scrolls to top on mount, and whatever runs
  // last wins. This must win.
  useEffect(() => {
    if (opening === STOPS[0]?.id) return undefined;
    const frame = requestAnimationFrame(() => jump(opening));
    return () => cancelAnimationFrame(frame);
  }, [opening, jump]);

  // ---- number keys, routed through the same jump as a click
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= STOPS.length) {
        e.preventDefault();
        jump(STOPS[n - 1].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  return (
    <div className="relative">
      <Helmet>
        <title>{isPreview
          ? 'Loka tour preview — Nefer Kali Healing'
          : 'Nefer Kali Healing | Holistic Wellness & Spiritual Education'}</title>
        {isPreview
          ? <meta name="robots" content="noindex, nofollow" />
          : <meta name="description" content="Holistic healing through Kemetic, Orisha, and Vedic wisdom. Natural herbal products, spiritual education, and community wellness for all." />}
      </Helmet>

      {/*
        The world mounts here. Its canvas is position:fixed and z-index 1, so it
        sits behind everything below without needing its own layout box; this
        element stays empty and takes no space.
      */}
      <div ref={mount} aria-hidden="true" />

      {/* Prototype label, so nobody mistakes this for a shipped page. */}
      <div className="fixed left-4 bottom-4 z-30 hidden md:block">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
          Preview · scroll or press 1–{STOPS.length}
        </p>
      </div>

      {/* The stop rail: the "navbar as objects in the world", for now in HTML. */}
      <nav
        aria-label="Tour stops"
        className="fixed right-3 md:right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-2 sm:flex"
      >
        {STOPS.map((stop, i) => {
          const isActive = active === stop.id;
          return (
            <button
              key={stop.id}
              type="button"
              onClick={() => jump(stop.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`group flex items-center gap-3 rounded-full pl-3 pr-2 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-all duration-300 ${
                isActive
                  ? 'text-[#D4AF37]'
                  : 'text-white/45 hover:text-[#D4AF37]'
              }`}
            >
              <span
                className={`transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {stop.label}
              </span>
              <span
                className={`grid h-6 w-6 place-items-center rounded-full border text-[9px] tabular-nums transition-colors duration-300 ${
                  isActive
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                    : 'border-white/25 text-white/40 group-hover:border-[#D4AF37]/60'
                }`}
              >
                {i + 1}
              </span>
            </button>
          );
        })}
      </nav>

      {/*
        The document. Real sections, real headings, real links — this is what a
        crawler reads, what a screen reader reads, and what the camera follows.
        The canvas behind them is decoration and must never be the only content.
      */}
      <div className="relative z-10">
        {STOPS.map((stop, i) => (
          <section
            key={stop.id}
            id={stop.id}
            aria-labelledby={`${stop.id}-title`}
            className={`relative flex min-h-screen items-center px-5 pb-24 pt-32 sm:px-8 ${
              i % 2 === 1 ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`w-full max-w-xl rounded-2xl border p-6 backdrop-blur-md sm:p-9 ${
                ready
                  ? 'border-[#D4AF37]/25 bg-[#07030f]/55'
                  : 'border-white/10 bg-[#07030f]/80'
              }`}
            >
              <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-[#c9b6ff]">
                {stop.kicker}
              </p>
              <h1
                id={`${stop.id}-title`}
                className={`font-display leading-tight text-[#f1d38a] ${
                  i === 0 ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-5xl'
                }`}
              >
                {stop.title}
              </h1>
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-white/70 sm:text-base">
                {stop.blurb}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to={stop.path}
                  className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/20"
                >
                  Visit {stop.label}
                </Link>
                <button
                  type="button"
                  onClick={() => jump(STOPS[Math.min(i + 1, STOPS.length - 1)].id)}
                  className="rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-white/50 transition-colors hover:text-[#D4AF37]"
                >
                  {i === STOPS.length - 1 ? 'Back to the sky' : 'Next stop'}
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default LokaPreview;

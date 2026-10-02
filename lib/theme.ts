/**
 * Theme tokens.
 *
 * The site's visual feel -- accent hues, glow, motion, canvas depth -- is stored
 * as data rather than baked into CSS, so the admin assistant can propose a
 * visual change and have it apply without a build or a deploy.
 *
 * Ten tokens, deliberately. This is the vocabulary the agent is allowed to move:
 * broad enough for "make it more psychedelic", narrow enough that it cannot make
 * the site unreadable or break a layout. There is a hard clamp on every value in
 * both the UI and the Edge Function.
 */

export interface ThemeTokens {
    /** Primary accent, HSL degrees. */
    hue1: number;
    /** Secondary accent, HSL degrees. */
    hue2: number;
    /** Tertiary accent, HSL degrees. */
    hue3: number;
    /** Overall vividness, 0-100. */
    saturation: number;
    /** Bloom around accents, 0-100. */
    glow: number;
    /** Scales ambient animation, 25-250 (%). */
    animationSpeed: number;
    /** Lightness of the near-black canvas, 0-100. */
    backgroundDepth: number;
    /** Continuous animated hue cycling, 0-360 degrees. */
    hueRotate: number;
    /** Accent/text contrast, 85-120 (%). */
    contrast: number;
    /** Subtle texture overlay, 0-100. */
    grain: number;
}

export const DEFAULT_TOKENS: ThemeTokens = {
    hue1: 265,
    hue2: 325,
    hue3: 172,
    saturation: 70,
    glow: 40,
    animationSpeed: 100,
    backgroundDepth: 10,
    hueRotate: 0,
    contrast: 100,
    grain: 12,
};

/** Human labels and safe ranges, shared by the UI and the agent's tool schema. */
export const TOKEN_SPEC: Record<
    keyof ThemeTokens,
    { label: string; min: number; max: number; unit?: string; hint: string }
> = {
    hue1: { label: 'Primary hue', min: 0, max: 360, unit: '°', hint: 'purple 265 · blue 220 · green 140 · gold 45' },
    hue2: { label: 'Secondary hue', min: 0, max: 360, unit: '°', hint: 'pink 325 · magenta 300 · teal 180' },
    hue3: { label: 'Tertiary hue', min: 0, max: 360, unit: '°', hint: 'teal 172 · cyan 190 · lime 90' },
    saturation: { label: 'Vividness', min: 0, max: 100, unit: '%', hint: '40 muted · 70 current · 95 neon' },
    glow: { label: 'Glow', min: 0, max: 100, unit: '%', hint: '0 flat · 40 current · 85 luminous' },
    animationSpeed: { label: 'Motion speed', min: 25, max: 250, unit: '%', hint: '60 calm · 100 current · 200 energetic' },
    backgroundDepth: { label: 'Canvas depth', min: 0, max: 100, unit: '%', hint: '0 pure black · 10 current · 30 lifted' },
    hueRotate: { label: 'Hue cycling', min: 0, max: 360, unit: '°', hint: '0 still · 40 drifting · 180 psychedelic' },
    contrast: { label: 'Contrast', min: 85, max: 120, unit: '%', hint: '90 soft · 100 current · 115 punchy' },
    grain: { label: 'Grain', min: 0, max: 100, unit: '%', hint: '0 clean · 12 current · 40 textured' },
};

export const TOKEN_KEYS = Object.keys(TOKEN_SPEC) as (keyof ThemeTokens)[];

/** Named whole-theme presets, for "give me this vibe" requests. */
export const VIBE_PRESETS: Record<string, { label: string; description: string; tokens: Partial<ThemeTokens> }> = {
    deep_temple: {
        label: 'Deep Temple',
        description: 'The current look, grounded and warm.',
        tokens: { ...DEFAULT_TOKENS },
    },
    neon_bloom: {
        label: 'Neon Bloom',
        description: 'Vivid, fast, heavily glowing. Loud and psychedelic.',
        tokens: {
            hue1: 285, hue2: 315, hue3: 160,
            saturation: 92, glow: 82, animationSpeed: 175,
            backgroundDepth: 6, hueRotate: 45, contrast: 108, grain: 18,
        },
    },
    calm_gold: {
        label: 'Calm Gold',
        description: 'Muted gold and cream. Quiet, slow, restful.',
        tokens: {
            hue1: 42, hue2: 28, hue3: 55,
            saturation: 46, glow: 26, animationSpeed: 65,
            backgroundDepth: 14, hueRotate: 0, contrast: 96, grain: 8,
        },
    },
    violet_drift: {
        label: 'Violet Drift',
        description: 'Slow colour rotation through violet and teal.',
        tokens: {
            hue1: 275, hue2: 200, hue3: 175,
            saturation: 78, glow: 60, animationSpeed: 90,
            backgroundDepth: 8, hueRotate: 120, contrast: 102, grain: 14,
        },
    },
    bone_ash: {
        label: 'Bone & Ash',
        description: 'Nearly monochrome, high contrast, no motion.',
        tokens: {
            hue1: 30, hue2: 30, hue3: 200,
            saturation: 12, glow: 10, animationSpeed: 50,
            backgroundDepth: 16, hueRotate: 0, contrast: 112, grain: 24,
        },
    },
};

/** Clamps any incoming value into the token's permitted range. */
export function clampTokens(input: Partial<Record<string, unknown>>): Partial<ThemeTokens> {
    const out: Partial<ThemeTokens> = {};
    for (const key of TOKEN_KEYS) {
        const raw = input[key];
        if (raw === undefined || raw === null) continue;
        const n = Number(raw);
        if (!Number.isFinite(n)) continue;
        const { min, max } = TOKEN_SPEC[key];
        out[key] = Math.min(max, Math.max(min, Math.round(n)));
    }
    return out;
}

/** Merges stored tokens over the defaults, ignoring anything out of range. */
export function normaliseTokens(stored: unknown): ThemeTokens {
    if (!stored || typeof stored !== 'object') return { ...DEFAULT_TOKENS };
    return { ...DEFAULT_TOKENS, ...clampTokens(stored as Record<string, unknown>) };
}

// ---------------------------------------------------------------------------
// CSS custom properties
// ---------------------------------------------------------------------------

const px = (v: number) => `${v}`;

/**
 * Produces the CSS variable map for a token set. Both the storefront and the
 * admin panel read the same variables, which is what makes one theme change
 * move the entire site at once.
 */
export function themeVars(t: ThemeTokens): Record<string, string> {
    const c1 = `hsl(${t.hue1} ${t.saturation}% 62%)`;
    const c1Dim = `hsl(${t.hue1} ${Math.round(t.saturation * 0.75)}% 46%)`;
    const c2 = `hsl(${t.hue2} ${t.saturation}% 64%)`;
    const c3 = `hsl(${t.hue3} ${t.saturation}% 58%)`;
    // Background lifts off pure black as depth increases.
    const bgL = Math.round((t.backgroundDepth / 100) * 12);
    const bg = `hsl(${t.hue1} 22% ${bgL}%)`;
    const bgSoft = `hsl(${t.hue1} 20% ${bgL + 4}%)`;

    return {
        '--tb-hue-1': px(t.hue1),
        '--tb-hue-2': px(t.hue2),
        '--tb-hue-3': px(t.hue3),
        '--tb-sat': `${t.saturation}%`,
        '--tb-accent': c1,
        '--tb-accent-dim': c1Dim,
        '--tb-accent-2': c2,
        '--tb-accent-3': c3,
        '--tb-bg': bg,
        '--tb-bg-soft': bgSoft,
        '--tb-glow': `${(t.glow / 100).toFixed(3)}`,
        '--tb-glow-px': `${Math.round(6 + (t.glow / 100) * 44)}px`,
        '--tb-speed': `${(100 / Math.max(t.animationSpeed, 1)).toFixed(3)}`,
        '--tb-contrast': `${t.contrast}%`,
        '--tb-grain': `${(t.grain / 100).toFixed(3)}`,
    };
}

/** Applies tokens to a DOM element as CSS variables. */
export function applyTheme(t: ThemeTokens, target?: HTMLElement | null): void {
    const el = target ?? document.documentElement;
    const vars = themeVars(t);
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
    // Hue cycling is a continuous rotation of the whole palette. It needs its own
    // attribute because the animation is opt-in: a 0deg rotation must leave the
    // site completely still rather than running a no-op animation.
    el.style.setProperty('--tb-hue-rotate', `${t.hueRotate}deg`);
    el.dataset.tbTheme = 'on';
    if (t.hueRotate > 0) {
        el.dataset.tbHueCycling = 'on';
    } else {
        delete el.dataset.tbHueCycling;
    }
}

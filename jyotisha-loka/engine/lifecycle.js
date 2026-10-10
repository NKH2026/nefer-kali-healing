/**
 * Lifecycle powers: the member grows through a fungus's life cycle as they
 * learn, and each stage gives them a new way to move through the realm.
 *
 *   spore          glide — hold jump while falling, and drift down slowly
 *   hypha          root-dash — a quick burst along the ground
 *   fruiting body  light pulse — a burst of light that reveals hidden spore
 *                  glyphs in the worlds
 *
 * Unlocked by modules finished (the server's count, shared/realm-pass.js) at the
 * realm's own milestones; administrators have every power. Pure: no three.js,
 * no DOM. tests/realm-lifecycle.test.mjs.
 */

export const STAGES = [
  {
    id: 'spore', name: 'Spore', modules: 1, power: 'glide', powerName: 'Glide',
    how: 'Hold jump while falling to drift down slowly.',
    touchHow: 'Hold JUMP while falling to drift down slowly.',
  },
  {
    id: 'hypha', name: 'Hypha', modules: 3, power: 'dash', powerName: 'Root-dash',
    how: 'Press Q for a burst along the ground.',
    touchHow: 'Tap DASH for a burst along the ground.',
  },
  {
    id: 'fruiting', name: 'Fruiting body', modules: 6, power: 'pulse', powerName: 'Light pulse',
    how: 'Press G to send out a pulse of light — it reveals hidden spore glyphs in the worlds.',
    touchHow: 'Tap PULSE to send out light — it reveals hidden spore glyphs in the worlds.',
  },
];

/** How the powers feel, in one place. */
export const LIFECYCLE = {
  /** Fastest fall while gliding, m/s. */
  glideFall: 2.4,
  /** Root-dash: speed, how long it lasts, and the wait before the next. */
  dashSpeed: 30,
  dashTime: 0.26,
  dashCooldown: 1.1,
  /** Light pulse: how far it reaches, how fast it spreads, the wait before the next. */
  pulseRadius: 32,
  pulseSpeed: 40,
  pulseCooldown: 3.5,
  /** Spore glyphs hidden in each world, and how close counts as collecting one. */
  glyphsPerWorld: 6,
  glyphReach: 1.8,
};

/**
 * Which powers this member has.
 * @param {number} finished  modules finished
 * @returns {{glide: boolean, dash: boolean, pulse: boolean}}
 */
export function powersFor(finished, { admin = false } = {}) {
  const n = admin ? Infinity : Number(finished) || 0;
  return Object.fromEntries(STAGES.map((s) => [s.power, n >= s.modules]));
}

/** The stage reached (null before the first), and the next one with how many modules to go. */
export function stageFor(finished, { admin = false } = {}) {
  const n = admin ? Infinity : Number(finished) || 0;
  const reached = STAGES.filter((s) => n >= s.modules);
  const next = STAGES.find((s) => n < s.modules) || null;
  return {
    stage: reached.at(-1) || null,
    next: next ? { ...next, remaining: next.modules - n } : null,
  };
}

/** The powers newly gained going from `before` to `after` modules finished. */
export function newlyUnlocked(before, after) {
  return STAGES.filter((s) => before < s.modules && after >= s.modules);
}

/**
 * Root-dash timing: may a dash start now? A dash runs for `dashTime`, then
 * cannot be repeated until `dashCooldown` has passed since it began.
 */
export function canDash(now, lastDashAt) {
  return lastDashAt == null || now - lastDashAt >= LIFECYCLE.dashCooldown - 1e-9;
}

/** The light pulse's radius `t` seconds after it was sent, or null once it has faded. */
export function pulseRadiusAt(t) {
  if (t < 0) return null;
  const r = t * LIFECYCLE.pulseSpeed;
  return r <= LIFECYCLE.pulseRadius ? r : null;
}

/**
 * Where a world's spore glyphs hide: spread round the world, kept clear of its
 * sites and portal, the same for every member. Deterministic per world id.
 * @returns {Array<{id: string, x: number, z: number}>}
 */
export function glyphSpots(recipe, count = LIFECYCLE.glyphsPerWorld) {
  let seed = 0;
  for (const ch of recipe.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const inner = (recipe.terrain?.wallHeight ?? 1) < 0 ? (recipe.terrain.wallStart ?? 0.85) * recipe.radius - 6 : recipe.radius - 14;
  const clear = (x, z) =>
    (recipe.sites || []).every((s) => Math.hypot(x - s.x, z - s.z) > 20) &&
    (!recipe.portal || Math.hypot(x - recipe.portal.x, z - recipe.portal.z) > 10) &&
    (!recipe.centerpiece || Math.hypot(x - recipe.centerpiece.x, z - recipe.centerpiece.z) > (recipe.centerpiece.radius ?? 8) + 8);
  const spots = [];
  for (let tries = 0; spots.length < count && tries < 2000; tries++) {
    const a = rand() * Math.PI * 2;
    const r = 18 + rand() * (inner - 18);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!clear(x, z) || spots.some((p) => Math.hypot(p.x - x, p.z - z) < 18)) continue;
    spots.push({ id: `${recipe.id}-glyph-${spots.length + 1}`, x, z });
  }
  return spots;
}

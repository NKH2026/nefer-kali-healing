/**
 * Procedural textures, drawn on a 2D canvas.
 *
 * The realm ships no image files — every surface in it is generated — and these
 * two cities need writing on them: hieroglyph bands on the Kemet walls, and
 * legible agent panels in the Mycelial Court. A canvas texture is the cheapest
 * honest way to get both, because it keeps the whole world self-contained and
 * lets the *content* drive the image (the panel really does say the specialist's
 * name and role, rather than being a decorative rectangle that means nothing).
 *
 * Every function here requires a DOM. None is called at module scope: they run
 * only inside a city builder, which only runs in the browser, so importing this
 * module in Node for a unit test is safe as long as nothing is invoked. The
 * callers keep that promise; `tests/realm-codex.test.mjs` covers the pure data
 * instead.
 *
 * Failure is soft by design. If a canvas context cannot be had — a headless
 * environment, an exhausted GPU — the functions return a plain material rather
 * than throwing, because a city with unlettered walls is still a city and a
 * crash during world build is a blank screen.
 */
import * as THREE from 'three';
import { fbmField } from './noise.js';
import { SURFACE_SCANS } from '../config.js';

/** Read fonts once, so a missing one does not fall back mid-draw. */
const DISPLAY_FONT = 'Cinzel, "Times New Roman", serif';
const TEXT_FONT = 'Inter, system-ui, sans-serif';
const MONO_FONT = 'ui-monospace, "SFMono-Regular", Menlo, monospace';

/** Can we actually draw on a canvas in this environment? */
function canvas2d(width, height) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  return { canvas, ctx };
}

/** Finish a canvas into a texture with sane defaults for this world. */
function toTexture(canvas, { repeat = [1, 1], srgb = true, aniso = 4 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = aniso;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * The glyph alphabet.
 *
 * Deliberately abstract. These are NOT transcriptions — writing real Egyptian
 * signs accurately is a specialist job, and a wrong sign next to a label that
 * says "this is what the text says" would be the exact dishonesty the codex goes
 * out of its way to avoid. What this draws is a decorative band in the *visual
 * register* of an Egyptian inscription, and the readable content lives in the
 * reader panel as real English. Each entry is a small vector recipe.
 *
 * @type {Array<(ctx:CanvasRenderingContext2D, s:number) => void>}
 */
const GLYPHS = [
  // ankh
  (c, s) => {
    c.beginPath();
    c.arc(0, -s * 0.3, s * 0.2, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(0, -s * 0.1);
    c.lineTo(0, s * 0.45);
    c.moveTo(-s * 0.28, s * 0.05);
    c.lineTo(s * 0.28, s * 0.05);
    c.stroke();
  },
  // wave / water
  (c, s) => {
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      const y = -s * 0.3 + i * s * 0.28;
      c.moveTo(-s * 0.32, y);
      c.quadraticCurveTo(0, y - s * 0.18, s * 0.32, y);
    }
    c.stroke();
  },
  // sun disc with rays
  (c, s) => {
    c.beginPath();
    c.arc(0, 0, s * 0.2, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.26);
      c.lineTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42);
      c.stroke();
    }
  },
  // reed / stem
  (c, s) => {
    c.beginPath();
    c.moveTo(0, s * 0.45);
    c.lineTo(0, -s * 0.4);
    c.moveTo(0, -s * 0.4);
    c.quadraticCurveTo(s * 0.3, -s * 0.2, s * 0.1, s * 0.1);
    c.stroke();
  },
  // mushroom: a cap on a stem. The motif of this whole city.
  (c, s) => {
    c.beginPath();
    c.arc(0, -s * 0.05, s * 0.3, Math.PI, 0);
    c.closePath();
    c.stroke();
    c.beginPath();
    c.moveTo(0, -s * 0.05);
    c.lineTo(0, s * 0.4);
    c.stroke();
  },
  // hill / mound
  (c, s) => {
    c.beginPath();
    c.arc(0, s * 0.3, s * 0.34, Math.PI, 0);
    c.stroke();
  },
  // offering table
  (c, s) => {
    c.beginPath();
    c.moveTo(-s * 0.34, -s * 0.1);
    c.lineTo(s * 0.34, -s * 0.1);
    c.lineTo(s * 0.22, s * 0.12);
    c.lineTo(-s * 0.22, s * 0.12);
    c.closePath();
    c.stroke();
    c.beginPath();
    c.moveTo(0, s * 0.12);
    c.lineTo(0, s * 0.4);
    c.stroke();
  },
  // eye
  (c, s) => {
    c.beginPath();
    c.moveTo(-s * 0.34, 0);
    c.quadraticCurveTo(0, -s * 0.28, s * 0.34, 0);
    c.quadraticCurveTo(0, s * 0.22, -s * 0.34, 0);
    c.stroke();
    c.beginPath();
    c.arc(0, 0, s * 0.08, 0, Math.PI * 2);
    c.fill();
  },
  // feather (ma'at)
  (c, s) => {
    c.beginPath();
    c.moveTo(0, -s * 0.45);
    c.lineTo(0, s * 0.45);
    c.stroke();
    for (let i = 0; i < 5; i++) {
      const y = -s * 0.3 + i * s * 0.16;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(s * 0.22, y - s * 0.1);
      c.stroke();
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(-s * 0.22, y - s * 0.1);
      c.stroke();
    }
  },
  // column with a capital
  (c, s) => {
    c.beginPath();
    c.moveTo(-s * 0.12, s * 0.42);
    c.lineTo(-s * 0.12, -s * 0.18);
    c.lineTo(-s * 0.3, -s * 0.34);
    c.moveTo(s * 0.12, s * 0.42);
    c.lineTo(s * 0.12, -s * 0.18);
    c.lineTo(s * 0.3, -s * 0.34);
    c.moveTo(-s * 0.3, -s * 0.34);
    c.lineTo(s * 0.3, -s * 0.34);
    c.stroke();
  },
  // jar
  (c, s) => {
    c.beginPath();
    c.moveTo(-s * 0.16, -s * 0.34);
    c.bezierCurveTo(-s * 0.42, -s * 0.05, -s * 0.28, s * 0.36, 0, s * 0.36);
    c.bezierCurveTo(s * 0.28, s * 0.36, s * 0.42, -s * 0.05, s * 0.16, -s * 0.34);
    c.stroke();
  },
  // stacked bread / grain
  (c, s) => {
    for (let i = 0; i < 3; i++) {
      const y = -s * 0.26 + i * s * 0.24;
      c.beginPath();
      c.ellipse(0, y, s * 0.3 - i * s * 0.02, s * 0.1, 0, 0, Math.PI * 2);
      c.stroke();
    }
  },
  // bird
  (c, s) => {
    c.beginPath();
    c.moveTo(-s * 0.34, s * 0.16);
    c.quadraticCurveTo(-s * 0.05, -s * 0.34, s * 0.3, -s * 0.1);
    c.quadraticCurveTo(s * 0.08, s * 0.02, s * 0.06, s * 0.34);
    c.stroke();
  },
  // seated figure
  (c, s) => {
    c.beginPath();
    c.arc(-s * 0.04, -s * 0.3, s * 0.12, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(-s * 0.04, -s * 0.18);
    c.lineTo(-s * 0.04, s * 0.06);
    c.lineTo(s * 0.3, s * 0.06);
    c.moveTo(-s * 0.04, s * 0.06);
    c.lineTo(-s * 0.24, s * 0.34);
    c.stroke();
  },
  // knot / tie
  (c, s) => {
    c.beginPath();
    c.ellipse(0, 0, s * 0.3, s * 0.14, 0.6, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.ellipse(0, 0, s * 0.3, s * 0.14, -0.6, 0, Math.PI * 2);
    c.stroke();
  },
  // star
  (c, s) => {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? s * 0.4 : s * 0.16;
      const fn = i === 0 ? 'moveTo' : 'lineTo';
      c[fn](Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
    c.stroke();
  },
  // horizontal bar with a foot
  (c, s) => {
    c.beginPath();
    c.moveTo(-s * 0.34, -s * 0.12);
    c.lineTo(s * 0.34, -s * 0.12);
    c.moveTo(-s * 0.1, -s * 0.12);
    c.lineTo(-s * 0.1, s * 0.36);
    c.stroke();
  },
];

/** How many recipes there are, for tests and for callers that want variety. */
export const GLYPH_COUNT = GLYPHS.length;

/**
 * Draw a band of glyphs: the decorative inscription used on walls and plinths.
 *
 * @param {{cols?:number, rows?:number, hue?:number, bg?:number|null, seed?:number, cell?:number}} [opts]
 * @returns {THREE.Texture}
 */
export function glyphBandTexture({
  cols = 18,
  rows = 2,
  hue = 42,
  bg = null,
  seed = 11,
  cell = 64,
} = {}) {
  const w = cols * cell;
  const h = rows * cell;
  const made = canvas2d(w, h);
  if (!made) return null;
  const { canvas, ctx } = made;

  // A deterministic order so a given wall always carries the same text. Drawn
  // from a tiny LCG rather than Math.random for exactly that reason: the city
  // must look identical on every visit.
  let s = seed >>> 0;
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  if (bg !== null) {
    ctx.fillStyle = `hsl(${hue}, 30%, ${bg}%)`;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.strokeStyle = `hsl(${hue}, 85%, 72%)`;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = Math.max(2, cell * 0.07);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Separator rules between columns: the vertical lines that make a band of
  // signs read as an inscription rather than as scattered doodles.
  ctx.globalAlpha = 0.5;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cell, 0);
    ctx.lineTo(c * cell, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const glyph = GLYPHS[Math.floor(next() * GLYPHS.length)];
      ctx.save();
      ctx.translate(c * cell + cell / 2, r * cell + cell / 2);
      const scale = cell * (0.62 + next() * 0.14);
      ctx.globalAlpha = 0.75 + next() * 0.25;
      glyph(ctx, scale);
      ctx.restore();
    }
  }

  return toTexture(canvas, { repeat: [1, 1] });
}

/**
 * Draw a readable label: the title and line of gloss on a tablet's face.
 *
 * This one IS meant to be read, so it uses the site's display font and is laid
 * out rather than generated. The glyph band above is decoration; this is text.
 *
 * @param {{title?:string, subtitle?:string, hue?:number, kicker?:string, width?:number, height?:number}} opts
 * @returns {THREE.Texture|null}
 */
export function labelTexture({
  title = '',
  subtitle = '',
  kicker = '',
  hue = 42,
  width = 512,
  height = 256,
} = {}) {
  const made = canvas2d(width, height);
  if (!made) return null;
  const { canvas, ctx } = made;

  // A dark base with a soft vignette, so a bright label does not read as paper
  // floating in a night sky.
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, `hsla(${hue}, 45%, 12%, 0.96)`);
  grad.addColorStop(1, `hsla(${hue}, 55%, 6%, 0.96)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = `hsla(${hue}, 80%, 65%, 0.85)`;
  ctx.lineWidth = Math.max(3, width * 0.008);
  ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, width - ctx.lineWidth * 2, height - ctx.lineWidth * 2);

  const cx = width / 2;
  let y = height * 0.2;

  if (kicker) {
    ctx.fillStyle = `hsla(${hue}, 70%, 72%, 0.9)`;
    ctx.font = `600 ${Math.round(height * 0.085)}px ${TEXT_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // letterSpacing is not universally available; spaced text is the fallback.
    ctx.fillText(spaced(kicker.toUpperCase()), cx, y);
    y += height * 0.16;
  }

  // Long titles shrink rather than overflow: a scroll called "Bread, Beer and
  // Spores" must not run off its own tablet.
  const titleSize = fitFont(ctx, title, width * 0.88, height * 0.2, DISPLAY_FONT, 700);
  ctx.fillStyle = `hsl(${hue}, 75%, 88%)`;
  ctx.font = `700 ${titleSize}px ${DISPLAY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, cx, y + titleSize * 0.5);

  if (subtitle) {
    const subSize = Math.round(height * 0.072);
    ctx.fillStyle = 'rgba(232, 230, 255, 0.72)';
    ctx.font = `400 ${subSize}px ${TEXT_FONT}`;
    const lines = wrap(ctx, subtitle, width * 0.84);
    let sy = y + titleSize + subSize * 1.2;
    for (const line of lines.slice(0, 3)) {
      ctx.fillText(line, cx, sy);
      sy += subSize * 1.25;
    }
  }

  return toTexture(canvas, { repeat: [1, 1] });
}

/**
 * Draw a specialist's holographic panel.
 *
 * The one texture in the world whose content is genuinely data: the name, the
 * role and the hue all come from `shared/specialists.js`, so the court cannot
 * drift out of step with the router that actually dispatches the work. If a
 * specialist is added there, adding it here is one entry in a list.
 *
 * @param {{name:string, role:string, hue:number, tools?:number, label?:string}} spec
 * @returns {THREE.Texture|null}
 */
export function holoPanelTexture(spec, { width = 512, height = 384 } = {}) {
  const made = canvas2d(width, height);
  if (!made) return null;
  const { canvas, ctx } = made;
  const hue = spec.hue ?? 190;

  ctx.clearRect(0, 0, width, height);

  // Scanline field. Drawn first so everything else sits on top of it.
  for (let y = 0; y < height; y += 3) {
    ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.05 + (y % 9 === 0 ? 0.05 : 0)})`;
    ctx.fillRect(0, y, width, 1);
  }

  // Frame + corner brackets: the visual grammar every hologram in fiction uses,
  // and it earns its place because it makes a flat quad read as a projection.
  ctx.strokeStyle = `hsla(${hue}, 90%, 72%, 0.75)`;
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, width - 12, height - 12);
  ctx.lineWidth = 4;
  const B = 34;
  for (const [ox, oy, sx, sy] of [
    [6, 6, 1, 1],
    [width - 6, 6, -1, 1],
    [6, height - 6, 1, -1],
    [width - 6, height - 6, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(ox + sx * B, oy);
    ctx.lineTo(ox, oy);
    ctx.lineTo(ox, oy + sy * B);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Kicker
  ctx.fillStyle = `hsla(${hue}, 85%, 78%, 0.9)`;
  ctx.font = `600 20px ${MONO_FONT}`;
  ctx.fillText(spaced('HYPHA'), width / 2, 46);

  // Name — the loudest thing on the panel, because it is what you fly up to read.
  const nameSize = fitFont(ctx, spec.name, width * 0.8, 76, DISPLAY_FONT, 700);
  ctx.fillStyle = `hsl(${hue}, 95%, 88%)`;
  ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.9)`;
  ctx.shadowBlur = 26;
  ctx.font = `700 ${nameSize}px ${DISPLAY_FONT}`;
  ctx.fillText(spec.name, width / 2, 118);
  ctx.shadowBlur = 0;

  // Role, wrapped to the panel.
  ctx.fillStyle = 'rgba(226, 240, 255, 0.8)';
  const roleSize = 19;
  ctx.font = `400 ${roleSize}px ${TEXT_FONT}`;
  let y = 176;
  for (const line of wrap(ctx, spec.role ?? '', width * 0.82).slice(0, 3)) {
    ctx.fillText(line, width / 2, y);
    y += roleSize * 1.35;
  }

  // A read-out block: how many tools this hypha may reach for. Real information,
  // and it is what makes the panel look instrumented rather than decorative.
  if (Number.isFinite(spec.tools)) {
    ctx.strokeStyle = `hsla(${hue}, 80%, 65%, 0.55)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.14, height - 92);
    ctx.lineTo(width * 0.86, height - 92);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = `hsla(${hue}, 70%, 72%, 0.85)`;
    ctx.font = `500 16px ${MONO_FONT}`;
    ctx.fillText('TOOLS', width * 0.14, height - 68);
    ctx.textAlign = 'right';
    ctx.fillStyle = `hsl(${hue}, 95%, 86%)`;
    ctx.font = `700 22px ${MONO_FONT}`;
    ctx.fillText(String(spec.tools), width * 0.86, height - 66);
  }

  ctx.fillStyle = 'rgba(226, 240, 255, 0.5)';
  ctx.font = `500 15px ${MONO_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(spaced(spec.label ?? 'FLY UP TO ASSIGN'), width / 2, height - 34);

  return toTexture(canvas, { repeat: [1, 1] });
}

/* ── text layout helpers ──────────────────────────────────────────────────── */

/** Letter-spaced uppercase, with a manual fallback for canvas `letterSpacing`. */
function spaced(text) {
  return String(text).split('').join('\u2009');
}

/**
 * Greedily wrap text to a pixel width, using the context's CURRENT font.
 * @returns {string[]}
 */
function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = `${line} ${words[i]}`;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  lines.push(line);
  return lines;
}

/**
 * Largest font size at which `text` fits `maxWidth`, capped at `maxSize`.
 * Never returns below a floor, so a very long title overflows a little rather
 * than shrinking to something unreadable.
 */
function fitFont(ctx, text, maxWidth, maxSize, family, weight = 400) {
  let size = maxSize;
  while (size > 12) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return 12;
}

export { toTexture };

/* ── surface maps ─────────────────────────────────────────────────────────────
 *
 * The first textures in this world that are about MATERIAL rather than about writing.
 * Until these existed there was not one normal, roughness or occlusion map anywhere in
 * the realm: stone was uniformly rough, metal had nothing to reflect, and every
 * surface was flat colour. That is most of why buildings read as shapes rather than as
 * materials.
 *
 * Derived from `noise.js`, which is pure and unit-tested — the tileability of a surface
 * texture is the one property a screenshot cannot tell you and a seam can. All this
 * file does is paint that field into a canvas and hand back a texture.
 *
 * Colour space matters and is easy to get wrong. These are DATA maps, not images: a
 * normal map encodes a direction and a roughness map encodes a coefficient, so neither
 * may be sRGB-decoded on sample. `toTexture` is called with `srgb: false` for both, and
 * that is deliberate rather than an omission.
 */

/**
 * The families a prop can be made of. `scale` is how many lattice cells across the
 * texture — bigger is finer grain; `strength` is how far the normal tilts; `roughLow`
 * and `roughHigh` bound the roughness map, which MULTIPLIES the material's own
 * `roughness` in three.js, so these are multipliers and not absolute values.
 */
export const SURFACES = {
  rock: { scale: 3, strength: 1.3, roughLow: 0.6, roughHigh: 1.0, seed: 1103 },
  soil: { scale: 5, strength: 0.75, roughLow: 0.72, roughHigh: 1.0, seed: 2207 },
  bark: { scale: 2, strength: 1.6, roughLow: 0.78, roughHigh: 1.0, seed: 3313 },
  stone: { scale: 4, strength: 0.6, roughLow: 0.5, roughHigh: 0.95, seed: 4409 },
  metal: { scale: 6, strength: 0.4, roughLow: 0.18, roughHigh: 0.7, seed: 5501 },
};

/** One generated pair per (family, size, repeat), because a hundred props share it. */
const surfaceCache = new Map();

/**
 * A height field for one family, plus the wrapping index helper its derivative needs.
 *
 * The derivative has to wrap the same way the field does, or the normal map has a seam
 * even though the height field does not — which is a genuinely annoying bug to find,
 * because the texture looks perfect until you light it.
 */
function surfaceField(name, size) {
  const spec = SURFACES[name];
  return { spec, field: fbmField(size, { seed: spec.seed, octaves: 4, period: spec.scale }) };
}

/**
 * A normal map for a material family.
 *
 * @param {keyof typeof SURFACES} name
 * @param {{size?:number, repeat?:number}} [opts]
 * @returns {THREE.CanvasTexture|null} null where there is no DOM to draw on
 */
export function surfaceNormalTexture(name, { size = 128, repeat = 4 } = {}) {
  const key = `n|${name}|${size}|${repeat}`;
  const hit = surfaceCache.get(key);
  if (hit) return hit;

  const spec = SURFACES[name];
  if (!spec) return null;
  const made = canvas2d(size, size);
  if (!made) return null;

  const { canvas, ctx } = made;
  const { field } = surfaceField(name, size);
  const image = ctx.createImageData(size, size);
  const at = (x, y) => field[(((y % size) + size) % size) * size + (((x % size) + size) % size)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Central differences, wrapping, so the tile has no seam in its derivative.
      const dx = (at(x + 1, y) - at(x - 1, y)) * spec.strength * 8;
      const dy = (at(x, y + 1) - at(x, y - 1)) * spec.strength * 8;
      // A unit normal, encoded into 0..255 as (n + 1) / 2.
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      image.data[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      image.data[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      image.data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const tex = toTexture(canvas, { repeat: [repeat, repeat], srgb: false, aniso: 4 });
  surfaceCache.set(key, tex);
  return tex;
}

/**
 * A roughness map for a material family: blotchy stone rather than uniformly rough
 * stone, which is most of what makes a flat surface read as weathered.
 *
 * @param {keyof typeof SURFACES} name
 * @param {{size?:number, repeat?:number}} [opts]
 * @returns {THREE.CanvasTexture|null}
 */
export function surfaceRoughnessTexture(name, { size = 64, repeat = 4 } = {}) {
  const key = `r|${name}|${size}|${repeat}`;
  const hit = surfaceCache.get(key);
  if (hit) return hit;

  const spec = SURFACES[name];
  if (!spec) return null;
  const made = canvas2d(size, size);
  if (!made) return null;

  const { canvas, ctx } = made;
  // A different seed from the normal map: sharing one would make every rough patch sit
  // exactly where a bump is, which reads as a pattern rather than as wear.
  const field = fbmField(size, { seed: spec.seed + 977, octaves: 3, period: Math.max(2, spec.scale - 1) });
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < field.length; i++) {
    const v = spec.roughLow + (spec.roughHigh - spec.roughLow) * field[i];
    const b = Math.round(Math.min(1, Math.max(0, v)) * 255);
    image.data[i * 4] = b;
    image.data[i * 4 + 1] = b;
    image.data[i * 4 + 2] = b;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  const tex = toTexture(canvas, { repeat: [repeat, repeat], srgb: false, aniso: 4 });
  surfaceCache.set(key, tex);
  return tex;
}

/** Images already swapped into a texture, so a hundred materials fetch each scan once. */
const scanned = new WeakSet();

/**
 * Swap a scanned image into a generated texture once it arrives.
 *
 * The texture object stays the same — its wrapping and repeat, and every material
 * holding it, carry on — and only its image changes. Until the scan lands, and for
 * good if it never does, the generated map is what draws.
 */
function upgradeWithScan(tex, url) {
  if (!tex || !url || scanned.has(tex) || typeof document === 'undefined') return;
  scanned.add(tex);
  new THREE.ImageLoader().load(
    url,
    (img) => {
      tex.image = img;
      tex.needsUpdate = true;
    },
    undefined,
    () => console.warn('[realm] surface scan missing:', url),
  );
}

/** The fields a material asks for, or null where there is no such family or no DOM. */
export function surfaceMaps(name, repeat = 4) {
  if (!name || !SURFACES[name]) return null;
  const normal = surfaceNormalTexture(name, { repeat });
  const roughness = surfaceRoughnessTexture(name, { repeat });
  if (!normal && !roughness) return null;
  const scan = SURFACE_SCANS[name];
  if (scan) {
    upgradeWithScan(normal, scan.normal);
    upgradeWithScan(roughness, scan.roughness);
  }
  return { normal, roughness, strength: scan?.strength ?? SURFACES[name].strength };
}

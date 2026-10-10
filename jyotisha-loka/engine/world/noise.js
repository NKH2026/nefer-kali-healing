/**
 * Seeded, exactly-tileable value noise.
 *
 * PURE ON PURPOSE: no DOM, no canvas, no three. The painter lives in `textures.js`
 * and this decides the shape, so the shape can be unit-tested in Node — which matters
 * because "does the texture tile" is the one property of a surface texture that a
 * screenshot cannot tell you and a seam can.
 *
 * TILEABLE BY CONSTRUCTION, not by blending the edges together and hoping. A surface
 * texture here is repeated across something many times its own size, so any
 * discontinuity at the edge becomes a visible grid of seams over the whole world. Every
 * octave's lattice wraps at its own integer period, and `fbm(0, v)` and `fbm(1, v)`
 * therefore sample the identical lattice point: the last column really is adjacent to
 * the first.
 *
 * Coordinates are normalised — `u` and `v` run 0..1 and wrap — so a caller never has
 * to know the pixel size.
 */

/**
 * A 32-bit integer hash, murmur-style. Deterministic across runs and platforms: no
 * `Math.random`, so the same seed gives the same world every load, which is what
 * `makeRng` does for geometry and this does for surfaces.
 *
 * @returns {number} in [0, 1)
 */
export function hash2(ix, iy, seed) {
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iy | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const lerp = (a, b, t) => a + (b - a) * t;
/** Smoothstep, so the lattice reads as a surface rather than as diamonds. */
const fade = (t) => t * t * (3 - 2 * t);

/**
 * Value noise on a lattice that wraps at `period`.
 *
 * @param {number} x   in lattice units; wraps at `period`
 * @param {number} y
 * @param {number} period  integer lattice size — the wrap
 * @param {number} seed
 * @returns {number} in [0, 1]
 */
export function valueNoise(x, y, period, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);

  const wrap = (i) => ((i % period) + period) % period;
  const xa = wrap(x0);
  const xb = wrap(x0 + 1);
  const ya = wrap(y0);
  const yb = wrap(y0 + 1);

  const n00 = hash2(xa, ya, seed);
  const n10 = hash2(xb, ya, seed);
  const n01 = hash2(xa, yb, seed);
  const n11 = hash2(xb, yb, seed);

  return lerp(lerp(n00, n10, fx), lerp(n01, n11, fx), fy);
}

/**
 * Fractal noise: octaves of `valueNoise`, each at double the frequency and half the
 * amplitude, normalised back to 0..1.
 *
 * `period` doubles per octave, so every octave wraps at an integer — which is what
 * keeps the sum tileable rather than only its first octave.
 *
 * @param {number} u  normalised, wraps at 1
 * @param {number} v
 * @param {{octaves?:number, period?:number, gain?:number, seed?:number}} [opts]
 * @returns {number} in [0, 1]
 */
export function fbm(u, v, { octaves = 4, period = 4, gain = 0.5, seed = 0 } = {}) {
  let amplitude = 1;
  let total = 0;
  let norm = 0;
  let p = period;

  for (let o = 0; o < octaves; o++) {
    total += amplitude * valueNoise(u * p, v * p, p, seed + o * 1013);
    norm += amplitude;
    amplitude *= gain;
    p *= 2;
  }

  return norm > 0 ? total / norm : 0;
}

/**
 * Sample `fbm` into a square field, one value per pixel.
 *
 * The caller paints this; keeping it as a plain Float32Array is what makes the
 * tileability test a two-line assertion rather than an image comparison.
 *
 * @param {number} size    pixels per side
 * @param {object} [opts]  passed through to `fbm`
 * @returns {Float32Array} `size * size`, row-major, each in 0..1
 */
export function fbmField(size, opts = {}) {
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      out[y * size + x] = fbm(x / size, y / size, opts);
    }
  }
  return out;
}

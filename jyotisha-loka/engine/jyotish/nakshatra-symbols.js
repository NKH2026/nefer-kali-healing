/**
 * The nakshatra symbols — the slot the art drops into.
 *
 * The tradition draws each of the 27 mansions with a mark: a horse's head for
 * Aśvinī, a yoni for Bharaṇī, a blade for Kṛttikā, a chariot for Rohiṇī, and so
 * on. Those are DRAWINGS. Approximating them procedurally and calling the
 * result traditional would break the one promise this world makes — that what
 * it shows you is what the tradition says.
 *
 * So this module is the contract, not the art. When the 27 marks exist as line
 * drawings, they go in `SYMBOL_PATHS` and the ring and the panels pick them up
 * with no other change. Until then `hasSymbol()` is false and the world shows
 * the symbol in words instead, which is honest and legible.
 *
 * ── The contract for the illustrator ───────────────────────────────────────
 *
 *   • one path per nakshatra, in a 100 × 100 box, origin top-left
 *   • outline only — no fills; strokes are drawn at 4 units wide
 *   • a single colour (the caller sets it), so the marks read on gold, violet
 *     and dark grounds alike
 *   • SVG path syntax, because it loads straight into `Path2D`
 *
 * A file of 27 such strings, and the world is finished.
 */

/** The 27 mansions, in order, with the mark the tradition gives each. */
export const SYMBOLS = [
  { id: 'ashvini', name: 'Aśvinī', mark: "a horse's head" },
  { id: 'bharani', name: 'Bharaṇī', mark: 'the yoni, the womb' },
  { id: 'krittika', name: 'Kṛttikā', mark: 'a blade' },
  { id: 'rohini', name: 'Rohiṇī', mark: 'a chariot' },
  { id: 'mrigashira', name: 'Mṛgaśirā', mark: "a deer's head" },
  { id: 'ardra', name: 'Ārdrā', mark: 'a teardrop' },
  { id: 'punarvasu', name: 'Punarvasu', mark: 'a bow and quiver' },
  { id: 'pushya', name: 'Puṣya', mark: "a cow's udder" },
  { id: 'ashlesha', name: 'Āśleṣā', mark: 'a coiled serpent' },
  { id: 'magha', name: 'Maghā', mark: 'a royal throne' },
  { id: 'purva-phalguni', name: 'Pūrva Phalgunī', mark: 'the front legs of a bed' },
  { id: 'uttara-phalguni', name: 'Uttara Phalgunī', mark: 'the back legs of a bed' },
  { id: 'hasta', name: 'Hasta', mark: 'a hand' },
  { id: 'chitra', name: 'Chitrā', mark: 'a bright jewel' },
  { id: 'svati', name: 'Svātī', mark: 'a young sprout in the breeze' },
  { id: 'vishakha', name: 'Viśākhā', mark: 'a triumphal arch' },
  { id: 'anuradha', name: 'Anurādhā', mark: 'a lotus' },
  { id: 'jyeshtha', name: 'Jyeṣṭhā', mark: 'an earring, an umbrella' },
  { id: 'mula', name: 'Mūla', mark: 'a bundle of roots' },
  { id: 'purva-ashadha', name: 'Pūrva Āṣāḍhā', mark: 'a winnowing fan' },
  { id: 'uttara-ashadha', name: 'Uttara Āṣāḍhā', mark: "an elephant's tusk" },
  { id: 'shravana', name: 'Śravaṇa', mark: 'three footprints, an ear' },
  { id: 'dhanishtha', name: 'Dhaniṣṭhā', mark: 'a drum' },
  { id: 'shatabhisha', name: 'Śatabhiṣā', mark: 'an empty circle' },
  { id: 'purva-bhadrapada', name: 'Pūrva Bhādrapadā', mark: 'the front of a funeral cot' },
  { id: 'uttara-bhadrapada', name: 'Uttara Bhādrapadā', mark: 'the back of a funeral cot' },
  { id: 'revati', name: 'Revatī', mark: 'a fish, a drum' },
];

/**
 * SVG path data, keyed by nakshatra id, in a 100 × 100 box.
 *
 * Empty on purpose — see the note at the top of this file. Adding a path here
 * is all that is required; nothing else in the world changes.
 *
 * @type {Record<string, string>}
 */
export const SYMBOL_PATHS = {};

/** Is there a drawing for this mansion yet? */
export function hasSymbol(id) {
  return Boolean(SYMBOL_PATHS[id]);
}

/**
 * Draw a mansion's mark into a 2D canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} id
 * @param {number} x  left edge of the 100-unit box
 * @param {number} y  top edge
 * @param {number} scale  box size in canvas units ÷ 100
 * @returns {boolean} whether anything was drawn
 */
export function drawSymbol(ctx, id, x, y, scale = 1) {
  const path = SYMBOL_PATHS[id];
  if (!path || typeof Path2D === 'undefined') return false;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke(new Path2D(path));
  ctx.restore();
  return true;
}

/**
 * The 27 Mansions collection and the birth star: the rules, and how they are
 * kept on the member's device. Pure apart from the storage it is handed.
 * tests/jyotish-sky.test.mjs.
 *
 * A mansion can be collected only while the real Moon is in it — in the present,
 * not while travelling in time — so the set takes about a lunar month of real
 * days to complete and cannot be rushed.
 *
 * The birth star is kept as the nakshatra's id and nothing else: never the birth
 * date, time or place.
 */
import { NAKSHATRAS } from './sky.js';

export const MANSIONS_KEY = 'pa-jyotish-mansions-v1';
export const BIRTH_STAR_KEY = 'pa-jyotish-birth-star-v1';

const ids = new Set(NAKSHATRAS.map((n) => n.id));

function read(storage, key, fallback) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(storage, key, value) {
  try { storage?.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

/** The mansions collected so far, as a Set of nakshatra ids (unknown ids dropped). */
export function loadMansions(storage = globalThis.localStorage) {
  const list = read(storage, MANSIONS_KEY, []);
  return new Set((Array.isArray(list) ? list : []).filter((id) => ids.has(id)));
}

/**
 * Collect the mansion the Moon is in.
 * @param {Set<string>} collected
 * @param {number} moonIndex  the Moon's nakshatra now, 0..26
 * @param {{live: boolean}} when  live is false while travelling in time
 * @returns {{ok: boolean, reason?: 'not-now'|'already', nakshatra: object, count: number, complete: boolean}}
 */
export function collectMansion(collected, moonIndex, { live }) {
  const nakshatra = NAKSHATRAS[moonIndex];
  if (!live) return { ok: false, reason: 'not-now', nakshatra, count: collected.size, complete: collected.size === 27 };
  if (collected.has(nakshatra.id)) return { ok: false, reason: 'already', nakshatra, count: collected.size, complete: collected.size === 27 };
  collected.add(nakshatra.id);
  return { ok: true, nakshatra, count: collected.size, complete: collected.size === 27 };
}

export function saveMansions(collected, storage = globalThis.localStorage) {
  return write(storage, MANSIONS_KEY, [...collected]);
}

/** The member's birth nakshatra, or null. Only the id is ever stored. */
export function loadBirthStar(storage = globalThis.localStorage) {
  const v = read(storage, BIRTH_STAR_KEY, null);
  const id = typeof v === 'string' ? v : v?.id;
  return ids.has(id) ? NAKSHATRAS.find((n) => n.id === id) : null;
}

export function saveBirthStar(nakshatra, storage = globalThis.localStorage) {
  if (!nakshatra || !ids.has(nakshatra.id)) return false;
  return write(storage, BIRTH_STAR_KEY, { id: nakshatra.id });
}

export function forgetBirthStar(storage = globalThis.localStorage) {
  try { storage?.removeItem(BIRTH_STAR_KEY); return true; } catch { return false; }
}

/** Is today the Moon's return to the member's birth star? */
export function isBirthStarDay(birthStar, moonIndex) {
  return Boolean(birthStar) && NAKSHATRAS[moonIndex]?.id === birthStar.id;
}

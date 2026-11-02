/**
 * The ascendant — the Lagna — and the houses it defines.
 *
 * ── Why this is a separate, pure module ─────────────────────────────────────
 *
 * Every chart hangs on the Lagna: the first house is wherever the ascendant
 * falls, and every other house is counted from it. Get it wrong and the whole
 * chart is wrong — planets land in the wrong cells with total confidence. So
 * this lives apart from the world, takes plain numbers, and returns plain
 * numbers, which means it can be checked against a real chart without a GPU.
 *
 * It needs THREE things, and this is why a date and time alone were never
 * enough: the moment, and where on Earth you were standing. The ascendant is
 * literally the degree of the ecliptic rising over your horizon.
 *
 * ── The method ──────────────────────────────────────────────────────────────
 *
 *   1. Local apparent sidereal time from astronomy-engine, shifted by longitude
 *      — that is the RAMC, the right ascension of the meridian.
 *   2. The ascendant's ecliptic longitude from RAMC, the obliquity of the
 *      ecliptic and the observer's latitude.
 *   3. Subtract the Lahiri ayanāṃśa, so the answer is sidereal like everything
 *      else in this world.
 *
 * ── How to check it ─────────────────────────────────────────────────────────
 *
 * Give it a birth you already have a chart for and compare `sidereal` with the
 * ascendant in that chart. Within a fraction of a degree means the method is
 * right; a whole sign out means a sign error here, not in the chart.
 */
import * as Astronomy from 'astronomy-engine';
import { ayanamsa } from './sky.js';

const DEG = Math.PI / 180;
const norm = (d) => ((d % 360) + 360) % 360;

const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);

/** Mean obliquity of the ecliptic, degrees. */
function obliquity(date) {
  const T = (date.getTime() - J2000) / (365.25 * 86400000) / 100;
  return 23.439291 - 0.0130042 * T;
}

/**
 * The right ascension of the meridian, in degrees.
 *
 * Greenwich apparent sidereal time (hours) → degrees, plus the observer's
 * longitude (east positive).
 */
export function ramc(date, lon) {
  const gstHours = Astronomy.SiderealTime(date);
  return norm(gstHours * 15 + lon);
}

/**
 * The ascendant at a moment and a place.
 *
 * @param {{ date: Date, lat: number, lon: number }} opts
 *   `lat`/`lon` in degrees, east and north positive.
 * @returns {{ sidereal: number, tropical: number, ramc: number }}
 *   `sidereal` is the Lahiri sidereal longitude of the ascendant, [0, 360).
 */
export function ascendant({ date, lat, lon }) {
  const r = ramc(date, lon) * DEG;
  const eps = obliquity(date) * DEG;
  const phi = lat * DEG;

  // The classic closed form: the east point of the ecliptic on the horizon.
  const y = Math.cos(r);
  const x = -(Math.sin(r) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  const tropical = norm(Math.atan2(y, x) / DEG);

  return {
    tropical,
    sidereal: norm(tropical - ayanamsa(date)),
    ramc: norm(r / DEG),
  };
}

/**
 * Whole-sign houses from the ascendant.
 *
 * This is the convention the North Indian chart in the sky is drawn with:
 * house 1 IS the ascendant's sign, and each house is the next whole sign. The
 * chart frame is fixed, so the mapping is:
 *
 *     houseOf(planetLongitude) = floor(((planet - asc) mod 360) / 30) + 1
 *
 * @param {number} ascendantLon
 * @param {number} longitude
 * @returns {number} 1 … 12
 */
export function houseOf(ascendantLon, longitude) {
  return Math.floor(norm(longitude - ascendantLon) / 30) + 1;
}

/**
 * Every graha's house, for a given chart.
 *
 * @param {number} ascendantLon
 * @param {Array<{ id: string, lon: number }>} positions
 * @returns {Record<string, number>}
 */
export function housesOf(ascendantLon, positions) {
  const out = {};
  for (const p of positions) out[p.id] = houseOf(ascendantLon, p.lon);
  return out;
}

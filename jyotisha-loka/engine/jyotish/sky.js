/**
 * The Jyotish sky, computed: where the nine grahas are right now in the sidereal
 * zodiac, and the day's panchanga — the same quantities the Jyotish course's modules
 * teach (server/content/courses/jyotish/).
 *
 * Positions come from Astronomy Engine (VSOP87 / NOVAS based, about one
 * arc-minute), on the true ecliptic of date. The sidereal zodiac is the Lahiri
 * (Chitrapakṣa) one, India's official convention. Rāhu is the Moon's mean
 * ascending node, as most panchangas use; Ketu is opposite it.
 *
 * No three.js, no DOM: tests/jyotish-sky.test.mjs runs it under Node.
 */
import { Body, GeoVector, Rotation_EQJ_ECT, RotateVector, SphereFromVector, EclipticGeoMoon, SunPosition } from 'astronomy-engine';

const DAY_MS = 86_400_000;
const J2000 = Date.UTC(2000, 0, 1, 12);

/** The nine grahas, in the traditional order, with how the realm draws each. */
export const GRAHAS = [
  { id: 'surya', name: 'Sūrya', english: 'Sun', body: Body.Sun, colour: 0xffb43a, size: 7, day: 0, glyph: '☉' },
  { id: 'chandra', name: 'Chandra', english: 'Moon', body: Body.Moon, colour: 0xf2f0ff, size: 4.5, day: 1, glyph: '☽' },
  { id: 'mangala', name: 'Maṅgala', english: 'Mars', body: Body.Mars, colour: 0xff4a36, size: 3.2, day: 2, glyph: '♂' },
  { id: 'budha', name: 'Budha', english: 'Mercury', body: Body.Mercury, colour: 0x5cff9a, size: 2.6, day: 3, glyph: '☿' },
  { id: 'guru', name: 'Guru', english: 'Jupiter', body: Body.Jupiter, colour: 0xffd75a, size: 5.5, day: 4, glyph: '♃' },
  { id: 'shukra', name: 'Śukra', english: 'Venus', body: Body.Venus, colour: 0xffd8f4, size: 3.6, day: 5, glyph: '♀' },
  { id: 'shani', name: 'Śani', english: 'Saturn', body: Body.Saturn, colour: 0x5468ff, size: 4.8, day: 6, glyph: '♄', ring: true },
  { id: 'rahu', name: 'Rāhu', english: 'North node', body: null, colour: 0x6b3fa0, size: 4, shadow: true, glyph: '☊' },
  { id: 'ketu', name: 'Ketu', english: 'South node', body: null, colour: 0xc2683a, size: 3.4, shadow: true, glyph: '☋' },
];

export const RASHIS = [
  'Meṣa', 'Vṛṣabha', 'Mithuna', 'Karka', 'Siṃha', 'Kanyā',
  'Tulā', 'Vṛścika', 'Dhanu', 'Makara', 'Kumbha', 'Mīna',
];
export const RASHIS_ENGLISH = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

/** The twenty-seven nakshatras: deity, symbol and lord, as the module teaches them. */
export const NAKSHATRAS = [
  { id: 'ashvini', name: 'Aśvinī', deity: 'the Aśvins, the divine healers', symbol: "a horse's head", lord: 'ketu', icon: '🐴' },
  { id: 'bharani', name: 'Bharaṇī', deity: 'Yama', symbol: 'the yoni, the womb', lord: 'shukra', icon: '🔺' },
  { id: 'krittika', name: 'Kṛttikā', deity: 'Agni, the fire', symbol: 'a blade', lord: 'surya', icon: '🔥' },
  { id: 'rohini', name: 'Rohiṇī', deity: 'Prajāpati', symbol: 'a chariot', lord: 'chandra', icon: '🛞' },
  { id: 'mrigashira', name: 'Mṛgaśirā', deity: 'Soma', symbol: "a deer's head", lord: 'mangala', icon: '🦌' },
  { id: 'ardra', name: 'Ārdrā', deity: 'Rudra', symbol: 'a teardrop', lord: 'rahu', icon: '💧' },
  { id: 'punarvasu', name: 'Punarvasu', deity: 'Aditi', symbol: 'a bow and quiver', lord: 'guru', icon: '🏹' },
  { id: 'pushya', name: 'Puṣya', deity: 'Bṛhaspati, teacher of the gods', symbol: "a cow's udder", lord: 'shani', icon: '🐄' },
  { id: 'ashlesha', name: 'Āśleṣā', deity: 'the Nāgas, the serpents', symbol: 'a coiled serpent', lord: 'budha', icon: '🐍' },
  { id: 'magha', name: 'Maghā', deity: 'the Pitṛs, the ancestors', symbol: 'a royal throne', lord: 'ketu', icon: '👑' },
  { id: 'purva-phalguni', name: 'Pūrva Phalgunī', deity: 'Bhaga', symbol: 'the front legs of a bed', lord: 'shukra', icon: '🛏️' },
  { id: 'uttara-phalguni', name: 'Uttara Phalgunī', deity: 'Aryaman', symbol: 'the back legs of a bed', lord: 'surya', icon: '🤝' },
  { id: 'hasta', name: 'Hasta', deity: 'Savitṛ', symbol: 'a hand', lord: 'chandra', icon: '✋' },
  { id: 'chitra', name: 'Chitrā', deity: 'Viśvakarman, the divine craftsman', symbol: 'a bright jewel', lord: 'mangala', icon: '💎' },
  { id: 'svati', name: 'Svātī', deity: 'Vāyu, the wind', symbol: 'a young sprout in the breeze', lord: 'rahu', icon: '🌱' },
  { id: 'vishakha', name: 'Viśākhā', deity: 'Indra and Agni', symbol: 'a triumphal arch', lord: 'guru', icon: '⛩️' },
  { id: 'anuradha', name: 'Anurādhā', deity: 'Mitra', symbol: 'a lotus', lord: 'shani', icon: '🪷' },
  { id: 'jyeshtha', name: 'Jyeṣṭhā', deity: 'Indra', symbol: 'an earring, an umbrella', lord: 'budha', icon: '☂️' },
  { id: 'mula', name: 'Mūla', deity: 'Nirṛti', symbol: 'a bundle of roots', lord: 'ketu', icon: '🫚' },
  { id: 'purva-ashadha', name: 'Pūrva Āṣāḍhā', deity: 'Āpaḥ, the waters', symbol: 'a winnowing fan', lord: 'shukra', icon: '🌊' },
  { id: 'uttara-ashadha', name: 'Uttara Āṣāḍhā', deity: 'the Viśvedevas', symbol: "an elephant's tusk", lord: 'surya', icon: '🐘' },
  { id: 'shravana', name: 'Śravaṇa', deity: 'Viṣṇu', symbol: 'three footprints, an ear', lord: 'chandra', icon: '👂' },
  { id: 'dhanishtha', name: 'Dhaniṣṭhā', deity: 'the eight Vasus', symbol: 'a drum', lord: 'mangala', icon: '🥁' },
  { id: 'shatabhisha', name: 'Śatabhiṣā', deity: 'Varuṇa', symbol: 'an empty circle', lord: 'rahu', icon: '⭕' },
  { id: 'purva-bhadrapada', name: 'Pūrva Bhādrapadā', deity: 'Aja Ekapāda', symbol: 'the front of a funeral cot', lord: 'guru', icon: '⚡' },
  { id: 'uttara-bhadrapada', name: 'Uttara Bhādrapadā', deity: 'Ahir Budhnya, the serpent of the deep', symbol: 'the back of a funeral cot', lord: 'shani', icon: '🌀' },
  { id: 'revati', name: 'Revatī', deity: 'Pūṣan, guide of travellers', symbol: 'a fish, a drum', lord: 'budha', icon: '🐟' },
];

const TITHIS = [
  'Pratipadā', 'Dvitīyā', 'Tṛtīyā', 'Caturthī', 'Pañcamī', 'Ṣaṣṭhī', 'Saptamī', 'Aṣṭamī',
  'Navamī', 'Daśamī', 'Ekādaśī', 'Dvādaśī', 'Trayodaśī', 'Caturdaśī',
];
const YOGAS = [
  'Viṣkambha', 'Prīti', 'Āyuṣmān', 'Saubhāgya', 'Śobhana', 'Atigaṇḍa', 'Sukarmā', 'Dhṛti', 'Śūla',
  'Gaṇḍa', 'Vṛddhi', 'Dhruva', 'Vyāghāta', 'Harṣaṇa', 'Vajra', 'Siddhi', 'Vyatīpāta', 'Varīyān',
  'Parigha', 'Śiva', 'Siddha', 'Sādhya', 'Śubha', 'Śukla', 'Brahma', 'Indra', 'Vaidhṛti',
];
const MOVABLE_KARANAS = ['Bava', 'Bālava', 'Kaulava', 'Taitila', 'Gara', 'Vaṇija', 'Viṣṭi'];
const VARAS = ['Ravivāra', 'Somavāra', 'Maṅgalavāra', 'Budhavāra', 'Guruvāra', 'Śukravāra', 'Śanivāra'];

/** 13°20′, the width of a nakshatra and of a yoga. */
export const NAKSHATRA_SPAN = 360 / 27;

const norm = (deg) => ((deg % 360) + 360) % 360;
const centuries = (date) => (date.getTime() - J2000) / DAY_MS / 36525;

/**
 * The Lahiri ayanāṃśa for a date, in degrees: about 23°51′ at J2000, growing with
 * general precession (≈50.29″ a year). Within about 0.01° of the published tables
 * for this century, well inside a nakshatra's 13°20′.
 */
export function ayanamsa(date) {
  const years = (date.getTime() - J2000) / DAY_MS / 365.25;
  return 23.857 + years * (50.29 / 3600);
}

/** The Moon's mean ascending node (Rāhu), tropical, degrees (Meeus 47.7). */
export function meanNode(date) {
  const T = centuries(date);
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441);
}

/** A body's tropical longitude on the true ecliptic of date, degrees. */
export function tropicalLongitude(body, date) {
  if (body === Body.Sun) return norm(SunPosition(date).elon);
  if (body === Body.Moon) return norm(EclipticGeoMoon(date).lon);
  const v = RotateVector(Rotation_EQJ_ECT(date), GeoVector(body, date, true));
  return norm(SphereFromVector(v).lon);
}

/** A graha's sidereal longitude (Lahiri), degrees. */
export function siderealLongitude(graha, date) {
  const g = typeof graha === 'string' ? GRAHAS.find((x) => x.id === graha) : graha;
  let tropical;
  if (g.id === 'rahu') tropical = meanNode(date);
  else if (g.id === 'ketu') tropical = norm(meanNode(date) + 180);
  else tropical = tropicalLongitude(g.body, date);
  return norm(tropical - ayanamsa(date));
}

/** Where a sidereal longitude falls: rāśi, degree in it, nakshatra and pada. */
export function placeOf(lon) {
  const l = norm(lon);
  const rashi = Math.floor(l / 30);
  const n = Math.floor(l / NAKSHATRA_SPAN);
  const pada = Math.floor((l - n * NAKSHATRA_SPAN) / (NAKSHATRA_SPAN / 4)) + 1;
  return { lon: l, rashi, rashiName: RASHIS[rashi], rashiEnglish: RASHIS_ENGLISH[rashi], degree: l - rashi * 30, nakshatra: NAKSHATRAS[n], nakshatraIndex: n, pada };
}

/**
 * Every graha's place now: sidereal longitude, sign, nakshatra, pada, and whether
 * it is moving backwards (retrograde) against the stars. The nodes always are.
 */
export function grahaPositions(date = new Date()) {
  const soon = new Date(date.getTime() + DAY_MS / 4);
  return GRAHAS.map((g) => {
    const lon = siderealLongitude(g, date);
    let motion = norm(siderealLongitude(g, soon) - lon);
    if (motion > 180) motion -= 360;
    const retrograde = g.shadow ? true : g.id === 'surya' || g.id === 'chandra' ? false : motion < 0;
    return { ...placeOf(lon), id: g.id, graha: g, retrograde, dailyMotion: motion * 4 };
  });
}

/** Format a degree inside a sign as 12°34′. */
export function dms(deg) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}′`;
}

/**
 * The day's panchanga at a moment. The vāra here is the weekday of the member's
 * own clock, counted from 6 a.m. as a stand-in for sunrise (the realm does not ask
 * where you are); the other four limbs are exact for the moment given.
 */
export function panchanga(date = new Date()) {
  const sun = siderealLongitude('surya', date);
  const moon = siderealLongitude('chandra', date);
  const lead = norm(moon - sun);
  const t = Math.floor(lead / 12); // 0..29
  const paksha = t < 15 ? 'śukla' : 'kṛṣṇa';
  const inPaksha = t % 15; // 0..14
  const tithiName = inPaksha === 14 ? (t < 15 ? 'Pūrṇimā' : 'Amāvāsyā') : TITHIS[inPaksha];
  const k = Math.floor(lead / 6); // 0..59
  const karana = k === 0 ? 'Kiṃstughna' : k >= 57 ? ['Śakuni', 'Catuṣpāda', 'Nāga'][k - 57] : MOVABLE_KARANAS[(k - 1) % 7];
  const yogaIndex = Math.floor(norm(sun + moon) / NAKSHATRA_SPAN);
  const local = new Date(date.getTime() - 6 * 3_600_000);
  const vara = local.getDay();
  const moonPlace = placeOf(moon);
  return {
    tithi: { index: t + 1, name: tithiName, paksha, number: inPaksha + 1, fraction: (lead % 12) / 12 },
    nakshatra: { ...moonPlace.nakshatra, index: moonPlace.nakshatraIndex, pada: moonPlace.pada, fraction: (moon % NAKSHATRA_SPAN) / NAKSHATRA_SPAN },
    yoga: { index: yogaIndex + 1, name: YOGAS[yogaIndex] },
    karana: { index: k + 1, name: karana },
    vara: { index: vara, name: VARAS[vara], graha: GRAHAS.find((g) => g.day === vara) },
    illumination: (1 - Math.cos((lead * Math.PI) / 180)) / 2,
    moonLead: lead,
  };
}

/** When the Moon next enters a nakshatra (≈ hours away), searched in 10-minute steps. */
export function nextMansionChange(date = new Date()) {
  const now = Math.floor(siderealLongitude('chandra', date) / NAKSHATRA_SPAN);
  for (let m = 10; m <= 2 * 24 * 60; m += 10) {
    const at = new Date(date.getTime() + m * 60_000);
    const n = Math.floor(siderealLongitude('chandra', at) / NAKSHATRA_SPAN);
    if (n !== now) return { at, nakshatra: NAKSHATRAS[n] };
  }
  return null;
}

/**
 * The birth star from a birth moment. The caller passes a Date; only the result
 * is ever kept. `exact` is false when the Moon was within half a degree of a
 * boundary, where an unknown birth time could change the answer.
 */
export function birthStar(date) {
  const moon = siderealLongitude('chandra', date);
  const place = placeOf(moon);
  const into = moon - place.nakshatraIndex * NAKSHATRA_SPAN;
  return { nakshatra: place.nakshatra, index: place.nakshatraIndex, pada: place.pada, nearBoundary: into < 0.5 || NAKSHATRA_SPAN - into < 0.5 };
}

/**
 * Whether a birth date alone settles the birth star: true when the Moon stays in
 * one nakshatra across the whole local day. Otherwise the time matters.
 */
export function birthStarFromDay(year, month, day, tzOffsetMinutes = 0) {
  const start = new Date(Date.UTC(year, month - 1, day) + tzOffsetMinutes * 60_000);
  const end = new Date(start.getTime() + DAY_MS - 60_000);
  const a = birthStar(start);
  const b = birthStar(end);
  return { settled: a.index === b.index, first: a, last: b };
}

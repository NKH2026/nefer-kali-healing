/**
 * The tour's stops, in the sky: one per navbar item, each anchored to a graha.
 *
 * ── The idea ────────────────────────────────────────────────────────────────
 *
 * The world already plots the nine grahas at their TRUE sidereal positions right
 * now. So the tour is not a stage built to look like a sky — it is tonight's
 * sky. Home is a drone shot of the actual transit; every other stop flies to its
 * graha where that graha really is, at 112–252 m from the centre.
 *
 * That means the map is different every night, which is the point.
 *
 * ── Why this is data ────────────────────────────────────────────────────────
 *
 * The same list has to agree across four owners: the camera (where to fly), the
 * page (which section is on screen), the navbar (which item is active), and the
 * click (where to send you). Written separately they drift. Here `id` is the
 * contract and `graha` is the address.
 *
 * ── A stop is a shot, not a position ────────────────────────────────────────
 *
 * `distance` / `pitch` / `fov` place the camera around the stop; `out` pushes
 * the aim outward from the planet so the planet hangs behind the district
 * rather than inside it; `yawOffset` is measured from the orbit's own tangent,
 * so a district framed "looking downstream" stays correct at any longitude.
 */
import { ORBITS, wheelPoint } from './jyotish/scene.js';

/**
 * Where a graha actually is, and how its orbit is oriented there.
 *
 * @param {Array<{id:string, lon:number}>} positions  from the jyotish world
 * @param {string} id
 * @returns {{x:number, y:number, z:number, angle:number}}
 */
export function grahaFrame(positions, id) {
  const p = (positions || []).find((x) => x.id === id);
  const o = ORBITS[id] || { r: 160, y: 44 };
  const lon = p ? p.lon : 0;
  const v = wheelPoint(lon, o.r, o.y);
  // The orbit angle at that point: wheelPoint uses (cos a, -sin a).
  const angle = Math.atan2(-v.z, v.x);
  return { x: v.x, y: v.y, z: v.z, angle };
}

export const TOUR_STOPS = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    kicker: 'Nefer Kali Healing',
    title: 'The World of Light',
    blurb: 'Accessible spiritual education and natural wellness, through the synthesis of Kemetic, Orisha and Vedic wisdom.',
    // Not a planet: Home is the vantage. The whole transit, from above.
    graha: null,
    target: { x: 0, y: 42, z: 0 },
    distance: 330,
    pitch: 0.5,
    yaw: 0.42,
    fov: 62,
  },
  {
    id: 'journey',
    label: 'Our Journey',
    path: '/about',
    kicker: 'Śani · Saturn',
    title: 'Our Journey',
    blurb: 'A nonprofit foundation rooted in ancient truth, carrying Kemetic, Orisha and Vedic teaching to communities the wider wellness industry has overlooked.',
    graha: 'shani',
    /**
     * Aim at the middle of the road, not at Saturn.
     *
     * Checked arithmetically rather than by eye: with along 12.75 and lift 13
     * the camera sits 40 units out with the road 65 units away and 4.1° off the
     * view axis — comfortably on screen in a 52° fov.
     */
    district: 'journey',
    out: 0,
    along: 12.75,
    lift: 13,
    distance: 40,
    pitch: 0.18,
    yawOffset: -Math.PI,
    fov: 52,
  },
  {
    id: 'support',
    label: 'Support',
    path: '/support',
    kicker: 'Sūrya · the Sun',
    title: 'Support the Mission',
    blurb: 'Your contributions fund community workshops, herbal distributions, and the preservation of sacred indigenous knowledge.',
    graha: 'surya',
    distance: 34,
    pitch: 0.22,
    yawOffset: -0.4,
    fov: 48,
  },
  {
    id: 'community',
    label: 'Community',
    path: '/community',
    kicker: 'Maṅgala · Mars',
    title: 'The Unity Circle',
    blurb: 'Monthly gatherings, shared ritual, and a support network for collective evolution and soulful connection.',
    graha: 'mangala',
    distance: 22,
    pitch: 0.26,
    yawOffset: 0.9,
    fov: 52,
  },
  {
    id: 'wellness',
    label: 'Offerings',
    path: '/offerings',
    kicker: 'Śukra · Venus',
    title: 'Offerings',
    blurb: 'Herbal tinctures, teas and salves, made in small batches — laid out on a barge in the slow river, with the bees still working.',
    graha: 'shukra',
    // The district is pushed well outward from Venus AND below the ecliptic.
    // Śukra orbits at 144 and Sūrya at 164: parked beside Venus, the Sun lands
    // directly behind the stalls and its bloom eats the whole scene. Below the
    // plane, and looking outward past the barge, the backdrop is open space.
    district: 'offerings',
    out: 70,
    lift: -34,
    distance: 32,
    pitch: 0.12,
    // Camera sits inboard of the barge and looks outward: a = angle - PI/2.
    yawOffset: Math.PI / 2,
    fov: 52,
  },
  {
    id: 'wisdom',
    label: 'Wisdom',
    path: '/wisdom',
    kicker: 'Guru · Jupiter',
    title: 'Wisdom',
    blurb: 'Essays and teaching from the journal — the calendar, the plants, and the sky the traditions were written under.',
    graha: 'guru',
    distance: 30,
    pitch: 0.2,
    yawOffset: -0.7,
    fov: 50,
  },
  {
    id: 'guides',
    label: 'Healing Guides',
    path: '/healing-guides',
    kicker: 'Chandra · the Moon',
    title: 'Healing Guides',
    blurb: 'One page per plant: how it is prepared, what it is for, and where the tradition ends and the evidence begins.',
    graha: 'chandra',
    distance: 20,
    pitch: 0.18,
    yawOffset: 0.3,
    fov: 52,
  },
  {
    id: 'planetary',
    label: 'Planetary',
    path: '/sky-watch',
    kicker: 'The transit',
    title: 'Planetary',
    blurb: 'Tonight’s sky, read as Jyotish reads it — the nine grahas at their true sidereal positions, now.',
    // The instrument, not a planet: across the whole ecliptic rather than down on it.
    graha: null,
    target: { x: 0, y: 44, z: 0 },
    distance: 300,
    pitch: 0.16,
    yaw: 2.4,
    fov: 58,
  },
];

/**
 * Turn the stops into shots the rig can fly to, using tonight's real positions.
 *
 * @param {{positions: Array<{id:string, lon:number}>}} opts
 */
export function buildShots({ positions } = {}) {
  return TOUR_STOPS.map((s) => {
    if (!s.graha) {
      return {
        id: s.id,
        label: s.label,
        title: s.title,
        target: { x: s.target.x, y: s.target.y, z: s.target.z },
        distance: s.distance,
        yaw: s.yaw,
        pitch: s.pitch,
        fov: s.fov,
      };
    }

    const f = grahaFrame(positions, s.graha);
    // Outward along the radius, so a district sits outside its planet.
    const ux = Math.cos(f.angle);
    const uz = -Math.sin(f.angle);
    const out = s.out ?? 0;

    return {
      id: s.id,
      label: s.label,
      title: s.title,
      target: {
        x: f.x + ux * out - Math.sin(f.angle) * (s.along ?? 0),
        y: f.y + (s.lift ?? 0),
        z: f.z + uz * out - Math.cos(f.angle) * (s.along ?? 0),
      },
      distance: s.distance,
      // yaw is measured from the orbit's tangent, so "looking along the river"
      // stays true as the planet moves round the wheel.
      yaw: f.angle + Math.PI + (s.yawOffset ?? 0),
      pitch: s.pitch,
      fov: s.fov,
    };
  });
}


/**
 * What stands behind each door.
 *
 * The tour is a way INTO the site, not a replacement for it: every stop has to
 * hand you somewhere real to go. These are the actual destinations that exist
 * today, with the plain-language label a visitor needs to choose one. Replace
 * the labels as the content grows; the paths are the contract.
 */
export const STOP_CONTENT = {
  journey: [
    { label: 'The mission', note: 'Why the foundation exists', path: '/about' },
    { label: 'Three streams', note: 'Kemetic, Orisha and Vedic teaching', path: '/about' },
  ],
  support: [
    { label: 'Give monthly', note: 'Sustain the workshops', path: '/support' },
    { label: 'One-time gift', note: 'Fund an herbal distribution', path: '/support' },
  ],
  community: [
    { label: 'The Unity Circle', note: 'Monthly gathering', path: '/community' },
    { label: 'Events', note: 'What is coming up next', path: '/community' },
  ],
  wellness: [
    { label: 'Sea Moss', note: 'Gels, capsules, powders', path: '/offerings' },
    { label: 'Women�s Wellness', note: 'Womb teas, tinctures, care', path: '/offerings' },
    { label: 'Sacred Plants', note: 'Single-herb tinctures and teas', path: '/offerings' },
    { label: 'Everything else', note: 'The full catalogue', path: '/offerings' },
  ],
  wisdom: [
    { label: 'The journal', note: 'Essays and teaching', path: '/wisdom' },
    { label: 'Cosmic deep dive', note: 'Long-form study', path: '/cosmic-deep-dive' },
  ],
  guides: [
    { label: 'Sea Moss', note: 'How to prepare and take it', path: '/guides/sea-moss' },
    { label: 'St John�s Bush', note: 'Tea and tincture', path: '/guides/st-johns-bush-tea' },
    { label: 'Rohini Tincture', note: 'With the cycle chart', path: '/guides/rohini-tincture' },
    { label: 'All guides', note: 'Twelve plants, one page each', path: '/healing-guides' },
  ],
  planetary: [
    { label: 'Tonight�s sky', note: 'The nine grahas, now', path: '/sky-watch' },
    { label: 'The deep dive', note: 'Read a chart properly', path: '/cosmic-deep-dive' },
  ],
};

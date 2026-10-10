/**
 * Jyotisha Loka for Nefer Kali Healing: the world's recipe, and the two layout
 * helpers the world kit needs — copied from the Per Ankh realm's world kit
 * (worlds/recipes.js), where the world was first built.
 */

/**
 * Jyotisha Loka, the world of light: the world of the Jyotish course, taught by
 * Saseshmu Ra Herut (server/content/courses/jyotish). An island
 * adrift in a turning, psychedelic cosmos, ringed by the sidereal zodiac, with the
 * nine grahas orbiting at their real positions right now (../jyotish/). A golden
 * orrery stands at its heart; the Moon's altar and the birth-star altar flank the
 * way in.
 */
export const JYOTISHA_LOKA = {
  id: 'jyotisha-loka',
  name: 'Jyotisha Loka',
  course: 'jyotish',
  special: 'jyotish',
  tagline: 'The world of light. The nine grahas wheel overhead where they truly stand tonight, through twelve signs and twenty-seven mansions. Three foundations of Jyotish — choose one.',
  sky: 'cosmos',
  radius: 84,
  spawn: { x: 0, z: 20, heading: Math.PI },
  portal: { x: 0, z: 30, label: 'Return to the Realm' },
  palette: {
    zenith: 0x05021a,
    horizon: 0x2a0b3e,
    fog: 0x120626,
    fogDensity: 0.0042,
    ground: 0x1a1236,
    groundHigh: 0x3a2a66,
    glow: 0xffd75a,
    glowCool: 0x7ffff0,
    ambient: 0x4a3a7a,
    key: 0xffe0b0,
  },
  terrain: { swell: 1.2, swellScale: 0.05, wallStart: 0.86, wallHeight: -40 },
  centerpiece: { kind: 'graha-orrery', x: 0, z: -4, radius: 7, height: 14 },
  altars: { moon: { x: 16, z: 8 }, birth: { x: -16, z: 8 } },
  /**
   * The flying carpet (world-carpet.js), parked by the way in. In the air it may go
   * out past the outermost orbit (Rāhu and Ketu at 252 m, ../jyotish/scene.js
   * ORBITS), so every graha can be flown up to.
   */
  carpet: { park: { x: 7, z: 23, heading: Math.PI }, flightRadius: 290 },
  sites: [
    { module: 'jyotish', name: 'The Observatory of Light', theme: 'observatory', x: 0, z: -52, facing: 0 },
    { module: 'nakshatras', name: 'The Ring of Mansions', theme: 'mansions', x: 46, z: 27, facing: -2.1 },
    { module: 'panchanga', name: 'The Almanac Wheel', theme: 'almanac', x: -46, z: 27, facing: 2.1 },
  ],
};

/**
 * Where a site's pieces stand. The shrine sits behind the centre, and the three
 * lesson stations in an arc in front of it, facing the way the site faces, so a
 * member walks up the arc in order and reaches the shrine last.
 * @returns {{shrine: {x:number,z:number}, stations: Array<{x:number,z:number,index:number}>, plaque: {x:number,z:number}}}
 */
export function layoutSite(site, { lessons = 3, spread = 9, depth = 7 } = {}) {
  const f = site.facing || 0;
  // "Forward" is the direction the site faces: toward the member arriving.
  const fx = Math.sin(f);
  const fz = Math.cos(f);
  const rx = Math.cos(f);
  const rz = -Math.sin(f);
  const at = (forward, right) => ({ x: site.x + fx * forward + rx * right, z: site.z + fz * forward + rz * right });
  const stations = [];
  for (let i = 0; i < lessons; i++) {
    const t = lessons === 1 ? 0 : i / (lessons - 1) - 0.5; // -0.5 .. 0.5
    const p = at(depth - Math.abs(t) * 3, t * spread * 2);
    stations.push({ ...p, index: i });
  }
  return { shrine: at(-depth * 0.6, 0), stations, plaque: at(depth + 6, 0) };
}

/**
 * Ground height in a world, from its recipe: gentle swells, flattened under each
 * site so the stations stand level, rising into a wall at the edge.
 */
export function makeHeightAt(recipe) {
  const t = recipe.terrain || {};
  const swell = t.swell ?? 1;
  const k = t.swellScale ?? 0.05;
  const wallStart = (t.wallStart ?? 0.85) * recipe.radius;
  const wallHeight = t.wallHeight ?? 20;
  const flats = (recipe.sites || []).map((s) => ({ x: s.x, z: s.z, r: 16 }));
  if (recipe.spawn) flats.push({ x: recipe.spawn.x, z: recipe.spawn.z, r: 10 });
  if (recipe.portal) flats.push({ x: recipe.portal.x, z: recipe.portal.z, r: 8 });
  // A centrepiece that needs level ground (a pool of still water) gets it.
  if (recipe.centerpiece?.flat) flats.push({ x: recipe.centerpiece.x, z: recipe.centerpiece.z, r: (recipe.centerpiece.radius ?? 8) + 4 });
  return (x, z) => {
    let h = Math.sin(x * k) * Math.cos(z * k * 1.21) * swell + Math.sin((x + z) * k * 2.3) * swell * 0.35;
    for (const f of flats) {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d < f.r * 1.6) {
        const w = d <= f.r ? 1 : 1 - (d - f.r) / (f.r * 0.6);
        h *= 1 - w * w * (3 - 2 * w);
      }
    }
    const r = Math.hypot(x, z);
    if (r > wallStart) {
      const u = Math.min(1, (r - wallStart) / (recipe.radius - wallStart));
      h += wallHeight * u * u;
    }
    return h;
  };
}

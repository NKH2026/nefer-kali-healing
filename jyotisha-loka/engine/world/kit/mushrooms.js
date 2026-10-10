/**
 * The fungi of the realm, as real species — docs/realm-style-guide.md §5.
 *
 * Each builder draws one species recognisably, in its real colours, and adds light
 * only where the guide puts it: gills, warts, spine tips, a growing edge, ridges,
 * the pits of a morel. Every one returns a Group standing on y = 0, about 1 m tall at
 * `scale` 1, so a caller sizes a giant by scaling it.
 *
 * Built from lathed profiles and canvas textures: no downloads, a few hundred to
 * ~1.5k triangles each.
 */
import * as THREE from 'three';
import { PALETTE, GLOW, fungusFlesh, lifeGlow } from '../../style.js';

const TAU = Math.PI * 2;
const F = PALETTE.fungus;

/** A lathed solid with a vertical vertex-colour gradient. */
function lathe(points, segments, colourAt) {
  const geo = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
  if (colourAt) {
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    geo.computeBoundingBox();
    const { min, max } = geo.boundingBox;
    for (let i = 0; i < pos.count; i++) {
      colourAt((pos.getY(i) - min.y) / (max.y - min.y || 1), c, pos.getX(i), pos.getZ(i));
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  geo.computeVertexNormals();
  return geo;
}

function canvas(w, h) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Radial gill lines: dark on the base map, light on the glow map. */
function gillMaps({ lines = 110, base = '#2a1a24', line = '#4a3240', glow = 'rgba(90,160,255,0.95)' } = {}) {
  const size = 256;
  const b = canvas(size, size);
  const g = canvas(size, size);
  if (!b) return null;
  const bc = b.getContext('2d');
  const gc = g.getContext('2d');
  bc.fillStyle = base;
  bc.fillRect(0, 0, size, size);
  gc.fillStyle = '#000';
  gc.fillRect(0, 0, size, size);
  const c = size / 2;
  for (let i = 0; i < lines; i++) {
    const a = (i / lines) * TAU;
    const inner = i % 3 === 0 ? 0.2 : 0.35;
    bc.strokeStyle = line;
    bc.lineWidth = 1.4;
    bc.beginPath();
    bc.moveTo(c + Math.cos(a) * c * inner, c + Math.sin(a) * c * inner);
    bc.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c);
    bc.stroke();
    if (i % 2 === 0) {
      gc.strokeStyle = glow;
      gc.lineWidth = 1;
      gc.beginPath();
      gc.moveTo(c + Math.cos(a) * c * 0.45, c + Math.sin(a) * c * 0.45);
      gc.lineTo(c + Math.cos(a) * c * 0.97, c + Math.sin(a) * c * 0.97);
      gc.stroke();
    }
  }
  const map = new THREE.CanvasTexture(b);
  map.colorSpace = THREE.SRGBColorSpace;
  const emissiveMap = new THREE.CanvasTexture(g);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

/** The underside of a cap: a ring of gills facing down. */
function gillDisc(inner, outer, y, maps, glowLevel = GLOW.life) {
  const m = new THREE.MeshStandardMaterial({
    color: maps ? 0xffffff : 0x2a1a24,
    map: maps?.map ?? null,
    emissive: PALETTE.life.cyan,
    emissiveMap: maps?.emissiveMap ?? null,
    emissiveIntensity: maps ? glowLevel : 0.1,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  m.userData.style = 'fungus';
  const disc = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 40, 1), m);
  disc.rotation.x = Math.PI / 2;
  disc.position.y = y;
  return disc;
}

function finish(g, name) {
  g.name = name;
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

/* ── Psilocybe cubensis ───────────────────────────────────────────────────── */

export function cubensis({ scale = 1 } = {}) {
  const g = new THREE.Group();
  const stemC = new THREE.Color(F.cubensisStem);
  const bruise = new THREE.Color(0xb9c6e6);
  const stem = lathe([[0, 0], [0.07, 0.01], [0.075, 0.2], [0.06, 0.55], [0.055, 0.66], [0, 0.67]], 16,
    (t, c) => c.copy(bruise).lerp(stemC, Math.min(1, t * 3)));
  g.add(new THREE.Mesh(stem, fungusFlesh(0xffffff, { vertexColors: true })));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.012, 6, 20), fungusFlesh(0x3a2633, { roughness: 0.9 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.55;
  g.add(ring);
  const cc = new THREE.Color(F.cubensisCapDark);
  const cm = new THREE.Color(F.cubensisCap);
  const rim = new THREE.Color(0xe7c08a);
  const cap = lathe([[0.24, -0.01], [0.27, 0.02], [0.26, 0.08], [0.2, 0.15], [0.11, 0.2], [0.04, 0.24], [0, 0.25]], 28,
    (t, c) => (t > 0.5 ? c.copy(cm).lerp(cc, (t - 0.5) / 0.5) : c.copy(rim).lerp(cm, t / 0.5)));
  const capMesh = new THREE.Mesh(cap, fungusFlesh(0xffffff, { vertexColors: true, wet: true, roughness: 0.45 }));
  capMesh.position.y = 0.64;
  g.add(capMesh);
  g.add(gillDisc(0.06, 0.25, 0.63, gillMaps()));
  g.scale.setScalar(scale);
  return finish(g, 'cubensis');
}

/* ── Amanita muscaria ────────────────────────────────────────────────────── */

export function flyAgaric({ scale = 1, seed = 1 } = {}) {
  const g = new THREE.Group();
  // Stem with a bulbous base (the volva) and a hanging skirt.
  const stem = lathe([[0, 0], [0.12, 0.01], [0.13, 0.06], [0.08, 0.14], [0.065, 0.45], [0.06, 0.72], [0, 0.73]], 20);
  g.add(new THREE.Mesh(stem, fungusFlesh(F.agaricWart, { roughness: 0.7 })));
  const skirt = new THREE.Mesh(lathe([[0.06, 0.62], [0.1, 0.58], [0.13, 0.52]], 20), fungusFlesh(F.agaricWart, { roughness: 0.75 }));
  skirt.material.side = THREE.DoubleSide;
  g.add(skirt);
  // Cap: red, flattening with age, a paler rim.
  const red = new THREE.Color(F.agaricRed);
  const rimC = new THREE.Color(0xe0602a);
  const capProfile = [[0.3, 0], [0.32, 0.04], [0.29, 0.1], [0.2, 0.16], [0.08, 0.19], [0, 0.2]];
  const cap = lathe(capProfile, 32,
    (t, c) => c.copy(rimC).lerp(red, Math.min(1, t * 2.5)));
  const capMesh = new THREE.Mesh(cap, fungusFlesh(0xffffff, { vertexColors: true, wet: true, roughness: 0.4 }));
  capMesh.position.y = 0.7;
  g.add(capMesh);
  g.add(gillDisc(0.07, 0.31, 0.7, gillMaps({ base: '#efe6d2', line: '#d8ccb4', glow: 'rgba(255,240,210,0.35)' }), 0.25));
  // Warts: white, raised, scattered over the cap, faintly lit.
  const wartGeo = new THREE.SphereGeometry(0.022, 6, 4);
  const warts = new THREE.InstancedMesh(wartGeo, lifeGlow(F.agaricWart, 0.35, { roughness: 0.8 }), 40);
  const m4 = new THREE.Matrix4();
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let n = 0;
  for (let i = 0; i < 40; i++) {
    const a = rnd() * TAU;
    const r = Math.sqrt(rnd()) * 0.28;
    // Height of the cap's upper surface at radius r, read off its own profile, so
    // the warts sit ON the cap rather than sinking into it.
    const y = 0.7 + capHeightAt(capProfile, r);
    m4.compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), new THREE.Quaternion(), new THREE.Vector3(1, 0.55, 1).multiplyScalar(0.7 + rnd() * 0.7));
    warts.setMatrixAt(n++, m4);
  }
  warts.count = n;
  g.add(warts);
  g.scale.setScalar(scale);
  return finish(g, 'fly-agaric');
}

/** The upper surface's height at radius r, interpolated along a lathe profile's top half. */
function capHeightAt(profile, r) {
  // The top runs from the widest point inward to the centre.
  let widest = 0;
  for (let i = 1; i < profile.length; i++) if (profile[i][0] > profile[widest][0]) widest = i;
  const top = profile.slice(widest);
  for (let i = 0; i < top.length - 1; i++) {
    const [r0, y0] = top[i];
    const [r1, y1] = top[i + 1];
    if (r <= r0 && r >= r1) return y0 + ((y1 - y0) * (r0 - r)) / (r0 - r1 || 1);
  }
  return top[top.length - 1][1];
}

/* ── Hericium erinaceus ──────────────────────────────────────────────────── */

export function lionsMane({ scale = 1, seed = 2 } = {}) {
  const g = new THREE.Group();
  // The body: a soft, slightly flattened mound, attached at the top.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), fungusFlesh(F.lionsMane, { roughness: 0.85 }));
  body.scale.set(1, 0.7, 0.9);
  body.position.y = 0.62;
  g.add(body);
  // Spines: a cascade hanging from the lower half, longer toward the middle.
  // Four-sided spines and eight-sided tips: at this size no one can count the
  // facets, and 110 of them still read as a mane.
  const spineGeo = new THREE.ConeGeometry(0.013, 1, 4, 1, true).translate(0, -0.5, 0);
  const COUNT = 110;
  const spines = new THREE.InstancedMesh(spineGeo, fungusFlesh(F.lionsMane, { roughness: 0.75 }), COUNT);
  const tips = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.013, 0), lifeGlow(PALETTE.life.cyan, GLOW.life), COUNT);
  const m4 = new THREE.Matrix4();
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < COUNT; i++) {
    const a = rnd() * TAU;
    const r = Math.sqrt(rnd()) * 0.26;
    const len = 0.18 + (1 - r / 0.26) * 0.32 + rnd() * 0.08;
    const top = new THREE.Vector3(Math.cos(a) * r, 0.52, Math.sin(a) * r * 0.9);
    m4.compose(top, new THREE.Quaternion(), new THREE.Vector3(1, len, 1));
    spines.setMatrixAt(i, m4);
    m4.makeTranslation(top.x, top.y - len, top.z);
    tips.setMatrixAt(i, m4);
  }
  g.add(spines, tips);
  // A short stalk it hangs from.
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.3, 10), fungusFlesh(0xd9cfbd, { roughness: 0.9 }));
  stalk.position.y = 0.85;
  g.add(stalk);
  g.scale.setScalar(scale);
  return finish(g, 'lions-mane');
}

/* ── Ganoderma lingzhi ───────────────────────────────────────────────────── */

/** One lacquered bracket: kidney-shaped, with growth rings and a pale growing edge. */
function reishiBracket(width, rngA) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(width / 2, 24, 8, 0, TAU, 0, Math.PI / 2);
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  const dark = new THREE.Color(F.reishi);
  const mid = new THREE.Color(0xa8441c);
  const edge = new THREE.Color(F.reishiEdge);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    const r = Math.hypot(x, z) / (width / 2);
    // Kidney: pull the back (−z) in where it meets the wood.
    if (z < 0) z *= 0.45;
    y *= 0.22;
    // Growth rings as small ridges.
    y += Math.sin(r * 22) * 0.004 * width;
    p.setXYZ(i, x, y, z);
    // Dark lacquer at the centre, redder outward, pale at the growing edge.
    if (r > 0.9) c.copy(mid).lerp(edge, (r - 0.9) / 0.1);
    else c.copy(dark).lerp(mid, r / 0.9);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, fungusFlesh(0xffffff, { vertexColors: true, wet: true, roughness: 0.25 })));
  // The growing edge, lit: a thin glowing rim along the front.
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 17 }, (_, k) => {
      const a = Math.PI * 0.05 + (k / 16) * Math.PI * 0.9;
      return new THREE.Vector3(Math.cos(a) * width / 2, 0.002, Math.sin(a) * width / 2);
    }),
  );
  const rim = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.006 * width * 2, 3, false), lifeGlow(F.reishiEdge, 0.9));
  g.add(rim);
  void rngA;
  return g;
}

export function reishi({ scale = 1 } = {}) {
  const g = new THREE.Group();
  // The stump the brackets grow from.
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.8, 12), fungusFlesh(0x3a2a1c, { roughness: 1 }));
  stump.position.y = 0.4;
  g.add(stump);
  [[0.55, 0.62, 0], [0.45, 0.4, 2.1], [0.38, 0.22, 4.2]].forEach(([w, y, a]) => {
    const b = reishiBracket(w);
    b.rotation.y = a;
    b.position.set(Math.sin(a) * 0.14, y, Math.cos(a) * 0.14);
    g.add(b);
  });
  g.scale.setScalar(scale);
  return finish(g, 'reishi');
}

/* ── Cantharellus cibarius ───────────────────────────────────────────────── */

export function chanterelle({ scale = 1, seed = 3 } = {}) {
  const g = new THREE.Group();
  const gold = new THREE.Color(F.chanterelle);
  const deep = new THREE.Color(0xc77d1e);
  // A funnel: stem flaring straight into a wavy, cupped cap.
  const geo = lathe([[0, 0], [0.06, 0.01], [0.07, 0.25], [0.12, 0.42], [0.22, 0.52], [0.28, 0.55], [0.27, 0.57], [0.18, 0.55], [0, 0.5]], 36,
    (t, c) => c.copy(deep).lerp(gold, t));
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const y = p.getY(i);
    const r = Math.hypot(x, z);
    // A wavy rim: the edge rises and falls round the cap.
    if (r > 0.18) p.setY(i, y + Math.sin(Math.atan2(z, x) * 6 + seed) * 0.025 * ((r - 0.18) / 0.1));
  }
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, fungusFlesh(0xffffff, { vertexColors: true, roughness: 0.55 })));
  // False gills: forked ridges running down from the rim onto the stem, glowing.
  const ridgeMat = lifeGlow(0xffd27a, GLOW.life * 0.8);
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * TAU;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.265, 0.535, Math.sin(a) * 0.265),
      new THREE.Vector3(Math.cos(a) * 0.17, 0.465, Math.sin(a) * 0.17),
      new THREE.Vector3(Math.cos(a) * 0.1, 0.36, Math.sin(a) * 0.1),
      new THREE.Vector3(Math.cos(a) * 0.074, 0.26, Math.sin(a) * 0.074),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.005, 3, false), ridgeMat));
  }
  g.scale.setScalar(scale);
  return finish(g, 'chanterelle');
}

/* ── Morchella esculenta ─────────────────────────────────────────────────── */

/** A honeycomb: pale ridges round dark pits, and a glow map lighting the pits. */
export function morelMaps() {
  const W = 256;
  const H = 256;
  const b = canvas(W, H);
  const g = canvas(W, H);
  if (!b) return null;
  const bc = b.getContext('2d');
  const gc = g.getContext('2d');
  bc.fillStyle = '#c4a682';
  bc.fillRect(0, 0, W, H);
  gc.fillStyle = '#000';
  gc.fillRect(0, 0, W, H);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 8; col++) {
      const cx = (col + 0.5 + (row % 2) * 0.5) * (W / 8) + (rnd() - 0.5) * 6;
      const cy = (row + 0.5) * (H / 7) + (rnd() - 0.5) * 6;
      const rx = W / 8 * 0.38;
      const ry = H / 7 * 0.36;
      bc.fillStyle = '#4a3624';
      bc.beginPath();
      bc.ellipse(cx, cy, rx, ry, 0, 0, TAU);
      bc.fill();
      const grad = gc.createRadialGradient(cx, cy, 0, cx, cy, ry);
      grad.addColorStop(0, 'rgba(110,200,255,0.9)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      gc.fillStyle = grad;
      gc.beginPath();
      gc.ellipse(cx, cy, rx, ry, 0, 0, TAU);
      gc.fill();
    }
  }
  const map = new THREE.CanvasTexture(b);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  const emissiveMap = new THREE.CanvasTexture(g);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = THREE.RepeatWrapping;
  return { map, emissiveMap };
}

export function morel({ scale = 1 } = {}) {
  const g = new THREE.Group();
  const stem = lathe([[0, 0], [0.09, 0.01], [0.085, 0.12], [0.075, 0.3], [0.08, 0.34], [0, 0.35]], 16);
  g.add(new THREE.Mesh(stem, fungusFlesh(0xefe2c8, { roughness: 0.8 })));
  const headGeo = lathe([[0.1, 0], [0.14, 0.06], [0.15, 0.18], [0.13, 0.32], [0.09, 0.44], [0.04, 0.52], [0, 0.55]], 32);
  // Pits and ridges in the surface too, so the honeycomb catches light.
  const p = headGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const y = p.getY(i);
    const a = Math.atan2(z, x);
    const dent = 0.88 + 0.12 * Math.abs(Math.sin(a * 4)) * Math.abs(Math.sin(y * 40));
    p.setXYZ(i, x * dent, y, z * dent);
  }
  headGeo.computeVertexNormals();
  const maps = morelMaps();
  const headMat = new THREE.MeshStandardMaterial({
    color: maps ? 0xffffff : F.morel,
    map: maps?.map ?? null,
    emissive: maps ? 0xffffff : 0x000000,
    emissiveMap: maps?.emissiveMap ?? null,
    emissiveIntensity: maps ? GLOW.life : 0,
    roughness: 0.85,
  });
  headMat.userData.style = 'fungus';
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.33;
  g.add(head);
  g.scale.setScalar(scale);
  return finish(g, 'morel');
}

/** Every species, by id, for scattering and for the tests. */
export const SPECIES = { cubensis, flyAgaric, lionsMane, reishi, chanterelle, morel };

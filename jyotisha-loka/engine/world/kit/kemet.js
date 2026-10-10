/**
 * The Kemetic architecture kit: papyrus-bundle columns, obelisks, a pylon gateway
 * and stepped platforms, built to docs/realm-style-guide.md.
 *
 * Every piece is real Egyptian form, not a box with a colour: battered walls that
 * lean inward as they rise, the cavetto cornice that curls out along the top, torus
 * mouldings on the edges, columns made as bundles of eight papyrus stems with bands
 * at the neck. Sandstone is the scanned masonry (style.sandstone), gold is metal,
 * and only the writing glows.
 *
 * All geometry is UV'd in metres, so the scanned blocks are the same real size on a
 * column and on a wall. Each builder returns a Group standing on y = 0.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sandstone, gold, electrum, PALETTE, GLOW } from '../../style.js';
import { glyphBandTexture } from '../textures.js';

/** Rescale a geometry's UVs so one unit of UV is one metre (approximately). */
export function metreUVs(geo, uScale, vScale) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * uScale, uv.getY(i) * vScale);
  uv.needsUpdate = true;
  return geo;
}

/** A glowing inscription band, cyan for knowledge or amber for the sacred. */
function glyphMaterial({ cols, rows, sacred = false, seed = 1 }) {
  const tex = glyphBandTexture({ cols, rows, hue: sacred ? 40 : 172, seed });
  if (!tex) return null;
  const m = new THREE.MeshStandardMaterial({
    map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: GLOW.glyph,
    transparent: true, depthWrite: false, roughness: 0.85, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2,
  });
  m.userData.style = 'glyph';
  return m;
}

/* ── papyrus column ───────────────────────────────────────────────────────── */

/**
 * A column of eight bound papyrus stems: each stem a rounded lobe, the bundle
 * narrowing at the foot as real ones do, three gold bands at the neck, and a
 * capital that is either a closed bud or an open umbel.
 *
 * @param {{height?:number, radius?:number, capital?:'closed'|'open', glyphs?:boolean, seed?:number}} [o]
 */
export function papyrusColumn({ height = 7, radius = 0.55, capital = 'closed', glyphs = true, seed = 1 } = {}) {
  const g = new THREE.Group();
  g.name = 'papyrus-column';
  const stone = sandstone();

  // Base: a low round drum.
  const base = new THREE.Mesh(metreUVs(new THREE.CylinderGeometry(radius * 1.4, radius * 1.5, 0.3, 32), 2 * Math.PI * radius * 1.4, 0.3), stone);
  base.position.y = 0.15;
  g.add(base);

  // Shaft: the bundle.
  const shaftH = height * 0.74;
  // 48 around is enough for eight lobes; the height only needs rows where the foot
  // pinches, so 6 rather than 16. The column is repeated a dozen times a temple.
  const shaft = new THREE.CylinderGeometry(radius, radius, shaftH, 48, 6, false);
  const p = shaft.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const t = (y + shaftH / 2) / shaftH; // 0 foot … 1 neck
    const a = Math.atan2(z, x);
    const lobe = 0.86 + 0.14 * Math.pow(Math.abs(Math.cos(a * 4)), 0.6); // eight stems
    const taper = 0.82 + 0.18 * Math.min(1, t * 4); // pinched at the foot
    const r = Math.hypot(x, z) || 1;
    const k = (radius * lobe * taper) / r;
    p.setXYZ(i, x * k, y, z * k);
  }
  shaft.computeVertexNormals();
  metreUVs(shaft, 2 * Math.PI * radius, shaftH);
  const shaftMesh = new THREE.Mesh(shaft, stone);
  shaftMesh.position.y = 0.3 + shaftH / 2;
  g.add(shaftMesh);

  // Neck: three gold bands.
  for (let b = 0; b < 3; b++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.92, 0.045, 5, 28), gold());
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.3 + shaftH - 0.12 - b * 0.16;
    g.add(band);
  }

  // Capital.
  const capH = height * 0.2;
  const profile = capital === 'open'
    ? [[radius * 0.82, 0], [radius * 0.9, capH * 0.25], [radius * 1.3, capH * 0.6], [radius * 1.75, capH * 0.92], [radius * 1.8, capH]]
    : [[radius * 0.82, 0], [radius * 1.15, capH * 0.3], [radius * 1.2, capH * 0.55], [radius * 0.95, capH * 0.85], [radius * 0.7, capH]];
  const capGeo = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 40);
  metreUVs(capGeo, 2 * Math.PI * radius * 1.2, capH);
  const cap = new THREE.Mesh(capGeo, stone);
  cap.position.y = 0.3 + shaftH;
  g.add(cap);

  // Abacus: the square block the beam sits on.
  const abW = capital === 'open' ? radius * 2.6 : radius * 1.8;
  const abacus = new THREE.Mesh(metreUVs(new THREE.BoxGeometry(abW, 0.32, abW), abW, 0.32), stone);
  abacus.position.y = 0.3 + shaftH + capH + 0.16;
  g.add(abacus);

  // A band of writing round the middle of the shaft.
  if (glyphs) {
    const mat = glyphMaterial({ cols: 10, rows: 2, seed });
    if (mat) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, 1.1, 48, 1, true), mat);
      ring.position.y = 0.3 + shaftH * 0.55;
      ring.userData.noAO = true;
      g.add(ring);
    }
  }

  g.traverse((o) => {
    if (o.isMesh && !o.material.transparent) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  g.userData.height = 0.3 + shaftH + capH + 0.32;
  return g;
}

/* ── obelisk ─────────────────────────────────────────────────────────────── */

/**
 * A tapering four-sided shaft on a stepped plinth, a column of writing down each
 * face, and an electrum pyramidion that catches the night.
 */
export function obelisk({ height = 14, base = 1.3, seed = 3 } = {}) {
  const g = new THREE.Group();
  g.name = 'obelisk';
  const stone = sandstone({ tint: PALETTE.stone.sandDeep });

  // Plinth: two steps.
  for (let i = 0; i < 2; i++) {
    const w = base * (2.6 - i * 0.6);
    const step = new THREE.Mesh(metreUVs(new THREE.BoxGeometry(w, 0.45, w), w, 0.45), sandstone());
    step.position.y = 0.225 + i * 0.45;
    g.add(step);
  }
  const plinthTop = 0.9;

  // Shaft: a square frustum.
  const shaftH = height * 0.9;
  const shaft = new THREE.CylinderGeometry(base * 0.62 * Math.SQRT2 / 2 * 1.0, base * Math.SQRT2 / 2, shaftH, 4, 1, false);
  shaft.rotateY(Math.PI / 4);
  metreUVs(shaft, base * 4, shaftH);
  // Non-indexed, so each face gets its own normals: an obelisk has crisp corners,
  // and shared vertices would shade it like a rounded post.
  const flatShaft = shaft.toNonIndexed();
  flatShaft.computeVertexNormals();
  const shaftMesh = new THREE.Mesh(flatShaft, stone);
  shaftMesh.position.y = plinthTop + shaftH / 2;
  g.add(shaftMesh);

  // Pyramidion.
  const tip = new THREE.Mesh(new THREE.ConeGeometry(base * 0.62 * Math.SQRT2 / 2, height * 0.1, 4), electrum());
  tip.rotation.y = Math.PI / 4;
  tip.position.y = plinthTop + shaftH + height * 0.05;
  g.add(tip);

  // A column of writing down each face, set just proud of the stone.
  const mat = glyphMaterial({ cols: 1, rows: 12, seed });
  if (mat) {
    for (let f = 0; f < 4; f++) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(base * 0.42, shaftH * 0.72), mat);
      const a = (f * Math.PI) / 2;
      // Mid-height half-width of the frustum, so the panel sits on the face.
      const half = (base * 0.62 + base) / 4;
      const lean = Math.atan(((base - base * 0.62) / 2) / shaftH);
      panel.position.set(Math.sin(a) * (half + 0.02), plinthTop + shaftH * 0.48, Math.cos(a) * (half + 0.02));
      // Turn to face outward first, then lean back with the face's own taper.
      panel.rotation.order = 'YXZ';
      panel.rotation.set(-lean, a, 0);
      panel.userData.noAO = true;
      g.add(panel);
    }
  }

  g.traverse((o) => {
    if (o.isMesh && !o.material.transparent) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  g.userData.height = plinthTop + shaftH + height * 0.1;
  return g;
}

/* ── pylon gateway ───────────────────────────────────────────────────────── */

/**
 * A box whose four side faces lean inward as they rise (the "batter" of every
 * Egyptian wall). `batter` is how far each side moves in over the full height.
 */
function batteredBox(w, h, d, batter) {
  const geo = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0) {
      const x = p.getX(i);
      const z = p.getZ(i);
      p.setXYZ(i, x - Math.sign(x) * batter, p.getY(i), z - Math.sign(z) * batter * 0.5);
    }
  }
  geo.computeVertexNormals();
  return metreUVs(geo, Math.max(w, d), h);
}

/**
 * The cavetto cornice: a cross-section that curls up and out, extruded along a
 * wall's length. `len` along x; it sits on y = 0.
 */
function cavetto(len, depth, height) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0, height * 0.18);
  // the curl: a quarter curve out and up
  s.quadraticCurveTo(depth * 0.15, height * 0.95, depth, height);
  s.lineTo(depth, height * 1.08);
  s.lineTo(-depth * 0.25, height * 1.08);
  s.lineTo(-depth * 0.25, 0);
  s.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 8 });
  // Profile is in XY with extrusion along +Z; turn it so the wall runs along X and
  // the curl leans out toward +Z.
  geo.rotateY(-Math.PI / 2);
  geo.translate(len / 2, 0, 0);
  return metreUVs(geo, 1, 1);
}

/** The winged sun disc that crowns every temple door, in gold. */
function wingedSun(span) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(span * 0.09, span * 0.09, span * 0.03, 32), gold({ tone: PALETTE.gold.electrum }));
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  for (const side of [-1, 1]) {
    const wing = new THREE.Shape();
    wing.moveTo(0, span * 0.05);
    wing.quadraticCurveTo(side * span * 0.25, span * 0.1, side * span * 0.5, span * 0.03);
    wing.lineTo(side * span * 0.46, -span * 0.03);
    wing.quadraticCurveTo(side * span * 0.25, 0, 0, -span * 0.04);
    wing.lineTo(0, span * 0.05);
    const geo = new THREE.ExtrudeGeometry(wing, { depth: span * 0.015, bevelEnabled: false });
    const m = new THREE.Mesh(geo, gold());
    m.position.z = -span * 0.008;
    g.add(m);
  }
  return g;
}

/**
 * A pylon: two battered towers flanking a doorway, each crowned by a cavetto
 * cornice over a torus roll, the door under a smaller cornice with the winged sun,
 * and a panel of writing on each tower's face. Faces +Z. The door is open: the
 * caller adds colliders for the towers only, so it can be walked through.
 *
 * @returns {THREE.Group & {userData: {towers: Array<{x:number, z:number, w:number, d:number}>}}}
 */
export function pylon({ width = 22, height = 13, depth = 5, door = 4.4, seed = 5 } = {}) {
  const g = new THREE.Group();
  g.name = 'pylon';
  const stone = sandstone();
  const towerW = (width - door) / 2;
  const batter = towerW * 0.12;
  const towers = [];

  for (const side of [-1, 1]) {
    const cx = side * (door / 2 + towerW / 2);
    const tower = new THREE.Mesh(batteredBox(towerW, height, depth, batter), stone);
    tower.position.set(cx, height / 2, 0);
    g.add(tower);
    towers.push({ x: cx, z: 0, w: towerW, d: depth });

    // Torus roll along the top edge, and the cornice above it.
    const topW = towerW - batter * 2;
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, topW + 0.2, 12), stone);
    roll.rotation.z = Math.PI / 2;
    roll.position.set(cx, height - 0.05, depth / 2 - batter * 0.5 + 0.05);
    g.add(roll);
    const cornice = new THREE.Mesh(cavetto(topW + 0.6, 0.9, 1.4), stone);
    // `cavetto` is already centred on its length.
    cornice.position.set(cx, height + 0.1, depth / 2 - batter * 0.5 - 0.2);
    g.add(cornice);
    const roof = new THREE.Mesh(metreUVs(new THREE.BoxGeometry(topW + 0.6, 0.3, depth - batter + 0.9), topW, depth), stone);
    roof.position.set(cx, height + 0.1 + 1.4 * 1.08 - 0.15, -0.2);
    g.add(roof);

    // The writing on the tower's face.
    const mat = glyphMaterial({ cols: 4, rows: 7, seed: seed + side, sacred: false });
    if (mat) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(towerW * 0.62, height * 0.6), mat);
      const lean = Math.atan((batter * 0.5) / height);
      panel.rotation.x = -lean;
      panel.position.set(cx, height * 0.48, depth / 2 - batter * 0.24 + 0.03);
      panel.userData.noAO = true;
      g.add(panel);
    }
  }

  // The doorway: jambs, a lintel and its own small cornice, and the winged sun.
  const doorH = height * 0.62;
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(metreUVs(new THREE.BoxGeometry(0.7, doorH, depth * 0.8), 0.7, doorH), stone);
    jamb.position.set(side * (door / 2 - 0.35), doorH / 2, 0.1);
    g.add(jamb);
  }
  const lintel = new THREE.Mesh(metreUVs(new THREE.BoxGeometry(door + 0.6, 1.1, depth * 0.8), door, 1.1), stone);
  lintel.position.set(0, doorH + 0.55, 0.1);
  g.add(lintel);
  const doorCornice = new THREE.Mesh(cavetto(door + 1, 0.55, 0.8), stone);
  doorCornice.position.set(0, doorH + 1.1, depth * 0.4 - 0.1);
  g.add(doorCornice);
  const sun = wingedSun(door * 1.25);
  sun.position.set(0, doorH + 0.55, depth * 0.4 + 0.12);
  g.add(sun);

  g.traverse((o) => {
    if (o.isMesh && !o.material.transparent) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  g.userData.towers = towers;
  g.userData.height = height + 1.6;
  return g;
}

/* ── stepped platform ────────────────────────────────────────────────────── */

/** A stepped sandstone platform, `steps` high, top at y = steps * rise. */
export function steppedPlatform({ width = 20, depth = 20, steps = 3, rise = 0.4, inset = 0.9 } = {}) {
  const g = new THREE.Group();
  const parts = [];
  for (let i = 0; i < steps; i++) {
    const w = width - i * inset * 2;
    const d = depth - i * inset * 2;
    const box = metreUVs(new THREE.BoxGeometry(w, rise, d), Math.max(w, d), rise);
    box.translate(0, rise / 2 + i * rise, 0);
    parts.push(box.toNonIndexed());
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts), sandstone({ tint: PALETTE.stone.sandDeep }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  g.userData.height = steps * rise;
  return g;
}

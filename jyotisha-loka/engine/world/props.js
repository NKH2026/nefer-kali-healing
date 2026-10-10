/**
 * Low-poly procedural props.
 *
 * Everything here is built from primitives with no external assets, so the
 * world is self-contained. Materials are cached by their parameters so that a
 * hundred gravestones share one material and one shader program.
 */
import * as THREE from 'three';
import { WORLD } from '../config.js';
import { registerParticleMaterial } from './particleScale.js';
import { surfaceMaps } from './textures.js';

const materialCache = new Map();

/**
 * Cached material factory.
 * @param {number} color
 */
export function mat(color, opts = {}) {
  const {
    emissive = 0x000000,
    emissiveIntensity = 1,
    roughness = 0.85,
    metalness = 0.05,
    flat = true,
    transparent = false,
    opacity = 1,
    blending = THREE.NormalBlending,
    side = THREE.FrontSide,
    depthWrite = true,
    /**
     * What this surface is made of — a key of `SURFACES` in `textures.js` — which
     * brings a normal and a roughness map with it. Opt-in rather than automatic: a
     * hundred props share each cached material, and a texture fetch on all of them,
     * including the glow and the glyph planes, is not something to do by default.
     */
    surface = null,
    /** How many times the surface maps repeat. The family's own grain is `scale`. */
    surfaceRepeat = 4,
  } = opts;

  const key = [
    color,
    emissive,
    emissiveIntensity,
    roughness,
    metalness,
    flat,
    transparent,
    opacity,
    blending,
    side,
    depthWrite,
    surface,
    surfaceRepeat,
  ].join('|');

  let m = materialCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      roughness,
      metalness,
      flatShading: flat,
      transparent,
      opacity,
      blending,
      side,
      depthWrite,
    });

    if (surface) {
      const maps = surfaceMaps(surface, surfaceRepeat);
      if (maps) {
        // A normal map is a lie without interpolated normals, and `flatShading: true`
        // throws them away — on a faceted prop it would be a texture fetch that changes
        // nothing at all. The roughness map is not the same thing: it modulates the
        // specular response, which flat shading still has. So one is gated on `flat`
        // and the other is not.
        if (!flat && maps.normal) {
          m.normalMap = maps.normal;
          m.normalScale.set(maps.strength, maps.strength);
        }
        if (maps.roughness) m.roughnessMap = maps.roughness;
      }
    }

    materialCache.set(key, m);
  }
  return m;
}

const geometryCache = new Map();
function cached(key, build) {
  let g = geometryCache.get(key);
  if (!g) {
    g = build();
    geometryCache.set(key, g);
  }
  return g;
}

const rnd = (seedRef) => {
  // Small deterministic PRNG so a given area always looks the same.
  seedRef.s = (seedRef.s * 1664525 + 1013904223) >>> 0;
  return seedRef.s / 4294967296;
};
export const makeRng = (seed = 1) => ({ s: seed >>> 0, next() { return rnd(this); }, range(a, b) { return a + rnd(this) * (b - a); } });

// ------------------------------------------------------------------ primitives

export function box(w, h, d, color, opts) {
  const g = cached(`box|${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
  return new THREE.Mesh(g, mat(color, opts));
}

export function cylinder(rTop, rBottom, h, color, opts = {}, seg = 8) {
  const g = cached(`cyl|${rTop}|${rBottom}|${h}|${seg}`, () => new THREE.CylinderGeometry(rTop, rBottom, h, seg));
  return new THREE.Mesh(g, mat(color, opts));
}

export function sphere(r, color, opts = {}, seg = 10) {
  const g = cached(`sph|${r}|${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(4, seg / 2)));
  return new THREE.Mesh(g, mat(color, opts));
}

export function cone(r, h, color, opts = {}, seg = 7) {
  const g = cached(`cone|${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg));
  return new THREE.Mesh(g, mat(color, opts));
}

export function crystal(size, color, opts = {}) {
  const g = cached(`oct|${size}`, () => new THREE.OctahedronGeometry(size, 0));
  return new THREE.Mesh(
    g,
    mat(color, { emissive: color, emissiveIntensity: 0.8, roughness: 0.25, metalness: 0.5, transparent: true, opacity: 0.92, ...opts }),
  );
}

// ----------------------------------------------------------------- area props

/**
 * An iron fence ring: posts with spikes, plus two horizontal rails.
 *
 * `gapAngle` / `gapSize` (radians) leave an opening for a gate. The rails are
 * built segment-by-segment between adjacent posts rather than as a full torus,
 * so the opening is a genuine hole -- the mesh and the collision ring then agree
 * on where you can walk through. Rails are instanced (a unit box scaled per
 * segment) so a whole fence costs four draw calls, not two hundred.
 */
export function fenceRing(
  radius,
  color,
  { count = 28, height = 1.5, gapAngle = null, gapSize = 0 } = {},
) {
  const group = new THREE.Group();
  const TAU = Math.PI * 2;

  const angleOf = (i) => (i / count) * TAU;
  const inGap = (a) => {
    if (gapAngle === null || gapSize <= 0) return false;
    const d = Math.abs((((a - gapAngle + Math.PI) % TAU) + TAU) % TAU - Math.PI);
    return d < gapSize / 2;
  };

  const posts = [];
  for (let i = 0; i < count; i++) {
    const a = angleOf(i);
    if (!inGap(a)) posts.push({ i, a });
  }

  const postGeo = cached(`fencepost|${height}`, () => new THREE.CylinderGeometry(0.055, 0.055, height, 5));
  const spikeGeo = cached(`fencespike|${height}`, () => new THREE.ConeGeometry(0.075, 0.28, 5));
  const postMat = mat(color, { roughness: 0.55, metalness: 0.65, emissive: 0x0a1a16, emissiveIntensity: 0.4 });

  const postMesh = new THREE.InstancedMesh(postGeo, postMat, posts.length);
  const spikeMesh = new THREE.InstancedMesh(spikeGeo, postMat, posts.length);
  const m = new THREE.Matrix4();
  posts.forEach((p, k) => {
    const x = Math.cos(p.a) * radius;
    const z = Math.sin(p.a) * radius;
    m.makeTranslation(x, height / 2, z);
    postMesh.setMatrixAt(k, m);
    m.makeTranslation(x, height + 0.14, z);
    spikeMesh.setMatrixAt(k, m);
  });
  postMesh.instanceMatrix.needsUpdate = true;
  spikeMesh.instanceMatrix.needsUpdate = true;
  group.add(postMesh, spikeMesh);

  // Rails: one instance per segment between consecutive posts, skipping the gate.
  const segments = [];
  for (let k = 0; k < posts.length; k++) {
    const cur = posts[k];
    const nxt = posts[(k + 1) % posts.length];
    // Consecutive in the original ring? Otherwise this spans the gate opening.
    if ((nxt.i - cur.i + count) % count !== 1) continue;
    const ax = Math.cos(cur.a) * radius;
    const az = Math.sin(cur.a) * radius;
    const bx = Math.cos(nxt.a) * radius;
    const bz = Math.sin(nxt.a) * radius;
    segments.push({ ax, az, bx, bz, len: Math.hypot(bx - ax, bz - az) });
  }

  if (segments.length) {
    const railGeo = new THREE.BoxGeometry(1, 0.07, 0.07); // unit length along X
    const railMat = mat(color, { roughness: 0.6, metalness: 0.6 });
    const railMesh = new THREE.InstancedMesh(railGeo, railMat, segments.length * 2);
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    let n = 0;
    for (const y of [height * 0.35, height * 0.78]) {
      for (const s of segments) {
        pos.set((s.ax + s.bx) / 2, y, (s.az + s.bz) / 2);
        // A box's long axis is +X; rotating about Y maps it to (cos, 0, -sin).
        e.set(0, -Math.atan2(s.bz - s.az, s.bx - s.ax), 0);
        q.setFromEuler(e);
        scl.set(s.len, 1, 1);
        m.compose(pos, q, scl);
        railMesh.setMatrixAt(n++, m);
      }
    }
    railMesh.instanceMatrix.needsUpdate = true;
    group.add(railMesh);
  }

  return group;
}

/** Slab, rounded-top slab, or cross. */
export function gravestone(rng, color = 0x9aa6b2, style = null) {
  const group = new THREE.Group();
  const s = style ?? ['slab', 'rounded', 'cross', 'slab', 'rounded'][Math.floor(rng.next() * 5)];
  const stone = mat(color, { roughness: 0.95, metalness: 0.02 });
  const w = 0.62 + rng.next() * 0.4;
  const h = 0.85 + rng.next() * 0.75;
  const d = 0.16 + rng.next() * 0.1;

  if (s === 'cross') {
    const v = new THREE.Mesh(cached(`box|${d}|${h * 1.5}|${d}`, () => new THREE.BoxGeometry(0.18, 1, 0.18)), stone);
    v.scale.y = h * 1.5;
    const hbar = new THREE.Mesh(cached('box|0.5|0.16|0.16', () => new THREE.BoxGeometry(0.5, 0.16, 0.16)), stone);
    hbar.position.y = h * 0.62;
    group.add(v, hbar);
  } else if (s === 'rounded') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stone);
    body.position.y = h / 2;
    // A full cylinder laid on its side along X gives a clean rounded top.
    const top = new THREE.Mesh(
      cached(`cyl|${d / 2}|${d / 2}|${w}|12`, () => new THREE.CylinderGeometry(d / 2, d / 2, w, 12)),
      stone,
    );
    top.rotation.z = Math.PI / 2;
    top.position.y = h;
    group.add(body, top);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stone);
    body.position.y = h / 2;
    group.add(body);
  }

  // A little mound of earth in front.
  const mound = cylinder(w * 0.62, w * 0.78, 0.22, 0x1b2a1f, { roughness: 1 }, 7);
  mound.position.set(0, 0.06, d + 0.28);
  group.add(mound);

  group.rotation.y = rng.next() * Math.PI * 2;
  group.rotation.z = (rng.next() - 0.5) * 0.18; // leaning, neglected
  group.rotation.x = (rng.next() - 0.5) * 0.12;
  return group;
}

/** Tall tapering obelisk on a stepped base. */
export function obelisk(height, color = 0x8f9aa8) {
  const group = new THREE.Group();
  const base = box(2.4, 0.4, 2.4, color);
  base.position.y = 0.2;
  const mid = box(1.8, 0.4, 1.8, color);
  mid.position.y = 0.6;
  const shaft = cylinder(0.28, 0.62, height, color, {}, 4);
  shaft.position.y = 0.8 + height / 2;
  shaft.rotation.y = Math.PI / 4;
  const tip = cone(0.32, 0.7, color, {}, 4);
  tip.position.y = 0.8 + height + 0.35;
  tip.rotation.y = Math.PI / 4;
  group.add(base, mid, shaft, tip);
  return group;
}

/** Bare, twisted tree. */
export function deadTree(rng, { height = 6, color = 0x2a2320 } = {}) {
  const group = new THREE.Group();
  const trunk = cylinder(0.12, 0.34, height, color, { roughness: 1 }, 6);
  trunk.position.y = height / 2;
  trunk.rotation.z = (rng.next() - 0.5) * 0.2;
  group.add(trunk);

  /** Grow a limb from a pivot at its base so rotation tilts away from the trunk. */
  const limb = (parent, yFrac, len, r0, r1) => {
    const pivot = new THREE.Group();
    pivot.position.set(0, height * yFrac, 0);
    pivot.rotation.y = rng.next() * Math.PI * 2;
    const mesh = cylinder(r0, r1, len, color, { roughness: 1 }, 5);
    mesh.position.y = len / 2; // base sits on the pivot
    pivot.add(mesh);
    pivot.rotateZ(0.55 + rng.next() * 0.6);
    parent.add(pivot);
    return { pivot, len };
  };

  const branchCount = 4 + Math.floor(rng.next() * 4);
  for (let i = 0; i < branchCount; i++) {
    const len = height * (0.22 + rng.next() * 0.3);
    const { pivot } = limb(group, 0.45 + rng.next() * 0.48, len, 0.035, 0.11);
    // A sub-branch growing from partway along the limb.
    if (rng.next() > 0.4) {
      const sub = new THREE.Group();
      sub.position.y = len * (0.5 + rng.next() * 0.3);
      sub.rotation.y = rng.next() * 2;
      const m2 = cylinder(0.02, 0.05, len * 0.55, color, { roughness: 1 }, 5);
      m2.position.y = (len * 0.55) / 2;
      sub.add(m2);
      sub.rotateZ(0.5 + rng.next() * 0.6);
      pivot.add(sub);
    }
  }
  return group;
}

/** Dense jungle tree: flared trunk plus stacked canopy cones. */
export function jungleTree(rng, { height = 9, trunk = 0x3a2a1c, leaf = 0x1f6b28, glow = 0x7dff5c } = {}) {
  const group = new THREE.Group();
  const trunkMesh = cylinder(0.18, 0.42, height * 0.62, trunk, { roughness: 1 }, 6);
  trunkMesh.position.y = (height * 0.62) / 2;
  group.add(trunkMesh);

  // Buttress roots.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rng.next();
    const root = cylinder(0.08, 0.24, 1.5, trunk, { roughness: 1 }, 5);
    root.position.set(Math.cos(a) * 0.42, 0.7, Math.sin(a) * 0.42);
    root.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
    group.add(root);
  }

  const layers = 3;
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const r = (2.6 - t * 1.3) * (0.85 + rng.next() * 0.3);
    const h = 3.4 - t * 1.1;
    const canopy = cone(r, h, leaf, { roughness: 0.95, flat: true }, 8);
    canopy.position.y = height * 0.5 + t * height * 0.38;
    canopy.rotation.y = rng.next() * Math.PI;
    group.add(canopy);
  }

  // A few bioluminescent leaves poking out of the canopy.
  if (rng.next() > 0.35) {
    const g = crystal(0.28 + rng.next() * 0.2, glow, { emissiveIntensity: 1.4 });
    g.position.set((rng.next() - 0.5) * 3, height * (0.6 + rng.next() * 0.4), (rng.next() - 0.5) * 3);
    group.add(g);
  }
  return group;
}

/** Ground fern: a rosette of tapered blades. */
export function fern(rng, { size = 1.2, color = 0x2f8f3a } = {}) {
  const group = new THREE.Group();
  const blades = 5 + Math.floor(rng.next() * 4);
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2 + rng.next() * 0.4;
    const len = size * (0.7 + rng.next() * 0.6);
    const blade = cone(0.16, len, color, { roughness: 0.9, side: THREE.DoubleSide }, 4);
    blade.position.set(Math.cos(a) * len * 0.25, len * 0.4, Math.sin(a) * len * 0.25);
    blade.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8);
    group.add(blade);
  }
  return group;
}

/** Glowing mushroom, used both as scenery and as the giant rooftop cap. */
export function glowMushroom({
  height = 2,
  capRadius = 1.2,
  stemColor = 0xd8cfc0,
  capColor = 0xff5ce1,
  spotColor = 0x7ffff0,
  spots = 8,
  rng = makeRng(7),
  /** A bouncy cap launches the player on landing. See BOUNCE in config.js. */
  bounce = false,
  /** Launch multiplier for a bouncy cap. */
  power = 1,
  /** Unit direction a bouncy cap throws the player in. Defaults to straight up. */
  dir = null,
} = {}) {
  const group = new THREE.Group();
  const stem = cylinder(capRadius * 0.28, capRadius * 0.4, height, stemColor, { roughness: 0.9 }, 10);
  stem.position.y = height / 2;
  group.add(stem);

  const capGeo = new THREE.SphereGeometry(capRadius, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const cap = new THREE.Mesh(
    capGeo,
    // A cap you are meant to jump on reads as lit from within, so it is obvious
    // from a distance which mushrooms are for bouncing on.
    mat(capColor, { emissive: capColor, emissiveIntensity: bounce ? 1.5 : 0.85, roughness: 0.45, flat: false }),
  );
  cap.scale.y = 0.72;
  cap.position.y = height;
  // A cap is a dome, not a box. Left to the bounding-box pass it would be a flat
  // lid at apex height over the whole footprint -- you would stand in thin air
  // at the edge. So it registers a real dome instead, in its own local space,
  // which the area builder transforms into world space.
  cap.userData.noSupport = true;
  cap.userData.noColliderTop = true;
  group.add(cap);
  // `kind` rides along with the dome so the support field can tell a cap you are
  // launched from apart from one you merely stand on.
  group.userData.supportDomes = [
    {
      cx: 0,
      cz: 0,
      baseY: height,
      radius: capRadius,
      yScale: 0.72,
      kind: bounce ? 'bounce' : undefined,
      power,
      dir: dir ?? undefined,
    },
  ];

  // Gills underneath.
  const gills = cylinder(capRadius * 0.94, capRadius * 0.2, 0.22, spotColor, {
    emissive: spotColor,
    emissiveIntensity: 0.7,
    roughness: 0.6,
  }, 20);
  gills.position.y = height - 0.04;
  group.add(gills);

  // Spots on the cap.
  const spotGeo = cached('spot|0.16', () => new THREE.SphereGeometry(0.16, 6, 4));
  const spotMat = mat(spotColor, { emissive: spotColor, emissiveIntensity: 1.6, roughness: 0.3, flat: false });
  for (let i = 0; i < spots; i++) {
    const a = rng.next() * Math.PI * 2;
    const rr = Math.sqrt(rng.next()) * capRadius * 0.82;
    const y = Math.sqrt(Math.max(0, 1 - (rr / capRadius) ** 2)) * capRadius * 0.72;
    const spot = new THREE.Mesh(spotGeo, spotMat);
    const s = 0.55 + rng.next() * 0.9;
    spot.scale.setScalar(s);
    spot.position.set(Math.cos(a) * rr, height + y * 0.9, Math.sin(a) * rr);
    group.add(spot);
  }
  return group;
}

/** Vertical light beam marking an area, visible from across the world. */
export function beacon(color, height, radius = 3.2) {
  const geo = new THREE.CylinderGeometry(radius * 0.35, radius, height, 16, 1, true);
  const m = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
    // Unfogged on purpose: with a dozen areas spread over 600 m, a beacon you
    // cannot see from a distance is not a landmark.
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.y = height / 2;
  mesh.renderOrder = 5;
  return { mesh, material: m };
}

/**
 * Glowing ring on the ground showing an area's reach.
 *
 * A flat ring would clip straight through the hills: an area's plateau only
 * extends ~44m, but the outer reach ring sits at 90m. So when `heightFn` is
 * given (in the ring's own local XZ space) the ring is built as a custom mesh
 * draped over the terrain instead.
 */
export function groundRing(color, radius, width = 0.7, opacity = 0.5, heightFn = null) {
  const SEG = 180;
  let geo;

  if (heightFn) {
    const positions = new Float32Array(SEG * 2 * 3);
    const indices = [];
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const rIn = radius - width;
      positions[i * 6 + 0] = ca * rIn;
      positions[i * 6 + 1] = heightFn(ca * rIn, sa * rIn);
      positions[i * 6 + 2] = sa * rIn;
      positions[i * 6 + 3] = ca * radius;
      positions[i * 6 + 4] = heightFn(ca * radius, sa * radius);
      positions[i * 6 + 5] = sa * radius;
    }
    for (let i = 0; i < SEG; i++) {
      const a0 = i * 2;
      const b0 = i * 2 + 1;
      const a1 = ((i + 1) % SEG) * 2;
      const b1 = ((i + 1) % SEG) * 2 + 1;
      indices.push(a0, b0, b1, a0, b1, a1);
    }
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
  } else {
    geo = new THREE.RingGeometry(radius - width, radius, 96, 1);
  }

  const m = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: true,
  });

  const mesh = new THREE.Mesh(geo, m);
  if (heightFn) {
    // Already built in the XZ plane at real heights.
    mesh.position.y = 0.08;
  } else {
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.06;
  }
  mesh.renderOrder = 4;
  return { mesh, material: m };
}

export const PARTICLE_VERT = /* glsl */ `
attribute float aPhase;
attribute float aScale;
uniform float uTime;
uniform float uSize;
uniform float uHeight;
uniform float uRise;
uniform float uDrift;
varying float vAlpha;
varying float vMix;
varying float vFogDepth;
/** 0 when the sprite is on the lens, 1 once it is clear of it. */
varying float vNear;
void main() {
  vec3 p = position;
  float life = fract(uTime * uRise * 0.08 + aPhase * 0.159);
  p.y += life * uHeight;
  p.x += sin(uTime * 0.5 + aPhase) * uDrift;
  p.z += cos(uTime * 0.42 + aPhase * 1.7) * uDrift;
  // Fade in at the bottom, out at the top.
  vAlpha = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.7, 1.0, life));
  vMix = fract(aPhase * 0.318);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vFogDepth = -mv.z;
  // CLAMPED, and faded out near the lens.
  //
  // A sprite's size is inversely proportional to its distance, so one that drifts
  // within a few centimetres of the camera is drawn thousands of pixels across and
  // covers the screen with a soft disc. In first person you meet that by walking
  // through a particle field; with a chase camera the camera sits OUTSIDE the player,
  // so it happens on every flight. The clamp bounds the size and vNear fades the
  // sprite out as it approaches, so a particle passing the camera reads as a mote
  // going by rather than a wall of light.
  gl_PointSize = min(uSize * aScale * (60.0 / max(1.0, -mv.z)), 90.0);
  vNear = smoothstep(0.5, 3.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}
    `;

export const PARTICLE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uColor2;
uniform float uOpacity;
uniform vec3 uFogColor;
uniform float uFogDensity;
varying float vAlpha;
varying float vMix;
varying float vFogDepth;
varying float vNear;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.0) * vAlpha * uOpacity * vNear;
  vec3 col = mix(uColor, uColor2, vMix);
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  col = mix(col, uFogColor, clamp(fog, 0.0, 1.0));
  gl_FragColor = vec4(col, a);
}
    `;

const BURST_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aAlpha;
uniform float uPx;
uniform vec3 uFogColor;
uniform float uFogDensity;
varying vec3 vColor;
varying float vAlpha;
varying float vFogDepth;
varying float vNear;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFogDepth = -mv.z;
  // Clamped and near-faded for the same reason as the ambient particles: a burst
  // right on the lens would otherwise be a screen-filling disc. See PARTICLE_VERT.
  gl_PointSize = min(uPx * aSize * (60.0 / max(1.0, -mv.z)), 110.0);
  vNear = smoothstep(0.4, 2.4, -mv.z);
  gl_Position = projectionMatrix * mv;
}
    `;

const BURST_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uFogColor;
uniform float uFogDensity;
varying vec3 vColor;
varying float vAlpha;
varying float vFogDepth;
varying float vNear;
void main() {
  if (vAlpha <= 0.001) discard;
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.0) * vAlpha * vNear;
  vec3 col = vColor;
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  col = mix(col, uFogColor, clamp(fog, 0.0, 1.0));
  gl_FragColor = vec4(col, a);
}
    `;

/**
 * A small pool of one-shot particle bursts.
 *
 * Different in kind from `createParticles` above. That system is an infinite
 * ambient field: it is placed once, its whole animation lives in the shader, and
 * it costs nothing per frame on the CPU. A burst is the opposite — it happens at
 * a point you only learn at runtime (a jump, a bounce), it runs for a fraction of
 * a second, and then it is gone. Trying to express that inside the ambient shader
 * would have meant giving up either the free per-frame cost or the arbitrary
 * origin.
 *
 * So: a fixed pool of particles, animated on the CPU, and a ring buffer of
 * emitters. No allocation after construction — a burst reuses dead particles, so
 * jumping repeatedly cannot grow the heap or the draw calls. One Points object for
 * the whole pool means the cost is one draw call no matter how many bursts fire.
 *
 * Particles die by fading, and a dead particle is parked far off-screen (a
 * huge negative Y) rather than given zero size, because a zero-size point still
 * costs a vertex and some drivers render it as a single pixel.
 */
export function createBurst({
  max = 160,
  color = 0xff7ae8,
  color2 = 0x7ffff0,
  size = 9,
  gravity = -7.5,
  drag = 2.4,
  life = 0.75,
} = {}) {
  const positions = new Float32Array(max * 3);
  const colors = new Float32Array(max * 3);
  const sizes = new Float32Array(max);
  const alphas = new Float32Array(max);

  // Per-particle CPU state. Kept in plain arrays rather than objects so the
  // update loop does not chase pointers.
  const vel = new Float32Array(max * 3);
  const lifeLeft = new Float32Array(max);
  const lifeTotal = new Float32Array(max);
  const baseSize = new Float32Array(max);
  const grav = new Float32Array(max);

  const cA = new THREE.Color(color);
  const cB = new THREE.Color(color2);

  // Everything starts dead and parked.
  for (let i = 0; i < max; i++) {
    positions[i * 3 + 1] = -10000;
    colors[i * 3 + 0] = cA.r;
    colors[i * 3 + 1] = cA.g;
    colors[i * 3 + 2] = cA.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPx: { value: size },
      uFogColor: { value: new THREE.Color(WORLD.fogColor) },
      uFogDensity: { value: WORLD.fogDensity },
    },
    vertexShader: BURST_VERT,
    fragmentShader: BURST_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    // Particles can be behind the player after a bounce; fog keeps them from
    // reading as hard dots at distance.
    fog: false,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 7;
  points.userData.noSupport = true;

  registerParticleMaterial(material);

  /** Next particle to reuse. A ring buffer, so bursts never allocate. */
  let cursor = 0;
  let live = 0;

  /**
   * Emit `count` particles from a point.
   *
   * @param {{x:number,y:number,z:number}} at
   * @param {object} [opts]
   * @param {number} [opts.count]
   * @param {number} [opts.speed]      initial speed, m/s
   * @param {number} [opts.spread]     0 = a tight jet, 1 = a wide puff
   * @param {number} [opts.up]         upward bias, -1..1
   * @param {number} [opts.size]       scale on the configured size
   * @param {number} [opts.life]       seconds
   * @param {number} [opts.gravity]    m/s²; positive floats up like spores
   * @param {() => number} [opts.rng]
   */
  function emit(at, opts = {}) {
    const count = opts.count ?? 14;
    const speed = opts.speed ?? 3;
    const spread = opts.spread ?? 1;
    const up = opts.up ?? 0.4;
    const sizeScale = opts.size ?? 1;
    const lifeSec = opts.life ?? life;
    const gravity = opts.gravity ?? 0;
    const rng = opts.rng ?? Math.random;

    for (let k = 0; k < count; k++) {
      const i = cursor;
      cursor = (cursor + 1) % max;

      // A random direction, biased upward by `up` and flattened by `spread`.
      const theta = rng() * Math.PI * 2;
      const y = up + (rng() * 2 - 1) * (1 - Math.min(1, Math.abs(up)));
      const planar = Math.sqrt(Math.max(0, 1 - y * y)) * spread;
      const vx = Math.cos(theta) * planar;
      const vz = Math.sin(theta) * planar;
      const mag = speed * (0.55 + rng() * 0.75);

      positions[i * 3 + 0] = at.x;
      positions[i * 3 + 1] = at.y;
      positions[i * 3 + 2] = at.z;

      vel[i * 3 + 0] = vx * mag;
      vel[i * 3 + 1] = y * mag;
      vel[i * 3 + 2] = vz * mag;

      // Mix the two colours per particle so a burst is not one flat hue.
      const mix = rng();
      colors[i * 3 + 0] = cA.r + (cB.r - cA.r) * mix;
      colors[i * 3 + 1] = cA.g + (cB.g - cA.g) * mix;
      colors[i * 3 + 2] = cA.b + (cB.b - cA.b) * mix;

      baseSize[i] = sizeScale * (0.6 + rng() * 0.9);
      sizes[i] = baseSize[i];
      lifeTotal[i] = lifeSec * (0.7 + rng() * 0.6);
      lifeLeft[i] = lifeTotal[i];
      grav[i] = gravity;
      alphas[i] = 1;
    }

    live = Math.min(max, live + count);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;
  }

  /** Advance every live particle. Call once per frame. */
  function update(dt) {
    if (live <= 0 || dt <= 0) return;
    let anyAlive = false;

    for (let i = 0; i < max; i++) {
      if (lifeLeft[i] <= 0) continue;
      lifeLeft[i] -= dt;
      if (lifeLeft[i] <= 0) {
        // Park it. See the note above about zero-size points.
        positions[i * 3 + 1] = -10000;
        alphas[i] = 0;
        continue;
      }
      anyAlive = true;

      const damp = Math.max(0, 1 - drag * dt);
      vel[i * 3 + 0] *= damp;
      vel[i * 3 + 1] = vel[i * 3 + 1] * damp + grav[i] * dt;
      vel[i * 3 + 2] *= damp;

      positions[i * 3 + 0] += vel[i * 3 + 0] * dt;
      positions[i * 3 + 1] += vel[i * 3 + 1] * dt;
      positions[i * 3 + 2] += vel[i * 3 + 2] * dt;

      // Fade out, and shrink with it so the puff dissipates rather than blinking.
      const t = lifeLeft[i] / lifeTotal[i];
      alphas[i] = t * t;
      sizes[i] = baseSize[i] * (0.45 + 0.55 * t);
    }

    if (!anyAlive) live = 0;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;
  }

  return { points, material, emit, update, get liveCount() { return live; }, max };
}

/**
 * Generic floating particle system -- wisps, fireflies, spores, embers.
 * Everything is computed in the shader from a phase attribute, so it costs
 * nothing per frame on the CPU.
 */
export function createParticles({
  count = 120,
  color = 0xffffff,
  color2 = null,
  radius = 20,
  center = new THREE.Vector3(),
  height = 8,
  size = 6,
  riseSpeed = 0.4,
  drift = 1.5,
  opacity = 0.85,
  seed = 3,
} = {}) {
  const rng = makeRng(seed);
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const a = rng.next() * Math.PI * 2;
    const r = Math.sqrt(rng.next()) * radius;
    positions[i * 3 + 0] = center.x + Math.cos(a) * r;
    positions[i * 3 + 1] = center.y + rng.next() * height;
    positions[i * 3 + 2] = center.z + Math.sin(a) * r;
    phases[i] = rng.next() * Math.PI * 2;
    scales[i] = 0.5 + rng.next();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uColor2: { value: new THREE.Color(color2 ?? color) },
      uSize: { value: size },
      uHeight: { value: height },
      uRise: { value: riseSpeed },
      uDrift: { value: drift },
      uOpacity: { value: opacity },
      uFogColor: { value: new THREE.Color(WORLD.fogColor) },
      uFogDensity: { value: WORLD.fogDensity },
    },
    vertexShader: PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 6;

  // Let the sensory dial thin this system out along with every other one.
  registerParticleMaterial(material);

  return {
    points,
    material,
    update(time) {
      material.uniforms.uTime.value = time;
    },
  };
}

/** A flat slab of ground decoration (path stone, platform). */
export function slab(w, d, color, opts = {}) {
  const mesh = cylinder(Math.max(w, d) / 2, Math.max(w, d) / 2, 0.08, color, opts, 7);
  mesh.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  return mesh;
}

/**
 * The world kit's builders: the meshes a recipe is made of. Ground, a cavern sky,
 * the central root column, and per site a centrepiece, three lesson stations, a
 * quiz shrine and a name plaque — each able to show the site's state (see
 * recipes.js `siteState`). Colours and glow levels come from the style guide
 * (../style.js), so a new world is the realm's own look by construction.
 */
import * as THREE from 'three';
import { PALETTE, GLOW } from '../style.js';
import { SPECIES } from '../world/kit/mushrooms.js';
import { obelisk, papyrusColumn, steppedPlatform } from '../world/kit/kemet.js';

const col = (hex) => new THREE.Color(hex);

/** How each state looks: the colour of its light and how strongly it glows. */
export const STATE_LOOK = {
  locked: { colour: 0x2b2733, glow: 0.04, light: 0 },
  available: { colour: PALETTE.glyph.amber, glow: GLOW.glyph * 0.55, light: 0.6 },
  open: { colour: PALETTE.glyph.amber, glow: GLOW.glyph * 0.7, light: 0.9 },
  current: { colour: PALETTE.life.cyan, glow: GLOW.lifeStrong, light: 1.6 },
  finished: { colour: PALETTE.gold.electrum, glow: GLOW.life, light: 1.2 },
};

function hash(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

/* ── Ground and sky ──────────────────────────────────────────────────────── */

export function createGround(recipe, heightAt, { segments = 128 } = {}) {
  const size = recipe.radius * 2.2;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colours = new Float32Array(pos.count * 3);
  const low = col(recipe.palette.ground);
  const high = col(recipe.palette.groundHigh);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const t = Math.min(1, Math.max(0, y / 8 + (hash(x * 0.37 + z * 1.13) - 0.5) * 0.25));
    c.copy(low).lerp(high, t);
    colours.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 }));
  mesh.receiveShadow = true;
  return mesh;
}

/** A cavern's sky: a dark dome, warmer at the horizon, pricked with glowing spores. */
export function createCavernSky(palette) {
  const uniforms = {
    uZenith: { value: col(palette.zenith) },
    uHorizon: { value: col(palette.horizon) },
    uGlow: { value: col(palette.glow) },
    uTime: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGlow; uniform float uTime;
      varying vec3 vDir;
      float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main() {
        float up = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 c = mix(uHorizon, uZenith, smoothstep(0.35, 0.85, up));
        // Spores clinging to the roof, twinkling slowly.
        vec3 cell = floor(vDir * 90.0);
        float h = hash(cell);
        float spore = step(0.985, h) * smoothstep(0.45, 0.9, up);
        spore *= 0.6 + 0.4 * sin(uTime * (0.6 + h * 2.0) + h * 30.0);
        c += uGlow * spore * 0.9;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return { mesh, update: (t) => { uniforms.uTime.value = t; } };
}

/** An open sky at dusk: deep violet overhead, a warm band at the horizon, first stars. */
export function createTwilightSky(palette) {
  const uniforms = {
    uZenith: { value: col(palette.zenith) },
    uHorizon: { value: col(palette.horizon) },
    uGlow: { value: col(palette.key) },
    uTime: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGlow; uniform float uTime;
      varying vec3 vDir;
      float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main() {
        float up = clamp(vDir.y, -0.2, 1.0);
        vec3 c = mix(uHorizon, uZenith, smoothstep(-0.02, 0.55, up));
        // The last of the sun, low in the west.
        float west = pow(max(dot(normalize(vDir.xz + 1e-4), vec2(-1.0, 0.0)), 0.0), 6.0);
        c += uGlow * west * smoothstep(0.25, 0.0, up) * 0.55;
        // First stars, only high up.
        vec3 cell = floor(vDir * 160.0);
        float h = hash(cell);
        c += vec3(0.9, 0.92, 1.0) * step(0.9965, h) * smoothstep(0.25, 0.7, up) * (0.6 + 0.4 * sin(uTime * (0.5 + h * 3.0) + h * 40.0));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return { mesh, update: (t) => { uniforms.uTime.value = t; } };
}

/** Deep space: dense stars, and two nebula clouds drifting through them. */
export function createSpaceSky(palette) {
  const uniforms = {
    uZenith: { value: col(palette.zenith) },
    uHorizon: { value: col(palette.horizon) },
    uNebulaA: { value: col(PALETTE.life.violet) },
    uNebulaB: { value: col(PALETTE.life.cyan) },
    uTime: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uNebulaA; uniform vec3 uNebulaB; uniform float uTime;
      varying vec3 vDir;
      float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float noise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = mix(uHorizon, uZenith, abs(d.y));
        float n = noise(d * 3.0 + uTime * 0.01) * 0.6 + noise(d * 7.0) * 0.4;
        c += uNebulaA * smoothstep(0.55, 0.85, n) * 0.35;
        c += uNebulaB * smoothstep(0.62, 0.9, noise(d * 4.0 + 7.0)) * 0.22;
        vec3 cell = floor(d * 220.0);
        float h = hash(cell);
        c += vec3(0.95, 0.95, 1.0) * step(0.993, h) * (0.55 + 0.45 * sin(uTime * (0.4 + h * 2.5) + h * 50.0));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return { mesh, update: (t) => { uniforms.uTime.value = t; } };
}

/* ── The root column and hanging roots ───────────────────────────────────── */

function rootMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x3b2817, roughness: 0.9 });
}

function veinMaterial(colour, level = GLOW.life) {
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: col(colour), emissiveIntensity: level, roughness: 0.6 });
}

/** One root as a tube along a wandering curve between two points. */
function rootTube(from, to, radius, wobble, seed, material) {
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const p = from.clone().lerp(to, t);
    p.x += Math.sin(seed + t * 5.1) * wobble * Math.sin(t * Math.PI);
    p.z += Math.cos(seed * 1.7 + t * 4.3) * wobble * Math.sin(t * Math.PI);
    pts.push(p);
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 7, false), material);
}

/** The column holding the cavern up: braided roots, glowing veins, mushrooms at its foot. */
export function createRootColumn(cfg, heightAt) {
  const group = new THREE.Group();
  const bark = rootMaterial();
  const vein = veinMaterial(PALETTE.life.cyan, GLOW.life);
  const base = heightAt(cfg.x, cfg.z);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = cfg.radius * (0.55 + hash(i) * 0.45);
    const from = new THREE.Vector3(cfg.x + Math.cos(a) * r * 1.9, base - 0.5, cfg.z + Math.sin(a) * r * 1.9);
    const to = new THREE.Vector3(cfg.x + Math.cos(a + 1.4) * r * 0.9, base + cfg.height, cfg.z + Math.sin(a + 1.4) * r * 0.9);
    const root = rootTube(from, to, 1.1 + hash(i + 3) * 1.4, r * 0.6, i * 2.3, bark);
    root.castShadow = true;
    group.add(root);
    if (i % 2 === 0) group.add(rootTube(from.clone().setY(base + 0.3), to, 0.18, r * 0.62, i * 2.3 + 0.1, vein));
  }
  // Glowing caps at the foot of the column.
  const kinds = ['cubensis', 'lionsMane', 'chanterelle', 'reishi'];
  for (let i = 0; i < 14; i++) {
    const a = hash(i + 11) * Math.PI * 2;
    const r = cfg.radius * (1.9 + hash(i + 17) * 1.2);
    const m = SPECIES[kinds[i % kinds.length]]({ scale: 0.8 + hash(i + 5) * 1.4, seed: i });
    const x = cfg.x + Math.cos(a) * r;
    const z = cfg.z + Math.sin(a) * r;
    m.position.set(x, heightAt(x, z), z);
    m.rotation.y = a;
    group.add(m);
  }
  const light = new THREE.PointLight(PALETTE.life.cyan, 2.2, 70, 1.6);
  light.position.set(cfg.x, base + 14, cfg.z);
  group.add(light);
  return group;
}

/** Roots hanging from the cavern roof, each with a glowing tip. */
export function createHangingRoots(recipe, count = 40) {
  const group = new THREE.Group();
  const bark = rootMaterial();
  const tipGeo = new THREE.SphereGeometry(0.35, 8, 6);
  const tipMat = veinMaterial(PALETTE.glyph.amber, GLOW.life);
  for (let i = 0; i < count; i++) {
    const a = hash(i + 101) * Math.PI * 2;
    const r = 18 + hash(i + 202) * (recipe.radius * 0.7);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const len = 8 + hash(i + 303) * 18;
    const top = new THREE.Vector3(x, 46, z);
    const bottom = new THREE.Vector3(x + (hash(i) - 0.5) * 4, 46 - len, z + (hash(i + 7) - 0.5) * 4);
    group.add(rootTube(top, bottom, 0.25 + hash(i + 9) * 0.35, 1.5, i, bark));
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.copy(bottom);
    group.add(tip);
  }
  return group;
}

/**
 * The mother tree: a broad trunk, a canopy of glowing leaf-clouds, and roots of
 * light running out across the ground to every site — the network the Living
 * World is about.
 */
export function createMotherTree(cfg, heightAt, sites = []) {
  const group = new THREE.Group();
  const base = heightAt(cfg.x, cfg.z);
  const bark = rootMaterial();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.55, cfg.radius, cfg.height, 16, 1), bark);
  trunk.position.set(cfg.x, base + cfg.height / 2 - 0.5, cfg.z);
  trunk.castShadow = true;
  group.add(trunk);
  const leaf = new THREE.MeshStandardMaterial({ color: 0x1d2a20, emissive: col(PALETTE.life.green), emissiveIntensity: 0.35, roughness: 0.8 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = cfg.radius * (1.3 + hash(i + 40) * 1.4);
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(cfg.radius * (1.2 + hash(i + 41) * 0.8), 1), leaf);
    blob.position.set(cfg.x + Math.cos(a) * r, base + cfg.height + (hash(i + 42) - 0.3) * 6, cfg.z + Math.sin(a) * r);
    group.add(blob);
  }
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(cfg.radius * 2.2, 1), leaf);
  crown.position.set(cfg.x, base + cfg.height + 5, cfg.z);
  group.add(crown);
  // Roots of light out to each site, laid along the ground.
  const vein = veinMaterial(PALETTE.life.cyan, GLOW.life);
  for (const [i, site] of sites.entries()) {
    const from = new THREE.Vector3(cfg.x, 0, cfg.z);
    const to = new THREE.Vector3(site.x, 0, site.z);
    const pts = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      const p = from.clone().lerp(to, t);
      p.x += Math.sin(i * 1.9 + t * 7) * 3 * Math.sin(t * Math.PI);
      p.z += Math.cos(i * 2.3 + t * 6) * 3 * Math.sin(t * Math.PI);
      p.y = heightAt(p.x, p.z) + 0.08;
      pts.push(p);
    }
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.09, 5), vein));
  }
  const light = new THREE.PointLight(PALETTE.life.green, 2.4, 80, 1.5);
  light.position.set(cfg.x, base + cfg.height, cfg.z);
  group.add(light);
  return group;
}

/**
 * The gathering plaza: a stepped stone platform in the realm's Kemetic style,
 * an obelisk at its heart, papyrus columns at its corners, and a fire bowl
 * where stories are told.
 */
export function createGatheringPlaza(cfg, heightAt) {
  const group = new THREE.Group();
  const base = heightAt(cfg.x, cfg.z);
  const w = cfg.radius * 2;
  const platform = steppedPlatform({ width: w, depth: w, steps: 3 });
  group.add(platform);
  const top = 1.2;
  const ob = obelisk({ height: 16, base: 1.2 });
  ob.position.y = top;
  group.add(ob);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const c = papyrusColumn({ height: 7, seed: sx * 3 + sz });
    c.position.set(sx * (cfg.radius - 2), top, sz * (cfg.radius - 2));
    group.add(c);
  }
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.6, 0.7, 16), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.6, metalness: 0.3 }));
  bowl.position.set(0, top + 0.35, cfg.radius - 4);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 10), new THREE.MeshStandardMaterial({ color: 0, emissive: col(0xffa040), emissiveIntensity: GLOW.focal, transparent: true, opacity: 0.9 }));
  fire.position.set(0, top + 1.3, cfg.radius - 4);
  const light = new THREE.PointLight(0xffa860, 3, 40, 1.6);
  light.position.set(0, top + 2.5, cfg.radius - 4);
  group.add(bowl, fire, light);
  group.position.set(cfg.x, base, cfg.z);
  return group;
}

/**
 * The spore beacon: a crystal spire on a ring of stones, sending a column of
 * light up into space — where spores leave for other worlds.
 */
export function createSporeBeacon(cfg, heightAt) {
  const group = new THREE.Group();
  const base = heightAt(cfg.x, cfg.z);
  const crystal = new THREE.MeshStandardMaterial({ color: 0x241a40, emissive: col(PALETTE.life.violet), emissiveIntensity: GLOW.life, roughness: 0.2, metalness: 0.3 });
  const spire = new THREE.Mesh(new THREE.OctahedronGeometry(3, 0), crystal);
  spire.scale.set(1, cfg.height / 6, 1);
  spire.position.y = cfg.height / 2;
  group.add(spire);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), crystal);
    shard.scale.set(1, 3, 1);
    shard.position.set(Math.cos(a) * 7, 2.4, Math.sin(a) * 7);
    shard.rotation.z = Math.cos(a) * 0.3;
    shard.rotation.x = Math.sin(a) * 0.3;
    group.add(shard);
  }
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 2.4, 400, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: PALETTE.life.cyan, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  beam.position.y = cfg.height + 200;
  group.add(beam);
  const light = new THREE.PointLight(PALETTE.life.violet, 3, 90, 1.4);
  light.position.y = cfg.height * 0.6;
  group.add(light);
  group.position.set(cfg.x, base, cfg.z);
  return group;
}

/** Glowing mushroom clusters scattered over open ground, kept off the sites. */
export function createUndergrowth(recipe, heightAt, count = 60) {
  const group = new THREE.Group();
  const kinds = ['cubensis', 'flyAgaric', 'chanterelle', 'lionsMane', 'morel'];
  let placed = 0;
  for (let i = 0; placed < count && i < count * 6; i++) {
    const a = hash(i + 500) * Math.PI * 2;
    const r = 14 + hash(i + 600) * (recipe.radius * 0.78);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if ((recipe.sites || []).some((s) => Math.hypot(x - s.x, z - s.z) < 18)) continue;
    if (recipe.portal && Math.hypot(x - recipe.portal.x, z - recipe.portal.z) < 8) continue;
    const m = SPECIES[kinds[i % kinds.length]]({ scale: 0.6 + hash(i + 700) * 1.1, seed: i });
    m.position.set(x, heightAt(x, z), z);
    m.rotation.y = a;
    group.add(m);
    placed++;
  }
  return group;
}

/* ── Site pieces ─────────────────────────────────────────────────────────── */

/** A material whose glow follows the site's state. */
function stateMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x111014, emissive: col(STATE_LOOK.locked.colour), emissiveIntensity: STATE_LOOK.locked.glow, roughness: 0.4, metalness: 0.2 });
}

function stone() {
  return new THREE.MeshStandardMaterial({ color: PALETTE.stone.basalt, roughness: 0.85 });
}

/** A lesson station: a stone pedestal and a slowly turning glyph above it. */
function createStation(at, heightAt) {
  const group = new THREE.Group();
  const y = heightAt(at.x, at.z);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 1.2, 10), stone());
  pedestal.position.y = 0.6;
  pedestal.castShadow = true;
  const glyphMat = stateMaterial();
  const glyph = new THREE.Mesh(new THREE.TorusKnotGeometry(0.32, 0.08, 64, 8, 2, 3), glyphMat);
  glyph.position.y = 1.9;
  const done = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 6, 32), new THREE.MeshStandardMaterial({ color: 0, emissive: col(PALETTE.gold.electrum), emissiveIntensity: GLOW.glyph }));
  done.rotation.x = Math.PI / 2;
  done.position.y = 1.25;
  done.visible = false;
  group.add(pedestal, glyph, done);
  group.position.set(at.x, y, at.z);
  return { group, glyph, glyphMat, done, at: { ...at, y } };
}

/** The quiz shrine: a ring of pillars around a floating ring of light. */
function createShrine(at, heightAt) {
  const group = new THREE.Group();
  const y = heightAt(at.x, at.z);
  const pillarGeo = new THREE.CylinderGeometry(0.28, 0.36, 3.2, 8);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = new THREE.Mesh(pillarGeo, stone());
    p.position.set(Math.cos(a) * 2.6, 1.6, Math.sin(a) * 2.6);
    p.castShadow = true;
    group.add(p);
  }
  const ringMat = stateMaterial();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 8, 40), ringMat);
  ring.position.y = 2.4;
  const light = new THREE.PointLight(0xffffff, 0, 18, 1.8);
  light.position.y = 2.6;
  group.add(ring, light);
  group.position.set(at.x, y, at.z);
  return { group, ring, ringMat, light, at: { ...at, y } };
}

/** A name plaque that always faces the viewer. */
function createPlaque(text, at, heightAt) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(9, 2.25, 1);
  sprite.position.set(at.x, heightAt(at.x, at.z) + 4.2, at.z);
  const draw = (title, sub) => {
    const g = canvas.getContext('2d');
    g.clearRect(0, 0, 512, 128);
    g.textAlign = 'center';
    g.fillStyle = 'rgba(8,6,12,0.55)';
    g.fillRect(16, 10, 480, 108);
    g.fillStyle = '#f1d38a';
    g.font = '600 40px Cinzel, Georgia, serif';
    g.fillText(title, 256, 58);
    g.fillStyle = '#cfc6b6';
    g.font = '24px Inter, sans-serif';
    g.fillText(sub, 256, 98);
    texture.needsUpdate = true;
  };
  draw(text, '');
  return { sprite, draw };
}

/** The centrepiece that gives a site its character. Simple shapes, strongly lit. */
function createCentrepiece(theme, site, heightAt) {
  const group = new THREE.Group();
  const y = heightAt(site.x, site.z);
  const bark = rootMaterial();
  const cyan = veinMaterial(PALETTE.life.cyan, GLOW.life);
  const magenta = veinMaterial(PALETTE.life.magenta, GLOW.life);
  if (theme === 'gate') {
    // Two great root arches: the threshold of the kingdom.
    for (const s of [-1, 1]) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(7, 1.1, 10, 28, Math.PI), bark);
      arch.position.set(s * 2.2, 0, 0);
      arch.rotation.y = Math.PI / 2 + s * 0.18;
      arch.castShadow = true;
      group.add(arch);
    }
    const veil = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.12, 6, 40, Math.PI), cyan);
    veil.rotation.y = Math.PI / 2;
    group.add(veil);
  } else if (theme === 'hypha') {
    // A hypha, magnified: a long glassy tube to walk beside, glowing from within.
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 22, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, emissive: col(PALETTE.life.cyan), emissiveIntensity: 0.25 }),
    );
    tube.rotation.z = Math.PI / 2;
    tube.position.y = 2.4;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(2.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), cyan);
    tip.rotation.z = -Math.PI / 2;
    tip.position.set(11, 2.4, 0);
    group.add(tube, tip);
  } else if (theme === 'fallen-log') {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 20, 14), bark);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = 0.3;
    log.position.y = 2.2;
    log.castShadow = true;
    group.add(log);
    for (let i = 0; i < 7; i++) {
      const m = SPECIES[i % 2 ? 'reishi' : 'chanterelle']({ scale: 1 + hash(i) * 0.8, seed: i });
      m.position.set(-8 + i * 2.6, 3.6 + hash(i + 1) * 0.8, (hash(i + 2) - 0.5) * 2);
      group.add(m);
    }
  } else if (theme === 'spiral') {
    // Two strands winding round each other, with rungs: the archive of heredity.
    for (const [phase, mat] of [[0, cyan], [Math.PI, magenta]]) {
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        pts.push(new THREE.Vector3(Math.cos(t * 12 + phase) * 2.4, 0.5 + t * 16, Math.sin(t * 12 + phase) * 2.4));
      }
      group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.22, 6), mat));
    }
    const rungMat = new THREE.MeshStandardMaterial({ color: 0x2a2530, roughness: 0.6 });
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.8, 5), rungMat);
      rung.position.y = 0.5 + t * 16;
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = -t * 12;
      group.add(rung);
    }
  } else if (theme === 'herbarium') {
    // Cabinets of specimens, drawers edged in light.
    const wood = new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.8 });
    const edge = veinMaterial(PALETTE.glyph.amber, GLOW.glyph * 0.8);
    for (let i = 0; i < 5; i++) {
      const cab = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 6 + (i % 2) * 2, 1.4), wood);
      body.position.y = body.geometry.parameters.height / 2;
      body.castShadow = true;
      cab.add(body);
      for (let d = 0; d < 5; d++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.05), edge);
        line.position.set(0, 0.9 + d * 1.1, 0.72);
        cab.add(line);
      }
      const a = (i - 2) * 0.32;
      cab.position.set(Math.sin(a) * 9, 0, -Math.cos(a) * 9 + 6);
      cab.rotation.y = -a;
      group.add(cab);
    }
  }
  if (theme === 'wood-wide-web') {
    // A ring of young trees, their roots joined by glowing threads.
    const ring = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * 8;
      const z = Math.sin(a) * 8 - 4;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 8, 8), bark);
      t.position.set(x, 4, z);
      t.castShadow = true;
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), new THREE.MeshStandardMaterial({ color: 0x1f3322, roughness: 0.8 }));
      crown.position.set(x, 9, z);
      group.add(t, crown);
      ring.push(new THREE.Vector3(x, 0.1, z));
    }
    for (let i = 0; i < ring.length; i++) {
      for (const j of [i + 1, i + 3]) {
        const b = ring[j % ring.length];
        const mid = ring[i].clone().lerp(b, 0.5);
        mid.y = 0.1;
        const curve = new THREE.QuadraticBezierCurve3(ring[i], mid.add(new THREE.Vector3(0, -0.05, 0)), b);
        group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.07, 4), cyan));
      }
    }
  } else if (theme === 'lichen') {
    // Wind-scoured boulders crusted with lichen in three colours.
    const rock = new THREE.MeshStandardMaterial({ color: 0x5a5560, roughness: 0.95 });
    const crusts = [0xd9c34a, 0x9dbf8e, 0xe07a3a].map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: col(c), emissiveIntensity: 0.18, roughness: 0.9 }));
    for (let i = 0; i < 7; i++) {
      const r = 1.2 + hash(i + 80) * 2.2;
      const b = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rock);
      const a = (i / 7) * Math.PI * 2;
      b.position.set(Math.cos(a) * 7, r * 0.55, Math.sin(a) * 7 - 3);
      b.rotation.set(hash(i) * 3, hash(i + 1) * 3, 0);
      b.castShadow = true;
      group.add(b);
      for (let k = 0; k < 4; k++) {
        const patch = new THREE.Mesh(new THREE.CircleGeometry(0.25 + hash(i * 7 + k) * 0.45, 9), crusts[(i + k) % 3]);
        const n = new THREE.Vector3(hash(i * 3 + k) - 0.5, 0.6 + hash(k) * 0.4, hash(i + k * 5) - 0.5).normalize();
        patch.position.copy(b.position).addScaledVector(n, r * 0.98);
        patch.lookAt(b.position.clone().addScaledVector(n, r * 2));
        group.add(patch);
      }
    }
  } else if (theme === 'blight') {
    // Rows of crops; the ones nearest the shrine have caught it.
    const healthy = new THREE.MeshStandardMaterial({ color: 0x5f8a3a, roughness: 0.85 });
    const sick = new THREE.MeshStandardMaterial({ color: 0x4a3a22, emissive: col(0xb85a1a), emissiveIntensity: 0.25, roughness: 0.9 });
    const stalk = new THREE.CylinderGeometry(0.06, 0.09, 1.8, 5);
    for (let row = 0; row < 6; row++) {
      for (let k = 0; k < 9; k++) {
        const p = new THREE.Mesh(stalk, hash(row * 9 + k) < 0.25 + row * 0.1 ? sick : healthy);
        p.position.set(-8 + k * 2, 0.9, -12 + row * 1.6);
        p.rotation.z = (hash(row + k * 3) - 0.5) * (p.material === sick ? 0.9 : 0.15);
        group.add(p);
      }
    }
  } else if (theme === 'granary') {
    // A granary and its sacks, a sickly glow where the mould has got in.
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 0.85 });
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 10, 14), wood);
    silo.position.set(0, 5, -8);
    silo.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 3, 14), new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.8 }));
    roof.position.set(0, 11.5, -8);
    const mould = new THREE.MeshStandardMaterial({ color: 0x223318, emissive: col(0x9fe04a), emissiveIntensity: 0.5, roughness: 0.9 });
    const sack = new THREE.MeshStandardMaterial({ color: 0x9c8460, roughness: 0.95 });
    group.add(silo, roof);
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), i % 3 === 0 ? mould : sack);
      b.scale.set(1, 0.7, 1);
      b.position.set(-5 + (i % 4) * 1.6, 0.5 + Math.floor(i / 4) * 0.9, -3 + Math.floor(i / 4) * 0.4);
      group.add(b);
    }
  } else if (theme === 'sanctum') {
    // A quiet open pavilion, and culture dishes glowing softly on a table.
    const marble = new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.4 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 6, 12), marble);
      c.position.set(Math.cos(a) * 7, 3, Math.sin(a) * 7 - 4);
      c.castShadow = true;
      group.add(c);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7, 0.3, 8, 40), marble);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 6.2, -4);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.2, 24), marble);
    table.position.set(0, 1, -4);
    group.add(ring, table);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0x0, emissive: col(PALETTE.life.cyan), emissiveIntensity: GLOW.glyph, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 5; i++) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 18), dishMat);
      const a = (i / 5) * Math.PI * 2;
      d.position.set(Math.cos(a) * 1.1, 1.14, Math.sin(a) * 1.1 - 4);
      group.add(d);
    }
  } else if (theme === 'foundry') {
    // Great fermentation vats, their brews glowing, joined by pipes.
    const steel = new THREE.MeshStandardMaterial({ color: 0x6a6f78, roughness: 0.35, metalness: 0.7 });
    const brews = [0xffc46b, 0x7dff5c, 0x8f6bff];
    const tops = [];
    for (let i = 0; i < 3; i++) {
      const x = -7 + i * 7;
      const vat = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 6, 18), steel);
      vat.position.set(x, 3, -8);
      vat.castShadow = true;
      const brew = new THREE.Mesh(new THREE.CircleGeometry(2.0, 24), new THREE.MeshStandardMaterial({ color: 0, emissive: col(brews[i]), emissiveIntensity: GLOW.life }));
      brew.rotation.x = -Math.PI / 2;
      brew.position.set(x, 6.02, -8);
      group.add(vat, brew);
      tops.push(new THREE.Vector3(x, 5, -8));
    }
    for (let i = 0; i < tops.length - 1; i++) {
      const a = tops[i].clone().add(new THREE.Vector3(1.8, 0, 0));
      const b = tops[i + 1].clone().add(new THREE.Vector3(-1.8, 0, 0));
      const pipe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 2.5, 0)), b), 20, 0.25, 8), steel);
      group.add(pipe);
    }
  }
  if (theme === 'village') {
    // Round houses around a fire, and the griot's stone where stories are told.
    const wall = new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.95 });
    const thatch = new THREE.MeshStandardMaterial({ color: 0x6a5230, roughness: 0.9 });
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (i / 4 - 0.5) * 2.4;
      const x = Math.cos(a) * 9;
      const z = Math.sin(a) * 9 - 2;
      const hut = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.1, 2.6, 14), wall);
      hut.position.set(x, 1.3, z);
      hut.castShadow = true;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 2.4, 14), thatch);
      roof.position.set(x, 3.8, z);
      group.add(hut, roof);
    }
    const stoneSeat = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 1, 8), new THREE.MeshStandardMaterial({ color: PALETTE.stone.basalt, roughness: 0.8 }));
    stoneSeat.position.set(0, 0.5, -6);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), new THREE.MeshStandardMaterial({ color: 0, emissive: col(0xff8a30), emissiveIntensity: GLOW.lifeStrong }));
    ember.position.set(0, 0.4, -2);
    const light = new THREE.PointLight(0xff9a50, 2, 22, 1.7);
    light.position.set(0, 1.5, -2);
    group.add(stoneSeat, ember, light);
  } else if (theme === 'terraces') {
    // Stepped fields brought back to life, each greener than the one below.
    for (let i = 0; i < 4; i++) {
      const tier = new THREE.Mesh(new THREE.BoxGeometry(18 - i * 3, 0.9, 4), new THREE.MeshStandardMaterial({ color: 0x5a4430, roughness: 0.95 }));
      tier.position.set(0, 0.45 + i * 0.9, -6 - i * 3);
      tier.castShadow = true;
      const crop = new THREE.Mesh(new THREE.BoxGeometry(17 - i * 3, 0.25, 3.4), new THREE.MeshStandardMaterial({ color: 0x2a3a1a, emissive: col(PALETTE.life.green), emissiveIntensity: 0.1 + i * 0.12, roughness: 0.8 }));
      crop.position.set(0, 1.0 + i * 0.9, -6 - i * 3);
      group.add(tier, crop);
    }
  } else if (theme === 'bio-forge') {
    // A bioreactor column ringed with light, and a bench of glowing flasks.
    const glass = new THREE.MeshStandardMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.25, roughness: 0.1 });
    const column = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 9, 20, 1, true), glass);
    column.position.set(0, 4.5, -8);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 8, 16), new THREE.MeshStandardMaterial({ color: 0, emissive: col(PALETTE.life.magenta), emissiveIntensity: GLOW.life, transparent: true, opacity: 0.55 }));
    core.position.set(0, 4.5, -8);
    group.add(column, core);
    for (let k = 0; k < 4; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.06, 6, 32), veinMaterial(PALETTE.life.cyan, GLOW.life));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 1.5 + k * 2.2, -8);
      group.add(ring);
    }
    const bench = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 1.6), new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.5, metalness: 0.4 }));
    bench.position.set(-6, 0.5, -3);
    group.add(bench);
    [0xffc46b, 0x7dff5c, 0x8f6bff, 0x4fffd0].forEach((c, i) => {
      const flask = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 10), new THREE.MeshStandardMaterial({ color: 0, emissive: col(c), emissiveIntensity: GLOW.life }));
      flask.position.set(-8 + i * 1.3, 1.35, -3);
      group.add(flask);
    });
  } else if (theme === 'sequence-sea') {
    // A shallow glowing pool, and over it a strand of letters — A, C, G, T.
    const pool = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshStandardMaterial({ color: 0x0a1a2a, emissive: col(0x2a6aa0), emissiveIntensity: 0.35, roughness: 0.15, metalness: 0.3 }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.06, -6);
    group.add(pool);
    const bases = [PALETTE.life.green, PALETTE.life.cyan, PALETTE.glyph.amber, PALETTE.life.magenta];
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      const cube = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), new THREE.MeshStandardMaterial({ color: 0, emissive: col(bases[Math.floor(hash(i + 900) * 4)]), emissiveIntensity: GLOW.glyph }));
      cube.position.set(-8 + t * 16, 1.4 + Math.sin(t * Math.PI * 3) * 0.8, -6 + Math.cos(t * Math.PI * 3) * 1.4);
      cube.rotation.set(t * 3, t * 5, 0);
      group.add(cube);
    }
  } else if (theme === 'sanctuary') {
    // A fenced paddock and a roost tree, its bats hanging in the dawn.
    const post = new THREE.CylinderGeometry(0.12, 0.14, 1.4, 6);
    const wood = new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.9 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const p = new THREE.Mesh(post, wood);
      p.position.set(Math.cos(a) * 8, 0.7, Math.sin(a) * 8 - 5);
      group.add(p);
    }
    const rail = new THREE.Mesh(new THREE.TorusGeometry(8, 0.06, 4, 48), wood);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(0, 1.2, -5);
    const tree = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 7, 10), bark);
    tree.position.set(0, 3.5, -5);
    const bough = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 7, 8), bark);
    bough.rotation.z = Math.PI / 2;
    bough.position.set(0, 6, -5);
    group.add(rail, tree, bough);
    const wing = new THREE.MeshStandardMaterial({ color: 0x1a1418, emissive: col(PALETTE.life.violet), emissiveIntensity: 0.25, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const bat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 4), wing);
      bat.rotation.x = Math.PI;
      bat.position.set(-3 + i * 1.2, 5.45, -5);
      group.add(bat);
    }
  }
  if (theme === 'spore-cannons') {
    // Pilobolus, the hat-thrower, enlarged: glassy stalks with swollen bulbs and
    // black caps, aimed at the light, and an arc of spores in flight.
    const stalkMat = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.55, roughness: 0.1, emissive: col(PALETTE.life.cyan), emissiveIntensity: 0.2 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.4 });
    const sporeMat = new THREE.MeshStandardMaterial({ color: 0, emissive: col(PALETTE.glyph.amber), emissiveIntensity: GLOW.lifeStrong });
    for (let i = 0; i < 5; i++) {
      const x = -8 + i * 4;
      const h = 4 + hash(i + 300) * 3;
      const lean = (hash(i + 301) - 0.5) * 0.5;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, h, 10), stalkMat);
      stalk.position.set(x, h / 2, -8);
      stalk.rotation.z = lean;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10), stalkMat);
      bulb.position.set(x - Math.sin(lean) * h, h + 0.5, -8);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
      cap.position.set(bulb.position.x, h + 1.3, -8);
      group.add(stalk, bulb, cap);
      for (let k = 1; k <= 6; k++) {
        const t = k / 6;
        const spore = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), sporeMat);
        spore.position.set(bulb.position.x - Math.sin(lean) * t * 8, h + 1.5 + t * 6 - t * t * 5, -8 + t * 3);
        group.add(spore);
      }
    }
  } else if (theme === 'grown-city') {
    // Buildings grown, not built: pale mycelium bricks stacked into towers and arches.
    const brick = new THREE.MeshStandardMaterial({ color: 0xe6dccb, roughness: 0.95 });
    const seam = veinMaterial(PALETTE.life.cyan, 0.4);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * 8;
      const z = Math.sin(a) * 8 - 5;
      const levels = 2 + Math.floor(hash(i + 400) * 4);
      for (let l = 0; l < levels; l++) {
        const block = new THREE.Mesh(new THREE.BoxGeometry(2.6 - l * 0.25, 1.4, 2.6 - l * 0.25), brick);
        block.position.set(x, 0.7 + l * 1.45, z);
        block.rotation.y = hash(i * 7 + l) * 0.4;
        block.castShadow = true;
        const band = new THREE.Mesh(new THREE.BoxGeometry(2.7 - l * 0.25, 0.06, 2.7 - l * 0.25), seam);
        band.position.set(x, 1.42 + l * 1.45, z);
        band.rotation.y = block.rotation.y;
        group.add(block, band);
      }
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(3, 0.7, 8, 24, Math.PI), brick);
    arch.position.set(0, 0, 1);
    group.add(arch);
  } else if (theme === 'wasteland') {
    // Poisoned ground on one side, and the mycelium mat spreading over it,
    // greening what it covers.
    const oil = new THREE.Mesh(new THREE.CircleGeometry(7, 32), new THREE.MeshStandardMaterial({ color: 0x07060a, roughness: 0.08, metalness: 0.6 }));
    oil.rotation.x = -Math.PI / 2;
    oil.position.set(-3, 0.05, -6);
    const rust = new THREE.MeshStandardMaterial({ color: 0x6a3a1e, roughness: 0.8, metalness: 0.5 });
    group.add(oil);
    for (let i = 0; i < 5; i++) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12), rust);
      barrel.position.set(-7 + hash(i + 450) * 6, 0.6, -10 + hash(i + 451) * 5);
      if (i % 2) { barrel.rotation.z = Math.PI / 2; barrel.position.y = 0.5; }
      group.add(barrel);
    }
    const mat = new THREE.MeshStandardMaterial({ color: 0xd8e8d0, emissive: col(PALETTE.life.green), emissiveIntensity: 0.45, roughness: 0.9 });
    for (let i = 0; i < 14; i++) {
      const patch = new THREE.Mesh(new THREE.CircleGeometry(0.8 + hash(i + 460) * 1.6, 12), mat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(2 + hash(i + 461) * 7, 0.07 + i * 0.001, -11 + hash(i + 462) * 10);
      group.add(patch);
    }
  }
  if (theme === 'observatory') {
    // A great sundial in the manner of Jantar Mantar's Samrāṭ Yantra: a stair-backed
    // gnomon rising to the sky, quadrant arcs either side, and a lamp of light.
    const sand = new THREE.MeshStandardMaterial({ color: PALETTE.stone.sand, roughness: 0.85 });
    const shape = new THREE.Shape();
    shape.moveTo(-7, 0);
    shape.lineTo(5, 0);
    shape.lineTo(5, 11);
    shape.closePath();
    const gnomon = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: false }), sand);
    gnomon.rotation.y = Math.PI / 2;
    gnomon.position.set(-1.1, 0, -8);
    gnomon.castShadow = true;
    group.add(gnomon);
    const edge = veinMaterial(PALETTE.gold.electrum, GLOW.life);
    for (const side of [-1, 1]) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.35, 8, 40, Math.PI / 2), sand);
      arc.position.set(side * 5, 0.2, -8);
      arc.rotation.y = Math.PI / 2;
      arc.rotation.z = side > 0 ? 0 : Math.PI / 2;
      const lit = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.08, 6, 40, Math.PI / 2), edge);
      lit.position.copy(arc.position);
      lit.rotation.copy(arc.rotation);
      group.add(arc, lit);
    }
    const lamp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), veinMaterial(PALETTE.gold.electrum, GLOW.focal));
    lamp.position.set(0, 12.2, -3);
    group.add(lamp);
  } else if (theme === 'mansions') {
    // Twenty-seven pillars in a ring, one for each mansion, their lamps cycling
    // through the colours of the night.
    const stoneMat = new THREE.MeshStandardMaterial({ color: PALETTE.stone.basalt, roughness: 0.75 });
    const hues = [PALETTE.glyph.cyan, PALETTE.life.violet, PALETTE.life.magenta, PALETTE.gold.electrum];
    for (let i = 0; i < 27; i++) {
      const a = (i / 27) * Math.PI * 2;
      const x = Math.cos(a) * 7;
      const z = Math.sin(a) * 7 - 7;
      const h = 1.6 + (i % 3) * 0.5;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, h, 8), stoneMat);
      pillar.position.set(x, h / 2, z);
      const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), veinMaterial(hues[i % hues.length], GLOW.lifeStrong));
      lamp.position.set(x, h + 0.45, z);
      group.add(pillar, lamp);
    }
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), veinMaterial(0xf2f0ff, GLOW.life));
    moon.position.set(0, 4.5, -7);
    group.add(moon);
  } else if (theme === 'lotus-shrine') {
    // A site in the Lotus Sanctuary: a low round dais and three lotuses in light,
    // violet, teal and gold, behind the stations.
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.4, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0x2a2440, roughness: 0.8 }));
    dais.position.set(0, 0.2, -7);
    group.add(dais);
    [0xa77bff, 0x5ff2e0, 0xf1d38a].forEach((c, i) => {
      const lotus = new THREE.Group();
      for (let k = 0; k < 8; k++) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI), veinMaterial(c, GLOW.life));
        petal.scale.set(0.6, 0.25, 1.2);
        petal.position.set(Math.sin((k / 8) * Math.PI * 2) * 0.5, 0, Math.cos((k / 8) * Math.PI * 2) * 0.5);
        petal.rotation.set(-0.7, (k / 8) * Math.PI * 2, 0);
        lotus.add(petal);
      }
      lotus.position.set(-3 + i * 3, 0.6 + (i === 1 ? 0.5 : 0), -7);
      group.add(lotus);
    });
  } else if (theme === 'almanac') {
    // The almanac wheel: thirty moons for the thirty tithis, waxing up one side
    // and waning down the other, round a sun.
    const goldMat = new THREE.MeshStandardMaterial({ color: 0x8a6a1e, emissive: col(PALETTE.gold.leaf), emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.35 });
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(5.4, 0.3, 10, 64), goldMat);
    wheel.position.set(0, 7, -8);
    group.add(wheel);
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + Math.PI / 2;
      const lit = (1 - Math.cos(((i + 1) / 30) * Math.PI * 2)) / 2;
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x14121a, emissive: col(0xf2f0ff), emissiveIntensity: 0.05 + lit * 1.4, roughness: 0.6 }),
      );
      moon.position.set(Math.cos(a) * 5.4, 7 + Math.sin(a) * 5.4, -8);
      group.add(moon);
    }
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 14), veinMaterial(0xffb43a, GLOW.focal));
    sun.position.set(0, 7, -8);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 0.5), goldMat);
    legL.position.set(-2.4, 3, -8);
    legL.rotation.z = -0.35;
    const legR = legL.clone();
    legR.position.x = 2.4;
    legR.rotation.z = 0.35;
    group.add(sun, legL, legR);
  }
  group.position.set(site.x, y, site.z);
  group.rotation.y = site.facing || 0;
  return group;
}

/**
 * Everything at one site. `setState(state, lessonsRead)` relights it; `stations`
 * and `shrine` carry their positions for the stage's "what is in reach" check.
 */
export function createSite(site, layout, heightAt, lessonIds) {
  const group = new THREE.Group();
  group.add(createCentrepiece(site.theme, site, heightAt));
  const stations = layout.stations.map((p) => createStation(p, heightAt));
  for (const s of stations) group.add(s.group);
  const shrine = createShrine(layout.shrine, heightAt);
  group.add(shrine.group);
  const plaque = createPlaque(site.name, layout.plaque, heightAt);
  group.add(plaque.sprite);

  const subtitle = {
    locked: 'Opens after your current module',
    available: 'Start this module here',
    open: 'Open to you',
    current: 'Your module — in progress',
    finished: 'Finished',
  };

  function setState(state, lessonsRead = new Set()) {
    const look = STATE_LOOK[state] || STATE_LOOK.locked;
    stations.forEach((s, i) => {
      const read = lessonsRead.has(lessonIds[i]);
      const l = read || state === 'finished' ? STATE_LOOK.finished : look;
      s.glyphMat.emissive.setHex(l.colour);
      s.glyphMat.emissiveIntensity = l.glow;
      s.done.visible = read || state === 'finished';
    });
    shrine.ringMat.emissive.setHex(look.colour);
    shrine.ringMat.emissiveIntensity = look.glow;
    shrine.light.color.setHex(look.colour);
    shrine.light.intensity = look.light * 2;
    plaque.draw(site.name, subtitle[state] || '');
  }

  function update(t) {
    for (const [i, s] of stations.entries()) {
      s.glyph.rotation.y = t * 0.6 + i;
      s.glyph.position.y = 1.9 + Math.sin(t * 1.3 + i) * 0.12;
    }
    shrine.ring.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.25;
    shrine.ring.rotation.z = t * 0.4;
  }

  return { group, stations, shrine, setState, update };
}

/** The way home: a standing ring with a slow swirl. */
export function createPortal(at, heightAt) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.22, 10, 48), veinMaterial(PALETTE.life.violet, GLOW.lifeStrong));
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 40),
    new THREE.MeshBasicMaterial({ color: PALETTE.life.violet, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.position.y = disc.position.y = 3.2;
  group.add(ring, disc);
  group.position.set(at.x, heightAt(at.x, at.z), at.z);
  return { group, update: (t) => { disc.material.opacity = 0.18 + Math.sin(t * 1.4) * 0.07; ring.rotation.z = t * 0.2; } };
}

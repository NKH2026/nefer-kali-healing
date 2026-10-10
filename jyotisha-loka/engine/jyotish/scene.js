/**
 * Jyotisha Loka, drawn: a psychedelic cosmos for a sky, the sidereal zodiac as a
 * vast wheel of twelve rāśis and twenty-seven nakshatras around the island, the
 * nine grahas orbiting on it at their real longitudes, and a golden orrery at the
 * island's heart. Positions come from sky.js; this file only draws them.
 *
 * The wheel is laid flat around the member, as the ecliptic is seen from the
 * Earth: sidereal 0° (the start of Aśvinī, Meṣa) is to the east (+x), and the
 * longitudes run anticlockwise seen from above, the way the grahas move.
 */
import * as THREE from 'three';
import { PALETTE, GLOW } from '../style.js';
import { GRAHAS, NAKSHATRAS, RASHIS, NAKSHATRA_SPAN } from './sky.js';

const col = (hex) => new THREE.Color(hex);
const rad = (deg) => (deg * Math.PI) / 180;

/** Where a sidereal longitude sits on a ring of radius `r` at height `y`. */
export function wheelPoint(lon, r, y = 0) {
  const a = rad(lon);
  return new THREE.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r);
}

/** How far out, and how high, each graha's orbit runs: an orrery, not a scale model. */
export const ORBITS = {
  chandra: { r: 112, y: 30 },
  budha: { r: 128, y: 36 },
  shukra: { r: 144, y: 42 },
  surya: { r: 164, y: 48 },
  mangala: { r: 184, y: 40 },
  guru: { r: 208, y: 54 },
  shani: { r: 232, y: 62 },
  rahu: { r: 252, y: 26 },
  ketu: { r: 252, y: 26 },
};
const WHEEL = { r: 300, y: 38 };

/** A text sprite: a glyph, a name, and an optional line under it. */
function textSprite(lines, { width = 512, height = 192, colour = '#f1d38a', sub = '#cfc6ff', scale = 24 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, fog: false }));
  sprite.scale.set(scale, (scale * height) / width, 1);
  const draw = (main, small = '') => {
    const g = canvas.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, width, height);
    g.textAlign = 'center';
    g.shadowColor = 'rgba(0,0,0,0.85)';
    g.shadowBlur = 12;
    g.fillStyle = colour;
    g.font = `600 ${Math.round(height * 0.34)}px Cinzel, Georgia, serif`;
    g.fillText(main, width / 2, height * 0.48);
    if (small) {
      g.fillStyle = sub;
      g.font = `${Math.round(height * 0.2)}px Inter, sans-serif`;
      g.fillText(small, width / 2, height * 0.82);
    }
    texture.needsUpdate = true;
  };
  draw(...lines);
  return { sprite, draw };
}

/** A soft additive halo, for the grahas' glow. */
let haloTexture = null;
function halo(colour, size) {
  if (!haloTexture) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
    }
    haloTexture = new THREE.CanvasTexture(c);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture, color: col(colour), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s.scale.setScalar(size);
  return s;
}

/* ── The sky ──────────────────────────────────────────────────────────────── */

/**
 * The cosmos: a slow kaleidoscope of twenty-seven petals turning round the
 * zenith, hue drifting through the whole wheel, nebulae, and stars. `tint` takes
 * the colour of the day's graha.
 */
export function createCosmosSky(palette) {
  const uniforms = {
    uZenith: { value: col(palette.zenith) },
    uHorizon: { value: col(palette.horizon) },
    uTint: { value: col(PALETTE.life.violet) },
    uTime: { value: 0 },
    uBloom: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uTint; uniform float uTime; uniform float uBloom;
      varying vec3 vDir;
      float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float noise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      vec3 hsv(float h, float s, float v) {
        vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return v * mix(vec3(1.0), k, s);
      }
      void main() {
        vec3 d = normalize(vDir);
        float up = clamp(d.y, -1.0, 1.0);
        vec3 c = mix(uHorizon, uZenith, smoothstep(-0.1, 0.9, up));
        // The mandala: twenty-seven petals turning about the zenith.
        float ang = atan(d.z, d.x);
        float seg = 6.2831853 / 27.0;
        float a = abs(mod(ang + uTime * 0.01, seg) - seg * 0.5) / seg;   // mirrored, 0..0.5
        float polar = acos(up);
        float petals = sin(a * 9.0 + polar * 14.0 - uTime * 0.25) * 0.5 + 0.5;
        float rings = sin(polar * 42.0 - uTime * 0.4) * 0.5 + 0.5;
        float hue = fract(ang / 6.2831853 + polar * 0.35 + uTime * 0.006);
        float veil = smoothstep(0.05, 0.95, up);
        c += hsv(hue, 0.75, 0.22) * petals * veil * uBloom;
        c += hsv(hue + 0.5, 0.6, 0.08) * rings * smoothstep(0.55, 1.0, up) * uBloom;
        // Nebulae drifting through, in the day's colour.
        float n = noise(d * 3.0 + vec3(0.0, uTime * 0.01, 0.0)) * 0.6 + noise(d * 8.0) * 0.4;
        c += uTint * smoothstep(0.55, 0.9, n) * 0.35;
        c += hsv(hue + 0.33, 0.7, 0.18) * smoothstep(0.66, 0.95, noise(d * 5.0 + 11.0));
        // Stars, twinkling.
        vec3 cell = floor(d * 240.0);
        float h = hash(cell);
        c += vec3(1.0, 0.96, 0.9) * step(0.992, h) * (0.6 + 0.4 * sin(uTime * (0.5 + h * 3.0) + h * 40.0));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return {
    mesh,
    update: (t) => { uniforms.uTime.value = t; },
    setTint: (hex) => uniforms.uTint.value.set(hex),
  };
}

/* ── The zodiac wheel ─────────────────────────────────────────────────────── */

/**
 * The twelve signs and twenty-seven mansions around the island. `highlight(i)`
 * lights the mansion the Moon is in.
 */
export function createZodiacWheel({ quality = 'high' } = {}) {
  const group = new THREE.Group();
  const gold = new THREE.MeshBasicMaterial({ color: PALETTE.gold.electrum, transparent: true, opacity: 0.75, fog: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(WHEEL.r, 0.9, 6, 180), gold);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = WHEEL.y;
  const inner = new THREE.Mesh(new THREE.TorusGeometry(WHEEL.r - 26, 0.5, 6, 180), gold);
  inner.rotation.x = Math.PI / 2;
  inner.position.y = WHEEL.y;
  group.add(ring, inner);

  // Twelve spokes between the signs, and each sign's name.
  for (let i = 0; i < 12; i++) {
    const a = wheelPoint(i * 30, WHEEL.r - 13, WHEEL.y);
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 0.5), gold);
    spoke.position.copy(a);
    spoke.rotation.y = rad(i * 30);
    group.add(spoke);
    const label = textSprite([RASHIS[i]], { width: 512, height: 128, colour: '#f1d38a', scale: 30 });
    label.sprite.position.copy(wheelPoint(i * 30 + 15, WHEEL.r - 13, WHEEL.y + 6));
    group.add(label.sprite);
  }

  // Twenty-seven mansions: a lamp and a name for each, at its centre.
  const lamps = NAKSHATRAS.map((n, i) => {
    const mid = (i + 0.5) * NAKSHATRA_SPAN;
    const lampMat = new THREE.MeshBasicMaterial({ color: PALETTE.glyph.cyan, transparent: true, opacity: 0.5, fog: false });
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(2.4, 0), lampMat);
    lamp.position.copy(wheelPoint(mid, WHEEL.r + 12, WHEEL.y + 4));
    const glow = halo(PALETTE.glyph.cyan, 14);
    glow.position.copy(lamp.position);
    glow.material.opacity = 0.35;
    const label = textSprite([`${n.icon} ${n.name}`], { width: 512, height: 128, colour: '#bff6ff', scale: quality === 'low' ? 26 : 30 });
    label.sprite.position.copy(wheelPoint(mid, WHEEL.r + 12, WHEEL.y + 14));
    group.add(lamp, glow, label.sprite);
    return { lamp, lampMat, glow, label, base: label.sprite.scale.clone() };
  });

  let lit = -1;
  return {
    group,
    highlight(index) {
      if (index === lit) return;
      lit = index;
      lamps.forEach((l, i) => {
        const on = i === index;
        l.lampMat.color.set(on ? PALETTE.gold.electrum : PALETTE.glyph.cyan);
        l.lampMat.opacity = on ? 1 : 0.5;
        l.glow.material.color.set(on ? PALETTE.gold.electrum : PALETTE.glyph.cyan);
        l.glow.material.opacity = on ? 0.95 : 0.35;
        l.glow.scale.setScalar(on ? 40 : 14);
        l.label.sprite.scale.copy(l.base).multiplyScalar(on ? 1.5 : 1);
      });
    },
    update(t) {
      lamps.forEach((l, i) => { l.lamp.rotation.y = t * 0.6 + i; });
    },
  };
}

/* ── The grahas ───────────────────────────────────────────────────────────── */

/** A graha's sphere: lit from within, ringed for Śani, smoky for the shadow grahas. */
function grahaBody(g) {
  const group = new THREE.Group();
  let mat;
  if (g.shadow) {
    // Rāhu and Ketu are points, not bodies: a dark sphere with a burning rim.
    mat = new THREE.ShaderMaterial({
      uniforms: { uRim: { value: col(g.colour) }, uTime: { value: 0 } },
      transparent: true,
      vertexShader: /* glsl */`
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uRim; uniform float uTime; varying vec3 vN; varying vec3 vV;
        void main() {
          float rim = pow(1.0 - max(dot(vN, vV), 0.0), 2.2);
          float flicker = 0.75 + 0.25 * sin(uTime * 2.3 + vN.y * 6.0);
          gl_FragColor = vec4(uRim * rim * 2.2 * flicker, 0.9);
        }`,
    });
  } else {
    mat = new THREE.MeshStandardMaterial({ color: col(g.colour).multiplyScalar(0.35), emissive: col(g.colour), emissiveIntensity: g.id === 'surya' ? GLOW.focal : GLOW.life, roughness: 0.5 });
  }
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(g.size, 32, 20), mat);
  group.add(sphere);
  const glow = halo(g.colour, g.size * (g.id === 'surya' ? 9 : 5));
  glow.material.opacity = g.shadow ? 0.45 : 0.8;
  group.add(glow);
  if (g.ring) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(g.size * 1.4, g.size * 2.3, 48),
      new THREE.MeshBasicMaterial({ color: 0xc9b98a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, fog: false }),
    );
    ring.rotation.x = Math.PI / 2.6;
    group.add(ring);
  }
  if (g.id === 'ketu') {
    // Ketu is the dragon's tail: a fading plume behind it.
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(g.size * 0.9, g.size * 9, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: col(g.colour), transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
    );
    tail.rotation.z = Math.PI / 2;
    tail.position.x = g.size * 4.5;
    group.add(tail);
  }
  return { group, sphere, mat, glow };
}

/**
 * The nine grahas, each on its own orbit around the island. `setPositions(list)`
 * takes sky.js `grahaPositions()` and eases each graha to its place.
 */
export function createGrahas({ quality = 'high' } = {}) {
  const group = new THREE.Group();
  const orbitMat = (hex) => new THREE.MeshBasicMaterial({ color: col(hex), transparent: true, opacity: 0.22, fog: false, depthWrite: false });
  const items = GRAHAS.map((g) => {
    const o = ORBITS[g.id];
    if (g.id !== 'ketu') {
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(o.r, g.id === 'rahu' ? 0.35 : 0.25, 4, quality === 'low' ? 96 : 180), orbitMat(g.colour));
      orbit.rotation.x = Math.PI / 2;
      orbit.position.y = o.y;
      group.add(orbit);
    }
    const body = grahaBody(g);
    const label = textSprite([`${g.glyph} ${g.name}`, g.english], { width: 512, height: 192, colour: '#ffffff', scale: 22 + g.size * 1.5 });
    label.sprite.position.y = g.size + 7;
    body.group.add(label.sprite);
    group.add(body.group);
    return { g, o, body, label, lon: null, shown: null };
  });
  const sunLight = new THREE.PointLight(GRAHAS[0].colour, 2.2, 0, 0);
  group.add(sunLight);

  return {
    group,
    items,
    /** @param {Array} positions sky.js grahaPositions() */
    setPositions(positions, { varaGraha = null } = {}) {
      for (const it of items) {
        const p = positions.find((x) => x.id === it.g.id);
        if (!p) continue;
        it.lon = p.lon;
        it.place = p;
        if (it.shown == null) it.shown = p.lon;
        const day = varaGraha && varaGraha === it.g.id;
        it.label.draw(`${it.g.glyph} ${it.g.name}${p.retrograde && !it.g.shadow ? ' ℞' : ''}`, `${it.g.english} · ${p.rashiName} · ${p.nakshatra.name}${day ? ' · lord of the day' : ''}`);
        it.body.glow.scale.setScalar(it.g.size * (it.g.id === 'surya' ? 9 : 5) * (day ? 1.8 : 1));
      }
    },
    /** Ease each graha toward its longitude (so a jump in time sweeps, not snaps). */
    update(dt, t) {
      for (const it of items) {
        if (it.lon == null) continue;
        let delta = ((it.lon - it.shown + 540) % 360) - 180;
        it.shown += delta * Math.min(1, dt * 3);
        const at = wheelPoint(it.shown, it.o.r, it.o.y + Math.sin(t * 0.4 + it.o.r) * 1.2);
        it.body.group.position.copy(at);
        it.body.sphere.rotation.y = t * 0.3;
        if (it.body.mat.uniforms?.uTime) it.body.mat.uniforms.uTime.value = t;
        if (it.g.id === 'surya') sunLight.position.copy(at);
        if (it.g.id === 'ketu') it.body.group.rotation.y = rad(it.shown) + Math.PI;
      }
    },
  };
}

/* ── The orrery at the heart of the island ────────────────────────────────── */

/**
 * A walk-up golden armillary: nested rings slowly turning, the Earth at the
 * centre, and the nine grahas in miniature at their true longitudes.
 */
export function createOrrery(cfg, heightAt) {
  const group = new THREE.Group();
  const base = heightAt(cfg.x, cfg.z);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0x8a6a1e, emissive: col(PALETTE.gold.leaf), emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.8 });
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius, cfg.radius + 1.2, 1.2, 48), new THREE.MeshStandardMaterial({ color: PALETTE.stone.basalt, roughness: 0.7 }));
  plinth.position.y = 0.6;
  group.add(plinth);
  const centre = new THREE.Vector3(0, cfg.height * 0.55, 0);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 16), new THREE.MeshStandardMaterial({ color: 0x1f4a7a, emissive: col(PALETTE.life.cyan), emissiveIntensity: 0.4, roughness: 0.6 }));
  earth.position.copy(centre);
  group.add(earth);
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(cfg.radius * (0.55 + i * 0.16), 0.12, 8, 96), goldMat);
    r.position.copy(centre);
    r.rotation.set(Math.PI / 2 + i * 0.5, i * 0.7, 0);
    group.add(r);
    rings.push(r);
  }
  const ecliptic = new THREE.Mesh(new THREE.TorusGeometry(cfg.radius * 0.9, 0.16, 8, 120), goldMat);
  ecliptic.position.copy(centre);
  ecliptic.rotation.x = Math.PI / 2;
  group.add(ecliptic);
  const minis = GRAHAS.map((g) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.22 + g.size * 0.07, 14, 10),
      g.shadow
        ? new THREE.MeshBasicMaterial({ color: col(g.colour).multiplyScalar(0.6) })
        : new THREE.MeshStandardMaterial({ color: 0, emissive: col(g.colour), emissiveIntensity: GLOW.lifeStrong }),
    );
    group.add(m);
    return { g, m, r: cfg.radius * (0.35 + (ORBITS[g.id].r - 112) / 140 * 0.55) };
  });
  const light = new THREE.PointLight(PALETTE.gold.electrum, 2.4, 40, 1.6);
  light.position.copy(centre);
  group.add(light);
  group.position.set(cfg.x, base, cfg.z);
  return {
    group,
    at: { x: cfg.x, z: cfg.z },
    setPositions(positions) {
      for (const mini of minis) {
        const p = positions.find((x) => x.id === mini.g.id);
        if (p) mini.m.position.copy(wheelPoint(p.lon, mini.r, centre.y));
      }
    },
    update(t) {
      rings.forEach((r, i) => { r.rotation.z = t * (0.08 + i * 0.05) * (i % 2 ? -1 : 1); });
      earth.rotation.y = t * 0.5;
    },
  };
}

/* ── Altars ───────────────────────────────────────────────────────────────── */

/**
 * A small altar the member walks up to: a stepped stone, a floating emblem that
 * turns, and a light. `setGlow(level)` brightens it (0..1).
 */
export function createAltar(at, heightAt, { colour = PALETTE.life.violet, emblem = 'octa' } = {}) {
  const group = new THREE.Group();
  const y = heightAt(at.x, at.z);
  const stone = new THREE.MeshStandardMaterial({ color: PALETTE.stone.basalt, roughness: 0.8 });
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(new THREE.CylinderGeometry(2.4 - i * 0.6, 2.6 - i * 0.6, 0.45, 8), stone);
    step.position.y = 0.22 + i * 0.45;
    group.add(step);
  }
  const mat = new THREE.MeshStandardMaterial({ color: 0, emissive: col(colour), emissiveIntensity: GLOW.life, roughness: 0.3 });
  const geo = emblem === 'star' ? new THREE.IcosahedronGeometry(0.9, 0) : emblem === 'moon' ? new THREE.TorusGeometry(0.8, 0.28, 10, 32, Math.PI * 1.4) : new THREE.OctahedronGeometry(0.9, 0);
  const mark = new THREE.Mesh(geo, mat);
  mark.position.y = 3;
  const glow = halo(colour, 6);
  glow.position.y = 3;
  const light = new THREE.PointLight(colour, 1.2, 16, 1.8);
  light.position.y = 3;
  group.add(mark, glow, light);
  group.position.set(at.x, y, at.z);
  let level = 0.4;
  return {
    group,
    at,
    setGlow(v) { level = v; },
    setColour(hex) { mat.emissive.set(hex); glow.material.color.set(hex); light.color.set(hex); },
    update(t) {
      mark.rotation.y = t * 0.9;
      mark.position.y = 3 + Math.sin(t * 1.4) * 0.2;
      mat.emissiveIntensity = GLOW.life * (0.5 + level);
      glow.material.opacity = 0.3 + 0.6 * level;
      light.intensity = 0.6 + 1.8 * level;
    },
  };
}

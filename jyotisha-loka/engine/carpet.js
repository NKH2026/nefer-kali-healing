/**
 * The flying magic carpet.
 *
 * Three things live here, deliberately separated:
 *
 *   `buildCarpetMesh()`  the object — fringe, tassels, a woven pattern, a glow.
 *   `CarpetTrail`        the ribbon of light it leaves behind, pooled and bounded.
 *   `CarpetRider`        the interaction — who may mount, when, and what the
 *                        player's body and camera do while riding.
 *
 * The physics is NOT here: it is `flight.js`, which is pure. This module is the
 * part that needs a scene, and it is written so that nothing about the *feel* of
 * flying is decided in it.
 *
 * ── The one design decision worth arguing about ─────────────────────────────
 *
 * You steer with your eyes. The carpet's heading chases wherever the camera is
 * looking, so a newcomer's first instinct — turn your head and go that way —
 * simply works, on a mouse and on a phone, with no new control to learn. A and D
 * (or the stick's sideways axis) then *trim* the turn for fine flying, which is
 * what stops "look somewhere" from being the only available input.
 *
 * Banking follows the heading's rate of change, so the carpet rolls into a turn
 * and sits flat when hovering. The pitch follows vertical speed. Both are
 * cosmetic and both come straight from the flight state.
 */
import * as THREE from 'three';
import { CARPET, FLIGHT, PLAYER, WORLD } from './config.js';
import { glowMushroom, mat, makeRng } from './world/props.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { canLand, createFlightState, dismountHeight, dismountVelocity, stepFlight } from './flight.js';

/* ── the object ───────────────────────────────────────────────────────────── */

/**
 * How far the cloth lifts or drops at a point on the rug, in metres.
 *
 * A ripple that runs from the leading edge (-Z, the way the carpet flies) to the
 * trailing one, growing toward the back and toward the sides, and harder the
 * faster it is flown; a little lip curled up along the front. Pure, so the fringe
 * can ride the same surface and a test can hold it to its limits. Small in the
 * middle on purpose: that is where the rider sits, and the flight model's deck is
 * flat.
 *
 * @param {number} x  across the rug, -W/2 … W/2
 * @param {number} z  along it, -D/2 (front) … D/2 (back)
 * @param {number} t  seconds
 * @param {number} drive  0 parked … 1 flown hard
 * @param {{w:number, d:number}} [size]
 */
export function rugWave(x, z, t, drive = 0, size = { w: 2.8, d: 4.0 }) {
  const along = (z + size.d / 2) / size.d; // 0 front … 1 back
  const across = Math.min(1, Math.abs(x) / (size.w / 2));
  const amp = (0.012 + 0.07 * drive) * (0.2 + along * along * 1.5 + across * across * 0.5);
  const speed = 2.6 + drive * 7;
  let y = amp * Math.sin(z * 2.4 - t * speed + x * 0.7);
  y += amp * 0.35 * Math.sin(x * 3.1 + t * 2.3 + z);
  // The front lip, curled up so the leading edge reads as cloth meeting the wind.
  const lip = Math.max(0, 1 - (z + size.d / 2) / 0.4);
  y += lip * lip * (0.07 + 0.05 * drive);
  return y;
}

/**
 * The rug's face: a Persian-style design drawn on a canvas, plus a second canvas
 * holding only the gold threads, which becomes the emissive map — so the pattern
 * itself glows under the bloom, rather than a ladder of boxes laid on top of it.
 */
function rugTextures({ field, fieldDeep, border, gold, accent }) {
  if (typeof document === 'undefined') return null;
  const Wpx = 512;
  const Hpx = 732; // the rug's 2.8 : 4 proportion
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = Wpx;
    c.height = Hpx;
    return c;
  };
  const base = mk();
  const glow = mk();
  const b = base.getContext('2d');
  const g = glow.getContext('2d');
  const hex = (n) => '#' + n.toString(16).padStart(6, '0');
  g.fillStyle = '#000';
  g.fillRect(0, 0, Wpx, Hpx);

  // Both canvases get every gold stroke; only `b` gets the colour underneath.
  const both = (fn) => {
    fn(b, hex(gold));
    fn(g, '#ffffff');
  };

  // ---- field: a wine gradient, darker at the edges like a well-loved rug
  const grad = b.createRadialGradient(Wpx / 2, Hpx / 2, 40, Wpx / 2, Hpx / 2, Hpx * 0.62);
  grad.addColorStop(0, hex(field));
  grad.addColorStop(1, hex(fieldDeep));
  b.fillStyle = grad;
  b.fillRect(0, 0, Wpx, Hpx);

  // ---- a faint lattice across the field
  b.strokeStyle = 'rgba(0,0,0,0.22)';
  b.lineWidth = 2;
  for (let k = -Hpx; k < Wpx + Hpx; k += 36) {
    b.beginPath();
    b.moveTo(k, 0);
    b.lineTo(k + Hpx * 0.7, Hpx);
    b.moveTo(k + Hpx * 0.7, 0);
    b.lineTo(k, Hpx);
    b.stroke();
  }

  // ---- border band, with gold guard lines either side and a running motif
  const BW = 46;
  b.fillStyle = hex(border);
  b.fillRect(0, 0, Wpx, BW);
  b.fillRect(0, Hpx - BW, Wpx, BW);
  b.fillRect(0, 0, BW, Hpx);
  b.fillRect(Wpx - BW, 0, BW, Hpx);
  both((c, col) => {
    c.strokeStyle = col;
    c.lineWidth = 3;
    c.strokeRect(6, 6, Wpx - 12, Hpx - 12);
    c.strokeRect(BW, BW, Wpx - 2 * BW, Hpx - 2 * BW);
    c.lineWidth = 1.5;
    c.strokeRect(BW + 8, BW + 8, Wpx - 2 * BW - 16, Hpx - 2 * BW - 16);
  });
  // Running diamonds and dots in the border: the rhythm the eye follows.
  const motif = (cx, cy) =>
    both((c, col) => {
      c.strokeStyle = col;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx, cy - 11);
      c.lineTo(cx + 11, cy);
      c.lineTo(cx, cy + 11);
      c.lineTo(cx - 11, cy);
      c.closePath();
      c.stroke();
      c.fillStyle = col;
      c.beginPath();
      c.arc(cx, cy, 2.6, 0, Math.PI * 2);
      c.fill();
    });
  for (let x = BW + 18; x < Wpx - BW; x += 34) {
    motif(x, BW / 2 + 3);
    motif(x, Hpx - BW / 2 - 3);
  }
  for (let y = BW + 18; y < Hpx - BW; y += 34) {
    motif(BW / 2 + 3, y);
    motif(Wpx - BW / 2 - 3, y);
  }

  // ---- corner spandrels: quarter medallions in the field's corners
  const corners = [[BW + 8, BW + 8, 0], [Wpx - BW - 8, BW + 8, 1], [BW + 8, Hpx - BW - 8, 3], [Wpx - BW - 8, Hpx - BW - 8, 2]];
  for (const [cx, cy, q] of corners) {
    const a0 = (q * Math.PI) / 2;
    both((c, col) => {
      c.strokeStyle = col;
      for (const r of [70, 54, 38]) {
        c.lineWidth = r === 70 ? 2.5 : 1.5;
        c.beginPath();
        c.arc(cx, cy, r, a0, a0 + Math.PI / 2);
        c.stroke();
      }
    });
  }

  // ---- the central medallion: an eight-pointed star in a lobed ring, an ankh at
  //      its heart, and the accent colour glowing between the lines.
  const cx = Wpx / 2;
  const cy = Hpx / 2;
  b.fillStyle = hex(fieldDeep);
  b.beginPath();
  b.ellipse(cx, cy, 128, 150, 0, 0, Math.PI * 2);
  b.fill();
  const star = (c, r, rot) => {
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const rr = i % 2 ? r * 0.62 : r;
      const a = rot + (i / 16) * Math.PI * 2;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr * 1.15;
      if (i) c.lineTo(px, py);
      else c.moveTo(px, py);
    }
    c.closePath();
  };
  // Accent glow inside the star: on both canvases, tinted.
  b.fillStyle = hex(accent);
  b.globalAlpha = 0.35;
  star(b, 92, 0);
  b.fill();
  b.globalAlpha = 1;
  g.fillStyle = 'rgba(120,255,240,0.35)';
  star(g, 92, 0);
  g.fill();
  both((c, col) => {
    c.strokeStyle = col;
    c.lineWidth = 3;
    star(c, 92, 0);
    c.stroke();
    c.lineWidth = 2;
    star(c, 62, Math.PI / 8);
    c.stroke();
    // lobed ring
    c.lineWidth = 2.5;
    c.beginPath();
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const r = 120 + Math.sin(a * 12) * 6;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r * 1.2;
      if (i) c.lineTo(px, py);
      else c.moveTo(px, py);
    }
    c.stroke();
    // the ankh
    c.lineWidth = 5;
    c.beginPath();
    c.ellipse(cx, cy - 18, 11, 14, 0, 0, Math.PI * 2);
    c.moveTo(cx, cy - 4);
    c.lineTo(cx, cy + 34);
    c.moveTo(cx - 17, cy + 4);
    c.lineTo(cx + 17, cy + 4);
    c.stroke();
  });
  // Small medallions up and down the long axis
  for (const dy of [-230, 230]) {
    both((c, col) => {
      c.strokeStyle = col;
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(cx, cy + dy, 34, 30, 0, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(cx, cy + dy - 22);
      c.lineTo(cx + 22, cy + dy);
      c.lineTo(cx, cy + dy + 22);
      c.lineTo(cx - 22, cy + dy);
      c.closePath();
      c.stroke();
    });
  }

  const map = new THREE.CanvasTexture(base);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const emissiveMap = new THREE.CanvasTexture(glow);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.anisotropy = 8;

  // ---- the weave: a tiny over-under bump pattern, tiled, as a normal map
  const N = 32;
  const wc = document.createElement('canvas');
  wc.width = wc.height = N;
  const w = wc.getContext('2d');
  const img = w.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const cellX = Math.floor(x / 4);
      const cellY = Math.floor(y / 4);
      const over = (cellX + cellY) % 2 === 0;
      const fx = (x % 4) / 3 - 0.5;
      const fy = (y % 4) / 3 - 0.5;
      // Each stitch bulges along its own direction.
      const nx = over ? -fx * 0.9 : 0;
      const ny = over ? 0 : -fy * 0.9;
      const len = Math.hypot(nx, ny, 1);
      const i = (y * N + x) * 4;
      img.data[i] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  }
  w.putImageData(img, 0, 0);
  const weave = new THREE.CanvasTexture(wc);
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(28, 40);
  weave.colorSpace = THREE.NoColorSpace;

  return { map, emissiveMap, weave };
}

/**
 * Build the carpet: a woven rug that floats.
 *
 * One cloth — a finely divided plane whose vertices `syncMesh` ripples each frame
 * with `rugWave` — wearing a drawn Persian-style design whose gold threads glow,
 * with velvet sheen and a weave you can see up close. A fringe of corded tassels
 * on both short ends rides the same ripple, and a velvet cushion sits where the
 * rider does. The footprint (2.8 × 4 m) is the one the flight model and the
 * mounting tests were tuned for, so none of the riding changes.
 */
export function buildCarpetMesh(colors = {}) {
  const {
    rug = 0x7d1650,
    rugDeep = 0x3b0a2e,
    border = 0x1b0b36,
    weave = 0xffd27a,
    glow = 0x7ffff0,
    trim = 0xff5ce1,
  } = colors;

  const group = new THREE.Group();
  group.name = 'magic-carpet';

  const W = 2.8;
  const D = 4.0;
  const SEG_X = 24;
  const SEG_Z = 34;

  // ---- the cloth
  const clothGeo = new THREE.PlaneGeometry(W, D, SEG_X, SEG_Z);
  clothGeo.rotateX(-Math.PI / 2);
  const basePositions = Float32Array.from(clothGeo.attributes.position.array);
  const tex = rugTextures({ field: rug, fieldDeep: rugDeep, border, gold: weave, accent: glow });
  const rugMat = new THREE.MeshPhysicalMaterial({
    color: tex ? 0xffffff : rug,
    map: tex?.map ?? null,
    emissive: weave,
    emissiveMap: tex?.emissiveMap ?? null,
    emissiveIntensity: tex ? 0.75 : 0.08,
    normalMap: tex?.weave ?? null,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.82,
    metalness: 0,
    // Velvet: a soft rim of light on the pile, warm pink-gold.
    sheen: 1,
    sheenColor: new THREE.Color(0xffa3d6),
    sheenRoughness: 0.42,
    side: THREE.DoubleSide,
  });
  const body = new THREE.Mesh(clothGeo, rugMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  const bandMat = rugMat;

  // ---- fringe: corded tassels — a cord, a gold knot, a splayed brush — along the
  //      two short ends. One instanced mesh, so 24 tassels cost one draw call.
  const cord = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 5);
  cord.translate(0, -0.08, 0);
  const knot = new THREE.SphereGeometry(0.035, 8, 6);
  knot.translate(0, -0.17, 0);
  const brush = new THREE.ConeGeometry(0.05, 0.3, 7, 1, true);
  brush.rotateX(Math.PI);
  brush.translate(0, -0.33, 0);
  const tasselGeo = mergeGeometries([cord.toNonIndexed(), knot.toNonIndexed(), brush.toNonIndexed()]);
  // Built hanging DOWN from its root; the per-frame transform swings it from there.
  tasselGeo.rotateX(Math.PI);
  const tasselMat = mat(weave, {
    emissive: glow,
    emissiveIntensity: 0.6,
    roughness: 0.45,
    metalness: 0.3,
    flat: false,
    side: THREE.DoubleSide,
  });
  const PER_END = 12;
  const COUNT = PER_END * 2;
  const tassels = new THREE.InstancedMesh(tasselGeo, tasselMat, COUNT);
  tassels.frustumCulled = false;
  tassels.castShadow = true;
  group.add(tassels);

  // Remembered so the per-frame update can place them without allocating.
  const tasselBase = [];
  for (let e = 0; e < 2; e++) {
    const z = e === 0 ? -D / 2 : D / 2;
    for (let i = 0; i < PER_END; i++) {
      const t = PER_END === 1 ? 0.5 : i / (PER_END - 1);
      tasselBase.push({ x: -W / 2 + 0.1 + t * (W - 0.2), z, end: e });
    }
  }

  // ---- the cushion the rider sits on: plump velvet, gold-piped, tasselled.
  const cushion = new THREE.Mesh(
    new RoundedBoxGeometry(1.05, 0.2, 0.8, 4, 0.09),
    new THREE.MeshPhysicalMaterial({
      color: border,
      roughness: 0.75,
      sheen: 1,
      sheenColor: new THREE.Color(trim),
      sheenRoughness: 0.35,
    }),
  );
  cushion.scale.set(1, 1, 1);
  cushion.position.set(0, 0.1, 0.3);
  cushion.castShadow = true;
  cushion.receiveShadow = true;
  group.add(cushion);
  const piping = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.012, 6, 48),
    mat(weave, { emissive: weave, emissiveIntensity: 0.6, roughness: 0.35, metalness: 0.5, flat: false }),
  );
  piping.scale.set(0.53, 0.41, 1);
  piping.rotation.x = Math.PI / 2;
  piping.position.set(0, 0.2, 0.3);
  group.add(piping);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const bob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), tasselMat);
    bob.position.set(sx * 0.53, 0.1, 0.3 + sz * 0.4);
    group.add(bob);
  }

  // ---- glow beneath: a soft disc of light, and the carpet's own little
  //      mushroom motif, which ties it to the rest of the realm's vocabulary.
  //      Bright enough to be an obvious landmark from across the clearing: this
  //      is the one object in the realm you are meant to walk up to and use, so
  //      "findable without being told" matters more here than subtlety.
  const underGlow = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 24),
    new THREE.MeshBasicMaterial({
      color: glow,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    }),
  );
  underGlow.rotation.x = -Math.PI / 2;
  underGlow.position.y = -0.24;
  underGlow.renderOrder = 4;
  group.add(underGlow);

  // ---- a rail of four small glowing mushrooms across the front, behind the lip.
  //      It is a magic carpet in a mycelial church; the motif earns its place.
  const rng = makeRng(913);
  const motif = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const mush = glowMushroom({
      height: 0.26 + rng.next() * 0.1,
      capRadius: 0.13 + rng.next() * 0.05,
      capColor: trim,
      spotColor: glow,
      stemColor: 0xe8dcc0,
      spots: 4,
      rng,
    });
    mush.position.set(-W / 2 + 0.55 + i * 0.56, 0.02, -D / 2 + 0.62);
    motif.add(mush);
  }
  group.add(motif);

  return {
    group,
    /** Purely so the world can pulse the rug with the music like everything else. */
    materials: { body: body.material, trim: bandMat, tasselMat, underGlow: underGlow.material },
    tassels,
    tasselBase,
    underGlow,
    /** The rippling cloth: its geometry and the flat positions it is displaced from. */
    cloth: { geometry: clothGeo, base: basePositions },
    cushion,
    /** Edges, for the HUD/debug and for tests that want to know it is a rug. */
    size: { w: W, d: D },
  };
}

/* ── the trail ────────────────────────────────────────────────────────────── */

/**
 * The ribbon of light the carpet leaves behind.
 *
 * A single triangle strip whose vertices are rewritten from a ring buffer of
 * past positions. Bounded twice over — a fixed vertex count AND a fixed age —
 * so flying for an hour costs exactly what flying for a second costs, and the
 * trail never becomes an ever-growing line across the sky.
 *
 * Vertex colours carry the fade, because an additive ribbon that does not fade
 * at its tail reads as a solid pipe rather than a wake.
 */
export class CarpetTrail {
  /**
   * @param {number} [seconds] how long the tail is, in seconds of flight
   * @param {number} [width]   half-width of the ribbon, metres
   */
  constructor(seconds = CARPET.trailSeconds, width = 1.5) {
    this.seconds = seconds;
    this.width = width;
    /** How many samples the tail holds. One per `CARPET.trailStep`. */
    this.capacity = 96;
    /** How far apart samples are taken, metres. */
    this.step = CARPET.trailStep;

    const n = this.capacity;
    this.positions = new Float32Array(n * 2 * 3);
    this.colors = new Float32Array(n * 2 * 3);
    this.alphas = new Float32Array(n * 2);
    this.indices = [];

    // Two triangles per segment between consecutive samples. The strip is built
    // once and only the attributes change, so the geometry is never rebuilt.
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      this.indices.push(a, b, d, a, d, c);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    geo.setIndex(this.indices);
    geo.setDrawRange(0, 0);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uFogColor: { value: new THREE.Color(WORLD.fogColor) },
        uFogDensity: { value: 0.0016 },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vDepth;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vDepth;
        uniform vec3 uFogColor;
        uniform float uFogDensity;
        void main() {
          if (vAlpha <= 0.001) discard;
          // The trail lives in open sky, so it gets a light exponential fog of
          // its own rather than the world's heavier ground fog: a wake you
          // cannot see from the next island is not a wake.
          float f = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
          gl_FragColor = vec4(mix(vColor, uFogColor, clamp(f, 0.0, 1.0)), vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });

    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    this.mesh.visible = false;
    /** Nothing in the trail is ever something you can stand on. */
    this.mesh.userData.noSupport = true;

    this.geometry = geo;
    /** Ring buffer of sample points, oldest first conceptually. */
    this.samples = [];
    this._last = new THREE.Vector3();
    this._has = false;
    this._side = new THREE.Vector3();
  }

  /** Throw the tail away — on mount, so a new flight does not inherit an old wake. */
  reset() {
    this.samples.length = 0;
    this._has = false;
    this.mesh.visible = false;
    this.geometry.setDrawRange(0, 0);
  }

  /**
   * Add a point to the tail if the carpet has moved far enough.
   *
   * @param {THREE.Vector3} at   the carpet's keel
   * @param {number} time        seconds, for ageing samples
   * @param {boolean} emitting   false to let the tail age out without growing
   */
  push(at, time, emitting = true) {
    if (!emitting) return;
    if (!this._has) {
      this._last.copy(at);
      this._has = true;
      return;
    }
    if (at.distanceTo(this._last) < this.step) return;
    this._last.copy(at);
    this.samples.push({ x: at.x, y: at.y, z: at.z, t: time });
    // The ring is bounded by both count and age; whichever bites first.
    while (this.samples.length > this.capacity) this.samples.shift();
    while (this.samples.length && time - this.samples[0].t > this.seconds) this.samples.shift();
  }

  /**
   * Rebuild the ribbon from the current samples.
   *
   * @param {number} time   seconds
   * @param {THREE.Color} colorA  near-end colour
   * @param {THREE.Color} colorB  far-end colour
   */
  update(time, colorA, colorB) {
    const n = this.samples.length;
    if (n < 2) {
      this.mesh.visible = false;
      this.geometry.setDrawRange(0, 0);
      return;
    }
    this.mesh.visible = true;

    for (let i = 0; i < n; i++) {
      const s = this.samples[i];
      // Direction along the path, so the ribbon's width is perpendicular to the
      // direction of travel rather than to the world axes.
      const prev = this.samples[Math.max(0, i - 1)];
      const next = this.samples[Math.min(n - 1, i + 1)];
      let dx = next.x - prev.x;
      let dz = next.z - prev.z;
      const len = Math.hypot(dx, dz) || 1;
      dx /= len;
      dz /= len;
      // Perpendicular in the XZ plane.
      const px = -dz;
      const pz = dx;

      // Age: 0 at the head, 1 at the tail.
      const age = n === 1 ? 0 : i / (n - 1);
      const alpha = Math.pow(age, 1.5) * 0.72;
      const w = this.width * (0.35 + 0.65 * age);

      const o = i * 6;
      this.positions[o + 0] = s.x + px * w;
      this.positions[o + 1] = s.y;
      this.positions[o + 2] = s.z + pz * w;
      this.positions[o + 3] = s.x - px * w;
      this.positions[o + 4] = s.y;
      this.positions[o + 5] = s.z - pz * w;

      const cr = colorA.r + (colorB.r - colorA.r) * age;
      const cg = colorA.g + (colorB.g - colorA.g) * age;
      const cb = colorA.b + (colorB.b - colorA.b) * age;
      this.colors[o + 0] = cr;
      this.colors[o + 1] = cg;
      this.colors[o + 2] = cb;
      this.colors[o + 3] = cr;
      this.colors[o + 4] = cg;
      this.colors[o + 5] = cb;

      this.alphas[i * 2 + 0] = alpha;
      this.alphas[i * 2 + 1] = alpha;
    }

    this.geometry.setDrawRange(0, (n - 1) * 6);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
  }
}

/* ── calling the carpet ───────────────────────────────────────────────────── */

/** Ease in and out, so the summoned rug lifts off gently and settles gently. */
export function summonEase(t) {
  const u = Math.min(1, Math.max(0, t));
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
}

/**
 * A point on the summoned carpet's flight: a high arc from where it was left to
 * where it is wanted. A quadratic curve through a control point lifted above both
 * ends, so it clears the ground, the trees and the buildings between, rather than
 * ploughing through them in a straight line.
 *
 * @param {{x:number,y:number,z:number}} from
 * @param {{x:number,y:number,z:number}} to
 * @param {number} t  0 … 1 along the flight (already eased)
 * @param {number} lift  metres the arc rises above the higher end
 * @param {{x:number,y:number,z:number}} [out]
 */
export function summonPoint(from, to, t, lift, out = { x: 0, y: 0, z: 0 }) {
  const cx = (from.x + to.x) / 2;
  const cz = (from.z + to.z) / 2;
  const cy = Math.max(from.y, to.y) + lift;
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  out.x = a * from.x + b * cx + c * to.x;
  out.y = a * from.y + b * cy + c * to.y;
  out.z = a * from.z + b * cz + c * to.z;
  return out;
}

/** How high the arc rises for a flight this long: higher for longer, within limits. */
export function summonLift(distance) {
  return Math.min(CARPET.summonMaxLift, Math.max(CARPET.summonMinLift, distance * 0.3));
}

/** How long the flight takes: a steady speed, but never a blink and never an age. */
export function summonDuration(distance) {
  return Math.min(CARPET.summonMaxSeconds, Math.max(CARPET.summonMinSeconds, distance / CARPET.summonSpeed));
}

/* ── the interaction ──────────────────────────────────────────────────────── */

/**
 * Scratch objects for the fringe's per-frame transform.
 *
 * At module scope rather than on the instance, and assigned rather than
 * allocated, so updating 22 tassels a frame allocates nothing.
 *
 * Note the shape of this: they are NOT `syncMesh._m`-style lazily-cached
 * properties. A class method's own name is not a binding in its body, so
 * `syncMesh._m` inside `syncMesh` throws a ReferenceError at runtime — which is
 * exactly what happened here, and is why the regression test for the parked
 * carpet's altitude exists at all. The test caught a world that would not build.
 */
const MESH_MATRIX = new THREE.Matrix4();
const MESH_QUAT = new THREE.Quaternion();
const MESH_EULER = new THREE.Euler();
const MESH_POS = new THREE.Vector3();
const MESH_SCALE = new THREE.Vector3(1, 1, 1);
/** Reused by `_cameraYaw`, so reading the look direction allocates nothing. */
const _lookVec = new THREE.Vector3();

/**
 * Who may fly, and what happens to the player's body while they do.
 *
 * Owns the flight state and the visual object; delegates every number to
 * `flight.js`. Also owns the only two hard rules in the feature:
 *
 *   1. The walking boundary (a hard circular wall, sized to the *areas*) does
 *      not apply in the air, or the sky cities — which sit outside it by design —
 *      would be unreachable. A wider cylinder applies instead, and the wall comes
 *      back the instant the rider steps off.
 *   2. Dismounting can never drop anyone into the void. If there is no floor
 *      within reach, the rider simply stays on the carpet.
 */
export class CarpetRider {
  /**
   * @param {object} opts
   * @param {THREE.Scene} opts.scene
   * @param {object|null} [opts.player]  the player it carries. May be attached
   *   later with `attachPlayer` — the world builds the carpet while the player is
   *   still being constructed, because the player needs the world's colliders
   *   first and the carpet needs both.
   * @param {import('./world/supports.js').SupportField} opts.supports
   * @param {object} opts.terrain  `{heightAt(x,z)}` — injected so this module has
   *   no import cycle with terrain.js, and so a test can hand it a flat plane.
   * @param {{role?: string|null}} [opts.access]  who is flying
   * @param {{x:number,z:number,heading?:number}} [opts.park]  where it starts
   * @param {(pos:object, radius:number) => void} [opts.resolveCollisions]
   *   Optional hook, called with the mount position and the airspace radius so
   *   the CALLER's own collision code runs on it. Injected rather than imported
   *   because `player.js` pulls in this module's siblings, so a static import
   *   here would be a cycle — and because it keeps this class testable with no
   *   player at all.
   */
  constructor({
    scene, player = null, supports, terrain, access = {}, park = null, resolveCollisions = null,
  }) {
    this.scene = scene;
    this.player = player;
    this.supports = supports;
    this.terrain = terrain;
    this.access = access;
    /** The injected collision resolver. See the param docs. */
    this.resolveCollisions = resolveCollisions;

    this.state = createFlightState(0);
    this.built = buildCarpetMesh();
    this.group = this.built.group;
    scene.add(this.group);

    this.trail = new CarpetTrail();
    scene.add(this.trail.mesh);

    /**
     * The walking world's radius. The airspace is a multiple of it (see
     * FLIGHT.airspaceFactor), chosen so the sky cities — which sit outside the
     * walking wall by design — are reachable.
     */
    this.worldRadius = WORLD.radius;

    /** 'parked' while it waits, 'ridden' while you are on it, 'summoned' while it flies to you. */
    this.mode = 'parked';
    /**
     * The keel's world position. The single source of truth for where the mount
     * is, in both modes — parking is not a special case, it is just a mode where
     * nothing moves it.
     */
    this.position = new THREE.Vector3();
    /** Seconds of lockout after a mount or dismount. */
    this._cooldown = 0;
    /**
     * Wall-clock time (ms) at which the mount may next be boarded or left.
     *
     * This is the AUTHORITY for the lockout; `_cooldown` is only the derived
     * seconds-remaining used for display. That split matters, and the reason is a
     * real bug: the cooldown used to be a countdown decremented by `dt` inside
     * `update()`, which only runs from the render loop. Frame time is clamped to
     * 0.05 s per frame, so on a slow machine — or a headless one with software
     * rendering, measured at ~2 fps — 0.45 s of *simulated* time took several
     * seconds of real time. A player could walk the whole 9 m to the carpet and
     * press E while the lockout was still frozen, and nothing at all would happen.
     * Wall-clock time cannot be stalled by a slow frame, a paused tab, or a
     * background throttled `requestAnimationFrame`.
     */
    this._readyAt = 0;
    /** Distance to the player, refreshed every frame so the HUD can prompt. */
    this.range = Infinity;
    /** True when the rider could step off safely right now. */
    this.canLandNow = true;
    this._colorA = new THREE.Color(0x7ffff0);
    this._colorB = new THREE.Color(0xff5ce5);
    this._elapsed = 0;
    /**
     * Multiplier on every flight SPEED, read live so the settings slider takes effect
     * on the next frame rather than on the next flight.
     */
    this.speedScale = 1;
    /**
     * Multiplier on the under-glow. The camera director turns it down in the chase
     * views, where the disc faces the viewer and would otherwise swamp the rug.
     */
    this.glowScale = 1;
    /** The scaled tuning, rebuilt only when `speedScale` changes. */
    this._flightCfg = FLIGHT;
    this._flightCfgFor = 1;
    /**
     * Deck airspaces: circular platforms whose edges the mount must not sail
     * off. Filled in by the world once the sky cities are built.
     * @type {{x:number,z:number,radius:number,y:number,vertical:number,padding:number}[]}
     */
    this.airspaces = [];
    /**
     * Set for one frame when a deck's rim actually blocks the mount, so the caller
     * can spark it. An edge you cannot see feels like a bug; an edge that throws
     * light as you touch it reads as a containment field. Nulled at the start of
     * every `update`.
     * @type {{x:number,y:number,z:number,strength:number}|null}
     */
    this.rimHit = null;
    if (park) this.parkAt(park.x, park.z, park.heading ?? 0);
  }

  /**
   * Give the carpet the player it carries.
   *
   * Separate from the constructor so the world can build the carpet while the
   * player is still being created — the player needs the world's colliders, and
   * the carpet needs the player, so a constructor argument would be a cycle.
   *
   * CALL THIS BEFORE `mount()`. Mounting with no player attached is refused
   * (there would be nobody to place on the rug), and because `parkAt` also resets
   * the mode, a carpet parked after a failed mount looks perfectly normal and
   * simply never accepts a rider. That silent shape is worth knowing about; the
   * regression test for it is in tests/realm-flight.test.mjs.
   *
   * @param {object} player
   * @param {{x:number,z:number,heading?:number}} [at]  where to park it
   */
  attachPlayer(player, at = null) {
    this.player = player;
    if (at) this.parkAt(at.x, at.z, at.heading ?? 0);
    return this;
  }

  /** Is there a rider to place? Mounting is impossible without one. */
  get hasPlayer() {
    return Boolean(this.player);
  }

  /**
   * May the member use the carpet? Not while the Realm Pass has it `locked`
   * (until their first module is finished); otherwise the admin gate, which is
   * open to everyone today.
   */
  get allowed() {
    if (this.locked) return false;
    if (!CARPET.adminOnly) return true;
    return this.access?.role === 'admin';
  }

  /**
   * Place the carpet on the ground near a point and let it settle into its hover.
   *
   * Parking is expressed as "hover at `CARPET.hoverHeight` above whatever floor
   * is here", which means a carpet parked on the mountain plateau and one parked
   * on the plain both look right without anything special being done.
   *
   * @param {number} x
   * @param {number} z
   * @param {number} [heading]
   */
  parkAt(x, z, heading = 0) {
    this.mode = 'parked';
    // Anchored to the terrain, because parking is by definition on the ground.
    // Asking for the topmost surface unconditionally would find a sky city's deck
    // over open plain.
    const ground = this._floorAt(x, z, this.terrain.heightAt(x, z) + 1);
    const y = ground + CARPET.hoverHeight;
    this.state = createFlightState(heading, y);
    this.position.set(x, y, z);
    this.trail.reset();
    this._beginCooldown();
    this.syncMesh(0);
  }

  /** Current wall-clock time in ms, isolated so a test can stub it. */
  _now() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }

  /** Start the mount/dismount lockout. */
  _beginCooldown() {
    this._readyAt = this._now() + CARPET.cooldown * 1000;
    this._cooldown = CARPET.cooldown;
  }

  /**
   * Refresh `_cooldown` (the display value) and say whether the lockout is over.
   * Cheap enough to call every frame and from every gate.
   */
  _cooldownOver() {
    const remaining = this._readyAt - this._now();
    this._cooldown = remaining > 0 ? remaining / 1000 : 0;
    return remaining <= 0;
  }

  /**
   * The highest standable surface at (x, z) that is BELOW `below`.
   *
   * `below` is essential and is not a detail. The support field is one flat list
   * for the whole world, and both sky cities register floors three hundred metres
   * up. Asking for the topmost surface unconditionally therefore answers with a
   * floating island no matter where in the realm you are asking from — which would
   * park a carpet beside the Spawnworks at an altitude of 300 m, and make the
   * landing check report "no floor within reach" everywhere on solid ground. The
   * ceiling argument is what anchors the question to where the mount actually is.
   *
   * @param {number} x
   * @param {number} z
   * @param {number} [below]  the height the floor must be at or under
   */
  _floorAt(x, z, below = Infinity) {
    const terrainY = this.terrain.heightAt(x, z);
    // Terrain counts only if it is at or under the anchor — the same rule the
    // support field applies to its own surfaces, so the two agree.
    let best = Number.isFinite(terrainY) && terrainY <= below ? terrainY : -Infinity;
    if (this.supports) {
      const surfaceY = this.supports.heightAt(x, z, below);
      if (Number.isFinite(surfaceY) && surfaceY > best) best = surfaceY;
    }
    return best;
  }

  /** Planar distance from the player to the mount, or Infinity if nobody is set. */
  distanceTo(player) {
    if (!player) return Infinity;
    return Math.hypot(player.position.x - this.position.x, player.position.z - this.position.z);
  }

  /** Is the mount in reach and legal to board? */
  canMount(player) {
    return (
      Boolean(player) &&
      this.allowed &&
      this.mode === 'parked' &&
      this._cooldownOver() &&
      this.distanceTo(player) <= CARPET.mountRadius
    );
  }

  /**
   * Board the mount.
   *
   * The rider is placed on the rug, their vertical momentum zeroed, and their
   * free-jump counter cleared. The camera is NOT re-aimed: the mount then takes
   * its heading from the camera, so whichever way the player was already looking
   * is the way they take off. Turning them round on boarding would be a small
   * betrayal of the one control they have.
   *
   * @param {{force?: boolean}} [opts] `force` skips the cooldown and the
   *   walk-up check. That is not a cheat: `mount()` is called from an input
   *   handler after `canMount()` has already agreed, so the guard here is a
   *   belt-and-braces re-check. A test (or a scripted arrival at a city) needs to
   *   board without waiting out a cooldown it is not exercising.
   * @returns {boolean} whether the mount happened
   */
  mount({ force = false } = {}) {
    if (!this.player) return false;
    if (!force && (this.mode !== 'parked' || !this._cooldownOver())) return false;
    if (force && this.mode === 'ridden') return false;
    this.mode = 'ridden';
    this.trail.reset();
    this._beginCooldown();

    const p = this.player;
    // The rug becomes the floor: the rider stands on its top surface.
    p.position.set(this.position.x, this.position.y + 0.06, this.position.z);
    p.velocity.set(0, 0, 0);
    p.onGround = true;
    p.jumpsUsed = 0;
    p.jumpBuffer = 0;
    p.airCap = PLAYER.walkSpeed;
    p.syncCamera();

    // Take up the heading the player is already looking down, so boarding is
    // continuous rather than a snap to the carpet's old direction.
    this.state.heading = this._cameraYaw();
    this.state.speed = 0;
    this.state.strafe = 0;
    this.state.verticalSpeed = 0;
    // The altitude it is holding becomes the altitude it holds under a rider.
    this.state.y = this.position.y;
    return true;
  }

  /**
   * The flight tuning in force, scaled by the visitor's speed preference.
   *
   * Rebuilt only when the scale actually changes, so a per-frame call costs one
   * comparison. The alternative — scaling each field at its call site — is four
   * places to forget.
   */
  /**
   * Call the carpet to the rider, from wherever it was left.
   *
   * It rises off its spot, flies a high arc to just in front of them and settles
   * there at hover height, ready to board — no cooldown to wait out, because you
   * asked for it. While it is in the air it homes on the rider, so walking on does
   * not leave it landing where you used to be.
   *
   * @returns {{ok: true, eta: number} | {ok: false, reason: string}}
   *   reasons: 'no rider', 'not yours yet', 'riding', 'already coming', 'here',
   *   'underground'
   */
  summon() {
    const pl = this.player;
    if (!pl) return { ok: false, reason: 'no rider' };
    if (!this.allowed) return { ok: false, reason: 'not yours yet' };
    if (this.mode === 'ridden') return { ok: false, reason: 'riding' };
    if (this.mode === 'summoned') return { ok: false, reason: 'already coming' };
    // The Understory hangs under the surface; a flight to it would be a flight
    // through solid ground.
    const ground = this.terrain.heightAt(pl.position.x, pl.position.z);
    if (Number.isFinite(ground) && pl.position.y < ground - 4) return { ok: false, reason: 'underground' };

    const to = this._summonTarget({ x: 0, y: 0, z: 0 });
    const distance = Math.hypot(to.x - this.position.x, to.y - this.position.y, to.z - this.position.z);
    if (distance < 1.5) return { ok: false, reason: 'here' };

    this._summon = {
      from: { x: this.position.x, y: this.position.y, z: this.position.z },
      lift: summonLift(distance),
      duration: summonDuration(distance),
      t: 0,
      lastHeading: this.state.heading,
    };
    this.mode = 'summoned';
    return { ok: true, eta: this._summon.duration };
  }

  /**
   * Where a called carpet should settle: a few metres in front of the rider, at
   * hover height over whatever they are standing on — the ground, a city deck, a
   * platform. The floor is looked for just above the rider, so a sky city's deck
   * is found from on it and never from the plain beneath.
   */
  _summonTarget(out) {
    const pl = this.player;
    const f = pl.forwardXZ ?? { x: 0, z: -1 };
    const len = Math.hypot(f.x, f.z) || 1;
    out.x = pl.position.x + (f.x / len) * CARPET.summonStandOff;
    out.z = pl.position.z + (f.z / len) * CARPET.summonStandOff;
    const floor = this._floorAt(out.x, out.z, pl.position.y + 2);
    out.y = (Number.isFinite(floor) ? floor : pl.position.y) + CARPET.hoverHeight;
    return out;
  }

  /** One frame of a summoned flight. Called from `update` while `mode === 'summoned'`. */
  _stepSummon(dt) {
    const s = this._summon;
    s.t = Math.min(1, s.t + dt / s.duration);
    const e = summonEase(s.t);
    const to = this._summonTarget(this._summonTo ?? (this._summonTo = { x: 0, y: 0, z: 0 }));
    const p = summonPoint(s.from, to, e, s.lift, this._summonAt ?? (this._summonAt = { x: 0, y: 0, z: 0 }));
    const ahead = summonPoint(s.from, to, Math.min(1, e + 0.02), s.lift, this._summonAhead ?? (this._summonAhead = { x: 0, y: 0, z: 0 }));

    const state = this.state;
    const dx = ahead.x - p.x;
    const dz = ahead.z - p.z;
    const flat = Math.hypot(dx, dz);
    if (flat > 1e-4) {
      // Heading 0 faces -Z, the same convention as the flight model.
      const heading = Math.atan2(-dx, -dz);
      let turn = heading - s.lastHeading;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      s.lastHeading = heading;
      state.heading = heading;
      state.bank += (Math.max(-0.5, Math.min(0.5, -turn / Math.max(dt, 1e-3) * 0.15)) - state.bank) * Math.min(1, dt * 4);
      state.pitch += (Math.atan2(ahead.y - p.y, flat) * 0.6 - state.pitch) * Math.min(1, dt * 4);
    }
    this.position.set(p.x, p.y, p.z);
    state.y = p.y;

    this.syncMesh(this._elapsed, 0.9);
    // The trail wants a Vector3 (it measures spacing with distanceTo), not the plain
    // point the arc is computed into.
    this.trail.push(this.position, this._elapsed, true);
    this.trail.update(this._elapsed, this._colorA, this._colorB);

    if (s.t >= 1) {
      // Settle facing the rider, level, and ready to board at once.
      const pl = this.player;
      const heading = Math.atan2(-(pl.position.x - to.x), -(pl.position.z - to.z));
      this.mode = 'parked';
      this.state = createFlightState(heading, to.y);
      this.position.set(to.x, to.y, to.z);
      this._readyAt = this._now();
      this._cooldown = 0;
      this._summon = null;
      this.syncMesh(this._elapsed, 0.25);
      this.onSummonArrive?.();
    }
  }

  _flightConfig() {
    const scale = Number(this.speedScale) || 1;
    if (scale === this._flightCfgFor) return this._flightCfg;
    this._flightCfg = {
      ...FLIGHT,
      // Speeds scale; the FEEL does not. Steering, the hover band and the landing
      // envelope stay put, so a faster carpet is still the same carpet to handle.
      cruiseSpeed: FLIGHT.cruiseSpeed * scale,
      sprintSpeed: FLIGHT.sprintSpeed * scale,
      reverseSpeed: FLIGHT.reverseSpeed * Math.min(scale, 1.4),
      axialSpeed: FLIGHT.axialSpeed * scale,
      climbSpeed: FLIGHT.climbSpeed * scale,
    };
    this._flightCfgFor = scale;
    return this._flightCfg;
  }

  /**
   * Step off the mount.
   *
   * Always succeeds and never drops anyone into the void. With `safeOnly` (the
   * default) the rider is only moved down to a floor within stepping reach; over
   * open sky they are left on the keel and `grounded` comes back false, which is
   * the caller's cue to say so and offer a second, deliberate press.
   *
   * Pass `safeOnly: false` for that second press. The rider is then placed on the
   * floor below — however far it is — and simply falls, which is a perfectly
   * survivable outcome here (the realm has no fall damage, jumps are unlimited,
   * and the carpet is still standing where it was left). The two-step shape is
   * the point: an accident must not be possible, and a deliberate choice must not
   * be blocked.
   *
   * @param {{safeOnly?: boolean}} [opts]
   * @returns {{grounded:boolean}}
   */
  dismount({ safeOnly = true } = {}) {
    if (this.mode !== 'ridden' || !this.player) return { grounded: true };
    this.mode = 'parked';
    this._beginCooldown();

    const p = this.player;
    const keel = this.position.y + 0.06;
    // Anchored to the mount's own altitude, so the floor it finds is the one
    // actually below it rather than a sky city's deck somewhere overhead.
    const floorY = this._floorAt(p.position.x, p.position.z, keel);
    let y;
    let grounded;
    if (safeOnly) {
      ({ y, grounded } = dismountHeight(keel, floorY));
    } else {
      // Deliberate: put them on the floor, or on the keel if somehow there is no
      // floor concept here at all.
      y = Number.isFinite(floorY) ? floorY : keel;
      grounded = true;
    }

    p.position.set(p.position.x, y, p.position.z);
    if (grounded) {
      // On solid ground: keep the momentum, drop the hover.
      const v = dismountVelocity(this.state);
      p.velocity.set(v.x, 0, v.z);
      p.onGround = true;
      p.jumpsUsed = 0;
      p.airCap = Math.max(PLAYER.walkSpeed, Math.hypot(v.x, v.z));
    } else {
      // Nowhere to step off to. Stay on the rug rather than fall: the mount
      // keeps hovering and the rider is left level with the keel.
      p.velocity.set(0, 0, 0);
      p.onGround = true;
    }
    p.syncCamera();

    // The carpet stays where it was left, holding its altitude, so the player can
    // find it again and fly on from here.
    this.state.verticalSpeed = 0;
    this.state.speed = 0;
    this.state.strafe = 0;
    this.state.y = this.position.y;
    return { grounded };
  }

  /**
   * Yaw of the player's camera, in the carpet's heading convention.
   *
   * Read from the CAMERA DIRECTLY, not from the player's cached `forwardXZ`. That
   * cache is only refreshed inside `Player.update()`, and while riding the carpet
   * owns the body and `Player.update()` is deliberately skipped — so `forwardXZ`
   * held whatever direction the player was last looking while WALKING. The carpet
   * therefore chased a frozen heading: it barely turned while you were moving,
   * snapped round when you stopped, and generally felt like it was fighting you.
   *
   * This is the same class of mistake as the frozen cooldown: state that is only
   * maintained by a loop that is not running. Reading the camera's own world matrix
   * is always current, because the renderer keeps it fresh every frame.
   *
   * @returns {number} heading in radians, where 0 faces -Z
   */
  _cameraYaw() {
    // The AIM, not the camera. In a chase view the camera sits metres behind the
    // player, and reading a heading off it would drag the carpet round with the
    // viewing offset. `player.aim` is the director's holder — the one place a yaw
    // lives, whoever is looking and whichever view is active.
    if (this.player?.aim?.yaw !== undefined) return this.player.aim.yaw;
    const cam = this.player?.camera;
    if (!cam) return this.state?.heading ?? 0;
    this._look ??= { x: 0, z: -1 };
    // `getWorldDirection` flattens nothing, so the Y component is dropped and the
    // remainder renormalised — a steeply pitched camera must not spin the mount.
    const f = cam.getWorldDirection(_lookVec);
    this._look.x = f.x;
    this._look.z = f.z;
    const len = Math.hypot(this._look.x, this._look.z);
    if (len < 1e-6) return this.state?.heading ?? 0;
    this._look.x /= len;
    this._look.z /= len;
    // Keep the player's own cached heading current too. `Player.update()` maintains
    // it, and that does not run while riding — so without this the player steps off
    // the carpet carrying the direction they were facing when they last WALKED, and
    // their first stride goes the wrong way.
    if (this.player._forward) {
      this.player._forward.x = this._look.x;
      this.player._forward.z = this._look.z;
    }
    return Math.atan2(-this._look.x, -this._look.z);
  }

  /**
   * Advance the mount by one frame and carry the rider with it.
   *
   * @param {number} dt
   * @param {object} input  {forward, strafe, vertical, sprint, turn}
   * @returns {void}
   */
  update(dt, input = {}) {
    this._cooldownOver(); // refresh the displayed seconds; the gate is wall-clock
    this._elapsed += dt;
    this.canLandNow = true;

    if (this.mode === 'summoned' && this._summon) {
      this.range = this.distanceTo(this.player);
      this._stepSummon(dt);
      return;
    }

    // Nobody to carry yet (or nobody at all): the rug is scenery. It still
    // breathes and its fringe still drifts, so a carpet parked before the player
    // arrives is not a dead object.
    if (!this.player || this.mode !== 'ridden') {
      this.range = this.distanceTo(this.player);
      this.syncMesh(this._elapsed, 0.25);
      this.trail.update(this._elapsed, this._colorA, this._colorB);
      return;
    }

    this.range = this.distanceTo(this.player);

    const state = this.state;
    /** Climb/dive demand for this frame. */
    const vertical = Number(input.vertical) || 0;

    // Adopt any altitude the mount was PLACED at since the last frame — a
    // teleport, a scripted landing, a fast-travel relocation. The state holds the
    // target altitude, so a caller that moves `position` directly would otherwise
    // be silently overwritten on the next step.
    state.y = this.position.y;

    // ---- steering: the heading chases the camera, trimmed by the A/D axis
    const wanted = this._cameraYaw();
    let delta = wanted - state.heading;
    // Take the short way round, or crossing the ±pi seam spins the carpet.
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    if (dt > 0) {
      const yawRate = delta / dt;
      // Turn authority scales with the look preference: a visitor who has slowed the
      // camera down wants a calmer mount too, and one who has sped it up would
      // otherwise find the carpet lagging behind their view.
      const yawLimit = FLIGHT.yawRate * (this.turnScale || 1);
      const applied = Math.max(-yawLimit, Math.min(yawLimit, yawRate));
      state.heading += applied * dt;
      input.yawRate = applied;

      // Trim: the sideways axis nudges the heading directly, which is what makes
      // fine flying possible without moving the mouse a pixel at a time.
      const turn = Number(input.strafe) || 0;
      if (turn) state.heading -= turn * yawLimit * 0.6 * dt;
    }
    while (state.heading > Math.PI) state.heading -= Math.PI * 2;
    while (state.heading < -Math.PI) state.heading += Math.PI * 2;

    // ---- physics
    //
    // The world supplies the vertical LIMITS and nothing else. `stepFlight` owns
    // an absolute target altitude, so it never needs to know where the ground is —
    // it only needs to be told how low it is allowed to go and how high the realm
    // lets anyone go. That split is what keeps the pure model pure.
    //
    // The floor query gets a generous ceiling rather than the mount's exact
    // altitude: flying toward rising ground has to FIND that ground and be pushed
    // over it, and a floor only a few metres above the keel is exactly the case
    // that matters.
    const clear = Math.max(CARPET.minClearance, CARPET.hoverHeight);
    const floorHere = this._floorAt(this.position.x, this.position.z, this.position.y + 20);
    const minY = Number.isFinite(floorHere) ? floorHere + clear : -Infinity;
    const ceiling = Number.isFinite(PLAYER.softCeiling) ? PLAYER.softCeiling : Infinity;

    const resolvedCfg = this._flightConfig();
    stepFlight(state, input, dt, resolvedCfg, { minY, maxY: ceiling });

    // ---- carry the position
    const v = dismountVelocity(state);
    const p = this.position;
    p.x += v.x * dt;
    p.z += v.z * dt;

    // ---- the horizontal airspace
    //
    // The cylinder is a multiple of the walking world, NOT the walking wall
    // itself: the sky cities sit outside a boundary sized to the areas, so the
    // hard wall has to be wider in the air and comes back the moment you step
    // off. The vertical limits were handed to `stepFlight` above.
    const limit = this.worldRadius * FLIGHT.airspaceFactor;

    // Solids and the boundary are resolved by the SAME code that does it on foot,
    // at the airspace radius. Hand-rolling a radius clamp here instead would mean
    // two implementations of "where am I allowed to be" that could disagree — and
    // an island's buildings are colliders, so a rider genuinely needs them.
    if (typeof this.resolveCollisions === 'function') {
      this.resolveCollisions(p, limit);
    } else {
      const r = Math.hypot(p.x, p.z);
      if (r > limit && r > 1e-6) {
        const k = limit / r;
        p.x *= k;
        p.z *= k;
      }
    }

    // Deck edges. Applied before the altitude is committed so a blocked sideways
    // move cannot leave the mount hanging outside the platform it is over.
    this.rimHit = null;
    this._clampToDecks(p, state);

    // ---- commit the altitude.
    //
    // The floor may have moved under us: flying onto a deck RAISES it, flying off
    // the edge of one drops it by hundreds of metres. So the target is re-clamped
    // against the floor at the position the mount has actually arrived at. Note
    // this clamps the target, never re-derives it — the mount keeps whatever
    // altitude it was holding, and only a floor rising into it changes that.
    const floorNow = this._floorAt(p.x, p.z, state.y + 20);
    const minNow = Number.isFinite(floorNow) ? floorNow + clear : -Infinity;
    if (state.y < minNow) {
      state.y = minNow;
      if (state.verticalSpeed < 0) state.verticalSpeed = 0;
    }
    if (state.y > ceiling) {
      state.y = ceiling;
      if (state.verticalSpeed > 0) state.verticalSpeed = 0;
    }
    p.y = state.y;

    // ---- keep the rider on the rug
    const pl = this.player;
    pl.position.set(p.x, p.y + 0.06, p.z);
    pl.velocity.set(v.x, v.y, v.z);
    pl.onGround = true;
    pl.jumpsUsed = 0;
    pl.syncCamera();

    // ---- visuals
    this.syncMesh(this._elapsed, Math.min(1, Math.abs(state.speed) / FLIGHT.cruiseSpeed));
    this.trail.push(p, this._elapsed, true);
    this.trail.update(this._elapsed, this._colorA, this._colorB);
    this.canLandNow = canLand(state, p.y + 0.06, this._floorAt(p.x, p.z, p.y + 0.06));
  }

  /**
   * Keep the mount on the floating deck it is currently standing over.
   *
   * A floating island has an edge, and a player who has just flown three hundred
   * metres up to reach one should not be able to slide off it in half a second
   * because the plaza's rim is decoration with no collision. The realm's own
   * collision primitives cannot express a ring wall (see kemet-city.js), so the
   * edge is enforced here instead.
   *
   * ── The band has to be NARROW, and getting that wrong was a real bug ────────
   *
   * This used to apply over the deck's whole `vertical` extent — ±42 m — which
   * meant the invisible wall stood sixteen metres ABOVE the deck and thirteen
   * metres short of the landing pad. A visitor flying in at the city's altitude
   * hit it in apparently empty air with the city hanging there ahead of them, and
   * could not close the last gap no matter what they did. It read exactly like a
   * broken barrier, because it was one.
   *
   * So the wall only exists near the DECK: low enough that you are clearly about to
   * touch down, high enough to matter on the way out. Above it the approach is
   * completely open, which is what "fly up to the city" has to mean.
   *
   * The other subtlety: this must NOT lock the mount in. It applies only once the
   * mount is already inside the deck's horizontal extent. Flying in from outside is
   * never blocked; once inside you cannot cross the rim, and to leave you simply
   * climb above the band and fly out.
   *
   * @param {THREE.Vector3} p
   * @param {object} state
   */
  _clampToDecks(p, state) {
    if (!this.airspaces.length) return;
    for (const deck of this.airspaces) {
      // Near the deck, not merely at the city's altitude.
      if (Math.abs(p.y - deck.y) > deck.vertical) continue;
      const dx = p.x - deck.x;
      const dz = p.z - deck.z;
      const r = Math.hypot(dx, dz);
      if (r > deck.radius) continue; // outside: not our business
      if (r <= deck.radius - deck.padding) continue; // well inside: not near the edge
      // Inside the band and out past the comfortable core. Clamp the radius but
      // keep the bearing, so the mount slides along the rim rather than being
      // teleported to the centre.
      const limit = deck.radius - deck.padding;
      if (r > 1e-6) {
        const k = limit / r;
        p.x = deck.x + dx * k;
        p.z = deck.z + dz * k;
        // Tell the world the rim is biting, so the caller can spark it. An edge you
        // cannot see is an edge that feels like a bug, and this is the one place
        // that knows it is being hit.
        this.rimHit = { x: p.x, y: p.y, z: p.z, strength: Math.min(1, Math.abs(state.speed) / FLIGHT.cruiseSpeed) };
      }
      // Kill most of the outward speed: grinding along an invisible wall at full
      // thrust reads as a bug rather than as an edge.
      state.speed *= 0.35;
    }
  }

  /**
   * Place, orient and animate the rug.
   *
   * @param {number} time
   * @param {number} [drive] 0..1, how hard it is being flown; streams the fringe
   */
  syncMesh(time, drive = 0) {
    const s = this.state;
    const g = this.group;
    g.position.copy(this.position);
    // Yaw, then bank about the forward axis, then pitch. The default euler order
    // (XYZ) would apply bank before yaw and tip the rug sideways in the turn, so
    // the order is set explicitly as YXZ: heading first.
    g.rotation.order = 'YXZ';
    g.rotation.set(s.pitch, s.heading, s.bank);

    // Fringe streams backward and lifts with speed. On an InstancedMesh this is
    // 24 matrix writes a frame, which is nothing, and it is the single detail
    // that sells "this thing is moving".
    const { tassels, tasselBase, cloth, size } = this.built;

    // The cloth: every vertex lifted off its flat position by the shared ripple.
    // ~900 vertices and a normal recompute — small, and it is the one thing that
    // makes the rug read as fabric rather than as a board.
    const pos = cloth.geometry.attributes.position;
    const flat = cloth.base;
    for (let i = 0; i < pos.count; i++) {
      const x = flat[i * 3];
      const z = flat[i * 3 + 2];
      pos.array[i * 3 + 1] = flat[i * 3 + 1] + rugWave(x, z, time, drive, size);
    }
    pos.needsUpdate = true;
    cloth.geometry.computeVertexNormals();

    const flow = 0.18 + drive * 1.5;
    for (let i = 0; i < tasselBase.length; i++) {
      const t = tasselBase[i];
      // Hang down at rest, angle backward with speed; the two ends alternate so
      // the fringe reads as fabric rather than as a row of identical spikes.
      const wob = Math.sin(time * (2.4 + i * 0.13) + i) * (0.06 + drive * 0.22);
      const lean = -t.end * 2 + 1; // -1 for the -Z end, +1 for the +Z end
      MESH_EULER.set(Math.PI + lean * (0.1 + flow * 0.5) + wob, 0, wob * 0.5);
      MESH_QUAT.setFromEuler(MESH_EULER);
      MESH_POS.set(t.x, rugWave(t.x, t.z, time, drive, size), t.z + lean * 0.02);
      MESH_SCALE.set(1, 0.85 + drive * 0.5, 1);
      MESH_MATRIX.compose(MESH_POS, MESH_QUAT, MESH_SCALE);
      tassels.setMatrixAt(i, MESH_MATRIX);
    }
    tassels.instanceMatrix.needsUpdate = true;

    // The under-glow breathes, and brightens with speed — but it is a glow meant to be
    // seen from ON the rug, where it sells the hover. From a chase camera the same
    // disc fills a third of the screen and, through the bloom pass, swallows the rug
    // it is attached to. So it fades out when the viewer is not standing on it.
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.7);
    const base = (this.mode === 'ridden' ? 0.2 : 0.13) + pulse * 0.07 + drive * 0.12;
    this.built.underGlow.material.opacity = base * (this.glowScale ?? 1);
  }

  /** Remove everything this class added to the scene. */
  dispose() {
    this.scene.remove(this.group);
    this.scene.remove(this.trail.mesh);
    this.trail.geometry.dispose();
    this.trail.material.dispose();
  }
}

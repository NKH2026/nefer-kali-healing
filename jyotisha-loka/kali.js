/**
 * Maa Kali, as Nefer Kali Healing's figure in Jyotisha Loka: a Black, Afrocentric
 * goddess built from simple shapes — deep dark skin, a crown of locs, a gold
 * crown with the crescent moon, the third eye, four arms (the raised sword, a
 * lotus, and the gestures of protection and blessing), a red and gold skirt and
 * gold ornaments. She walks on the ground and dances on the flying carpet.
 *
 * Same shape as the realm's avatar (`root`, `motion.step`, `motion.play`,
 * `sync`), so the world drives her as it drove the mushroom.
 */
import * as THREE from 'three';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const SKIN = 0x2a1812;
const SKIN_SHEEN = 0x3d2418;
const HAIR = 0x0c0907;
const GOLD = 0xd4a640;
const RED = 0x9c1b2a;
const DEEP_RED = 0x5e0f1a;

function mat(color, { emissive = 0x000000, emissiveIntensity = 0, roughness = 0.6, metalness = 0 } = {}) {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness, metalness });
}

/** How Kali moves: the realm avatar's interface, with a dance for the carpet. */
export class KaliMotion {
  constructor() {
    this.time = 0;
    this.walk = 0;
    this.phase = 0;
    this.yaw = 0;
    this.dance = 0;
    this.emote = null;
    this.emoteT = 0;
  }

  /** A short flourish (the bow and glow emotes both bring her palms together). */
  play(name) {
    if (this.emote) return false;
    this.emote = name;
    this.emoteT = 0;
    return true;
  }

  step(dt, s) {
    if (!(dt > 0)) return this;
    this.time += dt;
    const speed = Math.hypot(s.vx, s.vz);
    const riding = Boolean(s.riding);
    const target = riding || !s.grounded ? 0 : clamp(speed / 6, 0, 1.4);
    this.walk += (target - this.walk) * clamp(dt * 8, 0, 1);
    if (!riding && s.grounded) this.phase = (this.phase + speed * dt * 1.6 * Math.PI) % TAU;
    if (s.yaw != null) this.yaw = s.yaw;
    else if (speed > 0.3) {
      const want = Math.atan2(s.vx, s.vz);
      const d = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw));
      this.yaw += d * clamp(dt * 10, 0, 1);
    }
    // She dances on the carpet; at rest on the ground she sways a little.
    this.dance += ((riding ? 1 : 0.15) - this.dance) * clamp(dt * 3, 0, 1);
    if (this.emote) {
      this.emoteT += dt / 1.6;
      if (this.emoteT >= 1) { this.emote = null; this.emoteT = 0; }
    }
    return this;
  }
}

/** One arm: upper arm, forearm and hand, with a bangle; returns its pivot and parts. */
function makeArm(skin, gold) {
  const shoulder = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.26, 4, 8), skin);
  upper.position.y = -0.17;
  shoulder.add(upper);
  const elbow = new THREE.Group();
  elbow.position.y = -0.34;
  shoulder.add(elbow);
  const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.24, 4, 8), skin);
  fore.position.y = -0.15;
  elbow.add(fore);
  const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.014, 6, 16), gold);
  bangle.rotation.x = Math.PI / 2;
  bangle.position.y = -0.24;
  elbow.add(bangle);
  const hand = new THREE.Group();
  hand.position.y = -0.31;
  elbow.add(hand);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), skin);
  palm.scale.set(1, 1.25, 0.55);
  hand.add(palm);
  return { shoulder, elbow, hand };
}

export function createKaliFigure() {
  const root = new THREE.Group();
  root.name = 'kali';
  const body = new THREE.Group();
  root.add(body);

  const skin = mat(SKIN, { emissive: SKIN_SHEEN, emissiveIntensity: 0.25, roughness: 0.45 });
  const gold = mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.85 });
  const red = mat(RED, { emissive: DEEP_RED, emissiveIntensity: 0.3, roughness: 0.55 });
  const hair = mat(HAIR, { roughness: 0.8 });

  // Legs and feet, under the skirt.
  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.1, 0.82, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.62, 4, 8), skin);
    leg.position.y = -0.38;
    hip.add(leg);
    const anklet = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.015, 6, 16), gold);
    anklet.rotation.x = Math.PI / 2;
    anklet.position.y = -0.66;
    hip.add(anklet);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.2), skin);
    foot.position.set(0, -0.8, 0.05);
    hip.add(foot);
    body.add(hip);
    return hip;
  });

  // The skirt: red, banded in gold, flaring as she turns.
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.42, 0.62, 20, 1, true), red);
  skirt.material.side = THREE.DoubleSide;
  skirt.position.y = 0.66;
  body.add(skirt);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.02, 6, 32), gold);
  hem.rotation.x = Math.PI / 2;
  hem.position.y = 0.36;
  body.add(hem);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 6, 24), gold);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.97;
  body.add(belt);

  // Torso, with a gold collar.
  const chest = new THREE.Group();
  chest.position.y = 0.98;
  body.add(chest);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.32, 6, 12), skin);
  torso.scale.set(1.05, 1, 0.75);
  torso.position.y = 0.2;
  chest.add(torso);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.14, 16), red);
  top.position.y = 0.3;
  chest.add(top);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 24, Math.PI * 1.2), gold);
  collar.rotation.set(Math.PI / 2.4, 0, Math.PI * 0.9);
  collar.position.set(0, 0.42, 0.05);
  chest.add(collar);

  // Head: her face, the third eye, and a crown of locs.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.1, 10), skin);
  neck.position.y = 0.52;
  chest.add(neck);
  const head = new THREE.Group();
  head.position.y = 0.66;
  chest.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), skin);
  face.scale.set(0.92, 1.08, 0.95);
  head.add(face);
  const eyeMat = mat(0xf4ece0, { emissive: 0xf4ece0, emissiveIntensity: 0.15 });
  const irisMat = mat(0x120a06);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), eyeMat);
    eye.position.set(side * 0.045, 0.02, 0.112);
    eye.scale.set(1.2, 0.8, 0.5);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), irisMat);
    iris.position.set(side * 0.045, 0.02, 0.124);
    head.add(eye, iris);
  }
  const thirdEye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), mat(GOLD, { emissive: 0xffd27a, emissiveIntensity: 1.6 }));
  thirdEye.position.set(0, 0.075, 0.122);
  head.add(thirdEye);
  const lips = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.009, 6, 12, Math.PI), mat(0x4a1218));
  lips.rotation.z = Math.PI;
  lips.position.set(0, -0.055, 0.118);
  head.add(lips);
  // Locs: a full crown, falling to the shoulders.
  const locks = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU;
    if (Math.cos(a) > 0.55) continue; // leave the face open
    const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.34 + (i % 3) * 0.08, 3, 6), hair);
    lock.position.set(Math.sin(a) * 0.13, -0.06, -Math.cos(a) * 0.12);
    lock.rotation.set(-Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35);
    head.add(lock);
    locks.push(lock);
  }
  const crownOfHair = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12, 0, TAU, 0, Math.PI * 0.55), hair);
  crownOfHair.position.y = 0.02;
  crownOfHair.scale.set(1.05, 1.1, 1.05);
  head.add(crownOfHair);
  // The gold crown, and the crescent moon upon it.
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.135, 0.09, 16, 1, true), gold);
  crown.material.side = THREE.DoubleSide;
  crown.position.y = 0.15;
  head.add(crown);
  const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 24, Math.PI), mat(0xf6f0dc, { emissive: 0xf6f0dc, emissiveIntensity: 1.2 }));
  crescent.position.set(0, 0.24, 0.02);
  head.add(crescent);
  for (const side of [-1, 1]) {
    const earring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 6, 14), gold);
    earring.position.set(side * 0.125, -0.06, 0);
    earring.rotation.y = Math.PI / 2;
    head.add(earring);
  }

  // Four arms. Upper pair: the sword raised, and a lotus. Lower pair: the
  // gestures of protection (abhaya, palm out) and blessing (varada, palm down).
  const arms = [
    { side: 1, y: 0.42, tier: 'upper' },
    { side: -1, y: 0.42, tier: 'upper' },
    { side: 1, y: 0.33, tier: 'lower' },
    { side: -1, y: 0.33, tier: 'lower' },
  ].map((a) => {
    const arm = makeArm(skin, gold);
    arm.shoulder.position.set(a.side * 0.22, a.y, a.tier === 'upper' ? -0.03 : 0.03);
    chest.add(arm.shoulder);
    return { ...a, ...arm };
  });
  // The khadga, the sword of discernment, in the upper right hand.
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.62, 0.012), mat(0xd9dde6, { emissive: 0x9fb6ff, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.2 }));
  blade.position.y = 0.36;
  const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.025), gold);
  hilt.position.y = 0.05;
  arms[0].hand.add(blade, hilt);
  // A lotus in the upper left hand.
  const lotus = new THREE.Group();
  for (let k = 0; k < 7; k++) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6, 0, Math.PI), mat(0xffb3d1, { emissive: 0xff6fa8, emissiveIntensity: 0.4 }));
    petal.scale.set(0.6, 0.3, 1.4);
    petal.position.set(Math.sin((k / 7) * TAU) * 0.035, 0.05, Math.cos((k / 7) * TAU) * 0.035);
    petal.rotation.set(-0.6, (k / 7) * TAU, 0);
    lotus.add(petal);
  }
  lotus.position.y = 0.03;
  arms[1].hand.add(lotus);

  // A soft aura, so she reads against the dark sky.
  const aura = new THREE.PointLight(0xffc06a, 0.8, 4, 2);
  aura.position.set(0, 1.4, 0.4);
  root.add(aura);

  const motion = new KaliMotion();

  function sync(m = motion) {
    const t = m.time;
    const w = clamp(m.walk, 0, 1.4);
    const d = m.dance;
    const s = Math.sin(m.phase);
    // The dance: hips sway in a figure of eight, the body dips on the beat, and
    // every few bars she turns.
    const beat = t * 2.4;
    const sway = Math.sin(beat) * 0.12 * d;
    body.position.set(sway, Math.abs(Math.sin(beat)) * 0.05 * d - Math.abs(s) * 0.03 * w, 0);
    body.rotation.z = -sway * 0.8;
    chest.rotation.z = sway * 1.4;
    chest.rotation.y = Math.sin(beat * 0.5) * 0.25 * d;
    head.rotation.z = -sway * 0.9;
    head.rotation.y = Math.sin(beat * 0.5 + 0.6) * 0.2 * d;
    const turn = d > 0.5 ? Math.max(0, Math.sin(t * 0.45)) ** 6 * TAU : 0;
    body.rotation.y = turn * d;
    skirt.scale.set(1 + 0.12 * d * Math.abs(Math.sin(beat)), 1, 1 + 0.12 * d * Math.abs(Math.cos(beat)));
    for (const lock of locks) lock.rotation.x += Math.sin(beat + lock.position.x * 10) * 0.004 * d;
    // Legs: a walk on the ground; on the carpet, a step from foot to foot.
    legs[0].rotation.x = s * 0.6 * w + Math.max(0, Math.sin(beat)) * -0.35 * d;
    legs[1].rotation.x = -s * 0.6 * w + Math.max(0, -Math.sin(beat)) * -0.35 * d;
    // Arms: the dancing mudras, flowing; the sword arm stays raised.
    const flourish = m.emote ? Math.sin(Math.min(1, m.emoteT) * Math.PI) : 0;
    for (const [i, a] of arms.entries()) {
      const phase = beat + i * 0.9;
      if (a.tier === 'upper') {
        a.shoulder.rotation.z = a.side * (2.3 + Math.sin(phase) * 0.35 * d);
        a.shoulder.rotation.x = -0.2 + Math.cos(phase) * 0.2 * d;
        a.elbow.rotation.z = a.side * (-0.4 - Math.sin(phase + 1) * 0.3 * d);
      } else {
        a.shoulder.rotation.z = a.side * (0.5 + Math.sin(phase) * 0.45 * d) - flourish * a.side * 0.4;
        a.shoulder.rotation.x = -0.6 - Math.cos(phase) * 0.35 * d - flourish * 0.6;
        a.elbow.rotation.x = -1.1 + Math.sin(phase + 0.5) * 0.3 * d;
        a.hand.rotation.y = a.side * (a.side > 0 ? 0 : Math.PI);
      }
      if (w > 0.05 && a.tier === 'lower') a.shoulder.rotation.x += -s * a.side * 0.4 * w;
    }
    root.rotation.y = m.yaw;
  }

  sync();
  return { root, motion, sync };
}

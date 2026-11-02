/**
 * The Support district: Sūrya's terrace.
 *
 * Sūrya is the soul, the father, authority and vitality — and the one thing the
 * Sun does without being asked is give. So this is not a donation page with a
 * temple painted behind it: it is a terrace of offering bowls facing the fire
 * that lights the whole world, ranked by what a gift keeps going, and one flame
 * in the middle that is fed by all of them.
 *
 * Local convention: the terrace is at the origin, the flame at its centre, and
 * the camera arrives from outside the low wall.
 */
import * as THREE from 'three';
import { gold } from '../style.js';

/**
 * @param {{ bowls?: number }} [opts]
 */
export function createSupport({ bowls = 36 } = {}) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x6a5330, roughness: 0.8, metalness: 0.15 });
  const stoneDark = new THREE.MeshStandardMaterial({ color: 0x3a2c18, roughness: 0.9, metalness: 0.1 });
  const trim = gold({ tone: 0xe0b45a });

  // ---- the terrace: three steps up to a round platform
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(new THREE.CylinderGeometry(20 - i * 1.6, 20 - i * 1.6, 0.5, 48), i === 2 ? stone : stoneDark);
    step.position.y = 0.25 + i * 0.5;
    group.add(step);
  }
  const deckY = 1.5;

  const inlay = new THREE.Mesh(new THREE.TorusGeometry(14.4, 0.1, 6, 96), trim);
  inlay.rotation.x = Math.PI / 2;
  inlay.position.y = deckY + 0.02;
  group.add(inlay);

  // ---- the bowls, in three rings: what a gift keeps going
  const bowlMat = new THREE.MeshStandardMaterial({
    color: 0xd9a441,
    emissive: 0x6b3d08,
    emissiveIntensity: 0.55,
    roughness: 0.25,
    metalness: 0.45,
  });
  const rings = [4.2, 8.0, 11.6];
  const perRing = [6, 12, 18];
  let placed = 0;
  for (let r = 0; r < rings.length && placed < bowls; r++) {
    for (let i = 0; i < perRing[r] && placed < bowls; i++, placed++) {
      const a = (i / perRing[r]) * Math.PI * 2 + r * 0.35;
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), bowlMat);
      bowl.position.set(Math.cos(a) * rings[r], deckY + 0.42, Math.sin(a) * rings[r]);
      bowl.rotation.x = Math.PI;
      group.add(bowl);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 6, 14), trim);
      rim.position.set(bowl.position.x, deckY + 0.44, bowl.position.z);
      rim.rotation.x = Math.PI / 2;
      group.add(rim);
    }
  }

  // ---- the low wall, so the terrace reads as somewhere rather than a disc
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a4526, roughness: 0.85 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 0.7), wallMat);
    post.position.set(Math.cos(a) * 18.4, deckY + 1.2, Math.sin(a) * 18.4);
    post.rotation.y = -a;
    group.add(post);
  }
  const rail = new THREE.Mesh(new THREE.TorusGeometry(18.4, 0.09, 6, 96), trim);
  rail.rotation.x = Math.PI / 2;
  rail.position.y = deckY + 2.35;
  group.add(rail);

  // ---- the flame, fed by all of them
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0.9, fog: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(1.7, 4.2, 12), flameMat);
  flame.position.y = deckY + 2.6;
  group.add(flame);

  const brazier = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.4, 1.6, 16), stoneDark);
  brazier.position.y = deckY + 0.8;
  group.add(brazier);

  const fireLight = new THREE.PointLight(0xffc880, 34, 80, 2);
  fireLight.position.y = deckY + 3.2;
  group.add(fireLight);

  return {
    group,
    /** The flame: what the camera should look at. */
    target: new THREE.Vector3(0, deckY + 3, 0),
    update(t) {
      const flicker = 0.88 + Math.sin(t * 6.1) * 0.07 + Math.sin(t * 11.7) * 0.04;
      fireLight.intensity = 30 * flicker;
      flame.scale.set(1, 0.95 + Math.sin(t * 4.7) * 0.07, 1);
      flameMat.opacity = 0.84 + Math.sin(t * 5.9) * 0.08;
    },
  };
}

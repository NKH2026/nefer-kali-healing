/**
 * The Healing Guides district: Chandra's herb garden.
 *
 * Chandra is the mind, nourishment and Soma — and in the tradition the Moon's
 * 27 mansions are the calendar by which planting and harvesting were timed. So
 * this garden is not a nursery with a moon painted behind it: it has
 * twenty-seven beds, one per nakshatra, set out in their order around a central
 * pool, so the calendar and the plot are the same shape.
 *
 * Local convention: the beds ring the origin, the pool at the centre, and the
 * camera arrives from outside, high enough to read the whole circle.
 */
import * as THREE from 'three';
import { gold } from '../style.js';

/** The 27, in order, and what is grown in each bed. */
const BEDS = 27;

/**
 * @param {{ beds?: number }} [opts]
 */
export function createGuides({ beds = BEDS } = {}) {
  const group = new THREE.Group();
  const soil = new THREE.MeshStandardMaterial({ color: 0x2a2230, roughness: 0.95 });
  const kerb = new THREE.MeshStandardMaterial({ color: 0x4a4258, roughness: 0.9 });
  const trim = gold({ tone: 0x9aa4c9 });
  const stem = new THREE.MeshStandardMaterial({ color: 0x3f6b4a, roughness: 0.8 });
  const bloom = new THREE.MeshStandardMaterial({ color: 0x9fb8ff, emissive: 0x2a3a7a, emissiveIntensity: 0.7, roughness: 0.5 });

  // ---- the ground and the moonlit pool at its centre
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64), soil);
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(4.6, 48),
    new THREE.MeshStandardMaterial({ color: 0x8fb4ff, emissive: 0x2c4a8a, emissiveIntensity: 0.8, roughness: 0.15, metalness: 0.6 }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.06;
  group.add(pool);

  const poolRim = new THREE.Mesh(new THREE.TorusGeometry(4.7, 0.14, 8, 64), trim);
  poolRim.rotation.x = Math.PI / 2;
  poolRim.position.y = 0.1;
  group.add(poolRim);

  // ---- the 27 beds, one per mansion
  const radius = 17;
  for (let i = 0; i < beds; i++) {
    const a = (i / beds) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;

    const bed = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 2.2), kerb);
    bed.position.set(x, 0.25, z);
    bed.rotation.y = -a;
    group.add(bed);

    const earth = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.16, 1.8), soil);
    earth.position.set(x, 0.53, z);
    earth.rotation.y = -a;
    group.add(earth);

    // Three stems per bed, of slightly different heights — a plot, not a grid.
    for (let p = 0; p < 3; p++) {
      const off = (p - 1) * 0.72;
      const sx = x + Math.cos(a + Math.PI / 2) * off;
      const sz = z + Math.sin(a + Math.PI / 2) * off;
      const h = 0.7 + ((i * 7 + p * 13) % 5) * 0.18;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, h, 6), stem);
      stalk.position.set(sx, 0.6 + h / 2, sz);
      group.add(stalk);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.26 + (p % 2) * 0.08, 10, 8), bloom);
      head.position.set(sx, 0.6 + h, sz);
      group.add(head);
    }
  }

  // ---- moon light: cool, low, and from one side so the beds have shadows
  const moon = new THREE.PointLight(0x9fc0ff, 26, 90, 2);
  moon.position.set(-14, 22, 10);
  group.add(moon);

  const fill = new THREE.PointLight(0x6f8fd8, 10, 70, 2);
  fill.position.set(12, 10, -12);
  group.add(fill);

  return {
    group,
    /** The pool and the ring around it, read from above. */
    target: new THREE.Vector3(0, 1, 0),
    update(t) {
      pool.material.emissiveIntensity = 0.7 + Math.sin(t * 1.3) * 0.12;
    },
  };
}

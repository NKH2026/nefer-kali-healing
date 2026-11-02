/**
 * The Wisdom district: Guru's library.
 *
 * Guru is the teacher, dharma, blessing — and the teacher's characteristic is
 * patience. So this is not a lecture hall: it is a colonnade of palm-leaf
 * shelves with one lectern at the far end, so arriving at the book takes
 * walking. The journal lives here; each essay is a leaf.
 *
 * Local convention: the colonnade runs along +X, the lectern at its far end,
 * and the camera arrives from -X looking down the aisle.
 */
import * as THREE from 'three';
import { gold } from '../style.js';

/** @param {{ bays?: number }} [opts] */
export function createWisdom({ bays = 6 } = {}) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x4c4436, roughness: 0.88, metalness: 0.06 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.85 });
  const leaf = new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: 0.75 });
  const trim = gold({ tone: 0xc9a95a });

  // ---- the floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(34, 0.4, 18), stone);
  floor.position.y = -0.2;
  group.add(floor);

  // A gold runner down the aisle: where to walk
  const runner = new THREE.Mesh(new THREE.BoxGeometry(33, 0.06, 1.2), trim);
  runner.position.y = 0.03;
  group.add(runner);

  // ---- the colonnade
  const span = 5.4;
  for (let i = 0; i < bays; i++) {
    const x = -14 + (i / (bays - 1)) * 28;
    for (const z of [-7.4, 7.4]) {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), stone);
      base.position.set(x, 0.25, z);
      group.add(base);

      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, span, 10), stone);
      column.position.set(x, 0.5 + span / 2, z);
      group.add(column);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 1.7), trim);
      cap.position.set(x, 0.5 + span + 0.2, z);
      group.add(cap);

      // Shelves between this bay and the next, stacked with leaves
      if (i < bays - 1) {
        const nx = -14 + ((i + 1) / (bays - 1)) * 28;
        const midX = (x + nx) / 2;
        const width = Math.abs(nx - x) - 1.8;
        if (width > 0.6) {
          for (let shelf = 0; shelf < 3; shelf++) {
            const board = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, 1.1), wood);
            board.position.set(midX, 1.4 + shelf * 1.5, z);
            group.add(board);
            // the leaves themselves: thin slabs standing on the board
            const count = Math.max(2, Math.floor(width / 0.5));
            for (let b = 0; b < count; b++) {
              const book = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9, 0.8), leaf);
              book.position.set(
                midX - width / 2 + 0.35 + b * (width / count),
                1.4 + shelf * 1.5 + 0.51,
                z + (Math.random() - 0.5) * 0.12,
              );
              book.rotation.z = (Math.random() - 0.5) * 0.08;
              group.add(book);
            }
          }
        }
      }
    }
  }

  // ---- the lectern, and the book open on it
  const lectern = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.5, 2.4), wood);
  lectern.position.set(14.2, 0.75, 0);
  group.add(lectern);

  const slope = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 2.2), stone);
  slope.position.set(14.2, 1.6, 0);
  slope.rotation.x = -0.32;
  group.add(slope);

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf3e6c4,
    emissive: 0x8a6a2a,
    emissiveIntensity: 0.5,
    roughness: 0.7,
  });
  for (const side of [-1, 1]) {
    const page = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 1.9), pageMat);
    page.position.set(14.2 + side * 0.72, 1.72, 0);
    page.rotation.x = -0.32;
    page.rotation.z = side * 0.12;
    group.add(page);
  }

  const glow = new THREE.PointLight(0xffe0a0, 16, 40, 2);
  glow.position.set(14.2, 2.6, 0);
  group.add(glow);

  // ---- light down the aisle, so the far end is a destination
  for (const x of [-8, 2]) {
    const lamp = new THREE.PointLight(0xffcf8a, 9, 32, 2);
    lamp.position.set(x, 4.6, 0);
    group.add(lamp);
  }

  return {
    group,
    /** What the camera should look at: the book, from down the aisle. */
    target: new THREE.Vector3(6, 2.6, 0),
    update(t) {
      pageMat.emissiveIntensity = 0.45 + Math.sin(t * 1.7) * 0.08;
      glow.intensity = 15 + Math.sin(t * 1.7) * 1.5;
    },
  };
}

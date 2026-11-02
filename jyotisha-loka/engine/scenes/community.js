/**
 * The Community district: Maṅgala's drum circle.
 *
 * Maṅgala is courage, energy, drive and siblings — the fire you sit around
 * rather than the fire you worship at. So this is not a temple. It is a ring of
 * stone seats on a dark mesa, one fire in the middle, a few drums left out for
 * whoever arrives next, and embers going up into the sky.
 *
 * Local convention, as with the other districts: the circle is at the origin,
 * the fire is at its centre, and the camera arrives from outside the ring.
 */
import * as THREE from 'three';
import { gold } from '../style.js';

/**
 * Embers. One Points object, recycled — a particle pool rather than new
 * geometry per spark, so a long stay costs nothing but a loop over floats.
 */
function createEmbers({ count = 160 } = {}) {
  const positions = new Float32Array(count * 3);
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seed[i * 3] = Math.random() * Math.PI * 2;
    seed[i * 3 + 1] = 0.4 + Math.random() * 0.6;
    seed[i * 3 + 2] = Math.random(); // phase along its rise
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xff9a4a,
    size: 0.42,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return {
    points,
    update(t) {
      const p = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const spread = seed[i * 3];
        const speed = seed[i * 3 + 1];
        // Each ember rises, drifts, and starts again; never a straight line.
        const cycle = (seed[i * 3 + 2] + t * speed * 0.22) % 1;
        const height = cycle * 16;
        const drift = 0.7 + cycle * 2.4;
        p[i * 3] = Math.cos(spread + cycle * 1.6) * drift;
        p[i * 3 + 1] = 0.5 + height;
        p[i * 3 + 2] = Math.sin(spread + cycle * 1.6) * drift;
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}

/** @param {{ seats?: number }} [opts] */
export function createCommunity({ seats = 12 } = {}) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x4a3b46, roughness: 0.92, metalness: 0.05 });
  const stoneDark = new THREE.MeshStandardMaterial({ color: 0x2e2530, roughness: 0.95, metalness: 0.04 });
  const trim = gold({ tone: 0xb9954a });

  // ---- the mesa: a dark disc to gather on
  const floor = new THREE.Mesh(new THREE.CircleGeometry(20, 48), stoneDark);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  // A gold ring inlay, marking where the circle is
  const ring = new THREE.Mesh(new THREE.TorusGeometry(12.6, 0.09, 6, 96), trim);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.06;
  group.add(ring);

  // ---- the seats, evenly around, each facing the fire
  for (let i = 0; i < seats; i++) {
    const a = (i / seats) * Math.PI * 2;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 1.5), stone);
    seat.position.set(Math.cos(a) * 11.6, 0.35, Math.sin(a) * 11.6);
    seat.rotation.y = -a + Math.PI / 2;
    group.add(seat);
  }

  // ---- the fire
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb45a, transparent: true, opacity: 0.85, fog: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.4, 10), flameMat);
  flame.position.y = 1.9;
  group.add(flame);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe6b0, fog: false }),
  );
  core.position.y = 1;
  group.add(core);

  const fireLight = new THREE.PointLight(0xff8a3a, 30, 70, 2);
  fireLight.position.y = 2.4;
  group.add(fireLight);

  // A few stones banking the fire
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.3, 0), stone);
    rock.position.set(Math.cos(a) * 2.6, 0.4, Math.sin(a) * 2.6);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(rock);
  }

  // ---- drums, left out for whoever arrives next
  const drumSkin = new THREE.MeshStandardMaterial({ color: 0xc9a06a, roughness: 0.7 });
  const drumBody = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.85 });
  const spots = [
    [4.6, 0, 2.2, 1.0],
    [-3.4, 0, 3.6, 0.82],
    [0.8, 0, -5.2, 0.9],
  ];
  for (const [x, , z, scale] of spots) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.05 * scale, 0.8 * scale, 1.5 * scale, 14), drumBody);
    drum.position.set(x, 0.75 * scale, z);
    group.add(drum);
    const skin = new THREE.Mesh(new THREE.CylinderGeometry(1.06 * scale, 1.06 * scale, 0.08, 14), drumSkin);
    skin.position.set(x, 1.5 * scale, z);
    group.add(skin);
  }

  const embers = createEmbers();
  group.add(embers.points);

  return {
    group,
    /** The fire: what the camera should look at, and what lights the ring. */
    target: new THREE.Vector3(0, 3, 0),
    update(t) {
      embers.update(t);
      const flicker = 0.86 + Math.sin(t * 7.3) * 0.08 + Math.sin(t * 13.1) * 0.05;
      fireLight.intensity = 26 * flicker;
      flame.scale.set(1, 0.94 + Math.sin(t * 5.1) * 0.06, 1);
      flameMat.opacity = 0.78 + Math.sin(t * 6.4) * 0.09;
    },
  };
}

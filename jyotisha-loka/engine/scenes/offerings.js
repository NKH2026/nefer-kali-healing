/**
 * The Offerings district: Śukra's river market.
 *
 * Śukra (Venus) is the graha of beauty, love, the arts and refinement — honey,
 * perfume, jewellery, cloth, and the pleasure of good things well made. So the
 * shop is not a grid of cards. It is a slow river at golden hour, a barge moored
 * in it, lanterns, bees working the honey, and the goods laid out on the deck.
 *
 * ── Why it is built in local space ──────────────────────────────────────────
 *
 * The district is placed at a real, changing place: beside Venus, at its true
 * sidereal longitude tonight. Building it around the origin and letting the boot
 * move and rotate the whole group means the scene never knows where it is, and
 * moving it tomorrow costs one line instead of re-laying every prop.
 *
 * Local convention: the river runs along +X, the barge sits at the origin, and
 * the camera arrives from +X (upstream) looking downstream.
 */
import * as THREE from 'three';
import { gold } from '../style.js';

/** A seamless-looking warm water texture: bands of honey light, drifting. */
function honeyWater() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const g = canvas.getContext('2d');

  const wash = g.createLinearGradient(0, 0, 0, 512);
  wash.addColorStop(0, '#2a1408');
  wash.addColorStop(0.45, '#4a240c');
  wash.addColorStop(0.7, '#6b3410');
  wash.addColorStop(1, '#2a1408');
  g.fillStyle = wash;
  g.fillRect(0, 0, 512, 512);

  // Long thin highlights: the river's current, catching the low sun.
  for (let i = 0; i < 190; i++) {
    const y = Math.random() * 512;
    const w = 30 + Math.random() * 190;
    const x = Math.random() * 512;
    const a = 0.02 + Math.random() * 0.10;
    g.strokeStyle = `rgba(255, ${180 + Math.random() * 60 | 0}, ${90 + Math.random() * 80 | 0}, ${a})`;
    g.lineWidth = 0.6 + Math.random() * 1.8;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + w, y + (Math.random() - 0.5) * 3);
    g.stroke();
  }
  // A few bright glints.
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(255, 226, 160, ${0.10 + Math.random() * 0.30})`;
    g.beginPath();
    g.arc(Math.random() * 512, Math.random() * 512, Math.random() * 1.7 + 0.4, 0, Math.PI * 2);
    g.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 3);
  return texture;
}

/**
 * The bees. One Points object for the whole swarm, animated in a single pass —
 * the same reasoning as the engine's other particle pools: one draw call, and
 * the per-frame cost is a loop over 240 floats.
 */
function createBees({ count = 240 } = {}) {
  const positions = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    seed[i * 4] = Math.random() * Math.PI * 2;          // phase
    seed[i * 4 + 1] = 5 + Math.random() * 22;           // radius
    seed[i * 4 + 2] = 1.4 + Math.random() * 5.2;        // height
    seed[i * 4 + 3] = 0.25 + Math.random() * 0.7;       // speed
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffd75a,
    size: 0.34,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
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
        const phase = seed[i * 4];
        const radius = seed[i * 4 + 1];
        const height = seed[i * 4 + 2];
        const speed = seed[i * 4 + 3];
        const a = phase + t * speed;
        // A lazy figure-of-eight over the barge, never a perfect circle.
        p[i * 3] = Math.cos(a) * radius + Math.sin(a * 2.3 + phase) * 2.2;
        p[i * 3 + 1] = height + Math.sin(a * 1.7 + phase * 2) * 0.7;
        p[i * 3 + 2] = Math.sin(a * 0.8) * radius * 0.42 + Math.cos(a * 3.1 + phase) * 1.6;
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}

/**
 * Build the district. Everything is in local space; the caller positions the group.
 *
 * @param {{ scale?: number }} [opts]
 */
export function createOfferings({ scale = 1 } = {}) {
  const group = new THREE.Group();
  group.scale.setScalar(scale);

  const water = honeyWater();

  // ---- the river
  const waterMat = new THREE.MeshStandardMaterial({
    map: water,
    color: 0x8a5a2a,
    roughness: 0.22,
    metalness: 0.25,
    emissive: 0x2a1404,
    emissiveIntensity: 0.18,
  });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(150, 46, 1, 1), waterMat);
  river.rotation.x = -Math.PI / 2;
  river.position.y = -0.9;
  group.add(river);

  // ---- the barge
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x4a2c16, roughness: 0.75, metalness: 0.12 });
  const trimMat = gold({ tone: 0xd4a640 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(34, 2.2, 13), deckMat);
  hull.position.y = 0.2;
  group.add(hull);

  for (const z of [-6.4, 6.4]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(34, 0.28, 0.28), trimMat);
    rail.position.set(0, 1.7, z);
    group.add(rail);
  }

  // Mooring posts — the barge is tied to nothing, which is rather the point.
  for (const x of [-15, -5, 5, 15]) {
    for (const z of [-5.6, 5.6]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.6, 8), deckMat);
      post.position.set(x, 1.5, z);
      group.add(post);
    }
  }

  // ---- the stalls: a table, a canopy, and lanterns
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x8e1f4a,
    roughness: 0.85,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffd8a0,
    emissive: 0xffb45a,
    emissiveIntensity: 1.15,
    roughness: 0.4,
  });

  const stalls = [
    { x: -9, rot: 0.12, tint: 0x8e1f4a },
    { x: 0, rot: -0.08, tint: 0x2f6b5a },
    { x: 9, rot: 0.06, tint: 0x7a4a1c },
  ];
  for (const stall of stalls) {
    const post = new THREE.Group();
    post.position.set(stall.x, 0, 0);
    post.rotation.y = stall.rot;

    const table = new THREE.Mesh(new THREE.BoxGeometry(6, 0.22, 3.4), deckMat);
    table.position.y = 1.9;
    post.add(table);

    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 1.4), canopyMat.clone());
    cloth.material.color.setHex(stall.tint);
    cloth.position.set(0, 1.15, 1.68);
    post.add(cloth);

    // The canopy: four triangles is a roof, and a roof is enough.
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.1, 4), canopyMat.clone());
    roof.material.color.setHex(stall.tint);
    roof.position.y = 4.9;
    roof.rotation.y = Math.PI / 4;
    post.add(roof);

    for (const dx of [-2.6, 2.6]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 6), trimMat);
      pole.position.set(dx, 2.9, 0);
      post.add(pole);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), lanternMat);
      lamp.position.set(dx, 1.9, 1.5);
      post.add(lamp);
    }
    group.add(post);
  }

  // ---- the goods: jars of honey, bottles of tincture, folded cloth
  const jarMat = new THREE.MeshStandardMaterial({
    color: 0xd9a441,
    emissive: 0x6b3d08,
    emissiveIntensity: 0.8,
    roughness: 0.18,
    metalness: 0.35,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x5cff9a,
    emissive: 0x1c6b3a,
    emissiveIntensity: 0.7,
    roughness: 0.12,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
  });

  for (const stall of stalls) {
    for (let i = 0; i < 7; i++) {
      const isJar = i % 2 === 0;
      const body = new THREE.Mesh(
        isJar
          ? new THREE.CylinderGeometry(0.24, 0.3, 0.7, 10)
          : new THREE.CylinderGeometry(0.14, 0.16, 0.95, 8),
        isJar ? jarMat : glassMat,
      );
      body.position.set(
        stall.x + (i - 3) * 0.72 + (Math.random() - 0.5) * 0.2,
        2.36,
        (Math.random() - 0.5) * 1.9,
      );
      group.add(body);
      if (isJar) {
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.09, 10), trimMat);
        lid.position.copy(body.position).setY(2.75);
        group.add(lid);
      }
    }
  }

  // ---- lanterns strung across the barge, the whole way down
  const lanterns = [];
  for (let i = 0; i < 11; i++) {
    const x = -15 + i * 3;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), lanternMat);
    lamp.position.set(x, 4.4 + Math.sin(i * 1.3) * 0.28, 0);
    group.add(lamp);
    lanterns.push(lamp);
  }

  // ---- light. One warm point, because the embers of a hundred would cost more
  // than they show.
  const warm = new THREE.PointLight(0xffb45a, 16, 52, 2);
  warm.position.set(0, 6.5, 2);
  group.add(warm);

  // ---- and the river's own sheen: a low, wide fill so the water reads gold
  const sheen = new THREE.PointLight(0xffd8a0, 9, 70, 2);
  sheen.position.set(0, 1.2, -12);
  group.add(sheen);

  const bees = createBees();
  group.add(bees.points);

  return {
    group,
    /** The planks of the deck; the shot aims just above them. */
    target: new THREE.Vector3(0, 3.2, 0),
    update(t) {
      // The river is a scroll of texture rather than a moving mesh: cheap, and
      // it is what "flowing" looks like at this distance.
      water.offset.x = (t * 0.014) % 1;
      water.offset.y = (t * 0.004) % 1;
      bees.update(t);
      // Lanterns breathe, all together, as a lit barge actually does.
      lanternMat.emissiveIntensity = 1.05 + Math.sin(t * 2.1) * 0.14 + Math.sin(t * 5.7) * 0.05;
      warm.intensity = 15 + Math.sin(t * 2.1) * 1.5;
    },
  };
}

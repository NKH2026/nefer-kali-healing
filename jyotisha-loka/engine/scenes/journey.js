/**
 * The Journey district: Śani's road.
 *
 * Śani — Saturn — is, in this world's own words, "time, discipline, endurance
 * and service". That is what a foundation's origin story actually is: not a
 * highlight reel, but a road somebody kept walking. So the district is a
 * basalt switchback climbing away from you, with milestones along its edge and
 * a single lamp still burning at the top.
 *
 * The milestones carry NAMES, not dates. The shape of the story is right here;
 * the history is yours to put in. Replace the `name` fields with the real
 * moments and nothing else needs to change.
 *
 * Local convention, as with the market: the road runs along +X and climbs as
 * it goes, so the camera can sit at -X — on the road, looking up it.
 */
import * as THREE from 'three';
import { gold } from '../style.js';

/** A carved name for a milestone, drawn once on a canvas. */
function stele(text) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 320;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 320);
  g.fillStyle = '#e8d29a';
  g.textAlign = 'center';
  g.font = '500 26px "Cormorant Garamond", Georgia, serif';
  // Wrap on words so a long name still fits the stone.
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width > 210 && line) { lines.push(line); line = w; }
    else line = next;
  }
  if (line) lines.push(line);
  const top = 160 - (lines.length - 1) * 18;
  lines.forEach((l, i) => g.fillText(l, 128, top + i * 36));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * @param {{ milestones?: string[] }} [opts]
 *   The names carved on the road. Names, not dates — the dates are the part
 *   only the foundation can supply.
 */
export function createJourney({
  milestones = ['Where we began', 'The first circle', 'The teaching', 'The giving', 'Still walking'],
} = {}) {
  const group = new THREE.Group();

  const basalt = new THREE.MeshStandardMaterial({ color: 0x554b68, roughness: 0.92, metalness: 0.06 });
  const basaltLit = new THREE.MeshStandardMaterial({ color: 0x6b6084, roughness: 0.85, metalness: 0.08 });
  const trim = gold({ tone: 0xb9954a });
  const stone = new THREE.MeshStandardMaterial({ color: 0x7a6f96, roughness: 0.9, metalness: 0.05 });

  // ── The road: a switchback of slabs, each a little higher and a little
  // further on, so the climb reads from any angle.
  const STEPS = 26;
  const rise = 1.05;
  const run = 3.1;
  for (let i = 0; i < STEPS; i++) {
    // A gentle zig-zag: the road drifts across before turning back.
    const zig = Math.sin(i * 0.55) * 3.4;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(run, 0.5, 7.6), i % 2 ? basalt : basaltLit);
    slab.position.set(i * run - 26, i * rise, zig);
    slab.rotation.y = Math.cos(i * 0.55) * 0.09;
    group.add(slab);

    // A gold line down the centre of every fourth slab: the way is marked.
    if (i % 4 === 0) {
      const inlay = new THREE.Mesh(new THREE.BoxGeometry(run * 0.7, 0.06, 0.34), trim);
      inlay.position.set(slab.position.x, slab.position.y + 0.28, sigZig(i));
      group.add(inlay);
    }
  }

  /** The road's z at step `i`, matching the slabs above. */
  function sigZig(i) {
    return Math.sin(i * 0.55) * 3.4;
  }

  // ── The milestones, along the outer edge.
  milestones.forEach((name, i) => {
    const at = 2 + i * 5;
    const x = at * run - 26;
    const y = at * rise;
    const z = sigZig(at) + 4.4;

    const block = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.6), stone);
    block.position.set(x, y + 1.5, z);
    block.rotation.y = -0.12;
    group.add(block);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.8), trim);
    cap.position.set(x, y + 2.82, z);
    cap.rotation.y = -0.12;
    group.add(cap);

    // The name, on the face of the stone.
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(1.25, 1.55),
      new THREE.MeshBasicMaterial({ map: stele(name), transparent: true, depthWrite: false, fog: false }),
    );
    face.position.set(x + 0.02, y + 1.55, z + 0.32);
    face.rotation.y = -0.1;
    group.add(face);
  });

  // ── The lamp at the top: the only warm light on the road.
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffd8a0,
    emissive: 0xffb45a,
    emissiveIntensity: 1.6,
    roughness: 0.4,
  });
  const topX = (STEPS - 1) * run - 26;
  const topY = (STEPS - 1) * rise;
  const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.4, 8), basalt);
  lampPost.position.set(topX + 2, topY + 2.4, sigZig(STEPS - 1));
  group.add(lampPost);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), lampMat);
  lamp.position.set(topX + 2, topY + 4.9, sigZig(STEPS - 1));
  group.add(lamp);
  const lampLight = new THREE.PointLight(0xffb45a, 14, 48, 2);
  lampLight.position.copy(lamp.position);
  group.add(lampLight);

  // ── A few fallen stones, so the road looks walked rather than laid out.
  for (let i = 0; i < 16; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.7, 0), basalt);
    const at = 1 + Math.random() * (STEPS - 3);
    r.position.set(at * run - 26 + (Math.random() - 0.5) * 2.6, at * rise + 0.3, sigZig(at) + (Math.random() - 0.5) * 8);
    r.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(r);
  }

  return {
    group,
    /** The middle of the climb — what the camera should look at. */
    target: new THREE.Vector3(2, 14, 0),
    update(t) {
      lampMat.emissiveIntensity = 1.5 + Math.sin(t * 2.4) * 0.18;
      lampLight.intensity = 13 + Math.sin(t * 2.4) * 2;
    },
  };
}

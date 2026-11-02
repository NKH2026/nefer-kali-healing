/**
 * The chart, drawn in the sky.
 *
 * This is the North Indian (D1 Rashi) frame: a square, its two diagonals, and
 * the diamond joining the four edge midpoints. Those five lines cut the square
 * into twelve cells, and the cell in the top centre is always the first house —
 * which is exactly why this layout suits a 3D world. The frame is FIXED. The
 * signs rotate through it, the planets move through it, the boxes never do.
 *
 * ── Why one texture and not line geometry ───────────────────────────────────
 *
 * Twelve house numbers and five rules could be a dozen Line objects and a dozen
 * sprite labels: ~24 draw calls for a diagram. Drawn once on a canvas and set
 * on a single plane it is one. Crisp at any distance, trivial to restyle, and
 * the numbers line up with the cells by construction rather than by eye.
 *
 * The planets are NOT drawn here. They are the real bodies in the sky, and they
 * will hang in front of this frame in their own cells once the ascendant can be
 * computed — which needs a birthplace, not just a date.
 */
import * as THREE from 'three';
import { GRAHAS } from '../jyotish/sky.js';

/** Where each house's label sits, in units of half the square's side. */
const HOUSE_AT = [
  [0, 0.62], // 1  top centre — the ascendant's own cell
  [-0.52, 0.84], // 2
  [-0.84, 0.52], // 3
  [-0.52, 0], // 4
  [-0.84, -0.52], // 5
  [-0.52, -0.84], // 6
  [0, -0.62], // 7
  [0.52, -0.84], // 8
  [0.84, -0.52], // 9
  [0.52, 0], // 10
  [0.84, 0.52], // 11
  [0.52, 0.84], // 12
];

const SIZE = 1024;

/**
 * @param {{ size?: number, opacity?: number }} [opts]
 */
export function createChart({ size = 170, opacity = 0.9 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, SIZE, SIZE);

  const pad = 48;
  const a = pad;
  const b = SIZE - pad;
  const mid = SIZE / 2;

  // The five rules. Thin gold, like the chart in a book.
  g.strokeStyle = 'rgba(241, 211, 138, 0.85)';
  g.lineWidth = 3;
  g.beginPath();
  // the square
  g.rect(a, a, b - a, b - a);
  // the diagonals
  g.moveTo(a, a); g.lineTo(b, b);
  g.moveTo(b, a); g.lineTo(a, b);
  // the diamond through the edge midpoints
  g.moveTo(mid, a); g.lineTo(b, mid);
  g.lineTo(mid, b); g.lineTo(a, mid);
  g.closePath();
  g.stroke();

  // The houses, numbered. Violet, so they read as labels and not as geometry.
  g.fillStyle = 'rgba(201, 182, 255, 0.95)';
  g.font = '600 40px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const span = (b - a) / 2;
  HOUSE_AT.forEach(([x, y], i) => {
    g.fillText(String(i + 1), mid + x * span, mid - y * span);
  });

  // The first house is marked, because it is the one the whole chart hangs on.
  g.strokeStyle = 'rgba(255, 228, 160, 0.9)';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(mid, a + 2);
  g.lineTo(mid + span * 0.5, mid - span * 0.5 + 2);
  g.moveTo(mid, a + 2);
  g.lineTo(mid - span * 0.5, mid - span * 0.5 + 2);
  g.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  const group = new THREE.Group();
  group.add(mesh);


  /**
   * Put the grahas in their cells.
   *
   * Same whole-sign rule the flight is validated on: house 1 is the ascendant's
   * entire sign, and each house is the next sign. The frame never moves — only
   * the planets in it do — which is what makes this feel like a chart rather
   * than a diagram.
   *
   * @param {Array<{id: string, lon: number}>} positions
   * @param {number} ascendantLon sidereal longitude of the Lagna
   */
  const markers = new Map();
  function setChart(positions, ascendantLon) {
    const sign = (lon) => Math.floor((((lon % 360) + 360) % 360) / 30);
    const ascSign = sign(ascendantLon);
    for (const p of positions) {
      const house = (((sign(p.lon) - ascSign) % 12) + 12) % 12 + 1;
      const [hx, hy] = HOUSE_AT[house - 1];
      let marker = markers.get(p.id);
      if (!marker) {
        const graha = GRAHAS.find((g) => g.id === p.id);
        marker = new THREE.Mesh(
          new THREE.SphereGeometry(3.6, 16, 12),
          new THREE.MeshBasicMaterial({ color: graha?.colour ?? 0xffffff, fog: false }),
        );
        group.add(marker);
        markers.set(p.id, marker);
      }
      // Slightly smaller cells than the full half-width, so markers sit inside.
      marker.position.set(hx * (size / 2) * 0.84, -(hy * (size / 2) * 0.84), 2);
    }
  }
  return { group, size, material, setChart };
}

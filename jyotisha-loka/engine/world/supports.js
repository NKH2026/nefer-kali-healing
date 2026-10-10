/**
 * Walkable surfaces.
 *
 * Until now the player was glued to the terrain: `heightAt(x, z)` was the only
 * thing that decided where the floor was, and everything else was just scenery
 * you bumped into. That makes the spiral ramp, the mushroom caps and the tops of
 * buildings impossible to stand on.
 *
 * This module collects the surfaces you *can* stand on and answers one question:
 * "given where I am and how high I was a moment ago, what is the floor here?"
 *
 * Three kinds of surface are supported, because between them they cover
 * everything in the world exactly and cheaply:
 *
 *   box    axis-aligned footprint with a flat top. Comes free from every static
 *          mesh's bounding box, which is what makes "jump on top of things" work
 *          for gravestones, ruins, terraces and roofs without registering
 *          anything by hand.
 *   dome   a squashed hemisphere. Bounding boxes are badly wrong for these -- a
 *          28 m mushroom cap would let you stand at apex height anywhere over
 *          its whole footprint -- so caps register one explicitly.
 *   ramp   a helix: the Sporeworks walkway. Also badly served by a bounding box,
 *          and a helix has to answer for every turn it passes overhead.
 *
 * Nothing here blocks movement horizontally; that is still the collider list.
 * Surfaces are what you land on, colliders are what you walk into.
 */
import * as THREE from 'three';

const TAU = Math.PI * 2;

export class SupportField {
  constructor() {
    /** @type {{minX:number,maxX:number,minZ:number,maxZ:number,top:number}[]} */
    this.boxes = [];
    /**
     * Domes, including mushroom caps. `kind` is undefined for an ordinary
     * standing surface and 'bounce' for a cap that launches you; `power` scales
     * the launch and `dir` is the unit direction it throws you in. See BOUNCE in
     * config.js.
     * @type {{cx:number,cz:number,baseY:number,radius:number,yScale:number,kind?:string,power?:number,dir?:{x:number,z:number}}[]}
     */
    this.domes = [];
    /** @type {{cx:number,cz:number,rIn:number,rOut:number,y0:number,y1:number,angle0:number,turns:number}[]} */
    this.ramps = [];
    /** Bumped whenever something is added, so the player can notice and re-cache. */
    this.version = 0;
  }

  addBox(minX, maxX, minZ, maxZ, top) {
    if (!Number.isFinite(top)) return;
    this.boxes.push({ minX, maxX, minZ, maxZ, top });
    this.version++;
  }

  /**
   * @param {string} [kind]   'bounce' to launch the player on landing
   * @param {number} [power]  launch multiplier, default 1
   * @param {{x:number,z:number}} [dir]  unit direction to throw the player in
   */
  addDome(cx, cz, baseY, radius, yScale = 1, kind, power, dir) {
    this.domes.push({ cx, cz, baseY, radius, yScale, kind, power, dir });
    this.version++;
  }

  addRamp(spec) {
    this.ramps.push(spec);
    this.version++;
  }

  /**
   * Move everything by an offset. Area builders work in coordinates local to
   * their own centre, so the whole field is shifted into world space once, after
   * the area has been built and before it is positioned.
   */
  offset(dx, dy, dz) {
    for (const b of this.boxes) {
      b.minX += dx;
      b.maxX += dx;
      b.minZ += dz;
      b.maxZ += dz;
      b.top += dy;
    }
    for (const d of this.domes) {
      d.cx += dx;
      d.cz += dz;
      d.baseY += dy;
    }
    for (const r of this.ramps) {
      r.cx += dx;
      r.cz += dz;
      r.y0 += dy;
      r.y1 += dy;
    }
    this.version++;
  }

  /** Merge another field (an area's) into this one. */
  addAll(other) {
    this.boxes.push(...other.boxes);
    this.domes.push(...other.domes);
    this.ramps.push(...other.ramps);
    this.version++;
  }

  /**
   * Highest surface at (x, z) that is no higher than `maxTop`.
   *
   * `maxTop` is normally "how high my feet were a moment ago, plus a step". That
   * single rule does three jobs at once: you land on things you fall onto, you
   * cannot be teleported up through a floor above your head, and low lips are
   * walkable without a jump.
   *
   * Normally returns just the height, which is all the caller needs to stand on
   * something. Pass `withSurface` to also learn *what* was hit, which is how a
   * bouncy mushroom cap is told apart from ordinary ground. That second return
   * shape is additive on purpose: every existing caller keeps working.
   *
   * @param {boolean} [withSurface]
   * @returns {number|{y:number, surface:object|null}}
   *   the surface height (or -Infinity if there is nothing here), or the height
   *   plus the surface descriptor that produced it.
   */
  heightAt(x, z, maxTop = Infinity, withSurface = false) {
    let best = -Infinity;
    /** The surface that produced `best`, so the caller can ask what kind it is. */
    let bestSurface = null;

    for (let i = 0; i < this.boxes.length; i++) {
      const b = this.boxes[i];
      if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) continue;
      if (b.top > maxTop) continue;
      if (b.top > best) {
        best = b.top;
        bestSurface = b;
      }
    }

    for (let i = 0; i < this.domes.length; i++) {
      const d = this.domes[i];
      const dx = x - d.cx;
      const dz = z - d.cz;
      const dist2 = dx * dx + dz * dz;
      const r2 = d.radius * d.radius;
      if (dist2 > r2) continue;
      const y = d.baseY + Math.sqrt(r2 - dist2) * d.yScale;
      if (y > maxTop) continue;
      if (y > best) {
        best = y;
        bestSurface = d;
      }
    }

    for (let i = 0; i < this.ramps.length; i++) {
      const y = rampHeightAt(this.ramps[i], x, z, maxTop);
      if (y !== null && y > best) {
        best = y;
        bestSurface = this.ramps[i];
      }
    }

    if (withSurface) return { y: best, surface: bestSurface };
    return best;
  }

  /** Bounding boxes of every surface, for the debug overlay. */
  stats() {
    return {
      boxes: this.boxes.length,
      domes: this.domes.length,
      ramps: this.ramps.length,
    };
  }
}

/**
 * Height of a helical walkway at (x, z), or null if the point is off it.
 *
 * A helix passes over the same bearing once per turn, so this returns the
 * highest turn that is still at or below `maxTop` -- which is what lets you walk
 * up past the turns below you without snapping to one overhead.
 */
export function rampHeightAt(ramp, x, z, maxTop = Infinity) {
  const dx = x - ramp.cx;
  const dz = z - ramp.cz;
  const r = Math.hypot(dx, dz);
  if (r < Math.min(ramp.rIn, ramp.rInEnd ?? ramp.rIn)) return null;
  if (r > Math.max(ramp.rOut, ramp.rOutEnd ?? ramp.rOut)) return null;

  const a = Math.atan2(dz, dx);
  const span = TAU * ramp.turns;
  const rise = ramp.y1 - ramp.y0;
  const rInEnd = ramp.rInEnd ?? ramp.rIn;
  const rOutEnd = ramp.rOutEnd ?? ramp.rOut;

  let best = null;
  const kStart = Math.floor((a - ramp.angle0) / TAU) - 1;
  const kEnd = kStart + Math.ceil(ramp.turns) + 2;

  for (let k = kStart; k <= kEnd; k++) {
    const rel = a + k * TAU - ramp.angle0;
    if (rel < 0 || rel > span) continue;
    const t = rel / span;
    // The radius may change along the walk, so the width has to be checked at
    // this turn's own parameter, not against the ends.
    const rIn = ramp.rIn + (rInEnd - ramp.rIn) * t;
    const rOut = ramp.rOut + (rOutEnd - ramp.rOut) * t;
    if (r < rIn || r > rOut) continue;
    const y = ramp.y0 + rise * t;
    if (y > maxTop) continue;
    if (best === null || y > best) best = y;
  }
  return best;
}

/**
 * Build the ribbon geometry for a helical walkway: two edges swept along the
 * helix, with optional glowing lip along the outer edge.
 *
 * Normals are forced to straight up rather than computed, so the walkway reads
 * as a flat path instead of a twisted tube.
 */
export function spiralWalkwayGeometry({
  rIn,
  rOut,
  rInEnd = rIn,
  rOutEnd = rOut,
  y0,
  y1,
  angle0,
  turns,
  segments = 260,
}) {
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const normals = new Float32Array((segments + 1) * 2 * 3);
  const uvs = new Float32Array((segments + 1) * 2 * 2);
  const indices = [];

  const span = TAU * turns;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = angle0 + t * span;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const y = y0 + (y1 - y0) * t;
    const ri = rIn + (rInEnd - rIn) * t;
    const ro = rOut + (rOutEnd - rOut) * t;
    const o = i * 6;
    positions[o + 0] = ca * ri;
    positions[o + 1] = y;
    positions[o + 2] = sa * ri;
    positions[o + 3] = ca * ro;
    positions[o + 4] = y;
    positions[o + 5] = sa * ro;
    normals[o + 1] = 1;
    normals[o + 4] = 1;
    const u = i * 4;
    uvs[u + 0] = 0;
    uvs[u + 1] = t;
    uvs[u + 2] = 1;
    uvs[u + 3] = t;
  }

  for (let i = 0; i < segments; i++) {
    const a0 = i * 2;
    const b0 = i * 2 + 1;
    const a1 = (i + 1) * 2;
    const b1 = (i + 1) * 2 + 1;
    indices.push(a0, b0, b1, a0, b1, a1);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setIndex(indices);
  return g;
}

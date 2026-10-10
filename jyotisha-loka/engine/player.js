/**
 * First-person walking.
 *
 * Look direction comes from PointerLockControls; position is ours. The player
 * is a vertical capsule simplified to a circle in the XZ plane, tested against
 * the areas' collider list, then snapped to the terrain height from
 * `heightAt()` -- the same function that displaced the ground mesh.
 */
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { BOUNCE, PLAYER, WORLD } from './config.js';
// Nefer Kali Healing: no realm terrain here; a world always passes its own groundAt.
const heightAt = () => 0;
import { LIFECYCLE, canDash } from './lifecycle.js';

const GRAVITY = 26;

/**
 * The launch speed a bounce produces, as a pure function of the impact.
 *
 * Pulled out of the player so it can be unit-tested without a DOM, and — more
 * importantly for Phase 2 — so the server can run *exactly this* to validate the
 * movement a client reports. It depends on nothing but the impact speed, the
 * cap's power and BOUNCE, all of which are reconstructible from a position
 * trace. Anything that folded in player state would make server-side validation
 * impossible without trusting the client.
 *
 * @param {number} impactSpeed  downward speed at contact, m/s (>= 0)
 * @param {number} [power]      the cap's multiplier, default 1
 * @returns {number} launch speed, m/s
 */
export function bounceSpeed(impactSpeed, power = 1) {
  const scaled = Math.max(0, impactSpeed) * BOUNCE.restitution * power;
  return Math.min(BOUNCE.maxSpeed, Math.max(BOUNCE.minSpeed, scaled));
}

/** Would this impact actually bounce? */
export function isBounceImpact(surface, impactSpeed) {
  return surface?.kind === 'bounce' && impactSpeed >= BOUNCE.minImpact;
}
/**
 * How much of a lip you can walk up without jumping. High enough for kerbs,
 * temple steps and the start of the Sporeworks walkway; low enough that you
 * still have to jump onto anything substantial.
 */
const STEP_UP = 0.6;

export class Player {
  /**
   * @param {THREE.Camera} camera
   * @param {HTMLElement} domElement
   * @param {{groundAt?: (x:number, z:number) => number, respawnY?: number}} [world]
   *   Another world's ground and fall limit (Earth). They are needed HERE, not set
   *   afterwards: the constructor ends by standing the player on the ground, and the
   *   realm's terrain cannot answer before the realm's world is installed.
   */
  constructor(camera, domElement, { groundAt = heightAt, respawnY = WORLD.respawnY } = {}) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);
    this.controls.pointerSpeed = 1.0;

    /** Feet position. */
    this.position = new THREE.Vector3(0, 0, 0);
    /**
     * The ground under a point. The realm's own terrain by default; another world
     * (Earth) hands its own here, and everything else about walking stays the same.
     * @type {(x:number, z:number) => number}
     */
    this.groundAt = groundAt;
    /** Fall below this and you are put back at the spawn. */
    this.respawnY = respawnY;
    this.velocity = new THREE.Vector3();
    this.colliders = [];
    /**
     * Walkable surfaces (ramps, caps, rooftops). See src/world/supports.js.
     * Without one, the only floor is the terrain.
     */
    this.supports = null;
    /** How high a lip you can walk up without jumping. */
    this.stepUp = STEP_UP;
    /** Multiplier on head bob and sway, driven by the sensory dial. */
    this.bobScale = 1;

    this.keys = new Set();
    this.onGround = true;
    this.bobPhase = 0;
    this.bobAmount = 0;
    this.distanceWalked = 0;

    /**
     * Touch input, pushed in from TouchControls. `x` is strafe (-1 left .. 1
     * right), `y` is forward (-1 back .. 1 forward).
     */
    this.touchMove = { x: 0, y: 0 };
    /** Held via the on-screen RUN button; Shift does the same on a keyboard. */
    this.touchSprinting = false;
    this._lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    /**
     * The head, in world space, refreshed by `syncCamera()`. The camera director
     * decides whether to sit here or somewhere behind it.
     */
    this.eyes = new THREE.Vector3();
    /**
     * The aim, injected by the engine — normally a `CameraDirector`'s holder-aware
     * helper. Optional: with no director the player simply does not turn, which is
     * what the pure movement tests want.
     * @type {{aimAt:Function, faceTowards:Function, drag:Function, yaw:number}|null}
     */
    this.aim = null;

    // ---- jumping
    /** Jumps used since last touching the ground (0 = none yet). */
    /**
     * Lifecycle powers (lifecycle.js), set by the realm from the member's study:
     * glide (hold jump while falling) and root-dash (`dash()`).
     */
    this.powers = { glide: false, dash: false };
    /** Held by the on-screen JUMP button, as Space is on a keyboard: glide reads it. */
    this.touchJumpHeld = false;
    /** True while gliding this frame, for the avatar and the HUD. */
    this.gliding = false;
    this._dashLeft = 0;
    this._dashDir = { x: 0, z: 0 };
    this._lastDashAt = null;
    this.jumpsUsed = 0;
    /** Counts down after a jump press so slightly-early presses still register. */
    this.jumpBuffer = 0;
    /** Counts down after leaving the ground, allowing a late "grounded" jump. */
    this.coyote = 0;
    /** Set for a moment when an air jump fires, purely so the HUD can react. */
    this.airJumpFlash = 0;
    /**
     * Horizontal speed ceiling while airborne. Captured from the ground speed
     * at the moment you leave it, so a sprint-jump keeps its momentum but
     * walking over a bump cannot be used to exceed walking speed. Air jumps
     * raise it.
     */
    this.airCap = PLAYER.walkSpeed;

    /**
     * Bounces recorded this frame, drained by the caller so it can play the
     * sound and squash the cap. An event list rather than a boolean because more
     * than one can happen in a frame, and because the world needs to know *which*
     * cap was hit, not merely that one was.
     */
    this.bounces = [];
    /**
     * Called with the same event object the moment a bounce happens, before the
     * queue is drained. The pull-based queue is enough for the frame loop, but a
     * test (or a future network layer) needs to observe every event even when
     * something else has already emptied the queue — polling would race the
     * drain, and whether a bounce was seen would depend on frame timing.
     */
    this.onBounce = null;

    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._wish = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);

    this._onKeyDown = (e) => {
      // Jump is edge-triggered: holding Space must not burn all three jumps.
      if (e.code === 'Space' && !e.repeat) this.requestJump();
      this.keys.add(e.code);
      // Stop the page scrolling under the canvas.
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onBlur = () => this.keys.clear();

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);

    this.reset();
  }

  /**
   * Put the player at the world's spawn and clear their momentum.
   *
   * MuzakWorld's spawn was always the origin, so this took no arguments. The
   * realm's spawn is content (`world.json` → `spawn`), and it deliberately sits
   * on open ground outside every area's full-volume radius so that arriving is
   * quiet. Delegates to `teleportTo` so landing is collision-aware here too.
   *
   * @param {{x:number,z:number}} [at]  defaults to the origin
   */
  reset(at = { x: 0, z: 0 }) {
    this.teleportTo(at.x ?? 0, at.z ?? 0);
    // `teleportTo` leaves the bob accumulator alone; a fresh spawn should be still.
    this.bobAmount = 0;
    this.bobPhase = 0;
    this.distanceWalked = 0;
  }

  /**
   * Drop the player at a spot on the map, clear their momentum, and snap them
   * to the terrain. Collisions are resolved afterwards, so travelling to an
   * area whose centre is inside a building (the tower) still lands you safely
   * outside it.
   */
  teleportTo(x, z) {
    this.position.set(x, 0, z);
    this.velocity.set(0, 0, 0);
    this.airCap = PLAYER.walkSpeed;
    this.resolveCollisions(this.position, this.bounds);
    // Land on the ground, or on a low deck that is effectively ground level.
    //
    // The query is anchored a step above the TERRAIN rather than left unbounded, and
    // both halves of that matter. Unbounded, it answers "the highest thing over your
    // head": travelling to the Sporeworks then put the player on top of a giant
    // mushroom cap 32 m above the station they were aiming for, out of reach of the
    // platform they had come to stand on. Anchored to the terrain, it answers "the
    // ground here, or a platform sitting on it", which is what a travel arrival is.
    const ground = this.groundAt(this.position.x, this.position.z);
    this.position.y = this.floorAt(this.position.x, this.position.z, ground + this.stepUp);
    this.onGround = true;
    this.jumpsUsed = 0;
    this.jumpBuffer = 0;
    this.coyote = PLAYER.coyoteTime;
    this.bobAmount = 0;
    this.camera.position.set(
      this.position.x,
      this.position.y + PLAYER.eyeHeight,
      this.position.z,
    );
  }

  /**
   * Turn to face a point on the ground plane.
   *
   * Delegates to the aim when one is injected, so turning the player and turning the
   * camera cannot disagree — there is one yaw in the world, not two.
   */
  faceTowards(x, z) {
    if (this.aim?.faceTowards) {
      this.aim.faceTowards(this.position, x, z);
      return;
    }
    const dx = x - this.position.x;
    const dz = z - this.position.z;
    if (dx * dx + dz * dz < 1e-6) return;
    this._lookEuler.setFromQuaternion(this.camera.quaternion);
    this._lookEuler.y = Math.atan2(-dx, -dz);
    this._lookEuler.x = 0;
    this.camera.quaternion.setFromEuler(this._lookEuler);
  }

  /** Queue a jump. Buffered so a press just before landing still counts. */
  /**
   * Root-dash (the hypha stage): a short burst along the given direction (or the
   * way the member is already moving). Returns whether it happened.
   */
  dash(dirX = 0, dirZ = 0) {
    if (!this.powers.dash) return false;
    const now = performance.now() / 1000;
    if (!canDash(now, this._lastDashAt)) return false;
    let x = dirX;
    let z = dirZ;
    if (Math.hypot(x, z) < 1e-3) { x = this.velocity.x; z = this.velocity.z; }
    const len = Math.hypot(x, z);
    if (len < 1e-3) return false;
    this._dashDir = { x: x / len, z: z / len };
    this._dashLeft = LIFECYCLE.dashTime;
    this._lastDashAt = now;
    return true;
  }

  requestJump() {
    this.jumpBuffer = PLAYER.jumpBuffer;
  }

  /** Held down with the on-screen RUN button. */
  setSprinting(on) {
    this.touchSprinting = on;
  }

  get isSprinting() {
    return this.touchSprinting || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }

  /** How many jumps are left before touching the ground. */
  get jumpsRemaining() {
    return Math.max(0, PLAYER.maxJumps - this.jumpsUsed);
  }

  /**
   * How much of a jump's lift survives at the current altitude. 1 below the
   * soft ceiling, fading to a token amount once well above it. With unlimited
   * jumps this is what stops you climbing into an empty sky forever.
   */
  _altitudeScale() {
    if (!Number.isFinite(PLAYER.softCeiling)) return 1;
    const over = this.position.y - PLAYER.softCeiling;
    if (over <= 0) return 1;
    return Math.max(0.06, 1 - over / PLAYER.ceilingFalloff);
  }

  /** True while the player is above the soft ceiling. */
  get aboveCeiling() {
    return Number.isFinite(PLAYER.softCeiling) && this.position.y > PLAYER.softCeiling;
  }

  /** Fire a jump if one is available. Returns true if it happened. */
  _tryJump() {
    if (this.jumpsUsed >= PLAYER.maxJumps) return false;

    const grounded = this.onGround || this.coyote > 0;
    // The first jump needs ground (or coyote time); the rest are mid-air jumps.
    if (this.jumpsUsed === 0 && !grounded) return false;

    const scale = this._altitudeScale();
    const isAirJump = this.jumpsUsed > 0;
    const base = isAirJump ? PLAYER.airJumpSpeed : PLAYER.jumpSpeed;
    this.velocity.y = base * scale;
    this.onGround = false;
    this.coyote = 0;
    this.jumpsUsed += 1;

    if (isAirJump) {
      // Carry momentum through the air jump, and give a kick forward if you
      // were hovering, so the extra jumps actually go somewhere.
      const speed = Math.hypot(this.velocity.x, this.velocity.z);
      if (speed > 0.2) {
        this.velocity.x *= PLAYER.airJumpBoost;
        this.velocity.z *= PLAYER.airJumpBoost;
      } else {
        this.velocity.x += this._forward.x * PLAYER.walkSpeed * 0.6;
        this.velocity.z += this._forward.z * PLAYER.walkSpeed * 0.6;
      }
      // Allow the boost to actually survive the air speed clamp.
      this.airCap = Math.hypot(this.velocity.x, this.velocity.z);
      this.airJumpFlash = 0.35;
    }
    return true;
  }

  setColliders(colliders) {
    this.colliders = colliders;
  }

  /**
   * The regions this player is allowed to occupy on foot.
   *
   * Set by the engine from the world's `walkRegions`: the tight wall sized to the
   * areas, plus one region per floating city deck. Null means "the wall only".
   * @param {Array<{x:number,z:number,radius:number}>|null} regions
   */
  setBounds(regions) {
    this.bounds = Array.isArray(regions) && regions.length ? regions : null;
  }

  setSupports(field) {
    this.supports = field;
  }

  /**
   * How high the floor is at (x, z): the terrain, or anything you can stand on
   * that is not above `maxTop`.
   *
   * `maxTop` applies to the TERRAIN as well as to the things built on it, and that
   * is load-bearing rather than tidy. The terrain used to win unconditionally, which
   * is invisible while every floor sits above it — a sky-city deck is higher than the
   * ground, so the deck won anyway. The Understory is the first place built BELOW the
   * terrain, and there the old rule meant its floor lost to a field 155 m overhead:
   * the player was snapped up to the surface every frame, so the chamber could not be
   * stood in at all. Standing underground, the ground above you is a ceiling.
   */
  floorAt(x, z, maxTop = Infinity) {
    const terrain = this.groundAt(x, z);
    if (!this.supports) return terrain;
    // `null` means the terrain is overhead, not underfoot.
    const ground = terrain <= maxTop ? terrain : null;
    const surface = this.supports.heightAt(x, z, maxTop);
    if (ground === null) return surface;
    return surface > ground ? surface : ground;
  }

  /**
   * What the player would land on at (x, z), including whether it is bouncy.
   *
   * `floorAt` answers "how high is the floor". This answers "and what is it",
   * which is what separates a mushroom cap from ordinary ground. The terrain is
   * never a bounce surface, so when the terrain wins the surface is null.
   *
   * @returns {{y:number, surface:object|null}}
   */
  floorSurfaceAt(x, z, maxTop = Infinity) {
    const terrain = this.groundAt(x, z);
    if (!this.supports) return { y: terrain, surface: null };
    const ground = terrain <= maxTop ? terrain : null;
    const { y, surface } = this.supports.heightAt(x, z, maxTop, true);
    if (ground === null) return { y, surface };
    return y > ground ? { y, surface } : { y: terrain, surface: null };
  }

  /**
   * Launch the player upward. Returns false if the surface is not bouncy.
   *
   * Mirrors `_tryJump` deliberately: an air-jump boost raises `airCap` so the
   * speed survives the airborne clamp, and `jumpsUsed` is reset so landing on a
   * cap also refreshes your jumps. That is what makes a glade of caps feel like
   * a place you climb rather than a trampoline you fight.
   *
   * The launch speed depends only on the *downward impact speed*, so it is
   * reproducible from a position trace alone -- which is what lets the server
   * re-run it to validate movement in Phase 2 instead of trusting the client.
   *
   * @param {object|null} surface  the surface descriptor that was landed on
   * @param {number} impactSpeed   downward speed at the moment of contact (m/s)
   * @returns {boolean} whether a bounce happened
   */
  bounceOff(surface, impactSpeed) {
    if (!isBounceImpact(surface, impactSpeed)) return false;

    const power = surface.power ?? 1;
    const speed = bounceSpeed(impactSpeed, power);

    this.velocity.y = speed;
    this.onGround = false;
    this.coyote = 0;
    // Landing on a cap refreshes your jumps rather than consuming one.
    this.jumpsUsed = 0;
    this.jumpBuffer = 0;

    // Horizontal throw. Each cap carries its own `dir`, so a glade launches you
    // in a different direction from every mushroom rather than only upward --
    // landing on one is a decision about where you end up, not just how high.
    //
    // The impulse is added to the player's existing momentum (scaled) rather than
    // replacing it, so a cap redirects a moving player instead of overriding them,
    // and the airborne steering limit still applies afterwards: you are thrown,
    // then you can steer.
    this.velocity.x *= BOUNCE.forwardBoost;
    this.velocity.z *= BOUNCE.forwardBoost;

    const dir = surface.dir;
    if (dir && (dir.x || dir.z)) {
      this.velocity.x += dir.x * BOUNCE.impulse;
      this.velocity.z += dir.z * BOUNCE.impulse;
    } else {
      // A cap with no direction still pushes you somewhere rather than straight
      // up, using whichever way you were already facing.
      this.velocity.x += this._forward.x * BOUNCE.impulse * 0.6;
      this.velocity.z += this._forward.z * BOUNCE.impulse * 0.6;
    }

    this.airCap = Math.hypot(this.velocity.x, this.velocity.z);
    this.airJumpFlash = 0.35;

    /** Draining these is how the caller plays the sound and the squash. */
    const event = {
      power,
      speed,
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      dirX: dir?.x ?? 0,
      dirZ: dir?.z ?? 0,
    };
    this.bounces.push(event);
    // Notified synchronously, so a listener sees every event regardless of when
    // the queue is drained.
    if (this.onBounce) {
      try {
        this.onBounce(event);
      } catch (err) {
        console.warn('[realm] bounce listener failed', err);
      }
    }
    return true;
  }

  /** Take the bounce events recorded since the last call. */
  takeBounces() {
    if (!this.bounces.length) return [];
    const out = this.bounces;
    this.bounces = [];
    return out;
  }

  get isLocked() {
    return this.controls.isLocked;
  }

  lock() {
    this.controls.lock();
  }

  /**
   * Push the player out of any collider they overlap, and off the world wall.
   *
   * @param {THREE.Vector3} pos
   * @param {Array<{x:number,z:number,radius:number}>} [bounds]
   *   The regions the player is allowed to occupy. **Inside ANY of them the wall
   *   does not apply.** Defaults to the single hard circle sized to the areas.
   *
   *   This being a LIST rather than one radius is the fix for a bug of mine: the
   *   floating cities sit outside that circle, so a visitor who flew to one and
   *   stepped off the carpet was instantly shoved back out past the wall — the deck
   *   they were standing on was not recognised as anywhere they could be. Declaring
   *   each deck as a region means the wall simply stops applying there.
   */
  resolveCollisions(pos, bounds = null) {
    const regions = bounds ?? this.bounds ?? [{ x: 0, z: 0, radius: WORLD.radius }];
    const pr = PLAYER.radius;
    // Two passes so that being wedged into a corner resolves cleanly.
    for (let pass = 0; pass < 2; pass++) {
      let moved = false;
      for (const c of this.colliders) {
        // A collider only blocks while you are BELOW its top. Without this you
        // could never stand on a rooftop or a gravestone -- the thing you are
        // standing on would keep shoving you sideways.
        //
        // A collider with NO top is an infinite wall, which is the safe default and
        // the right one for an area's fence. But it is also a trap: a collider that
        // simply never got its height measured becomes an invisible pillar to the
        // sky, which is what made the floating cities unreachable from the air. So
        // every collider that should have a height must be given one — see
        // `colliderTop` in world/index.js.
        if (Number.isFinite(c.top) && pos.y >= c.top - 0.06) continue;

        if (c.type === 'circle') {
          const dx = pos.x - c.x;
          const dz = pos.z - c.z;
          const rr = c.r + pr;
          const d2 = dx * dx + dz * dz;
          if (d2 < rr * rr) {
            const d = Math.sqrt(d2);
            if (d > 1e-6) {
              const push = (rr - d) / d;
              pos.x += dx * push;
              pos.z += dz * push;
            } else {
              // Dead-centre: shove along an arbitrary axis.
              pos.x += rr;
            }
            moved = true;
          }
        } else {
          const minX = c.minX - pr;
          const maxX = c.maxX + pr;
          const minZ = c.minZ - pr;
          const maxZ = c.maxZ + pr;
          if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
            // Eject along the shallowest penetration axis.
            const dl = pos.x - minX;
            const dr = maxX - pos.x;
            const dt = pos.z - minZ;
            const db = maxZ - pos.z;
            const m = Math.min(dl, dr, dt, db);
            if (m === dl) pos.x = minX;
            else if (m === dr) pos.x = maxX;
            else if (m === dt) pos.z = minZ;
            else pos.z = maxZ;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }

    // World boundary. The player must be inside AT LEAST ONE region; if they are
    // inside any, there is nothing to do. Otherwise they are pulled to the rim of
    // the region they are nearest to leaving, which makes the wall a boundary
    // rather than a shove.
    let inside = false;
    let outer = null;
    let bestGap = Infinity;
    for (const region of regions) {
      const dx = pos.x - region.x;
      const dz = pos.z - region.z;
      const d = Math.hypot(dx, dz);
      if (d <= region.radius) {
        inside = true;
        break;
      }
      const gap = d - region.radius;
      if (gap < bestGap) {
        bestGap = gap;
        outer = { dx, dz, d, radius: region.radius, x: region.x, z: region.z };
      }
    }
    if (!inside && outer && outer.d > 1e-6) {
      const k = outer.radius / outer.d;
      pos.x = outer.x + outer.dx * k;
      pos.z = outer.z + outer.dz * k;
    }
  }

  /**
   * Push the player's body into an eye position: eye height, head bob, idle breath.
   *
   * Results land in `this.eyes`, NOT on the camera. The camera is positioned by
   * `CameraDirector`, which decides where to sit for the active view — so this
   * computes where the head IS and leaves the viewing decision to the director. That
   * split is what makes a third-person view possible without it dragging the aim.
   *
   * Pulled out of `update` because there is more than one thing that moves a player: a
   * rider never runs the walking physics at all, but still needs a head.
   *
   * Safe to call at any time: it reads the current position and bob state and writes
   * one vector. It does not integrate anything.
   */
  syncCamera() {
    const scale = this.bobScale;
    const bob = Math.sin(this.bobPhase) * PLAYER.bobAmplitude * this.bobAmount * scale;
    const sway = Math.cos(this.bobPhase * 0.5) * PLAYER.bobAmplitude * 0.5 * this.bobAmount * scale;
    // A slow breathing sway when standing still, for a floaty, trippy feel.
    const idleBreath =
      Math.sin(performance.now() * 0.0009) * 0.02 * (1 - this.bobAmount) * scale;
    this.eyes.set(
      this.position.x + sway * 0.35,
      this.position.y + PLAYER.eyeHeight + bob + idleBreath,
      this.position.z,
    );
    return this.eyes;
  }

  update(dt) {
    const keys = this.keys;

    // --- desired direction, in world space, flattened to the ground plane
    this.camera.getWorldDirection(this._forward);
    this._forward.y = 0;
    if (this._forward.lengthSq() < 1e-8) this._forward.set(0, 0, -1);
    this._forward.normalize();
    this._right.crossVectors(this._forward, this._up).normalize();

    this._wish.set(0, 0, 0);
    if (keys.has('KeyW') || keys.has('ArrowUp')) this._wish.add(this._forward);
    if (keys.has('KeyS') || keys.has('ArrowDown')) this._wish.sub(this._forward);
    if (keys.has('KeyD') || keys.has('ArrowRight')) this._wish.add(this._right);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) this._wish.sub(this._right);

    // The on-screen stick adds to (and can fully replace) the keyboard.
    if (this.touchMove.y) this._wish.addScaledVector(this._forward, this.touchMove.y);
    if (this.touchMove.x) this._wish.addScaledVector(this._right, this.touchMove.x);

    const moving = this._wish.lengthSq() > 1e-6;
    // Normalising here keeps diagonal movement the same speed as straight, and
    // also stops a fully-deflected stick beating an already-normalised keyboard
    // vector. Analog magnitude below 1 is preserved for gentle stick pressure.
    const wishLength = Math.sqrt(this._wish.lengthSq());
    if (moving) this._wish.multiplyScalar(Math.min(1, wishLength) / wishLength);

    const maxSpeed = this.isSprinting ? PLAYER.sprintSpeed : PLAYER.walkSpeed;

    // --- horizontal motion.
    //
    // On the ground we approach the target velocity exponentially, which makes
    // the top speed exactly `maxSpeed` and is independent of frame rate. In the
    // air we only *add* steering force, so momentum carries -- releasing the
    // stick mid-jump should not stop you dead.
    if (this.onGround) {
      const targetX = this._wish.x * maxSpeed;
      const targetZ = this._wish.z * maxSpeed;
      const k = 1 - Math.exp(-PLAYER.groundResponse * dt);
      this.velocity.x += (targetX - this.velocity.x) * k;
      this.velocity.z += (targetZ - this.velocity.z) * k;
      // Kill tiny residual drift so the camera settles fully still.
      if (!moving && Math.hypot(this.velocity.x, this.velocity.z) < 0.05) {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    } else if (moving) {
      this.velocity.x += this._wish.x * PLAYER.airAcceleration * dt;
      this.velocity.z += this._wish.z * PLAYER.airAcceleration * dt;
    }

    // Root-dash: for its short life it sets the pace, on the ground or in the air.
    if (this._dashLeft > 0) {
      this.velocity.x = this._dashDir.x * LIFECYCLE.dashSpeed;
      this.velocity.z = this._dashDir.z * LIFECYCLE.dashSpeed;
      this._dashLeft = Math.max(0, this._dashLeft - dt);
    }

    // Speed ceiling. In the air this is looser than `maxSpeed`, otherwise the
    // air-jump momentum boost would be cancelled the instant it was applied.
    //
    // The floor on the airborne limit is `walkSpeed` rather than a fraction of it:
    // a sprint-jump leaves the ground at `sprintSpeed` and that momentum must
    // survive, or sprinting into a jump would be slower than not sprinting. That
    // is what makes "jump farther" true at speed rather than only in place.
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    const limit = this._dashLeft > 0
      ? LIFECYCLE.dashSpeed
      : this.onGround
        ? maxSpeed
        : Math.min(PLAYER.airSpeedLimit, Math.max(this.airCap, PLAYER.walkSpeed));
    if (speed > limit) {
      const k = limit / speed;
      this.velocity.x *= k;
      this.velocity.z *= k;
    }

    // --- jumping: unlimited mid-air jumps, edge-triggered and buffered
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.airJumpFlash = Math.max(0, this.airJumpFlash - dt);
    if (this.onGround) {
      // Touching down restores all three jumps and the normal speed ceiling.
      this.jumpsUsed = 0;
      this.coyote = PLAYER.coyoteTime;
      this.airCap = maxSpeed;
    } else {
      this.coyote = Math.max(0, this.coyote - dt);
    }
    if (this.jumpBuffer > 0 && this._tryJump()) {
      this.jumpBuffer = 0;
    }

    // --- vertical motion.
    //
    // Jump gravity is lighter than fall gravity, and it applies while rising and
    // to the arc of a jump. That is what makes a jump carry *far* rather than
    // merely launch you: hang time is 2v/g, so lowering g extends a jump much
    // more than raising the launch speed would, without the "rocket" feel. A fall
    // from a ledge still uses the heavier GRAVITY, so stepping off something drops
    // you promptly instead of floating.
    //
    // Above the soft ceiling both are a touch stronger, so drifting back down is
    // inevitable without feeling like a wall.
    const base = this.velocity.y > 0 || this.onGround ? PLAYER.jumpGravity : GRAVITY;
    const gravity = this.aboveCeiling ? base * 1.35 : base;
    this.velocity.y -= gravity * dt;

    // Glide (the spore stage): holding jump while falling caps the fall, so the
    // member drifts down and can steer across a gap.
    const jumpHeld = Boolean(this.keys?.has?.('Space') || this.touchJumpHeld);
    this.gliding = Boolean(this.powers.glide && jumpHeld && !this.onGround && this.velocity.y < 0);
    if (this.gliding) this.velocity.y = Math.max(this.velocity.y, -LIFECYCLE.glideFall);

    const prevX = this.position.x;
    const prevZ = this.position.z;
    // Remembered so the surface query can tell "landing on this" from "this is
    // over my head". See SupportField.heightAt.
    const prevY = this.position.y;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this.position.y += this.velocity.y * dt;

    this.resolveCollisions(this.position, this.bounds);

    // Capture the downward speed *before* the landing branch zeroes it: the
    // bounce is a function of how hard you hit the cap, so it has to be read
    // here rather than after.
    const impactSpeed = -this.velocity.y;

    const { y: ground, surface } = this.floorSurfaceAt(this.position.x, this.position.z, prevY + this.stepUp);
    if (this.position.y <= ground) {
      this.position.y = ground;
      if (this.velocity.y < 0) this.velocity.y = 0;
      this.onGround = true;
      // A bouncy cap immediately overrides the landing: it re-launches the
      // player and clears onGround, so the rest of this frame treats them as
      // airborne. Doing it here means one code path owns "what happened when I
      // touched the floor".
      this.bounceOff(surface, impactSpeed);
    } else {
      this.onGround = false;
    }

    // Safety net: if anything ever drops us out of the world, come back.
    if (this.position.y < this.respawnY) this.reset();

    // --- head bob
    const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    const speedFrac = Math.min(1, planarSpeed / PLAYER.walkSpeed);
    this.bobPhase += dt * PLAYER.bobFrequency * Math.max(0.35, speedFrac);
    this.bobAmount += (speedFrac - this.bobAmount) * Math.min(1, dt * 8);

    this.distanceWalked += Math.hypot(this.position.x - prevX, this.position.z - prevZ);

    // Where the camera goes is `syncCamera`'s business, and only its business —
    // the carpet rider calls the same method for a player who is not walking.
    this.syncCamera();
  }

  /** Where the audio mixer should measure distance from. */
  get listenerPosition() {
    return { x: this.position.x, z: this.position.z };
  }

  // ------------------------------------------------------------ touch input

  /**
   * Movement from the on-screen stick.
   * @param {number} x strafe, -1 (left) .. 1 (right)
   * @param {number} y forward, -1 (back) .. 1 (forward)
   */
  setTouchMove(x, y) {
    this.touchMove.x = x;
    this.touchMove.y = y;
  }

  /**
   * Drag-to-look, in radians.
   *
   * Forwards to the aim, which owns yaw and pitch. There is one yaw in the world, so
   * the mouse, a thumb on glass and the carpet's heading cannot disagree.
   */
  look(deltaYaw, deltaPitch) {
    if (this.aim?.nudge) {
      this.aim.nudge(deltaYaw, deltaPitch);
      return;
    }
    this._lookEuler.setFromQuaternion(this.camera.quaternion);
    this._lookEuler.y -= deltaYaw;
    this._lookEuler.x -= deltaPitch;
    this._lookEuler.x = Math.max(-PLAYER.maxPitch, Math.min(PLAYER.maxPitch, this._lookEuler.x));
    this.camera.quaternion.setFromEuler(this._lookEuler);
  }

  /** Flattened look direction, refreshed every update(). */
  get forwardXZ() {
    const f = this._forward;
    if (f.x === 0 && f.z === 0) return { x: 0, z: -1 };
    return { x: f.x, z: f.z };
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    this.controls.dispose();
  }
}

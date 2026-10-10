/**
 * The camera, and the thing that actually aims.
 *
 * ── Why aim and view are separated ──────────────────────────────────────────
 *
 * Until now "where you are looking" and "where the camera is" were the same object,
 * because there was only ever a first-person view. A third-person camera breaks that
 * identity, and the naive way to build one — move the camera back behind the player —
 * silently takes your aim with it: the carpet reads its heading from the camera, so
 * pulling the camera back would drag the heading round with it, and the crosshair
 * would no longer be what you are pointing at.
 *
 * So the AIM is its own object (`holder`), and the camera is only ever a position
 * plus a copy of that aim:
 *
 *     input (mouse drag / touch drag / PointerLockControls)
 *            └─> holder  (yaw + pitch — the single source of truth for looking)
 *                     ├─> the carpet's heading
 *                     ├─> where a mushroom is thrown
 *                     └─> the camera's rotation, whichever view is active
 *
 * Every view then only has to decide WHERE the camera sits; none of them can affect
 * where you are aiming. That is the whole reason this module exists.
 *
 * ── The three views ─────────────────────────────────────────────────────────
 *
 *   first     at the eyes. The realm's default, and the only one that is truly
 *             first-person — no rug in shot, no body to clip through.
 *   chase     behind and above, looking where you aim. The one to fly in: you can
 *             see the rug bank, and the horizon tells you which way is up.
 *   chaseFar  further back and higher, for looking at the world rather than
 *             steering through it.
 *
 * The chase views pull in against solid geometry — see `_desiredDistance` — because
 * a third-person camera that ends up inside a temple wall is worse than no
 * third-person camera at all.
 */
import * as THREE from 'three';

/** The views, in the order the toggle cycles them. */
export const CAMERA_MODES = ['first', 'chase', 'chaseFar'];

export const CAMERA_LABELS = {
  first: 'First person',
  chase: 'Chase',
  chaseFar: 'Wide chase',
};

/**
 * Where each chase view sits, as an offset in the aim's own frame.
 *
 * `back` is along the reversed look direction, `up` is added afterwards so raising
 * the camera does not tilt the view. Kept small enough that the rug stays in frame.
 */
const CHASE = {
  chase: { back: 7.5, up: 3.0, lookAhead: 6 },
  chaseFar: { back: 16, up: 7.0, lookAhead: 14 },
};

/**
 * How much wider the chase sits while riding something, per mount.
 *
 * The default is framed for walking: close enough to see the rug, low enough that a
 * doorway does not hide it. On a mount that is too tight — at carpet speed the ground
 * you are about to hit is off the top of the frame, and from inside a moving carriage
 * you can see neither the carriage nor the route. These are multipliers rather than
 * their own views, so V still chooses which view it is a wider version of.
 */
export const RIDING_CHASE = {
  carpet: { back: 1.9, up: 1.65, lookAhead: 1.6 },
  carriage: { back: 2.3, up: 1.2, lookAhead: 1.4 },
};

export class CameraDirector {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {{sens?: object, mode?: string}} [opts]
   */
  constructor(camera, { sens = null, mode = 'first' } = {}) {
    this.camera = camera;
    this.sens = sens;

    /**
     * The aim. A bare Object3D — it is never added to the scene, and exists only so
     * yaw/pitch have somewhere to live that is not the camera.
     */
    this.holder = new THREE.Object3D();
    this.holder.rotation.order = 'YXZ';
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this._forward = new THREE.Vector3(0, 0, -1);
    this._desired = new THREE.Vector3();
    this._focus = new THREE.Vector3();

    /** 'first' | 'chase' | 'chaseFar' */
    this.mode = CAMERA_MODES.includes(mode) ? mode : 'first';
    /**
     * Distance the camera ACTUALLY reached last frame, after being pulled in by
     * geometry. Kept so the pull-in eases out rather than snapping.
     */
    this._distance = 1;
    /**
     * Multipliers on the chase while riding, set per frame by the realm's loop:
     * `{ back, up, lookAhead }`, or null on foot. See `RIDING_CHASE`.
     */
    this.ridingScale = null;
    /** True when something is between the player and the camera, for the HUD. */
    this.obstructed = false;
    /** Set by `attachWorld`; used only to shorten the chase distance. */
    this.colliders = [];
  }

  /** The world's colliders, so a chase view can pull in against them. */
  attachWorld({ colliders = [] } = {}) {
    this.colliders = colliders;
  }

  /**
   * Adopt a yaw/pitch from the camera's own quaternion.
   *
   * Called by the engine once at startup, so the world opens looking the way the
   * camera was already pointing rather than snapping to yaw 0. After that the holder
   * is the authority and the camera is only ever written to, never read from — except
   * at the top of `update`, where an unlocked pointer or a mouse event may have moved
   * it while the director was not looking.
   */
  adoptFromCamera() {
    this._euler.setFromQuaternion(this.camera.quaternion);
    this.holder.rotation.set(this._euler.x, this._euler.y, 0, 'YXZ');
    this._clampPitch();
    return this;
  }

  get isFirstPerson() {
    return this.mode === 'first';
  }

  /** Cycle to the next view, and return its name. */
  cycle() {
    const i = CAMERA_MODES.indexOf(this.mode);
    this.mode = CAMERA_MODES[(i + 1) % CAMERA_MODES.length];
    return this.mode;
  }

  setMode(mode) {
    if (CAMERA_MODES.includes(mode)) this.mode = mode;
    return this.mode;
  }

  /** Yaw in radians, this world's convention: 0 faces -Z. */
  get yaw() {
    return this.holder.rotation.y;
  }

  /** Flattened aim direction, normalised. */
  get forwardXZ() {
    const f = this._forward.set(0, 0, -1).applyQuaternion(this.holder.quaternion);
    f.y = 0;
    const len = Math.hypot(f.x, f.z);
    if (len < 1e-6) return { x: 0, z: -1 };
    return { x: f.x / len, z: f.z / len };
  }

  /** Full aim direction, including pitch. Used to throw mushrooms. */
  aimDirection(out = new THREE.Vector3()) {
    return out.set(0, 0, -1).applyQuaternion(this.holder.quaternion);
  }

  /**
   * Adopt a yaw/pitch from an external source, with THIS director's sensitivity.
   *
   * Drag-to-look arrives as raw pixel deltas from the touch layer, so the sensitivity
   * and the invert preference are applied here — once, for both input paths — rather
   * than in the touch handler, so a slider in the settings panel changes the feel of
   * the mouse and the thumb together.
   *
   * @param {number} dxPixels
   * @param {number} dyPixels
   * @param {{base?:number}} [opts] `base` overrides the setting, for tests
   */
  drag(dxPixels, dyPixels, { base = null } = {}) {
    const sensitivity = base ?? this.sens?.lookSensitivity ?? 0.0032;
    const invert = this.sens?.invertY ?? false;
    this.holder.rotation.y -= dxPixels * sensitivity;
    this.holder.rotation.x -= (invert ? -dyPixels : dyPixels) * sensitivity;
    this._clampPitch();
  }

  /**
   * Nudge the aim by RADIANS.
   *
   * The unit the touch layer works in, and what `Player.look` forwards. Sensitivity
   * is applied by the touch handler's own gain, not here, because a radian is already
   * a physical quantity.
   *
   * @param {number} dYaw
   * @param {number} dPitch
   */
  nudge(dYaw, dPitch) {
    this.holder.rotation.y -= dYaw;
    this.holder.rotation.x -= dPitch;
    this._clampPitch();
    this._authoritative = true;
    this._applyAimToCamera();
  }

  /**
   * Point the aim at a yaw/pitch directly, in radians.
   *
   * Also WRITES THE CAMERA immediately, and that is not a nicety. The holder is the
   * authority, but anything that reads the camera before the next frame — the walking
   * physics reads `camera.getWorldDirection`, and `stepForTest` steps the player
   * without stepping the director — would otherwise act on the previous frame's
   * direction. That is a real bug, not just a test annoyance: it made the first stride
   * after a teleport or a fast-travel go in the old direction.
   */
  aimAt({ yaw, pitch } = {}) {
    if (Number.isFinite(yaw)) this.holder.rotation.y = yaw;
    if (Number.isFinite(pitch)) this.holder.rotation.x = pitch;
    this._clampPitch();
    /**
     * An explicit aim SUSPENDS the per-frame adoption of the camera's euler.
     *
     * Without this, `aimAt` is immediately undone: the camera still holds the yaw the
     * director last wrote to it, adoption copies that back over the holder on the next
     * `update`, and the aim snaps to whatever it was. The suspension is cleared by the
     * next `update`, so the mouse takes over again as soon as it moves.
     */
    this._authoritative = true;
    this._applyAimToCamera();
  }

  /** Write the aim onto the camera, so a read before the next frame is correct. */
  _applyAimToCamera() {
    this.camera.quaternion.copy(this.holder.quaternion);
    this.camera.updateMatrixWorld(true);
  }

  /** Turn to face a point on the ground plane. */
  faceTowards(from, x, z) {
    const dx = x - from.x;
    const dz = z - from.z;
    if (dx * dx + dz * dz < 1e-6) return;
    this.holder.rotation.y = Math.atan2(-dx, -dz);
    this.holder.rotation.x = 0;
    // Same reason as `aimAt`: the walking physics reads the CAMERA, so it has to be
    // correct before the next frame rather than after it.
    this._authoritative = true;
    this._applyAimToCamera();
  }

  _clampPitch() {
    const max = this.sens?.maxPitch ?? Math.PI / 2 - 0.02;
    this.holder.rotation.x = Math.max(-max, Math.min(max, this.holder.rotation.x));
  }

  /**
   * How far back the camera can sit before it would be inside something.
   *
   * Walked along the sight line rather than ray-cast against the scene: the world's
   * colliders are a flat list of circles and boxes with a known top, which is cheap to
   * test directly and needs no physics library. The first blocked sample wins, so the
   * camera stops just short of the wall it found.
   *
   * @param {THREE.Vector3} from   the focus point (the player's head)
   * @param {number} wanted        the ideal distance
   * @param {THREE.Vector3} dir    unit direction from the focus toward the camera
   * @returns {number} a distance at or below `wanted`
   */
  _desiredDistance(from, wanted, dir) {
    if (!this.colliders.length) return wanted;
    const STEP = 0.8;
    let clear = wanted;
    for (let d = STEP; d <= wanted; d += STEP) {
      const x = from.x + dir.x * d;
      const y = from.y + dir.y * d;
      const z = from.z + dir.z * d;
      if (this._blocked(x, y, z, 0.5)) {
        clear = Math.max(0.6, d - STEP);
        this.obstructed = true;
        return clear;
      }
    }
    return clear;
  }

  /** Is this point inside any collider? */
  _blocked(x, y, z, pad) {
    for (const c of this.colliders) {
      // A collider only exists below its top, exactly as for the player.
      if (Number.isFinite(c.top) && y > c.top) continue;
      if (c.type === 'circle') {
        const dx = x - c.x;
        const dz = z - c.z;
        const rr = c.r + pad;
        if (dx * dx + dz * dz < rr * rr) return true;
      } else {
        if (
          x > c.minX - pad && x < c.maxX + pad &&
          z > c.minZ - pad && z < c.maxZ + pad
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Place the camera for this frame.
   *
   * @param {{x:number,y:number,z:number}} eyes  where the head is
   * @param {number} dt
   * @param {{instant?:boolean}} [opts]
   */
  update(eyes, dt = 0, { instant = false } = {}) {
    this.obstructed = false;

    /**
     * Take any yaw/pitch that arrived by a route that does not go through `drag` or
     * `nudge` — PointerLockControls writes the camera's quaternion directly on a mouse
     * move, and it has no idea a separate aim exists. Adopting its euler at the top of
     * the frame is what lets the mouse keep working unchanged while everything else
     * reads the holder.
     *
     * Only the yaw and pitch are taken; roll is discarded, because a camera that has
     * been tilted would otherwise bank the world.
     */
    if (this.followControls && !this._authoritative) {
      this._euler.setFromQuaternion(this.camera.quaternion);
      this.holder.rotation.set(this._euler.x, this._euler.y, 0, 'YXZ');
      this._clampPitch();
    }
    // An explicit aim lasts exactly one frame; after that the mouse is in charge again.
    this._authoritative = false;

    if (this.mode === 'first') {
      // The camera IS the head. `eyes` already carries the head bob and eye height,
      // so nothing is added here.
      this.camera.position.set(eyes.x, eyes.y, eyes.z);
      this.camera.quaternion.copy(this.holder.quaternion);
      this._distance = 1;
      return;
    }

    // Riding widens whichever view is selected. `ridingScale` is set by the frame loop,
    // which is the only thing that knows what the player is standing on.
    const base = CHASE[this.mode] ?? CHASE.chase;
    const scale = this.ridingScale;
    const spec = scale
      ? {
          back: base.back * scale.back,
          up: base.up * scale.up,
          lookAhead: base.lookAhead * (scale.lookAhead ?? 1),
        }
      : base;
    // The sight line runs backwards along the aim and upwards, so the camera looks
    // down the same direction the player is aiming.
    const back = this._forward.set(0, 0, 1).applyQuaternion(this.holder.quaternion);
    back.y = 0;
    const len = Math.hypot(back.x, back.z) || 1;
    back.x /= len;
    back.z /= len;

    this._focus.set(eyes.x, eyes.y, eyes.z);
    // The direction from the focus toward where the camera would like to be.
    const toCam = new THREE.Vector3(back.x, 0, back.z).multiplyScalar(spec.back);
    toCam.y = spec.up;
    const wanted = toCam.length();
    toCam.normalize();

    const target = this._desiredDistance(this._focus, wanted, toCam);
    // Ease the pull-in out, snap it in. Being yanked forward through a wall is fine;
    // easing back out of one avoids a visible pop.
    if (instant) this._distance = target;
    else if (target < this._distance) this._distance = target;
    else this._distance += (target - this._distance) * Math.min(1, dt * 4);

    this._desired.copy(this._focus).addScaledVector(toCam, this._distance);
    this.camera.position.copy(this._desired);
    this.camera.quaternion.copy(this.holder.quaternion);
  }

  /**
   * The point the aim should converge on, for the chase views.
   *
   * Only used to keep the rug visually centred; the camera's rotation is the aim
   * itself, so nothing here affects where a shot goes.
   */
  focusPoint(eyes, out = new THREE.Vector3()) {
    if (this.mode === 'first') return out.set(eyes.x, eyes.y, eyes.z);
    const spec = CHASE[this.mode] ?? CHASE.chase;
    const f = this.aimDirection(this._forward);
    return out.set(
      eyes.x + f.x * spec.lookAhead,
      eyes.y + f.y * spec.lookAhead + spec.up * 0.4,
      eyes.z + f.z * spec.lookAhead,
    );
  }
}

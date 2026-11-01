/**
 * The camera for the tour: a small rig that flies between named stops.
 *
 * ── Why this is a separate thing and not a CameraDirector mode ────────────────
 *
 * `camera-director.js` is built around a body: every frame it places the camera
 * relative to the player's `eyes`, and its whole first/chase/chaseFar design
 * exists to answer "where is the camera relative to the person walking". A tour
 * has no person. It has a sequence of shots and a scroll position.
 *
 * Rather than teach the director about visitors — which would mean a second
 * input model, a second notion of "where am I", inside a module that is only
 * tested as a walker — this module simply OWNS the camera while the world is in
 * tour mode, and the director is not constructed at all. One writer to
 * `camera.position`, always.
 *
 * ── A stop is a shot, not a position ─────────────────────────────────────────
 *
 *     { target, distance, yaw, pitch, fov }
 *
 * The camera stands `distance` from `target`, at `yaw`/`pitch` around it, and
 * looks at it. Interpolating those five numbers, instead of a position and a
 * quaternion, buys three things:
 *
 *   • the move is an ARC around the place you are flying to, not a straight
 *     line through whatever stands between — a straight line between two points
 *     in a world with terrain and buildings cuts the corner through them.
 *   • `fov` does the zooming. Flying closer at a fixed fov reads as a dolly;
 *     narrowing the fov while moving reads as a zoom, which is the "arriving
 *     somewhere" feeling this whole feature is for.
 *   • `lookAt` can never roll the horizon. Independent position/quaternion
 *     interpolation can, and a banked horizon looks like a bug.
 *
 * Prototype note: the stops themselves live in `engine/shots.js`, shared with
 * the page and the navigation. This module knows nothing about which places
 * exist in the world — only how to fly between numbers.
 */
import gsap from 'gsap';

/**
 * The yaw closest to `from` that lands on `to`.
 *
 * Without this, going from yaw 0.2 to yaw 6.0 tweens the long way round — the
 * camera swings the world almost a full turn to end up 0.08 radians to the
 * right. Radians are circular; only the difference may be interpolated.
 */
function nearestYaw(from, to) {
  const TAU = Math.PI * 2;
  let d = (to - from) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return from + d;
}

/**
 * Place the camera from a shot's own numbers, plus any idle drift.
 *
 * ── Why the aim is three flat numbers, not a Vector3 ────────────────────────
 *
 * This rig used to hold `target: {x, y, z}` and tween it with a nested path,
 * `'target.x'`. GSAP silently declined to move it, so `distance` and `yaw`
 * changed while the aim stayed pinned at the world origin: the camera flew to
 * thirty metres from the CENTRE of the sky and stared at empty space, with the
 * district it was supposed to be showing sitting a couple of hundred metres
 * away, tiny. Nothing threw. It just quietly framed nothing.
 *
 * Flat scalars cannot do that: `tx` is a number on the tweened object or it is
 * a typo, and a typo shows up immediately as a camera in the wrong place.
 */
function placeCamera(camera, rig, drift) {
  const yaw = rig.yaw + drift.yaw;
  const pitch = rig.pitch + drift.pitch;
  const cosP = Math.cos(pitch);
  camera.position.set(
    rig.tx + Math.sin(yaw) * cosP * rig.distance,
    rig.ty + Math.sin(pitch) * rig.distance,
    rig.tz + Math.cos(yaw) * cosP * rig.distance,
  );
  camera.lookAt(rig.tx, rig.ty, rig.tz);
  // Only touch the projection when the fov actually moved: rebuilding the
  // projection matrix every frame is wasted work and can shimmer.
  if (Math.abs(camera.fov - rig.fov) > 0.01) {
    camera.fov = rig.fov;
    camera.updateProjectionMatrix();
  }
}

/**
 * @param {object} opts
 * @param {import('three').PerspectiveCamera} opts.camera
 * @param {Array<{id:string,title:string,target:{x:number,y:number,z:number},distance:number,yaw:number,pitch:number,fov:number}>} opts.stops
 * @param {(stop: {id:string,title:string}) => void} [opts.onStop]
 */
export function createTour({ camera, stops = [], onStop = () => {} }) {
  const STOPS = stops;
  if (!STOPS.length) throw new Error('[tour] no stops — pass shots built from engine/shots.js');

  /** The live numbers. Only this object is ever tweened. */
  const rig = {
    tx: STOPS[0].target.x,
    ty: STOPS[0].target.y,
    tz: STOPS[0].target.z,
    distance: STOPS[0].distance,
    yaw: STOPS[0].yaw,
    pitch: STOPS[0].pitch,
    fov: STOPS[0].fov,
  };

  let tween = null;
  let current = STOPS[0].id;
  /** Idle drift is suspended during a move and eased back afterwards. */
  let driftAmount = 1;
  const drift = { yaw: 0, pitch: 0 };

  const byId = (id) => STOPS.find((s) => s.id === id) || STOPS[0];

  /**
   * Fly to a stop.
   *
   * @param {string} id
   * @param {{duration?: number, immediate?: boolean}} [opts]
   */
  function goTo(id, { duration = 2.2, immediate = false } = {}) {
    const stop = byId(id);
    current = stop.id;
    const yaw = nearestYaw(rig.yaw, stop.yaw);

    tween?.kill();
    tween = null;

    if (immediate) {
      rig.tx = stop.target.x;
      rig.ty = stop.target.y;
      rig.tz = stop.target.z;
      rig.distance = stop.distance;
      rig.yaw = yaw;
      rig.pitch = stop.pitch;
      rig.fov = stop.fov;
      onStop(stop);
      return stop;
    }

    tween = gsap.to(rig, {
      tx: stop.target.x,
      ty: stop.target.y,
      tz: stop.target.z,
      distance: stop.distance,
      yaw,
      pitch: stop.pitch,
      fov: stop.fov,
      duration,
      ease: 'power2.inOut',
      // A second click mid-flight must take over, not queue up behind the first.
      overwrite: true,
      onComplete: () => {
        tween = null;
        onStop(stop);
      },
    });
    return stop;
  }

  /** Move one stop along, in the order they are listed. */
  function step(delta) {
    const i = STOPS.findIndex((s) => s.id === current);
    const next = STOPS[(i + delta + STOPS.length) % STOPS.length];
    return goTo(next.id);
  }

  /**
   * Per-frame. Writes the camera and nothing else.
   *
   * `t` is the world's own elapsed time, so the drift is continuous across
   * stops — the world never looks like it froze while the camera moved.
   */
  function update(dt, t) {
    // Suspend drift while flying, ease it back in afterwards, so a slow move
    // is not wobbling and a settled shot still breathes.
    const wanted = tween ? 0 : 1;
    driftAmount += (wanted - driftAmount) * Math.min(1, dt * 2.5);
    drift.yaw = Math.sin(t * 0.11) * 0.022 * driftAmount;
    drift.pitch = Math.sin(t * 0.07 + 1.7) * 0.012 * driftAmount;
    placeCamera(camera, rig, drift);
  }

  /** Start on the first shot without animating into it. */
  goTo(STOPS[0].id, { immediate: true });

  return {
    STOPS,
    goTo,
    next: () => step(1),
    prev: () => step(-1),
    update,
    get current() {
      return current;
    },
    dispose() {
      tween?.kill();
      tween = null;
    },
  };
}

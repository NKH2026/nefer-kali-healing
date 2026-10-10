/**
 * Flying-mount physics — pure, deterministic and testable.
 *
 * The carpet is deliberately *not* a second copy of `Player`. It has no ground,
 * no colliders, no step-up and no bounce surfaces: it is a hovercraft you steer.
 * Written as a pure function over a plain state object for exactly the reason
 * `bounceSpeed` in player.js is pure — so the whole thing can be checked in Node
 * with no DOM, and so a future network layer can reproduce a flight from a
 * position trace without trusting the client.
 *
 * The one idea that makes it feel like a carpet rather than an aeroplane: the
 * mount has a HOVER BAND. Neutral vertical input holds a stable altitude, and
 * the control that returns it there is a spring, not gravity. There is therefore
 * no stall, no dive you cannot pull out of, and a player who lets go of
 * everything ends up parked in the air rather than falling out of the sky. That
 * is the difference between a vehicle and a punishment.
 *
 * Motion is in a frame relative to `heading`, so steering is one number:
 *
 *        +forward (W)
 *            ^
 *            |
 *   +strafe |------> +right
 *   (D)
 *
 * `heading` is a Y rotation in radians; heading 0 faces -Z, matching the
 * convention `Math.atan2(-dx, -dz)` uses in player.js so pitch/yaw and the
 * camera agree on which way is forward.
 */
import { FLIGHT, WORLD } from './config.js';

/**
 * A fresh, parked mount state.
 *
 * ── Why the vertical axis is an absolute TARGET ALTITUDE ────────────────────
 *
 * `y` is the altitude the mount is trying to hold. It is absolute, not an offset
 * from the ground, and that is the whole design.
 *
 * The obvious alternative — keep a `hover` offset above the local floor and
 * spring it back to zero — cannot work, and the way it fails is worth recording
 * because it is not obvious. If the anchor is re-derived from the current floor
 * while the mount is climbing, the climb is applied and then immediately
 * re-absorbed by the anchor, so the mount never gains altitude at all: the
 * spring has nothing to correct and the whole thing sits perfectly still. The
 * first version of this file did exactly that, and both the browser suite and the
 * probe above it reported a carpet that refused to leave the ground.
 *
 * An absolute target has no such coupling. Climbing moves `y`; releasing leaves
 * `y` alone, so you stay where you are; descending moves it back down. The floor
 * enters only as a LIMIT (`minY`/`maxY`, supplied by the caller which is the only
 * thing that can query the world), never as the thing being tracked.
 *
 * @param {number} [heading] Y rotation in radians
 * @param {number} [y]       starting altitude, metres
 * @returns {{heading:number, bank:number, pitch:number, speed:number, verticalSpeed:number, strafe:number, y:number, yawRate:number}}
 */
export function createFlightState(heading = 0, y = 0) {
  return {
    heading,
    /** Roll, radians. Cosmetic — it is what makes a turn look like a turn. */
    bank: 0,
    /** Nose pitch, radians. Cosmetic, and driven by climb/dive. */
    pitch: 0,
    /** Signed forward speed, m/s. Negative means flying backward. */
    speed: 0,
    /** Signed vertical speed, m/s. */
    verticalSpeed: 0,
    /** Signed sideways speed, m/s. Used by the auto-level spring. */
    strafe: 0,
    /** The altitude this mount is holding. Absolute, and the source of truth. */
    y,
    /**
     * How fast the heading is currently changing, rad/s. Not integrated here —
     * steering happens where the yaw target lives (the rider's camera) — but it
     * is *recorded* here because bank must follow the turn, not the strafe axis.
     * A carpet that rolls when you sidestep looks broken; one that rolls into a
     * turn looks flown.
     */
    yawRate: 0,
  };
}

/**
 * How far a mount state currently sits above a given floor.
 *
 * Derived, never stored. The state holds an absolute target altitude, and this is
 * the read-only view of it for a caller that can query a floor — a HUD readout, or
 * a landing check. Keeping it derived is the point: there is no second copy of the
 * altitude that could fall out of step with the first, which is exactly the bug
 * the absolute-target rewrite exists to make impossible.
 *
 * @param {object} state
 * @param {number} floorY
 * @returns {number}
 */
export function hoverAbove(state, floorY) {
  return state.y - floorY;
}

/**
 * Normalise an input record.
 *
 * Every field is clamped rather than trusted: this is the seam a network layer
 * will eventually fill from a packet, and an out-of-range axis must not be able
 * to throw the physics into a state nothing can recover from.
 *
 * @param {object} [input]
 * @returns {{forward:number,strafe:number,vertical:number,sprint:boolean}}
 */
export function normaliseInput(input = {}) {
  const clamp = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return n < -1 ? -1 : n > 1 ? 1 : n;
  };
  return {
    forward: clamp(input.forward),
    strafe: clamp(input.strafe),
    vertical: clamp(input.vertical),
    sprint: input.sprint === true,
    yawRate: Number.isFinite(Number(input.yawRate)) ? Number(input.yawRate) : 0,
  };
}

/**
 * Advance the mount by one step.
 *
 * @param {object} state   a state from `createFlightState` (mutated in place)
 * @param {object} input   {forward, strafe, vertical, sprint}
 * @param {number} dt      seconds
 * @param {object} [cfg]   FLIGHT-shaped tuning, for tests and future variants
 * @param {{minY?:number, maxY?:number}} [limits]  the flyable band. Supplied by
 *   the caller because it is the only thing that can query the world for a floor
 *   and knows the realm's ceiling. Omit them and the mount is unbounded, which is
 *   what the pure tests want.
 * @returns {object} the same state object
 */
export function stepFlight(state, input, dt, cfg = FLIGHT, limits = {}) {
  const step = Number(dt);
  if (!Number.isFinite(step) || step <= 0) return state;
  // A backgrounded tab can hand back a huge delta. Clamp rather than sub-step:
  // the caller already clamps to 0.05 s, and anything beyond this is a bug.
  const h = Math.min(step, 0.1);
  const { forward, strafe, vertical, sprint, yawRate } = normaliseInput(input);

  // ---- horizontal --------------------------------------------------------
  const topSpeed = sprint ? cfg.sprintSpeed : cfg.cruiseSpeed;
  const target = forward >= 0 ? forward * topSpeed : forward * cfg.reverseSpeed;
  const rate = Math.abs(target) > Math.abs(state.speed) ? cfg.throttle : cfg.brake;
  state.speed += (target - state.speed) * (1 - Math.exp(-rate * h));
  if (state.speed > cfg.sprintSpeed) state.speed = cfg.sprintSpeed;
  if (state.speed < -cfg.reverseSpeed) state.speed = -cfg.reverseSpeed;
  // Settle to a true stop, so a parked carpet is genuinely still.
  if (target === 0 && Math.abs(state.speed) < 0.05) state.speed = 0;

  const targetStrafe = strafe * cfg.axialSpeed;
  state.strafe += (targetStrafe - state.strafe) * (1 - Math.exp(-cfg.axialResponse * h));
  if (targetStrafe === 0 && Math.abs(state.strafe) < 0.05) state.strafe = 0;

  // ---- vertical: the hover band -----------------------------------------
  //
  // Held input drives vertical speed toward the configured climb/dive rate; with
  // no input the speed is sprung back to zero. Either way the TARGET ALTITUDE is
  // what accumulates, so a climb is kept and a release holds it.
  //
  // The spring is on the SPEED rather than on an offset, which matters: a spring
  // on a position is what the first version did, and it meant letting go produced
  // a slow oscillation around the anchor for several seconds. On the speed it is
  // a first-order lag — the mount eases up to the climb rate, eases back to a
  // hover, and is genuinely still.
  const wanted = vertical * cfg.climbSpeed;
  state.verticalSpeed += (wanted - state.verticalSpeed) * (1 - Math.exp(-cfg.climbResponse * h));
  if (wanted === 0 && Math.abs(state.verticalSpeed) < 0.05) state.verticalSpeed = 0;
  state.y += state.verticalSpeed * h;

  // ---- the band ----------------------------------------------------------
  const minY = Number.isFinite(limits.minY) ? limits.minY : -Infinity;
  const maxY = Number.isFinite(limits.maxY) ? limits.maxY : Infinity;
  if (state.y > maxY) {
    state.y = maxY;
    if (state.verticalSpeed > 0) state.verticalSpeed = 0;
  } else if (state.y < minY) {
    state.y = minY;
    if (state.verticalSpeed < 0) state.verticalSpeed = 0;
  }

  // ---- attitude ---------------------------------------------------------
  //
  // Bank tracks the *turn rate*, not the strafe axis: rolling into a turn is
  // what reads as an aircraft. Normalised against the configured yaw ceiling so
  // a gentle course correction rolls a little and a hard turn rolls a lot.
  state.yawRate = yawRate;
  const bankTarget = Math.max(-1, Math.min(1, yawRate / cfg.yawRate)) * cfg.maxBank;
  state.bank += (bankTarget - state.bank) * (1 - Math.exp(-cfg.bankResponse * h));
  // Pitch follows vertical speed, so a climb noses up and a dive noses down.
  const vy = state.verticalSpeed;
  const pitchTarget = Math.max(-cfg.maxPitch, Math.min(cfg.maxPitch, vy * cfg.pitchPerClimb));
  state.pitch += (pitchTarget - state.pitch) * (1 - Math.exp(-cfg.pitchResponse * h));

  return state;
}

/**
 * Could the rider step off HERE, right now?
 *
 * The full envelope: a floor within reach AND the mount under control. Reports
 * whether stepping off is safe; it does not block flying lower, and it does not
 * itself move anybody. `dismountHeight` is what decides where a rider ends up,
 * and it applies the reach rule alone — speed is a comfort matter, reach is a
 * safety one, and they are deliberately not the same check.
 *
 * @param {object} state          flight state
 * @param {number} altitude       the keel's world height, metres
 * @param {number} floorY         the highest walkable surface directly below (or -Infinity)
 * @param {object} [cfg]
 * @returns {boolean}
 */
export function canLand(state, altitude, floorY, cfg = FLIGHT) {
  if (!Number.isFinite(floorY)) return false;
  // The gap must be within stepping reach, and the mount must not be racing.
  return (
    altitude - floorY <= cfg.landReach &&
    Math.abs(state.verticalSpeed) <= cfg.landMaxVerticalSpeed &&
    Math.abs(state.speed) <= cfg.landMaxSpeed
  );
}

/**
 * Where a dismounting rider should be put.
 *
 * Always answers with a usable position, and the safety rule is absolute: a
 * rider is only ever moved DOWN to a floor that is within stepping reach. A
 * mountain four metres below the keel is a step off; the ground 300 m below is
 * not, and the difference matters, because the naive version of this function —
 * "if there is a floor below you, stand on it" — turns a careless dismount over
 * a floating city into a three-hundred-metre fall from the sky.
 *
 * So anything further than `FLIGHT.landReach` below is ignored, and the rider is
 * left on the carpet's own keel. `grounded: false` is the caller's signal that
 * they should be told why.
 *
 * @param {number} altitude  keel height
 * @param {number} floorY    highest walkable surface below, or -Infinity
 * @param {object} [cfg]
 * @returns {{y:number, grounded:boolean}}
 */
export function dismountHeight(altitude, floorY, cfg = FLIGHT) {
  if (
    Number.isFinite(floorY) &&
    floorY <= altitude + 1e-6 &&
    altitude - floorY <= cfg.landReach
  ) {
    return { y: floorY, grounded: true };
  }
  return { y: altitude, grounded: false };
}

/**
 * The world-space velocity the rider inherits on dismount.
 *
 * Handing over the mount's momentum is what stops stepping off a moving carpet
 * from feeling like hitting a wall.
 *
 * @param {object} state
 * @returns {{x:number,y:number,z:number}}
 */
export function dismountVelocity(state) {
  const cos = Math.cos(state.heading);
  const sin = Math.sin(state.heading);
  return {
    x: -sin * state.speed + cos * state.strafe,
    y: state.verticalSpeed,
    z: -cos * state.speed - sin * state.strafe,
  };
}

/**
 * Keep a flying mount inside the world.
 *
 * The walking boundary is a hard circular wall, which is right on foot and
 * wrong in the air: a carpet that cannot leave a 360 m disc is a fairground
 * ride, and the sky cities sit outside it. Flying is therefore bounded by a
 * much wider cylinder, and the hard wall is restored the moment the rider
 * steps off.
 *
 * `y` is NOT clamped here. The soft ceiling belongs to `Player` and is applied
 * to the *rider*, so a mount cannot smuggle someone past it.
 *
 * @param {{x:number,y:number,z:number}} p  mutated in place
 * @param {number} [factor]  multiplier on WORLD.radius, for tests
 */
export function clampToAirspace(p, factor = FLIGHT.airspaceFactor, radius = WORLD.radius) {
  const limit = radius * factor;
  const r = Math.hypot(p.x, p.z);
  if (r > limit && r > 1e-6) {
    const k = limit / r;
    p.x *= k;
    p.z *= k;
  }
  return p;
}

/**
 * How high a mount may be flown, given the world's own ceiling.
 *
 * Read from PLAYER.softCeiling so the two can never disagree: the airspace tops
 * out exactly where the realm already stops rewarding altitude, which keeps
 * "why can't I go higher" a single answer rather than two.
 */
export function airspaceCeiling(playerConfig) {
  const ceiling = playerConfig?.softCeiling;
  return Number.isFinite(ceiling) ? ceiling : Infinity;
}

/**
 * The Realm — all tuning lives here.
 *
 * Reading order, since this file is now long:
 *
 *   LEYLINE / LEY_STATIONS / UNDERSTORY   the transit system and the place it digs to
 *   WORLD                                 the world's size, fog and void
 *   PLAYER                                walking and jumping
 *   CARPET / FLIGHT                       the flying mount
 *   PROJECTILE                            mushroom shot
 *   BOUNCE                                the mycelium wood's bouncy caps
 *   TRAVEL / VOLUME / AUDIO / QUALITY     the mixer and the dials
 *   SENSORY / TOUCH / LAYOUT              comfort and input
 *   ZONES + configureWorld()              the areas, installed from the server
 *
 * The one rule that matters: content a non-engineer should be able to edit lives in
 * `server/content/realm/world.json`, and tuning about how the world *feels* lives
 * here. The long explanation of the area radii and the silence band is on the header
 * below, next to the code it describes.
 */
/**
 * The Ley Line: the realm's transit system.
 *
 * A single glowing track that runs the whole world — through the ground, up into the
 * sky to both floating cities, and down a descent shaft to the Understory beneath the
 * earth. One carriage travels it on a loop and stops at every station.
 *
 * ── Why a loop rather than point-to-point ───────────────────────────────────
 *
 * A taxi that flies you wherever you ask is easier to build and much worse to
 * believe. A train that is always somewhere on a visible line, that you can watch
 * arrive, and that stops where it stops, is a PLACE rather than a menu — and the
 * lines become part of the landscape, which is most of the point of building them.
 *
 * ── Station-plus-call ──────────────────────────────────────────────────────
 *
 * You board at a station platform. You can also CALL the carriage from a platform,
 * and it will hurry to you rather than leaving you standing: `callBoost` scales its
 * speed while it has a pending call, so the worst wait is a few seconds even from the
 * far side of the loop. The hurry is visible — it is the same carriage on the same
 * line, just moving — which keeps the magic without the dead time.
 *
 * `LYNE` not `LINE` in the ids, deliberately: "line" collides with too much else.
 */
export const LEYLINE = {
  /** The carriage's cruising speed along the track, m/s. */
  speed: 46,
  /**
   * Speed multiplier while hurrying to answer a call.
   *
   * The loop is ~2.5 km, so at cruise a call from the far side would be a fifty-second
   * wait — a timetable, which is exactly what station-plus-call exists to avoid. The
   * boost is set so the worst case is about six seconds, and the common case (a
   * quarter of the loop) about three. It is still the same carriage on the same line,
   * just moving, which is what keeps the arrival worth watching.
   */
  callBoost: 4.8,
  /**
   * The longest a visitor should ever wait after calling, seconds.
   *
   * `callBoost` alone leaves a bad worst case: call just as the carriage pulls out and
   * it has to run the whole 2.5 km loop, which is eleven seconds of standing on a
   * platform. So the hurry scales with how far away it is — a near call uses the
   * ordinary boost, a far one rushes harder — and this is the bound that scaling aims
   * at. It is still the same carriage on the same line, just moving, which is what
   * keeps the arrival worth watching.
   */
  callMaxSeconds: 5.5,
  /** Seconds the carriage waits at a station once it has arrived. */
  dwellSeconds: 6,
  /** How close (m) you must be to a station platform for the call prompt. */
  platformRadius: 13,
  /** How close (m) you must be to the carriage to step aboard. */
  boardRadius: 5.5,
  /** How high above a station's floor the track runs, so the carriage is level with you. */
  deckOffset: 1.1,
  /** Radius of the glowing rail, metres. */
  railRadius: 0.55,
  /** Curve smoothness: how many samples the spline is cut into per segment. */
  curveSegments: 26,
  /** How far above/below a straight line the track bows, so it does not clip through hills. */
  bowHeight: 0.18,
  /** Seconds of cooldown after boarding or leaving, so one press cannot thrash. */
  cooldown: 0.6,
  /** Carriage dimensions. */
  carriage: { length: 7.5, width: 3.2, height: 2.6 },
  colors: {
    rail: 0x7ffff0,
    railGlow: 0x3ce0ff,
    hull: 0x1b2450,
    hullLit: 0x2c3a72,
    trim: 0xffce5c,
    window: 0x9ffcf0,
  },
};

/**
 * Where the Ley Line stops, in the order the carriage visits them.
 *
 * `deck` says what the station sits on, and is resolved to a height at build time
 * rather than hard-coded here — the terrain under a stop is not something a constant
 * should have to know, and the two floating cities already carry their own altitude.
 *
 * The underground stop is the only one with an explicit `y`, because there is nothing
 * to measure it against: the Understory is a made place, not a surface.
 */
export const LEY_STATIONS = [
  {
    id: 'sporeworks',
    name: 'The Sporeworks',
    /** The realm's hub: the one station every member can reach on foot. */
    deck: 'ground',
    /**
     * Which area's arrival point this platform stands on. The resolver reads the
     * coordinates from `zoneArrival`, so the platform is always exactly where fast
     * travel puts you — see the note on that function.
     */
    zone: 'sporeworks',
    hue: 320,
    note: 'The centre of the world, and the way in.',
  },
  {
    id: 'fungarium',
    name: 'The Fungarium Door',
    deck: 'ground',
    zone: 'fungarium',
    hue: 210,
    note: 'Where the study room meets the realm.',
  },
  {
    id: 'kemet',
    name: 'The City Above the Nile',
    deck: 'kemet',
    /** On the island's landing pad, so you arrive where you would land anyway. */
    local: { x: 0, z: 46 },
    hue: 45,
    note: 'The sky city of pyramids and scrolls.',
  },
  {
    id: 'galactic',
    name: 'The Mycelial Court',
    deck: 'galactic',
    local: { x: 0, z: 16 },
    hue: 190,
    note: 'The network, as a place you can walk into.',
  },
  {
    id: 'descent',
    name: 'The Descent',
    deck: 'ground',
    /** Near the hub, so the climb back up is short. */
    x: -30,
    z: -30,
    hue: 275,
    note: 'The shaft down. It goes a long way down.',
  },
  {
    id: 'understory',
    name: 'The Understory',
    deck: 'understory',
    local: { x: 0, z: 34 },
    /** Nothing to measure against: this is a made place, in the dark, below. */
    y: -150,
    hue: 130,
    note: 'The growing halls, beneath everything.',
  },
];

/**
 * The Understory — the underground world the Descent leads to.
 *
 * Deliberately its own constant rather than a `SKY_CITIES` entry with a negative y:
 * it is not a city in the air, it is a chamber in the dark, and the housing and
 * lighting it wants are different. It carries a walkable floor and its own airspace,
 * exactly as the sky cities do, so the player can walk and fly inside it.
 */
export const UNDERSTORY = {
  id: 'understory',
  name: 'The Understory',
  subtitle: 'the growing halls, where the course lives',
  x: 0,
  y: -150,
  z: 0,
  /** Radius of the carved chamber. */
  radius: 62,
  /** Height from the floor to the vault. */
  ceiling: 34,
  color: 0x7dff9a,
  accent: 0x2fd8c8,
};

/**
 * The Realm — all tuning lives here.
 *
 * Ported from MuzakWorld. One structural change: the areas are no longer
 * hardcoded in this file. They arrive from the server as
 * `server/content/realm/world.json` and are installed by `configureWorld()`
 * before the engine builds anything.
 *
 * Why the split: MuzakWorld's `resolveLayout()` existed only because its areas
 * were literals in this file. The server now supplies explicit `x`/`z` for every
 * area, so the placement search and the `WORLD` mutations it performed are gone.
 * Tuning that is a decision about how the world *feels* stays here in code;
 * content that a non-engineer should be able to edit lives in the JSON.
 *
 * The areas have two radii that shape their music:
 *
 *        silence            fading in            full volume
 *   |<---------------|~~~~~~~~~~~~~~~~~~~~~|===============|
 *   outer                              inner          centre
 *
 * Between two adjacent areas there is a genuine band of silence, so areas never
 * pile up on each other. See src/realm/audio.js for the mixing rule.
 */

export const WORLD = {
  /** Hard circular boundary the player cannot cross. Sized from the areas. */
  radius: 300,
  /** Terrain ripple amplitude / frequency. */
  terrainAmplitude: 3.4,
  terrainFrequency: 0.0125,
  /**
   * Ground segments. Derived from the world size below so quads stay around
   * 4.5 m across however big the world grows; the quality presets scale it.
   */
  terrainSegments: 220,
  groundSize: 620,
  fogColor: 0x06050e,
  /** Thinner than it was, so beacons on the far side of a big world stay visible. */
  fogDensity: 0.0033,
  /**
   * Where the key light sits, in world space.
   *
   * The `moon` DirectionalLight is placed here, and the terrain shader lights the
   * ground from the same direction. It lives in config because the two would
   * otherwise have to agree by hand, and a change to one would be invisible in
   * the other — the ground being a custom shader with its own idea of which way
   * is up.
   */
  // About 30 degrees up. It was 54, which kept the moon above the top of the frame
  // whenever you looked level, so the god rays coming off it could never be seen.
  // Lower also means longer, more dramatic shadows.
  sunPosition: [140, 95, 90],
  /**
   * Void below the world — fall below this and you respawn at the spawn point.
   *
   * This has to stay BELOW the lowest solid place in the world, and the lowest solid
   * place is the Understory floor at −150 (`UNDERSTORY.y`). It used to be −40, which
   * is above the chamber: the moment a member stepped off the carriage down there,
   * the fall guard read "you are below the world" and threw them back to the surface.
   * The whole underground area was, in effect, a room you were ejected from on entry.
   *
   * `tests/realm-course.test.mjs` asserts this stays below `UNDERSTORY.y`, because a
   * number here that creeps upward silently deletes an area from the world.
   */
  respawnY: -320,
};

export const PLAYER = {
  eyeHeight: 1.72,
  radius: 0.5,
  /**
   * Ground speeds. Raised from MuzakWorld's 5.4 / 9.6 at the church's request:
   * the realm is a large place (358 m across) and walking it at 5.4 m/s felt like
   * commuting. `walkSpeed` is now a brisk jog and `sprintSpeed` is a run.
   */
  walkSpeed: 12.5,
  sprintSpeed: 17,
  /**
   * Ground movement accelerates exponentially toward the target velocity. This
   * is a rate (1/s), not a raw acceleration: the top speed comes out as exactly
   * `walkSpeed`/`sprintSpeed`, and it behaves the same at any frame rate.
   */
  groundResponse: 15,
  /** Steering force while airborne, m/s². Weaker than ground control. */
  airAcceleration: 34,
  /**
   * Hard ceiling on horizontal speed in the air, so boosts cannot run away.
   * Above `sprintSpeed` so a sprint-jump keeps all of its momentum.
   */
  airSpeedLimit: 26,
  /** Head bob while walking. */
  bobFrequency: 9.0,
  bobAmplitude: 0.055,
  /** Pitch clamp, radians. */
  maxPitch: Math.PI / 2 - 0.02,

  // ---- jumping
  /**
   * How many jumps you get before touching the ground again.
   *
   * Unlimited, as the church asked for: hold Space and keep climbing.
   *
   * This was briefly 3, because of a real consequence worth knowing. Every air
   * jump resets vertical speed, so with unlimited jumps hang time grows without
   * bound, and horizontal speed is not capped tightly in the air — which means a
   * determined player can cross the whole 358 m realm without touching the ground,
   * passing over the areas, the mycelial road and the travel system. Measured:
   * ~127 m from one chained sprint-jump, and unbounded if you keep going.
   *
   * That is a deliberate trade, not an oversight. Flight is the requested feel,
   * and the areas remain where the content, the music and the bouncy caps are, so
   * flying over them means missing them. If it ever needs reining in, the honest
   * knob is air drag in player.js: it converts chained hang time into a bounded
   * glide without touching jump height or the bounce.
   *
   * Because jumps are unlimited and a cap also refreshes them, a cap's value is
   * now its throw rather than the jumps it gives back.
   */
  maxJumps: Infinity,
  /**
   * Gravity while rising or falling from a JUMP, as opposed to the fall from a
   * ledge (see GRAVITY in player.js).
   *
   * This is the knob that buys jump *distance*, which is what "jump farther"
   * actually means. Distance = horizontal speed x hang time, and hang time is
   * 2*v/g, so lowering g extends a jump far more effectively than raising the
   * launch speed, and without making it feel like a rocket. 18 with the jump
   * speeds below gives about 2.2 s of hang and an 11 m rise.
   */
  jumpGravity: 18,
  /**
   * Unlimited jumps would otherwise let you climb until the world is a speck and
   * there is nothing left to look at, so lift fades out above this height (metres)
   * and you settle back down.
   *
   * Raised with the bounce: a maximum bounce rises ~84 m on its own, so the old
   * 170 m ceiling would have faded you out after two caps. This leaves room to
   * chain several before the fade begins. It stays finite because from very high up
   * the realm is a few glowing points in fog — the limit is about there being
   * something to look at, not about restraint. Set to Infinity to remove it.
   */
  softCeiling: 420,
  /** Over how many metres above the soft ceiling the lift fades to nothing. */
  ceilingFalloff: 120,
  /**
   * Speed of the first (grounded) jump. Raised twice now: 8.4 -> 13 -> 20, which
   * with `jumpGravity` 18 is about 11 m of height (it was ~1.4 m before any of
   * this).
   */
  jumpSpeed: 20,
  /** Speed of each mid-air jump. A little weaker, which reads as "extra". */
  airJumpSpeed: 19,
  /** Each mid-air jump nudges you along your current heading. */
  airJumpBoost: 1.05,
  /**
   * Pressing jump slightly before you land still fires on touchdown, rather
   * than being swallowed. Makes chaining jumps feel responsive.
   */
  jumpBuffer: 0.16,
  /**
   * After walking off an edge you can still use the *grounded* jump for this
   * long ("coyote time"), so a mistimed jump is not punished.
   */
  coyoteTime: 0.12,
};

/**
 * The flying magic carpet.
 *
 * A mount the player walks up to, steps onto, and flies. Everything about how
 * the flight *feels* lives in `FLIGHT` below; this block is the parts that are
 * about the object and the interaction.
 *
 * The realm is admin-only while the Labs are, so "admin users can use it" is
 * already true of everyone who can reach the world at all. `CARPET.adminOnly`
 * exists so that if the Labs ever reopen to members, the carpet can stay a
 * staff tool without a code change.
 */
export const CARPET = {
  /**
   * Calling the carpet (C, or the CALL button): it flies a high arc to the rider.
   * Speed in m/s; the arc's rise and the flight's length are clamped so a call from
   * next door is not instant and a call from across the realm is not a wait.
   */
  summonSpeed: 45,
  summonMinSeconds: 2.5,
  summonMaxSeconds: 12,
  summonMinLift: 8,
  summonMaxLift: 70,
  /** How far in front of the rider it settles, in metres. */
  summonStandOff: 3.4,
  /**
   * When true, only an `admin` may mount. The realm is admin-only today, so this
   * changes nothing yet — it is here so the decision is a single flag when the
   * other gate opens, rather than an edit in the middle of the engine.
   */
  adminOnly: true,
  /**
   * How close (m, in the XZ plane) you must be for the mount prompt to appear.
   *
   * Generous on purpose. `4.2` was tight enough that a player who had not already
   * noticed the carpet could walk toward it, see nothing happen, and conclude it
   * was scenery — the prompt is the only thing that says "this is boardable", so it
   * has to appear while you are still a stride away.
   *
   * The floor on this number is geometric. The hard world wall is a circle at
   * `WORLD.radius` centred on the ORIGIN, while the spawn and the carpet both sit
   * out at z≈76–82, so the wall stops you about 3 m short of the carpet. Anything
   * below that gap and the carpet would be unreachable on foot; `tests/realm-flight.test.mjs`
   * asserts the relationship so a future world resize cannot quietly break it.
   */
  mountRadius: 9,
  /**
   * The keel's height above the floor when parked. Big enough to notice as a
   * floating object, small enough to step onto without a jump.
   */
  hoverHeight: 0.95,
  /** How far above the keel the rider's camera sits. Matches PLAYER.eyeHeight. */
  eyeHeight: 1.72,
  /** Seconds of cooldown after a mount or dismount, so one key press cannot thrash. */
  cooldown: 0.45,
  /**
   * The carpet refuses to be steered below this height above the terrain. Flying
   * into a hillside should feel like the carpet refusing, not like clipping.
   */
  minClearance: 1.6,
  /**
   * How long the ribbon trail behind the carpet is, in seconds of flight.
   * Purely decorative, and the single biggest contributor to "magic carpet".
   */
  trailSeconds: 1.4,
  /** Trail sample spacing along the path, metres. */
  trailStep: 1.6,
  /** Highest and lowest altitude a parked carpet may be placed at. */
  maxAltitude: 3000,
};

/**
 * Flight tuning for the carpet — the "how it feels" half.
 *
 * Exported as a plain object so `flight.js` can be driven from a test with a
 * modified copy. Nothing here reads player state, which is what keeps the whole
 * model reproducible from a position trace (see flight.js).
 */
export const FLIGHT = {
  /**
   * Level-flight speed, m/s. Raised twice now: 30, then 44, now 62.
   *
   * The realm is 358 m across and the sky cities sit at ~450 from the centre, so
   * crossing it is a real journey and the earlier numbers made it a commute. 62 m/s
   * is roughly a fast train; the whole realm edge to edge is about twelve seconds.
   */
  cruiseSpeed: 62,
  /** Speed while boosting. Roughly 1.6x cruise, which is what makes the boost worth asking for. */
  sprintSpeed: 100,
  /** Top speed flying backwards. Deliberately sluggish — reversing is for parking. */
  reverseSpeed: 18,
  /** Sidestep speed, m/s. A nudge, used for fine positioning. */
  axialSpeed: 14,
  /**
   * Approach rates (1/s), exponential like the ground movement in player.js so
   * the result is frame-rate independent and tops out at exactly `cruiseSpeed`.
   * Thrust is much slower than braking, which is what makes the mount feel heavy
   * and worth steering rather than twitchy.
   */
  throttle: 1.6,
  brake: 3.0,
  axialResponse: 7,
  /**
   * Climb/dive speed while vertical input is held, m/s. Raised from 18 alongside the
   * horizontal speed: climbing at a fifth of your cruise speed means the vertical axis
   * is the one that decides how long a trip takes.
   */
  climbSpeed: 40,
  /**
   * How quickly vertical speed approaches the commanded climb/dive rate, 1/s.
   *
   * The lag is on the SPEED, not on an offset from the ground, and that is what
   * makes the hover band work. A first-order lag eases the mount up to its climb
   * rate, eases it back to a genuine stop when you let go, and — crucially —
   * leaves the altitude it gained exactly where it is. A spring on the position
   * instead would drift the mount back toward whatever it was last anchored to,
   * which silently makes "release the controls and stay put" impossible and puts
   * a city 300 m overhead out of reach.
   */
  climbResponse: 5.0,
  /** Max roll into a turn, radians (~28°). */
  maxBank: 0.49,
  /**
   * Turn rate that produces full bank, rad/s.
   *
   * Raised twice: 1.9, then 3.0, now 4.6. Faster straight-line speed demands a faster
   * turn or the mount out-runs its own steering and every course correction becomes a
   * wide sweep. At 4.6 a full about-face takes well under a second and a half.
   */
  yawRate: 4.6,
  /** Response rates for the cosmetic attitude, 1/s. */
  bankResponse: 3.4,
  pitchResponse: 3.0,
  /** Nose pitch per m/s of climb, rad per m/s, and its clamp. */
  pitchPerClimb: 0.016,
  maxPitch: 0.36,
  /**
   * Landing envelope. The mount may descend anywhere; these bound whether the
   * rider can safely step OFF. Beyond them you keep hovering instead of falling.
   */
  landReach: 3.2,
  landMaxVerticalSpeed: 6.5,
  landMaxSpeed: 16,
  /**
   * How much wider than the walking boundary the airspace is.
   *
   * `WORLD.radius` is a hard wall on foot, and it is sized to the *areas* — the
   * sky cities deliberately sit outside it. Flying is therefore bounded by this
   * multiple instead, and the hard wall comes back the moment you step off.
   */
  airspaceFactor: 2.6,
};

/**
 * Where the floating cities hang, and how big they are.
 *
 * Kept in code rather than in `world.json` because they are not *areas*: they
 * carry no music, no falloff and no proximity mix. They are structures with
 * walkable ground, hung outside the walking boundary and reachable only by air.
 * Putting them in the area list would enrol them in the mixer, the minimap's
 * reach rings and the Fungarium's rank gating, none of which they want.
 */
export const SKY_CITIES = {
  /** The floating city of Kemet: pyramids, a temple, and readable scrolls. */
  kemet: {
    id: 'kemet',
    name: 'The City Above the Nile',
    subtitle: 'mushrooms in Kemet, and what the priests wrote down',
    /** Centre of the island's top surface, in world space. */
    x: -320,
    y: 300,
    z: -260,
    /** Radius of the walkable island disc. */
    radius: 78,
    /** How thick the rock beneath it is. */
    depth: 26,
    color: 0xd9a441,
    accent: 0x8f6bff,
  },
  /** The galactic city: the mycelium architecture as holograms, staffed by agents. */
  galactic: {
    id: 'galactic',
    name: 'The Mycelial Court',
    subtitle: 'the network, as a place you can walk into',
    x: 340,
    y: 372,
    z: 300,
    radius: 68,
    depth: 22,
    color: 0x7ffff0,
    accent: 0xff5ce1,
  },
};

/**
 * Interaction distances for the things you can use in the floating cities: the
 * scrolls you read and the hyphae you give a task to.
 */
export const INTERACT = {
  /** How close (m, in 3D) before a scroll offers itself. */
  readRadius: 6.5,
  /** How close (m, in 3D) before a mycelium agent offers to take a task. */
  taskRadius: 5.5,
  /**
   * Vertical reach is generous relative to the planar radius, because both
   * cities are landing platforms: you approach from above far more often than
   * from the side, and a cylinder-shaped trigger would make that awkward.
   */
  verticalReach: 9,
};

/**
 * Mushroom shot — the spores you can throw.
 *
 * A toy, and deliberately a harmless one: it changes no game state, kills nothing,
 * and nothing else in the realm reads it. It exists because flying somewhere
 * beautiful and being able to throw something at it is fun, and a version of this
 * that DID something would be a different game.
 */
export const PROJECTILE = {
  /** How many shots can be in flight at once. A pool, so this is a hard ceiling. */
  pool: 48,
  /** Muzzle speed, m/s. Fast enough that a shot crosses a street before you look. */
  speed: 135,
  /** Downward acceleration, m/s². Light, so a shot arcs rather than drops. */
  gravity: 16,
  /** How long a shot lives if it hits nothing, seconds. */
  maxLife: 3.2,
  /** Cap size, metres. Visible at range, not a cannonball. */
  capRadius: 0.42,
  /** How far in front of the eye the shot starts, so it never spawns inside you. */
  muzzleOffset: 1.1,
  /** How far above a landing point the mushroom sits. */
  spawnLift: 0.08,
  capColor: 0xff5ce1,
  glowColor: 0x7ffff0,
  /** Seconds between shots while the fire button is held. */
  cooldown: 0.14,
  /**
   * How long a grown mushroom lasts, seconds.
   *
   * Shots are meant to be left everywhere, so they have to age out or a long
   * session turns the realm into a mushroom farm and the pool into a leak.
   */
  mushroomLife: 45,
  /** Most grown mushrooms alive at once. Oldest is replaced. */
  mushroomPool: 90,
};

/**
 * Bouncy surfaces -- the mycelium wood's mushroom caps.
 *
 * A cap is a `dome` surface (see src/realm/world/supports.js) tagged
 * `kind: 'bounce'`. Landing on one launches the player instead of stopping them.
 * Kept in shared config because the server re-runs this same maths to validate
 * movement, so these numbers are part of the wire contract, not a local taste.
 */
export const BOUNCE = {
  /**
   * Minimum launch speed (m/s) for any landing that counts as a bounce. Kept well
   * above PLAYER.jumpSpeed (20) so a cap is always the most powerful thing you can
   * do — even a gentle step onto one out-launches a jump, and a test asserts it.
   */
  minSpeed: 26,
  /**
   * How much of the impact speed is returned. Above 1 the caps add energy, which
   * is the point -- you climb by chaining caps.
   */
  restitution: 1.35,
  /**
   * Ceiling on a single launch (m/s). "Way stronger" than a jump: at the limit
   * this is 55 m/s, which with jump gravity 18 is about 84 m of rise — roughly 7x
   * a jump's 11 m, and high enough to clear the mountain several times over.
   */
  maxSpeed: 55,
  /**
   * Horizontal push, m/s, applied along the cap's own `dir`.
   *
   * Every cap launches you in its own direction, so a glade is something you are
   * thrown around rather than merely lifted by. Raised alongside the vertical
   * speed so the throw is felt: you are flung across the wood, not just up it.
   */
  impulse: 20,
  /**
   * Multiplier on the player's current heading, applied on top of `impulse`. A
   * moving player keeps some of their own direction, so a bounce redirects rather
   * than overriding.
   */
  forwardBoost: 1.08,
  /**
   * Landing must be downward at least this fast to count as a bounce. Below it
   * you are walking onto the cap, not landing on it — without this, striding
   * across a glade of caps would fling you with every step. About a 20 cm drop.
   */
  minImpact: 2.0,
};

/**
 * Fast travel between areas, and the volume keys/buttons.
 */
export const TRAVEL = {
  /**
   * Where you land: this fraction of an area's full-volume radius out from its
   * centre, on the side that faces the spawn point. Half of `inner` keeps you
   * comfortably inside the music without dropping you inside a building.
   */
  approachFraction: 0.5,
  /** Seconds before you can travel again, so one keypress can't stack up. */
  cooldown: 0.5,
};

/**
 * Where fast travel puts you in a given area.
 *
 * This is exported and shared because the Ley Line's ground stations stand exactly
 * here. Two independent guesses at "where you arrive at the Sporeworks" drifted 15 m
 * apart, which was enough to put the platform outside its own boarding radius: you
 * would travel to the Sporeworks and find no train. One definition, used by both the
 * travel system and the station resolver, is the only version of this that cannot
 * drift.
 *
 * @param {{x:number,z:number,inner:number}} zone
 * @returns {{x:number,z:number}}
 */
export function zoneArrival(zone) {
  if (!zone) return { x: 0, z: 0 };
  const dx = -zone.x;
  const dz = -zone.z;
  const len = Math.hypot(dx, dz) || 1;
  const dist = zone.inner * TRAVEL.approachFraction;
  return { x: zone.x + (dx / len) * dist, z: zone.z + (dz / len) * dist };
}

export const VOLUME = {
  /** One press of the volume key / step of the slider. */
  step: 0.07,
  /** Remembered in localStorage under this key. */
  storageKey: 'perankh.realm.volume',
};

export const AUDIO = {
  /**
   * How each area's track is delivered.
   *
   *  'stream'  an <audio> element routed through the mixer. The browser decodes
   *            on the fly, so a four-minute track costs almost no memory and
   *            full-length songs work on phones. Looping is the element's own.
   *
   *  'buffer'  the file is decoded to an AudioBuffer and looped sample-exactly.
   *            Gapless, but raw float PCM stays in RAM: a 4-minute stereo track
   *            is ~84 MB, so four of them is ~340 MB and will upset mobile
   *            Safari. Only worth it for short loops.
   *
   * 'stream' is the default because the music here is full-length pieces.
   */
  mode: 'stream',
  /** Master output level, 0..1. */
  masterVolume: 0.85,
  /**
   * How sharply the nearest area wins. 1 = gentle blend, 4 = clearly one area
   * at a time, 8 = almost a hard switch. This is what enforces "not all at once".
   */
  dominance: 4.0,
  /** Never mix more than this many areas together (2 allows a clean crossfade). */
  maxVoices: 2,
  /** Time constant of the volume fade, seconds. Larger = longer, smoother fades. */
  fadeSeconds: 0.45,
  /**
   * An area is muted outright once its sharpened weight falls below this
   * fraction of the loudest area. Combined with `dominance`, this is what makes
   * the mix cleanly one-area-at-a-time rather than a permanent blend.
   */
  gateBelow: 0.04,
  /**
   * Per-area trim, used to balance tracks that were mastered at different
   * levels. Measure rather than guess: MuzakWorld used
   * `node tools/analyze-audio.mjs --scan` and set these so every area lands
   * within ~0.2 LUFS of the others, which is what stops one area jumping out
   * during a crossfade.
   *
   * Keyed by area id. A missing id falls back to 1 (no trim), so a new area is
   * audible before it is balanced.
   */
  trims: {},
  /**
   * Extension priority. The first file that exists wins, so `forest.m4a` beats
   * a generated `forest.wav`.
   */
  extensions: ['mp3', 'ogg', 'oga', 'opus', 'm4a', 'aac', 'flac', 'wav'],
  /** If no file loads for an area, synthesise a drone so it still makes sound. */
  synthFallback: true,
};

/**
 * The one shadow map.
 *
 * Until this existed nothing in the realm cast or received a shadow, and with a
 * dominant ambient light that is most of why objects read as stickers on a
 * backdrop rather than things standing in a place. One directional shadow, tight
 * around the viewer, is the strongest depth cue available for the cost.
 *
 * The box is deliberately small. A directional light's shadow camera is a fixed
 * orthographic box, so covering a 358 m world at a usable resolution is not
 * possible; instead it follows the player, which is the only place the shadow is
 * being looked at. `world/index.js` slides it and keeps the light's direction
 * fixed, so the terrain shader's `uSunDir` stays true.
 *
 * Desktop only — see `QUALITY.presets`, where it is off on the low preset. A
 * second full pass over the scene every frame is not something a phone should pay.
 */
export const SHADOW = {
  /** Half-width of the square the shadow camera covers, in metres. */
  extent: 60,
  mapSize: 1024,
  /**
   * Depth offsets. `bias` is in shadow-map depth units, `normalBias` in world
   * metres. The normal bias is the one doing the work on the terrain, whose slopes
   * are gentle enough to self-shadow into stripes without it.
   */
  bias: -0.0006,
  normalBias: 0.5,
  /** How far back along the light direction the camera sits from its target. */
  distance: 220,
  near: 40,
  far: 460,
};

/**
 * Image-based lighting — see `world/environment.js`.
 *
 * The sky is painted into a small image and baked into `scene.environment`, which
 * gives metals and crystals something to reflect. Once it exists the strong ambient
 * light that stood in for it is no longer needed at full strength: the environment
 * already lights every standard material from every direction, and keeping both
 * would wash the world out. `ambientWithEnv` and `hemiWithEnv` are what those two
 * lights drop to when the environment is on.
 *
 * Every number here is a first guess made without a screen. Compare on a real
 * device with `?env=0` and `?env=1` and tune here.
 */
export const ENVIRONMENT = {
  /** Overall brightness of the reflected sky. */
  intensity: 1.6,
  /** The moon's disc, relative to the sky. This is what draws the highlight on metal. */
  moonIntensity: 6,
  ambientWithEnv: 0.45,
  hemiWithEnv: 0.5,
  colors: {
    horizon: 0x1a1240,
    zenith: 0x03020a,
    ground: 0x0d0a1a,
    nebulaA: 0x5a2bd8,
    nebulaB: 0x1f7fa8,
    nebulaC: 0xd94fb0,
    moon: 0xc3d4ff,
  },
};

/**
 * The ground's look: three scanned CC0 material layers from Poly Haven
 * (public/textures/realm/CREDITS.md), lit by the moon and the violet ambient.
 *
 * The terrain is almost flat — 99% of it tilts less than 9° — so the layers are
 * placed by height and a large-scale noise rather than by slope: moss in the
 * hollows, forest floor across the middle, rock breaking through on the rises.
 *
 * `tile` is the size in metres of one repeat. Light colours are sRGB hex. All of
 * this was set without a screen; `?ground=classic` brings back the old neon plate
 * for comparison.
 */
export const GROUND = {
  layers: {
    floor: { diff: '/textures/realm/forest_ground_04_diff.webp', normal: '/textures/realm/forest_ground_04_nor_gl.webp', tile: 4 },
    moss: { diff: '/textures/realm/mossy_rock_diff.webp', normal: '/textures/realm/mossy_rock_nor_gl.webp', tile: 5 },
    rock: { diff: '/textures/realm/rock_face_03_diff.webp', normal: '/textures/realm/rock_face_03_nor_gl.webp', tile: 7 },
  },
  /** How strongly each normal map tilts the surface. */
  normalStrength: 1.0,
  /** Ground height (m) below which moss takes over, and above which rock does. */
  mossBelow: 2.0,
  rockAbove: 5.5,
  moonColor: 0xb8c8ff,
  moonStrength: 1.35,
  ambientColor: 0x3a2d6e,
  ambientStrength: 0.55,
  /** The old neon grid and bands, kept as a faint bioluminescent layer on top. */
  gridStrength: 0.35,
  /** Large-scale light/dark patches that hide the texture's repeat. */
  macroVariation: 0.35,
};

/**
 * The cinematic end of the frame — see `post-fx.js`. `?post=0` turns it all off.
 *
 * Tints are added to display-referred colour (0..1), so 0.02 is already visible.
 * The shadows lean violet-teal and the highlights warm, the classic night grade;
 * the neon stays saturated because the saturation lift is small.
 */
export const POST = {
  ao: {
    /** World metres around each point that count as "nearby" for occlusion. */
    radius: 1.2,
    /** How dark full occlusion gets, 0..1. */
    intensity: 0.85,
    samples: 16,
    /** AO buffers as a fraction of the screen. Half is invisible after the denoise. */
    scale: 0.5,
  },
  grade: {
    saturation: 1.08,
    contrast: 0.22,
    shadowTint: [0.006, 0.0, 0.03],
    highlightTint: [0.025, 0.012, 0.0],
    vignette: 0.45,
    grain: 0.045,
    /** Lens fringing at the corners. Desktop only, see the presets. */
    aberration: 0.012,
  },
};

/**
 * Scanned detail for the `surface` families in `world/textures.js`: a real normal
 * and roughness map in place of the generated noise. Colour stays the material's
 * own, so every building keeps its palette and gains real masonry, grain and wear.
 * `strength` replaces the family's, because a scan already carries its own depth.
 * Credits in public/textures/realm/CREDITS.md. `metal` stays generated.
 */
export const SURFACE_SCANS = {
  stone: {
    normal: '/textures/realm/castle_wall_varriation_nor_gl.webp',
    roughness: '/textures/realm/castle_wall_varriation_rough.webp',
    strength: 1.0,
  },
  rock: {
    normal: '/textures/realm/rock_face_03_nor_gl.webp',
    roughness: '/textures/realm/rock_face_03_rough.webp',
    strength: 1.0,
  },
  bark: {
    normal: '/textures/realm/bark_brown_02_nor_gl.webp',
    roughness: '/textures/realm/bark_brown_02_rough.webp',
    strength: 1.0,
  },
  soil: {
    normal: '/textures/realm/forest_ground_04_nor_gl.webp',
    roughness: '/textures/realm/forest_ground_04_rough.webp',
    strength: 0.8,
  },
};

/**
 * Scanned CC0 models that replace primitives — see `world/models.js` and
 * public/models/realm/CREDITS.md. `kind` decides how a model is fitted: a rock is
 * scaled into the unit sphere the old icosahedron filled; a plant or prop keeps its
 * real size and stands on its base. Anything that fails to load falls back to the
 * primitive. `?models=0` skips them all, for comparison.
 */
export const MODELS = {
  boulderA: { url: '/models/realm/boulder_a.glb', kind: 'rock' },
  boulderB: { url: '/models/realm/boulder_b.glb', kind: 'rock' },
  fern: { url: '/models/realm/fern.glb', kind: 'plant' },
  // Forest-floor clutter. `prop` keeps its real size: the log is a 3 m trunk, the
  // stump 1.4 m across, the moss set an 8 m outcrop and the stone a 15 cm pebble —
  // each placement in areas.js scales them from there.
  log: { url: '/models/realm/log.glb', kind: 'prop' },
  stump: { url: '/models/realm/stump.glb', kind: 'prop' },
  mossRocks: { url: '/models/realm/mossrocks.glb', kind: 'prop' },
  stone: { url: '/models/realm/stone.glb', kind: 'prop' },
  // Statues for Kemet, generated with Meshy 6 text-to-3D through Higgsfield, then
  // simplified to a budget (public/models/realm/CREDITS.md). `height` is metres;
  // `yaw` turns each one to face +Z, measured from the file.
  sphinx: { url: '/models/realm/sphinx.glb', kind: 'statue', height: 4.2, yaw: 0 },
  anubis: { url: '/models/realm/anubis.glb', kind: 'statue', height: 2.6, yaw: 0 },
  scribe: { url: '/models/realm/scribe.glb', kind: 'statue', height: 2.4, yaw: -0.63 },
};

/**
 * Volumetric height fog and god rays — see `post-fx.js`. `?fog=0` / `?rays=0`
 * turn either off for comparison.
 *
 * The fog pools in the low ground and thins with height (`base` is where it is
 * densest, `falloff` how fast it thins per metre), drifts with a slow noise, and is
 * lit by the moon: looking toward the moon, it glows. The rays radiate from the
 * moon's disc and are blocked by anything standing in front of it.
 */
export const FOG = {
  /**
   * Density at `base`; the old flat fog still runs alongside this. Was 0.018, which
   * hid two thirds of the light within 100 m on open ground and laid a heavy band
   * across the horizon; this keeps about three quarters at 150 m on the surface and
   * still thickens into the hollows.
   */
  density: 0.004,
  base: -1,
  falloff: 0.11,
  /** How patchy it is, 0 (even) … 1 (very). */
  noise: 0.55,
  colour: 0x2a2156,
  moonGlow: 0x9fb8ff,
  rays: {
    /** How strongly the shafts add to the frame. */
    exposure: 0.42,
    decay: 0.955,
    density: 0.92,
    weight: 0.6,
    colour: 0xb9c8ff,
  },
};

/**
 * Graphics quality. 'auto' picks 'low' on phones/tablets, where the bloom pass
 * and the big particle counts are the difference between smooth and a slideshow.
 * Force it with ?quality=high or ?quality=low in the URL.
 *
 * `bloomScale` is the resolution the bloom chain runs at, as a fraction of the
 * screen. UnrealBloomPass is five successive blur mips, so it is the most
 * fill-hungry thing in the frame; running it at half resolution on a phone cuts
 * that cost roughly fourfold while keeping the glow, which is the whole mood of
 * the world. Turning bloom off entirely was the alternative and it makes the
 * neon read as flat paint.
 */
export const QUALITY = {
  mode: 'auto',
  presets: {
    high: {
      pixelRatio: 2,
      bloom: true,
      bloomStrength: 0.72,
      bloomScale: 1,
      shadows: true,
      /** Image-based lighting. One bake at boot, then free — so phones get it too. */
      environment: true,
      groundAntiTile: true,
      /** Ambient occlusion: a second scene pass, so desktop only. */
      ao: true,
      /** The film grade. One cheap full-screen pass. */
      grade: true,
      aberration: true,
      /** Height fog: one full-screen pass. */
      fog: true,
      /** God rays, and how many samples along each one. */
      rays: true,
      raySamples: 48,
      /** Multiplier on WORLD.terrainSegments. */
      terrainScale: 1,
      motes: 900,
      debris: 54,
      wisps: 130,
      fireflies: 220,
      spores: 260,
      embers: 90,
      smoke: 40,
      forestTrees: 96,
      forestFerns: 150,
    },
    low: {
      pixelRatio: 1,
      bloom: true,
      bloomStrength: 0.5,
      bloomScale: 0.5,
      shadows: false,
      environment: true,
      /** A second, rotated texture sample on the ground that hides the tiling. */
      groundAntiTile: false,
      ao: false,
      grade: true,
      aberration: false,
      fog: true,
      rays: true,
      raySamples: 22,
      terrainScale: 0.45,
      motes: 260,
      debris: 20,
      wisps: 45,
      fireflies: 70,
      spores: 80,
      embers: 30,
      smoke: 14,
      forestTrees: 46,
      forestFerns: 55,
    },
  },
};

/**
 * The sensory dial.
 *
 * This world is deliberately trippy, and it needs a way to be turned down:
 * bloom, head bob, drifting motes and the ground's pulse would otherwise be
 * fixed. That is an accessibility problem, not a preference.
 *
 * Three named stops, persisted, cycled with `V`:
 *
 *   bloom      multiplier on the quality preset's bloom strength
 *   particles  multiplier on every particle system's opacity
 *   bob        multiplier on the head bob while walking
 *   motion     how fast ambient shader time runs — sky, ground, motes, threads
 *
 * A first-ever visit with no stored choice follows the operating system's
 * `prefers-reduced-motion` setting and starts at Calm.
 */
export const SENSORY = {
  order: ['calm', 'vivid', 'visionary'],
  levels: {
    calm: { label: 'Calm', bloom: 0.30, particles: 0.26, bob: 0.1, motion: 0.18 },
    vivid: { label: 'Vivid', bloom: 1, particles: 1, bob: 1, motion: 1 },
    visionary: { label: 'Visionary', bloom: 1.5, particles: 1.6, bob: 1.4, motion: 1.9 },
  },
};

export const TOUCH = {
  /** Look sensitivity, radians per pixel of drag. */
  lookSensitivity: 0.0032,
  /** Fraction of the screen height used for the movement stick zone (bottom-left). */
  stickZoneHeight: 0.55,
  stickZoneWidth: 0.5,
  /** Radius in px that the stick knob can travel from its base. */
  stickRadius: 62,
  /** How far you must drag before movement registers, as a fraction of radius. */
  deadZone: 0.16,
  /** Invert the vertical look axis. */
  invertY: false,
};

/**
 * How the world is sized around its areas.
 *
 * MuzakWorld used these to *place* areas in rings. The server now supplies
 * explicit coordinates, so only the sizing rules survive.
 */
export const LAYOUT = {
  /** The world boundary sits this far beyond the furthest area's silence radius. */
  margin: 90,
  /** Never build a world smaller than this, however few areas there are. */
  minRadius: 300,
};

/**
 * Narrow the installed area set to those a member may actually walk.
 *
 * Called once, after `configureWorld()` has validated the whole set and after the
 * Fungarium bridge has decided what is open. It exists because those two steps
 * cannot be reordered: validation must see every area (or a malformed one could be
 * filtered out and never checked), and the engine must be built around the final
 * set (because areas are indexed positionally — gains, terrain slots, mycelial
 * nodes).
 *
 * `zone` objects are passed through by reference, so anything a later stage reads
 * off them — `requiredRank` included — is the validated copy.
 *
 * @param {Array<object>} zones  a subset of the installed zones, in order
 */
export function applyOpenPaths(zones) {
  if (!Array.isArray(zones) || !zones.length) {
    throw new Error('applyOpenPaths() needs at least one open area');
  }
  const known = new Set(ZONES.map((z) => z.id));
  for (const z of zones) {
    if (!known.has(z.id)) {
      throw new Error(`applyOpenPaths(): "${z.id}" was never installed, so it cannot be opened`);
    }
  }
  ZONES = zones;

  // Re-derive everything that depends on the area set, exactly as configureWorld
  // does, or the world would keep the boundary and glow slots of the larger set.
  MAX_OUTER = ZONES.reduce((m, z) => Math.max(m, z.outer), 0);
  const furthestReach = ZONES.reduce((max, z) => Math.max(max, Math.hypot(z.x, z.z) + z.outer), 0);
  WORLD.radius = Math.max(LAYOUT.minRadius, Math.round(furthestReach + LAYOUT.margin));
  WORLD.groundSize = Math.round(WORLD.radius * 2.15);
  WORLD.terrainSegments = Math.round(Math.min(320, Math.max(180, WORLD.groundSize / 4.5)));

  return ZONES;
}

// ============================================================================
// Areas — installed from the server
// ============================================================================

/**
 * Every area in the realm.
 *
 * Empty until `configureWorld()` runs. Exported as a live binding: every module
 * that does `import { ZONES } from '../config.js'` sees whatever
 * `configureWorld()` installed, which is why the config must be fetched before
 * the engine modules are imported. `src/realm/main.js` enforces that order.
 *
 * @type {Array<object>}
 */
export let ZONES = [];

/** The widest silence radius in the world, handy for map and fog tuning. */
export let MAX_OUTER = 0;

/** Look up a zone by id. */
export let zoneById = () => undefined;

/** Index of a zone, for the number keys and travel menu. */
export let zoneIndex = () => -1;

/** The spawn point, in world space. Areas are laid out around it. */
export let SPAWN = { x: 0, z: 0 };

/**
 * Fields an area must carry. Validated on install rather than trusted, because
 * this arrives over the network and a bad value here is a broken world with a
 * confusing stack trace.
 */
const REQUIRED_AREA_FIELDS = ['id', 'name', 'x', 'z', 'inner', 'outer', 'pad'];

/**
 * Validate one area and return a normalised copy.
 *
 * Ranges are checked, not just presence: an `outer` smaller than `inner` would
 * make `falloff()` divide by zero and the area would be silently inaudible,
 * which is exactly the kind of bug that costs an afternoon.
 *
 * @param {object} area
 * @param {number} index  position in the list, for error messages
 */
function normaliseArea(area, index) {
  if (!area || typeof area !== 'object') {
    throw new Error(`world config: area ${index} is not an object`);
  }
  for (const field of REQUIRED_AREA_FIELDS) {
    if (area[field] === undefined || area[field] === null) {
      throw new Error(`world config: area ${index} (${area.id ?? 'no id'}) is missing "${field}"`);
    }
  }
  if (typeof area.id !== 'string' || !area.id) {
    throw new Error(`world config: area ${index} has a non-string id`);
  }
  for (const field of ['x', 'z', 'inner', 'outer', 'pad']) {
    if (!Number.isFinite(area[field])) {
      throw new Error(`world config: area "${area.id}" has a non-finite "${field}"`);
    }
  }
  if (area.inner <= 0) {
    throw new Error(`world config: area "${area.id}" has inner <= 0 (music would be silent at its centre)`);
  }
  if (area.outer <= area.inner) {
    throw new Error(`world config: area "${area.id}" has outer <= inner (no audible band)`);
  }

  return {
    // Sensible defaults, so a minimal JSON entry still builds.
    name: area.id,
    subtitle: '',
    archetype: area.id,
    seed: 1,
    color: 0xffffff,
    accent: 0x444444,
    bpm: 100,
    audio: [],
    beaconHeight: 140,
    ...area,
  };
}

/**
 * Install the world from server data.
 *
 * Must be called exactly once, before the engine modules are imported. Recomputes
 * the derived geometry (`WORLD.radius`, `groundSize`, `terrainSegments`) that
 * MuzakWorld used to compute as an import side effect.
 *
 * @param {object} data  the payload from GET /api/realm/config
 * @returns {{zones: Array<object>, world: typeof WORLD}}
 */
export function configureWorld(data) {
  if (ZONES.length) {
    throw new Error('configureWorld() called twice; the area set is immutable for a session');
  }
  const areas = data?.areas;
  if (!Array.isArray(areas) || !areas.length) {
    throw new Error('world config: "areas" must be a non-empty array');
  }

  const zones = areas.map(normaliseArea);

  const seen = new Set();
  for (const z of zones) {
    if (seen.has(z.id)) throw new Error(`world config: duplicate area id "${z.id}"`);
    seen.add(z.id);
  }

  ZONES = zones;
  MAX_OUTER = zones.reduce((m, z) => Math.max(m, z.outer), 0);
  zoneById = (id) => ZONES.find((z) => z.id === id);
  zoneIndex = (id) => ZONES.findIndex((z) => z.id === id);
  if (data.spawn && Number.isFinite(data.spawn.x) && Number.isFinite(data.spawn.z)) {
    SPAWN = { x: data.spawn.x, z: data.spawn.z };
  }

  // Per-area loudness trims may travel with the config, so balancing a track
  // does not need a code change.
  if (data.trims && typeof data.trims === 'object') {
    Object.assign(AUDIO.trims, data.trims);
  }
  if (Number.isFinite(data.masterVolume)) {
    AUDIO.masterVolume = Math.min(1, Math.max(0, data.masterVolume));
  }

  // ---- size the world around the areas (was an import side effect)
  const furthestReach = zones.reduce((max, z) => Math.max(max, Math.hypot(z.x, z.z) + z.outer), 0);
  WORLD.radius = Math.max(LAYOUT.minRadius, Math.round(furthestReach + LAYOUT.margin));
  WORLD.groundSize = Math.round(WORLD.radius * 2.15);
  /** Keep terrain quads roughly 4.5 m across whatever the world size. */
  WORLD.terrainSegments = Math.round(Math.min(320, Math.max(180, WORLD.groundSize / 4.5)));

  /**
   * Every validated area, including any the Fungarium bridge would seal.
   *
   * The bridge runs BEFORE this, because areas are indexed positionally and the
   * engine must be built around the final set. That ordering has a sharp edge: a
   * bridge that filters a broken area out before configuration means the broken
   * area is never validated, so a malformed world definition is silently accepted
   * and the operator never finds out. Keeping the whole validated list here lets
   * the caller gate *after* the world has been proven sound.
   */
  return { zones: ZONES, world: WORLD, allAreas: zones.slice() };
}

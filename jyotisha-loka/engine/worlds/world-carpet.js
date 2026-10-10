/**
 * The flying carpet in a kit world — the realm's own CarpetRider (../carpet.js),
 * parked near the way in, for a world whose recipe asks for it (`recipe.carpet`).
 *
 * On foot a member is held to the island (the player's bounds). In the air the
 * carpet is held instead to `flightRadius`, which a world sets wide enough to reach
 * what it has out over the void — in Jyotisha Loka, the grahas' orbits. Beyond the
 * island there is no ground to land on, so stepping off out there asks twice, and
 * a fall ends back at the way in, as it always does.
 */
import { CarpetRider } from '../carpet.js';
import { SupportField } from '../world/supports.js';
import { dismountHeight } from '../flight.js';

/**
 * @param {{scene, player, heightAt: Function, access, recipe, walkRadius: number}} opts
 */
export function createWorldCarpet({ scene, player, heightAt, access, recipe, walkRadius }) {
  const cfg = recipe.carpet;
  const flightRadius = cfg.flightRadius ?? recipe.radius * 1.5;
  // On an island (a falling edge) the ground ends at its rim: past it there is
  // nothing to land on. In a clearing ringed by rising ground, the ground is real.
  const island = (recipe.terrain?.wallHeight ?? 1) < 0;
  const terrain = island ? { heightAt: (x, z) => (Math.hypot(x, z) > walkRadius + 1 ? -1e6 : heightAt(x, z)) } : { heightAt };
  const carpet = new CarpetRider({ scene, supports: new SupportField(), terrain, access });
  carpet.worldRadius = flightRadius;
  carpet.resolveCollisions = (pos) => {
    const r = Math.hypot(pos.x, pos.z);
    if (r > flightRadius && r > 1e-6) {
      const k = flightRadius / r;
      pos.x *= k;
      pos.z *= k;
    }
  };
  carpet.attachPlayer(player, cfg.park);

  let stepOffUntil = 0;
  return {
    carpet,
    flightRadius,
    get riding() { return carpet.mode === 'ridden'; },
    canMount: () => carpet.canMount(player),
    mount: () => carpet.mount(),
    /**
     * Step off. Over the island it simply lands; out over the void the first press
     * is refused and a second, within a few seconds, commits — as in the realm.
     * @returns {'landed'|'ask'|'fell'}
     */
    dismount() {
      const deliberate = performance.now() < stepOffUntil;
      // Ask BEFORE stepping off: the carpet's own dismount parks the rug where it
      // is, and in the realm you would stand on it — but a world has nothing to
      // stand on in the air, so a refusal there must leave you riding.
      if (!deliberate) {
        const keel = carpet.position.y + 0.06;
        const floor = carpet._floorAt(player.position.x, player.position.z, keel);
        if (!dismountHeight(keel, floor).grounded) {
          stepOffUntil = performance.now() + 2600;
          return 'ask';
        }
      }
      const { grounded } = carpet.dismount({ safeOnly: !deliberate });
      stepOffUntil = 0;
      return grounded ? 'landed' : 'fell';
    },
    call: () => carpet.summon(),
    /** The flight input from the keyboard and the touch pad, as the realm reads it. */
    input({ keys, touchMove, climb = false, descend = false, sprint = false }) {
      let forward = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) forward += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) forward -= 1;
      if (touchMove?.y) forward += touchMove.y;
      let strafe = 0;
      if (keys.has('KeyD')) strafe += 1;
      if (keys.has('KeyA')) strafe -= 1;
      if (touchMove?.x) strafe -= touchMove.x;
      let vertical = 0;
      if (keys.has('Space') || climb) vertical += 1;
      if (keys.has('ShiftLeft') || keys.has('ShiftRight') || descend) vertical -= 1;
      const clamp = (v) => Math.max(-1, Math.min(1, v));
      return { forward: clamp(forward), strafe: clamp(strafe), vertical: clamp(vertical), sprint };
    },
    update: (dt, input) => carpet.update(dt, input),
  };
}

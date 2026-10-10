/**
 * One multiplier for every particle system in the world.
 *
 * The sensory dial needs to thin out all the drifting motes, fireflies, spores
 * and embers at once. Rather than plumb a scale factor through every area
 * builder, each particle material registers itself here at creation and the dial
 * sets the multiplier once.
 *
 * Only opacity is scaled, not the number of particles: the geometry was built
 * with a fixed count for the quality preset, and changing opacity is instant
 * whereas rebuilding buffers is not.
 */

const registry = new Set();

/** @param {import('three').ShaderMaterial} material with a `uOpacity` uniform */
export function registerParticleMaterial(material) {
  if (!material?.uniforms?.uOpacity) return;
  registry.add({ material, base: material.uniforms.uOpacity.value });
}

export function setParticleScale(scale) {
  for (const entry of registry) {
    entry.material.uniforms.uOpacity.value = entry.base * scale;
  }
}

export function particleMaterialCount() {
  return registry.size;
}

/**
 * The realm's look, as values: Bioluminescent Kemet. See docs/realm-style-guide.md.
 *
 * Builders take colours and materials from here rather than inventing them, so the
 * guide is enforced by construction. Materials are cached: a hundred columns share
 * one sandstone material and one shader program.
 */
import * as THREE from 'three';

export const PALETTE = {
  night: { deep: 0x05040e, violet: 0x1a1240, haze: 0x2a2156 },
  stone: { sand: 0xc9a77a, sandDeep: 0x9a7b55, basalt: 0x3a3438 },
  gold: { leaf: 0xd9a441, electrum: 0xf1d38a },
  glyph: { cyan: 0x7ffff0, amber: 0xffc56a },
  life: { cyan: 0x4fffd0, violet: 0x8f6bff, magenta: 0xff5ce1, green: 0x7dff5c },
  fungus: {
    cubensisCap: 0xc0782c,
    cubensisCapDark: 0x7a4519,
    cubensisStem: 0xeee3cf,
    agaricRed: 0xc8221a,
    agaricWart: 0xf4ecd8,
    lionsMane: 0xf2ece0,
    reishi: 0x7a1e14,
    reishiEdge: 0xf0d9a8,
    chanterelle: 0xe8a33a,
    morel: 0x8a6a48,
    morelRidge: 0xc4a682,
  },
};

/** How bright things may glow, by kind. The guide's emissive budget. */
export const GLOW = {
  stone: 0,
  glyph: 0.9,
  life: 1.2,
  lifeStrong: 1.8,
  /** One focal object per place may exceed `lifeStrong`. */
  focal: 2.4,
};

const cache = new Map();
const cached = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

/**
 * A scanned surface: a flat stand-in until the file arrives, then the real image.
 *
 * Several materials want the same image at different tilings, and a texture copy
 * does not notice when its source's image changes — it would keep the 1x1 stand-in
 * on the GPU for good. So copies are made here, remembered, and every one is marked
 * for upload when the image lands.
 */
function scanned(url, { srgb }) {
  const copies = [];
  let image = null;
  const make = (repeat) => {
    const tex = new THREE.DataTexture(new Uint8Array(srgb ? [200, 180, 150, 255] : [128, 128, 255, 255]), 1, 1);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.needsUpdate = true;
    if (image) adopt(tex, image);
    copies.push(tex);
    return tex;
  };
  const adopt = (tex, img) => {
    tex.image = img;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
  };
  if (typeof document !== 'undefined') {
    new THREE.ImageLoader().load(url, (img) => {
      image = img;
      for (const t of copies) adopt(t, img);
    });
  }
  return { at: make };
}

/** Scanned Kemetic masonry (Poly Haven, CC0) — see public/textures/realm/CREDITS.md. */
export const SANDSTONE_SCAN = {
  diff: '/textures/realm/large_sandstone_blocks_01_diff.webp',
  normal: '/textures/realm/large_sandstone_blocks_01_nor_gl.webp',
  rough: '/textures/realm/large_sandstone_blocks_01_rough.webp',
};

/**
 * Sandstone masonry. `repeat` is how many texture tiles across one unit of UV —
 * the kit's geometry is UV'd in metres, so 0.4 means one tile per 2.5 m.
 */
export function sandstone({ tint = PALETTE.stone.sand, repeat = 0.4 } = {}) {
  return cached(`sand|${tint}|${repeat}`, () => {
    const scans = cached('sand-scan', () => ({
      diff: scanned(SANDSTONE_SCAN.diff, { srgb: true }),
      normal: scanned(SANDSTONE_SCAN.normal, { srgb: false }),
      rough: scanned(SANDSTONE_SCAN.rough, { srgb: false }),
    }));
    const m = new THREE.MeshStandardMaterial({
      color: tint,
      roughness: 0.92,
      metalness: 0,
      map: scans.diff.at(repeat),
      normalMap: scans.normal.at(repeat),
      roughnessMap: scans.rough.at(repeat),
      normalScale: new THREE.Vector2(1, 1),
    });
    m.userData.style = 'sandstone';
    return m;
  });
}

/** Gold: metallic and reflective, never flat yellow and never glowing. */
export function gold({ tone = PALETTE.gold.leaf } = {}) {
  return cached(`gold|${tone}`, () => {
    const m = new THREE.MeshStandardMaterial({ color: tone, metalness: 0.9, roughness: 0.32 });
    m.userData.style = 'gold';
    return m;
  });
}

/** Electrum: the one metal allowed a faint glow — a pyramidion catching the night. */
export function electrum() {
  return cached('electrum', () => {
    const m = new THREE.MeshStandardMaterial({
      color: PALETTE.gold.electrum, metalness: 0.85, roughness: 0.25,
      emissive: PALETTE.gold.electrum, emissiveIntensity: 0.35,
    });
    m.userData.style = 'electrum';
    return m;
  });
}

/** Living light, at a level from the budget. */
export function lifeGlow(colour = PALETTE.life.cyan, level = GLOW.life, opts = {}) {
  return cached(`life|${colour}|${level}|${opts.roughness ?? 0.5}`, () => {
    const m = new THREE.MeshStandardMaterial({
      color: colour, emissive: colour, emissiveIntensity: level, roughness: opts.roughness ?? 0.5,
    });
    m.userData.style = 'life';
    return m;
  });
}

/** A fungal flesh material: real colour, smooth, optionally wet (clearcoat). */
export function fungusFlesh(colour, { wet = false, vertexColors = false, roughness = 0.6 } = {}) {
  return cached(`flesh|${colour}|${wet}|${vertexColors}|${roughness}`, () => {
    const m = wet
      ? new THREE.MeshPhysicalMaterial({ color: colour, roughness, clearcoat: 0.6, clearcoatRoughness: 0.35, vertexColors })
      : new THREE.MeshStandardMaterial({ color: colour, roughness, vertexColors });
    m.userData.style = 'fungus';
    return m;
  });
}

/** Every emissive level a material may have, by its style tag — for the tests. */
export function withinBudget(material) {
  const tag = material.userData?.style;
  const e = material.emissiveIntensity ?? 0;
  const black = !material.emissive || material.emissive.getHex() === 0;
  if (tag === 'sandstone' || tag === 'gold') return black || e === 0;
  if (tag === 'electrum') return e <= GLOW.glyph;
  if (tag === 'life' || tag === 'fungus') return e <= GLOW.focal;
  return true;
}

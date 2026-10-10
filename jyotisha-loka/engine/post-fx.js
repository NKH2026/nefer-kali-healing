/**
 * The cinematic end of the frame: ambient occlusion and a film grade.
 *
 * Both are what an engine like Unreal does to every frame by default and the realm
 * did not: AO puts the soft contact darkness where things meet the ground and each
 * other, and the grade gives the image one look — split-toned shadows and
 * highlights, an S-curve, a vignette, grain and a little lens fringing — instead of
 * the flat output of the tone mapper.
 *
 * Every number lives in `POST` in config.js. `?post=0` turns all of it off, for
 * comparing on a real device. The height fog and god rays below read `FOG`.
 */
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';

/**
 * Keep the glow out of the occlusion.
 *
 * GTAOPass hides points and lines while it draws its normal/depth pass, but not
 * meshes. In this world a great many meshes are light rather than matter — additive
 * glow planes, halos, the sky dome — and in the depth buffer they would cast dark
 * rings around every lamp. Anything unlit, see-through or not writing depth is
 * hidden for that pass as well; `userData.noAO` opts anything else out by hand.
 *
 * @param {import('three/examples/jsm/postprocessing/GTAOPass.js').GTAOPass} pass
 */
export function keepGlowOutOfAO(pass) {
  const notMatter = (m) =>
    !m || m.transparent || m.depthWrite === false || m.isMeshBasicMaterial || m.blending === 2; /* AdditiveBlending */
  pass.overrideVisibility = function overrideVisibility() {
    const cache = this._visibilityCache;
    this.scene.traverse((object) => {
      cache.set(object, object.visible);
      if (object.isPoints || object.isLine || object.isSprite || object.userData?.noAO) {
        object.visible = false;
        return;
      }
      if (object.isMesh) {
        const m = object.material;
        if (Array.isArray(m) ? m.every(notMatter) : notMatter(m)) object.visible = false;
      }
    });
  };
}

/**
 * Run a pass's internal buffers at a fraction of the screen. GTAO's three targets
 * are sized from `setSize` alone and sampled by UV, so a half-resolution AO blends
 * onto a full-resolution frame with nothing else to adjust.
 */
export function scalePassResolution(pass, scale) {
  const setSize = pass.setSize.bind(pass);
  pass.setSize = (w, h) => setSize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
}

/**
 * The grade. Display-referred: it runs after the tone map and the sRGB encode, and
 * after FXAA — grain before FXAA would read as edges everywhere and be smeared.
 */
export const GradeShader = {
  name: 'RealmGrade',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: [1, 1] },
    uSaturation: { value: 1 },
    uContrast: { value: 0 },
    uShadowTint: { value: [0, 0, 0] },
    uHighlightTint: { value: [0, 0, 0] },
    uVignette: { value: 0 },
    uGrain: { value: 0 },
    uAberration: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uSaturation;
    uniform float uContrast;
    uniform vec3  uShadowTint;
    uniform vec3  uHighlightTint;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p.yx + 19.19);
      return fract((p.x + p.y) * p.x);
    }

    void main() {
      vec2 d = vUv - 0.5;

      // Lens fringing: red and blue pulled apart toward the corners only.
      vec2 off = d * dot(d, d) * uAberration;
      vec3 c = vec3(
        texture2D(tDiffuse, vUv - off).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv + off).b
      );

      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSaturation);

      // Split tone: colour into the shadows and the highlights separately.
      c += uShadowTint * (1.0 - smoothstep(0.0, 0.45, l));
      c += uHighlightTint * smoothstep(0.55, 1.0, l);

      // A gentle S-curve.
      c = clamp(c, 0.0, 1.0);
      c = mix(c, c * c * (3.0 - 2.0 * c), uContrast);

      // Vignette, round on any aspect ratio.
      vec2 dv = d * vec2(uResolution.x / uResolution.y, 1.0);
      c *= mix(1.0, smoothstep(1.05, 0.25, length(dv)), uVignette);

      // Grain, strongest in the mid-tones where film shows it.
      float g = hash(vUv * uResolution + fract(uTime * 7.31) * 113.0) - 0.5;
      c += g * uGrain * (1.0 - abs(l - 0.5));

      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

/* ── depth, height fog and god rays ───────────────────────────────────────── */


/**
 * The scene render, keeping its depth.
 *
 * It replaces RenderPass at the head of the chain. RenderPass draws into whichever
 * of the composer's two buffers is current, and those swap from frame to frame, so
 * the depth of the scene is never reliably anywhere. This draws into a target of its
 * own that carries a depth texture, then copies the colour on into the chain — one
 * cheap full-screen copy — and the fog and the rays read `depthTexture` from here.
 * Sky pixels keep a depth of exactly 1: the dome is drawn at the far plane without
 * writing depth, which is how the rays tell sky from things.
 */
export class DepthRenderPass extends Pass {
  constructor(scene, camera) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.needsSwap = false;
    this.target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    this.target.depthTexture = new THREE.DepthTexture(1, 1);
    this.target.depthTexture.type = THREE.UnsignedIntType;
    const copy = new THREE.ShaderMaterial(CopyShader);
    copy.blending = THREE.NoBlending;
    copy.depthTest = false;
    copy.depthWrite = false;
    this.quad = new FullScreenQuad(copy);
  }

  get depthTexture() {
    return this.target.depthTexture;
  }

  setSize(width, height) {
    this.target.setSize(width, height);
  }

  render(renderer, writeBuffer, readBuffer) {
    const autoClear = renderer.autoClear;
    renderer.autoClear = true;
    renderer.setRenderTarget(this.target);
    renderer.render(this.scene, this.camera);
    renderer.autoClear = autoClear;
    this.quad.material.uniforms.tDiffuse.value = this.target.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    this.quad.render(renderer);
  }

  dispose() {
    this.target.dispose();
    this.quad.dispose();
  }
}

/** World position from depth, shared by both passes. */
const RECONSTRUCT = /* glsl */ `
  uniform sampler2D tDepth;
  uniform mat4 uProjInv;
  uniform mat4 uViewInv;
  vec3 worldAt(vec2 uv, float depth) {
    vec4 ndc = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 view = uProjInv * ndc;
    view /= view.w;
    return (uViewInv * view).xyz;
  }
`;

/**
 * Height fog, integrated along each view ray (the analytic form for fog that falls
 * off exponentially with height), made patchy by a slow drifting noise, and lit by
 * the moon: the closer a ray points to the moon, the brighter the mist it passes
 * through. Runs in linear HDR, before bloom, so a moonlit bank of mist can glow.
 */
export const HeightFogShader = {
  name: 'RealmHeightFog',
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uProjInv: { value: new THREE.Matrix4() },
    uViewInv: { value: new THREE.Matrix4() },
    uCamPos: { value: new THREE.Vector3() },
    uMoonDir: { value: new THREE.Vector3(0, 1, 0) },
    uFogColour: { value: new THREE.Color() },
    uMoonGlow: { value: new THREE.Color() },
    uDensity: { value: 0.02 },
    uBase: { value: 0 },
    uFalloff: { value: 0.1 },
    uNoise: { value: 0.5 },
    uTime: { value: 0 },
    /** 1 on the surface, fading to 0 underground — see `fogScaleAt`. */
    uScale: { value: 1 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uScale;
    uniform vec3 uCamPos;
    uniform vec3 uMoonDir;
    uniform vec3 uFogColour;
    uniform vec3 uMoonGlow;
    uniform float uDensity;
    uniform float uBase;
    uniform float uFalloff;
    uniform float uNoise;
    uniform float uTime;
    varying vec2 vUv;
    ${RECONSTRUCT}
    float fh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float fn(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(fh(i), fh(i + vec2(1, 0)), u.x), mix(fh(i + vec2(0, 1)), fh(i + vec2(1, 1)), u.x), u.y);
    }
    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      float depth = texture2D(tDepth, vUv).x;
      bool sky = depth >= 0.99999;
      vec3 far = worldAt(vUv, sky ? 0.9999 : depth);
      vec3 ray = far - uCamPos;
      float dist = sky ? 1600.0 : length(ray);
      vec3 rd = normalize(ray);

      // Exponential height fog, integrated from the eye to the surface.
      // Kept in step with \`heightFogAmount\` in JS, which the tests hold to its limits.
      float h0 = uCamPos.y - uBase;
      float b = uFalloff;
      float ry = abs(rd.y) < 1e-4 ? 1e-4 : rd.y;
      float amount = uDensity / b * exp(-h0 * b) * (1.0 - exp(-dist * ry * b)) / ry;
      // Never thicker than the fog at its base: below the base the formula grows
      // exponentially, and 150 m down in the Understory that was a solid wall.
      amount = min(amount, uDensity * dist) * uScale;
      // Patchy and drifting: sampled where the ray meets the low ground, or at the end
      // of short rays.
      vec3 sampleAt = uCamPos + rd * min(dist, 140.0);
      float n = fn(sampleAt.xz * 0.018 + vec2(uTime * 0.012, uTime * 0.007)) * 0.6
              + fn(sampleAt.xz * 0.05 - vec2(uTime * 0.02, 0.0)) * 0.4;
      amount *= mix(1.0, 0.35 + n * 1.3, uNoise);
      // Over the sky, only a low band of haze on the horizon.
      if (sky) amount *= (1.0 - smoothstep(0.0, 0.18, rd.y)) * 0.3;
      float trans = exp(-max(amount, 0.0));

      // Lit by the moon: forward scattering, strongest looking toward it.
      float mu = max(dot(rd, normalize(uMoonDir)), 0.0);
      vec3 light = uFogColour + uMoonGlow * (pow(mu, 10.0) * 0.9 + pow(mu, 2.0) * 0.12);
      gl_FragColor = vec4(base.rgb * trans + light * (1.0 - trans), base.a);
    }
  `,
};

/**
 * God rays: shafts of moonlight, by marching each pixel toward the moon's place on
 * screen and gathering the sky that is visible along the way. Geometry has depth
 * below 1 and gathers nothing, so a tree, a city or the member standing in front of
 * the moon cuts a shadow through the shafts — which is what makes them read as light
 * rather than as a blur.
 */
export const GodRaysShader = {
  name: 'RealmGodRays',
  defines: { SAMPLES: 40 },
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uLight: { value: new THREE.Vector2(0.5, 0.5) },
    uAspect: { value: 1 },
    uStrength: { value: 0 },
    uDensity: { value: 0.9 },
    uDecay: { value: 0.95 },
    uWeight: { value: 0.6 },
    uColour: { value: new THREE.Color() },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uLight;
    uniform float uAspect;
    uniform float uStrength;
    uniform float uDensity;
    uniform float uDecay;
    uniform float uWeight;
    uniform vec3 uColour;
    varying vec2 vUv;
    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      if (uStrength <= 0.0) { gl_FragColor = base; return; }
      vec2 delta = (vUv - uLight) * (uDensity / float(SAMPLES));
      vec2 uv = vUv;
      float illum = 1.0;
      float acc = 0.0;
      for (int i = 0; i < SAMPLES; i++) {
        uv -= delta;
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;
        float sky = step(0.99999, texture2D(tDepth, uv).x);
        // Only sky near the moon is a source: the shafts come from the moon, not from
        // every bright patch of nebula.
        vec2 d = (uv - uLight) * vec2(uAspect, 1.0);
        float near = exp(-dot(d, d) * 18.0);
        acc += sky * near * illum * uWeight;
        illum *= uDecay;
      }
      gl_FragColor = vec4(base.rgb + uColour * acc * uStrength / float(SAMPLES) * 6.0, base.a);
    }
  `,
};

/**
 * The fog along one ray, as the shader computes it (before the drifting noise):
 * exponential height fog integrated from the eye over `dist` metres, capped at the
 * density of its base, and scaled by `scale`. Pure, so the tests can check it.
 */
export function heightFogAmount({ camY, dirY, dist, density, base, falloff, scale = 1 }) {
  const h0 = camY - base;
  const ry = Math.abs(dirY) < 1e-4 ? 1e-4 : dirY;
  const amount = (density / falloff) * Math.exp(-h0 * falloff) * (1 - Math.exp(-dist * ry * falloff)) / ry;
  return Math.max(0, Math.min(amount, density * dist) * scale);
}

/**
 * How much of the valley fog applies at this camera height: all of it on the
 * surface, none of it underground. The Understory is an enclosed hall 150 m down;
 * valley mist has no business there, and through the exponential it was a wall.
 */
export function fogScaleAt(camY) {
  return THREE.MathUtils.smoothstep(camY, -60, -15);
}

const _moonAt = new THREE.Vector3();
const _camDir = new THREE.Vector3();

/**
 * Per-frame uniforms for the fog and the rays: the camera's matrices, and where the
 * moon is on screen — fading the rays out as it leaves the frame or goes behind.
 */
export function updateAtmosphere({ fog, rays, camera, moonDir, time, strength = 1 }) {
  camera.updateMatrixWorld();
  if (fog) {
    const u = fog.material.uniforms;
    u.uProjInv.value.copy(camera.projectionMatrixInverse);
    u.uViewInv.value.copy(camera.matrixWorld);
    u.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
    u.uTime.value = time;
    u.uScale.value = fogScaleAt(u.uCamPos.value.y);
  }
  if (rays) {
    const u = rays.material.uniforms;
    _moonAt.setFromMatrixPosition(camera.matrixWorld).addScaledVector(moonDir, 1000).project(camera);
    camera.getWorldDirection(_camDir);
    const facing = THREE.MathUtils.smoothstep(_camDir.dot(moonDir), 0.05, 0.55);
    const off = Math.max(Math.abs(_moonAt.x), Math.abs(_moonAt.y));
    const inFrame = 1 - THREE.MathUtils.smoothstep(off, 1.0, 1.6);
    u.uLight.value.set(_moonAt.x * 0.5 + 0.5, _moonAt.y * 0.5 + 0.5);
    u.uAspect.value = camera.aspect;
    u.uStrength.value = _moonAt.z < 1 ? facing * inFrame * strength : 0;
  }
}

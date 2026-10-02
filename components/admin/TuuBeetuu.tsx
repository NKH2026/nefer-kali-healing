/**
 * Tuu Beetuu — the galactic mushroom assistant.
 *
 * A single Three.js scene rendering a translucent, iridescent mushroom with an
 * orbital halo and a drifting spore field. Not a sprite: real geometry, a
 * custom cap shader, and additive particles.
 *
 * Performance and hygiene:
 *   - one WebGL context, created on mount and fully disposed on unmount
 *   - animation pauses when the tab is hidden (no wasted GPU on a background tab)
 *   - honours prefers-reduced-motion by freezing motion and holding a still pose
 *
 * Colour palette is derived from the site's own tokens (near-black #0a0a0a plus
 * the purple/gold used across the storefront) so the character reads as part of
 * Nefer Kali Healing rather than a bolted-on widget.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type Mood = 'idle' | 'thinking' | 'proposing' | 'happy' | 'alarmed';

interface Props {
    mood?: Mood;
    /** Rendered size in CSS pixels. */
    size?: number;
    className?: string;
}

/** Mood drives hue, pulse rate and expression. */
const MOOD: Record<Mood, {
    hueA: number; hueB: number; hueC: number;
    pulse: number;
    spin: number;
    glow: number;
    mouth: number;
}> = {
    idle: { hueA: 0.78, hueB: 0.55, hueC: 0.92, pulse: 0.35, spin: 0.16, glow: 1.0, mouth: 0.0 },
    thinking: { hueA: 0.68, hueB: 0.48, hueC: 0.86, pulse: 0.95, spin: 0.55, glow: 1.3, mouth: 0.35 },
    proposing: { hueA: 0.83, hueB: 0.62, hueC: 0.97, pulse: 0.6, spin: 0.3, glow: 1.5, mouth: 0.6 },
    happy: { hueA: 0.9, hueB: 0.42, hueC: 1.0, pulse: 0.7, spin: 0.42, glow: 1.4, mouth: 1.0 },
    alarmed: { hueA: 0.06, hueB: 0.12, hueC: 0.02, pulse: 1.4, spin: 0.7, glow: 1.6, mouth: -0.7 },
};

/** Soft radial sprite, generated once and reused for all particles. */
function makeSpriteTexture(): THREE.Texture {
    const s = 64;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

const CAP_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform float uAmp;
  varying vec3 vNormalW;
  varying vec3 vPos;
  varying vec3 vViewDir;

  // Cheap value-ish noise, enough for an organic surface ripple.
  float n3(vec3 p) {
    return sin(p.x * 2.1) * sin(p.y * 2.3 + 1.7) * sin(p.z * 2.7 + 3.1);
  }

  void main() {
    vec3 p = position;
    float breathe = 1.0 + uPulse * 0.055 * sin(uTime * 1.5);

    // Ripple travels outward from the cap centre, plus slow surface noise.
    float r = length(p.xz);
    float ripple = sin(r * 3.4 - uTime * 1.25) * 0.022 * uAmp;
    float wobble = n3(p * 1.7 + uTime * 0.35) * 0.028 * uAmp;

    p *= breathe;
    p += normal * (ripple + wobble);

    vec4 wp = modelMatrix * vec4(p, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vPos = wp.xyz;
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const CAP_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3  uA;
  uniform vec3  uB;
  uniform vec3  uC;
  uniform float uGlow;
  uniform float uSpots;
  varying vec3 vNormalW;
  varying vec3 vPos;
  varying vec3 vViewDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  // Smooth blobby field, used for the bioluminescent spot pattern.
  float blob(vec3 p) {
    float acc = 0.0;
    for (int i = 0; i < 3; i++) {
      float f = 1.0 + float(i) * 1.65;
      acc += sin(p.x * f + uTime * 0.22) * sin(p.y * f * 0.92 + 3.1) * sin(p.z * f + uTime * 0.17) / f;
    }
    return acc;
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(vViewDir);

    // Iridescence: viewing angle shifts the hue.
    float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.1);

    float t = uTime * 0.075;
    vec3 col = mix(uA, uB, 0.5 + 0.5 * sin(blob(vPos * 1.15) * 2.4 + t * 6.2831));
    col = mix(col, uC, fres * 0.95);

    // Glowing spots.
    float field = blob(vPos * 1.85 + 4.0);
    float spots = smoothstep(0.22, 0.72, field);
    col += uC * spots * 0.85 * uSpots;

    // Faint facet sparkle so it reads as crystalline rather than rubbery.
    float sp = hash(floor(vPos * 26.0));
    col += vec3(1.0) * step(0.993, sp) * 0.7;

    // Rim emission — the glowing edge that sells "translucent alien fungus".
    col += uC * fres * uGlow * 0.85;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const TuuBeetuu: React.FC<Props> = ({ mood = 'idle', size = 132, className }) => {
    const hostRef = useRef<HTMLDivElement>(null);

    // Live mood, read every frame so a prop change never rebuilds the scene.
    const moodRef = useRef<Mood>(mood);
    moodRef.current = mood;

    // Smoothed values, so mood changes glide instead of snapping.
    const smooth = useRef({ ...MOOD[mood] });

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const reduceMotion =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // ---------------------------------------------------------------- setup
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'low-power',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(size, size, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
        camera.position.set(0, 0.35, 8.2);
        camera.lookAt(0, 0.05, 0);

        // --------------------------------------------------------------- lights
        scene.add(new THREE.AmbientLight(0x5b4b8a, 1.15));

        const key = new THREE.PointLight(0xc9a0ff, 26, 22, 2);
        key.position.set(2.6, 3.4, 3.2);
        scene.add(key);

        const rim = new THREE.PointLight(0x49e0d0, 18, 20, 2);
        rim.position.set(-3.0, -1.2, -2.4);
        scene.add(rim);

        const gold = new THREE.PointLight(0xffcf6b, 10, 16, 2);
        gold.position.set(-1.6, 2.2, -2.6);
        scene.add(gold);

        // ------------------------------------------------------------- the body
        const root = new THREE.Group();
        scene.add(root);

        const capUniforms = {
            uTime: { value: 0 },
            uPulse: { value: 0.35 },
            uAmp: { value: 1 },
            uA: { value: new THREE.Color('#6a34d6') },
            uB: { value: new THREE.Color('#2fbfa8') },
            uC: { value: new THREE.Color('#ff77e1') },
            uGlow: { value: 1 },
            uSpots: { value: 0.9 },
        };

        // Cap: a sphere squashed into a dome, with the underside pulled concave
        // so it reads as a real mushroom cap rather than half a ball.
        const capGeo = new THREE.SphereGeometry(1.55, 72, 48);
        {
            const pos = capGeo.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < pos.count; i++) {
                let x = pos.getX(i);
                let y = pos.getY(i) * 0.8;
                let z = pos.getZ(i);
                if (y < 0) y *= 0.5; // flatten and lift the underside
                // Gentle scallop around the rim, varies with angle.
                const a = Math.atan2(z, x);
                const rimBand = Math.max(0, 1 - Math.abs(y + 0.15) * 2.2);
                const scallop = 1 + Math.sin(a * 6) * 0.045 * rimBand;
                x *= scallop;
                z *= scallop;
                pos.setXYZ(i, x, y, z);
            }
            capGeo.computeVertexNormals();
        }

        const capMat = new THREE.ShaderMaterial({
            uniforms: capUniforms,
            vertexShader: CAP_VERT,
            fragmentShader: CAP_FRAG,
        });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 0.92;
        root.add(cap);

        const capGroup = new THREE.Group();
        capGroup.position.y = 0.92;
        root.add(capGroup);

        // Stem: tapered lathe with a slight organic curve.
        const stemProfile: THREE.Vector2[] = [];
        for (let i = 0; i <= 24; i++) {
            const t = i / 24;
            const y = -1.95 + t * 2.35;
            // narrow waist, flared base
            const r = 0.30 + 0.30 * Math.pow(1 - t, 2.2) + 0.05 * Math.sin(t * Math.PI);
            stemProfile.push(new THREE.Vector2(Math.max(r, 0.12), y));
        }
        const stemGeo = new THREE.LatheGeometry(stemProfile, 48);
        const stemMat = new THREE.MeshPhysicalMaterial({
            color: '#e8d9ff',
            roughness: 0.42,
            metalness: 0.05,
            clearcoat: 0.5,
            clearcoatRoughness: 0.35,
            sheen: 1,
            sheenColor: new THREE.Color('#8f5cff'),
            emissive: new THREE.Color('#2a1650'),
            emissiveIntensity: 0.55,
        });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        root.add(stem);

        // Gills: a shallow cone tucked under the cap, glowing from within.
        const gillGeo = new THREE.ConeGeometry(1.3, 0.5, 64, 1, true);
        const gillMat = new THREE.MeshBasicMaterial({
            color: '#ffb3f0',
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const gills = new THREE.Mesh(gillGeo, gillMat);
        gills.rotation.x = Math.PI;
        gills.position.y = 0.44;
        root.add(gills);

        // --------------------------------------------------------------- the face
        // Parented to capGroup so the face travels with the cap's wobble.
        const face = new THREE.Group();
        face.position.set(0, 0.06, 1.24);
        capGroup.add(face);

        const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
        const eyeGlowMat = new THREE.MeshBasicMaterial({ color: '#8df6ff' });
        const eyes: THREE.Mesh[] = [];
        for (const sx of [-1, 1]) {
            const white = new THREE.Mesh(new THREE.SphereGeometry(0.205, 24, 24), eyeWhiteMat);
            white.position.set(sx * 0.36, 0.1, 0);
            face.add(white);
            eyes.push(white);

            const iris = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 20), eyeGlowMat);
            iris.position.set(sx * 0.36, 0.1, 0.15);
            face.add(iris);
        }

        const mouthMat = new THREE.MeshBasicMaterial({ color: '#ffb3f0' });
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.028, 12, 32, Math.PI), mouthMat);
        mouth.position.set(0, -0.24, 0.02);
        mouth.rotation.z = Math.PI;
        face.add(mouth);

        // ------------------------------------------------------- orbital halo
        const RING_COUNT = 420;
        const ringPos = new Float32Array(RING_COUNT * 3);
        const ringCol = new Float32Array(RING_COUNT * 3);
        const ringR: number[] = [];
        for (let i = 0; i < RING_COUNT; i++) {
            const a = (i / RING_COUNT) * Math.PI * 2;
            const r = 2.7 + Math.sin(a * 5) * 0.07;
            ringR.push(r);
            ringPos[i * 3] = Math.cos(a) * r;
            ringPos[i * 3 + 1] = Math.sin(a * 3) * 0.09;
            ringPos[i * 3 + 2] = Math.sin(a) * r;
            const c = new THREE.Color().setHSL((a / (Math.PI * 2)) * 0.75 + 0.55, 0.85, 0.62);
            ringCol[i * 3] = c.r;
            ringCol[i * 3 + 1] = c.g;
            ringCol[i * 3 + 2] = c.b;
        }
        const ringGeo = new THREE.BufferGeometry();
        ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
        ringGeo.setAttribute('color', new THREE.BufferAttribute(ringCol, 3));
        const sprite = makeSpriteTexture();
        const ringMat = new THREE.PointsMaterial({
            size: 0.17,
            map: sprite,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });
        const ring = new THREE.Points(ringGeo, ringMat);
        ring.rotation.x = 0.42;
        ring.rotation.z = 0.16;
        scene.add(ring);

        // ------------------------------------------------------- spore field
        const SPORE_COUNT = 240;
        const sporePos = new Float32Array(SPORE_COUNT * 3);
        const sporeSeed: number[] = [];
        const sporeCol = new Float32Array(SPORE_COUNT * 3);
        for (let i = 0; i < SPORE_COUNT; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 1.9 + Math.random() * 3.4;
            sporePos[i * 3] = Math.cos(a) * r;
            sporePos[i * 3 + 1] = (Math.random() - 0.35) * 5.4;
            sporePos[i * 3 + 2] = Math.sin(a) * r;
            sporeSeed.push(Math.random() * Math.PI * 2);
            const c = new THREE.Color().setHSL(0.5 + Math.random() * 0.42, 0.9, 0.68);
            sporeCol[i * 3] = c.r;
            sporeCol[i * 3 + 1] = c.g;
            sporeCol[i * 3 + 2] = c.b;
        }
        const sporeGeo = new THREE.BufferGeometry();
        sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));
        sporeGeo.setAttribute('color', new THREE.BufferAttribute(sporeCol, 3));
        const sporeMat = new THREE.PointsMaterial({
            size: 0.1,
            map: sprite,
            vertexColors: true,
            transparent: true,
            opacity: 0.68,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });
        const spores = new THREE.Points(sporeGeo, sporeMat);
        scene.add(spores);

        // ---------------------------------------------------------------- resize
        const resize = () => {
            const w = host.clientWidth || size;
            const h = host.clientHeight || size;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(host);

        // ----------------------------------------------------------------- loop
        let raf = 0;
        let last = performance.now();
        let t = 0;

        // Target values, lerped toward each frame.
        const cur = smooth.current;
        const tmpA = new THREE.Color();
        const tmpB = new THREE.Color();
        const tmpC = new THREE.Color();

        const frame = (now: number) => {
            raf = requestAnimationFrame(frame);
            const dtSeconds = Math.min((now - last) / 1000, 0.1);
            last = now;

            if (document.hidden) return;

            t += dtSeconds;

            // Ease every mood parameter so transitions feel liquid, not stepped.
            const target = MOOD[moodRef.current];
            const k = 1 - Math.pow(0.001, dtSeconds); // frame-rate independent
            const anim = reduceMotion ? 0 : 1;

            cur.hueA += (target.hueA - cur.hueA) * k;
            cur.hueB += (target.hueB - cur.hueB) * k;
            cur.hueC += (target.hueC - cur.hueC) * k;
            cur.pulse += (target.pulse - cur.pulse) * k;
            cur.spin += (target.spin - cur.spin) * k;
            cur.glow += (target.glow - cur.glow) * k;
            cur.mouth += (target.mouth - cur.mouth) * k;

            // Colour drift: the hue anchor rotates slowly, so the character is
            // never quite the same colour twice.
            const drift = anim ? t * 0.035 : 0;
            tmpA.setHSL((cur.hueA + drift) % 1, 0.82, 0.55);
            tmpB.setHSL((cur.hueB + drift * 1.4) % 1, 0.8, 0.5);
            tmpC.setHSL((cur.hueC + drift * 0.7) % 1, 0.95, 0.7);

            capUniforms.uA.value.copy(tmpA);
            capUniforms.uB.value.copy(tmpB);
            capUniforms.uC.value.copy(tmpC);
            capUniforms.uTime.value = anim ? t : 0;
            capUniforms.uPulse.value = cur.pulse;
            capUniforms.uGlow.value = cur.glow;
            capUniforms.uSpots.value = 0.75 + 0.35 * Math.sin(t * 0.7);

            // Body motion: float, breathe, sway.
            const float = anim ? Math.sin(t * 0.85) * 0.14 : 0;
            root.position.y = float;
            root.rotation.z = anim ? Math.sin(t * 0.6) * 0.05 : 0;
            root.rotation.y = anim ? Math.sin(t * 0.28) * 0.22 : 0;
            cap.rotation.z = anim ? Math.sin(t * 0.9 + 0.8) * 0.045 : 0;

            // Gills pulse with the cap.
            gillMat.opacity = 0.34 + 0.2 * Math.sin(t * 1.3) * cur.pulse + 0.1;
            gillMat.color.copy(tmpC);
            mouthMat.color.copy(tmpC);
            eyeGlowMat.color.copy(tmpC);

            // Expression.
            const blink = anim ? Math.max(0, Math.sin(t * 0.55) - 0.985) * 60 : 0;
            const squash = 1 - Math.min(blink, 0.92) - cur.mouth * 0.06;
            for (const e of eyes) e.scale.set(1, squash, 1);

            mouth.scale.setScalar(1 + cur.mouth * 0.5);
            mouth.position.y = -0.24 + cur.mouth * 0.05;
            mouth.rotation.z = Math.PI - cur.mouth * 0.55;

            face.rotation.y = anim ? Math.sin(t * 0.5) * 0.08 : 0;

            // Halo counter-rotates against the body for parallax.
            ring.rotation.y += dtSeconds * cur.spin * 0.5 * anim;
            ring.rotation.x = 0.42 + (anim ? Math.sin(t * 0.4) * 0.09 : 0);
            ringMat.size = 0.15 + cur.glow * 0.04;
            ringMat.opacity = 0.72 + 0.22 * Math.sin(t * 1.1) * cur.pulse;

            // Spores drift and swirl.
            const sp = sporeGeo.attributes.position as THREE.BufferAttribute;
            const arr = sp.array as Float32Array;
            for (let i = 0; i < SPORE_COUNT; i++) {
                const s = sporeSeed[i];
                const iy = i * 3 + 1;
                arr[iy] += dtSeconds * (0.18 + (i % 5) * 0.05) * anim;
                if (arr[iy] > 2.8) arr[iy] = -2.9;
                const ix = i * 3;
                const iz = i * 3 + 2;
                arr[ix] += Math.sin(t * 0.5 + s) * dtSeconds * 0.22 * anim;
                arr[iz] += Math.cos(t * 0.43 + s) * dtSeconds * 0.22 * anim;
            }
            sp.needsUpdate = true;

            // Camera drift for a slow, living parallax.
            camera.position.x = anim ? Math.sin(t * 0.22) * 0.45 : 0;
            camera.position.y = 0.35 + (anim ? Math.cos(t * 0.18) * 0.22 : 0);
            camera.lookAt(0, 0.05, 0);

            renderer.render(scene, camera);
        };
        raf = requestAnimationFrame(frame);

        // -------------------------------------------------------------- teardown
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            renderer.dispose();
            capGeo.dispose();
            capMat.dispose();
            stemGeo.dispose();
            stemMat.dispose();
            gillGeo.dispose();
            gillMat.dispose();
            ringGeo.dispose();
            ringMat.dispose();
            sporeGeo.dispose();
            sporeMat.dispose();
            sprite.dispose();
            eyes.forEach((e) => e.geometry.dispose());
            mouth.geometry.dispose();
            mouthMat.dispose();
            eyeWhiteMat.dispose();
            eyeGlowMat.dispose();
            renderer.domElement.remove();
        };
    }, [size]);

    return (
        <div
            ref={hostRef}
            className={className}
            style={{ width: size, height: size }}
            aria-hidden="true"
        />
    );
};

export default TuuBeetuu;

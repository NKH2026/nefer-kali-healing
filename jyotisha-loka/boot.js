/**
 * Jyotisha Loka for Nefer Kali Healing — the world of light, built into a page.
 *
 * Adapted from the Per Ankh realm's world kit (worlds/boot.js): the same sky,
 * zodiac wheel, nine grahas at their real positions, panchanga, altars, time
 * travel and flying carpet, with Maa Kali dancing on the carpet in place of the
 * realm's mushroom, and the Jyotish lessons to read at its three sites.
 *
 * `bootJyotishaLoka({ mount, onExit })` builds it inside `mount` and returns
 * `dispose()`, which takes every piece of it down again — the loop, the
 * listeners, the screen furniture and the GPU memory — so leaving the page
 * leaves nothing running.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { PLAYER, QUALITY, TOUCH, POST } from './engine/config.js';
import { GradeShader } from './engine/post-fx.js';
import { Player } from './engine/player.js';
import { CameraDirector, RIDING_CHASE } from './engine/camera-director.js';
import { TouchControls } from './engine/ui/touch.js';
import { createGround, createPortal, createSite } from './engine/worlds/builders.js';
import { createWorldCarpet } from './engine/worlds/world-carpet.js';
import { createCosmosSky } from './engine/jyotish/scene.js';
import { createJyotishWorld } from './engine/jyotish/world.js';
import { JYOTISHA_LOKA, layoutSite, makeHeightAt } from './recipe.js';
import { createPanel, MODULES } from './panel.js';
import { createKaliFigure } from './kali.js';
import { el } from './dom.js';
import './engine/ui/touch.css';
import './engine/worlds/worlds.css';
import './loka.css';

/** How close is close enough to use a station, a shrine or the way out. */
const REACH = 3.4;

/** Phones and tablets get the touch controls. */
export function isTouchDevice() {
  return Boolean(globalThis.matchMedia?.('(pointer: coarse)').matches) || 'ontouchstart' in globalThis;
}

export function bootJyotishaLoka({ mount, onExit = () => {} }) {
  const recipe = JYOTISHA_LOKA;
  const touchMode = isTouchDevice();
  const cleanups = [];
  const listen = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };
  const added = []; // screen furniture to remove on the way out
  const add = (node, parent = document.body) => { parent.append(node); added.push(node); return node; };

  document.body.classList.add('world-mode', 'jl-active');
  if (touchMode) document.body.classList.add('touch-mode');

  // ---- renderer and scene
  const canvas = el('canvas', { class: 'jl-canvas' });
  mount.append(canvas);
  added.push(canvas);
  const presetName = touchMode ? 'low' : 'high';
  const quality = { name: presetName, ...QUALITY.presets[presetName] };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = Boolean(quality.shadows);
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const P = recipe.palette;
  renderer.setClearColor(P.fog);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(P.fog, P.fogDensity);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);

  const heightAt = makeHeightAt(recipe);
  scene.add(createGround(recipe, heightAt, { segments: quality.name === 'low' ? 96 : 160 }));
  const sky = createCosmosSky(P);
  scene.add(sky.mesh);
  const hemi = new THREE.HemisphereLight(P.ambient, 0x0a0705, 1.0);
  const key = new THREE.DirectionalLight(P.key, 0.8);
  key.position.set(40, 80, 30);
  key.castShadow = Boolean(quality.shadows);
  Object.assign(key.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 10, far: 220 });
  key.shadow.mapSize.set(1024, 1024);
  scene.add(hemi, key, key.target);

  // ---- the three sites: each module's lessons at its stations, its shrine behind
  const sites = recipe.sites.map((site) => {
    const m = MODULES[site.module];
    const layout = layoutSite(site, { lessons: m?.lessons?.length || 3 });
    const built = createSite(site, layout, heightAt, (m?.lessons || []).map((l) => l.id));
    built.setState('open', new Set());
    scene.add(built.group);
    return { site, layout, built };
  });
  const portal = createPortal(recipe.portal, heightAt);
  scene.add(portal.group);

  // ---- the body
  const director = new CameraDirector(camera, {
    mode: 'chase',
    sens: { get lookSensitivity() { return TOUCH.lookSensitivity; }, invertY: false, maxPitch: PLAYER.maxPitch },
  });
  const player = new Player(camera, canvas, { groundAt: heightAt, respawnY: -40 });
  player.setColliders([]);
  const ground = recipe.terrain || {};
  const walkable = (ground.wallHeight ?? 1) < 0 ? (ground.wallStart ?? 0.85) * recipe.radius - 2 : recipe.radius - 6;
  player.setBounds([{ x: 0, z: 0, radius: walkable }]);
  player.aim = director;
  director.attachWorld({ colliders: [] });
  director.followControls = !touchMode;
  director.adoptFromCamera();
  player.reset(recipe.spawn);

  // The flying carpet, as in the realm — open to whoever reaches this page (the
  // page itself is for administrators).
  const flight = createWorldCarpet({ scene, player, heightAt, access: { role: 'admin' }, recipe, walkRadius: walkable });
  let climbHeld = false;
  let descendHeld = false;

  // Maa Kali, who dances as the carpet flies.
  const kali = createKaliFigure();
  scene.add(kali.root);

  // ---- post
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), quality.bloomStrength, 0.62, 0.7);
  bloom.enabled = quality.bloom;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const fxaa = new ShaderPass(FXAAShader);
  composer.addPass(fxaa);
  const grade = new ShaderPass(GradeShader);
  grade.material.uniforms.uSaturation.value = POST.grade.saturation;
  grade.material.uniforms.uContrast.value = POST.grade.contrast;
  grade.material.uniforms.uVignette.value = POST.grade.vignette;
  grade.material.uniforms.uGrain.value = POST.grade.grain;
  composer.addPass(grade);
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    const r = renderer.getPixelRatio();
    fxaa.material.uniforms.resolution.value.set(1 / (w * r), 1 / (h * r));
    if (grade.material.uniforms.uResolution) grade.material.uniforms.uResolution.value = [w * r, h * r];
  }
  listen(window, 'resize', onResize);
  onResize();

  // ---- the screen: a message line, the prompt, and the cards
  const toastNode = add(el('div', { class: 'jl-toast hidden', role: 'status' }));
  let toastTimer = 0;
  const toast = (text, seconds = 2.6) => {
    toastNode.textContent = text;
    toastNode.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastNode.classList.add('hidden'), seconds * 1000);
  };
  cleanups.push(() => clearTimeout(toastTimer));
  const prompt = add(el('div', { class: 'pa-world-prompt hidden' }));
  const hudColumn = add(el('div', { class: 'pa-world-cards' }));
  const standing = el('section', { class: 'jl-card pa-world-standing' },
    el('p', { class: 'jl-card-title', text: recipe.name.toUpperCase() }),
    el('p', { text: 'Three foundations of Jyotish, the Vedic science of light. Walk to a site and read.' }),
    el('button', { type: 'button', class: 'jl-ctl', onclick: () => leave() }, 'Leave the world'));
  hudColumn.append(standing);

  let started = false;
  const panel = createPanel({
    onOpen: () => { if (!touchMode && player.isLocked) document.exitPointerLock?.(); },
    onClose: () => { if (!touchMode && started) { try { player.lock(); } catch { /* click to resume */ } } },
  });
  added.push(panel.root);

  const jyotish = createJyotishWorld({ scene, recipe, heightAt, panel, toast, touchMode, quality: quality.name, sky, hud: hudColumn });

  // ---- what is in reach
  function inReach() {
    const p = player.position;
    let best = null;
    const consider = (d, target) => { if (d < REACH && (!best || d < best.d)) best = { d, ...target }; };
    for (const s of sites) {
      s.built.stations.forEach((st, index) => consider(Math.hypot(p.x - st.at.x, p.z - st.at.z), { kind: 'lesson', s, index }));
      const sh = s.built.shrine.at;
      consider(Math.hypot(p.x - sh.x, p.z - sh.z) - 1.5, { kind: 'shrine', s });
    }
    consider(Math.hypot(p.x - recipe.portal.x, p.z - recipe.portal.z) - 1, { kind: 'portal' });
    for (const spot of jyotish.spots) {
      const d = spot.distance ? spot.distance(p) : Math.hypot(p.x - spot.x, p.z - spot.z) - spot.radius + REACH * 0.5;
      consider(d, { kind: 'spot', spot });
    }
    if (flight.riding && !(best?.kind === 'spot' && best.spot.inFlight)) return null;
    return best;
  }

  function labelFor(target) {
    if (!target) return null;
    if (target.kind === 'portal') return 'Leave the world';
    if (target.kind === 'spot') return target.spot.label();
    const m = MODULES[target.s.site.module];
    if (target.kind === 'shrine') return `${target.s.site.name}: key terms`;
    const lesson = m?.lessons?.[target.index];
    return lesson ? `Read: ${lesson.title}` : 'Read';
  }

  function enterFlightUI() {
    touch?.setFlying(true);
    climbHeld = false;
    descendHeld = false;
    player.setTouchMove(0, 0);
    player.setSprinting(false);
  }
  function leaveFlightUI() {
    touch?.setFlying(false);
    climbHeld = false;
    descendHeld = false;
    player.setSprinting(false);
  }
  function callCarpet() {
    if (!started) return;
    const r = flight.call();
    if (r.ok) toast(`The carpet is on its way — about ${Math.max(1, Math.round(r.eta))}s`, 2.6);
    else toast({ here: 'The carpet is right here', riding: 'You are already on it', 'already coming': 'It is already on its way' }[r.reason] || 'The carpet cannot come just now', 2.4);
  }

  function act() {
    if (!started || panel.isOpen) return;
    const target = inReach();
    if (flight.riding) {
      if (target?.kind === 'spot') { target.spot.act(); return; }
      const r = flight.dismount();
      if (r === 'ask') { toast('No ground below — press E again to step off anyway', 2.8); return; }
      leaveFlightUI();
      toast(r === 'landed' ? 'Kali steps down from the carpet' : 'You let go…', 2);
      return;
    }
    if (!target) {
      if (flight.canMount() && flight.mount()) {
        enterFlightUI();
        toast(touchMode ? 'The carpet lifts, and Kali dances — JUMP climbs, DIVE descends' : 'The carpet lifts, and Kali dances — Space climbs, Shift dives, E steps off', 3.4);
      }
      return;
    }
    if (target.kind === 'portal') { leave(); return; }
    if (target.kind === 'spot') { target.spot.act(); return; }
    if (target.kind === 'shrine') { panel.openShrine(target.s.site.module); return; }
    panel.openLesson(target.s.site.module, target.index);
  }

  let leaving = false;
  function leave() {
    if (leaving) return;
    leaving = true;
    onExit();
  }

  // ---- input
  listen(window, 'keydown', (e) => {
    if (e.repeat || panel.isOpen) return;
    if (jyotish.onKey(e.code)) return;
    if (e.code === 'KeyE' || e.code === 'Enter') act();
    else if (e.code === 'KeyV') director.cycle();
    else if (e.code === 'KeyC') callCarpet();
    else if (e.code === 'KeyZ' || e.code === 'KeyX') kali.motion.play('flourish');
  });
  let touch = null;
  if (touchMode) {
    touch = new TouchControls(canvas, {
      onLook: (yaw, pitch) => player.look(yaw, TOUCH.invertY ? -pitch : pitch),
      onMove: (x, y) => player.setTouchMove(x, y),
      onJump: (held = true) => {
        if (flight.riding) { climbHeld = held; return; }
        player.touchJumpHeld = held;
        if (held) player.requestJump();
      },
      onSprint: (on) => player.setSprinting(on),
      onDescend: (held = true) => { descendHeld = held; },
      onAction: () => act(),
      onCall: () => callCarpet(),
      onEmote: () => kali.motion.play('flourish'),
    });
    added.push(touch.root);
    cleanups.push(() => touch.disable?.());
    // Only the buttons that do something here.
    for (const id of ['#btn-fire', '#btn-wardrobe', '#btn-dash', '#btn-pulse', '#btn-sight']) touch.root?.querySelector(id)?.classList.add('hidden');
  }

  // ---- the way in
  const startButton = el('button', { type: 'button', class: 'jl-ctl jl-ctl--primary jl-enter' }, 'Enter');
  const overlay = add(el('div', { class: 'jl-overlay' },
    el('div', { class: 'jl-overlay-inner' },
      el('p', { class: 'jl-kicker', text: 'Nefer Kali Healing' }),
      el('h1', { text: recipe.name }),
      el('p', { class: 'jl-tagline', text: recipe.tagline }),
      startButton,
      el('p', { class: 'jl-hint', text: touchMode
        ? 'Left thumb to walk, right to look. The action button reads, and rides the carpet.'
        : 'WASD to walk, mouse to look, E to read and to ride the carpet, V for the camera.' }),
      el('button', { type: 'button', class: 'jl-link', onclick: () => leave() }, '← Back'))));
  startButton.addEventListener('click', () => {
    if (started) return;
    started = true;
    overlay.classList.add('gone');
    toast('Walk to a site and press E (or the action button) to read. The carpet waits by the way in — ride it out to the grahas.', 7);
    if (touchMode) touch.enable();
    else { try { player.lock(); } catch { /* click the world */ } }
  });
  listen(canvas, 'click', () => {
    if (!touchMode && started && !player.isLocked && !panel.isOpen) {
      try { player.lock(); } catch { /* click again */ }
    }
  });

  const seatAt = new THREE.Vector3();
  const SEAT_FLIP = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

  // ---- the loop
  let last = performance.now();
  let t = 0;
  let shownLabel = null;
  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    const live = started && !leaving && !panel.isOpen;
    const riding = flight.riding;
    if (riding) {
      flight.update(live ? dt : 0, flight.input({ keys: player.keys, touchMove: touch?.move, climb: climbHeld, descend: descendHeld, sprint: player.isSprinting }));
    } else {
      if (live) player.update(dt);
      flight.update(live ? dt : 0, {});
    }
    player.syncCamera();
    director.ridingScale = riding ? RIDING_CHASE.carpet : null;
    director.update(player.eyes, live ? dt : 0, { instant: !started });

    kali.root.visible = !director.isFirstPerson;
    if (kali.root.visible) {
      const v = player.velocity;
      kali.motion.step(live ? dt : 0.016, { vx: riding ? 0 : v.x, vy: riding ? 0 : v.y, vz: riding ? 0 : v.z, grounded: riding || player.onGround, riding });
      kali.sync();
      if (riding) {
        // Standing on the rug — dancing — banking and pitching with it.
        const rug = flight.carpet.group;
        rug.updateMatrixWorld();
        kali.root.position.copy(rug.localToWorld(seatAt.set(0, 0.12, 0.1)));
        kali.root.quaternion.copy(rug.quaternion).multiply(SEAT_FLIP);
      } else {
        kali.root.position.copy(player.position);
      }
    }

    sky.update(t);
    portal.update(t);
    for (const s of sites) s.built.update(t);
    jyotish.update(dt, t, { started: started && !leaving, paused: panel.isOpen });

    const reach = started && !panel.isOpen ? inReach() : null;
    const label = reach ? labelFor(reach)
      : started && !panel.isOpen && !riding && flight.canMount() ? 'Ride the carpet with Kali'
        : null;
    if (label !== shownLabel) {
      shownLabel = label;
      prompt.textContent = label ? `${touchMode ? '' : 'E — '}${label}` : '';
      prompt.classList.toggle('hidden', !label);
      touch?.setAction(label ? { actionLabel: label.length > 14 ? 'USE' : label.toUpperCase(), canMount: true } : null);
    }

    composer.render();
  }
  frame();

  // ---- the way out: everything this world made, taken down again
  return function dispose() {
    cancelAnimationFrame(raf);
    for (const fn of cleanups.splice(0)) { try { fn(); } catch { /* already gone */ } }
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch { /* not locked */ }
    try { player.dispose(); } catch { /* fine */ }
    jyotish.setVisible?.(false);
    for (const node of added.splice(0)) node.remove();
    document.body.classList.remove('world-mode', 'jl-active', 'touch-mode');
    scene.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose?.();
      }
    });
    composer.dispose?.();
    renderer.dispose();
    renderer.forceContextLoss?.();
  };
}

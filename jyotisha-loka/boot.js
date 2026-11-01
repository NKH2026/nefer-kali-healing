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
import { createTour } from './engine/tour.js';
import { buildShots, grahaFrame, TOUR_STOPS } from './engine/shots.js';
import { createOfferings } from './engine/scenes/offerings.js';
import { createJourney } from './engine/scenes/journey.js';
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

export function bootJyotishaLoka({
  mount,
  onExit = () => {},
  mode = 'explore',
  /** Whether this mode draws its own stop bar. A page with its own navigation passes false. */
  chrome = true,
  /** Called once with a handle the page can drive: { goTo, next, prev, stops }. */
  onReady = null,
}) {
  const recipe = JYOTISHA_LOKA;
  /**
   * Two ways to be in this world, and they share everything except the camera
   * and the input:
   *
   *   explore  the realm as it has always been — a body, pointer lock, the
   *            walking physics, and the carpet to fly.
   *   tour     the home-page prototype — no body, no pointer lock, no free
   *            movement at all. A rig flies between a handful of stops.
   *
   * The whole of the difference is this flag; the world below is built the same.
   */
  const touring = mode === 'tour';
  /**
   * A coarse pointer means "phone or tablet", and that is a fact about the
   * DEVICE — not about whether the tour draws touch controls. Quality must
   * follow the device, or a phone touring the world would get the desktop
   * preset: full-resolution bloom, shadows and twice the pixels, which is the
   * difference between smooth and a slideshow on exactly the devices that
   * cannot afford it.
   */
  const coarsePointer = isTouchDevice();
  const touchMode = coarsePointer && !touring;
  const cleanups = [];
  const listen = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };
  const added = []; // screen furniture to remove on the way out
  const add = (node, parent = document.body) => { parent.append(node); added.push(node); return node; };

  document.body.classList.add('world-mode', 'jl-active');
  /**
   * Explore owns the whole window and locks the page behind it. A tour sits
   * BEHIND the document instead — the sections scroll over the canvas — so the
   * page must keep scrolling normally. Same class, opposite requirement.
   */
  if (!touring) document.body.classList.add('viewport-locked');
  if (touchMode) document.body.classList.add('touch-mode');

  // ---- renderer and scene
  const canvas = el('canvas', { class: 'jl-canvas' });
  mount.append(canvas);
  added.push(canvas);
  const presetName = coarsePointer ? 'low' : 'high';
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
  /**
   * Fog is what gives the island its depth, but the sky tour is fought at
   * 250 m: at the island's density the far grahas (Śani, Rāhu, Ketu at 232–252)
   * come out ~67 % fogged, which turns half the districts into ghosts. The sky
   * gets its own, far lighter air.
   */
  scene.fog = new THREE.FogExp2(P.fog, touring ? 0.0011 : P.fogDensity);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);

  const heightAt = makeHeightAt(recipe);
  // The island is for walking on. The sky tour has no ground at all.
  if (!touring) scene.add(createGround(recipe, heightAt, { segments: quality.name === 'low' ? 96 : 160 }));
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
  //
  // Island-only. The sky tour has no lesson stations to walk up to.
  const sites = [];
  let portal = null;
  if (!touring) {
    for (const site of recipe.sites) {
      const m = MODULES[site.module];
      const layout = layoutSite(site, { lessons: m?.lessons?.length || 3 });
      const built = createSite(site, layout, heightAt, (m?.lessons || []).map((l) => l.id));
      built.setState('open', new Set());
      scene.add(built.group);
      sites.push({ site, layout, built });
    }
    portal = createPortal(recipe.portal, heightAt);
    scene.add(portal.group);
  }

  // ---- the body
  //
  // In tour mode there is no body at all: `player` and `flight` stay null, the
  // CameraDirector is never constructed, and the tour rig owns the camera. Every
  // use of `player` or `flight` below is guarded by `touring` or by `?.`.
  let director = null;
  let player = null;
  let flight = null;
  if (!touring) {
    director = new CameraDirector(camera, {
      mode: 'chase',
      sens: { get lookSensitivity() { return TOUCH.lookSensitivity; }, invertY: false, maxPitch: PLAYER.maxPitch },
    });
    player = new Player(camera, canvas, { groundAt: heightAt, respawnY: -40 });
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
    flight = createWorldCarpet({ scene, player, heightAt, access: { role: 'admin' }, recipe, walkRadius: walkable });
  }
  let climbHeld = false;
  let descendHeld = false;

  // Maa Kali, who dances as the carpet flies.
  const kali = createKaliFigure();
  scene.add(kali.root);
  if (touring) {
    // Nothing carries her in the sky, and there is no ground to dance on. She
    // returns when the Community district gives her a drum circle to dance in.
    kali.root.visible = false;
  }

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
  if (touring) {
    // The panchanga card and the reach prompt belong to a walker. The world
    // itself is untouched — only the furniture that assumes a body is hidden.
    hudColumn.style.display = 'none';
    prompt.style.display = 'none';
  }

  /**
   * A tour is already "in": there is no pointer lock to acquire, so the world
   * starts live rather than waiting behind the Enter overlay.
   */
  let started = touring;
  const panel = createPanel({
    onOpen: () => { if (!touchMode && player?.isLocked) document.exitPointerLock?.(); },
    onClose: () => { if (!touchMode && started && player) { try { player.lock(); } catch { /* click to resume */ } } },
  });
  added.push(panel.root);

  const jyotish = createJyotishWorld({ scene, recipe, heightAt, panel, toast, touchMode, quality: quality.name, sky, hud: hudColumn, island: !touring, camera });

  // ---- the sky districts
  //
  // Each is placed against tonight's real positions: the market a little
  // outside where Venus is, the road where Saturn is. Both turn so their local
  // +X follows the orbit, which keeps a scene framed correctly as the graha
  // moves round the wheel.
  //
  // `drop` is how far a district's own origin sits below the point the camera
  // aims at — a barge deck is a few metres down, a road that climbs 26 metres
  // starts that far below its midpoint.
  const DROP = { wellness: -3.2, journey: -13 };

  function placeDistrict(build, stopId) {
    const stop = TOUR_STOPS.find((s) => s.id === stopId);
    if (!stop || !stop.graha) return null;
    const frame = grahaFrame(jyotish.positions, stop.graha);
    const district = build();
    const out = stop.out ?? 0;
    district.group.position.set(
      frame.x + Math.cos(frame.angle) * out - Math.sin(frame.angle) * (stop.along ?? 0),
      frame.y + (stop.lift ?? 0) + (DROP[stopId] ?? 0),
      frame.z - Math.sin(frame.angle) * out - Math.cos(frame.angle) * (stop.along ?? 0),
    );
    district.group.rotation.y = frame.angle + Math.PI / 2;
    scene.add(district.group);
    return district;
  }

  const offerings = touring ? placeDistrict(() => createOfferings(), 'wellness') : null;
  const journey = touring ? placeDistrict(() => createJourney(), 'journey') : null;

  // ---- the tour: a rig, and the buttons that drive it
  //
  // Prototype furniture, deliberately inline-styled: this is a feel test, not
  // the finished layer. It exists so the three stops can be reached without a
  // navbar, a scroll position or a raycast.
  let tourBar = null;
  function showStop(stop) {
    if (!tourBar || !stop) return;
    tourBar.querySelector('[data-jl-tour-title]').textContent = stop.title;
    for (const b of tourBar.querySelectorAll('[data-jl-tour-go]')) {
      const on = b.dataset.jlTourGo === stop.id;
      b.style.opacity = on ? '1' : '0.55';
      b.style.borderColor = on ? '#f1d38a' : 'rgba(241,211,138,0.3)';
    }
  }
  const tour = touring ? createTour({ camera, stops: buildShots({ positions: jyotish.positions }), onStop: showStop }) : null;
  if (tour && typeof onReady === 'function') {
    // Everything the page needs to drive the world, and nothing else: the page
    // owns scroll, the navbar and the sections; the world only knows how to fly.
    onReady({
      goTo: (id, opts) => tour.goTo(id, opts),
      next: () => tour.next(),
      prev: () => tour.prev(),
      stops: tour.STOPS,
      /** Hand the market its products: (0 = Sea Moss, 1 = Women's Wellness, 2 = Sacred Plants). */
      setProducts: (slot, urls) => offerings?.setProducts(slot, urls),
    });
  }
  if (touring && chrome) {
    const pill = 'cursor:pointer;border-radius:999px;padding:9px 15px;font-size:11px;'
      + 'letter-spacing:.14em;text-transform:uppercase;backdrop-filter:blur(6px);';
    tourBar = add(el('div', {
      role: 'navigation',
      'aria-label': 'Tour stops',
      style: 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:50;'
        + 'display:flex;flex-direction:column;gap:10px;align-items:center;max-width:94vw;'
        + "font-family:Montserrat,sans-serif;",
    },
      el('p', {
        'data-jl-tour-title': 'true',
        style: 'margin:0;font-family:"Cormorant Garamond",serif;font-size:21px;letter-spacing:.04em;'
          + 'color:#f1d38a;text-align:center;text-shadow:0 2px 14px rgba(0,0,0,.85);',
      }),
      el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center;' },
        ...tour.STOPS.map((s) => el('button', {
          type: 'button',
          'data-jl-tour-go': s.id,
          onclick: () => tour.goTo(s.id),
          style: `${pill}background:rgba(10,4,28,.72);color:#f4ecff;`
            + 'border:1px solid rgba(241,211,138,.3);opacity:.55;',
        }, s.label)),
        el('button', {
          type: 'button',
          onclick: () => leave(),
          style: `${pill}background:transparent;color:rgba(244,236,255,.6);`
            + 'border:1px solid rgba(244,236,255,.2);',
        }, 'Leave')),
    ));
    showStop(tour.STOPS[0]);
  }

  // ---- what is in reach
  function inReach() {
    if (touring) return null;
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
    if (touring || !started) return;
    const r = flight.call();
    if (r.ok) toast(`The carpet is on its way — about ${Math.max(1, Math.round(r.eta))}s`, 2.6);
    else toast({ here: 'The carpet is right here', riding: 'You are already on it', 'already coming': 'It is already on its way' }[r.reason] || 'The carpet cannot come just now', 2.4);
  }

  function act() {
    if (touring || !started || panel.isOpen) return;
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
    // When a page draws its own chrome it also owns the keys: two systems
    // driving the camera would desync from the scroll position.
    if (touring && chrome) {
      // Arrow keys move along the stops; 1-3 jump straight to one.
      if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); tour.next(); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); tour.prev(); }
      else if (e.code === 'Escape') leave();
      else if (/^Digit[1-9]$/.test(e.code)) {
        const stop = tour.STOPS[Number(e.code.slice(5)) - 1];
        if (stop) tour.goTo(stop.id);
      }
      return;
    }
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
  //
  // Only for a walker. A tour is already in, and pointer lock is exactly the
  // thing the tour must not take: it would hide the cursor and capture the
  // mouse on a page whose whole point is clicking things.
  if (!touring) {
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
  }

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
    if (touring) {
      // One writer to the camera: the rig.
      tour.update(live ? dt : 0, t);
      if (kali.root.visible) {
        kali.motion.step(live ? dt : 0.016, { vx: 0, vy: 0, vz: 0, grounded: true, riding: false });
        kali.sync();
      }
    } else {
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
    }

    sky.update(t);
    portal?.update(t);
    offerings?.update(t, dt);
    journey?.update(t);
    for (const s of sites) s.built.update(t);
    jyotish.update(dt, t, { started: started && !leaving, paused: panel.isOpen });

    const reach = started && !panel.isOpen && !touring ? inReach() : null;
    const label = reach ? labelFor(reach)
      : !touring && started && !panel.isOpen && !flight.riding && flight.canMount() ? 'Ride the carpet with Kali'
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
    try { tour?.dispose(); } catch { /* fine */ }
    try { player?.dispose(); } catch { /* fine */ }
    jyotish.setVisible?.(false);
    for (const node of added.splice(0)) node.remove();
    document.body.classList.remove('world-mode', 'jl-active', 'touch-mode', 'viewport-locked');
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

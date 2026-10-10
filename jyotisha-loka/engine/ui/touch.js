/**
 * Touch controls for phones and tablets.
 *
 * Pointer Lock does not exist on touch devices, so mobile needs a different
 * input model entirely:
 *
 *   left thumb   a virtual stick. The base appears wherever you first touch in
 *                the lower-left zone, so it follows your hand rather than
 *                forcing you to find a fixed widget.
 *   right thumb  drag anywhere else to look around.
 *
 * Both work at once (multi-touch), which is the whole point -- you need to be
 * able to turn while walking.
 *
 * Output is deliberately dumb: a movement vector, a look delta and a few boolean
 * buttons, pushed into the Player or the carpet. All the movement physics stays
 * in one place.
 *
 * ── Flight mode ─────────────────────────────────────────────────────────────
 *
 * The same widgets are reused when the player is on the carpet, with only their
 * LABELS changed:
 *
 *   the stick     reads as throttle (forward/back) and turn (left/right), which
 *                 maps onto the carpet's own controls exactly.
 *   JUMP -> CLIMB nothing to jump from, and the button is already under the thumb
 *                 that is not steering.
 *   RUN  -> DIVE  the same hold, meaning the other vertical direction.
 *   MOUNT         appears when there is something in reach to board or use.
 *
 * That is the whole mobile scheme: no new gesture to learn, and the button you
 * were already pressing keeps meaning "go up".
 */
import { TOUCH } from '../config.js';

export class TouchControls {
  constructor(element, { onLook, onMove, onJump, onSprint, onAction, onDescend, onFire, onCall, onEmote, onWardrobe, onDash, onPulse, onSight } = {}) {
    this.el = element;
    this.onLook = onLook || (() => {});
    this.onMove = onMove || (() => {});
    this.onJump = onJump || (() => {});
    this.onSprint = onSprint || (() => {});
    /** Mount/dismount, and open the thing in reach. */
    this.onAction = onAction || (() => {});
    /** Held to descend while riding. */
    this.onDescend = onDescend || (() => {});
    /** Throw a mushroom. A tap, so it can be mashed. */
    this.onFire = onFire || (() => {});
    this.onCall = onCall || (() => {});
    this.onEmote = onEmote || (() => {});
    // Lifecycle powers (lifecycle.js): their buttons stay hidden until unlocked.
    this.onDash = onDash || (() => {});
    this.onPulse = onPulse || (() => {});
    this.onSight = onSight || (() => {});
    this.onWardrobe = onWardrobe || (() => {});

    this.enabled = false;
    /**
     * True while the player is on the carpet. Changes what JUMP means and
     * reveals the MOUNT button; it does not change the input model at all.
     */
    this.flying = false;
    /** Which pointer id owns the stick / the look, so they never get confused. */
    this.stickId = null;
    this.lookId = null;
    this.stickOrigin = { x: 0, y: 0 };
    this.stickCurrent = { x: 0, y: 0 };
    this.move = { x: 0, y: 0 };
    this.look = { x: 0, y: 0 };

    this._buildDom();
    this._buildButtons();

    this._onDown = (e) => this._handleDown(e);
    this._onMoveEvt = (e) => this._handleMove(e);
    this._onUp = (e) => this._handleUp(e);
    this._onCancel = (e) => this._handleUp(e);
  }

  /** True when the device has no real mouse -- i.e. touch is the only input. */
  static isTouchDevice() {
    if (typeof window === 'undefined') return false;
    // A coarse pointer with no hover is the reliable signal for a phone/tablet.
    const coarse = window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches;
    const touchPoints = (navigator.maxTouchPoints || 0) > 0;
    return Boolean(coarse && touchPoints);
  }

  _buildDom() {
    const root = document.createElement('div');
    root.id = 'touch-controls';
    root.innerHTML = `
      <div id="stick" class="hidden">
        <div id="stick-base"><div id="stick-knob"></div></div>
      </div>
      <div id="look-hint">drag to look</div>
      <div id="touch-buttons">
        <button id="btn-jump" class="touch-btn" type="button">
          <span class="tb-icon">▲</span><span class="tb-text">JUMP</span>
        </button>
        <button id="btn-run" class="touch-btn" type="button">
          <span class="tb-icon">»</span><span class="tb-text">RUN</span>
        </button>
        <button id="btn-dash" class="touch-btn hidden" type="button" aria-label="Root-dash">
          <span class="tb-icon">➶</span><span class="tb-text">DASH</span>
        </button>
        <button id="btn-action" class="touch-btn hidden" type="button">
          <span class="tb-icon">✦</span><span class="tb-text">MOUNT</span>
        </button>
        <button id="btn-fire" class="touch-btn" type="button">
          <span class="tb-icon">✦</span><span class="tb-text">SPORE</span>
        </button>
        <button id="btn-call" class="touch-btn" type="button" aria-label="Call the carpet">
          <span class="tb-icon">⇲</span><span class="tb-text">CALL</span>
        </button>
      </div>
      <div id="touch-identity">
        <button id="btn-pulse" class="touch-btn hidden" type="button" aria-label="Light pulse">
          <span class="tb-icon">◎</span><span class="tb-text">PULSE</span>
        </button>
        <button id="btn-sight" class="touch-btn hidden" type="button" aria-label="Hyphal Sight">
          <span class="tb-icon">✳</span><span class="tb-text">SIGHT</span>
        </button>
        <button id="btn-emote" class="touch-btn" type="button" aria-label="Emote">
          <span class="tb-icon">✿</span><span class="tb-text">EMOTE</span>
        </button>
        <button id="btn-wardrobe" class="touch-btn" type="button" aria-label="Wardrobe">
          <span class="tb-icon">◐</span><span class="tb-text">LOOK</span>
        </button>
      </div>
    `;
    document.body.appendChild(root);
    this.root = root;
    this.stick = root.querySelector('#stick');
    this.knob = root.querySelector('#stick-knob');
    this.lookHint = root.querySelector('#look-hint');
    this.jumpText = root.querySelector('#btn-jump .tb-text');
    this.jumpIcon = root.querySelector('#btn-jump .tb-icon');
    this.runText = root.querySelector('#btn-run .tb-text');
    this.runIcon = root.querySelector('#btn-run .tb-icon');
  }

  /**
   * Run and jump buttons.
   *
   * These live inside #touch-controls, which means two useful things: they are
   * hidden whenever touch controls are off, and a press on them never reaches
   * the canvas -- so it can't be mistaken for a stick drag or a look drag.
   * Pointer events cover touch and mouse with one code path.
   */
  _buildButtons() {
    this.jumpBtn = this.root.querySelector('#btn-jump');
    this.runBtn = this.root.querySelector('#btn-run');
    this.actionBtn = this.root.querySelector('#btn-action');
    this.fireBtn = this.root.querySelector('#btn-fire');
    this.callBtn = this.root.querySelector('#btn-call');
    this.emoteBtn = this.root.querySelector('#btn-emote');
    this.wardrobeBtn = this.root.querySelector('#btn-wardrobe');
    this.dashBtn = this.root.querySelector('#btn-dash');
    this.pulseBtn = this.root.querySelector('#btn-pulse');
    this.sightBtn = this.root.querySelector('#btn-sight');
    for (const [btn, fn] of [[this.dashBtn, () => this.onDash()], [this.pulseBtn, () => this.onPulse()], [this.sightBtn, () => this.onSight()]]) {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
      });
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
      btn.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    }

    // Jump is a tap ON THE GROUND and a HOLD IN THE AIR.
    //
    // It fires on press either way, so a jump feels immediate. The release matters
    // too, though, and it used to be dropped on the floor: the engine's flight input
    // reads "am I holding climb" as a STATE, so a press that was never released left
    // the carpet climbing for ever — and, because climb and dive are opposite ends of
    // one axis, made DIVE a silent no-op (they cancelled to zero). Releasing was the
    // only way back down, and there was no way to release.
    this.jumpBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onJump(true);
      this.jumpBtn.classList.add('held');
    });
    const jumpRelease = () => {
      this.jumpBtn.classList.remove('held');
      this.onJump(false);
    };
    this.jumpBtn.addEventListener('pointerup', jumpRelease);
    this.jumpBtn.addEventListener('pointercancel', jumpRelease);
    this.jumpBtn.addEventListener('pointerleave', jumpRelease);

    // RUN (or DESCEND, in the air) is a hold. While walking it is a hold-to-
    // sprint; while flying it is hold-to-lose-height. Same widget, same gesture,
    // and the engine reads `onDescend` only while riding — so a button that was
    // already under the thumb keeps meaning "the other vertical".
    const start = (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        this.runBtn.setPointerCapture(e.pointerId);
      } catch {
        /* capture is a nicety, not a requirement */
      }
      this.runBtn.classList.add('held');
      if (this.flying) this.onDescend(true);
      else this.onSprint(true);
    };
    const stop = (e) => {
      e?.preventDefault?.();
      this.runBtn.classList.remove('held');
      if (this.flying) this.onDescend(false);
      else this.onSprint(false);
    };

    this.runBtn.addEventListener('pointerdown', start);
    this.runBtn.addEventListener('pointerup', stop);
    this.runBtn.addEventListener('pointercancel', stop);
    this.runBtn.addEventListener('lostpointercapture', stop);

    // Mount / dismount / use. Not a hold: one press, one action.
    this.actionBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onAction();
    });

    // Throw a mushroom. A tap, and repeatable by mashing — the engine gates the
    // rate, not the button, so a held thumb does not have to be precise.
    this.fireBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onFire();
    });

    // Call the carpet to where you are standing.
    this.callBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onCall();
    });

    // Emote (each tap the next one) and open the Wardrobe.
    this.emoteBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onEmote();
    });
    this.wardrobeBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onWardrobe();
    });

    // Never let the browser do anything clever with these (scroll, zoom,
    // long-press menu) -- we handle them entirely.
    for (const btn of [this.jumpBtn, this.runBtn, this.actionBtn, this.fireBtn, this.callBtn, this.emoteBtn, this.wardrobeBtn]) {
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
      btn.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    }
  }

  /**
   * Switch the pad between walking and flying.
   *
   * The button LABELS change but the controls do not: the stick still means
   * forward/back and left/right, and the two buttons still mean "up" and "the
   * other vertical". Nothing new to learn, which is the point — a visitor on a
   * phone should not have to read a manual to fly.
   *
   * @param {boolean} flying
   * @param {{canMount?:boolean, actionLabel?:string}} [state]
   */
  setFlying(flying, state = {}) {
    this.flying = Boolean(flying);
    if (this.jumpText) this.jumpText.textContent = this.flying ? 'CLIMB' : 'JUMP';
    if (this.jumpIcon) this.jumpIcon.textContent = this.flying ? '⇧' : '▲';
    if (this.runText) this.runText.textContent = this.flying ? 'DIVE' : 'RUN';
    if (this.runIcon) this.runIcon.textContent = this.flying ? '⇩' : '»';
    this.root.classList.toggle('is-flying', this.flying);
    // A released button must not leave the engine thinking a control is held.
    this.jumpBtn.classList.remove('held');
    this.runBtn.classList.remove('held');
    this.setAction(state);
  }

  /**
   * Show, hide and label the MOUNT button.
   *
   * Kept separate from `setFlying` because it is driven by what is in reach every
   * frame, whereas flight mode changes twice a session. Rebuilding the label only
   * when it changes keeps a per-frame call cheap.
   *
   * @param {{canMount?:boolean, actionLabel?:string}|null} state
   */
  setAction(state) {
    const show = Boolean(state?.actionLabel);
    this.actionBtn.classList.toggle('hidden', !show);
    if (!show) return;
    const key = `${state.actionLabel}|${state.canMount ? 1 : 0}`;
    if (key === this._actionKey) return;
    this._actionKey = key;
    this.actionBtn.querySelector('.tb-text').textContent = state.actionLabel;
    this.actionBtn.classList.toggle('is-dim', state.canMount === false);
    this.actionBtn.disabled = state.canMount === false;
  }

  /** Show the buttons for the powers this member has. */
  setPowers({ dash = false, pulse = false, sight = false } = {}) {
    this.dashBtn?.classList.toggle('hidden', !dash);
    this.pulseBtn?.classList.toggle('hidden', !pulse);
    this.sightBtn?.classList.toggle('hidden', !sight);
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    const opts = { passive: false };
    this.el.addEventListener('touchstart', this._onDown, opts);
    this.el.addEventListener('touchmove', this._onMoveEvt, opts);
    this.el.addEventListener('touchend', this._onUp, opts);
    this.el.addEventListener('touchcancel', this._onCancel, opts);
    this.root.classList.add('active');
    document.body.classList.add('touch-mode');
    // The hint is only useful until the first look.
    this.lookHint.classList.remove('hidden');
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this.el.removeEventListener('touchstart', this._onDown);
    this.el.removeEventListener('touchmove', this._onMoveEvt);
    this.el.removeEventListener('touchend', this._onUp);
    this.el.removeEventListener('touchcancel', this._onCancel);
    this.root.classList.remove('active');
    document.body.classList.remove('touch-mode');
    this._releaseAll();
  }

  _releaseAll() {
    this.stickId = null;
    this.lookId = null;
    this.move.x = 0;
    this.move.y = 0;
    this.onMove(0, 0);
    this.stick.classList.add('hidden');
  }

  /** Is this touch in the movement zone (lower-left)? */
  _inStickZone(t) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return (
      t.clientX < w * TOUCH.stickZoneWidth &&
      t.clientY > h * (1 - TOUCH.stickZoneHeight)
    );
  }

  _handleDown(e) {
    if (!this.enabled) return;
    // Stop the page scrolling / rubber-banding / zooming under the canvas.
    e.preventDefault();

    for (const t of e.changedTouches) {
      if (this.stickId === null && this.lookId !== t.identifier && this._inStickZone(t)) {
        this.stickId = t.identifier;
        this.stickOrigin.x = t.clientX;
        this.stickOrigin.y = t.clientY;
        this.stickCurrent.x = t.clientX;
        this.stickCurrent.y = t.clientY;
        this._showStick(t.clientX, t.clientY, 0, 0);
      } else if (this.lookId === null && this.stickId !== t.identifier) {
        this.lookId = t.identifier;
        this.lastLook = { x: t.clientX, y: t.clientY };
        this.lookHint.classList.add('hidden');
      }
    }
  }

  _handleMove(e) {
    if (!this.enabled) return;
    e.preventDefault();

    for (const t of e.changedTouches) {
      if (t.identifier === this.stickId) {
        this.stickCurrent.x = t.clientX;
        this.stickCurrent.y = t.clientY;
        this._updateStickFromTouch();
      } else if (t.identifier === this.lookId) {
        const dx = t.clientX - this.lastLook.x;
        const dy = t.clientY - this.lastLook.y;
        this.lastLook.x = t.clientX;
        this.lastLook.y = t.clientY;
        this.onLook(dx * TOUCH.lookSensitivity, dy * TOUCH.lookSensitivity);
      }
    }
  }

  _handleUp(e) {
    if (!this.enabled) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this.stickId) {
        this.stickId = null;
        this.move.x = 0;
        this.move.y = 0;
        this.onMove(0, 0);
        this.stick.classList.add('hidden');
      } else if (t.identifier === this.lookId) {
        this.lookId = null;
      }
    }
  }

  /** Convert the stick's displacement into a normalised movement vector. */
  _updateStickFromTouch() {
    const dx = this.stickCurrent.x - this.stickOrigin.x;
    const dy = this.stickCurrent.y - this.stickOrigin.y;
    const dist = Math.hypot(dx, dy);
    const radius = TOUCH.stickRadius;

    // Clamp the knob to the ring.
    const clamped = Math.min(dist, radius);
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;

    this._showStick(this.stickOrigin.x, this.stickOrigin.y, nx * clamped, ny * clamped);

    // Dead zone, then rescale so movement starts from 0 rather than jumping.
    const magnitude = clamped / radius;
    const dz = TOUCH.deadZone;
    const scaled = magnitude <= dz ? 0 : (magnitude - dz) / (1 - dz);

    this.move.x = nx * scaled;
    // FORWARD, not screen-down.
    //
    // Screen y grows downward, and the two callers disagreed about which they were
    // handed: the walking path negated it back at its call site, while the flight path
    // used it raw — so on the carpet, pushing the stick away from you applied REVERSE
    // thrust. One convention, converted once, here. `setTouchMove` has always
    // documented `y` as forward, and now it is.
    this.move.y = -ny * scaled;
    this.onMove(this.move.x, this.move.y);
  }

  _showStick(x, y, offsetX, offsetY) {
    this.stick.classList.remove('hidden');
    this.stick.style.transform = `translate(${x}px, ${y}px)`;
    this.knob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  }
}

/**
 * A small always-available touch look for the *drag* case when the pointer
 * starts outside the canvas (e.g. over the HUD). Not currently wired up; the
 * HUD is pointer-events:none so touches always land on the canvas.
 */
export const TOUCH_DEVICE = TouchControls.isTouchDevice;

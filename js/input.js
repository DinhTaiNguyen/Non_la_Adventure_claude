/* =====================================================================
   input.js — keyboard + touch input, mapped to two virtual controllers
   Controller: { left, right, jump, pow1, pow2, special, hands }
   Edge presses are computed in game via prev-state comparison.
   ===================================================================== */
(function () {
  const keys = {};
  const touchBindings = [];
  let movementPointer = null;
  let movementZone = null;
  let movementStick = null;
  const I = {
    keys,
    touch: { left: false, right: false, jump: false, pow1: false, pow2: false, special: false, hands: false },
    swapPressed: false, emotePressed: 0, handsPressedTouch: false, lovePressed: false,
    isTouchDevice: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
  };

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys[e.code] = true;
    if (e.code === 'Tab') { I.swapPressed = true; e.preventDefault(); }
    if (e.code === 'Digit1') I.emotePressed = 1;
    if (e.code === 'Digit2') I.emotePressed = 2;
    if (e.code === 'Digit3') I.emotePressed = 3;
    if (e.code === 'KeyF') I.lovePressed = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; resetTouch(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetTouch(); });

  /* --- mobile zoom guards ---------------------------------------------
     The viewport meta (user-scalable=no) stops zoom on Android, but iOS
     Safari ignores it, so rapid taps while moving / using skills or two
     thumbs landing at once could pinch- or double-tap-zoom the page.
     CSS touch-action handles most of it; these listeners close the rest. */
  if (I.isTouchDevice) {
    /* iOS pinch gesture (fires regardless of touch-action) */
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
      document.addEventListener(type, (e) => { e.preventDefault(); }, { passive: false });
    }
    /* two fingers down (move thumb + action thumb) must never become a
       browser pinch; single-finger moves stay untouched so panels scroll */
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1 && e.cancelable) e.preventDefault();
    }, { passive: false });
    /* double-tap-to-zoom guard on the game surfaces only: menu buttons and
       inputs keep their normal fast-tap behaviour, while spamming jump /
       skills / emotes on the canvas or the touch pads can't zoom */
    let lastTapEnd = 0;
    document.addEventListener('touchend', (e) => {
      const onGameSurface = e.target && e.target.closest &&
        e.target.closest('#game, #touch-ui, #topbar, #touch-guide');
      if (!onGameSurface) return;
      const now = Date.now();
      if (now - lastTapEnd <= 340 && e.cancelable) e.preventDefault();
      lastTapEnd = now;
    }, { passive: false });
  }

  function resetMovement() {
    movementPointer = null;
    I.touch.left = false;
    I.touch.right = false;
    if (movementZone) movementZone.classList.remove('pressed');
    if (movementStick) {
      movementStick.classList.add('hidden');
      movementStick.style.setProperty('--move-x', '0px');
    }
  }

  function resetTouch() {
    const t = I.touch;
    t.left = t.right = t.jump = t.pow1 = t.pow2 = t.special = t.hands = false;
    resetMovement();
    I.swapPressed = false;
    I.emotePressed = 0;
    I.handsPressedTouch = false;
    I.lovePressed = false;
    for (const binding of touchBindings) {
      binding.pointers.clear();
      binding.el.classList.remove('pressed');
      binding.el.setAttribute('aria-pressed', 'false');
    }
  }
  I.resetTouch = resetTouch;

  /* --- controller readers --- */
  /* P1 = boy on keyboard-left (WASD/E/Q), P2 = girl on arrows (O/P). */
  I.readBoyKeys = function () {
    return {
      left: !!keys.KeyA, right: !!keys.KeyD,
      jump: !!(keys.KeyW || keys.Space),
      pow1: !!keys.KeyE, pow2: !!keys.KeyQ,
      special: !!keys.KeyR,
      hands: !!keys.KeyH,
    };
  };
  I.readGirlKeys = function () {
    return {
      left: !!keys.ArrowLeft, right: !!keys.ArrowRight,
      jump: !!keys.ArrowUp,
      pow1: !!(keys.KeyO || keys.Comma), pow2: !!(keys.KeyP || keys.Period),
      special: !!keys.KeyI,
      hands: !!(keys.KeyH || t.hands),
    };
  };
  /* merged (solo / touch): both key groups + touch buttons drive the active char */
  I.readMerged = function () {
    const t = I.touch;
    return {
      left: !!(keys.KeyA || keys.ArrowLeft || t.left),
      right: !!(keys.KeyD || keys.ArrowRight || t.right),
      jump: !!(keys.KeyW || keys.ArrowUp || keys.Space || t.jump),
      pow1: !!(keys.KeyE || keys.KeyO || t.pow1),
      pow2: !!(keys.KeyQ || keys.KeyP || t.pow2),
      special: !!(keys.KeyR || keys.KeyI || t.special),
      hands: !!keys.KeyH,
    };
  };

  I.consumeSwap = function () { const v = I.swapPressed; I.swapPressed = false; return v; };
  I.consumeEmote = function () { const v = I.emotePressed; I.emotePressed = 0; return v; };
  I.consumeHandsTouch = function () { const v = I.handsPressedTouch; I.handsPressedTouch = false; return v; };
  I.consumeLove = function () { const v = I.lovePressed; I.lovePressed = false; return v; };

  /* --- touch buttons wiring ---
     Pointer Events support true multi-touch while avoiding the duplicate
     mouse events that follow older touchstart handlers. */
  I.bindTouchUI = function () {
    if (I._touchBound) return;
    I._touchBound = true;

    const capture = (el, pointerId) => {
      try { el.setPointerCapture(pointerId); } catch (_) { /* capture is optional */ }
    };
    const isPrimaryPress = (e) => e.button === undefined || e.button === 0;

    const bindMoveZone = () => {
      const el = document.getElementById('tc-move-zone');
      if (!el) return;
      movementZone = el;
      movementStick = document.getElementById('tc-move-stick');
      const playable = () => {
        const g = NLA.game;
        return I.isTouchDevice && g && g.state === 'play' && !g.paused && g.mode !== 'local';
      };
      const release = (e, prevent) => {
        if (!movementPointer || movementPointer.id !== e.pointerId) return;
        if (prevent && e.cancelable) e.preventDefault();
        resetMovement();
      };
      const update = (e) => {
        if (!movementPointer || movementPointer.id !== e.pointerId) return;
        const deadZone = Math.max(18, Math.min(36, el.clientWidth * 0.07));
        const dx = e.clientX - movementPointer.startX;
        I.touch.left = dx < -deadZone;
        I.touch.right = dx > deadZone;
        if (movementStick) movementStick.style.setProperty('--move-x', `${Math.max(-32, Math.min(32, dx))}px`);
      };
      el.addEventListener('pointerdown', (e) => {
        if (!isPrimaryPress(e) || movementPointer || !playable()) return;
        if (e.cancelable) e.preventDefault();
        const rect = el.getBoundingClientRect();
        movementPointer = { id: e.pointerId, startX: e.clientX };
        capture(el, e.pointerId);
        el.classList.add('pressed');
        if (movementStick) {
          movementStick.style.left = `${e.clientX - rect.left}px`;
          movementStick.style.top = `${e.clientY - rect.top}px`;
          movementStick.style.setProperty('--move-x', '0px');
          movementStick.classList.remove('hidden');
        }
      });
      el.addEventListener('pointermove', (e) => {
        if (!movementPointer || movementPointer.id !== e.pointerId) return;
        if (e.cancelable) e.preventDefault();
        update(e);
      });
      el.addEventListener('pointerup', (e) => release(e, true));
      el.addEventListener('pointercancel', (e) => release(e, true));
      el.addEventListener('lostpointercapture', (e) => release(e, false));
      window.addEventListener('pointerup', (e) => release(e, false));
      window.addEventListener('pointercancel', (e) => release(e, false));
    };
    bindMoveZone();

    const bindHeld = (id, prop) => {
      const el = document.getElementById(id);
      if (!el) return;
      const pointers = new Set();
      const update = () => {
        const pressed = pointers.size > 0;
        I.touch[prop] = pressed;
        el.classList.toggle('pressed', pressed);
        el.setAttribute('aria-pressed', String(pressed));
      };
      const release = (e, prevent) => {
        if (!pointers.delete(e.pointerId)) return;
        if (prevent && e.cancelable) e.preventDefault();
        update();
      };
      el.addEventListener('pointerdown', (e) => {
        if (!isPrimaryPress(e)) return;
        if (e.cancelable) e.preventDefault();
        pointers.add(e.pointerId);
        capture(el, e.pointerId);
        update();
      });
      el.addEventListener('pointerup', (e) => release(e, true));
      el.addEventListener('pointercancel', (e) => release(e, true));
      el.addEventListener('lostpointercapture', (e) => release(e, false));
      touchBindings.push({ el, pointers, release });
    };
    bindHeld('tc-jump-btn', 'jump');
    bindHeld('tc-pow1-btn', 'pow1');
    bindHeld('tc-pow2-btn', 'pow2');
    bindHeld('tc-special-btn', 'special');
    bindHeld('tc-hands-btn', 'hands');

    const tap = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      const pointers = new Set();
      const release = (e, prevent) => {
        if (!pointers.delete(e.pointerId)) return;
        if (prevent && e.cancelable) e.preventDefault();
        if (pointers.size === 0) {
          el.classList.remove('pressed');
          el.setAttribute('aria-pressed', 'false');
        }
      };
      el.addEventListener('pointerdown', (e) => {
        if (!isPrimaryPress(e) || pointers.has(e.pointerId)) return;
        if (e.cancelable) e.preventDefault();
        pointers.add(e.pointerId);
        capture(el, e.pointerId);
        el.classList.add('pressed');
        el.setAttribute('aria-pressed', 'true');
        fn();
      });
      el.addEventListener('pointerup', (e) => release(e, true));
      el.addEventListener('pointercancel', (e) => release(e, true));
      el.addEventListener('lostpointercapture', (e) => release(e, false));
      touchBindings.push({ el, pointers, release });
    };
    tap('tc-switch-btn', () => { I.swapPressed = true; });
    tap('tc-emote-btn', () => { I.emotePressed = 1; });
    tap('btn-love', () => { I.lovePressed = true; });

    const releaseLostPointer = (e) => {
      for (const binding of touchBindings) binding.release(e, false);
    };
    window.addEventListener('pointerup', releaseLostPointer);
    window.addEventListener('pointercancel', releaseLostPointer);
  };

  NLA.input = I;
})();

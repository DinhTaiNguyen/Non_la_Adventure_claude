/* =====================================================================
   input.js — keyboard + touch input, mapped to two virtual controllers
   Controller: { left, right, jump, pow1, pow2, hands }  (held booleans)
   Edge presses are computed in game via prev-state comparison.
   ===================================================================== */
(function () {
  const keys = {};
  const I = {
    keys,
    touch: { left: false, right: false, jump: false, pow1: false, pow2: false },
    swapPressed: false, emotePressed: 0, handsPressedTouch: false,
    isTouchDevice: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
  };

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys[e.code] = true;
    if (e.code === 'Tab') { I.swapPressed = true; e.preventDefault(); }
    if (e.code === 'Digit1') I.emotePressed = 1;
    if (e.code === 'Digit2') I.emotePressed = 2;
    if (e.code === 'Digit3') I.emotePressed = 3;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; resetTouch(); });

  function resetTouch() { const t = I.touch; t.left = t.right = t.jump = t.pow1 = t.pow2 = false; }

  /* --- controller readers --- */
  /* P1 = boy on keyboard-left (WASD/E/Q), P2 = girl on arrows (O/P). */
  I.readBoyKeys = function () {
    return {
      left: !!keys.KeyA, right: !!keys.KeyD,
      jump: !!(keys.KeyW || keys.Space),
      pow1: !!keys.KeyE, pow2: !!keys.KeyQ,
      hands: !!keys.KeyH,
    };
  };
  I.readGirlKeys = function () {
    return {
      left: !!keys.ArrowLeft, right: !!keys.ArrowRight,
      jump: !!keys.ArrowUp,
      pow1: !!(keys.KeyO || keys.Comma), pow2: !!(keys.KeyP || keys.Period),
      hands: !!keys.KeyH,
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
      hands: !!(keys.KeyH || I.handsHeldTouch),
    };
  };

  I.consumeSwap = function () { const v = I.swapPressed; I.swapPressed = false; return v; };
  I.consumeEmote = function () { const v = I.emotePressed; I.emotePressed = 0; return v; };
  I.consumeHandsTouch = function () { const v = I.handsPressedTouch; I.handsPressedTouch = false; return v; };

  /* --- touch buttons wiring --- */
  I.bindTouchUI = function () {
    const bind = (id, prop) => {
      const el = document.getElementById(id);
      if (!el) return;
      const on = (e) => { e.preventDefault(); I.touch[prop] = true; el.classList.add('pressed'); };
      const off = (e) => { e.preventDefault(); I.touch[prop] = false; el.classList.remove('pressed'); };
      el.addEventListener('touchstart', on, { passive: false });
      el.addEventListener('touchend', off, { passive: false });
      el.addEventListener('touchcancel', off, { passive: false });
      el.addEventListener('mousedown', on);
      el.addEventListener('mouseup', off);
      el.addEventListener('mouseleave', off);
    };
    bind('tc-left-btn', 'left');
    bind('tc-right-btn', 'right');
    bind('tc-jump-btn', 'jump');
    bind('tc-pow1-btn', 'pow1');
    bind('tc-pow2-btn', 'pow2');

    const tap = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); fn(); }, { passive: false });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); fn(); });
    };
    tap('tc-switch-btn', () => { I.swapPressed = true; });
    tap('tc-hands-btn', () => { I.handsPressedTouch = true; });
    tap('tc-emote-btn', () => { I.emotePressed = (I.emotePressed % 3) + 1; });
  };

  NLA.input = I;
})();

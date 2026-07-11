/* =====================================================================
   main.js — boot, resize, and the single-owner game loop.
   ===================================================================== */
(function () {
  NLA.save.load();

  const canvas = document.getElementById('game');
  const game = new NLA.Game(canvas);
  NLA.game = game;

  /* ---- resize (DPR-aware, with a gentler mobile quality tier) ---- */
  let sizedW = 0, sizedH = 0, sizedDpr = 0, resizeFrame = 0;
  function resize() {
    const dprCap = NLA.input.isTouchDevice ? 1.5 : 2;
    const dpr = Math.min(dprCap, window.devicePixelRatio || 1);
    const iw = window.innerWidth || 0, ih = window.innerHeight || 0;
    if (iw < 2 || ih < 2) return;          /* pane not laid out yet */
    if (iw === sizedW && ih === sizedH && dpr === sizedDpr) {
      checkRotate();
      return;
    }
    sizedW = iw; sizedH = ih; sizedDpr = dpr;
    game.resize(Math.floor(iw * dpr), Math.floor(ih * dpr));
    checkRotate();
  }
  function queueResize() {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resize();
    });
  }
  function checkRotate() {
    const portrait = window.innerHeight > window.innerWidth * 1.1;
    const el = document.getElementById('rotate-hint');
    if (portrait && NLA.input.isTouchDevice) el.classList.remove('hidden');
    else el.classList.add('hidden');
  }
  window.addEventListener('resize', queueResize, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(queueResize, 250));
  resize();

  /* ---- audio unlock on first gesture ---- */
  const unlock = () => { NLA.audio.unlock(); };
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });
  window.addEventListener('touchstart', unlock, { once: false });

  /* ---- UI ---- */
  NLA.ui.init(game);

  /* ---- main loop (fixed timestep sim, rAF render) ----
     A watchdog may draw a throttled embedded view, but it never owns or
     schedules rAF. That prevents duplicate permanent game loops. */
  let last = performance.now();
  let acc = 0;
  let rafId = 0;
  let lastRafTick = last;
  let lastFallbackTick = 0;
  let lastSizeProbe = last;
  let lastDraw = -Infinity;
  const STEP = 1 / 60;
  const MOBILE_RENDER_MS = NLA.input.isTouchDevice ? (1000 / 60) : 0;

  function scheduleFrame() {
    if (!rafId) rafId = requestAnimationFrame(loop);
  }

  function runFrame(now, fallback) {
    /* Some embedded panes miss resize events, so probe occasionally instead
       of checking layout and potentially resizing every frame. */
    if (now - lastSizeProbe > 1000) {
      lastSizeProbe = now;
      if (window.innerWidth !== sizedW || window.innerHeight !== sizedH) resize();
    }
    if (sizedW < 2) return;

    let dt = (now - last) / 1000;
    last = now;
    if (fallback) dt = Math.min(dt, 1 / 30);
    else if (dt > 0.25) dt = 0.25;          /* tab was hidden — don't explode */
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      game.update(STEP);
      acc -= STEP;
      steps++;
    }
    if (steps === 5) acc = 0;

    if (!MOBILE_RENDER_MS || now - lastDraw >= MOBILE_RENDER_MS - 0.5 || fallback) {
      game.draw();
      lastDraw = now;
    }
  }

  function loop(now) {
    rafId = 0;
    lastRafTick = now;
    if (document.hidden) {
      last = now;
      acc = 0;
      scheduleFrame();
      return;
    }
    runFrame(now, false);
    scheduleFrame();
  }
  scheduleFrame();

  /* Embedded contexts occasionally throttle rAF while still visible. Keep
     a lightweight fallback alive without starting another rAF chain. */
  setInterval(() => {
    const now = performance.now();
    if (document.hidden || now - lastRafTick <= 400 || now - lastFallbackTick < 90) return;
    lastFallbackTick = now;
    runFrame(now, true);
  }, 100);

  /* Keep time and audio healthy when the tab returns. */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      last = performance.now();
      acc = 0;
      NLA.audio.unlock();
      queueResize();
      scheduleFrame();
    }
  });
})();

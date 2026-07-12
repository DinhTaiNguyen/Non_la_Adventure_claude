/* =====================================================================
   main.js — boot, resize, and the single-owner game loop.
   ===================================================================== */
(function () {
  NLA.save.load();

  const canvas = document.getElementById('game');
  const game = new NLA.Game(canvas);
  NLA.game = game;

  /* ---- resize (DPR-aware and bounded by a sensible pixel budget) ---- */
  let sizedW = 0, sizedH = 0, sizedDpr = 0, resizeFrame = 0;
  function renderDpr(iw, ih) {
    const deviceDpr = window.devicePixelRatio || 1;
    const dprCap = NLA.input.isTouchDevice ? 1.5 : 2;
    const pixelBudget = NLA.input.isTouchDevice ? 2500000 : 6000000;
    const budgetDpr = Math.sqrt(pixelBudget / Math.max(1, iw * ih));
    return Math.max(1, Math.min(dprCap, deviceDpr, budgetDpr));
  }
  function resize() {
    const iw = window.innerWidth || 0, ih = window.innerHeight || 0;
    if (iw < 2 || ih < 2) return;          /* pane not laid out yet */
    const dpr = renderDpr(iw, ih);
    if (iw === sizedW && ih === sizedH && dpr === sizedDpr) {
      checkRotate();
      return;
    }
    sizedW = iw; sizedH = ih; sizedDpr = dpr;
    game.resize(Math.max(1, Math.floor(iw * dpr)), Math.max(1, Math.floor(ih * dpr)));
    checkRotate();
  }
  function queueResize() {
    if (resizeFrame || document.hidden) return;
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

  /* ---- main loop (fixed timestep sim, rAF render) ---- */
  let last = performance.now();
  let acc = 0;
  let rafId = 0;
  let lastRafTick = last;
  let lastFallbackTick = 0;
  let lastSizeProbe = last;
  let lastDraw = -Infinity;
  const STEP = 1 / 60;
  const GAME_RENDER_MS = NLA.input.isTouchDevice ? (1000 / 60) : 0;
  const IDLE_RENDER_MS = 1000 / 30;

  function scheduleFrame() {
    if (!rafId && !document.hidden) rafId = requestAnimationFrame(loop);
  }
  function renderInterval() {
    if (game.state === 'idle' || game.paused || game.state === 'memory' || game.state === 'complete') {
      return IDLE_RENDER_MS;
    }
    return GAME_RENDER_MS;
  }
  function runFrame(now, fallback) {
    /* Embedded panes occasionally miss resize events, so probe rarely rather
       than reading layout every frame. */
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

    const every = renderInterval();
    if (!every || now - lastDraw >= every - 0.5) {
      game.draw();
      lastDraw = now;
    }
  }
  function loop(now) {
    rafId = 0;
    if (document.hidden) return;
    lastRafTick = now;
    runFrame(now, false);
    scheduleFrame();
  }
  scheduleFrame();

  /* A timer fallback is only useful inside an embedded frame where a host
     may throttle rAF while the game is still visibly on screen. */
  let isEmbedded = false;
  try { isEmbedded = window.self !== window.top; } catch (_) { isEmbedded = true; }
  if (isEmbedded) {
    setInterval(() => {
      const now = performance.now();
      if (document.hidden || now - lastRafTick <= 450 || now - lastFallbackTick < 120) return;
      lastFallbackTick = now;
      runFrame(now, true);
    }, 120);
  }

  /* Stop background work completely; restart cleanly when the tab returns. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      rafId = 0;
      resizeFrame = 0;
      last = performance.now();
      acc = 0;
      return;
    }
    last = performance.now();
    acc = 0;
    NLA.audio.unlock();
    queueResize();
    scheduleFrame();
  });
})();

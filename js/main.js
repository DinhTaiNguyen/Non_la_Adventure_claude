/* =====================================================================
   main.js — boot, resize, game loop.
   ===================================================================== */
(function () {
  NLA.save.load();

  const canvas = document.getElementById('game');
  const game = new NLA.Game(canvas);
  NLA.game = game;

  /* ---- resize (DPR-aware, capped for mobile perf) ---- */
  let sizedW = 0, sizedH = 0;
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const iw = window.innerWidth || 0, ih = window.innerHeight || 0;
    if (iw < 2 || ih < 2) return;          /* pane not laid out yet */
    sizedW = iw; sizedH = ih;
    game.resize(Math.floor(iw * dpr), Math.floor(ih * dpr));
    checkRotate();
  }
  function checkRotate() {
    const portrait = window.innerHeight > window.innerWidth * 1.1;
    const el = document.getElementById('rotate-hint');
    if (portrait && NLA.input.isTouchDevice) el.classList.remove('hidden');
    else el.classList.add('hidden');
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 250));
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
  const STEP = 1 / 60;

  let lastTick = performance.now();
  function loop(now) {
    lastTick = performance.now();
    /* catch late layout / missed resize events (embedded panes, iframes) */
    if (window.innerWidth !== sizedW || window.innerHeight !== sizedH) resize();
    if (sizedW < 2) { requestAnimationFrame(loop); return; }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;          /* tab was hidden — don't explode */
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      game.update(STEP);
      acc -= STEP;
      steps++;
    }
    if (steps === 5) acc = 0;
    game.draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* watchdog: some embedded/hidden contexts throttle rAF to zero —
     keep the world gently ticking with a timer fallback */
  setInterval(() => {
    if (performance.now() - lastTick > 400) loop(performance.now());
  }, 100);

  /* keep audio context healthy when tab returns */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { last = performance.now(); NLA.audio.unlock(); }
  });
})();

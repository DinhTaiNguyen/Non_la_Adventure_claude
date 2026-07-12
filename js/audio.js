/* =====================================================================
   audio.js — procedural Vietnamese-inspired music + SFX (Web Audio)
   Đàn tranh-style plucks, bamboo flute melodies, soft pads & drums.
   ===================================================================== */
(function () {
  const A = {
    ctx: null, master: null, musicGain: null, sfxGain: null,
    started: false, intensity: 0.3, tempo: 72,
    _nextBar: 0, _bar: 0, _timer: null, _theme: 'street',
  };

  /* D major pentatonic-ish (D E F# A B) across octaves — warm & Vietnamese-feeling */
  const SCALE = [146.83, 164.81, 185.00, 220.00, 246.94, 293.66, 329.63, 370.00, 440.00, 493.88, 587.33, 659.25, 740.0, 880.0];
  /* chord roots per 4-bar progression (indices into SCALE lower octave) */
  const PROG = [0, 3, 4, 3];

  function ctx() {
    if (!A.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      A.ctx = new AC();
      A.master = A.ctx.createGain();
      A.master.gain.value = 0.9;
      A.master.connect(A.ctx.destination);
      A.musicGain = A.ctx.createGain();
      A.musicGain.gain.value = NLA.save.data.music ? 0.55 : 0;
      A.musicGain.connect(A.master);
      A.sfxGain = A.ctx.createGain();
      A.sfxGain.gain.value = NLA.save.data.sfx ? 0.8 : 0;
      A.sfxGain.connect(A.master);
    }
    return A.ctx;
  }

  A.unlock = function () {
    const c = ctx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    if (!A.started && NLA.save.data.music) {
      A.started = true;
      A._nextBar = c.currentTime + 0.1;
      scheduler();
    }
  };

  A.setMusic = function (on) {
    if (!A.musicGain || !A.ctx) return;
    A.musicGain.gain.setTargetAtTime(on ? 0.55 : 0, A.ctx.currentTime, 0.2);
    if (on && !A.started) {
      A.started = true;
      A._nextBar = A.ctx.currentTime + 0.1;
      scheduler();
    } else if (!on) {
      if (A._timer) clearTimeout(A._timer);
      A._timer = null;
      A.started = false;
    }
  };
  A.setSfx = function (on) { if (A.sfxGain) A.sfxGain.gain.setTargetAtTime(on ? 0.8 : 0, ctx().currentTime, 0.05); };
  A.setTheme = function (theme) { A._theme = theme; };
  A.setIntensity = function (v) { A.intensity = NLA.util.clamp(v, 0, 1); };

  /* ================= instruments ================= */

  /* đàn tranh-ish pluck: two detuned triangles + fast decay + high shimmer */
  function pluck(freq, when, vol, pan) {
    const c = A.ctx;
    const g = c.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) { p.pan.value = pan || 0; g.connect(p); p.connect(A.musicGain); }
    else g.connect(A.musicGain);
    [0, 3].forEach((cents, i) => {
      const o = c.createOscillator();
      o.type = i ? 'sine' : 'triangle';
      o.frequency.value = freq * Math.pow(2, cents / 1200);
      /* tiny pitch bend at attack, like a plucked string */
      o.frequency.setValueAtTime(freq * 1.012, when);
      o.frequency.exponentialRampToValueAtTime(freq, when + 0.06);
      const og = c.createGain();
      og.gain.value = i ? 0.35 : 1;
      o.connect(og); og.connect(g);
      o.start(when); o.stop(when + 1.5);
    });
  }

  /* bamboo flute: soft sine w/ vibrato + breath */
  function flute(freq, when, dur, vol) {
    const c = A.ctx;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, when);
    const vib = c.createOscillator();
    vib.frequency.value = 4.6;
    const vibG = c.createGain();
    vibG.gain.setValueAtTime(0, when);
    vibG.gain.linearRampToValueAtTime(freq * 0.006, when + dur * 0.4);
    vib.connect(vibG); vibG.connect(o.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.09);
    g.gain.setValueAtTime(vol, when + dur - 0.14);
    g.gain.linearRampToValueAtTime(0, when + dur);
    o.connect(g); g.connect(A.musicGain);
    /* breath noise */
    const n = noiseSrc(when, dur);
    const nf = c.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = freq * 2; nf.Q.value = 8;
    const ng = c.createGain(); ng.gain.value = vol * 0.06;
    n.connect(nf); nf.connect(ng); ng.connect(A.musicGain);
    o.start(when); o.stop(when + dur + 0.05);
    vib.start(when); vib.stop(when + dur + 0.05);
  }

  /* warm pad */
  function pad(freqs, when, dur, vol) {
    const c = A.ctx;
    const g = c.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + dur * 0.3);
    g.gain.linearRampToValueAtTime(0, when + dur);
    const f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900;
    g.connect(f); f.connect(A.musicGain);
    freqs.forEach((fr) => {
      [-4, 4].forEach(cents => {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = fr * Math.pow(2, cents / 1200);
        const og = c.createGain(); og.gain.value = 0.12;
        o.connect(og); og.connect(g);
        o.start(when); o.stop(when + dur + 0.1);
      });
    });
  }

  function noiseSrc(when, dur) {
    const c = A.ctx;
    const len = Math.max(1, Math.floor(c.sampleRate * Math.min(dur, 2)));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource();
    s.buffer = buf; s.loop = dur > 2;
    s.start(when); s.stop(when + dur);
    return s;
  }

  /* soft drum thump */
  function thump(when, vol) {
    const c = A.ctx;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, when);
    o.frequency.exponentialRampToValueAtTime(48, when + 0.18);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
    o.connect(g); g.connect(A.musicGain);
    o.start(when); o.stop(when + 0.3);
  }

  /* wood tick (song lang) */
  function tick(when, vol) {
    const c = A.ctx;
    const n = noiseSrc(when, 0.05);
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 6;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    n.connect(f); f.connect(g); g.connect(A.musicGain);
  }

  /* ================= music scheduler ================= */
  const themes = {
    street: { tempo: 72, flute: 0.5, bright: 0.7 },
    river:  { tempo: 60, flute: 0.7, bright: 0.5 },
    village:{ tempo: 84, flute: 0.4, bright: 0.8 },
    lake:   { tempo: 58, flute: 0.8, bright: 0.4 },
    temple: { tempo: 64, flute: 0.3, bright: 0.45 },
    finale: { tempo: 78, flute: 0.7, bright: 0.9 },
    menu:   { tempo: 66, flute: 0.6, bright: 0.6 },
  };

  let melodyMemory = 7; /* wandering melody index */

  function scheduleBar(t0) {
    const th = themes[A._theme] || themes.menu;
    const beat = 60 / th.tempo;
    const bar = A._bar;
    const rootIdx = PROG[bar % 4];
    const inten = A.intensity;

    /* pad every 2 bars */
    if (bar % 2 === 0) {
      pad([SCALE[rootIdx], SCALE[rootIdx + 2], SCALE[rootIdx + 4]], t0, beat * 8.2, 0.05 + inten * 0.05);
    }
    /* pluck arpeggio pattern */
    const pattern = [0, 2, 4, 5, 4, 2];
    for (let i = 0; i < 4; i++) {
      const bt = t0 + i * beat;
      if (Math.random() < 0.85) {
        const idx = Math.min(SCALE.length - 1, rootIdx + pattern[(bar * 4 + i) % pattern.length]);
        pluck(SCALE[idx], bt, 0.16 + inten * 0.1, Math.sin(i * 1.7) * 0.4);
      }
      /* extra sparkle plucks at higher intensity */
      if (inten > 0.45 && Math.random() < inten * 0.6) {
        const idx = Math.min(SCALE.length - 1, rootIdx + 5 + NLA.util.irand(0, 3));
        pluck(SCALE[idx], bt + beat * 0.5, 0.08 + inten * 0.07, NLA.util.rand(-0.5, 0.5));
      }
      /* percussion */
      if (inten > 0.25) {
        if (i === 0 || i === 2) thump(bt, 0.10 + inten * 0.10);
        if (inten > 0.5 && i % 2 === 1) tick(bt, 0.05 + inten * 0.05);
      }
    }
    /* flute melody phrase — every other bar, wandering the scale */
    if (bar % 2 === 1 && Math.random() < th.flute) {
      let idx = melodyMemory;
      let t = t0;
      const notes = NLA.util.irand(2, 4);
      for (let n = 0; n < notes; n++) {
        idx += NLA.util.pick([-2, -1, -1, 1, 1, 2]);
        idx = NLA.util.clamp(idx, 5, SCALE.length - 1);
        const dur = beat * NLA.util.pick([1, 1, 1.5, 2]);
        flute(SCALE[idx], t, dur * 0.94, 0.055 + inten * 0.05);
        t += dur;
      }
      melodyMemory = idx;
    }
    return beat * 4;
  }

  function scheduler() {
    if (!A.ctx || !A.started) return;
    const now = A.ctx.currentTime;
    while (A._nextBar < now + 1.2) {
      const len = scheduleBar(A._nextBar);
      A._nextBar += len;
      A._bar++;
    }
    A._timer = setTimeout(scheduler, 400);
  }

  /* ================= SFX ================= */
  function sfxEnv(dur, vol) {
    const c = A.ctx;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    g.connect(A.sfxGain);
    return g;
  }

  const SFX = {
    click() { const c = A.ctx; if (!c) return; const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 720; const g = sfxEnv(0.09, 0.25); o.connect(g); o.start(); o.stop(c.currentTime + 0.1); },
    jump() { const c = A.ctx; if (!c) return; const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(300, c.currentTime); o.frequency.exponentialRampToValueAtTime(560, c.currentTime + 0.14); const g = sfxEnv(0.18, 0.16); o.connect(g); o.start(); o.stop(c.currentTime + 0.2); },
    land() { const c = A.ctx; if (!c) return; const n = noiseSrc(c.currentTime, 0.08); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400; const g = sfxEnv(0.08, 0.18); n.connect(f); f.connect(g); },
    chime(pitch) { /* collectible — pentatonic ping */
      const c = A.ctx; if (!c) return;
      const freq = SCALE[NLA.util.clamp(8 + (pitch || 0), 0, SCALE.length - 1)];
      [1, 2].forEach((m, i) => {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq * m;
        const g = sfxEnv(0.6 - i * 0.2, 0.16 / m); o.connect(g);
        o.start(); o.stop(c.currentTime + 0.7);
      });
    },
    sparkle() {
      const c = A.ctx; if (!c) return;
      [0, 1, 2].forEach(i => {
        const o = c.createOscillator(); o.type = 'sine';
        o.frequency.value = SCALE[9 + i] * 2;
        const g = c.createGain();
        const t = c.currentTime + i * 0.05;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        g.connect(A.sfxGain); o.connect(g);
        o.start(t); o.stop(t + 0.4);
      });
    },
    wind() {
      const c = A.ctx; if (!c) return;
      const n = noiseSrc(c.currentTime, 0.55);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(300, c.currentTime);
      f.frequency.exponentialRampToValueAtTime(1400, c.currentTime + 0.22);
      f.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.5);
      const g = c.createGain();
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(0.3, c.currentTime + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.55);
      n.connect(f); f.connect(g); g.connect(A.sfxGain);
    },
    shieldOn() { const c = A.ctx; if (!c) return; const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(180, c.currentTime); o.frequency.linearRampToValueAtTime(320, c.currentTime + 0.25); const g = sfxEnv(0.3, 0.12); o.connect(g); o.start(); o.stop(c.currentTime + 0.35); },
    splash() {
      const c = A.ctx; if (!c) return;
      const n = noiseSrc(c.currentTime, 0.4);
      const f = c.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(1800, c.currentTime);
      f.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.35);
      const g = sfxEnv(0.4, 0.3);
      n.connect(f); f.connect(g);
    },
    heal() {
      const c = A.ctx; if (!c) return;
      [0, 2, 4].forEach((s, i) => {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = SCALE[6 + s];
        const t = c.currentTime + i * 0.09;
        const g = c.createGain();
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        g.connect(A.sfxGain); o.connect(g); o.start(t); o.stop(t + 0.55);
      });
    },
    lotus() {
      const c = A.ctx; if (!c) return;
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(SCALE[4], c.currentTime);
      o.frequency.linearRampToValueAtTime(SCALE[8], c.currentTime + 0.4);
      const g = sfxEnv(0.5, 0.14); o.connect(g);
      o.start(); o.stop(c.currentTime + 0.55);
      SFX.splash();
    },
    gate() {
      const c = A.ctx; if (!c) return;
      const o = c.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(80, c.currentTime);
      o.frequency.linearRampToValueAtTime(140, c.currentTime + 0.6);
      const g = sfxEnv(0.7, 0.22); o.connect(g);
      o.start(); o.stop(c.currentTime + 0.75);
      const n = noiseSrc(c.currentTime, 0.6);
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 250;
      const g2 = sfxEnv(0.6, 0.14); n.connect(f); f.connect(g2);
    },
    lanternLit() {
      const c = A.ctx; if (!c) return;
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(SCALE[8], c.currentTime);
      const g = sfxEnv(0.8, 0.14); o.connect(g); o.start(); o.stop(c.currentTime + 0.85);
      SFX.sparkle();
    },
    hurt() { const c = A.ctx; if (!c) return; const o = c.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(220, c.currentTime); o.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.18); const g = sfxEnv(0.2, 0.08); o.connect(g); o.start(); o.stop(c.currentTime + 0.22); },
    dispel() {
      const c = A.ctx; if (!c) return;
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(900, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(1800, c.currentTime + 0.25);
      const g = sfxEnv(0.3, 0.1); o.connect(g); o.start(); o.stop(c.currentTime + 0.32);
    },
    loveUp() { /* harp gliss up the scale */
      const c = A.ctx; if (!c) return;
      for (let i = 0; i < 7; i++) {
        pluckSfx(SCALE[4 + i], c.currentTime + i * 0.07, 0.14);
      }
    },
    memory() {
      const c = A.ctx; if (!c) return;
      [5, 7, 9, 11].forEach((s, i) => pluckSfx(SCALE[s], c.currentTime + i * 0.16, 0.13));
    },
    firework() {
      const c = A.ctx; if (!c) return;
      const n = noiseSrc(c.currentTime, 0.7);
      const f = c.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(2500, c.currentTime);
      f.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.65);
      const g = sfxEnv(0.7, 0.28); n.connect(f); f.connect(g);
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(70, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(38, c.currentTime + 0.3);
      const g2 = sfxEnv(0.35, 0.3); o.connect(g2); o.start(); o.stop(c.currentTime + 0.4);
    },
    bell() {
      const c = A.ctx; if (!c) return;
      [1, 2.76, 5.4].forEach((m, i) => {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 220 * m;
        const g = sfxEnv(1.8 - i * 0.4, 0.1 / (i + 1)); o.connect(g);
        o.start(); o.stop(c.currentTime + 2);
      });
    },
    push() { const c = A.ctx; if (!c) return; const n = noiseSrc(c.currentTime, 0.12); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; const g = sfxEnv(0.12, 0.1); n.connect(f); f.connect(g); },
    bird() { const c = A.ctx; if (!c) return; const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(1400, c.currentTime); o.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.2); const g = sfxEnv(0.22, 0.07); o.connect(g); o.start(); o.stop(c.currentTime + 0.25); },
  };

  function pluckSfx(freq, when, vol) {
    const c = A.ctx;
    const o = c.createOscillator();
    o.type = 'triangle'; o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.0);
    o.connect(g); g.connect(A.sfxGain);
    o.start(when); o.stop(when + 1.1);
  }

  A.sfx = function (name, arg) { try { if (A.ctx && SFX[name]) SFX[name](arg); } catch (e) {} };

  NLA.audio = A;
})();

/* =====================================================================
   draw.js — canvas helpers, prerendered glow sprites, particle system
   ===================================================================== */
(function () {
  /* roundRect polyfill (older browsers) */
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (typeof r === 'number') r = [r, r, r, r];
      else if (Array.isArray(r)) { while (r.length < 4) r.push(r[r.length - 1] || 0); }
      else r = [0, 0, 0, 0];
      this.moveTo(x + r[0], y);
      this.arcTo(x + w, y, x + w, y + h, r[1]);
      this.arcTo(x + w, y + h, x, y + h, r[2]);
      this.arcTo(x, y + h, x, y, r[3]);
      this.arcTo(x, y, x + w, y, r[0]);
      this.closePath();
      return this;
    };
  }

  const D = {};

  /* ---- prerendered radial glow sprites (cheap additive lights) ---- */
  D.glows = {};
  function makeGlow(name, rgb) {
    const size = 128, c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    grad.addColorStop(0, `rgba(${rgb},0.85)`);
    grad.addColorStop(0.35, `rgba(${rgb},0.32)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    D.glows[name] = c;
  }
  makeGlow('warm', '255,196,110');
  makeGlow('pink', '255,150,190');
  makeGlow('blue', '130,190,255');
  makeGlow('teal', '140,235,220');
  makeGlow('white', '255,245,225');
  makeGlow('red', '255,110,90');
  makeGlow('purple', '190,130,255');

  /* draw a glow sprite centered on x,y with radius r */
  D.glow = function (ctx, name, x, y, r, alpha) {
    const s = D.glows[name] || D.glows.warm;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
    ctx.restore();
  };

  D.rr = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };

  /* Draw a black-backed luminous production sprite without exposing its cell.
     Returns false while the tiny WebP is still decoding so callers can keep a
     procedural first-frame fallback. */
  D.artSprite = function (ctx, key, x, y, w, h, alpha, rotation) {
    const sprite = NLA.art && NLA.art.get(key);
    if (!sprite) return false;
    ctx.save();
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  };

  function lanternVariant(color, requested) {
    if (requested) return requested;
    const c = String(color || '').toLowerCase();
    if (c.includes('4ea3d8') || c.includes('70d8ff')) return 'moon';
    if (c.includes('58b86a') || c.includes('9fd36b')) return 'bamboo';
    if (c.includes('8a5aa8') || c.includes('5e3550')) return 'memory';
    if (c.includes('d8556a') || c.includes('ffb0') || c.includes('ff9d')) return 'lotus';
    if (c.includes('c85ac0') || c.includes('b79aff')) return 'twin';
    if (c.includes('e8d24c') || c.includes('e5b75a')) return 'bronze';
    return 'hoian';
  }

  /* draw a cute lantern body (used by HUD + world) */
  D.lantern = function (ctx, x, y, w, h, color, lit, t, variant) {
    t = t || 0;
    ctx.save();
    ctx.translate(x, y);
    if (lit) D.glow(ctx, 'warm', 0, h * 0.45, h * (1.5 + Math.sin(t * 3) * 0.08), 0.9);
    const premiumVariant = NLA.art && NLA.art.get('lantern_' + lanternVariant(color, variant));
    if (premiumVariant) {
      const sway = t === undefined ? 0 : Math.sin(t * 2.1) * .025;
      ctx.rotate(sway);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = lit ? 1 : .26;
      const dw = w * 1.82, dh = h * 1.82;
      ctx.drawImage(premiumVariant, -dw / 2, -h * .28, dw, dh);
      ctx.restore();
      return;
    }
    /* The tiny optimized sprite replaces the procedural body once decoded.
       Keeping the old drawing below as a fallback prevents a blank first frame
       on slow phones and lets the game start before optional art is ready. */
    const sprite = NLA.art && NLA.art.get('lantern');
    if (sprite) {
      const sway = t === undefined ? 0 : Math.sin(t * 2.1) * .025;
      ctx.rotate(sway);
      ctx.globalAlpha = lit ? 1 : .4;
      const dw = w * 1.55, dh = h * 1.55;
      ctx.drawImage(sprite, -dw / 2, -h * .2, dw, dh);
      ctx.restore();
      return;
    }
    /* cap */
    ctx.fillStyle = '#caa24d';
    D.rr(ctx, -w * 0.28, 0, w * 0.56, h * 0.1, 2); ctx.fill();
    /* body */
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    const base = color || '#e04848';
    grad.addColorStop(0, shade(base, -28));
    grad.addColorStop(0.5, lit ? shade(base, 45) : base);
    grad.addColorStop(1, shade(base, -28));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, h * 0.5, w * 0.5, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    /* ribs */
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(0, h * 0.5, w * 0.5 * Math.abs(i ? 0.62 : 0.3), h * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (lit) {
      ctx.fillStyle = 'rgba(255,246,200,0.85)';
      ctx.beginPath();
      ctx.ellipse(0, h * 0.5, w * 0.18, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    /* bottom cap + tassel */
    ctx.fillStyle = '#caa24d';
    D.rr(ctx, -w * 0.2, h * 0.88, w * 0.4, h * 0.08, 2); ctx.fill();
    ctx.strokeStyle = '#e8c04d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.96);
    ctx.lineTo(0, h * 1.14 + (t !== undefined ? Math.sin(t * 2) * 2 : 0));
    ctx.stroke();
    ctx.restore();
  };

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b;
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  D.shade = shade;

  /* draw a lotus flower (petals around center) */
  D.lotus = function (ctx, x, y, r, open, color) {
    ctx.save();
    ctx.translate(x, y);
    const petals = 7;
    for (let ring = 0; ring < 2; ring++) {
      const rr = r * (ring ? 0.62 : 1);
      const lift = open * (ring ? 0.7 : 1);
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2 + ring * 0.45;
        ctx.save();
        ctx.rotate(a);
        ctx.translate(rr * 0.42 * lift, 0);
        ctx.scale(1, 0.45 + 0.2 * lift);
        ctx.fillStyle = ring ? shade(color || '#ff9db5', 25) : (color || '#ff9db5');
        ctx.beginPath();
        ctx.ellipse(0, 0, rr * 0.5, rr * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = '#ffe9a3';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /* nón lá hat, standalone (icons etc.) */
  D.nonLa = function (ctx, x, y, w, tilt, glowName, glowAmt, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt || 0);
    if (glowAmt > 0) D.glow(ctx, glowName || 'warm', 0, 0, w * 1.2, glowAmt);
    const h = w * 0.42;
    const grad = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    grad.addColorStop(0, '#d9bd83');
    grad.addColorStop(0.5, '#f0dda8');
    grad.addColorStop(1, '#c9a86a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.quadraticCurveTo(w * 0.55, -h * 0.25, w * 0.5, 0);
    ctx.quadraticCurveTo(0, h * 0.28, -w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.55, -h * 0.25, 0, -h);
    ctx.fill();
    /* rings */
    ctx.strokeStyle = 'rgba(120,90,40,0.35)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const f = i / 3.6;
      ctx.beginPath();
      ctx.ellipse(0, -h + h * f * 1.05, w * 0.5 * f, h * 0.24 * f, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  /* small heart shape */
  D.heart = function (ctx, x, y, s, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 10, s / 10);
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = color || '#ff6b93';
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.bezierCurveTo(-1, 0, -6, -1, -6, -5);
    ctx.bezierCurveTo(-6, -8.4, -2.8, -9, 0, -6);
    ctx.bezierCurveTo(2.8, -9, 6, -8.4, 6, -5);
    ctx.bezierCurveTo(6, -1, 1, 0, 0, 3);
    ctx.fill();
    ctx.restore();
  };

  /* sparkle (4-point star) */
  D.sparkle = function (ctx, x, y, s, color, alpha, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = color || '#fff2c0';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      ctx.lineTo(Math.cos(a + Math.PI / 4) * s * 0.28, Math.sin(a + Math.PI / 4) * s * 0.28);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /* ===================== particles ===================== */
  const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const P = { list: [], max: isCoarsePointer ? 240 : 420 };
  D.particles = P;

  P.spawn = function (opt) {
    if (P.list.length >= P.max) P.list.shift();
    P.list.push({
      x: opt.x, y: opt.y,
      vx: opt.vx || 0, vy: opt.vy || 0,
      life: opt.life || 1, age: 0,
      size: opt.size || 3,
      kind: opt.kind || 'spark',   /* spark | firefly | petal | leaf | windline | heart | ember | ripple | firework | smoke | note */
      color: opt.color, grav: opt.grav || 0,
      drag: opt.drag === undefined ? 0.995 : opt.drag,
      glow: opt.glow, spin: opt.spin || 0, rot: Math.random() * 6.28,
      layer: opt.layer || 0, /* 0 = world, 1 = above HUD */
    });
  };

  P.burst = function (x, y, n, opt) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (opt.speed || 80) * (0.4 + Math.random() * 0.8);
      P.spawn(Object.assign({}, opt, {
        x: x + (Math.random() - .5) * (opt.spread || 8),
        y: y + (Math.random() - .5) * (opt.spread || 8),
        vx: Math.cos(a) * sp + (opt.vx || 0),
        vy: Math.sin(a) * sp + (opt.vy || 0),
        life: (opt.life || 1) * (0.6 + Math.random() * 0.7),
      }));
    }
  };

  P.update = function (dt) {
    const l = P.list;
    for (let i = l.length - 1; i >= 0; i--) {
      const p = l[i];
      p.age += dt;
      if (p.age >= p.life) { l.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.spin * dt;
      if (p.kind === 'firefly') {
        p.vx += Math.sin(p.age * 3 + p.rot * 10) * 22 * dt;
        p.vy += Math.cos(p.age * 2.6 + p.rot * 8) * 18 * dt;
      }
      if (p.kind === 'petal' || p.kind === 'leaf') {
        p.vx += Math.sin(p.age * 2 + p.rot) * 30 * dt;
      }
    }
  };

  P.draw = function (ctx, camX, camY, layer) {
    const l = P.list;
    for (let i = 0; i < l.length; i++) {
      const p = l[i];
      if ((p.layer || 0) !== layer) continue;
      const t = p.age / p.life;
      const a = t < 0.15 ? t / 0.15 : (1 - t) / 0.85;
      const x = p.x - camX, y = p.y - camY;
      switch (p.kind) {
        case 'firefly':
          D.glow(ctx, 'warm', x, y, p.size * 4, a * 0.8);
          ctx.globalAlpha = a;
          ctx.fillStyle = '#fff6c8';
          ctx.beginPath(); ctx.arc(x, y, p.size * 0.7, 0, 6.283); ctx.fill();
          ctx.globalAlpha = 1;
          break;
        case 'spark':
          if (p.glow) D.glow(ctx, p.glow, x, y, p.size * 3.2, a * 0.7);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color || '#ffe9a3';
          ctx.beginPath(); ctx.arc(x, y, p.size * (1 - t * 0.5), 0, 6.283); ctx.fill();
          ctx.globalAlpha = 1;
          break;
        case 'star':
          D.sparkle(ctx, x, y, p.size * (1 - t * 0.4), p.color, a, p.rot);
          break;
        case 'petal':
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color || '#ffb3c8';
          ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, 6.283); ctx.fill();
          ctx.restore(); ctx.globalAlpha = 1;
          break;
        case 'leaf':
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color || '#9ec26b';
          ctx.beginPath(); ctx.ellipse(0, 0, p.size * 1.3, p.size * 0.45, 0, 0, 6.283); ctx.fill();
          ctx.restore(); ctx.globalAlpha = 1;
          break;
        case 'windline': {
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = '#cfe8ff';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-p.size * 3, 0);
          ctx.quadraticCurveTo(0, -p.size, p.size * 3, 0);
          ctx.stroke();
          ctx.restore(); ctx.globalAlpha = 1;
          break;
        }
        case 'heart':
          D.heart(ctx, x, y, p.size * (1 + t * 0.3), p.color, a);
          break;
        case 'ripple':
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color || '#bfe8ff';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(x, y, p.size * (0.4 + t * 1.6), p.size * (0.15 + t * 0.5), 0, 0, 6.283); ctx.stroke();
          ctx.globalAlpha = 1;
          break;
        case 'smoke':
          ctx.globalAlpha = a * 0.25;
          ctx.fillStyle = p.color || '#cbb8d8';
          ctx.beginPath(); ctx.arc(x, y, p.size * (0.6 + t * 1.8), 0, 6.283); ctx.fill();
          ctx.globalAlpha = 1;
          break;
        case 'firework':
          if (p.glow) D.glow(ctx, p.glow, x, y, p.size * 4, a * 0.8);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color || '#ffd76b';
          ctx.beginPath(); ctx.arc(x, y, p.size * (1 - t * 0.6), 0, 6.283); ctx.fill();
          ctx.globalAlpha = 1;
          break;
        case 'note':
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(p.age * 4) * 0.2);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color || '#ffd7e8';
          ctx.font = `${Math.round(p.size * 4)}px serif`;
          ctx.fillText('♪', 0, 0);
          ctx.restore(); ctx.globalAlpha = 1;
          break;
      }
    }
  };

  P.clear = function () { P.list.length = 0; };

  NLA.draw = D;
})();

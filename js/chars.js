/* =====================================================================
   chars.js — chibi character rendering (Minh & Linh)
   Draw space: feet at (0,0), character extends upward (negative y).
   ===================================================================== */
(function () {
  const D = () => NLA.draw;

  /* main character draw.
     o: { x, y(feet), face(1|-1), who('boy'|'girl'), pal, t, walkPhase, moving,
          grounded, vy, powerGlow, powerKind('wind'|'light'), shieldOn,
          hands(holding), stun, dim, channel, celebrating, wings, blink } */
  function drawChar(ctx, o) {
    const pal = o.pal;
    const t = o.t || 0;
    ctx.save();
    ctx.translate(o.x, o.y);

    /* soft shadow */
    ctx.globalAlpha = o.grounded ? 0.25 : 0.12;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 5, 0, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.scale(o.face || 1, 1);

    /* squash & stretch */
    let sx = 1, sy = 1;
    if (!o.grounded) { sy = 1.06; sx = 0.96; }
    if (o.landT > 0) { sy = 1 - o.landT * 0.18; sx = 1 + o.landT * 0.15; }
    ctx.scale(sx, sy);

    const bob = o.moving ? Math.abs(Math.sin(o.walkPhase * 2)) * 2.2 : Math.sin(t * 2.2) * 1.4;
    const hurt = o.stun > 0 && Math.floor(t * 14) % 2 === 0;
    if (hurt) ctx.globalAlpha = 0.6;
    if (o.dim > 0) ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.8);

    /* ============ girl aura / power glow behind body ============ */
    if (o.powerGlow > 0) {
      D().glow(ctx, o.powerKind === 'wind' ? 'blue' : 'pink', 0, -40, 60 + o.powerGlow * 40, o.powerGlow * 0.8);
    }

    /* ============ light wings (Love Wind Jump) ============ */
    if (o.wings > 0) {
      ctx.save();
      ctx.globalAlpha = o.wings * 0.7;
      ctx.globalCompositeOperation = 'lighter';
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(-6, -48);
        ctx.rotate(s * (0.5 + Math.sin(t * 8) * 0.18) - 0.25);
        const g = ctx.createLinearGradient(0, 0, -46 * s, -20);
        g.addColorStop(0, 'rgba(255,215,235,0.9)');
        g.addColorStop(1, 'rgba(255,215,235,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(-24 * s, -8, 26, 11, s * 0.4, 0, 6.283);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    const legSwing = o.moving ? Math.sin(o.walkPhase) * 0.55 : 0;
    const isGirl = o.who === 'girl';

    /* ============ legs (white trousers) ============ */
    ctx.strokeStyle = pal.pants;
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    for (const s of [-1, 1]) {
      const ang = legSwing * s + (!o.grounded ? (o.vy < 0 ? -0.35 : 0.3) * s * 0.5 : 0);
      ctx.beginPath();
      ctx.moveTo(s * 4, -30 - bob * 0.4);
      ctx.lineTo(s * 4 + Math.sin(ang) * 13, -6 + Math.abs(Math.cos(ang)) * -2);
      ctx.stroke();
      /* little shoe */
      ctx.fillStyle = '#5a4038';
      ctx.beginPath();
      ctx.ellipse(s * 4 + Math.sin(ang) * 13 + 2, -4, 5.5, 3, 0, 0, 6.283);
      ctx.fill();
    }

    /* ============ áo dài flaps (front & back panels that sway) ============ */
    const sway = (o.moving ? Math.sin(o.walkPhase) * 6 : Math.sin(t * 2) * 2.5) - (o.vxNorm || 0) * 8;
    const hipY = -32 - bob * 0.5;
    const shY = -52 - bob;
    /* back flap */
    ctx.fillStyle = D().shade(pal.robe2, -10);
    ctx.beginPath();
    ctx.moveTo(-8, hipY);
    ctx.quadraticCurveTo(-13 - sway * 0.6, hipY + 14, -10 - sway, hipY + 26 + (isGirl ? 4 : 0));
    ctx.lineTo(-1, hipY + 24 + (isGirl ? 4 : 0));
    ctx.quadraticCurveTo(-2, hipY + 10, 0, hipY);
    ctx.fill();
    /* front flap */
    ctx.fillStyle = pal.robe2;
    ctx.beginPath();
    ctx.moveTo(8, hipY);
    ctx.quadraticCurveTo(13 - sway * 0.6, hipY + 14, 10 - sway, hipY + 26 + (isGirl ? 4 : 0));
    ctx.lineTo(1, hipY + 24 + (isGirl ? 4 : 0));
    ctx.quadraticCurveTo(2, hipY + 10, 0, hipY);
    ctx.fill();

    /* ============ torso (áo dài top) ============ */
    const grad = ctx.createLinearGradient(0, shY, 0, hipY + 8);
    grad.addColorStop(0, pal.robe1);
    grad.addColorStop(1, pal.robe2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-9, shY);
    ctx.quadraticCurveTo(-12, hipY - 6, -9, hipY + 4);
    ctx.lineTo(9, hipY + 4);
    ctx.quadraticCurveTo(12, hipY - 6, 9, shY);
    ctx.quadraticCurveTo(0, shY - 4, -9, shY);
    ctx.fill();
    /* collar + trim (áo dài diagonal button line) */
    ctx.strokeStyle = pal.trim;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, shY - 1);
    ctx.quadraticCurveTo(7, shY + 5, 8, hipY - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, shY + 2);
    ctx.lineTo(9, shY + 2);
    ctx.stroke();
    /* tiny trim dots */
    ctx.fillStyle = pal.trim;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(5.5 + i * 0.8, shY + 6 + i * 7, 1.1, 0, 6.283);
      ctx.fill();
    }

    /* ============ arms ============ */
    ctx.strokeStyle = pal.robe1;
    ctx.lineWidth = 6;
    const armSwing = o.moving ? Math.sin(o.walkPhase + Math.PI) * 0.5 : Math.sin(t * 2.2) * 0.06;
    /* back arm */
    drawArm(ctx, -6, shY + 4, o.channel || o.powerGlow > 0.3 ? -1.9 : -0.5 + armSwing, pal, o);
    /* front arm: raised toward hat when using power / channeling */
    let frontAng = 0.5 - armSwing;
    if (o.powerGlow > 0.25 || o.channel) frontAng = -2.25 + Math.sin(t * 6) * 0.06;
    if (o.hands) frontAng = -0.9; /* reaching out */
    drawArm(ctx, 6, shY + 4, frontAng, pal, o);

    /* ============ head ============ */
    const headY = shY - 14 + Math.sin(t * 2.2) * 0.6;
    /* girl long hair behind */
    if (isGirl) {
      ctx.fillStyle = pal.hair;
      ctx.beginPath();
      ctx.moveTo(-13, headY - 6);
      ctx.quadraticCurveTo(-18 - sway * 0.4, headY + 18, -12 - sway * 0.8, headY + 38);
      ctx.quadraticCurveTo(-6, headY + 40, -6, headY + 24);
      ctx.lineTo(-8, headY - 2);
      ctx.fill();
    }
    /* face */
    ctx.fillStyle = '#ffe6ce';
    ctx.beginPath();
    ctx.arc(0, headY, 14.5, 0, 6.283);
    ctx.fill();
    /* hair fringe */
    ctx.fillStyle = pal.hair;
    ctx.beginPath();
    ctx.arc(0, headY - 3.2, 14.2, Math.PI * 1.02, Math.PI * 1.98);
    if (isGirl) {
      ctx.quadraticCurveTo(15, headY + 3, 11, headY + 7);
      ctx.quadraticCurveTo(12, headY - 4, 6, headY - 8);
      ctx.quadraticCurveTo(0, headY - 5.5, -6, headY - 8.5);
      ctx.quadraticCurveTo(-12, headY - 4, -11, headY + 7);
      ctx.quadraticCurveTo(-15, headY + 3, -14.2, headY - 3);
    } else {
      ctx.quadraticCurveTo(15, headY + 1, 12, headY + 3);
      ctx.quadraticCurveTo(13, headY - 5, 7, headY - 9);
      ctx.quadraticCurveTo(0, headY - 5, -7, headY - 9);
      ctx.quadraticCurveTo(-13, headY - 5, -12, headY + 3);
      ctx.quadraticCurveTo(-15, headY + 1, -14.2, headY - 3);
    }
    ctx.fill();

    /* eyes (blink) */
    const blink = o.blink < 0.12;
    ctx.fillStyle = '#33222a';
    if (o.celebrating || (o.hands && Math.sin(t * 1.5) > 0.4)) {
      /* happy closed ^ ^ eyes */
      ctx.strokeStyle = '#33222a';
      ctx.lineWidth = 1.8;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * 5.6 + 2, headY + 1.5, 3, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    } else if (blink) {
      ctx.strokeStyle = '#33222a';
      ctx.lineWidth = 1.6;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 5.6 + 0.5, headY + 1.5);
        ctx.lineTo(s * 5.6 + 3.5, headY + 1.5);
        ctx.stroke();
      }
    } else {
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(s * 5.6 + 2, headY + 1, 2.4, 3.4, 0, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s * 5.6 + 2.8, headY - 0.2, 1, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = '#33222a';
      }
    }
    /* blush */
    ctx.fillStyle = 'rgba(255,140,150,0.35)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * 8.5 + 1.5, headY + 5.5, 3, 1.8, 0, 0, 6.283);
      ctx.fill();
    }
    /* mouth */
    ctx.strokeStyle = '#a05a50';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (o.stun > 0) { ctx.arc(3, headY + 8.5, 2, 0, Math.PI * 2); }
    else ctx.arc(2.5, headY + 6.5, 3.2, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    /* girl flower over ear */
    if (isGirl && pal.flower) {
      ctx.fillStyle = pal.flower;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.283;
        ctx.beginPath();
        ctx.ellipse(-10 + Math.cos(a) * 2.6, headY - 5 + Math.sin(a) * 2.6, 2, 2, 0, 0, 6.283);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe9a3';
      ctx.beginPath(); ctx.arc(-10, headY - 5, 1.4, 0, 6.283); ctx.fill();
    }

    /* ============ nón lá ============ */
    const hatGlow = o.powerGlow || (o.channel ? 0.8 + Math.sin(t * 10) * 0.2 : 0);
    const hatTilt = (o.moving ? Math.sin(o.walkPhase) * 0.05 : Math.sin(t * 1.8) * 0.03) + (o.channel ? Math.sin(t * 12) * 0.08 : 0);
    D().nonLa(ctx, 0.5, headY - 10.5, 34, hatTilt,
      o.who === 'boy' ? 'blue' : 'pink', hatGlow, t);
    /* hat band (chin ribbon) */
    ctx.strokeStyle = pal.band;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(-9, headY - 8);
    ctx.quadraticCurveTo(-12, headY + 4, -4, headY + 11);
    ctx.stroke();
    ctx.globalAlpha = 1;
    /* wedding veil */
    if (isGirl && pal.veil) {
      ctx.fillStyle = 'rgba(255,240,245,0.4)';
      ctx.beginPath();
      ctx.moveTo(-14, headY - 10);
      ctx.quadraticCurveTo(-24 - sway, headY + 22, -14 - sway, headY + 44);
      ctx.lineTo(-4, headY + 30);
      ctx.lineTo(-8, headY - 8);
      ctx.fill();
    }

    ctx.restore();

    /* shield bubble (drawn unflipped, in world space around char) */
    if (o.shieldOn) {
      const r = o.shieldBig ? 120 : 88;
      ctx.save();
      ctx.translate(o.x, o.y - 40);
      D().glow(ctx, 'teal', 0, 0, r * 1.15, 0.35);
      ctx.strokeStyle = 'rgba(160,240,225,0.75)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 7]);
      ctx.lineDashOffset = -t * 30;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 6.283);
      ctx.stroke();
      ctx.setLineDash([]);
      /* bamboo weave hint */
      ctx.strokeStyle = 'rgba(200,255,240,0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, r - 4 - i * 7, i, i + 2.2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawArm(ctx, x, y, ang, pal, o) {
    const len = 15;
    const ex = x + Math.sin(ang) * len;
    const ey = y + Math.cos(ang) * len;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.sin(ang) * len * 0.5 + 2, y + Math.cos(ang) * len * 0.5, ex, ey);
    ctx.stroke();
    /* hand */
    ctx.fillStyle = '#ffe6ce';
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = pal.robe1;
  }

  /* held-hands connection between the two players */
  function drawHandLink(ctx, p1, p2, t) {
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2 - 44;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,200,220,0.9)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p1.x + (p2.x > p1.x ? 10 : -10), p1.y - 38);
    ctx.quadraticCurveTo(mx, my + 8, p2.x + (p1.x > p2.x ? 10 : -10), p2.y - 38);
    ctx.stroke();
    /* floating hearts */
    const hb = Math.sin(t * 4);
    if (hb > 0.5) NLA.draw.heart(ctx, mx, my - 12 - hb * 4, 5 + hb * 2, '#ff8fae', 0.8);
    ctx.restore();
  }

  /* menu preview: standing character, larger */
  function drawPreview(ctx, who, pal, x, y, scale, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    drawChar(ctx, {
      x: 0, y: 0, face: 1, who, pal, t,
      walkPhase: 0, moving: false, grounded: true,
      powerGlow: 0.25 + Math.sin(t * 2) * 0.15,
      powerKind: who === 'boy' ? 'wind' : 'light',
      blink: (t * 0.4) % 3,
    });
    ctx.restore();
  }

  NLA.chars = { drawChar, drawHandLink, drawPreview };
})();

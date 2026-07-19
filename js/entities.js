/* =====================================================================
   entities.js — players, puzzle objects, enemies, collectibles.
   All coordinates are world-space; draw() is called inside camera
   transform. Feet-anchored positions for characters.
   ===================================================================== */
(function () {
  const C = NLA.CONST, U = NLA.util, D = () => NLA.draw, P = () => NLA.draw.particles;

  /* ==================== PLAYER ==================== */
  class Player {
    constructor(who, x, y) {
      this.who = who;                 /* 'boy' | 'girl' */
      this.x = x; this.y = y;         /* feet position */
      this.vx = 0; this.vy = 0;
      this.face = 1;
      this.grounded = false;
      this.coyote = 0; this.jumpBuf = 0; this.jumpHeld = false;
      this.walkPhase = 0; this.blinkT = Math.random() * 3;
      this.landT = 0; this.stun = 0; this.dim = 0;
      this.maxHp = 4; this.hp = this.maxHp; this.invuln = 0;
      this.cd1 = 0; this.cd2 = 0;
      this.hatEnergy = 100; this.hatCd = 0;
      this.shieldMeter = C.SHIELD_MAX; this.shieldOn = false;
      this.channel = false;           /* wind bridge channeling */
      this.channelLight = false;      /* finale channel */
      this.powerFx = 0;               /* visual glow after using power */
      this.wings = 0;
      this.lastSafeX = x; this.lastSafeY = y;
      this.remote = false;            /* driven by network */
      this.standOn = null;
      this.emote = 0; this.emoteT = 0;
      this.prev = {};                 /* previous ctrl for edge detect */
    }
    get speed() { return (this.who === 'boy' ? C.MOVE_SPEED : C.MOVE_SPEED_GIRL) * (this.dim > 0 ? 0.55 : 1); }
    get jumpV() { return this.who === 'boy' ? C.JUMP_V : C.JUMP_V_GIRL; }
    rect() { return { x: this.x - C.PLAYER_W / 2, y: this.y - C.PLAYER_H, w: C.PLAYER_W, h: C.PLAYER_H }; }

    update(dt, ctrl, world) {
      this.blinkT = (this.blinkT + dt) % 3.2;
      this.landT = Math.max(0, this.landT - dt * 4);
      this.stun = Math.max(0, this.stun - dt);
      this.dim = Math.max(0, this.dim - dt);
      this.invuln = Math.max(0, this.invuln - dt);
      this.cd1 = Math.max(0, this.cd1 - dt);
      this.cd2 = Math.max(0, this.cd2 - dt);
      this.hatCd = Math.max(0, this.hatCd - dt);
      this.hatEnergy = Math.min(100, this.hatEnergy + C.HAT_SPECIAL_REGEN * dt);
      this.powerFx = Math.max(0, this.powerFx - dt * 2);
      this.emoteT = Math.max(0, this.emoteT - dt);
      this.wings = Math.max(0, this.wings - dt * 1.2);

      if (this.remote) { this.updateRemote(dt); return; }
      const stunned = this.stun > 0;
      const c = stunned ? {} : (ctrl || {});

      /* horizontal */
      const dir = (c.left ? -1 : 0) + (c.right ? 1 : 0);
      this.moveDir = dir;
      const target = dir * this.speed;
      const accel = this.grounded ? 2600 : 1700;
      if (target > this.vx) this.vx = Math.min(target, this.vx + accel * dt);
      else if (target < this.vx) this.vx = Math.max(target, this.vx - accel * dt);
      if (dir !== 0) this.face = dir;
      if (dir !== 0 && this.grounded) this.walkPhase += dt * 11;

      /* jump */
      this.coyote = this.grounded ? C.COYOTE : Math.max(0, this.coyote - dt);
      if (c.jump && !this.prev.jump) this.jumpBuf = C.JUMP_BUFFER;
      else this.jumpBuf = Math.max(0, this.jumpBuf - dt);
      if (this.jumpBuf > 0 && this.coyote > 0) {
        this.vy = -this.jumpV;
        this.jumpBuf = 0; this.coyote = 0; this.grounded = false;
        NLA.audio.sfx('jump');
        P().burst(this.x, this.y, 5, { kind: 'spark', color: '#e8e0d0', speed: 60, life: 0.4, size: 2 });
      }
      /* variable jump height */
      if (!c.jump && this.vy < -260) this.vy = -260;

      /* gravity */
      this.vy = Math.min(1300, this.vy + C.GRAVITY * dt);

      this.moveAndCollide(dt, world);
      this.prev = { jump: !!c.jump, pow1: !!c.pow1, pow2: !!c.pow2, special: !!c.special, hands: !!c.hands };
    }

    updateRemote(dt) {
      /* smooth toward network target */
      if (this.netTarget) {
        const t = Math.min(1, dt * 14);
        this.x = U.lerp(this.x, this.netTarget.x, t);
        this.y = U.lerp(this.y, this.netTarget.y, t);
        this.vx = this.netTarget.vx; this.vy = this.netTarget.vy;
        this.face = this.netTarget.face;
        this.grounded = this.netTarget.grounded;
        if (this.netTarget.moving) this.walkPhase += dt * 11;
        this.moving = this.netTarget.moving;
        this.moveDir = Math.abs(this.vx) > 40 ? Math.sign(this.vx) : 0;
        this.shieldOn = this.netTarget.shieldOn;
        this.channel = this.netTarget.channel;
        this.channelLight = this.netTarget.channelLight;
        if (Number.isFinite(this.netTarget.hp)) this.hp = this.netTarget.hp;
        if (Number.isFinite(this.netTarget.hatEnergy)) this.hatEnergy = this.netTarget.hatEnergy;
      }
    }

    moveAndCollide(dt, world) {
      const solids = world.solids;
      const r = C.PLAYER_W / 2, h = C.PLAYER_H;
      /* X */
      this.x += this.vx * dt;
      for (const s of solids) {
        if (s.oneWay) continue;
        if (this.x + r > s.x && this.x - r < s.x + s.w && this.y > s.y + 2 && this.y - h < s.y + s.h) {
          if (this.vx > 0 && this.x < s.x + s.w / 2) { this.x = s.x - r; this.vx = 0; }
          else if (this.vx < 0 && this.x > s.x + s.w / 2) { this.x = s.x + s.w + r; this.vx = 0; }
        }
      }
      this.x = U.clamp(this.x, r, world.level.W - r);
      /* Y */
      const prevY = this.y;
      this.y += this.vy * dt;
      const wasGrounded = this.grounded;
      this.grounded = false;
      this.standOn = null;
      for (const s of solids) {
        if (this.x + r <= s.x || this.x - r >= s.x + s.w) continue;
        /* landing */
        if (this.vy >= 0 && prevY <= s.y + 6 && this.y >= s.y && this.y <= s.y + s.h + 20) {
          this.y = s.y; this.vy = 0; this.grounded = true; this.standOn = s;
          if (!wasGrounded) { this.landT = 1; NLA.audio.sfx('land'); }
        }
        /* head bump */
        else if (!s.oneWay && this.vy < 0 && prevY - h >= s.y + s.h - 6 && this.y - h <= s.y + s.h) {
          this.y = s.y + s.h + h; this.vy = 0;
        }
      }
      if (this.grounded && !world.waterAt(this.x)) { this.lastSafeX = this.x; this.lastSafeY = this.y; }
    }

    draw(ctx, t, world) {
      const g = NLA.game;
      const loveLv = g ? g.loveLevel : 0;
      NLA.chars.drawChar(ctx, {
        x: this.x, y: this.y, face: this.face, who: this.who,
        pal: NLA.costumeFor(this.who), t,
        walkPhase: this.walkPhase,
        moving: Math.abs(this.vx) > 30 && this.grounded,
        grounded: this.grounded, vy: this.vy,
        vxNorm: U.clamp(this.vx / 300, -1, 1),
        landT: this.landT,
        powerGlow: this.powerFx + (this.channelLight ? 0.9 : 0),
        powerKind: this.who === 'boy' ? 'wind' : 'light',
        shieldOn: this.shieldOn, shieldBig: loveLv >= 3,
        stun: this.stun, dim: this.dim,
        channel: this.channel || this.channelLight,
        hands: g && g.holdingHands,
        wings: this.wings,
        blink: this.blinkT,
        celebrating: g && g.celebrating,
      });
      /* name tag above the hat (hidden while emoting) */
      if (g && this.emoteT <= 0 && !g.cutscene) {
        const nm = g.nameFor ? g.nameFor(this.who) : '';
        if (nm) {
          ctx.save();
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.globalAlpha = 0.85;
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(20,10,32,0.7)';
          ctx.strokeText(nm, this.x, this.y - 102);
          ctx.fillStyle = this.who === 'boy' ? '#bfe0ff' : '#ffd7e8';
          ctx.fillText(nm, this.x, this.y - 102);
          ctx.restore();
        }
      }
      /* emote bubble */
      if (this.emoteT > 0) {
        const ey = this.y - 108 - (1 - this.emoteT) * 20;
        ctx.globalAlpha = Math.min(1, this.emoteT * 2);
        if (this.emote === 1) D().heart(ctx, this.x, ey, 9, '#ff6b93', 1);
        else if (this.emote === 2) { ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.fillText('👋', this.x, ey + 8); }
        else { D().sparkle(ctx, this.x, ey, 10, '#ffe9a3', 1, t * 2); }
        ctx.globalAlpha = 1;
      }
    }
  }

  /* ==================== helpers ==================== */
  function overlapRect(px, py, r) {
    return px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h;
  }
  function playerOn(pl, x, w) { return pl.x > x && pl.x < x + w; }

  /* ==================== OBJECTS ==================== */

  class StoneLantern {
    constructor(o, lv) {
      this.id = o.id; this.x = o.x;
      this.y = o.y !== undefined ? o.y : lv.groundY;
      this.key = !!o.key; this.brazier = !!o.brazier;
      this.broken = !!o.broken; this.lit = false;
      this.fx = 0;
    }
    onLight(world) {
      if (this.broken) {
        this.broken = false; this.fx = 1;
        NLA.audio.sfx('heal');
        P().burst(this.x, this.y - 50, 14, { kind: 'spark', color: '#ffd7e8', glow: 'pink', speed: 90, life: 0.8, size: 3 });
        world.emitEvent('heal', { id: this.id });
        return true;
      }
      if (!this.lit) {
        this.lit = true; this.fx = 1;
        NLA.audio.sfx('lanternLit');
        P().burst(this.x, this.y - 60, 16, { kind: 'spark', color: '#ffe9a3', glow: 'warm', speed: 100, life: 0.9, size: 3 });
        world.onLanternLit(this);
        return true;
      }
      return false;
    }
    update(dt) { this.fx = Math.max(0, this.fx - dt); }
    draw(ctx, t) {
      const x = this.x, y = this.y;
      ctx.save();
      if (this.brazier) {
        /* bronze brazier bowl on legs */
        ctx.fillStyle = '#6b4a26';
        ctx.beginPath(); ctx.moveTo(x - 22, y - 34); ctx.quadraticCurveTo(x, y - 12, x + 22, y - 34);
        ctx.lineTo(x + 26, y - 42); ctx.lineTo(x - 26, y - 42); ctx.fill();
        ctx.strokeStyle = '#6b4a26'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x - 14, y - 16); ctx.lineTo(x - 20, y); ctx.moveTo(x + 14, y - 16); ctx.lineTo(x + 20, y); ctx.stroke();
        ctx.fillStyle = '#8a6238';
        ctx.fillRect(x - 26, y - 46, 52, 6);
        if (this.lit) {
          D().glow(ctx, 'warm', x, y - 56, 70 + Math.sin(t * 5) * 6, 0.85);
          flame(ctx, x, y - 46, 14, t);
        }
      } else {
        const tilt = this.broken ? 0.12 : 0;
        ctx.translate(x, y); ctx.rotate(tilt); ctx.translate(-x, -y);
        /* pedestal */
        ctx.fillStyle = this.broken ? '#5d5a66' : '#75717e';
        ctx.fillRect(x - 8, y - 46, 16, 46);
        ctx.fillRect(x - 16, y - 6, 32, 6);
        /* housing */
        ctx.fillStyle = this.broken ? '#514e5a' : '#665f70';
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 46);
        ctx.lineTo(x + 20, y - 46);
        ctx.lineTo(x + 14, y - 74);
        ctx.lineTo(x - 14, y - 74);
        ctx.fill();
        /* roof cap */
        ctx.beginPath();
        ctx.moveTo(x - 24, y - 74);
        ctx.quadraticCurveTo(x, y - 92, x + 24, y - 74);
        ctx.fill();
        if (this.broken) {
          ctx.strokeStyle = '#2e2b36'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x - 6, y - 50); ctx.lineTo(x + 2, y - 62); ctx.lineTo(x - 3, y - 70); ctx.stroke();
        }
        /* window */
        if (this.lit) {
          D().glow(ctx, 'warm', x, y - 60, 75 + Math.sin(t * 4) * 5, 0.9);
          ctx.fillStyle = '#ffedb0';
        } else ctx.fillStyle = this.broken ? '#37343f' : '#4a4653';
        ctx.fillRect(x - 8, y - 68, 16, 18);
        if (this.lit) flame(ctx, x, y - 58, 8, t);
      }
      if (this.key && !this.lit) {
        /* gentle marker */
        ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25;
        D().sparkle(ctx, this.x, this.y - 104, 6, '#ffe9a3', 1, t);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }

  function flame(ctx, x, y, s, t) {
    const w = Math.sin(t * 9) * s * 0.14;
    ctx.fillStyle = '#ffb340';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.4, y);
    ctx.quadraticCurveTo(x - s * 0.5 + w, y - s * 0.8, x + w, y - s * 1.4);
    ctx.quadraticCurveTo(x + s * 0.5 + w, y - s * 0.8, x + s * 0.4, y);
    ctx.fill();
    ctx.fillStyle = '#fff0b8';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y - s * 0.35, s * 0.22, s * 0.4, 0, 0, 6.283);
    ctx.fill();
  }

  class WireLantern {
    constructor(o) {
      this.id = o.id; this.x1 = o.x1; this.x2 = o.x2; this.y = o.y;
      this.pos = o.pos; this.len = o.len; this.key = !!o.key;
      this.lit = false; this.slideV = 0; this.ang = 0; this.aVel = 0;
    }
    bob() { return { x: this.pos + Math.sin(this.ang) * this.len, y: this.y + Math.cos(this.ang) * this.len }; }
    onGust(dir, world) {
      this.slideV += dir * 260;
      this.aVel += dir * 2.4;
      world.emitEvent('wireGust', { id: this.id, dir });
    }
    onLight(world) {
      if (this.lit) return false;
      this.lit = true;
      NLA.audio.sfx('lanternLit');
      const b = this.bob();
      P().burst(b.x, b.y, 16, { kind: 'spark', color: '#ffe9a3', glow: 'warm', speed: 90, life: 0.9, size: 3 });
      world.onLanternLit(this);
      return true;
    }
    update(dt) {
      this.pos += this.slideV * dt;
      this.slideV *= Math.pow(0.12, dt);
      if (this.pos < this.x1 + 14) { this.pos = this.x1 + 14; this.slideV = 0; }
      if (this.pos > this.x2 - 14) { this.pos = this.x2 - 14; this.slideV = 0; }
      /* pendulum */
      this.aVel += -this.ang * 9 * dt;
      this.aVel *= Math.pow(0.35, dt);
      this.ang += this.aVel * dt;
    }
    draw(ctx, t) {
      /* posts + wire */
      ctx.strokeStyle = '#3a2e34';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(this.x1, this.y - 6); ctx.lineTo(this.x1, this.y + 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(this.x2, this.y - 6); ctx.lineTo(this.x2, this.y + 26); ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(220,210,190,0.5)';
      ctx.beginPath(); ctx.moveTo(this.x1, this.y); ctx.lineTo(this.x2, this.y); ctx.stroke();
      /* rope down to lantern */
      const b = this.bob();
      ctx.strokeStyle = 'rgba(220,210,190,0.6)';
      ctx.beginPath(); ctx.moveTo(this.pos, this.y); ctx.lineTo(b.x, b.y - 18); ctx.stroke();
      D().lantern(ctx, b.x, b.y - 18, 30, 34, '#d8556a', this.lit, t);
      if (this.key && !this.lit) {
        ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25;
        D().sparkle(ctx, b.x, b.y - 44, 6, '#ffe9a3', 1, t);
        ctx.globalAlpha = 1;
      }
    }
  }

  class Candle {
    constructor(o, lv) {
      this.x = o.x; this.group = o.group;
      this.surface = lv.water.find(w => o.x >= w.x && o.x <= w.x + w.w);
      this.y = (this.surface ? this.surface.y : 880) - 4;
      this.lit = false; this.phase = Math.random() * 6;
      this.id = o.id;
    }
    onLight(world) {
      if (this.lit) return false;
      this.lit = true;
      NLA.audio.sfx('chime', 2);
      P().burst(this.x, this.y - 10, 8, { kind: 'spark', color: '#ffd7a3', glow: 'warm', speed: 50, life: 0.7, size: 2.5 });
      world.onCandleLit(this);
      return true;
    }
    update(dt, world) { this.bobY = Math.sin(world.t * 1.6 + this.phase) * 3; }
    draw(ctx, t) {
      const y = this.y + (this.bobY || 0);
      if (this.lit) D().glow(ctx, 'warm', this.x, y - 8, 40, 0.8);
      /* lotus paper boat */
      D().lotus(ctx, this.x, y, 13, 0.8, this.lit ? '#ffb0c8' : '#9c7f95');
      /* candle */
      ctx.fillStyle = '#fff0d0';
      ctx.fillRect(this.x - 2, y - 10, 4, 8);
      if (this.lit) flame(ctx, this.x, y - 10, 6, t + this.phase);
    }
  }

  class RopeGate {
    constructor(o) {
      this.id = o.id; this.x = o.x; this.group = o.group; this.n = o.n;
      this.open = false; this.openT = 0;
    }
    update(dt, world) {
      if (!this.open) {
        const lit = world.objects.filter(c => c instanceof Candle && c.group === this.group && c.lit).length;
        if (lit >= this.n) {
          this.open = true;
          NLA.audio.sfx('gate');
          world.addLove(NLA.LOVE.puzzle, this.x, 800);
          world.emitEvent('ropeOpen', { id: this.id });
        }
      }
      if (this.open && this.openT < 1) this.openT = Math.min(1, this.openT + dt * 0.8);
    }
    solid() {
      if (this.openT > 0.8) return null;
      return { x: this.x - 8, y: 700 + this.openT * 160, w: 16, h: 200, ropegate: true };
    }
    draw(ctx, t) {
      const sink = this.openT * 170;
      const topY = 706 + sink;
      /* poles */
      ctx.strokeStyle = '#5a4030';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(this.x - 46, 900); ctx.lineTo(this.x - 46, topY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(this.x + 46, 900); ctx.lineTo(this.x + 46, topY); ctx.stroke();
      /* rope net */
      ctx.strokeStyle = 'rgba(220,190,140,0.85)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        const y = topY + 12 + i * 34;
        if (y > 886) continue;
        ctx.beginPath();
        ctx.moveTo(this.x - 46, y);
        ctx.quadraticCurveTo(this.x, y + 10, this.x + 46, y);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(this.x, topY + 12); ctx.lineTo(this.x, Math.min(886, topY + 130)); ctx.stroke();
      /* little flags */
      ctx.fillStyle = '#d8556a';
      ctx.beginPath();
      ctx.moveTo(this.x - 46, topY); ctx.lineTo(this.x - 46 + 18, topY + 6); ctx.lineTo(this.x - 46, topY + 12);
      ctx.fill();
      ctx.fillStyle = '#e8b54d';
      ctx.beginPath();
      ctx.moveTo(this.x + 46, topY); ctx.lineTo(this.x + 46 - 18, topY + 6); ctx.lineTo(this.x + 46, topY + 12);
      ctx.fill();
    }
  }

  class Box {
    constructor(o, lv) {
      this.id = o.id; this.x = o.x; this.y = lv.groundY; /* feet/bottom */
      this.w = 52; this.h = 46; this.vx = 0; this.vy = 0;
    }
    rect() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    solid() { const r = this.rect(); return { x: r.x, y: r.y, w: r.w, h: r.h }; }
    onGust(dir, world) { this.vx += dir * 260; NLA.audio.sfx('push'); }
    update(dt, world) {
      /* pushed by the boy walking into it (uses input intent, since
         collision zeroes his vx) */
      for (const pl of world.players) {
        if (pl.who !== 'boy') continue;
        const r = this.rect();
        if (pl.y > r.y + 8 && pl.y - C.PLAYER_H < r.y + r.h) {
          const half = C.PLAYER_W / 2;
          if (pl.moveDir > 0 && pl.x < this.x && pl.x + half > r.x - 6) { this.vx = 85; if (Math.random() < 0.08) NLA.audio.sfx('push'); }
          else if (pl.moveDir < 0 && pl.x > this.x && pl.x - half < r.x + r.w + 6) { this.vx = -85; if (Math.random() < 0.08) NLA.audio.sfx('push'); }
        }
      }
      this.vy = Math.min(1200, this.vy + C.GRAVITY * dt);
      this.x += this.vx * dt;
      this.vx *= Math.pow(0.02, dt);
      this.y += this.vy * dt;
      for (const s of world.staticSolids) {
        if (this.x + this.w / 2 > s.x && this.x - this.w / 2 < s.x + s.w) {
          if (this.vy >= 0 && this.y >= s.y && this.y - 20 <= s.y) { this.y = s.y; this.vy = 0; }
        }
      }
      this.x = U.clamp(this.x, this.w / 2, world.level.W - this.w / 2);
    }
    draw(ctx) {
      const r = this.rect();
      ctx.fillStyle = '#8a6238';
      D().rr(ctx, r.x, r.y, r.w, r.h, 4); ctx.fill();
      ctx.strokeStyle = '#5d3f22';
      ctx.lineWidth = 2.5;
      D().rr(ctx, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 3); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r.x + 3, r.y + 3); ctx.lineTo(r.x + r.w - 3, r.y + r.h - 3);
      ctx.moveTo(r.x + r.w - 3, r.y + 3); ctx.lineTo(r.x + 3, r.y + r.h - 3);
      ctx.stroke();
    }
  }

  class Plate {
    constructor(o, lv) {
      this.id = o.id; this.x = o.x;
      this.y = o.y !== undefined ? o.y : lv.groundY;
      this.pressed = false; this.wasPressed = false;
    }
    update(dt, world) {
      this.wasPressed = this.pressed;
      this.pressed = false;
      for (const pl of world.players) {
        if (Math.abs(pl.x - this.x) < 34 && Math.abs(pl.y - this.y) < 10) this.pressed = true;
      }
      for (const ob of world.objects) {
        if (ob instanceof Box && Math.abs(ob.x - this.x) < 38 && Math.abs(ob.y - this.y) < 10) this.pressed = true;
      }
      if (this.pressed && !this.wasPressed) { NLA.audio.sfx('click'); world.emitEvent('plate', { id: this.id, on: true }); }
      if (!this.pressed && this.wasPressed) world.emitEvent('plate', { id: this.id, on: false });
    }
    draw(ctx, t) {
      const dy = this.pressed ? 4 : 0;
      ctx.fillStyle = '#6b5a2e';
      D().rr(ctx, this.x - 34, this.y - 6, 68, 6, 2); ctx.fill();
      const grad = ctx.createLinearGradient(this.x - 30, 0, this.x + 30, 0);
      grad.addColorStop(0, '#caa24d'); grad.addColorStop(0.5, '#f2d17e'); grad.addColorStop(1, '#caa24d');
      ctx.fillStyle = grad;
      D().rr(ctx, this.x - 30, this.y - 12 + dy, 60, 7, 3); ctx.fill();
      if (!this.pressed) {
        ctx.globalAlpha = 0.4 + Math.sin(t * 3) * 0.2;
        D().sparkle(ctx, this.x, this.y - 24, 5, '#ffe9a3', 1, t);
        ctx.globalAlpha = 1;
      }
    }
  }

  class Gate {
    constructor(o, lv) {
      this.id = o.id; this.x = o.x; this.need = o.need || {};
      this.temple = !!o.temple;
      this.y = lv.groundY; this.h = 150; this.w = 26;
      this.open = false; this.openT = 0;
    }
    conditionMet(world) {
      const n = this.need;
      if (n.plates) { if (!n.plates.every(id => { const p = world.byId[id]; return p && p.pressed; })) return false; }
      if (n.platesAny) { if (!n.platesAny.some(id => { const p = world.byId[id]; return p && p.pressed; })) return false; }
      if (n.lanterns) {
        if (!n.lanterns.every(id => {
          const l = world.byId[id];
          return l && (l.lit || (l instanceof Statue && l.healed));
        })) return false;
      }
      if (n.together) {
        const [a, b] = world.players;
        if (!(Math.abs(a.x - this.x) < 130 && Math.abs(b.x - this.x) < 130 && Math.abs(a.x - b.x) < 110)) return false;
      }
      return true;
    }
    update(dt, world) {
      const met = this.conditionMet(world);
      if (met && !this.open) {
        this.open = true;
        NLA.audio.sfx('gate');
        world.addLove(NLA.LOVE.puzzle, this.x, this.y - 80);
        P().burst(this.x, this.y - 80, 12, { kind: 'spark', color: '#ffe9a3', glow: 'warm', speed: 80, life: 0.8, size: 3 });
        world.emitEvent('gateOpen', { id: this.id });
      }
      /* together-gates close again if couple leaves before fully open */
      if (this.open && this.openT < 1) this.openT = Math.min(1, this.openT + dt * 0.9);
    }
    solid() {
      if (this.openT >= 0.85) return null;
      const rise = this.openT * this.h;
      return { x: this.x - this.w / 2, y: this.y - this.h + rise * 0 - 0, w: this.w, h: this.h, gate: true, riseY: rise };
    }
    draw(ctx, t) {
      const rise = this.openT * (this.h + 10);
      const gy = this.y - this.h - rise;
      ctx.save();
      /* posts */
      ctx.fillStyle = this.temple ? '#5e1f1e' : '#4a3628';
      ctx.fillRect(this.x - this.w / 2 - 10, this.y - this.h - 26, 10, this.h + 26);
      ctx.fillRect(this.x + this.w / 2, this.y - this.h - 26, 10, this.h + 26);
      /* lintel */
      ctx.fillStyle = this.temple ? '#7e2f2a' : '#5d4432';
      ctx.beginPath();
      ctx.moveTo(this.x - this.w / 2 - 22, this.y - this.h - 22);
      ctx.quadraticCurveTo(this.x, this.y - this.h - 42, this.x + this.w / 2 + 22, this.y - this.h - 22);
      ctx.lineTo(this.x + this.w / 2 + 22, this.y - this.h - 10);
      ctx.quadraticCurveTo(this.x, this.y - this.h - 28, this.x - this.w / 2 - 22, this.y - this.h - 10);
      ctx.fill();
      if (this.temple) {
        ctx.fillStyle = '#c99a3a';
        ctx.fillRect(this.x - this.w / 2 - 10, this.y - this.h - 30, this.w + 20, 5);
      }
      /* sliding door */
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.x - this.w / 2 - 2, this.y - this.h - 4, this.w + 4, this.h + 4);
      ctx.clip();
      const doorGrad = ctx.createLinearGradient(this.x - this.w / 2, 0, this.x + this.w / 2, 0);
      if (this.temple) { doorGrad.addColorStop(0, '#8e2f31'); doorGrad.addColorStop(0.5, '#b2453c'); doorGrad.addColorStop(1, '#8e2f31'); }
      else { doorGrad.addColorStop(0, '#6b4c30'); doorGrad.addColorStop(0.5, '#8a6844'); doorGrad.addColorStop(1, '#6b4c30'); }
      ctx.fillStyle = doorGrad;
      ctx.fillRect(this.x - this.w / 2, gy, this.w, this.h);
      /* emblem */
      if (this.need.together) {
        D().heart(ctx, this.x, gy + 46, 9, '#ffd7a3', 0.9);
        ctx.strokeStyle = 'rgba(255,225,170,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(this.x, gy + 44, 15, 0, 6.283); ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,225,170,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x, gy + 44, 9, 0, 6.283); ctx.stroke();
      }
      ctx.restore();
      /* hint for together gates */
      if (this.need.together && !this.open) {
        ctx.globalAlpha = 0.55 + Math.sin(t * 3) * 0.25;
        D().heart(ctx, this.x, this.y - this.h - 54, 8, '#ff8fae', 1);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }

  class Plank { /* bridge built permanently once its plate is pressed */
    constructor(o, lv) {
      this.id = o.id; this.x = o.x; this.w = o.w; this.plate = o.plate;
      this.y = lv.groundY; this.built = false; this.buildT = 0;
    }
    update(dt, world) {
      if (!this.built) {
        const p = world.byId[this.plate];
        if (p && p.pressed) {
          this.built = true;
          NLA.audio.sfx('gate');
          world.addLove(NLA.LOVE.assist, this.x + this.w / 2, this.y - 40);
          world.emitEvent('plank', { id: this.id });
        }
      }
      if (this.built && this.buildT < 1) this.buildT = Math.min(1, this.buildT + dt * 1.6);
    }
    solid() {
      if (this.buildT < 0.4) return null;
      return { x: this.x, y: this.y, w: this.w * this.buildT, h: 14 };
    }
    draw(ctx) {
      if (this.buildT <= 0) return;
      const w = this.w * this.buildT;
      ctx.fillStyle = '#8a6844';
      D().rr(ctx, this.x, this.y, w, 12, 3); ctx.fill();
      ctx.strokeStyle = '#5d4028';
      ctx.lineWidth = 1.5;
      for (let px = this.x + 12; px < this.x + w - 6; px += 22) {
        ctx.beginPath(); ctx.moveTo(px, this.y + 1); ctx.lineTo(px, this.y + 11); ctx.stroke();
      }
    }
  }

  class BrokenBridge {
    constructor(o, lv) {
      this.id = o.id; this.x = o.x; this.w = o.w;
      this.y = lv.groundY; this.healed = false; this.healT = 0;
    }
    onLight(world) {
      if (this.healed) return false;
      this.healed = true;
      NLA.audio.sfx('heal');
      world.addLove(NLA.LOVE.puzzle, this.x + this.w / 2, this.y - 40);
      P().burst(this.x + this.w / 2, this.y, 16, { kind: 'spark', color: '#ffd7e8', glow: 'pink', speed: 90, life: 0.8, size: 3 });
      world.emitEvent('bridgeHeal', { id: this.id });
      return true;
    }
    lightTarget() { return { x: this.x + this.w / 2, y: this.y }; }
    update(dt) { if (this.healed && this.healT < 1) this.healT = Math.min(1, this.healT + dt * 1.4); }
    solid() {
      if (this.healT < 0.5) return null;
      return { x: this.x - 6, y: this.y, w: this.w + 12, h: 14 };
    }
    draw(ctx, t) {
      ctx.save();
      if (!this.healed) {
        /* broken planks hanging on each side */
        ctx.strokeStyle = '#7a5a38'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(this.x, this.y + 4); ctx.lineTo(this.x + 34, this.y + 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + this.w, this.y + 4); ctx.lineTo(this.x + this.w - 34, this.y + 30); ctx.stroke();
        ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25;
        D().sparkle(ctx, this.x + this.w / 2, this.y - 20, 7, '#ffb0d0', 1, t);
        ctx.globalAlpha = 1;
      } else {
        const w = this.w * this.healT;
        const cx = this.x + this.w / 2;
        ctx.fillStyle = '#9c7a4e';
        D().rr(ctx, cx - w / 2 - 6, this.y, w + 12, 12, 4); ctx.fill();
        ctx.strokeStyle = '#6b4c2c'; ctx.lineWidth = 1.5;
        for (let px = cx - w / 2 + 8; px < cx + w / 2; px += 20) {
          ctx.beginPath(); ctx.moveTo(px, this.y + 1); ctx.lineTo(px, this.y + 11); ctx.stroke();
        }
        /* rope rails */
        ctx.strokeStyle = 'rgba(200,170,120,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - w / 2, this.y - 20);
        ctx.quadraticCurveTo(cx, this.y - 12, cx + w / 2, this.y - 20); ctx.stroke();
      }
      ctx.restore();
    }
  }

  class LotusSpot {
    constructor(o, lv) {
      this.id = o.id || ('lo' + o.x); this.x = o.x;
      const w = lv.water.find(w => o.x >= w.x && o.x <= w.x + w.w);
      this.surface = w ? w.y : 880;
      this.grown = false; this.riseT = 0; this.phase = Math.random() * 6;
    }
    grow(world) {
      if (this.grown) return false;
      this.grown = true;
      NLA.audio.sfx('lotus');
      P().burst(this.x, this.surface - 10, 14, { kind: 'petal', color: '#ffb3c8', speed: 70, life: 1.2, size: 4, grav: 60 });
      world.emitEvent('lotus', { id: this.id });
      return true;
    }
    update(dt) { if (this.grown && this.riseT < 1) this.riseT = Math.min(1, this.riseT + dt * 1.3); }
    padY(t) { return this.surface - 12 - this.riseT * 14 + Math.sin((t || 0) * 1.4 + this.phase) * 2.5; }
    solid(world) {
      if (this.riseT < 0.35) return null;
      return { x: this.x - 52, y: this.padY(world.t), w: 104, h: 12, oneWay: true, lotus: this };
    }
    draw(ctx, t) {
      if (!this.grown) {
        /* sparkling water hint */
        ctx.globalAlpha = 0.55 + Math.sin(t * 2.6 + this.phase) * 0.3;
        D().sparkle(ctx, this.x - 14, this.surface - 8, 4, '#a3f0e0', 1, t);
        D().sparkle(ctx, this.x + 12, this.surface - 14, 5, '#ffd7e8', 1, -t * 1.3);
        ctx.globalAlpha = 1;
        return;
      }
      const y = this.padY(t);
      const s = 0.4 + this.riseT * 0.6;
      /* leaf pad */
      ctx.fillStyle = '#3f8a5c';
      ctx.beginPath();
      ctx.ellipse(this.x, y + 8, 54 * s, 13 * s, 0, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = '#4fa76e';
      ctx.beginPath();
      ctx.ellipse(this.x, y + 5, 50 * s, 11 * s, 0, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = 'rgba(30,80,50,0.4)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.283 + 0.4;
        ctx.beginPath();
        ctx.moveTo(this.x, y + 5);
        ctx.lineTo(this.x + Math.cos(a) * 44 * s, y + 5 + Math.sin(a) * 9 * s);
        ctx.stroke();
      }
      /* flower */
      D().lotus(ctx, this.x + 30 * s, y + 2, 12 * s, this.riseT, '#ff9db5');
    }
  }

  class WindMark {
    constructor(o, lv) {
      this.id = o.id; this.x = o.x; this.gapw = o.gapw;
      this.y = lv.groundY; this.active = 0; /* fades */
      this.energy = 1;
    }
    update(dt, world) {
      /* boy stands near mark & holds pow1 → bridge */
      let channeling = false;
      for (const pl of world.players) {
        if (pl.who !== 'boy') continue;
        const near = Math.abs(pl.x - this.x) < 60 && Math.abs(pl.y - this.y) < 30;
        if (near && pl.holdingPow1 && this.energy > 0) {
          channeling = true;
          pl.channel = true;
          this.energy = Math.max(0, this.energy - dt / 6);
          if (Math.random() < dt * 30) {
            P().spawn({ x: this.x + 60 + Math.random() * this.gapw, y: this.y - 6 + (Math.random() - .5) * 14, vx: 140, vy: (Math.random() - .5) * 30, life: 0.7, size: 4, kind: 'windline' });
          }
        } else if (pl.channel && !channeling) pl.channel = false;
      }
      this.active = channeling ? Math.min(1, this.active + dt * 4) : Math.max(0, this.active - dt * 1.4);
      if (!channeling) this.energy = Math.min(1, this.energy + dt * C.SHIELD_REGEN / 6);
    }
    solid() {
      if (this.active < 0.35) return null;
      return { x: this.x + 30, y: this.y, w: this.gapw + 40, h: 12, wind: true };
    }
    draw(ctx, t) {
      /* pedestal mark */
      ctx.save();
      ctx.strokeStyle = 'rgba(150,210,255,0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 4, 22, t % 6.283, (t % 6.283) + 4.6);
      ctx.stroke();
      ctx.globalAlpha = 0.7;
      D().sparkle(ctx, this.x, this.y - 4, 8, '#bfe0ff', 0.8, -t * 1.5);
      ctx.globalAlpha = 1;
      /* wind bridge */
      if (this.active > 0) {
        ctx.globalAlpha = this.active * 0.75;
        const y = this.y + 2;
        const grad = ctx.createLinearGradient(this.x + 30, 0, this.x + this.gapw + 70, 0);
        grad.addColorStop(0, 'rgba(170,220,255,0.9)');
        grad.addColorStop(1, 'rgba(170,220,255,0.35)');
        ctx.fillStyle = grad;
        for (let i = 0; i < 5; i++) {
          const px = this.x + 30 + i * (this.gapw + 40) / 5;
          D().rr(ctx, px + 2, y + Math.sin(t * 6 + i) * 2, (this.gapw + 40) / 5 - 5, 8, 4);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      /* energy meter above mark when in use */
      if (this.active > 0.1 && this.energy < 0.98) {
        ctx.fillStyle = 'rgba(20,30,50,0.6)';
        D().rr(ctx, this.x - 24, this.y - 52, 48, 7, 3); ctx.fill();
        ctx.fillStyle = '#8fd0ff';
        D().rr(ctx, this.x - 22, this.y - 50.5, 44 * this.energy, 4, 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  class MemoryLantern {
    constructor(o, lv) {
      this.x = o.x; this.idx = o.idx;
      this.y = lv.groundY; this.seen = false;
      this.chargeT = 0;
    }
    update(dt, world) {
      if (this.seen || world.cutscene) return;
      const [a, b] = world.players;
      const both = Math.abs(a.x - this.x) < 90 && Math.abs(b.x - this.x) < 90;
      if (both) {
        this.chargeT += dt;
        if (Math.random() < dt * 16) {
          P().spawn({ x: this.x + (Math.random() - .5) * 120, y: this.y - Math.random() * 30, vx: 0, vy: -60, life: 1, size: 3, kind: 'spark', color: '#ffd7a3', glow: 'warm' });
        }
        if (this.chargeT > 1.4) {
          this.seen = true;
          world.triggerMemory(this);
        }
      } else this.chargeT = Math.max(0, this.chargeT - dt * 2);
    }
    draw(ctx, t) {
      /* ornate stand */
      ctx.strokeStyle = '#4a3040';
      ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x - 4, this.y);
      ctx.lineTo(this.x - 4, this.y - 170);
      ctx.quadraticCurveTo(this.x - 4, this.y - 196, this.x + 34, this.y - 192);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(this.x + 34, this.y - 190); ctx.lineTo(this.x + 34, this.y - 168); ctx.stroke();
      const glow = this.seen ? 1 : 0.3 + this.chargeT * 0.5;
      D().glow(ctx, this.seen ? 'warm' : 'purple', this.x + 34, this.y - 132, 80 * glow + 30, glow * 0.8);
      D().lantern(ctx, this.x + 34, this.y - 168, 46, 56, this.seen ? '#e8a13c' : '#8a5aa8', this.seen || this.chargeT > 0.4, t);
      if (!this.seen) {
        ctx.globalAlpha = 0.6 + Math.sin(t * 2.4) * 0.3;
        D().heart(ctx, this.x + 34, this.y - 220, 8, '#c9a3ff', 1);
        ctx.globalAlpha = 1;
      }
      /* charge ring */
      if (!this.seen && this.chargeT > 0.05) {
        ctx.strokeStyle = 'rgba(255,215,163,0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x + 34, this.y - 132, 40, -Math.PI / 2, -Math.PI / 2 + (this.chargeT / 1.4) * 6.283);
        ctx.stroke();
      }
    }
  }

  class Checkpoint {
    constructor(o, lv) {
      this.x = o.x; this.y = lv.groundY; this.done = false;
    }
    update(dt, world) {
      if (this.done) return;
      const [a, b] = world.players;
      const both = Math.abs(a.x - this.x) < 70 && Math.abs(b.x - this.x) < 70;
      if (both && world.holdingHands) {
        this.done = true;
        NLA.audio.sfx('bell');
        world.setCheckpoint(this.x);
        world.addLove(NLA.LOVE.checkpoint, this.x, this.y - 120);
        P().burst(this.x, this.y - 100, 20, { kind: 'heart', color: '#ff9db5', speed: 90, life: 1.4, size: 5, grav: -40 });
        world.emitEvent('checkpoint', { x: this.x });
      }
    }
    draw(ctx, t) {
      /* wooden arch with bells */
      ctx.save();
      ctx.strokeStyle = '#6b4530';
      ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x - 55, this.y);
      ctx.lineTo(this.x - 55, this.y - 130);
      ctx.quadraticCurveTo(this.x, this.y - 172, this.x + 55, this.y - 130);
      ctx.lineTo(this.x + 55, this.y);
      ctx.stroke();
      /* silk band */
      ctx.strokeStyle = this.done ? '#ffb0c8' : '#8a6a7a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.x - 50, this.y - 128);
      ctx.quadraticCurveTo(this.x, this.y - 162, this.x + 50, this.y - 128);
      ctx.stroke();
      /* two bells */
      for (const s of [-1, 1]) {
        const bx = this.x + s * 22, by = this.y - 140 + Math.sin(t * 2 + s) * 2;
        ctx.fillStyle = this.done ? '#f2d17e' : '#9a8a6a';
        ctx.beginPath();
        ctx.moveTo(bx - 7, by + 10);
        ctx.quadraticCurveTo(bx, by - 8, bx + 7, by + 10);
        ctx.fill();
        ctx.beginPath(); ctx.arc(bx, by + 12, 2, 0, 6.283); ctx.fill();
      }
      if (this.done) {
        D().glow(ctx, 'pink', this.x, this.y - 145, 55, 0.5 + Math.sin(t * 2) * 0.15);
        D().heart(ctx, this.x, this.y - 148, 8, '#ff8fae', 0.9);
      } else {
        ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25;
        ctx.font = '15px sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd7e8';
        ctx.fillText('🤝', this.x, this.y - 185);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }

  class HeartLantern {
    constructor(o) {
      this.x = o.x; this.y = o.y; this.pair = o.pair;
      this.taken = false; this.phase = Math.random() * 6;
      this.id = 'heart' + o.pair + '_' + o.x;
    }
    update(dt, world) {
      if (this.taken) return;
      const y = this.y + Math.sin(world.t * 1.8 + this.phase) * 6;
      for (const pl of world.players) {
        if (U.dist(pl.x, pl.y - 30, this.x, y) < 34) {
          this.taken = true;
          NLA.audio.sfx('chime', 4);
          P().burst(this.x, y, 10, { kind: 'heart', color: '#ff8fae', speed: 80, life: 1, size: 4, grav: -30 });
          world.onHeartTaken(this);
          world.emitEvent('heartTaken', { id: this.id });
          break;
        }
      }
    }
    draw(ctx, t) {
      if (this.taken) return;
      const y = this.y + Math.sin(t * 1.8 + this.phase) * 6;
      D().glow(ctx, 'pink', this.x, y, 34, 0.6);
      /* heart-shaped lantern */
      D().heart(ctx, this.x, y, 13, '#ff5c8a', 1);
      D().heart(ctx, this.x, y - 1.5, 8, '#ffb8cd', 0.9);
      ctx.fillStyle = '#caa24d';
      ctx.fillRect(this.x - 3, y - 15, 6, 4);
    }
  }

  class Boat {
    constructor(o) {
      this.id = o.id; this.x = o.x; this.w = o.w;
      this.deckY = 852; this.vx = 0; this.bobPhase = 0;
    }
    onGust(dir, world) {
      this.vx += dir * 190;
      P().burst(this.x + this.w / 2 - dir * this.w / 2, this.deckY + 10, 6, { kind: 'ripple', color: '#bfe8ff', speed: 20, life: 1, size: 8 });
    }
    update(dt, world) {
      if (!world.net.active || world.net.isHost) {
        this.vx -= 14 * dt;                     /* gentle current */
        this.vx *= Math.pow(0.45, dt);
        this.x += this.vx * dt;
        /* collide rope gates & rocks */
        for (const ob of world.objects) {
          if (ob instanceof RopeGate && !ob.open) {
            if (this.x + this.w > ob.x - 10 && this.x < ob.x) { this.x = ob.x - 10 - this.w; this.vx = Math.min(0, this.vx); }
          }
          if (ob instanceof Rocks) {
            if (this.x + this.w > ob.x - 26 && this.x + this.w < ob.x + 30 && this.vx > 40) {
              this.vx *= 0.4;
              NLA.audio.sfx('push');
            }
          }
        }
        this.x = U.clamp(this.x, 560, world.level.W - 500 - this.w);
      }
      this.bobPhase += dt;
    }
    bobY(t) { return this.deckY + Math.sin((t || this.bobPhase) * 1.5) * 3; }
    solid(world) {
      return { x: this.x + 8, y: this.bobY(world.t), w: this.w - 16, h: 40, boat: this };
    }
    draw(ctx, t) {
      const y = this.bobY(t);
      ctx.save();
      /* hull */
      const grad = ctx.createLinearGradient(0, y, 0, y + 44);
      grad.addColorStop(0, '#8a5c34');
      grad.addColorStop(1, '#5d3a20');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x - 16, y - 12);
      ctx.quadraticCurveTo(this.x + 8, y + 2, this.x + 20, y + 4);
      ctx.lineTo(this.x + this.w - 20, y + 4);
      ctx.quadraticCurveTo(this.x + this.w - 8, y + 2, this.x + this.w + 16, y - 12);
      ctx.quadraticCurveTo(this.x + this.w, y + 40, this.x + this.w - 40, y + 42);
      ctx.lineTo(this.x + 40, y + 42);
      ctx.quadraticCurveTo(this.x, y + 40, this.x - 16, y - 12);
      ctx.fill();
      /* deck line */
      ctx.strokeStyle = '#c99a5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.x + 6, y + 4);
      ctx.lineTo(this.x + this.w - 6, y + 4);
      ctx.stroke();
      /* prow lantern */
      D().lantern(ctx, this.x + this.w - 4, y - 34, 18, 22, '#e8a13c', true, t);
      ctx.strokeStyle = '#5d3a20'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(this.x + this.w - 4, y - 36); ctx.lineTo(this.x + this.w - 12, y + 2); ctx.stroke();
      ctx.restore();
    }
  }

  class Rocks {
    constructor(o) { this.x = o.x; }
    update() {}
    draw(ctx, t) {
      ctx.fillStyle = '#4a4658';
      ctx.beginPath(); ctx.ellipse(this.x, 886, 34, 20, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#5d5970';
      ctx.beginPath(); ctx.ellipse(this.x - 14, 884, 16, 12, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(this.x + 18, 886, 13, 9, 0, Math.PI, 0); ctx.fill();
    }
  }

  class Statue {
    constructor(o, lv) {
      this.id = o.id; this.x = o.x; this.y = lv.groundY;
      this.healed = false; this.fx = 0;
    }
    onLight(world) {
      if (this.healed) return false;
      this.healed = true; this.fx = 1;
      NLA.audio.sfx('heal');
      world.addLove(NLA.LOVE.puzzle, this.x, this.y - 80);
      P().burst(this.x, this.y - 70, 18, { kind: 'spark', color: '#ffd7e8', glow: 'pink', speed: 100, life: 1, size: 3 });
      world.emitEvent('statueHeal', { id: this.id });
      return true;
    }
    update(dt) { this.fx = Math.max(0, this.fx - dt * 0.5); }
    draw(ctx, t) {
      const x = this.x, y = this.y;
      ctx.save();
      const col = this.healed ? '#8a8496' : '#5d5a66';
      /* base */
      ctx.fillStyle = col;
      ctx.fillRect(x - 30, y - 14, 60, 14);
      /* dragon-turtle body */
      ctx.fillStyle = D().shade(col, 12);
      ctx.beginPath();
      ctx.ellipse(x, y - 34, 26, 20, 0, 0, 6.283);
      ctx.fill();
      /* head */
      ctx.beginPath();
      ctx.ellipse(x + 24, y - 52, 12, 10, 0.3, 0, 6.283);
      ctx.fill();
      /* horns/whiskers */
      ctx.strokeStyle = D().shade(col, 20);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x + 30, y - 60); ctx.quadraticCurveTo(x + 40, y - 70, x + 36, y - 76); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 34, y - 50); ctx.quadraticCurveTo(x + 46, y - 48, x + 50, y - 54); ctx.stroke();
      /* shell pattern */
      ctx.strokeStyle = 'rgba(30,28,40,0.45)';
      ctx.beginPath(); ctx.arc(x - 2, y - 38, 12, 0, 6.283); ctx.stroke();
      if (!this.healed) {
        /* crack */
        ctx.strokeStyle = '#25232e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 8, y - 50); ctx.lineTo(x, y - 38); ctx.lineTo(x - 6, y - 26); ctx.stroke();
        ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25;
        D().sparkle(ctx, x, y - 78, 7, '#ffb0d0', 1, t);
        ctx.globalAlpha = 1;
      } else {
        D().glow(ctx, 'pink', x, y - 44, 46, 0.35 + this.fx * 0.4);
        /* eyes glow */
        ctx.fillStyle = '#ffd7e8';
        ctx.beginPath(); ctx.arc(x + 27, y - 55, 2, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    }
  }

  class Villager {
    constructor(o, lv) {
      this.id = o.id; this.x = o.x; this.y = lv.groundY;
      this.lit = false; this.key = !!o.key;
      this.happy = 0; this.phase = Math.random() * 6;
      this.thankT = 0;
    }
    onLight(world) {
      if (this.lit) return false;
      this.lit = true; this.happy = 1; this.thankT = 3;
      NLA.audio.sfx('bell');
      P().burst(this.x, this.y - 60, 12, { kind: 'heart', color: '#ffd76b', speed: 70, life: 1.2, size: 4, grav: -40 });
      world.onLanternLit(this);
      return true;
    }
    update(dt) {
      this.happy = Math.max(0, this.happy - dt * 0.2);
      this.thankT = Math.max(0, this.thankT - dt);
    }
    draw(ctx, t) {
      const x = this.x, hop = this.happy > 0 ? Math.abs(Math.sin(t * 6)) * 8 * this.happy : 0;
      const y = this.y - hop;
      ctx.save();
      /* small chibi villager (grandma style) */
      ctx.fillStyle = '#6d5544';
      ctx.beginPath(); /* body robe */
      ctx.moveTo(x - 11, y);
      ctx.quadraticCurveTo(x - 13, y - 30, x - 7, y - 36);
      ctx.lineTo(x + 7, y - 36);
      ctx.quadraticCurveTo(x + 13, y - 30, x + 11, y);
      ctx.fill();
      /* head */
      ctx.fillStyle = '#ffe6ce';
      ctx.beginPath(); ctx.arc(x, y - 46, 10.5, 0, 6.283); ctx.fill();
      /* nón lá */
      D().nonLa(ctx, x, y - 53, 26, Math.sin(t + this.phase) * 0.03, 'warm', 0, t);
      /* eyes happy */
      ctx.strokeStyle = '#4a3a35'; ctx.lineWidth = 1.4;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        if (this.lit) ctx.arc(x + s * 4, y - 45, 2.2, Math.PI * 1.15, Math.PI * 1.85);
        else { ctx.moveTo(x + s * 3, y - 45); ctx.lineTo(x + s * 5.5, y - 45); }
        ctx.stroke();
      }
      /* their lantern on a pole */
      ctx.strokeStyle = '#5d4432'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(x + 26, this.y); ctx.lineTo(x + 26, this.y - 74); ctx.lineTo(x + 40, this.y - 78); ctx.stroke();
      D().lantern(ctx, x + 42, this.y - 76, 22, 26, '#58b86a', this.lit, t);
      if (this.key && !this.lit) {
        ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25;
        D().sparkle(ctx, x + 42, this.y - 96, 6, '#ffe9a3', 1, t);
        ctx.globalAlpha = 1;
      }
      /* thanks bubble */
      if (this.thankT > 0) {
        ctx.globalAlpha = Math.min(1, this.thankT);
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff3dc';
        const msg = NLA.t('villager');
        const w = ctx.measureText(msg).width + 16;
        ctx.fillStyle = 'rgba(30,16,40,0.8)';
        D().rr(ctx, x - w / 2, y - 96, w, 22, 10); ctx.fill();
        ctx.fillStyle = '#ffe9b3';
        ctx.fillText(msg, x, y - 81);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }

  class Buffalo {
    constructor(o, lv) { this.x = o.x; this.y = lv.groundY; this.phase = Math.random() * 6; }
    update() {}
    draw(ctx, t) {
      const x = this.x, y = this.y;
      ctx.save();
      ctx.fillStyle = '#5a5560';
      /* body */
      ctx.beginPath(); ctx.ellipse(x, y - 26, 34, 20, 0, 0, 6.283); ctx.fill();
      /* head */
      ctx.beginPath(); ctx.ellipse(x - 36, y - 30, 13, 11, -0.2, 0, 6.283); ctx.fill();
      /* horns */
      ctx.strokeStyle = '#8f8a96'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 40, y - 38); ctx.quadraticCurveTo(x - 56, y - 52, x - 44, y - 56); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 32, y - 40); ctx.quadraticCurveTo(x - 22, y - 56, x - 30, y - 58); ctx.stroke();
      /* legs */
      ctx.strokeStyle = '#4a4550'; ctx.lineWidth = 6;
      for (const lx of [-20, -8, 12, 24]) {
        ctx.beginPath(); ctx.moveTo(x + lx, y - 12); ctx.lineTo(x + lx, y); ctx.stroke();
      }
      /* tail swish */
      ctx.strokeStyle = '#4a4550'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 32, y - 34);
      ctx.quadraticCurveTo(x + 44, y - 26 + Math.sin(t * 2 + this.phase) * 6, x + 40, y - 14);
      ctx.stroke();
      /* eye */
      ctx.fillStyle = '#2a2630';
      ctx.beginPath(); ctx.arc(x - 40, y - 32, 1.8, 0, 6.283); ctx.fill();
      ctx.restore();
    }
  }

  /* Discoverable cultural keepsakes. These stay lightweight canvas art during
     play; the larger painterly assets are reserved for chapter stories. */
  class CultureRelic {
    constructor(o, lv) {
      this.id = o.id;
      this.x = o.x;
      this.y = o.y || lv.groundY;
      this.kind = o.kind;
      this.loreKey = o.loreKey || ('culture_' + o.kind);
      this.xp = o.xp || 4;
      this.seen = false;
      this.phase = Math.random() * 6.283;
      this.color = o.kind === 'giong' ? '#a9e882' : '#f5cf77';
    }
    update(dt, world) {
      if (this.seen || world.cutscene || (world.net.active && !world.net.isHost)) return;
      for (const pl of world.players) {
        if (U.dist(pl.x, pl.y - 28, this.x, this.y - 38) < 68) {
          world.discoverCulture(this, false);
          break;
        }
      }
    }
    draw(ctx, t) {
      const x = this.x, y = this.y;
      ctx.save();
      if (!this.seen) {
        const pulse = .34 + Math.sin(t * 2.5 + this.phase) * .12;
        D().glow(ctx, this.kind === 'giong' ? 'green' : 'warm', x, y - 45, 52, pulse);
      }
      ctx.globalAlpha = this.seen ? .72 : 1;
      switch (this.kind) {
        case 'buffaloRice': {
          ctx.strokeStyle = '#caa24d'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
          for (let i = -4; i <= 4; i++) {
            ctx.beginPath(); ctx.moveTo(x + i * 2, y); ctx.quadraticCurveTo(x + i * 3, y - 30, x + i * 5, y - 61); ctx.stroke();
            for (let j = 0; j < 3; j++) {
              const px = x + i * 5 + (i < 0 ? -1 : 1) * j * 2, py = y - 55 + j * 7;
              ctx.fillStyle = '#efc45c'; ctx.beginPath(); ctx.ellipse(px, py, 4.2, 2.1, .7, 0, 6.283); ctx.fill();
            }
          }
          ctx.strokeStyle = '#8f6a35'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 11, y - 20); ctx.lineTo(x + 11, y - 20); ctx.stroke();
          break;
        }
        case 'hammock': {
          ctx.strokeStyle = '#708d45'; ctx.lineWidth = 7; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - 55, y); ctx.lineTo(x - 47, y - 93); ctx.moveTo(x + 55, y); ctx.lineTo(x + 47, y - 93); ctx.stroke();
          ctx.strokeStyle = '#df6e62'; ctx.lineWidth = 9;
          ctx.beginPath(); ctx.moveTo(x - 44, y - 80); ctx.quadraticCurveTo(x, y - 22, x + 44, y - 80); ctx.stroke();
          ctx.strokeStyle = '#f2bb86'; ctx.lineWidth = 1.4;
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath(); ctx.moveTo(x - 38 + i * 4, y - 73 + Math.abs(i) * 2); ctx.lineTo(x + 38 + i * 2, y - 73 + Math.abs(i) * 2); ctx.stroke();
          }
          break;
        }
        case 'sandals': {
          ctx.translate(x, y - 8); ctx.rotate(-.12);
          for (const s of [-1, 1]) {
            ctx.fillStyle = '#e2bb59';
            ctx.beginPath(); ctx.ellipse(s * 13, -17, 9, 22, s * .12, 0, 6.283); ctx.fill();
            ctx.strokeStyle = '#9a7330'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.moveTo(s * 13, -30); ctx.quadraticCurveTo(s * 2, -19, s * 13, -12); ctx.stroke();
            ctx.fillStyle = '#8c6a2d';
            for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(s * 13, -24 + j * 6, 1.5, 0, 6.283); ctx.fill(); }
          }
          break;
        }
        case 'bauda':
        case 'chuoi': {
          const jar = this.kind === 'bauda' ? '#9f5f3d' : '#6e4b55';
          ctx.fillStyle = '#694431'; ctx.fillRect(x - 28, y - 8, 56, 8);
          ctx.fillStyle = jar;
          ctx.beginPath(); ctx.moveTo(x - 18, y - 8); ctx.quadraticCurveTo(x - 30, y - 42, x - 15, y - 64); ctx.lineTo(x + 15, y - 64); ctx.quadraticCurveTo(x + 30, y - 42, x + 18, y - 8); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#d9a86c'; ctx.fillRect(x - 13, y - 68, 26, 7);
          ctx.strokeStyle = '#efc88d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 41, 13, 0, 6.283); ctx.stroke();
          if (this.kind === 'chuoi') {
            ctx.fillStyle = '#9370a2';
            for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x - 33 + i * 8, y - 9 - (i % 2) * 3, 6, 3.5, -.3, 0, 6.283); ctx.fill(); }
          }
          break;
        }
        case 'giong': {
          ctx.strokeStyle = '#47753c'; ctx.lineWidth = 9; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y - 112); ctx.stroke();
          ctx.strokeStyle = '#a8d875'; ctx.lineWidth = 2;
          for (let i = 1; i < 5; i++) { const py = y - i * 22; ctx.beginPath(); ctx.moveTo(x - 5, py); ctx.lineTo(x + 11, py); ctx.stroke(); }
          for (const s of [-1, 1]) {
            ctx.fillStyle = '#82b85c';
            for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x + s * (13 + i * 4), y - 55 - i * 14, 12, 4, s * -.55, 0, 6.283); ctx.fill(); }
          }
          ctx.fillStyle = '#e8b958'; ctx.beginPath(); ctx.arc(x + 3, y - 126, 7, 0, 6.283); ctx.fill();
          ctx.strokeStyle = '#f9e49a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 3, y - 126, 14 + Math.sin(t * 3) * 2, 0, 6.283); ctx.stroke();
          break;
        }
      }
      if (!this.seen) {
        ctx.globalAlpha = .55 + Math.sin(t * 3 + this.phase) * .25;
        D().sparkle(ctx, x, y - (this.kind === 'giong' ? 150 : 91), 7, this.color, 1, t);
      }
      ctx.restore();
    }
  }

  class Sign {
    constructor(o, lv) { this.x = o.x; this.tip = o.tip; this.y = lv.groundY; }
    update() {}
    draw(ctx, t) {
      /* small lantern post with sparkle — tip text drawn by HUD when near */
      ctx.strokeStyle = '#5d4432'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x, this.y - 46); ctx.stroke();
      D().lantern(ctx, this.x, this.y - 62, 16, 18, '#4ea3d8', true, t);
    }
  }

  class BigLantern {
    constructor(o, lv) {
      this.id = o.id; this.x = o.x; this.y = lv.groundY;
      this.progress = 0; this.done = false;
      this.pedL = o.x - 130; this.pedR = o.x + 130;
    }
    update(dt, world) {
      if (this.done || world.cutscene) return;
      if (world.keyLit < world.level.required) return;
      const boy = world.players.find(p => p.who === 'boy');
      const girl = world.players.find(p => p.who === 'girl');
      const boyOn = Math.abs(boy.x - this.pedL) < 50 || Math.abs(boy.x - this.pedR) < 50;
      const girlOn = Math.abs(girl.x - this.pedL) < 50 || Math.abs(girl.x - this.pedR) < 50;
      const boyCh = boyOn && boy.holdingPow1;
      const girlCh = girlOn && girl.holdingPow1;
      boy.channelLight = boyCh; girl.channelLight = girlCh;
      if (boyCh && girlCh) {
        this.progress += dt / 4;
        if (Math.random() < dt * 40) {
          const from = Math.random() < 0.5 ? boy : girl;
          P().spawn({
            x: from.x, y: from.y - 70,
            vx: (this.x - from.x) * 1.2, vy: -220 - Math.random() * 100,
            life: 0.9, size: 3.5, kind: 'spark',
            color: from.who === 'boy' ? '#bfe0ff' : '#ffd7e8',
            glow: from.who === 'boy' ? 'blue' : 'pink', grav: 300,
          });
        }
        if (this.progress >= 1) {
          this.done = true;
          boy.channelLight = girl.channelLight = false;
          world.finale();
        }
      } else this.progress = Math.max(0, this.progress - dt * 0.15);
    }
    draw(ctx, t, world) {
      const x = this.x, y = this.y;
      ctx.save();
      /* grand wooden frame */
      ctx.strokeStyle = '#4a3040'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 150, y); ctx.lineTo(x - 110, y - 300);
      ctx.quadraticCurveTo(x, y - 350, x + 110, y - 300);
      ctx.lineTo(x + 150, y);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x, y - 336); ctx.lineTo(x, y - 300); ctx.stroke();
      /* the great lantern */
      const lit = this.done;
      const p = this.progress;
      const glowAmt = lit ? 1 : p * 0.85;
      if (glowAmt > 0.02) D().glow(ctx, 'warm', x, y - 190, 180 * glowAmt + 60, glowAmt);
      const bodyCol = lit || p > 0.6 ? '#e8543c' : '#5e3550';
      const grad = ctx.createLinearGradient(x - 80, 0, x + 80, 0);
      grad.addColorStop(0, D().shade(bodyCol, -30));
      grad.addColorStop(0.5, p > 0.2 ? D().shade(bodyCol, Math.floor(40 * p)) : bodyCol);
      grad.addColorStop(1, D().shade(bodyCol, -30));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y - 190, 82, 105, 0, 0, 6.283);
      ctx.fill();
      /* ribs */
      ctx.strokeStyle = 'rgba(40,20,30,0.35)'; ctx.lineWidth = 2;
      for (const f of [0.3, 0.62, 0.92]) {
        ctx.beginPath(); ctx.ellipse(x, y - 190, 82 * f, 105, 0, 0, 6.283); ctx.stroke();
      }
      /* caps */
      ctx.fillStyle = '#caa24d';
      D().rr(ctx, x - 40, y - 305, 80, 14, 4); ctx.fill();
      D().rr(ctx, x - 30, y - 92, 60, 12, 4); ctx.fill();
      /* tassels */
      ctx.strokeStyle = '#e8c04d'; ctx.lineWidth = 3;
      for (const s of [-16, 0, 16]) {
        ctx.beginPath(); ctx.moveTo(x + s, y - 80); ctx.lineTo(x + s + Math.sin(t * 2 + s) * 3, y - 52); ctx.stroke();
      }
      /* inner light */
      if (p > 0.1 || lit) {
        ctx.globalAlpha = Math.min(1, p + (lit ? 1 : 0));
        ctx.fillStyle = 'rgba(255,240,190,0.9)';
        ctx.beginPath(); ctx.ellipse(x, y - 190, 30 * (p + (lit ? 1 : 0)), 42 * (p + (lit ? 1 : 0)), 0, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
      }
      /* pedestals */
      for (const px of [this.pedL, this.pedR]) {
        const active = world && world.keyLit >= world.level.required;
        ctx.fillStyle = '#75626e';
        D().rr(ctx, px - 42, y - 12, 84, 12, 4); ctx.fill();
        ctx.fillStyle = '#8a7684';
        D().rr(ctx, px - 34, y - 18, 68, 8, 3); ctx.fill();
        if (active && !this.done) {
          ctx.globalAlpha = 0.5 + Math.sin(t * 3 + px) * 0.3;
          D().sparkle(ctx, px, y - 34, 8, px === this.pedL ? '#bfe0ff' : '#ffd7e8', 1, t);
          ctx.globalAlpha = 1;
        }
      }
      /* progress ring */
      if (p > 0.02 && !this.done) {
        ctx.strokeStyle = 'rgba(255,220,150,0.95)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x, y - 190, 120, -Math.PI / 2, -Math.PI / 2 + p * 6.283);
        ctx.stroke();
      }
      /* locked hint */
      if (world && world.keyLit < world.level.required && !this.done) {
        ctx.globalAlpha = 0.65;
        ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#cbb8d8';
        ctx.fillText(`🏮 ${world.keyLit} / ${world.level.required}`, x, y - 330);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }

  /* ==================== ENEMIES ==================== */

  class Wisp {
    constructor(o) {
      this.x = o.x; this.y = o.y; this.hx = o.x; this.hy = o.y;
      this.phase = Math.random() * 6; this.gone = false;
      this.retreat = 0;
      this.id = 'wisp' + o.x + '_' + o.y;
    }
    dispel(world) {
      if (this.gone) return;
      this.gone = true;
      NLA.audio.sfx('dispel');
      for (let i = 0; i < 6; i++) {
        P().spawn({ x: this.x, y: this.y, vx: U.rand(-60, 60), vy: U.rand(-80, -20), life: 2.5, size: 2.5, kind: 'firefly' });
      }
      world.addLove(NLA.LOVE.dispel, this.x, this.y);
      world.emitEvent('dispel', { id: this.id });
    }
    update(dt, world) {
      if (this.gone) return;
      this.retreat = Math.max(0, this.retreat - dt);
      const t = world.t;
      /* find nearest player */
      let best = null, bd = 1e9;
      for (const pl of world.players) {
        const d = U.dist(this.x, this.y, pl.x, pl.y - 30);
        if (d < bd) { bd = d; best = pl; }
      }
      if (best && bd < 190 && this.retreat <= 0 && !world.shieldCovers(this.x, this.y)) {
        this.x += (best.x - this.x) / bd * 46 * dt;
        this.y += (best.y - 30 - this.y) / bd * 46 * dt;
      } else {
        this.x += (this.hx - this.x) * 0.6 * dt + Math.sin(t * 1.7 + this.phase) * 14 * dt;
        this.y += (this.hy - this.y) * 0.6 * dt + Math.cos(t * 1.3 + this.phase) * 12 * dt;
      }
      /* touch players */
      for (const pl of world.players) {
        if (U.dist(this.x, this.y, pl.x, pl.y - 30) < 28) {
          if (world.shieldCovers(pl.x, pl.y - 30)) {
            /* bounce off shield */
            const dx = this.x - pl.x, dy = this.y - (pl.y - 30), d = Math.hypot(dx, dy) || 1;
            this.x += dx / d * 60 * dt * 8; this.y += dy / d * 60 * dt * 8;
            this.retreat = 1.2;
          } else if (pl.dim <= 0 && !pl.remote) {
            pl.dim = 3;
            NLA.audio.sfx('hurt');
            this.retreat = 1.5;
            P().burst(pl.x, pl.y - 40, 8, { kind: 'smoke', color: '#6a5a7a', speed: 40, life: 0.8, size: 5 });
            world.emitEvent('dimmed', { who: pl.who });
          }
        }
      }
    }
    draw(ctx, t) {
      if (this.gone) return;
      const wob = Math.sin(t * 3 + this.phase);
      ctx.save();
      ctx.globalAlpha = 0.85;
      /* dark blob */
      const grad = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, 20);
      grad.addColorStop(0, 'rgba(60,44,84,0.95)');
      grad.addColorStop(1, 'rgba(40,28,60,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(this.x, this.y, 20, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#3a2a52';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + wob * 2, 11, 12 + wob, 0, 0, 6.283);
      ctx.fill();
      /* wispy tail */
      ctx.strokeStyle = 'rgba(58,42,82,0.6)';
      ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + 10);
      ctx.quadraticCurveTo(this.x - wob * 8, this.y + 20, this.x + wob * 5, this.y + 26);
      ctx.stroke();
      /* eyes */
      ctx.fillStyle = '#c9b8ff';
      ctx.beginPath(); ctx.arc(this.x - 4, this.y - 2 + wob, 2.2, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(this.x + 4, this.y - 2 + wob, 2.2, 0, 6.283); ctx.fill();
      ctx.restore();
    }
  }

  class BirdZone {
    constructor(o) {
      this.x = o.x; this.range = o.range;
      this.timer = 3 + Math.random() * 3;
      this.birds = [];
    }
    update(dt, world) {
      /* spawn (host-side only in net games) */
      if (!world.net.active || world.net.isHost) {
        this.timer -= dt;
        const anyNear = world.players.some(p => Math.abs(p.x - this.x) < this.range);
        if (this.timer <= 0 && anyNear && this.birds.length < 2) {
          this.timer = 6 + Math.random() * 4;
          const target = U.pick(world.players);
          const fromLeft = Math.random() < 0.5;
          const b = {
            x: target.x + (fromLeft ? -700 : 700),
            y: target.y - 320, vx: fromLeft ? 300 : -300,
            t: 0, stunned: 0, targetY: 0, id: Math.random().toString(36).slice(2, 7),
          };
          this.birds.push(b);
          NLA.audio.sfx('bird');
          world.emitEvent('bird', { zx: this.x, bird: { x: b.x, y: b.y, vx: b.vx, id: b.id } });
        }
      }
      for (let i = this.birds.length - 1; i >= 0; i--) {
        const b = this.birds[i];
        b.t += dt;
        if (b.stunned > 0) {
          b.stunned -= dt;
          b.y -= 220 * dt;
          if (b.stunned <= 0 || b.y < 100) { this.birds.splice(i, 1); continue; }
        } else {
          b.x += b.vx * dt;
          /* swoop: sine dive toward player height */
          b.y += Math.sin(b.t * 2.2) * 160 * dt + 60 * dt * Math.sin(b.t);
          const dive = Math.sin(b.t * 1.1);
          b.y += dive * 120 * dt;
          b.y = U.clamp(b.y, 380, 800);
          /* hit players */
          for (const pl of world.players) {
            if (U.dist(b.x, b.y, pl.x, pl.y - 30) < 32) {
              if (world.shieldCovers(pl.x, pl.y - 30)) {
                b.stunned = 2; NLA.audio.sfx('dispel');
                P().burst(b.x, b.y, 8, { kind: 'spark', color: '#a3f0e0', glow: 'teal', speed: 90, life: 0.6, size: 3 });
              } else if (pl.stun <= 0 && !pl.remote) {
                pl.stun = 0.8;
                pl.vx = b.vx > 0 ? 240 : -240;
                pl.vy = -260;
                NLA.audio.sfx('hurt');
                world.emitEvent('birdHit', { who: pl.who });
              }
            }
          }
          if (Math.abs(b.x - this.x) > this.range + 800) this.birds.splice(i, 1);
        }
      }
    }
    lightStun(x, y, r) {
      for (const b of this.birds) {
        if (U.dist(b.x, b.y, x, y) < r + 30 && b.stunned <= 0) {
          b.stunned = 2;
          NLA.audio.sfx('dispel');
        }
      }
    }
    draw(ctx, t) {
      for (const b of this.birds) {
        ctx.save();
        ctx.translate(b.x, b.y);
        if (b.vx < 0) ctx.scale(-1, 1);
        ctx.globalAlpha = b.stunned > 0 ? 0.5 : 0.9;
        const flap = Math.sin(t * 14) * (b.stunned > 0 ? 0.2 : 1);
        /* shadow bird body */
        ctx.fillStyle = '#2c2044';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 9, 0, 0, 6.283);
        ctx.fill();
        /* head + beak */
        ctx.beginPath(); ctx.arc(14, -4, 7, 0, 6.283); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(20, -5); ctx.lineTo(28, -2); ctx.lineTo(20, 0);
        ctx.fill();
        /* wings */
        for (const s of [-1, 1]) {
          ctx.save();
          ctx.rotate(flap * 0.6 * s - 0.2 * s);
          ctx.beginPath();
          ctx.ellipse(-4, -6 * s, 20, 7, s * 0.5, 0, 6.283);
          ctx.fill();
          ctx.restore();
        }
        /* eye */
        ctx.fillStyle = '#c9b8ff';
        ctx.beginPath(); ctx.arc(15, -5, 2, 0, 6.283); ctx.fill();
        ctx.restore();
      }
    }
  }

  class FallingBamboo {
    constructor(o, lv) {
      this.id = o.id; this.x = o.x; this.groundY = lv.groundY;
      this.state = 'idle'; this.timer = 0;
      this.topY = lv.groundY - 320;
      this.fallY = this.topY;
    }
    update(dt, world) {
      if (this.state === 'idle') {
        for (const pl of world.players) {
          if (Math.abs(pl.x - this.x) < 80 && (!world.net.active || world.net.isHost || !pl.remote)) {
            this.state = 'shake'; this.timer = 0.8;
            world.emitEvent('bambooShake', { id: this.id });
            break;
          }
        }
      } else if (this.state === 'shake') {
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'fall'; this.vy = 0; }
      } else if (this.state === 'fall') {
        this.vy = (this.vy || 0) + 1800 * dt;
        this.fallY += this.vy * dt;
        for (const pl of world.players) {
          if (!pl.remote && pl.stun <= 0 && Math.abs(pl.x - this.x) < 30 && pl.y - 40 > this.fallY && pl.y - 70 < this.fallY + 200) {
            pl.stun = 0.8; pl.vy = -180; pl.vx = (pl.x < this.x ? -1 : 1) * 200;
            NLA.audio.sfx('hurt');
          }
        }
        if (this.fallY >= this.groundY - 16) {
          this.fallY = this.groundY - 16;
          this.state = 'rest'; this.timer = 2.6;
          NLA.audio.sfx('land');
          P().burst(this.x, this.groundY, 8, { kind: 'leaf', color: '#9ec26b', speed: 80, life: 1, size: 4, grav: 100 });
        }
      } else if (this.state === 'rest') {
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'idle'; this.fallY = this.topY; }
      }
    }
    draw(ctx, t) {
      ctx.save();
      const shake = this.state === 'shake' ? Math.sin(t * 40) * 4 : 0;
      if (this.state === 'rest') {
        /* lying on ground */
        ctx.strokeStyle = '#7da84f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.globalAlpha = Math.min(1, this.timer);
        ctx.beginPath();
        ctx.moveTo(this.x - 90, this.groundY - 8);
        ctx.lineTo(this.x + 90, this.groundY - 10);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        const y = this.state === 'fall' ? this.fallY : this.topY + 0;
        /* hanging bamboo piece up high */
        ctx.strokeStyle = '#7da84f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x + shake, y);
        ctx.lineTo(this.x + shake * 0.5, y + 180);
        ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#5d8038';
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(this.x + shake - 5, y + i * 45);
          ctx.lineTo(this.x + shake + 5, y + i * 45);
          ctx.stroke();
        }
        if (this.state !== 'fall') {
          /* warning shimmer when idle+near */
          if (this.state === 'shake') {
            ctx.globalAlpha = 0.7;
            ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
            ctx.fillStyle = '#ffe9a3';
            ctx.fillText('!', this.x, y - 10);
            ctx.globalAlpha = 1;
          }
        }
      }
      ctx.restore();
    }
  }

  /* ==================== COLLECTIBLE ==================== */
  const KIND_COLORS = {
    lantern: '#e8a13c', petal: '#ffb3c8', leaf: '#9ec26b', envelope: '#e04848',
    banhchung: '#58a05c', star: '#ffd76b', hat: '#e8c98a', candle: '#ff8fae',
  };

  class Collectible {
    constructor(o, i) {
      this.x = o.x; this.y = o.y; this.kind = o.kind || 'lantern';
      this.taken = false; this.phase = (i || 0) * 0.7;
      this.id = 'c' + o.x + '_' + o.y;
    }
    update(dt, world) {
      if (this.taken) return;
      const y = this.y + Math.sin(world.t * 2 + this.phase) * 5;
      for (const pl of world.players) {
        if (U.dist(pl.x, pl.y - 30, this.x, y) < 34) {
          this.taken = true;
          NLA.audio.sfx('chime', (this.phase * 3 | 0) % 5);
          P().burst(this.x, y, 7, { kind: 'star', color: KIND_COLORS[this.kind], speed: 70, life: 0.6, size: 4 });
          world.onCollect(this);
          world.emitEvent('collect', { id: this.id });
          break;
        }
      }
    }
    draw(ctx, t) {
      if (this.taken) return;
      const y = this.y + Math.sin(t * 2 + this.phase) * 5;
      const c = KIND_COLORS[this.kind];
      D().glow(ctx, 'warm', this.x, y, 20, 0.35);
      ctx.save();
      ctx.translate(this.x, y);
      switch (this.kind) {
        case 'lantern':
          D().lantern(ctx, 0, -8, 14, 16, '#e8674d', true, t);
          break;
        case 'petal':
          ctx.rotate(Math.sin(t * 1.5 + this.phase) * 0.4);
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.ellipse(0, 0, 9, 5.5, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#ffd1dc';
          ctx.beginPath(); ctx.ellipse(-2, -1, 4, 2.5, 0, 0, 6.283); ctx.fill();
          break;
        case 'leaf':
          ctx.rotate(Math.sin(t * 1.5 + this.phase) * 0.5 + 0.6);
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.ellipse(0, 0, 11, 3.6, 0, 0, 6.283); ctx.fill();
          break;
        case 'envelope':
          ctx.fillStyle = c;
          D().rr(ctx, -8, -11, 16, 22, 2); ctx.fill();
          ctx.fillStyle = '#ffd76b';
          ctx.beginPath(); ctx.arc(0, -2, 4.5, 0, 6.283); ctx.fill();
          break;
        case 'banhchung':
          ctx.fillStyle = c;
          D().rr(ctx, -9, -9, 18, 18, 3); ctx.fill();
          ctx.strokeStyle = '#e8dcb0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.moveTo(0, -9); ctx.lineTo(0, 9); ctx.stroke();
          break;
        case 'star': {
          /* star lantern (5-point) */
          ctx.rotate(t * 0.8);
          ctx.fillStyle = c;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = i * 6.283 / 5 - Math.PI / 2;
            ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
            const a2 = a + 6.283 / 10;
            ctx.lineTo(Math.cos(a2) * 4.5, Math.sin(a2) * 4.5);
          }
          ctx.closePath(); ctx.fill();
          break;
        }
        case 'hat':
          D().nonLa(ctx, 0, 2, 22, Math.sin(t + this.phase) * 0.15, 'warm', 0.25, t);
          break;
        case 'candle':
          D().heart(ctx, 0, 0, 9, c, 1);
          flame(ctx, 0, -7, 5, t + this.phase);
          break;
      }
      ctx.restore();
    }
  }

  NLA.ent = {
    Player, StoneLantern, WireLantern, Candle, RopeGate, Box, Plate, Gate,
    Plank, BrokenBridge, LotusSpot, WindMark, MemoryLantern, Checkpoint,
    HeartLantern, Boat, Rocks, Statue, Villager, Buffalo, CultureRelic, Sign, BigLantern,
    Wisp, BirdZone, FallingBamboo, Collectible,
  };
})();

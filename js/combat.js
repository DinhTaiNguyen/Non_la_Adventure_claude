/* =====================================================================
   combat.js — Vietnamese-fairytale spirit combat, Nón Lá mastery,
   chapter guardians, multi-phase bosses, projectiles, rewards and HUD.
   Creatures are purified back into lantern light rather than killed.
   ===================================================================== */
(function () {
  const U = NLA.util;
  const P = () => NLA.draw.particles;
  const TAU = Math.PI * 2;

  const CHAPTERS = [
    { color: '#ff9f6e', dark: '#5d2945', accent: '#ffe1a3',
      mobKind: 'paper', mobXs: [1380, 2740, 4210, 5380], guardianX: 2460, bossX: 5860 },
    { color: '#70d8ff', dark: '#173f66', accent: '#d7f5ff',
      mobKind: 'river', mobXs: [1180, 2200, 3680, 5050, 6120], guardianX: 3470, bossX: 6420 },
    { color: '#9fd36b', dark: '#294c37', accent: '#efffbd',
      mobKind: 'bamboo', mobXs: [1050, 2380, 4080, 5480], guardianX: 2960, bossX: 6100 },
    { color: '#ff91c8', dark: '#4c285f', accent: '#ffe0f4',
      mobKind: 'lotus', mobXs: [900, 1980, 3290, 4720], guardianX: 2760, bossX: 5480 },
    { color: '#e5b75a', dark: '#493127', accent: '#fff0ae',
      mobKind: 'bronze', mobXs: [1080, 2260, 3620, 4780], guardianX: 3020, bossX: 6020 },
    { color: '#b79aff', dark: '#281d55', accent: '#fff0ff',
      mobKind: 'storm', mobXs: [860, 1660, 2880, 3880], guardianX: 2460, bossX: 4660 },
  ];

  const HAT_COLORS = ['#ffd76b', '#a9ecff', '#b8ec82', '#ff9fcf', '#ffcd67', '#e5bcff'];

  function rankNow() {
    return NLA.hatRank ? NLA.hatRank() : 1;
  }

  function safeNumber(v, fallback) {
    return Number.isFinite(v) ? v : fallback;
  }

  function roundedBar(ctx, x, y, w, h, pct, color) {
    ctx.fillStyle = 'rgba(16,8,30,.76)';
    NLA.draw.rr(ctx, x, y, w, h, h / 2); ctx.fill();
    const fillW = Math.max(0, (w - 4) * U.clamp(pct, 0, 1));
    if (fillW > 1) {
      const g = ctx.createLinearGradient(x, y, x + w, y);
      g.addColorStop(0, color);
      g.addColorStop(1, '#fff1b8');
      ctx.fillStyle = g;
      NLA.draw.rr(ctx, x + 2, y + 2, fillW, h - 4, (h - 4) / 2); ctx.fill();
    }
  }

  class SpiritEnemy {
    constructor(system, spec) {
      this.system = system;
      this.chapter = system.chapter;
      this.id = spec.id;
      this.role = spec.role || 'mob';
      this.kind = this.chapter.mobKind;
      this.x = spec.x;
      this.homeX = spec.x;
      this.y = spec.y;
      this.homeY = spec.y;
      this.radius = this.role === 'final' ? 62 : (this.role === 'guardian' ? 43 : 25);
      const chapterScale = system.levelIdx;
      this.maxHp = this.role === 'final' ? 190 + chapterScale * 52
        : this.role === 'guardian' ? 82 + chapterScale * 24 : 24 + chapterScale * 7;
      this.hp = this.maxHp;
      this.active = this.role === 'mob';
      this.dead = false;
      this.flash = 0;
      this.phase = 1;
      this.floatT = Math.random() * TAU;
      this.attackT = this.role === 'final' ? 2.8 : (this.role === 'guardian' ? 2.2 : 1.5 + Math.random());
      this.dashT = 0;
      this.vx = 0;
      this.rewarded = false;
      this.announced = false;
    }

    displayName() {
      if (this.role === 'final') return NLA.t('bossName' + (this.system.levelIdx + 1));
      if (this.role === 'guardian') return NLA.t('guardianName' + (this.system.levelIdx + 1));
      return NLA.t('spiritMonster');
    }

    nearest(world) {
      let best = world.players[0], dist = Infinity;
      for (const pl of world.players) {
        const d = U.dist(this.x, this.y, pl.x, pl.y - 30);
        if (d < dist) { dist = d; best = pl; }
      }
      return { pl: best, dist };
    }

    activate(world) {
      if (this.active || this.dead) return;
      this.active = true;
      if (!this.announced) {
        this.announced = true;
        NLA.audio.sfx('bossRoar');
        NLA.ui.toast((this.role === 'final' ? NLA.t('bossAwakes') : NLA.t('guardianAwakes'))
          .replace('{NAME}', this.displayName()), 4200);
        P().burst(this.x, this.y, 28, {
          kind: 'smoke', color: this.chapter.dark, speed: 120, life: 1.2, size: 8,
        });
      }
    }

    takeDamage(amount, world, source) {
      if (this.dead || amount <= 0) return false;
      this.activate(world);
      const resistance = this.role === 'final' ? (this.phase === 3 ? 0.82 : 0.9) : 1;
      this.hp = Math.max(0, this.hp - amount * resistance);
      this.flash = 1;
      const col = source === 'light' ? '#ffd7ef' : source === 'wind' ? '#bcefff' : '#ffe69a';
      P().burst(this.x, this.y, this.role === 'final' ? 10 : 6, {
        kind: 'spark', color: col, glow: 'warm', speed: 95, life: .55, size: 3,
      });
      NLA.audio.sfx(this.role === 'final' ? 'bossHit' : 'dispel');
      if (this.hp <= 0) this.purify(world);
      return true;
    }

    purify(world) {
      if (this.dead) return;
      this.dead = true;
      this.active = false;
      const count = this.role === 'final' ? 54 : this.role === 'guardian' ? 34 : 16;
      P().burst(this.x, this.y, count, {
        kind: 'firefly', color: this.chapter.accent, glow: 'warm', speed: this.role === 'final' ? 210 : 130,
        life: this.role === 'final' ? 2.2 : 1.4, size: this.role === 'final' ? 5 : 3,
      });
      P().burst(this.x, this.y, Math.ceil(count / 3), {
        kind: 'heart', color: '#ff8fae', speed: 110, life: 1.5, size: 4, grav: -55,
      });
      NLA.audio.sfx(this.role === 'final' ? 'bossDown' : 'loveUp');
      world.addLove(this.role === 'final' ? 12 : this.role === 'guardian' ? 7 : 2, this.x, this.y);
      const xp = this.role === 'final' ? 48 : this.role === 'guardian' ? 24 : 4;
      this.system.receiveReward(this.id, xp, this.role, world);
      world.emitEvent('combatReward', { id: this.id, xp, role: this.role });
    }

    update(dt, world) {
      if (this.dead) return;
      this.flash = Math.max(0, this.flash - dt * 5);
      this.floatT += dt;
      const near = this.nearest(world);
      if (!this.active) {
        this.y = this.homeY + Math.sin(this.floatT * 1.2) * 9;
        if (near.dist < (this.role === 'final' ? 690 : 560)) this.activate(world);
        return;
      }

      if (this.role === 'final') this.phase = this.hp < this.maxHp * .34 ? 3 : this.hp < this.maxHp * .68 ? 2 : 1;
      else if (this.role === 'guardian') this.phase = this.hp < this.maxHp * .5 ? 2 : 1;

      if (this.dashT > 0) {
        this.dashT -= dt;
        this.x += this.vx * dt;
      } else {
        const desiredX = near.pl.x + (this.x < near.pl.x ? -150 : 150);
        const follow = this.role === 'mob' ? .55 : .32;
        this.x += U.clamp(desiredX - this.x, -110, 110) * follow * dt;
        this.x += (this.homeX - this.x) * .06 * dt;
      }
      const hover = this.role === 'final' ? 125 : this.role === 'guardian' ? 95 : 66;
      const desiredY = Math.min(this.system.level.groundY - hover, near.pl.y - hover);
      this.y += (desiredY - this.y) * 1.5 * dt + Math.sin(this.floatT * 2.1) * 10 * dt;

      if (this.role === 'mob') this.updateMobAttack(dt, world, near);
      else this.updateBossAttack(dt, world, near);
    }

    updateMobAttack(dt, world, near) {
      this.attackT -= dt;
      if (near.dist < this.radius + 30 && near.pl.invuln <= 0) {
        world.damagePlayer(near.pl, 1, Math.sign(near.pl.x - this.x) * 230, -230, this.displayName());
        this.attackT = 1.7;
      } else if (this.attackT <= 0 && near.dist < 520) {
        this.attackT = 2.6 - this.system.levelIdx * .08;
        const dx = near.pl.x - this.x, dy = near.pl.y - 32 - this.y;
        const d = Math.hypot(dx, dy) || 1;
        this.system.cast([{ x: this.x, y: this.y, vx: dx / d * 190, vy: dy / d * 190,
          kind: 'orb', color: this.chapter.color, life: 3.6, r: 10, damage: 1, source: this.id }], world);
      }
    }

    updateBossAttack(dt, world, near) {
      this.attackT -= dt;
      if (near.dist < this.radius + 25 && near.pl.invuln <= 0) {
        world.damagePlayer(near.pl, 1, Math.sign(near.pl.x - this.x) * 300, -280, this.displayName());
      }
      if (this.attackT > 0) return;
      const faster = this.role === 'final' ? this.phase * .18 : this.phase * .12;
      this.attackT = (this.role === 'final' ? 3.25 : 3.7) - faster;
      const patternCount = this.role === 'final' ? 4 : 2;
      const pattern = (Math.floor(this.floatT * 2 + this.phase + this.system.levelIdx) % patternCount);
      if (pattern === 0) this.castVolley(world, near.pl);
      else if (pattern === 1) this.castWave(world);
      else if (pattern === 2) this.castRain(world);
      else this.castRing(world);
    }

    castVolley(world, target) {
      const shots = [];
      const count = 2 + this.phase * 2;
      const base = Math.atan2(target.y - 36 - this.y, target.x - this.x);
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * .15;
        const speed = 210 + this.phase * 28;
        shots.push({ x: this.x, y: this.y, vx: Math.cos(base + spread) * speed,
          vy: Math.sin(base + spread) * speed, kind: 'orb', color: this.chapter.color,
          life: 4, r: this.role === 'final' ? 13 : 10, damage: 1, source: this.id });
      }
      this.system.cast(shots, world);
      this.system.castLabel(this, NLA.t('bossCastVolley'));
    }

    castWave(world) {
      const shots = [];
      const y = this.system.level.groundY - 28;
      for (const dir of [-1, 1]) {
        for (let i = 0; i < this.phase; i++) {
          shots.push({ x: this.x + dir * 30, y: y - i * 42, vx: dir * (250 + i * 40), vy: 0,
            kind: 'wave', color: this.chapter.accent, life: 3.6, r: 16, damage: 1, source: this.id });
        }
      }
      this.system.cast(shots, world);
      this.system.castLabel(this, NLA.t('bossCastWave'));
    }

    castRain(world) {
      const shots = [];
      const targets = world.players.slice(0, this.phase >= 3 ? 2 : 1);
      for (const target of targets) {
        const count = 2 + this.phase;
        for (let i = 0; i < count; i++) {
          shots.push({ x: target.x + (i - (count - 1) / 2) * 92, y: target.y - 470,
            vx: 0, vy: 0, fallSpeed: 420 + this.phase * 55, warmup: .75 + i * .08,
            kind: 'rain', color: this.chapter.color, life: 3.4, r: 14, damage: 1, source: this.id });
        }
      }
      this.system.cast(shots, world);
      this.system.castLabel(this, NLA.t('bossCastRain'));
    }

    castRing(world) {
      const shots = [];
      const count = 10 + this.phase * 3;
      for (let i = 0; i < count; i++) {
        const a = i / count * TAU + this.floatT * .25;
        const speed = 165 + this.phase * 24;
        shots.push({ x: this.x, y: this.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          kind: 'seal', color: this.chapter.accent, life: 4.2, r: 11, damage: 1, source: this.id });
      }
      this.system.cast(shots, world);
      this.system.castLabel(this, NLA.t('bossCastRing'));
    }

    draw(ctx, t) {
      if (this.dead) return;
      const c = this.chapter;
      const scale = this.role === 'final' ? 1.8 : this.role === 'guardian' ? 1.28 : .82;
      const pulse = 1 + Math.sin(t * 3 + this.floatT) * .04;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(scale * pulse, scale * pulse);
      if (this.flash > 0) ctx.globalAlpha = .65 + Math.sin(this.flash * 28) * .3;

      const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 58);
      aura.addColorStop(0, c.color + '88');
      aura.addColorStop(1, c.dark + '00');
      ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.fill();

      if (this.kind === 'river') this.drawSerpent(ctx, t);
      else if (this.kind === 'bamboo') this.drawBambooMask(ctx, t);
      else if (this.kind === 'lotus') this.drawCrane(ctx, t);
      else if (this.kind === 'bronze') this.drawBronze(ctx, t);
      else if (this.kind === 'storm') this.drawStorm(ctx, t);
      else this.drawPaper(ctx, t);

      if (this.role !== 'mob') {
        ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
        ctx.globalAlpha = .55;
        ctx.rotate(-t * .35);
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU;
          ctx.beginPath(); ctx.arc(Math.cos(a) * 42, Math.sin(a) * 42, 3, 0, TAU); ctx.stroke();
        }
      }
      ctx.restore();

      if (this.role === 'guardian' && this.active) {
        roundedBar(ctx, this.x - 62, this.y - 82, 124, 9, this.hp / this.maxHp, c.color);
      }
    }

    face(ctx) {
      ctx.fillStyle = '#130d22';
      ctx.beginPath(); ctx.arc(-7, -3, 2.4, 0, TAU); ctx.arc(7, -3, 2.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = this.chapter.accent; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.arc(0, 5, 7, .15, Math.PI - .15); ctx.stroke();
    }

    drawPaper(ctx, t) {
      ctx.fillStyle = this.chapter.dark;
      ctx.beginPath();
      ctx.moveTo(0, -30); ctx.quadraticCurveTo(28, -16, 24, 18);
      ctx.quadraticCurveTo(10, 10, 0, 28); ctx.quadraticCurveTo(-10, 10, -24, 18);
      ctx.quadraticCurveTo(-28, -16, 0, -30); ctx.fill();
      ctx.strokeStyle = this.chapter.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-20, -10); ctx.quadraticCurveTo(0, -22, 20, -10); ctx.stroke();
      NLA.draw.nonLa(ctx, 0, -29, 42, Math.sin(t * 2) * .08, 'warm', .25, t);
      this.face(ctx);
    }

    drawSerpent(ctx, t) {
      ctx.strokeStyle = this.chapter.dark; ctx.lineWidth = 18; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-25, 18); ctx.quadraticCurveTo(22, 34 + Math.sin(t * 4) * 5, 9, -7); ctx.stroke();
      ctx.fillStyle = this.chapter.color; ctx.beginPath(); ctx.ellipse(8, -13, 22, 17, -.2, 0, TAU); ctx.fill();
      ctx.fillStyle = this.chapter.accent; ctx.beginPath(); ctx.arc(17, -17, 3, 0, TAU); ctx.fill();
      NLA.draw.nonLa(ctx, 2, -28, 34, -.08, 'blue', .3, t);
    }

    drawBambooMask(ctx, t) {
      ctx.fillStyle = this.chapter.dark; NLA.draw.rr(ctx, -22, -27, 44, 54, 15); ctx.fill();
      ctx.strokeStyle = this.chapter.color; ctx.lineWidth = 3;
      for (let y = -16; y <= 16; y += 11) { ctx.beginPath(); ctx.moveTo(-17, y); ctx.lineTo(17, y); ctx.stroke(); }
      ctx.fillStyle = this.chapter.accent;
      ctx.beginPath(); ctx.moveTo(-13, -8); ctx.lineTo(-3, -3); ctx.lineTo(-14, 1); ctx.fill();
      ctx.beginPath(); ctx.moveTo(13, -8); ctx.lineTo(3, -3); ctx.lineTo(14, 1); ctx.fill();
      ctx.strokeStyle = '#d8f2ad'; ctx.beginPath(); ctx.arc(0, 8, 8, .2, Math.PI - .2); ctx.stroke();
      NLA.draw.nonLa(ctx, 0, -30, 38, Math.sin(t * 2.5) * .05, 'warm', .2, t);
    }

    drawCrane(ctx, t) {
      ctx.fillStyle = this.chapter.dark; ctx.beginPath(); ctx.ellipse(0, 5, 22, 16, 0, 0, TAU); ctx.fill();
      const flap = Math.sin(t * 5) * .3;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.rotate(s * flap); ctx.fillStyle = this.chapter.color;
        ctx.beginPath(); ctx.moveTo(s * 5, 1); ctx.quadraticCurveTo(s * 38, -28, s * 43, 7);
        ctx.quadraticCurveTo(s * 25, 1, s * 6, 12); ctx.fill(); ctx.restore();
      }
      ctx.strokeStyle = this.chapter.accent; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(10, -3); ctx.quadraticCurveTo(25, -22, 16, -34); ctx.stroke();
      ctx.fillStyle = this.chapter.dark; ctx.beginPath(); ctx.arc(15, -35, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = this.chapter.accent; ctx.beginPath(); ctx.arc(18, -37, 2, 0, TAU); ctx.fill();
    }

    drawBronze(ctx, t) {
      ctx.fillStyle = this.chapter.dark; ctx.beginPath(); ctx.arc(0, 1, 28, 0, TAU); ctx.fill();
      ctx.strokeStyle = this.chapter.color; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 1, 21, 0, TAU); ctx.stroke();
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * TAU + t * .08;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11 + 1);
        ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20 + 1); ctx.stroke();
      }
      this.face(ctx);
      NLA.draw.nonLa(ctx, 0, -28, 39, 0, 'warm', .3, t);
    }

    drawStorm(ctx, t) {
      ctx.fillStyle = this.chapter.dark;
      for (let i = 0; i < 3; i++) {
        const a = t * (i % 2 ? -1 : 1) + i * 2.1;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * 8, Math.sin(a * 1.3) * 8, 25 - i * 4, 15, a, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = this.chapter.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-9, 3); ctx.lineTo(-2, 7); ctx.lineTo(2, -2); ctx.lineTo(10, 3); ctx.stroke();
      ctx.fillStyle = this.chapter.accent; ctx.beginPath(); ctx.arc(-8, -8, 2.5, 0, TAU); ctx.arc(8, -8, 2.5, 0, TAU); ctx.fill();
      NLA.draw.nonLa(ctx, 0, -29, 42, Math.sin(t * 3) * .12, 'pink', .42, t);
    }
  }

  class CombatProjectile {
    constructor(spec, harmful) {
      Object.assign(this, spec);
      this.harmful = harmful;
      this.life = safeNumber(this.life, 4);
      this.r = safeNumber(this.r, 10);
      this.warmup = safeNumber(this.warmup, 0);
      this.age = 0;
      this.dead = false;
    }

    update(dt, world, system) {
      this.age += dt;
      this.life -= dt;
      if (this.life <= 0) { this.dead = true; return; }
      if (this.warmup > 0) {
        this.warmup -= dt;
        if (this.warmup <= 0 && this.fallSpeed) this.vy = this.fallSpeed;
        return;
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (!this.harmful) return;
      for (const pl of world.players) {
        if (pl.invuln > 0 || U.dist(this.x, this.y, pl.x, pl.y - 30) > this.r + 18) continue;
        if (world.shieldCovers(this.x, this.y)) {
          this.dead = true;
          const source = system.byId[this.source];
          if (source && !source.dead) source.takeDamage(5 + rankNow(), world, 'reflect');
          NLA.audio.sfx('shieldReflect');
          P().burst(this.x, this.y, 14, { kind: 'spark', color: '#9ff4ef', glow: 'teal', speed: 125, life: .7, size: 3 });
        } else {
          this.dead = true;
          world.damagePlayer(pl, this.damage || 1, Math.sign(pl.x - this.x) * 250, -230, NLA.t('spiritMagic'));
        }
        break;
      }
    }

    draw(ctx, t) {
      if (this.dead) return;
      ctx.save();
      if (this.warmup > 0) {
        const pulse = 18 + Math.sin(t * 12) * 5;
        ctx.globalAlpha = .55;
        ctx.strokeStyle = this.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(this.x, this.y + 455, pulse, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x - 8, this.y + 455); ctx.lineTo(this.x + 8, this.y + 455);
        ctx.moveTo(this.x, this.y + 447); ctx.lineTo(this.x, this.y + 463); ctx.stroke();
        ctx.restore(); return;
      }
      NLA.draw.glow(ctx, 'warm', this.x, this.y, this.r * 2.8, .5);
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.atan2(this.vy, this.vx) + t * (this.kind === 'seal' ? 4 : 0));
      ctx.fillStyle = this.color;
      if (this.kind === 'wave') {
        ctx.beginPath(); ctx.moveTo(-20, 9); ctx.quadraticCurveTo(0, -20, 24, 4);
        ctx.quadraticCurveTo(3, -3, -20, 9); ctx.fill();
      } else if (this.kind === 'seal') {
        ctx.strokeStyle = this.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, this.r, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-this.r, 0); ctx.lineTo(this.r, 0); ctx.moveTo(0, -this.r); ctx.lineTo(0, this.r); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, this.r, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.beginPath(); ctx.arc(-this.r * .25, -this.r * .3, this.r * .25, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  class HatSkillEffect {
    constructor(data, harmful) {
      Object.assign(this, data);
      this.harmful = harmful;
      this.age = 0;
      this.life = 1.05 + this.rank * .05;
      this.dead = false;
      this.hit = new Set();
      this.startX = this.x;
      this.color = HAT_COLORS[U.clamp(this.rank - 1, 0, HAT_COLORS.length - 1)];
    }

    update(dt, world, system) {
      this.age += dt; this.life -= dt;
      this.x += this.dir * (520 + this.rank * 35) * dt;
      this.y += Math.sin(this.age * 8) * 24 * dt;
      if (this.life <= 0) { this.dead = true; return; }
      if (!this.harmful) return;
      const radius = 48 + this.rank * 8;
      for (const enemy of system.enemies) {
        if (enemy.dead || this.hit.has(enemy.id)) continue;
        if (U.dist(this.x, this.y, enemy.x, enemy.y) < radius + enemy.radius) {
          this.hit.add(enemy.id);
          enemy.takeDamage(20 + this.rank * 5, world, 'hat');
        }
      }
    }

    draw(ctx, t) {
      ctx.save();
      const fade = U.clamp(this.life * 1.8, 0, 1);
      ctx.globalAlpha = fade;
      for (let i = 4; i >= 0; i--) {
        const tx = this.x - this.dir * i * 19;
        ctx.globalAlpha = fade * (1 - i * .16);
        NLA.draw.glow(ctx, 'warm', tx, this.y, 50 + this.rank * 6, .28);
        ctx.save(); ctx.translate(tx, this.y); ctx.rotate(t * 9 * this.dir - i * .3);
        ctx.strokeStyle = this.color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(0, 0, 30 + this.rank * 3, 10 + this.rank, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = this.color + '55'; ctx.beginPath(); ctx.ellipse(0, 0, 26 + this.rank * 3, 7 + this.rank, 0, 0, TAU); ctx.fill();
        ctx.restore();
      }
      /* Rank motifs keep the skill culturally legible without extra textures. */
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(t * 2.4 * this.dir);
      if (this.rank === 3) {
        ctx.fillStyle = '#b8ec82';
        for (let i = 0; i < 8; i++) {
          ctx.save(); ctx.rotate(i * TAU / 8); ctx.translate(45, 0); ctx.rotate(.55);
          ctx.beginPath(); ctx.ellipse(0, 0, 11, 3.5, 0, 0, TAU); ctx.fill(); ctx.restore();
        }
      } else if (this.rank === 4) {
        ctx.fillStyle = '#ffb5d9aa';
        for (let i = 0; i < 8; i++) {
          ctx.save(); ctx.rotate(i * TAU / 8); ctx.translate(48, 0);
          ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, 0, TAU); ctx.fill(); ctx.restore();
        }
      } else if (this.rank === 5) {
        ctx.strokeStyle = '#ffd879'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, 49, 0, TAU); ctx.stroke();
        for (let i = 0; i < 12; i++) {
          ctx.save(); ctx.rotate(i * TAU / 12); ctx.beginPath(); ctx.moveTo(41, -4); ctx.lineTo(55, 0); ctx.lineTo(41, 4); ctx.stroke(); ctx.restore();
        }
      } else if (this.rank >= 6) {
        for (const s of [-1, 1]) {
          ctx.strokeStyle = s < 0 ? '#a9ecff' : '#ff9fcf'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(s * 19, 0, 31, 0, TAU); ctx.stroke();
        }
      }
      ctx.restore();
      ctx.globalAlpha = fade;
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#fff4c9';
      ctx.fillText(NLA.t('hatSkillName' + this.rank), this.x, this.y - 50 - this.rank * 3);
      ctx.restore();
    }
  }

  class CombatSystem {
    constructor(levelIdx, level) {
      this.levelIdx = levelIdx;
      this.level = level;
      this.chapter = CHAPTERS[levelIdx] || CHAPTERS[0];
      this.enemies = [];
      this.byId = {};
      this.projectiles = [];
      this.skills = [];
      this.castText = null;
      this.castTextT = 0;
      const y = level.groundY - 92;
      this.chapter.mobXs.forEach((x, i) => this.add(new SpiritEnemy(this, { id: 'spirit_' + levelIdx + '_' + i, x, y: y - (i % 2) * 28 })));
      this.guardian = this.add(new SpiritEnemy(this, { id: 'guardian_' + levelIdx, role: 'guardian', x: this.chapter.guardianX, y: y - 20 }));
      this.finalBoss = this.add(new SpiritEnemy(this, { id: 'boss_' + levelIdx, role: 'final', x: this.chapter.bossX, y: y - 45 }));
      this.rewardIds = new Set();
    }

    add(enemy) {
      this.enemies.push(enemy); this.byId[enemy.id] = enemy; return enemy;
    }

    authoritative(world) {
      return !world.net.active || world.net.isHost;
    }

    update(dt, world) {
      const authority = this.authoritative(world);
      if (authority) for (const enemy of this.enemies) enemy.update(dt, world);
      else for (const enemy of this.enemies) { enemy.flash = Math.max(0, enemy.flash - dt * 5); enemy.floatT += dt; }
      for (const p of this.projectiles) p.update(dt, world, this);
      for (const skill of this.skills) skill.update(dt, world, this);
      this.projectiles = this.projectiles.filter(p => !p.dead).slice(-80);
      this.skills = this.skills.filter(s => !s.dead).slice(-12);
      this.castTextT = Math.max(0, this.castTextT - dt);
    }

    addSolids(solids) {
      for (const boss of [this.guardian, this.finalBoss]) {
        if (!boss.active || boss.dead) continue;
        solids.push({ x: boss.homeX + (boss.role === 'final' ? 240 : 205), y: 160,
          w: 34, h: this.level.groundY - 160, oneWay: false, type: 'spiritBarrier', combatBarrier: true });
      }
    }

    cast(shots, world, fromNet) {
      const harmful = this.authoritative(world);
      for (const spec of shots) this.projectiles.push(new CombatProjectile(spec, harmful));
      if (!fromNet) world.emitEvent('combatCast', { shots });
      NLA.audio.sfx('bossCast');
    }

    castLabel(enemy, text) {
      if (enemy.role !== 'final') return;
      this.castText = text; this.castTextT = 1.5;
    }

    applyCast(data, world) {
      if (!data || !Array.isArray(data.shots)) return;
      this.cast(data.shots.slice(0, 24), world, true);
    }

    useHatSkill(pl, world, data, fromNet) {
      const rank = U.clamp(safeNumber(data && data.rank, rankNow()), 1, 6);
      const spec = {
        who: pl.who, x: safeNumber(data && data.x, pl.x), y: safeNumber(data && data.y, pl.y - 46),
        dir: safeNumber(data && data.dir, pl.face) < 0 ? -1 : 1, rank,
      };
      this.skills.push(new HatSkillEffect(spec, this.authoritative(world)));
      pl.powerFx = 1.5;
      NLA.audio.sfx('hatSkill');
      P().burst(spec.x, spec.y, 22 + rank * 2, { kind: 'spark', color: HAT_COLORS[rank - 1], glow: 'warm', speed: 150, life: .9, size: 3 });
      if (rank >= 3) P().burst(spec.x, spec.y, 10, { kind: 'leaf', color: rank === 4 ? '#ffb5d9' : '#9fd36b', speed: 115, life: 1.05, size: 4, grav: 25 });
      if (!fromNet) world.emitEvent('hatSkill', spec);
      return spec;
    }

    hitCircle(x, y, radius, amount, world, source) {
      if (!this.authoritative(world)) return;
      for (const enemy of this.enemies) {
        if (!enemy.dead && U.dist(x, y, enemy.x, enemy.y) < radius + enemy.radius) enemy.takeDamage(amount, world, source);
      }
    }

    hitCone(x, y, dir, range, height, amount, world, source) {
      if (!this.authoritative(world)) return;
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        const dx = (enemy.x - x) * dir;
        if (dx > -25 && dx < range + enemy.radius && Math.abs(enemy.y - y) < height + enemy.radius) {
          enemy.x += dir * 18;
          enemy.takeDamage(amount, world, source);
        }
      }
    }

    receiveReward(id, xp, role, world) {
      if (this.rewardIds.has(id)) return;
      this.rewardIds.add(id);
      const d = NLA.save.data;
      const before = rankNow();
      d.hatXP = Math.max(0, safeNumber(d.hatXP, 0)) + safeNumber(xp, 0);
      NLA.save.store();
      const after = rankNow();
      if (role === 'final') NLA.ui.toast(NLA.t('bossPurified').replace('{NAME}', this.byId[id] ? this.byId[id].displayName() : NLA.t('spiritMonster')), 5200);
      else if (role === 'guardian') NLA.ui.toast(NLA.t('guardianPurified'), 3600);
      if (after > before) {
        for (const pl of world.players) pl.hatEnergy = 100;
        NLA.ui.toast(NLA.t('hatMasteryUp').replace('{RANK}', after).replace('{SKILL}', NLA.t('hatSkillName' + after)), 5600);
        NLA.audio.sfx('loveUp');
      }
    }

    finalDefeated() { return !!(this.finalBoss && this.finalBoss.dead); }

    objective(world) {
      if (!this.guardian.dead) return NLA.t('questGuardian').replace('{NAME}', this.guardian.displayName());
      if (!this.finalBoss.dead) return NLA.t('questBoss').replace('{NAME}', this.finalBoss.displayName());
      if (world.keyLit < world.level.required) return NLA.t('questLanterns');
      return NLA.t('questExit');
    }

    activeBoss() {
      if (this.finalBoss.active && !this.finalBoss.dead) return this.finalBoss;
      if (this.guardian.active && !this.guardian.dead) return this.guardian;
      return null;
    }

    snapshot() {
      return this.enemies.map(e => [e.id, Math.round(e.x * 10) / 10, Math.round(e.y * 10) / 10,
        Math.round(e.hp * 10) / 10, e.active ? 1 : 0, e.dead ? 1 : 0, e.phase]);
    }

    applySnapshot(rows, world) {
      if (!Array.isArray(rows)) return;
      for (const row of rows.slice(0, 24)) {
        const e = this.byId[row[0]];
        if (!e) continue;
        e.x = U.lerp(e.x, safeNumber(row[1], e.x), .24);
        e.y = U.lerp(e.y, safeNumber(row[2], e.y), .24);
        e.hp = safeNumber(row[3], e.hp);
        const wasActive = e.active, wasDead = e.dead;
        const nextActive = !!row[4];
        e.dead = !!row[5]; e.phase = safeNumber(row[6], e.phase);
        if (!wasActive && nextActive && !e.announced) { e.active = false; e.activate(world); }
        else e.active = nextActive;
        if (!wasDead && e.dead) {
          P().burst(e.x, e.y, e.role === 'final' ? 44 : 20, { kind: 'firefly', color: e.chapter.accent, speed: 150, life: 1.6, size: 4 });
        }
      }
    }

    draw(ctx, t, world) {
      for (const enemy of this.enemies) enemy.draw(ctx, t);
      for (const p of this.projectiles) p.draw(ctx, t);
      for (const skill of this.skills) skill.draw(ctx, t);
      for (const boss of [this.guardian, this.finalBoss]) {
        if (!boss.active || boss.dead) continue;
        const bx = boss.homeX + (boss.role === 'final' ? 257 : 222);
        const top = 220, bottom = this.level.groundY;
        ctx.save();
        const g = ctx.createLinearGradient(bx, top, bx, bottom);
        g.addColorStop(0, boss.chapter.color + '00'); g.addColorStop(.5, boss.chapter.color + '99'); g.addColorStop(1, boss.chapter.color + '22');
        ctx.fillStyle = g; ctx.fillRect(bx - 17, top, 34, bottom - top);
        ctx.strokeStyle = boss.chapter.accent; ctx.lineWidth = 2; ctx.globalAlpha = .65 + Math.sin(t * 5) * .2;
        for (let y = top + 20; y < bottom; y += 70) {
          ctx.beginPath(); ctx.arc(bx, y, 11, 0, TAU); ctx.stroke();
        }
        ctx.restore();
      }
    }

    drawHUD(ctx, t, world) {
      const vw = world.viewW;
      const boss = this.activeBoss();
      if (boss) {
        const w = Math.min(450, vw * .46), x = (vw - w) / 2, y = 112;
        ctx.save(); ctx.textAlign = 'center';
        ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = boss.chapter.accent;
        ctx.fillText(boss.displayName() + (boss.role === 'final' ? `  ·  ${NLA.t('bossPhase')} ${boss.phase}` : ''), vw / 2, y - 7);
        roundedBar(ctx, x, y, w, 15, boss.hp / boss.maxHp, boss.chapter.color);
        if (this.castTextT > 0 && this.castText) {
          ctx.globalAlpha = U.clamp(this.castTextT, 0, 1);
          ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fff2cf';
          ctx.fillText(this.castText, vw / 2, y + 36);
        }
        ctx.restore();
      }

      ctx.save();
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(18,9,32,.72)';
      const objective = this.objective(world);
      const ow = Math.min(vw - 280, ctx.measureText(objective).width + 28);
      const oy = boss ? 160 : 116;
      NLA.draw.rr(ctx, vw / 2 - ow / 2, oy, ow, 24, 12); ctx.fill();
      ctx.fillStyle = '#ffe9b3'; ctx.fillText(objective, vw / 2, oy + 16);

      const rank = rankNow();
      const energy = world.mode === 'solo' ? world.players.find(p => p.who === world.activeChar).hatEnergy
        : Math.max(world.boy.hatEnergy, world.girl.hatEnergy);
      const label = `△ ${NLA.t('hatMastery')} ${rank} · ${NLA.t('hatSkillName' + rank)}`;
      ctx.textAlign = 'right'; ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = HAT_COLORS[rank - 1];
      ctx.fillText(label, vw - 18, world.viewH - 56);
      roundedBar(ctx, vw - 170, world.viewH - 48, 152, 8, energy / 100, HAT_COLORS[rank - 1]);
      ctx.restore();
    }
  }

  NLA.combat = {
    create(levelIdx, level) { return new CombatSystem(levelIdx, level); },
    chapters: CHAPTERS,
  };
})();

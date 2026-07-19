/* =====================================================================
   game.js — the game world: physics, co-op logic, love meter, camera,
   rendering, HUD. The Game instance doubles as the "world" object that
   entities receive.
   ===================================================================== */
(function () {
  const C = NLA.CONST, U = NLA.util, E = NLA.ent, P = () => NLA.draw.particles;

  const THEME_GROUND = {
    street: { base: '#463a52', top: '#6a5a72', deco: '#57496280' },
    river: { base: '#4a3828', top: '#6e5438', deco: '#3a2c2080' },
    village: { base: '#57432c', top: '#5f7d43', deco: '#48693780' },
    lake: { base: '#3c3252', top: '#55486e', deco: '#2e264080' },
    temple: { base: '#3d2e35', top: '#5a444e', deco: '#2c202880' },
    finale: { base: '#2e2640', top: '#453a58', deco: '#38304a80' },
  };
  const ITEM_COLORS = {
    lantern: '#ffb45e', petal: '#ff9fce', leaf: '#9be56d', envelope: '#ff6964',
    banhchung: '#72c878', star: '#ffe276', hat: '#f0d49a', candle: '#ff9c79',
  };
  const CHAPTER_PROPS = [
    [{ key: 'hoian-house', x: 420, w: 520, h: 410 }, { key: 'craft-stall', x: 1780, w: 350, h: 285 }, { key: 'hoian-house', x: 4380, w: 500, h: 395, flip: true }],
    [{ key: 'lotus-pavilion', x: 4340, w: 430, h: 335 }, { key: 'hoian-house', x: 6900, w: 480, h: 380 }],
    [{ key: 'village-house', x: 720, w: 500, h: 390 }, { key: 'village-house', x: 3860, w: 470, h: 370, flip: true }, { key: 'craft-stall', x: 5740, w: 330, h: 270 }],
    [{ key: 'lotus-pavilion', x: 1260, w: 460, h: 360 }, { key: 'lotus-pavilion', x: 4250, w: 440, h: 345, flip: true }],
    [{ key: 'temple-gate', x: 720, w: 480, h: 390 }, { key: 'temple-gate', x: 4320, w: 510, h: 410 }],
    [{ key: 'festival-stage', x: 1080, w: 500, h: 390 }, { key: 'festival-stage', x: 3650, w: 530, h: 410, flip: true }],
  ];

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.state = 'idle';        /* idle | play | memory | complete | ending */
      this.paused = false;
      this.mode = 'solo';         /* solo | local | net */
      this.activeChar = 'boy';    /* solo: which char the player controls */
      this.t = 0;                 /* level time */
      this.love = 0;
      this.lovePeak = 0;
      this.loveLevel = 0;
      this.loveBurstCd = 0;
      this.wipeT = 0;
      this.holdingHands = false;
      this.levelIdx = 0;
      this.cam = { x: 0, y: 0 };
      this.charmsRun = 0;
      this.net = NLA.net;
      this.lightCanvas = document.createElement('canvas');
      this.lightCtx = this.lightCanvas.getContext('2d');
      this.lightScale = NLA.input.isTouchDevice ? 0.42 : 0.5;
      this.lightHole = document.createElement('canvas');
      this.lightHole.width = this.lightHole.height = 128;
      const holeCtx = this.lightHole.getContext('2d');
      const holeGrad = holeCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
      holeGrad.addColorStop(0, 'rgba(0,0,0,1)');
      holeGrad.addColorStop(1, 'rgba(0,0,0,0)');
      holeCtx.fillStyle = holeGrad;
      holeCtx.fillRect(0, 0, 128, 128);
      this._suppress = false;
      this.prevHands = false;
      this.tip = null;
      this.toastQueue = [];
      this.endingT = -1;
      this.viewW = C.VIEW_W; this.viewH = C.VIEW_H; this.scale = 1;
      this.cutscene = false;
      this.celebrating = false;
      this.abilityFx = [];
      this.pickupNotice = null;
      this.seenItemKinds = new Set();
    }

    /* ================= level loading ================= */
    loadLevel(idx) {
      const lv = NLA.LEVELS[idx];
      if (!lv) return;
      this.levelIdx = idx;
      this.level = lv;
      this.t = 0;
      this.state = 'play';
      this.paused = false;
      this.cutscene = false;
      this.celebrating = false;
      this.endingT = -1;
      this.holdingHands = false;
      this.loveBurstCd = 0;
      this.wipeT = 0;
      this.keyLit = 0;
      this.levelCharms = 0;
      this.levelLoveStart = this.love;
      this.levelMemories = 0;
      this.abilityFx.length = 0;
      this.pickupNotice = null;
      this.levelStartTime = performance.now();
      this.checkpointX = lv.spawnX;
      this.waveTimer = lv.windWaves ? lv.windWaves.period * 0.7 : 0;
      this.waveState = 'idle'; this.waveT = 0;
      P().clear();

      /* players */
      const boy = new E.Player('boy', lv.spawnX, lv.groundY);
      const girl = new E.Player('girl', lv.spawnX + 60, lv.groundY);
      this.players = [boy, girl];
      this.boy = boy; this.girl = girl;

      if (this.mode === 'net') {
        const mine = this.net.myChar;
        for (const p of this.players) p.remote = (p.who !== mine);
      } else {
        for (const p of this.players) p.remote = false;
      }

      /* objects */
      this.objects = [];
      this.byId = {};
      let autoId = 0;
      for (const o of lv.objects) {
        const id = o.id || (o.k + '_' + (autoId++));
        o.id = id;
        let inst = null;
        switch (o.k) {
          case 'stone': inst = new E.StoneLantern(o, lv); break;
          case 'wire': inst = new E.WireLantern(o); break;
          case 'candle': inst = new E.Candle(o, lv); break;
          case 'ropegate': inst = new E.RopeGate(o); break;
          case 'box': inst = new E.Box(o, lv); break;
          case 'plate': inst = new E.Plate(o, lv); break;
          case 'gate': inst = new E.Gate(o, lv); break;
          case 'plank': inst = new E.Plank(o, lv); break;
          case 'brokenbridge': inst = new E.BrokenBridge(o, lv); break;
          case 'lotus': inst = new E.LotusSpot(o, lv); break;
          case 'windmark': inst = new E.WindMark(o, lv); break;
          case 'memory': inst = new E.MemoryLantern(o, lv); break;
          case 'checkpoint': inst = new E.Checkpoint(o, lv); break;
          case 'heart': inst = new E.HeartLantern(o); break;
          case 'boat': inst = new E.Boat(o); break;
          case 'rocks': inst = new E.Rocks(o); break;
          case 'statue': inst = new E.Statue(o, lv); break;
          case 'villager': inst = new E.Villager(o, lv); break;
          case 'buffalo': inst = new E.Buffalo(o, lv); break;
          case 'culture': inst = new E.CultureRelic(o, lv); break;
          case 'sign': inst = new E.Sign(o, lv); break;
          case 'biglantern': inst = new E.BigLantern(o, lv); break;
        }
        if (inst) {
          inst.id = inst.id || id;
          this.objects.push(inst);
          this.byId[inst.id] = inst;
        }
      }
      this.cultureTotal = this.objects.filter(o => o instanceof E.CultureRelic).length;
      this.cultureSeen = 0;
      this.enemies = [];
      for (const e of lv.enemies) {
        if (e.k === 'wisp') this.enemies.push(new E.Wisp(e));
        else if (e.k === 'birdzone') this.enemies.push(new E.BirdZone(e));
        else if (e.k === 'bamboo') this.enemies.push(new E.FallingBamboo(e, lv));
      }
      for (const w of this.enemies) { if (w.id) this.byId[w.id] = w; }
      this.collectibles = lv.collect.map((c, i) => {
        const inst = new E.Collectible(c, i);
        this.byId[inst.id] = inst;
        return inst;
      });
      this.combat = NLA.combat && NLA.combat.create(idx, lv);
      /* Only fetch art needed by this chapter and the current skill rank. The
         canvas fallbacks keep loading non-blocking on slow mobile networks. */
      if (NLA.art) {
        const rank = NLA.hatRank ? NLA.hatRank() : 1;
        NLA.art.preload(['lantern', 'boss' + (idx + 1), 'skill' + rank,
          'scene' + (idx + 1), 'enemySkill' + (idx + 1), 'portraitBoySheet', 'portraitGirlSheet',
          'ui_love', 'ui_rescue', 'ui_checkpoint', 'coop_revive-aura', 'coop_love-burst',
          'prop_helper-crate', 'prop_checkpoint-arch']);
      }

      this.staticSolids = lv.platforms.map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h, oneWay: !!p.oneWay, type: p.type }));
      this.solids = [];
      this.captureCheckpoint(lv.spawnX, { initial: true });

      NLA.bg.build(lv.theme, lv.id * 777 + 13, idx + 1);
      NLA.audio.setTheme(lv.theme);
      NLA.audio.setIntensity(0.25 + this.loveLevel * 0.08);
      this.cam.x = 0; this.cam.y = lv.H - this.viewH;
    }

    /* ================= facade for entities ================= */
    /* display name for a character; in online play the partner's own
       chosen name wins for their character */
    nameFor(who) {
      if (this.net.active && who !== this.net.myChar && this.partnerName) return this.partnerName;
      return NLA.name(who);
    }
    waterAt(x) {
      if (!this.level) return null;
      for (const w of this.level.water) if (x >= w.x && x <= w.x + w.w) return w.y;
      return null;
    }
    shieldCovers(x, y) {
      const b = this.boy;
      if (!b || !b.shieldOn) return false;
      const r = this.loveLevel >= 3 ? 130 : 96;
      return U.dist(x, y, b.x, b.y - 40) < r;
    }
    damagePlayer(pl, amount, knockX, knockY, source, fromNet) {
      if (!pl || pl.downed || this.state !== 'play' || pl.invuln > 0) return false;
      if (!fromNet && this.net.active && !this.net.isHost) return false;
      pl.hp = Math.max(0, pl.hp - Math.max(1, amount || 1));
      pl.invuln = 1.15;
      pl.stun = Math.max(pl.stun, .62);
      pl.dim = Math.max(pl.dim, .35);
      if (!pl.remote || fromNet) {
        pl.vx = knockX || 0;
        pl.vy = knockY || -210;
      }
      NLA.audio.sfx('hurt');
      P().burst(pl.x, pl.y - 38, 12, { kind: 'spark', color: '#ff829f', glow: 'pink', speed: 110, life: .65, size: 3 });
      if (pl.hp <= 0) {
        pl.downed = true; pl.reviveProgress = 0; pl.downedT = 0;
        pl.vx = pl.vy = 0;
        pl.stun = 0; pl.invuln = 0; this.holdingHands = false;
        const water = this.waterAt(pl.x);
        if (water !== null || pl.y > this.level.H) {
          const boat = this.objects.find(o => o instanceof E.Boat);
          const segment = this.level.water.find(w => pl.x >= w.x && pl.x <= w.x + w.w);
          const boatMid = boat && boat.x + boat.w / 2;
          if (boat && segment && boatMid >= segment.x - 40 && boatMid <= segment.x + segment.w + 40) {
            pl.x = boat.x + boat.w / 2; pl.y = boat.bobY(this.t) - 2;
          }
          else { pl.x = pl.lastSafeX || this.checkpointX; pl.y = (pl.lastSafeY || this.level.groundY) - 2; }
        }
        if (this.mode === 'solo' && this.activeChar === pl.who) {
          this.activeChar = this.players.find(p => p !== pl).who;
          NLA.ui.updateTouchIcons();
        }
        NLA.ui.toast(NLA.t('partnerDown'), 3600);
        this.spawnAbilityFx('coop_revive-aura', pl.x, pl.y - 45, 1, 155, 1.2);
      }
      if (!fromNet) this.emitEvent('combatHit', {
        who: pl.who, hp: pl.hp, x: pl.x, y: pl.y, vx: pl.vx, vy: pl.vy,
        source: String(source || '').slice(0, 40), downed: !!pl.downed,
      });
      return true;
    }
    emitEvent(kind, data) {
      if (this._suppress) return;
      if (this.net.active) this.net.send({ t: 'ev', k: kind, d: data });
    }
    addLove(n, x, y) {
      if (this.love >= C.LOVE_MAX && n > 0) return;
      this.love = U.clamp(this.love + n, 0, C.LOVE_MAX);
      this.lovePeak = Math.max(this.lovePeak, this.love);
      if (x !== undefined) {
        P().burst(x, y, Math.min(6, n + 1), { kind: 'heart', color: '#ff8fae', speed: 60, life: 1.2, size: 4, grav: -50 });
      }
      const lv = C.LOVE_LEVELS.filter(th => this.lovePeak >= th).length;
      if (lv > this.loveLevel) {
        this.loveLevel = lv;
        NLA.audio.sfx('loveUp');
        NLA.audio.setIntensity(0.25 + lv * 0.12);
        NLA.ui.toast(NLA.t('loveUp' + lv));
        P().burst((this.boy.x + this.girl.x) / 2, (this.boy.y + this.girl.y) / 2 - 60, 26,
          { kind: 'heart', color: '#ff6b93', speed: 130, life: 1.6, size: 5, grav: -60 });
      }
    }
    onLanternLit(o) {
      if (o.key) {
        this.keyLit = this.countKeyLit();
        this.addLove(NLA.LOVE.lantern, o.x, (o.y || 800) - 80);
        NLA.audio.setIntensity(Math.min(1, 0.3 + this.loveLevel * 0.1 + (this.keyLit / Math.max(1, this.level.required)) * 0.3));
      } else {
        /* every lantern matters: bonus lanterns pay out charms + a little love */
        this.grantBonusLantern(o);
      }
      this.emitEvent('lantern', { id: o.id });
    }
    grantBonusLantern(o) {
      this.bonusCharms(2, o.x, (o.y || this.level.groundY) - 70);
      this.addLove(1, o.x, (o.y || this.level.groundY) - 90);
      this.pickupNotice = { text: NLA.t('bonusLantern'), color: '#ffd76b', life: 2.1 };
    }
    bonusCharms(n, x, y) {
      this.levelCharms += n;
      NLA.save.data.charms += n;
      NLA.save.store();
      if (x !== undefined) {
        P().burst(x, y, 5 + n * 2, { kind: 'star', color: '#ffd76b', speed: 85, life: 0.8, size: 3.5 });
      }
    }
    onCandleLit(o) { this.emitEvent('candle', { id: o.id }); }
    countKeyLit() {
      let n = 0;
      for (const o of this.objects) if (o.key && o.lit) n++;
      return n;
    }
    onCollect(c) {
      this.levelCharms++;
      NLA.save.data.charms++;
      NLA.save.store();
      this.applyCollectibleBenefit(c);
    }
    applyCollectibleBenefit(c) {
      const kind = c.kind || 'lantern';
      const injured = this.players.slice().sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
      if (kind === 'lantern') this.addLove(2, c.x, c.y);
      else if (kind === 'petal') {
        if (injured.hp < injured.maxHp) injured.hp++;
        else { this.girl.cd1 = 0; this.girl.cd2 = 0; }
      } else if (kind === 'leaf') {
        this.boy.shieldMeter = Math.min(C.SHIELD_MAX, this.boy.shieldMeter + 1.35);
        this.boy.cd1 = 0;
      } else if (kind === 'envelope') this.addLove(3, c.x, c.y);
      else if (kind === 'banhchung') {
        for (const pl of this.players) pl.hp = Math.min(pl.maxHp, pl.hp + 1);
      } else if (kind === 'star') {
        for (const pl of this.players) pl.hatEnergy = Math.min(100, pl.hatEnergy + 18);
      } else if (kind === 'hat') {
        for (const pl of this.players) pl.hatEnergy = 100;
      } else if (kind === 'candle') {
        for (const pl of this.players) { pl.invuln = Math.max(pl.invuln, 2); pl.dim = 0; }
      }
      const color = ITEM_COLORS[kind] || '#ffe9a3';
      this.pickupNotice = { text: NLA.t('itemGain_' + kind), color, life: 2.1 };
      if (!this.seenItemKinds.has(kind)) {
        this.seenItemKinds.add(kind);
        NLA.ui.toast(NLA.t('itemUse_' + kind), 3600);
      }
      P().burst(c.x, c.y, 11, { kind: 'spark', color, glow: 'warm', speed: 95, life: .75, size: 3 });
    }
    spawnAbilityFx(kind, x, y, dir, size, life) {
      this.abilityFx.push({ kind, x, y, dir: dir || 1, size: size || 150,
        life: life || .7, maxLife: life || .7, age: 0 });
      if (this.abilityFx.length > 12) this.abilityFx.splice(0, this.abilityFx.length - 12);
      if (NLA.art) NLA.art.load(kind.startsWith('coop_') ? kind : 'ability_' + kind);
    }
    updateAbilityFx(dt) {
      for (const fx of this.abilityFx) { fx.life -= dt; fx.age += dt; }
      this.abilityFx = this.abilityFx.filter(fx => fx.life > 0);
      if (this.pickupNotice) {
        this.pickupNotice.life -= dt;
        if (this.pickupNotice.life <= 0) this.pickupNotice = null;
      }
    }
    drawAbilityFx(ctx, t) {
      for (const fx of this.abilityFx) {
        const pct = U.clamp(fx.life / fx.maxLife, 0, 1);
        const grow = .72 + (1 - pct) * .42;
        const rotation = fx.kind === 'wind' ? fx.dir * .12 : (fx.kind === 'shield' ? t * .18 : 0);
        const artKey = fx.kind.startsWith('coop_') ? fx.kind : 'ability_' + fx.kind;
        NLA.draw.artSprite(ctx, artKey, fx.x, fx.y,
          fx.size * grow, fx.size * grow, Math.sin(Math.min(1, fx.age * 7)) * pct, rotation);
      }
    }
    discoverCulture(o, fromNet) {
      if (!o || o.seen) return;
      o.seen = true;
      this.cultureSeen++;
      NLA.audio.sfx('chime', (this.cultureSeen + this.levelIdx) % 5);
      P().burst(o.x, o.y - 58, 18, {
        kind: o.kind === 'giong' ? 'leaf' : 'spark',
        color: o.color || '#f5cf77', glow: 'warm', speed: 105, life: 1.15, size: 4, grav: -30,
      });
      this.addLove(1, o.x, o.y - 70);
      if (this.combat) this.combat.receiveReward('culture_' + o.id, o.xp || 4, 'culture', this);
      NLA.ui.toast(NLA.t(o.loreKey), 6200);
      if (!fromNet) this.emitEvent('culture', { id: o.id });
    }
    onHeartTaken(h) {
      const other = this.objects.find(o => o instanceof E.HeartLantern && o.pair === h.pair && o !== h);
      if (other && other.taken) {
        this.addLove(NLA.LOVE.heartPair, h.x, h.y);
        NLA.audio.sfx('loveUp');
        this.spawnAbilityFx('resonance', h.x, h.y, 1, 165, .95);
      }
    }
    setCheckpoint(x, checkpoint) {
      this.checkpointX = x;
      this.captureCheckpoint(x, { boatX: checkpoint && checkpoint.boatX });
    }
    captureCheckpoint(x, opts) {
      opts = opts || {};
      const boat = this.objects && this.objects.find(o => o instanceof E.Boat);
      const boxes = {};
      for (const o of (this.objects || [])) {
        if (o instanceof E.Box && !o.fixed) boxes[o.id] = { x: o.x, y: o.y };
      }
      this.checkpointState = {
        x, y: opts.y || this.level.groundY,
        boatX: Number.isFinite(opts.boatX) ? opts.boatX : (boat ? boat.x : null),
        spawnOnBoat: !!opts.spawnOnBoat,
        boxes,
      };
      this.checkpointX = x;
      if (!opts.initial) {
        this.spawnAbilityFx('coop_checkpoint-spiral', x, this.checkpointState.y - 88, 1, 175, 1.25);
      }
    }
    captureProgressCheckpoint(reason) {
      if (this.net.active && !this.net.isHost) return;
      const living = this.players.filter(p => !p.downed);
      if (!living.length) return;
      const boat = this.objects.find(o => o instanceof E.Boat);
      const aboard = boat && living.some(p => p.x > boat.x - 20 && p.x < boat.x + boat.w + 20 && Math.abs(p.y - boat.bobY(this.t)) < 90);
      let x, y;
      if (aboard) {
        x = boat.x + boat.w / 2; y = boat.bobY(this.t) - 2;
      } else {
        x = living.reduce((sum, p) => sum + (p.lastSafeX || p.x), 0) / living.length;
        y = living.reduce((sum, p) => sum + (p.lastSafeY || p.y), 0) / living.length;
      }
      this.captureCheckpoint(x, { y, boatX: boat ? boat.x : null, spawnOnBoat: aboard });
      NLA.ui.toast(NLA.t('progressSaved'), 2800);
      this.emitEvent('progressCheckpoint', { reason, x, y, boatX: boat ? boat.x : null, spawnOnBoat: aboard });
    }
    respawnAtCheckpoint(pl) {
      const state = this.checkpointState || { x: this.checkpointX, y: this.level.groundY };
      const boat = this.objects.find(o => o instanceof E.Boat);
      if (state.spawnOnBoat && boat) {
        pl.x = boat.x + boat.w / 2 + (pl.who === 'boy' ? -24 : 24);
        pl.y = boat.bobY(this.t) - 2;
      } else {
        pl.x = state.x + (pl.who === 'boy' ? -24 : 24);
        pl.y = state.y - 2;
      }
      pl.vx = pl.vy = 0; pl.stun = 0; pl.grounded = false;
    }
    restoreCheckpoint(fromNet, data) {
      if (data) this.captureCheckpoint(data.x, data);
      const state = this.checkpointState || { x: this.checkpointX, y: this.level.groundY, boxes: {} };
      const boat = this.objects.find(o => o instanceof E.Boat);
      if (boat && Number.isFinite(state.boatX)) {
        boat.x = state.boatX; boat.prevX = state.boatX; boat.vx = 0;
      }
      for (const o of this.objects) {
        if (o instanceof E.Box && !o.fixed && state.boxes && state.boxes[o.id]) {
          o.x = state.boxes[o.id].x; o.y = state.boxes[o.id].y; o.vx = o.vy = 0;
        }
      }
      for (const pl of this.players) {
        pl.downed = false; pl.reviveProgress = 0; pl.downedT = 0;
        pl.hp = pl.maxHp; pl.invuln = 2.2; pl.hatEnergy = Math.max(pl.hatEnergy, 65);
        this.respawnAtCheckpoint(pl);
      }
      this.holdingHands = false; this.wipeT = 0;
      if (this.combat) {
        this.combat.projectiles.length = 0; this.combat.skills.length = 0;
        for (const enemy of this.combat.enemies) {
          if (!enemy.dead) { enemy.x = enemy.homeX; enemy.y = enemy.homeY; enemy.attackT = Math.max(enemy.attackT, 2.2); }
        }
      }
      const x = state.spawnOnBoat && boat ? boat.x + boat.w / 2 : state.x;
      const y = state.spawnOnBoat && boat ? boat.bobY(this.t) - 55 : state.y - 75;
      this.spawnAbilityFx('coop_checkpoint-spiral', x, y, 1, 230, 1.35);
      P().burst(x, y, 30, { kind: 'heart', color: '#ff9db5', speed: 140, life: 1.4, size: 5, grav: -45 });
      NLA.audio.sfx('bell'); NLA.ui.toast(NLA.t('checkpointRestored'), 3400);
      if (!fromNet) this.emitEvent('partyRestore', { x: state.x, y: state.y, boatX: state.boatX, spawnOnBoat: state.spawnOnBoat });
    }
    triggerMemory(m) {
      this.levelMemories++;
      this.state = 'memory';
      NLA.audio.sfx('memory');
      this.addLove(NLA.LOVE.memory, m.x, m.y - 140);
      NLA.ui.showMemory(m.idx);
      this.emitEvent('memory', { x: m.x });
    }
    finale() {
      if (this.endingT >= 0) return;
      if (this.combat && !this.combat.finalDefeated()) {
        NLA.ui.toast(NLA.t('bossBlocksExit'), 2800);
        return;
      }
      this.state = 'ending';
      this.cutscene = true;
      this.endingT = 0;
      NLA.audio.sfx('firework');
      NLA.audio.setIntensity(1);
      this.emitEvent('finale', {});
    }

    /* ================= controls ================= */
    getCtrl(pl) {
      const I = NLA.input;
      if (pl.remote) return null;
      if (this.cutscene || pl.downed) return {};
      if (this.mode === 'local') {
        return pl.who === 'boy' ? I.readBoyKeys() : I.readGirlKeys();
      }
      if (this.mode === 'net') {
        return pl.who === this.net.myChar ? I.readMerged() : {};
      }
      /* solo */
      if (pl.who === this.activeChar) return I.readMerged();
      return this.aiCtrl(pl);
    }

    aiCtrl(pl) {
      const leader = pl === this.boy ? this.girl : this.boy;
      const c = { left: false, right: false, jump: false };
      const dx = leader.x - pl.x;
      const wantX = leader.x - Math.sign(dx || 1) * 55;
      pl.aiT = (pl.aiT || 0) + 0.016;
      /* teleport if lost */
      if (Math.abs(dx) > 720 || (pl.aiStuck || 0) > 3) {
        pl.x = leader.x - 40; pl.y = leader.y - 10; pl.vy = 0; pl.aiStuck = 0;
        P().burst(pl.x, pl.y - 30, 10, { kind: 'spark', color: '#ffd7e8', glow: 'pink', speed: 70, life: 0.7, size: 3 });
        return c;
      }
      if (Math.abs(pl.x - wantX) > 26) {
        if (wantX > pl.x) c.right = true; else c.left = true;
        /* stuck detection */
        if (Math.abs(pl.vx) < 12 && pl.grounded) pl.aiStuck = (pl.aiStuck || 0) + 0.016 * 2;
        else pl.aiStuck = 0;
      }
      /* jump if leader is above or wall/gap ahead */
      if (pl.grounded) {
        if (leader.y < pl.y - 70 && Math.abs(dx) < 200) c.jump = true;
        const ahead = pl.x + (c.right ? 46 : c.left ? -46 : 0);
        if ((c.left || c.right) && !this.groundBelow(ahead, pl.y) && this.waterAt(ahead) === null) c.jump = true;
        if ((c.left || c.right) && this.waterAt(ahead) !== null && !this.groundBelow(ahead, pl.y)) {
          /* stop at water unless lotus pad */
          c.left = c.right = false;
        }
        if ((pl.aiStuck || 0) > 0.6) c.jump = true;
      }
      /* auto powers */
      pl.aiPowT = (pl.aiPowT || 0) - 0.016;
      if (pl.aiPowT <= 0) {
        if (pl.who === 'girl') {
          for (const o of this.objects) {
            const lp = this.lightPoint(o);
            if (!lp) continue;
            if (U.dist(pl.x, pl.y - 30, lp.x, lp.y) < C.LIGHT_RANGE - 10) {
              c.pow1 = true; pl.aiPowT = 1.4; break;
            }
          }
          if (!c.pow1) {
            for (const w of this.enemies) {
              if (w instanceof E.Wisp && !w.gone && U.dist(pl.x, pl.y - 30, w.x, w.y) < 120) { c.pow1 = true; pl.aiPowT = 1.4; break; }
            }
          }
        } else {
          /* boy AI: shield when danger near */
          let danger = false;
          for (const w of this.enemies) {
            if (w instanceof E.Wisp && !w.gone && U.dist(pl.x, pl.y - 30, w.x, w.y) < 110) danger = true;
            if (w instanceof E.BirdZone && w.birds.some(b => U.dist(pl.x, pl.y - 30, b.x, b.y) < 200)) danger = true;
          }
          if (this.waveState === 'active') danger = true;
          if (danger && pl.shieldMeter > 1) c.pow2 = true;
        }
      }
      /* solo companion helps in fights and saves a charged Nón Lá strike
         for guardians or groups of nearby spirits. */
      if (this.combat) {
        const threats = this.combat.enemies.filter(e => !e.dead && U.dist(pl.x, pl.y - 30, e.x, e.y) < 300);
        if (threats.length) {
          if (pl.who === 'girl' && pl.cd1 <= 0) c.pow1 = true;
          if (pl.who === 'boy' && pl.cd1 <= 0 && !c.pow2) c.pow1 = true;
          if (pl.hatEnergy >= C.HAT_SPECIAL_COST && (threats.length > 1 || threats.some(e => e.role !== 'mob'))) c.special = true;
        }
      }
      return c;
    }

    groundBelow(x, y) {
      for (const s of this.solids) {
        if (x > s.x && x < s.x + s.w && s.y >= y - 6 && s.y < y + 160) return true;
      }
      return false;
    }

    /* ================= powers ================= */
    lightPoint(o) {
      if (o instanceof E.StoneLantern) return (o.broken || !o.lit) ? { x: o.x, y: o.y - 60 } : null;
      if (o instanceof E.WireLantern) return !o.lit ? o.bob() : null;
      if (o instanceof E.Candle) return !o.lit ? { x: o.x, y: o.y } : null;
      if (o instanceof E.BrokenBridge) return !o.healed ? o.lightTarget() : null;
      if (o instanceof E.Statue) return !o.healed ? { x: o.x, y: o.y - 40 } : null;
      if (o instanceof E.Villager) return !o.lit ? { x: o.x + 42, y: o.y - 76 } : null;
      return null;
    }

    /* every KEY lantern that still needs light — the level's objectives */
    objectiveTargets() {
      const out = [];
      for (const o of this.objects) {
        if (!o.key) continue;
        if (o.lit || (o instanceof E.Statue && o.healed)) continue;
        if (o instanceof E.WireLantern) { const b = o.bob(); out.push({ x: b.x, y: b.y - 18, o }); }
        else if (o instanceof E.Villager) out.push({ x: o.x + 42, y: o.y - 76, o });
        else out.push({ x: o.x, y: (o.y || this.level.groundY) - 60, o });
      }
      return out;
    }

    doPulse(x, y, big, fromNet) {
      const radius = C.LIGHT_RANGE + (big ? 70 : 0);
      this.spawnAbilityFx('light', x, y, 1, big ? 230 : 175, .62);
      NLA.audio.sfx('sparkle');
      /* ring fx */
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * 6.283;
        P().spawn({
          x: x, y: y, vx: Math.cos(a) * radius * 1.6, vy: Math.sin(a) * radius * 1.6,
          life: 0.55, size: 3, kind: 'spark', color: '#ffd7e8', glow: 'pink', drag: 0.9,
        });
      }
      if (fromNet) this._suppress = true;
      for (const o of this.objects) {
        const lp = this.lightPoint(o);
        if (lp && U.dist(x, y, lp.x, lp.y) < radius + 10) o.onLight(this);
      }
      for (const w of this.enemies) {
        if (w instanceof E.Wisp && !w.gone && U.dist(x, y, w.x, w.y) < radius + 24) w.dispel(this);
        if (w instanceof E.BirdZone) w.lightStun(x, y, radius);
      }
      if (this.combat) this.combat.hitCircle(x, y, radius, 10 + NLA.hatRank() * 1.5, this, 'light');
      this._suppress = false;
    }

    doGust(x, y, dir, fromNet) {
      NLA.audio.sfx('wind');
      this.spawnAbilityFx('wind', x + dir * 72, y, dir, 175, .5);
      for (let i = 0; i < 14; i++) {
        P().spawn({
          x: x + dir * 20, y: y - 20 + U.rand(-40, 40),
          vx: dir * U.rand(220, 420), vy: U.rand(-30, 30),
          life: 0.6, size: 4 + Math.random() * 3, kind: 'windline',
        });
      }
      if (fromNet) this._suppress = true;
      const inCone = (px, py) => {
        const dx = (px - x) * dir;
        return dx > -20 && dx < C.GUST_RANGE && Math.abs(py - y) < 150;
      };
      for (const o of this.objects) {
        if (o instanceof E.WireLantern && inCone(o.pos, o.y + o.len)) o.onGust(dir, this);
        else if (o instanceof E.Box && inCone(o.x, o.y - 20)) o.onGust(dir, this);
        else if (o instanceof E.Boat && (inCone(o.x + o.w / 2, o.deckY) || inCone(o.x, o.deckY) || inCone(o.x + o.w, o.deckY))) o.onGust(dir, this);
      }
      for (const w of this.enemies) {
        if (w instanceof E.Wisp && !w.gone && inCone(w.x, w.y)) {
          w.hx += dir * 60; w.retreat = 1;
          w.x += dir * 50;
        }
      }
      if (this.combat) this.combat.hitCone(x, y, dir, C.GUST_RANGE + 30, 155, 8 + NLA.hatRank(), this, 'wind');
      this._suppress = false;
    }

    doLotus(pl, fromNet, spotId) {
      let spot = null;
      if (spotId) spot = this.byId[spotId];
      else {
        let bd = 160;
        for (const o of this.objects) {
          if (o instanceof E.LotusSpot && !o.grown) {
            const d = Math.abs(o.x - pl.x);
            if (d < bd) { bd = d; spot = o; }
          }
        }
      }
      if (spot && !spot.grown) {
        if (fromNet) this._suppress = true;
        spot.grow(this);
        this.spawnAbilityFx('lotus', spot.x, spot.surface - 35, 1, 160, .8);
        this._suppress = false;
        return true;
      }
      return false;
    }

    handlePowers(pl, ctrl, dt) {
      if (!ctrl || pl.downed) return;
      pl.holdingPow1 = !!ctrl.pow1;
      const press1 = ctrl.pow1 && !pl.prevP1;
      const press2 = ctrl.pow2 && !pl.prevP2;
      const pressSpecial = ctrl.special && !pl.prevSpecial;
      pl.prevP1 = !!ctrl.pow1; pl.prevP2 = !!ctrl.pow2; pl.prevSpecial = !!ctrl.special;

      if (pressSpecial && this.combat) {
        if (pl.hatEnergy >= C.HAT_SPECIAL_COST && pl.hatCd <= 0) {
          pl.hatEnergy -= C.HAT_SPECIAL_COST;
          pl.hatCd = .45;
          this.combat.useHatSkill(pl, this, { x: pl.x, y: pl.y - 46, dir: pl.face, rank: NLA.hatRank() }, false);
        } else if ((this.mode !== 'solo' || pl.who === this.activeChar) && !pl.remote) {
          NLA.ui.toast(NLA.t('hatNotReady'), 1400);
        }
      }

      /* near a windmark or big-lantern pedestal, pow1 = channel (handled by objects) */
      const nearMark = this.objects.some(o =>
        (o instanceof E.WindMark && pl.who === 'boy' && Math.abs(pl.x - o.x) < 60) ||
        (o instanceof E.BigLantern && (Math.abs(pl.x - o.pedL) < 50 || Math.abs(pl.x - o.pedR) < 50)));

      if (pl.who === 'boy') {
        if (press1 && !nearMark && pl.cd1 <= 0) {
          pl.cd1 = C.GUST_CD; pl.powerFx = 1;
          this.doGust(pl.x, pl.y - 36, pl.face, false);
          this.emitEvent('gust', { x: pl.x, y: pl.y - 36, dir: pl.face });
        }
        /* shield hold */
        if (ctrl.pow2 && pl.shieldMeter > 0.1) {
          if (!pl.shieldOn) {
            NLA.audio.sfx('shieldOn');
            this.spawnAbilityFx('shield', pl.x, pl.y - 44, 1, this.loveLevel >= 3 ? 190 : 155, .55);
          }
          pl.shieldOn = true;
          pl.shieldMeter = Math.max(0, pl.shieldMeter - dt);
        } else {
          pl.shieldOn = false;
          pl.shieldMeter = Math.min(C.SHIELD_MAX, pl.shieldMeter + C.SHIELD_REGEN * dt);
        }
      } else {
        if (press1 && pl.cd1 <= 0) {
          pl.cd1 = C.LIGHT_CD; pl.powerFx = 1;
          const big = this.loveLevel >= 2 && U.dist(pl.x, pl.y, this.boy.x, this.boy.y) < 220;
          this.doPulse(pl.x, pl.y - 30, big, false);
          this.emitEvent('pulse', { x: pl.x, y: pl.y - 30, big });
        }
        if (press2 && pl.cd2 <= 0) {
          if (this.doLotus(pl, false)) {
            pl.cd2 = C.LOTUS_CD; pl.powerFx = 1;
            this.emitEvent('lotusGrow', { x: pl.x });
          }
        }
      }
    }

    /* ================= hands & love jump ================= */
    updateHands(ctrls) {
      const I = NLA.input;
      const [a, b] = this.players;
      const dist = U.dist(a.x, a.y, b.x, b.y);
      let pressed = false;
      const anyHands = ctrls.some(c => c && c.hands);
      for (let i = 0; i < this.players.length; i++) {
        if (ctrls[i] !== null) this.players[i].rescueHeld = !!(ctrls[i] && ctrls[i].hands);
      }
      if (a.downed || b.downed) {
        this.holdingHands = false;
        this.prevHands = anyHands;
        I.consumeHandsTouch();
        return;
      }
      if (anyHands && !this.prevHands) pressed = true;
      this.prevHands = anyHands;
      if (I.consumeHandsTouch()) pressed = true;

      if (pressed) {
        if (this.holdingHands) {
          this.holdingHands = false;
          this.emitEvent('hands', { on: false });
        } else if (dist < C.HANDS_DIST && a.grounded && b.grounded) {
          this.holdingHands = true;
          NLA.audio.sfx('chime', 3);
          P().burst((a.x + b.x) / 2, a.y - 60, 6, { kind: 'heart', color: '#ff8fae', speed: 50, life: 1, size: 4, grav: -40 });
          this.emitEvent('hands', { on: true });
        }
      }
      if (this.holdingHands && dist > 150) {
        this.holdingHands = false;
        this.emitEvent('hands', { on: false });
      }
      /* love wind jump */
      if (this.holdingHands && this.loveLevel >= 4) {
        const anyJump = ctrls.some(c => c && c.jump);
        if (anyJump && !this.prevLoveJump && a.grounded && b.grounded) {
          for (const p of this.players) {
            if (!p.remote) { p.vy = -1080; p.grounded = false; }
            p.wings = 1.6;
          }
          NLA.audio.sfx('wind'); NLA.audio.sfx('sparkle');
          this.spawnAbilityFx('love-jump', (a.x + b.x) / 2, a.y - 78, 1, 225, 1.05);
          P().burst((a.x + b.x) / 2, a.y, 18, { kind: 'spark', color: '#ffd7e8', glow: 'pink', speed: 140, life: 1, size: 3.5 });
          this.emitEvent('loveJump', {});
        }
        this.prevLoveJump = anyJump;
      } else this.prevLoveJump = false;
    }

    updateRescue(dt, ctrls) {
      if (this.net.active && !this.net.isHost) return;
      const down = this.players.filter(p => p.downed);
      if (down.length === 2) {
        this.wipeT += dt;
        if (this.wipeT >= 1.25) this.restoreCheckpoint(false);
        return;
      }
      this.wipeT = 0;
      if (down.length !== 1) return;
      const fallen = down[0], rescuer = this.players.find(p => p !== fallen);
      const idx = this.players.indexOf(rescuer);
      const held = !!((ctrls[idx] && ctrls[idx].hands) || rescuer.rescueHeld);
      const close = U.dist(fallen.x, fallen.y, rescuer.x, rescuer.y) <= C.REVIVE_DIST;
      if (held && close && !rescuer.downed) {
        fallen.reviveProgress = Math.min(1, fallen.reviveProgress + dt / C.REVIVE_TIME);
        if (Math.random() < dt * 18) P().spawn({
          x: U.rand(Math.min(fallen.x, rescuer.x), Math.max(fallen.x, rescuer.x)),
          y: fallen.y - U.rand(28, 82), vx: U.rand(-15, 15), vy: U.rand(-70, -30),
          life: .8, size: 3, kind: 'heart', color: '#ff9fc4', glow: 'pink', grav: -20,
        });
        if (fallen.reviveProgress >= 1) this.revivePlayer(fallen, rescuer, false);
      } else {
        fallen.reviveProgress = Math.max(0, fallen.reviveProgress - dt * .38);
      }
    }

    revivePlayer(fallen, rescuer, fromNet) {
      if (!fallen) return;
      fallen.downed = false; fallen.reviveProgress = 0; fallen.downedT = 0;
      fallen.hp = Math.max(2, Math.ceil(fallen.maxHp * .5));
      fallen.invuln = 2; fallen.hatEnergy = Math.max(fallen.hatEnergy, 55);
      fallen.vx = 0; fallen.vy = -120;
      if (rescuer) rescuer.invuln = Math.max(rescuer.invuln, 1.2);
      this.addLove(NLA.LOVE.save, fallen.x, fallen.y - 55);
      this.spawnAbilityFx('coop_rescue-hands', (fallen.x + (rescuer ? rescuer.x : fallen.x)) / 2, fallen.y - 52, 1, 180, .95);
      this.spawnAbilityFx('coop_revive-aura', fallen.x, fallen.y - 48, 1, 185, 1.15);
      P().burst(fallen.x, fallen.y - 45, 24, { kind: 'heart', color: '#ff91bd', glow: 'pink', speed: 125, life: 1.2, size: 4, grav: -40 });
      NLA.audio.sfx('loveUp'); NLA.ui.toast(NLA.t('partnerRescued'), 3000);
      if (!fromNet) this.emitEvent('rescue', { who: fallen.who, by: rescuer && rescuer.who, hp: fallen.hp });
    }

    tryLoveBurst(fromRequest) {
      if (this.net.active && !this.net.isHost && !fromRequest) {
        this.net.send({ t: 'ev', k: 'loveBurstRequest', d: {} });
        return;
      }
      const [a, b] = this.players;
      if (a.downed || b.downed) { NLA.ui.toast(NLA.t('loveBurstNeedPartner'), 1800); return; }
      if (this.love < C.LOVE_BURST_COST) { NLA.ui.toast(NLA.t('loveBurstNeedCharge').replace('{LOVE}', Math.ceil(C.LOVE_BURST_COST - this.love)), 1800); return; }
      if (U.dist(a.x, a.y, b.x, b.y) > 290) { NLA.ui.toast(NLA.t('loveBurstTooFar'), 1800); return; }
      if (this.loveBurstCd > 0) return;
      this.love -= C.LOVE_BURST_COST;
      this.loveBurstCd = 2.4;
      this.performLoveBurst(false);
      this.emitEvent('loveBurst', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 48, love: this.love });
    }

    performLoveBurst(fromNet) {
      const [a, b] = this.players;
      const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2 - 48;
      for (const pl of this.players) {
        pl.hp = Math.min(pl.maxHp, pl.hp + 1); pl.invuln = 1.8; pl.powerFx = 2; pl.wings = 1.2;
      }
      this.spawnAbilityFx('coop_love-burst', x, y, 1, 520, 1.15);
      this.spawnAbilityFx('coop_twin-wave', x, y, 1, 650, .9);
      this.spawnAbilityFx('coop_couple-ward', x, y, 1, 300, 1.25);
      for (let i = 0; i < 42; i++) {
        const ang = (i / 42) * Math.PI * 2;
        P().spawn({ x, y, vx: Math.cos(ang) * U.rand(220, 480), vy: Math.sin(ang) * U.rand(180, 360), life: 1.1, size: 4, kind: i % 3 ? 'spark' : 'heart', color: i % 2 ? '#ff9fc7' : '#ffe6a3', glow: 'pink', drag: .91 });
      }
      if ((!this.net.active || this.net.isHost) && this.combat) {
        this.combat.hitCircle(x, y, C.LOVE_BURST_RADIUS, 44 + NLA.hatRank() * 8, this, 'love');
        this.combat.projectiles.length = 0;
      }
      NLA.audio.sfx('loveUp'); NLA.audio.sfx('hatSkill');
      NLA.ui.toast(NLA.t('loveBurstCast'), 3200);
    }

    /* ================= wind waves (lake) ================= */
    updateWaves(dt) {
      const cfg = this.level.windWaves;
      if (!cfg) return;
      this.waveTimer -= dt;
      if (this.waveState === 'idle' && this.waveTimer <= 0) {
        this.waveState = 'warn'; this.waveT = cfg.warn;
        NLA.audio.sfx('wind');
      } else if (this.waveState === 'warn') {
        this.waveT -= dt;
        if (Math.random() < dt * 20) {
          P().spawn({ x: this.cam.x + this.viewW + 40, y: U.rand(this.cam.y + 100, this.cam.y + 600), vx: -500, vy: 0, life: 1, size: 5, kind: 'windline' });
        }
        if (this.waveT <= 0) { this.waveState = 'active'; this.waveT = cfg.dur; NLA.audio.sfx('wind'); }
      } else if (this.waveState === 'active') {
        this.waveT -= dt;
        if (Math.random() < dt * 60) {
          P().spawn({ x: this.cam.x + this.viewW + 40, y: U.rand(this.cam.y + 60, this.cam.y + 660), vx: U.rand(-700, -500), vy: U.rand(-20, 20), life: 1.2, size: 6, kind: 'windline' });
        }
        for (const pl of this.players) {
          if (pl.remote) continue;
          if (!this.shieldCovers(pl.x, pl.y - 30)) pl.vx += cfg.force * dt * (pl.grounded ? 1 : 1.4);
        }
        if (this.waveT <= 0) { this.waveState = 'idle'; this.waveTimer = cfg.period; }
      }
    }

    /* ================= main update ================= */
    update(dt) {
      if (this.state === 'idle') { this.updateMenuScene(dt); return; }
      if (this.paused) return;
      if (this.state === 'memory' || this.state === 'complete') {
        P().update(dt);
        return;
      }
      this.t += dt;
      const I = NLA.input;
      this.loveBurstCd = Math.max(0, this.loveBurstCd - dt);

      if (this.state === 'ending') { this.updateEnding(dt); return; }

      /* swap in solo */
      if (this.mode === 'solo' && I.consumeSwap()) {
        this.activeChar = this.activeChar === 'boy' ? 'girl' : 'boy';
        NLA.audio.sfx('click');
        NLA.ui.updateTouchIcons();
      }
      /* emote */
      const em = I.consumeEmote();
      if (em) {
        const mine = this.mode === 'net' ? this.players.find(p => !p.remote)
          : this.mode === 'solo' ? this.players.find(p => p.who === this.activeChar) : this.boy;
        if (mine) { mine.emote = em; mine.emoteT = 1.6; this.emitEvent('emote', { who: mine.who, n: em }); }
      }

      /* controls & powers */
      const ctrls = this.players.map(pl => this.getCtrl(pl));
      this.players.forEach((pl, i) => { if (!pl.remote) this.handlePowers(pl, ctrls[i], dt); });
      this.updateHands(ctrls);
      this.updateRescue(dt, ctrls);
      if (I.consumeLove()) this.tryLoveBurst(false);
      if (NLA.ui.updateLoveAction) {
        const unavailable = this.players.some(p => p.downed) || U.dist(this.boy.x, this.boy.y, this.girl.x, this.girl.y) > 290;
        NLA.ui.updateLoveAction(this.love, this.love >= C.LOVE_BURST_COST && !unavailable && this.loveBurstCd <= 0, unavailable);
      }
      this.updateWaves(dt);

      /* build dynamic solids */
      this.solids.length = 0;
      for (const solid of this.staticSolids) this.solids.push(solid);
      for (const o of this.objects) {
        if (o.solid) {
          const s = o.solid(this);
          if (s) this.solids.push(s);
        }
      }
      if (this.combat) this.combat.addSolids(this.solids);

      /* carry players on moving platforms (boat & lotus bob) */
      for (const pl of this.players) {
        if (pl.standOn && pl.standOn.boat) {
          const b = pl.standOn.boat;
          pl.x += (b.x - (b.prevX !== undefined ? b.prevX : b.x));
          pl.y = b.bobY(this.t);
        }
      }
      for (const o of this.objects) if (o instanceof E.Boat) o.prevX = o.x;

      /* players */
      this.players.forEach((pl, i) => pl.update(dt, ctrls[i], this));

      /* local separation clamp (keep couple on screen in local/solo) */
      if (this.mode !== 'net') {
        const [a, b] = this.players;
        const maxSep = this.viewW - 160;
        if (Math.abs(a.x - b.x) > maxSep) {
          const lead = a.x > b.x ? a : b;
          const back = lead === a ? b : a;
          if (lead.vx > 0 && lead.x > back.x) lead.x = back.x + maxSep;
          else if (lead.vx < 0 && lead.x < back.x) lead.x = back.x - maxSep + 0;
        }
      }

      /* holding hands: gently pull together */
      if (this.holdingHands) {
        const [a, b] = this.players;
        const d = b.x - a.x;
        if (Math.abs(d) > 60) {
          const pull = (Math.abs(d) - 60) * 3 * dt * Math.sign(d);
          if (!a.remote) a.x += pull;
          if (!b.remote) b.x -= pull;
        }
      }

      /* water splash & respawn (local players) */
      for (const pl of this.players) {
        if (pl.remote || pl.downed) continue;
        const wy = this.waterAt(pl.x);
        if (wy !== null && pl.y > wy + 14 && !pl.grounded) {
          NLA.audio.sfx('splash');
          P().burst(pl.x, wy, 14, { kind: 'spark', color: '#bfe8ff', glow: 'blue', speed: 120, life: 0.7, size: 3, grav: 300 });
          P().burst(pl.x, wy, 6, { kind: 'ripple', color: '#bfe8ff', speed: 10, life: 1.2, size: 10 });
          this.emitEvent('splash', { x: pl.x, y: wy });
          /* respawn */
          const boat = this.objects.find(o => o instanceof E.Boat);
          const segment = this.level.water.find(w => pl.x >= w.x && pl.x <= w.x + w.w);
          const boatMid = boat && boat.x + boat.w / 2;
          if (boat && segment && boatMid >= segment.x - 40 && boatMid <= segment.x + segment.w + 40) {
            pl.x = boat.x + boat.w / 2; pl.y = boat.bobY(this.t) - 2;
          } else {
            this.respawnAtCheckpoint(pl);
          }
          pl.vx = 0; pl.vy = 0; pl.stun = 0.5;
          NLA.ui.toast(NLA.t('fellWater'));
        }
        /* fell below world */
        if (pl.y > this.level.H + 60) {
          this.respawnAtCheckpoint(pl);
        }
      }

      /* objects & enemies */
      for (const o of this.objects) o.update && o.update(dt, this);
      for (const e of this.enemies) e.update(dt, this);
      if (this.combat) this.combat.update(dt, this);
      this.updateAbilityFx(dt);
      for (const c of this.collectibles) c.update(dt, this);

      /* guest: apply gentle correction toward host snapshot */
      if (this.net.active && !this.net.isHost && this._snap) {
        const s = this._snap;
        if (s.boxes) {
          let bi = 0;
          for (const o of this.objects) {
            if (o instanceof E.Box && s.boxes[bi]) {
              o.x = U.lerp(o.x, s.boxes[bi][0], 0.12);
              o.y = U.lerp(o.y, s.boxes[bi][1], 0.12);
              bi++;
            }
          }
        }
        if (s.boat !== undefined) {
          const boat = this.objects.find(o => o instanceof E.Boat);
          if (boat) boat.x = U.lerp(boat.x, s.boat, 0.12);
        }
        if (Array.isArray(s.culture)) {
          for (const id of s.culture.slice(0, 16)) {
            const relic = this.byId[id];
            if (relic instanceof E.CultureRelic && !relic.seen) {
              relic.seen = true;
              this.cultureSeen++;
            }
          }
        }
        if (this.combat && s.combat) this.combat.applySnapshot(s.combat, this);
      }

      /* net sync own player */
      if (this.net.active) {
        const mine = this.players.find(p => !p.remote);
        if (mine) this.net.tickPlayerSync(dt, mine, this);
      }

      /* fog dim on players (slow) unless aura/hands */
      for (const pl of this.players) {
        if (pl.remote) continue;
        let inFog = this.level.fog.some(f => pl.x > f.x && pl.x < f.x + f.w);
        if (inFog) {
          const nearGirl = U.dist(pl.x, pl.y, this.girl.x, this.girl.y) < 170 + this.loveLevel * 30;
          const safe = (this.holdingHands && this.loveLevel >= 1) || nearGirl;
          if (!safe && pl.dim <= 0) pl.dim = 0.4;
        }
      }

      /* ambient particles */
      this.spawnAmbient(dt);

      /* exit check */
      this.checkExit();

      /* tips */
      this.updateTip();

      /* camera */
      this.updateCamera(dt);

      P().update(dt);
    }

    updateMenuScene(dt) {
      this.t += dt;
      P().update(dt);
      if (Math.random() < dt * 2) {
        P().spawn({
          x: Math.random() * this.viewW, y: this.viewH + 20,
          vx: U.rand(-10, 10), vy: U.rand(-40, -15),
          life: 8, size: 2.5, kind: 'firefly',
        });
      }
    }

    spawnAmbient(dt) {
      const th = this.level.theme;
      const cx = this.cam.x;
      if (Math.random() < dt * 1.6) {
        const x = cx + Math.random() * this.viewW;
        if (th === 'street' || th === 'finale' || th === 'temple') {
          P().spawn({ x, y: this.cam.y + this.viewH - U.rand(40, 300), vx: U.rand(-8, 8), vy: U.rand(-30, -12), life: 7, size: 2.2, kind: 'firefly' });
        } else if (th === 'village') {
          P().spawn({ x, y: this.cam.y - 20, vx: U.rand(-30, -60), vy: U.rand(30, 60), life: 6, size: 4, kind: 'leaf', color: '#8fb86a', spin: 2 });
        } else if (th === 'lake') {
          P().spawn({ x, y: this.cam.y - 20, vx: U.rand(-20, -40), vy: U.rand(25, 45), life: 7, size: 4, kind: 'petal', color: '#ffb3c8', spin: 1.5 });
        } else if (th === 'river') {
          P().spawn({ x, y: this.cam.y + this.viewH - U.rand(60, 200), vx: U.rand(-8, 8), vy: U.rand(-20, -8), life: 8, size: 2, kind: 'firefly' });
        }
      }
      if (th === 'temple' && Math.random() < dt * 0.8) {
        P().spawn({ x: cx + Math.random() * this.viewW, y: this.level.groundY - 10, vx: U.rand(-5, 5), vy: -30, life: 4, size: 8, kind: 'smoke', color: '#b8a8c8' });
      }
    }

    checkExit() {
      const ex = this.level.exit;
      if (!ex || this.state !== 'play') return;
      const [a, b] = this.players;
      const inZone = (p) => Math.abs(p.x - ex.x) < 80;
      if (inZone(a) && inZone(b)) {
        if (this.keyLit >= this.level.required && (!this.combat || this.combat.finalDefeated())) {
          this.completeLevel();
        } else if (this.combat && !this.combat.finalDefeated()) {
          if (!this._bossExitTip || this.t - this._bossExitTip > 2.2) {
            this._bossExitTip = this.t;
            NLA.ui.toast(NLA.t('bossBlocksExit'), 1800);
          }
        }
      }
    }

    completeLevel() {
      if (this.state === 'complete') return;
      this.state = 'complete';
      this.celebrating = true;
      NLA.audio.sfx('firework');
      NLA.audio.sfx('loveUp');
      P().burst(this.players[0].x, this.players[0].y - 120, 40, { kind: 'firework', color: '#ffd76b', glow: 'warm', speed: 220, life: 1.6, size: 3, grav: 160 });
      const d = NLA.save.data;
      if (this.levelIdx + 2 > d.unlocked) { d.unlocked = Math.min(NLA.LEVELS.length, this.levelIdx + 2); NLA.save.store(); }
      NLA.ui.showComplete({
        time: (performance.now() - this.levelStartTime) / 1000,
        charms: this.levelCharms,
        love: this.love - this.levelLoveStart,
        memories: this.levelMemories,
        last: this.levelIdx >= NLA.LEVELS.length - 1,
      });
      this.emitEvent('complete', {});
    }

    /* ================= ending cinematic ================= */
    updateEnding(dt) {
      this.endingT += dt;
      const et = this.endingT;
      const big = this.objects.find(o => o instanceof E.BigLantern);
      this.celebrating = true;
      /* wave of light: light everything progressively */
      if (et > 1 && !this._endLit) {
        this._endLit = true;
        for (const o of this.objects) { if (o.lit === false) o.lit = true; if (o.broken) o.broken = false; }
        for (const w of this.enemies) { if (w instanceof E.Wisp) w.gone = true; }
        this.keyLit = this.level.required;
      }
      /* players walk together */
      const [a, b] = this.players;
      for (const p of this.players) {
        const targetX = big.x + (p.who === 'boy' ? -26 : 26);
        p.x = U.lerp(p.x, targetX, dt * 1.2);
        p.face = p.who === 'boy' ? 1 : -1;
        p.walkPhase += dt * 6;
        p.grounded = true;
      }
      if (et > 3) this.holdingHands = true;
      /* fireworks */
      if (et > 2 && Math.random() < dt * 1.4) {
        const fx = this.cam.x + U.rand(100, this.viewW - 100);
        const fy = this.cam.y + U.rand(60, 260);
        NLA.audio.sfx('firework');
        const col = U.pick(['#ffd76b', '#ff8fae', '#8fd0ff', '#a3f0c0', '#e8a1ff']);
        P().burst(fx, fy, 40, { kind: 'firework', color: col, glow: 'warm', speed: 240, life: 1.8, size: 3, grav: 130, drag: 0.96 });
      }
      /* sky lanterns rising */
      if (et > 2.5 && Math.random() < dt * 4) {
        P().spawn({
          x: this.cam.x + Math.random() * this.viewW, y: this.cam.y + this.viewH + 30,
          vx: U.rand(-12, 12), vy: U.rand(-60, -30), life: 12, size: 6,
          kind: 'firefly',
        });
      }
      /* story text */
      if (et > 5 && !this._endStory) {
        this._endStory = true;
        NLA.ui.showEnding();
      }
      P().update(dt);
      this.updateCamera(dt);
      this.t += dt;
    }

    /* ================= net messages ================= */
    onNetMessage(msg) {
      if (msg.t === 'p') {
        const remote = this.players && this.players.find(p => p.remote);
        if (remote) {
          remote.netTarget = msg;
          remote.holdingPow1 = !!msg.pow1;
          remote.rescueHeld = !!msg.rescueHeld;
          if (Math.abs(remote.x - msg.x) > 240) { remote.x = msg.x; remote.y = msg.y; }
        }
      } else if (msg.t === 'ev') {
        this.applyEvent(msg.k, msg.d || {});
      } else if (msg.t === 'snap') {
        this._snap = msg.d;
      } else if (msg.t === 'level') {
        NLA.ui.startLevelFlow(msg.idx, true);
      } else if (msg.t === 'love') {
        this.love = msg.v;
        this.lovePeak = Math.max(this.lovePeak, Number.isFinite(msg.peak) ? msg.peak : this.love);
        this.loveLevel = C.LOVE_LEVELS.filter(th => this.lovePeak >= th).length;
      } else if (msg.t === 'name') {
        this.partnerName = String(msg.v || '').slice(0, 12);
      }
    }

    sendWorldSnapshot() {
      const boxes = [];
      let boat;
      for (const o of this.objects) {
        if (o instanceof E.Box) boxes.push([Math.round(o.x), Math.round(o.y)]);
        if (o instanceof E.Boat) boat = Math.round(o.x);
      }
      const culture = this.objects.filter(o => o instanceof E.CultureRelic && o.seen).map(o => o.id);
      this.net.send({ t: 'snap', d: { boxes, boat, culture, combat: this.combat ? this.combat.snapshot() : null } });
      /* love authoritative from host */
      this.net.send({ t: 'love', v: this.love, peak: this.lovePeak });
    }

    applyEvent(k, d) {
      this._suppress = true;
      const o = d.id !== undefined ? this.byId[d.id] : null;
      try {
        switch (k) {
          case 'lantern':
            if (o && !o.lit) {
              o.lit = true; this.keyLit = this.countKeyLit(); NLA.audio.sfx('lanternLit');
              if (!o.key) this.grantBonusLantern(o);
            }
            break;
          case 'candle': if (o && !o.lit) { o.lit = true; } break;
          case 'heal': if (o) o.broken = false; break;
          case 'gust': this.doGust(d.x, d.y, d.dir, true); break;
          case 'pulse': this.doPulse(d.x, d.y, d.big, true); break;
          case 'lotus': if (o && !o.grown) o.grow(this); break;
          case 'lotusGrow': break; /* covered by 'lotus' */
          case 'wireGust': if (o) { o.slideV += d.dir * 260; o.aVel += d.dir * 2.4; } break;
          case 'ropeOpen': if (o && !o.open) { o.open = true; NLA.audio.sfx('gate'); } break;
          case 'gateOpen': if (o && !o.open) { o.open = true; NLA.audio.sfx('gate'); } break;
          case 'plank': if (o) o.built = true; break;
          case 'bridgeHeal': if (o && !o.healed) { o.healed = true; NLA.audio.sfx('heal'); } break;
          case 'statueHeal': if (o && !o.healed) { o.healed = true; NLA.audio.sfx('heal'); } break;
          case 'checkpoint': {
            this.setCheckpoint(d.x, { boatX: d.boatX });
            const cp = this.objects.find(ob => ob instanceof E.Checkpoint && ob.x === d.x);
            if (cp) cp.done = true;
            break;
          }
          case 'progressCheckpoint': this.captureCheckpoint(d.x, d); break;
          case 'partyRestore': this.restoreCheckpoint(true, d); break;
          case 'rescue': {
            const fallen = this.players.find(p => p.who === d.who);
            const rescuer = this.players.find(p => p.who === d.by);
            if (fallen) this.revivePlayer(fallen, rescuer, true);
            break;
          }
          case 'dispel': if (o && !o.gone) { o.gone = true; NLA.audio.sfx('dispel'); this.bonusCharms(1, o.x, o.y); } break;
          case 'collect': if (o && !o.taken) { o.taken = true; this.onCollect(o); NLA.audio.sfx('chime', 2); } break;
          case 'heartTaken': if (o && !o.taken) { o.taken = true; this.onHeartTaken(o); } break;
          case 'culture': if (o && !o.seen) this.discoverCulture(o, true); break;
          case 'memory': {
            const m = this.objects.find(ob => ob instanceof E.MemoryLantern && ob.x === d.x);
            if (m && !m.seen) { m.seen = true; this.levelMemories++; this.state = 'memory'; NLA.audio.sfx('memory'); NLA.ui.showMemory(m.idx); }
            break;
          }
          case 'hands': this.holdingHands = d.on; break;
          case 'loveJump': {
            for (const p of this.players) { p.wings = 1.6; if (!p.remote && this.holdingHands) { p.vy = -1080; p.grounded = false; } }
            this.spawnAbilityFx('love-jump', (this.boy.x + this.girl.x) / 2, this.boy.y - 78, 1, 225, 1.05);
            break;
          }
          case 'loveBurstRequest': {
            if (this.net.isHost) {
              this._suppress = false;
              this.tryLoveBurst(true);
              this._suppress = true;
            }
            break;
          }
          case 'loveBurst': {
            if (!this.net.isHost) {
              if (Number.isFinite(d.love)) this.love = d.love;
              this.performLoveBurst(true);
            }
            break;
          }
          case 'emote': {
            const pl = this.players.find(p => p.who === d.who);
            if (pl) { pl.emote = d.n; pl.emoteT = 1.6; }
            break;
          }
          case 'splash': P().burst(d.x, d.y, 14, { kind: 'spark', color: '#bfe8ff', glow: 'blue', speed: 120, life: 0.7, size: 3, grav: 300 }); NLA.audio.sfx('splash'); break;
          case 'bird': {
            const zone = this.enemies.find(e => e instanceof E.BirdZone && e.x === d.zx);
            if (zone && !this.net.isHost) zone.birds.push(Object.assign({ t: 0, stunned: 0 }, d.bird));
            break;
          }
          case 'birdHit': case 'dimmed': {
            const pl = this.players.find(p => p.who === d.who);
            if (pl && pl.remote) pl.stun = 0.6;
            break;
          }
          case 'bambooShake': {
            const bb = this.byId[d.id];
            if (bb && bb.state === 'idle') { bb.state = 'shake'; bb.timer = 0.8; }
            break;
          }
          case 'combatCast': if (this.combat) this.combat.applyCast(d, this); break;
          case 'hatSkill': {
            const fighter = this.players.find(p => p.who === d.who);
            if (fighter && this.combat) this.combat.useHatSkill(fighter, this, d, true);
            break;
          }
          case 'combatHit': {
            const hurt = this.players.find(p => p.who === d.who);
            if (hurt) {
              hurt.hp = Number.isFinite(d.hp) ? d.hp : hurt.hp;
              hurt.downed = !!d.downed;
              hurt.reviveProgress = 0;
              hurt.invuln = d.downed ? 0 : 1.15;
              hurt.stun = d.downed ? 0 : .62;
              if (Number.isFinite(d.x)) hurt.x = d.x;
              if (Number.isFinite(d.y)) hurt.y = d.y;
              if (Number.isFinite(d.vx)) hurt.vx = d.vx;
              if (Number.isFinite(d.vy)) hurt.vy = d.vy;
              NLA.audio.sfx('hurt');
            }
            break;
          }
          case 'combatReward': if (this.combat) this.combat.receiveReward(d.id, d.xp, d.role, this); break;
          case 'complete': this.completeLevel(); break;
          case 'finale': this.finale(); break;
        }
      } catch (e) { console.warn('event error', k, e); }
      this._suppress = false;
    }

    /* ================= camera ================= */
    updateCamera(dt) {
      const lv = this.level;
      let tx, ty;
      if (this.state === 'ending') {
        const big = this.objects.find(o => o instanceof E.BigLantern);
        tx = big.x - this.viewW / 2;
        ty = lv.H - this.viewH - 40;
      } else if (this.mode === 'net') {
        const mine = this.players.find(p => !p.remote) || this.players[0];
        const other = this.players.find(p => p.remote);
        let fx = mine.x;
        if (other && Math.abs(other.x - mine.x) < this.viewW * 0.8) fx = mine.x * 0.7 + other.x * 0.3;
        tx = fx - this.viewW / 2;
        ty = Math.min(mine.y, other ? other.y + 200 : 1e9) - this.viewH * 0.62;
      } else {
        const [a, b] = this.players;
        tx = (a.x + b.x) / 2 - this.viewW / 2;
        ty = Math.min(a.y, b.y) - this.viewH * 0.62;
      }
      tx = U.clamp(tx, 0, Math.max(0, lv.W - this.viewW));
      ty = U.clamp(ty, 0, lv.H - this.viewH);
      const k = 1 - Math.pow(0.001, dt);
      this.cam.x += (tx - this.cam.x) * k;
      this.cam.y += (ty - this.cam.y) * k;
    }

    /* ================= tips / prompts ================= */
    updateTip() {
      this.tip = null;
      const local = this.players.filter(p => !p.remote);
      const fallen = this.players.find(p => p.downed);
      if (fallen) {
        const rescuer = this.players.find(p => p !== fallen && !p.downed);
        if (rescuer) {
          const close = U.dist(fallen.x, fallen.y, rescuer.x, rescuer.y) <= C.REVIVE_DIST;
          this.tip = close ? NLA.t('rescuePrompt') : NLA.t('partnerDown');
          return;
        }
      }
      for (const o of this.objects) {
        if (o instanceof E.Sign) {
          for (const pl of local) {
            if (Math.abs(pl.x - o.x) < 150) { this.tip = NLA.t(o.tip); return; }
          }
        }
      }
      /* contextual */
      const [a, b] = this.players;
      if (!this.holdingHands && U.dist(a.x, a.y, b.x, b.y) < C.HANDS_DIST && a.grounded && b.grounded) {
        this.tip = NLA.t('promptHands') + (NLA.input.isTouchDevice ? ' 🤝' : '  [H]');
        return;
      }
      const ex = this.level.exit;
      if (ex) {
        for (const pl of local) {
          if (Math.abs(pl.x - ex.x) < 220) {
            this.tip = this.keyLit >= this.level.required ? NLA.t('exitReady') : NLA.t('exitNeed') + `  (${this.keyLit}/${this.level.required})`;
            return;
          }
        }
      }
    }

    /* =========================================================
       DRAW
       ========================================================= */
    resize(w, h) {
      if (!(w > 1) || !(h > 1)) return;
      this.canvas.width = w;
      this.canvas.height = h;
      this.scale = h / C.VIEW_H;
      this.viewW = w / this.scale;
      this.viewH = C.VIEW_H;
      this.lightCanvas.width = Math.ceil(w * this.lightScale);
      this.lightCanvas.height = Math.ceil(h * this.lightScale);
    }

    draw() {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      ctx.save();
      ctx.scale(this.scale, this.scale);

      if (this.state === 'idle') { this.drawMenuScene(ctx); ctx.restore(); return; }
      const lv = this.level;
      const camX = this.cam.x, camY = this.cam.y;
      const t = this.t;
      const drawLeft = camX - 220, drawRight = camX + this.viewW + 220;
      const inDrawRange = (item) => {
        if (item instanceof E.BirdZone && item.birds.some(b => b.x >= drawLeft && b.x <= drawRight)) return true;
        const x0 = item.x1 !== undefined ? item.x1 : (item.x !== undefined ? item.x : item.pos);
        if (x0 === undefined) return true;
        const x1 = item.x2 !== undefined ? item.x2 : x0 + (item.w || 0);
        return x1 >= drawLeft && x0 <= drawRight;
      };

      /* background */
      NLA.bg.draw(ctx, camX, camY, this.viewW, this.viewH, t, { groundY: lv.groundY });

      ctx.save();
      ctx.translate(-camX, -camY);

      this.drawChapterSetDressing(ctx, drawLeft, drawRight);

      /* water */
      for (const w of lv.water) {
        if (w.x + w.w >= drawLeft && w.x <= drawRight) this.drawWater(ctx, w, t, drawLeft, drawRight);
      }

      /* exit arch (behind) */
      if (lv.exit && lv.exit.x + 120 >= drawLeft && lv.exit.x - 120 <= drawRight) this.drawExit(ctx, lv.exit.x, lv.groundY, t);

      /* platforms */
      for (const p of lv.platforms) {
        if (p.x + p.w >= drawLeft && p.x <= drawRight) this.drawPlatform(ctx, p, t);
      }

      /* objective beacons behind the lanterns they mark */
      this.drawObjectiveBeacons(ctx, t, drawLeft, drawRight);

      /* objects */
      for (const o of this.objects) if (inDrawRange(o)) o.draw && o.draw(ctx, t, this);
      for (const c of this.collectibles) if (inDrawRange(c)) c.draw(ctx, t);

      /* "you can light this now" rings on top of their targets */
      this.drawLightableHighlights(ctx, t, drawLeft, drawRight);

      /* players + hand link */
      if (this.holdingHands) NLA.chars.drawHandLink(ctx, this.players[0], this.players[1], t);
      for (const pl of this.players) pl.draw(ctx, t, this);
      this.drawRescueState(ctx, t);

      /* enemies above players */
      for (const e of this.enemies) if (inDrawRange(e)) e.draw(ctx, t);
      if (this.combat) this.combat.draw(ctx, t, this);
      this.drawAbilityFx(ctx, t);

      /* world particles */
      P().draw(ctx, 0, 0, 0);

      ctx.restore();

      /* lighting / fog overlay */
      this.drawLighting(ctx, camX, camY, t);

      /* vignette */
      this.drawVignette(ctx);

      /* HUD */
      if (this.state !== 'ending') this.drawHUD(ctx, t);
      else this.drawEndingOverlay(ctx);

      ctx.restore();
    }

    drawMenuScene(ctx) {
      /* dreamy title backdrop */
      if (!this._menuBuilt) { NLA.bg.build('menu', 99); this._menuBuilt = true; }
      NLA.bg.draw(ctx, this.t * 12, 220, this.viewW, this.viewH, this.t, { groundY: 840 });
      /* floor glow */
      const g = ctx.createLinearGradient(0, this.viewH - 160, 0, this.viewH);
      g.addColorStop(0, 'rgba(20,10,34,0)');
      g.addColorStop(1, 'rgba(20,10,34,0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(0, this.viewH - 160, this.viewW, 160);
      P().draw(ctx, 0, 0, 0);
      /* the couple, standing together */
      const cx = this.viewW / 2;
      NLA.chars.drawPreview(ctx, 'boy', NLA.costumeFor('boy'), cx - 55, this.viewH - 60, 1.25, this.t);
      NLA.chars.drawPreview(ctx, 'girl', NLA.costumeFor('girl'), cx + 55, this.viewH - 60, 1.25, this.t + 0.4);
    }

    drawWater(ctx, w, t, viewLeft, viewRight) {
      const surface = w.y;
      const bottom = this.level.H;
      const left = Math.max(w.x, viewLeft === undefined ? w.x : viewLeft);
      const right = Math.min(w.x + w.w, viewRight === undefined ? w.x + w.w : viewRight);
      if (right <= left) return;
      const grad = ctx.createLinearGradient(0, surface, 0, bottom);
      const th = this.level.theme;
      const cols = th === 'lake' ? ['#2c2158', '#161033'] : ['#1d3b5e', '#0c1c33'];
      grad.addColorStop(0, cols[0]);
      grad.addColorStop(1, cols[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(left, surface, right - left, bottom - surface);
      /* surface line */
      ctx.strokeStyle = 'rgba(180,220,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const lineStart = Math.floor(left / 24) * 24;
      for (let x = lineStart; x <= right + 24; x += 24) {
        const y = surface + Math.sin(x * 0.05 + t * 2) * 2;
        x === lineStart ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      /* shimmer streaks */
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#cfe8ff';
      const shimmerStep = 137;
      const shimmerOffset = (t * 26) % shimmerStep;
      const firstShimmer = Math.floor((left - w.x - shimmerOffset) / shimmerStep) - 1;
      const lastShimmer = Math.ceil((right - w.x - shimmerOffset) / shimmerStep) + 1;
      for (let i = firstShimmer; i <= lastShimmer; i++) {
        const sx = w.x + i * shimmerStep + shimmerOffset;
        if (sx < w.x || sx > w.x + w.w) continue;
        const mod = ((i % 4) + 4) % 4;
        ctx.fillRect(sx, surface + 18 + mod * 22, 34 + (mod % 3) * 18, 2);
      }
      /* moon glint */
      ctx.globalAlpha = 0.12;
      const mx = this.cam.x + this.viewW * 0.72;
      if (mx > w.x && mx < w.x + w.w) {
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(mx - 30 + Math.sin(t * 1.5 + i) * 12, surface + 12 + i * 16, 60 - i * 6, 2.5);
        }
      }
      ctx.restore();
    }

    drawChapterSetDressing(ctx, drawLeft, drawRight) {
      const props = CHAPTER_PROPS[this.levelIdx] || [];
      for (const p of props) {
        if (p.x + p.w / 2 < drawLeft || p.x - p.w / 2 > drawRight) continue;
        NLA.draw.alphaSprite(ctx, 'prop_' + p.key, p.x, this.level.groundY - p.h / 2 + 8, p.w, p.h, .78, 0, p.flip);
      }
    }

    drawRescueState(ctx, t) {
      for (const pl of this.players) {
        if (!pl.downed) continue;
        NLA.draw.artSprite(ctx, 'coop_revive-aura', pl.x, pl.y - 42, 150, 150, .54 + Math.sin(t * 3) * .12, t * .13);
        ctx.save();
        ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255,255,255,.18)';
        ctx.beginPath(); ctx.arc(pl.x, pl.y - 104, 23, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ff9fc7';
        ctx.beginPath(); ctx.arc(pl.x, pl.y - 104, 23, -Math.PI / 2, -Math.PI / 2 + pl.reviveProgress * Math.PI * 2); ctx.stroke();
        const rescuing = pl.reviveProgress > 0;
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff2d2';
        ctx.fillText(NLA.t(rescuing ? 'reviving' : 'rescuePrompt'), pl.x, pl.y - 134);
        ctx.restore();
      }
    }

    drawPlatform(ctx, p, t) {
      const th = THEME_GROUND[this.level.theme] || THEME_GROUND.street;
      if (p.type === 'crate') {
        ctx.fillStyle = '#8a6238';
        NLA.draw.rr(ctx, p.x, p.y, p.w, p.h, 3); ctx.fill();
        ctx.strokeStyle = '#5d3f22'; ctx.lineWidth = 2;
        ctx.strokeRect(p.x + 3, p.y + 3, p.w - 6, p.h - 6);
        return;
      }
      if (p.type === 'wood' || p.type === 'bamboo') {
        const col = p.type === 'bamboo' ? '#7da84f' : '#8a6844';
        ctx.fillStyle = col;
        NLA.draw.rr(ctx, p.x, p.y, p.w, Math.max(10, p.h), 4); ctx.fill();
        ctx.strokeStyle = 'rgba(40,26,16,0.4)';
        ctx.lineWidth = 1.5;
        for (let x = p.x + 14; x < p.x + p.w - 6; x += 26) {
          ctx.beginPath(); ctx.moveTo(x, p.y + 1); ctx.lineTo(x, p.y + Math.max(10, p.h) - 2); ctx.stroke();
        }
        /* support posts if dock (tall) */
        if (p.h > 100) {
          ctx.fillStyle = 'rgba(70,48,28,0.9)';
          for (let x = p.x + 30; x < p.x + p.w; x += 110) {
            ctx.fillRect(x, p.y, 12, p.h);
          }
          ctx.fillStyle = '#6b4c30';
          ctx.fillRect(p.x, p.y, p.w, 16);
        }
        return;
      }
      /* ground / stone */
      ctx.fillStyle = th.base;
      ctx.fillRect(p.x, p.y, p.w, p.h + 200);
      ctx.fillStyle = th.top;
      ctx.fillRect(p.x, p.y, p.w, 12);
      /* flagstone / texture marks (deterministic) */
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.5;
      const step = 64;
      for (let x = Math.floor(p.x / step) * step; x < p.x + p.w; x += step) {
        if (x < p.x) continue;
        ctx.beginPath();
        ctx.moveTo(x + (x % 128 ? 12 : 34), p.y + 13);
        ctx.lineTo(x + (x % 128 ? 20 : 26), p.y + 34);
        ctx.stroke();
      }
      /* grass tufts for village */
      if (this.level.theme === 'village') {
        ctx.strokeStyle = '#79a052';
        ctx.lineWidth = 2;
        for (let x = Math.floor(p.x / 48) * 48; x < p.x + p.w; x += 48) {
          if (x < p.x + 6) continue;
          ctx.beginPath();
          ctx.moveTo(x, p.y + 2); ctx.quadraticCurveTo(x + 3, p.y - 8, x + 6, p.y - 10);
          ctx.moveTo(x + 4, p.y + 2); ctx.quadraticCurveTo(x + 5, p.y - 6, x + 10, p.y - 7);
          ctx.stroke();
        }
      }
    }

    /* golden light pillars over every key lantern that still needs light —
       the player should never wonder where to go next */
    drawObjectiveBeacons(ctx, t, drawLeft, drawRight) {
      if (this.state !== 'play' || this.cutscene) return;
      for (const m of this.objectiveTargets()) {
        if (m.x < drawLeft - 80 || m.x > drawRight + 80) continue;
        const pulse = 0.5 + Math.sin(t * 2.2 + m.x * 0.01) * 0.22;
        /* sky beam */
        const top = Math.max(this.cam.y - 40, m.y - 620);
        const grad = ctx.createLinearGradient(0, top, 0, m.y);
        grad.addColorStop(0, 'rgba(255,214,120,0)');
        grad.addColorStop(0.55, `rgba(255,214,120,${0.05 + pulse * 0.05})`);
        grad.addColorStop(1, `rgba(255,224,150,${0.13 + pulse * 0.1})`);
        ctx.fillStyle = grad;
        const w = 46 + pulse * 8;
        ctx.beginPath();
        ctx.moveTo(m.x - w * 0.28, top);
        ctx.lineTo(m.x + w * 0.28, top);
        ctx.lineTo(m.x + w * 0.5, m.y);
        ctx.lineTo(m.x - w * 0.5, m.y);
        ctx.fill();
        /* base glow + slow halo ring */
        NLA.draw.glow(ctx, 'warm', m.x, m.y, 46 + pulse * 14, 0.28 + pulse * 0.18);
        ctx.strokeStyle = `rgba(255,220,150,${0.35 + pulse * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 26 + Math.sin(t * 2.2) * 4, 0, 6.283);
        ctx.stroke();
        /* bobbing golden chevron high above, readable from far away */
        const ay = m.y - 128 + Math.sin(t * 3) * 7;
        ctx.fillStyle = 'rgba(255,224,150,0.95)';
        ctx.beginPath();
        ctx.moveTo(m.x, ay + 12);
        ctx.lineTo(m.x - 11, ay);
        ctx.lineTo(m.x - 4, ay);
        ctx.lineTo(m.x - 4, ay - 8);
        ctx.lineTo(m.x + 4, ay - 8);
        ctx.lineTo(m.x + 4, ay);
        ctx.lineTo(m.x + 11, ay);
        ctx.closePath();
        ctx.fill();
        NLA.draw.lantern(ctx, m.x, ay - 42, 20, 24, '#e8a13c', true, t);
        /* rising motes */
        if (Math.random() < 0.09) {
          P().spawn({ x: m.x + U.rand(-16, 16), y: m.y + U.rand(-6, 6), vx: 0, vy: U.rand(-46, -26), life: 1.3, size: 2.2, kind: 'spark', color: '#ffe9a3', glow: 'warm' });
        }
      }
    }

    /* bright ring when the girl is close enough to light something RIGHT NOW */
    drawLightableHighlights(ctx, t, drawLeft, drawRight) {
      if (this.state !== 'play' || this.cutscene || !this.girl) return;
      const gx = this.girl.x, gy = this.girl.y - 30;
      for (const o of this.objects) {
        const lp = this.lightPoint(o);
        if (!lp || lp.x < drawLeft - 40 || lp.x > drawRight + 40) continue;
        if (U.dist(gx, gy, lp.x, lp.y) > C.LIGHT_RANGE + 5) continue;
        const ring = 20 + Math.sin(t * 5) * 3.5;
        ctx.strokeStyle = 'rgba(255,246,214,0.9)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 6]);
        ctx.lineDashOffset = -t * 26;
        ctx.beginPath();
        ctx.arc(lp.x, lp.y, ring, 0, 6.283);
        ctx.stroke();
        ctx.setLineDash([]);
        NLA.draw.sparkle(ctx, lp.x + ring * 0.85, lp.y - ring * 0.85, 5, '#fff2c0', 0.9, t * 2);
      }
    }

    drawExit(ctx, x, gy, t) {
      const ready = this.keyLit >= this.level.required && (!this.combat || this.combat.finalDefeated());
      ctx.save();
      /* festival arch */
      ctx.strokeStyle = '#8e2f31';
      ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 80, gy);
      ctx.lineTo(x - 80, gy - 180);
      ctx.moveTo(x + 80, gy);
      ctx.lineTo(x + 80, gy - 180);
      ctx.stroke();
      ctx.fillStyle = '#b2453c';
      ctx.beginPath();
      ctx.moveTo(x - 106, gy - 172);
      ctx.quadraticCurveTo(x, gy - 216, x + 106, gy - 172);
      ctx.lineTo(x + 100, gy - 154);
      ctx.quadraticCurveTo(x, gy - 196, x - 100, gy - 154);
      ctx.fill();
      ctx.fillStyle = '#c99a3a';
      ctx.fillRect(x - 84, gy - 186, 168, 7);
      /* hanging lanterns on arch */
      for (const s of [-46, 0, 46]) {
        const sway = Math.sin(t * 1.6 + s) * 3;
        NLA.draw.lantern(ctx, x + s + sway, gy - 152, 22, 26, s === 0 ? '#e8a13c' : '#d8556a', ready, t + s);
      }
      if (ready) NLA.draw.glow(ctx, 'warm', x, gy - 120, 130, 0.35 + Math.sin(t * 2) * 0.1);
      ctx.restore();
    }

    /* darkness + light holes */
    drawLighting(ctx, camX, camY, t) {
      const lv = this.level;
      const hasFog = lv.fog.length > 0 || lv.dark;
      /* global evening tint always; heavy dark only when needed */
      if (!hasFog) {
        /* soft warm grade */
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(235,220,255,0.92)';
        ctx.fillRect(0, 0, this.viewW, this.viewH);
        ctx.restore();
        return;
      }
      const lc = this.lightCanvas;
      const g = this.lightCtx;
      const s = lc.width / this.viewW; /* light canvas scale */
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.clearRect(0, 0, lc.width, lc.height);
      const endBright = this.state === 'ending' ? Math.min(1, this.endingT / 2) : 0;
      /* The finale should feel storm-dark without hiding its bamboo festival
         scenery or platform silhouettes on phone screens. */
      const darkA = lv.dark ? 0.68 * (1 - endBright) : 0.75;
      if (lv.dark) {
        g.fillStyle = `rgba(8,5,20,${darkA})`;
        g.fillRect(0, 0, lc.width, lc.height);
      } else {
        for (const f of lv.fog) {
          const x0 = (f.x - camX) * s / 1, x1 = (f.x + f.w - camX) * s;
          const grad = g.createLinearGradient(x0 - 80 * s, 0, x0 + 60 * s, 0);
          grad.addColorStop(0, 'rgba(10,6,24,0)');
          grad.addColorStop(1, `rgba(10,6,24,${darkA})`);
          g.fillStyle = grad;
          g.fillRect(x0 - 80 * s, 0, 140 * s, lc.height);
          const grad2 = g.createLinearGradient(x1 - 60 * s, 0, x1 + 80 * s, 0);
          grad2.addColorStop(0, `rgba(10,6,24,${darkA})`);
          grad2.addColorStop(1, 'rgba(10,6,24,0)');
          g.fillStyle = grad2;
          g.fillRect(x1 - 60 * s, 0, 140 * s, lc.height);
          g.fillStyle = `rgba(10,6,24,${darkA})`;
          g.fillRect(x0 + 60 * s, 0, (x1 - x0) - 120 * s, lc.height);
        }
      }
      /* cut holes for lights */
      g.globalCompositeOperation = 'destination-out';
      const hole = (wx, wy, r, a) => {
        const x = (wx - camX) * s, y = (wy - camY) * s, rr = r * s;
        if (x < -rr || x > lc.width + rr) return;
        g.globalAlpha = a === undefined ? 1 : a;
        g.drawImage(this.lightHole, x - rr, y - rr, rr * 2, rr * 2);
      };
      /* girl aura */
      const auraR = 150 + this.loveLevel * 34 + Math.sin(t * 2.4) * 6;
      hole(this.girl.x, this.girl.y - 40, auraR);
      hole(this.boy.x, this.boy.y - 40, this.holdingHands ? auraR * 0.9 : 92);
      /* lit objects */
      for (const o of this.objects) {
        if (o.lit) {
          const p = o.bob ? o.bob() : { x: o.x + (o instanceof E.Villager ? 42 : 0), y: (o.y || 840) - 60 };
          hole(p.x, p.y, 130);
        }
        if (o instanceof E.MemoryLantern && (o.seen || o.chargeT > 0.3)) hole(o.x + 34, o.y - 132, 150);
        if (o instanceof E.BigLantern) hole(o.x, o.y - 190, 140 + o.progress * 260 + endBright * 900);
        if (o instanceof E.Sign) hole(o.x, o.y - 60, 80, 0.7);
      }
      for (const pt of P().list) {
        if (pt.kind === 'firefly') hole(pt.x, pt.y, 34, 0.5);
      }
      if (this.combat) {
        for (const skill of this.combat.skills) hole(skill.x, skill.y, 100 + skill.rank * 8, .9);
        for (const magic of this.combat.projectiles.slice(-24)) hole(magic.x, magic.y, 42, .45);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      ctx.drawImage(lc, 0, 0, lc.width, lc.height, 0, 0, this.viewW, this.viewH);
    }

    drawVignette(ctx) {
      const grad = ctx.createRadialGradient(this.viewW / 2, this.viewH / 2, this.viewH * 0.42, this.viewW / 2, this.viewH / 2, this.viewH * 0.95);
      grad.addColorStop(0, 'rgba(16,8,30,0)');
      grad.addColorStop(1, 'rgba(16,8,30,0.42)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }

    /* ================= HUD ================= */
    drawHUD(ctx, t) {
      const vw = this.viewW;
      ctx.save();
      ctx.textAlign = 'left';

      /* --- boy icon (top-left) --- */
      this.drawCharIcon(ctx, 24, 20, this.boy, '#4ea3d8', t);
      for (let i = 0; i < this.boy.maxHp; i++) NLA.draw.heart(ctx, 92 + i * 18, 27, 5.4, i < this.boy.hp ? '#6ecbff' : 'rgba(255,255,255,.18)', 1);
      /* shield meter */
      ctx.fillStyle = 'rgba(20,14,36,0.55)';
      NLA.draw.rr(ctx, 84, 40, 90, 9, 4); ctx.fill();
      ctx.fillStyle = '#7fd8d3';
      NLA.draw.rr(ctx, 86, 42, 86 * (this.boy.shieldMeter / C.SHIELD_MAX), 5, 2); ctx.fill();
      NLA.draw.artSprite(ctx, 'ui_shield', 181, 44, 27, 27, .72);

      /* --- girl icon (top-right) --- */
      this.drawCharIcon(ctx, vw - 80, 20, this.girl, '#ff9db5', t);
      for (let i = 0; i < this.girl.maxHp; i++) NLA.draw.heart(ctx, vw - 164 + i * 18, 27, 5.4, i < this.girl.hp ? '#ff8fb3' : 'rgba(255,255,255,.18)', 1);
      ctx.fillStyle = 'rgba(20,14,36,0.55)';
      NLA.draw.rr(ctx, vw - 174, 40, 84, 9, 4); ctx.fill();
      ctx.fillStyle = '#ffd7e8';
      NLA.draw.rr(ctx, vw - 172, 42, 80 * (1 - this.girl.cd1 / C.LIGHT_CD > 1 ? 1 : Math.max(0, 1 - this.girl.cd1 / C.LIGHT_CD)), 5, 2); ctx.fill();

      /* --- love meter (top-center) — a glowing lantern that fills --- */
      const lx = vw / 2, ly = 18;
      const pct = this.love / C.LOVE_MAX;
      ctx.save();
      NLA.draw.artSprite(ctx, 'ui_love', lx, ly + 25, 80, 80, .42 + pct * .35, 0);
      NLA.draw.glow(ctx, 'pink', lx, ly + 26, 40 + pct * 26, 0.3 + pct * 0.4);
      /* lantern outline */
      ctx.strokeStyle = '#f2c17e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(lx, ly + 26, 22, 26, 0, 0, 6.283);
      ctx.stroke();
      /* fill from bottom */
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(lx, ly + 26, 20, 24, 0, 0, 6.283);
      ctx.clip();
      const fh = 48 * pct;
      const fillGrad = ctx.createLinearGradient(0, ly + 50 - fh, 0, ly + 50);
      fillGrad.addColorStop(0, '#ff9db5');
      fillGrad.addColorStop(1, '#e8543c');
      ctx.fillStyle = fillGrad;
      ctx.fillRect(lx - 22, ly + 50 - fh, 44, fh);
      /* bubbles */
      if (pct > 0.05) {
        ctx.fillStyle = 'rgba(255,230,240,0.5)';
        const bt = (t * 30) % 48;
        ctx.beginPath(); ctx.arc(lx - 6, ly + 50 - bt * pct, 2, 0, 6.283); ctx.fill();
      }
      ctx.restore();
      /* caps */
      ctx.fillStyle = '#caa24d';
      NLA.draw.rr(ctx, lx - 9, ly - 4, 18, 6, 2); ctx.fill();
      NLA.draw.rr(ctx, lx - 7, ly + 50, 14, 5, 2); ctx.fill();
      /* heart on top */
      NLA.draw.heart(ctx, lx, ly - 9, 6 + Math.sin(t * 3) * 1.2, '#ff6b93', 1);
      /* level pips */
      for (let i = 0; i < 5; i++) {
        const px = lx - 36 + i * 18;
        ctx.fillStyle = i < this.loveLevel ? '#ff8fae' : 'rgba(255,255,255,0.22)';
        ctx.beginPath(); ctx.arc(px, ly + 64, 3.4, 0, 6.283); ctx.fill();
      }
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = this.love >= C.LOVE_BURST_COST ? '#fff0a8' : 'rgba(255,235,220,.66)';
      ctx.fillText(this.love >= C.LOVE_BURST_COST ? NLA.t('loveReady') : `${Math.floor(this.love)}/${C.LOVE_BURST_COST}`, lx, ly + 77);
      ctx.restore();

      /* --- key lantern counter (under love meter) --- */
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9b3';
      ctx.fillText(`🏮 ${this.keyLit} / ${this.level.required}`, lx, ly + 88);
      NLA.draw.artSprite(ctx, 'ui_quest', lx - 68, ly + 83, 30, 30, .68);

      /* --- edge arrow toward the nearest off-screen key lantern --- */
      if (this.state === 'play' && !this.cutscene) {
        const mine = this.players.find(p => !p.remote) || this.players[0];
        let best = null, bd = Infinity;
        for (const m of this.objectiveTargets()) {
          const d = Math.abs(m.x - mine.x);
          if (d < bd) { bd = d; best = m; }
        }
        if (best) {
          const sx = best.x - this.cam.x;
          const off = sx < -30 ? -1 : (sx > vw + 30 ? 1 : 0);
          if (off !== 0) {
            const ex = off < 0 ? 22 : vw - 22;
            const eyy = 150 + Math.sin(t * 3) * 5;
            ctx.save();
            ctx.fillStyle = 'rgba(24,12,40,0.8)';
            NLA.draw.rr(ctx, ex - (off < 0 ? 0 : 96), eyy - 20, 96, 40, 12); ctx.fill();
            ctx.strokeStyle = 'rgba(255,214,120,0.75)'; ctx.lineWidth = 1.5;
            NLA.draw.rr(ctx, ex - (off < 0 ? 0 : 96), eyy - 20, 96, 40, 12); ctx.stroke();
            const tx = ex + (off < 0 ? 48 : -48);
            ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
            ctx.fillStyle = '#ffe9b3';
            ctx.fillText(`${off < 0 ? '◀' : ''} 🏮 ${Math.max(1, Math.round(bd / 100))} ${off > 0 ? '▶' : ''}`, tx, eyy + 5);
            ctx.restore();
          }
        }
      }

      /* --- charms (bottom-left) --- */
      ctx.textAlign = 'left';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = 'rgba(20,14,36,0.5)';
      NLA.draw.rr(ctx, 18, this.viewH - 44, 96, 30, 15); ctx.fill();
      ctx.fillStyle = '#ffd76b';
      ctx.fillText(`✨ ${this.levelCharms}`, 34, this.viewH - 23);

      if (this.pickupNotice) {
        const n = this.pickupNotice;
        ctx.save();
        ctx.globalAlpha = U.clamp(n.life * 1.4, 0, 1);
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
        const nw = Math.min(300, ctx.measureText(n.text).width + 26);
        ctx.fillStyle = 'rgba(10,8,28,.82)';
        NLA.draw.rr(ctx, 18, this.viewH - 82, nw, 27, 7); ctx.fill();
        ctx.strokeStyle = n.color; ctx.lineWidth = 1;
        NLA.draw.rr(ctx, 18, this.viewH - 82, nw, 27, 7); ctx.stroke();
        ctx.fillStyle = n.color; ctx.fillText(n.text, 30, this.viewH - 64);
        ctx.restore();
      }

      /* optional cultural discovery quest */
      if (this.cultureTotal > 0) {
        ctx.fillStyle = 'rgba(20,14,36,0.5)';
        NLA.draw.rr(ctx, 122, this.viewH - 44, 94, 30, 15); ctx.fill();
        ctx.fillStyle = this.cultureSeen >= this.cultureTotal ? '#aee59a' : '#f5cf77';
        ctx.fillText(`🌾 ${this.cultureSeen}/${this.cultureTotal}`, 137, this.viewH - 23);
      }

      /* --- tip prompt (bottom-center) --- */
      if (this.tip) {
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        const w = ctx.measureText(this.tip).width + 36;
        ctx.fillStyle = 'rgba(24,12,40,0.78)';
        NLA.draw.rr(ctx, vw / 2 - w / 2, this.viewH - 58, w, 34, 17);
        ctx.fill();
        ctx.strokeStyle = 'rgba(245,201,107,0.5)';
        ctx.lineWidth = 1.5;
        NLA.draw.rr(ctx, vw / 2 - w / 2, this.viewH - 58, w, 34, 17);
        ctx.stroke();
        ctx.fillStyle = '#ffedc8';
        ctx.fillText(this.tip, vw / 2, this.viewH - 36);
      }

      /* --- net indicator --- */
      if (this.net.active) {
        ctx.textAlign = 'right';
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#8fe8a3';
        ctx.fillText('💞 online', vw - 16, this.viewH - 16);
      }
      if (this.combat) this.combat.drawHUD(ctx, t, this);
      ctx.restore();
    }

    drawCharIcon(ctx, x, y, pl, ringColor, t) {
      ctx.save();
      /* ring with cooldown */
      ctx.fillStyle = 'rgba(20,14,36,0.55)';
      ctx.beginPath(); ctx.arc(x + 28, y + 28, 30, 0, 6.283); ctx.fill();
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 3;
      const cdFrac = pl.who === 'boy' ? 1 - pl.cd1 / C.GUST_CD : 1 - pl.cd1 / C.LIGHT_CD;
      ctx.beginPath();
      ctx.arc(x + 28, y + 28, 30, -Math.PI / 2, -Math.PI / 2 + U.clamp(cdFrac, 0, 1) * 6.283);
      ctx.stroke();
      /* integrated production character-sheet portrait */
      ctx.beginPath(); ctx.arc(x + 28, y + 28, 25, 0, 6.283); ctx.clip();
      const portrait = NLA.art && NLA.art.get(pl.who === 'boy' ? 'portraitBoySheet' : 'portraitGirlSheet');
      if (portrait) ctx.drawImage(portrait, x + 3, y + 3, 50, 50);
      else {
        ctx.fillStyle = '#ffe6ce'; ctx.beginPath(); ctx.arc(x + 28, y + 32, 16, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#241a18'; ctx.beginPath(); ctx.arc(x + 28, y + 27, 15, Math.PI, 0); ctx.fill();
        NLA.draw.nonLa(ctx, x + 28, y + 20, 34, 0, pl.who === 'boy' ? 'blue' : 'pink', pl.powerFx * 0.6, t);
        ctx.fillStyle = '#33222a'; ctx.beginPath(); ctx.arc(x + 23, y + 33, 1.8, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 33, y + 33, 1.8, 0, 6.283); ctx.fill();
      }
      ctx.restore();
      /* active char marker (solo) */
      if (this.mode === 'solo' && this.activeChar === pl.who) {
        ctx.strokeStyle = '#ffe9a3';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x + 28, y + 28, 34, 0, 6.283); ctx.stroke();
      }
      /* dim/stun indicator */
      if (pl.dim > 0) {
        ctx.fillStyle = 'rgba(90,70,120,0.6)';
        ctx.beginPath(); ctx.arc(x + 28, y + 28, 25, 0, 6.283); ctx.fill();
      }
      if (pl.downed) {
        ctx.fillStyle = 'rgba(38,8,35,.68)'; ctx.beginPath(); ctx.arc(x + 28, y + 28, 25, 0, 6.283); ctx.fill();
        NLA.draw.artSprite(ctx, 'ui_rescue', x + 28, y + 28, 42, 42, .9);
      }
    }

    drawEndingOverlay(ctx) {
      const et = this.endingT;
      /* white flash at the start */
      if (et < 1.2) {
        ctx.fillStyle = `rgba(255,244,214,${Math.max(0, 0.9 - et * 0.75)})`;
        ctx.fillRect(0, 0, this.viewW, this.viewH);
      }
    }
  }

  NLA.Game = Game;
})();

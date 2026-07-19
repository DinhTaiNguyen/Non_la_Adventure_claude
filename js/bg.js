/* =====================================================================
   bg.js — parallax background builder. Each theme prerenders 2-3 tile
   canvases (repeated horizontally) + sky gradient + moon & stars.
   ===================================================================== */
(function () {
  const TILE_W = 1600, TILE_H = 620;
  const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const TILE_RASTER_SCALE = coarsePointer ? 0.75 : 1;

  const THEMES = {
    street: { skyTop: '#241340', skyMid: '#4a2560', skyBot: '#c86a4a', moon: 0.6, stars: 0.7 },
    river:  { skyTop: '#0c1533', skyMid: '#1d2f5e', skyBot: '#3f5c96', moon: 1.0, stars: 1.0 },
    village:{ skyTop: '#1c2a4a', skyMid: '#3f5677', skyBot: '#d8875f', moon: 0.5, stars: 0.6 },
    lake:   { skyTop: '#170f38', skyMid: '#33206b', skyBot: '#6a4a9e', moon: 1.4, stars: 1.0 },
    temple: { skyTop: '#1c0f14', skyMid: '#341a20', skyBot: '#5e2f28', moon: 0, stars: 0.2 },
    finale: { skyTop: '#0a0716', skyMid: '#171030', skyBot: '#2c1f46', moon: 0.9, stars: 1.0 },
    menu:   { skyTop: '#241340', skyMid: '#4a2560', skyBot: '#c86a4a', moon: 0.8, stars: 0.9 },
  };

  /* --------------- painters --------------- */

  function paintRoofline(g, rnd, baseY, color) {
    /* distant silhouette of tiled roofs & a pagoda */
    let x = 0;
    g.fillStyle = color;
    while (x < TILE_W) {
      const w = 90 + rnd() * 160, h = 40 + rnd() * 70;
      g.beginPath();
      g.moveTo(x, baseY);
      g.lineTo(x, baseY - h);
      /* curved roof */
      g.quadraticCurveTo(x + w * 0.1, baseY - h - 14, x + w * 0.5, baseY - h - 8);
      g.quadraticCurveTo(x + w * 0.9, baseY - h - 14, x + w, baseY - h);
      g.lineTo(x + w, baseY);
      g.fill();
      if (rnd() < 0.2) { /* pagoda tower */
        const tw = 46;
        for (let i = 0; i < 3; i++) {
          const ty = baseY - h - 12 - i * 22, twi = tw - i * 10;
          g.beginPath();
          g.moveTo(x + w * 0.5 - twi / 2 - 8, ty);
          g.quadraticCurveTo(x + w * 0.5, ty - 14, x + w * 0.5 + twi / 2 + 8, ty);
          g.lineTo(x + w * 0.5 + twi / 2 - 4, ty - 18);
          g.lineTo(x + w * 0.5 - twi / 2 + 4, ty - 18);
          g.fill();
        }
      }
      x += w + rnd() * 30;
    }
  }

  function paintMountains(g, rnd, baseY, color, amp) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, baseY);
    let x = 0, y = baseY - amp * (0.4 + rnd() * 0.6);
    g.lineTo(0, y);
    while (x < TILE_W) {
      const nx = x + 130 + rnd() * 200;
      const ny = baseY - amp * (0.25 + rnd() * 0.75);
      g.quadraticCurveTo((x + nx) / 2, Math.min(y, ny) - 26 - rnd() * 40, nx, ny);
      x = nx; y = ny;
    }
    g.lineTo(TILE_W, baseY);
    g.fill();
  }

  function paintHouse(g, rnd, x, baseY, w, h, wall, roof, lit) {
    /* Hội An shop house */
    g.fillStyle = wall;
    g.fillRect(x, baseY - h, w, h);
    /* roof */
    g.fillStyle = roof;
    g.beginPath();
    g.moveTo(x - 10, baseY - h);
    g.quadraticCurveTo(x + w * 0.5, baseY - h - 26 - w * 0.06, x + w + 10, baseY - h);
    g.lineTo(x + w + 10, baseY - h + 8);
    g.quadraticCurveTo(x + w * 0.5, baseY - h - 14 - w * 0.06, x - 10, baseY - h + 8);
    g.fill();
    /* windows / doors */
    const rows = h > 120 ? 2 : 1;
    for (let r = 0; r < rows; r++) {
      const wy = baseY - h + 22 + r * 58;
      for (let wx = x + 14; wx < x + w - 26; wx += 42) {
        g.fillStyle = lit && rnd() < 0.55 ? 'rgba(255,200,110,0.85)' : 'rgba(40,26,32,0.75)';
        g.fillRect(wx, wy, 20, 26);
        g.strokeStyle = 'rgba(70,45,30,0.8)';
        g.lineWidth = 2;
        g.strokeRect(wx, wy, 20, 26);
      }
    }
    /* balcony line */
    if (rows > 1) {
      g.strokeStyle = 'rgba(70,45,30,0.9)';
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(x, baseY - h + 54); g.lineTo(x + w, baseY - h + 54); g.stroke();
    }
  }

  function paintLanternString(g, rnd, x1, x2, y, colors, lit) {
    g.strokeStyle = 'rgba(30,20,26,0.8)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x1, y);
    g.quadraticCurveTo((x1 + x2) / 2, y + 26, x2, y);
    g.stroke();
    const n = Math.floor((x2 - x1) / 46);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const lx = x1 + (x2 - x1) * t;
      const ly = y + Math.sin(t * Math.PI) * 24 + 4;
      const c = colors[Math.floor(rnd() * colors.length)];
      if (lit) {
        const glow = g.createRadialGradient(lx, ly + 8, 1, lx, ly + 8, 22);
        glow.addColorStop(0, 'rgba(255,190,110,0.5)');
        glow.addColorStop(1, 'rgba(255,190,110,0)');
        g.fillStyle = glow;
        g.fillRect(lx - 22, ly - 14, 44, 44);
      }
      g.fillStyle = lit ? c : shadeStr(c, -60);
      g.beginPath();
      g.ellipse(lx, ly + 8, 6, 8, 0, 0, 6.283);
      g.fill();
      g.fillStyle = '#caa24d';
      g.fillRect(lx - 3, ly - 2, 6, 3);
    }
  }

  function shadeStr(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, gg = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); gg = Math.max(0, Math.min(255, gg)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
  }

  function paintBamboo(g, rnd, x, baseY, h, color) {
    g.strokeStyle = color;
    g.lineWidth = 5 + rnd() * 3;
    const lean = (rnd() - 0.5) * 40;
    g.beginPath();
    g.moveTo(x, baseY);
    g.quadraticCurveTo(x + lean * 0.3, baseY - h * 0.6, x + lean, baseY - h);
    g.stroke();
    /* joints */
    g.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      g.beginPath();
      g.moveTo(x + lean * t * t - 5, baseY - h * t);
      g.lineTo(x + lean * t * t + 5, baseY - h * t);
      g.stroke();
    }
    /* leaves */
    g.fillStyle = color;
    for (let i = 0; i < 6; i++) {
      const t = 0.55 + rnd() * 0.45;
      const lx = x + lean * t * t, ly = baseY - h * t;
      g.save();
      g.translate(lx, ly);
      g.rotate((rnd() - 0.5) * 2.4);
      g.beginPath();
      g.ellipse(12, 0, 14, 3.5, 0, 0, 6.283);
      g.fill();
      g.restore();
    }
  }

  function paintPalm(g, rnd, x, baseY, h, color) {
    g.strokeStyle = color; g.fillStyle = color;
    g.lineWidth = 6;
    const lean = (rnd() - 0.5) * 50;
    g.beginPath();
    g.moveTo(x, baseY);
    g.quadraticCurveTo(x + lean * 0.4, baseY - h * 0.6, x + lean, baseY - h);
    g.stroke();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.5;
      g.save();
      g.translate(x + lean, baseY - h);
      g.rotate(a);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(24, -6, 44, 8);
      g.quadraticCurveTo(22, 4, 0, 4);
      g.fill();
      g.restore();
    }
  }

  function paintColumns(g, rnd, baseY) {
    /* temple interior columns with gold bands */
    for (let x = 90; x < TILE_W; x += 260) {
      const grad = g.createLinearGradient(x, 0, x + 44, 0);
      grad.addColorStop(0, '#4a1a1c');
      grad.addColorStop(0.5, '#7e2f2a');
      grad.addColorStop(1, '#3a1215');
      g.fillStyle = grad;
      g.fillRect(x, baseY - 460, 44, 460);
      g.fillStyle = '#b98a3a';
      g.fillRect(x - 6, baseY - 460, 56, 14);
      g.fillRect(x - 6, baseY - 20, 56, 20);
      g.fillRect(x, baseY - 300, 44, 8);
      /* dragon coil hint */
      g.strokeStyle = 'rgba(215,170,80,0.5)';
      g.lineWidth = 5;
      g.beginPath();
      for (let i = 0; i < 30; i++) {
        const t = i / 29;
        const yy = baseY - 60 - t * 340;
        const xx = x + 22 + Math.sin(t * 12) * 26;
        i ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
      }
      g.stroke();
    }
  }

  /* --------------- theme layer builders --------------- */
  function makeTile(painter) {
    const c = document.createElement('canvas');
    c.width = Math.round(TILE_W * TILE_RASTER_SCALE);
    c.height = Math.round(TILE_H * TILE_RASTER_SCALE);
    const g = c.getContext('2d');
    g.scale(TILE_RASTER_SCALE, TILE_RASTER_SCALE);
    painter(g);
    return c;
  }

  const LANTERN_COLORS = ['#e04848', '#e8a13c', '#4ea3d8', '#c85ac0', '#58b86a', '#e8d24c'];

  function buildLayers(theme, seed, lit) {
    const rnd = NLA.util.seeded(seed);
    const layers = [];
    const B = TILE_H; /* bottom of tile */

    if (theme === 'street' || theme === 'finale' || theme === 'menu') {
      const dark = theme === 'finale';
      layers.push({ factor: 0.15, dy: -30, canvas: makeTile(g => {
        paintRoofline(g, rnd, B, dark ? '#120c22' : '#2a1838');
      })});
      layers.push({ factor: 0.45, dy: 10, canvas: makeTile(g => {
        let x = 20;
        while (x < TILE_W - 100) {
          const w = 150 + rnd() * 120, h = 120 + rnd() * 90;
          paintHouse(g, rnd, x, B, w, h,
            dark ? '#2c2438' : (rnd() < 0.7 ? '#c9973f' : '#b3763a'),
            dark ? '#191426' : '#4a2c28', !dark);
          x += w + 18 + rnd() * 40;
        }
        for (let i = 0; i < 4; i++) {
          const x1 = rnd() * TILE_W * 0.8;
          paintLanternString(g, rnd, x1, x1 + 220 + rnd() * 200, 130 + rnd() * 120, LANTERN_COLORS, !dark);
        }
      })});
      layers.push({ factor: 0.75, dy: 60, canvas: makeTile(g => {
        for (let i = 0; i < 3; i++) {
          const x1 = rnd() * TILE_W * 0.7;
          paintLanternString(g, rnd, x1, x1 + 300 + rnd() * 260, 60 + rnd() * 90, LANTERN_COLORS, !dark);
        }
        /* occasional potted plants / poles */
        for (let i = 0; i < 5; i++) {
          const x = rnd() * TILE_W;
          g.fillStyle = dark ? '#1c1830' : '#3a2c30';
          g.fillRect(x, B - 90, 8, 90);
          g.beginPath(); g.arc(x + 4, B - 96, 9, 0, 6.283); g.fill();
        }
      })});
    }
    else if (theme === 'river') {
      layers.push({ factor: 0.12, dy: -20, canvas: makeTile(g => {
        paintMountains(g, rnd, B, '#141f42', 150);
      })});
      layers.push({ factor: 0.35, dy: 0, canvas: makeTile(g => {
        /* far shore: stilt houses + palms */
        g.fillStyle = '#101a35';
        g.fillRect(0, B - 40, TILE_W, 40);
        let x = 40;
        while (x < TILE_W - 120) {
          if (rnd() < 0.5) {
            g.fillStyle = '#182448';
            g.fillRect(x, B - 110, 90, 70);
            g.beginPath();
            g.moveTo(x - 8, B - 110);
            g.quadraticCurveTo(x + 45, B - 140, x + 98, B - 110);
            g.fill();
            /* stilts */
            g.fillRect(x + 8, B - 40, 6, 40);
            g.fillRect(x + 74, B - 40, 6, 40);
            /* window light */
            g.fillStyle = 'rgba(255,196,110,0.8)';
            g.fillRect(x + 34, B - 96, 18, 20);
            x += 130;
          } else {
            paintPalm(g, rnd, x + 30, B - 30, 90 + rnd() * 50, '#16224a');
            x += 110;
          }
        }
      })});
      layers.push({ factor: 0.6, dy: 30, canvas: makeTile(g => {
        /* moored boats silhouettes */
        for (let i = 0; i < 3; i++) {
          const x = rnd() * TILE_W, w = 110 + rnd() * 60;
          g.fillStyle = '#0e1730';
          g.beginPath();
          g.moveTo(x, B - 46);
          g.quadraticCurveTo(x + w * 0.5, B - 26, x + w, B - 46);
          g.lineTo(x + w - 16, B - 60);
          g.lineTo(x + 16, B - 60);
          g.fill();
          /* lantern on prow */
          g.fillStyle = 'rgba(255,180,100,0.9)';
          g.beginPath(); g.arc(x + w - 10, B - 66, 4, 0, 6.283); g.fill();
        }
      })});
    }
    else if (theme === 'village') {
      layers.push({ factor: 0.12, dy: -20, canvas: makeTile(g => {
        paintMountains(g, rnd, B, '#233457', 170);
      })});
      layers.push({ factor: 0.35, dy: 0, canvas: makeTile(g => {
        /* rice terraces */
        for (let i = 0; i < 4; i++) {
          g.fillStyle = shadeStr('#3f6a4a', -i * 12);
          g.beginPath();
          g.moveTo(0, B - 90 + i * 24);
          for (let x = 0; x <= TILE_W; x += 100) {
            g.lineTo(x, B - 90 + i * 24 + Math.sin((x + i * 200) * 0.01) * 10);
          }
          g.lineTo(TILE_W, B); g.lineTo(0, B);
          g.fill();
        }
        for (let i = 0; i < 6; i++) paintBamboo(g, rnd, rnd() * TILE_W, B - 20, 130 + rnd() * 70, '#27402e');
      })});
      layers.push({ factor: 0.65, dy: 40, canvas: makeTile(g => {
        for (let i = 0; i < 8; i++) paintBamboo(g, rnd, rnd() * TILE_W, B, 180 + rnd() * 90, '#31543a');
        /* small huts */
        for (let i = 0; i < 2; i++) {
          const x = rnd() * TILE_W, w = 120;
          g.fillStyle = '#513c28';
          g.fillRect(x, B - 80, w, 80);
          g.fillStyle = '#6a5232';
          g.beginPath();
          g.moveTo(x - 14, B - 80);
          g.lineTo(x + w / 2, B - 130);
          g.lineTo(x + w + 14, B - 80);
          g.fill();
          g.fillStyle = 'rgba(255,196,110,0.85)';
          g.fillRect(x + 44, B - 60, 26, 30);
        }
      })});
    }
    else if (theme === 'lake') {
      layers.push({ factor: 0.1, dy: -30, canvas: makeTile(g => {
        paintMountains(g, rnd, B, '#231548', 130);
      })});
      layers.push({ factor: 0.3, dy: 0, canvas: makeTile(g => {
        paintMountains(g, rnd, B, '#2e1e5e', 90);
        /* far lotus silhouettes */
        g.fillStyle = '#251550';
        for (let i = 0; i < 10; i++) {
          const x = rnd() * TILE_W;
          g.beginPath(); g.ellipse(x, B - 14, 26, 6, 0, 0, 6.283); g.fill();
          if (rnd() < 0.4) {
            g.beginPath();
            g.moveTo(x, B - 18); g.quadraticCurveTo(x - 8, B - 40, x, B - 48);
            g.quadraticCurveTo(x + 8, B - 40, x, B - 18);
            g.fill();
          }
        }
      })});
      layers.push({ factor: 0.55, dy: 30, canvas: makeTile(g => {
        for (let i = 0; i < 5; i++) {
          const x = rnd() * TILE_W;
          g.fillStyle = '#341f68';
          g.beginPath(); g.ellipse(x, B - 20, 42, 10, 0, 0, 6.283); g.fill();
        }
        for (let i = 0; i < 4; i++) paintBamboo(g, rnd, rnd() * TILE_W, B, 150 + rnd() * 80, '#2c1c58');
      })});
    }
    else if (theme === 'temple') {
      layers.push({ factor: 0.1, dy: 60, canvas: makeTile(g => {
        /* far wall with carved pattern + hanging red lanterns */
        g.fillStyle = '#241014';
        g.fillRect(0, 0, TILE_W, TILE_H);
        g.strokeStyle = 'rgba(150,90,50,0.25)';
        g.lineWidth = 2;
        for (let y = 60; y < TILE_H; y += 90) {
          for (let x = 30; x < TILE_W; x += 90) {
            g.strokeRect(x, y, 54, 54);
            g.strokeRect(x + 10, y + 10, 34, 34);
          }
        }
      })});
      layers.push({ factor: 0.35, dy: 30, canvas: makeTile(g => {
        paintColumns(g, rnd, B);
        for (let i = 0; i < 5; i++) {
          const x = 140 + i * 300 + rnd() * 60;
          /* hanging red lantern */
          g.strokeStyle = 'rgba(0,0,0,0.6)';
          g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 90 + rnd() * 60); g.stroke();
          const ly = 90 + rnd() * 60;
          const glow = g.createRadialGradient(x, ly + 16, 2, x, ly + 16, 40);
          glow.addColorStop(0, 'rgba(255,120,80,0.5)');
          glow.addColorStop(1, 'rgba(255,120,80,0)');
          g.fillStyle = glow; g.fillRect(x - 40, ly - 24, 80, 80);
          g.fillStyle = '#c8302a';
          g.beginPath(); g.ellipse(x, ly + 16, 14, 18, 0, 0, 6.283); g.fill();
          g.fillStyle = '#e8b54d';
          g.fillRect(x - 7, ly - 6, 14, 5);
          g.fillRect(x - 5, ly + 32, 10, 4);
        }
      })});
    }

    return layers;
  }

  /* stars canvas (shared) */
  let starsCanvas = null;
  function stars() {
    if (starsCanvas) return starsCanvas;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 300;
    const g = c.getContext('2d');
    const rnd = NLA.util.seeded(77);
    for (let i = 0; i < 90; i++) {
      const x = rnd() * 512, y = rnd() * 300, r = rnd() * 1.3 + 0.3;
      g.fillStyle = `rgba(255,245,225,${0.25 + rnd() * 0.6})`;
      g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    }
    starsCanvas = c;
    return c;
  }

  const BG = {
    current: null,
    build(theme, seed, chapter) {
      const def = THEMES[theme] || THEMES.menu;
      this.current = {
        theme, def,
        sceneKey: chapter ? 'scene' + chapter : null,
        layers: buildLayers(theme, seed || 12345),
      };
      return this.current;
    },

    draw(ctx, camX, camY, vw, vh, t, opts) {
      const cur = this.current;
      if (!cur) return;
      const def = cur.def;
      opts = opts || {};
      /* sky */
      const sky = ctx.createLinearGradient(0, 0, 0, vh);
      sky.addColorStop(0, opts.skyTint || def.skyTop);
      sky.addColorStop(0.55, def.skyMid);
      sky.addColorStop(1, def.skyBot);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, vw, vh);

      /* A chapter-specific painterly vista supplies professional atmosphere;
         lightweight procedural layers remain in front for real parallax. */
      const scene = cur.sceneKey && NLA.art && NLA.art.get(cur.sceneKey);
      if (scene) {
        ctx.save();
        ctx.globalAlpha = coarsePointer ? .48 : .58;
        ctx.drawImage(scene, 0, 0, vw, vh);
        const veil = ctx.createLinearGradient(0, 0, 0, vh);
        veil.addColorStop(0, 'rgba(9,6,24,.04)');
        veil.addColorStop(1, 'rgba(9,6,24,.34)');
        ctx.fillStyle = veil; ctx.fillRect(0, 0, vw, vh);
        ctx.restore();
      }

      /* stars */
      if (def.stars > 0) {
        ctx.save();
        ctx.globalAlpha = def.stars * (0.6 + Math.sin(t * 0.5) * 0.08);
        const sc = stars();
        const ox = -(camX * 0.03) % 512;
        for (let x = ox - 512; x < vw; x += 512) {
          ctx.drawImage(sc, x, 0);
          ctx.drawImage(sc, x + 256, 120);
        }
        ctx.restore();
      }

      /* moon */
      if (def.moon > 0) {
        const mr = 46 * def.moon;
        const mx = vw * 0.72 - camX * 0.04, my = vh * 0.2 + Math.sin(t * 0.1) * 3;
        NLA.draw.glow(ctx, 'white', mx, my, mr * 3.2, 0.55);
        ctx.fillStyle = '#fff8e8';
        ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(220,205,180,0.5)';
        ctx.beginPath(); ctx.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.16, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(mx + mr * 0.25, my + mr * 0.28, mr * 0.11, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(mx + mr * 0.1, my - mr * 0.4, mr * 0.09, 0, 6.283); ctx.fill();
      }

      /* parallax layers — tile bottoms sit near the ground line,
         farther layers a little higher for depth */
      for (const layer of cur.layers) {
        const y = (opts.groundY || 840) - camY - TILE_H - (1 - layer.factor) * 90 + layer.dy + 40;
        let ox = -(camX * layer.factor) % TILE_W;
        if (ox > 0) ox -= TILE_W;
        for (let x = ox; x < vw; x += TILE_W) {
          ctx.drawImage(layer.canvas, x, y, TILE_W, TILE_H);
        }
      }
    },
  };

  NLA.bg = BG;
})();

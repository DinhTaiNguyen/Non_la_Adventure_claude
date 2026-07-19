/* =====================================================================
   ui.js — DOM menus, dialogs, overlays, touch UI, i18n binding.
   ===================================================================== */
(function () {
  const $ = (id) => document.getElementById(id);
  const UI = {};
  let game = null;

  UI.init = function (g) {
    game = g;
    applyMenuArt();
    bindMenus();
    UI.applyLang();
    UI.updateToggles();
    startPreviewLoops();
  };

  function applyMenuArt() {
    if (!NLA.art) return;
    const key = window.innerWidth <= 1000 || NLA.input.isTouchDevice ? 'titleSmall' : 'titleLarge';
    $('menu').style.setProperty('--menu-art', `url("${NLA.art.url(key)}")`);
    NLA.art.preload(['lantern', key]);
  }

  /* ---------------- helpers ---------------- */
  function show(id) {
    $(id).classList.remove('hidden');
    if (UI.refreshPreviews) UI.refreshPreviews();
  }
  function hide(id) {
    $(id).classList.add('hidden');
    if (UI.refreshPreviews) UI.refreshPreviews();
  }
  function hideAllPanels() {
    ['menu', 'pick-panel', 'level-panel', 'online-panel', 'wardrobe-panel', 'help-panel',
      'item-panel', 'story', 'memory', 'complete', 'pause-panel'].forEach(hide);
  }

  UI.toast = function (msg, ms) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(UI._toastT);
    UI._toastT = setTimeout(() => t.classList.remove('show'), ms || 3200);
  };

  UI.showTouchGuide = function () {
    const guide = $('touch-guide');
    if (!NLA.input.isTouchDevice || game.mode === 'local' || game.state !== 'play') {
      hide('touch-guide');
      return;
    }
    $('touch-guide-text').textContent = NLA.t('touchGuide');
    clearTimeout(UI._touchGuideT);
    show('touch-guide');
    UI._touchGuideT = setTimeout(() => hide('touch-guide'), 5600);
  };

  /* ---------------- i18n ---------------- */
  UI.applyLang = function () {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.innerHTML = NLA.t(el.getAttribute('data-i18n'));
    });
    $('help-content').innerHTML = NLA.t('helpKeys');
    buildNameEditors();
    updateNameLabels();
    UI.updateTouchIcons();
    updateRelayNote();
    $('btn-items').setAttribute('aria-label', NLA.t('itemCodexTitle'));
    $('btn-items').title = NLA.t('itemCodexTitle');
    if (!$('level-panel').classList.contains('hidden')) openLevelSelect();
  };

  /* ---------------- player names (default Joku & Jolie) ---------------- */
  function updateNameLabels() {
    document.querySelectorAll('.name-boy').forEach(el => { el.textContent = NLA.name('boy'); });
    document.querySelectorAll('.name-girl').forEach(el => { el.textContent = NLA.name('girl'); });
  }
  function syncNameInputs(except) {
    document.querySelectorAll('.ne-boy').forEach(i => { if (i !== except) i.value = NLA.save.data.nameBoy; });
    document.querySelectorAll('.ne-girl').forEach(i => { if (i !== except) i.value = NLA.save.data.nameGirl; });
  }
  function buildNameEditors() {
    document.querySelectorAll('[data-names]').forEach(box => {
      box.innerHTML = `<div class="ne-title">${NLA.t('namesTitle')}</div>
        <label class="ne-field"><span class="ne-ico">💙</span><input class="ne-boy" maxlength="12" autocomplete="off"></label>
        <label class="ne-field"><span class="ne-ico">💗</span><input class="ne-girl" maxlength="12" autocomplete="off"></label>`;
    });
    syncNameInputs();
    document.querySelectorAll('.ne-boy, .ne-girl').forEach(inp => {
      inp.addEventListener('input', () => {
        const d = NLA.save.data;
        const v = inp.value.slice(0, 12);
        if (inp.classList.contains('ne-boy')) d.nameBoy = v.trim() || 'Joku';
        else d.nameGirl = v.trim() || 'Jolie';
        NLA.save.store();
        updateNameLabels();
        syncNameInputs(inp);
        if (NLA.net.active) NLA.net.sendMyName();
      });
    });
  }

  /* ---------------- toggles ---------------- */
  UI.updateToggles = function () {
    const d = NLA.save.data;
    const langLabel = d.lang === 'en' ? '🌐 EN' : '🌐 VI';
    const musLabel = d.music ? '🎵 On' : '🎵 Off';
    const sfxLabel = d.sfx ? '🔔 On' : '🔔 Off';
    $('btn-lang').textContent = langLabel; $('pause-lang').textContent = langLabel;
    $('btn-music').textContent = musLabel; $('pause-music').textContent = musLabel;
    $('btn-sfx').textContent = sfxLabel; $('pause-sfx').textContent = sfxLabel;
  };

  function toggleLang() {
    const d = NLA.save.data;
    d.lang = d.lang === 'en' ? 'vi' : 'en';
    NLA.save.store();
    UI.applyLang(); UI.updateToggles();
    NLA.audio.sfx('click');
  }
  function toggleMusic() {
    const d = NLA.save.data;
    d.music = !d.music; NLA.save.store();
    NLA.audio.setMusic(d.music);
    UI.updateToggles(); NLA.audio.sfx('click');
  }
  function toggleSfx() {
    const d = NLA.save.data;
    d.sfx = !d.sfx; NLA.save.store();
    NLA.audio.setSfx(d.sfx);
    UI.updateToggles(); NLA.audio.sfx('click');
  }

  /* ---------------- menus ---------------- */
  function bindMenus() {
    const click = (id, fn) => $(id).addEventListener('click', () => { NLA.audio.unlock(); NLA.audio.sfx('click'); fn(); });

    click('btn-solo', () => { hide('menu'); show('pick-panel'); });
    click('btn-local', () => { game.mode = 'local'; hide('menu'); openLevelSelect(); });
    click('btn-online', () => { hide('menu'); openOnline(); });
    click('btn-wardrobe', () => { hide('menu'); openWardrobe(); });
    click('btn-help', () => { hide('menu'); show('help-panel'); });
    click('btn-lang', toggleLang);
    click('btn-music', toggleMusic);
    click('btn-sfx', toggleSfx);
    click('help-back', () => { hide('help-panel'); show('menu'); });
    click('btn-items', () => {
      if (game.state !== 'play' || !$('story').classList.contains('hidden')) return;
      UI._itemWasPaused = game.paused;
      game.paused = true;
      hide('touch-guide');
      show('item-panel');
    });
    click('item-back', () => {
      hide('item-panel');
      game.paused = !!UI._itemWasPaused;
      if (!game.paused) UI.showTouchGuide();
    });

    /* solo char pick */
    click('pick-boy', () => { game.mode = 'solo'; game.activeChar = 'boy'; hide('pick-panel'); openLevelSelect(); });
    click('pick-girl', () => { game.mode = 'solo'; game.activeChar = 'girl'; hide('pick-panel'); openLevelSelect(); });
    click('pick-back', () => { hide('pick-panel'); show('menu'); });

    /* level select */
    click('level-back', () => { hide('level-panel'); show('menu'); });

    /* online */
    click('online-back', () => {
      NLA.net.cleanup();
      hide('online-panel'); show('menu');
      $('online-choose').classList.remove('hidden');
      $('online-status').classList.add('hidden');
    });
    click('online-pick-boy', () => { UI.onlineChar = 'boy'; markOnlinePick(); });
    click('online-pick-girl', () => { UI.onlineChar = 'girl'; markOnlinePick(); });
    click('btn-host', () => startHost());
    click('btn-join', () => startJoin());
    $('join-code').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });

    /* pause */
    click('btn-pause', () => UI.pause());
    click('btn-resume', () => UI.resume());
    click('btn-restart', () => {
      hideAllPanels(); hide('pause-panel');
      if (NLA.net.active) { NLA.net.send({ t: 'level', idx: game.levelIdx }); }
      UI.startLevelFlow(game.levelIdx, false, true);
    });
    click('btn-quit', () => UI.quitToMenu());
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && game.state === 'play') {
        game.paused ? UI.resume() : UI.pause();
      }
    });
    click('pause-lang', toggleLang);
    click('pause-music', toggleMusic);
    click('pause-sfx', toggleSfx);

    /* story / memory / complete */
    click('story-next', () => advanceStory());
    click('memory-close', () => {
      hide('memory');
      if (game.state === 'memory') game.state = 'play';
    });
    click('btn-next-level', () => {
      hide('complete');
      const next = game.levelIdx + 1;
      if (next < NLA.LEVELS.length) {
        if (NLA.net.active) NLA.net.send({ t: 'level', idx: next });
        UI.startLevelFlow(next, false, true);
      } else UI.quitToMenu();
    });
    click('btn-complete-menu', () => UI.quitToMenu());

    /* wardrobe */
    click('wardrobe-back', () => { hide('wardrobe-panel'); show('menu'); });

    /* net hooks */
    NLA.net.onStatus = onNetStatus;
    NLA.net.onMessage = (msg) => game.onNetMessage(msg);

    NLA.input.bindTouchUI();
  }

  UI.pause = function () {
    if (game.state !== 'play') return;
    NLA.input.resetTouch();
    game.paused = true;
    hide('touch-guide');
    show('pause-panel');
    /* net: pausing only pauses locally; hide restart for guest */
    $('btn-restart').style.display = (NLA.net.active && !NLA.net.isHost) ? 'none' : '';
  };
  UI.resume = function () {
    game.paused = false;
    hide('pause-panel');
  };
  UI.quitToMenu = function () {
    NLA.input.resetTouch();
    NLA.net.cleanup();
    hideAllPanels();
    game.state = 'idle';
    game.paused = false;
    game.mode = 'solo';
    NLA.draw.particles.clear();
    NLA.audio.setTheme('menu');
    NLA.audio.setIntensity(0.3);
    hide('topbar'); hide('touch-ui'); hide('touch-guide');
    show('menu');
    game._menuBuilt = false;
  };

  /* ---------------- level select ---------------- */
  function openLevelSelect() {
    const list = $('level-list');
    list.innerHTML = '';
    const progress = NLA.save.data.unlocked;
    NLA.LEVELS.forEach((lv, i) => {
      const item = document.createElement('button');
      item.className = 'level-item';
      item.style.backgroundImage = `url("${NLA.art.url('chapter' + (i + 1))}")`;
      item.innerHTML = `<span class="lv-num">${i + 1}</span>
        <span class="lv-copy"><span class="lv-name">${NLA.t('lvName' + (i + 1))}</span>
        <span class="lv-value">${NLA.t('lvValue' + (i + 1))}</span></span>
        <span class="lv-state">${i + 1 < progress ? '✓' : (i + 1 === progress ? '✨' : '↗')}</span>`;
      item.addEventListener('click', () => {
        NLA.audio.sfx('click');
        hide('level-panel');
        if (NLA.net.active) NLA.net.send({ t: 'level', idx: i });
        UI.startLevelFlow(i, false, true);
      });
      list.appendChild(item);
    });
    show('level-panel');
  }

  /* ---------------- start / story flow ---------------- */
  let storyQueue = [], storyDone = null;

  UI.startLevelFlow = function (idx, fromNet, withIntro) {
    NLA.input.resetTouch();
    hideAllPanels();
    NLA.audio.unlock();
    show('topbar');
    if (NLA.input.isTouchDevice && game.mode !== 'local') {
      show('touch-ui');
      UI.updateTouchIcons();
    } else hide('touch-ui');
    const lv = NLA.LEVELS[idx];
    const slides = [];
    if (idx === 0 && (withIntro || fromNet)) slides.push(...NLA.t('intro'));
    slides.push(NLA.t(lv.introKey));
    const chapterStory = NLA.t('lvStory' + (idx + 1));
    if (Array.isArray(chapterStory)) slides.push(...chapterStory);
    game.loadLevel(idx);
    game.paused = true;
    showStory(slides, () => {
      game.paused = false;
      UI.showTouchGuide();
    }, storyArtFor(idx));
  };

  function storyArtFor(idx) {
    const compact = window.innerWidth <= 1000 || NLA.input.isTouchDevice;
    if (idx === 0) return NLA.art.url(compact ? 'titleSmall' : 'titleLarge');
    if (idx === 2) return new URL(`assets/art/vietnam-village-night-${compact ? 960 : 1600}.webp`, document.baseURI).href;
    if (idx === 5) return new URL(`assets/art/thanh-giong-blessing-${compact ? 960 : 1600}.webp`, document.baseURI).href;
    return NLA.art.url('chapter' + (idx + 1));
  }

  function showStory(slides, done, art) {
    storyQueue = slides.slice();
    storyDone = done;
    const panel = $('story');
    panel.classList.toggle('has-art', !!art);
    if (art) panel.style.setProperty('--story-art', `url("${art}")`);
    else panel.style.removeProperty('--story-art');
    show('story');
    advanceStory(true);
  }
  function advanceStory(first) {
    if (!first) NLA.audio.sfx('click');
    if (storyQueue.length === 0) {
      hide('story');
      if (storyDone) { const f = storyDone; storyDone = null; f(); }
      return;
    }
    const el = $('story-text');
    el.style.opacity = 0;
    const text = storyQueue.shift();
    setTimeout(() => { el.textContent = text; el.style.transition = 'opacity .5s'; el.style.opacity = 1; }, 60);
  }

  /* ---------------- memory ---------------- */
  UI.showMemory = function (idx) {
    const mems = NLA.t('memories');
    $('memory-text').textContent = mems[idx % mems.length];
    show('memory');
  };

  /* ---------------- complete ---------------- */
  UI.showComplete = function (stats) {
    const s = $('complete-stats');
    s.innerHTML =
      `⏱ ${NLA.t('statTime')}: <b>${NLA.util.fmtTime(stats.time)}</b><br>` +
      `✨ ${NLA.t('statCharms')}: <b>${stats.charms}</b><br>` +
      `💗 ${NLA.t('statLove')}: <b>+${Math.round(stats.love)}</b><br>` +
      `🏮 ${NLA.t('statMemories')}: <b>${stats.memories}</b>`;
    const nextBtn = $('btn-next-level');
    nextBtn.style.display = (NLA.net.active && !NLA.net.isHost) ? 'none' : '';
    if (stats.last) nextBtn.style.display = 'none';
    show('complete');
  };

  /* ---------------- ending ---------------- */
  UI.showEnding = function () {
    const d = NLA.save.data;
    let firstFinish = !d.finished;
    d.finished = true;
    NLA.save.store();
    const slides = NLA.t('ending').slice();
    showStory(slides, () => {
      if (firstFinish) UI.toast(NLA.t('endingUnlock'), 5000);
      UI.quitToMenu();
    });
  };

  /* ---------------- online flow ---------------- */
  function updateRelayNote() {
    const note = $('relay-note');
    if (!note || !NLA.net) return;
    const ready = NLA.net.hasRelay && NLA.net.hasRelay();
    note.textContent = NLA.t(ready ? 'relayReady' : 'relayMissing');
    note.classList.toggle('ready', !!ready);
    note.classList.toggle('warning', !ready);
  }

  function openOnline() {
    UI.onlineChar = UI.onlineChar || 'boy';
    markOnlinePick();
    $('room-code-box').classList.add('hidden');
    updateRelayNote();
    show('online-panel');
    NLA.net.prepare().then(updateRelayNote);
    if (NLA.net.available()) {
      $('online-choose').classList.remove('hidden');
      hide('online-status');
      return;
    }

    $('online-choose').classList.add('hidden');
    $('online-msg').textContent = NLA.t('loadingOnline');
    show('online-status');
    NLA.net.loadPeer().then((ready) => {
      if ($('online-panel').classList.contains('hidden')) return;
      if (ready) {
        hide('online-status');
        $('online-choose').classList.remove('hidden');
      } else {
        $('online-msg').textContent = NLA.t('needPeer');
      }
    });
  }
  function markOnlinePick() {
    $('online-pick-boy').classList.toggle('selected', UI.onlineChar === 'boy');
    $('online-pick-girl').classList.toggle('selected', UI.onlineChar === 'girl');
  }
  function startHost() {
    if (!NLA.net.available()) { UI.toast(NLA.t('needPeer')); return; }
    game.mode = 'net';
    $('online-choose').classList.add('hidden');
    show('online-status');
    $('online-msg').textContent = NLA.t('connecting');
    NLA.net.host(UI.onlineChar);
  }
  function startJoin() {
    if (!NLA.net.available()) { UI.toast(NLA.t('needPeer')); return; }
    const code = $('join-code').value.trim();
    if (code.length < 4) { $('join-code').focus(); return; }
    game.mode = 'net';
    $('online-choose').classList.add('hidden');
    show('online-status');
    $('online-msg').textContent = NLA.t('connecting');
    NLA.net.join(code);
  }

  function onNetStatus(status, detail) {
    switch (status) {
      case 'waiting':
        $('online-msg').textContent = NLA.t('waitingPartner');
        $('room-code').textContent = detail.split('').join(' ');
        $('room-code-box').classList.remove('hidden');
        break;
      case 'connected':
        $('online-msg').textContent = NLA.t(detail && detail.path === 'relay' ? 'connectedRelay' : 'connectedDirect');
        UI.toast($('online-msg').textContent, 3200);
        $('room-code-box').classList.add('hidden');
        setTimeout(() => {
          if (NLA.net.isHost) { hide('online-panel'); openLevelSelect(); }
          else $('online-msg').textContent = NLA.t('partnerJoined');
        }, 700);
        break;
      case 'retrying':
        $('online-msg').textContent = NLA.t('retryingOnline');
        break;
      case 'joinfail':
        $('online-msg').textContent = NLA.t('joinFail');
        $('online-choose').classList.remove('hidden');
        break;
      case 'nopeer':
        $('online-msg').textContent = NLA.t('needPeer');
        break;
      case 'lost':
        UI.toast(NLA.t('netLost'), 5000);
        if (game.state !== 'idle') {
          /* AI takes over the partner */
          game.mode = 'solo';
          const mine = NLA.net.myChar;
          game.activeChar = mine;
          for (const p of game.players || []) p.remote = false;
        } else {
          UI.quitToMenu();
        }
        break;
      case 'error':
        $('online-msg').textContent = '💔 ' + (detail && detail.type ? detail.type : 'connection error');
        $('online-choose').classList.remove('hidden');
        break;
    }
  }

  /* ---------------- wardrobe ---------------- */
  function openWardrobe() {
    $('wardrobe-charms').textContent = NLA.save.data.charms;
    renderCostumes();
    show('wardrobe-panel');
  }
  let wardrobeWho = 'boy';
  function renderCostumes() {
    const list = $('costume-list');
    list.innerHTML = '';
    const d = NLA.save.data;
    /* who toggle */
    const whoRow = document.createElement('div');
    whoRow.style.cssText = 'grid-column:1/-1;display:flex;gap:8px;justify-content:center;margin-bottom:4px;';
    ['boy', 'girl'].forEach(w => {
      const b = document.createElement('button');
      b.className = 'btn btn-half';
      b.style.width = '40%';
      b.textContent = (w === 'boy' ? '💙 ' : '💗 ') + NLA.name(w);
      if (wardrobeWho === w) b.classList.add('btn-primary');
      b.addEventListener('click', () => { wardrobeWho = w; NLA.audio.sfx('click'); renderCostumes(); });
      whoRow.appendChild(b);
    });
    list.appendChild(whoRow);

    NLA.COSTUMES.forEach(c => {
      const unlocked = c.need === -1 ? d.finished : d.charms >= c.need;
      const sel = (wardrobeWho === 'boy' ? d.costumeBoy : d.costumeGirl) === c.id;
      const item = document.createElement('button');
      item.className = 'costume-item' + (sel ? ' selected' : '') + (unlocked ? '' : ' locked');
      const pal = c[wardrobeWho];
      item.innerHTML = `<b>${NLA.t('costume_' + c.id)}</b>
        <span class="sw"><i style="background:${pal.robe1}"></i><i style="background:${pal.robe2}"></i><i style="background:${pal.trim}"></i></span>
        <small>${unlocked ? '✓' : (c.need === -1 ? NLA.t('weddingNeed') : `🏮 ${c.need} ${NLA.t('unlockedAt')}`)}</small>`;
      if (unlocked) {
        item.addEventListener('click', () => {
          if (wardrobeWho === 'boy') d.costumeBoy = c.id; else d.costumeGirl = c.id;
          NLA.save.store();
          NLA.audio.sfx('chime', 3);
          renderCostumes();
        });
      }
      list.appendChild(item);
    });
  }

  /* ---------------- touch icons per character ---------------- */
  UI.updateTouchIcons = function () {
    let who = 'boy';
    if (game.mode === 'net') who = NLA.net.myChar;
    else if (game.mode === 'solo') who = game.activeChar;
    const isBoy = who === 'boy';
    const pow1 = isBoy ? { icon: '🌀', label: NLA.t('touchWind') } : { icon: '✨', label: NLA.t('touchLight') };
    const pow2 = isBoy ? { icon: '🛡', label: NLA.t('touchShield') } : { icon: '🌸', label: NLA.t('touchLotus') };
    $('tc-pow1-ico').textContent = pow1.icon;
    $('tc-pow2-ico').textContent = pow2.icon;
    $('tc-pow1-copy').textContent = pow1.label;
    $('tc-pow2-copy').textContent = pow2.label;
    $('tc-jump-copy').textContent = NLA.t('touchJump');
    $('tc-special-copy').textContent = NLA.t('touchSpecial');
    $('tc-jump-btn').setAttribute('aria-label', NLA.t('touchJump'));
    $('tc-pow1-btn').setAttribute('aria-label', pow1.label);
    $('tc-pow2-btn').setAttribute('aria-label', pow2.label);
    $('tc-special-btn').setAttribute('aria-label', NLA.t('touchSpecial'));
    $('tc-hands-btn').setAttribute('aria-label', NLA.t('touchHands'));
    $('tc-switch-btn').setAttribute('aria-label', NLA.t('touchSwitch'));
    $('tc-emote-btn').setAttribute('aria-label', NLA.t('touchHeart'));
    $('tc-switch-btn').style.display = game.mode === 'solo' ? '' : 'none';
  };

  /* ---------------- character preview canvases ---------------- */
  function startPreviewLoops() {
    const canvases = [
      { id: 'pick-canvas-boy', who: 'boy', s: 1.5 },
      { id: 'pick-canvas-girl', who: 'girl', s: 1.5 },
      { id: 'online-canvas-boy', who: 'boy', s: 1.15 },
      { id: 'online-canvas-girl', who: 'girl', s: 1.15 },
    ].map(cv => {
      const el = $(cv.id);
      return Object.assign(cv, { el, ctx: el && el.getContext('2d') });
    });
    const wardrobeCanvas = $('wardrobe-canvas');
    const wardrobeCtx = wardrobeCanvas && wardrobeCanvas.getContext('2d');
    let previewFrame = 0, lastPreview = -Infinity;

    const hasVisiblePreview = () =>
      canvases.some(cv => cv.el && cv.el.offsetParent !== null) ||
      (wardrobeCanvas && wardrobeCanvas.offsetParent !== null);

    const render = (t) => {
      for (const cv of canvases) {
        if (!cv.el || cv.el.offsetParent === null) continue;
        cv.ctx.clearRect(0, 0, cv.el.width, cv.el.height);
        NLA.chars.drawPreview(cv.ctx, cv.who, NLA.costumeFor(cv.who), cv.el.width / 2, cv.el.height - 18, cv.s, t);
      }
      if (wardrobeCanvas && wardrobeCanvas.offsetParent !== null) {
        wardrobeCtx.clearRect(0, 0, wardrobeCanvas.width, wardrobeCanvas.height);
        NLA.chars.drawPreview(wardrobeCtx, 'boy', NLA.costumeFor('boy'), wardrobeCanvas.width / 2 - 55, wardrobeCanvas.height - 22, 1.55, t);
        NLA.chars.drawPreview(wardrobeCtx, 'girl', NLA.costumeFor('girl'), wardrobeCanvas.width / 2 + 55, wardrobeCanvas.height - 22, 1.55, t + 0.5);
      }
    };

    function frame(ts) {
      if (!hasVisiblePreview()) {
        previewFrame = 0;
        return;
      }
      if (ts - lastPreview >= 1000 / 30) {
        render(ts / 1000);
        lastPreview = ts;
      }
      previewFrame = requestAnimationFrame(frame);
    }
    UI.refreshPreviews = function () {
      if (previewFrame || !hasVisiblePreview()) return;
      lastPreview = -Infinity;
      previewFrame = requestAnimationFrame(frame);
    };
    UI.refreshPreviews();
  }

  NLA.ui = UI;
})();

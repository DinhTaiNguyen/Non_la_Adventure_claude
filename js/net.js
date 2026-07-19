/* =====================================================================
   net.js — worldwide online co-op via PeerJS/WebRTC data channels.
   Direct ICE is preferred; configured TURN servers provide the relay path
   required by strict NATs, carrier networks and institutional firewalls.
   ===================================================================== */
(function () {
  const N = {
    active: false, isHost: false, peer: null, conn: null,
    code: null, myChar: 'boy', status: 'idle', transport: 'unknown',
    onMessage: null, onStatus: null,
    _sendAcc: 0, _peerLoad: null, _prepareIce: null,
    _iceServers: (NLA.NETWORK && NLA.NETWORK.iceServers || []).slice(),
    _token: 0, _joinTimer: 0, _heartbeat: 0, _lastSeen: 0,
  };

  N.hostSimObjects = () => !N.active || N.isHost;

  function makeCode() {
    const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 4; i++) s += abc[Math.floor(Math.random() * abc.length)];
    return s;
  }

  function setStatus(s, detail) {
    N.status = s;
    if (N.onStatus) N.onStatus(s, detail);
  }

  function urlsOf(server) {
    const urls = server && (server.urls || server.url);
    return Array.isArray(urls) ? urls : [urls || ''];
  }

  N.hasRelay = () => N._iceServers.some(server => urlsOf(server).some(url => /^turns?:/i.test(url)));
  N.available = () => typeof window.Peer === 'function';

  /* Two pinned CDN paths prevent one provider outage from disabling online
     play. The library remains lazy so solo/mobile startup stays light. */
  N.loadPeer = function () {
    if (N.available()) return Promise.resolve(true);
    if (N._peerLoad) return N._peerLoad;
    const sources = [
      'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js',
      'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
    ];
    N._peerLoad = new Promise((resolve) => {
      const tryNext = (idx) => {
        if (idx >= sources.length) { N._peerLoad = null; resolve(false); return; }
        const script = document.createElement('script');
        script.src = sources[idx]; script.async = true; script.crossOrigin = 'anonymous';
        script.onload = () => { N._peerLoad = null; resolve(N.available()); };
        script.onerror = () => { script.remove(); tryNext(idx + 1); };
        document.head.appendChild(script);
      };
      tryNext(0);
    });
    return N._peerLoad;
  };

  /* TURN providers should issue short-lived credentials from an endpoint.
     Static window.NLA_TURN_SERVERS also works for development. */
  N.prepare = function () {
    if (N._prepareIce) return N._prepareIce;
    const endpoint = NLA.NETWORK && NLA.NETWORK.turnEndpoint;
    if (!endpoint || typeof fetch !== 'function') return Promise.resolve(N._iceServers);
    N._prepareIce = (async () => {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = setTimeout(() => { if (controller) controller.abort(); }, 5500);
      try {
        const res = await fetch(endpoint, { cache: 'no-store', credentials: 'omit', signal: controller && controller.signal });
        if (!res.ok) throw new Error('TURN endpoint ' + res.status);
        const data = await res.json();
        const extra = Array.isArray(data) ? data : data && data.iceServers;
        if (Array.isArray(extra)) {
          const clean = extra.filter(s => s && (s.urls || s.url)).slice(0, 8);
          N._iceServers = (NLA.NETWORK.iceServers || []).concat(clean);
        }
      } catch (_) {
        /* STUN/direct mode remains available and UI explains relay status. */
      } finally { clearTimeout(timer); }
      return N._iceServers;
    })();
    return N._prepareIce;
  };

  function peerOptions() {
    return {
      debug: 1,
      config: {
        iceServers: N._iceServers,
        iceCandidatePoolSize: 4,
        sdpSemantics: 'unified-plan',
      },
    };
  }

  function attachPeerRecovery(peer) {
    peer.on('disconnected', () => {
      if (!peer.destroyed) {
        setTimeout(() => {
          try { if (peer.disconnected && !peer.destroyed) peer.reconnect(); } catch (_) {}
        }, 900);
      }
    });
  }

  N.host = async function (charChoice) {
    if (!N.available()) { setStatus('nopeer'); return; }
    N.cleanup();
    const token = N._token;
    N.isHost = true; N.myChar = charChoice; N.code = makeCode();
    setStatus('connecting');
    await N.prepare();
    if (token !== N._token) return;
    try { N.peer = new Peer('nla-love-' + N.code, peerOptions()); }
    catch (e) { setStatus('error', e); return; }
    attachPeerRecovery(N.peer);
    N.peer.on('open', () => setStatus('waiting', N.code));
    N.peer.on('connection', (conn) => {
      if (N.conn && N.conn.open) { conn.close(); return; }
      N.conn = conn;
      wireConn(conn, false);
    });
    N.peer.on('error', (err) => {
      if (err.type === 'unavailable-id') { setTimeout(() => N.host(charChoice), 120); return; }
      setStatus('error', err);
    });
  };

  N.join = async function (code) {
    if (!N.available()) { setStatus('nopeer'); return; }
    N.cleanup();
    const token = N._token;
    N.isHost = false; N.code = String(code || '').toUpperCase().trim();
    setStatus('connecting');
    await N.prepare();
    if (token !== N._token) return;
    try { N.peer = new Peer(peerOptions()); }
    catch (e) { setStatus('error', e); return; }
    attachPeerRecovery(N.peer);
    N.peer.on('open', () => attemptJoin(0, token));
    N.peer.on('error', (err) => {
      if (err.type === 'peer-unavailable') return; /* retry timer handles it */
      setStatus('error', err);
    });
  };

  function attemptJoin(attempt, token) {
    if (token !== N._token || !N.peer || N.peer.destroyed) return;
    if (attempt > 0) setStatus('retrying', attempt);
    const conn = N.peer.connect('nla-love-' + N.code, {
      reliable: true,
      serialization: 'json',
      metadata: { game: 'nonla', version: NLA.NETWORK.version },
    });
    let settled = false;
    const fail = () => {
      if (settled || token !== N._token) return;
      settled = true;
      try { conn.close(); } catch (_) {}
      if (attempt < 2) N._joinTimer = setTimeout(() => attemptJoin(attempt + 1, token), 650 + attempt * 450);
      else setStatus('joinfail');
    };
    N._joinTimer = setTimeout(fail, 10000 + attempt * 4500);
    conn.on('open', () => {
      if (settled || token !== N._token) { try { conn.close(); } catch (_) {} return; }
      settled = true; clearTimeout(N._joinTimer);
      N.conn = conn;
      wireConn(conn, true);
    });
    conn.on('error', fail);
  }

  async function detectTransport(conn) {
    const pc = conn && conn.peerConnection;
    if (!pc || typeof pc.getStats !== 'function') return 'unknown';
    try {
      const stats = await pc.getStats();
      let pair = null;
      stats.forEach(s => {
        if (s.type === 'transport' && s.selectedCandidatePairId && stats.get) pair = stats.get(s.selectedCandidatePairId);
        if (!pair && s.type === 'candidate-pair' && s.state === 'succeeded' && (s.nominated || s.selected)) pair = s;
      });
      if (!pair || !stats.get) return 'unknown';
      const local = stats.get(pair.localCandidateId), remote = stats.get(pair.remoteCandidateId);
      if ((local && local.candidateType === 'relay') || (remote && remote.candidateType === 'relay')) return 'relay';
      return 'direct';
    } catch (_) { return 'unknown'; }
  }

  function finishConnected(conn) {
    N.active = true; N._lastSeen = performance.now();
    N.sendMyName();
    startHeartbeat();
    Promise.race([
      detectTransport(conn),
      new Promise(resolve => setTimeout(() => resolve('unknown'), 1200)),
    ]).then(path => {
      if (!N.active || N.conn !== conn) return;
      N.transport = path;
      setStatus('connected', { path, relayConfigured: N.hasRelay() });
    });
  }

  function wireConn(conn, isGuest) {
    conn.on('data', (msg) => {
      N._lastSeen = performance.now();
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'ping') { N.send({ t: 'pong', at: msg.at }); return; }
      if (msg.t === 'pong') return;
      if (msg.t === 'hello' && N.isHost) {
        const guestChar = N.myChar === 'boy' ? 'girl' : 'boy';
        N.send({ t: 'welcome', yourChar: guestChar, version: NLA.NETWORK.version });
        finishConnected(conn);
      } else if (msg.t === 'welcome' && !N.isHost) {
        N.myChar = msg.yourChar;
        finishConnected(conn);
      } else if (N.onMessage) N.onMessage(msg);
    });
    conn.on('close', () => loseConnection(conn));
    conn.on('error', () => loseConnection(conn));
    if (isGuest) conn.send({ t: 'hello', version: NLA.NETWORK.version });
  }

  function startHeartbeat() {
    clearInterval(N._heartbeat);
    N._heartbeat = setInterval(() => {
      if (!N.active) return;
      if (performance.now() - N._lastSeen > 14000) { loseConnection(N.conn); return; }
      N.send({ t: 'ping', at: Date.now() });
    }, 3000);
  }

  function loseConnection(conn) {
    if (conn && N.conn && conn !== N.conn) return;
    if (N.active) {
      N.active = false; clearInterval(N._heartbeat);
      setStatus('lost');
    }
  }

  N.send = function (msg) {
    if (N.conn && N.conn.open) {
      try { N.conn.send(msg); } catch (_) {}
    }
  };

  N.sendMyName = function () { N.send({ t: 'name', v: NLA.name(N.myChar) }); };

  /* Player state at 18 Hz keeps overseas play responsive without flooding
     mobile networks. The host streams shared world state at 9 Hz. */
  N.tickPlayerSync = function (dt, player, game) {
    if (!N.active) return;
    N._sendAcc += dt;
    if (N._sendAcc < 1 / 18) return;
    N._sendAcc = 0;
    N.send({
      t: 'p',
      x: Math.round(player.x * 10) / 10, y: Math.round(player.y * 10) / 10,
      vx: Math.round(player.vx), vy: Math.round(player.vy),
      face: player.face, grounded: player.grounded,
      moving: Math.abs(player.vx) > 30 && player.grounded,
      shieldOn: player.shieldOn, channel: player.channel,
      channelLight: player.channelLight, pow1: !!player.holdingPow1,
      hp: player.hp, downed: !!player.downed, rescueHeld: !!player.rescueHeld,
      hatEnergy: Math.round(player.hatEnergy),
    });
    if (N.isHost && game) {
      N._objAcc = (N._objAcc || 0) + 1;
      if (N._objAcc >= 2) { N._objAcc = 0; game.sendWorldSnapshot(); }
    }
  };

  N.cleanup = function () {
    N._token++;
    N.active = false; N.transport = 'unknown'; N._sendAcc = 0;
    clearTimeout(N._joinTimer); clearInterval(N._heartbeat);
    if (N.conn) { try { N.conn.close(); } catch (_) {} N.conn = null; }
    if (N.peer) { try { N.peer.destroy(); } catch (_) {} N.peer = null; }
  };

  NLA.net = N;
})();

/* =====================================================================
   net.js — online co-op via PeerJS (WebRTC data channels).
   Host creates room "NLA-xxxx"; guest joins by 4-letter code.
   Design: each player simulates & owns their own character and streams
   its state; the HOST owns world objects/enemies and streams those.
   Game events (lantern lit, gates, love…) are broadcast & idempotent.
   ===================================================================== */
(function () {
  const N = {
    active: false, isHost: false, peer: null, conn: null,
    code: null, myChar: 'boy', status: 'idle',
    onMessage: null, onStatus: null,
    _sendAcc: 0,
    _peerLoad: null,
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

  N.available = () => typeof window.Peer === 'function';

  /* PeerJS is only needed for online co-op. Loading it on demand keeps the
     solo/local game fast and usable even when the CDN is unavailable. */
  N.loadPeer = function () {
    if (N.available()) return Promise.resolve(true);
    if (N._peerLoad) return N._peerLoad;
    N._peerLoad = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      script.async = true;
      script.onload = () => {
        N._peerLoad = null;
        resolve(N.available());
      };
      script.onerror = () => {
        script.remove();
        N._peerLoad = null;
        resolve(false);
      };
      document.head.appendChild(script);
    });
    return N._peerLoad;
  };

  N.host = function (charChoice) {
    if (!N.available()) { setStatus('nopeer'); return; }
    N.cleanup();
    N.isHost = true;
    N.myChar = charChoice;
    N.code = makeCode();
    setStatus('connecting');
    try {
      N.peer = new Peer('nla-love-' + N.code, { debug: 0 });
    } catch (e) { setStatus('error', e); return; }
    N.peer.on('open', () => setStatus('waiting', N.code));
    N.peer.on('connection', (conn) => {
      if (N.conn) { conn.close(); return; } /* room is for two 💞 */
      N.conn = conn;
      wireConn(conn);
    });
    N.peer.on('error', (err) => {
      if (err.type === 'unavailable-id') { N.host(charChoice); return; } /* code collision: reroll */
      setStatus('error', err);
    });
  };

  N.join = function (code, charPref) {
    if (!N.available()) { setStatus('nopeer'); return; }
    N.cleanup();
    N.isHost = false;
    N.code = code.toUpperCase().trim();
    setStatus('connecting');
    try {
      N.peer = new Peer({ debug: 0 });
    } catch (e) { setStatus('error', e); return; }
    N.peer.on('open', () => {
      const conn = N.peer.connect('nla-love-' + N.code, { reliable: true });
      let opened = false;
      const failTimer = setTimeout(() => { if (!opened) setStatus('joinfail'); }, 9000);
      conn.on('open', () => {
        opened = true;
        clearTimeout(failTimer);
        N.conn = conn;
        wireConn(conn, true);
      });
      conn.on('error', () => { clearTimeout(failTimer); setStatus('joinfail'); });
    });
    N.peer.on('error', (err) => {
      if (err.type === 'peer-unavailable') setStatus('joinfail');
      else setStatus('error', err);
    });
  };

  function wireConn(conn, isGuest) {
    conn.on('data', (msg) => {
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'hello' && N.isHost) {
        /* assign guest the other character */
        const guestChar = N.myChar === 'boy' ? 'girl' : 'boy';
        N.send({ t: 'welcome', yourChar: guestChar });
        N.active = true;
        setStatus('connected');
        N.sendMyName();
      } else if (msg.t === 'welcome' && !N.isHost) {
        N.myChar = msg.yourChar;
        N.active = true;
        setStatus('connected');
        N.sendMyName();
      } else if (N.onMessage) {
        N.onMessage(msg);
      }
    });
    conn.on('close', () => {
      if (N.active) {
        N.active = false;
        setStatus('lost');
      }
    });
    conn.on('error', () => {
      if (N.active) { N.active = false; setStatus('lost'); }
    });
    if (isGuest) conn.send({ t: 'hello' });
  }

  N.send = function (msg) {
    if (N.conn && N.conn.open) {
      try { N.conn.send(msg); } catch (e) {}
    }
  };

  /* tell the partner what my character is called */
  N.sendMyName = function () {
    N.send({ t: 'name', v: NLA.name(N.myChar) });
  };

  /* throttled player state sync (~15Hz) */
  N.tickPlayerSync = function (dt, player, game) {
    if (!N.active) return;
    N._sendAcc += dt;
    if (N._sendAcc < 1 / 15) return;
    N._sendAcc = 0;
    N.send({
      t: 'p',
      x: Math.round(player.x * 10) / 10, y: Math.round(player.y * 10) / 10,
      vx: Math.round(player.vx), vy: Math.round(player.vy),
      face: player.face, grounded: player.grounded,
      moving: Math.abs(player.vx) > 30 && player.grounded,
      shieldOn: player.shieldOn, channel: player.channel,
      channelLight: player.channelLight,
      pow1: !!player.holdingPow1,
    });
    /* host also streams world objects at lower rate */
    if (N.isHost && game) {
      N._objAcc = (N._objAcc || 0) + 1;
      if (N._objAcc >= 2) {
        N._objAcc = 0;
        game.sendWorldSnapshot();
      }
    }
  };

  N.cleanup = function () {
    N.active = false;
    if (N.conn) { try { N.conn.close(); } catch (e) {} N.conn = null; }
    if (N.peer) { try { N.peer.destroy(); } catch (e) {} N.peer = null; }
  };

  NLA.net = N;
})();

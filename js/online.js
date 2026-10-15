// Sky Brawl · online.js — ห้องออนไลน์ส่วนแรก (PeerJS)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Online (PeerJS / WebRTC): host simulates, guests send input and render snapshots ---------- */
// ถ้าเพื่อนบางคนต่อไม่ติด (เช่นเน็ตมือถือบางค่าย) ให้เพิ่ม TURN server ในรายการนี้ เช่น
// {urls:'turn:xxx.metered.live:80', username:'...', credential:'...'}
const ICE_SERVERS = [
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:global.stun.twilio.com:3478'},
  // No shared public TURN here: the old Open Relay credentials are dead, and a broken relay entry only slows the
  // direct link down. Add your own in config.js (network.rmsKey / turnApi / iceServers).
];
// config.js → network.iceServers (your own list) or network.turnApi (a Metered credentials URL) for a TURN relay you control
let TURN_OWN = false;
(function(){
  const N = (window.SKY_CONFIG && window.SKY_CONFIG.network) || {};
  if (Array.isArray(N.iceServers) && N.iceServers.length){ ICE_SERVERS.splice(0, ICE_SERVERS.length, ...N.iceServers); TURN_OWN = true; }
  if (typeof N.turnApi === 'string' && /^https:\/\//.test(N.turnApi)){
    fetch(N.turnApi).then(r => r.json()).then(list => {
      if (!Array.isArray(list) || !list.length) throw new Error('empty');
      ICE_SERVERS.splice(0, ICE_SERVERS.length, {urls:'stun:stun.l.google.com:19302'}, ...list); TURN_OWN = true;
      console.info('[config.js] TURN relay ready (' + list.length + ' servers)');
      if (!$('online').hidden) renderLobby();
    }).catch(e => console.warn('[config.js] network.turnApi failed', e));
  }
  // A Metered Realtime Messaging publishable key (pk_live_…) also works: its welcome message carries TURN credentials
  // when the app has a TURN service and "Auto-inject TURN" is on for the key.
  const pk = [N.rmsKey, N.turnApi].find(k => typeof k === 'string' && /^pk_live_[A-Za-z0-9]+$/.test(k.trim()));
  if (pk && typeof WebSocket === 'function'){
    let ws; try { ws = new WebSocket('wss://rms.metered.ca/v1?key=' + encodeURIComponent(pk.trim())); } catch(e){ console.warn('[config.js] rms failed', e); return; }
    const done = () => { clearTimeout(to); try { ws.close(); } catch(e){} };
    const to = setTimeout(() => { console.warn('[config.js] rms: no welcome within 8 s'); done(); }, 8000);
    ws.onmessage = ev => {
      let m; try { m = JSON.parse(ev.data); } catch(e){ return; }
      if (!m || m.type !== 'welcome') return;
      const list = m.metadata && m.metadata.iceServers;
      if (Array.isArray(list) && list.length){
        ICE_SERVERS.splice(0, ICE_SERVERS.length, {urls:'stun:stun.l.google.com:19302'}, ...list); TURN_OWN = true;
        console.info('[config.js] TURN relay ready via Metered key (' + list.length + ' servers)');
        if (!$('online').hidden) renderLobby();
      } else console.warn('[config.js] rms welcome had no iceServers: turn on a TURN service in Metered and "Auto-inject TURN" on this key');
      done();
    };
    ws.onerror = () => { console.warn('[config.js] rms connection failed'); done(); };
  }
})();
const ID_PREFIX = 'skybrawl-v1-';
const CODE_RE = /^[a-z0-9]{3,8}$/;
// Signalling hiccups (the phone backgrounded the page for the share sheet or to open LINE) must not end a room
const SOFT_ERRORS = new Set(['network', 'server-error', 'socket-error', 'socket-closed', 'disconnected', 'webrtc', 'peer-unavailable', 'unavailable-id']);
const PRES_KEYS = new Set(['r', 'nm', 'lk', 'in', 'tm', 'cfg', 'ph', 'ep', 'slots', 'sd', 'sn', 'res', 'win']);
function mergePres(target, patch){
  if (!patch || typeof patch !== 'object') return;
  for (const k of Object.keys(patch)){
    if (!PRES_KEYS.has(k)) continue;
    if (patch[k] === null) delete target[k]; else target[k] = patch[k];
  }
}
// Lobby without a server: whichever player holds the well-known lobby ID collects room ads and
// broadcasts the list; when that player leaves, the remaining players race to take the ID over.
const LOBBY_ID = 'skybrawl-lobby-v2';
function sanitizeRoom(r){
  if (!r || typeof r !== 'object' || !CODE_RE.test(String(r.code))) return null;
  return {code:String(r.code), nm:cleanName(r.nm, 'ผู้เล่น'), n:Math.max(0, Math.min(128, Number(r.n) || 0)),
    mx:Math.max(2, Math.min(128, Number(r.mx) || 2)), ph:['wait','play','end'].includes(r.ph) ? r.ph : 'wait'};
}
const PeerLobby = {
  active:false, peer:null, holder:null, conn:null, clients:new Map(), rooms:[], online:0, mine:null,
  retry:0, bcast:0, status:'', connected:false,
  start(){
    if (this.active || typeof window.Peer !== 'function') return;
    this.active = true; this.connect();
  },
  stop(){
    this.active = false; this.connected = false;
    clearTimeout(this.retry); clearInterval(this.bcast);
    for (const p of [this.conn]) if (p) try { p.close(); } catch (e) {}
    for (const p of [this.peer, this.holder]) if (p) try { p.destroy(); } catch (e) {}
    this.peer = this.holder = this.conn = null; this.clients.clear(); this.rooms = []; this.online = 0;
  },
  info(text){ this.status = text; if (!$('online').hidden) renderLobby(); },
  later(slow){
    clearTimeout(this.retry);
    if (this.active) this.retry = setTimeout(() => this.connect(), (slow ? 4000 : 300) + Math.random()*1200);
  },
  connect(){
    if (!this.active) return;
    if (!this.connected) this.info('กำลังเชื่อมต่อล็อบบี้…');
    const go = () => {
      if (!this.active) return;
      const conn = this.peer.connect(LOBBY_ID, {reliable:true, serialization:'json'});
      this.conn = conn;
      let opened = false;
      conn.on('open', () => { opened = true; this.connected = true; this.info(''); this.sendMine(); });
      conn.on('data', msg => this.onList(msg));
      conn.on('close', () => { if (this.conn === conn){ this.conn = null; this.connected = false; this.later(); } });
      conn.on('error', () => {});
      setTimeout(() => { if (this.conn === conn && !opened){ try { conn.close(); } catch (e) {} this.conn = null; this.later(true); } }, 7000);
    };
    if (this.peer && !this.peer.destroyed && this.peer.open){ go(); return; }
    if (this.peer) try { this.peer.destroy(); } catch (e) {}
    const peer = new Peer({config:{iceServers:ICE_SERVERS}, debug:0});
    this.peer = peer;
    peer.on('open', go);
    peer.on('error', err => {
      if (!this.active || this.peer !== peer) return;
      if (err.type === 'peer-unavailable'){ this.conn = null; this.claim(); }
      else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)){ this.info('ต่อเซิร์ฟเวอร์จับคู่ไม่ได้ กำลังลองใหม่…'); this.later(true); }
    });
    peer.on('disconnected', () => { if (this.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) {} });
  },
  claim(){
    if (!this.active || this.holder) return;
    const h = new Peer(LOBBY_ID, {config:{iceServers:ICE_SERVERS}, debug:0});
    this.holder = h;
    h.on('connection', c => {
      c.on('open', () => { this.clients.set(c.peer, {conn:c, room:null}); this.broadcast(); });
      c.on('data', msg => {
        const e = this.clients.get(c.peer);
        if (!e || !msg || msg.t !== 'room') return;
        e.room = sanitizeRoom(msg.room); this.broadcast();
      });
      const gone = () => { if (this.clients.delete(c.peer)) this.broadcast(); };
      c.on('close', gone); c.on('error', gone);
    });
    h.on('open', () => {
      clearInterval(this.bcast); this.bcast = setInterval(() => this.broadcast(), 4000);
      this.later();
    });
    h.on('error', () => {
      if (this.holder === h){ this.holder = null; try { h.destroy(); } catch (e) {} }
      this.later();
    });
    h.on('disconnected', () => { if (this.holder === h && !h.destroyed) try { h.reconnect(); } catch (e) {} });
  },
  broadcast(){
    const rooms = [...this.clients.values()].map(e => e.room).filter(Boolean);
    const msg = {t:'list', rooms, online:this.clients.size};
    for (const e of this.clients.values()) try { if (e.conn.open) e.conn.send(msg); } catch (err) {}
  },
  onList(msg){
    if (!msg || msg.t !== 'list' || !Array.isArray(msg.rooms)) return;
    this.rooms = msg.rooms.slice(0, 60).map(sanitizeRoom).filter(Boolean);
    this.online = Math.max(0, Number(msg.online) || 0);
    if (!$('online').hidden) renderLobby();
  },
  advertise(room){ this.mine = room; this.sendMine(); },
  sendMine(){ if (this.conn && this.conn.open) try { this.conn.send({t:'room', room:this.mine}); } catch (e) {} },
};

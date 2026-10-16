// Sky Brawl · relay.js — ระบบออนไลน์หลัก (Net) + relay ผ่าน Supabase
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Supabase relay: when two devices can't open a direct link, game messages go through Supabase Realtime ----------
   One channel per relayed guest (host + that guest only). Free Supabase allows ~100 realtime events a second for the whole
   project, and a relayed player costs ~35, so relay seats per room are capped (config.js network.relayMax). */
const NETCFG = (window.SKY_CONFIG && window.SKY_CONFIG.network) || {};
// config.js → online: room size. maxPlayers = fighters in a room (bots fill the empty seats), maxHumans = real players
const ONCFG = (window.SKY_CONFIG && window.SKY_CONFIG.online) || {};
const cfgInt = (v, lo, hi, def) => { const n = Math.round(Number(v)); if (v === '' || v === null || v === undefined || !Number.isFinite(n)) return def; if (n < lo || n > hi) console.warn('[config.js] online value out of range ' + lo + '–' + hi + ':', v); return Math.max(lo, Math.min(hi, n)); };
const ONLINE_MAX = cfgInt(ONCFG.maxPlayers, 2, 128, 64);
const ONLINE_HUMANS = Math.min(ONLINE_MAX, cfgInt(ONCFG.maxHumans, 2, 128, 64));
const RELAY_MODE = ['auto', 'always', 'off'].includes(NETCFG.supaRelay) ? NETCFG.supaRelay : 'auto';
const RELAY_MAX = Math.max(0, Math.min(20, Number.isFinite(+NETCFG.relayMax) && NETCFG.relayMax !== '' ? Math.round(+NETCFG.relayMax) : 3));
const RELAY_SNAP_MS = 95, RELAY_IN_MS = 110, RELAY_PING_MS = 3000, RELAY_DEAD_MS = 12000;
class RelayConn {
  constructor(peer, out, onClose){ Object.assign(this, {peer, out, onClose, open:false, closed:false, relay:true, h:{}, last:Date.now()}); }
  on(ev, fn){ (this.h[ev] = this.h[ev] || []).push(fn); return this; }
  emit(ev, a){ for (const fn of this.h[ev] || []) try { fn(a); } catch (e) { console.error(e); } }
  ready(){ if (this.open || this.closed) return; this.open = true; this.last = Date.now(); this.emit('open'); }
  got(m){ this.last = Date.now(); if (this.open && m) this.emit('data', m); }
  send(m){ if (this.open) this.out(m); }
  close(){ if (this.closed) return; this.closed = true; this.open = false; try { this.onClose(); } catch (e) {} this.emit('close'); }
}
const Relay = {
  hostCh:null, hostCode:'', guests:new Map(), mine:null, pingT:0,
  ok(){ return RELAY_MODE !== 'off' && RELAY_MAX > 0 && !!Supa.getClient(); },
  sub(topic, ev, status){
    const ch = Supa.client.channel(topic, {config:{broadcast:{self:false}}});
    for (const k of Object.keys(ev)) ch.on('broadcast', {event:k}, msg => ev[k]((msg && msg.payload) || {}));
    ch.subscribe(st => status && status(st));
    return ch;
  },
  say(ch, event, payload = {}){ if (ch) try { const r = ch.send({type:'broadcast', event, payload}); if (r && r.catch) r.catch(() => {}); } catch (e) {} },
  drop(ch){ if (ch) setTimeout(() => { try { Supa.client.removeChannel(ch); } catch (e) {} }, 300); },
  // Pings keep idle rooms alive and expose guests/hosts that vanished without saying goodbye
  tick(){
    const now = Date.now(), all = [...this.guests.values()].map(r => r.conn).concat(this.mine ? [this.mine] : []);
    for (const c of all){
      if (c.closed) continue;
      if (c.open && now - c.last > RELAY_DEAD_MS){ c.close(); continue; }
      if (c.open) c.ping();
    }
    if (!this.hostCh && !this.mine){ clearInterval(this.pingT); this.pingT = 0; }
  },
  pinging(){ if (!this.pingT) this.pingT = setInterval(() => this.tick(), RELAY_PING_MS); },

  hostStart(code){
    this.hostStop();
    if (!this.ok()) return;
    this.hostCode = code;
    this.hostCh = this.sub('sbr-' + code, {hello: p => this.onHello(p)});
    this.pinging();
  },
  hostStop(){
    for (const r of [...this.guests.values()]) r.conn.close();
    this.guests.clear();
    const ch = this.hostCh; this.hostCh = null; this.drop(ch);
  },
  onHello(p){
    const id = p.id;
    if (Net.role !== 'host' || !this.hostCh || typeof id !== 'string' || !/^[A-Za-z0-9_-]{4,64}$/.test(id)) return;
    const cur = this.guests.get(id);
    if (cur){ if (cur.subbed) this.say(cur.ch, 'ack'); return; }
    if (this.guests.size >= RELAY_MAX){ this.say(this.hostCh, 'full', {id}); return; }
    const rec = {subbed:false};
    rec.conn = new RelayConn(id, m => this.say(rec.ch, 'h', {m}), () => {
      if (this.guests.get(id) === rec) this.guests.delete(id);
      this.say(rec.ch, 'x'); this.drop(rec.ch);
    });
    rec.conn.ping = () => this.say(rec.ch, 'k');
    rec.ch = this.sub(`sbr-${this.hostCode}-${id}`, {g: q => rec.conn.got(q.m), k: () => rec.conn.got(null), x: () => rec.conn.close()}, st => {
      if (st === 'SUBSCRIBED'){ rec.subbed = true; this.say(rec.ch, 'ack'); rec.conn.ready(); }
      else if ((st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') && !rec.conn.open) rec.conn.close();
    });
    this.guests.set(id, rec);
    Net.onGuestConn(rec.conn);
  },

  // Guest: listen on our own channel, knock on the room channel until the host answers
  guestOpen(code, me){
    this.guestStop();
    let mineOk = false, roomOk = false, knockT = 0, room = null, ch = null;
    const conn = new RelayConn(code, m => this.say(ch, 'g', {m}), () => {
      clearInterval(knockT);
      if (this.mine === conn) this.mine = null;
      this.say(ch, 'x'); this.drop(ch); this.drop(room); room = null;
    });
    conn.ping = () => this.say(ch, 'k');
    const knock = () => { if (!conn.open && !conn.closed && mineOk && roomOk) this.say(room, 'hello', {id:me}); };
    ch = this.sub(`sbr-${code}-${me}`, {h: q => conn.got(q.m), k: () => conn.got(null), x: () => conn.close(),
      ack: () => { conn.ready(); clearInterval(knockT); const r = room; room = null; this.drop(r); }}, st => {
      if (st === 'SUBSCRIBED'){ mineOk = true; knock(); }
      else if ((st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') && !conn.open) conn.emit('error');
    });
    room = this.sub('sbr-' + code, {full: p => { if (p.id === me && !conn.open) conn.emit('full'); }}, st => { if (st === 'SUBSCRIBED'){ roomOk = true; knock(); } });
    knockT = setInterval(knock, 2000);
    this.mine = conn; this.pinging();
    return conn;
  },
  guestStop(){ if (this.mine) this.mine.close(); this.mine = null; },
};

const Net = {
  ready:false, peer:null, me:null, role:null, code:null, conns:new Map(), hostConn:null, myPres:{}, hostPres:{},
  ph:'wait', epoch:0, slots:[], botLooks:[], inMap:new Map(), counts:{a:0, j:0, g:0, s:0, l:0, pa:false, pj:false, pg:false, ps:false, pl:false}, lastIn:'',
  resShown:-1, cfg:null, joinTimer:0, gotHost:false,

  init(){
    this.ready = typeof window.Peer === 'function';
    this.setStatus(this.ready ? 'on' : 'off', this.ready ? 'พร้อมเล่นออนไลน์' : 'โหลดระบบออนไลน์ไม่ได้ ตรวจอินเทอร์เน็ตแล้วรีเฟรช');
  },
  setStatus(cls, text){ const s = $('onStatus'); s.className = 'status ' + cls; s.textContent = text; },
  heal(){
    const p = this.peer;
    if (p && !p.destroyed && p.disconnected) try { p.reconnect(); } catch (e) {}
  },
  healSoon(ms = 2500){ clearTimeout(this.healT); this.healT = setTimeout(() => this.heal(), ms); },
  newPeer(id){
    const opts = {config:{iceServers:ICE_SERVERS}, debug:0};
    return id ? new Peer(id, opts) : new Peer(opts);
  },
  send(conn, msg){ try { if (conn && conn.open) conn.send(msg); } catch (e) {} },
  presence(patch){
    mergePres(this.myPres, patch);
    const msg = {t:'p', d:patch};
    if (this.role === 'host') for (const e of this.conns.values()) this.send(e.conn, msg);
    else if (this.role === 'guest') this.send(this.hostConn, msg);
  },
  // The player changed their look in the lobby or room: tell the host (or, as host, everyone) so the slot list shows it
  lookChanged(){
    if (this.role === 'host') this.refreshSlots();
    else if (this.role === 'guest') this.presence({nm:LOOKS[0].name, lk:encLook(LOOKS[0])});
  },
  cleanup(){
    clearTimeout(this.joinTimer); clearTimeout(this.healT); this.lostAt = 0;
    if (this.role === 'host') for (const e of this.conns.values()) this.send(e.conn, {t:'bye'});
    Lobby.advertise(null);
    const p = this.peer; this.peer = null;
    for (const e of this.conns.values()) try { e.conn.close(); } catch (err) {}
    this.conns.clear();
    if (this.hostConn) try { this.hostConn.close(); } catch (err) {}
    this.hostConn = null;
    if (p) try { p.destroy(); } catch (err) {}
    Relay.hostStop(); Relay.guestStop();
    Object.assign(this, {role:null, code:null, me:null, myPres:{}, hostPres:{}, slots:[], sides:[], gotHost:false, viaRelay:false});
    G.net = null;
  },
  leave(msg){
    this.cleanup();
    if (location.hash || location.search) history.replaceState(null, '', location.pathname);
    if (msg){
      hideAllPanels(); enterAttract();
      $('online').hidden = false; showLobbyView(); showOnMsg(msg);
    }
  },
  inviteLink(){ return roomUrl(this.code); },

  create(tries = 0){
    if (!this.ready) return;
    const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
    const code = Array.from({length:5}, () => abc[Math.random()*abc.length | 0]).join('');
    this.cleanup();
    showOnMsg('กำลังสร้างห้อง…');
    const peer = this.newPeer(ID_PREFIX + code); this.peer = peer;
    peer.on('open', id => {
      if (this.peer !== peer || this.role === 'host') return;
      Object.assign(this, {role:'host', code, me:id, ph:'wait', epoch:0, botLooks:[], myPres:{}});
      G.net = 'host'; G.cfg.n = 2;
      Relay.hostStart(code);
      this.computeSlots(); this.publishRoom();
      showRoomView();
    });
    peer.on('connection', conn => this.onGuestConn(conn));
    peer.on('close', () => { if (this.peer === peer && this.role === 'host') this.leave('ห้องปิดไปแล้ว ลองสร้างห้องใหม่'); });
    peer.on('error', err => {
      if (this.peer !== peer) return;
      if (this.role === 'host' && SOFT_ERRORS.has(err.type)){ this.healSoon(); return; }
      if (err.type === 'unavailable-id' && tries < 3){ this.create(tries + 1); return; }
      this.leave(this.role ? `การเชื่อมต่อมีปัญหา (${err.type})` : `สร้างห้องไม่สำเร็จ (${err.type}) ลองใหม่อีกครั้ง`);
    });
    peer.on('disconnected', () => { if (this.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) {} });
  },
  onGuestConn(conn){
    if (this.role !== 'host'){ try { conn.close(); } catch (e) {} return; }
    const entry = {conn, pres:{}};
    conn.on('open', () => {
      this.conns.set(conn.peer, entry); this.send(conn, {t:'p', d:this.myPres});
      if (G.mode === 'play') for (const f of G.fighters) if (f.peer === conn.peer && f.ctrl === 'bot'){ f.ctrl = 'net'; f.nc = null; feed(`${f.name} กลับเข้าห้องแล้ว`); }
    });
    conn.on('data', msg => {
      if (!msg || msg.t !== 'p' || !msg.d || typeof msg.d !== 'object') return;
      const d = {};
      for (const k of ['r', 'nm', 'lk', 'in', 'tm', 'ch']) if (k in msg.d) d[k] = msg.d[k];
      mergePres(entry.pres, d);
      if (('nm' in d || 'lk' in d || 'r' in d || 'tm' in d) && this.ph === 'wait' && G.mode !== 'play') this.refreshSlots();
    });
    const gone = () => {
      if (this.conns.get(conn.peer) !== entry) return;
      this.conns.delete(conn.peer);
      if (G.mode === 'play'){
        for (const f of G.fighters) if (f.ctrl === 'net' && f.peer === conn.peer){ f.ctrl = 'bot'; feed(`${f.name} หลุดจากห้อง บอทเล่นแทน`); }
      } else this.refreshSlots();
    };
    conn.on('close', gone); conn.on('error', gone);
  },
  refreshSlots(){
    const before = JSON.stringify([this.slots, this.sides]);
    this.computeSlots();
    if (JSON.stringify([this.slots, this.sides]) !== before) this.publishRoom();
    if (!$('roomView').hidden) renderRoomView();
  },
  guests(){
    return [...this.conns.entries()].filter(([, e]) => e.pres.r === 'g').map(([peer, e]) => ({peer, presence:e.pres}));
  },
  computeSlots(){
    const tmOf = v => v === 0 || v === 1 ? v : -1;
    const humans = [{peer:this.me || '', nm:LOOKS[0].name, lk:encLook(LOOKS[0]), tm:tmOf(G.myTeam)}]
      .concat(this.guests().slice(0, ONLINE_HUMANS - 1).map(p => ({peer:p.peer, nm:cleanName(p.presence.nm, 'ผู้เล่น'), lk:Array.isArray(p.presence.lk) ? p.presence.lk.slice(0, 9) : null, tm:tmOf(p.presence.tm)})));
    const n = Math.min(ONLINE_MAX, Math.max(G.cfg.n, humans.length));
    const slots = humans.map(h => [h.peer, h.nm, h.lk]);
    for (let i = humans.length, b = 1; i < n; i++, b++){
      if (!this.botLooks[b]) this.botLooks[b] = 1 + Math.floor(Math.random()*1e6);
      slots.push(['', this.botLooks[b]]);
    }
    this.slots = slots;
    const sides = new Array(n).fill(-1), cnt = [0, 0], fill = i => { const sd = cnt[0] <= cnt[1] ? 0 : 1; sides[i] = sd; cnt[sd]++; };
    humans.forEach((h, i) => { if (h.tm >= 0){ sides[i] = h.tm; cnt[h.tm]++; } });
    humans.forEach((h, i) => { if (h.tm < 0) fill(i); });
    for (let i = humans.length; i < n; i++) fill(i);
    this.sides = sides;
  },
  adv(){
    // !peer: cleanup has started; closing the guests' connections must not re-list the room
    if (this.role !== 'host' || !this.peer) return;
    Lobby.advertise({code:this.code, nm:LOOKS[0].name, n:this.slots.filter(x => x[0]).length, mx:this.slots.length, ph:this.ph});
  },
  publishRoom(){
    if (this.role !== 'host') return;
    this.presence({r:'h', nm:LOOKS[0].name, cfg:[G.cfg.n, G.cfg.st, DIFF_KEYS.indexOf(G.cfg.df), STAGE_KEYS.indexOf(G.cfg.stage), MODE_KEYS.indexOf(G.cfg.mode)], ph:this.ph, ep:this.epoch, slots:this.slots, sd:this.sides});
    this.adv();
  },
  start(){
    this.computeSlots();
    this.epoch++; this.ph = 'play';
    const specs = this.slots.map((sl, i) => {
      const [peer, nm, lk] = sl;
      const side = this.sides[i];
      if (i === 0) return {name:nm, ctrl:'p1', look:LOOKS[0], side};
      if (peer) return {name:nm, ctrl:'net', peer, look:decLook(lk, nm), side};
      const bn = slotName(sl, i);
      return {name:bn, ctrl:'bot', look:seededLook(Number(nm) || i, bn), side};
    });
    this.presence({ph:'play', ep:this.epoch, slots:this.slots, sd:this.sides, cfg:[G.cfg.n, G.cfg.st, DIFF_KEYS.indexOf(G.cfg.df), STAGE_KEYS.indexOf(G.cfg.stage), MODE_KEYS.indexOf(G.cfg.mode)], res:null, win:null, sn:null});
    this.adv();
    setStage(stageFor(G.cfg.stage, G.cfg.mode));
    beginMatch(specs, G.cfg.st);
  },
  readInputs(){
    this.inMap = new Map();
    for (const [peer, e] of this.conns) if (Array.isArray(e.pres.in)) this.inMap.set(peer, e.pres.in);
  },
  applyInput(f){
    const a = this.inMap.get(f.peer), inp = f.input;
    if (!a){ inp.x = inp.z = 0; inp.atk = inp.jump = inp.grab = inp.guard = inp.skill = inp.lock = false; return; }
    const num = k => Number(a[k]) || 0;
    let x = Math.max(-1, Math.min(1, num(0)/100)), z = Math.max(-1, Math.min(1, num(1)/100));
    const m = Math.hypot(x, z); if (m > 1){ x /= m; z /= m; }
    inp.x = x; inp.z = z; inp.guard = num(2) === 1; f.netAuto = num(8) === 1; inp.sprint = num(9) === 1;
    if (!f.nc) f.nc = {a:num(3), j:num(4), g:num(5), s:num(6), l:num(7)};
    inp.atk = num(3) !== f.nc.a; inp.jump = num(4) !== f.nc.j; inp.grab = num(5) !== f.nc.g; inp.skill = num(6) !== f.nc.s; inp.lock = num(7) !== f.nc.l;
    f.nc = {a:num(3), j:num(4), g:num(5), s:num(6), l:num(7)};
    if (f.ne === undefined) f.ne = num(10); else if (num(10) !== f.ne){ f.ne = num(10); doEmote(f, Math.min(EMOTE_PICK - 1, Math.max(0, num(11)))); }
  },
  encF(f){
    const r = v => Math.round(v);
    const flags = (f.weapon ? 1 : 0) | (f.held ? 2 : 0) | (f.invuln > 0 ? 4 : 0) | (f.onGround ? 8 : 0) | (f.rage > 0 ? 16 : 0) | (f.chill > 0 ? 32 : 0) | (f.shock > 0 ? 64 : 0) | (f.formT > 0 ? 128 : 0) | (f.apeT > 0 ? 256 : 0) | (f.zombie ? 512 : 0) | (f.poison && f.poison.length ? 1024 : 0);
    return [r(f.pos.x*100), r(f.pos.y*100), r(f.pos.z*100), r(f.vel.x*10), r(f.vel.y*10), r(f.vel.z*10), r(f.facing*100),
      STATES.indexOf(f.state), Math.min(f.stateT, 999), Math.ceil(Math.max(0, f.hp)), f.stocks, flags, f.move ? MOVE_KEYS.indexOf(f.moveKey) : -1, f.weaponUses, f.lr, WEAPONS.indexOf(f.weapon), Math.ceil(f.skillCd/6), f.lock ? f.lock.idx : -1, Math.round(f.stam), f.emo && f.emo.until > G.frame ? f.emoSeq*16 + f.emo.id : 0, f.stolen ? OUTFIT_K.indexOf(f.stolen) : -1];
  },
  // 30 / 20 / 15 / 10 / 7.5 snapshots a second for up to 8 / 16 / 32 / 63 / 123 guests
  sendEvery(){ const g = this.conns.size; return g <= 8 ? 2 : g <= 16 ? 3 : g <= 32 ? 4 : g <= 63 ? 6 : 8; },
  // Rough upload the host needs in Mbit/s: ~60 bytes per fighter + overhead, per guest, per snapshot
  uploadMbps(fighters, guests){ const every = guests <= 8 ? 2 : guests <= 16 ? 3 : guests <= 32 ? 4 : guests <= 63 ? 6 : 8; return (60*fighters + 400)*(60/every)*guests*8/1e6; },
  hostSend(){
    if (this.role !== 'host') return;
    const r = v => Math.round(v*100);
    const sn = {cd:G.countdown, f:G.fighters.map(f => this.encF(f)),
      it:G.items.slice(0, 10).map(it => [it.id, ITEM_TYPES.indexOf(it.type), r(it.pos.x), r(it.pos.y), r(it.pos.z), it.landed ? 1 : 0, it.t > 60*17 ? 1 : 0]),
      b:G.bombs.slice(0, 16).map(b => [b.id, r(b.pos.x), r(b.pos.y), r(b.pos.z), b.kind === 'meteor' ? 1 : b.kind === 'grenade' ? 2 : 0]),
      zn:G.zones.slice(0, 8).map(zn => [zn.id, r(zn.x), r(zn.z), Math.round(zn.r*10), ZONE_KINDS.indexOf(zn.kind), r(zn.y || 0), zn.sink ? 100 + zn.sink : zn.sw || 0, Math.round((zn.rot || 0)*100)]),
      bl:G.bullets.slice(0, 24).map(b => [b.id, r(b.pos.x), r(b.pos.y), r(b.pos.z), Math.round(b.vel.x*10), Math.round(b.vel.z*10), PROJ_KINDS.indexOf(b.kind || 'bullet')]),
      tu:G.turrets.slice(0, 16).map(t => [t.id, r(t.pos.x), r(t.pos.z), Math.round(t.rot*100)]),
      gh:G.ghosts.slice(0, 16).map(g => [g.id, r(g.pos.x), r(g.pos.z), Math.round(g.rot*100), g.sw]),
      em:G.stones.map(st => Math.ceil(st.hp)),
      bs:G.boss ? [Math.round(G.boss.pos.x*100), Math.round(G.boss.pos.z*100), Math.ceil(G.boss.hp), BOSS_STATES.indexOf(G.boss.state), G.boss.t, Math.round(G.boss.facing*100)] : null,
      lv:STAGE_KEY === 'volcano' ? [LAVA.sunk, LAVA.t] : null, ct:chatForSnap(), mc:mechsForSnap(), zb:G.zombie ? [G.zbT | 0, G.zbStarted ? 1 : 0] : null};
    // Snapshots replace each other, so a guest whose channel is backed up just skips this one instead of piling up lag
    const patch = {ph:this.ph, sn};
    mergePres(this.myPres, patch);
    const msg = {t:'p', d:patch};
    for (const e of this.conns.values()){
      const dc = e.conn.dataChannel;
      if (dc && dc.bufferedAmount > 65536) continue;
      if (e.conn.relay){ const t = performance.now(); if (t - (e.conn.snapT || 0) < RELAY_SNAP_MS) continue; e.conn.snapT = t; }
      this.send(e.conn, msg);
    }
  },
  hostEnd(rows, win){
    this.ph = 'end';
    const res = G.fighters.map(f => { const row = rows.find(x => x.f === f); return [row.place, row.kos, row.dmg]; });
    this.hostSend();
    this.presence({ph:'end', res, win});
    this.adv();
  },
  backToRoom(){
    if (this.role === 'host'){ this.ph = 'wait'; this.computeSlots(); this.publishRoom(); }
    hideAllPanels(); enterAttract(); showRoomView();
  },

  join(code){
    if (!this.ready) return;
    code = String(code || '').trim().toLowerCase();
    if (!CODE_RE.test(code)){ showOnMsg('รหัสห้องต้องเป็นตัวอักษรภาษาอังกฤษตัวเล็กหรือตัวเลข 3–8 ตัว'); return; }
    this.cleanup();
    showOnMsg(`กำลังเข้าห้อง ${code}…`);
    const peer = this.newPeer(); this.peer = peer;
    const started = Date.now();
    const relayOk = Relay.ok();
    this.viaRelay = RELAY_MODE === 'always' && relayOk;
    const bind = conn => {
      conn.on('open', () => {
        if (this.hostConn !== conn) return;
        this.myPres = {};
        // counters carry over from earlier connections; sending zeros would register as a phantom button press on the host
        const c = this.counts;
        this.lastIn = '';
        this.presence({r:'g', nm:LOOKS[0].name, lk:encLook(LOOKS[0]), tm:G.myTeam, in:[0,0,0,c.a,c.j,c.g,c.s,c.l,G.autoLock ? 1 : 0,0]});
        if (G.mode !== 'play') showRoomView();
      });
      conn.on('data', msg => {
        if (this.hostConn !== conn || !msg) return;
        if (msg.t === 'bye'){ this.leave('host ออกจากห้องแล้ว'); return; }
        if (msg.t !== 'p' || !msg.d || typeof msg.d !== 'object') return;
        if (this.lostAt){ this.lostAt = 0; showOnMsg(''); if (G.mode === 'play') feed('ต่อกลับเข้าห้องแล้ว'); }
        mergePres(this.hostPres, msg.d);
        this.gotHost = true;
        this.applyHost(this.hostPres);
      });
      conn.on('close', () => { if (this.hostConn === conn) lost(this.gotHost ? 'drop' : 'ice'); });
      conn.on('error', () => {
        if (this.hostConn !== conn || conn.open) return;
        if (relayOk && !conn.relay){ this.viaRelay = true; connectRelay(); } else lost('ice');
      });
    };
    // Through Supabase instead of a direct link: slower, but works on any network that can see the lobby
    const connectRelay = () => {
      if (this.peer !== peer) return;
      const old = this.hostConn; this.hostConn = null;   // cleared first so the old link's close event isn't taken as a drop
      if (old) try { old.close(); } catch (e) {}
      const conn = Relay.guestOpen(code, this.me);
      this.hostConn = conn; bind(conn);
      conn.on('full', () => { if (this.hostConn === conn) this.leave(`ห้อง ${code} ที่นั่งทางสำรองเต็มแล้ว ลองต่อ Wi-Fi แล้วเข้าใหม่ หรือรอให้มีคนออกก่อน`); });
      if (!this.gotHost) showOnMsg(`กำลังเข้าห้อง ${code} ผ่านเซิร์ฟเวอร์สำรอง…`);
      clearTimeout(this.joinTimer);
      const t0 = Date.now();
      const watch = () => {
        if (this.hostConn !== conn || conn.open) return;
        // No answer: go back to trying the direct link next round (the host may just have been away)
        if (Date.now() - t0 > 20000){ this.viaRelay = RELAY_MODE === 'always'; return lost('nohost'); }
        this.joinTimer = setTimeout(watch, 1000);
      };
      this.joinTimer = setTimeout(watch, 1000);
    };
    const connect = () => {
      if (this.peer !== peer) return;
      if (this.viaRelay) return connectRelay();
      const old = this.hostConn; this.hostConn = null;
      if (old) try { old.close(); } catch (e) {}
      const conn = peer.connect(ID_PREFIX + code, {reliable:true, serialization:'json'});
      this.hostConn = conn; bind(conn);
      // Phones on mobile data can take well over 8 s to finish connecting; only give up on a real failure or after 25 s.
      // With the Supabase relay available, a direct link that isn't up after 12 s (the old, known-good join timeout) hands over to it.
      clearTimeout(this.joinTimer);
      const t0 = Date.now();
      const watch = () => {
        if (this.hostConn !== conn || conn.open) return;
        const pc = conn.peerConnection, ice = pc && pc.iceConnectionState;
        const failed = ice === 'failed' || ice === 'closed';
        if (relayOk && (failed || Date.now() - t0 > 12000)){ this.viaRelay = true; return connectRelay(); }
        if (failed) return lost('ice');
        if (Date.now() - t0 > 25000) return lost(pc && pc.remoteDescription ? 'ice' : 'nohost');
        this.joinTimer = setTimeout(watch, 1000);
      };
      this.joinTimer = setTimeout(watch, 1000);
    };
    // Before the first contact: keep knocking for a minute (the host may be in LINE sending the link).
    // After it: the host's page may have been in the background; try to reconnect for 30 seconds.
    // why: 'nohost' = the signalling server doesn't know the room (host page closed/backgrounded),
    //      'ice' = found the host but the two networks can't open a direct link (needs a TURN relay), 'drop' = lost mid-game
    const NETMSG = {
      nohost:`ยังไม่พบห้อง ${code} บนเซิร์ฟเวอร์ host ต้องเปิดหน้าเกมค้างไว้ (ถ้าสลับไปแอปอื่นอยู่ จะเข้าได้เมื่อ host กลับมา)`,
      ice:`เจอห้อง ${code} แล้ว แต่เน็ตของสองเครื่องต่อถึงกันตรงๆ ไม่ได้ (มักเป็นเน็ตมือถือ) กำลังลองใหม่…`,
    };
    const lost = (why = 'nohost') => {
      if (this.peer !== peer) return;
      const now = Date.now();
      this.lastWhy = why;
      if (this.gotHost){
        if (!this.lostAt){ this.lostAt = now; if (G.mode === 'play') feed('หลุดจาก host กำลังต่อกลับ…'); }
        if (now - this.lostAt > 30000){ this.leave('หลุดจากห้อง host อาจปิดหน้าเกมไปแล้ว'); return; }
      } else if (now - started > 60000){
        this.leave(why === 'ice'
          ? `ต่อเข้าห้อง ${code} ไม่ได้: เน็ตของคุณกับ host ต่อกันตรงๆ ไม่ได้ ลองให้คนใดคนหนึ่งเปลี่ยนไปใช้ Wi-Fi หรือให้เจ้าของเกมตั้ง TURN relay ใน config.js`
          : `ไม่พบห้อง ${code} host อาจปิดหน้าเกมไปแล้ว หรือรหัสห้องผิด`);
        return;
      }
      else showOnMsg(NETMSG[why] || NETMSG.nohost);
      clearTimeout(this.joinTimer); this.joinTimer = setTimeout(connect, 2500);
    };
    peer.on('open', id => {
      if (this.peer !== peer) return;
      if (this.role === 'guest'){ if (!this.hostConn || !this.hostConn.open) connect(); return; }
      Object.assign(this, {role:'guest', code, me:id, hostPres:{}, slots:[], epoch:-1, resShown:-1, lastIn:'', myPres:{}, gotHost:false, lostAt:0});
      this.counts = {a:0, j:0, g:0, s:0, l:0, pa:false, pj:false, pg:false, ps:false, pl:false};
      G.net = 'guest';
      connect();
    });
    peer.on('error', err => {
      if (this.peer !== peer) return;
      if (err.type === 'peer-unavailable'){ if (!this.viaRelay) lost('nohost'); return; }
      if (this.role === 'guest' && SOFT_ERRORS.has(err.type)){ this.healSoon(); return; }
      this.leave(`เชื่อมต่อไม่สำเร็จ (${err.type})`);
    });
    peer.on('disconnected', () => { if (this.peer === peer && !peer.destroyed) this.healSoon(500); });
  },
  applyHost(p){
    if (!p || typeof p !== 'object') return;
    if (Array.isArray(p.slots)) this.slots = p.slots.slice(0, 128);
    if (Array.isArray(p.sd)) this.sides = p.sd.slice(0, 128).map(v => v === 0 || v === 1 ? v : -1);
    if (Array.isArray(p.cfg)) this.cfg = p.cfg;
    const stk = Array.isArray(p.cfg) && STAGE_KEYS[Number(p.cfg[3])] ? stageFor(STAGE_KEYS[Number(p.cfg[3])], MODE_KEYS[Number(p.cfg[4])]) : null;
    if (stk && stk !== STAGE_KEY && G.mode !== 'play'){ setStage(stk); if (G.mode === 'menu') enterAttract(); }
    if (p.ph === 'wait'){
      if (G.mode === 'play' && $('result').hidden){ this.backToRoom(); return; }
      if (!$('roomView').hidden) renderRoomView();
    } else if (p.ph === 'play' || p.ph === 'end'){
      if (G.mode !== 'play' || this.epoch !== p.ep){ this.epoch = p.ep; this.guestStart(p); }
      if (p.sn) this.applySnap(p.sn);
      if (p.ph === 'end' && Array.isArray(p.res) && this.resShown !== this.epoch){
        this.resShown = this.epoch;
        const rows = G.fighters.map((f, i) => { const r = Array.isArray(p.res[i]) ? p.res[i] : [i + 1, 0, 0]; return {f, place:Number(r[0]) || i + 1, kos:Number(r[1]) || 0, dmg:Number(r[2]) || 0}; });
        if (p.win === -30 || p.win === -31) G.zbWin = -30 - p.win;
        else if (p.win === -20 || p.win === -21) G.raidWin = p.win === -20;
        else if (Number.isInteger(p.win) && p.win <= -10) G.winTeam = Math.min(1, -10 - p.win);
        G.endT = 1; showResult(rows, Number.isInteger(p.win) && p.win >= 0 ? p.win : undefined);
      }
    }
  },
  guestStart(p){
    const st = Array.isArray(p.cfg) ? Math.max(1, Math.min(3, Number(p.cfg[1]) || 2)) : 2;
    const specs = this.slots.map(s => {
      const peer = typeof s[0] === 'string' ? s[0] : '', isBot = !peer && s.length === 2, nm = isBot ? slotName(s, this.slots.indexOf(s)) : cleanName(s[1], 'ผู้เล่น');
      const me = !!peer && peer === this.me;
      const side = (this.sides || [])[this.slots.indexOf(s)];
      return {name:nm, ctrl:'remote', peer, me, side, look:me ? LOOKS[0] : isBot ? seededLook(Number(s[1]) || 1, nm) : decLook(s[2], nm)};
    });
    G.cfg.mode = Array.isArray(p.cfg) ? modeOf(MODE_KEYS[Number(p.cfg[4])]) : 'ffa';
    setStage(stageFor(STAGE_KEYS[Array.isArray(p.cfg) ? Number(p.cfg[3]) : 0] || 'titanic', G.cfg.mode));
    beginMatch(specs, st);
    G.me = G.fighters.findIndex(f => f.isLocal);
    for (const f of G.fighters) f.netInit = false;
    if (G.me < 0) feed('คุณเข้ามาตอนแข่งอยู่ กำลังดูรอบนี้ รอบหน้าได้ลงแข่ง');
  },
  applySnap(sn){
    if (!sn || !Array.isArray(sn.f)) return;
    if (Number.isFinite(sn.cd)){ G.countdown = sn.cd; cdBanner(sn.cd); }
    chatFromSnap(sn.ct);
    mechsFromSnap(sn.mc);
    if (Array.isArray(sn.zb)){ G.zbT = Number(sn.zb[0]) || 0; G.zbStarted = !!sn.zb[1]; }
    if (Array.isArray(sn.lv)){ LAVA.sunk = Math.max(0, Math.min(VOL_RADII.length - 1, sn.lv[0] | 0)); LAVA.t = Math.max(0, sn.lv[1] | 0); }
    sn.f.forEach((a, i) => {
      const f = G.fighters[i]; if (!f || !Array.isArray(a)) return;
      const n = k => Number(a[k]) || 0;
      const st = STATES[n(7)] || 'idle', hp = n(9), stk = n(10), fl = n(11);
      if (f.netInit){
        if (hp < f.hp - .5 && st !== 'respawn'){
          const at = new V(f.pos.x, f.pos.y + .9, f.pos.z);
          popup(at, String(Math.round(f.hp - hp))); emit(at, 9, 0xffe066, 5, 3, 20, 1.4, 6); flash(at, 0xffffff, .25, 1, 7);
          f.squash = 10; if (f.isLocal) G.shake = Math.max(G.shake, .3);
          Sfx.play(f.hp - hp >= 9 ? 'smash' : f.hp - hp >= 5 ? 'hit' : 'punch', at);
        }
        if (stk < f.stocks){ f.stocks = stk; announceLoss(f, n(14) === 1 ? 'ring' : 'ko', null); if (n(14) !== 1) Sfx.play('ko', f.pos); }
      }
      f.netPos.set(n(0)/100, n(1)/100, n(2)/100); f.netVel.set(n(3)/10, n(4)/10, n(5)/10);
      if (!f.netInit || f.pos.distanceTo(f.netPos) > 4 || (st === 'respawn' && f.state !== 'respawn')){ f.pos.copy(f.netPos); f.splashed = f.pos.y < SEA_Y; }
      f.netInit = true;
      f.facing = n(6)/100;
      const mk = MOVE_KEYS[n(12)] || '';
      if (st !== f.state || mk !== f.moveKey){
        if (f.netInit && st === 'attack' && mk && MOVES[mk]) Sfx.move(f, MOVES[mk]);
        else if (f.netInit && st === 'down' && f.state === 'tumble') Sfx.play('land', f.pos);
        f.state = st; f.stateT = n(8); f.moveKey = mk; f.move = mk ? ((fl & 16) && !MOVES[mk].skill ? rageMove(MOVES[mk]) : MOVES[mk]) : null; if (mk) f.lastMove = mk;
      }
      else if (Math.abs(f.stateT - n(8)) > 6) f.stateT = n(8);
      f.hp = hp; f.stocks = stk; f.stun = 18;
      f.weapon = a.length > 15 ? (WEAPONS[n(15)] || null) : (fl & 1 ? 'hammer' : null); f.held = fl & 2 ? 'bomb' : null; f.invuln = fl & 4 ? 10 : 0; f.onGround = !!(fl & 8);
      f.weaponUses = n(13); f.skillCd = n(16)*6; f.rage = fl & 16 ? 30 : 0; f.chill = fl & 32 ? 30 : 0; f.shock = fl & 64 ? 30 : 0; { const was = f.formT > 0; f.formT = fl & 128 ? 30 : 0; if ((f.formT > 0) !== was) f.formT > 0 ? formFx(f) : endForm(f); } { const was = f.apeT > 0; f.apeT = fl & 256 ? 30 : 0; if ((f.apeT > 0) !== was){ if (f.apeT > 0){ apeFx(f); f.apeIntro = 50; } else endApe(f); } } zombieFromSnap(f, !!(fl & 512)); f.poisonVis = !!(fl & 1024); f.stolen = a.length > 20 && n(20) >= 0 ? OUTFIT_K[n(20)] || null : null; f.lockIdx = a.length > 17 ? n(17) : -1; f.stam = a.length > 18 ? n(18) : 100;
      if (a.length > 19){ const ec = n(19); if (ec && ec !== f.emoCode){ f.emoCode = ec; if (!(f.emo && f.emo.id === ec % 16 && f.emo.until > G.frame)) f.emo = {id:ec % 16, until:G.frame + EMOTE_T}; } }
    });
    if (Array.isArray(sn.it)){
      const seen = new Set();
      for (const a of sn.it.slice(0, 12)){
        if (!Array.isArray(a)) continue;
        const id = Number(a[0]), type = ITEM_TYPES[Number(a[1])]; if (!type) continue;
        seen.add(id);
        let it = G.items.find(x => x.id === id);
        if (!it) it = addItem(type, {x:a[2]/100, y:a[3]/100, z:a[4]/100}, 0, id);
        it.netPos = new V(Number(a[2])/100, Number(a[3])/100, Number(a[4])/100);
        it.landed = !!a[5]; it.t = a[6] ? 60*18 : 0;
      }
      for (const it of [...G.items]) if (!seen.has(it.id)){ if (it.type === 'heal') emit(it.pos, 10, 0x6fe08a, 3, 4, 24, 1.3, 2); Sfx.play(it.type === 'heal' ? 'heal' : 'pickup', it.pos, .7); removeItem(it); }
    }
    if (Array.isArray(sn.bl)){
      const seen = new Set();
      for (const a of sn.bl.slice(0, 30)){
        if (!Array.isArray(a)) continue;
        const id = Number(a[0]); seen.add(id);
        let b = G.bullets.find(x => x.id === id);
        if (!b){ b = makeBullet(id, PROJ_KINDS[Number(a[6])] || 'bullet'); b.pos.set(a[1]/100, a[2]/100, a[3]/100); G.bullets.push(b); flash(b.pos, 0xffd23a, .15, .6, 5); Sfx.proj(b.kind, b.pos); }
        b.netPos = new V(Number(a[1])/100, Number(a[2])/100, Number(a[3])/100);
        b.vel.set(Number(a[4])/10 || 0, 0, Number(a[5])/10 || 0);
        b.mesh.rotation.y = Math.atan2(b.vel.x, b.vel.z);
      }
      for (const b of [...G.bullets]) if (!seen.has(b.id)){ if (b.kind === 'fireball') explodeFx(b.pos); else if (b.kind === 'acid'){ const c = new V(b.pos.x, .3, b.pos.z); flash(c, 0x8dff6a, .4, 4.5, 16); emit(c, 22, 0x8dff6a, 7, 4, 28, 1.6, 4); Sfx.play('boom', c, .6); } removeBullet(b, true); }
    }
    if (Array.isArray(sn.gh)){
      const seen = new Set();
      for (const a of sn.gh.slice(0, 16)){
        if (!Array.isArray(a)) continue;
        const id = Number(a[0]); seen.add(id);
        let g = G.ghosts.find(x => x.id === id);
        if (!g){ g = makeGhost(id); g.pos.set(a[1]/100, 0, a[2]/100); G.ghosts.push(g); ghostFx(g.pos, true); }
        g.net = {x:(Number(a[1]) || 0)/100, z:(Number(a[2]) || 0)/100}; g.rot = Number(a[3])/100 || 0; g.sw = Number(a[4]); if (!Number.isFinite(g.sw)) g.sw = -1;
      }
      for (const g of [...G.ghosts]) if (!seen.has(g.id)) removeGhost(g, true);
    }
    if (Array.isArray(sn.tu)){
      const seen = new Set();
      for (const a of sn.tu.slice(0, 16)){
        if (!Array.isArray(a)) continue;
        const id = Number(a[0]); seen.add(id);
        let t = G.turrets.find(x => x.id === id);
        if (!t){ t = makeTurret(id); t.pos.set(a[1]/100, 0, a[2]/100); t.mesh.position.copy(t.pos); G.turrets.push(t); dust(t.pos, 10); }
        t.rot = Number(a[3])/100 || 0; t.mesh.userData.head.rotation.y = t.rot;
      }
      for (const t of [...G.turrets]) if (!seen.has(t.id)) removeTurret(t, true);
    }
    if (Array.isArray(sn.bs) && G.boss){
      const B = G.boss, a = sn.bs, hp = Math.max(0, Number(a[2]) || 0);
      B.netX = (Number(a[0]) || 0)/100; B.netZ = (Number(a[1]) || 0)/100;
      if (hp < B.hp) B.shake = 6;
      if (hp > B.max) B.max = hp;
      if (hp <= 0 && B.hp > 0) bossBurst();
      B.hp = hp; B.state = BOSS_STATES[Number(a[3])] || 'walk'; B.t = Number(a[4]) || 0; B.facing = (Number(a[5]) || 0)/100;
    }
    if (Array.isArray(sn.zn)){
      const seen = new Set();
      for (const a of sn.zn.slice(0, 8)){
        if (!Array.isArray(a)) continue;
        const id = Number(a[0]); seen.add(id);
        let zn = G.zones.find(x => x.id === id);
        if (!zn){ zn = {id, kind:ZONE_KINDS[Number(a[4])] || 'ice', born:G.frame}; G.zones.push(zn); }
        zn.x = Number(a[1])/100 || 0; zn.z = Number(a[2])/100 || 0; zn.r = Math.max(.5, Math.min(12, Number(a[3])/10 || 4)); zn.y = Number(a[5])/100 || 0;
        if (a.length > 6){ const ph = Number(a[6]) || 0; zn.sink = ph >= 100 ? ph - 100 : 0; zn.sw = ph >= 100 ? 0 : ph; zn.rot = (Number(a[7]) || 0)/100; }
      }
      for (const zn of [...G.zones]) if (!seen.has(zn.id)) dropZone(zn);
    }
    if (Array.isArray(sn.em)) G.stones.forEach((st, i) => {
      const hp = Math.max(0, Number(sn.em[i]) || 0);
      if (hp < st.hp){ st.shake = 8; emit(new V(st.pos.x, 2.6, st.pos.z), 6, SIDES[st.side].col, 4, 3, 18, 1.2, 6); }
      if (hp <= 0 && st.hp > 0){ const c = new V(st.pos.x, 1.6, st.pos.z); explodeFx(c); emit(c, 40, SIDES[st.side].col, 10, 7, 40, 2, 10); st.mesh.visible = false; banner(`หินฝ่าย${SIDES[st.side].name}แตก!`); }
      st.hp = hp;
    });
    if (Array.isArray(sn.b)){
      const seen = new Set();
      for (const a of sn.b.slice(0, 16)){
        if (!Array.isArray(a)) continue;
        const id = Number(a[0]); seen.add(id);
        let b = G.bombs.find(x => x.id === id);
        if (!b){ b = makeBomb(id, a[4] === 1 ? 'meteor' : a[4] === 2 ? 'grenade' : 'bomb'); b.pos.set(a[1]/100, a[2]/100, a[3]/100); G.bombs.push(b); }
        b.netPos = new V(Number(a[1])/100, Number(a[2])/100, Number(a[3])/100);
      }
      for (const b of [...G.bombs]) if (!seen.has(b.id)){
        if (b.pos.y > SEA_Y + .5) explodeFx(b.pos); else splash(b.pos);
        scene.remove(b.mesh); G.bombs.splice(G.bombs.indexOf(b), 1);
      }
    }
  },
  sendInput(){
    if (this.role !== 'guest' || G.me < 0) return;
    const raw = readRaw([MAP1, MAPALT], true), c = this.counts;
    if (raw.atk && !c.pa) c.a++; if (raw.jump && !c.pj) c.j++; if (raw.grab && !c.pg) c.g++; if (raw.skill && !c.ps) c.s++; if (raw.lock && !c.pl) c.l++;
    c.pa = raw.atk; c.pj = raw.jump; c.pg = raw.grab; c.ps = raw.skill; c.pl = raw.lock;
    const arr = [Math.round(raw.x*100), Math.round(raw.z*100), raw.guard ? 1 : 0, c.a, c.j, c.g, c.s, c.l, G.autoLock ? 1 : 0, raw.sprint ? 1 : 0, c.e || 0, c.eid || 0];
    const key = arr.join(',');
    if (key === this.lastIn) return;
    if (this.hostConn && this.hostConn.relay){ const t = performance.now(); if (t - (this.inT || 0) < RELAY_IN_MS) return; this.inT = t; }
    this.lastIn = key; this.presence({in:arr});
  },
};
document.addEventListener('visibilitychange', () => { if (!document.hidden){ Net.heal(); Lobby.heal && Lobby.heal(); } });
addEventListener('online', () => Net.heal());
// pagehide also fires on mobile where beforeunload doesn't; tell guests the host is gone instead of making them wait out a timeout
const netBye = () => { if (Net.role === 'host') for (const e of Net.conns.values()) Net.send(e.conn, {t:'bye'}); if (Net.peer) try { Net.peer.destroy(); } catch (e) {} };
addEventListener('beforeunload', netBye);
addEventListener('pagehide', e => { if (!e.persisted) netBye(); });
function guestTick(){
  for (const f of G.fighters){
    if (f.netInit && alive(f)){
      f.netPos.addScaledVector(f.netVel, DT);
      f.pos.lerp(f.netPos, .4);
      if (!f.splashed && f.pos.y < SEA_Y){ f.splashed = true; splash(f.pos); }
    }
    f.stateT++; if (f.squash > 0) f.squash--; if (f.apeIntro > 0) f.apeIntro--;
    if (f.rage > 0 && alive(f) && G.frame % 6 === 0) emit(new V(f.pos.x, f.pos.y + .9, f.pos.z), 1, 0xff4a3a, 1.5, 2, 18, 1.2, -1);
  }
  for (const it of G.items) if (it.netPos) it.pos.lerp(it.netPos, .4);
  for (const b of G.bombs){ if (b.netPos) b.pos.lerp(b.netPos, .5); b.mesh.position.copy(b.pos); b.mesh.rotation.x += .25; }
  for (const b of G.bullets){ if (b.netPos){ b.netPos.addScaledVector(b.vel, DT); b.pos.lerp(b.netPos, .6); } b.mesh.position.copy(b.pos); if (trailColor(b.kind) && G.frame % 2 === 0) emit(b.pos, 1, trailColor(b.kind), .6, .5, 14, 1.4, 0); }
  if (G.countdown > 0){ G.countdown--; cdBanner(G.countdown); }
  Net.sendInput();
}

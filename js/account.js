// Sky Brawl · account.js — Supabase: บัญชี ล็อบบี้ แชต เลเวล ตารางอันดับ รางวัลรายวัน Google
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Supabase: accounts, profiles, lobby (rooms via Realtime presence) and lobby chat ---------- */
// The anon key is public by design; table access is limited by row level security (supabase-setup.sql).
const SUPA_URL = 'https://dngqblfvgjdoevctsnfy.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZ3FibGZ2Z2pkb2V2Y3RzbmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTkwMzksImV4cCI6MjEwNzE5NTAzOX0.9TvwETWQMDz6EYdjgtlVsXSuc_o2C8_Zt0YmG1wgB_w';
const Supa = {
  client:null, user:null, authFailed:false, saveT:0,
  get available(){ return !!(window.supabase && window.supabase.createClient); },
  getClient(){
    if (!this.client && this.available) this.client = window.supabase.createClient(SUPA_URL, SUPA_KEY, {auth:{persistSession:true, storageKey:'skybrawl-auth', detectSessionInUrl:true}});
    return this.client;
  },
  // Anonymous account per browser; the lobby still works without one, chat and profiles need it
  async signIn(){
    if (this.user || this.authFailed || !this.getClient()) return this.user;
    try {
      const {data:{session}} = await this.client.auth.getSession();
      if (session) this.user = session.user;
      else {
        const r = await this.client.auth.signInAnonymously();
        if (r.error) throw r.error;
        this.user = r.data.user;
      }
      this.saveProfile();
    } catch (e) { this.authFailed = true; this.user = null; }
    return this.user;
  },
  async saveProfile(){
    if (!this.user) return;
    try { await this.client.from('profiles').upsert({id:this.user.id, name:LOOKS[0].name, look:encLook(LOOKS[0]), updated_at:new Date().toISOString()}); } catch (e) {}
  },
  saveSoon(){ clearTimeout(this.saveT); this.saveT = setTimeout(() => this.saveProfile(), 1500); },
};
window.__supaSave = () => Supa.saveSoon();
const SupaLobby = {
  active:false, ch:null, rooms:[], online:0, status:'', connected:false, mine:null, everOk:false, msgs:[], lastSend:0, chatOk:false, failT:0,
  info(text){ this.status = text; if (!$('online').hidden) renderLobby(); },
  start(onFail){
    if (this.active) return;
    const client = Supa.getClient();
    if (!client){ onFail(); return; }
    this.active = true; this.info('กำลังเชื่อมต่อล็อบบี้…');
    const key = Math.random().toString(36).slice(2, 10);   // one presence entry per open tab
    const ch = client.channel('skybrawl-lobby', {config:{presence:{key}, broadcast:{self:true}}});
    this.ch = ch;
    ch.on('presence', {event:'sync'}, () => this.sync());
    ch.on('presence', {event:'join'}, () => this.sync());
    ch.on('presence', {event:'leave'}, () => this.sync());
    ch.on('broadcast', {event:'chat'}, ({payload}) => this.gotChat(payload));
    ch.subscribe(st => {
      if (this.ch !== ch) return;
      if (st === 'SUBSCRIBED'){
        clearTimeout(this.failT);
        this.connected = true; this.everOk = true; this.info('');
        this.track(); syncChatUi();
      } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT' || st === 'CLOSED'){
        this.connected = false;
        if (!this.everOk){ this.stop(); onFail(); }
        else this.info('ล็อบบี้หลุด กำลังต่อใหม่…');
      }
    });
    // A lobby that never answers hands over to the peer-to-peer one
    this.failT = setTimeout(() => { if (this.ch === ch && !this.everOk){ this.stop(); onFail(); } }, 9000);
    Supa.signIn().then(u => { this.chatOk = !!u; syncChatUi(); if (u) this.loadChat(); });
  },
  stop(){
    clearTimeout(this.failT);
    const ch = this.ch; this.ch = null;   // cleared first so the CLOSED callback sees a retired channel
    if (ch && Supa.client) try { Supa.client.removeChannel(ch); } catch (e) {}
    this.active = false; this.connected = false; this.rooms = []; this.online = 0;
  },
  track(){
    if (!this.ch || !this.connected) return;
    this.ch.track({nm:LOOKS[0].name, room:this.mine || null}).catch(() => {});
  },
  sync(){
    const state = this.ch ? this.ch.presenceState() : {};
    const rooms = []; let n = 0;
    for (const k of Object.keys(state)){
      const metas = state[k]; if (!metas || !metas.length) continue;
      n++;
      const r = sanitizeRoom(metas[metas.length - 1].room);
      if (r) rooms.push(r);
    }
    this.online = n; this.rooms = rooms.slice(0, 60);
    if (!$('online').hidden) renderLobby();
  },
  advertise(room){ this.mine = room; this.track(); },
  heal(){ if (this.active && !this.connected && this.ch) this.track(); },
  async loadChat(){
    try {
      const {data, error} = await Supa.client.from('lobby_messages').select('name, body, user_id').order('created_at', {ascending:false}).limit(30);
      if (error) throw error;
      this.msgs = data.reverse().map(r => ({nm:r.name, body:r.body, me:Supa.user && r.user_id === Supa.user.id}));
      renderChat();
    } catch (e) { this.chatOk = false; syncChatUi('แชตยังไม่พร้อม (ต้องรันสคริปต์ตั้งค่าใน Supabase ก่อน)'); }
  },
  gotChat(p){
    if (!p || typeof p.body !== 'string') return;
    this.msgs.push({nm:cleanName(p.nm, 'ผู้เล่น'), body:p.body.slice(0, 120), me:!!(Supa.user && p.uid === Supa.user.id)});
    if (this.msgs.length > 60) this.msgs.shift();
    renderChat();
  },
  async sendChat(text){
    const body = String(text || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120);
    if (!body || !this.chatOk || !this.ch) return false;
    if (Date.now() - this.lastSend < 1200){ syncChatUi('ส่งถี่เกินไป รออีกนิดนะ'); return false; }
    this.lastSend = Date.now();
    const {error} = await Supa.client.from('lobby_messages').insert({name:LOOKS[0].name, body});
    if (error){ syncChatUi('ส่งข้อความไม่สำเร็จ ลองใหม่อีกครั้ง'); return false; }
    this.ch.send({type:'broadcast', event:'chat', payload:{nm:LOOKS[0].name, body, uid:Supa.user.id}});
    syncChatUi();
    return true;
  },
};
// Both lobbies run side by side: every room is listed on Supabase AND on the peer-to-peer lobby, and the room list
// merges the two. Before, a phone that couldn't reach Supabase in time switched to the peer lobby for good, while
// its friends stayed on Supabase, and the two never saw each other's rooms.
const Lobby = {
  on:false, rt:0,
  get rooms(){
    const by = new Map();
    for (const src of [SupaLobby, PeerLobby]) for (const r of src.rooms || []){
      const old = by.get(r.code);
      if (!old || r.n > old.n || (r.n === old.n && r.ph !== old.ph && src === SupaLobby)) by.set(r.code, r);
    }
    return [...by.values()];
  },
  get online(){ return Math.max(SupaLobby.connected ? SupaLobby.online : 0, PeerLobby.connected ? PeerLobby.online : 0); },
  get connected(){ return SupaLobby.connected || PeerLobby.connected; },
  get status(){ return this.connected ? '' : (SupaLobby.status || PeerLobby.status); },
  get kind(){ return SupaLobby.connected ? 'supa' : PeerLobby.connected ? 'peer' : ''; },
  // Short health line so players can compare: "หลัก ✓ · สำรอง ✓"
  get badge(){ return 'หลัก ' + (SupaLobby.connected ? '✓' : Supa.available ? '…' : '✗') + ' · สำรอง ' + (PeerLobby.connected ? '✓' : typeof window.Peer === 'function' ? '…' : '✗') + ' · รีเลย์ ' + (TURN_OWN ? '✓' : '✗'); },
  start(){
    this.on = true;
    if (Supa.available && !SupaLobby.active) SupaLobby.start(() => this.retrySupa());
    PeerLobby.start();
    syncChatUi();
  },
  // Supabase didn't answer: keep trying in the background instead of giving up for the session
  retrySupa(){
    clearTimeout(this.rt);
    if (this.on) this.rt = setTimeout(() => { if (this.on && !SupaLobby.active && Supa.available) SupaLobby.start(() => this.retrySupa()); }, 15000);
    syncChatUi(); if (!$('online').hidden) renderLobby();
  },
  stop(){ this.on = false; clearTimeout(this.rt); SupaLobby.stop(); PeerLobby.stop(); syncChatUi(); },
  advertise(room){ SupaLobby.advertise(room); PeerLobby.advertise(room); },
  heal(){
    if (!this.on) return;
    SupaLobby.heal();
    if (!SupaLobby.active && Supa.available) SupaLobby.start(() => this.retrySupa());
    if (PeerLobby.active && !PeerLobby.connected) PeerLobby.later();
  },
};
function syncChatUi(note){
  const box = $('chatBox'); if (!box) return;
  box.hidden = Lobby.kind !== 'supa';
  $('chatForm').hidden = !SupaLobby.chatOk;
  const n = $('chatNote');
  const msg = note || (Lobby.kind === 'supa' && !SupaLobby.chatOk && Supa.authFailed ? 'แชตยังไม่เปิด (ต้องเปิด anonymous sign-in ใน Supabase)' : '');
  n.textContent = msg; n.hidden = !msg;
}
function renderChat(){
  const log = $('chatLog'); if (!log) return;
  log.textContent = '';
  if (!SupaLobby.msgs.length){ const p = document.createElement('div'); p.className = 'note'; p.textContent = 'ยังไม่มีข้อความ ทักทายกันได้เลย'; log.appendChild(p); }
  for (const m of SupaLobby.msgs){
    const row = document.createElement('div'); if (m.me) row.className = 'me';
    const b = document.createElement('b'); b.textContent = m.nm;
    row.append(b, document.createTextNode(m.body));
    log.appendChild(row);
  }
  log.scrollTop = log.scrollHeight;
  syncChatUi();
}

/* ---------- Levels & leaderboard: the server decides XP (record_match in supabase-levels.sql) ---------- */
const xpForLevel = L => 50*(L - 1)*(L - 1);
const LEVEL_TITLES = [[30, 'ตำนาน'], [20, 'แชมป์'], [10, 'ยอดฝีมือ'], [5, 'นักสู้'], [1, 'มือใหม่']];
const levelTitle = L => (LEVEL_TITLES.find(([min]) => L >= min) || LEVEL_TITLES[4])[1];
const xpProgress = st => { const lo = xpForLevel(st.level), hi = xpForLevel(st.level + 1); return {cur:st.xp - lo, need:hi - lo, pct:Math.max(0, Math.min(100, Math.round((st.xp - lo)/(hi - lo)*100)))}; };
const Progress = {
  stats:null, recordedFor:-1,
  load(){ try { const st = JSON.parse(localStorage.getItem('skybrawl.stats')); if (st && Number.isFinite(st.xp)) this.stats = st; } catch (e) {} },
  store(){ try { localStorage.setItem('skybrawl.stats', JSON.stringify(this.stats)); } catch (e) {} },
  get level(){ return this.stats ? this.stats.level : 0; },
  async refresh(){
    if (!Supa.available) return;
    const u = await Supa.signIn(); if (!u) return;
    const {data, error} = await Supa.client.from('player_stats').select('xp, level, matches, wins, kos').eq('id', u.id).maybeSingle();
    if (!error){ this.stats = data || {xp:0, level:1, matches:0, wins:0, kos:0}; this.store(); renderLevelChip(); }
  },
  // Sends only the match facts; the server works out and caps the XP
  async record(rows){
    const me = G.fighters.find(f => f.ctrl === 'p1') || G.fighters.find(f => f.isLocal);
    const mine = me && rows.find(r => r.f === me);
    if (!mine || !Supa.available) return;
    const players = rows.length;
    let place = mine.place;
    if (G.teamMode && G.winTeam != null) place = me.side === G.winTeam ? 1 : players;
    place = Math.max(1, Math.min(players, place | 0 || players));
    showXp({pending:true});
    const u = await Supa.signIn();
    if (!u){ showXp({error:'บันทึก XP ไม่ได้ (เชื่อมต่อบัญชีไม่ได้)'}); return; }
    const prev = this.stats || {xp:0, level:1, matches:0, wins:0, kos:0};
    const {data, error} = await Supa.client.rpc('record_match', {p_place:place, p_players:players, p_kos:Math.max(0, mine.kos | 0), p_dmg:Math.max(0, mine.dmg | 0), p_online:!!G.net});
    if (error){ showXp({error:/too soon/.test(error.message) ? 'แมตช์จบเร็วเกินไป ไม่ได้รับ XP (นับได้ทุก 30 วินาที)' : 'บันทึก XP ไม่สำเร็จ'}); return; }
    const r = Array.isArray(data) ? data[0] : data;
    this.stats = {xp:r.new_xp, level:r.new_level, matches:r.total_matches, wins:r.total_wins, kos:prev.kos + (mine.kos | 0)};
    this.store(); renderLevelChip();
    showXp({gained:r.gained, levelUp:r.new_level > prev.level});
  },
};
function renderLevelChip(){
  const el = $('lvChip'), st = Progress.stats; if (!el) return;
  el.hidden = !st; if (!st) return;
  const p = xpProgress(st);
  el.querySelector('.lv').textContent = 'Lv.' + st.level;
  el.querySelector('.lt').textContent = levelTitle(st.level) + ' · XP ' + p.cur + '/' + p.need;
  el.querySelector('.xpbar i').style.width = p.pct + '%';
}
function showXp(o){
  $('resXp').hidden = false;
  if (o.pending || o.error){ $('resLv').textContent = o.pending ? 'กำลังบันทึก XP…' : o.error; $('resGain').textContent = ''; $('resBar').style.width = '0%'; return; }
  const st = Progress.stats, p = xpProgress(st);
  $('resLv').textContent = 'Lv.' + st.level + ' ' + levelTitle(st.level) + (o.levelUp ? ' · เลเวลอัป!' : '');
  $('resGain').textContent = '+' + o.gained + ' XP' + (G.net ? ' (ออนไลน์ ×1.5)' : '') + ' · ' + p.cur + '/' + p.need;
  requestAnimationFrame(() => { $('resBar').style.width = p.pct + '%'; });
  if (o.levelUp) banner('LEVEL UP!');
}
const Ranks = {
  key:'xp',
  async open(){
    hideAllPanels(); $('ranks').hidden = false;
    $('ranksClose').focus({preventScroll:true});
    await this.load();
  },
  async load(){
    const body = $('rankBody'), me = $('rankMe');
    body.textContent = ''; me.textContent = 'กำลังโหลด…';
    for (const b of document.querySelectorAll('#rankTabs .tab')) b.setAttribute('aria-pressed', String(b.dataset.k === this.key));
    $('rankCol').textContent = {xp:'XP', wins:'ชนะ', kos:'KO'}[this.key];
    if (!Supa.getClient()){ me.textContent = 'โหลดตารางอันดับไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่'; return; }
    await Supa.signIn();
    const {data, error} = await Supa.client.from('player_stats').select('id, name, level, xp, wins, kos').order(this.key, {ascending:false}).order('xp', {ascending:false}).limit(50);
    if (error){ me.textContent = 'โหลดตารางอันดับไม่ได้'; return; }
    const uid = Supa.user && Supa.user.id;
    data.forEach((r, i) => {
      const tr = document.createElement('tr'); if (r.id === uid) tr.className = 'me';
      [i + 1, cleanName(r.name, 'ผู้เล่น'), 'Lv.' + r.level, r[this.key]].forEach((v, k) => {
        const td = document.createElement('td'); td.textContent = v;
        if (k === 0) td.className = 'rank'; if (k > 1) td.className = 'n';
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    const at = data.findIndex(r => r.id === uid);
    me.textContent = !data.length ? 'ยังไม่มีใครติดอันดับ เล่นจบแมตช์แรกแล้วชื่อคุณจะขึ้นที่นี่'
      : at >= 0 ? 'คุณอยู่อันดับ ' + (at + 1)
      : Progress.stats ? 'คุณยังไม่ติด 50 อันดับแรก · ตอนนี้ Lv.' + Progress.stats.level : 'เล่นจบแมตช์เพื่อรับ XP และขึ้นตารางอันดับ';
  },
};

/* ---------- Daily login rewards: the server keeps the streak and the unlocks (claim_daily in supabase-daily.sql) ---------- */
const DAILY_CYCLE = [['t', 'regular'], ['h', 'halo'], ['t', 'steady'], ['h', 'tophat'], ['t', 'guardian'], ['h', 'flower'], ['h', 'star']];
const DAILY_ICON = {halo:'😇', tophat:'🎩', flower:'🌸', star:'⭐'};
const rewardName = u => { const [t, k] = String(u).split(':'); return t === 'h' ? 'หมวก "' + (HATS[k] || k) + '"' : 'ฉายา "' + (TITLES[k] || k) + '"'; };
function lockedItem(key, val){
  if (key === 'hat') return DAILY_HATS.has(val) && !Daily.owns('h:' + val);
  if (key === 'title') return val !== 'none' && !Daily.owns('t:' + val);
  return false;
}
function lockedHint(val){
  const d = DAILY_CYCLE.findIndex(c => c[1] === val) + 1;
  const how = {legend7:'ล็อกอินต่อเนื่องครบ 7 วัน', d14:'ล็อกอินรวมครบ 14 วัน', d30:'ล็อกอินรวมครบ 30 วัน', quest5:'ภารกิจรายวันครบ 3 ข้อ 5 วัน', quest20:'ภารกิจรายวันครบ 3 ข้อ 20 วัน'}[val] || 'รางวัลล็อกอินรายวัน วันที่ ' + d;
  toast('🔒 ปลดล็อกได้จาก' + how);
}
let toastT = 0;
function toast(text){
  const t = $('toast'); t.textContent = text; t.hidden = false; t.style.opacity = 1;
  clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; toastT = setTimeout(() => { t.hidden = true; }, 300); }, 2600);
}
const Daily = {
  st:null, uid:null, off:false, autoShown:false, busy:false,
  owns(u){ return !!(this.st && this.st.unlocks.includes(u)); },
  loadCache(){
    try { const c = JSON.parse(localStorage.getItem('skybrawl.daily')); if (c && c.st && Array.isArray(c.st.unlocks)){ this.st = c.st; this.uid = c.uid; } } catch (e) {}
  },
  store(){ try { localStorage.setItem('skybrawl.daily', JSON.stringify({uid:this.uid, st:this.st})); } catch (e) {} },
  set(r, can){
    this.st = {streak:r.streak | 0, best:r.best | 0, total:r.total | 0, can, unlocks:Array.isArray(r.unlocks) ? r.unlocks : []};
    this.store();
  },
  async refresh(auto){
    if (!Supa.available) return;
    const u = await Supa.signIn(); if (!u) return;
    if (this.uid !== u.id){ this.st = null; this.uid = u.id; }
    const {data, error} = await Supa.client.rpc('daily_status');
    if (error){
      // The SQL has not been run yet: hide the feature instead of showing a broken button
      if (/daily_status|function|schema cache|not find/i.test(error.message)) this.off = true;
      renderDaily(); return;
    }
    const r = Array.isArray(data) ? data[0] : data; if (!r) return;
    this.off = false; this.set(r, !!r.can_claim);
    this.fixLooks(); renderDaily();
    if (auto && this.st.can && !this.autoShown && !$('menu').hidden){ this.autoShown = true; this.open(); }
  },
  // Items this account does not own come off (e.g. after switching accounts)
  fixLooks(){
    let ch = false;
    for (const l of LOOKS){
      if (lockedItem('hat', l.hat)){ l.hat = 'band'; ch = true; }
      if (l.title && lockedItem('title', l.title)){ l.title = 'none'; ch = true; }
    }
    if (ch) saveLooks();
  },
  open(){
    hideAllPanels(); $('daily').hidden = false; $('dailyGot').textContent = ''; $('dailyWear').hidden = true;
    renderDaily();
    ($('dailyClaim').hidden ? $('dailyClose') : $('dailyClaim')).focus({preventScroll:true});
  },
  async claim(){
    if (this.busy) return;
    this.busy = true; $('dailyClaim').disabled = true; $('dailyGot').textContent = 'กำลังรับรางวัล…';
    const {data, error} = await Supa.client.rpc('claim_daily');
    this.busy = false; $('dailyClaim').disabled = false;
    if (error){
      $('dailyGot').textContent = /already/.test(error.message) ? 'วันนี้รับรางวัลไปแล้ว พรุ่งนี้มาใหม่นะ' : 'รับรางวัลไม่สำเร็จ ลองใหม่อีกครั้ง';
      if (/already/.test(error.message)) await this.refresh();
      return;
    }
    const r = Array.isArray(data) ? data[0] : data;
    this.set(r, false); renderDaily();
    $('dailyGot').textContent = '🎉 ได้รับ ' + (r.reward || []).map(rewardName).join(' และ ') + ' แล้ว!';
    $('dailyWear').hidden = false; $('dailyWear').focus({preventScroll:true});
    Sfx.play('level');
  },
};
function renderDaily(){
  const st = Daily.st, btn = $('dailyBtn');
  btn.hidden = Daily.off || !Supa.available || !st;
  btn.querySelector('.rdot').hidden = !(st && st.can);
  if (!st || $('daily').hidden) return;
  // Days already done in the current round of 7 (a full round starts again at day 1)
  const done = st.can ? st.streak % 7 : (st.streak - 1) % 7 + 1;
  $('dailyStreak').textContent = (st.can
    ? (st.streak ? 'ล็อกอินต่อเนื่อง ' + st.streak + ' วัน · รับรางวัลวันนี้ได้เลย' : 'เริ่มนับวันที่ 1 · รับรางวัลวันนี้ได้เลย')
    : 'ล็อกอินต่อเนื่อง ' + st.streak + ' วัน · วันนี้รับแล้ว พรุ่งนี้มาใหม่นะ') + ' · รวม ' + st.total + ' วัน';
  const grid = $('dailyGrid'); grid.textContent = '';
  DAILY_CYCLE.forEach(([t, k], i) => {
    const d = i + 1, c = document.createElement('div');
    c.className = 'dcell' + (d <= done ? ' done' : '') + (st.can && d === done + 1 ? ' today' : '');
    const dn = document.createElement('span'); dn.className = 'dn'; dn.textContent = st.can && d === done + 1 ? 'วันนี้' : 'วันที่ ' + d;
    const di = document.createElement('span'); di.className = 'di'; di.textContent = t === 'h' ? DAILY_ICON[k] : '🏷️';
    const dt = document.createElement('span'); dt.className = 'dt'; dt.textContent = (t === 'h' ? HATS[k] : '"' + TITLES[k] + '"') + (d === 7 ? ' + ฉายา "' + TITLES.legend7 + '"' : '');
    c.append(dn, di, dt); grid.appendChild(c);
  });
  $('dailyClaim').hidden = !st.can;
}

/* ---------- Google account: the anonymous account is linked, so its id (and its XP) stay the same ---------- */
const Account = {
  note:'', busy:false,
  get isGoogle(){ const u = Supa.user; return !!(u && !u.is_anonymous && (u.identities || []).some(i => i.provider === 'google')); },
  redirect(){ return gameUrl(); },
  async boot(){
    if (!Supa.getClient()) return;
    // Coming back from Google with an error, e.g. that Google account already belongs to another player
    const p = new URLSearchParams(location.hash.slice(1));
    const err = p.get('error_code') || p.get('error');
    if (err){
      const d = (p.get('error_description') || '') + ' ' + err;
      this.note = /already|exist/i.test(d) ? 'exists' : 'error:' + d.replace(/\+/g, ' ').slice(0, 120);
      history.replaceState(null, '', location.pathname + location.search);
    }
    Supa.client.auth.onAuthStateChange((ev, session) => {
      if (session) Supa.user = session.user;
      renderAccount();
      // supabase-js asks not to await its own calls inside this callback
      if (ev === 'SIGNED_IN' || ev === 'USER_UPDATED') setTimeout(() => this.restore(), 0);
    });
    await Supa.signIn();
    renderAccount();
    this.restore();
  },
  // On a Google account the server copy of name, look and level is the truth (that's what follows you between devices)
  async restore(){
    if (!this.isGoogle) return;
    this.note = '';   // signed in fine, so any earlier Google error no longer applies
    const {data} = await Supa.client.from('profiles').select('name, look').eq('id', Supa.user.id).maybeSingle();
    if (data && data.name){
      LOOKS[0] = decLook(data.look, cleanName(data.name, 'P1'));
      try { localStorage.setItem(LOOK_KEY, JSON.stringify(LOOKS)); localStorage.setItem(NAMED_KEY, '1'); } catch (e) {}
      named = true;
    } else Supa.saveProfile();
    await Progress.refresh();
    Daily.refresh();
    renderAccount();
  },
  async linkGoogle(){
    if (this.busy) return; this.busy = true; renderAccount('กำลังไปหน้า Google…');
    const u = await Supa.signIn();
    const opts = {provider:'google', options:{redirectTo:this.redirect()}};
    const {error} = u && u.is_anonymous ? await Supa.client.auth.linkIdentity(opts) : await Supa.client.auth.signInWithOAuth(opts);
    this.busy = false;
    if (error) renderAccount(/manual linking/i.test(error.message) ? 'ยังผูกบัญชีไม่ได้: ต้องเปิด Manual linking ใน Supabase'
      : /provider is not enabled|unsupported provider/i.test(error.message) ? 'ยังล็อกอินด้วย Google ไม่ได้: ต้องเปิด Google ใน Supabase ก่อน'
      : 'เชื่อมต่อ Google ไม่สำเร็จ: ' + error.message);
  },
  // That Google account already has its own progress: switch to it (this device's guest progress stays behind)
  async useExisting(){
    this.note = '';
    const {error} = await Supa.client.auth.signInWithOAuth({provider:'google', options:{redirectTo:this.redirect()}});
    if (error) renderAccount('เชื่อมต่อ Google ไม่สำเร็จ: ' + error.message);
  },
  async signOut(){
    await Supa.client.auth.signOut();
    Supa.user = null; Supa.authFailed = false;
    Progress.stats = null; try { localStorage.removeItem('skybrawl.stats'); } catch (e) {}
    renderLevelChip();
    Daily.st = null; Daily.uid = null; try { localStorage.removeItem('skybrawl.daily'); } catch (e) {}
    await Supa.signIn();   // a fresh guest account
    await Progress.refresh();
    Daily.refresh();
    renderAccount();
  },
};
function renderAccount(msg){
  const box = $('acctBox'); if (!box) return;
  box.hidden = !Supa.available;
  const u = Supa.user, g = Account.isGoogle;
  let text = msg || '';
  if (!text){
    if (Account.note === 'exists') text = 'บัญชี Google นี้มีข้อมูลของตัวเองอยู่แล้ว กดเข้าบัญชีนั้นได้ แต่เลเวลบนเครื่องนี้จะไม่ถูกรวมเข้าไป';
    else if (Account.note.startsWith('error:')) text = 'ล็อกอิน Google ไม่สำเร็จ ลองใหม่อีกครั้ง';
    else if (!u) text = Supa.authFailed ? 'เชื่อมต่อบัญชีไม่ได้ เลเวลจะไม่ถูกบันทึก' : 'กำลังเชื่อมต่อบัญชี…';
    else if (g) text = 'บัญชี Google · ' + (u.email || 'เชื่อมต่อแล้ว') + ' · เลเวลตามไปทุกเครื่อง';
    else text = 'บัญชีชั่วคราว: เลเวลอยู่แค่เบราว์เซอร์นี้ ผูก Google เพื่อเก็บไว้ข้ามเครื่อง';
  }
  $('acctText').textContent = text;
  $('acctGoogle').hidden = !u || g || Account.note === 'exists';
  $('acctExisting').hidden = Account.note !== 'exists';
  $('acctOut').hidden = !g;
}

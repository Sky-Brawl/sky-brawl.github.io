// Sky Brawl · quests.js — ภารกิจรายวัน 3 ข้อ (ง่าย / กลาง / ยาก) นับความคืบหน้าในเครื่อง รับ XP ผ่าน Supabase
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Daily quests ----------
   Every day (Thai time) everyone gets the same three quests, picked from the pools below by the date, plus a
   "class of the day". Progress is counted on this device (localStorage 'skybrawl.quests', reset each day):
   match results come from showResult (works for guests too), the rest from Quest.watch() every frame and from
   emoteLocal / sendChat. A finished quest is claimed with the claim_quest RPC (supabase-quests.sql): the server
   pays 60 / 90 / 130 XP, +50 when all three are claimed, and titles after 5 and 20 full days.
   Without Supabase (or before the SQL is run) progress still shows, only the claim button is off. ---------- */
const QUEST_POOL = [
  [ // easy · 60 XP
    {id:'play3', text:'เล่นให้จบ 3 แมตช์', goal:3, ev:'match', icon:'🎮'},
    {id:'emote5', text:'ส่งอีโมตเหนือหัว 5 ครั้ง (ปุ่ม 1–8)', goal:5, ev:'emote', icon:'😂'},
    {id:'chat3', text:'พิมพ์แชทระหว่างสู้ 3 ครั้ง (Enter)', goal:3, ev:'chat', icon:'💬'},
    {id:'skill10', text:'ใช้สกิลอาชีพ (E) 10 ครั้ง', goal:10, ev:'skill', icon:'🌀'},
    {id:'item5', text:'หยิบอาวุธหรือระเบิด 5 ครั้ง', goal:5, ev:'item', icon:'🔨'},
    {id:'guard8', text:'กันการโจมตี (H) ให้ได้ 8 ครั้ง', goal:8, ev:'guard', icon:'🛡️'},
  ],
  [ // medium · 90 XP
    {id:'ko10', text:'KO ศัตรูรวม 10 ครั้ง', goal:10, ev:'ko', icon:'💥'},
    {id:'top3x2', text:'ติด 3 อันดับแรก 2 แมตช์', goal:2, ev:'top3', icon:'🥉'},
    {id:'dmg600', text:'สร้างดาเมจรวม 600', goal:600, ev:'dmg', icon:'⚔️'},
    {id:'ape1', text:'กินยาแปลงร่างเป็นวานรยักษ์ 1 ครั้ง', goal:1, ev:'ape', icon:'🦍'},
    {id:'mech1', text:'ขึ้นขี่หุ่นรบแดง 1 ครั้ง', goal:1, ev:'mech', icon:'🤖'},
    {id:'cls2', text:'เล่นด้วยอาชีพประจำวัน ({cls}) 2 แมตช์', goal:2, ev:'clsMatch', icon:'⭐'},
  ],
  [ // hard · 130 XP
    {id:'win2', text:'ชนะ 2 แมตช์', goal:2, ev:'win', icon:'🏆'},
    {id:'ko5one', text:'KO 5 ครั้งในแมตช์เดียว', goal:1, ev:'ko5', icon:'🔥'},
    {id:'clswin', text:'ชนะด้วยอาชีพประจำวัน ({cls})', goal:1, ev:'clsWin', icon:'👑'},
    {id:'bigwin', text:'ชนะแมตช์ที่มีนักสู้ 8 คนขึ้นไป', goal:1, ev:'bigWin', icon:'🏟️'},
  ],
];
const QUEST_XP = [60, 90, 130], QUEST_BONUS = 50, QUEST_TIER = ['ง่าย', 'กลาง', 'ยาก'];
// Today in Thai time (the server uses the same clock to decide what can be claimed)
const questDay = () => new Date(Date.now() + 7*3600e3).toISOString().slice(0, 10);
function questHash(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

const Quest = {
  day:'', list:[], cls:'none', st:null, server:null, off:false, busy:false,
  // Today's three quests and class, the same for everyone
  pick(day){
    const h = questHash('sky-brawl-' + day), ks = ON_K.filter(k => k !== 'none');
    this.cls = ks[h % ks.length] || 'knight';
    this.list = QUEST_POOL.map((pool, i) => pool[questHash(day + ':' + i) % pool.length]);
    this.day = day;
  },
  load(){
    const day = questDay();
    if (this.day !== day) this.pick(day);
    if (this.st && this.st.day === day) return;
    let st = null;
    try { st = JSON.parse(localStorage.getItem('skybrawl.quests')); } catch (e) {}
    this.st = st && st.day === day && Array.isArray(st.p) ? st : {day, p:[0, 0, 0], done:[0, 0, 0], claimed:0};
    if (!this.server || this.server.day !== day) this.server = null;
  },
  store(){ try { localStorage.setItem('skybrawl.quests', JSON.stringify(this.st)); } catch (e) {} },
  text(q){ return q.text.replace('{cls}', (OUTFITS[this.cls] || {}).name || this.cls); },
  claimed(i){ return !!(((this.server ? this.server.claimed : 0) | this.st.claimed) & (1 << i)); },
  canClaim(){ this.load(); return this.list.some((q, i) => this.st.done[i] && !this.claimed(i)); },
  // Count an event; finishing a quest pops a toast
  add(ev, n = 1){
    if (G.tut) return;
    this.load();
    let ch = false;
    this.list.forEach((q, i) => {
      if (q.ev !== ev || this.st.done[i]) return;
      this.st.p[i] = Math.min(q.goal, this.st.p[i] + n); ch = true;
      if (this.st.p[i] >= q.goal){
        this.st.done[i] = 1;
        toast('✅ ภารกิจสำเร็จ: ' + this.text(q) + ' · รับ ' + QUEST_XP[i] + ' XP ได้ที่เมนู "ภารกิจรายวัน"');
        Sfx.play('pickup');
      }
    });
    if (ch){ this.store(); renderQuestBtn(); }
  },
  // After every finished match (host, guest and offline all reach showResult)
  onMatch(rows){
    if (G.tut || !rows || rows.length < 2) return;
    const me = G.fighters.find(f => f.isLocal && (G.net === 'guest' || f.ctrl === 'p1')) || G.fighters.find(f => f.isLocal);
    const mine = me && rows.find(r => r.f === me); if (!mine) return;
    let place = mine.place;
    if (G.teamMode && G.winTeam != null) place = me.side === G.winTeam ? 1 : rows.length;
    const win = place === 1, kos = mine.kos | 0, cls = me.cls === this.cls;
    this.add('match');
    if (kos) this.add('ko', kos);
    if (mine.dmg) this.add('dmg', mine.dmg | 0);
    if (place <= 3) this.add('top3');
    if (kos >= 5) this.add('ko5');
    if (cls) this.add('clsMatch');
    if (win){ this.add('win'); if (cls) this.add('clsWin'); if (rows.length >= 8) this.add('bigWin'); }
  },
  // Every frame: things that are easiest to see from the local fighter's state (also works for guests)
  watch(){
    if (G.mode !== 'play' || G.tut || Replay.on) return;
    const me = G.fighters.find(f => f.isLocal && (G.net === 'guest' || f.ctrl === 'p1'));
    if (!me) return;
    const w = me.qw || (me.qw = {state:me.state, mk:me.moveKey, wep:me.weapon, held:me.held, ape:me.apeT > 0, mech:!!me.mech});
    if (me.state === 'attack' && me.move && me.move.skill && (w.state !== 'attack' || w.mk !== me.moveKey) && !me.moveKey.startsWith('sk_ape') && me.moveKey !== 'sk_mech') this.add('skill');
    if (me.state === 'guardstun' && w.state !== 'guardstun') this.add('guard');
    if ((me.weapon && me.weapon !== w.wep) || (me.held && !w.held)) this.add('item');
    if (me.apeT > 0 && !w.ape) this.add('ape');
    if (me.mech && !w.mech) this.add('mech');
    w.state = me.state; w.mk = me.moveKey; w.wep = me.weapon; w.held = me.held; w.ape = me.apeT > 0; w.mech = !!me.mech;
  },
  async refresh(){
    if (!Supa.available) return;
    const u = await Supa.signIn(); if (!u) return;
    const {data, error} = await Supa.client.rpc('quest_status');
    if (error){ if (/quest_status|function|schema cache|not find/i.test(error.message)) this.off = true; renderQuests(); return; }
    const r = Array.isArray(data) ? data[0] : data; if (!r) return;
    this.off = false; this.server = {day:String(r.day), claimed:r.claimed | 0, full:r.full_days | 0, played:!!r.played_today};
    renderQuests(); renderQuestBtn();
  },
  open(){
    this.load(); hideAllPanels(); $('quests').hidden = false; $('questGot').textContent = '';
    renderQuests(); this.refresh();
    $('questClose').focus({preventScroll:true});
  },
  async claim(i){
    if (this.busy) return;
    this.busy = true; $('questGot').textContent = 'กำลังรับรางวัล…';
    const {data, error} = await Supa.client.rpc('claim_quest', {p_slot:i + 1});
    this.busy = false;
    if (error){
      $('questGot').textContent = /already/.test(error.message) ? 'รับรางวัลข้อนี้ไปแล้ว' : /play a match/.test(error.message) ? 'เล่นให้จบสัก 1 แมตช์วันนี้ก่อน แล้วค่อยรับรางวัล' : 'รับรางวัลไม่สำเร็จ ลองใหม่อีกครั้ง';
      if (/already/.test(error.message)){ this.st.claimed |= 1 << i; this.store(); }
      renderQuests(); return;
    }
    const r = Array.isArray(data) ? data[0] : data;
    this.st.claimed |= 1 << i; this.store();
    if (this.server) Object.assign(this.server, {claimed:r.claimed | 0, full:r.full_days | 0});
    const prev = Progress.stats || {xp:0, level:1, matches:0, wins:0, kos:0};
    Progress.stats = {...prev, xp:r.new_xp, level:r.new_level}; Progress.store(); renderLevelChip();
    let msg = '🎉 ได้รับ ' + r.gained + ' XP' + (r.bonus ? ' + โบนัสครบ 3 ภารกิจ ' + r.bonus + ' XP' : '');
    if (Array.isArray(r.reward) && r.reward.length){ msg += ' และ ' + r.reward.map(rewardName).join(', ') + '!'; Daily.refresh(); }
    if (r.new_level > prev.level) msg += ' · เลเวลอัปเป็น Lv.' + r.new_level + '!';
    $('questGot').textContent = msg;
    Sfx.play('level');
    renderQuests(); renderQuestBtn();
  },
};
function renderQuestBtn(){
  const b = $('questBtn'); if (!b) return;
  b.querySelector('.rdot').hidden = !(Supa.available && !Quest.off && Quest.canClaim());
}
function renderQuests(){
  if ($('quests').hidden) return;
  Quest.load();
  const sv = Quest.server, canPay = Supa.available && !Quest.off;
  const list = $('questList'); list.textContent = '';
  Quest.list.forEach((q, i) => {
    const p = Quest.st.p[i], done = !!Quest.st.done[i], got = Quest.claimed(i);
    const row = document.createElement('div'); row.className = 'qrow' + (done ? ' done' : '') + (got ? ' got' : '');
    const ic = document.createElement('span'); ic.className = 'qi'; ic.textContent = q.icon;
    const mid = document.createElement('div'); mid.className = 'qm';
    const tx = document.createElement('div'); tx.className = 'qt'; tx.textContent = Quest.text(q);
    const meta = document.createElement('div'); meta.className = 'qx'; meta.textContent = QUEST_TIER[i] + ' · ' + QUEST_XP[i] + ' XP · ' + Math.min(p, q.goal) + '/' + q.goal;
    const bar = document.createElement('span'); bar.className = 'xpbar'; const fill = document.createElement('i'); fill.style.width = Math.min(100, p/q.goal*100) + '%'; bar.appendChild(fill);
    mid.append(tx, meta, bar);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn qb';
    if (got){ btn.textContent = 'รับแล้ว ✓'; btn.disabled = true; }
    else if (done && canPay){ btn.textContent = 'รับ ' + QUEST_XP[i] + ' XP'; btn.onclick = () => Quest.claim(i); }
    else { btn.textContent = done ? 'สำเร็จ ✓' : 'ยังไม่ครบ'; btn.disabled = true; }
    row.append(ic, mid, btn); list.appendChild(row);
  });
  const all = [0, 1, 2].every(i => Quest.claimed(i));
  const left = (() => { const now = Date.now() + 7*3600e3, end = Math.ceil(now/86400e3)*86400e3, m = Math.max(1, Math.round((end - now)/60e3)); return Math.floor(m/60) + ' ชม. ' + (m % 60) + ' นาที'; })();
  $('questInfo').textContent = (all ? '🎉 วันนี้ครบทั้ง 3 ภารกิจแล้ว! ' : 'ทำครบ 3 ภารกิจรับโบนัสเพิ่ม ' + QUEST_BONUS + ' XP · ')
    + 'อาชีพประจำวัน: ' + ((OUTFITS[Quest.cls] || {}).name || '-') + ' · ภารกิจใหม่ใน ' + left;
  $('questNote').textContent = !Supa.available ? 'ออฟไลน์อยู่: นับความคืบหน้าได้ แต่รับ XP ต้องต่อเน็ต'
    : Quest.off ? 'ระบบรับรางวัลภารกิจยังไม่เปิด (เจ้าของเกมต้องรัน supabase-quests.sql) ตอนนี้นับความคืบหน้าไว้ก่อนได้'
    : sv ? 'ครบ 3 ภารกิจมาแล้ว ' + sv.full + ' วัน · ครบ 5 วันได้ฉายา "' + TITLES.quest5 + '" · ครบ 20 วันได้ "' + TITLES.quest20 + '"'
    : '';
}

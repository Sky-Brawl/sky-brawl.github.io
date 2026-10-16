// Sky Brawl · flow.js — เริ่ม/จบแมตช์, เมนู, ผลการแข่ง
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Flow ---------- */
function clearArena(){
  clearStones(); clearBoss(); clearPowers();
  for (const it of [...G.items]) removeItem(it);
  for (const b of G.bombs) scene.remove(b.mesh); G.bombs.length = 0;
  for (const b of G.bullets) scene.remove(b.mesh); G.bullets.length = 0;
  for (const t of G.turrets) scene.remove(t.mesh); G.turrets.length = 0;
  for (const g of G.ghosts) scene.remove(g.mesh); G.ghosts.length = 0;
  for (const zn of G.zones) if (zn.mesh) scene.remove(zn.mesh); G.zones.length = 0;
  for (const p of pops) p.el.remove(); pops.length = 0;
  $('feed').textContent = '';
}
// Sharing: LINE opens its share sheet on phones (and a share page on desktop); QR codes are drawn locally
const gameUrl = () => location.origin + location.pathname;
// Room links as ?room=code: Facebook drops #fragments when it re-reads a shared link
const roomUrl = code => gameUrl() + '?room=' + code;
function setShares(prefix, text, url){
  $(prefix + 'Line').href = 'https://line.me/R/share?text=' + encodeURIComponent(text + ' ' + url);
  $(prefix + 'Fb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
  $(prefix + 'X').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
}
function drawQr(el, text){
  el.textContent = '';
  if (typeof window.qrcode !== 'function'){ el.textContent = 'โหลด QR ไม่ได้ ใช้ลิงก์แทน'; return; }
  try {
    const q = window.qrcode(0, 'M'); q.addData(text); q.make();
    const img = new Image(); img.alt = ''; img.src = q.createDataURL(6, 2); el.appendChild(img);
  } catch (e) { el.textContent = 'สร้าง QR ไม่ได้ ใช้ลิงก์แทน'; }
}
async function copyText(text, btn, label){
  const done = () => { btn.textContent = 'คัดลอกแล้ว'; setTimeout(() => { btn.textContent = label; }, 1800); };
  try { await navigator.clipboard.writeText(text); done(); }
  catch (e) { const inp = btn.previousElementSibling; if (inp && inp.select){ inp.select(); try { if (document.execCommand('copy')) done(); } catch (err) {} } }
}
function hideAllPanels(){
  if (Replay.on) Replay.stop();
  for (const id of ['menu','online','pause','result','custom','hud','touch','dbg','invite','ranks','daily','quests']) $(id).hidden = true;
  $('banner').className = '';
}
function enterAttract(){
  G.mode = 'menu'; G.paused = false; G.endT = 0; G.countdown = 0; G.slow = 0;
  clearArena();
  G.teamMode = false; clearStones();
  createFighters(botNames(8).map(name => ({name, ctrl:'bot', look:randomLook(name)})), 99, false);
}
function toMenu(){
  if (Net.peer || G.net) Net.leave();
  Lobby.stop();
  hideAllPanels(); enterAttract();
  $('menu').hidden = false;
  $('playSolo').focus({preventScroll:true});
}
function readMenuCfg(){
  G.cfg.n = +$('nf').value;
  G.cfg.st = +(document.querySelector('input[name=st]:checked') || {}).value || 2;
  G.cfg.df = (document.querySelector('input[name=diff]:checked') || {}).value || 'normal';
  G.cfg.stage = (document.querySelector('input[name=stage]:checked') || {}).value || 'titanic';
  G.cfg.mode = modeOf((document.querySelector('input[name=mode]:checked') || {}).value);
}
function botSpecs(from, n){
  const out = [];
  const names = botNames(Math.max(0, n - from));
  for (let i = from; i < n; i++) out.push({name:names[i - from], ctrl:'bot', look:randomLook(names[i - from])});
  return out;
}
function beginMatch(specs, stocks){
  hideAllPanels(); clearArena();
  G.raid = G.cfg.mode === 'boss'; G.raidWin = null;
  G.teamMode = !G.raid && G.cfg.mode === 'team' && specs.length >= 2;
  if (G.teamMode) makeStones(specs.length); else clearStones();
  if (G.raid) makeBoss(); else clearBoss();
  G.mode = 'play'; G.paused = false; G.endT = 0; G.winner = null; G.slow = 0; G.stocks = stocks;
  G.countdown = 210; G.cdShown = new Set(); G.itemTimer = 240; G.spec = 0; G.dbgHtml = null;
  G.matchId = (G.matchId || 0) + 1; $('resXp').hidden = true;
  G.camYaw = G.camYawT = 0; camStep(2 - G.camZoom);   // start wide every time (the tutorial picks its own)
  createFighters(specs, stocks, true);
  renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? (specs.length > 24 ? 1 : 1.5) : (specs.length > 64 ? 1.5 : 2))); resize();
  buildHud();
  $('hud').hidden = false;
  syncTouch();
  syncAutoUi();
  syncStoneHud(); syncBossHud();
  $('dbg').hidden = !G.debug;
  keys.clear();
}
function startOffline(kind, over){
  readMenuCfg(); G.kind = kind; G.net = null;
  if (G.tut) tutClose();
  G.quick = over || null; if (over) Object.assign(G.cfg, over);
  const n = Math.max(kind === 'local2' ? 2 : 2, G.cfg.n);
  const specs = [{name:LOOKS[0].name, ctrl:'p1', look:LOOKS[0]}];
  if (kind === 'local2') specs.push({name:LOOKS[1].name, ctrl:'p2', look:LOOKS[1]});
  setStage(stageFor(G.cfg.stage, G.cfg.mode));
  beginMatch(specs.concat(botSpecs(specs.length, n)), G.cfg.st);
}
function togglePause(force){
  const open = force !== undefined ? force : $('pause').hidden;
  $('pause').hidden = !open;
  G.paused = open && !G.net;
  $('pauseNote').hidden = !G.net;
  $('restart').hidden = !!G.net;
  $('toMenu').textContent = G.net ? 'ออกจากห้อง' : 'กลับเมนู';
  keys.clear();
  if (open) $('resume').focus({preventScroll:true});
}
function toggleDebug(){
  G.debug = !G.debug;
  $('dbgBtn').textContent = 'แสดง hitbox: ' + (G.debug ? 'เปิด' : 'ปิด');
  $('dbg').hidden = !(G.debug && G.mode === 'play');
  G.dbgHtml = null;
}
function rankingRows(){
  return G.fighters.map(f => ({f, place:f.place || 1, kos:f.kos, dmg:Math.round(f.dmgDealt)}));
}
function showResult(rows, winnerIdx){
  rows = rows || rankingRows();
  Sfx.result(rows);
  if (Progress.recordedFor !== G.matchId){ Progress.recordedFor = G.matchId; Quest.onMatch(rows); Progress.record(rows).then(() => Quest.refresh()); }
  const w = winnerIdx !== undefined ? G.fighters[winnerIdx] : G.winner;
  const t = $('resTitle'); t.textContent = w ? w.name + ' ชนะ!' : 'เสมอ!';
  t.style.color = w ? hex(w.team) : 'var(--gold)';
  if (G.teamMode && G.winTeam !== null){ t.textContent = `ฝ่าย${SIDES[G.winTeam].name}ชนะ!`; t.style.color = hex(SIDES[G.winTeam].col); }
  if (G.raid && G.raidWin !== null){ t.textContent = G.raidWin ? 'ปราบยักษ์หิมะสำเร็จ!' : 'ยักษ์หิมะชนะ…'; t.style.color = G.raidWin ? 'var(--gold)' : '#7fb5ff'; }
  const body = $('resBody'); body.textContent = '';
  rows.sort((a, b) => a.place - b.place || b.kos - a.kos).forEach(r => {
    const tr = document.createElement('tr'); if (r.f.isLocal) tr.className = 'me';
    const cells = [r.place, r.f.name, r.kos, r.dmg];
    cells.forEach((v, i) => { const td = document.createElement('td'); td.textContent = v; if (i === 0) td.className = 'rank'; if (i > 1) td.className = 'n'; tr.appendChild(td); });
    body.appendChild(tr);
  });
  $('rematch').textContent = G.net ? 'กลับห้อง' : 'แข่งอีกรอบ';
  $('resMenu').textContent = G.net ? 'ออกจากห้อง' : 'กลับเมนู';
  {
    const me = G.fighters.find(f => f.isLocal), mine = me && rows.find(r => r.f === me);
    const txt = mine
      ? 'ได้อันดับ ' + mine.place + ' จาก ' + rows.length + ' คน ใน Sky Brawl ด่าน' + STAGE.name + ' KO ' + mine.kos + ' ครั้ง ดาเมจ ' + mine.dmg + ' ใครแน่มาสู้กัน!'
      : 'มาดูศึก Sky Brawl ด่าน' + STAGE.name + ' แล้วมาสู้กัน!';
    setShares('res', txt, gameUrl());
  }
  $('result').hidden = false; $('touch').hidden = true; $('spec').hidden = true;
  renderReplayBtns();
  $('rematch').focus({preventScroll:true});
  // Team wins travel to guests as -10 - side
  // Raid results travel as -20 (boss down) / -21 (boss won)
  if (G.net === 'host') Net.hostEnd(rows, G.raid && G.raidWin !== null ? (G.raidWin ? -20 : -21) : G.teamMode && G.winTeam !== null ? -10 - G.winTeam : w ? w.idx : -1);
}

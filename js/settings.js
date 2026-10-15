// Sky Brawl · settings.js — ตั้งค่าในเมนู ตั้งชื่อ กล้อง เล็งอัตโนมัติ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
// The folded settings say what is chosen; open/closed is remembered
function setSummary(){
  readMenuCfg();
  const stg = G.cfg.mode === 'boss' ? BOSS_STAGE : G.cfg.stage;
  $('setSum').textContent = [{ffa:'ตะลุมบอน', team:'ทีมตีหิน', boss:'ตีบอส'}[G.cfg.mode], STAGES[stg].name, 'บอท' + {easy:'ง่าย', normal:'ปกติ', hard:'ยาก'}[G.cfg.df], G.cfg.n + ' คน', G.cfg.st + ' ชีวิต'].join(' · ');
}
$('setD').addEventListener('change', setSummary); $('setD').addEventListener('input', setSummary);
try { $('setD').open = localStorage.getItem('skybrawl.setOpen') === '1'; } catch (e) {}
$('setD').addEventListener('toggle', () => { try { localStorage.setItem('skybrawl.setOpen', $('setD').open ? '1' : '0'); } catch (e) {} });
$('playSolo').onclick = () => ensureName(() => openCustom(() => startOffline('solo')));
$('play2p').onclick = () => ensureName(() => openCustom(() => startOffline('local2')));
function openOnline(){ readMenuCfg(); hideAllPanels(); $('online').hidden = false; showLobbyView(); showOnMsg(''); Lobby.start(); }
$('playOnline').onclick = () => ensureName(() => openCustom(() => { enterAttract(); openOnline(); }));
const NAMED_KEY = 'skybrawl.named';
let named = false;
try { named = localStorage.getItem(NAMED_KEY) === '1'; } catch (e) {}
let afterName = null;
function ensureName(next){
  if (named){ next(); return; }
  afterName = next;
  hideAllPanels(); $('nameGate').hidden = false; $('gateErr').hidden = true;
  $('gateName').value = LOOKS[0].name && LOOKS[0].name !== 'P1' ? LOOKS[0].name : '';
  $('gateName').focus({preventScroll:true});
}
$('nameForm').addEventListener('submit', e => {
  e.preventDefault();
  const v = cleanName($('gateName').value, '');
  if (!v){ $('gateErr').hidden = false; $('gateName').focus(); return; }
  LOOKS[0].name = v; saveLooks();
  named = true; try { localStorage.setItem(NAMED_KEY, '1'); } catch (err) {}
  $('nameGate').hidden = true;
  const next = afterName || (() => { $('menu').hidden = false; }); afterName = null; next();
});
$('copyLink').onclick = () => {
  const inp = $('inviteLink'), done = () => { $('copyLink').textContent = 'คัดลอกแล้ว'; setTimeout(() => { $('copyLink').textContent = 'คัดลอกลิงก์เชิญ'; }, 1800); };
  const fallback = () => { inp.select(); inp.setSelectionRange(0, inp.value.length); try { if (document.execCommand('copy')) done(); } catch (e) {} };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(inp.value).then(done, fallback); else fallback();
};
$('shareLink').onclick = () => {
  navigator.share({title:'Sky Brawl', text:`มาต่อยกันบนเรือไททานิก ห้อง ${Net.code}`, url:Net.inviteLink()}).catch(() => {});
};
$('custBtn').onclick = () => openCustom();
$('boardBtn').onclick = () => Ranks.open();
$('ranksClose').onclick = () => { $('ranks').hidden = true; $('menu').hidden = false; };
for (const b of document.querySelectorAll('#rankTabs .tab')) b.onclick = () => { Ranks.key = b.dataset.k; Ranks.load(); };
Progress.load(); renderLevelChip(); Progress.refresh();
$('acctGoogle').onclick = () => Account.linkGoogle();
$('acctExisting').onclick = () => Account.useExisting();
$('acctOut').onclick = () => Account.signOut();
Daily.loadCache(); renderDaily();
$('dailyBtn').onclick = () => Daily.open();
$('dailyClaim').onclick = () => Daily.claim();
$('dailyClose').onclick = () => { $('daily').hidden = true; $('menu').hidden = false; renderDaily(); };
$('dailyWear').onclick = () => { $('daily').hidden = true; openCustom(); };
Account.boot().then(() => Daily.refresh(true));
$('chatForm').addEventListener('submit', async e => {
  e.preventDefault();
  const inp = $('chatIn');
  if (await SupaLobby.sendChat(inp.value)) inp.value = '';
});
$('inviteBtn').onclick = () => {
  const url = gameUrl();
  $('gameLink').value = url;
  if (G.qrFor !== url){ G.qrFor = url; drawQr($('gameQr'), url); }
  setShares('game', 'มาเล่น Sky Brawl เกมต่อสู้โลกบล็อก 3D บนเว็บกัน! เล่นบนมือถือได้ ไม่ต้องติดตั้ง', url);
  $('gameShare').hidden = typeof navigator.share !== 'function';
  $('menu').hidden = true; $('invite').hidden = false;
  $('inviteClose').focus({preventScroll:true});
};
$('inviteClose').onclick = () => { $('invite').hidden = true; $('menu').hidden = false; };
$('gameCopy').onclick = () => copyText($('gameLink').value, $('gameCopy'), 'คัดลอก');
$('gameShare').onclick = () => { navigator.share({title:'Sky Brawl', text:'มาเล่น Sky Brawl กัน!', url:gameUrl()}).catch(() => {}); };
$('onBack').onclick = () => { if (Net.role) Net.leave(); toMenu(); };
$('mkRoom').onclick = () => Net.create();
$('codeGo').onclick = () => Net.join($('codeIn').value.trim().toLowerCase());
$('codeIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('codeGo').click(); });
$('myName').addEventListener('input', e => { LOOKS[0].name = cleanName(e.target.value, 'P1'); saveLooks(); });
$('rN').max = ONLINE_MAX;
$('board').addEventListener('click', () => $('board').classList.toggle('open'));
$('rN').addEventListener('input', e => { G.cfg.n = +e.target.value; $('rNOut').textContent = G.cfg.n; Net.computeSlots(); Net.publishRoom(); renderRoomView(); });
$('rSt').addEventListener('change', e => { G.cfg.st = +e.target.value; Net.publishRoom(); });
$('rDf').addEventListener('change', e => { G.cfg.df = e.target.value; Net.publishRoom(); });
$('rMode').addEventListener('change', e => { G.cfg.mode = modeOf(e.target.value); if (!$('roomView').hidden) renderRoomView(); setStage(stageFor(G.cfg.stage, G.cfg.mode)); if (G.mode === 'menu') enterAttract(); Net.publishRoom(); });
$('rStage').addEventListener('change', e => { G.cfg.stage = e.target.value; setStage(stageFor(G.cfg.stage, G.cfg.mode)); if (G.mode === 'menu') enterAttract(); Net.publishRoom(); });
for (const r of document.querySelectorAll('input[name=stage]')) r.addEventListener('change', e => {
  G.cfg.stage = e.target.value; setStage(stageFor(G.cfg.stage, G.cfg.mode)); if (G.mode === 'menu') enterAttract();
  try { localStorage.setItem('skybrawl.stage', G.cfg.stage); } catch (err) {}
});
try { const m = localStorage.getItem('skybrawl.mode'); if (m === 'team' || m === 'boss'){ G.cfg.mode = m; $('md-' + m).checked = true; } } catch (err) {}
for (const r of document.querySelectorAll('input[name=mode]')) r.addEventListener('change', e => {
  try { localStorage.setItem('skybrawl.mode', e.target.value); } catch (err) {}
  G.cfg.mode = modeOf(e.target.value); setStage(stageFor(G.cfg.stage, G.cfg.mode)); if (G.mode === 'menu') enterAttract();
});
try { const sp = localStorage.getItem('skybrawl.stage'); if (STAGES[sp]){ G.cfg.stage = sp; setStage(sp); $('sg-' + sp).checked = true; } } catch (err) {}
// Room cards: copies of the menu cards. The host's click sets the hidden select and fires its change handler; guests' cards are read-only.
function buildRoomPicks(){
  const add = (grid, name, src) => {
    for (const r of document.querySelectorAll('input[name=' + src + ']')){
      const lb = document.querySelector('label[for="' + r.id + '"]'), id = 'r' + r.id;
      grid.insertAdjacentHTML('beforeend', '<input type="radio" name="' + name + '" id="' + id + '" value="' + r.value + '"><label class="pickcard" for="' + id + '">' + lb.innerHTML + '</label>');
    }
  };
  add($('rModeGrid'), 'rmode', 'mode'); add($('rStageGrid'), 'rstage', 'stage');
  const drive = (name, sel) => { for (const r of document.querySelectorAll('input[name=' + name + ']')) r.addEventListener('change', () => {
    if (Net.role !== 'host' || !r.checked) return;
    $(sel).value = r.value; $(sel).dispatchEvent(new Event('change'));
    renderRoomView();
  }); };
  drive('rmode', 'rMode'); drive('rstage', 'rStage');
}
function syncRoomPicks(host){
  const c = Net.cfg || [], mode = host ? G.cfg.mode : MODE_KEYS[Number(c[4])] || 'ffa', stage = host ? G.cfg.stage : STAGE_KEYS[Number(c[3])] || 'titanic';
  for (const i of document.querySelectorAll('#rPick input')) i.disabled = !host;
  const m = $('rmd-' + mode), st = $('rsg-' + stage);
  if (m) m.checked = true;
  if (st) st.checked = true;
  $('rStageGrid').classList.toggle('off', mode === 'boss');
  $('rStageNote').textContent = mode === 'boss' ? '· โหมดตีบอสเล่นที่ด่านคริสต์มาสเสมอ' : '';
  $('rPickWho').textContent = host ? '· กดเลือกได้เลย' : '· host เป็นคนเลือก';
}
buildRoomPicks();
loadStageThumbs(); syncStagePick(); setSummary();
for (const r of document.querySelectorAll('input[name=mode]')) r.addEventListener('change', syncStagePick);
$('rStart').onclick = () => { if (Net.role === 'host') Net.start(); };
$('lobbyCust').onclick = $('roomCust').onclick = customizeFromOnline;
G.myTeam = -1;
try { const t = Number(localStorage.getItem('skybrawl.team')); if (t === 0 || t === 1) G.myTeam = t; } catch (e) {}
for (const b of $('teamRow').querySelectorAll('button')) b.onclick = () => {
  G.myTeam = Number(b.dataset.tm);
  try { localStorage.setItem('skybrawl.team', String(G.myTeam)); } catch (e) {}
  if (Net.role === 'host') Net.refreshSlots();
  else if (Net.role === 'guest') Net.presence({tm:G.myTeam});
  renderRoomView();
};
$('rLeave').onclick = () => { Net.leave(); hideAllPanels(); $('online').hidden = false; showLobbyView(); };
const CAM_LEVELS = [{name:'ใกล้', k:.75}, {name:'ปกติ', k:1}, {name:'กว้าง', k:1.4}, {name:'กว้างมาก', k:1.9}, {name:'ทั้งด่าน', all:true}];
G.camZoom = 1;
try { const cz = Number(localStorage.getItem('skybrawl.cam')); if (cz >= 0 && cz < CAM_LEVELS.length) G.camZoom = cz; } catch (e) {}
function camStep(d){
  G.camZoom = Math.max(0, Math.min(CAM_LEVELS.length - 1, G.camZoom + d));
  $('camBtn').textContent = 'กล้อง: ' + CAM_LEVELS[G.camZoom].name;
  try { localStorage.setItem('skybrawl.cam', String(G.camZoom)); } catch (e) {}
}
camStep(0);
$('autoBtn').onclick = e => { toggleAuto('p1'); e.currentTarget.blur(); };
// Auto-aim: on unless the player turned it off
G.autoLock = true;
try { G.autoLock = localStorage.getItem('skybrawl.autoLock') !== '0'; } catch (e) {}
function setAutoLock(on){
  G.autoLock = !!on;
  try { localStorage.setItem('skybrawl.autoLock', on ? '1' : '0'); } catch (e) {}
  $('aimBtn').textContent = 'เล็ง: ' + (on ? 'ออโต้' : 'กดเอง'); $('aimBtn').classList.toggle('on', !!on);
  $(on ? 'al-on' : 'al-off').checked = true;
  if (!on) for (const f of G.fighters) if (f.isLocal && f.autoPicked) f.lock = null;
  if (G.net === 'guest') Net.lastIn = '';   // resend the input row so the host hears the new setting
}
setAutoLock(G.autoLock);
$('aimBtn').onclick = e => { setAutoLock(!G.autoLock); e.currentTarget.blur(); };
for (const r of document.querySelectorAll('input[name=al]')) r.addEventListener('change', () => setAutoLock(r.value === '1'));
$('camBtn').onclick = () => camStep(G.camZoom === CAM_LEVELS.length - 1 ? -G.camZoom : 1);
{
  let acc = 0;
  canvas.addEventListener('wheel', e => {
    if (G.mode !== 'play') return;
    e.preventDefault(); acc += e.deltaY;
    if (Math.abs(acc) > 90){ camStep(acc > 0 ? 1 : -1); acc = 0; }
  }, {passive:false});
}
$('pauseBtn').onclick = () => { if ($('result').hidden) togglePause(true); };
$('spec').onclick = () => {
  const list = G.fighters.filter(f => alive(f) && f.stocks > 0); if (!list.length) return;
  const i = list.findIndex(f => f.idx === G.spec); G.spec = list[(i + 1) % list.length].idx;
};
$('resume').onclick = () => togglePause(false);
$('restart').onclick = () => G.tut ? startTutorial() : startOffline(G.kind, G.quick && {...G.quick, stage:G.cfg.stage});
$('toMenu').onclick = () => { if (G.net){ Net.leave(); hideAllPanels(); enterAttract(); $('online').hidden = false; showLobbyView(); } else toMenu(); };
$('dbgBtn').onclick = toggleDebug;
$('rematch').onclick = () => { if (G.net) Net.backToRoom(); else if (G.quick) quickPlay(); else startOffline(G.kind); };
$('resMenu').onclick = () => { if (G.net){ Net.leave(); hideAllPanels(); enterAttract(); $('online').hidden = false; showLobbyView(); } else toMenu(); };
$('cdone').onclick = () => {
  saveLooks();
  const next = G.customNext; G.customNext = null;
  if (next){ hideAllPanels(); next(); } else toMenu();
};
$('cback').onclick = closeCustom;
for (const b of document.querySelectorAll('#custom .ctabs .tab')) b.onclick = () => selectSlot(+b.dataset.slot);
$('cname').addEventListener('input', e => {
  LOOKS[G.editSlot].name = cleanName(e.target.value, DEF_LOOKS[G.editSlot].name);
  saveLooks();
});
$('crand').onclick = () => { const r = randomLook(''); delete r.name; setLookVals(r); };

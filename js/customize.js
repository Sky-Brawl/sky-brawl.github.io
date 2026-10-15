// Sky Brawl · customize.js — หน้าแต่งตัว/เลือกอาชีพ + รูปการ์ดอาชีพ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Customize screen ---------- */
// Role and difficulty (1 easy … 3 hard) of every class, for the picker's tabs and stars
const ROLE_NAME = {melee:'ระยะใกล้', ranged:'ระยะไกล', magic:'เวทย์วงกว้าง', support:'ซัพพอร์ต/ฮีล', special:'แปลงร่าง/อัญเชิญ'};
const CLASS_META = {
  none:['melee', 1], knight:['melee', 1], warrior:['melee', 1], berserker:['melee', 2], paladin:['melee', 2], mage:['magic', 1], priest:['support', 1],
  necro:['magic', 2], druid:['magic', 2], archer:['ranged', 1], assassin:['melee', 3], ninja:['melee', 2], samurai:['melee', 2], monk:['melee', 2],
  bard:['magic', 2], gunner:['ranged', 1], engineer:['special', 2], pony:['melee', 1], gundam:['ranged', 2], merchant:['melee', 1], blacksmith:['melee', 2],
  hunter:['ranged', 2], wizard:['magic', 2], crusader:['magic', 3], alchemist:['ranged', 2], rogue:['melee', 3], taekwon:['melee', 1], acolyte:['support', 2],
  frost:['magic', 2], demon:['melee', 2], spacecop:['ranged', 2], soldier:['ranged', 1], volt:['magic', 2], werewolf:['special', 2], tamer:['special', 2],
  shaman:['special', 1], lancer:['melee', 1], reaper:['special', 2], dragonblade:['special', 2],
};
const CLASS_TABS = [['easy', '⭐ แนะนำมือใหม่'], ['melee', 'ระยะใกล้'], ['ranged', 'ระยะไกล'], ['magic', 'เวทย์'], ['support', 'ซัพพอร์ต'], ['special', 'แปลงร่าง/อัญเชิญ'], ['all', 'ทั้งหมด']];
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const OPTS = [
  {key:'outfit', label:'อาชีพ (ได้ชุดและสกิลประจำอาชีพ)', choices:Object.fromEntries(ON_K.map(k => [k, OUTFITS[k].name]))},
  {key:'oc', label:'สีชุดอาชีพ', tints:OUTFIT_TINTS},
  {key:'body', label:'สีชุด (ใช้ตอนไม่ใส่ชุดอาชีพ)', colors:BODY_COLORS},
  {key:'skin', label:'สีผิว', colors:SKIN_COLORS},
  {key:'hair', label:'ทรงผม', choices:HAIRS},
  {key:'hairColor', label:'สีผม', colors:HAIR_COLORS},
  {key:'hat', label:'ของบนหัว', choices:HATS},
  {key:'title', label:'ฉายาเหนือหัว (ปลดล็อกจากรางวัลรายวัน)', choices:TITLES},
  {key:'eyes', label:'ดวงตา', choices:EYES},
];
for (const o of OPTS){
  const sec = document.createElement('div'); sec.className = 'opt';
  const h = document.createElement('h4'); h.textContent = o.label; sec.appendChild(h);
  const row = document.createElement('div'); row.className = o.colors || o.tints ? 'sw' : 'chips';
  if (o.tints) sec.id = 'ocOpt';
  const entries = o.tints ? o.tints.map((T, n) => [n, o.label + ' ' + T.name]) : o.colors ? o.colors.map((c, n) => [c, o.label + ' แบบที่ ' + (n + 1)]) : Object.entries(o.choices);
  for (const [val, text] of entries){
    const b = document.createElement('button'); b.type = 'button';
    b.dataset.key = o.key; b.dataset.val = String(val);
    if (o.tints){ b.style.background = o.tints[val].show; b.setAttribute('aria-label', text); b.title = o.tints[val].name; }
    else if (o.colors){ b.style.background = hex(val); b.setAttribute('aria-label', text); } else b.textContent = text;
    b.onclick = () => { if (lockedItem(o.key, val)) lockedHint(val); else setLookVals({[o.key]: val}); };
    row.appendChild(b);
  }
  sec.appendChild(row); $('copts').appendChild(sec);
}
{
  const sec = $('copts').querySelector('.opt'), old = sec.querySelector('.chips');
  const tabs = document.createElement('div'); tabs.className = 'chips cfilter'; tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'กรองอาชีพ');
  for (const [id, label] of CLASS_TABS){ const b = document.createElement('button'); b.type = 'button'; b.dataset.tab = id; b.textContent = label; b.onclick = () => setClassTab(id); tabs.appendChild(b); }
  const grid = document.createElement('div'); grid.className = 'cgrid';
  for (const k of ON_K){
    const [role, st] = CLASS_META[k] || ['melee', 2];
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ccard';
    b.dataset.key = 'outfit'; b.dataset.val = k; b.dataset.role = role; b.dataset.star = st;
    const img = document.createElement('span'); img.className = 'cimg';
    const n = document.createElement('span'); n.className = 'cn'; n.textContent = k === 'none' ? 'ไม่มีอาชีพ' : OUTFITS[k].name;
    const sr = document.createElement('span'); sr.className = 'cs'; sr.textContent = stars(st);
    b.title = ROLE_NAME[role] + ' · ความยาก ' + st + '/3';
    b.append(img, n, sr); b.onclick = () => setLookVals({outfit:k});
    grid.appendChild(b);
  }
  old.replaceWith(tabs, grid);
}
function setClassTab(id){
  for (const b of document.querySelectorAll('.cfilter button')) b.setAttribute('aria-pressed', String(b.dataset.tab === id));
  for (const c of document.querySelectorAll('.ccard')) c.hidden = !(id === 'all' || (id === 'easy' ? c.dataset.star === '1' : c.dataset.role === id));
  try { localStorage.setItem('skybrawl.clsTab', id); } catch (e) {}
}
{
  let tab = null; try { tab = localStorage.getItem('skybrawl.clsTab'); } catch (e) {}
  setClassTab(CLASS_TABS.some(t => t[0] === tab) ? tab : 'easy');
}

/* ---------- Class portraits: each class's real model rendered once on a plain backdrop, kept in localStorage ---------- */
const CLS_VER = 'c2', CLASS_THUMBS = {};
let clsScene = null, clsCam = null, clsRT = null;
function classThumb(k){
  const W = 256;
  if (!clsScene){
    clsScene = new THREE.Scene(); clsScene.background = new THREE.Color(0xfff4dc);
    clsScene.add(new THREE.HemisphereLight(0xffffff, 0x9a8a70, .95));
    const d = new THREE.DirectionalLight(0xffffff, .55); d.position.set(2, 4, 3); clsScene.add(d);
    clsCam = new THREE.PerspectiveCamera(30, 1, .1, 50); clsRT = new THREE.WebGLRenderTarget(W, W);
  }
  const v = buildChibi({...DEF_LOOKS[0], hat:'none', outfit:k, oc:0}, 0xffffff);
  scene.remove(v.root, v.hurt, v.hit);
  for (const o of [v.bubble, v.bomb, v.hammer, v.gun, v.shotgun]) if (o) o.visible = false;
  v.armR.rotation.set(-.7, 0, -.25); v.armL.rotation.set(-.35, 0, .3);
  v.root.rotation.y = .45; clsScene.add(v.root);
  clsCam.position.set(0, 1.5, 3.5); clsCam.lookAt(0, 1.32, 0);
  renderer.setRenderTarget(clsRT); renderer.render(clsScene, clsCam);
  const px = new Uint8Array(W*W*4); renderer.readRenderTargetPixels(clsRT, 0, 0, W, W, px);
  renderer.setRenderTarget(null);
  clsScene.remove(v.root); v.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  const big = document.createElement('canvas'); big.width = big.height = W;
  const bc = big.getContext('2d'), img = bc.createImageData(W, W);
  for (let y = 0; y < W; y++) img.data.set(px.subarray((W - 1 - y)*W*4, (W - y)*W*4), y*W*4);
  bc.putImageData(img, 0, 0);
  const sm = document.createElement('canvas'); sm.width = sm.height = W/2;
  sm.getContext('2d').drawImage(big, 0, 0, W/2, W/2);
  return sm.toDataURL('image/jpeg', .82);
}
function paintClassCard(k){
  const c = document.querySelector('.ccard[data-val="' + k + '"] .cimg'); if (!c) return;
  if (CLASS_THUMBS[k]) c.style.backgroundImage = 'url(' + CLASS_THUMBS[k] + ')';
  else { const o = OUTFITS[k]; c.style.backgroundImage = 'none'; c.style.backgroundColor = hex(o && o.body ? o.body : 0xfff4dc); }
}
for (const k of ON_K){
  try { const v = localStorage.getItem('skybrawl.cls.' + k); if (v && v.startsWith(CLS_VER + '|')) CLASS_THUMBS[k] = v.slice(CLS_VER.length + 1); } catch (e) {}
  paintClassCard(k);
}
// Two portraits a frame while the customize panel is open, visible cards first
function classThumbStep(){
  if ($('custom').hidden) return;
  let n = 0;
  for (const pass of [false, true]) for (const b of document.querySelectorAll('.ccard')){
    const k = b.dataset.val;
    if (CLASS_THUMBS[k] !== undefined || b.hidden !== pass) continue;
    try { CLASS_THUMBS[k] = classThumb(k); } catch (e) { CLASS_THUMBS[k] = ''; console.warn('[class picture] ' + k, e); continue; }
    try { localStorage.setItem('skybrawl.cls.' + k, CLS_VER + '|' + CLASS_THUMBS[k]); } catch (e) {}
    paintClassCard(k);
    if (++n >= 2) return;
  }
}
function reflectCustom(){
  const look = LOOKS[G.editSlot];
  for (const b of document.querySelectorAll('#copts button[data-key]')) b.setAttribute('aria-pressed', String(b.dataset.key === 'oc' ? tintOf(look) : look[b.dataset.key] || (b.dataset.key === 'title' ? 'none' : '')) === b.dataset.val);
  for (const b of document.querySelectorAll('#copts button[data-key="hat"], #copts button[data-key="title"]')){
    const lock = lockedItem(b.dataset.key, b.dataset.val);
    b.classList.toggle('locked', lock);
    b.textContent = (lock ? '🔒 ' : '') + (b.dataset.key === 'hat' ? HATS : TITLES)[b.dataset.val];
  }
  $('ocOpt').hidden = !OUTFITS[look.outfit] || !OUTFITS[look.outfit].build;
  for (const b of document.querySelectorAll('#custom .ctabs .tab')) b.setAttribute('aria-pressed', b.dataset.slot === String(G.editSlot));
  $('cname').value = look.name;
  const k = OUTFITS[look.outfit] ? look.outfit : 'none', si = SKILL_INFO[k] || SKILL_INFO.none, box = $('skillInfo');
  box.textContent = '';
  const b = document.createElement('b'); b.textContent = (k === 'none' ? 'ไม่มีอาชีพ' : OUTFITS[k].name) + ' · ' + MOVES[skillKey(k)].name;
  const p = document.createElement('div'); p.textContent = si.desc + ' · คูลดาวน์ ' + Math.round(si.cd/60) + ' วินาที · กด E (มือถือกดปุ่มสกิล)';
  box.append(b, p);
  const meta = CLASS_META[k];
  if (meta){ const r = document.createElement('div'); r.className = 'crole'; r.textContent = 'แนว: ' + ROLE_NAME[meta[0]] + ' · ความยาก ' + stars(meta[1]); box.appendChild(r); }
}
function setLookVals(patch){
  const i = G.editSlot;
  LOOKS[i] = {...LOOKS[i], ...patch};
  const f = G.fighters[0]; f.setLook(LOOKS[i]); f.squash = 10;
  emit(STAGE.preview.clone().add(new V(0, 1.6, .4)), 8, 0xffc23a, 2.5, 3, 18, 1, 4);
  saveLooks(); reflectCustom();
}
function selectSlot(i){
  G.editSlot = i;
  const f = G.fighters[0]; f.setLook(LOOKS[i]); f.squash = 10;
  reflectCustom();
}
function openCustom(next){
  G.customNext = typeof next === 'function' ? next : null; G.customBack = null;
  $('custom').classList.remove('single');
  $('cdone').textContent = G.customNext ? 'พร้อมแล้ว เริ่มเลย' : 'เสร็จ';
  $('cback').hidden = !G.customNext;
  hideAllPanels(); clearArena();
  G.mode = 'custom';
  createFighters([{name:'', ctrl:'none', look:LOOKS[G.editSlot]}], 99, false);
  G.fighters[0].reset(STAGE.preview.clone(), 0, 99);
  $('custom').hidden = false;
  reflectCustom();
}
function closeCustom(){
  const back = G.customBack; G.customNext = null; G.customBack = null; saveLooks();
  if (back) back(); else toMenu();
}
function updateMyClass(){
  const k = LOOKS[0].outfit, o = OUTFITS[k];
  $('myClass').textContent = 'อาชีพของคุณ: ' + (o && k !== 'none' && CLASS_ON.has(k) ? o.name : 'ไม่มีอาชีพ');
}
// Customise from the online lobby or from inside a room, then land back where you were
function customizeFromOnline(){
  const back = () => {
    saveLooks(); enterAttract(); hideAllPanels(); $('online').hidden = false;
    if (Net.role) showRoomView(); else showLobbyView();
    Net.lookChanged();
  };
  G.editSlot = 0;
  openCustom(back);
  G.customBack = back;
  $('custom').classList.add('single');
  $('cdone').textContent = 'บันทึก'; $('cback').hidden = true;
}

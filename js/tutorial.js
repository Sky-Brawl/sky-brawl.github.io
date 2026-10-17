// Sky Brawl · tutorial.js — ปุ่มเล่นเลย + สอนเล่น
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Wiring ---------- */
$('nf').addEventListener('input', e => { $('nfOut').textContent = e.target.value; });
// One tap: 3 easy bots, a random stage, free-for-all, the class you already wear
function quickPlay(){
  // A brand-new player gets the tutorial first; it ends with a button that comes back here
  if (!tutSeen() && !(Progress.stats && Progress.stats.matches > 0)){ startTutorial(); return; }
  ensureName(() => {
    const pool = STAGE_KEYS.filter(k => $('sg-' + k) && !STAGES[k].walls);
    hideAllPanels();
    startOffline('solo', {n:8, st:2, df:'easy', mode:'ffa', stage:pool[Math.floor(Math.random()*pool.length)]});
  });
}
$('quickPlay').onclick = quickPlay;
$('tutBtn').onclick = startTutorial;

/* ---------- Tutorial: seven small tasks against a training dummy that never fights back unless told to ---------- */
const TUT_KEY = 'skybrawl.tutDone';
const tutSeen = () => { try { return localStorage.getItem(TUT_KEY) === '1'; } catch (e) { return true; } };
const TUT_HOW_TOUCH = {move:'ลากนิ้วที่ครึ่งซ้ายของจอ', jump:'ปุ่ม "กระโดด"', atk:'ปุ่ม "ต่อย" (กดรัว = คอมโบ)', guard:'กดค้างปุ่ม "กัน"', skill:'ปุ่ม "สกิล"', grab:'เดินไปทับแล้วกดปุ่ม "ต่อย" หรือ "หยิบ"'};
const TUT_HOW_KEYS = {move:'ปุ่ม W A S D', jump:'ปุ่ม G หรือ Space', atk:'ปุ่ม F (กดรัว = คอมโบ)', guard:'กดค้างปุ่ม H', skill:'ปุ่ม E', grab:'เดินไปทับแล้วกด F หรือ R'};
const TUT_STEPS = [
  {id:'move', btn:'move', text:'เดินไปที่ช่องสีทอง'},
  {id:'jump', btn:'jump', text:'กระโดด 2 ครั้ง', need:2},
  {id:'atk', btn:'atk', text:'ต่อยหุ่นซ้อมให้โดน 3 ครั้ง', need:3},
  {id:'guard', btn:'guard', text:'หุ่นจะต่อยกลับ! เข้าไปใกล้แล้วกดกันให้ป้องกันได้ 1 ครั้ง'},
  {id:'skill', btn:'skill', text:'ใช้สกิลประจำอาชีพ'},
  {id:'grab', btn:'grab', text:'หยิบค้อนที่ตกลงมา'},
  {id:'ring', btn:'atk', text:'ซัดหุ่นซ้อมให้ตกขอบ! ยิ่งเลือดน้อย ยิ่งกระเด็นไกล', how:'ตามลูกศรขอบจอไปหาหุ่น แล้วฟาดค้อนให้ปลิวออกนอกเรือ (หรือเสยให้ลอย กระโดดตาม แล้วต่อยกลางอากาศ 3 ครั้ง ท่าสุดท้ายทุบดิ่งลงนอกเรือ)'},
];
function startTutorial(){
  ensureName(() => {
    hideAllPanels();
    startOffline('solo', {n:2, st:3, df:'easy', mode:'ffa', stage:'titanic'});
    const dm = G.fighters[1];
    dm.ctrl = 'net'; dm.peer = ''; dm.name = 'หุ่นซ้อม';
    dm.setLook({...dm.look, outfit:'none', name:'หุ่นซ้อม'});
    if (dm.tag) dm.tag.name.textContent = 'หุ่นซ้อม';
    buildHud();
    G.tut = {i:0, init:false, key:'', cam:G.camZoom}; G.camZoom = Math.min(G.camZoom, 1); $('camBtn').textContent = 'กล้อง: ' + CAM_LEVELS[G.camZoom].name;   // close camera while learning; the saved setting comes back after
    $('tutBox').hidden = false; document.body.classList.add('tutOn'); tutRender(); requestAnimationFrame(tutPlace);
  });
}
function tutHighlight(k){
  for (const e of document.querySelectorAll('.tut-hl')) e.classList.remove('tut-hl');
  if (!k) return;
  const el = k === 'move' ? $('joy') : document.querySelector('#tbtns button[data-k="' + k + '"]');
  if (el) el.classList.add('tut-hl');
}
function tutPlace(){ const b = $('hud').getBoundingClientRect().bottom; if (b > 0) $('tutBox').style.top = Math.round(b + 8) + 'px'; }
function tutClose(){
  document.body.classList.remove('tutOn');
  const T = G.tut; G.tut = null;
  if (T && T.mark) scene.remove(T.mark);
  if (T){ G.camZoom = T.cam; $('camBtn').textContent = 'กล้อง: ' + CAM_LEVELS[G.camZoom].name; }
  $('tutBox').hidden = true; tutHighlight(null);
}
function tutEnter(T, st, me, dm){
  T.n = 0; T.air = false;
  if (st.id === 'move'){
    let x = me.pos.x + (me.pos.x > 0 ? -7 : 7), z = me.pos.z*.3;
    if (!onDeck(x, z, 1.5) || inBlock(x, z, 1)){ x = 0; z = 0; }
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, .12, 2.2), new THREE.MeshBasicMaterial({color:0xffd23a, transparent:true, opacity:.75}));
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6, 1.6), new THREE.MeshBasicMaterial({color:0xffe680, transparent:true, opacity:.22, depthWrite:false})); beam.position.y = 3; m.add(beam);
    m.position.set(x, .08, z); scene.add(m); T.mark = m;
  }
  if (st.id === 'atk') T.h0 = me.hits;
  if (st.id === 'skill') me.skillCd = 0;
  if (st.id === 'grab'){
    const a = me.facing, x = me.pos.x + Math.sin(a)*2.5, z = me.pos.z + Math.cos(a)*2.5;
    addItem('hammer', onDeck(x, z, 1) ? {x, y:4, z} : {x:me.pos.x, y:4, z:me.pos.z}, 0);
  }
  if (st.id === 'ring'){
    // Put the dummy a step from the rail, on the side it is already on
    let dx = dm.pos.x, dz = dm.pos.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; if (Math.hypot(dm.pos.x, dm.pos.z) < .5){ dx = 1; dz = 0; }
    let r = 0; while (r < 80 && onDeck(dx*(r + .5), dz*(r + .5), 0)) r += .5;
    dm.pos.set(dx*Math.max(0, r - 1.8), 0, dz*Math.max(0, r - 1.8)); dm.vel.set(0, 0, 0);
  }
}
function tutTick(){
  const T = G.tut;
  if (G.mode !== 'play' || G.net){ tutClose(); return; }
  const me = G.fighters[0], dm = G.fighters[1]; if (!me || !dm) return;
  G.itemTimer = 99999;
  for (const f of [me, dm]) if (f.stocks < 3) f.stocks = 3;
  if (G.frame % 15 === 0) tutPlace();
  if (T.mark) T.mark.material.opacity = .5 + Math.sin(G.frame*.15)*.3;
  if (G.countdown > 30 || T.done) return;
  const st = TUT_STEPS[T.i];
  if (!T.init){ T.init = true; tutEnter(T, st, me, dm); }
  if (st.id !== 'ring' && alive(dm) && dm.hp < MAX_HP*.5) dm.hp = MAX_HP;
  let ok = false;
  switch (st.id){
    case 'move': ok = Math.hypot(me.pos.x - T.mark.position.x, me.pos.z - T.mark.position.z) < 1.5 && me.pos.y < 1; break;
    case 'jump':
      if (!me.onGround && me.vel.y > JUMP*.7 && !T.air){ T.air = true; T.n++; }
      if (me.onGround) T.air = false;
      ok = T.n >= 2; break;
    case 'atk': T.n = me.hits - T.h0; ok = T.n >= 3; break;
    case 'guard': {
      ok = me.state === 'guardstun';
      const d = Math.hypot(me.pos.x - dm.pos.x, me.pos.z - dm.pos.z);
      if (!ok && alive(dm) && dm.state === 'idle' && d < 2.4 && G.frame - (T.lastAtk || 0) > 70){
        dm.facing = Math.atan2(me.pos.x - dm.pos.x, me.pos.z - dm.pos.z); startMove(dm, 'jab1'); T.lastAtk = G.frame;
      }
      break;
    }
    case 'skill':
      ok = me.state === 'attack' && !!me.moveKey && me.moveKey.startsWith('sk_');
      if (!ok && me.state !== 'attack') me.skillCd = 0;
      break;
    case 'grab': ok = !!me.weapon; if (!ok && !G.items.length) tutEnter(T, st, me, dm); break;
    case 'ring':
      ok = ['wait', 'out', 'respawn', 'ko'].includes(dm.state) || dm.pos.y < SEA_Y;
      if (!ok && alive(dm)) dm.hp = Math.min(dm.hp, MAX_HP*.2);
      break;
  }
  if (ok){
    if (T.mark){ scene.remove(T.mark); T.mark = null; }
    popup(new V(me.pos.x, me.pos.y + 3, me.pos.z), 'ผ่าน!', 'combo th', 40); Sfx.play('pickup', me.pos);
    T.i++; T.init = false;
    if (T.i >= TUT_STEPS.length){ T.done = true; try { localStorage.setItem(TUT_KEY, '1'); } catch (e) {} Sfx.play('win'); }
  }
  tutRender();
}
function tutRender(){
  const T = G.tut; if (!T) return;
  const N = TUT_STEPS.length, st = TUT_STEPS[Math.min(T.i, N - 1)];
  const key = T.done ? 'done' : T.i + ':' + T.n;
  if (key === T.key) return;
  T.key = key;
  const box = $('tutBox'); box.textContent = '';
  const head = document.createElement('div'); head.className = 'th';
  const lab = document.createElement('span'); lab.textContent = T.done ? 'สอนเล่นครบแล้ว' : 'สอนเล่น ' + (T.i + 1) + '/' + N;
  const dots = document.createElement('span'); dots.className = 'tdots';
  for (let i = 0; i < N; i++){ const d = document.createElement('i'); if (i < T.i || T.done) d.className = 'on'; else if (i === T.i) d.className = 'cur'; dots.appendChild(d); }
  head.append(lab, dots);
  const tt = document.createElement('div'); tt.className = 'tt';
  const tw = document.createElement('div'); tw.className = 'tw';
  box.append(head, tt, tw);
  if (T.done){
    tt.textContent = 'เยี่ยมมาก! พร้อมลุยของจริงแล้ว';
    tw.textContent = 'ทิปส์: ผลักคู่แข่งตกขอบคือวิธีชนะที่เร็วที่สุด · ข้าวปั้นฟื้นพลัง · ระเบิดหยิบแล้วกดอีกครั้งเพื่อขว้าง';
    const row = document.createElement('div'); row.className = 'tbtns';
    const go = document.createElement('button'); go.type = 'button'; go.className = 'btn red'; go.textContent = '▶ เริ่มเล่นจริง';
    go.onclick = () => { tutClose(); quickPlay(); };
    const back = document.createElement('button'); back.type = 'button'; back.className = 'btn plain'; back.textContent = 'กลับเมนู';
    back.onclick = () => { tutClose(); toMenu(); };
    row.append(go, back); box.appendChild(row);
    tutHighlight(null);
    return;
  }
  tt.textContent = st.text + (st.need ? '  (' + Math.min(T.n, st.need) + '/' + st.need + ')' : '');
  tw.textContent = st.how || (IS_TOUCH ? TUT_HOW_TOUCH : TUT_HOW_KEYS)[st.id];
  const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'tskip'; skip.textContent = 'ข้ามบทสอน';
  skip.onclick = () => { try { localStorage.setItem(TUT_KEY, '1'); } catch (e) {} tutClose(); toMenu(); };
  head.appendChild(skip);
  tutHighlight(IS_TOUCH ? st.btn : null);
}

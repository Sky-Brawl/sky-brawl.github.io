// Sky Brawl · hud.js — แถบเลือด ป้ายชื่อ ลูกศรศัตรูนอกจอ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- HUD ---------- */
function makeTag(f){
  const el = document.createElement('div'); el.className = 'tag' + (f.isLocal ? ' me' : '');
  if (f.isLocal){ const a = document.createElement('div'); a.className = 'marr'; el.appendChild(a); }
  const n = document.createElement('div'); n.className = 'tn'; n.textContent = f.isLocal ? '▼ ' + f.name : f.name;
  if (!f.isLocal) n.style.color = hex(f.team);
  if (!f.isLocal && G.fighters.length > 40) n.style.display = 'none';
  const b = document.createElement('div'); b.className = 'tb'; const i = document.createElement('i'); b.appendChild(i);
  const ti = f.look && f.look.title && f.look.title !== 'none' && TITLES[f.look.title];
  if (ti){ const t = document.createElement('div'); t.className = 'tt'; t.textContent = '« ' + ti + ' »'; t.style.display = n.style.display; el.appendChild(t); }
  el.append(n, b); $('tags').appendChild(el);
  f.tag = {el, bar:i, hp:-1, name:n};
}
function updateTags(w, h){
  for (const f of G.fighters){
    if (!f.tag) continue;
    const el = f.tag.el;
    if (!alive(f) || f.pos.y < SEA_Y || f.hidden){ el.style.opacity = 0; continue; }
    tmpV.set(f.pos.x, f.pos.y + 2.35*f.vis.root.scale.x, f.pos.z).project(camera);
    if (tmpV.z > 1 || Math.abs(tmpV.x) > 1.1 || Math.abs(tmpV.y) > 1.1){ el.style.opacity = 0; continue; }
    el.style.opacity = 1;
    el.style.transform = `translate(${(tmpV.x*.5 + .5)*w}px,${(-tmpV.y*.5 + .5)*h}px) translate(-50%,-100%)`;
    syncEmoteTag(f);
    const hp = Math.ceil(f.hp);
    if (hp !== f.tag.hp){ f.tag.hp = hp; f.tag.bar.style.width = Math.min(100, hp/MAX_HP*100) + '%'; }
  }
}
/* ---------- Play aids: red screen edge when you are about to fall, arrows toward enemies off screen ---------- */
const OFF_N = 4, offEls = [];
for (let i = 0; i < OFF_N; i++){ const e = document.createElement('i'); $('offs').appendChild(e); offEls.push(e); }
const _ov = new V();
function hideAids(){ G.aidsOn = false; $('edgeWarn').style.opacity = 0; for (const e of offEls) e.style.display = 'none'; }
function updateAids(w, h){
  G.aidsOn = true;
  const me = G.fighters.find(f => f.isLocal && alive(f) && !['ko', 'respawn'].includes(f.state) && f.pos.y > SEA_Y);
  // Edge: how close the nearest drop is (walls that you can't fall past don't count)
  let danger = 0;
  if (me && G.countdown <= 30){
    const x = me.pos.x, z = me.pos.z, wall = inBlock(x, z, 1.6);
    if (!STAGE.walls && !(wall && wall.kind === 'edge')) danger = !onDeck(x, z, 0) ? 1 : !onDeck(x, z, 1) ? .85 : !onDeck(x, z, 2) ? .45 : 0;
  }
  $('edgeWarn').style.opacity = danger ? danger*(.65 + .35*Math.sin(G.frame*.25)) : 0;
  // Off-screen enemies: the nearest few get an arrow on the screen edge, in their colour
  let used = 0;
  if (me){
    const foes = [];
    for (const o of G.fighters){
      if (o === me || ally(me, o) || !alive(o) || o.state === 'ko' || o.pos.y < SEA_Y || o.hidden) continue;
      _ov.set(o.pos.x, o.pos.y + 1, o.pos.z).project(camera);
      const behind = _ov.z > 1;
      if (!behind && Math.abs(_ov.x) < .96 && Math.abs(_ov.y) < .94) continue;
      foes.push({o, x:behind ? -_ov.x : _ov.x, y:behind ? -_ov.y : _ov.y, d:Math.hypot(o.pos.x - me.pos.x, o.pos.z - me.pos.z)});
    }
    foes.sort((a, b) => a.d - b.d);
    for (const f of foes.slice(0, OFF_N)){
      const k = 1/Math.max(Math.abs(f.x), Math.abs(f.y), .001);
      const sx = Math.min(w - 26, Math.max(26, (f.x*k*.5 + .5)*w)), sy = Math.min(h - 26, Math.max(26, (-f.y*k*.5 + .5)*h));
      const el = offEls[used++];
      el.style.display = 'block'; el.style.background = hex(f.o.team);
      el.style.transform = `translate(${sx}px,${sy}px) rotate(${Math.atan2(-f.y, f.x)}rad)`;
    }
  }
  for (let i = used; i < OFF_N; i++) offEls[i].style.display = 'none';
}
function buildHud(){
  const cards = $('cards'); cards.textContent = '';
  for (const f of G.fighters.filter(f => f.isLocal)){
    const c = document.createElement('div'); c.className = 'pcard'; c.style.setProperty('--c', hex(f.team));
    c.innerHTML = `<img class="pface" alt=""><div class="row"><span class="pname"></span><span class="pitem">มือเปล่า</span></div>
      <div class="hp"><div class="lag"></div><div class="fill"></div></div>
      <div class="row"><span class="stocks"></span><span class="hpnum">${MAX_HP}</span></div>
      <div class="skrow"><span class="skn"></span><div class="skbar"><i></i></div></div>
      <div class="stam"><i></i></div>`;
    c.querySelector('.pname').textContent = ((f.ctrl === 'p1' || (G.net === 'guest' && f.isLocal)) && Progress.level ? 'Lv.' + Progress.level + ' ' : '') + f.name;
    cards.appendChild(c);
    try { c.querySelector('.pface').src = facePortrait(f.look, 'normal'); } catch (e) { console.warn('[face]', e); }
    f.card = {el:c, face:c.querySelector('.pface'), fill:c.querySelector('.fill'), lag:c.querySelector('.lag'), item:c.querySelector('.pitem'), stocks:c.querySelector('.stocks'), hpn:c.querySelector('.hpnum'), sk:c.querySelector('.skn'), skb:c.querySelector('.skbar i'), stam:c.querySelector('.stam i'), k:{}};
  }
  const rows = $('brows'); rows.textContent = '';
  for (const f of G.fighters){
    const r = document.createElement('div'); r.className = 'brow' + (f.isLocal ? ' me' : '');
    const dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = hex(f.team);
    const n = document.createElement('span'); n.className = 'bn'; n.textContent = f.name;
    const s = document.createElement('span'); s.className = 'bs';
    r.append(dot, n, s); rows.appendChild(r);
    f.brow = {el:r, s, k:''};
  }
}
function updateHud(){
  for (const f of G.fighters){
    if (f.card){
      const c = f.card;
      f.hpLag += (f.hp - f.hpLag)*(f.hpLag > f.hp ? .04 : 1);
      c.fill.style.width = Math.max(0, f.hp)/MAX_HP*100 + '%'; c.lag.style.width = Math.max(0, f.hpLag)/MAX_HP*100 + '%';
      const hp = Math.ceil(Math.max(0, f.hp)); if (c.k.hp !== hp){ c.k.hp = hp; c.hpn.textContent = hp; }
      if (c.k.st !== f.stocks){ c.k.st = f.stocks; c.stocks.innerHTML = Array.from({length:G.stocks}, (_, n) => `<span class="pip${n < f.stocks ? '' : ' off'}"></span>`).join(''); }
      const item = f.held === 'bomb' ? 'ถือระเบิด' : f.weapon ? WEAPON_INFO[f.weapon].name + ' ×' + f.weaponUses : 'มือเปล่า';
      if (c.k.item !== item){ c.k.item = item; c.item.textContent = item; }
      const si = SKILL_INFO[f.cls] || SKILL_INFO.none, ready = f.skillCd <= 0;
      const skt = MOVES[skillKey(f.cls)].name + (f.formT > 0 ? ' · กำลังแปลงร่าง' : ready ? ' · พร้อม' : ' · ' + Math.ceil(f.skillCd/60) + ' วิ');
      if (c.k.sk !== skt){ c.k.sk = skt; c.sk.textContent = skt; c.skb.parentNode.classList.toggle('ready', ready); }
      c.skb.style.width = (ready ? 100 : Math.max(0, 100 - f.skillCd/si.cd*100)) + '%';
      const mood = faceMood(f);
      if (c.k.mood !== mood){
        c.k.mood = mood;
        try { c.face.src = facePortrait(f.look, mood); } catch (e) {}
        c.el.classList.toggle('ouch', mood === 'ouch'); c.el.classList.toggle('ko', mood === 'ko'); c.el.classList.toggle('joy', mood === 'joy');
      }
      c.stam.style.width = Math.max(0, f.stam) + '%'; c.stam.parentNode.classList.toggle('low', !!f.exh || f.stam < 25);
    }
  }
  const me = G.fighters.find(f => f.isLocal);
  const gl = me && me.held === 'bomb' ? 'ขว้าง' : 'หยิบ';
  if (G.grabLbl !== gl){ G.grabLbl = gl; $('grabBtn').textContent = gl; }
  const lk = me && (G.net === 'guest' ? me.lockIdx >= 0 : me.lock) ? 'สลับเป้า' : 'ล็อก';
  if (G.lockLbl !== lk){ G.lockLbl = lk; $('lockBtn').textContent = lk; $('lockBtn').classList.toggle('on2', lk !== 'ล็อก'); }
  const sl = me && me.skillCd > 0 ? Math.ceil(me.skillCd/60) + ' วิ' : 'สกิล';
  if (G.skLbl !== sl){ G.skLbl = sl; $('skillBtn').textContent = sl; $('skillBtn').classList.toggle('cd', sl !== 'สกิล'); }
  if (G.frame % 10 === 0){
    const order = [...G.fighters].sort((a, b) => (b.stocks > 0) - (a.stocks > 0) || b.stocks - a.stocks || b.hp - a.hp);
    const rows = $('brows');
    order.forEach(f => {
      const k = f.stocks + '|' + (f.stocks > 0);
      if (f.brow.k !== k){ f.brow.k = k; f.brow.s.textContent = f.stocks > 0 ? '●'.repeat(f.stocks) : 'ตกรอบ'; f.brow.el.classList.toggle('out', f.stocks <= 0); }
      rows.appendChild(f.brow.el);
    });
    $('aliveCount').textContent = `เหลือ ${aliveCount()}/${G.fighters.length}`;
    const meOut = !G.fighters.some(f => f.isLocal && f.stocks > 0);
    $('spec').hidden = !meOut || G.endT > 0;
  }
  if (G.debug){
    const f = G.fighters.find(o => o.isLocal) || G.fighters[0], k = f && f.lastMove, m = k && MOVES[k];
    const fr = f && f.state === 'attack' ? `เฟรมที่ ${f.stateT}` : f ? f.state : '';
    const html = m ? `<b>${m.name}</b> · ${fr}<br>startup ${m.startup}f · active ${m.active}f · recovery ${m.recovery}f · ดาเมจ ${m.dmg} · กระเด็น ${m.kb}${m.launch ? ' (ลอย)' : ''}
      <div class="fbar"><i class="su" style="flex:${m.startup}"></i><i class="ac" style="flex:${m.active}"></i><i class="rc" style="flex:${m.recovery}"></i></div>`
      : `<b>Hitbox</b> · ต่อยสักทีเพื่อดูเฟรมดาต้าของท่า`;
    if (G.dbgHtml !== html){ G.dbgHtml = html; $('dbg').innerHTML = html; }
  }
}

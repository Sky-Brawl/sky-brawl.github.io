// Sky Brawl · bots.js — สมองบอท, การล็อกเป้า, ฮีลเพื่อน
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Bots ---------- */
// Auto-play: a local player's fighter is driven by the same bot brain until they switch it off
const isAuto = f => (f.ctrl === 'p1' || f.ctrl === 'p2') && G.auto[f.ctrl] && G.net !== 'guest';
function canAuto(){ return G.mode === 'play' && G.net !== 'guest'; }
function toggleAuto(ctrl){
  if (!canAuto()) return;
  const f = G.fighters.find(o => o.ctrl === ctrl); if (!f) return;
  G.auto[ctrl] = !G.auto[ctrl];
  Object.assign(f.ai, {cd:0, guardT:0, retreat:0, wantCombo:false, tgt:null, tgtT:0, duel:null, duelT:0});
  Object.assign(f.input, {x:0, z:0, atk:false, jump:false, guard:false, grab:false, skill:false});
  touch.atkL = touch.jumpL = touch.grabL = touch.skillL = false;
  feed(G.auto[ctrl] ? `${f.name}: บอทเล่นแทน` : `${f.name}: กลับมาบังคับเอง`);
  syncAutoUi();
}
function syncAutoUi(){
  const btn = $('autoBtn');
  btn.hidden = G.net === 'guest' || !G.fighters.some(f => f.ctrl === 'p1');
  btn.textContent = 'ออโต้: ' + (G.auto.p1 ? 'เปิด' : 'ปิด');
  btn.classList.toggle('on', G.auto.p1);
  for (const f of G.fighters){
    if (!f.tag || !f.isLocal) continue;
    f.tag.name.textContent = (isAuto(f) ? '🤖 ' : '▼ ') + f.name;
  }
}
function nearestFoe(b){
  let best = null, bd = Infinity;
  for (const o of G.fighters){
    if (o === b || ally(b, o) || !alive(o) || o.state === 'ko' || o.state === 'respawn') continue;
    if (STAGE.bushes && inBush(o) && Math.hypot(o.pos.x - b.pos.x, o.pos.z - b.pos.z) > SI_HIDE) continue;   // can't see into tall grass
    const d = Math.hypot(o.pos.x - b.pos.x, o.pos.z - b.pos.z) * (.7 + Math.random()*.6);
    if (d < bd){ bd = d; best = o; }
  }
  return best;
}
function nearestItem(b, maxD){
  let best = null, bd = maxD;
  for (const it of G.items){
    if (!it.landed) continue;
    if (it.type === 'heal' && b.hp > MAX_HP*.65) continue;
    if (WEAPON_INFO[it.type] && b.weapon) continue;
    if (it.type === 'bomb' && b.held) continue;
    const d = Math.hypot(it.pos.x - b.pos.x, it.pos.z - b.pos.z);
    if (d < bd){ bd = d; best = it; }
  }
  return best && {it:best, d:bd};
}
function steerAroundObstacles(b, inp){
  for (const fn of FUNNELS){
    const ox = b.pos.x - fn.x, oz = b.pos.z - fn.z, od = Math.hypot(ox, oz);
    if (od < 2.6 && od > .01){
      const toward = -(inp.x*ox + inp.z*oz)/od;
      if (toward > .2){ const tx = -oz/od, tz = ox/od, s = (tx*inp.x + tz*inp.z) >= 0 ? 1 : -1; inp.x += tx*s*toward; inp.z += tz*s*toward; }
    }
  }
  for (const bk of BLOCKS){
    if (b.pos.y >= bk.h - .1) continue;
    const ax = Math.abs(b.pos.x - bk.x) - bk.hx, az = Math.abs(b.pos.z - bk.z) - bk.hz;
    if (ax > 1.1 || az > 1.1) continue;
    if (ax > az){ if (Math.sign(inp.x) === -Math.sign(b.pos.x - bk.x)){ const k = inp.x; inp.x = 0; inp.z += (inp.z >= 0 ? 1 : -1)*Math.abs(k); } }
    else if (Math.sign(inp.z) === -Math.sign(b.pos.z - bk.z)){ const k = inp.z; inp.z = 0; inp.x += (inp.x >= 0 ? 1 : -1)*Math.abs(k); }
    if (bk.h < 1.8 && b.onGround && Math.random() < .04) inp.jump = !b.prev.jump;
  }
  const im = Math.hypot(inp.x, inp.z); if (im > 1){ inp.x /= im; inp.z /= im; }
}
function thinkStone(b, st, D){
  const inp = b.input, ai = b.ai, press = k => { inp[k] = !b.prev[k]; };
  const dx = st.pos.x - b.pos.x, dz = st.pos.z - b.pos.z, dist = Math.max(.001, Math.hypot(dx, dz) - (st.r || 1));
  const ranged = !!CLASS_STOP[b.cls] || b.weapon === 'gun' || b.weapon === 'shotgun';
  const reach = ranged ? 6 : (b.weapon ? 1.6 : Math.min(1.5, CLASS_REACH[b.cls] || 1.3));
  inp.x = inp.z = 0;
  if (dist > reach*.8){ inp.x = dx/(dist + 1); inp.z = dz/(dist + 1); }
  steerAroundObstacles(b, inp);
  if (ai.cd > 0){ ai.cd--; return; }
  const si = SKILL_INFO[b.cls] || SKILL_INFO.none;
  if (b.skillCd <= 0 && si.range > 0 && dist < Math.min(si.range, 6) && Math.random() < .3*D.aggr){ inp.x = dx/(dist + 1)*.3; inp.z = dz/(dist + 1)*.3; press('skill'); ai.cd = D.react; return; }
  if (dist < reach && Math.random() < D.aggr + .2){ inp.x = dx/(dist + 1)*.3; inp.z = dz/(dist + 1)*.3; press('atk'); ai.wantCombo = Math.random() < D.combo; ai.cd = 4; return; }
  ai.cd = (D.react*.5) | 0;
}
function think(b){
  const D = DIFF[G.mode === 'menu' ? 'normal' : G.cfg.df], inp = b.input, ai = b.ai;
  const press = k => { inp[k] = !b.prev[k]; };
  inp.atk = inp.jump = inp.grab = inp.skill = false;
  if (G.countdown > 30){ inp.x = inp.z = 0; return; }
  if (b.state === 'attack'){ if (b.move.next && ai.wantCombo) press('atk'); return; }
  if (!['idle','run','air','guard'].includes(b.state)){ inp.guard = false; inp.x = inp.z = 0; return; }
  if (ai.guardT > 0){ ai.guardT--; inp.guard = ai.guardT > 0; inp.x = inp.z = 0; return; }
  inp.guard = false;
  if (!ai.tgt || !alive(ai.tgt) || ai.tgt.state === 'ko' || --ai.tgtT <= 0){
    // a player who challenged this bot in chat stays its target until the duel time runs out (chatbot.js)
    const d = ai.duelT > G.frame && ai.duel && alive(ai.duel) && ai.duel.stocks > 0 ? ai.duel : null;
    ai.tgt = d || nearestFoe(b); ai.tgtT = d ? 30 : 90 + Math.random()*120 | 0;
  }
  if (G.raid && G.boss && G.boss.hp > 0 && ai.retreat <= 0) return thinkBoss(b, D);
  if (G.teamMode && b.side >= 0){
    // Defenders peel onto anyone threatening their own stone; raiders head for the enemy stone
    const own = G.stones[b.side], es = G.stones[1 - b.side], raid = ((b.idx >> 1) % 10) < 3;
    if (!raid && own && G.frame % 20 === b.idx % 20){
      const intr = G.fighters.find(o => o.side !== b.side && alive(o) && o.state !== 'ko' && Math.hypot(o.pos.x - own.pos.x, o.pos.z - own.pos.z) < 7);
      if (intr){ ai.tgt = intr; ai.tgtT = 60; }
    }
    const t0 = ai.tgt, near = t0 && alive(t0) && Math.hypot(t0.pos.x - b.pos.x, t0.pos.z - b.pos.z) < 3.5;
    if (es && es.hp > 0 && ai.retreat <= 0 && ((raid && !near) || !t0)) return thinkStone(b, es, D);
  }
  const t = ai.tgt, tOk = !!t && alive(t) && t.state !== 'ko';
  const dx = tOk ? t.pos.x - b.pos.x : 0, dz = tOk ? t.pos.z - b.pos.z : 0, dist = Math.hypot(dx, dz) || .001;
  const edge = !onDeck(b.pos.x, b.pos.z, 1.3);
  let goal = null, stop = 0;
  const item = nearestItem(b, 7);
  if (ai.retreat > 0){ ai.retreat--; goal = {x:b.pos.x*.8, z:b.pos.z*.4}; }
  else if (edge && Math.random() < D.edge*.08){ ai.retreat = 20; goal = {x:b.pos.x*.8, z:b.pos.z*.4}; }
  else if (!tOk){ goal = item ? item.it.pos : {x:0, z:0}; stop = item ? 0 : 2; }
  else if (b.held === 'bomb'){ if (dist < 4) goal = {x:b.pos.x - dx, z:b.pos.z - dz}; }
  else if (item && item.d < dist*.8){ goal = item.it.pos; }
  else { goal = t.pos; stop = b.weapon === 'gun' ? 6 : b.weapon === 'shotgun' ? 3 : b.weapon ? 1.1 : b.formT > 0 ? FORM_INFO[b.cls].stop : (CLASS_STOP[b.cls] || 1.1); }
  inp.x = inp.z = 0; inp.sprint = tOk && dist > 8 && b.stam > 35 && b.ctrl === 'bot';
  if (goal){
    const mx = goal.x - b.pos.x, mz = goal.z - b.pos.z, md = Math.hypot(mx, mz);
    if (md > stop + .1){ inp.x = mx/md; inp.z = mz/md; }
  }
  steerAroundObstacles(b, inp);
  if (ai.cd > 0){ ai.cd--; return; }
  if (tOk && t.state === 'attack' && t.stateT <= t.move.startup && dist < 2.6 && Math.random() < D.guard){
    ai.guardT = 12 + t.move.startup; inp.guard = true; inp.x = inp.z = 0; ai.cd = D.react; return;
  }
  const si = SKILL_INFO[b.cls] || SKILL_INFO.none;
  if (b.skillCd <= 0 && Math.random() < .35*D.aggr && (si.range < 0 ? wantsHeal(b) : tOk && dist < si.range)){
    if (tOk){ inp.x = dx/dist*.3; inp.z = dz/dist*.3; }
    press('skill'); ai.cd = D.react; return;
  }
  if (b.held === 'bomb' && tOk && dist >= 3.5 && dist < 10){ inp.x = dx/dist*.3; inp.z = dz/dist*.3; press('grab'); ai.cd = D.react; return; }
  const near = nearestItem(b, 1.3);
  if (near && near.it.type !== 'heal'){ press('grab'); ai.cd = 4; return; }
  const isGun = b.weapon === 'gun' || b.weapon === 'shotgun';
  if (tOk && dist < (isGun ? (b.weapon === 'gun' ? 11 : 5.5) : b.weapon ? 2.3 : b.formT > 0 ? FORM_INFO[b.cls].reach : (CLASS_REACH[b.cls] || 1.9)) && Math.random() < D.aggr*(isGun ? .5 : 1)){
    inp.x = dx/dist*.3; inp.z = dz/dist*.3; press('atk'); ai.wantCombo = Math.random() < D.combo; ai.cd = 4; return;
  }
  if (tOk && t.pos.y > 1 && dist < 2.5 && Math.random() < .3) press('jump');
  else if (Math.random() < .012 && !edge) press('jump');
  ai.cd = (D.react*(.5 + Math.random())) | 0;
}


/* ---------- Targeting: soft auto-aim plus a lock-on you cycle with a button ---------- */
const lockable = (f, o, maxD) => !!o && o !== f && !ally(f, o) && alive(o) && o.state !== 'ko' && o.stocks > 0 && o.pos.y > SEA_Y + .5 &&
  Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z) < maxD;
// Press once: nearest enemy. Press again: next nearest (up to 6). After the last one: lock off.
// Auto-aim: every few frames, lock the nearest enemy within 14 squares (not someone hidden in tall grass).
// Keeps the current target unless a new one is clearly closer; a manual lock press is respected for 4 seconds.
function autoLockStep(f){
  if (G.frame % 6 !== f.idx % 6) return;
  if (f.lockManual && G.frame - f.lockManual < 240 && lockable(f, f.lock, 18)) return;
  let best = null, bd = 14;
  for (const o of G.fighters){
    if (!lockable(f, o, 14) || o.state === 'respawn') continue;
    const d = Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z);
    if (STAGE.bushes && inBush(o) && d > SI_HIDE) continue;
    if (d < bd){ bd = d; best = o; }
  }
  const cur = lockable(f, f.lock, 16) ? Math.hypot(f.lock.pos.x - f.pos.x, f.lock.pos.z - f.pos.z) : Infinity;
  if (!best){ if (cur === Infinity && f.autoPicked){ f.lock = null; f.autoPicked = false; } return; }
  if (best !== f.lock && bd < cur*.7){ f.lock = best; f.autoPicked = true; }
}
function cycleLock(f){
  const list = G.fighters.filter(o => lockable(f, o, 18))
    .sort((a, b) => Math.hypot(a.pos.x - f.pos.x, a.pos.z - f.pos.z) - Math.hypot(b.pos.x - f.pos.x, b.pos.z - f.pos.z)).slice(0, 6);
  const i = list.indexOf(f.lock);
  f.lock = !list.length ? null : i < 0 ? list[0] : list[i + 1] || null;
  if (f.isLocal) popup(new V(f.pos.x, 2.7, f.pos.z), f.lock ? 'ล็อก ' + f.lock.name : 'เลิกล็อก', 'th', 36);
}
// Who an attack should turn toward: the locked target, else the closest enemy roughly in front (players only; bots aim themselves)
function aimTarget(f, m){
  if (f.ctrl === 'bot') return null;
  if (lockable(f, f.lock, 20)) return f.lock;
  const ranged = !m || m.noHit || m.gun || m.glide || !!CLASS_STOP[f.cls];
  const R = ranged ? 12 : 3.2, inp = f.input;
  const dir = Math.hypot(inp.x, inp.z) > .2 ? Math.atan2(inp.x, inp.z) : f.facing;
  let best = null, bs = Infinity;
  for (const o of G.fighters){
    if (!lockable(f, o, R) || !hittable(o)) continue;
    const dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z, d = Math.hypot(dx, dz);
    let da = Math.atan2(dx, dz) - dir; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
    if (da > 1.05 && d > 1.2) continue;
    const sc = d*(1 + da*1.5);
    if (sc < bs){ bs = sc; best = o; }
  }
  if (!best && G.boss && G.boss.hp > 0 && Math.hypot(G.boss.pos.x - f.pos.x, G.boss.pos.z - f.pos.z) < R + BOSS_R) return G.boss;
  return best;
}
// Markers over each local player's locked target
const LOCK_MARKS = [0xffd23a, 0x7fe3ff].map(col => {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:.9, depthWrite:false, side:THREE.DoubleSide});
  const ring = new THREE.Mesh(new THREE.RingGeometry(.85, 1.02, 4, 1), mat); ring.rotation.x = -PI/2; ring.position.y = .06; g.add(ring);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.22, .45, 4), mat); cone.rotation.x = PI; g.add(cone);
  g.userData = {ring, cone}; g.visible = false; scene.add(g);
  return g;
});
function updateLockMarks(){
  let k = 0;
  for (const f of G.fighters){
    if (!f.isLocal || k >= LOCK_MARKS.length) continue;
    const mk = LOCK_MARKS[k++], t = G.net === 'guest' ? G.fighters[f.lockIdx] : f.lock;
    if (t && alive(t) && t !== f && t.pos.y > SEA_Y && G.mode === 'play'){
      mk.visible = true; mk.position.set(t.pos.x, t.pos.y, t.pos.z);
      mk.userData.ring.rotation.z += .04; mk.userData.cone.position.y = 2.95 + Math.sin(G.frame*.15)*.12;
    } else mk.visible = false;
  }
  for (; k < LOCK_MARKS.length; k++) LOCK_MARKS[k].visible = false;
}


/* ---------- Heals that reach allies (team mode, boss raid); in free-for-all there are no allies, so they heal you ---------- */
function healFx(o, amount){
  const was = o.hp; o.hp = Math.min(MAX_HP, o.hp + amount);
  const got = Math.round(o.hp - was);
  popup(new V(o.pos.x, 2.4, o.pos.z), '+' + got, 'heal');
  emit(new V(o.pos.x, 1, o.pos.z), 12, 0x6fe08a, 2.5, 4, 28, 1.3, -1);
  return got;
}
function groupHeal(f, amount, radius){
  const c = new V(f.pos.x, .2, f.pos.z);
  flash(new V(c.x, 1, c.z), 0xd8ffe0, .5, radius*.9, 18);
  for (let a = 0; a < PI*2; a += PI/10) emit(new V(c.x + Math.cos(a)*radius*.8, .4, c.z + Math.sin(a)*radius*.8), 1, 0x6fe08a, .3, 2.5, 30, 1.4, -1);
  let n = 0;
  for (const o of G.fighters){
    if (o !== f && !ally(f, o)) continue;
    if (!alive(o) || o.state === 'ko' || Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z) > radius) continue;
    healFx(o, amount); n++;
  }
  if (n > 1 && f.isLocal) popup(new V(f.pos.x, 3.1, f.pos.z), 'ฮีล ' + n + ' คน', 'combo th', 40);
}
function healOne(f, amount, range){
  let best = null, bh = 101;
  for (const o of G.fighters){
    if (!ally(f, o) || !alive(o) || o.state === 'ko' || o.hp >= MAX_HP) continue;
    if (Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z) > range) continue;
    if (o.hp < bh){ bh = o.hp; best = o; }
  }
  const t = best || f;
  if (t !== f){
    f.facing = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    const d = Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    for (let k = 0; k <= d; k += .6){ const u = k/(d || 1); emit(new V(L(f.pos.x, t.pos.x, u), 1.2, L(f.pos.z, t.pos.z, u)), 1, 0xbfffd0, .2, .5, 22, 1.2, 0); }
  }
  flash(new V(t.pos.x, 1, t.pos.z), 0xd8ffe0, .4, 1.8, 14);
  healFx(t, amount);
}
// Bots: use a heal when they or an ally nearby is hurt
function wantsHeal(b){
  if (b.hp < MAX_HP*.55) return true;
  const r = b.cls === 'priest' ? 7 : 10;
  return G.fighters.some(o => ally(b, o) && alive(o) && o.hp < MAX_HP*.6 && Math.hypot(o.pos.x - b.pos.x, o.pos.z - b.pos.z) < r);
}

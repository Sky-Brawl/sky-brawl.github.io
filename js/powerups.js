// Sky Brawl · powerups.js — ยาวานรยักษ์ (แปลงร่างเป็นกอริลล่ายักษ์) และหุ่นรบแดงตาเดียวที่ขึ้นขี่ได้
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Power-ups that any class can use ----------
   Giant-ape potion ('potion' item): walk over it and you become a giant gorilla for PU.apeSecs seconds. Big slow slams,
   a mouth beam on E, takes half damage and shrugs off knockback (super armour). The gorilla is its own model; the
   fighter's normal body is hidden underneath it, so every system that uses f.pos / f.state keeps working.
   Red mech: one or two stand on the map (dropped from the sky). Press grab (R) or attack next to an empty one to climb in,
   grab again to climb out. While riding, all hits go to the mech's own HP; attack swings a heat axe, E fires the machine gun.
   When its HP runs out it explodes and throws the pilot out. Falling off the stage loses the mech.
   Host / offline run the rules; guests get f[11] bit 256 (ape) and sn.mc (mechs) in the snapshot. ---------- */
const PU = (() => {
  const c = (window.SKY_CONFIG || {}).powerups || {}, num = (v, d, lo, hi) => { v = Number(v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  return {
    potion:num(c.potionChance, .07, 0, 1),        // chance that a new item is the potion
    apeSecs:num(c.apeSeconds, 10, 2, 60),
    apeScale:2.3, apeSpeed:.85, apeTake:.5,         // size, walking speed, share of damage taken
    apeBeamCd:240,
    mechOn:c.mech !== false && c.mech !== 0,
    mechHp:num(c.mechHp, 160, 20, 2000),
    mechFirst:Math.round(num(c.mechFirstSeconds, 15, 0, 600)*60),
    mechAgain:Math.round(num(c.mechRespawnSeconds, 30, 3, 600)*60),
    mechScale:2, mechSpeed:.9, mechGunCd:300,
  };
})();
const APE_BEAM = {dmg:14, kb:13, up:8, launch:true, hitstop:8, shake:.5};
const MECH_BOOM = {dmg:12, kb:12, up:10, launch:true, hitstop:6, shake:.6};
// The moves are added to the end of MOVES so older move numbers (sent online) stay the same
Object.assign(MOVES, {
  ape1:{name:'ทุบพื้นวานร', anim:'apeslam', startup:12, active:5, recovery:14, dmg:13, kb:11, up:8, launch:true, sweep:true, reach:1.9, rad:2.4, lunge:2, next:'ape2', hitstop:9, shake:.5},
  ape2:{name:'ตบกวาด', anim:'apeswipe', startup:9, active:5, recovery:12, dmg:11, kb:12, up:5, launch:true, sweep:true, reach:1.2, rad:3, lunge:2, next:'ape3', hitstop:8, shake:.35},
  ape3:{name:'ทุบสองมือ', anim:'apeslam', startup:16, active:6, recovery:22, dmg:18, kb:15, up:11, launch:true, breakGuard:true, sweep:true, reach:1.6, rad:3.4, hitstop:12, shake:.8},
  sk_ape:{name:'ลำแสงวานร', anim:'apebeam', startup:18, active:1, recovery:20, noHit:true, skill:true, fire:f => apeBeam(f)},
  mk1:{name:'ขวานความร้อน', anim:'mkslash', startup:9, active:5, recovery:12, dmg:12, kb:10, up:5, launch:true, sweep:true, reach:1.7, rad:2.3, lunge:3, next:'mk2', hitstop:8, shake:.3},
  mk2:{name:'ฟาดขวานลง', anim:'mkchop', startup:13, active:5, recovery:18, dmg:16, kb:13, up:9, launch:true, breakGuard:true, sweep:true, reach:2, rad:2.4, hitstop:10, shake:.5},
  sk_mech:{name:'ปืนกลหุ่นรบ', anim:'mkgun', startup:8, active:40, recovery:12, noHit:true, rapid:4, skill:true},
});
MOVE_KEYS.push('ape1', 'ape2', 'ape3', 'sk_ape', 'mk1', 'mk2', 'sk_mech');

/* ---------- Rules (host / offline) ---------- */
const powerOn = f => f.apeT > 0 || !!f.mech;
const powerSpeed = f => f.apeT > 0 ? PU.apeSpeed : f.mech ? PU.mechSpeed : 1;
const bodyR = o => o.apeT > 0 ? .9 : o.mech ? .7 : 0;     // big bodies are easier to hit
function powerAttackKey(f){ return f.apeT > 0 ? 'ape1' : f.mech ? 'mk1' : null; }
function startApe(f){
  if (f.mech) leaveMech(f);
  f.apeT = Math.round(PU.apeSecs*60); f.apeSk = 0; f.apeIntro = 50;
  f.hp = Math.min(MAX_HP, f.hp + 15);
  f.weapon = null; if (f.state === 'attack') setState(f, 'idle');
  apeFx(f);
  if (f.isLocal) G.shake = Math.max(G.shake, .7);
  popup(new V(f.pos.x, f.pos.y + 4.5, f.pos.z), 'แปลงร่างวานรยักษ์!', 'combo th', 60);
  Sfx.play('howl', f.pos);
}
function apeFx(f){
  const c = new V(f.pos.x, f.pos.y + 1.5, f.pos.z);
  flash(c, 0xffd23a, .8, 6, 20); emit(c, 40, 0x8a5a32, 9, 6, 32, 2.4, 4); emit(c, 24, 0xffe066, 6, 5, 28, 1.6, 2);
}
function endApe(f){
  const c = new V(f.pos.x, f.pos.y + 1.2, f.pos.z);
  flash(c, 0xffffff, .6, 4, 14); emit(c, 26, 0x8a5a32, 6, 4, 26, 2, 5);
}
// E while powered: the ape's mouth beam or the mech's machine gun (they have their own cooldowns)
function powerSkill(f){
  if (f.apeT > 0){ if (f.apeSk > 0) return false; f.apeSk = PU.apeBeamCd; startMove(f, 'sk_ape'); return true; }
  if (f.mech){ if (f.mechSk > 0) return false; f.mechSk = PU.mechGunCd; startMove(f, 'sk_mech'); popup(new V(f.pos.x, f.pos.y + 4.2, f.pos.z), 'ปืนกลหุ่นรบ!', 'combo th', 40); return true; }
  return false;
}
function apeBeam(f){
  for (const da of [-.18, 0, .18]){
    fireProj(f, 'fireball', f.facing + da, 18, 40, APE_BEAM);
  }
  const c = new V(f.pos.x + Math.sin(f.facing)*1.4, f.pos.y + 3.2, f.pos.z + Math.cos(f.facing)*1.4);
  flash(c, 0xffe066, .7, 3, 12); Sfx.play('boom', f.pos, .6);
  if (f.isLocal) G.shake = Math.max(G.shake, .4);
}
// Every frame from stepFighter
function powerTick(f){
  if (f.apeSk > 0) f.apeSk--;
  if (f.mechSk > 0) f.mechSk--;
  if (f.apeIntro > 0) f.apeIntro--;
  const gone = f.state === 'ko' || !alive(f);
  if (f.apeT > 0 && (gone || --f.apeT === 0)){ f.apeT = 0; if (!gone) endApe(f); }
  if (f.mech && (gone || f.pos.y < -1.5)) destroyMech(f.mech, null);
}
// Hits on a powered fighter: the mech takes them all, the ape takes half and does not flinch. true = handled here.
function powerAbsorb(att, tgt, m, dir, credit){
  if (tgt.mech){
    const mk = tgt.mech, at = new V(tgt.pos.x - dir.x*.6, tgt.pos.y + 1.8, tgt.pos.z - dir.z*.6);
    mk.hp -= m.dmg;
    if (credit && credit !== tgt){ credit.hits++; credit.dmgDealt += m.dmg; }
    popup(at, String(m.dmg), 'combo'); emit(at, 10, 0xffb03a, 5, 3, 18, 1.4, 6); flash(at, 0xffd8a0, .3, 1.4, 7);
    Sfx.play(m.dmg >= 9 ? 'smash' : 'hit', at, .7);
    tgt.vel.x += dir.x*m.kb*.15; tgt.vel.z += dir.z*m.kb*.15;
    if (att) att.freeze = Math.min(4, m.hitstop || 3);
    if (mk.hp <= 0) destroyMech(mk, credit);
    return true;
  }
  if (tgt.apeT > 0){
    const dmg = Math.max(1, Math.round(m.dmg*PU.apeTake));
    if (tgt.hp - dmg <= 0) return false;      // the last hit knocks the ape out the normal way
    tgt.hp -= dmg;
    if (credit && credit !== tgt){ credit.hits++; credit.dmgDealt += dmg; tgt.lastHitBy = credit.idx; tgt.lastHitT = G.frame; }
    const at = new V(tgt.pos.x - dir.x*.8, tgt.pos.y + 2.2, tgt.pos.z - dir.z*.8);
    popup(at, String(dmg)); emit(at, 8, 0xffe066, 5, 3, 18, 1.4, 6);
    Sfx.play('punch', at, .7);
    tgt.vel.x += dir.x*m.kb*.25; tgt.vel.z += dir.z*m.kb*.25; tgt.squash = 6;
    if (att) att.freeze = Math.min(5, m.hitstop || 3);
    return true;
  }
  return false;
}

/* ---------- The mechs ---------- */
G.mechs = [];
function groundUnder(x, z){
  let h = onDeck(x, z) ? 0 : -99;
  for (const b of BLOCKS) if (Math.abs(x - b.x) < b.hx && Math.abs(z - b.z) < b.hz) h = Math.max(h, b.h);
  return h;
}
function makeMech(id, p){
  const vis = buildMech(); scene.add(vis.root);
  const m = {id, pos:new V(p.x, p.y, p.z), facing:p.facing || 0, hp:PU.mechHp, rider:null, vy:0, vis, landed:false};
  G.mechs.push(m); return m;
}
function removeMech(m){ scene.remove(m.vis.root); const i = G.mechs.indexOf(m); if (i >= 0) G.mechs.splice(i, 1); if (m.rider && m.rider.mech === m) m.rider.mech = null; m.rider = null; }
function mechGrab(f, viaAtk){
  if (f.mech){ if (viaAtk) return false; leaveMech(f); return true; }
  if (f.apeT > 0 || f.held) return false;
  let best = null, bd = 2.3;
  for (const m of G.mechs){ if (m.rider || !m.landed) continue; const d = Math.hypot(m.pos.x - f.pos.x, m.pos.z - f.pos.z); if (d < bd){ bd = d; best = m; } }
  if (!best) return false;
  f.mech = best; best.rider = f; f.weapon = null; f.mechSk = 0;
  f.pos.x = best.pos.x; f.pos.z = best.pos.z; f.pos.y = Math.max(f.pos.y, best.pos.y); f.facing = best.facing; f.vel.set(0, 0, 0);
  const c = new V(best.pos.x, best.pos.y + 2, best.pos.z);
  flash(c, 0xff4fa0, .6, 3.4, 14); emit(c, 18, 0xffffff, 5, 4, 22, 1.4, 4);
  popup(new V(f.pos.x, f.pos.y + 4.4, f.pos.z), 'ขึ้นหุ่นรบ!', 'combo th', 50);
  Sfx.play('pickup', f.pos); Sfx.play('skill', f.pos, .6);
  return true;
}
function leaveMech(f){
  const m = f.mech; if (!m) return;
  f.mech = null; m.rider = null;
  m.pos.copy(f.pos); m.facing = f.facing; m.landed = f.onGround; m.vy = 0;
  const sx = Math.cos(f.facing), sz = -Math.sin(f.facing);
  f.pos.x += sx*1.3; f.pos.z += sz*1.3; f.vel.set(sx*3, 7, sz*3); f.onGround = false; setState(f, 'air');
  dust(m.pos, 10);
}
function destroyMech(m, by){
  const f = m.rider, c = new V(m.pos.x, m.pos.y + 1.6, m.pos.z);
  explodeFx(c); flash(c, 0xff7a2f, .9, 6, 22); emit(c, 40, 0xd23b3b, 10, 7, 36, 2.2, 8); emit(c, 24, 0x3a3f4b, 8, 6, 34, 2, 8);
  G.shake = Math.max(G.shake, .7); Sfx.play('boom', c);
  removeMech(m);
  if (f){
    setState(f, 'tumble'); f.vel.set((Math.random() - .5)*4, 13, (Math.random() - .5)*4); f.onGround = false; f.invuln = Math.max(f.invuln, 50);
    popup(new V(f.pos.x, f.pos.y + 3, f.pos.z), 'หุ่นระเบิด!', 'combo th', 50);
  }
  // the blast hurts everyone close by except the pilot
  if (f || by) for (const o of G.fighters){
    if (o === f || !hittable(o) || (by && ally(by, o))) continue;
    const dx = o.pos.x - m.pos.x, dz = o.pos.z - m.pos.z, d = Math.hypot(dx, dz);
    if (d < 3 && Math.abs(o.pos.y - m.pos.y) < 2.5) applyHit(null, o, MECH_BOOM, d > .01 ? new V(dx/d, 0, dz/d) : new V(1, 0, 0), by || f);
  }
  if (G.net !== 'guest') G.mechT = Math.min(G.mechT || PU.mechAgain, PU.mechAgain);
}
function spawnMech(){
  // open ground only: not on a roof or a stall, not inside a wall
  let p = randomDeckPoint(3);
  for (let i = 0; i < 20 && (groundUnder(p.x, p.z) !== 0 || BLOCKS.some(b => Math.abs(p.x - b.x) < b.hx + 1.6 && Math.abs(p.z - b.z) < b.hz + 1.6)); i++) p = randomDeckPoint(3);
  const m = makeMech(G.nextId++, {x:p.x, y:16, z:p.z, facing:Math.random()*PI*2});
  m.landed = false;
  feed('🤖 หุ่นรบแดงลงมาแล้ว! เดินไปใกล้ๆ แล้วกด R เพื่อขึ้นขี่');
  return m;
}
// Host / offline, once per tick
function stepMechs(){
  if (G.mode !== 'play' || G.tut || !PU.mechOn){ if (G.mechs.length) clearMechs(); return; }
  if (G.mechMatch !== G.matchId){ G.mechMatch = G.matchId; clearMechs(); G.mechT = PU.mechFirst + 210; }
  const want = G.fighters.length > 12 ? 2 : 1;
  if (G.countdown <= 30 && G.endT <= 0 && G.mechs.length < want && --G.mechT <= 0){ spawnMech(); G.mechT = PU.mechAgain; }
  for (const m of [...G.mechs]){
    if (m.rider){ m.pos.copy(m.rider.pos); m.facing = m.rider.facing; m.landed = true; continue; }
    if (!m.landed){
      m.vy -= GRAV*DT*.7; m.pos.y += m.vy*DT;
      const g = groundUnder(m.pos.x, m.pos.z);
      if (m.pos.y <= g && g > -50){ m.pos.y = g; m.vy = 0; m.landed = true; dust(m.pos, 16); G.shake = Math.max(G.shake, .25); Sfx.play('land', m.pos); }
      if (m.pos.y < SEA_Y - 3){ splash(m.pos); removeMech(m); }
    }
  }
}
function clearMechs(){ for (const m of [...G.mechs]) removeMech(m); }
function clearPowers(){ clearMechs(); for (const f of G.fighters) if (f.apeVis){ scene.remove(f.apeVis.root); f.apeVis = null; } }

/* ---------- Online ---------- */
function mechsForSnap(){
  const r = v => Math.round(v*100);
  return G.mechs.length ? G.mechs.slice(0, 8).map(m => [m.id, r(m.pos.x), r(m.pos.y), r(m.pos.z), Math.round(m.facing*100), Math.ceil(Math.max(0, m.hp)), m.rider ? m.rider.idx : -1]) : null;
}
function mechsFromSnap(mc){
  const list = Array.isArray(mc) ? mc : [], seen = new Set();
  for (const f of G.fighters) f.mech = null;
  for (const a of list.slice(0, 8)){
    if (!Array.isArray(a)) continue;
    const id = Number(a[0]); seen.add(id);
    let m = G.mechs.find(x => x.id === id);
    if (!m){ m = makeMech(id, {x:a[1]/100, y:a[2]/100, z:a[3]/100}); }
    m.net = new V((Number(a[1]) || 0)/100, (Number(a[2]) || 0)/100, (Number(a[3]) || 0)/100);
    m.facing = (Number(a[4]) || 0)/100;
    const hp = Number(a[5]) || 0;
    if (hp < m.hp && m.landed){ const at = new V(m.pos.x, m.pos.y + 2, m.pos.z); popup(at, String(Math.round(m.hp - hp)), 'combo'); emit(at, 8, 0xffb03a, 5, 3, 18, 1.4, 6); }
    m.hp = hp; m.landed = true;
    const rider = G.fighters[Number(a[6])];
    m.rider = rider && Number(a[6]) >= 0 ? rider : null;
    if (m.rider) m.rider.mech = m;
  }
  for (const m of [...G.mechs]) if (!seen.has(m.id)){
    const c = new V(m.pos.x, m.pos.y + 1.6, m.pos.z);
    if (m.hp <= 0 || m.rider){ explodeFx(c); emit(c, 40, 0xd23b3b, 10, 7, 36, 2.2, 8); Sfx.play('boom', c); }
    removeMech(m);
  }
}

/* ---------- Models ---------- */
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function rig(){
  const root = new THREE.Group(), tilt = new THREE.Group(), head = new THREE.Group();
  root.add(tilt); tilt.add(head);
  const limb = (x, y) => { const g = new THREE.Group(); g.position.set(x, y, 0); tilt.add(g); return g; };
  return {root, tilt, head, limb};
}
const add3 = (g, geo, c, x, y, z, ol) => { const m = part(geo, toon(c), ol); m.position.set(x, y, z); g.add(m); return m; };
const glow3 = (g, geo, c, x, y, z) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:c})); m.position.set(x, y, z); g.add(m); return m; };
// A giant gorilla: brown fur, pale face and chest, glowing red eyes, long arms with big fists and a tail
function buildApe(){
  const FUR = 0x6b4226, DARK = 0x4a2c18, SKIN = 0xc89a6a, {root, tilt, head, limb} = rig();
  tilt.position.y = .78;
  add3(tilt, SPH(.52), FUR, 0, 0, 0, 1.05).scale.set(1.18, 1.05, .95);
  add3(tilt, SPH(.36), SKIN, 0, -.02, .28).scale.set(1, .95, .45);
  add3(tilt, SPH(.3), FUR, -.34, .28, -.05, 1.05); add3(tilt, SPH(.3), FUR, .34, .28, -.05, 1.05);
  head.position.set(0, .62, .08);
  add3(head, SPH(.4), FUR, 0, 0, 0, 1.05);
  add3(head, B3(.5, .32, .26), SKIN, 0, -.1, .3, 1.04);
  add3(head, B3(.62, .1, .2), DARK, 0, .25, .3);
  for (const sd of [-1, 1]){
    glow3(head, B3(.13, .07, .03), 0xff2a2a, sd*.14, .14, .4);
    add3(head, SPH(.1), SKIN, sd*.42, .02, 0, 1.06);
    add3(head, SPH(.035), 0x2b1a10, sd*.06, -.07, .44);
  }
  const mouth = new THREE.Group(); mouth.position.set(0, -.2, .43); head.add(mouth);
  add3(mouth, B3(.3, .1, .04), 0x5a1010, 0, 0, 0);
  for (const sd of [-1, 1]) add3(mouth, new THREE.ConeGeometry(.03, .08, 4), 0xf4f1ea, sd*.1, .03, .02).rotation.x = PI;
  const beam = glow3(head, SPH(.16), 0xffe066, 0, -.2, .5); beam.visible = false;
  const arm = sd => {
    const g = limb(sd*.62, .28);
    add3(g, new THREE.CylinderGeometry(.18, .15, .6, 8), FUR, 0, -.28, 0, 1.05);
    add3(g, SPH(.26), DARK, 0, -.66, .02, 1.07);
    return g;
  };
  const leg = sd => {
    const g = limb(sd*.27, -.42);
    add3(g, new THREE.CylinderGeometry(.18, .15, .28, 8), FUR, 0, -.12, 0, 1.05);
    add3(g, SPH(.21), DARK, 0, -.3, .06, 1.07).scale.set(1, .6, 1.35);
    return g;
  };
  const armL = arm(1), armR = arm(-1), legL = leg(1), legR = leg(-1);
  const tail = new THREE.Group(); tail.position.set(0, -.3, -.42); tilt.add(tail);
  for (let i = 0; i < 4; i++) add3(tail, new THREE.CylinderGeometry(.07, .07, .3, 6), FUR, 0, .05 + i*.12, -.12 - i*.18, 1.05).rotation.x = -1.1 + i*.35;
  root.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return {root, tilt, head, armL, armR, legL, legR, tail, beam, mouth};
}
// A red mono-eye mech: round head with a sliding pink eye and a horn, cheek pipes, spiked left shoulder, shield on the right,
// a glowing heat axe in the right hand, a drum-fed machine gun in the left and a backpack with two thrusters
function buildMech(){
  const RED = 0xd23b3b, DRED = 0x8e1f25, GRAY = 0x5a5f6b, DARK = 0x2b2f3a, {root, tilt, head, limb} = rig();
  tilt.position.y = .92;
  add3(tilt, B3(.66, .22, .46), DRED, 0, -.05, 0, 1.04);
  add3(tilt, B3(.26, .3, .08), RED, -.18, -.18, .22, 1.04); add3(tilt, B3(.26, .3, .08), RED, .18, -.18, .22, 1.04);
  add3(tilt, B3(.74, .52, .52), RED, 0, .34, 0, 1.04);
  add3(tilt, B3(.5, .14, .06), DRED, 0, .42, .27);
  add3(tilt, B3(.52, .42, .26), DRED, 0, .38, -.38, 1.04);
  const flames = [];
  for (const sd of [-1, 1]){
    add3(tilt, new THREE.CylinderGeometry(.08, .11, .16, 8), GRAY, sd*.14, .14, -.5);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(.09, .42, 8), new THREE.MeshBasicMaterial({color:0xffa53a, transparent:true, opacity:.85, depthWrite:false}));
    fl.position.set(sd*.14, -.12, -.5); fl.rotation.x = PI; fl.visible = false; tilt.add(fl); flames.push(fl);
  }
  head.position.set(0, .78, .02);
  add3(head, SPH(.27), RED, 0, 0, 0, 1.05).scale.set(1, .86, 1.05);
  add3(head, B3(.4, .09, .1), DARK, 0, 0, .22);
  const eyeMat = new THREE.MeshBasicMaterial({color:0x5a1030});
  const eye = new THREE.Mesh(SPH(.055), eyeMat); eye.position.set(0, 0, .27); head.add(eye);
  const horn = add3(head, B3(.04, .3, .04), RED, .1, .3, .02); horn.rotation.x = -.35;
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) add3(head, SPH(.05), GRAY, sd*(.12 + i*.04), -.16 - i*.1, .2 - i*.02);
  const arm = sd => {
    const g = limb(sd*.5, .5);
    add3(g, new THREE.CylinderGeometry(.09, .09, .26, 8), GRAY, 0, -.16, 0);
    add3(g, B3(.22, .32, .22), RED, 0, -.44, 0, 1.04);
    add3(g, B3(.17, .14, .17), DARK, 0, -.66, 0, 1.04);
    return g;
  };
  const armL = arm(1), armR = arm(-1);
  // left: spiked shoulder; right: square shield
  add3(armL, SPH(.21), RED, .04, .02, 0, 1.05).scale.set(1.1, .9, 1.1);
  for (const [x, z] of [[.12, .1], [.12, -.1], [.2, 0]]) add3(armL, new THREE.ConeGeometry(.04, .16, 4), GRAY, x, .2, z);
  add3(armR, B3(.08, .44, .38), RED, -.18, -.05, 0, 1.04);
  const axe = new THREE.Group(); axe.position.set(0, -.68, .05); armR.add(axe);
  // the axe and the gun run down the arm, so they point forward when the arm swings up
  add3(axe, new THREE.CylinderGeometry(.03, .03, .7, 6), DARK, 0, -.28, 0);
  glow3(axe, B3(.05, .26, .24), 0xff8a2a, 0, -.56, .12);
  const gun = new THREE.Group(); gun.position.set(0, -.68, .05); armL.add(gun);
  add3(gun, B3(.1, .62, .12), DARK, 0, -.25, 0, 1.04);
  add3(gun, new THREE.CylinderGeometry(.12, .12, .1, 10), GRAY, .1, -.12, -.02).rotation.z = PI/2;
  const muzzle = glow3(gun, SPH(.1), 0xffe066, 0, -.62, 0); muzzle.visible = false;
  const leg = sd => {
    const g = limb(sd*.2, -.16);
    add3(g, new THREE.CylinderGeometry(.1, .1, .22, 8), GRAY, 0, -.12, 0);
    add3(g, B3(.25, .42, .3), RED, 0, -.42, 0, 1.04);
    add3(g, B3(.27, .12, .42), DARK, 0, -.7, .05, 1.04);
    return g;
  };
  const legL = leg(1), legR = leg(-1);
  root.scale.setScalar(PU.mechScale);
  root.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return {root, tilt, head, armL, armR, legL, legR, eye, eyeMat, muzzle, flames};
}

/* ---------- Drawing (every screen) ---------- */
// The phase of the current move: 0 wind-up, 1 active, 2 recovery, with k going 0 → 1 inside each phase
function movePhase(f){
  const m = f.move, t = f.stateT; if (!m) return [2, 1];
  if (t < m.startup) return [0, t/m.startup];
  if (t < m.startup + m.active) return [1, (t - m.startup)/m.active];
  return [2, Math.min(1, (t - m.startup - m.active)/m.recovery)];
}
function poseBig(f, P, T, gait){
  const s = f.state, {tilt, armL, armR, legL, legR, head} = P;
  tilt.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0);
  armL.rotation.set(-.2, 0, .15); armR.rotation.set(-.2, 0, -.15); legL.rotation.set(0, 0, 0); legR.rotation.set(0, 0, 0);
  if (s === 'idle' || s === 'guard' || s === 'guardstun'){ const b = Math.sin(T*.07 + f.idx); tilt.rotation.x = b*.03; armL.rotation.x = -.2 + b*.06; armR.rotation.x = -.2 - b*.06; }
  else if (s === 'run'){
    f.bigPhase = (f.bigPhase || 0) + gait; const p = Math.sin(f.bigPhase);
    legL.rotation.x = p*.7; legR.rotation.x = -p*.7; armL.rotation.x = -p*.7 - .2; armR.rotation.x = p*.7 - .2; tilt.rotation.x = .15;
    if (Math.abs(Math.cos(f.bigPhase)) < gait*.6 && f.onGround){ dust(f.pos, 4); if (f.isLocal) G.shake = Math.max(G.shake, .06); }
  }
  else if (s === 'air' || s === 'respawn'){ legL.rotation.x = -.5; legR.rotation.x = .3; armL.rotation.z = 1; armR.rotation.z = -1; }
  else if (s === 'hitstun'){ tilt.rotation.x = -.3; armL.rotation.set(.5, 0, .7); armR.rotation.set(.5, 0, -.7); }
  else if (s === 'tumble' || s === 'ko' || s === 'down'){ tilt.rotation.x = f.onGround || s === 'down' ? -1.4 : -f.stateT*.25; armL.rotation.z = 1.4; armR.rotation.z = -1.4; }
  else if (s === 'getup'){ tilt.rotation.x = -1.4*(1 - Math.min(1, f.stateT/16)); }
  else if (s === 'win'){ const j = Math.abs(Math.sin(T*.15)); armL.rotation.set(0, 0, 2.6 - j*.4); armR.rotation.set(0, 0, -2.6 + j*.4); }
}
function poseApe(f, P, T){
  poseBig(f, P, T, .2);
  const s = f.state, {tilt, armL, armR, head, tail, beam, mouth} = P;
  tail.rotation.y = Math.sin(T*.08 + f.idx)*.4;
  beam.visible = false; mouth.scale.y = 1;
  if (s === 'run'){ tilt.rotation.x = .38; armL.rotation.x -= .5; armR.rotation.x -= .5; }    // knuckle walk
  if ((s === 'idle' || s === 'run') && f.apeIntro > 0){
    // beats its chest after transforming
    const k = Math.sin(T*.6); armL.rotation.set(-1.4 - Math.max(0, k)*.3, -.6, .3); armR.rotation.set(-1.4 - Math.max(0, -k)*.3, .6, -.3);
    head.rotation.x = -.35; mouth.scale.y = 2.5;
  }
  if (s === 'attack' && f.move){
    const [ph, k] = movePhase(f), a = f.move.anim;
    if (a === 'apeslam'){
      const up = ph === 0 ? k : ph === 1 ? 1 - k : 0, down = ph === 0 ? 0 : ph === 1 ? k : 1 - k*.6;
      armL.rotation.set(-2.9*up - .9*down, 0, .25); armR.rotation.set(-2.9*up - .9*down, 0, -.25);
      tilt.rotation.x = -.2*up + .45*down; head.rotation.x = -.3*up; mouth.scale.y = 1 + up*1.5;
      if (ph === 1 && f.stateT === f.move.startup){ const c = new V(f.pos.x + Math.sin(f.facing)*2.2, f.pos.y + .1, f.pos.z + Math.cos(f.facing)*2.2); dust(c, 24); flash(c, 0xf3ead7, .5, 3.4, 12); }
    } else if (a === 'apeswipe'){
      const sw = ph === 0 ? -k : ph === 1 ? -1 + k*2.4 : 1.4 - k*1.4;
      armR.rotation.set(-1.5, sw*1.2, -.4); tilt.rotation.y = sw*.35;
    } else if (a === 'apebeam'){
      head.rotation.x = ph === 0 ? -.5*k : .25; mouth.scale.y = 3;
      beam.visible = ph >= 1 || k > .5; beam.scale.setScalar(ph === 0 ? .5 + k : 1.6 + Math.sin(T)*.2);
      armL.rotation.set(-.3, 0, .9); armR.rotation.set(-.3, 0, -.9);
    }
  }
}
function poseMech(f, m, P, T){
  const riding = !!f;
  P.eyeMat.color.setHex(riding ? 0xff3aa0 : 0x5a1030);
  P.eye.position.x = riding ? Math.sin(T*.05)*.11 : 0;
  P.muzzle.visible = false;
  if (!riding){
    // waiting for a pilot: kneels a little, head down
    const {tilt, armL, armR, legL, legR, head} = P;
    tilt.rotation.set(.12, 0, 0); head.rotation.set(.35, 0, 0); armL.rotation.set(-.1, 0, .1); armR.rotation.set(-.1, 0, -.1);
    legL.rotation.set(-.25, 0, 0); legR.rotation.set(.15, 0, 0);
    for (const fl of P.flames) fl.visible = false;
    if (T % 40 === 0) emit(new V(m.pos.x, m.pos.y + 3.8, m.pos.z), 2, 0xff4fa0, .6, 1.5, 30, 1.2, -1);
    return;
  }
  poseBig(f, P, T, .16);
  const s = f.state, {tilt, armL, armR, head} = P;
  for (const fl of P.flames){ fl.visible = !f.onGround; fl.scale.y = .8 + Math.random()*.6; }
  if (s === 'attack' && f.move){
    const [ph, k] = movePhase(f), a = f.move.anim;
    if (a === 'mkslash'){
      const sw = ph === 0 ? -k : ph === 1 ? -1 + k*2.2 : 1.2 - k*1.2;
      armR.rotation.set(-1.4, sw*1.3, -.3); tilt.rotation.y = sw*.3;
    } else if (a === 'mkchop'){
      const up = ph === 0 ? k : ph === 1 ? 1 - k : 0;
      armR.rotation.set(-3*up - (ph >= 1 ? .8 : 0), 0, -.15); tilt.rotation.x = ph >= 1 ? .25 : -.1*up;
      if (ph === 1 && f.stateT === f.move.startup){ const c = new V(f.pos.x + Math.sin(f.facing)*2.2, f.pos.y + .1, f.pos.z + Math.cos(f.facing)*2.2); dust(c, 18); flash(c, 0xff8a2a, .6, 2.6, 10); }
    } else if (a === 'mkgun'){
      armL.rotation.set(-1.55, 0, -.05); head.rotation.y = 0;
      const firing = ph === 1;
      P.muzzle.visible = firing && T % 4 < 2;
      tilt.rotation.x = firing ? -.04 + Math.random()*.03 : 0;
    }
  }
}
// After pose(f): show the gorilla or hide the pilot inside the mech
function powerPose(f){
  const v = f.vis, shown = v.root.visible;
  const ape = f.apeT > 0 && alive(f);
  if (ape && !f.apeVis){ f.apeVis = buildApe(); f.apeVis.root.scale.setScalar(.2); scene.add(f.apeVis.root); }
  if (f.apeVis){
    const A = f.apeVis;
    A.root.visible = ape && shown;
    if (ape){
      A.root.position.copy(f.pos); A.root.rotation.y = v.root.rotation.y;
      const cur = A.root.scale.x, tg = PU.apeScale*(f.squash > 0 ? 1 + f.squash*.01 : 1);
      A.root.scale.setScalar(cur + (tg - cur)*.18);
      poseApe(f, A, G.frame);
    } else A.root.scale.setScalar(.2);
  }
  if (ape || f.mech){ v.root.visible = false; v.root.scale.setScalar(ape ? PU.apeScale : PU.mechScale*.95); f.puScaled = true; }
  else if (f.puScaled){ f.puScaled = false; if (!v.form) v.root.scale.setScalar(1); }
}
// Every frame from render(): place the mechs and pose them
function renderMechs(){
  for (const m of G.mechs){
    const R = m.vis.root;
    if (m.rider){
      const f = m.rider;
      R.visible = alive(f) && !f.hidden;
      R.position.copy(f.pos); R.rotation.y = f.vis.root.rotation.y;
      poseMech(f, m, m.vis, G.frame);
    } else {
      if (m.net) m.pos.lerp(m.net, .3);
      R.visible = true; R.position.copy(m.pos); R.rotation.y = m.facing;
      poseMech(null, m, m.vis, G.frame);
      // tell the local player how to get in
      const me = G.meF;
      if (me && !me.mech && !(me.apeT > 0) && m.landed && Math.hypot(me.pos.x - m.pos.x, me.pos.z - m.pos.z) < 2.3 && G.frame % 50 === 0 && !IS_TOUCH)
        popup(new V(m.pos.x, m.pos.y + 4.4, m.pos.z), 'กด R ขึ้นหุ่น', 'th', 45);
      else if (me && !me.mech && m.landed && IS_TOUCH && Math.hypot(me.pos.x - m.pos.x, me.pos.z - m.pos.z) < 2.3 && G.frame % 50 === 0)
        popup(new V(m.pos.x, m.pos.y + 4.4, m.pos.z), 'กดปุ่มหยิบ ขึ้นหุ่น', 'th', 45);
    }
  }
}
// What the HUD shows instead of the class skill while powered
function powerHud(f){
  if (f.mech){ const r = f.mechSk <= 0; return {text:'ปืนกลหุ่นรบ' + (r ? ' · พร้อม' : ' · ' + Math.ceil(f.mechSk/60) + ' วิ') + ' · หุ่น ' + Math.max(0, Math.ceil(f.mech.hp)) + '/' + PU.mechHp, ready:r, pct:r ? 100 : 100 - f.mechSk/PU.mechGunCd*100}; }
  if (f.apeT > 0){ const r = !(f.apeSk > 0); return {text:'ลำแสงวานร' + (r ? ' · พร้อม' : ' · ' + Math.ceil(f.apeSk/60) + ' วิ') + ' · เหลือ ' + Math.ceil(f.apeT/60) + ' วิ', ready:r, pct:r ? 100 : 100 - f.apeSk/PU.apeBeamCd*100}; }
  return null;
}

/* ---------- The potion on the floor ---------- */
function buildPotion(){
  const g = new THREE.Group();
  const glass = new THREE.Mesh(SPH(.26), new THREE.MeshToonMaterial({color:0xffd23a, gradientMap:gmap, transparent:true, opacity:.92})); glass.position.y = .05; g.add(glass);
  const neck = part(new THREE.CylinderGeometry(.08, .1, .2, 8), toon(0xbfe6ff), 1.08); neck.position.y = .36; g.add(neck);
  const cork = part(new THREE.CylinderGeometry(.09, .08, .1, 8), toon(0x8a5a2b), 1.08); cork.position.y = .5; g.add(cork);
  const lab = part(B3(.3, .14, .04), toon(0x6b4226)); lab.position.set(0, .05, .24); g.add(lab);
  const shine = new THREE.Mesh(SPH(.36), new THREE.MeshBasicMaterial({color:0xffe066, transparent:true, opacity:.25, depthWrite:false})); shine.position.y = .05; g.add(shine);
  g.userData.spark = shine;
  return g;
}
function drinkPotion(f, it){
  emit(it.pos, 16, 0xffe066, 4, 5, 26, 1.5, 2);
  removeItem(it);
  startApe(f);
}

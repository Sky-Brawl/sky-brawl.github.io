// Sky Brawl · skills.js — สถานะ (แช่แข็ง ชา มึน), วงเวทที่พื้น, โครงกระดูกยมทูต, applyHit
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Status effects: แช่แข็ง (frozen solid) and ชา (numb) ---------- */
const ICE_GEO = new THREE.BoxGeometry(1.15, 1.95, 1.15);
const ICE_MAT = new THREE.MeshBasicMaterial({color:0xaee8ff, transparent:true, opacity:.45, depthWrite:false});
function freezeF(o, n){
  if (o === G.boss || !alive(o)) return;
  o.chill = n; o.shock = 0; setState(o, 'hitstun'); o.stun = n; o.vel.x = o.vel.z = 0;
  const c = new V(o.pos.x, o.pos.y + 1, o.pos.z);
  flash(c, 0xbfefff, .5, 1.8, 12); emit(c, 14, 0xdff7ff, 4, 3, 24, 1.3, 4);
  Sfx.play('freeze', c);
  popup(new V(o.pos.x, o.pos.y + 2.3, o.pos.z), 'แช่แข็ง!', 'combo th', 36);
}
function thaw(o){
  o.chill = 0;
  const c = new V(o.pos.x, o.pos.y + 1, o.pos.z);
  emit(c, 18, 0xdff7ff, 6, 4, 22, 1.2, 10); flash(c, 0xffffff, .35, 1.4, 8);
}
function shockF(o, n){
  if (o === G.boss || !alive(o)) return;
  if (!(o.shock > 0)){ popup(new V(o.pos.x, o.pos.y + 2.3, o.pos.z), 'ชา!', 'combo th', 36); Sfx.play('zap', o.pos); }
  o.shock = Math.max(o.shock || 0, n);
}
// Lightning that jumps from the first target to the nearest unhit enemy, up to m.chain of them
// Angle toward the locked target or the nearest enemy in range, else straight ahead
function aimAngle(f, range){
  const t = f.lock && hittable(f.lock) && Math.hypot(f.lock.pos.x - f.pos.x, f.lock.pos.z - f.pos.z) < range ? f.lock : (aimTarget(f, {noHit:true}) || nearestTarget(f, range));
  return t ? Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z) : f.facing;
}
const DARK_WAVE = {dmg:4, kb:4, up:2, stun:16, hitstop:3, shake:.05};
const DARK_WAVE_BIG = {dmg:6, kb:7, up:5, launch:true, hitstop:4, shake:.15};
function darkWave(f, big){
  const b = fireProj(f, 'dark', aimAngle(f, 11), big ? 17 : 19, big ? 30 : 24, big ? DARK_WAVE_BIG : DARK_WAVE);
  b.pierce = true; b.rad = big ? 1.3 : 1.05;
}
function throwGrenade(f, m, spread){
  const a = aimAngle(f, 13) + (Math.random() - .5)*spread;
  const t = f.lock && hittable(f.lock) ? f.lock : nearestTarget(f, 13);
  const dist = t ? Math.max(2.5, Math.min(13, Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z))) : 7;
  const g = GRAV*.8, vy = 8, h0 = 1.6, T = (vy + Math.sqrt(vy*vy + 2*g*h0))/g, vh = dist*(.9 + Math.random()*.2)/T;
  const b = makeBomb(G.nextId++, 'grenade');
  b.owner = f; b.meteor = m;
  b.pos.set(f.pos.x + Math.sin(a)*.5, f.pos.y + h0, f.pos.z + Math.cos(a)*.5);
  b.vel.set(Math.sin(a)*vh, vy, Math.cos(a)*vh);
  b.mesh.position.copy(b.pos); G.bombs.push(b);
}
// Area effects that live for a while (the ice storm); the host runs them, guests only draw them
const ZONE_KINDS = ['ice', 'skull', 'acid'];
// Alchemist's acid pool: lies on the ground POOL_SECS; anyone standing in it is poisoned for POISON_SECS (refreshed while
// inside). Each pool adds its own stack (up to POISON_MAX), and every 0.5 s a fighter loses POISON_DMG per stack.
const ALCH_CFG = ((window.SKY_CONFIG || {}).skills || {}).alchemist || {};
const cfgNum = (v, d, lo, hi) => { v = Number(v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
const POOL_SECS = cfgNum(ALCH_CFG.poolSeconds, 10, 1, 30), POISON_SECS = cfgNum(ALCH_CFG.poisonSeconds, 10, 1, 30), POISON_DMG = cfgNum(ALCH_CFG.poisonDmg, 1.5, 0, 20), POISON_MAX = 4;
function acidPool(owner, pos, r){
  const gy = groundUnder(pos.x, pos.z); if (gy < -50) return;   // over water or the void: nothing to pool on
  G.zones.push({id:G.nextId++, kind:'acid', owner, x:pos.x, y:gy, z:pos.z, r, t:0, life:Math.round(POOL_SECS*60), born:G.frame});
}
function stepAcid(zn){
  if (zn.t >= zn.life){ dropZone(zn); return; }
  if (zn.t % 10) return;
  for (const f of G.fighters){
    if (f === zn.owner || ally(zn.owner, f) || !hittable(f) || Math.abs(f.pos.y - zn.y) > 1.6 || Math.hypot(f.pos.x - zn.x, f.pos.z - zn.z) > zn.r) continue;
    const P = f.poison || (f.poison = []), until = G.frame + Math.round(POISON_SECS*60), s = P.find(p => p.src === zn.id);
    if (s) s.until = until;
    else if (P.length < POISON_MAX){ P.push({src:zn.id, owner:zn.owner, until}); if (P.length === 1) popup(new V(f.pos.x, f.pos.y + 2.4, f.pos.z), 'ติดพิษ!', 'poison th', 40); }
  }
}
// Every 0.5 s: poison damage that does not stop you (no hitstun); the last tick knocks out the normal way
function stepPoison(){
  for (const f of G.fighters){
    const P = f.poison; if (!P || !P.length) continue;
    for (let i = P.length - 1; i >= 0; i--) if (P[i].until <= G.frame) P.splice(i, 1);
    if (!P.length || (G.frame + f.idx) % 30 || !hittable(f) || f.state === 'ko') continue;
    const owner = P[P.length - 1].owner;
    let dmg = POISON_DMG*P.length;
    const at = new V(f.pos.x, f.pos.y + 1.9, f.pos.z);
    if (f.mech){ f.mech.hp -= dmg; popup(at, '-' + Math.round(dmg*10)/10, 'poison'); if (f.mech.hp <= 0) destroyMech(f.mech, owner); continue; }
    if (f.apeT > 0) dmg *= PU.apeTake;
    if (f.hp - dmg <= 0){ applyHit(null, f, {dmg:Math.ceil(dmg), kb:5, up:5, launch:true, hitstop:4, shake:.1}, new V(Math.sin(f.facing + PI), 0, Math.cos(f.facing + PI)), owner); continue; }
    f.hp -= dmg;
    if (owner && owner !== f){ owner.dmgDealt += dmg; f.lastHitBy = owner.idx; f.lastHitT = G.frame; }
    popup(at, '-' + Math.round(dmg*10)/10, 'poison');
    emit(at, 4, 0x6fe08a, 2, 2, 18, 1.1, -2);
  }
}
const STORM_TICK = {dmg:2, kb:1.5, up:0, stun:14, hitstop:2, shake:.04};
function iceStorm(f, m){
  const t = f.lock && hittable(f.lock) ? f.lock : nearestTarget(f, 13);
  const x = t ? t.pos.x : f.pos.x + Math.sin(f.facing)*5, z = t ? t.pos.z : f.pos.z + Math.cos(f.facing)*5, y = t ? t.pos.y : f.pos.y;
  G.zones.push({id:G.nextId++, kind:'ice', owner:f, x, y, z, r:m.radius || 4, t:0, life:90, m});
  flash(new V(x, 1, z), 0xbfefff, .45, m.radius || 4, 16);
}
function stepZones(){
  stepPoison();
  for (const zn of [...G.zones]){
    zn.t++;
    if (zn.kind === 'acid'){ stepAcid(zn); continue; }
    if (zn.kind === 'skull'){
      stepSkeleton(zn);
      if (zn.sink >= 26) dropZone(zn);
      continue;
    }
    const c = new V(zn.x, zn.y, zn.z);
    if (zn.t < zn.life && zn.t % 18 === 0) aoe(zn.owner, c, zn.r, STORM_TICK);
    if (zn.t >= zn.life){ aoe(zn.owner, c, zn.r, zn.m); dropZone(zn); }
  }
}
const ZONE_GEO = new THREE.CircleGeometry(1, 40);
function acidFx(zn){
  const age = G.frame - (zn.born || G.frame), left = POOL_SECS*60 - age;
  if (!zn.mesh){
    zn.mesh = new THREE.Mesh(ZONE_GEO, new THREE.MeshBasicMaterial({color:0x5fd35f, transparent:true, opacity:.42, depthWrite:false, side:THREE.DoubleSide}));
    zn.mesh.rotation.x = -PI/2; scene.add(zn.mesh);
    const c = new V(zn.x, (zn.y || 0) + .2, zn.z); flash(c, 0x8dff6a, .4, zn.r, 14);
  }
  zn.mesh.position.set(zn.x, (zn.y || 0) + .05, zn.z);
  zn.mesh.scale.setScalar(zn.r*Math.min(1, .3 + age/12)*(.97 + Math.sin(G.frame*.12 + zn.x)*.03));
  zn.mesh.material.opacity = .42*Math.max(0, Math.min(1, left/60));
  if (G.frame % 2 === 0){
    const a = Math.random()*PI*2, rr = Math.sqrt(Math.random())*zn.r*.95;
    emit(new V(zn.x + Math.cos(a)*rr, (zn.y || 0) + .1, zn.z + Math.sin(a)*rr), 1, Math.random() < .3 ? 0xd8ffb0 : 0x6fe08a, .6, 2.2, 26, 1.3, -1.5);
  }
}
function dropZone(zn){ if (zn.mesh) scene.remove(zn.mesh); G.zones.splice(G.zones.indexOf(zn), 1); }
function zoneFx(){
  for (const zn of G.zones){
    if (zn.kind === 'skull'){ skullFx(zn); continue; }
    if (zn.kind === 'acid'){ acidFx(zn); continue; }
    if (!zn.mesh){
      zn.mesh = new THREE.Mesh(ZONE_GEO, new THREE.MeshBasicMaterial({color:0xbfefff, transparent:true, opacity:.28, depthWrite:false, side:THREE.DoubleSide}));
      zn.mesh.rotation.x = -PI/2; scene.add(zn.mesh);
    }
    zn.mesh.position.set(zn.x, (zn.y || 0) + .06, zn.z); zn.mesh.scale.setScalar(zn.r*(.94 + Math.sin(G.frame*.3)*.04));
    for (let k = 0; k < 4; k++){
      const a = Math.random()*PI*2, rr = Math.sqrt(Math.random())*zn.r;
      emit(new V(zn.x + Math.cos(a)*rr, (zn.y || 0) + .2 + Math.random()*3, zn.z + Math.sin(a)*rr), 1, k % 2 ? 0xffffff : 0xbfefff, 3, -1, 22, 1.3, 0);
    }
  }
}
// Reaper's skeleton: rises for ~0.5 s, both fists come down at SKULL_HIT (damage + stun on the host), then it sinks back
const SKULL_HIT = 34;
function summonSkeleton(f, m){
  const t = f.lock && hittable(f.lock) && Math.hypot(f.lock.pos.x - f.pos.x, f.lock.pos.z - f.pos.z) < 12 ? f.lock : nearestTarget(f, 11);
  let x = t ? t.pos.x : f.pos.x + Math.sin(f.facing)*4.5, z = t ? t.pos.z : f.pos.z + Math.cos(f.facing)*4.5;
  if (!onDeck(x, z, 0)){ x = f.pos.x + Math.sin(f.facing)*2; z = f.pos.z + Math.cos(f.facing)*2; }
  const y = t && t.onGround ? t.pos.y : 0;
  for (const old of G.zones) if (old.kind === 'skull' && old.owner === f && !old.sink) old.sink = 1;   // one skeleton each: the old one sinks
  G.zones.push({id:G.nextId++, kind:'skull', owner:f, x, y, z, r:m.radius || 3.5, t:0, life:SKULL_HIT + Math.round((m.life || 10)*60), born:G.frame,
    m, sw:0, sink:0, rot:Math.atan2(f.pos.x - x, f.pos.z - z), last:SKULL_HIT});
}
// sw = frames into a slam: 1–12 fists go up, 13–17 they come down (hit on 17), 18–30 back to rest. The first slam starts at 12 (fists already up while rising).
const SKULL_SLAM_HIT = 17, SKULL_EVERY = 90;
function stepSkeleton(zn){
  const o = zn.owner;
  if (zn.sink){ zn.sink++; zn.sw = 0; return; }
  if (zn.t === SKULL_HIT - 5) zn.sw = 12;
  if (zn.sw > 0){
    zn.sw++;
    if (zn.sw === SKULL_SLAM_HIT){
      if (zn.t < SKULL_HIT + 2) aoe(o, new V(zn.x, zn.y, zn.z), zn.r, zn.m, {root:zn.m.stunT, col:0xb48dff});   // the summoning smash: stun the whole circle
      else {
        const c = new V(zn.x + Math.sin(zn.rot)*1.6, zn.y, zn.z + Math.cos(zn.rot)*1.6);
        aoe(o, c, 2.6, {dmg:Math.round(zn.m.dmg*.8*10)/10, kb:8, up:6, launch:true, hitstop:5, shake:.25});
      }
    }
    if (zn.sw > 30) zn.sw = 0;
  }
  if (zn.t >= zn.life || !o || o.stocks <= 0 || !alive(o)){ zn.sink = 1; return; }
  if (zn.t < SKULL_HIT + 14 || zn.sw > 0) return;
  // Walk (slowly, it is a giant) to the nearest enemy near its master, or back to the master; slam when close
  let best = null, bd = 14;
  for (const e of G.fighters){
    if (e === o || ally(o, e) || !hittable(e) || Math.hypot(e.pos.x - o.pos.x, e.pos.z - o.pos.z) > 16) continue;
    const d = Math.hypot(e.pos.x - zn.x, e.pos.z - zn.z); if (d < bd){ bd = d; best = e; }
  }
  const tx = best ? best.pos.x : o.pos.x, tz = best ? best.pos.z : o.pos.z, stop = best ? 2.2 : 4;
  const dx = tx - zn.x, dz = tz - zn.z, d = Math.hypot(dx, dz);
  if (d > .05){ let da = Math.atan2(dx, dz) - zn.rot; da = Math.atan2(Math.sin(da), Math.cos(da)); zn.rot += da*.12; }
  if (d > stop){
    const sp = Math.min(d - stop, .065), nx = zn.x + dx/d*sp, nz = zn.z + dz/d*sp;
    if (onDeck(nx, nz, .5)){ zn.x = nx; zn.z = nz; }
  }
  if (best && d < 3.2 && zn.t - zn.last >= SKULL_EVERY){ zn.sw = 1; zn.last = zn.t; }
}
function buildSkeleton(){
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const bone = toon(0xeee6d2), dark = toon(0x2a2030), glowM = new THREE.MeshBasicMaterial({color:0xc58aff});
  const box = (p, w, h, d, x, y, z, mat = bone, ol = 1.04) => { const m = part(new THREE.BoxGeometry(w, h, d), mat, ol); m.position.set(x, y, z); p.add(m); return m; };
  box(body, 1.5, .45, .7, 0, .6, 0);
  box(body, .38, 2.3, .38, 0, 1.9, -.1);
  for (let i = 0; i < 4; i++) box(body, 2 - i*.2, .16, 1, 0, 2.2 + i*.32, .05);
  box(body, .2, 1.1, .12, 0, 2.7, .52);
  box(body, 2.6, .3, .5, 0, 3.4, -.05);
  const head = new THREE.Group(); head.position.set(0, 4.25, .1); body.add(head);
  box(head, 1.6, 1.35, 1.45, 0, 0, 0);
  for (const sd of [-1, 1]){ box(head, .42, .42, .1, sd*.36, .05, .7, dark, 0); box(head, .16, .16, .05, sd*.36, .05, .76, glowM, 0); box(head, .22, .5, .22, sd*.62, .8, -.1, dark).rotation.z = -sd*.4; }
  box(head, .2, .25, .1, 0, -.28, .72, dark, 0);
  box(head, 1.15, .32, 1.1, 0, -.82, .1);
  for (let i = -2; i <= 2; i++) box(head, .14, .16, .08, i*.2, -.62, .72, bone, 0);
  const arm = sd => {
    const a = new THREE.Group(); a.position.set(sd*1.35, 3.35, 0); body.add(a);
    box(a, .3, 1.5, .3, 0, -.75, 0); box(a, .26, 1.4, .26, 0, -2.15, 0); box(a, .75, .7, .75, 0, -3.1, 0);
    return a;
  };
  return {g, body, armL:arm(1), armR:arm(-1)};
}
// Every screen draws it from its age, so guests see the same rise and smash
function skullFx(zn){
  if (!zn.mesh){
    const g = new THREE.Group();
    const disc = new THREE.Mesh(ZONE_GEO, new THREE.MeshBasicMaterial({color:0x6b2fa8, transparent:true, opacity:.35, depthWrite:false, side:THREE.DoubleSide}));
    disc.rotation.x = -PI/2; disc.position.y = .06; g.add(disc);
    const sk = buildSkeleton(); g.add(sk.g);
    g.userData = {disc, sk}; scene.add(g); zn.mesh = g;
    if (zn.born === undefined) zn.born = G.frame;
  }
  const a = G.frame - zn.born, {disc, sk} = zn.mesh.userData, gy = zn.y || 0, sw = zn.sw || 0;
  zn.mesh.position.set(zn.x, gy, zn.z);
  sk.g.rotation.y = zn.rot || 0;
  disc.scale.setScalar(a < SKULL_HIT + 40 ? zn.r*(.95 + Math.sin(G.frame*.25)*.04) : 1.6);
  disc.material.opacity = a < SKULL_HIT ? .25 + a/SKULL_HIT*.2 : Math.max(.18, .45*(1 - (a - SKULL_HIT)/40));
  const rise = Math.min(1, a/28), sink = Math.min(1, (zn.sink || 0)/24);
  sk.body.position.y = -6 + 6*(1 - Math.pow(1 - rise, 3)) - 6.5*sink*sink;
  const rest = -.25 + Math.sin(G.frame*.06 + zn.id)*.08, top = -2.9, down = -.45;
  const arm = a < 29 && !sw ? top : sw <= 0 ? rest : sw <= 12 ? rest + (top - rest)*sw/12 : sw <= SKULL_SLAM_HIT ? top + (down - top)*(sw - 12)/5 : down + (rest - down)*Math.min(1, (sw - SKULL_SLAM_HIT)/13);
  sk.armL.rotation.x = sk.armR.rotation.x = arm;
  sk.body.rotation.x = sw >= 13 && sw < 26 ? .35 : 0;
  // a slow heavy sway while it walks
  sk.body.rotation.z = a > SKULL_HIT + 14 && !sw ? Math.sin(G.frame*.12 + zn.id)*.05 : 0;
  if (a < 30 && G.frame % 2 === 0){
    const ang = Math.random()*PI*2, rr = Math.random()*zn.r*.7;
    emit(new V(zn.x + Math.cos(ang)*rr, gy + .2, zn.z + Math.sin(ang)*rr), 2, 0x8a5ac8, 2, 3, 26, 1.6, -1, .6);
  }
  if (sw < SKULL_SLAM_HIT) zn.hitFx = false;
  else if (!zn.hitFx){
    zn.hitFx = true;
    const first = a < SKULL_HIT + 6, rr = first ? zn.r : 2.6;
    const c = first ? new V(zn.x, gy + .3, zn.z) : new V(zn.x + Math.sin(zn.rot || 0)*1.6, gy + .3, zn.z + Math.cos(zn.rot || 0)*1.6);
    flash(c, 0xb46dff, .6, rr + 1, 16); emit(c, first ? 30 : 18, 0xd9c8ff, rr*3, 3, 26, 1.6, 6); dust(c, first ? 24 : 14);
    const me = G.fighters.find(f => f.isLocal);
    if (me && Math.hypot(me.pos.x - zn.x, me.pos.z - zn.z) < zn.r + 6) G.shake = Math.max(G.shake, .5);
    if (G.net === 'guest') Sfx.play('stomp', c);
  }
}
function chainLightning(f, m){
  const first = f.lock && hittable(f.lock) && Math.hypot(f.lock.pos.x - f.pos.x, f.lock.pos.z - f.pos.z) < 12 ? f.lock : nearestTarget(f, 11);
  const hand = new V(f.pos.x + Math.sin(f.facing)*.6, f.pos.y + 1.6, f.pos.z + Math.cos(f.facing)*.6);
  flash(hand, 0xfff27a, .4, 1.6, 10);
  if (!first){ for (let i = 0; i < 3; i++) zap(hand, new V(hand.x + Math.sin(f.facing + (i - 1)*.5)*5, .3, hand.z + Math.cos(f.facing + (i - 1)*.5)*5)); return; }
  const hit = new Set(); let from = hand, cur = first;
  for (let k = 0; k < (m.chain || 4) && cur; k++){
    hit.add(cur);
    const to = new V(cur.pos.x, cur.pos.y + 1, cur.pos.z);
    zap(from, to);
    const dx = cur.pos.x - (k ? from.x : f.pos.x), dz = cur.pos.z - (k ? from.z : f.pos.z), n = Math.hypot(dx, dz) || 1;
    applyHit(null, cur, m, new V(dx/n, 0, dz/n), f);
    from = to;
    let best = null, bd = 6;
    for (const o of G.fighters){
      if (o === f || hit.has(o) || ally(f, o) || !hittable(o)) continue;
      const d = Math.hypot(o.pos.x - to.x, o.pos.z - to.z);
      if (d < bd){ bd = d; best = o; }
    }
    cur = best;
  }
  if (f.isLocal) G.shake = Math.max(G.shake, .35);
}
function zap(a, b){
  const n = Math.max(4, Math.round(a.distanceTo(b)*2.5));
  for (let i = 0; i <= n; i++){
    const k = i/n, j = i && i < n ? .35 : 0;
    emit(new V(a.x + (b.x - a.x)*k + (Math.random() - .5)*j, a.y + (b.y - a.y)*k + (Math.random() - .5)*j, a.z + (b.z - a.z)*k + (Math.random() - .5)*j), 1, i % 2 ? 0xffffff : 0xfff27a, .4, .3, 12, 1.5, 0);
  }
  flash(b, 0xfff27a, .45, 1.5, 10);
}
function statusFx(f, shown){
  if (shown && ((f.poison && f.poison.length) || f.poisonVis) && (G.frame + f.idx) % 7 === 0)
    emit(new V(f.pos.x + (Math.random() - .5)*.7, f.pos.y + 1.6 + Math.random()*.6, f.pos.z + (Math.random() - .5)*.7), 1, 0x6fe08a, .5, 2, 22, 1.2, -2);
  const v = f.vis, on = shown && f.chill > 0;
  if (on && !v.ice){ v.ice = new THREE.Mesh(ICE_GEO, ICE_MAT); v.ice.renderOrder = 3; scene.add(v.ice); }
  if (v.ice){ v.ice.visible = on; if (on){ v.ice.position.set(f.pos.x, f.pos.y + .97, f.pos.z); v.ice.rotation.y = f.idx*.7; } }
  if (shown && f.shock > 0 && (G.frame + f.idx) % 5 === 0)
    emit(new V(f.pos.x + (Math.random() - .5)*.9, f.pos.y + .3 + Math.random()*1.5, f.pos.z + (Math.random() - .5)*.9), 2, Math.random() < .5 ? 0xfff27a : 0xffffff, 2.6, 1.5, 9, 1.1, 0);
}
function rageSteal(credit, tgt, amount){
  if (!credit || credit === tgt || !(credit.rage > 0) || !alive(credit) || amount <= 0 || credit.hp >= MAX_HP) return;
  const was = credit.hp; credit.hp = Math.min(MAX_HP, credit.hp + amount);
  credit.stealAcc = (credit.stealAcc || 0) + (credit.hp - was);
  if (G.frame - (credit.stealT || -99) > 10){
    credit.stealT = G.frame;
    popup(new V(credit.pos.x, credit.pos.y + 2.6, credit.pos.z), '+' + Math.round(credit.stealAcc), 'th', 34); credit.stealAcc = 0;
  }
  if (G.frame % 2 === 0) emit(new V(tgt.pos.x, tgt.pos.y + 1, tgt.pos.z), 2, 0xff3a4a, 3, 3, 18, 1.1, -2);
}
function applyHit(att, tgt, m, dir, credit){
  if (ally(credit, tgt)) return;
  if (credit && credit !== tgt && credit.rage > 0) m = {...m, dmg:Math.round(m.dmg*1.5)};
  if (credit && credit !== tgt && credit.zombie) m = {...m, dmg:Math.round(m.dmg*ZB.dmg)};
  if (powerOn(tgt) && powerAbsorb(att, tgt, m, dir, credit)) return;
  const local = (att && att.isLocal) || tgt.isLocal || G.fighters.length <= 2;
  const front = -(Math.sin(tgt.facing)*dir.x + Math.cos(tgt.facing)*dir.z);
  const guarding = (tgt.state === 'guard' || tgt.state === 'guardstun') && front > .2;
  const at = new V(tgt.pos.x - dir.x*.35, tgt.pos.y + .9, tgt.pos.z - dir.z*.35);
  if (guarding && !m.breakGuard){
    rageSteal(credit, tgt, m.dmg*.15);
    tgt.hp = Math.max(1, tgt.hp - m.dmg*.15);
    setState(tgt, 'guardstun'); tgt.stun = 8 + m.dmg;
    tgt.vel.x = dir.x*(m.kb*.4 + 2); tgt.vel.z = dir.z*(m.kb*.4 + 2);
    emit(at, 8, 0x9fd8ff, 4, 2, 16, 1.2, 6); flash(at, 0xbfe6ff, .3, 1.1, 8);
    Sfx.play('guard', at);
    if (att) att.freeze = 3; tgt.freeze = 3;
    return;
  }
  if (guarding){ popup(at, 'GUARD BREAK', 'combo'); Sfx.play('gbreak', at); }
  if (tgt.chill > 0 && !m.freeze) thaw(tgt);
  const comboing = ['hitstun','tumble'].includes(tgt.state);
  rageSteal(credit, tgt, Math.min(m.dmg, Math.max(0, tgt.hp)));
  tgt.hp -= m.dmg;
  if (credit && credit !== tgt){
    credit.hits++; credit.dmgDealt += m.dmg;
    tgt.lastHitBy = credit.idx; tgt.lastHitT = G.frame;
    if (att){ att.combo = comboing ? att.combo + 1 : 1; if (att.combo >= 2) popup(new V(at.x, at.y + .8, at.z), att.combo + ' HITS', 'combo', 40); }
  }
  popup(at, String(m.dmg));
  if (tgt.held === 'bomb'){ dropItem('bomb', tgt.pos); tgt.held = null; }
  tgt.facing = Math.atan2(-dir.x, -dir.z);
  const sc = 1 + (MAX_HP - Math.max(0, tgt.hp))/MAX_HP*.8;
  if (tgt.hp <= 0){
    tgt.hp = 0; setState(tgt, 'ko'); tgt.vel.set(dir.x*14, 13, dir.z*14); tgt.onGround = false;
    tgt.freeze = 14; if (att) att.freeze = 14;
    G.shake = Math.max(G.shake, local ? .9 : .25);
    if (G.mode === 'play' && tgt.stocks === 1 && aliveCount() === 2) G.slow = 80;
    flash(at, 0xffffff, .5, 3, 14); emit(at, 26, 0xffd23a, 9, 5, 30, 2, 8);
    Sfx.play('ko', at);
    return;
  }
  if (m.launch || !tgt.onGround){
    setState(tgt, 'tumble');
    tgt.vel.set(dir.x*m.kb*sc, Math.max(m.up || 0, 3)*(.7 + sc*.3), dir.z*m.kb*sc);
    tgt.onGround = false;
  } else {
    setState(tgt, 'hitstun'); tgt.stun = m.stun || 16;
    tgt.vel.x = dir.x*m.kb*sc; tgt.vel.z = dir.z*m.kb*sc;
  }
  tgt.squash = 10;
  const hs = m.hitstop || 5; tgt.freeze = hs; if (att) att.freeze = hs;
  G.shake = Math.max(G.shake, (m.shake || .08)*(local ? 1 : .3));
  emit(at, m.launch ? 16 : 9, 0xffe066, m.launch ? 7 : 5, 3, 20, 1.4, 6);
  flash(at, 0xffffff, .25, m.launch ? 1.6 : 1, m.launch ? 10 : 7);
  Sfx.play(m.launch || m.dmg >= 9 ? 'smash' : m.dmg >= 5 ? 'hit' : 'punch', at);
  if (m.freeze) freezeF(tgt, m.freeze);
  if (m.shock) shockF(tgt, m.shock);
}

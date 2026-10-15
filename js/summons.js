// Sky Brawl · summons.js — ผีนักดาบของชาแมน + พายุหอกของแลนเซอร์
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Shaman's ghost swordsman and the Lancer's spear storm ----------
   The ghost lives in G.ghosts like a turret: the host moves it, picks targets and deals the damage;
   guests get [id, x, z, rot, sw] in the snapshot and animate it the same way (animGhosts runs on every screen). */
function makeGhost(id){
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const mist = new THREE.MeshBasicMaterial({color:0x8f6bff, transparent:true, opacity:.55, depthWrite:false});
  const add = (p, geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); p.add(o); return o; };
  add(body, new THREE.ConeGeometry(.5, 1.3, 12), mist, 0, .75, 0).rotation.x = PI;     // a wisp instead of legs
  add(body, SPH(.44), mist, 0, 1.55, 0).scale.set(1.05, 1.05, .9);
  add(body, SPH(.36), mist, 0, 2.18, 0);
  const gold = new THREE.MeshBasicMaterial({color:0xffd23a}), red = new THREE.MeshBasicMaterial({color:0xff3a6a});
  for (const sd of [-1, 1]){
    add(body, new THREE.ConeGeometry(.07, .42, 6), gold, sd*.22, 2.5, .08).rotation.z = -sd*.45;    // helmet horns
    add(body, new THREE.BoxGeometry(.11, .04, .03), red, sd*.13, 2.2, .34).rotation.z = sd*.25;     // glowing eyes
    add(body, SPH(.16), mist, sd*.46, 1.78, 0).scale.y = .7;                                          // shoulder plates
  }
  const arm = new THREE.Group(); arm.position.set(-.48, 1.7, 0); body.add(arm);
  add(arm, new THREE.CylinderGeometry(.09, .08, .5, 8), mist, 0, -.25, 0);
  add(arm, new THREE.BoxGeometry(.3, .05, .1), gold, 0, -.52, 0);
  add(arm, new THREE.BoxGeometry(.06, 1.5, .17), new THREE.MeshBasicMaterial({color:0xe2d6ff}), 0, -1.3, 0);
  add(arm, new THREE.BoxGeometry(.03, 1.4, .2), new THREE.MeshBasicMaterial({color:0xb46dff, transparent:true, opacity:.6, depthWrite:false}), 0, -1.3, .02);
  const offArm = add(body, new THREE.CylinderGeometry(.09, .08, .5, 8), mist, .48, 1.5, 0); offArm.rotation.z = .3;
  scene.add(g);
  return {id, mesh:g, body, arm, pos:new V(), net:null, rot:0, t:0, life:Math.round(GHOST_INFO.secs*60), sw:-1, lastSw:-99, fx:false};
}
function summonGhost(f){
  for (const g of [...G.ghosts]) if (g.owner === f) removeGhost(g, true);
  const g = makeGhost(G.nextId++); g.owner = f;
  g.pos.set(f.pos.x - Math.sin(f.facing)*1.2, 0, f.pos.z - Math.cos(f.facing)*1.2); g.rot = f.facing;
  g.mesh.position.copy(g.pos); g.mesh.rotation.y = g.rot;
  G.ghosts.push(g); ghostFx(g.pos, true);
}
function ghostFx(p, big){
  const c = new V(p.x, 1.3, p.z);
  flash(c, 0x9b7bff, .5, big ? 3 : 1.8, big ? 16 : 10);
  emit(c, big ? 26 : 14, 0xb9a2ff, big ? 5 : 3, 4, 30, 1.6, -2, .6);
}
function removeGhost(g, fx){
  if (fx) ghostFx(g.pos, false);
  scene.remove(g.mesh); G.ghosts.splice(G.ghosts.indexOf(g), 1);
}
// Host only: chase the closest enemy near the shaman, slash it (a hit in front plus a dark wave), drift back when idle
function stepGhosts(){
  for (const g of [...G.ghosts]){
    const o = g.owner;
    if (++g.t > g.life || !o || o.stocks <= 0 || !alive(o)){ removeGhost(g, true); continue; }
    if (g.sw >= 0){ g.sw++; if (g.sw === 6) ghostSlash(g); if (g.sw > 16) g.sw = -1; }
    let best = null, bd = 13;
    for (const e of G.fighters){
      if (e === o || ally(o, e) || !hittable(e) || Math.hypot(e.pos.x - o.pos.x, e.pos.z - o.pos.z) > 16) continue;
      const d = Math.hypot(e.pos.x - g.pos.x, e.pos.z - g.pos.z);
      if (d < bd){ bd = d; best = e; }
    }
    const B = G.boss, boss = !best && B && B.hp > 0 && Math.hypot(B.pos.x - g.pos.x, B.pos.z - g.pos.z) < 14;
    let tx, tz, stop;
    if (best){ tx = best.pos.x; tz = best.pos.z; stop = 1.4; }
    else if (boss){ tx = B.pos.x; tz = B.pos.z; stop = BOSS_R + 1; }
    else { tx = o.pos.x - Math.sin(o.facing + .8)*1.5; tz = o.pos.z - Math.cos(o.facing + .8)*1.5; stop = .2; }
    if (Math.hypot(o.pos.x - g.pos.x, o.pos.z - g.pos.z) > 20){ g.pos.set(o.pos.x, 0, o.pos.z); ghostFx(g.pos, false); }
    const dx = tx - g.pos.x, dz = tz - g.pos.z, d = Math.hypot(dx, dz);
    if (d > stop && g.sw < 0){ const sp = Math.min(d - stop, .17); g.pos.x += dx/d*sp; g.pos.z += dz/d*sp; }
    const face = best || boss ? Math.atan2(dx, dz) : d > .3 ? Math.atan2(dx, dz) : o.facing;
    let da = face - g.rot; da = Math.atan2(Math.sin(da), Math.cos(da)); g.rot += da*.2;
    if ((best || boss) && d < stop + 1.1 && g.sw < 0 && g.t - g.lastSw >= GHOST_INFO.every){ g.sw = 0; g.lastSw = g.t; }
  }
}
function ghostSlash(g){
  const o = g.owner, fx = Math.sin(g.rot), fz = Math.cos(g.rot), c = new V(g.pos.x + fx*1.2, .9, g.pos.z + fz*1.2);
  for (const e of G.fighters){
    if (e === o || ally(o, e) || !hittable(e) || Math.abs(e.pos.y) > 2.5) continue;
    let dx = e.pos.x - g.pos.x, dz = e.pos.z - g.pos.z;
    if (Math.hypot(e.pos.x - c.x, e.pos.z - c.z) > 2.1) continue;
    const n = Math.hypot(dx, dz) || 1; if (n < .05){ dx = fx; dz = fz; }
    applyHit(null, e, GHOST_SLASH, new V(dx/n, 0, dz/n), o);
  }
  hitStones(o, c, 2.6, GHOST_SLASH.dmg);
  if (G.boss) hitBossArea(o, c, 2.1, GHOST_SLASH.dmg);
  const b = fireProj(o, 'dark', g.rot, 19, 26, DARK_WAVE);
  b.pos.set(g.pos.x + fx*.9, .95, g.pos.z + fz*.9); b.mesh.position.copy(b.pos); b.pierce = true; b.rad = 1.1;
}
// Every screen: float, face, swing the sword, flash on the hit frame
function animGhosts(){
  const T = G.frame;
  for (const g of G.ghosts){
    if (g.net){ g.pos.x += (g.net.x - g.pos.x)*.3; g.pos.z += (g.net.z - g.pos.z)*.3; }
    g.mesh.position.set(g.pos.x, .25 + Math.sin(T*.08 + g.id)*.15, g.pos.z);
    g.mesh.rotation.y = g.rot;
    const s = g.sw;
    if (s < 0){ g.arm.rotation.set(-.5 + Math.sin(T*.05)*.08, 0, -.2); g.body.rotation.x = 0; g.fx = false; }
    else {
      const up = Math.min(1, s/6), dn = Math.max(0, Math.min(1, (s - 6)/5));
      g.arm.rotation.set(-.5 - 2.4*up + 2.9*dn, 0, -.2); g.body.rotation.x = .25*dn - .1*up;
      if (s >= 6 && !g.fx){
        g.fx = true;
        const c = new V(g.pos.x + Math.sin(g.rot)*1.2, .9, g.pos.z + Math.cos(g.rot)*1.2);
        flash(c, 0xb46dff, .5, 2.2, 10); emit(c, 16, 0xd9c8ff, 6, 2, 16, 1.3, 2);
        Sfx.play('swingBig', c);
      }
    }
  }
}
// Host only: the lancer's thrusts hit everyone in a strip m.len long and m.wid wide in front, every m.tick frames;
// the last volley launches. The lancer turns slowly toward the stick (bots: toward their target).
function lanceTick(f, m, k){
  let ta = null;
  if (f.ctrl === 'bot'){ const t = f.ai.tgt; if (t && alive(t)) ta = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z); }
  else if (Math.hypot(f.input.x, f.input.z) > .25) ta = Math.atan2(f.input.x, f.input.z);
  if (ta !== null){ let d = ta - f.facing; d = Math.atan2(Math.sin(d), Math.cos(d)); f.facing += d*.08; }
  if (k % m.tick) return;
  const last = k + m.tick >= m.active, hm = last && m.tick < m.active ? {...m, kb:m.kb*3.5, up:7, launch:true, hitstop:6, shake:.3} : m;
  const fx = Math.sin(f.facing), fz = Math.cos(f.facing);
  const inStrip = (x, z, pad) => {
    const dx = x - f.pos.x, dz = z - f.pos.z, along = dx*fx + dz*fz, side = Math.abs(dx*fz - dz*fx);
    return along > -.3 && along < m.len + pad && side < m.wid + pad;
  };
  for (const o of G.fighters){
    if (o === f || ally(f, o) || !hittable(o) || Math.abs(o.pos.y - f.pos.y) > 2.5 || !inStrip(o.pos.x, o.pos.z, .45)) continue;
    applyHit(f, o, hm, new V(fx, 0, fz), f);
  }
  if (G.teamMode) for (const st of G.stones) if (st.hp > 0 && st.side !== f.side && inStrip(st.pos.x, st.pos.z, .9)) damageStone(st, m.dmg, f);
  const B = G.boss;
  if (B && B.hp > 0 && inStrip(B.pos.x, B.pos.z, BOSS_R)) damageBoss(m.dmg*(f.rage > 0 ? 1.5 : 1), f);
}
// Every screen: streaks of light shooting along the strip
function lanceFx(f){
  const m = f.move, t = f.stateT;
  if (t < m.startup || t >= m.startup + m.active) return;
  const k = t - m.startup;
  if (m.tick < m.active ? k % 2 : f.fxId === f.moveKey + ':' + (G.frame - t)) return;
  f.fxId = f.moveKey + ':' + (G.frame - t);
  const fx = Math.sin(f.facing), fz = Math.cos(f.facing), pool = SPARKS, n = m.tick < m.active ? 2 : 5;
  for (let j = 0; j < n; j++){
    const off = (Math.random() - .5)*2*m.wid, y = f.pos.y + .8 + (Math.random() - .5)*.6;
    for (let i = 0; i < 6; i++){
      const p = pool.list[pool.idx = (pool.idx + 1) % pool.list.length], a = (i + Math.random())/6*m.len*.5;
      p.pos.set(f.pos.x + fx*(.8 + a) + fz*off, y, f.pos.z + fz*(.8 + a) - fx*off);
      p.v.set(fx*m.len*5, 0, fz*m.len*5); p.life = p.max = 8 + Math.random()*5; p.s = 1.2 + Math.random()*.7; p.g = 0;
      pool.mesh.setColorAt(pool.idx, _pc.setHex(i < 2 ? 0xffffff : 0x9fd8ff));
    }
  }
  pool.mesh.instanceColor.needsUpdate = true;
  if (k % 8 === 0) Sfx.play('swing', f.pos, .6);
}

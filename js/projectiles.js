// Sky Brawl · projectiles.js — กระสุน/ลูกไฟ, useSkill และสกิลพิเศษหลายอาชีพ, ป้อมปืน
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
const BULLET_GEO = new THREE.SphereGeometry(.09, 8, 6);
const BULLET_MAT = new THREE.MeshBasicMaterial({color:0xffe066});
const PROJ_KINDS = ['bullet', 'arrow', 'fireball', 'soul', 'bolt', 'holy', 'note', 'rainbow', 'beam', 'mega', 'falcon', 'thunder', 'potion', 'acid', 'snow', 'ice', 'spark', 'dark', 'darkbig', 'saber', 'skyslash'];
const PROJ_LOOK = {bullet:[0xffe066, .09, 3], arrow:[0xd9b98a, .06, 7], fireball:[0xff7a2f, .32, 1], soul:[0x8dff6a, .22, 1],
  bolt:[0xb48dff, .16, 1.6], holy:[0xffe066, .18, 1], note:[0x7fe3ff, .15, 1], rainbow:[0xff8fd6, .2, 2], beam:[0xff6bd6, .1, 9], mega:[0x7fe3ff, .5, 4],
  falcon:[0x8a5a2b, .22, 1.6], thunder:[0xfff27a, .14, 5], potion:[0xff8a3a, .14, 1], acid:[0x8dff6a, .2, 1], snow:[0xffffff, .34, 1], ice:[0xbfefff, .24, 1.6], spark:[0xfff27a, .13, 2], dark:[0x241433, .5, .3], darkbig:[0x2a0f3f, .8, .3], saber:[0x7fe3ff, .09, 10]};
const RAINBOW = [0xff5d4a, 0xffc23a, 0x3fbf5a, 0x2f8cff, 0x9b5de5];
const TRAIL = {fireball:0xffa53a, soul:0x8dff6a, bolt:0xb48dff, holy:0xfff2a8, note:0x7fe3ff, mega:0xbff3ff, falcon:0xf2e6c8, thunder:0xfff27a, potion:0xffa53a, acid:0x8dff6a, ice:0xdff7ff, spark:0xfff27a, dark:0x6a2a9a, darkbig:0x8a3ac0, saber:0x7fe3ff};
const BLAST_COL = {ice:0xbfefff, snow:0xe8f4ff, fireball:0xffa53a, falcon:0xf2e6c8, potion:0xff7a2f, acid:0x8dff6a};
// Projectiles that burst into an area when they land: the fireball, plus any move with a blast radius
function burst(b){
  const r = b.kind === 'fireball' ? 2.4 : b.m && b.m.blast;
  if (!r) return false;
  const c = BLAST_COL[b.kind] || 0xffa53a;
  flash(b.pos, c, .4, r*1.3, 16); emit(b.pos, 20, c, 6, 4, 26, 1.6, 6);
  if (b.kind === 'fireball') explodeFx(b.pos);
  aoe(b.owner, b.pos, r, b.m);
  if (b.kind === 'acid') acidPool(b.owner, b.pos, r*.85);
  return true;
}
PROJ_LOOK.skyslash = [0xdff4ff, .3, 1]; TRAIL.skyslash = 0xbfe9ff; PROJ_SND.skyslash = 'skyslash';
const trailColor = k => k === 'rainbow' ? RAINBOW[(G.frame >> 1) % 5] : TRAIL[k];
function makeBullet(id, kind = 'bullet'){
  const [c, r, len] = PROJ_LOOK[kind] || PROJ_LOOK.bullet;
  const mesh = kind === 'bullet' ? new THREE.Mesh(BULLET_GEO, BULLET_MAT)
    : new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:.9}));
  mesh.scale.set(1, 1, len); scene.add(mesh);
  // Dark waves are wide flat crescents standing on edge; the thrown laser sword spins flat
  if (kind === 'dark' || kind === 'darkbig'){ mesh.scale.set(kind === 'dark' ? 1.8 : 1.9, .75, .28); mesh.material.opacity = .85; }
  // The sword wave: a flat white-blue crescent bowed forward
  if (kind === 'skyslash'){
    mesh.geometry.dispose(); mesh.geometry = new THREE.TorusGeometry(1.25, .1, 5, 28, PI).rotateX(PI/2).translate(0, 0, -.9);
    mesh.scale.set(1, 1, 1); mesh.material.color.setHex(0xeaf8ff); mesh.material.opacity = .95; mesh.material.side = THREE.DoubleSide;
    const glow = new THREE.Mesh(new THREE.TorusGeometry(1.25, .26, 5, 28, PI).rotateX(PI/2).translate(0, 0, -.95), new THREE.MeshBasicMaterial({color:0x7fd0ff, transparent:true, opacity:.35, depthWrite:false}));
    mesh.add(glow);
  }
  if (kind === 'saber'){ mesh.geometry.dispose(); mesh.geometry = new THREE.BoxGeometry(.09, .09, 1.3); mesh.scale.set(1, 1, 1); }
  return {id, kind, mesh, pos:new V(), vel:new V(), life:0};
}
function fireProj(f, kind, a, speed, life, m){
  const b = makeBullet(G.nextId++, kind);
  b.pos.set(f.pos.x + Math.sin(a)*.9, f.pos.y + .95, f.pos.z + Math.cos(a)*.9);
  b.vel.set(Math.sin(a), 0, Math.cos(a)).multiplyScalar(speed);
  b.life = life; b.owner = f; b.m = m;
  b.mesh.position.copy(b.pos); b.mesh.rotation.y = a;
  // Aim up or down at whoever the shot is heading for, so shooting from a hill (or at one) still connects
  if (f && f.idx !== undefined){
    const tg = f.lock && hittable(f.lock) ? f.lock : nearestTarget(f, 16);
    if (tg){
      const dx = tg.pos.x - b.pos.x, dz = tg.pos.z - b.pos.z, d = Math.hypot(dx, dz);
      let da = Math.atan2(dx, dz) - a; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
      const dy = tg.pos.y + .9 - b.pos.y;
      if (d > .5 && da < .6 && Math.abs(dy) > .4) b.vel.y = dy/(d/speed);
    }
  }
  if (kind === 'bullet') flash(b.pos, 0xffd23a, .12, .5, 5);
  Sfx.proj(kind, b.pos);
  G.bullets.push(b); return b;
}
// A flask thrown in an arc at the nearest enemy (or 7 squares ahead): it bursts into a 7x7 cloud where it lands, or earlier if it hits someone
function lobFlask(f, m){
  const t = f.lock && hittable(f.lock) ? f.lock : nearestTarget(f, 14);
  const a = t ? Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z) : f.facing;
  const d = Math.max(3, Math.min(14, t ? Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) : 7)), g = GRAV*.8, h0 = f.pos.y + 1.4, T = Math.max(.5, d/15);
  const b = fireProj(f, 'acid', a, d/T, Math.round(T*60) + 40, m);
  b.vel.y = (.2 - h0 + g/2*T*T)/T; b.grav = g; b.pos.y = h0; b.mesh.position.copy(b.pos);
  return b;
}
function aoe(src, center, radius, m, opt = {}){
  Sfx.play('stomp', center, .7);
  hitStones(src, center, radius + .6, m.dmg || 0);
  if (src !== G.boss) hitBossArea(src, center, radius, m.dmg || 0);
  for (const o of G.fighters){
    if (o === src || ally(src, o) || !hittable(o)) continue;
    let dx = o.pos.x - center.x, dz = o.pos.z - center.z;
    const d = Math.hypot(dx, dz);
    if (d > radius || Math.abs(o.pos.y - center.y) > 2.5) continue;
    if (d < .01){ dx = 1; dz = 0; }
    const n = Math.hypot(dx, dz);
    if (opt.root){
      o.hp = Math.max(1, o.hp - m.dmg); setState(o, 'hitstun'); o.stun = opt.root; o.vel.set(0, 0, 0); o.squash = 10;
      popup(new V(o.pos.x, o.pos.y + .9, o.pos.z), String(m.dmg));
      emit(new V(o.pos.x, opt.col ? 1.9 : .3, o.pos.z), 10, opt.col || 0x3fbf5a, 2, 3, 30, 1.4, 2);
      if (src){ src.hits++; src.dmgDealt += m.dmg; o.lastHitBy = src.idx; o.lastHitT = G.frame; }
      continue;
    }
    applyHit(null, o, m, new V(dx/n, 0, dz/n), src);
  }
}
function useSkill(f){
  const kc = skillOf(f), key = skillKey(kc), copied = kc !== f.cls;
  f.skillCd = (SKILL_INFO[kc] || SKILL_INFO.none).cd + (MOVES[key].form && FORM_INFO[kc] ? Math.round(FORM_INFO[kc].secs*60) : 0);
  if (copied) flash(new V(f.pos.x, f.pos.y + 1.4, f.pos.z), 0x8a5ad8, .35, 1.8, 10);
  if (f.held === 'bomb'){ dropItem('bomb', f.pos); f.held = null; }
  startMove(f, key);
  popup(new V(f.pos.x, 2.7, f.pos.z), (copied ? '📖 ' : '') + MOVES[key].name + '!', 'combo th', 40);
}
const blocked = (x, z) => !onDeck(x, z, .5) || FUNNELS.some(fn => Math.hypot(x - fn.x, z - fn.z) < fn.r + .4) || !!inBlock(x, z, .4);
function shadowStep(f){
  let best = null, bd = 9;
  for (const o of G.fighters){
    if (o === f || ally(f, o) || !hittable(o)) continue;
    const d = Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z);
    if (d < bd){ bd = d; best = o; }
  }
  emit(new V(f.pos.x, 1, f.pos.z), 14, 0x3a3f4b, 3, 2, 22, 1.6, -1);
  if (best){
    const bx = best.pos.x - Math.sin(best.facing)*1.1, bz = best.pos.z - Math.cos(best.facing)*1.1;
    if (!blocked(bx, bz)){ f.pos.x = bx; f.pos.z = bz; }
    else { const k = Math.max(0, bd - 1.1)/bd; f.pos.x += (best.pos.x - f.pos.x)*k; f.pos.z += (best.pos.z - f.pos.z)*k; }
    f.facing = Math.atan2(best.pos.x - f.pos.x, best.pos.z - f.pos.z);
  } else {
    for (let s = 5; s > 0; s -= .5){ const x = f.pos.x + Math.sin(f.facing)*s, z = f.pos.z + Math.cos(f.facing)*s; if (!blocked(x, z)){ f.pos.x = x; f.pos.z = z; break; } }
  }
  f.pos.y = Math.max(0, f.pos.y);
  emit(new V(f.pos.x, 1, f.pos.z), 14, 0x3a3f4b, 3, 2, 22, 1.6, -1);
}
function ninjaDash(f, m){
  const fx = Math.sin(f.facing), fz = Math.cos(f.facing), start = f.pos.clone();
  let d = 0;
  for (let st = .5; st <= 6; st += .5){ if (blocked(start.x + fx*st, start.z + fz*st)) break; d = st; }
  f.pos.x = start.x + fx*d; f.pos.z = start.z + fz*d; f.invuln = Math.max(f.invuln, 20);
  for (let st = 0; st <= d; st += .7) emit(new V(start.x + fx*st, 1, start.z + fz*st), 2, 0x1d2233, 1, 1, 18, 1.4, -1);
  for (const o of G.fighters){
    if (o === f || !hittable(o)) continue;
    const px = o.pos.x - start.x, pz = o.pos.z - start.z, along = Math.max(0, Math.min(d, px*fx + pz*fz));
    if (Math.hypot(px - fx*along, pz - fz*along) < 1.1 && Math.abs(o.pos.y - f.pos.y) < 1.5){
      const side = Math.sign(-fz*px + fx*pz) || 1;
      applyHit(null, o, m, new V(fx*.6 - fz*side*.8, 0, fz*.6 + fx*side*.8).normalize(), f);
    }
  }
}
function nearestTarget(f, maxD){
  let best = null, bd = maxD;
  for (const o of G.fighters){
    if (o === f || ally(f, o) || !hittable(o)) continue;
    const d = Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z);
    if (d < bd){ bd = d; best = o; }
  }
  return best;
}
function meteorStorm(f, m){
  const t = nearestTarget(f, 12);
  const cx = t ? t.pos.x : f.pos.x + Math.sin(f.facing)*5, cz = t ? t.pos.z : f.pos.z + Math.cos(f.facing)*5;
  flash(new V(f.pos.x, 2.5, f.pos.z), 0xff7a2f, .4, 2, 14);
  for (let i = 0; i < 5; i++){
    const a = Math.random()*PI*2, r = i === 0 ? 0 : 1 + Math.random()*1.8;
    const b = makeBomb(G.nextId++, 'meteor');
    b.owner = f; b.meteor = m;
    b.pos.set(cx + Math.cos(a)*r - 2, 9 + i*2.2, cz + Math.sin(a)*r);
    b.vel.set(3, -3, 0);
    b.mesh.position.copy(b.pos); G.bombs.push(b);
  }
}
function grandCross(f, m){
  f.hp = Math.max(1, f.hp - 6);
  const fx = Math.sin(f.facing), fz = Math.cos(f.facing), c = f.pos.clone(), L = 3.6, W = .8;
  for (const [ax, az] of [[fx, fz], [-fx, -fz], [fz, -fx], [-fz, fx]])
    for (let st = .6; st <= L; st += .6) emit(new V(c.x + ax*st, .8, c.z + az*st), 2, 0xfff2a8, 1, 3, 22, 1.5, -2);
  flash(new V(c.x, 1, c.z), 0xfff2a8, .5, 2.2, 16);
  for (const o of G.fighters){
    if (o === f || !hittable(o) || Math.abs(o.pos.y - f.pos.y) > 2.5) continue;
    const dx = o.pos.x - c.x, dz = o.pos.z - c.z, u = dx*fx + dz*fz, v = -dx*fz + dz*fx;
    if ((Math.abs(u) < L && Math.abs(v) < W) || (Math.abs(v) < L && Math.abs(u) < W)){
      const d = Math.hypot(dx, dz) || 1;
      applyHit(null, o, m, new V(dx/d, 0, dz/d), f);
    }
  }
}
// Rogue: copies the class skill of an enemy it hits (the E dash or the 3rd combo hit). E then casts that skill exactly like
// its owner, until another one is copied or the rogue is knocked out. Transformations need the class's own body: not copied.
const NO_COPY = new Set(['none', 'rogue', 'werewolf', 'tamer', 'dragonblade']);
function rogueCopy(f, o){
  if (!f || f.cls !== 'rogue' || !o || o === f || !o.cls || NO_COPY.has(o.cls) || !MOVES['sk_' + o.cls] || f.stolen === o.cls) return;
  f.stolen = o.cls;
  const at = new V(f.pos.x, f.pos.y + 2.8, f.pos.z);
  popup(at, '📖 คัดลอก: ' + MOVES['sk_' + o.cls].name, 'combo th', 70);
  flash(new V(f.pos.x, f.pos.y + 1.2, f.pos.z), 0x8a5ad8, .45, 2.2, 14); emit(at, 16, 0xb48dff, 3, 3, 26, 1.3, 1);
  Sfx.play('skill', f.pos, .6);
}
const skillOf = f => f.cls === 'rogue' && f.stolen ? f.stolen : f.cls;
function steal(f, o){
  rogueCopy(f, o);
  const at = new V(o.pos.x, 2.4, o.pos.z);
  if (o.weapon){
    if (!f.weapon){ f.weapon = o.weapon; f.weaponUses = o.weaponUses; }
    else dropItem(o.weapon, o.pos);
    o.weapon = null; o.weaponUses = 0;
    popup(at, 'ฉกอาวุธ!', 'th');
  }
  if (alive(f)){ f.hp = Math.min(MAX_HP, f.hp + 6); popup(new V(f.pos.x, 2.4, f.pos.z), '+6', 'heal'); }
}
function makeTurret(id){
  const g = new THREE.Group();
  const base = part(new THREE.CylinderGeometry(.35, .45, .5, 10), toon(0x5a5f6b), 1.06); base.position.y = .25; g.add(base);
  const head = new THREE.Group(); head.position.y = .65;
  head.add(part(new THREE.BoxGeometry(.4, .3, .45), toon(0xffc23a), 1.06));
  const barrel = part(new THREE.CylinderGeometry(.06, .06, .5, 8), toon(0x2b2f3a)); barrel.rotation.x = PI/2; barrel.position.z = .35; head.add(barrel);
  g.add(head); g.userData.head = head; scene.add(g);
  return {id, mesh:g, pos:new V(), rot:0, t:0, life:480};
}
function placeTurret(f){
  for (const t of [...G.turrets]) if (t.owner === f) removeTurret(t, true);
  const t = makeTurret(G.nextId++); t.owner = f;
  t.pos.set(f.pos.x + Math.sin(f.facing)*1.2, 0, f.pos.z + Math.cos(f.facing)*1.2);
  if (blocked(t.pos.x, t.pos.z)) t.pos.set(f.pos.x, 0, f.pos.z);
  t.rot = f.facing; t.mesh.position.copy(t.pos); dust(t.pos, 10);
  G.turrets.push(t);
}
function removeTurret(t, fx){
  if (fx) emit(new V(t.pos.x, .6, t.pos.z), 12, 0xffc23a, 3, 3, 20, 1.2, 8);
  scene.remove(t.mesh); G.turrets.splice(G.turrets.indexOf(t), 1);
}
function stepTurrets(){
  for (const t of [...G.turrets]){
    t.t++;
    if (t.t > t.life || !t.owner || t.owner.stocks <= 0){ removeTurret(t, true); continue; }
    let best = null, bd = 11;
    for (const o of G.fighters){
      if (o === t.owner || ally(t.owner, o) || !hittable(o)) continue;
      const d = Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z);
      if (d < bd){ bd = d; best = o; }
    }
    if (best){
      let dd = Math.atan2(best.pos.x - t.pos.x, best.pos.z - t.pos.z) - t.rot; dd = Math.atan2(Math.sin(dd), Math.cos(dd));
      t.rot += dd*.2;
      if (t.t % 40 === 0 && Math.abs(dd) < .3){
        const b = makeBullet(G.nextId++);
        b.pos.set(t.pos.x + Math.sin(t.rot)*.6, .7, t.pos.z + Math.cos(t.rot)*.6);
        b.vel.set(Math.sin(t.rot), 0, Math.cos(t.rot)).multiplyScalar(24);
        b.life = 30; b.owner = t.owner; b.m = TURRET_SHOT; b.mesh.position.copy(b.pos); b.mesh.rotation.y = t.rot;
        G.bullets.push(b); flash(b.pos, 0xffd23a, .1, .5, 5);
      }
    }
    t.mesh.userData.head.rotation.y = t.rot;
  }
}
function fireGun(f, m){
  const fx = Math.sin(f.facing), fz = Math.cos(f.facing);
  const muzzle = new V(f.pos.x + fx*.9, f.pos.y + .95, f.pos.z + fz*.9);
  flash(muzzle, 0xffd23a, .15, .7, 6);
  Sfx.play(m.anim === 'blast' ? 'shotgun' : 'shot', muzzle);
  const spread = m.anim === 'blast' ? [-.2, 0, .2] : [0];
  for (const da of spread){
    const a = f.facing + da + (Math.random() - .5)*.04;
    const b = makeBullet(G.nextId++);
    b.pos.copy(muzzle); b.vel.set(Math.sin(a), 0, Math.cos(a)).multiplyScalar(m.anim === 'blast' ? 20 : 26);
    b.life = m.anim === 'blast' ? 22 : 40; b.owner = f; b.m = m;
    b.mesh.position.copy(b.pos); b.mesh.rotation.y = a;
    G.bullets.push(b);
  }
  if (f.isLocal) G.shake = Math.max(G.shake, m.shake);
}
function removeBullet(b, spark){
  if (spark) emit(b.pos, 5, 0xffe066, 3, 2, 12, .9, 6);
  scene.remove(b.mesh); G.bullets.splice(G.bullets.indexOf(b), 1);
  if (b.mesh.geometry !== BULLET_GEO){ b.mesh.geometry.dispose(); b.mesh.material.dispose(); }
}
function stepBullets(){
  for (const b of [...G.bullets]){
    if (b.home && hittable(b.home)){
      // Homing: turn the velocity a little toward the target each frame, keeping speed
      const sp = Math.hypot(b.vel.x, b.vel.z), tx = b.home.pos.x - b.pos.x, tz = b.home.pos.z - b.pos.z, td = Math.hypot(tx, tz) || 1;
      b.vel.x += (tx/td*sp - b.vel.x)*.12; b.vel.z += (tz/td*sp - b.vel.z)*.12;
      const k = sp/(Math.hypot(b.vel.x, b.vel.z) || 1); b.vel.x *= k; b.vel.z *= k;
      b.mesh.rotation.y = Math.atan2(b.vel.x, b.vel.z);
    }
    if (b.back && b.life === b.back){ b.returning = true; b.hitSet = null; }
    if (b.returning){
      // The thrown sword curves back to its owner and is caught
      const o = b.owner;
      if (!o || !alive(o)){ removeBullet(b, true); continue; }
      const sp = Math.hypot(b.vel.x, b.vel.z) || 20, tx = o.pos.x - b.pos.x, tz = o.pos.z - b.pos.z, td = Math.hypot(tx, tz) || 1;
      b.vel.x += (tx/td*sp - b.vel.x)*.25; b.vel.z += (tz/td*sp - b.vel.z)*.25;
      b.pos.y += (o.pos.y + .95 - b.pos.y)*.2;
      if (td < 1 || b.life < -60){ removeBullet(b, true); continue; }
    }
    if (b.grav) b.vel.y -= b.grav*DT;
    b.pos.addScaledVector(b.vel, DT); b.mesh.position.copy(b.pos); b.life--;
    if (b.grav && b.pos.y <= .25 && b.vel.y < 0){ b.pos.y = .2; b.mesh.position.copy(b.pos); burst(b); removeBullet(b, true); continue; }
    if (b.kind === 'saber') b.mesh.rotation.y += .55;
    if (trailColor(b.kind) && G.frame % 2 === 0) emit(b.pos, 1, trailColor(b.kind), .6, .5, 14, 1.4, 0);
    let hit = null;
    for (const f of G.fighters){
      if (f === b.owner || ally(b.owner, f) || !hittable(f) || (b.hitSet && b.hitSet.has(f))) continue;
      if (Math.hypot(f.pos.x - b.pos.x, f.pos.z - b.pos.z) < (b.rad || .6) && Math.abs(f.pos.y + .8 - b.pos.y) < 1){ hit = f; break; }
    }
    if (hit){
      if (burst(b)){}
      else {
        applyHit(null, hit, b.m, b.vel.clone().setY(0).normalize(), b.owner);
        if (b.m && b.m.copy) rogueCopy(b.owner, hit);
        if (b.kind === 'soul' && b.owner && alive(b.owner)){ b.owner.hp = Math.min(MAX_HP, b.owner.hp + b.m.dmg); popup(new V(b.owner.pos.x, 2.4, b.owner.pos.z), '+' + b.m.dmg, 'heal'); }
      }
      if (b.pierce){ (b.hitSet = b.hitSet || new Set()).add(hit); continue; }
      removeBullet(b, true); continue;
    }
    if (G.teamMode && b.owner){
      const st = G.stones.find(s => s.hp > 0 && s.side !== b.owner.side && Math.hypot(b.pos.x - s.pos.x, b.pos.z - s.pos.z) < 1 && b.pos.y < 3);
      if (st){ if (!burst(b)) damageStone(st, b.m.dmg, b.owner); removeBullet(b, true); continue; }
    }
    if (G.boss && b.owner !== G.boss && G.boss.hp > 0 && Math.hypot(b.pos.x - G.boss.pos.x, b.pos.z - G.boss.pos.z) < BOSS_R && b.pos.y < 7){
      if (!burst(b)) damageBoss(b.m.dmg, b.owner); removeBullet(b, true); continue;
    }
    if (blockAt(b.pos.x, b.pos.y, b.pos.z) && !b.returning){ burst(b); removeBullet(b, true); continue; }
    if (FUNNELS.some(fn => Math.hypot(b.pos.x - fn.x, b.pos.z - fn.z) < fn.r)) removeBullet(b, true);
    else if (b.life <= 0 && !b.returning){ burst(b); removeBullet(b, false); }
  }
}

// Sky Brawl · items.js — ไอเทมบนพื้น ระเบิด ปืน
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Items & bombs ---------- */
function makeItemMesh(type){
  const inner = type === 'hammer' ? buildHammer() : type === 'bomb' ? buildBomb() : type === 'heal' ? buildRice() : type === 'potion' ? buildPotion() : buildGun(type);
  if (type === 'gun' || type === 'shotgun'){ inner.rotation.z = PI/2; inner.position.set(-.3, .1, 0); }
  if (type === 'hammer'){ inner.rotation.z = .9; inner.position.set(-.35, .45, 0); }
  const g = new THREE.Group(); g.add(inner);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.45,.6,28), new THREE.MeshBasicMaterial({color:0xffc23a, transparent:true, opacity:.8, side:THREE.DoubleSide}));
  ring.rotation.x = -PI/2; g.userData.ring = ring; g.userData.inner = inner;
  scene.add(g, ring);
  return g;
}
const ITEM_TYPES = ['hammer', 'bomb', 'heal', 'gun', 'shotgun', 'potion'];
const WEAPONS = [null, 'hammer', 'gun', 'shotgun'];
const WEAPON_INFO = {hammer:{uses:7, name:'ค้อน', got:'ได้ค้อน!'}, gun:{uses:10, name:'ปืนพก', got:'ได้ปืนพก!'}, shotgun:{uses:5, name:'ลูกซอง', got:'ได้ลูกซอง!'}};
function addItem(type, pos, vy, id){
  const it = {id: id || G.nextId++, type, mesh:makeItemMesh(type), pos:new V(pos.x, pos.y, pos.z), vy, landed:false, t:0};
  G.items.push(it); return it;
}
function spawnItem(){
  const r = Math.random(), type = Math.random() < PU.potion ? 'potion' : r < .22 ? 'hammer' : r < .44 ? 'gun' : r < .58 ? 'shotgun' : r < .84 ? 'bomb' : 'heal';
  const p = randomDeckPoint(1.5); p.y = 7;
  addItem(type, p, 0);
}
const dropItem = (type, pos) => addItem(type, {x:pos.x, y:pos.y + 1.5, z:pos.z}, 4);
function removeItem(it){ scene.remove(it.mesh, it.mesh.userData.ring); G.items.splice(G.items.indexOf(it), 1); }
function doGrab(f, viaAtk){
  if (f.held === 'bomb'){ throwBomb(f); return true; }
  if (mechGrab(f, viaAtk)) return true;     // get in / out of a mech (powerups.js)
  if (powerOn(f)) return false;
  let best = null, bd = 1.5;
  for (const it of G.items){
    if (!it.landed || it.type === 'heal' || it.type === 'potion') continue;
    if (WEAPON_INFO[it.type] && f.weapon) continue;
    const d = Math.hypot(it.pos.x - f.pos.x, it.pos.z - f.pos.z);
    if (d < bd){ bd = d; best = it; }
  }
  if (!best) return false;
  const at = new V(f.pos.x, 2.4, f.pos.z);
  if (WEAPON_INFO[best.type]){ const w = WEAPON_INFO[best.type]; f.weapon = best.type; f.weaponUses = w.uses; if (f.isLocal) popup(at, w.got, 'th'); }
  else { f.held = 'bomb'; if (f.isLocal) popup(at, 'ได้ระเบิด!', 'th'); }
  emit(best.pos, 8, 0xffc23a, 3, 3, 18, 1.2, 4);
  Sfx.play('pickup', f.pos);
  removeItem(best);
  return true;
}
function makeBomb(id, kind = 'bomb'){ const mesh = kind === 'meteor' ? buildMeteor() : kind === 'grenade' ? buildGrenade() : buildBomb(); scene.add(mesh); return {id, kind, mesh, pos:new V(), vel:new V(), t:0}; }
function buildGrenade(){
  const g = new THREE.Group();
  const b = part(SPH(.17), toon(0x3f4d27), 1.1); b.scale.y = 1.15; g.add(b);
  const cap = part(new THREE.CylinderGeometry(.05, .06, .09, 8), toon(0x9aa3b5)); cap.position.y = .2; g.add(cap);
  const pin = new THREE.Mesh(new THREE.TorusGeometry(.05, .012, 4, 10), toon(0xc9d2de)); pin.position.set(.07, .22, 0); g.add(pin);
  return g;
}
function buildMeteor(){
  const g = new THREE.Group();
  g.add(part(SPH(.4), toon(0x6b2a1a), 1.06));
  const glow = new THREE.Mesh(SPH(.55), new THREE.MeshBasicMaterial({color:0xff7a2f, transparent:true, opacity:.55, depthWrite:false}));
  g.add(glow); g.userData.spark = glow;
  return g;
}
function throwBomb(f){
  f.held = null;
  Sfx.play('swing', f.pos);
  const aim = aimTarget(f, null);
  if (aim) f.facing = Math.atan2(aim.pos.x - f.pos.x, aim.pos.z - f.pos.z);
  const b = makeBomb(G.nextId++), fx = Math.sin(f.facing), fz = Math.cos(f.facing);
  b.owner = f;
  b.pos.set(f.pos.x + fx*.5, f.pos.y + 2.1, f.pos.z + fz*.5);
  b.vel.set(fx*11 + f.vel.x*.3, 7, fz*11 + f.vel.z*.3);
  G.bombs.push(b);
}
function explode(pos, owner, m){
  // m = a meteor's move: smaller blast that spares the caster
  const hit = m || BOMB_HIT, R = m ? 2.4 : 3;
  explodeFx(pos);
  hitStones(owner, pos, R + .6, hit.dmg);
  if (owner !== G.boss) hitBossArea(owner, pos, R, hit.dmg);
  G.shake = Math.max(G.shake, hit.shake*.6);
  for (const f of G.fighters){
    if (!hittable(f) || (m && f === owner) || ally(owner, f)) continue;
    let dx = f.pos.x - pos.x, dz = f.pos.z - pos.z;
    const d3 = Math.hypot(dx, f.pos.y + .8 - pos.y, dz);
    if (d3 > R) continue;
    let d = Math.hypot(dx, dz); if (d < .01){ dx = 1; dz = 0; d = 1; }
    const k = 1 - d3/R*.5;
    applyHit(null, f, {...hit, dmg:Math.round(hit.dmg*k)}, new V(dx/d, 0, dz/d), owner);
  }
}

function buildGun(type){
  const g = new THREE.Group();
  if (type === 'shotgun'){
    const barrel = part(new THREE.CylinderGeometry(.05, .05, .85, 8), toon(0x3a3f4b), 1.1); barrel.position.set(0, -.42, .02); g.add(barrel);
    const stock = part(new THREE.BoxGeometry(.12, .4, .16), toon(0x8a5a2b), 1.08); stock.position.set(0, .05, -.02); g.add(stock);
    const pump = part(new THREE.CylinderGeometry(.075, .075, .2, 8), toon(0x8a5a2b)); pump.position.set(0, -.5, .02); g.add(pump);
  } else {
    const body = part(new THREE.BoxGeometry(.12, .42, .14), toon(0x3a3f4b), 1.1); body.position.y = -.2; g.add(body);
    const grip = part(new THREE.BoxGeometry(.1, .1, .22), toon(0x2b1d16)); grip.position.set(0, -.02, -.1); g.add(grip);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(.13, .06, .15), toon(0xffc23a)); tip.position.y = -.42; g.add(tip);
  }
  return g;
}

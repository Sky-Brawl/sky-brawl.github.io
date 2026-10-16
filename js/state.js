// Sky Brawl · state.js — สถานะเกม (G), ทีม, จุดเกิด, สร้างนักสู้
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Game state ---------- */
const G = {mode:'menu', fighters:[], items:[], bombs:[], bullets:[], turrets:[], ghosts:[], zones:[], frame:0, itemTimer:300, slow:0, shake:0,
  countdown:0, cdShown:new Set(), paused:false, debug:false, endT:0, winner:null, stocks:2,
  cfg:{n:8, st:2, df:'normal', stage:'titanic', mode:'ffa'}, teamMode:false, stones:[], winTeam:null, raid:false, raidWin:null, boss:null, kind:'solo', net:null, me:0, spec:0, nextId:1, editSlot:0,
  auto:{p1:false, p2:false}};

class Fighter {
  constructor(idx, spec){
    this.idx = idx; this.side = G.raid ? 0 : G.teamMode ? (spec.side === 0 || spec.side === 1 ? spec.side : idx % 2) : -1;
    this.team = G.teamMode ? SIDES[this.side].col : TEAM[idx % TEAM.length];
    this.name = spec.name; this.ctrl = spec.ctrl; this.peer = spec.peer || '';
    this.isLocal = spec.ctrl === 'p1' || spec.ctrl === 'p2' || !!spec.me;
    this.pos = new V(); this.vel = new V(); this.netPos = new V(); this.netVel = new V();
    this.input = {x:0, z:0, atk:false, jump:false, guard:false, grab:false, skill:false, lock:false};
    this.prev = {atk:false, jump:false, grab:false, skill:false, lock:false};
    this.ai = {cd:0, guardT:0, retreat:0, wantCombo:false, tgt:null, tgtT:0};
    this.tag = null; this.vis = null;
    this.setLook(spec.look);
  }
  setLook(look){
    if (look && !CLASS_ON.has(look.outfit || 'none')) look = {...look, outfit:'none'};
    const old = this.vis;
    if (old){ scene.remove(old.root, old.hurt, old.hit); if (old.ice) scene.remove(old.ice); }
    this.look = look; this.vis = buildChibi(look, this.team);
    this.cls = OUTFITS[look.outfit] ? look.outfit : 'none';
    if (old) this.vis.root.rotation.y = old.root.rotation.y;
  }
  dispose(){
    scene.remove(this.vis.root, this.vis.hurt, this.vis.hit);
    if (this.vis.ice) scene.remove(this.vis.ice);
    if (this.tag) this.tag.el.remove();
  }
  reset(p, facing, stocks){
    this.pos.copy(p); this.vel.set(0,0,0); this.netPos.copy(p); this.netVel.set(0,0,0);
    this.facing = facing; this.vis.root.rotation.y = facing;
    Object.assign(this, {chill:0, shock:0, hp:MAX_HP, hpLag:MAX_HP, stocks, state:'idle', stateT:0, move:null, moveKey:'', hasHit:false,
      buffer:0, invuln:0, onGround:true, weapon:null, weaponUses:0, held:null, stun:16, squash:0, combo:0, freeze:0,
      hits:0, dmgDealt:0, kos:0, lastHitBy:-1, lastHitT:-9999, place:0, lr:0, waitT:0, lastMove:null,
      splashed:false, netInit:false, nc:null, skillCd:0, rage:0, lock:null, lockIdx:-1, formT:0, stam:100, exh:false, stamT:0, apeT:0, apeSk:0, apeIntro:0, mechSk:0, mech:null, poison:null, poisonVis:false});
  }
}
const setState = (f, s) => { f.state = s; f.stateT = 0; };
// Team mode: two sides, each with a stone at its base; teammates can't hurt each other
const SIDES = [{name:'แดง', col:0xff5d4a}, {name:'น้ำเงิน', col:0x2f8cff}];
const ally = (a, b) => !!a && !!b && a !== b && a.side >= 0 && a.side === b.side;
const alive = f => f.state !== 'out' && f.state !== 'wait';
const hittable = f => alive(f) && !['ko','down','respawn'].includes(f.state) && f.invuln <= 0;

function spawnPoint(i, n){
  const [x0, x1, z0, z1] = STAGE.spawn;
  // Big crowds get extra rows so nobody spawns stacked on a neighbour
  const rows = n <= 2 ? 1 : n <= 8 ? 2 : n <= 18 ? 3 : n <= 32 ? 4 : Math.min(8, Math.ceil(Math.sqrt(n/3))), cols = Math.ceil(n/rows);
  const r = i % rows, c = Math.floor(i/rows);
  let x = cols === 1 ? (x0 + x1)/2 : x0 + (x1 - x0)*c/(cols - 1);
  let z = rows === 1 ? 0 : z0 + (z1 - z0)*r/(rows - 1);
  if (n === 2){ x = (x0 + x1)/2; z = i ? z0*.6 : z1*.6; }
  for (const fn of FUNNELS){
    const dx = x - fn.x, dz = z - fn.z, d = Math.hypot(dx, dz), need = fn.r + .8;
    if (d < need){ if (d < .01) z += need; else { x = fn.x + dx/d*need; z = fn.z + dz/d*need; } }
  }
  for (let k = 0; k < 4; k++){
    const b = inBlock(x, z, .7); if (!b) break;
    if (b.hx - Math.abs(x - b.x) < b.hz - Math.abs(z - b.z)) x = b.x + Math.sign(x - b.x || 1)*(b.hx + .8); else z = b.z + Math.sign(z - b.z || 1)*(b.hz + .8);
  }
  if (G.raid && Math.hypot(x, z) < 6){ const d = Math.hypot(x, z) || 1; x = x/d*6; z = z/d*6; }
  return {p:new V(x, 0, z), facing:Math.atan2(-x, -z)};
}
// Team mode: each side lines up in its own half of the deck, in front of its stone
// side = 0 red / 1 blue, k = this fighter's place among its side, m = how many on that side
function teamSpawn(side, k, m){
  m = m || 1;
  const sp = spawnPoint(k, m), [x0, x1] = STAGE.spawn, w = (x1 - x0)*.42;
  const t = m === 1 ? .5 : (sp.p.x - x0)/(x1 - x0);
  let x = side ? x1 - t*w : x0 + t*w, z = sp.p.z;
  for (const fn of FUNNELS){
    const dx = x - fn.x, dz = z - fn.z, d = Math.hypot(dx, dz), need = fn.r + .8;
    if (d < need){ if (d < .01) z += need; else { x = fn.x + dx/d*need; z = fn.z + dz/d*need; } }
  }
  for (let k = 0; k < 4; k++){
    const b = inBlock(x, z, .7); if (!b) break;
    if (b.hx - Math.abs(x - b.x) < b.hz - Math.abs(z - b.z)) x = b.x + Math.sign(x - b.x || 1)*(b.hx + .8); else z = b.z + Math.sign(z - b.z || 1)*(b.hz + .8);
  }
  return {p:new V(x, 0, z), facing:side ? -PI/2 : PI/2};
}
function randomDeckPoint(margin){
  const bx = STAGE.box;
  for (let k = 0; k < 60; k++){
    const x = bx[0] + Math.random()*(bx[1] - bx[0]), z = bx[2] + Math.random()*(bx[3] - bx[2]);
    if (onDeck(x, z, margin) && FUNNELS.every(fn => Math.hypot(x - fn.x, z - fn.z) > fn.r + 1) && !inBlock(x, z, 1) && !(G.boss && Math.hypot(x - G.boss.pos.x, z - G.boss.pos.z) < 5)) return new V(x, 0, z);
  }
  return STAGE.preview.clone();
}
function createFighters(specs, stocks, tags){
  for (const f of G.fighters) f.dispose();
  G.fighters = specs.map((s, i) => new Fighter(i, s));
  // Big crowds: skip per-fighter shadow casting, it doubles the draw calls and phones can't keep up
  const crowd = specs.length > 40;
  const sideN = [0, 0], sideK = [0, 0];
  if (G.teamMode) for (const f of G.fighters) sideN[f.side]++;
  G.fighters.forEach((f, i) => {
    const sp = G.teamMode ? teamSpawn(f.side, sideK[f.side]++, sideN[f.side]) : spawnPoint(i, specs.length); f.reset(sp.p, sp.facing, stocks);
    if (crowd) f.vis.root.traverse(o => { o.castShadow = false; });
    if (tags) makeTag(f);
  });
}

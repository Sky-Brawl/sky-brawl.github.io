// Sky Brawl · combat.js — เริ่มท่า ตรวจการโดน
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Combat ---------- */
function attackKey(f){
  if (f.weapon === 'gun') return 'shoot';
  if (f.weapon === 'shotgun') return 'blast';
  if (f.formT > 0 && FORM_INFO[f.cls]) return FORM_INFO[f.cls].atk;
  if (!f.onGround) return 'air';
  return f.weapon === 'hammer' ? 'ham1' : (CLASS_COMBO[f.cls] || 'jab1');
}
const RAGE_MOVES = new WeakMap();
const rageMove = m => { let r = RAGE_MOVES.get(m); if (!r){ r = {...m, startup:Math.max(2, Math.round(m.startup*.7)), recovery:Math.max(3, Math.round(m.recovery*.6))}; RAGE_MOVES.set(m, r); } return r; };
function startMove(f, key){
  const m = f.rage > 0 && !MOVES[key].skill ? rageMove(MOVES[key]) : MOVES[key];
  if (m.weapon) f.weaponUses--;
  f.move = m; f.moveKey = key; f.lastMove = key; f.hasHit = false; f.hitSet = new Set(); f.buffer = 0;
  setState(f, 'attack');
  Sfx.move(f, m);
  const inp = f.input;
  if (Math.hypot(inp.x, inp.z) > .2) f.facing = Math.atan2(inp.x, inp.z);
  const aim = aimTarget(f, m);
  if (aim) f.facing = Math.atan2(aim.pos.x - f.pos.x, aim.pos.z - f.pos.z);
  if (m.lunge){ f.vel.x = Math.sin(f.facing)*m.lunge; f.vel.z = Math.cos(f.facing)*m.lunge; }
  if (m.air) f.vel.y = Math.max(f.vel.y, 2);
}
function hitCenter(f){
  const m = f.move;
  return new V(f.pos.x + Math.sin(f.facing)*m.reach, f.pos.y + .8 + (m.hy || 0), f.pos.z + Math.cos(f.facing)*m.reach);
}
function checkHits(f){
  if (f.hasHit) return;
  const hc = hitCenter(f), m = f.move, sweep = !!m.sweep;
  for (const o of G.fighters){
    if (o === f || ally(f, o) || !hittable(o) || (sweep && f.hitSet.has(o))) continue;
    if (hc.distanceTo(new V(o.pos.x, o.pos.y + .8, o.pos.z)) < m.rad + .55){
      let dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z, d = Math.hypot(dx, dz);
      if (d < .01){ dx = Math.sin(f.facing); dz = Math.cos(f.facing); d = 1; }
      applyHit(f, o, m, new V(dx/d, 0, dz/d), f);
      if (m.onHit) m.onHit(f, o);
      if (sweep) f.hitSet.add(o); else { f.hasHit = true; break; }
    }
  }
  if (G.teamMode && !f.hasHit){
    for (const st of G.stones){
      if (st.hp <= 0 || st.side === f.side || f.hitSet.has(st)) continue;
      if (Math.hypot(hc.x - st.pos.x, hc.z - st.pos.z) < m.rad + .95 && hc.y < 3.2){
        damageStone(st, m.dmg, f); f.hitSet.add(st); if (!sweep) f.hasHit = true;
        if (f.isLocal) G.shake = Math.max(G.shake, .1);
        break;
      }
    }
  }
  const B = G.boss;
  if (B && B.hp > 0 && !f.hasHit && !f.hitSet.has(B) && Math.hypot(hc.x - B.pos.x, hc.z - B.pos.z) < m.rad + BOSS_R && hc.y < 7.5){
    damageBoss(m.dmg*(f.rage > 0 ? 1.5 : 1), f); f.hitSet.add(B); if (!sweep) f.hasHit = true;
    if (f.isLocal) G.shake = Math.max(G.shake, .08);
  }
}
const aliveCount = () => G.fighters.filter(f => f.stocks > 0).length;

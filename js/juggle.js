// Sky Brawl · juggle.js — ลอยกลางอากาศ + คอมโบกลางอากาศ: ท่าปิดคอมโบเสยคู่แข่งลอยขึ้นแทนการซัดกระเด็น
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Air juggles ----------
   A combo finisher (a move with launch:true) now throws the target straight up instead of far away, if the
   attacker's class is a "launcher" (see LAUNCH_STYLE). A launched fighter floats (f.juggle frames, low gravity on the
   way down) and every hit while they float keeps them up a little (a pop) instead of knocking them away.
   How you follow up:
     · jump right after a launch = a chase jump, higher and towards the floating target (f.chase)
     · attack in the air = air1 → air2 → air3; air moves home in on a floating target, and landing an air hit makes the
       attacker hang in the air for a moment, so the whole chain connects
     · air3 (ทุบดิ่งพสุธา) is a spike: it ends the juggle and drives the target down and away — the ring-out tool
   Limits: hits after the 3rd do less damage, after JUG.maxHits the target falls normally, and the float time shrinks
   with every hit, so no juggle lasts forever. Class skills, picked-up weapons, power-ups and "push" classes still knock
   back the old way (that is how you throw people off the stage). Everything runs on the host / offline; guests only
   see the positions, so nothing is added to the network data. ---------- */
const JUG = (() => {
  const c = (window.SKY_CONFIG && window.SKY_CONFIG.juggle) || {}, n = (v, lo, hi, d) => typeof v === 'number' && v >= lo && v <= hi ? v : d;
  return {
    on:c.enabled !== false,
    up:n(c.launchPower, 6, 30, 15),      // upward speed of a launch (15 ≈ 2.8 squares high)
    light:11,                              // magic / ranged classes lift less
    pop:6,                                 // a hit while floating
    secs:Math.round(n(c.floatSeconds, .3, 5, 1.5)*60),
    maxHits:n(c.maxHits, 2, 30, 10) | 0,
    grav:n(c.floatGravity, .05, 1, .32),   // gravity while floating and falling
    hang:16,                               // frames the attacker hangs after landing an air hit
  };
})();
// How each class's combo finisher behaves: 'launch' = high launcher, 'light' = smaller lift, 'push' = knock back as before
const LAUNCH_STYLE = {
  none:'launch', knight:'launch', warrior:'launch', berserker:'launch', paladin:'launch', assassin:'launch', ninja:'launch',
  samurai:'launch', monk:'launch', taekwon:'launch', lancer:'launch', demon:'launch', dragonblade:'launch', crusader:'launch',
  rogue:'launch', blacksmith:'launch', spacecop:'launch', reaper:'launch', werewolf:'launch', shaman:'launch',
  mage:'light', priest:'light', necro:'light', druid:'light', wizard:'light', frost:'light', volt:'light', archer:'light',
  hunter:'light', alchemist:'light', tamer:'light', acolyte:'light', engineer:'light', soldier:'light', gunner:'light',
  merchant:'push', pony:'push', bard:'push', gundam:'push',
};
const launchStyle = cls => LAUNCH_STYLE[cls] || 'launch';
// Class skills that are about throwing people up rather than away
for (const k of ['sk_warrior', 'sk_taekwon', 'sk_crusader', 'sk_assassin']) if (MOVES[k]) MOVES[k].lift = true;
// The necromancer's combo ended on a plain soul shot; it now lifts a little like the other casters
if (MOVES.ne3){ MOVES.ne3.launch = true; MOVES.ne3.up = Math.max(MOVES.ne3.up || 0, 4); }
{
  const F = (window.SKY_CONFIG && window.SKY_CONFIG.fighter) || {}, nd = typeof F.normalDamage === 'number' && F.normalDamage >= 0 && F.normalDamage <= 10 ? F.normalDamage : 1;
  Object.assign(MOVES, {
    air1:{name:'เตะลอยฟ้า', anim:'airkick', startup:3, active:5, recovery:8, dmg:5*nd, kb:1.5, up:0, stun:18, reach:.75, rad:.85, air:true, next:'air2', hitstop:5, hy:-.1},
    air2:{name:'ฟาดกลางอากาศ', anim:'punchR', startup:3, active:5, recovery:9, dmg:5*nd, kb:1.5, up:0, stun:18, reach:.8, rad:.85, air:true, next:'air3', hitstop:5},
    air3:{name:'ทุบดิ่งพสุธา', anim:'swing', startup:7, active:5, recovery:14, dmg:9*nd, kb:11, up:0, spike:true, launch:true, reach:.85, rad:1, air:true, hitstop:10, shake:.35, hy:-.3},
  });
  MOVE_KEYS.push('air1', 'air2', 'air3');
}
const juggled = f => !!f && f.juggle > 0 && !f.onGround;
function juggleStyle(m, credit){
  if (m.push || m.weapon || !credit || powerOn(credit)) return 'push';
  if (m.skill && !m.lift) return 'push';
  return launchStyle(credit.cls);
}
// Called from applyHit after damage. Returns true when the hit was handled as a launch, a pop or a spike.
function juggleHit(att, tgt, m, dir, credit, sc){
  if (!JUG.on || powerOn(tgt)) return false;
  if (m.spike){
    tgt.juggle = 0; setState(tgt, 'tumble'); tgt.onGround = false;
    tgt.vel.set(dir.x*m.kb*sc, tgt.pos.y > 1.2 ? -9 : 4, dir.z*m.kb*sc);
    popup(new V(tgt.pos.x, tgt.pos.y + 2.2, tgt.pos.z), 'SPIKE!', 'combo', 40);
    return true;
  }
  if (juggled(tgt)){
    tgt.jHits = (tgt.jHits || 0) + 1;
    if (tgt.jHits > JUG.maxHits){ tgt.juggle = 0; return false; }   // juggled too long: this hit knocks them out of it
    setState(tgt, 'tumble');
    tgt.vel.set(dir.x*1.2, Math.max(tgt.vel.y*.4, m.launch ? JUG.pop + 3 : JUG.pop), dir.z*1.2);
    tgt.juggle = Math.max(tgt.juggle, Math.round(JUG.secs*.6) - tgt.jHits*4);
    if (att && !att.onGround && att.state === 'attack'){ att.vel.y = Math.max(att.vel.y, 3.5); att.hang = JUG.hang; }
    return true;
  }
  if (!m.launch || !tgt.onGround) return false;
  const style = juggleStyle(m, credit);
  if (style === 'push') return false;
  setState(tgt, 'tumble'); tgt.onGround = false;
  tgt.vel.set(dir.x*1.6, style === 'light' ? JUG.light : JUG.up, dir.z*1.6);
  tgt.juggle = JUG.secs; tgt.jHits = 0;
  if (credit && credit !== tgt) credit.chase = {o:tgt, t:G.frame};
  const at = new V(tgt.pos.x, tgt.pos.y + 1, tgt.pos.z);
  emit(at, 14, 0xbfe6ff, 5, 7, 22, 1.3, -2);
  if (style === 'launch') popup(new V(at.x, at.y + 1.4, at.z), 'LAUNCH!', 'combo', 40);
  return true;
}
// Later hits in one juggle do less, so a long air combo is flashy but not an instant KO
function juggleDamage(tgt, m){
  if (!juggled(tgt) || (tgt.jHits || 0) < 3) return m;
  return {...m, dmg:Math.max(1, Math.round(m.dmg*Math.max(.55, 1 - (tgt.jHits - 2)*.08)))};
}
// Gravity multiplier for physics(): floating fighters fall slowly, an attacker who just hit in the air hangs
const juggleGrav = f => f.juggle > 0 ? (f.vel.y < 0 ? JUG.grav : .7) : f.hang > 0 ? .35 : 1;
function juggleTick(f){
  if (f.hang > 0) f.hang--;
  if (f.juggle > 0){ f.juggle--; if (f.onGround && f.stateT > 4) f.juggle = 0; }
  if (f.juggle <= 0) f.jHits = 0;
}
// Right after your launcher connected (its hit frames are over): jump cancels the rest of the move
function canChase(f){
  const c = f.chase, m = f.move;
  return JUG.on && !!c && !!m && G.frame - c.t <= 50 && juggled(c.o) && f.stateT >= m.startup + m.active;
}
// Jumping just after your launch: a higher jump that carries you to the floating target
function chaseJump(f){
  const c = f.chase;
  if (!JUG.on || !c || G.frame - c.t > 50 || !juggled(c.o) || !alive(c.o)) return;
  const dx = c.o.pos.x - f.pos.x, dz = c.o.pos.z - f.pos.z, d = Math.hypot(dx, dz);
  if (d > 6) return;
  f.vel.y = JUMP*1.12;
  if (d > .3){ const s = Math.min(d*2.4, 9)/d; f.vel.x = dx*s; f.vel.z = dz*s; f.facing = Math.atan2(dx, dz); }
  f.chase = null;
  emit(new V(f.pos.x, f.pos.y + .3, f.pos.z), 10, 0xbfe6ff, 4, 4, 16, 1.2, 0);
}
// An air attack steers towards the nearest floating enemy in reach
function airAssist(f){
  let best = null, bd = 3.4;
  for (const o of G.fighters){
    if (o === f || ally(f, o) || !juggled(o) || !hittable(o) || Math.abs(o.pos.y - f.pos.y) > 3) continue;
    const d = Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z); if (d < bd){ bd = d; best = o; }
  }
  if (!best) return;
  const dx = best.pos.x - f.pos.x, dz = best.pos.z - f.pos.z;
  f.facing = Math.atan2(dx, dz);
  const s = bd > .2 ? Math.min(bd*3, 6)/bd : 0; f.vel.x = dx*s; f.vel.z = dz*s;
  f.vel.y = Math.max(-2, Math.min(7, (best.pos.y - f.pos.y)*4 + 2));
}

// Sky Brawl · zombie.js — โหมดซอมบี้: โดน KO แล้วกลายเป็นซอมบี้มาไล่คนที่เหลือ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Zombie mode (G.cfg.mode 'zombie') ----------
   Everyone starts human (side 0). At "FIGHT!" one fighter per ~6 (at least one) turns into a zombie (side 1).
   A human who is knocked out comes back as a zombie instead of losing a life; zombies come back after a short wait
   forever. Humans can't hurt humans, zombies can't hurt zombies (ally() uses side). Zombies are a bit faster and hit
   harder. Humans win if anyone is still human when the timer runs out, zombies win when nobody is.
   Host / offline run the rules; guests get f[11] bit 512 (zombie) and sn.zb = [frames left]. ---------- */
const ZB = (() => {
  const c = (window.SKY_CONFIG || {}).zombie || {}, num = (v, d, lo, hi) => { v = Number(v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  return {secs:num(c.seconds, 120, 30, 600), speed:num(c.speed, 1.06, .5, 2), dmg:num(c.damage, 1.1, .5, 3), respawn:num(c.respawnSeconds, 3, .5, 10), per:num(c.onePer, 6, 2, 20)};
})();
const ZOMBIE_SKIN = 0x8fcf7a, ZOMBIE_COL = 0x5fd35f;
const humansLeft = () => G.fighters.filter(f => !f.zombie && f.stocks > 0);

// A fighter turns: green skin, arms out, name tag marked, on their own side
function infect(f, by, first){
  if (f.zombie) return;
  f.zombie = true; f.side = 1; f.infectedAt = G.frame; f.stocks = Math.max(1, G.stocks);
  f.apeT = 0; if (f.mech) leaveMech(f);
  zombieLook(f);
  const at = new V(f.pos.x, f.pos.y + 2.4, f.pos.z);
  emit(at, 24, ZOMBIE_COL, 5, 4, 30, 1.8, 2); flash(at, ZOMBIE_COL, .5, 2.6, 14);
  popup(at, first ? 'ซอมบี้ตัวแรก!' : 'กลายเป็นซอมบี้!', 'combo th', 60);
  feed(first ? `🧟 ${f.name} คือซอมบี้ตัวแรก! หนีเร็ว!` : by && by !== f ? `🧟 ${by.name} กัด ${f.name} กลายเป็นซอมบี้` : `🧟 ${f.name} กลายเป็นซอมบี้`);
  if (f.isLocal) banner('คุณกลายเป็นซอมบี้!', 'red');
  Sfx.play('howl', f.pos, .6);
}
function zombieLook(f){
  const keepRot = f.vis.root.rotation.y;
  f.setLook({...f.look, skin:ZOMBIE_SKIN, eyes:'angry', hat:'none', title:'none'});
  f.vis.root.rotation.y = keepRot;
  if (G.fighters.length > 40) f.vis.root.traverse(o => { o.castShadow = false; });
  if (f.tag){ f.tag.name.textContent = (f.isLocal ? '▼ ' : '') + '🧟 ' + f.name; f.tag.name.style.color = hex(ZOMBIE_COL); }
}
// Host / offline: called from tick
function zombieTick(){
  if (!G.zombie || G.mode !== 'play' || G.endT) return;
  if (G.countdown > 30) return;
  if (!G.zbStarted){
    G.zbStarted = true; G.zbT = Math.round(ZB.secs*60);
    const pool = [...G.fighters], n = Math.max(1, Math.min(G.fighters.length - 1, Math.round(G.fighters.length/ZB.per)));
    for (let i = 0; i < n && pool.length; i++) infect(pool.splice(Math.random()*pool.length | 0, 1)[0], null, true);
    banner('🧟 ซอมบี้มาแล้ว!', 'red');
  }
  // the last human standing gets the berserker rage until the end
  const hs = humansLeft();
  if (hs.length === 1 && G.fighters.length >= 3){ const h = hs[0]; if (!h.lastHero){ h.lastHero = true; feed(`🦸 ${h.name} คือมนุษย์คนสุดท้าย! พลังฮีโร่ตื่น`); popup(new V(h.pos.x, h.pos.y + 2.6, h.pos.z), 'ฮีโร่คนสุดท้าย!', 'combo th', 70); if (h.isLocal) banner('ฮีโร่คนสุดท้าย!'); } h.rage = Math.max(h.rage, 30); }
  if (--G.zbT <= 0) zombieEnd(0);
}
// Replaces loseStock in zombie mode
function zombieLose(f, why){
  f.lr = why === 'ring' ? 1 : 2;
  const killer = f.lastHitBy >= 0 && G.frame - f.lastHitT < 420 ? G.fighters[f.lastHitBy] : null;
  if (killer && killer !== f) killer.kos++;
  announceLoss(f, why, killer);
  botEmotes(f, killer); botChatKO(f, killer);
  f.weapon = null; f.held = null; f.combo = 0; f.lastHitBy = -1; f.chill = 0; f.shock = 0; f.formT = 0; f.poison = null;
  const wasHuman = !f.zombie;
  if (wasHuman && G.zbStarted) infect(f, killer);
  f.state = 'wait'; f.waitT = f.zombie ? Math.round(ZB.respawn*60) : 70;
  if (wasHuman && G.zbStarted && !humansLeft().length) zombieEnd(1);
}
// win 0 = the humans held out, 1 = everyone is a zombie
function zombieEnd(win){
  if (G.endT || G.zbWin != null) return;
  G.zbWin = win; G.winner = null; G.endT = 200;
  if (win === 0){
    let p = 2;
    for (const f of G.fighters) if (!f.zombie) f.place = 1;
    G.fighters.filter(f => f.zombie).sort((a, b) => (b.infectedAt || 0) - (a.infectedAt || 0)).forEach(f => { f.place = p++; });
  } else {
    G.fighters.slice().sort((a, b) => b.kos - a.kos || (a.infectedAt || 0) - (b.infectedAt || 0)).forEach((f, i) => { f.place = i + 1; });
  }
  banner(win === 0 ? 'มนุษย์รอด!' : 'ซอมบี้ครองโลก!', win === 0 ? '' : 'red');
}
// HUD: humans, zombies and the time left (every screen)
function zombieHud(){
  const bar = $('zbBar'); if (!bar) return;
  const on = G.zombie && G.mode === 'play';
  bar.hidden = !on; if (!on || G.frame % 10) return;
  const h = G.fighters.filter(f => !f.zombie).length, z = G.fighters.length - h, s = Math.max(0, Math.ceil((G.zbT || 0)/60));
  const t = G.zbStarted || G.zbT ? Math.floor(s/60) + ':' + String(s % 60).padStart(2, '0') : '-';
  const txt = '🧑 มนุษย์ ' + h + ' · 🧟 ซอมบี้ ' + z + ' · ⏱ ' + t;
  if (bar.textContent !== txt) bar.textContent = txt;
  bar.classList.toggle('low', s <= 15 && s > 0);
}
// Arms out and a slow head roll while walking or standing
function poseZombie(f, v, T, s){
  if (s !== 'idle' && s !== 'run') return;
  v.armL.rotation.set(-1.45, 0, .12); v.armR.rotation.set(-1.45, 0, -.12);
  v.head.rotation.z = Math.sin(T*.05 + f.idx)*.18; v.tilt.rotation.x += .1;
}
// Guests: the snapshot says who is a zombie
function zombieFromSnap(f, on){
  if (!on || f.zombie) return;
  f.zombie = true; f.side = 1; zombieLook(f);
  const at = new V(f.pos.x, f.pos.y + 2.4, f.pos.z);
  emit(at, 24, ZOMBIE_COL, 5, 4, 30, 1.8, 2); flash(at, ZOMBIE_COL, .5, 2.6, 14);
  popup(at, 'กลายเป็นซอมบี้!', 'combo th', 60);
  if (f.isLocal) banner('คุณกลายเป็นซอมบี้!', 'red');
}

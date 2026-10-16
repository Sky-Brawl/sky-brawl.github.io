// Sky Brawl · sim.js — ฟิสิกส์และการเดินเกมทีละเฟรม (tick)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Simulation ---------- */
function stepFighter(f){
  const inp = f.input, prev = f.prev;
  const atkP = inp.atk && !prev.atk, jumpP = inp.jump && !prev.jump, grabP = inp.grab && !prev.grab, skillP = inp.skill && !prev.skill;
  prev.atk = inp.atk; prev.jump = inp.jump; prev.grab = inp.grab; prev.skill = inp.skill;
  const lockP = inp.lock && !prev.lock; prev.lock = inp.lock;
  if (f.lock && !lockable(f, f.lock, 26)) f.lock = null;
  if (f.state === 'out' || f.state === 'win') return;
  if (lockP){ cycleLock(f); f.lockManual = G.frame; f.autoPicked = false; }
  if ((f.ctrl === 'p1' || f.ctrl === 'p2') ? G.autoLock && !isAuto(f) : f.ctrl === 'net' && f.netAuto) autoLockStep(f);
  if (f.state === 'wait'){ if (--f.waitT <= 0) respawn(f); return; }
  if (atkP) f.buffer = 8;
  if (f.freeze > 0){ f.freeze--; return; }
  if (f.chill > 0){
    // Frozen solid: no input at all until the ice melts or someone breaks it
    if (f.state === 'ko' || f.state === 'respawn' || !alive(f)) f.chill = 0;
    else {
      f.chill--; f.stateT++; f.stun = f.stateT + f.chill + 1;
      if (f.skillCd > 0) f.skillCd--;
      if (f.invuln > 0) f.invuln--;
      f.vel.x = f.vel.z = 0;
      if (f.chill === 0){ thaw(f); setState(f, f.onGround ? 'idle' : 'air'); }
      return;
    }
  }
  if (f.shock > 0){
    f.shock--;
    // Numb: every so often the body locks up for a moment
    if (f.shock % 50 === 25 && (f.state === 'idle' || f.state === 'run') && G.countdown <= 30){
      setState(f, 'hitstun'); f.stun = 14; f.vel.x *= .2; f.vel.z *= .2;
      emit(new V(f.pos.x, f.pos.y + 1, f.pos.z), 8, 0xfff27a, 4, 2, 12, 1.2, 0);
    }
  }
  if (f.skillCd > 0) f.skillCd--;
  // Stamina refills after a short pause in sprinting (a little slower while attacking or guarding)
  if (f.stamT > 0) f.stamT--; else if (f.stam < 100){ f.stam = Math.min(100, f.stam + (f.state === 'idle' ? .55 : f.state === 'run' ? .33 : .2)); if (f.exh && f.stam >= 25) f.exh = false; }
  if (f.formT > 0){ f.formT--; if (f.formT === 0) endForm(f); }
  powerTick(f);
  if (f.rage > 0){ f.rage--; if (G.frame % 6 === 0) emit(new V(f.pos.x, f.pos.y + .9, f.pos.z), 1, 0xff4a3a, 1.5, 2, 18, 1.2, -1); }
  if (!atkP && f.buffer > 0) f.buffer--;
  f.stateT++;
  if (f.invuln > 0) f.invuln--;
  if (f.squash > 0) f.squash--;
  const mag = Math.hypot(inp.x, inp.z), fric = k => { const kk = STAGE.slip && f.onGround ? 1 - (1 - k)*.45 : k; f.vel.x *= kk; f.vel.z *= kk; };
  switch (f.state){
    case 'idle': case 'run': case 'air': {
      if (G.countdown > 30){ fric(.8); break; }
      // Sprint: needs a direction, solid ground and some stamina; once it runs dry you must recover a quarter before the next sprint
      const sprint = !!inp.sprint && mag > .2 && f.onGround && !f.exh && f.stam > 0 && !(f.shock > 0);
      if (sprint){ f.stam -= 100/(SPRINT_SECS*60); f.stamT = 40; if (f.stam <= 0){ f.stam = 0; f.exh = true; } }
      const sp = WALK*(sprint ? SPRINT : 1)*(f.onGround && !f.weapon ? 1 : .875)*(f.rage > 0 ? 1.4 : 1)*(f.shock > 0 ? .55 : 1)*(f.formT > 0 ? FORM_INFO[f.cls].speed : 1)*powerSpeed(f)*(f.zombie ? ZB.speed : 1), k = f.onGround ? (STAGE.slip ? .09 : .35) : .12;
      f.vel.x += (inp.x*sp - f.vel.x)*k; f.vel.z += (inp.z*sp - f.vel.z)*k;
      if (mag > .2) f.facing = Math.atan2(inp.x, inp.z);
      f.state = f.onGround ? (mag > .2 ? 'run' : 'idle') : 'air';
      if (jumpP && f.onGround && !(f.shock > 0)){ f.vel.y = JUMP; f.onGround = false; f.state = 'air'; dust(f.pos); Sfx.play('jump', f.pos); }
      else if (skillP && G.countdown <= 30 && powerOn(f)) powerSkill(f);
      else if (skillP && f.skillCd <= 0 && G.countdown <= 30) useSkill(f);
      else if (grabP) doGrab(f);
      else if (f.buffer > 0){
        if (f.held === 'bomb'){ throwBomb(f); f.buffer = 0; }
        // Standing next to an item: the attack button picks it up (the grab button still works too)
        else if (doGrab(f, true)) f.buffer = 0;
        else startMove(f, attackKey(f));
      }
      else if (inp.guard && f.onGround) setState(f, 'guard');
      break;
    }
    case 'guard':
      fric(.6);
      if (mag > .2) f.facing = Math.atan2(inp.x, inp.z);
      if (!inp.guard) setState(f, 'idle');
      break;
    case 'guardstun':
      fric(.85);
      if (f.stateT >= f.stun) setState(f, inp.guard ? 'guard' : 'idle');
      break;
    case 'attack': {
      const m = f.move, t = f.stateT;
      const inActive = t >= m.startup && t < m.startup + m.active;
      if (m.glide && inActive){
        f.vel.x = Math.sin(f.facing)*m.lunge; f.vel.z = Math.cos(f.facing)*m.lunge;
        if (m.trail && G.frame % 2 === 0) emit(new V(f.pos.x, .8, f.pos.z), 2, RAINBOW[(G.frame >> 1) % 5], .5, .5, 30, 1.6, 0);
      }
      else if (f.onGround) fric(.82);
      if (m.fire && t === m.startup) m.fire(f, m);
      if (m.breath && inActive) breathTick(f, m, t - m.startup);
      if (m.lance && inActive) lanceTick(f, m, t - m.startup);
      if (m.grenade && inActive && (t - m.startup) % m.grenade === 0) throwGrenade(f, m, .5);
      if (m.rapid && inActive && (t - m.startup) % m.rapid === 0) fireProj(f, 'bullet', f.facing + (Math.random() - .5)*.08, 26, 36, RAPID_SHOT);
      if (m.multi && inActive && (t - m.startup) % m.multi === 0){ f.hasHit = false; f.hitSet.clear(); }
      if (m.gun){ if (t === m.startup) fireGun(f, m); }
      else if (!m.noHit && inActive) checkHits(f);
      if (m.anim === 'slam' && t === m.startup){ const hc = hitCenter(f); hc.y = .05; dust(hc, 14); if (f.isLocal) G.shake = Math.max(G.shake, .25); }
      if (m.next && f.buffer > 0 && t >= m.startup + m.active){ startMove(f, f.weapon || !m.weapon ? m.next : 'jab1'); break; }
      if (m.air && f.onGround && t > 2){ setState(f, 'idle'); break; }
      if (t >= m.startup + m.active + m.recovery) setState(f, f.onGround ? 'idle' : 'air');
      break;
    }
    case 'hitstun':
      if (f.onGround) fric(.85);
      if (f.stateT >= f.stun) setState(f, f.onGround ? 'idle' : 'air');
      break;
    case 'tumble':
      if (f.onGround && f.stateT > 4){ setState(f, 'down'); dust(f.pos, 10); Sfx.play('land', f.pos); }
      break;
    case 'down':
      fric(.8);
      if (f.stateT >= 40){ setState(f, 'getup'); f.invuln = Math.max(f.invuln, 45); }
      break;
    case 'getup':
      fric(.8);
      if (f.stateT >= 16) setState(f, 'idle');
      break;
    case 'ko':
      if (f.onGround) fric(.85);
      if (f.stateT >= 120 || (f.onGround && f.stateT > 60)) loseStock(f, 'ko');
      break;
    case 'respawn':
      if (f.onGround){ setState(f, 'idle'); dust(f.pos, 10); }
      break;
  }
  if (f.weapon && f.weaponUses <= 0 && f.state !== 'attack'){
    const brokeMsg = f.weapon === 'hammer' ? 'ค้อนพัง!' : 'กระสุนหมด!';
    f.weapon = null; emit(new V(f.pos.x, 1, f.pos.z), 12, 0xffc23a, 4, 4, 24, 1.4, 10);
    if (f.isLocal) popup(new V(f.pos.x, 2.4, f.pos.z), brokeMsg, 'th');
  }
}
function physics(f){
  if (!alive(f) || f.freeze > 0) return;
  const px = f.pos.x, pz = f.pos.z, py = f.pos.y;
  f.vel.y = Math.max(-30, f.vel.y - GRAV*DT);
  f.pos.addScaledVector(f.vel, DT);
  if (RAILED.has(f.state) && f.pos.y > -.5 && !onDeck(f.pos.x, f.pos.z, .45)){
    if (onDeck(px, f.pos.z, .45)) f.pos.x = px;
    else if (onDeck(f.pos.x, pz, .45)) f.pos.z = pz;
    else { f.pos.x = px; f.pos.z = pz; }
  }
  if (STAGE.walls){
    const [wx, wz] = STAGE.walls;
    if (Math.abs(f.pos.x) > wx){ f.pos.x = Math.sign(f.pos.x)*wx; f.vel.x *= -.3; }
    if (Math.abs(f.pos.z) > wz){ f.pos.z = Math.sign(f.pos.z)*wz; f.vel.z *= -.3; }
  }
  if (f.pos.y < 6) for (const fn of FUNNELS){
    let dx = f.pos.x - fn.x, dz = f.pos.z - fn.z, d = Math.hypot(dx, dz);
    const r = fn.r + .4;
    if (d < r){
      if (d < .001){ dx = 1; dz = 0; d = 1; }
      f.pos.x = fn.x + dx/d*r; f.pos.z = fn.z + dz/d*r;
      if (f.state === 'tumble' || f.state === 'ko'){ f.vel.x *= -.3; f.vel.z *= -.3; }
    }
  }
  f.onGround = false;
  for (const b of BLOCKS){
    const ax = Math.abs(f.pos.x - b.x), az = Math.abs(f.pos.z - b.z);
    if (ax >= b.hx + .4 || az >= b.hz + .4) continue;
    // Landing on top
    if (f.vel.y <= 0 && py >= b.h - .02 && f.pos.y <= b.h && ax < b.hx + .15 && az < b.hz + .15){ f.pos.y = b.h; f.vel.y = 0; f.onGround = true; continue; }
    if (f.pos.y >= b.h - .05) continue;
    // Side hit: push out the short way
    const ox = b.hx + .4 - ax, oz = b.hz + .4 - az;
    if (ox < oz){ f.pos.x = b.x + Math.sign(f.pos.x - b.x || 1)*(b.hx + .4); if (f.state === 'tumble' || f.state === 'ko') f.vel.x *= -.3; }
    else { f.pos.z = b.z + Math.sign(f.pos.z - b.z || 1)*(b.hz + .4); if (f.state === 'tumble' || f.state === 'ko') f.vel.z *= -.3; }
  }
  if (!f.onGround && onDeck(f.pos.x, f.pos.z) && f.pos.y <= 0 && f.pos.y > -.9 && f.vel.y <= 0){ f.pos.y = 0; f.vel.y = 0; f.onGround = true; }
  else if (f.pos.y < -.05 && f.pos.y > STAGE.wallBottom && onDeck(f.pos.x, f.pos.z, -.35)){
    const p = STAGE.pushOut(f.pos.x, f.pos.z); f.pos.x = p.x; f.pos.z = p.z;
  }
  if (!f.splashed && f.pos.y < SEA_Y){ f.splashed = true; splash(f.pos); }
  if (f.pos.y < SEA_Y - 5) loseStock(f, 'ring');
}
function loseStock(f, why){
  if (G.zombie && G.mode === 'play') return zombieLose(f, why);
  f.lr = why === 'ring' ? 1 : 2;
  const killer = f.lastHitBy >= 0 && G.frame - f.lastHitT < 420 ? G.fighters[f.lastHitBy] : null;
  if (G.mode === 'play'){
    f.stocks--;
    if (killer && killer !== f) killer.kos++;
    announceLoss(f, why, killer);
    botEmotes(f, killer); botChatKO(f, killer);
  }
  f.weapon = null; f.held = null; f.combo = 0; f.lastHitBy = -1; f.chill = 0; f.shock = 0; f.formT = 0; f.poison = null; f.stolen = null;
  if (f.stocks <= 0){ f.state = 'out'; f.place = aliveCount() + 1; checkEnd(); }
  else { f.state = 'wait'; f.waitT = 70; }
}
function announceLoss(f, why, killer){
  const what = why === 'ring' ? STAGE.fallText : 'ถูก KO';
  feed(killer && killer !== f ? `${killer.name} ส่ง ${f.name} ${what}` : `${f.name} ${what}`);
  if (f.stocks <= 0) feed(`${f.name} ตกรอบ`);
  if (f.isLocal || G.fighters.length <= 2) banner(why === 'ring' ? (STAGE.water ? 'SPLASH!' : 'RING OUT!') : 'K.O.', 'red');
  else if (killer && killer.isLocal) banner('K.O.!');
  Replay.onKO(f, killer, why);
}
function respawn(f){
  let p = randomDeckPoint(1.5);
  if (G.teamMode) for (let k = 0; k < 20 && (p.x < 0) !== (f.side === 0); k++) p = randomDeckPoint(1.5);
  f.pos.copy(p); f.pos.y = 10; f.vel.set(0,0,0);
  f.hp = MAX_HP; f.invuln = 150; f.onGround = false; f.splashed = false; f.chill = 0; f.shock = 0; setState(f, 'respawn');
}
function checkEnd(){
  if (G.raid){ if (!G.fighters.some(f => f.stocks > 0)) endRaid(false); return; }
  if (G.teamMode){
    const sides = new Set(G.fighters.filter(f => f.stocks > 0).map(f => f.side));
    if (sides.size <= 1) endTeamMatch(sides.size ? [...sides][0] : null);
    return;
  }
  const left = G.fighters.filter(f => f.stocks > 0);
  if (left.length <= 1 && !G.endT){
    G.winner = left[0] || null; if (G.winner) G.winner.place = 1;
    G.endT = 180;
  }
}
const CD_MARKS = [[209, '3'], [149, '2'], [89, '1'], [30, 'FIGHT!']];
function cdBanner(cd){
  for (const [th, txt] of CD_MARKS) if (cd <= th && cd > th - 40 && !G.cdShown.has(th)){ G.cdShown.add(th); banner(txt); }
}
function fxTick(){
  stepPool(SPARKS); stepPool(SMOKE);
  for (const f of flashes) if (f.m.visible){
    f.t++; const k = f.t/f.max; f.m.scale.setScalar(L(f.s0, f.s1, 1 - (1 - k)*(1 - k))); f.m.material.opacity = (1 - k)*.85;
    if (f.t >= f.max) f.m.visible = false;
  }
  for (let i = pops.length - 1; i >= 0; i--){ const p = pops[i]; p.life--; p.p.y += .02; if (p.life <= 0){ p.el.remove(); pops.splice(i, 1); } }
  if (STAGE.fx) STAGE.fx(G.frame);
}
function tick(){
  G.frame++;
  fxTick();
  if (G.stones.length){ stepStones(); if (G.frame % 6 === 0) syncStoneHud(); }
  if (G.boss){ stepBoss(); if (G.frame % 6 === 0) syncBossHud(); }
  if (G.zombie) zombieTick();
  if (G.mode === 'custom'){ for (const f of G.fighters) if (f.squash > 0) f.squash--; return; }
  if (G.mode !== 'play') chatTick();
  if (G.net === 'guest' && G.mode === 'play'){ guestTick(); return; }
  if (G.slow > 0) G.slow--;
  if (G.countdown > 0){ G.countdown--; cdBanner(G.countdown); }
  if (G.net === 'host') Net.readInputs();
  if (G.endT > 0) stepVictory(); else botEmoteTick();
  chatTick();
  for (const f of G.fighters){
    if (G.endT > 0){ const i = f.input; i.x = i.z = 0; i.atk = i.jump = i.grab = i.guard = i.skill = i.lock = i.sprint = false; continue; }
    if (f.ctrl === 'bot' || isAuto(f)) think(f);
    else if (f.ctrl === 'net') Net.applyInput(f);
    else readHuman(f);
  }
  for (const f of G.fighters){ stepFighter(f); physics(f); if (G.teamMode) pushFromStones(f); if (G.boss) pushFromBoss(f); }
  if (G.tut) tutTick();
  if (STAGE.pads) healPads();
  const fs = G.fighters;
  for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++){
    const a = fs[i], b = fs[j];
    if (!alive(a) || !alive(b) || Math.abs(a.pos.y - b.pos.y) > 1.2) continue;
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
    if (d < .9 && d > .001){ const push = (.9 - d)/2; a.pos.x -= dx/d*push; a.pos.z -= dz/d*push; b.pos.x += dx/d*push; b.pos.z += dz/d*push; }
  }
  if (G.countdown <= 30 && --G.itemTimer <= 0){
    if (G.items.length < Math.min(10, 3 + (fs.length >> 2))) spawnItem();
    G.itemTimer = Math.max(150, 420 - fs.length*15) + (Math.random()*200 | 0);
  }
  for (const it of [...G.items]){
    it.t++;
    if (!it.landed){
      it.vy -= GRAV*DT*.6; it.pos.y += it.vy*DT;
      if (onDeck(it.pos.x, it.pos.z) && it.pos.y <= .45 && it.pos.y > -.5){ it.pos.y = .45; it.landed = true; dust(it.pos, 5); }
      if (it.pos.y < SEA_Y){ splash(it.pos); removeItem(it); continue; }
    }
    if (it.t > 60*20){ removeItem(it); continue; }
    if (it.landed && it.type === 'potion'){
      const f = fs.find(f => alive(f) && f.state !== 'ko' && !powerOn(f) && !f.zombie && f.pos.y < 1 && Math.hypot(it.pos.x - f.pos.x, it.pos.z - f.pos.z) < 1.1);
      if (f){ drinkPotion(f, it); continue; }
    }
    if (it.landed && it.type === 'heal'){
      for (const f of fs) if (alive(f) && f.state !== 'ko' && f.pos.y < 1 && Math.hypot(it.pos.x - f.pos.x, it.pos.z - f.pos.z) < 1.1){
        f.hp = Math.min(MAX_HP, f.hp + RICE_HEAL); popup(new V(f.pos.x, 2.4, f.pos.z), '+' + RICE_HEAL, 'heal');
        emit(it.pos, 10, 0x6fe08a, 3, 4, 24, 1.3, 2); removeItem(it); break;
      }
    }
  }
  for (const bm of [...G.bombs]){
    bm.t++; bm.vel.y -= GRAV*DT*.8; bm.pos.addScaledVector(bm.vel, DT);
    bm.mesh.position.copy(bm.pos); bm.mesh.rotation.x += .25;
    if (bm.kind === 'meteor' && G.frame % 2 === 0) emit(bm.pos, 2, 0xff7a2f, 1, 1, 18, 1.8, -1);
    let boom = bm.t > 150;
    for (const f of fs) if (hittable(f) && (f !== bm.owner || (bm.t > 20 && !bm.meteor)) && bm.pos.distanceTo(new V(f.pos.x, f.pos.y + .8, f.pos.z)) < .9) boom = true;
    if (onDeck(bm.pos.x, bm.pos.z) && bm.pos.y <= .3 && bm.pos.y > -1) boom = true;
    if (bm.pos.y < 6.5 && FUNNELS.some(fn => Math.hypot(bm.pos.x - fn.x, bm.pos.z - fn.z) < fn.r + .3)) boom = true;
    if (blockAt(bm.pos.x, bm.pos.y - .3, bm.pos.z)) boom = true;
    if (G.boss && G.boss.hp > 0 && bm.owner !== G.boss && Math.hypot(bm.pos.x - G.boss.pos.x, bm.pos.z - G.boss.pos.z) < BOSS_R && bm.pos.y < 7) boom = true;
    const sunk = bm.pos.y < SEA_Y;
    if (boom) explode(bm.pos, bm.owner, bm.meteor); else if (sunk) splash(bm.pos);
    if (boom || sunk){ scene.remove(bm.mesh); G.bombs.splice(G.bombs.indexOf(bm), 1); }
  }
  stepTurrets();
  stepGhosts();
  stepMechs();
  stepZones();
  stepBullets();
  if (G.mode === 'menu'){ for (const f of fs) if (f.stocks < 99) f.stocks = 99; }
  if (G.net === 'host' && G.mode === 'play' && G.frame % Net.sendEvery() === 0) Net.hostSend();
  if (G.endT > 0 && --G.endT === 0) showResult();
}

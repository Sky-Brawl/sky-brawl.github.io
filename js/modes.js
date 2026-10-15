// Sky Brawl · modes.js — โหมดทีมตีหิน + บอสยักษ์หิมะ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Team stones (Emperium-style): break the other side's stone to win ---------- */
function buildStone(col){
  const g = new THREE.Group();
  const base = part(new THREE.CylinderGeometry(.75, .95, .5, 8), toon(0x9aa3b5), 1.05); base.position.y = .25; g.add(base);
  const rim = part(new THREE.CylinderGeometry(.8, .8, .1, 8), toon(col)); rim.position.y = .52; g.add(rim);
  const gem = part(new THREE.OctahedronGeometry(.62), toon(col), 1.06); gem.scale.y = 1.45; gem.position.y = 1.75; g.add(gem);
  const glow = new THREE.Mesh(SPH(.95), new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:.18, depthWrite:false})); glow.position.y = 1.75; g.add(glow);
  g.userData.gem = gem; g.userData.glow = glow; scene.add(g);
  return g;
}
function stoneSpot(side){
  const bx = STAGE.box, sgn = side ? 1 : -1;
  for (let x = Math.abs(bx[side ? 1 : 0])*.82; x > 4; x -= .5){
    const px = sgn*x;
    if (onDeck(px, 0, 1.8) && FUNNELS.every(fn => Math.hypot(px - fn.x, fn.z) > fn.r + 1.8) && !inBlock(px, 0, 1.8)) return new V(px, 0, 0);
  }
  return new V(sgn*8, 0, 0);
}
function clearStones(){ for (const st of G.stones) scene.remove(st.mesh); G.stones = []; G.winTeam = null; }
function makeStones(n){
  clearStones();
  const max = 500 + 35*n;
  G.stones = [0, 1].map(side => {
    const st = {side, pos:stoneSpot(side), hp:max, max, shake:0, mesh:buildStone(SIDES[side].col)};
    st.mesh.position.copy(st.pos);
    return st;
  });
}
// Damage every enemy stone within reach of an attack centred at c
function hitStones(src, c, reach, dmg){
  if (!G.teamMode || !dmg || G.winTeam !== null) return false;
  let any = false;
  for (const st of G.stones){
    if (st.hp <= 0 || (src && src.side === st.side)) continue;
    if (Math.hypot(c.x - st.pos.x, c.z - st.pos.z) > reach || c.y > 3.5) continue;
    damageStone(st, dmg, src); any = true;
  }
  return any;
}
function damageStone(st, dmg, src){
  st.hp = Math.max(0, st.hp - dmg); st.shake = 8;
  const top = new V(st.pos.x, 2.6, st.pos.z);
  popup(top, String(Math.round(dmg)));
  emit(top, 6, SIDES[st.side].col, 4, 3, 18, 1.2, 6);
  if (src){ src.dmgDealt += dmg; src.hits++; }
  if (st.hp <= 0) breakStone(st, src);
}
function breakStone(st, src){
  Sfx.play('boom', st.pos);
  const win = 1 - st.side, c = new V(st.pos.x, 1.6, st.pos.z);
  explodeFx(c); flash(c, SIDES[st.side].col, .6, 4.5, 24); emit(c, 40, SIDES[st.side].col, 10, 7, 40, 2, 10);
  st.mesh.visible = false; G.shake = Math.max(G.shake, .8); G.slow = 80;
  banner(`หินฝ่าย${SIDES[st.side].name}แตก!`, st.side ? '' : 'red');
  feed(src ? `${src.name} ตีหินฝ่าย${SIDES[st.side].name}แตก!` : `หินฝ่าย${SIDES[st.side].name}แตก!`);
  endTeamMatch(win);
}
function endTeamMatch(win){
  if (G.winTeam !== null || G.endT) return;
  G.winTeam = win;
  for (const f of G.fighters) f.place = win === null ? 1 : f.side === win ? 1 : 2;
  G.winner = null; G.endT = 200;
}
function stepStones(){
  for (const st of G.stones){
    const g = st.mesh.userData.gem, gl = st.mesh.userData.glow;
    g.rotation.y += .02; g.position.y = 1.75 + Math.sin(G.frame*.05 + st.side)*.12; gl.position.y = g.position.y;
    gl.material.opacity = .14 + (1 - st.hp/st.max)*.25 + (st.shake > 0 ? .2 : 0);
    st.mesh.position.x = st.pos.x + (st.shake > 0 ? (Math.random() - .5)*.12 : 0);
    if (st.shake > 0) st.shake--;
  }
}
// Fighters can't walk through a stone
function pushFromStones(f){
  for (const st of G.stones){
    if (st.hp <= 0) continue;
    const dx = f.pos.x - st.pos.x, dz = f.pos.z - st.pos.z, d = Math.hypot(dx, dz);
    if (d < 1.2 && d > .001 && f.pos.y < 2.4){ f.pos.x = st.pos.x + dx/d*1.2; f.pos.z = st.pos.z + dz/d*1.2; }
  }
}
function syncStoneHud(){
  const bar = $('stoneBar'); bar.hidden = !G.teamMode; $('feed').classList.toggle('low', G.teamMode);
  if (!G.teamMode) return;
  G.stones.forEach((st, i) => {
    const pct = Math.max(0, st.hp/st.max*100);
    $('shp' + i).style.width = pct + '%';
    $('shn' + i).textContent = `หิน${SIDES[i].name} ${Math.ceil(st.hp)}`;
  });
}


/* ---------- Christmas raid boss: everyone teams up against one giant with a huge health pool ---------- */
const BOSS_R = 2.6, BOSS_STATES = ['walk', 'slam', 'throw', 'spin', 'down'];
const BOSS_SLAM = {dmg:14, kb:12, up:9, launch:true, hitstop:6, shake:.6};
const BOSS_SNOW = {dmg:8, kb:6, up:3, stun:16, hitstop:4, shake:.15, blast:1.3};
const BOSS_SPIN = {dmg:6, kb:10, up:5, launch:true, hitstop:4, shake:.2};
function bossCfg(){
  const c = (window.SKY_CONFIG && window.SKY_CONFIG.boss) || {};
  const n = (v, lo, hi, d) => { const x = Number(v); return v !== undefined && Number.isFinite(x) && x >= lo && x <= hi ? x : d; };
  return {hp:Math.round(n(c.hp, 100, 1e7, 100000)), power:n(c.power, 0, 10, 1)};
}
function buildBoss(){
  const g = new THREE.Group(), snow = toon(0xf7fbff), coal = toon(0x1d1d24), wood = toon(0x6b3f1e), red = toon(0xd8342c);
  const body = part(SPH(2.4), snow, 1.02); body.scale.y = .9; body.position.y = 2.2; g.add(body);
  const mid = part(SPH(1.8), snow, 1.02); mid.position.y = 5.1; g.add(mid);
  const head = new THREE.Group(); head.position.y = 7.5; g.add(head);
  head.add(part(SPH(1.3), snow, 1.02));
  const eyeM = new THREE.MeshBasicMaterial({color:0xff3a2a});
  for (const s of [-1, 1]){
    const e = new THREE.Mesh(SPH(.22), eyeM); e.position.set(s*.45, .3, 1.12); head.add(e);
    const brow = part(new THREE.BoxGeometry(.6, .12, .12), coal); brow.position.set(s*.45, .62, 1.1); brow.rotation.z = s*.45; head.add(brow);
  }
  const nose = part(new THREE.ConeGeometry(.24, 1.3, 10), toon(0xff8a2a), 1.05); nose.rotation.x = PI/2; nose.position.set(0, 0, 1.75); head.add(nose);
  for (let i = 0; i < 5; i++){ const a = (i - 2)*.32; const c = part(SPH(.12), coal); c.position.set(Math.sin(a)*.6, -.55 + Math.abs(a)*.35, 1.1); head.add(c); }
  const brim = part(new THREE.CylinderGeometry(1.5, 1.5, .16, 20), coal, 1.04); brim.position.y = 1.05; head.add(brim);
  const hat = part(new THREE.CylinderGeometry(.95, 1, 1.7, 20), coal, 1.03); hat.position.y = 1.95; head.add(hat);
  const band = part(new THREE.CylinderGeometry(1.02, 1.02, .3, 20), red); band.position.y = 1.35; head.add(band);
  const scarf = part(new THREE.TorusGeometry(1.45, .38, 8, 20), red, 1.03); scarf.rotation.x = PI/2; scarf.position.y = 6.5; g.add(scarf);
  const tail = part(new THREE.BoxGeometry(.6, 1.8, .2), red); tail.position.set(.8, 5.6, 1.35); tail.rotation.z = .25; g.add(tail);
  for (let i = 0; i < 3; i++){ const b = part(SPH(.2), coal); b.position.set(0, 4.3 + i*.7, 1.72 - Math.abs(i - 1)*.08); g.add(b); }
  const arms = [];
  for (const s of [-1, 1]){
    const pivot = new THREE.Group(); pivot.position.set(s*1.6, 5.4, 0); g.add(pivot);
    const stick = part(new THREE.CylinderGeometry(.12, .2, 3.4, 6), wood, 1.06); stick.position.set(s*1.5, .9, 0); stick.rotation.z = -s*1.0; pivot.add(stick);
    const twig = part(new THREE.CylinderGeometry(.06, .1, 1, 5), wood); twig.position.set(s*2.3, 1.8, 0); twig.rotation.z = -s*.2; pivot.add(twig);
    const mitt = part(SPH(.45), red, 1.05); mitt.position.set(s*2.9, 1.8, 0); pivot.add(mitt);
    arms.push(pivot);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(.86, 1, 48), new THREE.MeshBasicMaterial({color:0xff3a2a, transparent:true, opacity:.55, depthWrite:false, side:THREE.DoubleSide}));
  ring.rotation.x = -PI/2; ring.visible = false; scene.add(ring);
  g.userData = {head, arms, ring, body};
  scene.add(g);
  return g;
}
function clearBoss(){
  if (G.boss){ scene.remove(G.boss.mesh, G.boss.mesh.userData.ring); }
  G.boss = null;
}
function makeBoss(){
  clearBoss();
  const c = bossCfg();
  G.boss = {name:'ยักษ์หิมะ', pos:new V(0, 0, 0), hp:c.hp, max:c.hp, power:c.power, state:'walk', t:0, cd:240, facing:0, tgt:null, tgtT:0,
    shake:0, angry:false, idx:-1, side:-2, hits:0, dmgDealt:0, kos:0, rage:0, isLocal:false, netX:0, netZ:0, mesh:buildBoss()};
  syncBossHud();
}
function syncBossHud(){
  const B = G.boss, bar = $('bossBar');
  bar.hidden = !B;
  if (!B) return;
  $('bossHp').style.width = Math.max(0, B.hp/B.max*100) + '%';
  $('bossNum').textContent = Math.ceil(B.hp).toLocaleString('en-US') + ' / ' + B.max.toLocaleString('en-US');
  bar.classList.toggle('rage', B.hp < B.max*.3);
}
function damageBoss(dmg, src){
  const B = G.boss;
  if (!B || B.hp <= 0 || !dmg || G.raidWin !== null || G.net === 'guest') return;
  dmg = Math.round(dmg*10)/10;
  rageSteal(src, B, dmg);
  B.hp = Math.max(0, B.hp - dmg); B.shake = 6;
  Sfx.play('hit', B.pos, .8);
  if (G.frame % 2 === 0 || dmg >= 10) popup(new V(B.pos.x + (Math.random() - .5)*2, 6 + Math.random()*2, B.pos.z), String(Math.round(dmg)), '', 36);
  emit(new V(B.pos.x, 3 + Math.random()*3, B.pos.z), 4, 0xe8f4ff, 4, 3, 18, 1.2, 6);
  if (src && src !== B && src.dmgDealt !== undefined){ src.dmgDealt += dmg; src.hits++; }
  if (!B.angry && B.hp < B.max*.3){ B.angry = true; banner('ยักษ์หิมะคลั่ง!', 'red'); feed('ยักษ์หิมะคลั่ง! โจมตีเร็วขึ้น'); }
  if (B.hp <= 0){ bossBurst(); feed(src && src.name ? `${src.name} ปิดฉากยักษ์หิมะ!` : 'ยักษ์หิมะล้มแล้ว!'); endRaid(true); }
}
function hitBossArea(src, c, radius, dmg){
  const B = G.boss;
  if (!B || B.hp <= 0 || !dmg) return;
  if (Math.hypot(c.x - B.pos.x, c.z - B.pos.z) < radius + BOSS_R && c.y < 8) damageBoss(dmg, src);
}
function bossBurst(){
  const B = G.boss; if (!B) return;
  const c = new V(B.pos.x, 4, B.pos.z);
  explodeFx(c); flash(c, 0xffffff, .8, 9, 30); emit(c, 60, 0xffffff, 12, 8, 50, 2.4, 6); emit(c, 30, 0xd8342c, 8, 8, 40, 1.6, 8);
  B.mesh.visible = false; B.mesh.userData.ring.visible = false; B.state = 'down';
  G.shake = Math.max(G.shake, 1); G.slow = 90;
  banner('ปราบยักษ์หิมะสำเร็จ!');
}
function endRaid(win){
  if (G.raidWin !== null || G.endT) return;
  G.raidWin = win;
  // Raid ranking: whoever dealt the most damage to the boss comes first
  [...G.fighters].sort((a, b) => b.dmgDealt - a.dmgDealt).forEach((f, i) => { f.place = i + 1; });
  if (!win) banner('ยักษ์หิมะชนะ…', 'red');
  G.winner = null; G.endT = 200;
}
function pushFromBoss(f){
  const B = G.boss; if (!B || B.hp <= 0 || !alive(f) || f.pos.y > 7) return;
  const dx = f.pos.x - B.pos.x, dz = f.pos.z - B.pos.z, d = Math.hypot(dx, dz), r = BOSS_R + .4;
  if (d < r){ const k = d < .01 ? 1 : 1/d; f.pos.x = B.pos.x + (d < .01 ? r : dx*k*r); f.pos.z = B.pos.z + (d < .01 ? 0 : dz*k*r); }
}
const bossTargets = () => G.fighters.filter(f => hittable(f) && f.pos.y > SEA_Y + 1);
function bossHit(f, m, from){
  const B = G.boss, dx = f.pos.x - from.x, dz = f.pos.z - from.z, d = Math.hypot(dx, dz) || 1;
  applyHit(null, f, {...m, dmg:Math.round(m.dmg*B.power)}, new V(dx/d, 0, dz/d), B);
}
function bossThrow(B, t){
  const from = new V(B.pos.x + Math.sin(B.facing)*1.4, 6, B.pos.z + Math.cos(B.facing)*1.4);
  const to = new V(t.pos.x + t.vel.x*.35, t.pos.y + .9, t.pos.z + t.vel.z*.35), d = from.distanceTo(to), sp = 16;
  const b = makeBullet(G.nextId++, 'snow');
  Sfx.play('swingBig', from);
  b.pos.copy(from); b.vel.copy(to).sub(from).multiplyScalar(sp/(d || 1));
  b.life = Math.ceil(d/sp*60) + 20; b.owner = B; b.m = BOSS_SNOW;
  b.mesh.position.copy(b.pos); G.bullets.push(b);
}
function stepBoss(){
  const B = G.boss, u = B.mesh.userData;
  if (B.state === 'down') return;
  const sim = G.net !== 'guest' && G.mode === 'play' && G.countdown <= 30 && B.hp > 0 && G.raidWin === null;
  if (sim){
    B.t++;
    const speed = (B.angry ? 2.4 : 1.6)*DT, ts = bossTargets();
    if (!B.tgt || !hittable(B.tgt) || --B.tgtT <= 0){
      let best = null, bd = Infinity;
      for (const f of ts){ const d = Math.hypot(f.pos.x - B.pos.x, f.pos.z - B.pos.z)*(.6 + Math.random()*.8); if (d < bd){ bd = d; best = f; } }
      B.tgt = best; B.tgtT = 120;
    }
    const t = B.tgt;
    if (B.state === 'walk'){
      if (t){
        const dx = t.pos.x - B.pos.x, dz = t.pos.z - B.pos.z, d = Math.hypot(dx, dz);
        B.facing = Math.atan2(dx, dz);
        if (d > 5){
          // Walk straight if possible, else slide along whatever is in the way; give up on a target it can't reach
          const go = (vx, vz) => {
            const nx = B.pos.x + vx*speed, nz = B.pos.z + vz*speed;
            if (!onDeck(nx, nz, BOSS_R) || FUNNELS.some(fn => Math.hypot(nx - fn.x, nz - fn.z) < fn.r + BOSS_R) || inBlock(nx, nz, BOSS_R)) return false;
            B.pos.x = nx; B.pos.z = nz; return true;
          };
          const ux = dx/d, uz = dz/d;
          B.turn = B.turn || 1;
          const moved = go(ux, uz) || go(Math.sign(ux), 0) || go(0, Math.sign(uz)) || go(-uz*B.turn, ux*B.turn) || (B.turn = -B.turn, go(-uz*B.turn, ux*B.turn));
          B.stuck = moved ? 0 : (B.stuck || 0) + 1;
          if (B.stuck > 90){ B.tgtT = 0; B.stuck = 0; }
        }
      }
      if (--B.cd <= 0 && ts.length){
        const near = ts.filter(f => Math.hypot(f.pos.x - B.pos.x, f.pos.z - B.pos.z) < 7.5).length;
        const r = Math.random();
        B.state = B.angry && r < .3 ? 'spin' : near && r < .6 ? 'slam' : 'throw'; B.t = 0;
      }
    } else if (B.state === 'slam'){
      const wind = B.angry ? 50 : 70;
      if (B.t === wind){
        const c = B.pos.clone();
        dust(c, 30); flash(new V(c.x, .5, c.z), 0xe8f4ff, .5, 8, 20); emit(new V(c.x, .5, c.z), 40, 0xffffff, 10, 3, 30, 1.8, 6);
        G.shake = Math.max(G.shake, .7);
        Sfx.play('stomp', c);
        // Anyone up on a platform or mid-jump is above the shockwave
        for (const f of ts) if (Math.hypot(f.pos.x - c.x, f.pos.z - c.z) < 7.5 && f.pos.y < 1.2) bossHit(f, BOSS_SLAM, c);
      }
      if (B.t > wind + 30){ B.state = 'walk'; B.cd = B.angry ? 90 : 150; }
    } else if (B.state === 'throw'){
      const n = B.angry ? 8 : 5;
      if (B.t % 9 === 1 && B.t < n*9 && ts.length){
        const far = ts.filter(f => Math.hypot(f.pos.x - B.pos.x, f.pos.z - B.pos.z) < 30);
        const v = pick(far.length ? far : ts); B.facing = Math.atan2(v.pos.x - B.pos.x, v.pos.z - B.pos.z); bossThrow(B, v);
      }
      if (B.t > n*9 + 25){ B.state = 'walk'; B.cd = B.angry ? 80 : 140; }
    } else if (B.state === 'spin'){
      if (B.t % 12 === 6) for (const f of ts) if (Math.hypot(f.pos.x - B.pos.x, f.pos.z - B.pos.z) < 5 && f.pos.y < 2.5) bossHit(f, BOSS_SPIN, B.pos);
      if (G.frame % 2 === 0) emit(new V(B.pos.x, 1, B.pos.z), 3, 0xffffff, 8, 1, 20, 1.4, 0);
      if (B.t > 100){ B.state = 'walk'; B.cd = 100; }
    }
  } else if (G.net === 'guest'){
    B.pos.x += (B.netX - B.pos.x)*.3; B.pos.z += (B.netZ - B.pos.z)*.3;
  }
  // Looks: bob, arm swings, telegraph ring, spin
  const m = B.mesh, k = G.frame*.06;
  m.position.set(B.pos.x + (B.shake > 0 ? (Math.random() - .5)*.25 : 0), Math.abs(Math.sin(k))*.15, B.pos.z);
  if (B.shake > 0) B.shake--;
  const wind = B.angry ? 50 : 70;
  if (B.state === 'spin') m.rotation.y += .45; else m.rotation.y = B.facing;
  const [aL, aR] = u.arms;
  if (B.state === 'slam'){
    const lift = Math.min(1, B.t/wind);
    aL.rotation.z = B.t < wind ? -lift*1.4 : .6; aR.rotation.z = B.t < wind ? lift*1.4 : -.6;
    u.ring.visible = B.t < wind; u.ring.position.set(B.pos.x, .06, B.pos.z); u.ring.scale.setScalar(7.5*Math.max(.15, lift));
    u.body.scale.y = B.t >= wind && B.t < wind + 8 ? .78 : .9;
  } else {
    u.ring.visible = false; u.body.scale.y = .9;
    const sw = B.state === 'throw' ? Math.sin(B.t*.7)*1.1 : Math.sin(k)*.25;
    aL.rotation.z = -.2 + sw*.4; aR.rotation.z = .2 - (B.state === 'throw' ? sw : sw*.4);
  }
  u.head.rotation.z = Math.sin(k*.7)*.06;
}
// Bots in a raid: get clear of the slam, heal when needed, otherwise go hit the boss
function thinkBoss(b, D){
  const B = G.boss, inp = b.input, press = k => { inp[k] = !b.prev[k]; };
  const dx = B.pos.x - b.pos.x, dz = B.pos.z - b.pos.z, d = Math.hypot(dx, dz) || .001;
  if (B.state === 'slam' && d < 9 && b.pos.y < 1.2){
    inp.x = -dx/d; inp.z = -dz/d; steerAroundObstacles(b, inp);
    if (b.onGround && B.t > (B.angry ? 35 : 55)) press('jump');
    return;
  }
  const si = SKILL_INFO[b.cls] || SKILL_INFO.none;
  if (si.range < 0 && b.skillCd <= 0 && wantsHeal(b) && Math.random() < .3){ press('skill'); b.ai.cd = D.react; return; }
  return thinkStone(b, {pos:B.pos, r:BOSS_R}, D);
}

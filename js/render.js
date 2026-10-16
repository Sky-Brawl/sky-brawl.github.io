// Sky Brawl · render.js — ท่าทางตัวละครและวาดภาพทุกเฟรม
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Pose & render ---------- */
function animAttack(f, v, t){
  const m = f.move; if (!m) return;
  const su = m.startup, ac = m.active, rc = m.recovery;
  let ph, k;
  if (t < su){ ph = 0; k = t/su; } else if (t < su + ac){ ph = 1; k = (t - su)/ac; } else { ph = 2; k = Math.min(1, (t - su - ac)/rc); }
  const w = ph === 0 ? k : 0, e = ph === 0 ? 0 : ph === 1 ? 1 : 1 - k*k;
  const {armL, armR, legR, legL, tilt} = v;
  switch (m.anim){
    case 'punchL': armL.rotation.set(-.7 + .7*w - .95*e, 0, .25 - .2*e); armR.rotation.x = -.9; tilt.rotation.y = .25*w - .4*e; break;
    case 'punchR': armR.rotation.set(-.7 + .7*w - .95*e, 0, -.25 + .2*e); armL.rotation.x = -.9; tilt.rotation.y = -.25*w + .4*e; break;
    case 'kick': legR.rotation.x = .6*w - 1.55*e; tilt.rotation.x = -.25*e; armL.rotation.z = .25 + .9*e; armR.rotation.z = -.25 - .9*e; break;
    case 'airkick': legL.rotation.x = -.5; legR.rotation.x = -1.5*Math.max(e, .4); tilt.rotation.x = -.3; armL.rotation.z = 1.1; armR.rotation.z = -1.1; break;
    case 'swing': armR.rotation.set(-1.45, 0, -.2); armL.rotation.set(-1.2, 0, -.5); tilt.rotation.y = -1*w + 1.2*e; break;
    case 'shoot': armR.rotation.set(-1.57 + .3*e, 0, -.05); armL.rotation.x = -.6; tilt.rotation.x = -.06*e; break;
    case 'blast': armR.rotation.set(-1.5 + .45*e, 0, -.05); armL.rotation.set(-1.4 + .35*e, 0, -.5); tilt.rotation.x = -.15*e; break;
    case 'slashH2': armR.rotation.set(-1.45, 0, -.2); armL.rotation.set(-1, 0, .3); tilt.rotation.y = 1*w - 1.2*e; break;
    case 'thrust': armR.rotation.set(-.9 + .6*w - 1*e, 0, -.1); tilt.rotation.x = .25*e; tilt.rotation.y = -.25*w + .3*e; break;
    case 'spin': { const sp = ph === 0 ? -k*.6 : ph === 1 ? k*PI*2 : 0; tilt.rotation.y = sp; armL.rotation.set(0, 0, 1.4); armR.rotation.set(-1.4, 0, -1.2); break; }
    case 'uppercut': armR.rotation.set(L(.5, -3, e), 0, -.2); tilt.position.y -= .15*w; tilt.rotation.x = -.2*e; break;
    case 'headbutt': tilt.rotation.x = -.3*w + .7*e; armL.rotation.set(.5, 0, .4); armR.rotation.set(.5, 0, -.4); legL.rotation.x = .5*e; legR.rotation.x = -.5*e; break;
    case 'stomp': legR.rotation.x = -1.2*w; tilt.rotation.x = -.1*w + .15*e; armL.rotation.z = .3 + .8*w; armR.rotation.z = -.3 - .8*w; break;
    case 'charge': armL.rotation.set(-1.5, 0, -.3); armR.rotation.set(-1.2, 0, -.3); tilt.rotation.x = .35*Math.max(w, e); break;
    case 'dash': armL.rotation.set(.8, 0, .3); armR.rotation.set(-1.6*e, 0, -.2); tilt.rotation.x = .45*Math.max(w, e); legL.rotation.x = .6; legR.rotation.x = -.6; break;
    case 'cast': { const r = Math.max(w, e); armL.rotation.set(-.6 - 1.4*r, 0, .3); armR.rotation.set(-.6 - 1.4*r, 0, -.3); tilt.rotation.x = -.15*w + .1*e; break; }
    case 'roar': { const r = Math.max(w, e); armL.rotation.set(0, 0, .3 + 2.2*r); armR.rotation.set(0, 0, -.3 - 2.2*r); tilt.rotation.x = -.3*r; break; }
    case 'iai': armR.rotation.set(-1.45, 0, -.2); armL.rotation.set(-1.2, 0, -.5); tilt.rotation.y = -1.3*w + 1.6*e; tilt.position.y -= .15*w; break;
    case 'flurry': { const alt = Math.floor(t/2) % 2; armL.rotation.set(alt ? -1.6 : -.4, 0, .2); armR.rotation.set(alt ? -.4 : -1.6, 0, -.2); tilt.rotation.y = alt ? -.25 : .25; break; }
    case 'jab': {
      const p = Math.floor(t/2) % 2;
      armR.rotation.set(ph === 1 ? (p ? -1.75 : -1.05) : -1.2*Math.max(w, e), 0, -.1); armL.rotation.set(-1.1, 0, .35);
      tilt.rotation.x = .12 + (ph === 1 ? p*.08 : 0); tilt.rotation.y = ph === 1 ? (p ? -.12 : .12) : 0; break;
    }
    case 'rake': {
      const sg = m.flip ? -1 : 1;
      armR.rotation.set(-1.4, 0, -1.7 + 2.3*e); armL.rotation.set(-1.4, 0, 1.7 - 2.3*e);
      tilt.rotation.y = sg*(-.9*w + 1.1*e); tilt.rotation.x = .2; break;
    }
    case 'breath': {
      const r = Math.max(w, e);
      v.head.rotation.x = -.6*r; armL.rotation.set(-.3, 0, .8*r); armR.rotation.set(-.3, 0, -.8*r); tilt.rotation.x = -.25*r; break;
    }
    case 'slam': {
      const x = ph === 0 ? L(-1, -3.3, 1 - (1 - k)*(1 - k)) : ph === 1 ? L(-3.3, -1.15, Math.min(1, k*1.6)) : -1.15;
      armR.rotation.set(x, 0, -.1); armL.rotation.set(x, 0, .1);
      tilt.rotation.x = ph === 0 ? -.2*k : .35*e;
      break;
    }
  }
}
// Which face a fighter makes: hurt while reeling from a hit, X eyes when knocked out
const faceMood = f => f.state === 'win' ? 'joy' : f.state === 'ko' || f.state === 'out' || f.stocks <= 0 ? 'ko'
  : f.state === 'hitstun' || f.state === 'tumble' || (f.state === 'down' && f.stateT < 40) ? 'ouch' : 'normal';
function pose(f){
  const v = f.vis, T = G.frame, s = f.state, t = f.stateT;
  const shown = alive(f);
  v.root.visible = shown && !(f.invuln > 0 && s !== 'getup' && (T >> 2) % 2 === 0);
  if (G.meFrame !== G.frame){ G.meFrame = G.frame; G.meF = G.fighters.find(o => o.isLocal && alive(o)) || null; }
  f.hidden = !!STAGE.bushes && !f.isLocal && shown && inBush(f) && (!G.meF || Math.hypot(G.meF.pos.x - f.pos.x, G.meF.pos.z - f.pos.z) > SI_HIDE) && !(G.meF && ally(G.meF, f));
  if (f.hidden) v.root.visible = false;
  v.hurt.visible = v.hit.visible = false;
  statusFx(f, shown);
  if (!shown){ powerPose(f); return; }
  v.root.position.copy(f.pos);
  let d = f.facing - v.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); v.root.rotation.y += d*.4;
  const {tilt, armL, armR, legL, legR, head} = v;
  tilt.rotation.set(0,0,0); tilt.position.y = .75; tilt.scale.set(1,1,1);
  armL.rotation.set(-.5, 0, .25); armR.rotation.set(-.5, 0, -.25);
  legL.rotation.set(0, 0, .05); legR.rotation.set(0, 0, -.05); head.rotation.set(0,0,0);
  if (s === 'idle'){ const b = Math.sin(T*.09 + f.idx); tilt.position.y += b*.02; armL.rotation.x = -.75 + b*.05; armR.rotation.x = -.75 - b*.05; }
  else if (s === 'run'){
    const fast = Math.hypot(f.vel.x, f.vel.z) > WALK*1.25;
    f.phase = (f.phase || 0) + (fast ? .5 : .32); const p = Math.sin(f.phase);
    if (fast && G.frame % 5 === 0) dust(f.pos, 2);
    legL.rotation.x = p*.9; legR.rotation.x = -p*.9; armL.rotation.x = -p*.8 - .2; armR.rotation.x = p*.8 - .2;
    tilt.rotation.x = fast ? .38 : .18; tilt.position.y += Math.abs(Math.cos(f.phase))*.08;
  }
  else if (s === 'air' || s === 'respawn'){
    legL.rotation.x = -.7; legR.rotation.x = .3; armL.rotation.set(0, 0, 1.2); armR.rotation.set(0, 0, -1.2);
    if (s === 'respawn'){ const wv = Math.sin(T*.3)*.3; armL.rotation.z = 2.6 + wv; armR.rotation.z = -2.6 - wv; }
  }
  else if (s === 'attack') animAttack(f, v, t);
  else if (s === 'guard' || s === 'guardstun'){ armL.rotation.set(-1.35, 0, -.75); armR.rotation.set(-1.35, 0, .75); tilt.rotation.x = .1; legL.rotation.x = .3; legR.rotation.x = -.3; }
  else if (s === 'hitstun'){ const k = Math.max(0, 1 - t/(f.stun || 16)); tilt.rotation.x = -.45*k; armL.rotation.set(.6, 0, .8); armR.rotation.set(.6, 0, -.8); head.rotation.x = -.3*k; }
  else if (s === 'tumble' || s === 'ko'){
    if (f.onGround){ tilt.rotation.x = -1.5; tilt.position.y = .5; armL.rotation.set(0,0,1.4); armR.rotation.set(0,0,-1.4); }
    else { tilt.rotation.x = -t*(s === 'ko' ? .45 : .3); tilt.rotation.z = Math.sin(t*.2)*.3; tilt.position.y = .6; armL.rotation.set(0,0,2); armR.rotation.set(0,0,-2); legL.rotation.x = .6; legR.rotation.x = -.6; }
  }
  else if (s === 'down'){ tilt.rotation.x = -1.5; tilt.position.y = .5; armL.rotation.set(0,0,1.4); armR.rotation.set(0,0,-1.4); }
  else if (s === 'win') animWin(f, v, t);
  else if (s === 'getup'){ const k = Math.min(1, t/16); tilt.rotation.x = -1.5*(1 - k); tilt.position.y = L(.5, .75, k); }
  if (f.held === 'bomb' && ['idle','run','air'].includes(s)){ armL.rotation.set(-3, 0, .35); armR.rotation.set(-3, 0, -.35); }
  else if ((f.weapon || v.cw) && ['idle','run','air','respawn'].includes(s)) armR.rotation.set(f.weapon && f.weapon !== 'hammer' ? -.7 : -.95, 0, -.2);
  v.hammer.visible = f.weapon === 'hammer'; v.gun.visible = f.weapon === 'gun'; v.shotgun.visible = f.weapon === 'shotgun';
  if (v.cw) v.cw.visible = !f.weapon;
  if (v.oh) v.oh.visible = !f.weapon;
  if (v.form) poseForm(f, v, T, s);
  if (v.face){ const m = faceMood(f); v.face.eyes.visible = m === 'normal'; v.face.ouch.visible = m === 'ouch'; v.face.ko.visible = m === 'ko'; v.face.joy.visible = m === 'joy'; }
  if (v.rageFx){
    const on = f.rage > 0, R = v.rageFx;
    R.eyes.visible = R.aura.visible = R.ring.visible = on;
    if (on){
      R.aura.material.opacity = .2 + Math.sin(T*.3)*.07; R.aura.scale.setScalar(1 + Math.sin(T*.25)*.06);
      R.ring.rotation.z += .08; R.ring.scale.setScalar(1 + Math.sin(T*.2)*.12);
      if (T % 3 === 0) emit(new V(f.pos.x + (Math.random() - .5)*.9, f.pos.y + .3, f.pos.z + (Math.random() - .5)*.9), 1, 0xff3a2a, .8, 4, 22, 1.4, -3);
    }
  }
  if (s === 'attack' && f.move && f.move.lance) lanceFx(f);
  v.bomb.visible = f.held === 'bomb';
  if (v.bomb.visible) v.bomb.userData.spark.scale.setScalar(.7 + Math.random()*.7);
  v.bubble.visible = s === 'guard' || s === 'guardstun';
  if (v.bubble.visible) v.bubble.scale.setScalar(s === 'guardstun' ? 1.1 : 1 + Math.sin(T*.2)*.02);
  if (f.squash > 0){ const q = f.squash/10; tilt.scale.set(1 + .2*q, 1 - .2*q, 1 + .2*q); }
  if (f.zombie) poseZombie(f, v, T, s);
  powerPose(f);
  if (G.debug && f.move !== undefined){
    v.hurt.visible = true; v.hurt.position.set(f.pos.x, f.pos.y + .8, f.pos.z);
    if (s === 'attack' && f.move && t >= f.move.startup && t < f.move.startup + f.move.active){
      v.hit.visible = true; v.hit.position.copy(hitCenter(f)); v.hit.scale.setScalar(f.move.rad);
    }
  }
}
function camTargets(){
  if (Replay.on) return Replay.targets();
  const won = G.fighters.filter(f => f.state === 'win' && alive(f));
  if (won.length) return won;
  const locals = G.fighters.filter(f => f.isLocal && alive(f) && f.pos.y > -3);
  if (locals.length) return locals;
  let s = G.fighters[G.spec];
  if (!s || !alive(s) || s.pos.y < -3){
    s = G.fighters.find(f => alive(f) && f.stocks > 0 && f.pos.y > -3);
    if (s) G.spec = s.idx;
  }
  return s ? [s] : [];
}
const camPos = new V(0, 14, 30), camLook = new V(0, 1, 0);
const tmpV = new V();
function render(){
  Quest.watch();
  if (G.mode === 'custom' && G.fighters[0]) G.fighters[0].facing = Math.sin(performance.now()*.0008)*.6;
  for (const f of G.fighters) pose(f);
  renderMechs();
  zombieHud();
  updateLockMarks();
  updateGroundMarks();
  animGhosts();
  if (G.frame % 30 === 0) renderer.shadowMap.needsUpdate = true;
  for (const it of G.items){
    const g = it.mesh, bob = it.landed ? Math.sin(G.frame*.08 + it.pos.x)*.12 : 0;
    g.position.set(it.pos.x, it.pos.y + bob, it.pos.z); g.rotation.y += .03;
    g.visible = !(it.t > 60*17 && (G.frame >> 3) % 2 === 0);
    const ring = g.userData.ring; ring.visible = it.landed && g.visible; ring.position.set(it.pos.x, .03, it.pos.z);
    ring.scale.setScalar(1 + Math.sin(G.frame*.1)*.08);
    const sp = g.userData.inner.userData.spark; if (sp) sp.scale.setScalar(.7 + Math.random()*.7);
  }
  for (const b of G.bombs){ const sp = b.mesh.userData.spark; if (sp) sp.scale.setScalar(.7 + Math.random()*.7); }
  if (G.zones.length && !G.paused) zoneFx();
  const now = performance.now();
  for (const c of clouds){ const u = c.userData; u.a += u.sp; c.position.set(Math.cos(u.a)*u.d, u.y, Math.sin(u.a)*u.d); c.rotation.y = -u.a; }
  if (G.frame % 2 === 0) waveSea(now*.001);

  if (G.mode === 'menu'){
    const a = now*.00006;
    camPos.lerp(tmpV.set(Math.sin(a)*STAGE.orbit, STAGE.orbit*.42, Math.cos(a)*STAGE.orbit), .04); camLook.lerp(new V(0, 0, 0), .05);
  } else if (G.mode === 'custom'){
    const wide = innerWidth > 700;
    camPos.lerp(wide ? tmpV.set(STAGE.preview.x + 1.25, 1.6, STAGE.preview.z + 5.2) : tmpV.set(STAGE.preview.x, 1.2, STAGE.preview.z + 6.4), .1);
    camLook.lerp(wide ? new V(STAGE.preview.x + 1.25, .95, STAGE.preview.z) : new V(STAGE.preview.x, -1.2, STAGE.preview.z), .1);
  } else {
    const ts = camTargets(), mid = new V(); let spread = 0;
    if (ts.length){
      for (const f of ts) mid.add(f.pos); mid.multiplyScalar(1/ts.length);
      if (ts.length === 2) spread = ts[0].pos.distanceTo(ts[1].pos);
    }
    mid.x = Math.max(-STAGE.camX, Math.min(STAGE.camX, mid.x)); mid.y = Math.max(0, mid.y)*.5;
    const cz = CAM_LEVELS[G.camZoom] || CAM_LEVELS[1], won = ts.length && ts[0].state === 'win', ck = won ? .5 : cz.k, mz = won ? 1 : .6;
    camYawStep();
    // where the camera wants to be with no turning, then turned by G.camYaw around the point it looks at
    let L, P, k;
    if (cz.all && !won){ const d = (STAGE.camX + 6)/(Math.tan(camera.fov*PI/360)*camera.aspect)*.74; L = new V(0, 0, 0); P = tmpV.set(0, d, d); k = .07; }
    else { L = new V(mid.x, mid.y + (won ? 1.9 : 1), mid.z*(won ? 1 : .8)); P = tmpV.set(mid.x*.9, (7.5 + spread*.35)*ck + mid.y, mid.z*mz + (11.5 + spread*.55)*ck); k = won ? .05 : .07; }
    if (G.camYaw){
      const c = Math.cos(G.camYaw), s = Math.sin(G.camYaw), dx = P.x - L.x, dz = P.z - L.z;
      P.x = L.x + dx*c + dz*s; P.z = L.z - dx*s + dz*c;
      // the stages are built to be seen from the front: from the sides and back the camera rises and looks down more, over the walls
      const back = (1 - c)/2, hz = 1 - .35*back;
      P.x = L.x + (P.x - L.x)*hz; P.z = L.z + (P.z - L.z)*hz; P.y = L.y + (P.y - L.y)*(1 + .75*back);
    }
    camPos.lerp(P, k); camLook.lerp(L, .09);
  }
  camera.position.copy(camPos);
  if (G.shake > .005 && !REDUCE && !G.paused){
    camera.position.x += (Math.random() - .5)*G.shake; camera.position.y += (Math.random() - .5)*G.shake;
  }
  G.shake *= .88;
  camera.lookAt(camLook);
  renderer.render(scene, camera);

  const w = innerWidth, h = innerHeight;
  for (const p of pops){
    tmpV.copy(p.p).project(camera);
    const k = p.life/p.max;
    p.el.style.transform = `translate(${(tmpV.x*.5 + .5)*w}px,${(-tmpV.y*.5 + .5)*h}px) translate(-50%,-50%) scale(${k > .85 ? 1 + (k - .85)*4 : 1})`;
    p.el.style.opacity = tmpV.z < 1 ? Math.min(1, k*3) : 0;
  }
  if (G.mode === 'play'){ updateTags(w, h); updateHud(); updateAids(w, h); }
  else if (G.aidsOn) hideAids();
}

// Sky Brawl · stages/volcano.js — ด่านภูเขาไฟระเบิด: ลานหินกลางทะเลลาวา วงนอกถล่มทีละวง หินภูเขาไฟตก
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Volcano: a round basalt arena in a lava lake. Every VOL_PHASE frames the outer ring sinks into the lava
   (it glows and the screen warns VOL_WARN frames before), so the fight is squeezed toward the middle. Lava bombs
   rain down during each warning and keep falling once only the last ring is left. The host owns the timer (LAVA);
   guests copy it from the snapshot (sn.lv) so everyone sees the same ring sink. ---------- */
// ปรับได้: รัศมีขอบลานหลังถล่มไป 0,1,2,3,4 วง (ช่อง) · เวลาระหว่างถล่ม / เตือนก่อนถล่ม / เวลาจมให้เห็น (เฟรม, 60 = 1 วินาที)
const VOL_RADII = [22, 18, 14.5, 11, 8];
const VOL_PHASE = 1500, VOL_WARN = 300, VOL_SINK = 90;
// หินภูเขาไฟ: ดาเมจและแรงกระเด็นเมื่อตกโดน
const LAVA_BOMB = {dmg:9, kb:9, up:7, launch:true, stun:20, hitstop:5, shake:.35};
// Obsidian pillars (round obstacles) on ring 1; they leave the obstacle list when their ring sinks
const VOL_OBS_ALL = [[0, 16.2], [-14, -8.1], [14, -8.1]].map(([x, z]) => ({x, z, r:1.15}));
const VOL_OBS = VOL_OBS_ALL.slice();
const LAVA = {sunk:0, t:0, match:-1};
const volLast = () => LAVA.sunk >= VOL_RADII.length - 1 || G.teamMode;   // team mode: the Emperium stones stand on the outer ring, so it never sinks
const volR = () => VOL_RADII[Math.min(LAVA.sunk, VOL_RADII.length - 1)];
const volWarn = () => !volLast() && LAVA.t >= VOL_PHASE - VOL_WARN;
const volRing = r => { for (let i = 0; i < VOL_RADII.length - 1; i++) if (r > VOL_RADII[i + 1]) return i; return VOL_RADII.length - 1; };
// Spawns, respawns and bots ask with a margin: while a ring is glowing they already treat it as lava
function volInside(x, z, m){ const R = m > .6 && volWarn() ? VOL_RADII[LAVA.sunk + 1] : volR(); return Math.hypot(x, z) < R - m; }
function volPush(x, z){ const d = Math.hypot(x, z) || 1, R = volR() + .35; return {x:x/d*R, z:z/d*R}; }

function lavaTex(){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const t = c.getContext('2d');
  t.fillStyle = '#c8320e'; t.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++){
    const x = Math.random()*256, y = Math.random()*256, r = 8 + Math.random()*26;
    const g = t.createRadialGradient(x, y, 0, x, y, r);
    const hot = Math.random() < .5;
    g.addColorStop(0, hot ? '#ffe46a' : '#ff8a1f'); g.addColorStop(.5, hot ? '#ff9a1f' : '#f05a12'); g.addColorStop(1, 'rgba(200,50,14,0)');
    t.fillStyle = g; t.fillRect(x - r, y - r, r*2, r*2);
  }
  t.fillStyle = 'rgba(60,12,6,.55)';
  for (let i = 0; i < 26; i++){ const x = Math.random()*256, y = Math.random()*256; t.fillRect(x, y, 10 + Math.random()*22, 6 + Math.random()*10); }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.NearestFilter;
  return tex;
}
function buildVolcano(){
  const g = new THREE.Group(), N = VOL_RADII.length, S = 2;
  const shades = [0x3b3236, 0x332b2f, 0x45393b, 0x2c2528];
  // The arena: square basalt tiles grouped by ring, so each ring can sink on its own
  const rings = [];
  for (let k = 0; k < N; k++){ const rg = new THREE.Group(); rings.push(rg); g.add(rg); }
  for (let x = -VOL_RADII[0]; x < VOL_RADII[0]; x += S) for (let z = -VOL_RADII[0]; z < VOL_RADII[0]; z += S){
    const cx = x + S/2, cz = z + S/2, r = Math.hypot(cx, cz);
    if (r > VOL_RADII[0] - .3) continue;
    const k = volRing(r), n = Math.abs(Math.sin(cx*12.9898 + cz*78.233))*43758.5 % 1;
    const tile = part(new THREE.BoxGeometry(S, 3.2, S), toon(shades[(n*4) | 0])); tile.position.set(cx, -1.6 + (n - .5)*.06, cz); rings[k].add(tile);
    if (n > .86){ const crack = new THREE.Mesh(new THREE.BoxGeometry(S*.75, .04, .12), new THREE.MeshBasicMaterial({color:0xff7a2a})); crack.position.set(cx, .03, cz); crack.rotation.y = n*9; rings[k].add(crack); }
  }
  // Obsidian pillars with glowing veins (on their ring, so they sink with it)
  for (const o of VOL_OBS_ALL){
    const p = new THREE.Group();
    const body = part(new THREE.CylinderGeometry(o.r*.7, o.r, 4.2, 6), toon(0x1d1a24), 1.04); body.position.y = 2.1; p.add(body);
    const tip = part(new THREE.ConeGeometry(o.r*.7, 1.6, 6), toon(0x2a2433), 1.04); tip.position.y = 5; p.add(tip);
    for (let i = 0; i < 3; i++){ const v = new THREE.Mesh(new THREE.BoxGeometry(.08, 2.6, .08), new THREE.MeshBasicMaterial({color:0xff6a1f})); const a = i*2.1; v.position.set(Math.cos(a)*o.r*.86, 2, Math.sin(a)*o.r*.86); v.rotation.z = .2*(i - 1); p.add(v); }
    p.position.set(o.x, 0, o.z); rings[volRing(Math.hypot(o.x, o.z))].add(p);
  }
  // Each sinking ring gets a glowing overlay used as its warning
  rings.forEach((rg, k) => {
    mergeMeshes(rg);
    const r0 = k < N - 1 ? VOL_RADII[k + 1] : 0, r1 = VOL_RADII[k];
    const glow = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 48, 1), new THREE.MeshBasicMaterial({color:0xff5a1f, transparent:true, opacity:0, depthWrite:false, side:THREE.DoubleSide}));
    glow.rotation.x = -PI/2; glow.position.y = .06; glow.visible = false; rg.add(glow);
    rg.userData = {glow, r0, r1};
  });
  // The lava lake
  const tex = lavaTex(); tex.repeat.set(30, 30);
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshBasicMaterial({map:tex, color:0xffffff}));
  lava.rotation.x = -PI/2; lava.position.y = -1.3; g.add(lava);
  // The volcano behind the arena, a glowing crater, lava streams down its sides
  const mount = part(new THREE.CylinderGeometry(9, 46, 46, 10), toon(0x2a2024)); mount.position.set(0, 21, -95); g.add(mount);
  const crater = new THREE.Mesh(new THREE.CylinderGeometry(8.4, 8.4, .6, 10), new THREE.MeshBasicMaterial({color:0xff7a2a})); crater.position.set(0, 44.2, -95); g.add(crater);
  for (let i = 0; i < 6; i++){
    // a glowing strip lying on the cone from the crater rim to its foot, on the side facing the arena
    const a = (i/5 - .5)*1.6, p0 = new V(Math.sin(a)*8.6, 44, -95 + Math.cos(a)*8.6), p1 = new V(Math.sin(a)*46.5, -1, -95 + Math.cos(a)*46.5);
    const dir = p1.clone().sub(p0), len = dir.length(); dir.normalize();
    const st = new THREE.Mesh(new THREE.BoxGeometry(1.4 + (i % 2)*.6, len, .5), new THREE.MeshBasicMaterial({color:i % 2 ? 0xff5a1f : 0xff9a2a}));
    st.position.copy(p0).addScaledVector(dir, len/2); st.quaternion.setFromUnitVectors(new V(0, 1, 0), dir); g.add(st);
  }
  // Rocky spires around the lake
  for (let i = 0; i < 14; i++){
    const a = i/14*PI*2 + .2, d = 48 + (i % 4)*14, h = 8 + (i % 5)*4;
    const sp = part(new THREE.ConeGeometry(3 + (i % 3), h, 5), toon(i % 2 ? 0x2f2529 : 0x3a2d30)); sp.position.set(Math.cos(a)*d, h/2 - 1.5, Math.sin(a)*d); g.add(sp);
  }
  g.userData = {rings, lavaTex:tex, crater:new V(0, 46, -95), seen:0, warned:false, glows:rings.map(r => r.userData.glow)};
  return g;
}
// A lava bomb aimed at a random spot on what is left of the arena (host only; bombs travel to guests like meteors)
function dropLavaBomb(){
  const R = Math.max(3, volR() - 1.5), a = Math.random()*PI*2, r = Math.sqrt(Math.random())*R;
  const b = makeBomb(G.nextId++, 'meteor');
  b.owner = null; b.meteor = LAVA_BOMB;
  b.pos.set(Math.cos(a)*r, 24, Math.sin(a)*r); b.vel.set(0, -6, 0);
  b.mesh.position.copy(b.pos); G.bombs.push(b);
}
function volcanoTick(fr){
  const u = STAGE.group.userData, live = G.mode === 'play' && !G.tut;
  u.lavaTex.offset.set(fr*.0007, fr*.0004);
  // Embers off the lake, smoke from the crater
  if (fr % 3 === 0){ const a = Math.random()*PI*2, d = VOL_RADII[0] + 1 + Math.random()*26; emit(new V(Math.cos(a)*d, -1, Math.sin(a)*d), 1, Math.random() < .5 ? 0xffb03a : 0xff5a1f, .4, 3, 90, 1.2, -1.2); }
  if (fr % 8 === 0) emit(u.crater, 1, 0x3a2a2a, 1.4, 5, 170, 10, -.4, .55);
  if (!live){ LAVA.sunk = 0; LAVA.t = 0; }
  else if (G.net !== 'guest'){
    if (LAVA.match !== G.matchId){ LAVA.match = G.matchId; LAVA.sunk = 0; LAVA.t = 0; }
    if (G.countdown <= 0 && !G.endT){
      LAVA.t++;
      if (!volLast() && LAVA.t >= VOL_PHASE){ LAVA.sunk++; LAVA.t = 0; }
      const every = volWarn() ? 40 : volLast() ? (G.teamMode ? 240 : 150) : 0;
      if (every && LAVA.t % every === 0) dropLavaBomb();
    }
  } else if (G.countdown <= 0) LAVA.t++;   // guests run the clock between snapshots
  // Pillars that sank stop blocking
  const keep = VOL_OBS_ALL.filter(o => volRing(Math.hypot(o.x, o.z)) >= LAVA.sunk);
  if (keep.length !== VOL_OBS.length){ VOL_OBS.length = 0; VOL_OBS.push(...keep); }
  // Rings: sunk ones go under, the next one glows during its warning
  const warn = volWarn();
  u.rings.forEach((rg, k) => {
    const d = rg.userData;
    if (k < LAVA.sunk){
      const now = k === LAVA.sunk - 1 && LAVA.t < VOL_SINK;
      rg.visible = now; if (now){ const s = LAVA.t/VOL_SINK; rg.position.y = -5*s*s; d.glow.visible = true; d.glow.material.opacity = .85 - s*.5; }
    } else {
      rg.visible = true; rg.position.y = 0;
      const on = warn && k === LAVA.sunk; d.glow.visible = on;
      if (on){
        const k2 = (LAVA.t - (VOL_PHASE - VOL_WARN))/VOL_WARN;
        d.glow.material.opacity = .15 + k2*.35 + Math.sin(fr*(.2 + k2*.4))*.12;
        if (fr % 4 === 0){ const a = Math.random()*PI*2, r = d.r0 + Math.random()*(d.r1 - d.r0); emit(new V(Math.cos(a)*r, .1, Math.sin(a)*r), 2, 0xff7a2a, .8, 3.5, 30, 1.3, -2); }
      }
    }
  });
  // Red markers under falling bombs
  if (fr % 3 === 0) for (const b of G.bombs) if (b.kind === 'meteor' && b.pos.y > 1.5) emit(new V(b.pos.x, .12, b.pos.z), 2, 0xff3a1a, 1.6, .2, 12, 1.1, 0);
  // Warnings, the collapse and the eruption
  if (live && warn && !u.warned){ u.warned = true; banner('ลาวากำลังขึ้น! ถอยเข้ากลาง'); }
  if (!warn) u.warned = false;
  if (LAVA.sunk !== u.seen){
    if (live && LAVA.sunk > u.seen){
      banner('พื้นถล่ม!'); G.shake = Math.max(G.shake, .8); Sfx.play('boom', new V(0, 0, 0), .8);
      for (let i = 0; i < 4; i++) emit(u.crater, 14, i % 2 ? 0xff5a1f : 0xffd23a, 9, 14, 70, 3, 9);
    }
    u.seen = LAVA.sunk;
  }
  if (warn && fr % 2 === 0) emit(u.crater, 3, Math.random() < .5 ? 0xff5a1f : 0xffd23a, 6, 12, 60, 2.4, 9);
}

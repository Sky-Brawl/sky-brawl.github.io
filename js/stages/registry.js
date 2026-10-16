// Sky Brawl · stages/registry.js — ★ รายชื่อด่านทั้งหมด (STAGES) + setStage — เพิ่มด่านใหม่ต้องลงทะเบียนที่นี่
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
const rectInside = (W, D) => (x, z, m) => Math.abs(x) < W - m && Math.abs(z) < D - m;
const rectPush = (W, D) => (x, z) => (W - Math.abs(x) < D - Math.abs(z)) ? {x:Math.sign(x || 1)*(W + .35), z} : {x, z:Math.sign(z || 1)*(D + .35)};
const STAGES = {
  titanic:{name:'เรือไททานิก', fallText:'ตกทะเล', water:0x2f78b5, fallY:-4.5, wallBottom:-6.3, camX:26, orbit:48,
    preview:new V(22, 0, 0), spawn:[-24, 24, -5, 5], box:[-26, 26, -8, 8], obstacles:SHIP_FUNNELS, fog:0xf2c7a0,
    sky:['#3f6fb5','#9fb8d8','#f6b77c','#ffd7a3'], skyTex:scene.background, group:SHIP_GROUP,
    inside:(x, z, m) => Math.abs(z) < hw(x) - m,
    pushOut:(x, z) => { const h = hw(x); return h > .6 ? {x, z:Math.sign(z || 1)*(h + .35)} : {x:Math.sign(x)*(Math.abs(x) + .4), z}; },
    fx:fr => { if (fr % 9 === 0) for (let i = 0; i < 3; i++){ const fn = SHIP_FUNNELS[i]; emit(new V(fn.x - .8, 7.8, fn.z), 1, 0x6b6f7c, .6, 1.6, 120, 9, -.25, .55); } }},
  temple:{name:'วัดไทย', fallText:'ตกสระบัว', water:0x3c8f86, fallY:-3.5, wallBottom:-3.2, camX:21, orbit:46,
    preview:new V(0, 0, 6), spawn:[-20, 20, -10, 10], box:[-24, 24, -13, 13], obstacles:TEMPLE_OBS, fog:0xffd2a8,
    sky:['#ff8a5c','#ffb27a','#ffd9a3','#fff0d6'], build:buildTemple, inside:rectInside(25, 14), pushOut:rectPush(25, 14),
    fx:fr => { if (fr % 20 === 0){ const o = TEMPLE_OBS[(fr/20 | 0) % 4]; emit(new V(o.x, 8.6, o.z), 1, 0xffd23a, .5, .6, 50, 1.2, -.1); } }},
  siam:{name:'สยาม', fallText:'ร่วงลงถนน', water:null, fallY:-11.5, wallBottom:-1.3, camX:27, orbit:40,
    preview:new V(0, 0, 3), spawn:[-26, 26, -5.5, 5.5], box:[-29, 29, -7.5, 7.5], obstacles:SIAM_OBS, fog:0xd5e6f3,
    sky:['#3f8fe0','#86c3f2','#cfe6f7','#eef5fb'], build:buildSiam, inside:rectInside(30, 8), pushOut:rectPush(30, 8),
    fx:() => {
      const u = STAGE.group.userData;
      for (const c of u.cars){ c.position.x += c.userData.sp*c.userData.dir; if (c.position.x > 170) c.position.x = -170; if (c.position.x < -170) c.position.x = 170; }
      u.train.position.x += .45; if (u.train.position.x > 150) u.train.position.x = -190;
    }},
  gvg:{name:'สนามกิลวอ', fallText:'ตกคูเมือง', water:0x3a6f8f, fallY:-4.5, wallBottom:-4.2, camX:44, orbit:82,
    preview:new V(0, 0, 9), spawn:[-42, 42, -14, 14], box:[-45, 45, -17, 17], obstacles:GVG_OBS, fog:0xcfe0ee, fogFar:260, shadow:[60, 34],
    sky:['#3f7fd0','#8fc0ec','#d6e9f7','#f2f7fb'], build:buildGvG, inside:rectInside(GVG_W, GVG_D), pushOut:rectPush(GVG_W, GVG_D),
    fx:fr => { for (const c of STAGE.group.userData.flags) c.rotation.y = Math.sin(fr*.05 + c.position.z)*.25; }},
  halloween:{name:'ฮัลโลวีน', fallText:'ตกหุบผี', water:0x3b2550, fallY:-4, wallBottom:-3.2, camX:30, orbit:52,
    preview:new V(-8, 0, 3), spawn:[-28, 28, -10, 10], box:[-30, 30, -12, 12], obstacles:HALLOWEEN_OBS, fog:0x2a1a3f, fogNear:35, fogFar:150, noClouds:true,
    light:{sky:0x8a7fd8, ground:0x1d1030, hemi:.6, sun:0xb8c8ff, sunI:.6},
    sky:['#0d0820','#2a1546','#5a2a6a','#ff7a3a'], build:buildHalloween, inside:rectInside(HW_W, HW_D), pushOut:rectPush(HW_W, HW_D),
    fx:fr => {
      const u = STAGE.group.userData;
      for (const b of u.bats){ const d = b.userData; d.a += d.sp; b.position.set(Math.cos(d.a)*d.r, d.y + Math.sin(fr*.03 + d.r)*1.5, Math.sin(d.a)*d.r*.6); b.rotation.y = -d.a; for (const w of d.wings) w.rotation.x = Math.sin(fr*.5 + d.r)*.8; }
      if (fr % 12 === 0){ const o = HALLOWEEN_OBS[(fr/12 | 0) % 6]; emit(new V(o.x + (Math.random() - .5), 1.8, o.z), 1, 0x9fffd0, .3, .8, 70, 1.4, -.15, .7); }
      if (fr % 5 === 0) emit(new V(0, 4.6, 0), 1, 0xffa53a, .4, 1.2, 30, 1, -.4, .8);
    }},
  christmas:{name:'คริสต์มาส', fallText:'ตกหุบหิมะ', water:null, fallY:-8, wallBottom:-3.2, camX:32, orbit:60,
    preview:new V(-6, 0, 6), spawn:[-28, 28, -12, 12], box:[-32, 32, -15, 15], obstacles:XMAS_OBS, blocks:XMAS_BLOCKS, fog:0x9fb6d8, fogNear:60, fogFar:220, shadow:[44, 26], noClouds:true,
    light:{sky:0xdfe9ff, ground:0x5a6f9a, hemi:.8, sun:0xfff0dc, sunI:.75},
    sky:['#1d2a5a','#3f5a9a','#9fb6d8','#e9f1fb'], build:buildChristmas, inside:rectInside(XM_W, XM_D), pushOut:rectPush(XM_W, XM_D),
    fx:fr => {
      const u = STAGE.group.userData;
      if (fr % 8 === 0) u.bulbs.forEach((b, i) => { b.visible = ((fr >> 3) + i) % 3 !== 0; });
      for (let k = 0; k < 2; k++) emit(new V((Math.random() - .5)*XM_W*2.4, 16, (Math.random() - .5)*XM_D*2.4), 1, 0xffffff, .3, -.5, 260, .9, .35, .9);
    }},
  // slip: the floor is ice, so everyone accelerates slowly and slides on after letting go
  ice:{name:'ทะเลสาบน้ำแข็ง', fallText:'ตกน้ำเย็นจัด', water:0x1f6f9f, fallY:-4, wallBottom:-3.2, camX:28, orbit:54, slip:true,
    preview:new V(-6, 0, 4), spawn:[-25, 25, -9, 9], box:[-28, 28, -13, 13], obstacles:ICE_OBS, blocks:ICE_BLOCKS, fog:0x5fa3cc, fogNear:60, fogFar:220, shadow:[40, 26], noClouds:true,
    light:{sky:0xbfe0f5, ground:0x35607f, hemi:.7, sun:0xe8f4ff, sunI:.6},
    sky:['#07102b', '#123a68', '#2b8896', '#bfeaf5'], build:buildIce, inside:rectInside(ICE_W, ICE_D), pushOut:rectPush(ICE_W, ICE_D),
    fx:fr => {
      const u = STAGE.group.userData;
      u.aurora.forEach((m, i) => { m.position.x = (i - 1)*40 + Math.sin(fr*.004 + i*2)*14; m.material.opacity = .24 + Math.sin(fr*.02 + i*2)*.1; });
      u.penguins.forEach(p => { const d = p.userData; p.position.y = d.y0 + Math.abs(Math.sin(fr*.05 + d.ph))*.25; p.rotation.y = d.ry + Math.sin(fr*.01 + d.ph)*.6; });
      for (let k = 0; k < 2; k++) emit(new V((Math.random() - .5)*ICE_W*2.4, 15, (Math.random() - .5)*ICE_D*2.4), 1, 0xffffff, .3, -.5, 240, .8, .3, .9);
    }},
  // pads: standing on one restores padHeal health every third of a second
  hospital:{name:'โรงพยาบาล', fallText:'ตกลงห้องฉุกเฉิน', water:null, fallY:-10, wallBottom:-2.5, camX:25, orbit:52, pads:HOSP_PADS, padHeal:1.5,
    preview:new V(-8, 0, 3), spawn:[-24, 24, -9, 9], box:[-26, 26, -12, 12], obstacles:HOSP_OBS, blocks:HOSP_BLOCKS, fog:0xdcecf7, fogNear:70, fogFar:230, shadow:[40, 26],
    sky:['#4a9be0', '#8fc7f0', '#d3ebfa', '#f4fbff'], build:buildHospital, inside:rectInside(HP_W, HP_D), pushOut:rectPush(HP_W, HP_D),
    fx:fr => {
      const u = STAGE.group.userData;
      u.pads.forEach((p, i) => { p.userData.disc.material.opacity = .38 + Math.sin(fr*.06 + i*2)*.16; });
      u.siren.material.color.setHex((fr >> 4) % 2 ? 0xff3b30 : 0x5a1612);
      u.ambulances.forEach((a, i) => a.userData.lamp.material.color.setHex(((fr >> 3) + i) % 2 ? 0xff3b30 : 0x3a8bff));
    }},
  japan:{name:'เมืองญี่ปุ่นโบราณ', fallText:'ตกคูปราสาท', water:0x2f6f8f, fallY:-4.5, wallBottom:-4.2, camX:28, orbit:54,
    preview:new V(-6, 0, 4), spawn:[-25, 25, -9, 9], box:[-28, 28, -13, 13], obstacles:JP_OBS, blocks:JP_BLOCKS, fog:0xf2c6b4, fogNear:80, fogFar:260, shadow:[40, 26],
    light:{sky:0xffe2d0, ground:0x6f8a4f, hemi:.85, sun:0xffe6c8, sunI:.75},
    sky:['#3a3f7a', '#b3679a', '#f29b84', '#ffd9a8'], build:buildJapan, inside:rectInside(JP_W, JP_D), pushOut:rectPush(JP_W, JP_D),
    fx:fr => {
      const u = STAGE.group.userData;
      u.lanterns.forEach((l, i) => l.material.color.setHex(Math.sin(fr*.12 + i*1.7) > .85 ? 0xffa060 : 0xff5a3a));
      if (fr % 4 === 0) emit(new V((Math.random() - .5)*JP_W*2.2, 9, (Math.random() - .5)*JP_D*2.2), 1, Math.random() < .5 ? 0xffc0d8 : 0xffe0ec, .8, -.4, 160, 1, .25, .95);
    }},
  // walls: nobody can leave the island (no ring-outs); bushes: tall grass hides whoever stands in it
  skyisle:{name:'เกาะลอยฟ้า', fallText:'ตกเกาะ', water:null, fallY:-40, wallBottom:-3, camX:60, orbit:112, walls:[SI_W - .9, SI_D - .9], bushes:SI_BUSH,
    preview:new V(-6, 0, 6), spawn:[-55, 55, -33, 33], box:[-60, 60, -38, 38], obstacles:SI_OBS, blocks:SI_BLOCKS, fog:0xcfe6ff, fogNear:120, fogFar:420, shadow:[70, 46],
    light:{sky:0xeaf6ff, ground:0x6f9a5a, hemi:.85, sun:0xfff2d8, sunI:.85},
    sky:['#2f6fd0', '#6fb0f0', '#bfe2fa', '#f4fbff'], build:buildSkyIsland, inside:rectInside(SI_W, SI_D), pushOut:rectPush(SI_W, SI_D),
    fx:fr => { STAGE.group.userData.falls.forEach((f, i) => { f.material.opacity = .55 + Math.sin(fr*.2 + i)*.1; }); }},
  // lavaFall: falling in burns instead of splashing; the arena shrinks over time (stages/volcano.js, LAVA)
  volcano:{name:'ภูเขาไฟระเบิด', fallText:'ตกลาวา', water:null, lavaFall:true, fallY:-1.6, wallBottom:-1.4, camX:24, orbit:52,
    preview:new V(0, 0, 6), spawn:[-13, 13, -13, 13], box:[-22, 22, -22, 22], obstacles:VOL_OBS, fog:0x4a160c, fogNear:55, fogFar:210, shadow:[30, 30], noClouds:true,
    light:{sky:0xffb48a, ground:0xff5a1f, hemi:.75, sun:0xffc890, sunI:.7},
    sky:['#160404', '#3d0f08', '#8f2a12', '#ff7a32'], build:buildVolcano, inside:volInside, pushOut:volPush, fx:volcanoTick},
};
const STAGE_KEYS = Object.keys(STAGES);
const MODE_KEYS = ['ffa', 'team', 'boss', 'zombie'];
// The raid boss lives in its own mode and always fights on the Christmas stage (its walls and platforms are built around it)
const BOSS_STAGE = 'christmas';
const modeOf = v => MODE_KEYS.includes(v) ? v : 'ffa';
const stageFor = (stage, mode) => mode === 'boss' ? BOSS_STAGE : stage;
let STAGE = STAGES.titanic, STAGE_KEY = 'titanic';
function setStage(k){
  const key = STAGES[k] ? k : 'titanic', st = STAGES[key];
  if (st === STAGE) return;
  scene.remove(STAGE.group);
  STAGE = st; STAGE_KEY = key;
  if (!st.group){ st.group = st.build(); mergeMeshes(st.group, stageSkip(st.group)); }
  scene.add(st.group);
  FUNNELS = st.obstacles; SEA_Y = st.fallY; BLOCKS = st.blocks || [];
  sea.visible = st.water != null; sea.position.y = st.fallY;
  if (st.water != null) sea.material.color.setHex(st.water);
  if (!st.skyTex) st.skyTex = paintSky(st.sky);
  scene.background = st.skyTex; scene.fog.color.setHex(st.fog);
  scene.fog.near = st.fogNear || 50; scene.fog.far = st.fogFar || 170;
  const L = st.light || {sky:0xfff1e0, ground:0x4a6fa5, hemi:.75, sun:0xffe6c8, sunI:.9};
  hemi.color.setHex(L.sky); hemi.groundColor.setHex(L.ground); hemi.intensity = L.hemi;
  sun.color.setHex(L.sun); sun.intensity = L.sunI;
  renderer.shadowMap.needsUpdate = true;
  const [sx, sz] = st.shadow || [42, 28];
  Object.assign(sun.shadow.camera, {left:-sx, right:sx, top:sz, bottom:-sz, far:sx > 50 ? 140 : 90}); sun.shadow.camera.updateProjectionMatrix();
  for (const c of clouds) c.visible = !st.noClouds;
}

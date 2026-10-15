// Sky Brawl · stages/hospital.js — ด่านโรงพยาบาล
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Hospital: a cut-away ward with the open side toward the camera; green crosses on the floor heal ---------- */
const HP_W = 28, HP_D = 14;
const HOSP_OBS = [[-10, 0, .9, 'pillar'], [10, 0, .9, 'pillar'], [-20, 6, .45, 'iv'], [20, -6, .45, 'iv'], [0, -6, .75, 'cart'], [0, 7, .75, 'cart']].map(([x, z, r, kind]) => ({x, z, r, kind}));
const HOSP_PADS = [{x:-5, z:0, r:2.2}, {x:5, z:0, r:2.2}];
const HOSP_BLOCKS = [
  {x:-22, z:-9, hx:.95, hz:2.1, h:.9, kind:'bed'}, {x:-16, z:-9, hx:.95, hz:2.1, h:.9, kind:'bed'},
  {x:16, z:9, hx:.95, hz:2.1, h:.9, kind:'bed'}, {x:22, z:9, hx:.95, hz:2.1, h:.9, kind:'bed'},
  {x:-19, z:-5.2, hx:5, hz:.15, h:3.3, kind:'curtain'}, {x:19, z:5.2, hx:5, hz:.15, h:3.3, kind:'curtain'},
  {x:-6, z:10.5, hx:2.5, hz:.15, h:3.3, kind:'curtain'}, {x:6, z:-10.5, hx:2.5, hz:.15, h:3.3, kind:'curtain'},
  {x:13, z:-10.5, hx:3, hz:.9, h:1.1, kind:'desk'}, {x:-13, z:10.5, hx:3, hz:.9, h:1.1, kind:'desk'},
  // The room's three walls keep everyone inside; only the open side faces the camera and drops off
  {x:0, z:-HP_D - .5, hx:HP_W + 1.5, hz:.5, h:14, kind:'edge'},
  {x:-HP_W - .5, z:0, hx:.5, hz:HP_D + 1, h:14, kind:'edge'}, {x:HP_W + .5, z:0, hx:.5, hz:HP_D + 1, h:14, kind:'edge'},
];
function ecgTex(){
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const t = c.getContext('2d');
  t.fillStyle = '#04120c'; t.fillRect(0, 0, 256, 128);
  t.strokeStyle = 'rgba(60,200,120,.25)'; t.lineWidth = 1;
  for (let x = 0; x < 256; x += 16){ t.beginPath(); t.moveTo(x, 0); t.lineTo(x, 128); t.stroke(); }
  for (let y = 0; y < 128; y += 16){ t.beginPath(); t.moveTo(0, y); t.lineTo(256, y); t.stroke(); }
  t.strokeStyle = '#46ff9a'; t.lineWidth = 3; t.beginPath(); t.moveTo(0, 70);
  for (let k = 0, x = 0; k < 3; k++, x += 86){
    for (const [dx, y] of [[20, 70], [28, 66], [34, 70], [44, 70], [48, 98], [54, 22], [60, 84], [64, 70], [78, 70], [86, 60]]) t.lineTo(x + dx, y);
  }
  t.stroke();
  return new THREE.CanvasTexture(c);
}
function buildAmbulance(){
  const a = new THREE.Group(), white = toon(0xf7f9fb), red = toon(0xd8342c);
  const body = part(new THREE.BoxGeometry(4.6, 2.2, 2.2), white, 1.03); body.position.y = 1.7; a.add(body);
  const cab = part(new THREE.BoxGeometry(1.7, 1.6, 2.1), white, 1.03); cab.position.set(3.1, 1.4, 0); a.add(cab);
  const win = new THREE.Mesh(new THREE.BoxGeometry(.1, .8, 1.7), new THREE.MeshBasicMaterial({color:0x9fd8ff})); win.position.set(3.97, 1.7, 0); a.add(win);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.64, .35, 2.24), red); stripe.position.y = 1.2; a.add(stripe);
  for (const s of [-1, 1]){
    const v = new THREE.Mesh(new THREE.BoxGeometry(.2, 1.1, .35), red), h = new THREE.Mesh(new THREE.BoxGeometry(.2, .35, 1.1), red);
    v.position.set(0, 2, s*1.12); h.position.set(0, 2, s*1.12); a.add(v, h);
    for (const wx of [-1.4, 2.8]){ const w = part(new THREE.CylinderGeometry(.5, .5, .4, 12), toon(0x2b2f3a)); w.rotation.x = PI/2; w.position.set(wx, .5, s*1.05); a.add(w); }
  }
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(.5, .25, 1.6), new THREE.MeshBasicMaterial({color:0xff3b30})); lamp.position.set(3.1, 2.4, 0); a.add(lamp);
  a.userData = {lamp};
  return a;
}
function buildHospital(){
  const g = new THREE.Group(), W = HP_W, D = HP_D;
  const white = toon(0xf4f8fb), mint = toon(0xcfeee4);
  const tex = tileTex('#e6f3ee', '#c2e0d3', '95bfae', 4); tex.repeat.set(W/3, D/3);
  const top = new THREE.MeshToonMaterial({map:tex, gradientMap:gmap}), side = toon(0xe6eef2);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(W*2, 2.4, D*2), [side, side, top, side, side, side]); slab.position.y = -1.2; slab.receiveShadow = true; g.add(slab);
  for (const [x, z, w, d, c] of [[0, -3, W*2 - 1, .5, 0x3fbf8a], [0, 3, W*2 - 1, .5, 0x58b8e8]]){ const s = new THREE.Mesh(new THREE.BoxGeometry(w, .02, d), toon(c)); s.position.set(x, .012, z); g.add(s); }
  for (let x = -W + .6; x < W - .6; x += 1.4){ const s = new THREE.Mesh(new THREE.BoxGeometry(.7, .025, .8), toon((Math.round(x/1.4) % 2) ? 0xffc23a : 0x2b2f3a)); s.position.set(x, .014, D - .55); g.add(s); }
  // The floors of the building below the cut-away ward
  const wt = windowTex('#e8eef3', '#7fc4ee'); wt.repeat.set(10, 4);
  const low = new THREE.Mesh(new THREE.BoxGeometry(W*2 - 1, 22, D*2 - 1), new THREE.MeshToonMaterial({map:wt, gradientMap:gmap})); low.position.set(0, -13.4, -.5); g.add(low);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), toon(0x9aa3b0)); ground.rotation.x = -PI/2; ground.position.y = -24.6; g.add(ground);
  const drive = new THREE.Mesh(new THREE.PlaneGeometry(420, 14), toon(0x4a505c)); drive.rotation.x = -PI/2; drive.position.set(0, -24.5, D + 14); g.add(drive);
  const ambulances = [];
  for (let i = 0; i < 3; i++){ const a = buildAmbulance(); a.position.set(-26 + i*26, -24.5, D + 14); a.rotation.y = i % 2 ? PI : 0; g.add(a); ambulances.push(a); }
  // Walls: single-sided planes, so the camera can orbit behind them and still see in
  const wallMat = toon(0xf1f6f9), skirt = toon(0x58c8a0);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W*2 + 3, 15), wallMat); back.position.set(0, 7.5, -D); g.add(back);
  const sk = new THREE.Mesh(new THREE.PlaneGeometry(W*2 + 3, 1.2), skirt); sk.position.set(0, .6, -D + .02); g.add(sk);
  for (const s of [-1, 1]){
    const w = new THREE.Mesh(new THREE.PlaneGeometry(D*2 + 3, 15), wallMat); w.rotation.y = -s*PI/2; w.position.set(s*W, 7.5, 0); g.add(w);
    const k = new THREE.Mesh(new THREE.PlaneGeometry(D*2 + 3, 1.2), skirt); k.rotation.y = -s*PI/2; k.position.set(s*(W - .02), .6, 0); g.add(k);
    for (let z = -D + 4; z <= D - 3; z += 8){ const win = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.4), new THREE.MeshBasicMaterial({color:0xbfe6ff})); win.rotation.y = -s*PI/2; win.position.set(s*(W - .03), 8, z); g.add(win); }
  }
  for (let x = -W + 6; x <= W - 5; x += 9.5){
    if (Math.abs(x) < 8) continue;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.4), new THREE.MeshBasicMaterial({color:0xbfe6ff})); win.position.set(x, 9.5, -D + .03); g.add(win);
  }
  const disc = part(new THREE.CylinderGeometry(4.3, 4.3, .3, 28), toon(0xffffff)); disc.rotation.x = PI/2; disc.position.set(0, 9, -D + .2); g.add(disc);
  const crossMat = new THREE.MeshBasicMaterial({color:0xd8342c});
  const cv = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.4, .3), crossMat), ch = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.6, .3), crossMat);
  cv.position.set(0, 9, -D + .45); ch.position.copy(cv.position); g.add(cv, ch);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(15, 4.7), new THREE.MeshBasicMaterial({map:signTex('โรงพยาบาล', '#ffffff', '#d8342c')})); sign.position.set(0, 3.9, -D + .04); g.add(sign);
  const siren = new THREE.Mesh(SPH(.55), new THREE.MeshBasicMaterial({color:0xff3b30})); siren.position.set(0, 12.6, -D + .5); g.add(siren);
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.5), new THREE.MeshBasicMaterial({map:ecgTex()})); mon.position.set(-19, 6, -D + .04); g.add(mon);
  const monFrame = part(new THREE.BoxGeometry(7.4, 3.9, .15), toon(0x2b2f3a)); monFrame.position.set(-19, 6, -D + .0); g.add(monFrame);
  // Ward furniture
  for (const b of HOSP_BLOCKS){
    const w = b.hx*2, d = b.hz*2;
    if (b.kind === 'bed'){
      const fr = part(new THREE.BoxGeometry(w, .5, d), toon(0xcfd8e0), 1.03); fr.position.set(b.x, .25, b.z); g.add(fr);
      const mat = part(new THREE.BoxGeometry(w - .1, .3, d - .2), white); mat.position.set(b.x, .65, b.z); g.add(mat);
      const bl = new THREE.Mesh(new THREE.BoxGeometry(w - .06, .1, d*.62), toon(0x6fc4e8)); bl.position.set(b.x, .84, b.z + d*.17); g.add(bl);
      const pil = part(new THREE.BoxGeometry(w*.62, .16, .7), white); pil.position.set(b.x, .86, b.z - d/2 + .55); g.add(pil);
      const hd = part(new THREE.BoxGeometry(w, 1.1, .12), toon(0x9aa7b4)); hd.position.set(b.x, .8, b.z - d/2 - .02); g.add(hd);
    } else if (b.kind === 'curtain'){
      const along = w > d, half = along ? b.hx : b.hz;
      const rail = part(new THREE.BoxGeometry(w + .1, .12, d + .1), toon(0x9aa7b4)); rail.position.set(b.x, b.h + .06, b.z); g.add(rail);
      for (let k = -half + .45, i = 0; k < half; k += .9, i++){
        const f = part(new THREE.BoxGeometry(along ? .85 : .34, b.h, along ? .34 : .85), toon(i % 2 ? 0x9fd8c8 : 0x86c9b8)); f.position.set(b.x + (along ? k : 0), b.h/2, b.z + (along ? 0 : k)); g.add(f);
      }
    } else if (b.kind === 'desk'){
      const dk = part(new THREE.BoxGeometry(w, b.h, d), white, 1.03); dk.position.set(b.x, b.h/2, b.z); g.add(dk);
      const front = new THREE.Mesh(new THREE.BoxGeometry(w + .02, b.h*.55, d + .02), toon(0x58b8e8)); front.position.set(b.x, b.h*.3, b.z); g.add(front);
      const scr = part(new THREE.BoxGeometry(.9, .6, .08), toon(0x2b2f3a)); scr.position.set(b.x - 1, b.h + .45, b.z); g.add(scr);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(.78, .48, .02), new THREE.MeshBasicMaterial({color:0x9fe8ff})); glow.position.set(b.x - 1, b.h + .45, b.z + .05); g.add(glow);
    }
  }
  for (const o of HOSP_OBS){
    if (o.kind === 'pillar'){
      const p = part(new THREE.CylinderGeometry(.85, .9, 9, 14), white, 1.03); p.position.set(o.x, 4.5, o.z); g.add(p);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(.92, .92, .5, 14), skirt); band.position.set(o.x, 1.2, o.z); g.add(band);
    } else if (o.kind === 'iv'){
      const pole = part(new THREE.CylinderGeometry(.05, .05, 3.2, 8), toon(0xc9d2de)); pole.position.set(o.x, 1.6, o.z); g.add(pole);
      const bag = part(new THREE.BoxGeometry(.4, .6, .15), toon(0x9fd8ff)); bag.position.set(o.x, 3.1, o.z); g.add(bag);
      for (let i = 0; i < 4; i++){ const leg = part(new THREE.BoxGeometry(.7, .06, .08), toon(0x9aa7b4)); leg.position.set(o.x, .05, o.z); leg.rotation.y = i*PI/4 + .4; g.add(leg); }
    } else {
      const body = part(new THREE.BoxGeometry(1.3, .8, .9), toon(0xe6eef2), 1.04); body.position.set(o.x, .85, o.z); g.add(body);
      const dr = new THREE.Mesh(new THREE.BoxGeometry(1.32, .22, .92), toon(0x58b8e8)); dr.position.set(o.x, .85, o.z); g.add(dr);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const wh = part(new THREE.CylinderGeometry(.14, .14, .1, 8), toon(0x2b2f3a)); wh.rotation.x = PI/2; wh.position.set(o.x + sx*.5, .18, o.z + sz*.38); g.add(wh); }
      const kit = part(new THREE.BoxGeometry(.5, .3, .4), toon(0xd8342c)); kit.position.set(o.x, 1.4, o.z); g.add(kit);
    }
  }
  // Green healing crosses (animated, so kept out of the bake)
  const pads = [];
  for (const p of HOSP_PADS){
    const pad = new THREE.Group(); pad.position.set(p.x, .03, p.z);
    const disc2 = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, .03, 28), new THREE.MeshBasicMaterial({color:0x58e0a0, transparent:true, opacity:.5, depthWrite:false})); pad.add(disc2);
    const m = new THREE.MeshBasicMaterial({color:0xffffff}), a = new THREE.Mesh(new THREE.BoxGeometry(.7, .04, 2.6), m), b = new THREE.Mesh(new THREE.BoxGeometry(2.6, .04, .7), m);
    a.position.y = b.position.y = .03; pad.add(a, b);
    pad.userData = {disc:disc2}; g.add(pad); pads.push(pad);
  }
  // The city around
  const pal = ['#8fa6bd', '#a7b8c8', '#7f97ad', '#b4c3d1'];
  for (let i = 0; i < 12; i++){
    const w = 12 + (i*7 % 9), h = 20 + (i*13 % 28), d = 12 + (i*5 % 8), wt2 = windowTex(pal[i % 4], '#bfe0f5'); wt2.repeat.set(Math.max(1, Math.round(w/4)), Math.max(1, Math.round(h/8)));
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshToonMaterial({map:wt2, gradientMap:gmap}));
    const a = i/12*PI*2 + .2; m.position.set(Math.cos(a)*(95 + (i % 3)*14), -24.5 + h/2, Math.sin(a)*(80 + (i % 4)*10)); g.add(m);
  }
  g.userData = {pads, siren, ambulances};
  return g;
}
// Standing on a healing cross restores a little health, so the middle of the ward is worth fighting over
function healPads(){
  if (G.countdown > 30 || G.frame % 20 !== 0) return;
  for (const f of G.fighters){
    if (!alive(f) || f.state === 'ko' || !f.onGround || f.hp >= MAX_HP) continue;
    for (const p of STAGE.pads) if (Math.hypot(f.pos.x - p.x, f.pos.z - p.z) < p.r){
      f.hp = Math.min(MAX_HP, f.hp + STAGE.padHeal);
      emit(new V(f.pos.x, f.pos.y + .3, f.pos.z), 2, 0x6fe8a8, 1, 3, 26, 1.1, -1);
      if (f.isLocal && G.frame % 60 === 0) Sfx.play('heal', f.pos, .5);
      break;
    }
  }
}

// Sky Brawl · stages/temple-siam.js — ด่านวัดไทย + สยาม (และตัวช่วยวาดลายพื้น)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- More stages ---------- */
function tileTex(base, alt, line, n){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const t = c.getContext('2d'), sz = 256/n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){ t.fillStyle = (i + j) % 2 ? alt : base; t.fillRect(i*sz, j*sz, sz, sz); }
  t.strokeStyle = line; t.lineWidth = 3;
  for (let i = 0; i <= n; i++){ t.beginPath(); t.moveTo(i*sz, 0); t.lineTo(i*sz, 256); t.stroke(); t.beginPath(); t.moveTo(0, i*sz); t.lineTo(256, i*sz); t.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  return tex;
}
function gable(w, h, len, color){
  const sh = new THREE.Shape(); sh.moveTo(-w/2, 0); sh.lineTo(w/2, 0); sh.lineTo(0, h); sh.lineTo(-w/2, 0);
  const m = part(new THREE.ExtrudeGeometry(sh, {depth:len, bevelEnabled:false}), toon(color));
  m.rotation.y = PI/2; m.position.x = -len/2;
  return m;
}
const TEMPLE_OBS = [[-17, -8], [17, -8], [-17, 8], [17, 8]].map(([x, z]) => ({x, z, r:2.1}));
function buildTemple(){
  const g = new THREE.Group(), W = 25, D = 14;
  const tex = tileTex('#efe3cc', '#e2d0ae', '#c9b18a', 4); tex.repeat.set(W/4, D/4);
  const top = new THREE.MeshToonMaterial({map:tex, gradientMap:gmap}), wall = toon(0xf6f1e7), gold = toon(0xe0b13a);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W*2, 3, D*2), [wall, wall, top, wall, wall, wall]); base.position.y = -1.5; base.receiveShadow = true; g.add(base);
  const band = new THREE.Mesh(new THREE.BoxGeometry(W*2 + .3, .45, D*2 + .3), toon(0xa82828)); band.position.y = -2.4; g.add(band);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(W*2 + .2, .18, D*2 + .2), gold); trim.position.y = -.12; g.add(trim);
  // Low white balustrade with gold lotus-bud posts
  const seg = (x, z, len, alongX) => { const b = part(new THREE.BoxGeometry(alongX ? len : .3, .75, alongX ? .3 : len), wall); b.position.set(x, .375, z); g.add(b); };
  for (let x = -W + 2; x <= W - 2; x += 4){ seg(x, D - .15, 3.4, true); seg(x, -D + .15, 3.4, true); }
  for (let z = -D + 2; z <= D - 2; z += 4){ seg(W - .15, z, 3.4, false); seg(-W + .15, z, 3.4, false); }
  for (const [x, z] of [[W, D], [-W, D], [W, -D], [-W, -D]]){
    const p = part(new THREE.CylinderGeometry(.3, .35, 1.2, 10), wall); p.position.set(x*.994, .6, z*.99); g.add(p);
    const bud = part(new THREE.ConeGeometry(.28, .6, 10), gold); bud.position.set(x*.994, 1.5, z*.99); g.add(bud);
  }
  // Golden chedis are the cover on this stage
  for (const o of TEMPLE_OBS){
    const c = new THREE.Group();
    const b0 = part(new THREE.BoxGeometry(3.6, .8, 3.6), wall, 1.02); b0.position.y = .4; c.add(b0);
    const gm = toon(0xe8b730);
    for (const [rt, rb, h, y] of [[1.6, 1.7, .6, 1.1], [1.4, 1.5, .5, 1.6]]){ const m = part(new THREE.CylinderGeometry(rt, rb, h, 20), gm, 1.03); m.position.y = y; c.add(m); }
    const bell = part(SPH(1.3), gm, 1.03); bell.scale.y = 1.15; bell.position.y = 2.9; c.add(bell);
    for (let i = 0; i < 6; i++){ const r = part(new THREE.TorusGeometry(.55 - i*.07, .12, 8, 18), gm); r.rotation.x = PI/2; r.position.y = 4.4 + i*.28; c.add(r); }
    const spire = part(new THREE.ConeGeometry(.25, 2.4, 12), gm, 1.05); spire.position.y = 7.2; c.add(spire);
    c.position.set(o.x, 0, o.z); g.add(c);
  }
  // Ubosot (ordination hall) behind the terrace: stacked red roofs, green eaves, gold chofa and bai raka
  const ub = new THREE.Group(); ub.position.set(0, 0, -D - 13);
  const plat = part(new THREE.BoxGeometry(24, 3, 14), wall); plat.position.y = -1.5; ub.add(plat);
  const body = part(new THREE.BoxGeometry(18, 7, 9), toon(0xfaf6ee), 1.01); body.position.y = 3.5; ub.add(body);
  for (let i = 0; i < 6; i++){
    const col = part(new THREE.CylinderGeometry(.4, .45, 7, 12), wall, 1.04); col.position.set(-7.5 + i*3, 3.5, 5.2); ub.add(col);
    const cap = part(new THREE.BoxGeometry(1, .4, 1), gold); cap.position.set(-7.5 + i*3, 7.1, 5.2); ub.add(cap);
  }
  const frame = part(new THREE.BoxGeometry(3.6, 5, .2), gold); frame.position.set(0, 2.5, 4.55); ub.add(frame);
  const door = part(new THREE.BoxGeometry(3, 4.5, .3), toon(0x7a1e1e)); door.position.set(0, 2.25, 4.6); ub.add(door);
  for (const x of [-5, 5]){ const w = part(new THREE.BoxGeometry(1.4, 2, .3), toon(0x7a1e1e)); w.position.set(x, 3.6, 4.6); ub.add(w); }
  for (const [w, h, len, y, c] of [[13, 5.5, 22, 7, 0xb8282a], [10, 4.6, 18, 9.2, 0xd8542c], [7, 3.6, 13, 11.6, 0xb8282a]]){
    const eave = gable(w + 1.2, h*.82, len + .4, 0x2f8f5a); eave.position.y = y - .25; ub.add(eave);
    const roof = gable(w, h, len, c); roof.position.y = y; ub.add(roof);
    const a = Math.atan2(h, w/2), L = Math.hypot(w/2, h);
    for (const sx of [-1, 1]){
      const chofa = part(new THREE.ConeGeometry(.18, 1.6, 8), gold, 1.08); chofa.position.set(sx*(len/2 + .15), y + h + .5, 0); chofa.rotation.z = -sx*.5; ub.add(chofa);
      for (const sz of [-1, 1]){
        const raka = part(new THREE.BoxGeometry(.25, .3, L), gold); raka.position.set(sx*(len/2 + .15), y + h/2, sz*w/4); raka.rotation.x = sz === 1 ? a : PI - a; ub.add(raka);
      }
    }
  }
  g.add(ub);
  // Front stairs flanked by naga balustrades
  for (let k = 0; k < 5; k++){ const st = part(new THREE.BoxGeometry(6, .6, .9), wall); st.position.set(0, -.3 - k*.6, D + .45 + k*.9); g.add(st); }
  for (const sx of [-1, 1]){
    for (let i = 0; i < 8; i++){ const t = i/7, b = part(SPH(.38 - t*.12), toon(i % 2 ? 0xe0b13a : 0x2f8f5a)); b.position.set(sx*3.4, .3 - t*3, D + .3 + t*4.3); g.add(b); }
    const head = part(SPH(.55), gold, 1.06); head.position.set(sx*3.4, -1.6, D + 5); g.add(head);
    const crest = part(new THREE.ConeGeometry(.45, 1.2, 5), gold); crest.position.set(sx*3.4, -.8, D + 4.8); g.add(crest);
  }
  // Islands with trees, lotus pads on the pond
  for (const [x, z] of [[-36, -6], [36, -6], [-30, 22], [30, 22]]){
    const isl = part(new THREE.CylinderGeometry(4, 4.6, 1.2, 16), toon(0x6bbf4f)); isl.position.set(x, -3.4, z); g.add(isl);
    const trunk = part(new THREE.CylinderGeometry(.5, .8, 6, 10), toon(0x6b4a2e)); trunk.position.set(x, 0, z); g.add(trunk);
    for (let i = 0; i < 4; i++){ const leaf = part(SPH(2.2 + Math.random()), toon(0x3f8f4a)); leaf.position.set(x + (Math.random() - .5)*3, 3.5 + Math.random()*2, z + (Math.random() - .5)*3); g.add(leaf); }
  }
  for (let i = 0; i < 70; i++){
    const a = Math.random()*PI*2, r = 22 + Math.random()*50, x = Math.cos(a)*r, z = Math.sin(a)*r;
    if (Math.abs(x) < 28 && Math.abs(z) < 21) continue;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(.6 + Math.random()*.7, .6, .06, 14), toon(0x4f9a3c)); pad.position.set(x, -3.05, z); g.add(pad);
    if (i % 3 === 0){ const fl = new THREE.Mesh(new THREE.ConeGeometry(.28, .5, 8), toon(0xff8fb5)); fl.position.set(x, -2.75, z); g.add(fl); }
  }
  return g;
}
const SIAM_OBS = [[-21, 0, 'lamp'], [-7, 0, 'lamp'], [7, 0, 'lamp'], [21, 0, 'lamp'], [-14, 4.5, 'pot'], [-14, -4.5, 'pot'], [14, 4.5, 'pot'], [14, -4.5, 'pot']]
  .map(([x, z, kind]) => ({x, z, kind, r:kind === 'lamp' ? .8 : 1}));
function windowTex(base, win){
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const t = c.getContext('2d'); t.fillStyle = base; t.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 128; y += 16) for (let x = 4; x < 64; x += 15){ t.fillStyle = Math.random() < .25 ? '#fff6c9' : win; t.fillRect(x, y, 10, 10); }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function signTex(text, bg, fg){
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const t = c.getContext('2d'); t.fillStyle = bg; t.fillRect(0, 0, 512, 160);
  t.fillStyle = fg; t.font = 'bold 104px Kanit, Tahoma, sans-serif'; t.textAlign = 'center'; t.textBaseline = 'middle'; t.fillText(text, 256, 86);
  return new THREE.CanvasTexture(c);
}
function buildSiam(){
  const g = new THREE.Group(), W = 30, D = 8;
  const tex = tileTex('#d3d7dd', '#c8cdd4', '#aeb4bd', 4); tex.repeat.set(W/3, D/3);
  const top = new THREE.MeshToonMaterial({map:tex, gradientMap:gmap}), side = toon(0x9aa3b5), concrete = toon(0xb7bcc4);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(W*2, 1.2, D*2), [side, side, top, side, side, side]); slab.position.y = -.6; slab.receiveShadow = true; g.add(slab);
  for (const sz of [-1, 1]){ const strip = new THREE.Mesh(new THREE.BoxGeometry(W*2 - 1, .02, .4), toon(0xffc23a)); strip.position.set(0, .01, sz*(D - 1.1)); g.add(strip); }
  // Glass railing on all four sides
  const glass = new THREE.MeshBasicMaterial({color:0x9fd8ff, transparent:true, opacity:.3, depthWrite:false}), steel = toon(0xc9d2de);
  const edge = (w, d, x, z) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1, d), glass); p.position.set(x, .55, z); g.add(p);
    const r = part(new THREE.BoxGeometry(w + .1, .1, d + .1), steel); r.position.set(x, 1.12, z); g.add(r);
  };
  edge(W*2, .08, 0, D - .04); edge(W*2, .08, 0, -D + .04); edge(.08, D*2, W - .04, 0); edge(.08, D*2, -W + .04, 0);
  for (const x of [-24, -8, 8, 24]){ const c = part(new THREE.CylinderGeometry(1.2, 1.4, 11, 16), concrete); c.position.set(x, -6.7, 0); g.add(c); }
  for (const o of SIAM_OBS){
    if (o.kind === 'lamp'){
      const p = part(new THREE.CylinderGeometry(.35, .45, 5, 12), toon(0x5a5f6b), 1.05); p.position.set(o.x, 2.5, o.z); g.add(p);
      const head = part(new THREE.BoxGeometry(1.4, .3, .6), toon(0x2b2f3a)); head.position.set(o.x, 5.1, o.z); g.add(head);
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(1.1, .1, .4), new THREE.MeshBasicMaterial({color:0xfff6c9})); bulb.position.set(o.x, 4.94, o.z); g.add(bulb);
    } else {
      const pot = part(new THREE.CylinderGeometry(.9, .75, .9, 16), toon(0xe9dcc4), 1.04); pot.position.set(o.x, .45, o.z); g.add(pot);
      const bush = part(SPH(.85), toon(0x3fbf5a), 1.04); bush.position.set(o.x, 1.3, o.z); g.add(bush);
    }
  }
  // Street below, with Bangkok-coloured taxis
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), toon(0x8a8f99)); ground.rotation.x = -PI/2; ground.position.y = -12.15; g.add(ground);
  const rc = document.createElement('canvas'); rc.width = rc.height = 256;
  const rt = rc.getContext('2d'); rt.fillStyle = '#3a3f4b'; rt.fillRect(0, 0, 256, 256);
  rt.fillStyle = '#f4f1ea'; for (let x = 0; x < 256; x += 64) rt.fillRect(x, 126, 34, 4);
  rt.fillStyle = '#ffc23a'; rt.fillRect(0, 0, 256, 4); rt.fillRect(0, 252, 256, 4);
  const rtex = new THREE.CanvasTexture(rc); rtex.wrapS = rtex.wrapT = THREE.RepeatWrapping; rtex.repeat.set(28, 1);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(420, 28), new THREE.MeshToonMaterial({map:rtex, gradientMap:gmap})); road.rotation.x = -PI/2; road.position.y = -12.1; g.add(road);
  const cars = [], carCols = [0xff5d8f, 0x3fbf5a, 0xffc23a, 0x2f8cff, 0xf4f4f4, 0xff5d8f];
  for (let i = 0; i < 12; i++){
    const c = new THREE.Group();
    const bodyM = part(new THREE.BoxGeometry(3.6, 1, 1.7), toon(carCols[i % carCols.length]), 1.04); bodyM.position.y = .5; c.add(bodyM);
    const cab = part(new THREE.BoxGeometry(2, .8, 1.5), toon(0x2b2f3a)); cab.position.set(-.2, 1.3, 0); c.add(cab);
    const lane = [-10, -4, 4, 10][i % 4];
    c.position.set(-150 + i*27, -12.1, lane);
    c.userData = {dir:lane < 0 ? 1 : -1, sp:.2 + Math.random()*.2};
    if (c.userData.dir < 0) c.rotation.y = PI;
    g.add(c); cars.push(c);
  }
  // Elevated rail line and a passing train
  const beam = new THREE.Mesh(new THREE.BoxGeometry(420, 1.4, 3), concrete); beam.position.set(0, 1.2, -17); g.add(beam);
  for (let x = -192; x <= 192; x += 24){ const p = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1, 13, 10), concrete); p.position.set(x, -5.2, -17); g.add(p); }
  const train = new THREE.Group();
  for (let i = 0; i < 4; i++){
    const car = new THREE.Group();
    car.add(part(new THREE.BoxGeometry(10, 3, 2.8), toon(0xf4f4f4), 1.02));
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(10.05, .35, 2.85), toon(0x2f8cff)); s1.position.y = -.6; car.add(s1);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(10.05, .2, 2.85), toon(0x3fbf5a)); s2.position.y = -1; car.add(s2);
    const win = new THREE.Mesh(new THREE.BoxGeometry(9, .9, 2.9), toon(0x2b3a55)); win.position.y = .5; car.add(win);
    car.position.x = i*10.6; train.add(car);
  }
  train.position.set(-140, 3.4, -17); g.add(train);
  // City blocks around the square, kept outside the menu camera's orbit
  const pal = ['#5b7fa6', '#7a8fa8', '#4f6d8f', '#8a7fa8', '#6b8f8a'];
  for (let i = 0; i < 20; i++){
    const w = 12 + Math.random()*14, h = 24 + Math.random()*45, d = 12 + Math.random()*10;
    const wt = windowTex(pal[i % pal.length], '#9fd8ff'); wt.repeat.set(Math.max(1, Math.round(w/4)), Math.max(1, Math.round(h/8)));
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshToonMaterial({map:wt, gradientMap:gmap}));
    const sideI = i % 3; let x, z;
    if (sideI === 0){ x = -100 + (i/3|0)*30; z = -52 - Math.random()*12; }
    else if (sideI === 1){ x = -95 + (i/3|0)*30; z = 54 + Math.random()*12; }
    else { x = (i % 2 ? 1 : -1)*(64 + Math.random()*10); z = -20 + Math.random()*40; }
    m.position.set(x, -12 + h/2, z); g.add(m);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(26, 8), new THREE.MeshBasicMaterial({map:signTex('สยาม', '#ff5d8f', '#ffffff')}));
  sign.position.set(0, 22, -50); g.add(sign);
  const pole = new THREE.Mesh(new THREE.BoxGeometry(1, 34, 1), concrete); pole.position.set(0, 2, -50.6); g.add(pole);
  g.userData = {cars, train};
  return g;
}

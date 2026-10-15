// Sky Brawl · stages/ice.js — ด่านทะเลสาบน้ำแข็ง
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Ice lake: a slippery frozen lake with crystal pillars, ice ridges and walls to fight around ---------- */
const ICE_W = 30, ICE_D = 15;
const ICE_OBS = [[-16, -6, 1.1], [16, 6, 1.1], [-8, 8, 1.1], [8, -8, 1.1], [0, 0, 1.6]].map(([x, z, r]) => ({x, z, r}));
// Low ridges (h 1.2) you can climb, tall ice walls (h 3) to hide behind
const ICE_BLOCKS = [
  {x:-23, z:-9, hx:4, hz:1.2, h:1.2, kind:'ridge'}, {x:23, z:9, hx:4, hz:1.2, h:1.2, kind:'ridge'},
  {x:-25, z:5, hx:.6, hz:3.2, h:3, kind:'wall'}, {x:25, z:-5, hx:.6, hz:3.2, h:3, kind:'wall'},
  {x:-6, z:-11.5, hx:3, hz:.6, h:3, kind:'wall'}, {x:6, z:11.5, hx:3, hz:.6, h:3, kind:'wall'},
];
function iceTex(){
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const t = c.getContext('2d'), gr = t.createLinearGradient(0, 0, 512, 512);
  gr.addColorStop(0, '#a4dcf2'); gr.addColorStop(.5, '#6cbde3'); gr.addColorStop(1, '#92d3ee');
  t.fillStyle = gr; t.fillRect(0, 0, 512, 512);
  const crack = (n, col, w, seg) => {
    t.strokeStyle = col; t.lineWidth = w;
    for (let i = 0; i < n; i++){
      let x = Math.random()*512, y = Math.random()*512, a = Math.random()*PI*2;
      t.beginPath(); t.moveTo(x, y);
      for (let k = 0; k < 6; k++){ a += (Math.random() - .5)*1.2; x += Math.cos(a)*(seg + Math.random()*seg*1.6); y += Math.sin(a)*(seg + Math.random()*seg*1.6); t.lineTo(x, y); }
      t.stroke();
    }
  };
  crack(16, 'rgba(255,255,255,.9)', 2.5, 20); crack(30, 'rgba(110,185,220,.55)', 1, 14);
  t.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < 70; i++){ const s = 1 + Math.random()*1.6; t.fillRect(Math.random()*512, Math.random()*512, s, s); }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  return tex;
}
function buildPenguin(){
  const p = new THREE.Group(), dark = toon(0x1d2433), orange = toon(0xffa53a);
  const body = part(SPH(.6), dark, 1.05); body.scale.set(1, 1.3, .9); body.position.y = .8; p.add(body);
  const belly = new THREE.Mesh(SPH(.45), toon(0xf4f8ff)); belly.scale.set(.9, 1.15, .6); belly.position.set(0, .75, .33); p.add(belly);
  const head = part(SPH(.4), dark, 1.05); head.position.y = 1.78; p.add(head);
  const beak = part(new THREE.ConeGeometry(.13, .34, 6), orange); beak.rotation.x = PI/2; beak.position.set(0, 1.72, .44); p.add(beak);
  for (const s of [-1, 1]){
    const eye = new THREE.Mesh(SPH(.07), new THREE.MeshBasicMaterial({color:0xffffff})); eye.position.set(s*.17, 1.9, .34); p.add(eye);
    const fl = part(new THREE.BoxGeometry(.12, .7, .34), dark); fl.position.set(s*.62, .9, 0); fl.rotation.z = -s*.35; p.add(fl);
    const ft = part(new THREE.BoxGeometry(.3, .08, .46), orange); ft.position.set(s*.22, .04, .14); p.add(ft);
  }
  return p;
}
function buildIce(){
  const g = new THREE.Group(), W = ICE_W, D = ICE_D;
  const tex = iceTex(); tex.repeat.set(W/10, D/10);
  const top = new THREE.MeshToonMaterial({map:tex, gradientMap:gmap}), side = toon(0x4f9fcb), frost = toon(0xeaf8ff);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W*2, 3, D*2), [side, side, top, side, side, side]); base.position.y = -1.5; base.receiveShadow = true; g.add(base);
  // A jagged icy keel with icicles hanging off the rim
  const keel = part(new THREE.CylinderGeometry(D*1.3, D*.45, 11, 9), toon(0x6cbbe0)); keel.scale.x = W/D*.92; keel.position.y = -8.5; g.add(keel);
  for (let i = 0; i < 22; i++){
    const a = i/22*PI*2, ic = part(new THREE.ConeGeometry(1 + (i % 3)*.5, 5 + (i % 4)*1.6, 6), toon(0xcdeefc));
    ic.rotation.x = PI; ic.position.set(Math.cos(a)*W*.9, -5.5 - (i % 4)*.6, Math.sin(a)*D*.9); g.add(ic);
  }
  for (const [x, z, w, d] of [[0, D - .3, W*2, .6], [0, -D + .3, W*2, .6], [W - .3, 0, .6, D*2], [-W + .3, 0, .6, D*2]]){
    const r = part(new THREE.BoxGeometry(w, .35, d), frost); r.position.set(x, .12, z); g.add(r);
  }
  // Crystal pillars (the round obstacles)
  for (const o of ICE_OBS){
    const c = new THREE.Group(), h = o.r > 1.3 ? 6.5 : 4.6;
    const body = part(new THREE.CylinderGeometry(o.r*.65, o.r, h, 6), toon(0x8fdcff), 1.04); body.position.y = h/2; c.add(body);
    const tip = part(new THREE.ConeGeometry(o.r*.65, 1.8, 6), toon(0xbdf0ff), 1.04); tip.position.y = h + .9; c.add(tip);
    for (let i = 0; i < 3; i++){
      const a = i*2.1 + o.x, s = part(new THREE.ConeGeometry(o.r*.3, 1.6 + i*.4, 5), toon(0xa6e6ff));
      s.position.set(Math.cos(a)*o.r*.9, .7, Math.sin(a)*o.r*.9); s.rotation.set(Math.sin(a)*.5, 0, -Math.cos(a)*.5); c.add(s);
    }
    c.position.set(o.x, 0, o.z); g.add(c);
  }
  // Ice ridges and walls (the blocks)
  for (const b of ICE_BLOCKS){
    const w = b.hx*2, d = b.hz*2, wall = b.kind === 'wall';
    const m = part(new THREE.BoxGeometry(w, b.h, d), toon(wall ? 0xcdeffc : 0xb6e4f6), 1.02); m.position.set(b.x, b.h/2, b.z); g.add(m);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + .1, .18, d + .1), toon(0xffffff)); cap.position.set(b.x, b.h + .05, b.z); g.add(cap);
    if (wall){
      const along = w > d, half = along ? b.hx : b.hz;
      for (let k = -half + .6; k < half; k += 1.2){
        const sp = part(new THREE.ConeGeometry(.38, 1 + (Math.abs(k*7) % 3)*.3, 5), toon(0xe8f8ff)); sp.position.set(b.x + (along ? k : 0), b.h + .5, b.z + (along ? 0 : k)); g.add(sp);
      }
    }
  }
  // Floes with penguins, drifting ice and far icebergs in the water around the lake
  const penguins = [];
  for (let i = 0; i < 12; i++){
    const a = i/12*PI*2 + .3, x = Math.cos(a)*(46 + (i % 3)*12), z = Math.sin(a)*(30 + (i % 4)*8) - 4, sz = 3 + (i % 3);
    const floe = part(new THREE.CylinderGeometry(sz, sz + .6, 1.4, 7), toon(0xe4f6ff)); floe.position.set(x, -4, z); g.add(floe);
    if (i % 2 === 0){
      const p = buildPenguin(); p.scale.setScalar(1.3); p.position.set(x, -3.3, z);
      p.userData = {ph:i*.9, y0:-3.3, ry:a + PI}; g.add(p); penguins.push(p);
    }
  }
  for (let i = 0; i < 6; i++){
    const geo = new THREE.IcosahedronGeometry(14 + (i % 3)*4, 1), p = geo.attributes.position;
    for (let j = 0; j < p.count; j++){ const k = .8 + Math.random()*.4; p.setXYZ(j, p.getX(j)*k, p.getY(j)*k*1.3, p.getZ(j)*k); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, toon(0xe4f6ff)); const a = i/6*PI*2 + .6; m.position.set(Math.cos(a)*120, -6, Math.sin(a)*100 - 20); g.add(m);
  }
  // Northern lights and stars
  const aurora = [];
  for (let i = 0; i < 3; i++){
    const geo = new THREE.PlaneGeometry(150, 26, 30, 1), p = geo.attributes.position;
    for (let j = 0; j < p.count; j++) p.setZ(j, Math.sin(p.getX(j)*.05 + i)*10);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:[0x4dffb8, 0x6f8dff, 0xb36bff][i], transparent:true, opacity:.28, side:THREE.DoubleSide, depthWrite:false, fog:false}));
    m.position.set((i - 1)*40, 52 + i*5, -105 - i*12); m.rotation.x = -.15; g.add(m); aurora.push(m);
  }
  const sp = new Float32Array(360*3);
  for (let i = 0; i < 360; i++){ const a = Math.random()*PI*2, e = .15 + Math.random()*1.1, r = 300; sp[i*3] = Math.cos(a)*Math.cos(e)*r; sp[i*3 + 1] = Math.sin(e)*r*.6 + 20; sp[i*3 + 2] = Math.sin(a)*Math.cos(e)*r - 40; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  g.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xffffff, size:1.6, sizeAttenuation:false, fog:false})));
  g.userData = {aurora, penguins};
  return g;
}

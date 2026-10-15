// Sky Brawl · stages/skyisle.js — ด่านเกาะลอยฟ้า 128 คน
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Sky island: a big floating island for up to 128 fighters and guild wars. Nobody falls off (STAGE.walls keeps
   everyone on the grass); fights are won by knock-outs. Terraced hills give ranged classes high ground, ruined walls
   block shots, and tall grass hides whoever stands in it from everyone further than a few steps away. ---------- */
const SI_W = 62, SI_D = 40;
// Round obstacles: the giant tree in the middle and small woods
const SI_OBS = [[0, 0, 2.6, 'big'],
  [-20, -30, .9], [-23, -27, .9], [-18, -25, .9], [20, 30, .9], [23, 27, .9], [18, 25, .9],
  [-46, 30, .9], [-50, 27, .9], [46, -30, .9], [50, -27, .9], [-8, 16, .9], [8, -16, .9]].map(([x, z, r, kind]) => ({x, z, r, kind}));
// Terraced hills (3 steps, each about one jump high) and ruined walls that stop shots
const SI_HILLS = [[-32, -22], [32, 22], [-32, 22], [32, -22], [0, -31], [0, 31]];
const SI_BLOCKS = [];
for (const [x, z] of SI_HILLS){
  SI_BLOCKS.push({x, z, hx:6, hz:4.5, h:.9, kind:'hill'}, {x, z, hx:4, hz:3, h:1.8, kind:'hill'}, {x, z, hx:2.2, hz:1.8, h:2.7, kind:'hill'});
}
for (const [x, z, hx, hz] of [[-14, -11, 3.5, .5], [-17, -8, .5, 3.5], [14, 11, 3.5, .5], [17, 8, .5, 3.5], [-14, 11, 3.5, .5], [14, -11, 3.5, .5],
  [-44, -6, .5, 4], [44, 6, .5, 4], [-44, 12, 3, .5], [44, -12, 3, .5]]) SI_BLOCKS.push({x, z, hx, hz, h:3.4, kind:'ruin'});
// Tall grass: standing inside hides you from anyone more than SI_HIDE squares away
const SI_BUSH = [[-24, 4, 4, 3], [24, -4, 4, 3], [-12, -20, 4, 2.5], [12, 20, 4, 2.5], [-52, -14, 3, 5], [52, 14, 3, 5], [-36, 2, 3, 3], [36, -2, 3, 3]]
  .map(([x, z, hx, hz]) => ({x, z, hx, hz}));
const SI_HIDE = 4;
const inBush = f => !!STAGE.bushes && f.pos.y < 1 && STAGE.bushes.some(b => Math.abs(f.pos.x - b.x) < b.hx && Math.abs(f.pos.z - b.z) < b.hz);
function siTex(){
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const t = c.getContext('2d');
  t.fillStyle = '#6fb04a'; t.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++){ t.fillStyle = ['rgba(60,120,40,.35)', 'rgba(150,210,90,.3)', 'rgba(90,150,50,.3)'][i % 3]; const s = 2 + Math.random()*5; t.fillRect(Math.random()*512, Math.random()*512, s, s); }
  for (let i = 0; i < 40; i++){ t.fillStyle = ['#fff6a8', '#ffffff', '#ffb3c8'][i % 3]; t.fillRect(Math.random()*512, Math.random()*512, 4, 4); }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  return tex;
}
function siTree(s, leaf){
  const g = new THREE.Group();
  const trunk = part(new THREE.BoxGeometry(.7*s, 3*s, .7*s), toon(0x6b4a32), 1.03); trunk.position.y = 1.5*s; g.add(trunk);
  for (const [x, y, z, w] of [[0, 3.6, 0, 3], [.9, 3, .4, 1.8], [-.8, 3.1, -.5, 1.9], [0, 4.6, -.2, 1.8]]){
    const b = part(new THREE.BoxGeometry(w*s, w*s*.8, w*s), toon(leaf), 1.03); b.position.set(x*s, y*s, z*s); g.add(b);
  }
  return g;
}
function buildSkyIsland(){
  const g = new THREE.Group(), W = SI_W, D = SI_D;
  const tex = siTex(); tex.repeat.set(W/10, D/10);
  const top = new THREE.MeshToonMaterial({map:tex, gradientMap:gmap}), dirt = toon(0x8a6040), rock = toon(0x7d7a86);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(W*2, 3, D*2), [dirt, dirt, top, dirt, dirt, dirt]); slab.position.y = -1.5; slab.receiveShadow = true; g.add(slab);
  // The rocky underside, tapering down into the clouds
  for (let i = 0; i < 4; i++){
    const k = 1 - i*.22, m = part(new THREE.BoxGeometry(W*2*k, 5, D*2*k), i % 2 ? rock : dirt); m.position.y = -5.5 - i*5; g.add(m);
  }
  for (let i = 0; i < 14; i++){
    const a = i/14*PI*2, r = new THREE.Mesh(new THREE.BoxGeometry(6, 9 + (i % 3)*4, 6), rock);
    r.position.set(Math.cos(a)*W*.8, -14 - (i % 3)*3, Math.sin(a)*D*.8); g.add(r);
  }
  // A low stone rim marks the edge (the real stop is STAGE.walls)
  for (const [x, z, w, d] of [[0, D - .4, W*2, .8], [0, -D + .4, W*2, .8], [W - .4, 0, .8, D*2], [-W + .4, 0, .8, D*2]]){
    const r = part(new THREE.BoxGeometry(w, 1.1, d), toon(0xb8b2a6), 1.02); r.position.set(x, .55, z); g.add(r);
  }
  for (let x = -W + 3; x < W; x += 6) for (const z of [D - .4, -D + .4]){ const p = part(new THREE.BoxGeometry(.9, 1.7, .9), toon(0xa39d90)); p.position.set(x, .85, z); g.add(p); }
  for (let z = -D + 3; z < D; z += 6) for (const x of [W - .4, -W + .4]){ const p = part(new THREE.BoxGeometry(.9, 1.7, .9), toon(0xa39d90)); p.position.set(x, .85, z); g.add(p); }
  // Dirt paths from the middle to both bases
  for (const [x, z, w, d] of [[0, 0, W*1.6, 3.2], [0, 0, 3.2, D*1.5]]){ const p = new THREE.Mesh(new THREE.BoxGeometry(w, .03, d), toon(0xc9a46a)); p.position.set(x, .02, z); g.add(p); }
  // Obstacles: the great tree and small woods
  for (const o of SI_OBS){ const t = o.kind === 'big' ? siTree(2.6, 0x3f9a3a) : siTree(1, [0x4fae46, 0x3f9a3a, 0x67c04f][Math.abs(o.x*7 + o.z) % 3 | 0]); t.position.set(o.x, 0, o.z); g.add(t); }
  // Hills: grassy terraces with a dirt face
  const grass = toon(0x5fa548), face = toon(0x9a7048);
  for (const b of SI_BLOCKS){
    if (b.kind === 'hill'){
      const m = part(new THREE.BoxGeometry(b.hx*2, b.h, b.hz*2), face, 1.02); m.position.set(b.x, b.h/2, b.z); g.add(m);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(b.hx*2 + .05, .18, b.hz*2 + .05), grass); cap.position.set(b.x, b.h - .06, b.z); g.add(cap);
    } else {
      const m = part(new THREE.BoxGeometry(b.hx*2, b.h, b.hz*2), toon(0xa8a294), 1.02); m.position.set(b.x, b.h/2, b.z); g.add(m);
      const along = b.hx > b.hz, half = along ? b.hx : b.hz;
      for (let k = -half + .5; k < half; k += 1.4){ const c = part(new THREE.BoxGeometry(along ? .8 : b.hx*2 + .1, .6, along ? b.hz*2 + .1 : .8), toon(0x8f897c)); c.position.set(b.x + (along ? k : 0), b.h + .3, b.z + (along ? 0 : k)); g.add(c); }
      const moss = new THREE.Mesh(new THREE.BoxGeometry(b.hx*2 + .06, .5, b.hz*2 + .06), toon(0x5f8f3a)); moss.position.set(b.x, .25, b.z); g.add(moss);
    }
  }
  // Tall grass tufts
  for (const b of SI_BUSH){
    for (let x = -b.hx + .5; x < b.hx; x += 1) for (let z = -b.hz + .5; z < b.hz; z += 1){
      const h = 1.3 + ((x*13 + z*7) % 3 + 3) % 3*.2;
      const tuft = new THREE.Mesh(new THREE.BoxGeometry(.85, h, .85), toon([0x4c9a3a, 0x5aaa42, 0x3f8a34][((x + z)*3 % 3 + 3) % 3 | 0]));
      tuft.position.set(b.x + x, h/2, b.z + z); g.add(tuft);
    }
  }
  // Floating islets, waterfalls off the edge, clouds below
  for (let i = 0; i < 8; i++){
    const a = i/8*PI*2 + .3, isl = new THREE.Group();
    const top2 = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 6), toon(0x5fa548)); isl.add(top2);
    const under = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 4.5), rock); under.position.y = -2.5; isl.add(under);
    if (i % 2 === 0){ const t = siTree(.9, 0x4fae46); t.position.y = .6; isl.add(t); }
    isl.position.set(Math.cos(a)*(W + 30 + (i % 3)*10), 4 + (i % 4)*5, Math.sin(a)*(D + 26 + (i % 2)*12)); g.add(isl);
  }
  const falls = [];
  for (const [x, z, ry] of [[-W, -12, 0], [W, 14, PI], [20, -D, PI/2]]){
    const f = new THREE.Mesh(new THREE.BoxGeometry(.4, 30, 4), new THREE.MeshBasicMaterial({color:0xbfe8ff, transparent:true, opacity:.65, depthWrite:false}));
    f.position.set(x + (ry === 0 ? -.4 : ry === PI ? .4 : 0), -15, z + (ry === PI/2 ? -.4 : 0)); f.rotation.y = ry; g.add(f); falls.push(f);
  }
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshBasicMaterial({color:0xf4f8ff, transparent:true, opacity:.85, depthWrite:false}));
  sea.rotation.x = -PI/2; sea.position.y = -36; g.add(sea);
  g.userData = {falls};
  return g;
}

// Sky Brawl · stages/christmas.js — ด่านคริสต์มาส
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Christmas: a snowy town square with walls to hide behind and platforms to fight from ---------- */
const XM_W = 34, XM_D = 17;
const XMAS_OBS = [[-15, 0, .5, 'lamp'], [15, 0, .5, 'lamp'], [0, -14, .5, 'lamp'], [0, 14, .5, 'lamp']].map(([x, z, r, kind]) => ({x, z, r, kind}));
// Low platforms (h 1.4) with a step, tall snow walls (h 3) forming hiding corners, gift stacks (h 1.1)
const XMAS_BLOCKS = [
  {x:-21, z:-10, hx:4.5, hz:2.5, h:1.4, kind:'deck'}, {x:-21, z:-6.6, hx:1.2, hz:.9, h:.7, kind:'step'},
  {x:21, z:10, hx:4.5, hz:2.5, h:1.4, kind:'deck'}, {x:21, z:6.6, hx:1.2, hz:.9, h:.7, kind:'step'},
  {x:-28, z:8, hx:.5, hz:3.5, h:3, kind:'wall'}, {x:-25, z:11, hx:3, hz:.5, h:3, kind:'wall'},
  {x:28, z:-8, hx:.5, hz:3.5, h:3, kind:'wall'}, {x:25, z:-11, hx:3, hz:.5, h:3, kind:'wall'},
  {x:-8, z:11, hx:2.2, hz:.5, h:3, kind:'wall'}, {x:8, z:-11, hx:2.2, hz:.5, h:3, kind:'wall'},
  {x:-10, z:-12, hx:1, hz:1, h:1.1, kind:'gift'}, {x:10, z:12, hx:1, hz:1, h:1.1, kind:'gift'},
  {x:-30, z:-2, hx:1, hz:1, h:1.1, kind:'gift'}, {x:30, z:2, hx:1, hz:1, h:1.1, kind:'gift'},
];
function buildChristmas(){
  const g = new THREE.Group(), W = XM_W, D = XM_D;
  const tex = tileTex('#f4f8fc', '#e6eef7', '#c9d6e6', 4); tex.repeat.set(W/4, D/4);
  const top = new THREE.MeshToonMaterial({map:tex, gradientMap:gmap}), side = toon(0xd9e4f0), snow = toon(0xf7fbff);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W*2, 3, D*2), [side, side, top, side, side, side]); base.position.y = -1.5; base.receiveShadow = true; g.add(base);
  const cliff = part(new THREE.CylinderGeometry(D*1.25, D*.6, 12, 10), toon(0xbfcde0)); cliff.scale.x = W/D*.9; cliff.position.y = -9; g.add(cliff);
  // Candy-cane posts at the corners and along the edge
  for (const [x, z] of [[W - .5, D - .5], [-W + .5, D - .5], [W - .5, -D + .5], [-W + .5, -D + .5], [0, D - .5], [0, -D + .5], [W - .5, 0], [-W + .5, 0]]){
    for (let i = 0; i < 5; i++){ const seg = part(new THREE.CylinderGeometry(.16, .16, .3, 10), toon(i % 2 ? 0xffffff : 0xd8342c)); seg.position.set(x, .15 + i*.3, z); g.add(seg); }
    const hook = part(new THREE.TorusGeometry(.3, .16, 8, 12, PI), toon(0xd8342c)); hook.position.set(x + .3, 1.6, z); g.add(hook);
  }
  for (const b of XMAS_BLOCKS){
    const w = b.hx*2, d = b.hz*2;
    if (b.kind === 'deck' || b.kind === 'step'){
      const wood = part(new THREE.BoxGeometry(w, b.h, d), toon(0x9b6a3c), 1.02); wood.position.set(b.x, b.h/2, b.z); g.add(wood);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + .1, .14, d + .1), snow); cap.position.set(b.x, b.h + .03, b.z); g.add(cap);
      if (b.kind === 'deck') for (const sx of [-1, 1]) for (const sz of [-1, 1]){
        const post = part(new THREE.CylinderGeometry(.12, .12, 1.4, 8), toon(0x6b3f1e)); post.position.set(b.x + sx*(b.hx - .2), b.h + .7, b.z + sz*(b.hz - .2)); g.add(post);
      }
    } else if (b.kind === 'wall'){
      const wall = part(new THREE.BoxGeometry(w, b.h, d), toon(0xeaf2fb), 1.02); wall.position.set(b.x, b.h/2, b.z); g.add(wall);
      const along = w > d;
      for (let k = -(along ? b.hx : b.hz) + .5; k < (along ? b.hx : b.hz); k += 1){
        const lump = part(SPH(.42), snow); lump.scale.y = .6; lump.position.set(b.x + (along ? k : 0), b.h + .05, b.z + (along ? 0 : k)); g.add(lump);
      }
    } else {
      const cols = [0xd8342c, 0x3fbf5a, 0x2f8cff, 0xffc23a];
      const box = part(new THREE.BoxGeometry(w, b.h, d), toon(cols[(Math.abs(b.x) + Math.abs(b.z)) % 4 | 0]), 1.03); box.position.set(b.x, b.h/2, b.z); g.add(box);
      for (const rot of [0, PI/2]){ const rib = new THREE.Mesh(new THREE.BoxGeometry(w + .04, b.h + .04, .18), toon(0xffe066)); rib.position.set(b.x, b.h/2, b.z); rib.rotation.y = rot; g.add(rib); }
      const bow = part(new THREE.TorusGeometry(.22, .08, 6, 12), toon(0xffe066)); bow.position.set(b.x, b.h + .15, b.z); g.add(bow);
    }
  }
  for (const o of XMAS_OBS){
    const pole = part(new THREE.CylinderGeometry(.18, .24, 4, 10), toon(0x2b2f3a), 1.05); pole.position.set(o.x, 2, o.z); g.add(pole);
    const lamp = new THREE.Mesh(SPH(.4), new THREE.MeshBasicMaterial({color:0xfff1b8})); lamp.position.set(o.x, 4.2, o.z); g.add(lamp);
    const wreath = part(new THREE.TorusGeometry(.42, .14, 8, 16), toon(0x2f7a3a)); wreath.position.set(o.x, 3.2, o.z); wreath.rotation.y = Math.atan2(-o.x, -o.z); g.add(wreath);
  }
  // Giant tree and houses behind the square
  const tree = new THREE.Group(); tree.position.set(0, -2, -D - 12);
  const trunk = part(new THREE.CylinderGeometry(1.4, 1.8, 5, 10), toon(0x6b3f1e)); trunk.position.y = 2.5; tree.add(trunk);
  for (let i = 0; i < 5; i++){ const c = part(new THREE.ConeGeometry(9 - i*1.6, 7, 12), toon(i % 2 ? 0x2f7a3a : 0x3f8f4a), 1.02); c.position.y = 7 + i*4.2; tree.add(c); }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.6), new THREE.MeshBasicMaterial({color:0xffe066})); star.position.y = 28.5; tree.add(star);
  const baubles = [0xd8342c, 0xffc23a, 0x2f8cff, 0xff8fd6, 0xffffff];
  for (let i = 0; i < 46; i++){ const lv = i % 5, a = i*2.4, r = (8.4 - lv*1.6)*.75; const b = new THREE.Mesh(SPH(.38), new THREE.MeshBasicMaterial({color:baubles[i % 5]})); b.position.set(Math.cos(a)*r, 5.2 + lv*4.2 + (i % 3)*.6, Math.sin(a)*r); tree.add(b); }
  g.add(tree);
  for (let i = 0; i < 9; i++){
    const hx = -60 + i*15, hz = -D - 30 - (i % 2)*6, hh = 9 + (i % 3)*3;
    if (Math.abs(hx) < 12) continue;
    const h = part(new THREE.BoxGeometry(10, hh, 8), toon([0xb8423a, 0x6f8fb5, 0xe0c38a, 0x8a6fb5][i % 4])); h.position.set(hx, -4 + hh/2, hz); g.add(h);
    const roof = gable(11, 4, 9, 0xf7fbff); roof.position.set(hx, -4 + hh, hz); roof.rotation.y = 0; g.add(roof);
    for (const wx of [-2.5, 2.5]){ const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2, .2), new THREE.MeshBasicMaterial({color:0xffd27a})); w.position.set(hx + wx, -4 + hh*.55, hz + 4.05); g.add(w); }
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), toon(0xe8f0f8)); ground.rotation.x = -PI/2; ground.position.y = -15; g.add(ground);
  for (let i = 0; i < 40; i++){
    const a = Math.random()*PI*2, r = 60 + Math.random()*90;
    const pine = part(new THREE.ConeGeometry(3 + Math.random()*2, 9 + Math.random()*6, 8), toon(0x2f6b45)); pine.position.set(Math.cos(a)*r, -10, Math.sin(a)*r); g.add(pine);
  }
  // String lights over the square (animated, so kept out of the bake)
  const bulbs = [];
  for (let i = 0; i < 36; i++){
    const u = i/35, x = -W + 2 + u*(W*2 - 4), z = Math.sin(u*PI*4)*3;
    const bm = new THREE.Mesh(SPH(.18), new THREE.MeshBasicMaterial({color:baubles[i % 4]}));
    bm.position.set(x, 6.5 - Math.abs(Math.sin(u*PI*4))*1.2, z); g.add(bm); bulbs.push(bm);
  }
  g.userData = {bulbs};
  return g;
}

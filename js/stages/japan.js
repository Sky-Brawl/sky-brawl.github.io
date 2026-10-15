// Sky Brawl · stages/japan.js — ด่านเมืองญี่ปุ่นโบราณ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Ancient Japanese town: a stone-walled square over a moat; shops to hide behind, wooden stages to jump on,
   stone lanterns and cherry trees in the way, a torii, pagoda, castle and Mount Fuji behind, petals falling ---------- */
const JP_W = 30, JP_D = 15;
const JP_OBS = [[-11, -2, 1.1, 'tree'], [11, 2, 1.1, 'tree'], [-4, 8, .55, 'toro'], [4, -8, .55, 'toro'], [-19, 1, .55, 'toro'], [19, -1, .55, 'toro']].map(([x, z, r, kind]) => ({x, z, r, kind}));
const JP_BLOCKS = [
  {x:-22, z:-9.5, hx:3.5, hz:2.2, h:3.4, kind:'house'}, {x:22, z:9.5, hx:3.5, hz:2.2, h:3.4, kind:'house'},
  {x:0, z:-11.5, hx:3, hz:1.4, h:1.1, kind:'deck'}, {x:0, z:11.5, hx:3, hz:1.4, h:1.1, kind:'deck'},
];
function jpTex(){
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const t = c.getContext('2d');
  t.fillStyle = '#c9ad7f'; t.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++){ t.fillStyle = Math.random() < .5 ? 'rgba(120,90,50,.18)' : 'rgba(255,240,210,.2)'; const s = 1 + Math.random()*3; t.fillRect(Math.random()*512, Math.random()*512, s, s); }
  // A flagstone path across the middle
  for (let y = 176; y < 336; y += 40) for (let x = (y/40 % 2)*30 - 30; x < 512; x += 60){
    const g = 150 + Math.floor(Math.random()*30);
    t.fillStyle = `rgb(${g},${g - 4},${g - 12})`; t.fillRect(x + 3, y + 3, 54, 34);
    t.strokeStyle = 'rgba(70,60,50,.5)'; t.lineWidth = 2; t.strokeRect(x + 3, y + 3, 54, 34);
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  return tex;
}
function buildSakura(s){
  const g = new THREE.Group();
  const trunk = part(new THREE.CylinderGeometry(.28*s, .42*s, 3.2*s, 7), toon(0x5a3a2a), 1.04); trunk.position.y = 1.6*s; trunk.rotation.z = .08; g.add(trunk);
  for (const [x, y, z, r, c] of [[0, 3.9, 0, 1.9, 0xffb7d0], [1.3, 3.4, .4, 1.3, 0xffc9dc], [-1.2, 3.5, -.3, 1.4, 0xff9fc2], [.2, 4.6, -.6, 1.2, 0xffd6e5]]){
    const b = part(new THREE.IcosahedronGeometry(r*s, 1), toon(c), 1.03); b.position.set(x*s, y*s, z*s); g.add(b);
  }
  return g;
}
function buildToro(){
  const g = new THREE.Group(), stone = toon(0x9a958a), dark = toon(0x6f6b62);
  const base = part(new THREE.CylinderGeometry(.5, .6, .3, 6), dark, 1.05); base.position.y = .15; g.add(base);
  const post = part(new THREE.CylinderGeometry(.18, .22, 1.1, 6), stone, 1.05); post.position.y = .85; g.add(post);
  const tray = part(new THREE.CylinderGeometry(.48, .4, .2, 6), stone, 1.05); tray.position.y = 1.5; g.add(tray);
  const box = part(new THREE.BoxGeometry(.58, .5, .58), stone, 1.05); box.position.y = 1.85; g.add(box);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(.6, .26, .3), new THREE.MeshBasicMaterial({color:0xffd27a})); glow.position.y = 1.85; g.add(glow);
  const roof = part(new THREE.ConeGeometry(.65, .55, 6), dark, 1.05); roof.position.y = 2.38; g.add(roof);
  const knob = part(SPH(.12), dark); knob.position.y = 2.7; g.add(knob);
  return g;
}
// A two-storey shop with a dark tiled roof, a noren curtain and a paper lantern
function buildMachiya(w, d, h, face){
  const g = new THREE.Group(), wood = toon(0x6b4a32), plaster = toon(0xf1e6cf), roofC = toon(0x3a3f4b);
  const body = part(new THREE.BoxGeometry(w, h, d), plaster, 1.02); body.position.y = h/2; g.add(body);
  for (const x of [-w/2 + .1, -w/6, w/6, w/2 - .1]){ const p = part(new THREE.BoxGeometry(.2, h, .2), wood); p.position.set(x, h/2, d/2 + .02); g.add(p); }
  const beam = part(new THREE.BoxGeometry(w + .2, .25, .25), wood); beam.position.set(0, h*.55, d/2 + .05); g.add(beam);
  for (let x = -w/2 + .4; x < w/2 - .2; x += .32){ const s = part(new THREE.BoxGeometry(.08, h*.4, .06), wood); s.position.set(x, h*.28, d/2 + .06); g.add(s); }   // lattice
  const roof1 = part(new THREE.BoxGeometry(w + 1.2, .3, d + 1.2), roofC, 1.02); roof1.position.y = h*.58; roof1.rotation.x = .05; g.add(roof1);
  const roof2 = part(new THREE.CylinderGeometry(.01, Math.max(w, d)*.75, 1.4, 4), roofC, 1.02); roof2.rotation.y = PI/4; roof2.scale.set(w/Math.max(w, d), 1, d/Math.max(w, d)); roof2.position.y = h + .7; g.add(roof2);
  const noren = part(new THREE.BoxGeometry(w*.5, .7, .04), toon(0x2f4f8a)); noren.position.set(0, h*.42, d/2 + .3); g.add(noren);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .55, 10), new THREE.MeshBasicMaterial({color:0xff5a3a})); lantern.position.set(w/2 - .5, h*.45, d/2 + .45); g.add(lantern);
  g.rotation.y = face;
  return {g, lantern};
}
function buildJapan(){
  const g = new THREE.Group(), W = JP_W, D = JP_D, GY = -3.8;
  const tex = jpTex(); tex.repeat.set(W/12, D/12);
  const top = new THREE.MeshToonMaterial({map:tex, gradientMap:gmap}), stoneWall = toon(0x8f8a80);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W*2, 8, D*2), [stoneWall, stoneWall, top, stoneWall, stoneWall, stoneWall]); base.position.y = -4; base.receiveShadow = true; g.add(base);
  // Stone walls drop straight into the moat; a darker coping runs round the edge
  
  for (const [x, z, w, d] of [[0, D - .25, W*2, .5], [0, -D + .25, W*2, .5], [W - .25, 0, .5, D*2], [-W + .25, 0, .5, D*2]]){
    const r = part(new THREE.BoxGeometry(w, .3, d), toon(0x6f6b62)); r.position.set(x, .1, z); g.add(r);
  }
  const lanterns = [];
  // Cherry trees and stone lanterns (the round obstacles)
  for (const o of JP_OBS){
    const m = o.kind === 'tree' ? buildSakura(1.15) : buildToro();
    m.position.set(o.x, 0, o.z); g.add(m);
  }
  // Shops and wooden stages (the blocks)
  for (const b of JP_BLOCKS){
    if (b.kind === 'house'){ const {g:h, lantern} = buildMachiya(b.hx*2, b.hz*2, b.h, b.z < 0 ? 0 : PI); h.position.set(b.x, 0, b.z); g.add(h); lanterns.push(lantern); }
    else {
      const deck = part(new THREE.BoxGeometry(b.hx*2, b.h, b.hz*2), toon(0x8a5a35), 1.02); deck.position.set(b.x, b.h/2, b.z); g.add(deck);
      const plank = new THREE.Mesh(new THREE.BoxGeometry(b.hx*2 + .05, .06, b.hz*2 + .05), toon(0xa8744a)); plank.position.set(b.x, b.h + .02, b.z); g.add(plank);
      for (const sx of [-1, 1]){ const p = part(new THREE.CylinderGeometry(.12, .12, 2.6, 6), toon(0xc0392b)); p.position.set(b.x + sx*(b.hx - .2), b.h + 1.3, b.z + (b.z < 0 ? -b.hz + .2 : b.hz - .2)); g.add(p); }
      const l = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .5, 10), new THREE.MeshBasicMaterial({color:0xff5a3a})); l.position.set(b.x, b.h + 2.3, b.z + (b.z < 0 ? -b.hz + .2 : b.hz - .2)); g.add(l); lanterns.push(l);
      const rope = new THREE.Mesh(new THREE.BoxGeometry(b.hx*2, .05, .05), toon(0xf1e6cf)); rope.position.set(b.x, b.h + 2.55, l.position.z); g.add(rope);
    }
  }
  // Moat water ring is the stage's own water; around it: rows of houses, a torii, a pagoda, the castle and Fuji
  // Grass banks on the far side of the moat (the moat itself is the stage's water at fallY)
  const M = 12, grass = toon(0x6f8a4f);
  for (const [x, z, w, d] of [[0, -(D + M) - 150, 640, 300], [0, D + M + 150, 640, 300], [-(W + M) - 150, 0, 300, 2*(D + M)], [W + M + 150, 0, 300, 2*(D + M)]]){
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), grass); b.position.set(x, GY - .5, z); g.add(b);
  }
  for (let i = 0; i < 16; i++){
    const side = i < 8 ? -1 : 1, k = i % 8, x = -70 + k*20 + (side > 0 ? 10 : 0), z = side*(D + 26 + (k % 2)*6);
    const {g:h} = buildMachiya(9, 6, 4.5 + (k % 3), side < 0 ? 0 : PI); h.position.set(x, GY, z); g.add(h);
  }
  for (let i = 0; i < 6; i++){ const t = buildSakura(1.6 + (i % 2)*.4); t.position.set((i - 2.5)*28, GY, -D - 18 - (i % 2)*8); g.add(t); }
  const torii = new THREE.Group(), red = toon(0xd2382a), black = toon(0x2a2a2a);
  for (const sx of [-1, 1]){ const p = part(new THREE.CylinderGeometry(.55, .65, 11, 10), red, 1.03); p.position.set(sx*5, 5.5, 0); torii.add(p); }
  const kasagi = part(new THREE.BoxGeometry(14, .9, 1.3), black, 1.02); kasagi.position.y = 11.2; torii.add(kasagi);
  const shimaki = part(new THREE.BoxGeometry(13, .7, 1), red, 1.02); shimaki.position.y = 10.5; torii.add(shimaki);
  const nuki = part(new THREE.BoxGeometry(12, .6, .7), red, 1.02); nuki.position.y = 8.4; torii.add(nuki);
  torii.position.set(-W - 14, GY, 0); torii.rotation.y = PI/2; g.add(torii);
  const pagoda = new THREE.Group();
  for (let i = 0; i < 5; i++){
    const s = 1 - i*.14, body = part(new THREE.BoxGeometry(6*s, 2.6, 6*s), toon(0xc0392b), 1.02); body.position.y = 1.3 + i*3.4; pagoda.add(body);
    const roof = part(new THREE.CylinderGeometry(.5, 6.2*s, 1.3, 4), toon(0x2f3440), 1.02); roof.rotation.y = PI/4; roof.position.y = 3.2 + i*3.4; pagoda.add(roof);
  }
  const spire = part(new THREE.CylinderGeometry(.15, .25, 5, 6), toon(0xd9a92a)); spire.position.y = 19.5; pagoda.add(spire);
  pagoda.position.set(48, GY, -D - 40); g.add(pagoda);
  const castle = new THREE.Group();
  const keepBase = part(new THREE.CylinderGeometry(11, 14, 8, 4), toon(0x8f8a80), 1.02); keepBase.rotation.y = PI/4; keepBase.position.y = 4; castle.add(keepBase);
  for (let i = 0; i < 3; i++){
    const s = 1 - i*.25, b = part(new THREE.BoxGeometry(12*s, 4, 9*s), toon(0xf4efe4), 1.02); b.position.y = 10 + i*5; castle.add(b);
    const r = part(new THREE.CylinderGeometry(1, 9.5*s, 2.2, 4), toon(0x2f4a5a), 1.02); r.rotation.y = PI/4; r.scale.z = .78; r.position.y = 13 + i*5; castle.add(r);
  }
  castle.position.set(-40, GY, -D - 70); g.add(castle);
  const fuji = new THREE.Mesh(new THREE.ConeGeometry(70, 60, 24), toon(0x5d6f9a)); fuji.position.set(30, 18, -230); g.add(fuji);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(25, 21.5, 24), toon(0xf4f6fb)); cap.position.set(30, 37.5, -230); g.add(cap);
  for (let i = 0; i < 5; i++){ const m = new THREE.Mesh(new THREE.ConeGeometry(40 + i*6, 26 + (i % 2)*10, 7), toon(0x4f6a5a)); m.position.set(-160 + i*80, 4, -170 - (i % 2)*20); g.add(m); }
  g.userData = {lanterns};
  return g;
}

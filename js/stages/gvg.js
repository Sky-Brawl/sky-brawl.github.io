// Sky Brawl · stages/gvg.js — ด่านสนามกิลวอ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Guild war field: a wide castle courtyard with a base at each end ---------- */
const GVG_W = 47, GVG_D = 19;
const GVG_OBS = [[0, 0, 2.6, 'fount'], [-22, -10, 2.2, 'tower'], [-22, 10, 2.2, 'tower'], [22, -10, 2.2, 'tower'], [22, 10, 2.2, 'tower'],
  [-10, -13, 1.2, 'statue'], [10, 13, 1.2, 'statue'], [-10, 13, 1.2, 'statue'], [10, -13, 1.2, 'statue']].map(([x, z, r, kind]) => ({x, z, r, kind}));
function battlement(g, len, x, z, alongX, stone){
  const wall = part(new THREE.BoxGeometry(alongX ? len : .6, .7, alongX ? .6 : len), stone); wall.position.set(x, .35, z); g.add(wall);
  const n = Math.floor(len/1.6), geo = new THREE.BoxGeometry(.7, .5, .7), im = new THREE.InstancedMesh(geo, stone, n), m = new THREE.Matrix4();
  for (let i = 0; i < n; i++){ const t = -len/2 + .8 + i*1.6; m.makeTranslation(alongX ? x + t : x, .95, alongX ? z : z + t); im.setMatrixAt(i, m); }
  g.add(im);
}
function flagPole(g, x, z, col, h = 7){
  const pole = part(new THREE.CylinderGeometry(.12, .15, h, 8), toon(0x5a5f6b)); pole.position.set(x, h/2, z); g.add(pole);
  const knob = part(SPH(.22), toon(0xe0b13a)); knob.position.set(x, h + .1, z); g.add(knob);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6, 8, 1), new THREE.MeshToonMaterial({color:col, gradientMap:gmap, side:THREE.DoubleSide}));
  cloth.position.set(x + 1.35*Math.sign(-x || 1), h - 1, z); g.add(cloth);
  return cloth;
}
function buildGvG(){
  const g = new THREE.Group(), W = GVG_W, D = GVG_D;
  const tex = tileTex('#b9b2a3', '#aaa395', '#8f887a', 4); tex.repeat.set(W/3, D/3);
  const top = new THREE.MeshToonMaterial({map:tex, gradientMap:gmap}), stone = toon(0x9a9284), dark = toon(0x6b655a);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W*2, 4, D*2), [stone, stone, top, stone, stone, stone]); base.position.y = -2; base.receiveShadow = true; g.add(base);
  const cliff = part(new THREE.CylinderGeometry(D*1.3, D*.7, 14, 10), toon(0x5a5348)); cliff.scale.x = W/D*.9; cliff.position.y = -11; g.add(cliff);
  // Low battlements on the long sides, open corners so knockbacks still send people over
  for (const sz of [-1, 1]) for (const x of [-30, 0, 30]) battlement(g, 22, x, sz*(D - .3), true, stone);
  for (const sx of [-1, 1]) battlement(g, 10, sx*(W - .3), 0, false, stone);
  // Team bases: coloured paving, flags and a gatehouse behind each end
  const flags = [];
  for (const [sx, col] of [[-1, 0xff5d4a], [1, 0x2f8cff]]){
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(13, D*1.5), new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:.22, depthWrite:false}));
    pad.rotation.x = -PI/2; pad.position.set(sx*(W - 8), .02, 0); g.add(pad);
    for (const z of [-D + 2, D - 2]) flags.push(flagPole(g, sx*(W - 3), z, col));
    const gate = new THREE.Group(); gate.position.set(sx*(W + 9), 0, 0);
    const keep = part(new THREE.BoxGeometry(8, 16, 18), dark, 1.01); keep.position.y = 4; gate.add(keep);
    for (const z of [-10, 10]){
      const tw = part(new THREE.CylinderGeometry(3, 3.3, 22, 14), stone, 1.02); tw.position.set(0, 7, z); gate.add(tw);
      const roof = part(new THREE.ConeGeometry(3.6, 6, 14), toon(col), 1.03); roof.position.set(0, 21, z); gate.add(roof);
    }
    const arch = part(new THREE.BoxGeometry(1, 7, 6), toon(0x3a2a1a)); arch.position.set(-sx*4, 1.5, 0); gate.add(arch);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(4, 7), toon(col)); banner.position.set(-sx*4.05, 8, 0); banner.rotation.y = -sx*PI/2; gate.add(banner);
    g.add(gate);
  }
  for (const o of GVG_OBS){
    const c = new THREE.Group();
    if (o.kind === 'fount'){
      const basin = part(new THREE.CylinderGeometry(2.6, 2.8, .9, 20), stone, 1.03); basin.position.y = .45; c.add(basin);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, .1, 20), toon(0x5fb0e0)); water.position.y = .9; c.add(water);
      const col = part(new THREE.CylinderGeometry(.45, .6, 2.6, 12), stone, 1.04); col.position.y = 1.8; c.add(col);
      const bowl = part(new THREE.CylinderGeometry(1.2, .5, .5, 16), stone, 1.04); bowl.position.y = 3.2; c.add(bowl);
    } else if (o.kind === 'tower'){
      const body = part(new THREE.CylinderGeometry(2, 2.2, 7, 14), stone, 1.03); body.position.y = 3.5; c.add(body);
      const ring = part(new THREE.CylinderGeometry(2.4, 2.4, .8, 14), dark, 1.03); ring.position.y = 7.4; c.add(ring);
      const roof = part(new THREE.ConeGeometry(2.6, 3.6, 14), toon(0x4f5f7a), 1.03); roof.position.y = 9.6; c.add(roof);
      const door = part(new THREE.BoxGeometry(1.2, 2, .3), toon(0x3a2a1a)); door.position.set(0, 1, 2.1); c.add(door);
    } else {
      const ped = part(new THREE.BoxGeometry(2, 1.2, 2), stone, 1.03); ped.position.y = .6; c.add(ped);
      const body = part(new THREE.CylinderGeometry(.5, .7, 2, 10), toon(0xc9c2b2), 1.04); body.position.y = 2.2; c.add(body);
      const head = part(SPH(.5), toon(0xc9c2b2), 1.04); head.position.y = 3.6; c.add(head);
      const sword = part(new THREE.BoxGeometry(.12, 2.6, .3), toon(0xc9c2b2)); sword.position.set(.75, 2.3, 0); c.add(sword);
    }
    c.position.set(o.x, 0, o.z); g.add(c);
  }
  // Mountains and a far keep
  for (let i = 0; i < 14; i++){
    const a = i/14*PI*2, r = 150 + (i % 3)*20, h = 30 + (i*37 % 25);
    const m = new THREE.Mesh(new THREE.ConeGeometry(18 + (i*13 % 10), h, 7), toon(i % 2 ? 0x6f8a6a : 0x5f7a6a)); m.position.set(Math.cos(a)*r, -6 + h/2, Math.sin(a)*r); g.add(m);
    const snow = new THREE.Mesh(new THREE.ConeGeometry(6, 8, 7), toon(0xf4f4f4)); snow.position.set(Math.cos(a)*r, -6 + h - 3.5, Math.sin(a)*r); g.add(snow);
  }
  const far = new THREE.Group(); far.position.set(0, -4, -70);
  const fk = part(new THREE.BoxGeometry(24, 20, 12), dark); fk.position.y = 10; far.add(fk);
  for (const x of [-14, 14]){ const t = part(new THREE.CylinderGeometry(4, 4.4, 30, 12), stone); t.position.set(x, 15, 0); far.add(t); const r = part(new THREE.ConeGeometry(5, 8, 12), toon(0x4f5f7a)); r.position.set(x, 34, 0); far.add(r); }
  g.add(far);
  g.userData = {flags};
  return g;
}

// Sky Brawl · stages/halloween.js — ด่านฮัลโลวีน
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Halloween: a haunted graveyard floating in purple mist ---------- */
const HW_W = 32, HW_D = 14;
const HALLOWEEN_OBS = [[-20, -6, 1.1, 'tomb'], [-14, 7, 1.1, 'tomb'], [-6, -8, 1.1, 'tomb'], [8, 8, 1.1, 'tomb'], [15, -7, 1.1, 'tomb'], [21, 6, 1.1, 'tomb'],
  [-25, 8, 1.3, 'tree'], [25, -8, 1.3, 'tree'], [0, 0, 2.3, 'pumpkin']].map(([x, z, r, kind]) => ({x, z, r, kind}));
function pumpkin(r, lit){
  const g = new THREE.Group(), orange = toon(0xf07a1a);
  for (let i = 0; i < 6; i++){ const a = i/6*PI*2, rib = part(SPH(r*.62), orange, 1.03); rib.scale.set(.75, .85, 1.05); rib.position.set(Math.cos(a)*r*.38, 0, Math.sin(a)*r*.38); rib.rotation.y = -a; g.add(rib); }
  const stem = part(new THREE.CylinderGeometry(r*.08, r*.12, r*.45, 6), toon(0x4f6b2a)); stem.position.y = r*.62; stem.rotation.z = .3; g.add(stem);
  if (lit){
    const glow = new THREE.MeshBasicMaterial({color:0xffd23a});
    for (const sx of [-1, 1]){ const eye = new THREE.Mesh(new THREE.ConeGeometry(r*.14, r*.22, 3), glow); eye.position.set(sx*r*.24, r*.14, r*.86); eye.rotation.x = PI/2; g.add(eye); }
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(r*.6, r*.12, r*.1), glow); mouth.position.set(0, -r*.18, r*.84); g.add(mouth);
    for (const sx of [-1, 0, 1]){ const tooth = new THREE.Mesh(new THREE.BoxGeometry(r*.1, r*.1, r*.12), orange); tooth.position.set(sx*r*.18, -r*.13, r*.86); g.add(tooth); }
  }
  g.position.y = r*.5;
  return g;
}
function buildHalloween(){
  const g = new THREE.Group(), W = HW_W, D = HW_D;
  const tex = tileTex('#4a3b52', '#41334a', '#2f2438', 4); tex.repeat.set(W/4, D/4);
  const top = new THREE.MeshToonMaterial({map:tex, gradientMap:gmap}), rock = toon(0x2f2438), iron = toon(0x1d1828);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W*2, 3, D*2), [rock, rock, top, rock, rock, rock]); base.position.y = -1.5; base.receiveShadow = true; g.add(base);
  const under = part(new THREE.ConeGeometry(W*.8, 16, 9), toon(0x241b2e)); under.scale.z = D/W*1.4; under.rotation.x = PI; under.position.y = -11; g.add(under);
  // Iron fence: posts with spikes and two rails, all instanced
  const posts = [];
  for (let x = -W + 1; x <= W - 1; x += 1.6) posts.push([x, D - .2], [x, -D + .2]);
  for (let z = -D + 1.6; z <= D - 1.6; z += 1.6) posts.push([W - .2, z], [-W + .2, z]);
  const pim = new THREE.InstancedMesh(new THREE.BoxGeometry(.1, 1.1, .1), iron, posts.length), sim = new THREE.InstancedMesh(new THREE.ConeGeometry(.1, .25, 4), iron, posts.length), mx = new THREE.Matrix4();
  posts.forEach(([x, z], i) => { mx.makeTranslation(x, .55, z); pim.setMatrixAt(i, mx); mx.makeTranslation(x, 1.2, z); sim.setMatrixAt(i, mx); });
  g.add(pim, sim);
  for (const sz of [-1, 1]) for (const y of [.35, .9]){ const r = new THREE.Mesh(new THREE.BoxGeometry(W*2 - .4, .06, .06), iron); r.position.set(0, y, sz*(D - .2)); g.add(r); }
  for (const sx of [-1, 1]) for (const y of [.35, .9]){ const r = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, D*2 - .4), iron); r.position.set(sx*(W - .2), y, 0); g.add(r); }
  const lanterns = [];
  for (const o of HALLOWEEN_OBS){
    const c = new THREE.Group();
    if (o.kind === 'tomb'){
      const slab = part(new THREE.BoxGeometry(1.6, 1.6, .5), toon(0x8a8f99), 1.04); slab.position.y = .8; c.add(slab);
      const cap = part(new THREE.CylinderGeometry(.8, .8, .5, 16, 1, false, 0, PI), toon(0x8a8f99), 1.04); cap.rotation.set(PI/2, 0, PI/2); cap.position.y = 1.6; c.add(cap);
      const v = new THREE.Mesh(new THREE.BoxGeometry(.12, .7, .05), toon(0x5a5f6b)); v.position.set(0, 1.25, .27); c.add(v);
      const h = new THREE.Mesh(new THREE.BoxGeometry(.45, .12, .05), toon(0x5a5f6b)); h.position.set(0, 1.4, .27); c.add(h);
      const mound = part(new THREE.SphereGeometry(.9, 12, 8, 0, PI*2, 0, PI/2), toon(0x3b2f45)); mound.scale.set(1, .35, 1.6); mound.position.z = 1.2; c.add(mound);
      c.rotation.y = (o.x*7 % 5)*.04; c.rotation.z = (o.z % 3)*.03;
    } else if (o.kind === 'tree'){
      const bark = toon(0x3a2a2a);
      const trunk = part(new THREE.CylinderGeometry(.35, .7, 6, 8), bark, 1.04); trunk.position.y = 3; trunk.rotation.z = .1; c.add(trunk);
      for (const [a, y, l] of [[.9, 4.5, 3], [-1, 5.2, 2.6], [.4, 5.8, 2.2], [-.5, 3.8, 2.4]]){
        const br = part(new THREE.CylinderGeometry(.1, .25, l, 6), bark, 1.05); br.position.set(Math.sin(a)*l*.45, y + .6, Math.cos(a*2)*.4); br.rotation.z = -a; c.add(br);
      }
      const owlEye = new THREE.MeshBasicMaterial({color:0xffd23a});
      for (const sx of [-1, 1]){ const e = new THREE.Mesh(SPH(.08), owlEye); e.position.set(sx*.15, 5.3, .45); c.add(e); }
    } else {
      const pk = pumpkin(2.3, true); c.add(pk); lanterns.push(pk);
    }
    c.position.set(o.x, 0, o.z); g.add(c);
  }
  // Small jack-o'-lanterns on the corners
  for (const [x, z] of [[W - 2, D - 2], [-W + 2, D - 2], [W - 2, -D + 2], [-W + 2, -D + 2], [0, D - 1.6], [0, -D + 1.6]]){
    const pk = pumpkin(.55, true); pk.position.set(x, .28, z); pk.rotation.y = Math.atan2(-x, -z); g.add(pk);
  }
  // Haunted house behind the graveyard
  const house = new THREE.Group(); house.position.set(0, -4, -D - 22);
  const body = part(new THREE.BoxGeometry(26, 16, 12), toon(0x2f2140)); body.position.y = 8; house.add(body);
  const lit = new THREE.MeshBasicMaterial({color:0xffb02e}), unlit = toon(0x14101c);
  for (const [x, y] of [[-8, 5], [-3, 5], [3, 5], [8, 5], [-8, 11], [-3, 11], [3, 11], [8, 11]]){
    const w = new THREE.Mesh(new THREE.BoxGeometry(2, 2.6, .2), (x*y) % 3 ? lit : unlit); w.position.set(x, y, 6.05); house.add(w);
  }
  const door = part(new THREE.BoxGeometry(3, 4.5, .3), toon(0x14101c)); door.position.set(0, 2.25, 6.1); house.add(door);
  for (const [x, h] of [[-9, 26], [9, 22], [0, 30]]){
    const t = part(new THREE.CylinderGeometry(3, 3.3, h, 10), toon(0x2f2140)); t.position.set(x, h/2, 2); house.add(t);
    const r = part(new THREE.ConeGeometry(3.8, 7, 10), toon(0x1d1430)); r.position.set(x, h + 3.5, 2); house.add(r);
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2, .2), new THREE.MeshBasicMaterial({color:0xffb02e})); w.position.set(x, h - 4, 5.1); house.add(w);
  }
  g.add(house);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(14, 32), new THREE.MeshBasicMaterial({color:0xfff3c4, fog:false}));
  moon.position.set(-60, 70, -150); moon.lookAt(0, 0, 0); g.add(moon);
  // Spooky hills and graves in the mist
  for (let i = 0; i < 16; i++){
    const a = i/16*PI*2, r = 90 + (i % 4)*18;
    const hill = new THREE.Mesh(SPH(18 + (i*7 % 9)), toon(0x241b2e)); hill.scale.y = .5; hill.position.set(Math.cos(a)*r, -8, Math.sin(a)*r); g.add(hill);
  }
  const bats = [];
  for (let i = 0; i < 9; i++){
    const b = new THREE.Group(), m = toon(0x14101c);
    const bd = new THREE.Mesh(SPH(.35), m); bd.scale.set(1, .8, 1.3); b.add(bd);
    const wings = [];
    for (const sx of [-1, 1]){ const w = new THREE.Mesh(new THREE.ConeGeometry(.5, 1.6, 3), m); w.rotation.z = sx*PI/2; w.position.x = sx*.9; w.scale.z = .25; b.add(w); wings.push(w); }
    b.userData = {a:Math.random()*PI*2, r:14 + Math.random()*26, y:6 + Math.random()*10, sp:.004 + Math.random()*.006, wings};
    g.add(b); bats.push(b);
  }
  g.userData = {bats, lanterns};
  return g;
}

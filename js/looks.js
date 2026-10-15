// Sky Brawl · looks.js — ชิ้นส่วนหน้าตา: ทรงผม หมวก ดวงตา ค้อน ระเบิด ข้าวปั้น
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Models ---------- */
const UP = new V(0, 1, 0);
function outward(mesh, dir, dist){ dir.normalize(); mesh.position.copy(dir).multiplyScalar(dist); mesh.quaternion.setFromUnitVectors(UP, dir); }
const halfDome = r => new THREE.SphereGeometry(r, 24, 16, 0, PI*2, 0, PI*.5);
function buildHair(head, look){
  const hc = toon(look.hairColor);
  const cap = () => { const h = part(halfDome(.6), hc); h.position.y = .04; h.rotation.x = -.3; head.add(h); };
  switch (look.hair){
    case 'short':
      cap();
      for (const x of [-.22, 0, .22]){ const f = part(SPH(.16), hc); f.scale.set(1.2, .7, .6); f.position.set(x, .33, .43); head.add(f); }
      break;
    case 'spiky':
      cap();
      for (let i = 0; i < 7; i++){
        const a = PI/2 + .7 + i/6*(PI*2 - 1.4);
        const c = part(new THREE.ConeGeometry(.16, .45, 6), hc);
        outward(c, new V(Math.cos(a)*.75, .65, Math.sin(a)*.75), .55); head.add(c);
      }
      { const c = part(new THREE.ConeGeometry(.17, .5, 6), hc); outward(c, new V(0, 1, -.25), .55); head.add(c); }
      break;
    case 'buns':
      cap();
      for (const s of [-1, 1]){ const b = part(SPH(.22), hc, 1.08); b.position.set(s*.42, .45, -.05); head.add(b); }
      break;
    case 'long':
      cap();
      { const b = part(SPH(.5), hc); b.scale.set(1.1, 1.2, .55); b.position.set(0, -.18, -.32); head.add(b); }
      break;
    case 'mohawk':
      for (let i = 0; i < 5; i++){
        const phi = .6 - i*.42, c = part(new THREE.ConeGeometry(.11, .42, 4), hc);
        outward(c, new V(0, Math.cos(phi), Math.sin(phi)), .62); c.scale.set(.5, 1, 1.6); head.add(c);
      }
      break;
  }
}
function buildHat(head, look, helmet){
  const up = helmet ? .3 : 0;   // above a class helmet
  switch (look.hat){
    case 'halo': {
      const h = new THREE.Mesh(new THREE.TorusGeometry(.34, .055, 6, 20), new THREE.MeshBasicMaterial({color:0xffe066}));
      h.rotation.x = PI/2; h.position.y = .98 + up; head.add(h); break;
    }
    case 'tophat': {
      const blk = toon(0x23242c);
      const c = part(new THREE.CylinderGeometry(.34, .36, .5, 16), blk, 1.05); c.position.y = .8; head.add(c);
      const br = part(new THREE.CylinderGeometry(.58, .58, .06, 20), blk, 1.05); br.position.y = .56; head.add(br);
      const band = part(new THREE.CylinderGeometry(.37, .37, .11, 16), toon(0xd8342c)); band.position.y = .64; head.add(band);
      break;
    }
    case 'flower': {
      const ring = part(new THREE.TorusGeometry(.6, .06, 6, 24), toon(0x4caf50)); ring.rotation.x = PI/2; ring.position.y = .46; head.add(ring);
      for (let i = 0; i < 7; i++){
        const a = i/7*PI*2, fl = part(SPH(.16), toon([0xff8fb8, 0xffffff, 0xffd23a][i % 3]), 1.1);
        fl.position.set(Math.cos(a)*.6, .52, Math.sin(a)*.6); head.add(fl);
        const c = new THREE.Mesh(SPH(.055), toon(0xffa21a)); c.position.set(Math.cos(a)*.67, .58, Math.sin(a)*.67); head.add(c);
      }
      break;
    }
    case 'star': {
      const sh = new THREE.Shape();
      for (let i = 0; i < 10; i++){ const r = i % 2 ? .14 : .32, a = PI/2 + i*PI/5; if (i) sh.lineTo(Math.cos(a)*r, Math.sin(a)*r); else sh.moveTo(Math.cos(a)*r, Math.sin(a)*r); }
      const st = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, {depth:.1, bevelEnabled:false}), new THREE.MeshBasicMaterial({color:0xffd23a}));
      st.position.set(0, 1.08 + up, -.05); st.userData.spin = true; head.add(st);
      break;
    }
    case 'band': { const b = part(new THREE.TorusGeometry(.57, .06, 6, 28), toon(look.body)); b.rotation.x = PI/2 - .3; b.position.y = .1; head.add(b); break; }
    case 'cap': {
      const d = part(halfDome(.62), toon(look.body), 1.04); d.position.y = .05; d.rotation.x = -.12; head.add(d);
      const br = part(new THREE.CylinderGeometry(.36, .36, .05, 24), toon(look.body)); br.scale.z = .85; br.position.set(0, .2, .5); br.rotation.x = .2; head.add(br);
      break;
    }
    case 'ears':
      for (const s of [-1, 1]){
        const e = part(new THREE.ConeGeometry(.17, .34, 4), toon(look.hairColor), 1.08); e.position.set(s*.34, .52, 0); e.rotation.z = -s*.45; head.add(e);
        const inner = new THREE.Mesh(new THREE.ConeGeometry(.09, .2, 4), toon(0xff9cb5)); inner.position.set(0, -.04, .06); e.add(inner);
      }
      break;
    case 'horns':
      for (const s of [-1, 1]){ const h = part(new THREE.ConeGeometry(.08, .38, 8), toon(0xfff0cc), 1.1); h.position.set(s*.3, .5, .12); h.rotation.set(.2, 0, -s*.5); head.add(h); }
      break;
    case 'crown': {
      const c = part(new THREE.CylinderGeometry(.3, .27, .16, 12), toon(0xffc23a), 1.06); c.position.y = .58; head.add(c);
      for (let i = 0; i < 5; i++){ const a = i/5*PI*2; const p = part(new THREE.ConeGeometry(.06, .16, 6), toon(0xffc23a)); p.position.set(Math.cos(a)*.27, .72, Math.sin(a)*.27); head.add(p); }
      break;
    }
  }
}
function buildEyes(head, look){
  for (const s of [-1, 1]){
    const x = s*.2;
    if (look.eyes === 'happy'){ const a = new THREE.Mesh(new THREE.TorusGeometry(.07, .022, 6, 12, PI), toon(INK)); a.position.set(x, 0, .52); head.add(a); continue; }
    const e = new THREE.Mesh(SPH(.085), toon(INK));
    if (look.eyes === 'sleepy'){ e.scale.set(1.2, .35, .5); e.position.set(x, -.02, .51); head.add(e); continue; }
    e.scale.set(.7, 1.25, .5); e.position.set(x, .02, .51); head.add(e);
    const hl = new THREE.Mesh(SPH(.03), new THREE.MeshBasicMaterial({color:0xffffff})); hl.position.set(x + .02, .07, .55); head.add(hl);
    if (look.eyes === 'angry'){ const b = new THREE.Mesh(new THREE.BoxGeometry(.17, .035, .04), toon(INK)); b.position.set(x, .17, .5); b.rotation.z = s*.4; head.add(b); }
  }
}
function buildHammer(){
  const g = new THREE.Group();
  const h = part(new THREE.CylinderGeometry(.05,.05,1,8), toon(0x8a5a2b)); h.position.y = -.45; g.add(h);
  const head = part(new THREE.BoxGeometry(.36,.36,.64), toon(0xffc23a), 1.08); head.position.y = -.95; g.add(head);
  const band = part(new THREE.BoxGeometry(.38,.38,.12), toon(INK)); band.position.y = -.95; g.add(band);
  return g;
}
function buildBomb(){
  const g = new THREE.Group();
  g.add(part(SPH(.3), toon(0x2b2f3a), 1.08));
  const cap = part(new THREE.CylinderGeometry(.1,.1,.1,8), toon(0x9aa3b5)); cap.position.y = .3; g.add(cap);
  const fuse = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.18,6), toon(0xd9b98a)); fuse.position.set(-.03,.42,0); fuse.rotation.z = .4; g.add(fuse);
  const spark = new THREE.Mesh(SPH(.08), new THREE.MeshBasicMaterial({color:0xffd23a})); spark.position.set(-.08,.52,0); g.add(spark);
  g.userData.spark = spark;
  return g;
}
function buildRice(){
  const g = new THREE.Group();
  const r = part(new THREE.CylinderGeometry(.4,.4,.26,3), toon(0xffffff), 1.08); r.rotation.x = -PI/2; g.add(r);
  const n = part(new THREE.BoxGeometry(.3,.2,.3), toon(0x1f3b2a)); n.position.y = -.12; g.add(n);
  return g;
}

// Sky Brawl · world.js — ด่านเรือไททานิก, renderer, แสง, วัสดุ toon และการรวม mesh (mergeMeshes)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- The ship: deck outline drives both the model and the physics ---------- */
let SEA_Y = -4.5;
const SHIP_FUNNELS = [-17, -6, 5, 16].map(x => ({x, z:0, r:1.6}));
let FUNNELS = SHIP_FUNNELS;   // obstacles of the current stage
// Solid boxes {x, z, hx, hz, h}: low ones (h ≤ 1.8) can be jumped onto and fought from, tall ones are walls
let BLOCKS = [];
const inBlock = (x, z, m = 0) => BLOCKS.find(b => Math.abs(x - b.x) < b.hx + m && Math.abs(z - b.z) < b.hz + m);
const blockAt = (x, y, z) => BLOCKS.some(b => Math.abs(x - b.x) < b.hx && Math.abs(z - b.z) < b.hz && y < b.h);
function hw(x){
  if (x > 18) return x >= 32 ? 0 : 8*Math.sqrt(1 - ((x - 18)/14)**2);
  if (x < -26) return x <= -32 ? 0 : 8*Math.sqrt(1 - ((x + 26)/6)**2);
  return 8;
}
const onDeck = (x, z, m = 0) => STAGE.inside(x, z, m);

/* ---------- Renderer & world ---------- */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
const scene = new THREE.Scene();
function paintSky(stops){
  const c = document.createElement('canvas'); c.width = 2; c.height = 256;
  const x = c.getContext('2d'), g = x.createLinearGradient(0,0,0,256);
  stops.forEach((col, i) => g.addColorStop(i/(stops.length - 1), col));
  x.fillStyle = g; x.fillRect(0,0,2,256);
  return new THREE.CanvasTexture(c);
}
scene.background = paintSky(['#3f6fb5','#9fb8d8','#f6b77c','#ffd7a3']);
scene.fog = new THREE.Fog(0xf2c7a0, 50, 170);
const camera = new THREE.PerspectiveCamera(45, 1, .1, 400);
const hemi = new THREE.HemisphereLight(0xfff1e0, 0x4a6fa5, .75); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe6c8, .9);
sun.position.set(-14, 24, 16); sun.castShadow = true;
sun.shadow.mapSize.setScalar(IS_TOUCH ? 1024 : 2048);
Object.assign(sun.shadow.camera, {left:-42, right:42, top:28, bottom:-28, near:1, far:90});
scene.add(sun);

const gmap = new THREE.DataTexture(new Uint8Array([95,95,95,255, 175,175,175,255, 255,255,255,255]), 3, 1, THREE.RGBAFormat);
gmap.minFilter = gmap.magFilter = THREE.NearestFilter; gmap.needsUpdate = true;
const matCache = {};
const toon = c => matCache[c] || (matCache[c] = new THREE.MeshToonMaterial({color:c, gradientMap:gmap}));
const OUT = new THREE.MeshBasicMaterial({color:INK, side:THREE.BackSide});
OUT.visible = false; // Sky Brawl: blocks have no ink outline
const SPH = r => new THREE.SphereGeometry(r, r > .3 ? 18 : 12, r > .3 ? 12 : 8);
function part(geo, mat, outline){
  const m = new THREE.Mesh(geo, mat); m.castShadow = true;
  if (outline){ const o = new THREE.Mesh(geo, OUT); o.scale.setScalar(outline); m.add(o); }
  return m;
}

/* ---------- Draw-call batching ----------
   Every static mesh under a container is baked into one mesh per material kind (lit toon with
   vertex colours, unlit, outline). Objects with userData, invisible ones and anything in skip stay
   live so code that animates them keeps working. */
const VC_TOON = new THREE.MeshToonMaterial({color:0xffffff, gradientMap:gmap, vertexColors:true});
const VC_BASIC = new THREE.MeshBasicMaterial({color:0xffffff, vertexColors:true});
const _mm = new THREE.Matrix4(), _mi = new THREE.Matrix4(), _mn = new THREE.Matrix3(), _mv = new V(), _mc = new THREE.Color();
function mergeKind(o){
  if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) return null;
  const m = o.material;
  if (m === OUT) return 'out';
  if (m.map || m.transparent || m.wireframe || m.side !== THREE.FrontSide || m.vertexColors) return null;
  if (m.isMeshToonMaterial) return 'toon';
  if (m.isMeshBasicMaterial) return 'basic';
  return null;
}
function mergeMeshes(container, skip){
  container.updateMatrixWorld(true);
  _mi.copy(container.matrixWorld).invert();
  const buckets = {toon:[], out:[], basic:[]};
  const walk = o => {
    if (o !== container && ((skip && skip.has(o)) || Object.keys(o.userData).length || o.visible === false)) return;
    const k = mergeKind(o); if (k) buckets[k].push(o);
    for (const c of o.children) walk(c);
  };
  walk(container);
  const taken = new Set(), made = [];
  for (const k of ['toon', 'out', 'basic']){
    const list = buckets[k]; if (list.length < 2) continue;
    const geos = list.map(o => o.geometry.index ? o.geometry.toNonIndexed() : o.geometry);
    const count = geos.reduce((a, g) => a + g.attributes.position.count, 0);
    const pos = new Float32Array(count*3), nor = new Float32Array(count*3), col = k === 'out' ? null : new Float32Array(count*3);
    let off = 0, cast = false, recv = false;
    list.forEach((o, i) => {
      const g = geos[i], p = g.attributes.position, n = g.attributes.normal;
      _mm.multiplyMatrices(_mi, o.matrixWorld); _mn.getNormalMatrix(_mm);
      if (col) _mc.copy(o.material.color);
      for (let j = 0; j < p.count; j++){
        const q = (off + j)*3;
        _mv.fromBufferAttribute(p, j).applyMatrix4(_mm); pos[q] = _mv.x; pos[q + 1] = _mv.y; pos[q + 2] = _mv.z;
        if (n){ _mv.fromBufferAttribute(n, j).applyMatrix3(_mn).normalize(); nor[q] = _mv.x; nor[q + 1] = _mv.y; nor[q + 2] = _mv.z; }
        if (col){ col[q] = _mc.r; col[q + 1] = _mc.g; col[q + 2] = _mc.b; }
      }
      off += p.count; cast = cast || o.castShadow; recv = recv || o.receiveShadow; taken.add(o);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, k === 'toon' ? VC_TOON : k === 'basic' ? VC_BASIC : OUT);
    mesh.castShadow = k === 'toon' && cast; mesh.receiveShadow = recv;
    made.push(mesh);
  }
  for (const o of taken) for (const c of [...o.children]) if (!taken.has(c)) container.attach(c);
  for (const o of taken) if (o.parent) o.parent.remove(o);
  for (const m of made) container.add(m);
  return made;
}
// Everything a stage keeps in its userData is animated by its fx, so it stays out of the bake
function stageSkip(g){
  const skip = new Set();
  const addAll = v => { if (!v) return; if (v.isObject3D) skip.add(v); else if (Array.isArray(v)) v.forEach(addAll); else if (typeof v === 'object') Object.values(v).forEach(addAll); };
  addAll(g.userData);
  return skip;
}

const TITANIC_DECOR = new THREE.Group();
// Sea
const seaGeo = new THREE.PlaneGeometry(360, 360, 60, 60); seaGeo.rotateX(-PI/2);
const sea = new THREE.Mesh(seaGeo, new THREE.MeshToonMaterial({color:0x2f78b5, gradientMap:gmap}));
sea.position.y = SEA_Y; scene.add(sea);
const seaBase = Float32Array.from(seaGeo.attributes.position.array);
function waveSea(t){
  const p = seaGeo.attributes.position;
  for (let i = 0; i < p.count; i++){
    const x = seaBase[i*3], z = seaBase[i*3 + 2];
    p.array[i*3 + 1] = Math.sin(x*.11 + t*1.1)*.28 + Math.cos(z*.14 + t*.8)*.22;
  }
  p.needsUpdate = true; seaGeo.computeVertexNormals();
}
{
  const foam = new THREE.Mesh(new THREE.RingGeometry(1, 1.14, 64), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.55, side:THREE.DoubleSide}));
  foam.rotation.x = -PI/2; foam.scale.set(34, 9.4, 1); foam.position.y = SEA_Y + .35; TITANIC_DECOR.add(foam);
}
// Icebergs on the horizon
for (const [x, y, z, s] of [[95, -8, -70, 16], [-80, -6, -95, 10], [130, -6, 40, 9]]){
  const g = new THREE.IcosahedronGeometry(s, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++){ const k = .8 + Math.random()*.4; p.setXYZ(i, p.getX(i)*k, p.getY(i)*k*1.3, p.getZ(i)*k); }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, toon(0xe8f6ff)); m.position.set(x, y, z); TITANIC_DECOR.add(m);
}
// Clouds
const clouds = [];
for (let i = 0; i < 9; i++){
  const g = new THREE.Group();
  for (let j = 0; j < 4; j++){
    const m = new THREE.Mesh(SPH(2 + Math.random()*2), toon(0xfff3e6));
    m.position.set(j*2.8 - 4, Math.random(), Math.random()*1.2); g.add(m);
  }
  g.userData = {a:Math.random()*PI*2, d:70 + Math.random()*50, y:14 + Math.random()*16, sp:.0002 + Math.random()*.0003};
  scene.add(g); clouds.push(g);
}

// Titanic
function buildShip(){
  const g = new THREE.Group();
  const shape = new THREE.Shape(), pts = [];
  for (let x = -32; x <= 32.001; x += .5) pts.push([x, hw(x)]);
  shape.moveTo(-32, 0);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  for (let i = pts.length - 2; i > 0; i--) shape.lineTo(pts[i][0], -pts[i][1]);
  const tc = document.createElement('canvas'); tc.width = tc.height = 256;
  const t = tc.getContext('2d');
  t.fillStyle = '#c99560'; t.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32){
    t.fillStyle = y % 64 ? '#c08a55' : '#cf9d68'; t.fillRect(0, y, 256, 30);
    t.fillStyle = '#8e6236'; t.fillRect(0, y + 30, 256, 2);
    const j = (y*37) % 256; t.fillRect(j, y, 2, 30); t.fillRect((j + 128) % 256, y, 2, 30);
  }
  const tex = new THREE.CanvasTexture(tc); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(.25, .25); tex.anisotropy = 4;
  const deckMat = new THREE.MeshToonMaterial({map:tex, gradientMap:gmap});
  const ext = (d, mats) => { const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {depth:d, bevelEnabled:false, curveSegments:4}), mats); m.rotation.x = PI/2; return m; };
  const top = ext(.4, [deckMat, toon(0xf4f1ea)]); top.receiveShadow = true; g.add(top);
  const black = ext(2.9, [toon(0x1b1d24), toon(0x1b1d24)]); black.position.y = -.4; g.add(black);
  const red = ext(3, [toon(0x9b2a24), toon(0x9b2a24)]); red.position.y = -3.3; red.scale.set(.97, .9, 1); g.add(red);
  // Railing
  const rail = [];
  for (const [x, h] of pts) rail.push(new V(x, 0, h*.97 - .05));
  for (let i = pts.length - 2; i > 0; i--) rail.push(new V(pts[i][0], 0, -(pts[i][1]*.97 - .05)));
  const curve = new THREE.CatmullRomCurve3(rail, true);
  const white = toon(0xf7f4ec);
  for (const y of [.9, .5]){
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 420, y > .8 ? .06 : .04, 5, true), white);
    tube.position.y = y; g.add(tube);
  }
  const posts = curve.getSpacedPoints(Math.round(curve.getLength()/1.4));
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(.05, .05, .9, 6), white, posts.length);
  const mtx = new THREE.Matrix4();
  posts.forEach((p, i) => { mtx.makeTranslation(p.x, .45, p.z); im.setMatrixAt(i, mtx); });
  g.add(im);
  // Funnels with the White Star buff-and-black livery
  for (const f of FUNNELS){
    const fg = new THREE.Group();
    const body = part(new THREE.CylinderGeometry(1.4, 1.5, 7.5, 24), toon(0xe2a14a), 1.03); body.position.y = 3.75; fg.add(body);
    const cap = part(new THREE.CylinderGeometry(1.42, 1.42, 1.7, 24), toon(0x1b1d24)); cap.position.y = 6.75; fg.add(cap);
    const base = part(new THREE.CylinderGeometry(1.8, 1.85, .3, 24), white); base.position.y = .15; fg.add(base);
    fg.position.set(f.x, 0, 0); fg.rotation.z = .1; g.add(fg);
  }
  // Masts and rigging
  for (const [x, h] of [[27, 15], [-29, 14]]){
    const m = part(new THREE.CylinderGeometry(.1, .14, h, 8), toon(0x8a5a2b)); m.position.set(x, h/2, 0); g.add(m);
  }
  const lg = new THREE.BufferGeometry().setFromPoints([new V(27, 15, 0), new V(-29, 14, 0)]);
  g.add(new THREE.Line(lg, new THREE.LineBasicMaterial({color:INK})));
  // Lifeboats hang outside the rail
  for (const x of [-23, -12, -.5, 10.5, 21]) for (const s of [-1, 1]){
    const b = new THREE.Group();
    const hull = part(new THREE.SphereGeometry(1, 16, 8, 0, PI*2, PI/2, PI/2), white, 1.05); hull.scale.set(1.3, .45, .5); b.add(hull);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(2.3, .08, .8), toon(0xb08a5c)); b.add(cover);
    b.position.set(x, 1, s*(hw(x) + .75)); g.add(b);
  }
  // Life rings on the bow rail
  for (const s of [-1, 1]){
    const r = part(new THREE.TorusGeometry(.32, .09, 8, 20), toon(0xff7a2f)); r.position.set(24, .65, s*(hw(24) + .02)); g.add(r);
  }
  return g;
}
const SHIP_GROUP = buildShip(); SHIP_GROUP.add(TITANIC_DECOR); mergeMeshes(SHIP_GROUP, stageSkip(SHIP_GROUP)); scene.add(SHIP_GROUP);

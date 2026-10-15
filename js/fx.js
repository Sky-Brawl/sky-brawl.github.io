// Sky Brawl · fx.js — เอฟเฟกต์: ประกาย ควัน แสงวาบ ตัวเลขดาเมจ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- FX ---------- */
const PGEO = new THREE.IcosahedronGeometry(.1, 0);
const _pm = new THREE.Matrix4(), _pc = new THREE.Color(), _p0 = new THREE.Matrix4().makeScale(0, 0, 0);
function makePool(n, translucent){
  const mesh = new THREE.InstancedMesh(PGEO, new THREE.MeshBasicMaterial(translucent ? {color:0xffffff, transparent:true, opacity:.55, depthWrite:false} : {color:0xffffff}), n);
  mesh.frustumCulled = false;
  for (let i = 0; i < n; i++){ mesh.setMatrixAt(i, _p0); mesh.setColorAt(i, _pc.set(0xffffff)); }
  scene.add(mesh);
  return {mesh, idx:0, list:Array.from({length:n}, () => ({pos:new V(), v:new V(), life:0, max:1, g:0, s:1}))};
}
const SPARKS = makePool(320, false), SMOKE = makePool(140, true);
function emit(pos, n, color, spd, up, life, size, grav, alpha = 1){
  const pool = alpha < 1 ? SMOKE : SPARKS; _pc.setHex(color);
  for (let i = 0; i < n; i++){
    const k = pool.idx = (pool.idx + 1) % pool.list.length, p = pool.list[k];
    p.pos.copy(pos);
    const a = Math.random()*PI*2, sp = spd*(.4 + Math.random());
    p.v.set(Math.cos(a)*sp, up*(.4 + Math.random()), Math.sin(a)*sp);
    p.life = p.max = life*(.6 + Math.random()*.6); p.s = size*(.6 + Math.random()*.8); p.g = grav;
    pool.mesh.setColorAt(k, _pc);
  }
  pool.mesh.instanceColor.needsUpdate = true;
}
function stepPool(pool){
  let any = false;
  pool.list.forEach((p, i) => {
    if (p.life <= 0) return;
    p.life--; p.v.y -= p.g*DT; p.pos.addScaledVector(p.v, DT);
    const sc = p.life > 0 ? p.s*(.25 + .75*p.life/p.max) : 0;
    _pm.makeScale(sc, sc, sc).setPosition(p.pos); pool.mesh.setMatrixAt(i, _pm); any = true;
  });
  if (any) pool.mesh.instanceMatrix.needsUpdate = true;
}
// Team rings and blob shadows for every fighter: two draw calls in total
const MAX_MARKS = 200;
const RINGS = new THREE.InstancedMesh(new THREE.RingGeometry(.62, .76, 32).rotateX(-PI/2), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.9, side:THREE.DoubleSide, depthWrite:false}), MAX_MARKS);
const BLOBS = new THREE.InstancedMesh(new THREE.CircleGeometry(.55, 20).rotateX(-PI/2), new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:.22, depthWrite:false}), MAX_MARKS);
RINGS.frustumCulled = BLOBS.frustumCulled = false;
for (let i = 0; i < MAX_MARKS; i++) RINGS.setColorAt(i, _pc.set(0xffffff));   // sizes the colour buffer from count, so before count = 0
RINGS.count = BLOBS.count = 0;
scene.add(RINGS, BLOBS);
const FAR_OUTLINE = 34*34;
function updateGroundMarks(){
  let n = 0;
  for (const f of G.fighters){
    if (!alive(f) || n >= MAX_MARKS || f.hidden) continue;
    _pm.makeTranslation(f.pos.x, f.pos.y + .03, f.pos.z); RINGS.setMatrixAt(n, _pm); RINGS.setColorAt(n, _pc.setHex(f.team));
    if (onDeck(f.pos.x, f.pos.z) && f.pos.y > -.5){ const sc = Math.max(.35, 1 - f.pos.y*.12); _pm.makeScale(sc, 1, sc).setPosition(f.pos.x, .02, f.pos.z); }
    else _pm.copy(_p0);
    BLOBS.setMatrixAt(n, _pm); n++;
    // Outlines are the first thing to go at a distance: they double a fighter's draw calls
    const far = camera.position.distanceToSquared(f.pos) > FAR_OUTLINE;
    if (far !== f.vis.far){ f.vis.far = far; for (const o of f.vis.outlines) o.visible = !far; }
  }
  RINGS.count = BLOBS.count = n;
  RINGS.instanceMatrix.needsUpdate = BLOBS.instanceMatrix.needsUpdate = true;
  if (RINGS.instanceColor) RINGS.instanceColor.needsUpdate = true;
}
const flashes = [];
for (let i = 0; i < 10; i++){
  const m = new THREE.Mesh(SPH(1), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, depthWrite:false}));
  m.visible = false; scene.add(m); flashes.push({m, t:0, max:1, s0:0, s1:1});
}
let fIdx = 0;
function flash(pos, color, s0, s1, frames){
  const f = flashes[fIdx = (fIdx + 1) % flashes.length];
  f.m.position.copy(pos); f.m.material.color.setHex(color); f.m.visible = true;
  Object.assign(f, {t:0, max:frames, s0, s1});
}
const dust = (pos, n = 6) => emit(new V(pos.x, pos.y + .1, pos.z), n, 0xf3ead7, 3, 1.2, 22, 1.6, 2);
function splash(pos){
  const p = new V(pos.x, SEA_Y + .2, pos.z);
  Sfx.play('splash', p);
  if (!STAGE.water){ emit(p, 18, 0x9aa3b5, 4, 5, 30, 2, 12); flash(p, 0xffffff, .4, 2, 12); return; }
  emit(p, 20, 0xffffff, 3, 8, 32, 2, 16); flash(p, 0xd8f0ff, .4, 2.2, 16);
}
function explodeFx(pos){
  Sfx.play('boom', pos);
  flash(pos, 0xffa53a, .5, 3.4, 22); flash(pos, 0xffffff, .3, 2, 10);
  emit(pos, 28, 0xff7a2f, 9, 6, 32, 2.2, 10); emit(pos, 10, 0x3a3a3a, 4, 5, 40, 2.6, -1);
}
const pops = [];
function popup(pos, text, cls = '', life = 48){
  if (cls === 'heal') Sfx.play('heal', pos);
  if (pops.length > 40) return;
  const el = document.createElement('div'); el.className = 'pop ' + cls; el.textContent = text;
  $('fx').appendChild(el);
  pops.push({el, p:pos.clone(), life, max:life});
}
function banner(text, cls = ''){
  if (G.mode !== 'play') return;
  Sfx.banner(text);
  const b = $('banner'); b.textContent = text; b.className = '';
  void b.offsetWidth; b.className = 'show ' + cls;
}
function feed(text){
  if (G.mode !== 'play') return;
  const box = $('feed'), el = document.createElement('div');
  el.className = 'fi'; el.textContent = text; box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.remove(), 4000);
}

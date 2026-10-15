// Sky Brawl · forms.js — ร่างแปลง: หมาป่า, มังกรของเทมเมอร์, ห้าดาบของเบียวมังกร
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Transformations: the werewolf turns into a wolf, the tamer into a dragon ----------
   A form is a set of extra pieces worn over the normal body (fur, snout, claws, wings, tail), so every
   walk, hit and fall pose keeps working. While formT > 0 the pieces show, the body grows, attackKey()
   returns the form's own attack and, online, one bit in the snapshot tells everyone else. */
function formFx(f){
  const wolf = f.cls === 'werewolf', blade = f.cls === 'dragonblade', c = new V(f.pos.x, f.pos.y + 1, f.pos.z), col = blade ? 0x4fc3ff : wolf ? 0xd8c8a8 : 0xffa53a;
  flash(c, col, .6, 4.2, 18); emit(c, 36, col, 8, 5, 30, 2.2, 3); emit(c, 20, blade ? 0xffffff : wolf ? 0x6b4a32 : 0x3fa86a, 5, 4, 34, 1.6, 4);
}
function startForm(f){
  const fi = FORM_INFO[f.cls]; if (!fi) return;
  f.formT = Math.round(fi.secs*60);
  formFx(f);
  if (f.isLocal) G.shake = Math.max(G.shake, .6);
  popup(new V(f.pos.x, f.pos.y + 3.4, f.pos.z), f.cls === 'werewolf' ? 'แปลงร่างหมาป่า!' : f.cls === 'dragonblade' ? 'ปลดผนึกห้าดาบ!' : 'แปลงร่างมังกร!', 'combo th', 50);
}
function endForm(f){
  const c = new V(f.pos.x, f.pos.y + 1, f.pos.z);
  flash(c, 0xffffff, .5, 2.6, 12); emit(c, 22, 0xe8e0d0, 6, 4, 24, 1.8, 6);
}
// Builds the pieces, wears them over the body parts, bakes the rigid ones and hides everything until the transformation
function attachForm(cls, p){
  const wolf = cls === 'werewolf';
  const fur = wolf ? 0x6b4a32 : 0x3fa86a, dark = wolf ? 0x4a3322 : 0x2a7f50, belly = wolf ? 0xd9c7a6 : 0xf0e2a0, claw = 0xf4f1ea;
  const fh = new THREE.Group(), fb = new THREE.Group(), fal = new THREE.Group(), far = new THREE.Group(), fll = new THREE.Group(), flr = new THREE.Group();
  const out = {groups:[fh, fb, fal, far, fll, flr], wings:null, tail:null};
  const add = (g, geo, c, x, y, z, ol) => { const m = part(geo, toon(c), ol); m.position.set(x, y, z); g.add(m); return m; };
  const glowEyes = c => { for (const sd of [-1, 1]){ const e = new THREE.Mesh(new THREE.BoxGeometry(.13, .05, .03), new THREE.MeshBasicMaterial({color:c})); e.position.set(sd*.2, .06, .575); e.rotation.z = sd*.3; fh.add(e); } };
  // Head
  add(fh, halfDome(.7), fur, 0, .05, 0, 1.03).rotation.x = -.3;
  if (wolf){
    add(fh, new THREE.CylinderGeometry(.13, .22, .55, 10), fur, 0, -.1, .66, 1.06).rotation.x = PI/2;
    add(fh, SPH(.1), 0x14101c, 0, -.04, .95);
    for (const sd of [-1, 1]){
      add(fh, new THREE.ConeGeometry(.19, .52, 4), fur, sd*.36, .82, -.04, 1.06).rotation.z = -sd*.3;
      add(fh, new THREE.ConeGeometry(.09, .3, 4), belly, sd*.36, .8, 0).rotation.z = -sd*.3;
      add(fh, new THREE.ConeGeometry(.12, .32, 4), dark, sd*.52, -.12, .05).rotation.z = sd*PI*.75;
      add(fh, new THREE.ConeGeometry(.035, .13, 4), claw, sd*.1, -.27, .8).rotation.x = PI;
    }
    glowEyes(0xffd23a);
  } else {
    add(fh, new THREE.BoxGeometry(.36, .26, .56), fur, 0, -.11, .68, 1.05);
    add(fh, new THREE.BoxGeometry(.3, .08, .4), belly, 0, -.27, .62);
    for (const sd of [-1, 1]){
      add(fh, SPH(.05), 0x14101c, sd*.09, -.04, .96);
      const horn = add(fh, new THREE.ConeGeometry(.12, .72, 6), 0xf4e8c8, sd*.3, .66, -.2, 1.06); horn.rotation.x = -.85; horn.rotation.z = -sd*.25;
      add(fh, new THREE.ConeGeometry(.1, .42, 3), 0xd8342c, sd*.55, .02, -.05).rotation.z = sd*PI/2 + .2;
      add(fh, new THREE.ConeGeometry(.03, .1, 4), claw, sd*.12, -.31, .85).rotation.x = PI;
    }
    for (let i = 0; i < 3; i++) add(fh, new THREE.ConeGeometry(.07, .26, 4), dark, 0, .5 - i*.07, -.15 - i*.13).rotation.x = -.6 - i*.15;
    glowEyes(0xff9a2a);
  }
  // Body: a furry or scaly shell, a pale chest, spikes down the back and a tail
  add(fb, SPH(.44), fur, 0, 0, 0, 1.05).scale.set(1.08, 1.18, .98);
  add(fb, SPH(.3), belly, 0, -.02, .26).scale.set(.95, 1.1, .5);
  for (let i = 0; i < 5; i++) add(fb, new THREE.ConeGeometry(.08, .26, 4), dark, 0, .3 - i*.16, -.4).rotation.x = -PI/2 + .5;
  const tail = new THREE.Group(); tail.position.set(0, -.18, -.4);
  if (wolf){
    for (let i = 0; i < 3; i++) add(tail, SPH(.19 - i*.035), i === 2 ? belly : fur, 0, i*.07, -.18 - i*.22, 1.05);
  } else {
    for (let i = 0; i < 5; i++) add(tail, new THREE.ConeGeometry(.2 - i*.03, .5, 6), i === 4 ? 0xd8342c : fur, 0, i*.02, -.18 - i*.36, 1.05).rotation.x = -PI/2;
  }
  fb.add(tail); out.tail = tail;
  if (!wolf){
    out.wings = [];
    for (const sd of [-1, 1]){
      const w = new THREE.Group(); w.position.set(sd*.3, .3, -.34); w.rotation.y = sd*.5;
      const P = [[0, 0], [1, .75], [2.3, .6], [1.9, 0], [1.6, .1], [1.35, -.5], [.9, -.1], [.7, -.75], [.3, -.3], [0, -.4]];
      const shape = new THREE.Shape(); P.forEach(([x, y], i) => i ? shape.lineTo(x*sd, y) : shape.moveTo(x*sd, y));
      const mem = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshToonMaterial({color:0xd8342c, gradientMap:gmap, side:THREE.DoubleSide})); w.add(mem);
      const bone = (x0, y0, x1, y1) => {
        const len = Math.hypot(x1 - x0, y1 - y0), b = add(w, new THREE.CylinderGeometry(.04, .05, len, 5), dark, (x0 + x1)/2*sd, (y0 + y1)/2, .02);
        b.rotation.z = Math.atan2(y1 - y0, (x1 - x0)*sd) - PI/2;
      };
      bone(0, 0, 1, .75); bone(1, .75, 2.3, .6); bone(1, .75, 1.35, -.5); bone(1, .75, .7, -.75);
      fb.add(w); out.wings.push(w);
    }
  }
  // Arms and legs: furry sleeves with big paws and claws
  for (const g of [fal, far]){
    add(g, new THREE.CylinderGeometry(.14, .13, .36, 8), fur, 0, -.15, 0, 1.05);
    add(g, SPH(.21), fur, 0, -.38, 0, 1.08);
    for (const cx of [-.09, 0, .09]) add(g, new THREE.ConeGeometry(.035, .22, 4), claw, cx, -.58, .1).rotation.x = PI - .3;
  }
  for (const g of [fll, flr]){
    add(g, new THREE.CylinderGeometry(.14, .12, .26, 8), dark, 0, -.1, 0, 1.05);
    add(g, SPH(.2), dark, 0, -.27, .06, 1.08).scale.set(1, .72, 1.4);
    for (const cx of [-.07, 0, .07]) add(g, new THREE.ConeGeometry(.03, .16, 4), claw, cx, -.3, .28).rotation.x = PI/2;
  }
  p.head.add(fh); p.tilt.add(fb); p.armL.add(fal); p.armR.add(far); p.legL.add(fll); p.legR.add(flr);
  // Bake what never moves on its own; the wings and the tail stay live
  mergeMeshes(fh); mergeMeshes(fb, new Set([tail, ...(out.wings || [])]));
  mergeMeshes(tail); (out.wings || []).forEach(w => mergeMeshes(w)); mergeMeshes(fal); mergeMeshes(far); mergeMeshes(fll); mergeMeshes(flr);
  for (const g of out.groups){ g.traverse(m => { if (m.isMesh) m.castShadow = false; }); g.visible = false; }
  return out;
}
// Dragonblade's form: five swords fanned out of his hands (3 right, 2 left), a glowing eye, a blue aura and a ring at his feet
function attachBladeForm(p){
  const fr = new THREE.Group(), fl = new THREE.Group(), fh = new THREE.Group();
  const fan = (g, n, sd) => {
    g.position.y = -.36;
    for (let i = 0; i < n; i++){
      const k = new THREE.Group(); k.rotation.z = (i - (n - 1)/2)*.34*sd; k.rotation.x = .12*i;
      const bl = part(new THREE.BoxGeometry(.045, 1.2, .08), toon(0xdfe6ee), 1.08); bl.position.y = -.12 - .6; k.add(bl);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(.02, 1.14, .12), new THREE.MeshBasicMaterial({color:0x7fd4ff, transparent:true, opacity:.55, depthWrite:false})); edge.position.y = -.12 - .6; k.add(edge);
      const gd = part(new THREE.CylinderGeometry(.08, .08, .03, 10), toon(0xe8c24a)); gd.position.y = -.1; k.add(gd);
      g.add(k);
    }
  };
  fan(fr, 3, 1); fan(fl, 2, -1);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(.15, .07, .03), new THREE.MeshBasicMaterial({color:0x7fe0ff})); eye.position.set(.2, .04, .575); eye.rotation.z = .25; fh.add(eye);
  p.armR.add(fr); p.armL.add(fl); p.head.add(fh);
  mergeMeshes(fh);
  const aura = new THREE.Mesh(new THREE.RoundSphere(1.3, 16, 12), new THREE.MeshBasicMaterial({color:0x2a8cff, transparent:true, opacity:.26, depthWrite:false}));
  aura.position.y = .15; p.tilt.add(aura);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.95, 1.2, 6, 1), new THREE.MeshBasicMaterial({color:0x4fc3ff, transparent:true, opacity:.75, depthWrite:false, side:THREE.DoubleSide}));
  ring.rotation.x = -PI/2; ring.position.y = .05; p.root.add(ring);
  const groups = [fr, fl, fh];
  for (const g of [...groups, aura, ring]){ g.traverse(m => { if (m.isMesh) m.castShadow = false; }); g.visible = false; }
  return {groups, wings:null, tail:null, aura, ring, blades:true};
}
function poseForm(f, v, T, s){
  const F = v.form, on = f.formT > 0;
  for (const g of F.groups) g.visible = on;
  if (F.aura){
    F.aura.visible = F.ring.visible = on;
    if (on){
      F.aura.material.opacity = .22 + Math.sin(T*.28)*.07; F.aura.scale.setScalar(1 + Math.sin(T*.22)*.07);
      F.ring.rotation.z += .06; F.ring.scale.setScalar(1 + Math.sin(T*.18)*.1);
      if (T % 3 === 0) emit(new V(f.pos.x + (Math.random() - .5)*1.1, f.pos.y + .2, f.pos.z + (Math.random() - .5)*1.1), 1, Math.random() < .3 ? 0xffffff : 0x4fc3ff, .6, 4.5, 24, 1.3, -3);
    }
  }
  const target = on ? FORM_INFO[f.cls].scale : 1, cur = v.root.scale.x;
  v.root.scale.setScalar(Math.abs(target - cur) < .01 ? target : cur + (target - cur)*.16);
  if (!on) return;
  if (v.cw) v.cw.visible = false;   // the whip is put away while the dragon is out (and the two katanas while the five swords are out)
  if (F.blades){
    if (v.oh) v.oh.visible = false;
    if (s === 'idle'){ v.armR.rotation.set(-.55, 0, -.75); v.armL.rotation.set(-.55, 0, .75); }
    formMoveFx(f, s);
    return;
  }
  if (f.cls === 'werewolf'){
    v.tilt.rotation.x += s === 'run' ? .28 : s === 'idle' ? .22 : 0;
    if (s === 'idle'){ v.armL.rotation.x = -.5; v.armR.rotation.x = -.5; }
  }
  if (F.wings){
    const flap = s === 'air' || s === 'tumble' ? .9 : s === 'attack' ? .25 : .45, ph = Math.sin(T*(s === 'air' ? .5 : .16))*flap;
    F.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1)*(.35 + ph); });
  }
  if (F.tail) F.tail.rotation.y = Math.sin(T*.1 + f.idx)*(s === 'run' ? .45 : .22);
  formMoveFx(f, s);
}

const FLAME_COL = [0xffe066, 0xff9a2a, 0xff5a1f];
// Fire shot out of the dragon's mouth, drawn on every screen from the move itself (damage is the host's breathTick)
function flameBurst(f, m, n){
  const sc = FORM_INFO[f.cls].scale, a0 = f.facing, pool = SPARKS;
  const ox = f.pos.x + Math.sin(a0)*.9*sc, oy = f.pos.y + 1.15*sc, oz = f.pos.z + Math.cos(a0)*.9*sc;
  for (let i = 0; i < n; i++){
    const k = pool.idx = (pool.idx + 1) % pool.list.length, p = pool.list[k];
    const a = a0 + (Math.random() - .5)*m.arc*1.7, sp = m.range/.4*(.55 + Math.random()*.5);
    p.pos.set(ox, oy, oz); p.v.set(Math.sin(a)*sp, (Math.random() - .3)*2.2, Math.cos(a)*sp);
    p.life = p.max = 18 + Math.random()*10; p.s = 1.3 + Math.random()*1.5; p.g = -2;
    pool.mesh.setColorAt(k, _pc.setHex(FLAME_COL[i % 3]));
  }
  pool.mesh.instanceColor.needsUpdate = true;
}
function formMoveFx(f, s){
  const m = f.move, t = f.stateT; if (s !== 'attack' || !m) return;
  if (m.breath){
    if (t >= m.startup && t < m.startup + m.active){ flameBurst(f, m, 4); if (G.frame % 9 === 0) Sfx.play('flame', f.pos, .7); }
    return;
  }
  if (m.blades && t >= m.startup){
    const id = f.moveKey + ':' + (G.frame - t);
    if (f.fxId === id) return;
    f.fxId = id;
    // A fan of blue sword trails in front (a full ring for the spinning finisher)
    const full = m.anim === 'spin', n = full ? 16 : 9, R = (m.rad + (m.reach || 0))*.9;
    for (let i = 0; i < n; i++){
      const a = f.facing + (full ? i/n*PI*2 : (i/(n - 1) - .5)*2.2);
      const c = new V(f.pos.x + Math.sin(a)*R, f.pos.y + .9, f.pos.z + Math.cos(a)*R);
      emit(c, 2, i % 2 ? 0xffffff : 0x4fc3ff, 1.2, .6, 14, 1.4, 0);
    }
    flash(new V(f.pos.x + Math.sin(f.facing)*(full ? 0 : R*.6), f.pos.y + .9, f.pos.z + Math.cos(f.facing)*(full ? 0 : R*.6)), 0x7fd4ff, .7, m.rad + .5, 9);
    return;
  }
  if (m.rake && t >= m.startup){
    const id = f.moveKey + ':' + (G.frame - t);
    if (f.fxId === id) return;
    f.fxId = id;
    const c = new V(f.pos.x, f.pos.y + .9, f.pos.z);
    flash(c, 0xe8dcc0, .8, m.rad + .6, 9); emit(c, 16, 0xf4efe0, m.rad*3.5, 1, 16, 1.2, 0);
  }
}
// Host only: the cone of fire in front of the dragon. Every m.tick frames it hurts everyone inside and steers slowly toward the aim.
function breathTick(f, m, k){
  let ta = null;
  if (f.ctrl === 'bot'){ const t = f.ai.tgt; if (t && alive(t)) ta = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z); }
  else if (Math.hypot(f.input.x, f.input.z) > .25) ta = Math.atan2(f.input.x, f.input.z);
  if (ta !== null){ let d = ta - f.facing; d = Math.atan2(Math.sin(d), Math.cos(d)); f.facing += d*.1; }
  if (k % m.tick) return;
  const R = m.range;
  const inCone = (x, z, pad) => {
    const dx = x - f.pos.x, dz = z - f.pos.z, d = Math.hypot(dx, dz);
    if (d > R + pad) return false;
    if (d < 1.2) return true;
    let da = Math.atan2(dx, dz) - f.facing; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
    return da <= m.arc + Math.atan2(pad, d);
  };
  for (const o of G.fighters){
    if (o === f || ally(f, o) || !hittable(o) || Math.abs(o.pos.y - f.pos.y) > 2.6 || !inCone(o.pos.x, o.pos.z, .5)) continue;
    const dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z, d = Math.hypot(dx, dz);
    applyHit(f, o, m, d > .01 ? new V(dx/d, 0, dz/d) : new V(Math.sin(f.facing), 0, Math.cos(f.facing)), f);
  }
  if (G.teamMode) for (const st of G.stones) if (st.hp > 0 && st.side !== f.side && inCone(st.pos.x, st.pos.z, .9)) damageStone(st, m.dmg, f);
  const B = G.boss;
  if (B && B.hp > 0 && inCone(B.pos.x, B.pos.z, BOSS_R)) damageBoss(m.dmg*(f.rage > 0 ? 1.5 : 1), f);
}

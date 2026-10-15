// Sky Brawl · fighter-model.js — ประกอบโมเดลนักสู้ทั้งตัว (buildChibi)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
function buildChibi(look, team){
  const o = OUTFITS[look.outfit] || OUTFITS.none, oc = o.build ? tintOf(look) : 0, color = o.body ? tintColor(o.body, oc) : look.body, skin = look.skin;
  const root = new THREE.Group();
  const tilt = new THREE.Group(); tilt.position.y = .75; root.add(tilt);
  const body = part(SPH(.4), toon(color), 1.07); body.scale.set(1, 1.1, .85); tilt.add(body);
  const belt = part(new THREE.TorusGeometry(.36,.05,6,20), toon(INK)); belt.rotation.x = PI/2; belt.position.y = -.14; tilt.add(belt);
  const head = new THREE.Group(); head.position.y = .78; tilt.add(head);
  head.add(part(SPH(.56), toon(skin), 1.05));
  if (!o.noHair) buildHair(head, look);
  if (!o.head || FLOAT_HATS.has(look.hat)) buildHat(head, look, !!o.head);
  const eyesG = new THREE.Group(); head.add(eyesG); buildEyes(eyesG, look);
  const ouchF = buildOuchFace(), koF = buildKoFace(), joyF = buildJoyFace(); ouchF.visible = koF.visible = joyF.visible = false; head.add(ouchF, koF, joyF);
  if (o.build){
    const before = new Set([...head.children, ...tilt.children]);
    o.build(head, tilt);
    if (oc) for (const c of [...head.children, ...tilt.children]) if (!before.has(c)) recolor(c, oc);
  }
  for (const s of [-1,1]){ const ck = new THREE.Mesh(SPH(.07), toon(0xff9c8a)); ck.scale.set(1,.6,.4); ck.position.set(s*.33,-.14,.44); head.add(ck); }
  const mkArm = s => {
    const p = new THREE.Group(); p.position.set(s*.42,.18,0);
    const up = part(new THREE.CylinderGeometry(.09,.08,.3,8), toon(color)); up.position.y = -.15; p.add(up);
    const hand = part(SPH(.15), toon(skin), 1.1); hand.position.y = -.36; p.add(hand);
    tilt.add(p); return p;
  };
  const mkLeg = s => {
    const p = new THREE.Group(); p.position.set(s*.18,-.38,0);
    const lg = part(new THREE.CylinderGeometry(.1,.09,.22,8), toon(0x2a3550)); lg.position.y = -.1; p.add(lg);
    const ft = part(SPH(.16), toon(0x2a3550), 1.1); ft.scale.set(1,.7,1.3); ft.position.set(0,-.26,.05); p.add(ft);
    tilt.add(p); return p;
  };
  const armL = mkArm(1), armR = mkArm(-1), legL = mkLeg(1), legR = mkLeg(-1);
  const hammer = buildHammer(); hammer.position.y = -.36; armR.add(hammer);
  const gun = buildGun('gun'); gun.position.y = -.36; armR.add(gun);
  const shotgun = buildGun('shotgun'); shotgun.position.y = -.36; armR.add(shotgun);
  const cw = buildClassWeapon(look.outfit); if (cw){ cw.position.y = -.36; armR.add(cw); }
  const oh = buildOffhand(look.outfit); if (oh){ oh.position.y = -.36; armL.add(oh); }
  const bomb = buildBomb(); bomb.position.y = 1.55; tilt.add(bomb);
  const bubble = new THREE.Mesh(new THREE.RoundSphere(1.05, 18, 12), new THREE.MeshBasicMaterial({color:team, transparent:true, opacity:.22, depthWrite:false}));
  bubble.position.y = .1; tilt.add(bubble);
  const wire = c => new THREE.Mesh(new THREE.RoundSphere(1,12,8), new THREE.MeshBasicMaterial({color:c, wireframe:true}));
  const hurt = wire(0x3fbf5a); hurt.scale.setScalar(.55); const hit = wire(0xff2a2a);
  // Bake each rigid piece: about 58 draw calls per fighter become about 16
  mergeMeshes(tilt, new Set([head, armL, armR, legL, legR, bomb, bubble]));
  mergeMeshes(head, new Set([eyesG, ouchF, koF, joyF])); mergeMeshes(eyesG); mergeMeshes(ouchF); mergeMeshes(koF); mergeMeshes(joyF);
  mergeMeshes(armL, new Set([oh].filter(Boolean)));
  mergeMeshes(armR, new Set([hammer, gun, shotgun, cw].filter(Boolean)));
  mergeMeshes(legL); mergeMeshes(legR);
  for (const g of [hammer, gun, shotgun, cw, oh]) if (g) mergeMeshes(g);
  let rageFx = null;
  if (look.outfit === 'berserker'){
    const eyes = new THREE.Group();
    for (const sd of [-1, 1]){
      const e = new THREE.Mesh(new THREE.BoxGeometry(.17, .17, .05), new THREE.MeshBasicMaterial({color:0xff1a1a})); e.position.set(sd*.2, .02, .56); eyes.add(e);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(.2, .05, .05), new THREE.MeshBasicMaterial({color:0x5a0a0a})); brow.position.set(sd*.2, .16, .56); brow.rotation.z = sd*.45; eyes.add(brow);
    }
    eyes.visible = false; head.add(eyes);
    const aura = new THREE.Mesh(new THREE.RoundSphere(1.25, 16, 12), new THREE.MeshBasicMaterial({color:0xff2a2a, transparent:true, opacity:.25, depthWrite:false})); aura.position.y = .1; aura.visible = false; tilt.add(aura);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.15, 4, 1), new THREE.MeshBasicMaterial({color:0xff3a3a, transparent:true, opacity:.7, depthWrite:false, side:THREE.DoubleSide})); ring.rotation.x = -PI/2; ring.position.y = .05; ring.visible = false; root.add(ring);
    rageFx = {eyes, aura, ring};
  }
  const form = look.outfit === 'werewolf' || look.outfit === 'tamer' ? attachForm(look.outfit, {head, tilt, armL, armR, legL, legR})
    : look.outfit === 'dragonblade' ? attachBladeForm({head, tilt, armL, armR, root}) : null;
  const outlines = [];
  root.traverse(m => { if (m.isMesh){ m.castShadow = false; if (m.material === OUT) outlines.push(m); } });
  scene.add(root, hurt, hit);
  return {root, tilt, head, armL, armR, legL, legR, hammer, gun, shotgun, cw, oh, bomb, bubble, hurt, hit, outlines, form, rageFx, face:{eyes:eyesG, ouch:ouchF, ko:koF, joy:joyF}, far:false};
}

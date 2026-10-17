// Sky Brawl · classes.js — ★ หน้าตา: ผม หมวก ตา และชุดอาชีพทั้งหมด (OUTFITS) — อาชีพใหม่ต่อท้าย OUTFITS เท่านั้น
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Character customization ---------- */
const HAIRS = {short:'สั้น', spiky:'ชี้ฟู', buns:'จุกคู่', long:'ยาว', mohawk:'โมฮอว์ก', none:'โล้น'};
const HATS = {band:'ผ้าคาดหัว', cap:'หมวกแก๊ป', ears:'หูแมว', horns:'เขา', crown:'มงกุฎ', none:'ไม่ใส่', halo:'วงแหวนนางฟ้า', tophat:'หมวกทรงสูง', flower:'มงกุฎดอกไม้', star:'ดาวลอยฟ้า', chef:'หมวกเชฟ', headphones:'หูฟังเกมเมอร์', wizard:'หมวกพ่อมด', pirate:'หมวกโจรสลัด', propeller:'หมวกใบพัด'};
const EYES = {round:'ตากลม', angry:'ตาดุ', sleepy:'ตาง่วง', happy:'ตายิ้ม'};
const HAIR_K = Object.keys(HAIRS), HAT_K = Object.keys(HATS), EYE_K = Object.keys(EYES);
// Daily-login rewards: these hats and titles are unlocked by claim_daily() (supabase-daily.sql); bots never wear them
const DAILY_HATS = new Set(['halo', 'tophat', 'flower', 'star']);
// Shop items (js/shop.js, prices decided by supabase-shop.sql); bots never wear them either
const SHOP_HATS = new Set(['chef', 'headphones', 'wizard', 'pirate', 'propeller']), SHOP_TITLES = new Set(['shopper', 'cute', 'bigboss', 'shadow', 'ace', 'rich']);
const HAT_FREE = HAT_K.filter(k => !DAILY_HATS.has(k) && !SHOP_HATS.has(k));
const FLOAT_HATS = new Set(['halo', 'star']);   // float above the head, so they also show with a class helmet
const TITLES = {none:'ไม่ใช้ฉายา', regular:'ขาประจำ', steady:'ไม่เคยขาด', guardian:'ผู้พิทักษ์ลอยฟ้า', legend7:'ตำนาน 7 วัน', d14:'ขาประจำ 14 วัน', d30:'สุดยอดขาประจำ 30 วัน', quest5:'นักล่าภารกิจ', quest20:'เจ้าแห่งภารกิจ', shopper:'ขาช้อป', cute:'น่ารักที่สุดในเซิร์ฟ', bigboss:'บอสใหญ่', shadow:'เงามรณะ', ace:'มือหนึ่งแห่งเวที', rich:'เศรษฐีลอยฟ้า'};
const TITLE_K = Object.keys(TITLES);
// Class outfits: each one recolors the body and adds its own gear; head:true replaces the hat, noHair hides the hair
const OP = (geo, c, ol) => part(geo, toon(c), ol);
const oCape = (t, c) => { const m = OP(new THREE.BoxGeometry(.62, .78, .04), c); m.position.set(0, -.08, -.37); m.rotation.x = .18; t.add(m); };
const oRobe = (t, c) => { const m = OP(new THREE.CylinderGeometry(.3, .56, .5, 16, 1, true), c); m.position.y = -.33; t.add(m); };
const oPads = (t, c) => { for (const x of [-1, 1]){ const m = OP(SPH(.17), c, 1.08); m.scale.y = .7; m.position.set(x*.43, .24, 0); t.add(m); } };
const oDome = (h, c, r = .64) => { const m = OP(halfDome(r), c, 1.04); m.position.y = .1; h.add(m); return m; };
const oCross = (t, c) => { const v = OP(new THREE.BoxGeometry(.06, .22, .03), c); v.position.set(0, .05, .35); const w = OP(new THREE.BoxGeometry(.18, .06, .03), c); w.position.set(0, .09, .35); t.add(v, w); };
const oHood = (h, c) => { const m = OP(new THREE.SphereGeometry(.66, 24, 16, 0, PI*2, 0, PI*.56), c, 1.03); m.rotation.x = -.5; h.add(m); };
const oMask = (h, c) => { h.add(OP(new THREE.SphereGeometry(.585, 24, 12, 0, PI*2, PI*.57, PI*.28), c)); };
const oCollar = (t, c, r = .32, tube = .11) => { const m = OP(new THREE.TorusGeometry(r, tube, 8, 18), c); m.rotation.x = PI/2; m.position.y = .32; t.add(m); };
const goggles = (h, frame, y) => {
  for (const s of [-1, 1]){
    const g = OP(new THREE.TorusGeometry(.11, .035, 6, 14), frame); g.position.set(s*.16, y, .55); g.rotation.x = -.6; h.add(g);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(.1, 14), new THREE.MeshBasicMaterial({color:0x9fd8ff})); lens.position.set(s*.16, y, .56); lens.rotation.x = -.6; h.add(lens);
  }
};
const OUTFITS = {
  none:{name:'ไม่ใส่'},
  knight:{name:'อัศวิน', body:0x9aa7b8, head:true, noHair:true, build(h, t){
    oDome(h, 0xc9d2de);
    const visor = OP(new THREE.BoxGeometry(.9, .07, .3), 0x2b2f3a); visor.position.set(0, .2, .42); h.add(visor);
    const plume = OP(new THREE.ConeGeometry(.12, .5, 8), 0xd8342c); plume.position.set(0, .82, -.1); plume.rotation.x = -.4; h.add(plume);
    oPads(t, 0xc9d2de); oCape(t, 0xb8282a);
  }},
  warrior:{name:'นักรบ', body:0x7a4b2a, head:true, noHair:true, build(h, t){
    oDome(h, 0x9aa3b5);
    const rim = OP(new THREE.TorusGeometry(.62, .05, 6, 24), 0xc69b3c); rim.rotation.x = PI/2; rim.position.y = .12; h.add(rim);
    for (const s of [-1, 1]){ const horn = OP(new THREE.ConeGeometry(.09, .42, 8), 0xfff0cc, 1.1); horn.position.set(s*.58, .42, 0); horn.rotation.z = -s*.9; h.add(horn); }
    oCollar(t, 0x6b4a2e);
  }},
  berserker:{name:'เบอร์เซิร์กเกอร์', body:0x8e2b2b, head:true, build(h, t){
    const band = OP(new THREE.TorusGeometry(.57, .07, 6, 28), 0xd8342c); band.rotation.x = PI/2 - .3; band.position.y = .12; h.add(band);
    for (const s of [-1, 1]){
      const tail = OP(new THREE.BoxGeometry(.08, .35, .04), 0xd8342c); tail.position.set(s*.1, -.05, -.6); tail.rotation.z = s*.3; h.add(tail);
      const paint = new THREE.Mesh(new THREE.BoxGeometry(.16, .035, .02), toon(0xd8342c)); paint.position.set(s*.3, -.08, .48); paint.rotation.y = s*.5; h.add(paint);
    }
    const pad = OP(SPH(.2), 0x5a5f6b, 1.08); pad.position.set(-.45, .25, 0); t.add(pad);
    for (let i = 0; i < 3; i++){ const sp = OP(new THREE.ConeGeometry(.05, .22, 6), 0xe8e8e8); sp.position.set(-.47, .46, -.1 + i*.1); t.add(sp); }
    oCollar(t, 0x3b2a1e, .3, .09);
  }},
  paladin:{name:'พาลาดิน', body:0xf2efe6, head:true, noHair:true, build(h, t){
    oDome(h, 0xf7f4ec);
    const rim = OP(new THREE.TorusGeometry(.62, .05, 6, 24), 0xe0b13a); rim.rotation.x = PI/2; rim.position.y = .12; h.add(rim);
    for (const s of [-1, 1]){ const wing = OP(new THREE.ConeGeometry(.13, .52, 4), 0xe0b13a, 1.08); wing.position.set(s*.62, .45, -.05); wing.rotation.z = -s*.6; wing.scale.z = .3; h.add(wing); }
    oPads(t, 0xe0b13a); oCape(t, 0x3a6fd8); oCross(t, 0xe0b13a);
  }},
  mage:{name:'นักเวทย์', body:0x5b3fa8, head:true, build(h, t){
    const brim = OP(new THREE.CylinderGeometry(.8, .8, .05, 28), 0x3d2a78, 1.04); brim.position.y = .3; h.add(brim);
    const cone = OP(new THREE.ConeGeometry(.46, 1.05, 20), 0x3d2a78, 1.04); cone.position.set(0, .82, -.1); cone.rotation.x = -.25; h.add(cone);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(.09), new THREE.MeshBasicMaterial({color:0xffd23a})); star.position.set(.14, .72, .2); h.add(star);
    oRobe(t, 0x3d2a78);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.07), new THREE.MeshBasicMaterial({color:0x7fe3ff})); gem.position.set(0, .08, .36); t.add(gem);
  }},
  priest:{name:'นักบวช', body:0xf5f2ea, head:true, build(h, t){
    const mitre = OP(new THREE.CylinderGeometry(.2, .36, .62, 4), 0xf7f4ec, 1.05); mitre.position.y = .72; mitre.rotation.y = PI/4; mitre.scale.z = .6; h.add(mitre);
    const band = OP(new THREE.CylinderGeometry(.37, .37, .08, 4), 0xe0b13a); band.position.y = .46; band.rotation.y = PI/4; band.scale.z = .6; h.add(band);
    oCross(t, 0xe0b13a); oRobe(t, 0xf7f4ec);
    const stole = OP(new THREE.BoxGeometry(.1, .5, .03), 0xe0b13a); stole.position.set(.16, -.05, .34); t.add(stole);
  }},
  necro:{name:'เนโครแมนเซอร์', body:0x2a2238, head:true, noHair:true, build(h, t){
    oHood(h, 0x1d1828);
    for (const s of [-1, 1]){ const g = new THREE.Mesh(SPH(.05), new THREE.MeshBasicMaterial({color:0x8dff6a})); g.position.set(s*.2, .03, .54); h.add(g); }
    const skull = OP(SPH(.1), 0xf2efe6); skull.position.set(0, .08, .35); t.add(skull);
    oCape(t, 0x3b2a5a); oRobe(t, 0x1d1828);
    const orb = new THREE.Mesh(SPH(.12), new THREE.MeshBasicMaterial({color:0x8dff6a, transparent:true, opacity:.85})); orb.position.set(.75, .55, .25); t.add(orb);
  }},
  druid:{name:'ดรูอิด', body:0x4d7a3a, head:true, build(h, t){
    const crown = OP(new THREE.TorusGeometry(.57, .06, 6, 24), 0x3fbf5a); crown.rotation.x = PI/2 - .3; crown.position.y = .14; h.add(crown);
    for (const s of [-1, 1]){
      const a = OP(new THREE.CylinderGeometry(.03, .045, .45, 6), 0x8a5a2b); a.position.set(s*.32, .64, -.05); a.rotation.z = -s*.45; h.add(a);
      const b = OP(new THREE.CylinderGeometry(.025, .03, .24, 6), 0x8a5a2b); b.position.set(s*.44, .74, .05); b.rotation.set(.5, 0, -s*1.1); h.add(b);
    }
    for (let i = 0; i < 5; i++){ const lf = OP(SPH(.08), 0x6fe08a); lf.scale.set(1, .45, 1.5); const a = (i - 2)*.45; lf.position.set(Math.sin(a)*.58, .2, Math.cos(a)*.5); lf.rotation.y = a; h.add(lf); }
    oRobe(t, 0x3a5c2b);
  }},
  archer:{name:'นักธนู', body:0x3f8f4a, head:true, build(h, t){
    const hat = OP(new THREE.ConeGeometry(.5, .55, 16), 0x2f6b38, 1.04); hat.position.set(0, .5, -.05); hat.rotation.set(-.35, 0, .25); hat.scale.z = 1.4; h.add(hat);
    const feather = OP(new THREE.ConeGeometry(.05, .5, 6), 0xd8342c); feather.position.set(-.32, .7, -.2); feather.rotation.set(-.6, 0, .6); h.add(feather);
    const quiver = OP(new THREE.CylinderGeometry(.12, .1, .6, 10), 0x8a5a2b, 1.08); quiver.position.set(.15, .1, -.4); quiver.rotation.z = -.4; t.add(quiver);
    for (let i = 0; i < 3; i++){ const ar = OP(new THREE.ConeGeometry(.04, .12, 4), 0xf4f1ea); ar.position.set(.24 + i*.03, .44 - i*.04, -.42 + (i - 1)*.05); ar.rotation.z = -.4; t.add(ar); }
  }},
  assassin:{name:'แอสซาซิน', body:0x2b2f3a, head:true, noHair:true, build(h, t){
    oHood(h, 0x3a3f4b); oMask(h, 0x1d2233);
    oCollar(t, 0xb8282a, .3, .08);
    const tail = OP(new THREE.BoxGeometry(.12, .4, .04), 0xb8282a); tail.position.set(.15, .15, -.38); tail.rotation.set(.3, 0, -.3); t.add(tail);
    const dagger = OP(new THREE.BoxGeometry(.05, .35, .03), 0xc9d2de); dagger.position.set(-.3, -.15, .3); dagger.rotation.z = -.6; t.add(dagger);
  }},
  ninja:{name:'นินจา', body:0x1d2233, head:true, noHair:true, build(h, t){
    h.add(OP(new THREE.SphereGeometry(.59, 24, 12, 0, PI*2, 0, PI*.42), 0x1d2233));
    oMask(h, 0x1d2233);
    const band = OP(new THREE.TorusGeometry(.59, .05, 6, 28), 0x3a3f4b); band.rotation.x = PI/2; band.position.y = .2; h.add(band);
    const plate = OP(new THREE.BoxGeometry(.24, .1, .04), 0xc9d2de); plate.position.set(0, .2, .58); h.add(plate);
    for (const s of [-1, 1]){ const tl = OP(new THREE.BoxGeometry(.06, .4, .03), 0x3a3f4b); tl.position.set(s*.08, 0, -.62); tl.rotation.z = s*.35; h.add(tl); }
    const sword = OP(new THREE.BoxGeometry(.06, .9, .03), 0x2b2f3a); sword.position.set(0, .15, -.4); sword.rotation.z = .7; t.add(sword);
  }},
  // The wanderer: a wide straw kasa, a faded indigo kimono, a white sash and a spare blade at the hip
  samurai:{name:'ซามูไรพเนจร', body:0x3f4f6f, head:true, build(h, t){
    const kasa = OP(new THREE.ConeGeometry(.98, .42, 24), 0xd9b66a, 1.04); kasa.position.y = .62; h.add(kasa);
    const rim = OP(new THREE.TorusGeometry(.95, .03, 5, 28), 0xb8924a); rim.rotation.x = PI/2; rim.position.y = .42; h.add(rim);
    for (const s of [-1, 1]){ const cord = OP(new THREE.BoxGeometry(.025, .45, .025), 0x6b4a32); cord.position.set(s*.42, .1, .2); cord.rotation.z = s*.25; h.add(cord); }
    for (const s of [-1, 1]){ const lap = OP(new THREE.BoxGeometry(.12, .55, .03), 0xe8e0d0); lap.position.set(s*.08, .15, .37); lap.rotation.z = s*.45; t.add(lap); }
    const obi = OP(new THREE.TorusGeometry(.4, .07, 6, 20), 0xe8e0d0); obi.rotation.x = PI/2; obi.position.y = -.1; t.add(obi);
    const hakama = OP(new THREE.CylinderGeometry(.36, .54, .42, 16, 1, true), 0x2b2f3a); hakama.position.y = -.36; t.add(hakama);
    const kat = OP(new THREE.BoxGeometry(.05, 1.05, .05), 0x1d2233); kat.position.set(.32, -.12, -.28); kat.rotation.set(.3, 0, -1.15); t.add(kat);
    const tsuba = OP(new THREE.CylinderGeometry(.08, .08, .03, 10), 0xd9a92a); tsuba.position.set(-.08, .05, -.12); tsuba.rotation.z = -1.15 + PI/2; t.add(tsuba);
  }},
  monk:{name:'มังก์', body:0xe8892c, head:true, noHair:true, build(h, t){
    for (let i = 0; i < 14; i++){ const a = i/14*PI*2; const bd = OP(SPH(.055), 0x6b3f1e); bd.position.set(Math.cos(a)*.3, .33 - Math.max(0, Math.sin(a))*.12, Math.sin(a)*.3); t.add(bd); }
    const sash = OP(new THREE.BoxGeometry(.12, .8, .04), 0xb8282a); sash.position.set(0, .05, .35); sash.rotation.z = .6; t.add(sash);
    const dot = new THREE.Mesh(SPH(.03), toon(0xb8282a)); dot.position.set(0, .22, .53); h.add(dot);
  }},
  bard:{name:'กวี', body:0x2f8f8f, head:true, build(h, t){
    const beret = OP(SPH(.5), 0xb8282a, 1.04); beret.scale.set(1.15, .35, 1.1); beret.position.set(.08, .48, -.05); beret.rotation.z = -.2; h.add(beret);
    const feather = OP(new THREE.ConeGeometry(.05, .6, 6), 0xffc23a); feather.position.set(-.35, .7, -.15); feather.rotation.set(-.3, 0, .9); h.add(feather);
    const lute = OP(SPH(.24), 0xb07a3a, 1.06); lute.scale.set(1, 1.2, .4); lute.position.set(-.05, -.05, -.42); t.add(lute);
    const neck = OP(new THREE.BoxGeometry(.07, .5, .05), 0x6b3f1e); neck.position.set(.12, .35, -.42); neck.rotation.z = -.4; t.add(neck);
  }},
  gunner:{name:'มือปืน', body:0x7a5230, head:true, build(h, t){
    const brim = OP(new THREE.CylinderGeometry(.85, .85, .05, 28), 0x5a3a1e, 1.04); brim.position.y = .34; brim.scale.z = .85; h.add(brim);
    const crown = OP(new THREE.CylinderGeometry(.36, .42, .38, 20), 0x5a3a1e, 1.04); crown.position.y = .54; h.add(crown);
    const band = OP(new THREE.CylinderGeometry(.425, .425, .07, 20), 0x2b1d16); band.position.y = .4; h.add(band);
    const scarf = OP(new THREE.ConeGeometry(.3, .3, 3), 0xb8282a); scarf.position.set(0, .25, .25); scarf.rotation.x = PI; t.add(scarf);
    const strap = OP(new THREE.BoxGeometry(.09, .9, .04), 0x3a2a1a); strap.position.set(0, 0, .35); strap.rotation.z = .7; t.add(strap);
  }},
  engineer:{name:'วิศวกร', body:0xe0a12a, head:true, build(h, t){
    oDome(h, 0xffc23a, .62);
    const brim = OP(new THREE.CylinderGeometry(.68, .68, .04, 24), 0xffc23a); brim.position.y = .12; h.add(brim);
    for (const s of [-1, 1]){
      const g = OP(new THREE.TorusGeometry(.11, .035, 6, 14), 0x2b2f3a); g.position.set(s*.16, .24, .6); g.rotation.x = -.35; h.add(g);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(.1, 14), new THREE.MeshBasicMaterial({color:0x7fe3ff})); lens.position.set(s*.16, .24, .61); lens.rotation.x = -.35; h.add(lens);
    }
    const pack = OP(new THREE.BoxGeometry(.5, .55, .25), 0x5a5f6b, 1.05); pack.position.set(0, .02, -.45); t.add(pack);
    const pipe = OP(new THREE.CylinderGeometry(.05, .05, .4, 8), 0xc9d2de); pipe.position.set(.18, .4, -.5); t.add(pipe);
    const wrench = OP(new THREE.BoxGeometry(.06, .4, .04), 0xc9d2de); wrench.position.set(-.2, -.1, .35); wrench.rotation.z = .5; t.add(wrench);
  }},
  pony:{name:'โพนี่', body:0xc8a2ff, head:true, noHair:true, build(h, t){
    const hood = OP(new THREE.SphereGeometry(.62, 24, 16, 0, PI*2, 0, PI*.45), 0xc8a2ff, 1.03); hood.rotation.x = -.2; h.add(hood);
    for (const s of [-1, 1]){ const ear = OP(new THREE.ConeGeometry(.13, .32, 6), 0xc8a2ff, 1.08); ear.position.set(s*.3, .6, -.05); ear.rotation.z = -s*.25; h.add(ear); }
    const horn = OP(new THREE.ConeGeometry(.08, .45, 10), 0xffe066, 1.08); horn.position.set(0, .66, .28); horn.rotation.x = .5; h.add(horn);
    const rainbow = [0xff5d4a, 0xffc23a, 0x3fbf5a, 0x2f8cff, 0x9b5de5];
    rainbow.forEach((c, i) => { const phi = .3 + i*.38; const m = OP(SPH(.17), c); m.position.set(0, .64*Math.cos(phi), -.64*Math.sin(phi)); h.add(m); });
    rainbow.forEach((c, i) => { const m = OP(SPH(.15 - i*.012), c); m.position.set(0, -.12 - i*.07, -.42 - i*.12); t.add(m); });
  }},
  gundam:{name:'เมคา', body:0xf4f4f4, head:true, noHair:true, build(h, t){
    oDome(h, 0xf4f4f4);
    for (const s of [-1, 1]){
      const fin = OP(new THREE.BoxGeometry(.06, .5, .05), 0xffc23a); fin.position.set(s*.16, .55, .52); fin.rotation.z = -s*.75; h.add(fin);
      const eye = new THREE.Mesh(new THREE.BoxGeometry(.14, .05, .02), new THREE.MeshBasicMaterial({color:0x6bff8a})); eye.position.set(s*.2, .05, .56); eye.rotation.z = s*.2; h.add(eye);
      const vent = OP(new THREE.BoxGeometry(.06, .2, .2), 0x9aa3b5); vent.position.set(s*.6, .05, 0); h.add(vent);
      const sh = OP(new THREE.BoxGeometry(.32, .3, .4), 0xf4f4f4, 1.06); sh.position.set(s*.48, .26, 0); t.add(sh);
      const stripe = OP(new THREE.BoxGeometry(.33, .08, .41), 0x2f5bd8); stripe.position.set(s*.48, .2, 0); t.add(stripe);
      const v = OP(new THREE.BoxGeometry(.14, .12, .04), 0xffc23a); v.position.set(s*.16, .12, .37); t.add(v);
      const hilt = OP(new THREE.CylinderGeometry(.04, .04, .3, 8), 0xf4f4f4); hilt.position.set(s*.18, .45, -.48); hilt.rotation.z = s*.3; t.add(hilt);
    }
    const crest = OP(new THREE.BoxGeometry(.12, .1, .06), 0xd8342c); crest.position.set(0, .4, .56); h.add(crest);
    const chin = OP(new THREE.BoxGeometry(.2, .1, .1), 0xd8342c); chin.position.set(0, -.36, .44); h.add(chin);
    const chest = OP(new THREE.BoxGeometry(.6, .32, .12), 0x2f5bd8, 1.05); chest.position.set(0, .12, .3); t.add(chest);
    const pack = OP(new THREE.BoxGeometry(.5, .45, .22), 0xf4f4f4, 1.05); pack.position.set(0, .1, -.42); t.add(pack);
    const skirt = OP(new THREE.BoxGeometry(.55, .18, .5), 0xd8342c); skirt.position.y = -.22; t.add(skirt);
  }},
  merchant:{name:'พ่อค้า', body:0xc68a3a, head:true, build(h, t){
    const cap = OP(SPH(.62), 0x3f7a3a, 1.04); cap.scale.set(1.05, .42, 1.05); cap.position.y = .36; h.add(cap);
    const peak = OP(new THREE.BoxGeometry(.5, .04, .26), 0x2f5a2a); peak.position.set(0, .3, .58); h.add(peak);
    const apron = OP(new THREE.BoxGeometry(.5, .55, .04), 0xf2e6c8); apron.position.set(0, -.15, .35); t.add(apron);
    const bag = OP(SPH(.14), 0xc69b3c); bag.position.set(-.4, -.22, .15); t.add(bag);
    const cart = OP(new THREE.BoxGeometry(.6, .34, .42), 0x8a5a2b, 1.05); cart.position.set(0, -.05, -.58); t.add(cart);
    for (const s of [-1, 1]){ const w = OP(new THREE.CylinderGeometry(.16, .16, .06, 14), 0x3a2a1a); w.rotation.z = PI/2; w.position.set(s*.34, -.24, -.58); t.add(w); }
  }},
  blacksmith:{name:'ช่างตีเหล็ก', body:0x5a4636, head:true, build(h, t){
    const band = OP(new THREE.TorusGeometry(.58, .07, 6, 28), 0xa8322c); band.rotation.x = PI/2 - .25; band.position.y = .16; h.add(band);
    goggles(h, 0x3a3f4b, .42);
    const apron = OP(new THREE.BoxGeometry(.56, .62, .05), 0x6b3f1e); apron.position.set(0, -.12, .35); t.add(apron);
    oPads(t, 0x3a3f4b);
  }},
  hunter:{name:'ฮันเตอร์', body:0x5f7f3a, head:true, build(h, t){
    oDome(h, 0x3f5a2a, .63);
    const brim = OP(new THREE.CylinderGeometry(.74, .74, .04, 24), 0x3f5a2a); brim.position.y = .12; h.add(brim);
    const feather = OP(new THREE.ConeGeometry(.05, .6, 6), 0xf4f1ea); feather.position.set(.4, .62, -.15); feather.rotation.set(-.4, 0, -.7); h.add(feather);
    const bird = new THREE.Group(); bird.position.set(.66, .42, .05); bird.scale.setScalar(1.25);
    const bb = OP(SPH(.15), 0x8a5a2b); bb.scale.set(.85, 1, 1.15); bird.add(bb);
    const bh = OP(SPH(.1), 0xf2e6c8); bh.position.set(0, .16, .06); bird.add(bh);
    const beak = OP(new THREE.ConeGeometry(.04, .1, 6), 0xffc23a); beak.rotation.x = PI/2; beak.position.set(0, .15, .17); bird.add(beak);
    for (const s of [-1, 1]){ const w = OP(new THREE.BoxGeometry(.04, .2, .26), 0x6b3f1e); w.position.set(s*.13, 0, -.02); w.rotation.z = s*.25; bird.add(w); }
    t.add(bird);
    const quiver = OP(new THREE.CylinderGeometry(.11, .09, .55, 10), 0x6b3f1e, 1.08); quiver.position.set(-.15, .08, -.4); quiver.rotation.z = .4; t.add(quiver);
  }},
  wizard:{name:'วิซาร์ด', body:0x7a1f3a, head:true, build(h, t){
    const circ = OP(new THREE.TorusGeometry(.6, .04, 6, 28), 0xe0b13a); circ.rotation.x = PI/2 - .2; circ.position.y = .2; h.add(circ);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.09), new THREE.MeshBasicMaterial({color:0xff5d4a})); gem.position.set(0, .32, .58); h.add(gem);
    oCollar(t, 0x3d1a5a, .34, .12); oCape(t, 0x3d1a5a); oRobe(t, 0x5a1a3a);
  }},
  crusader:{name:'ครูเสด', body:0xe8e2d4, head:true, noHair:true, build(h, t){
    oDome(h, 0xc9d2de);
    const guard = OP(new THREE.CylinderGeometry(.6, .66, .4, 20, 1, true, PI/2 + .7, PI*2 - 1.4), 0xc9d2de); guard.position.y = -.05; h.add(guard);
    const v = OP(new THREE.BoxGeometry(.07, .34, .04), 0x2b2f3a); v.position.set(0, .05, .6); h.add(v);
    const w = OP(new THREE.BoxGeometry(.5, .07, .04), 0x2b2f3a); w.position.set(0, .14, .59); h.add(w);
    oPads(t, 0xc9d2de); oCape(t, 0xb8282a); oCross(t, 0xb8282a);
  }},
  // Alchemist: round gold-rimmed glasses, a long brown coat, a blue cape with gold trim, a belt with a pouch and potions
  alchemist:{name:'อัลเคมิสต์', body:0x7a5233, head:true, build(h, t){
    const GOLD = 0xe2b84a, BLUE = 0x2f4fa8;
    for (const s of [-1, 1]){
      const g = OP(new THREE.TorusGeometry(.1, .022, 6, 16), GOLD); g.position.set(s*.17, .03, .565); h.add(g);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(.09, 14), new THREE.MeshBasicMaterial({color:0xe6f6ff, transparent:true, opacity:.4})); lens.position.set(s*.17, .03, .572); h.add(lens);
    }
    const br = OP(new THREE.BoxGeometry(.12, .025, .02), GOLD); br.position.set(0, .05, .575); h.add(br);
    oRobe(t, 0x6b4428);
    const hem = OP(new THREE.CylinderGeometry(.56, .59, .08, 16, 1, true), 0x4a2e1a); hem.position.y = -.56; t.add(hem);
    // a blue mantle over the shoulders with a gold edge and a stand-up collar at the back
    const mant = OP(SPH(.47), BLUE, 1.04); mant.scale.set(1.14, .42, 1); mant.position.y = .27; t.add(mant);
    const trim = OP(new THREE.TorusGeometry(.5, .03, 6, 22), GOLD); trim.rotation.x = PI/2; trim.position.y = .2; t.add(trim);
    const stand = OP(new THREE.BoxGeometry(.5, .22, .06), BLUE); stand.position.set(0, .44, -.24); stand.rotation.x = -.35; t.add(stand);
    const cape = OP(new THREE.BoxGeometry(.72, .88, .04), BLUE); cape.position.set(0, -.12, -.38); cape.rotation.x = .16; t.add(cape);
    const capeT = OP(new THREE.BoxGeometry(.74, .05, .06), GOLD); capeT.position.set(0, -.55, -.31); capeT.rotation.x = .16; t.add(capeT);
    for (let i = 0; i < 3; i++){ const b = OP(SPH(.035), GOLD); b.position.set(0, .16 - i*.11, .37); t.add(b); }
    const belt = OP(new THREE.TorusGeometry(.4, .045, 6, 20), 0x3a2a1a); belt.rotation.x = PI/2; belt.position.y = -.18; t.add(belt);
    const buckle = OP(new THREE.BoxGeometry(.13, .1, .04), GOLD); buckle.position.set(0, -.18, .41); t.add(buckle);
    const pouch = OP(new THREE.BoxGeometry(.16, .17, .1), 0x5a3a22); pouch.position.set(.3, -.26, .26); t.add(pouch);
    const vial = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, .17, 8), new THREE.MeshBasicMaterial({color:0xd8342c, transparent:true, opacity:.9})); vial.position.set(-.3, -.24, .28); t.add(vial);
    const vial2 = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, .14, 8), new THREE.MeshBasicMaterial({color:0x6fe08a, transparent:true, opacity:.9})); vial2.position.set(-.18, -.27, .34); t.add(vial2);
  }},
  // Rogue: slicked-back black hair, a forehead mark and blue drop earrings; a long dark coat with a white fur collar,
  // two rows of gold buttons, gold shoulder studs and a red lining
  rogue:{name:'โร้ก', body:0x2a1f3a, head:true, noHair:true, build(h, t){
    const COAT = 0x2a1f3a, FUR = 0xf2f2f5, GOLD = 0xe2b84a, HAIR = 0x14141a;
    const hair = OP(new THREE.SphereGeometry(.6, 24, 12, 0, PI*2, 0, PI*.5), HAIR, 1.03); hair.rotation.x = -.3; hair.position.set(0, .05, -.04); h.add(hair);
    const nape = OP(new THREE.BoxGeometry(.52, .44, .2), HAIR); nape.position.set(0, -.12, -.46); h.add(nape);
    const mv = OP(new THREE.BoxGeometry(.035, .13, .02), 0x3a2a4a), mh = OP(new THREE.BoxGeometry(.11, .035, .02), 0x3a2a4a);
    for (const m of [mv, mh]){ m.position.set(0, .3, .48); m.rotation.x = -.55; h.add(m); }
    for (const s of [-1, 1]){ const e = OP(SPH(.05), 0x3fd0c8); e.position.set(s*.56, -.16, .02); h.add(e); }
    const coat = OP(new THREE.CylinderGeometry(.34, .6, .62, 16, 1, true), COAT); coat.position.y = -.37; t.add(coat);
    const lining = OP(new THREE.BoxGeometry(.08, .56, .03), 0x8a1030); lining.position.set(0, -.4, .52); lining.rotation.x = -.38; t.add(lining);
    const shirt = OP(new THREE.BoxGeometry(.2, .3, .04), 0x1e1e26); shirt.position.set(0, .12, .35); t.add(shirt);
    // the fur collar sits wide on the shoulders and stands up behind the head
    for (let i = 0; i < 12; i++){
      const a = i/12*PI*2, f = OP(SPH(.15), FUR, 1.06); f.position.set(Math.sin(a)*.47, .3, Math.cos(a)*.38); t.add(f);
      if (Math.cos(a) < .45){ const sp = OP(new THREE.ConeGeometry(.08, .32, 4), FUR); sp.position.set(Math.sin(a)*.5, .5, Math.cos(a)*.4); sp.rotation.set(-Math.cos(a)*.55, 0, Math.sin(a)*.6); t.add(sp); }
    }
    for (const x of [-.16, .16]) for (let i = 0; i < 3; i++){ const b = OP(SPH(.035), GOLD); b.position.set(x, .16 - i*.13, .34); t.add(b); }
    for (const s of [-1, 1]){ const st = OP(new THREE.CylinderGeometry(.06, .06, .03, 10), GOLD); st.rotation.x = PI/2; st.position.set(s*.33, .27, .22); t.add(st); }
  }},
  taekwon:{name:'เทควันโด', body:0xf4f4f4, head:true, build(h, t){
    const band = OP(new THREE.TorusGeometry(.58, .06, 6, 28), 0xd8342c); band.rotation.x = PI/2 - .2; band.position.y = .18; h.add(band);
    for (const s of [-1, 1]){ const tl = OP(new THREE.BoxGeometry(.06, .36, .03), 0xd8342c); tl.position.set(s*.08, .02, -.6); tl.rotation.z = s*.35; h.add(tl); }
    const belt = OP(new THREE.TorusGeometry(.36, .05, 6, 20), 0x1d1d1d); belt.rotation.x = PI/2; belt.position.y = -.18; t.add(belt);
    for (const s of [-1, 1]){ const k = OP(new THREE.BoxGeometry(.06, .24, .03), 0x1d1d1d); k.position.set(s*.06, -.3, .36); k.rotation.z = s*.25; t.add(k); }
    const lap = OP(new THREE.BoxGeometry(.06, .4, .02), 0x1d1d1d); lap.position.set(.06, .12, .35); lap.rotation.z = -.5; t.add(lap);
  }},
  acolyte:{name:'อะโคไลต์', body:0xe8eef8, head:true, build(h, t){
    const cap = OP(new THREE.SphereGeometry(.6, 24, 12, 0, PI*2, 0, PI*.32), 0x3f6fb5, 1.03); cap.position.y = .06; h.add(cap);
    const band = OP(new THREE.TorusGeometry(.5, .04, 6, 24), 0xe0b13a); band.rotation.x = PI/2; band.position.y = .36; h.add(band);
    oRobe(t, 0xe8eef8); oCollar(t, 0x3f6fb5, .3, .08); oCross(t, 0x3f6fb5);
    const sash = OP(new THREE.BoxGeometry(.1, .7, .03), 0x3f6fb5); sash.position.set(-.12, -.1, .34); sash.rotation.z = -.4; t.add(sash);
  }},
  frost:{name:'นักเวทน้ำแข็ง', body:0xbfe6f5, head:true, build(h, t){
    const band = OP(new THREE.TorusGeometry(.56, .045, 6, 24), 0xe8f7ff); band.rotation.x = PI/2 - .15; band.position.y = .3; h.add(band);
    const ice = new THREE.MeshBasicMaterial({color:0x9fe3ff, transparent:true, opacity:.9});
    [[0, .62, .3, .34], [-.24, .5, .3, .24], [.24, .5, .3, .24], [-.42, .38, .2, .17], [.42, .38, .2, .17]].forEach(([x, y, z, hh]) => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(.07, hh, 5), ice); c.position.set(x, y, z); h.add(c);
    });
    oRobe(t, 0x3f8fc8); oCollar(t, 0xe8f7ff, .32, .1);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.08), ice); gem.position.set(0, .08, .36); t.add(gem);
  }},
  demon:{name:'นักดาบปีศาจ', body:0x2a1f33, head:true, build(h, t){
    for (const sd of [-1, 1]){ const horn = OP(new THREE.ConeGeometry(.1, .46, 8), 0x1d1424, 1.06); horn.position.set(sd*.33, .5, .05); horn.rotation.z = -sd*.5; h.add(horn); }
    const band = OP(new THREE.TorusGeometry(.57, .05, 6, 24), 0x8a1f2a); band.rotation.x = PI/2 - .2; band.position.y = .22; h.add(band);
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(.065), new THREE.MeshBasicMaterial({color:0xff2a4a})); eye.position.set(0, .36, .55); h.add(eye);
    oPads(t, 0x1d1424); oCape(t, 0x5a1a3a); oCollar(t, 0x8a1f2a, .32, .1);
  }},
  spacecop:{name:'ตำรวจอวกาศ', body:0xe8eef8, head:true, noHair:true, build(h, t){
    oDome(h, 0xf4f6fb, .64);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(.6, 20, 8, PI/2 - .75, 1.5, PI*.36, PI*.22), new THREE.MeshBasicMaterial({color:0x2fd4ff, transparent:true, opacity:.7, side:THREE.DoubleSide})); h.add(visor);
    const ant = OP(new THREE.CylinderGeometry(.02, .02, .32, 6), 0x9aa3b5); ant.position.set(.32, .72, 0); h.add(ant);
    const tip = new THREE.Mesh(SPH(.055), new THREE.MeshBasicMaterial({color:0xff3a5a})); tip.position.set(.32, .9, 0); h.add(tip);
    oPads(t, 0x2f6fd8); oCollar(t, 0x2f6fd8, .32, .08);
    const badge = new THREE.Mesh(new THREE.OctahedronGeometry(.085), new THREE.MeshBasicMaterial({color:0xffd23a})); badge.position.set(.15, .12, .37); t.add(badge);
  }},
  soldier:{name:'ทหาร', body:0x5a6b3a, head:true, noHair:true, build(h, t){
    const helm = OP(new THREE.SphereGeometry(.64, 24, 12, 0, PI*2, 0, PI*.5), 0x4a5a2f, 1.04); helm.position.y = .06; h.add(helm);
    const rim = OP(new THREE.CylinderGeometry(.69, .71, .06, 24), 0x3f4d27); rim.position.y = .08; h.add(rim);
    const vest = OP(new THREE.CylinderGeometry(.42, .44, .4, 16), 0x6b5a3a, 1.03); vest.position.y = .03; t.add(vest);
    for (const sd of [-1, 0, 1]){ const g = OP(SPH(.075), 0x3f4d27); g.position.set(sd*.18, -.1, .41); t.add(g); }
    for (const [x, y] of [[-.2, .22], [.22, -.02], [-.05, .05]]){ const sp = new THREE.Mesh(SPH(.09), toon(0x3f4d27)); sp.scale.z = .3; sp.position.set(x, y, .4); t.add(sp); }
  }},
  volt:{name:'นักเวทสายฟ้า', body:0x2b2f5a, head:true, build(h, t){
    const brim = OP(new THREE.CylinderGeometry(.78, .78, .05, 28), 0x1d2040, 1.04); brim.position.y = .3; h.add(brim);
    const cone = OP(new THREE.ConeGeometry(.44, .9, 20), 0x1d2040, 1.04); cone.position.set(0, .75, -.08); cone.rotation.x = -.2; h.add(cone);
    const zap = new THREE.MeshBasicMaterial({color:0xfff27a});
    [[.0, .0, .0], [.09, -.14, -.5], [-.02, -.28, .4]].forEach(([dx, dy, rz], i) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(.07, .2, .03), zap); s.position.set(.2 + dx, .78 + dy, .22); s.rotation.z = rz + (i === 1 ? .9 : -.4); h.add(s);
    });
    oRobe(t, 0x1d2040); oCollar(t, 0xfff27a, .3, .07);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.08), zap); gem.position.set(0, .08, .36); t.add(gem);
  }},
  werewolf:{name:'มนุษย์หมาป่า', body:0x5b4636, head:true, build(h, t){
    for (const sd of [-1, 1]){
      const ear = OP(new THREE.ConeGeometry(.15, .4, 4), 0x6b4a32, 1.06); ear.position.set(sd*.3, .6, 0); ear.rotation.z = -sd*.25; h.add(ear);
      const inner = OP(new THREE.ConeGeometry(.08, .24, 4), 0xd9a08a); inner.position.set(sd*.3, .57, .04); inner.rotation.z = -sd*.25; h.add(inner);
    }
    const band = OP(new THREE.TorusGeometry(.57, .045, 6, 24), 0x3a2a1c); band.rotation.x = PI/2 - .2; band.position.y = .22; h.add(band);
    oCollar(t, 0xd9c7a6, .34, .12);
    for (const sd of [-1, 1]){ const fang = OP(new THREE.ConeGeometry(.035, .1, 4), 0xf4f1ea); fang.position.set(sd*.1, -.2, .52); fang.rotation.x = PI; h.add(fang); }
    const tail = OP(SPH(.15), 0x6b4a32, 1.05); tail.position.set(0, -.2, -.42); tail.scale.set(.8, 1, 1.6); t.add(tail);
    const moon = new THREE.Mesh(new THREE.OctahedronGeometry(.08), new THREE.MeshBasicMaterial({color:0xfff2b0})); moon.position.set(0, .08, .36); t.add(moon);
  }},
  tamer:{name:'เทมเมอร์', body:0x2f6a4f, head:true, build(h, t){
    oDome(h, 0xd8b76a, .64);
    const brim = OP(new THREE.CylinderGeometry(.82, .82, .05, 28), 0xc9a15a, 1.04); brim.position.y = .16; h.add(brim);
    const band = OP(new THREE.TorusGeometry(.62, .04, 6, 24), 0x8a1f2a); band.rotation.x = PI/2; band.position.y = .22; h.add(band);
    const feather = OP(new THREE.ConeGeometry(.06, .36, 4), 0xd8342c); feather.position.set(.4, .45, 0); feather.rotation.z = -.5; h.add(feather);
    oCollar(t, 0xd8342c, .32, .1);
    const egg = OP(SPH(.1), 0xf0e2a0); egg.scale.set(.9, 1.3, .9); egg.position.set(.16, .02, .38); t.add(egg);
    for (const [x, y] of [[.13, .06], [.2, -.03]]){ const sp = new THREE.Mesh(SPH(.025), toon(0x3fa86a)); sp.position.set(x, y, .47); t.add(sp); }
    const coil = OP(new THREE.TorusGeometry(.12, .035, 6, 14), 0x6b3f1e); coil.position.set(-.34, -.18, .12); coil.rotation.y = PI/2; t.add(coil);
  }},
  shaman:{name:'ชาแมน', body:0x4a3a2a, head:true, build(h, t){
    const band = OP(new THREE.TorusGeometry(.57, .05, 6, 24), 0x8a1f2a); band.rotation.x = PI/2 - .15; band.position.y = .26; h.add(band);
    [[0, .72, .3, 0x3f8fc8], [-.2, .66, .28, 0xffd23a], [.2, .66, .28, 0xd8342c], [-.38, .52, .2, 0x3fa86a], [.38, .52, .2, 0x9b5de5]].forEach(([x, y, z, c]) => {
      const fe = OP(new THREE.ConeGeometry(.07, .5, 4), c); fe.position.set(x, y, z - .3); fe.rotation.z = -x*1.2; fe.rotation.x = -.25; h.add(fe);
    });
    for (const sd of [-1, 1]){ const st = new THREE.Mesh(new THREE.BoxGeometry(.16, .035, .02), new THREE.MeshBasicMaterial({color:0xf4f1ea})); st.position.set(sd*.3, -.08, .5); st.rotation.y = sd*.5; h.add(st); }
    oRobe(t, 0x5a3f28); oCollar(t, 0x8a1f2a, .32, .08);
    for (let i = 0; i < 7; i++){ const a = (i - 3)*.32, b = OP(SPH(.05), 0xf4f1ea); b.position.set(Math.sin(a)*.36, .2 - Math.abs(i - 3)*.02, Math.cos(a)*.36); t.add(b); }
    const skull = OP(SPH(.09), 0xf4f1ea); skull.position.set(0, .12, .42); t.add(skull);
  }},
  lancer:{name:'แลนเซอร์', body:0x3a5a8a, head:true, noHair:true, build(h, t){
    const helm = OP(new THREE.SphereGeometry(.64, 24, 12, 0, PI*2, 0, PI*.55), 0xc9d2de, 1.04); helm.position.y = .04; h.add(helm);
    const crest = OP(new THREE.BoxGeometry(.08, .3, .7), 0xd8342c); crest.position.set(0, .72, -.05); h.add(crest);
    for (const sd of [-1, 1]){ const ch = OP(new THREE.BoxGeometry(.06, .34, .3), 0xc9d2de); ch.position.set(sd*.5, -.12, .18); h.add(ch); }
    oPads(t, 0xc9d2de); oCollar(t, 0xd8342c, .32, .08); oCape(t, 0x2a3f66);
    const em = new THREE.Mesh(new THREE.OctahedronGeometry(.08), new THREE.MeshBasicMaterial({color:0xffd23a})); em.position.set(0, .1, .37); t.add(em);
  }},
  reaper:{name:'ยมทูต', body:0x1d1424, head:true, noHair:true, build(h, t){
    oHood(h, 0x1d1424);
    const mask = OP(new THREE.BoxGeometry(.62, .5, .08), 0xf4f1ea); mask.position.set(0, .02, .54); h.add(mask);
    for (const sd of [-1, 1]){ const e = new THREE.Mesh(new THREE.BoxGeometry(.14, .12, .03), new THREE.MeshBasicMaterial({color:0xb46dff})); e.position.set(sd*.14, .07, .59); h.add(e); }
    for (let i = -2; i <= 2; i++){ const tooth = OP(new THREE.BoxGeometry(.05, .08, .03), 0x2a2030); tooth.position.set(i*.08, -.15, .59); h.add(tooth); }
    oRobe(t, 0x1d1424); oCollar(t, 0x5a2a7a, .32, .08);
    const sash = OP(new THREE.BoxGeometry(.1, .75, .03), 0x6b2fa8); sash.position.set(.1, -.05, .35); sash.rotation.z = -.5; t.add(sash);
    const skull = OP(SPH(.08), 0xf4f1ea); skull.position.set(-.16, .12, .37); t.add(skull);
  }},
  dragonblade:{name:'เบียวมังกร', body:0x1f2c5a, head:true, noHair:true, build(h, t){
    const helm = OP(new THREE.SphereGeometry(.64, 24, 12, 0, PI*2, 0, PI*.55), 0x23252e, 1.04); helm.position.y = .04; h.add(helm);
    // neck guard plates round the back and sides only (the face stays open)
    for (let i = 0; i < 7; i++){ const a = PI*.42 + i/6*PI*1.16, pl = OP(new THREE.BoxGeometry(.34, .26, .06), 0x23252e); pl.position.set(Math.sin(a)*.62, -.02, Math.cos(a)*.62); pl.rotation.set(-.35*Math.cos(a), a, .35*Math.sin(a)*0); h.add(pl); }
    // the long golden crescent: two thin blades from the brow sweeping up and out on both sides
    for (const sd of [-1, 1]){
      const a1 = OP(new THREE.BoxGeometry(.62, .07, .05), 0xe8c24a); a1.position.set(sd*.3, .58, .5); a1.rotation.z = sd*.28; h.add(a1);
      const a2 = OP(new THREE.BoxGeometry(.5, .055, .05), 0xe8c24a); a2.position.set(sd*.79, .8, .5); a2.rotation.z = sd*.68; h.add(a2);
      const a3 = OP(new THREE.BoxGeometry(.3, .04, .05), 0xe8c24a); a3.position.set(sd*1.03, 1.06, .5); a3.rotation.z = sd*1.05; h.add(a3);
    }
    const plate = OP(new THREE.BoxGeometry(.2, .13, .06), 0xe8c24a); plate.position.set(0, .5, .52); h.add(plate);
    const patch = OP(new THREE.BoxGeometry(.21, .19, .05), 0x16171c); patch.position.set(-.2, .04, .55); h.add(patch);
    const strap = OP(new THREE.BoxGeometry(.9, .04, .04), 0x16171c); strap.position.set(0, .14, .4); strap.rotation.z = -.3; h.add(strap);
    oPads(t, 0x23252e); oCollar(t, 0x3f7fff, .32, .08); oCape(t, 0x22336e);
    const chest = OP(new THREE.BoxGeometry(.5, .32, .06), 0x2b2f3a); chest.position.set(0, .06, .35); t.add(chest);
    for (const y of [.14, .02]){ const lace = OP(new THREE.BoxGeometry(.5, .025, .02), 0x3f7fff); lace.position.set(0, y, .385); t.add(lace); }
    const skirt = OP(new THREE.CylinderGeometry(.36, .52, .36, 16, 1, true), 0x23252e); skirt.position.y = -.34; t.add(skirt);
  }},
};
const OUTFIT_K = Object.keys(OUTFITS);
// Outfit colours: 0 keeps the class's own colours, the rest repaint every coloured part of the outfit
const OUTFIT_TINTS = [
  {name:'สีเดิม', show:'conic-gradient(#ff5d4a,#ffc23a,#3fbf5a,#2f8cff,#9b5de5,#ff5d4a)'},
  {name:'แดง', h:0, show:'#e0453a'}, {name:'ส้ม', h:.07, show:'#f08a2c'}, {name:'เหลือง', h:.14, show:'#f0c93a'}, {name:'เขียว', h:.33, show:'#3fae5a'},
  {name:'ฟ้า', h:.52, show:'#3ec5e0'}, {name:'น้ำเงิน', h:.62, show:'#2f6fd8'}, {name:'ม่วง', h:.76, show:'#8a4fd0'}, {name:'ชมพู', h:.9, show:'#f07fb5'},
  {name:'ดำ', dark:true, show:'#22232b'}, {name:'ขาว', light:true, show:'#f4f4f4'}, {name:'ทอง', gold:true, show:'#d9a92a'},
];
const _tc = new THREE.Color(), _hsl = {};
function tintColor(c, i){
  const T = OUTFIT_TINTS[i];
  if (!i || !T) return c;
  _tc.setHex(c).getHSL(_hsl);
  // Greys stay grey (metal, outlines, eyes) except when the whole outfit goes black or white
  if (_hsl.s < .12 && !T.dark && !T.light) return c;
  if (T.dark) _tc.setHSL(_hsl.h, _hsl.s*.3, .07 + _hsl.l*.2);
  else if (T.light) _tc.setHSL(_hsl.h, _hsl.s*.1, .8 + _hsl.l*.18);
  else if (T.gold) _tc.setHSL(.12, .78, .3 + _hsl.l*.4);
  else _tc.setHSL(T.h, Math.max(.5, _hsl.s), Math.min(.72, Math.max(.22, _hsl.l)));
  return _tc.getHex();
}
function recolor(obj, i){
  obj.traverse(m => {
    if (!m.isMesh || m.material === OUT || Array.isArray(m.material) || !m.material.color) return;
    const mt = m.material, c = mt.color.getHex(), nc = tintColor(c, i);
    if (nc === c) return;
    if (mt.isMeshToonMaterial && !mt.transparent) m.material = toon(nc);
    else { m.material = mt.clone(); m.material.color.setHex(nc); }
  });
}
const tintOf = l => Number.isInteger(l && l.oc) && l.oc > 0 && l.oc < OUTFIT_TINTS.length ? l.oc : 0;

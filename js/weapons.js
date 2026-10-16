// Sky Brawl · weapons.js — ★ อาวุธในมือของแต่ละอาชีพ (buildClassWeapon มือขวา, buildOffhand มือซ้าย)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
function buildClassWeapon(cls){
  const g = new THREE.Group(), silver = 0xc9d2de, wood = 0x8a5a2b, gold = 0xe0b13a;
  const add = (geo, c, x, y, z, ol) => { const m = part(geo, toon(c), ol); m.position.set(x, y, z); g.add(m); return m; };
  const blade = (len, w) => add(new THREE.BoxGeometry(.05, len, w), silver, 0, -.12 - len/2, 0, 1.08);
  const glow = (geo, c, y) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:.85})); m.position.y = y; g.add(m); };
  switch (cls){
    case 'knight': add(new THREE.BoxGeometry(.4, .06, .12), gold, 0, -.08, 0); blade(.85, .16); break;
    case 'samurai': case 'ninja': add(new THREE.CylinderGeometry(.11, .11, .03, 12), gold, 0, -.08, 0); blade(cls === 'samurai' ? 1.35 : .8, .09); break;
    case 'warrior': add(new THREE.CylinderGeometry(.045, .045, .9, 8), wood, 0, -.4, 0); add(new THREE.BoxGeometry(.06, .32, .38), silver, 0, -.78, .16, 1.08); break;
    case 'berserker': add(new THREE.CylinderGeometry(.05, .05, 1.15, 8), wood, 0, -.5, 0); for (const z of [-.22, .22]) add(new THREE.BoxGeometry(.06, .42, .42), silver, 0, -.98, z, 1.08); break;
    case 'paladin': add(new THREE.CylinderGeometry(.04, .04, .6, 8), wood, 0, -.3, 0); add(SPH(.17), gold, 0, -.66, 0, 1.08); break;
    case 'mage': add(new THREE.CylinderGeometry(.04, .04, 1.4, 8), wood, 0, -.45, 0); glow(SPH(.14), 0xb48dff, -1.2); break;
    case 'priest': add(new THREE.CylinderGeometry(.04, .04, 1.3, 8), 0xf4f1ea, 0, -.45, 0); add(new THREE.TorusGeometry(.14, .03, 6, 16), gold, 0, -1.2, 0); break;
    case 'druid': add(new THREE.CylinderGeometry(.05, .04, 1.3, 8), wood, 0, -.45, 0); add(SPH(.17), 0x3fbf5a, 0, -1.15, 0); break;
    case 'necro': add(new THREE.CylinderGeometry(.035, .035, 1.4, 8), 0x3a3f4b, 0, -.5, 0); add(new THREE.BoxGeometry(.04, .1, .7), 0x9aa3b5, 0, -1.15, .3, 1.08); break;
    case 'engineer': add(new THREE.BoxGeometry(.07, .55, .05), silver, 0, -.3, 0); add(new THREE.BoxGeometry(.07, .12, .22), silver, 0, -.6, .05); break;
    case 'assassin': blade(.35, .07); break;
    case 'rogue': blade(.42, .08); break;
    case 'acolyte': add(new THREE.CylinderGeometry(.035, .035, .9, 8), 0xf4f1ea, 0, -.35, 0); glow(SPH(.13), 0x6fe08a, -.86); break;
    case 'merchant': add(new THREE.CylinderGeometry(.04, .04, .7, 8), wood, 0, -.3, 0); add(new THREE.BoxGeometry(.06, .24, .3), silver, 0, -.58, .12, 1.08); break;
    case 'blacksmith': add(new THREE.CylinderGeometry(.045, .045, .75, 8), wood, 0, -.32, 0); add(new THREE.BoxGeometry(.24, .2, .4), 0x5a5f6b, 0, -.72, 0, 1.08); break;
    case 'frost': add(new THREE.CylinderGeometry(.04, .04, 1.4, 8), 0xdff4ff, 0, -.45, 0); glow(new THREE.OctahedronGeometry(.16), 0x9fe3ff, -1.2); break;
    case 'volt': add(new THREE.CylinderGeometry(.04, .04, 1.4, 8), 0x2b2f3a, 0, -.45, 0); glow(new THREE.OctahedronGeometry(.15), 0xfff27a, -1.2); break;
    case 'demon': {
      add(new THREE.BoxGeometry(.38, .06, .12), 0x8a1f2a, 0, -.08, 0);
      add(new THREE.BoxGeometry(.06, 1.1, .2), 0x2b1d36, 0, -.68, 0, 1.08);
      const e = new THREE.Mesh(new THREE.BoxGeometry(.075, 1.02, .05), new THREE.MeshBasicMaterial({color:0xb46dff, transparent:true, opacity:.9})); e.position.set(0, -.7, .1); g.add(e);
      break;
    }
    case 'spacecop': {
      add(new THREE.CylinderGeometry(.055, .055, .26, 10), silver, 0, -.1, 0, 1.08);
      add(new THREE.CylinderGeometry(.065, .065, .05, 10), 0x2b2f3a, 0, -.24, 0);
      const core = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.15, 8), new THREE.MeshBasicMaterial({color:0xeaffff})); core.position.y = -.84; g.add(core);
      const halo = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, 1.2, 10), new THREE.MeshBasicMaterial({color:0x2fd4ff, transparent:true, opacity:.45, depthWrite:false})); halo.position.y = -.84; g.add(halo);
      break;
    }
    case 'soldier': add(SPH(.13), 0x3f4d27, 0, -.12, .04, 1.08); add(new THREE.CylinderGeometry(.04, .04, .08, 8), 0x9aa3b5, 0, .0, .04); break;
    case 'shaman': {
      add(new THREE.CylinderGeometry(.04, .045, 1.35, 8), wood, 0, -.45, 0);
      add(SPH(.13), 0xf4f1ea, 0, -1.2, 0, 1.08);
      glow(SPH(.07), 0x9b7bff, -1.2);
      for (const sd of [-1, 1]) add(new THREE.ConeGeometry(.04, .3, 4), sd < 0 ? 0xd8342c : 0x3f8fc8, sd*.1, -1.0, 0).rotation.z = sd*.6;
      break;
    }
    case 'reaper': {
      add(new THREE.CylinderGeometry(.035, .04, 1.9, 8), 0x3a2a1a, 0, -.45, 0);
      add(new THREE.BoxGeometry(.06, .16, .95), 0xc9d2de, 0, -1.36, .42, 1.08).rotation.x = .25;
      add(new THREE.BoxGeometry(.05, .1, .35), 0xc9d2de, 0, -1.2, .95).rotation.x = .9;
      add(new THREE.BoxGeometry(.04, .05, .9), 0xb46dff, 0, -1.47, .44).rotation.x = .25;
      break;
    }
    case 'dragonblade': add(new THREE.CylinderGeometry(.1, .1, .03, 10), 0x16171c, 0, -.08, 0); blade(1.15, .08); break;
    case 'lancer': {
      add(new THREE.CylinderGeometry(.035, .035, 2.2, 8), 0x6b4a32, 0, -.3, 0);
      add(new THREE.ConeGeometry(.09, .42, 6), silver, 0, -1.6, 0, 1.08).rotation.x = PI;
      add(new THREE.BoxGeometry(.24, .04, .04), gold, 0, -1.38, 0);
      add(SPH(.07), 0xd8342c, 0, -1.31, 0);
      break;
    }
    case 'tamer': {
      add(new THREE.CylinderGeometry(.045, .045, .34, 8), wood, 0, -.12, 0, 1.08);
      const lash = add(new THREE.CylinderGeometry(.018, .028, 1.4, 6), 0x3a2a1a, 0, -.9, .18); lash.rotation.x = .3;
      add(SPH(.045), 0xd8342c, 0, -1.58, .43);
      break;
    }
    case 'wizard': add(new THREE.CylinderGeometry(.04, .04, 1.4, 8), 0x3a2a1a, 0, -.45, 0); glow(new THREE.OctahedronGeometry(.15), 0xff5d4a, -1.2); break;
    case 'crusader': add(new THREE.CylinderGeometry(.035, .035, 1.6, 8), wood, 0, -.5, 0); add(new THREE.ConeGeometry(.08, .3, 8), silver, 0, -1.42, 0, 1.08).rotation.x = PI; break;
    case 'alchemist': add(new THREE.CylinderGeometry(.04, .035, .06, 8), 0x8a5a2b, 0, -.02, 0); add(new THREE.CylinderGeometry(.035, .035, .16, 8), 0xe8f4ff, 0, -.12, 0); glow(SPH(.15), 0xd8342c, -.32); break;
    case 'gunner': { const p = buildGun('gun'); p.scale.setScalar(.85); g.add(p); break; }
    case 'gundam': add(new THREE.CylinderGeometry(.045, .045, .25, 8), 0xf4f4f4, 0, -.1, 0); glow(new THREE.CylinderGeometry(.06, .06, 1, 10), 0xff6bd6, -.72); break;
    default: return null;
  }
  return g;
}
function buildOffhand(cls){
  const g = new THREE.Group();
  if (cls === 'knight' || cls === 'paladin'){
    const sh = part(new THREE.CylinderGeometry(.36, .36, .07, 20), toon(cls === 'knight' ? 0xb8282a : 0x2f5bd8), 1.08); sh.rotation.z = PI/2; sh.position.x = .1; g.add(sh);
    const boss = part(SPH(.1), toon(0xe0b13a)); boss.position.x = .16; g.add(boss);
  } else if (cls === 'archer'){ const bow = part(new THREE.TorusGeometry(.45, .03, 6, 18, PI), toon(0x8a5a2b)); bow.rotation.z = PI/2; g.add(bow); }
  else if (cls === 'crusader'){
    const sh = part(new THREE.CylinderGeometry(.34, .34, .07, 20), toon(0xf4f1ea), 1.08); sh.rotation.z = PI/2; sh.position.x = .1; g.add(sh);
    for (const [w, hgt] of [[.06, .4], [.06, .22]]){ const c = new THREE.Mesh(new THREE.BoxGeometry(.02, hgt, w), toon(0xb8282a)); c.position.x = .15; if (hgt < .3) c.rotation.x = PI/2; g.add(c); }
  }
  else if (cls === 'hunter'){ const bow = part(new THREE.TorusGeometry(.45, .03, 6, 18, PI), toon(0x6b3f1e)); bow.rotation.z = PI/2; g.add(bow); }
  else if (cls === 'assassin'){ const d = part(new THREE.BoxGeometry(.05, .35, .07), toon(0xc9d2de), 1.08); d.position.y = -.28; g.add(d); }
  else if (cls === 'gunner'){ const p = buildGun('gun'); p.scale.setScalar(.85); g.add(p); }
  else if (cls === 'rogue'){
    const bk = part(new THREE.BoxGeometry(.09, .36, .28), toon(0x3a1f2a), 1.08); bk.position.set(.06, -.28, .04); g.add(bk);
    const pg = part(new THREE.BoxGeometry(.07, .33, .25), toon(0xf4ecd8)); pg.position.set(.075, -.28, .04); g.add(pg);
    const em = part(new THREE.BoxGeometry(.02, .12, .1), toon(0xe2b84a)); em.position.set(.015, -.28, .04); g.add(em);
  }
  else if (cls === 'dragonblade'){
    const gd = part(new THREE.CylinderGeometry(.1, .1, .03, 10), toon(0x16171c)); gd.position.y = -.08; g.add(gd);
    const bl = part(new THREE.BoxGeometry(.05, 1.15, .08), toon(0xc9d2de), 1.08); bl.position.y = -.12 - .575; g.add(bl);
  }
  else return null;
  return g;
}

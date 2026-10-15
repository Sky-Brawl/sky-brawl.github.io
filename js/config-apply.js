// Sky Brawl · config-apply.js — อ่าน config.js แล้วปรับค่าในเกม (ต้องโหลดหลัง moves.js และ classes.js)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Settings from config.js ---------- */
// config.js sits next to index.html. Anything it leaves out keeps the built-in value; bad values are skipped with a console warning.
const CLASS_ON = new Set(OUTFIT_K);
const MIN_SKILL_CD = 300;
(function applyConfig(){
  const C = window.SKY_CONFIG;
  if (!C || typeof C !== 'object') return;
  const warn = m => console.warn('[config.js] ' + m);
  const num = (v, lo, hi, what) => {
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n < lo || n > hi){ warn(`${what} = ${v} ใช้ไม่ได้ (ต้องเป็นตัวเลข ${lo}–${hi}) ใช้ค่าเดิมแทน`); return undefined; }
    return n;
  };
  const g = C.global || {};
  const mCd = num(g.skillCooldown, .1, 10, 'global.skillCooldown') ?? 1;
  const mDmg = num(g.skillDamage, 0, 10, 'global.skillDamage') ?? 1;
  const mKb = num(g.skillKnockback, 0, 10, 'global.skillKnockback') ?? 1;
  for (const [k, on] of Object.entries(C.classes || {})){
    if (!OUTFITS[k]){ warn(`ไม่รู้จักอาชีพ "${k}"`); continue; }
    if (k !== 'none' && on === false) CLASS_ON.delete(k);
  }
  const S = C.skills || {};
  for (const k of Object.keys(S)) if (!SKILL_INFO[k]) warn(`ไม่รู้จักอาชีพ "${k}" ในส่วน skills`);
  for (const k of Object.keys(SKILL_INFO)){
    const s = S[k] || {}, info = SKILL_INFO[k];
    const cd = num(s.cd, .5, 120, `skills.${k}.cd`);
    info.cd = Math.max(MIN_SKILL_CD, Math.round((cd !== undefined ? cd*60 : info.cd)*mCd));   // never faster than 5 s, whatever config.js says
    // Gunner's volley and the engineer's turret hit with their own shot data
    const hit = k === 'gunner' ? RAPID_SHOT : k === 'engineer' ? TURRET_SHOT : k === 'shaman' ? GHOST_SLASH : MOVES['sk_' + k];
    if (!hit) continue;
    const dmg = num(s.dmg, 0, 100, `skills.${k}.dmg`), kb = num(s.kb, 0, 40, `skills.${k}.kb`), heal = num(s.heal, 0, 100, `skills.${k}.heal`);
    if (hit.dmg !== undefined || dmg !== undefined) hit.dmg = Math.round((dmg ?? hit.dmg)*mDmg*10)/10;
    if (hit.kb !== undefined || kb !== undefined) hit.kb = (kb ?? hit.kb)*mKb;
    if (heal !== undefined && hit.heal !== undefined) hit.heal = heal;
    const fz = num(s.freeze, 0, 10, `skills.${k}.freeze`), sh = num(s.shock, 0, 20, `skills.${k}.shock`);
    if (fz !== undefined && hit.freeze !== undefined) hit.freeze = Math.round(fz*60);
    if (sh !== undefined && hit.shock !== undefined) hit.shock = Math.round(sh*60);
    const stn = num(s.stun, 0, 10, `skills.${k}.stun`);
    if (stn !== undefined && hit.stunT !== undefined) hit.stunT = Math.round(stn*60);
    const rad = num(s.radius, 1, 10, `skills.${k}.radius`);
    if (rad !== undefined && hit.radius !== undefined) hit.radius = rad;
  }
  { const gl = num((S.shaman || {}).life, 2, 60, 'skills.shaman.life'); if (gl !== undefined) GHOST_INFO.secs = gl; }
  { const rl = num((S.reaper || {}).life, 1, 60, 'skills.reaper.life'); if (rl !== undefined) MOVES.sk_reaper.life = rl; }
  // Fighters: max HP, walking speed, jump, rice ball
  const F = C.fighter || {};
  MAX_HP = num(F.hp, 10, 1000, 'fighter.hp') ?? MAX_HP;
  WALK = num(F.walkSpeed, 1, 30, 'fighter.walkSpeed') ?? WALK;
  SPRINT = num(F.sprintSpeed, 1, 3, 'fighter.sprintSpeed') ?? SPRINT;
  SPRINT_SECS = num(F.sprintSeconds, .5, 30, 'fighter.sprintSeconds') ?? SPRINT_SECS;
  JUMP = num(F.jump, 4, 40, 'fighter.jump') ?? JUMP;
  RICE_HEAL = num(F.riceballHeal, 0, 1000, 'fighter.riceballHeal') ?? RICE_HEAL;
  // Every move that is not a class skill (punches, class combos, picked-up weapons); form moves follow their skill below
  const nDmg = num(F.normalDamage, 0, 10, 'fighter.normalDamage') ?? 1, nKb = num(F.normalKnockback, 0, 10, 'fighter.normalKnockback') ?? 1;
  const formMoves = new Set(Object.values(FORM_INFO).flatMap(fi => fi.moves));
  for (const [mk, m] of Object.entries(MOVES)){
    if (m.skill || formMoves.has(mk)) continue;
    if (typeof m.dmg === 'number') m.dmg = Math.round(m.dmg*nDmg*10)/10;
    if (typeof m.kb === 'number') m.kb *= nKb;
  }
  // Transformations: walking speed, size; the dragon's flame reach and width
  const FM = C.forms || {};
  for (const k of Object.keys(FORM_INFO)){
    const c = FM[k] || {}, fi = FORM_INFO[k];
    fi.speed = num(c.speed, .2, 5, `forms.${k}.speed`) ?? fi.speed;
    fi.scale = num(c.scale, .5, 4, `forms.${k}.scale`) ?? fi.scale;
  }
  { const c = FM.tamer || {}, m = MOVES.dg1, fi = FORM_INFO.tamer;
    m.range = num(c.breathRange, 2, 30, 'forms.tamer.breathRange') ?? m.range;
    const ang = num(c.breathAngle, 10, 180, 'forms.tamer.breathAngle'); if (ang !== undefined) m.arc = ang/2*PI/180;
    fi.reach = Math.max(1.5, m.range - 1); fi.stop = Math.max(1.2, m.range*.6); }
  for (const k of Object.keys(FORM_INFO)){
    const fi = FORM_INFO[k], sk = MOVES['sk_' + k], secs = num((S[k] || {}).form, 1, 60, `skills.${k}.form`);
    if (secs !== undefined) fi.secs = secs;
    for (const mk of fi.moves){ const m = MOVES[mk]; m.dmg = Math.round(sk.dmg*(m.fmul || 1)*10)/10; m.kb = sk.kb*(m.kbmul || 1); }
  }
  if (MOVES.sk_frost) SKILL_INFO.frost.desc = `เรียกพายุน้ำแข็งวงกว้าง (รัศมี ${MOVES.sk_frost.radius} ช่อง) ตรงศัตรูที่ใกล้ที่สุด ทุกคนในวงโดนลมหิมะ 1.5 วินาที แล้วถูกแช่แข็งทั้งกลุ่ม ${Math.round(MOVES.sk_frost.freeze/6)/10} วินาที (โดนตีแล้วน้ำแข็งแตก)`;
  if (MOVES.sk_volt) SKILL_INFO.volt.desc = `สายฟ้ากระโดดไปโดนศัตรูสูงสุด 4 คน ทุกคนที่โดนติดสถานะชา ${Math.round(MOVES.sk_volt.shock/6)/10} วินาที: เดินช้า กระโดดไม่ได้ และกระตุกเป็นพักๆ`;
  if (MOVES.sk_priest) SKILL_INFO.priest.desc = `ฮีลหมู่ ฟื้นพลัง ${MOVES.sk_priest.heal} ให้ตัวเองและเพื่อนรอบตัวในระยะ 7 ช่อง (มีผลกับเพื่อนเท่านั้น)`;
  if (MOVES.sk_acolyte) SKILL_INFO.acolyte.desc = `ฮีล ฟื้นพลัง ${MOVES.sk_acolyte.heal} ให้เพื่อนที่เลือดน้อยที่สุดในระยะ 10 ช่อง (ไม่มีเพื่อน = ฮีลตัวเอง)`;
  if (MOVES.sk_paladin) SKILL_INFO.paladin.desc = `อมตะ 1.6 วินาที ฟื้นพลัง ${MOVES.sk_paladin.heal} และผลักคนรอบตัว`;
})();
refreshFormDescs();
SKILL_INFO.reaper.desc = 'อัญเชิญโครงกระดูกยักษ์ขึ้นจากพื้นตรงศัตรูที่ใกล้ที่สุด ทุบลงพื้น ทุกคนในวง (รัศมี ' + MOVES.sk_reaper.radius + ' ช่อง) โดนดาเมจและมึน ขยับไม่ได้ ' + Math.round(MOVES.sk_reaper.stunT/6)/10 + ' วินาที แล้วอยู่ช่วยสู้ต่อ ' + MOVES.sk_reaper.life + ' วินาที เดินไล่ทุบศัตรูใกล้ๆ ให้กระเด็น';
SKILL_INFO.shaman.desc = 'อัญเชิญผีนักดาบมาสู้ข้างตัว ' + GHOST_INFO.secs + ' วินาที: ไล่ฟันศัตรูที่ใกล้ที่สุดแรงๆ ทุกครั้งที่ฟันปล่อยคลื่นดำพุ่งทะลุแบบนักดาบปีศาจ';
// Classes that players can pick and bots can roll; a disabled class worn by anyone shows up as "ไม่ใส่"
const ON_K = OUTFIT_K.filter(k => CLASS_ON.has(k));
const allowedOutfit = o => CLASS_ON.has(o) ? o : 'none';
const BODY_COLORS = [0xff5d4a, 0x2f8cff, 0x3fbf5a, 0xffc23a, 0x9b5de5, 0xff7fb5, 0x00b8a9, 0x2b2f3a, 0xf4f4f4];
const SKIN_COLORS = [0xffe3c8, 0xffd7b5, 0xe8b48a, 0xc68a5e, 0x8d5a3b];
const HAIR_COLORS = [0x2b1d16, 0x4a2d22, 0xf0a530, 0xe8e8e8, 0xff5d8f, 0x3f7cff, 0x3fbf5a, 0x9b5de5];
const DEF_LOOKS = [
  {name:'P1', body:0xff5d4a, skin:0xffd7b5, hairColor:0x4a2d22, hair:'short', hat:'band', eyes:'round', outfit:'none'},
  {name:'P2', body:0x2f8cff, skin:0xffd7b5, hairColor:0xf0a530, hair:'spiky', hat:'band', eyes:'angry', outfit:'none'},
];
const LOOK_KEY = 'skybrawl.looks.v1';
let LOOKS = DEF_LOOKS.map(l => ({...l}));
try {
  const s = JSON.parse(localStorage.getItem(LOOK_KEY));
  if (Array.isArray(s) && s.length === 2) LOOKS = s.map((l, i) => ({...DEF_LOOKS[i], ...l, outfit:allowedOutfit(l.outfit || 'none')}));
} catch (e) {}
const saveLooks = () => { try { localStorage.setItem(LOOK_KEY, JSON.stringify(LOOKS)); } catch (e) {} if (window.__supaSave) window.__supaSave(); };
const pick = a => a[Math.random()*a.length | 0];
// Bot names read like players' handles rather than "บอท 7"; each fits the 12-character name limit
const BOT_NAMES = ['ต้มยำกุ้ง', 'หมูกระทะ', 'ส้มตำไทย', 'ชาเย็น', 'ไข่เจียว', 'ข้าวมันไก่', 'หมูปิ้ง', 'ลูกชิ้นทอด', 'ขนมครก', 'ชาไข่มุก',
  'กล้วยทอด', 'โกโก้เย็น', 'มะม่วงสุก', 'แตงโมปั่น', 'ปลาทู', 'ไก่ทอดหาดใหญ่', 'เจ้าเหมียว', 'หมาป่าเดียวดาย', 'มือใหม่หัดต่อย', 'นักเลงคีย์บอร์ด',
  'พี่บอย', 'น้องแนน', 'เฮียกุ้ย', 'ป้าแดง', 'ลุงชิต', 'เจ๊หมวย', 'ตี๋น้อย', 'ก้องภพ', 'มิ้นท์', 'ฟ้าใส', 'ทองดี', 'บุญมี', 'สายฟ้า',
  'ไต้ฝุ่น', 'ดาวเหนือ', 'ส้มโอ', 'มะนาว', 'เด็กวัด', 'จอมยุทธ์', 'ขุนแผน', 'นายฮ้อย', 'เสือดำ', 'ช้างน้อย', 'ปลาวาฬ', 'นกฮูก',
  'xXSlayerXx', 'NoobMaster', 'ProGamerTH', 'LagKing', 'AFK_Andy', 'SleepyCat', 'PunchBoy', 'TomYumKing', 'SomTamQueen', 'BKKDrifter',
  'ShadowNinja', 'RiceBall', 'KaiJeow', 'LuckyStar', 'IronFist', 'SkyDiver', 'BubbleTea', 'CoffeeAddict', 'GGEZ', 'OneHitWonder',
  'ComboBreaker', 'RageQuit', 'Kitty99', 'Panda_TH', 'Tiger88', 'NightOwl', 'Mango', 'Durian', 'JustBob', 'Captain_K', 'DJ_Noodle',
  'Pixel', 'Zap', 'Nong_Boom', 'Moonlight', 'Blizzard', 'Fireball', 'TukTuk', 'Songkran', 'Kanom', 'NamPla', 'Chili', 'Wasabi'];
const withNum = (base, k) => k ? base.slice(0, 10) + (k + 1) : base;
function botNames(n){
  const pool = [...BOT_NAMES].sort(() => Math.random() - .5);
  return Array.from({length:n}, (_, i) => withNum(pool[i % pool.length], Math.floor(i/pool.length)));
}
const seededBotName = seed => BOT_NAMES[(Number(seed) >>> 0) % BOT_NAMES.length];
const randomLook = name => ({name, body:pick(BODY_COLORS), skin:pick(SKIN_COLORS), hairColor:pick(HAIR_COLORS), hair:pick(HAIR_K), hat:pick(HAT_FREE), eyes:pick(EYE_K), outfit:pick(ON_K), oc:Math.random() < .3 ? 1 + (Math.random()*(OUTFIT_TINTS.length - 1) | 0) : 0});
function seededLook(seed, name){
  let a = (seed >>> 0) || 1;
  const rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; };
  const pk = arr => arr[Math.floor(rnd()*arr.length)];
  const lk = {name, body:pk(BODY_COLORS), skin:pk(SKIN_COLORS), hairColor:pk(HAIR_COLORS), hair:pk(HAIR_K), hat:pk(HAT_FREE), eyes:pk(EYE_K), outfit:pk(ON_K)};
  lk.oc = rnd() < .3 ? 1 + Math.floor(rnd()*(OUTFIT_TINTS.length - 1)) : 0;
  return lk;
}
function slotName(sl, i){
  if (sl[0] || sl.length !== 2) return cleanName(sl[1], 'ผู้เล่น');
  const base = seededBotName(sl[1]);
  return withNum(base, Net.slots.slice(0, i).filter(x => !x[0] && x.length === 2 && seededBotName(x[1]) === base).length);
}
const encLook = l => [l.body, l.skin, l.hairColor, HAIR_K.indexOf(l.hair), HAT_K.indexOf(l.hat), EYE_K.indexOf(l.eyes), OUTFIT_K.indexOf(l.outfit || 'none'), tintOf(l), Math.max(0, TITLE_K.indexOf(l.title || 'none'))];
function decLook(a, name){
  if (!Array.isArray(a)) return randomLook(name);
  const col = (v, d) => Number.isInteger(v) && v >= 0 && v <= 0xffffff ? v : d;
  const idx = (v, arr) => arr[Number.isInteger(v) && v >= 0 && v < arr.length ? v : 0];
  return {name, body:col(a[0], 0xff5d4a), skin:col(a[1], 0xffd7b5), hairColor:col(a[2], 0x2b1d16), hair:idx(a[3], HAIR_K), hat:idx(a[4], HAT_K), eyes:idx(a[5], EYE_K), outfit:idx(a[6], OUTFIT_K), oc:tintOf({oc:a[7]}), title:idx(a[8], TITLE_K)};
}

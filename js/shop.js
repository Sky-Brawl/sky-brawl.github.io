// Sky Brawl · shop.js — เหรียญ 🪙 + ร้านค้า: ซื้ออาชีพ ของแต่งตัว บูสต์ (ฝั่งเซิร์ฟเวอร์: supabase-shop.sql)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Coins & shop ----------
   The server keeps the wallet (table wallet): coins arrive by trigger whenever the server gives XP (match or quest,
   coins = XP) and on each daily login, and are spent only through buy_item(), which has its own price list.
   The prices below are only for showing; keep them the same as shop_price() in supabase-shop.sql.
   Classes with difficulty ★ are free, so is the quest "class of the day" (a free trial for that day).
   Locks only apply while the shop works: no Supabase, or the SQL not run yet (Shop.off), and every class is open. ---------- */
const COIN = '🪙';
const fmtCoins = n => (n | 0).toLocaleString('en-US');
const classStars = k => (CLASS_META[k] || ['melee', 2])[1];
const FREE_CLASSES = new Set(OUTFIT_K.filter(k => k === 'none' || classStars(k) === 1));
const classPrice = k => FREE_CLASSES.has(k) ? 0 : classStars(k) >= 3 ? 1500 : (CLASS_META[k] || [])[0] === 'special' ? 1200 : 800;
const SHOP_ITEMS = {
  'h:chef':{price:400, icon:'👨‍🍳'}, 'h:headphones':{price:500, icon:'🎧'}, 'h:wizard':{price:600, icon:'🧙'},
  'h:pirate':{price:700, icon:'🏴‍☠️'}, 'h:propeller':{price:800, icon:'🚁'},
  't:shopper':{price:300, icon:'🛍️'}, 't:cute':{price:500, icon:'💖'}, 't:bigboss':{price:800, icon:'😎'},
  't:shadow':{price:800, icon:'🌑'}, 't:ace':{price:1200, icon:'🥇'}, 't:rich':{price:2000, icon:'💰'},
  'b:coin2':{price:300, icon:COIN, name:'เหรียญ ×2', desc:'ได้เหรียญสองเท่า 5 แมตช์ถัดไป'},
  'b:xp2':{price:400, icon:'⚡', name:'XP ×2', desc:'ได้ XP สองเท่า 5 แมตช์ถัดไป'},
};
const itemPrice = u => u.startsWith('c:') ? classPrice(u.slice(2)) : (SHOP_ITEMS[u] || {}).price || 0;
function itemName(u){
  const [t, k] = u.split(':');
  return t === 'c' ? 'อาชีพ ' + ((OUTFITS[k] || {}).name || k) : t === 'h' ? 'หมวก "' + (HATS[k] || k) + '"' : t === 't' ? 'ฉายา "' + (TITLES[k] || k) + '"' : 'บูสต์ ' + ((SHOP_ITEMS[u] || {}).name || k);
}
const SHOP_TABS = [['class', '⚔️ อาชีพ'], ['look', '🎩 ของแต่งตัว'], ['boost', '⚡ บูสต์']];

const Shop = {
  st:null, uid:null, off:false, busy:false, tab:'class', confirm:'',
  // Locks apply only while the shop can actually sell
  get on(){ return Supa.available && !this.off; },
  owns(u){ return !!(this.st && this.st.owned.includes(u)); },
  classLocked(k){
    if (!this.on || !this.st || FREE_CLASSES.has(k) || this.owns('c:' + k)) return false;
    Quest.load();
    return k !== Quest.cls;
  },
  itemLocked(u){ return !this.owns(u); },
  loadCache(){
    try { const c = JSON.parse(localStorage.getItem('skybrawl.wallet')); if (c && c.st && Array.isArray(c.st.owned)){ this.st = c.st; this.uid = c.uid; } } catch (e) {}
  },
  store(){ try { localStorage.setItem('skybrawl.wallet', JSON.stringify({uid:this.uid, st:this.st})); } catch (e) {} },
  set(r){
    this.st = {coins:r.coins | 0, owned:Array.isArray(r.owned) ? r.owned : [], coinBoost:r.coin_boost | 0, xpBoost:r.xp_boost | 0, earned:r.earned | 0};
    this.store();
  },
  clear(){ this.st = null; this.uid = null; try { localStorage.removeItem('skybrawl.wallet'); } catch (e) {} renderCoins(); },
  async refresh(){
    if (!Supa.available) return;
    const u = await Supa.signIn(); if (!u) return;
    if (this.uid !== u.id){ this.st = null; this.uid = u.id; }
    const {data, error} = await Supa.client.rpc('wallet_status');
    if (error){
      // The SQL has not been run yet: no shop, and nothing is locked
      if (/wallet_status|function|schema cache|not find/i.test(error.message)) this.off = true;
      renderCoins(); renderShop(); return;
    }
    const r = Array.isArray(data) ? data[0] : data; if (!r) return;
    this.off = false; this.set(r);
    this.fixLooks(); renderCoins(); renderShop(); reflectCustomIfOpen();
  },
  // Classes and shop items this account cannot use come off (other account, or yesterday's free class)
  fixLooks(){
    if (!this.st) return;
    let ch = '';
    for (const l of LOOKS){
      if (this.classLocked(l.outfit)){ ch = (OUTFITS[l.outfit] || {}).name || l.outfit; l.outfit = 'none'; }
      if (SHOP_HATS.has(l.hat) && this.itemLocked('h:' + l.hat)) l.hat = 'band', ch = ch || ' ';
      if (SHOP_TITLES.has(l.title) && this.itemLocked('t:' + l.title)) l.title = 'none', ch = ch || ' ';
    }
    if (!ch) return;
    saveLooks(); updateMyClass();
    if (G.mode === 'custom'){ G.fighters[0].setLook(LOOKS[G.editSlot]); reflectCustom(); }
    if (ch.trim()) toast('🔒 อาชีพ ' + ch + ' ต้องซื้อที่ร้านค้าก่อน (เปลี่ยนเป็นไม่มีอาชีพให้แล้ว)');
  },
  // Coins from the match that just ended (the server adds them while saving the XP)
  async afterMatch(){
    const before = this.st ? this.st.coins : null;
    await this.refresh();
    const el = $('resCoin'); if (!el) return;
    el.textContent = this.st && before != null && this.st.coins > before ? '+' + fmtCoins(this.st.coins - before) + ' ' + COIN : '';
  },
  open(tab){
    hideAllPanels(); $('shop').hidden = false; $('shopGot').textContent = '';
    if (tab) this.tab = tab;
    this.confirm = '';
    renderShop(); this.refresh();
    $('shopClose').focus({preventScroll:true});
  },
  // First press asks, second press buys
  async buy(u, after){
    if (this.busy || !this.st) return;
    const pr = itemPrice(u);
    if (this.st.coins < pr){ this.say('เหรียญไม่พอ ขาดอีก ' + fmtCoins(pr - this.st.coins) + ' ' + COIN + ' · เล่นแมตช์ ทำภารกิจ หรือรับรางวัลรายวันเพื่อเก็บเหรียญ'); return; }
    if (this.confirm !== u){ this.confirm = u; renderShop(); reflectCustomIfOpen(); return; }
    this.confirm = ''; this.busy = true; this.say('กำลังซื้อ…');
    const {data, error} = await Supa.client.rpc('buy_item', {p_item:u});
    this.busy = false;
    if (error){
      this.say(/not enough/.test(error.message) ? 'เหรียญไม่พอ' : /already/.test(error.message) ? 'มีของชิ้นนี้อยู่แล้ว' : /boost full/.test(error.message) ? 'สะสมบูสต์ได้สูงสุด 20 แมตช์' : 'ซื้อไม่สำเร็จ ลองใหม่อีกครั้ง');
      await this.refresh(); reflectCustomIfOpen(); return;
    }
    const r = Array.isArray(data) ? data[0] : data;
    this.set(r); renderCoins(); renderShop();
    this.say('🎉 ได้ ' + itemName(u) + ' แล้ว! เหลือ ' + fmtCoins(this.st.coins) + ' ' + COIN);
    Sfx.play('level');
    if (after) after();
    reflectCustomIfOpen();
  },
  say(t){ if (!$('shop').hidden) $('shopGot').textContent = t; else toast(t); },
  // Wear what was just bought
  use(u){
    const [t, k] = u.split(':');
    const l = LOOKS[0];
    if (t === 'c') l.outfit = k; else if (t === 'h') l.hat = k; else if (t === 't') l.title = k;
    saveLooks(); updateMyClass();
    toast('✅ ใส่ ' + itemName(u) + ' แล้ว');
    renderShop();
  },
  xpBoostOn(){ return !!(this.on && this.st && this.st.xpBoost > 0); },
  coinBoostOn(){ return !!(this.on && this.st && this.st.coinBoost > 0); },
};
function reflectCustomIfOpen(){ if (G.mode === 'custom' && !$('custom').hidden) reflectCustom(); }

function renderCoins(){
  const show = Shop.on && !!Shop.st;
  const chip = $('coinChip');
  chip.hidden = !show;
  if (show){
    chip.querySelector('.cv').textContent = fmtCoins(Shop.st.coins);
    const b = [Shop.st.coinBoost ? COIN + '×2 ' + Shop.st.coinBoost : '', Shop.st.xpBoost ? '⚡XP×2 ' + Shop.st.xpBoost : ''].filter(Boolean).join(' · ');
    chip.querySelector('.cb').textContent = b ? b + ' แมตช์' : '';
  }
  $('shopBtn').hidden = !Shop.on;
}

function shopCard(u, opts){
  const owned = Shop.owns(u), pr = itemPrice(u), c = document.createElement('div');
  c.className = 'scard' + (owned ? ' owned' : '');
  if (opts.cls) c.dataset.cls = opts.cls;
  const img = document.createElement('span'); img.className = opts.cls ? 'cimg' : 'sicon';
  if (!opts.cls) img.textContent = opts.icon;
  const nm = document.createElement('span'); nm.className = 'sn'; nm.textContent = opts.name;
  const sub = document.createElement('span'); sub.className = 'ss'; sub.textContent = opts.sub || '';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn sb';
  const can = Shop.st && Shop.st.coins >= pr;
  if (owned && !opts.boost){
    const worn = opts.worn;
    btn.textContent = worn ? 'ใส่อยู่ ✓' : 'ใช้เลย'; btn.disabled = worn;
    btn.onclick = () => Shop.use(u);
  } else {
    btn.textContent = Shop.confirm === u ? 'ยืนยันซื้อ ' + fmtCoins(pr) + ' ' + COIN + '?' : fmtCoins(pr) + ' ' + COIN;
    btn.classList.toggle('poor', !can); btn.classList.toggle('ask', Shop.confirm === u);
    btn.onclick = () => Shop.buy(u);
  }
  c.append(img, nm, sub, btn);
  return c;
}
function renderShop(){
  if ($('shop').hidden) return;
  const st = Shop.st;
  $('shopCoins').textContent = st ? COIN + ' ' + fmtCoins(st.coins) + ' เหรียญ' : Shop.off ? '' : 'กำลังโหลด…';
  const tabs = $('shopTabs');
  if (!tabs.childElementCount) for (const [id, label] of SHOP_TABS){
    const b = document.createElement('button'); b.type = 'button'; b.dataset.tab = id; b.textContent = label;
    b.onclick = () => { Shop.tab = id; Shop.confirm = ''; $('shopGot').textContent = ''; renderShop(); };
    tabs.appendChild(b);
  }
  for (const b of tabs.children) b.setAttribute('aria-pressed', String(b.dataset.tab === Shop.tab));
  const grid = $('shopGrid'); grid.textContent = '';
  const note = $('shopNote');
  if (!Shop.on){ note.textContent = !Supa.available ? 'ร้านค้าต้องต่ออินเทอร์เน็ต' : 'ร้านค้ายังไม่เปิด (เจ้าของเกมต้องรัน supabase-shop.sql ใน Supabase) ตอนนี้ใช้ได้ทุกอาชีพ'; return; }
  const l = LOOKS[0];
  if (Shop.tab === 'class'){
    Quest.load();
    for (const k of ON_K){
      if (FREE_CLASSES.has(k)) continue;
      const [role, s] = CLASS_META[k] || ['melee', 2];
      grid.appendChild(shopCard('c:' + k, {cls:k, name:OUTFITS[k].name, sub:stars(s) + ' ' + ROLE_NAME[role] + (k === Quest.cls ? ' · ฟรีวันนี้' : ''), worn:l.outfit === k}));
      paintClassCard(k);
    }
    note.textContent = 'อาชีพความยาก ★ เล่นฟรีทั้งหมด (' + ON_K.filter(k => FREE_CLASSES.has(k) && k !== 'none').length + ' อาชีพ) · "อาชีพประจำวัน" ในภารกิจรายวันเล่นฟรีวันนั้น · ซื้อแล้วเป็นของคุณถาวร';
  } else if (Shop.tab === 'look'){
    for (const k of SHOP_HATS) grid.appendChild(shopCard('h:' + k, {icon:SHOP_ITEMS['h:' + k].icon, name:HATS[k], sub:'หมวก', worn:l.hat === k}));
    for (const k of SHOP_TITLES) grid.appendChild(shopCard('t:' + k, {icon:SHOP_ITEMS['t:' + k].icon, name:'« ' + TITLES[k] + ' »', sub:'ฉายาเหนือหัว', worn:l.title === k}));
    note.textContent = 'ของแต่งตัวเป็นแค่หน้าตา ไม่มีผลกับพลัง · ซื้อแล้วเปลี่ยนใส่ได้ที่หน้า "แต่งตัวละคร"';
  } else {
    for (const u of ['b:coin2', 'b:xp2']){
      const it = SHOP_ITEMS[u], left = u === 'b:coin2' ? st.coinBoost : st.xpBoost;
      grid.appendChild(shopCard(u, {icon:it.icon, name:it.name, sub:it.desc + (left ? ' · เหลือ ' + left + ' แมตช์' : ''), boost:true}));
    }
    note.textContent = 'บูสต์นับเฉพาะแมตช์ที่บันทึก XP ได้ (จบแมตช์ห่างกันอย่างน้อย 30 วินาที) · ซื้อซ้ำได้ สะสมสูงสุด 20 แมตช์';
  }
  if (!st) note.textContent = 'กำลังโหลดกระเป๋าเงิน…';
}

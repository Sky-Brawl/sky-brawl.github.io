// Sky Brawl · chatbot.js — สมองแชทของบอท: คลังประโยค, เข้าใจข้อความที่คนพิมพ์, คุยต่อเนื่อง, ถามกลับ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Bot chat brain (host / offline only; messages reach guests through chat.js).
   Lines may hold {to} (who the bot talks to), {me}, {cls} (the bot's class), {kos}, {stage}, {lead} (most KOs), {ans}.
   Replies: a message that names a bot is answered by that bot; otherwise the bot already talking to that player keeps
   the thread going; otherwise one or two random bots answer. Intents look at keywords; answers use the real game state.
   Bots also start conversations: they ask players questions and react to what the player answers. ---------- */
const BOT_CHAT = (() => { const v = Number(((window.SKY_CONFIG || {}).fighter || {}).botChat); return Number.isFinite(v) && v >= 0 && v <= 3 ? v : 1; })();

const BOT_LINES = {
  start:['มาๆๆ', 'ใครมาก่อน', 'ขอให้สนุกนะทุกคน', 'gl hf', 'วันนี้มือร้อน', 'เบาๆ นะทุกคน', 'พร้อมยังงง', 'รอบนี้ต้องชนะ', 'หวัดดีทุกคน', 'เล่น{cls}รอบนี้', 'ใครเก่งสุดในห้องเนี่ย',
    'ขอเล่นด้วยคน', 'อย่ารุมผมนะ 555', 'วอร์มนิ้วก่อน', 'เปิดมาก็เจอ{stage}เลย', 'ตั้งใจละรอบนี้', 'สู้ๆ ทุกคน', 'ทีมไหนก็ได้ขอชนะ'],
  kill:['ง่ายไปป', 'ขอบคุณที่มาส่ง', '55555', 'ไปพักก่อนนะ', 'ez', 'จัดไปหนึ่ง', 'บายยย', 'อีกคนๆ', 'ไม่ได้ตั้งใจนะ 555', 'โทษทีน้า', 'สวยยย', 'คอมโบนี้เป๊ะ',
    'ใครต่อ', 'ลาก่อนน', 'ได้ {kos} แล้ว', 'อุ่นเครื่องเสร็จ', 'ตีโดนพอดี 555'],
  killAgain:['อีกแล้วเหรอ @{to} 555', '@{to} คิดถึงเหรอ มาหาอีกแล้ว', 'รอบที่สองแล้วนะ @{to}', '@{to} ยอมยัง 555'],
  revenge:['แก้แค้นสำเร็จ!', '@{to} คืนแล้วนะ', 'หายกันละ @{to}', 'บอกแล้วว่าจะเอาคืน', 'ครบหนึ่งต่อหนึ่ง @{to}'],
  died:['อ้าวว', 'แลคคค', 'ไม่ทันตั้งตัว', 'เดี๋ยวเอาคืน!', 'โหดไปป', 'ไม่นะะะ', 'มือลั่น', 'กดผิดปุ่ม 555', 'ตกอีกแล้ว', 'ยังไม่ทันได้ตีเลย', 'เกือบรอดแล้ว', 'ขอเวลานอก'],
  diedTo:['@{to} จำหน้าไว้แล้ว', '@{to} โหดไปป', '@{to} เดี๋ยวเจอกัน', '@{to} ตีแรงจัง', '@{to} ใจร้ายย', 'ใคร {to} เนี่ย เก่งจัง', '@{to} รอก่อนนะ'],
  low:['เลือดจะหมดแล้ว', 'ช่วยด้วยย', 'ถอยก่อนๆ', 'ใกล้ตายแล้ววว', 'หาข้าวปั้นที', 'ขอหนีก่อน', 'อย่าตามมาา', 'เลือดเหลือนิดเดียว', 'ใครมีข้าวปั้นบ้าง'],
  hit:['เจ็บบ', 'แรงไปไหม', 'โอ๊ยย', 'ตีแรงจัง', 'เฮ้ยย', 'มาจากไหนเนี่ย', 'ไม่ทันเห็น', 'ใครแอบตี', 'สกิลอะไรเนี่ย', 'จุกก'],
  idle:['555', 'สนุกดี', 'ใครเก่งสุดในห้อง', 'อาชีพไหนโกงสุด', 'อยู่ไหนกันหมด', 'มาสู้กันตัวต่อตัว', 'หิวข้าวแล้ว', 'เล่นเพลินเลย', 'ขอยืมดาบหน่อย', 'คอมโบนี้เท่ไหม',
    '{cls} สนุกดีนะ', 'มีใครเล่น{cls}อีกไหม', 'ได้ {kos} แล้ว', '{lead} เก่งจัง ใครหยุดได้บ้าง', 'อย่าลืมกันด้วยนะ', 'ระวังขอบนะทุกคน', 'กด Shift วิ่งได้นะ รู้ยัง',
    'วันนี้เล่นถึงเช้าเลย', 'ใครชวนเพื่อนมาบ้าง', 'มีใครอยู่ไทยบ้าง', 'แมพนี้สวยดี', 'ปุ่มสกิลคูลนานจัง', 'เพลงในเกมเพราะดี', 'ใครอยากได้หมวกดาว ล็อกอินทุกวันนะ'],
  lava:['หนีเข้ากลาง!!', 'พื้นจะพังแล้ว', 'วิ่งงง', 'ลาวามาแล้ว!', 'ร้อนนน ถอยๆ', 'วงนอกกำลังจะพัง', 'อย่ายืนขอบ!!'],
  win:['GG', 'ชนะแล้ววว', 'ขอบคุณทุกคน', 'gg wp', 'ง่ายๆ 555', 'เก่งกันทุกคนเลย', 'อีกรอบไหม', 'ฟลุ๊คๆ 555', 'ยกให้ทุกคน'],
  lose:['gg', 'เกือบแล้ว', 'อีกรอบ!', 'gg ไม่ทันจริงๆ', 'เก่งมาก', '@{to} gg เก่งมาก', '@{to} รอบหน้าไม่ยอมแล้ว', 'แพ้แต่สนุก'],
  streak:['{kos} kill แล้ว ใครหยุดได้', 'ร้อนมือ!', 'ไม่มีใครหยุดได้แล้ว', 'มาอีกก', 'วันนี้วันเรา'],
  lastTwo:['เหลือสองคนแล้ว @{to}', '@{to} ตัดสินกันเลย', 'ตัวต่อตัวละ @{to}', 'ใจเย็นๆ @{to} 555', '@{to} ใครแพ้เลี้ยงข้าว'],
  respawn:['กลับมาแล้วว', 'รอบนี้ไม่พลาดละ', 'มาใหม่ๆ', 'ฟื้นแล้ว!', 'ยังไม่จบนะ'],
  out:['ตกรอบแล้ว ดูต่อละกัน', 'จบละ ไปกินข้าวก่อน', 'เชียร์ {lead}', 'ใครจะชนะเนี่ย', 'ดูจากข้างสนามก็สนุก'],
  watch:['{lead} โหดมาก', 'สู้ๆ ทุกคน', 'ลุ้นๆ', 'เกือบตกแล้วนั่น', 'สวยมาก', 'ฮาาา', 'เชียร์ {lead}', 'คอมโบเมื่อกี้สวย', 'ใครจะรอด', 'ดูเพลินเลย', 'อยากกลับไปเล่นแล้ว'],
};
const STAGE_LINES = {titanic:['เรือจะจมไหมเนี่ย', 'ระวังตกทะเล', 'น้ำเย็นมั้ยนะ', 'ภูเขาน้ำแข็งอยู่ไหน 555'], volcano:['ร้อนนนน', 'ลาวาน่ากลัวมาก', 'อย่าตกลาวานะ', 'หินตกใส่หัวอีกแล้ว'],
  christmas:['หนาววว', 'หิมะสวยจัง', 'ซานต้าอยู่ไหน', 'เมอร์รี่คริสต์มาส'], japan:['ซากุระสวยมาก', 'อยากไปญี่ปุ่น', 'นินจาอยู่ไหน'], ice:['ลื่นนน', 'เบรกไม่อยู่', 'ไถลไปเลย 555'],
  halloween:['น่ากลัวอะ', 'ผีมาแล้ว', 'ฟักทองยักษ์ 555'], skyisle:['เกาะใหญ่มาก', 'ซุ่มในพุ่มไม้ดีกว่า', 'อยู่บนเนินยิงสบาย'], temple:['วัดสวยจัง', 'สาธุ 🙏'],
  siam:['รถติดจัง', 'ไปสยามกัน'], hospital:['หมอช่วยด้วย', 'ยืนบนกากบาทเขียวฟื้นเลือดได้นะ'], gvg:['บุกกก', 'ปกป้องหินไว้!']};
const BOT_TIPS = ['กด E ใช้สกิลอาชีพ', 'กด Shift วิ่งเร็ว', 'กด H กันแล้วค่อยสวน', 'Q ล็อกเป้า', 'อย่ายืนใกล้ขอบ โดนตีปลิว', 'เก็บข้าวปั้นฟื้นเลือด', 'ต่อยรัว 3 ทีเป็นคอมโบ', 'ระเบิดขว้างได้นะ กด R',
  'ปุ่ม 1–8 ส่งอีโมต', 'ล็อกอินทุกวันได้หมวกฟรี'];
const BOT_QUESTIONS = [
  ['askClass', ['@{to} เล่นอาชีพอะไรอะ', '@{to} ตัวนั้นอาชีพอะไร เท่ดี', '@{to} ใช้อาชีพไหนเก่งสุด']],
  ['askFrom', ['@{to} มาจากไหนอะ', '@{to} อยู่จังหวัดไหน']],
  ['askLong', ['@{to} เล่นมานานยัง', '@{to} เก่งจัง เล่นมานานแล้วเหรอ']],
  ['askDuel', ['@{to} 1v1 ไหม', '@{to} มาสู้กันตัวต่อตัวป่ะ']],
  ['askStage', ['@{to} ชอบด่านไหนสุด', '@{to} ด่านนี้ชอบไหม']],
];
const ANSWER_TO = {
  askClass:a => [`อ๋อ ${a} เท่ดี`, `${a} โหดนะ`, `เดี๋ยวลองเล่น ${a} บ้าง`, `${a} สกิลสวยดี`],
  askFrom:() => ['ใกล้กันเลย', 'โอ้ว ไกลอยู่นะ', 'เคยไปเที่ยว', 'เหมือนกันเลย 555'],
  askLong:() => ['เก่งจริง', 'นานกว่าเราอีก', 'มือใหม่แต่เก่งนะ', 'สอนหน่อย'],
  askDuel:yes => yes ? ['มาเลย!', 'รอที่กลางแมพ', 'จัดไป'] : ['ขี้ขลาด 555', 'งั้นไว้รอบหน้า', 'โอเคๆ'],
  askStage:a => [`${a} สวยจริง`, 'ชอบเหมือนกัน', 'เดี๋ยวเลือกด่านนั้นรอบหน้า'],
};
// What players say → how a bot answers. Each entry: [regex, lines or (ctx) => lines, optional action]
const BOT_INTENTS = [
  [/(^|\s)(gg|จีจี)/i, ['gg', 'gg wp', 'gg ครับ', 'gg สนุกมาก', 'อีกรอบไหม'], 'many'],
  [/บาย|ไปละ|ไปก่อน|bye|ออกละ/i, ['บายย', 'ไว้เล่นกันใหม่นะ', 'ไปดีมาดี', 'บายจ้า @{to}'], 'many'],
  [/หวัดดี|สวัสดี|^hi\b|hello|ดีจ้า|ดีครับ|ดีค่ะ|ทักทาย/i, ['หวัดดีครับ', 'ดีจ้า', 'hi!', 'หวัดดี @{to}', 'สวัสดีจ้า มาเล่นด้วยกัน', 'ดีๆ', 'หวัดดีจ้าา'], 'many'],
  [/ขอบคุณ|ขอบใจ|thx|thank/i, ['ยินดีจ้า', 'ไม่เป็นไร', 'ด้วยความยินดี']],
  [/ขอโทษ|sorry|โทษที|ซอรี่/i, ['ไม่เป็นไร', 'โอเคๆ', 'ให้อภัย 555', 'ไม่โกรธหรอก']],
  [/กาก|อ่อน|noob|โง่|กระจอก|ห่วย|ไก่/i, ['ใจเย็นๆ 555', 'เดี๋ยวก็รู้ว่าใครกาก', 'อ่อนแต่ตีโดนนะ', 'เจอกันกลางแมพ @{to}', 'ไม่ต้องปากดี มาตีกัน'], 'duel'],
  [/โกง|hack|แฮก/i, ['ไม่ได้โกงนะ!', 'ฝีมือล้วนๆ', '555 โกงตรงไหน', 'ฝึกมาเยอะต่างหาก']],
  [/บอท|bot|\bai\b|คนจริง|คนไหม/i, ['ไม่ใช่บอทนะ', 'บอทอะไร 555', 'คนจริงๆ ครับ', 'บอทที่ไหนพิมพ์ได้ 555', 'ถ้าเป็นบอทจะเก่งกว่านี้']],
  [/สอน|ทำยังไง|ยังไง|วิธี|ทริค|เทคนิค|tip/i, () => BOT_TIPS.map(t => 'ลอง' + t + 'ดู')],
  [/เก่ง|โปร|pro|เทพ|สุดยอด|เจ๋ง|โหด/i, ['ขอบคุณ', 'ไม่เก่งหรอก', 'ฝึกมานาน 555', 'คุณก็เก่ง', 'ฟลุ๊คๆ']],
  [/อาชีพ|class|ตัวอะไร|ตัวไหน|ใช้อะไร/i, ['เล่น{cls}อยู่', '{cls} ไง เท่ไหม', 'ชอบ{cls}ที่สุด', 'ตอนนี้{cls} เดี๋ยวลองเปลี่ยน']],
  [/ได้กี่|กี่ kill|กี่คิล|คะแนน|ใครนำ|นำอยู่/i, ['ได้ {kos} แล้ว', '{lead} นำอยู่นะ', 'ยังน้อยอยู่ {kos} เอง', 'ไล่ตาม {lead} อยู่']],
  [/1v1|1 v 1|ตัวต่อตัว|มาสู้|มาดิ|ท้า/i, ['มาดิ!', 'รอที่กลางแมพ', 'จัดไป @{to}', 'กลัวที่ไหน'], 'duel'],
  [/ทีม|ช่วยกัน|รวมกัน|ร่วมมือ/i, ['ได้ๆ', 'ไปตี {lead} กัน', 'ทีมกันก็ได้', 'ไม่อะ เล่นเดี่ยว 555']],
  [/แลค|lag|ค้าง|กระตุก|ping/i, ['เน็ตหลุดป่าว', 'ของเราก็แลค', 'ลองรีเฟรชดู', 'ไม่แลคนะ']],
  [/ชื่อ/i, ['ชื่อ {me} ไง', 'เรียก {me} ก็ได้', 'ชื่อตรงหัวเลย 555']],
  [/อายุ|กี่ขวบ/i, ['ความลับ 555', 'ยังหนุ่มอยู่', 'แก่แล้ว']],
  [/อยู่ไหน|มาจากไหน|จังหวัด/i, ['กรุงเทพ', 'เชียงใหม่', 'ขอนแก่น', 'ภูเก็ต', 'อยู่บ้าน 555']],
  [/กินข้าว|หิว|ข้าว/i, ['หิวเหมือนกัน', 'กินข้าวปั้นในเกมไปก่อน 555', 'เดี๋ยวไปกินละ']],
  [/ด่าน|แมพ|map/i, ['ชอบด่าน{stage}', 'ด่านภูเขาไฟมันส์สุด', '{stage}สวยดี', 'ชอบเกาะลอยฟ้า']],
  [/รัก|ชอบ|น่ารัก/i, ['ชอบเกมนี้เหมือนกัน', 'น่ารักจัง', '😍']],
  [/555|ฮ่า|lol|ขำ|😂|🤣/i, ['555', '5555555', 'ขำ', 'ฮาาา', '555 จริง']],
  [/เบื่อ|ง่วง|นอน/i, ['อีกตาเดียว', 'อย่าเพิ่งนอน', 'ง่วงเหมือนกัน']],
  [/^(ใช่|ช่าย|ok|โอเค|ได้|จ้า|ครับ|ค่ะ)/i, ['โอเค', 'จ้า', 'ได้เลย', '👍']],
  [/\?|ไหม|มั้ย|ป่ะ|เหรอ|หรอ|อะไร/i, ['ไม่รู้สิ', 'น่าจะนะ', 'ลองดูดิ', 'อืมมม', 'ใช่มั้ง', 'ถามยากจัง 555']],
];
const BOT_FALLBACK = ['จริง', 'ใช่ๆ', '555', 'โอเค', 'อืม', 'ว่าไง', 'ฮะ?', 'อ่าาา', 'จริงดิ', 'เหรอ', 'แล้วไงต่อ'];

/* ---------- Helpers ---------- */
const clsName = f => (OUTFITS[f.cls] && f.cls !== 'none') ? OUTFITS[f.cls].name : 'มือเปล่า';
function leaderName(){ let b = null; for (const f of G.fighters) if (f.stocks > 0 && (!b || (f.kos || 0) > (b.kos || 0))) b = f; return b ? b.name : '-'; }
function fillLine(s, f, to, ans){
  return s.replace(/\{to\}/g, to ? to.name : 'ทุกคน').replace(/\{me\}/g, f.name).replace(/\{cls\}/g, clsName(f)).replace(/\{kos\}/g, f.kos || 0)
    .replace(/\{stage\}/g, (STAGES[STAGE_KEY] || {}).name || '').replace(/\{lead\}/g, leaderName()).replace(/\{ans\}/g, ans || '');
}
// Little human touches: a stretched last letter, a trailing 555
function humanize(s){
  const r = Math.random(), last = s.charCodeAt(s.length - 1);
  if (r < .12 && last >= 0x0E01 && last <= 0x0E2E) return s + s[s.length - 1].repeat(1 + (Math.random()*2 | 0));
  if (r < .2 && !/5{3}/.test(s)) return s + ' 555';
  return s;
}
const botLine = (kind, f, to) => {
  const bank = kind === 'idle' && STAGE_LINES[STAGE_KEY] && Math.random() < .35 ? STAGE_LINES[STAGE_KEY] : BOT_LINES[kind] || BOT_FALLBACK;
  return humanize(fillLine(pick(bank), f, to));
};
function botMayChat(f, p){
  if (!f || f.ctrl !== 'bot' || BOT_CHAT <= 0 || G.net === 'guest' || G.mode !== 'play' || G.tut) return false;
  if ((f.chatT || 0) > G.frame || (G.chatT || 0) > G.frame) return false;
  if (Math.random() >= Math.min(1, p*BOT_CHAT)) return false;
  f.chatT = G.frame + 540 + Math.random()*420; G.chatT = G.frame + Math.max(50, 110 - G.fighters.length*3);
  return true;
}
// A bot "types" (longer messages take longer) before the message appears
function queueBotLine(f, text, delay = 0){
  CHAT.queue = CHAT.queue || [];
  const core = s => s.replace(/^@\S+ /, '').replace(/[ 5]+$/, '');   // a bot never repeats a line another bot just said (laughing along is fine)
  if (core(text) && CHAT.log.some(m => G.fighters[m.idx] && G.fighters[m.idx].ctrl === 'bot' && core(m.text) === core(text)) || CHAT.queue.some(q => core(q.text) === core(text))) return;
  CHAT.queue.push({f, text, at:G.frame + delay + 25 + text.length*2.5 + Math.random()*40});
}
function botChat(f, kind, p, delay = 0, to){ if (botMayChat(f, p)) queueBotLine(f, botLine(kind, f, to), delay); }
const isHuman = f => f && (f.ctrl === 'p1' || f.ctrl === 'p2' || (f.ctrl === 'net' && f.peer));

/* ---------- Answering ---------- */
CHAT.threads = new Map();   // player idx → {bot, until, topic}
function findAddressed(text){
  const t = text.toLowerCase();
  return G.fighters.find(b => b.ctrl === 'bot' && b.name.length >= 2 && (t.includes('@' + b.name.toLowerCase()) || (b.name.length >= 4 && t.includes(b.name.toLowerCase()))));
}
function classIn(text){ for (const k of ON_K){ const n = OUTFITS[k] && OUTFITS[k].name; if (n && k !== 'none' && text.includes(n)) return n; } return null; }
function answerLines(b, from, text, thread){
  // the player is answering a question this bot asked
  if (thread && thread.topic && ANSWER_TO[thread.topic]){
    const t = thread.topic, yes = /ได้|มา|ok|โอเค|เอา|จัด|ใช่/i.test(text);
    const ans = t === 'askClass' ? (classIn(text) || text.slice(0, 12)) : text.slice(0, 12);
    if (t === 'askDuel' && yes) return {lines:ANSWER_TO.askDuel(true), act:'duel'};
    return {lines:ANSWER_TO[t](t === 'askDuel' ? false : ans)};
  }
  for (const [re, lines, act] of BOT_INTENTS) if (re.test(text)) return {lines:typeof lines === 'function' ? lines() : lines, act};
  return {lines:BOT_FALLBACK};
}
function botsAnswer(from, text){
  if (BOT_CHAT <= 0 || !from) return;
  const fromBot = from.ctrl === 'bot';
  const pool = G.fighters.filter(b => b !== from && b.ctrl === 'bot' && (alive(b) || b.stocks <= 0));
  if (!pool.length) return;
  const named = findAddressed(text), thread = !fromBot && CHAT.threads.get(from.idx);
  const many = !fromBot && !named && BOT_INTENTS.some(([re, , act]) => act === 'many' && re.test(text));   // hi / gg / bye to everyone
  const live = thread && thread.until > G.frame && pool.includes(thread.bot) ? thread : null;
  let who = [];
  if (named && named !== from) who = [named];
  else if (live && !many) who = [live.bot];
  else {
    const n = fromBot ? (Math.random() < .25 ? 1 : 0) : many ? 2 + (Math.random()*2 | 0) : (Math.random() < .3 ? 2 : 1);
    for (let i = 0; i < n && pool.length; i++) who.push(pool.splice(Math.random()*pool.length | 0, 1)[0]);
  }
  who.forEach((b, i) => {
    if (!fromBot && Math.random() > (named || live ? .95 : .8)*BOT_CHAT) return;
    const {lines, act} = answerLines(b, from, text, !many && b === (live && live.bot) ? live : null);
    let line = fillLine(pick(lines), b, from);
    if (!fromBot && !line.includes('@') && Math.random() < .45) line = '@' + from.name + ' ' + line;
    queueBotLine(b, humanize(line), 40 + i*70 + Math.random()*90);
    b.chatT = G.frame + 300;
    if (act === 'duel' && b.ai && alive(from)){ b.ai.tgt = b.ai.duel = from; b.ai.tgtT = 30; b.ai.duelT = G.frame + 900; }   // the bot really comes for you
    if (!fromBot && (i === 0 || !many)) CHAT.threads.set(from.idx, {bot:b, until:G.frame + 660, topic:null});
  });
}
// Now and then a bot starts a conversation with a player
function botAsk(){
  const humans = G.fighters.filter(f => isHuman(f) && alive(f));
  if (!humans.length) return;
  const to = pick(humans), bots = G.fighters.filter(b => b.ctrl === 'bot' && alive(b) && b.stocks > 0);
  if (!bots.length) return;
  const b = bots.sort((a, c) => Math.hypot(a.pos.x - to.pos.x, a.pos.z - to.pos.z) - Math.hypot(c.pos.x - to.pos.x, c.pos.z - to.pos.z))[Math.random() < .6 ? 0 : Math.random()*bots.length | 0];
  if (!botMayChat(b, 1)) return;
  const [topic, lines] = pick(BOT_QUESTIONS);
  queueBotLine(b, fillLine(pick(lines), b, to));
  CHAT.threads.set(to.idx, {bot:b, until:G.frame + 900, topic});
}

/* ---------- Game events ---------- */
function botChatKO(f, killer){
  if (killer && killer !== f){
    const again = (killer.chatVictims || (killer.chatVictims = {}))[f.idx] = (killer.chatVictims[f.idx] || 0) + 1;
    const revenge = killer.lastKiller === f.idx;   // f had knocked the killer out before
    if (killer.kos >= 3 && killer.kos % 3 === 0) botChat(killer, 'streak', .6, 30);
    else if (revenge) botChat(killer, 'revenge', .6, 30, f);
    else if (again >= 2) botChat(killer, 'killAgain', .45, 30, f);
    else botChat(killer, 'kill', .35, 30, f);
    botChat(f, Math.random() < .5 ? 'diedTo' : 'died', isHuman(killer) ? .5 : .3, 45, killer);
    killer.lastKiller = -1; f.lastKiller = killer.idx;
  } else botChat(f, 'died', .3, 40);
  if (f.stocks <= 0) botChat(f, 'out', .35, 140);
}
function chatOnWin(f){
  botChat(f, 'win', .9, 30);
  for (const b of G.fighters) if (b !== f && b.ctrl === 'bot' && b.state !== 'win' && Math.random() < .3){ b.chatT = 0; G.chatT = 0; botChat(b, 'lose', 1, 60 + Math.random()*120, f); }
}
// Called by chatTick on the host / offline every frame while the match runs
function botChatTick(){
  const fr = G.frame;
  const lava = STAGE_KEY === 'volcano' && typeof volWarn === 'function' && volWarn();
  const left = G.fighters.filter(f => f.stocks > 0 && alive(f));
  if (left.length === 2 && !CHAT.lastTwo){ CHAT.lastTwo = true; const [a, c] = left; if (a.ctrl === 'bot') botChat(a, 'lastTwo', .7, 20, c); else if (c.ctrl === 'bot') botChat(c, 'lastTwo', .7, 20, a); }
  if (G.fighters.some(isHuman) && (CHAT.askT || 0) < fr && G.countdown <= 0){ CHAT.askT = fr + 2400 + Math.random()*2400; if (fr > 600) botAsk(); }
  for (const f of G.fighters){
    if (f.ctrl !== 'bot' || (fr + f.idx*11) % 60) continue;   // once a second per bot
    if (f.stocks <= 0){ if (Math.random() < .1) botChat(f, 'watch', .05); continue; }
    if (!alive(f)) continue;
    const drop = (f.chatHp ?? f.hp) - f.hp; f.chatHp = f.hp;
    if (G.countdown > 40 && !f.chatHi){ f.chatHi = true; botChat(f, 'start', .25); continue; }
    if (f.state === 'respawn' && !f.chatResp){ f.chatResp = true; botChat(f, 'respawn', .2); continue; }
    if (f.state !== 'respawn') f.chatResp = false;
    if (lava && !f.chatLava){ f.chatLava = true; botChat(f, 'lava', .3); continue; }
    if (!lava) f.chatLava = false;
    if (f.hp < MAX_HP*.3 && !f.chatLow){ f.chatLow = true; botChat(f, 'low', .35); continue; }
    if (f.hp > MAX_HP*.6) f.chatLow = false;
    if (drop >= 18){ botChat(f, 'hit', .25); continue; }
    if (botMayChat(f, .012)){
      const line = botLine('idle', f);
      queueBotLine(f, line);
      if (Math.random() < .25) CHAT.botReply = {from:f, text:line, at:fr + 120};   // another bot may join in
    }
  }
  if (CHAT.botReply && fr >= CHAT.botReply.at){ const r = CHAT.botReply; CHAT.botReply = null; botsAnswer(r.from, r.text); }
}

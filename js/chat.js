// Sky Brawl · chat.js — แชทวิ่งบนจอแบบ Niconico ระหว่างต่อสู้ (สมองบอทอยู่ใน chatbot.js)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- In-match chat: messages fly right-to-left across the upper part of the screen. Enter (or the 💬 chip) opens
   the input. Bots chat too: at the start, after KOs, when hurt, when the lava rises, at the end, now and then for no
   reason, and they answer what players type (after a short "typing" delay).
   Online: a guest sends [seq, text] in its presence (key 'ch'); the host posts it and shares the last few seconds of
   chat in the snapshot (sn.ct = [[seq, fighter idx, text]...]). Text is always shown with textContent. ---------- */
const CHAT_MAX = 40, CHAT_KEEP = 240;
const CHAT = {seq:0, log:[], lastSeen:0, mySeq:0, pending:[], hidden:false, lanes:[], cleared:true};
try { CHAT.hidden = localStorage.getItem('skybrawl.chatHidden') === '1'; } catch (e) {}
const cleanChat = s => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX);

/* ---------- Showing a message ---------- */
function nicoShow(f, text, mine){
  if (CHAT.hidden || !text) return;
  const layer = $('nico'), W = innerWidth, H = innerHeight;
  CHAT.cleared = false;
  const el = document.createElement('div'); el.className = 'nico' + (mine ? ' mine' : '');
  const n = document.createElement('span'); n.className = 'nn'; n.textContent = f ? f.name : ''; n.style.color = f ? hex(f.team) : '#fff';
  const t = document.createElement('span'); t.textContent = text;
  el.append(n, t); layer.appendChild(el);
  // lanes across the upper part of the screen; pick the one that frees up first
  const laneH = H < 500 ? 26 : 34, top0 = H < 500 ? 52 : 110, count = Math.max(3, Math.floor((H*.5 - top0)/laneH));
  const now = performance.now(), w = el.offsetWidth, dur = 7000 + Math.min(3000, w*6), speed = (W + w)/dur;
  let best = 0;
  for (let i = 0; i < count; i++) if ((CHAT.lanes[i] || 0) < (CHAT.lanes[best] || 0)) best = i;
  CHAT.lanes[best] = Math.max(now, CHAT.lanes[best] || 0) + (w + 40)/speed;
  el.style.top = top0 + best*laneH + 'px';
  if (REDUCE){ el.style.left = '12px'; el.animate([{opacity:0}, {opacity:1, offset:.08}, {opacity:1, offset:.85}, {opacity:0}], {duration:4500}).onfinish = () => el.remove(); return; }
  el.animate([{transform:`translateX(${W}px)`}, {transform:`translateX(${-w - 20}px)`}], {duration:dur, easing:'linear'}).onfinish = () => el.remove();
  while (layer.children.length > 40) layer.firstChild.remove();
}
function clearNico(){ $('nico').textContent = ''; CHAT.lanes = []; CHAT.cleared = true; }

/* ---------- Posting (host / offline) ---------- */
function postChat(f, text, human){
  text = cleanChat(text); if (!f || !text) return;
  if (G.net === 'guest') return;
  CHAT.seq++; CHAT.log.push({seq:CHAT.seq, idx:f.idx, text, t:G.frame});
  nicoShow(f, text, f.isLocal);
  if (human) botsAnswer(f, text);
}
// The local player's message
function sendChat(text){
  text = cleanChat(text); if (!text || G.mode !== 'play') return;
  const me = G.fighters.find(o => o.isLocal && (G.net === 'guest' || o.ctrl === 'p1')) || G.fighters.find(o => o.isLocal);
  if (!me) return;
  if ((CHAT.sentT || 0) > performance.now()) return;   // one message every 1.2 s
  CHAT.sentT = performance.now() + 1200;
  if (G.net === 'guest'){ CHAT.mySeq++; Net.presence({ch:[CHAT.mySeq, text, Net.epoch]}); CHAT.pending.push(text); nicoShow(me, text, true); }
  else postChat(me, text, true);
}
// Host: guests' messages arrive in their presence
function hostChatIn(){
  if (G.net !== 'host') return;
  for (const f of G.fighters){
    if (!f.peer) continue;
    const e = Net.conns.get(f.peer), ch = e && e.pres && e.pres.ch;
    // only messages typed during this match (the epoch), each one once
    if (!Array.isArray(ch) || ch[2] !== Net.epoch || ch[0] === f.chSeq) continue;
    f.chSeq = ch[0]; postChat(f, ch[1], true);
  }
}
// Snapshot: host shares the last few seconds; guests show what is new to them
function chatForSnap(){ return CHAT.log.length ? CHAT.log.map(m => [m.seq, m.idx, m.text]) : null; }
function chatFromSnap(ct){
  if (!Array.isArray(ct)) return;
  for (const m of ct){
    if (!Array.isArray(m)) continue;
    const seq = Number(m[0]) || 0, f = G.fighters[Number(m[1])], text = cleanChat(m[2]);
    if (seq <= CHAT.lastSeen || !f) continue;
    CHAT.lastSeen = seq;
    if (f.isLocal){ const i = CHAT.pending.indexOf(text); if (i >= 0){ CHAT.pending.splice(i, 1); continue; } }
    nicoShow(f, text, f.isLocal);
  }
}

/* ---------- Every tick on the host / offline: deliver what bots typed, read guests' messages, let bots think (chatbot.js) ---------- */
function chatTick(){
  if (G.mode !== 'play'){ if (!CHAT.cleared) clearNico(); CHAT.queue = []; return; }
  if (G.net === 'guest') return;
  if (CHAT.matchId !== G.matchId){ CHAT.matchId = G.matchId; CHAT.queue = []; G.chatT = 0; CHAT.threads.clear(); CHAT.lastTwo = false; CHAT.askT = 0; CHAT.botReply = null; }
  hostChatIn();
  const fr = G.frame;
  while (CHAT.log.length && fr - CHAT.log[0].t > CHAT_KEEP) CHAT.log.shift();
  if (CHAT.queue && CHAT.queue.length){
    CHAT.queue = CHAT.queue.filter(q => { if (fr < q.at) return true; if (alive(q.f) || q.f.state === 'win' || q.f.stocks <= 0) postChat(q.f, q.text, false); return false; });
  }
  if (BOT_CHAT <= 0 || G.endT > 0 || G.tut) return;
  botChatTick();
}

/* ---------- Input bar ---------- */
function openChat(){
  if (G.mode !== 'play') return;
  keys.clear();
  $('mChatBar').hidden = false; $('mChatIn').value = ''; $('mChatIn').focus();
}
function closeChat(){ $('mChatBar').hidden = true; $('mChatIn').blur(); }
function syncChatHide(){ $('mChatHide').textContent = CHAT.hidden ? 'แชท: ซ่อน' : 'แชท: แสดง'; if (CHAT.hidden) clearNico(); }

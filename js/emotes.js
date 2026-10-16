// Sky Brawl · emotes.js — อีโมตเหนือหัว (ปุ่ม 1–8 / ปุ่ม 😀 บนจอ) และท่าฉลองตอนชนะ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Emotes: a speech bubble over a fighter's head for EMOTE_T frames. Players pick one with keys 1–8 or the
   😀 panel; bots sometimes laugh after a KO or cry when knocked out; the winner gets the trophy. Online the guest sends
   a counter + id in its input row (in[10], in[11]) and the host sends each fighter's bubble in the snapshot (f[19]). ---------- */
const EMOTES = [['😂', 'ฮา'], ['😡', 'โมโห'], ['👍', 'เยี่ยม'], ['😭', 'ร้องไห้'], ['💪', 'มาดิ'], ['GG', 'GG'], ['😍', 'ปลื้ม'], ['🙏', 'ขอโทษ'], ['🏆', 'ชนะ']];
const EMOTE_PICK = 8, EMOTE_TROPHY = 8, EMOTE_T = 150, EMOTE_CD = 50;
function doEmote(f, id, force, isReply){
  if (!f || !(id >= 0 && id < EMOTES.length)) return false;
  if (!force && (f.emoCd || 0) > G.frame) return false;
  f.emoCd = G.frame + EMOTE_CD; f.emoSeq = ((f.emoSeq || 0) + 1) % 1000;
  f.emo = {id, until:G.frame + EMOTE_T};
  if (!isReply) scheduleReplies(f, id);
  return true;
}
// The local player's emote: offline it shows at once; a guest also shows it at once and tells the host
function emoteLocal(id, who = 'p1'){
  if (G.mode !== 'play' || !(id >= 0 && id < EMOTE_PICK)) return;
  const f = G.fighters.find(o => o.isLocal && (G.net === 'guest' || o.ctrl === who)) || G.fighters.find(o => o.isLocal);
  if (!f || !doEmote(f, id)) return;
  if (G.net === 'guest'){ const c = Net.counts; c.e = (c.e || 0) + 1; c.eid = id; }
  Sfx.play('pickup', f.pos, .5);
  $('emoPanel').hidden = true;
  Quest.add('emote');
}
// Bots react to KOs now and then (host / offline only)
function botEmotes(f, killer){
  if (G.net === 'guest') return;
  if (killer && killer !== f) botSay(killer, pick([0, 4, 5, 2]), .45);
  botSay(f, Math.random() < .6 ? 3 : 1, .35);
  // teammates cheer a KO in team mode
  if (killer && G.teamMode) for (const a of G.fighters) if (a !== killer && ally(a, killer) && Math.hypot(a.pos.x - killer.pos.x, a.pos.z - killer.pos.z) < 12) botSay(a, 2, .2);
}

/* ---------- Bots that talk: they greet at the start, cry when nearly dead, get angry after a big hit, taunt a reeling
   target and answer emotes sent near them. Host / offline only; the bubbles reach guests through the snapshot.
   Each bot waits 5–9 s between emotes and all bots share a budget of one emote every ~0.4 s, so big rooms stay readable. ---------- */
// How chatty bots are: 0 = never, 1 = normal, up to 3 = a lot (config.js → fighter.botEmotes)
const BOT_EMO = (() => { const v = Number(((window.SKY_CONFIG || {}).fighter || {}).botEmotes); return Number.isFinite(v) && v >= 0 && v <= 3 ? v : 1; })();
// What a bot answers to each emote (one of the two, at random); the trophy gets tears or a GG
const EMO_REPLY = [[1, 0], [0, 4], [2, 6], [0, 7], [4, 1], [5, 5], [6, 2], [2, 6], [3, 5]];
function botMay(f, p){
  if (!f || f.ctrl !== 'bot' || BOT_EMO <= 0 || G.net === 'guest' || G.mode !== 'play' || !alive(f) || f.stocks <= 0) return false;
  if ((f.botEmoT || 0) > G.frame || (G.botEmoT || 0) > G.frame) return false;
  if (Math.random() >= Math.min(1, p*BOT_EMO)) return false;
  f.botEmoT = G.frame + 300 + Math.random()*240; G.botEmoT = G.frame + 24;
  return true;
}
function botSay(f, id, p, isReply){ return botMay(f, p) && doEmote(f, id, false, isReply); }
// Up to two bots near whoever emoted may answer half a second to a second later
function scheduleReplies(f, id){
  if (G.net === 'guest' || BOT_EMO <= 0 || G.mode !== 'play') return;
  const near = G.fighters.filter(b => b !== f && b.ctrl === 'bot' && alive(b) && b.stocks > 0 && !b.emoReply && Math.hypot(b.pos.x - f.pos.x, b.pos.z - f.pos.z) < 12)
    .sort((a, b) => Math.hypot(a.pos.x - f.pos.x, a.pos.z - f.pos.z) - Math.hypot(b.pos.x - f.pos.x, b.pos.z - f.pos.z)).slice(0, 2);
  for (const b of near) if (Math.random() < .55*BOT_EMO) b.emoReply = {id:pick(EMO_REPLY[id] || [2]), at:G.frame + 30 + Math.random()*40};
}
function botEmoteTick(){
  if (G.mode !== 'play' || G.net === 'guest' || BOT_EMO <= 0 || G.tut) return;
  const fr = G.frame;
  for (const f of G.fighters){
    if (f.ctrl !== 'bot' || !alive(f) || f.stocks <= 0) continue;
    if (f.emoReply && fr >= f.emoReply.at){ const r = f.emoReply; f.emoReply = null; botSay(f, r.id, 1, true); }
    if ((fr + f.idx*7) % 30) continue;   // the rest twice a second per bot
    const drop = (f.hpSeen ?? f.hp) - f.hp; f.hpSeen = f.hp;
    if (G.countdown > 30 && !f.greeted){ f.greeted = true; botSay(f, pick([2, 4, 6, 5]), .3); continue; }
    if (f.hp < MAX_HP*.3 && !f.lowSaid){ f.lowSaid = true; botSay(f, Math.random() < .6 ? 3 : 7, .5); continue; }
    if (f.hp > MAX_HP*.6) f.lowSaid = false;
    if (drop >= 15){ botSay(f, Math.random() < .65 ? 1 : 3, .3); continue; }
    const t = f.ai && f.ai.tgt;
    if (t && alive(t) && t.state === 'hitstun' && Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) < 6) botSay(f, pick([0, 4, 0, 1]), .06);
  }
}
// The bubble lives in the fighter's name tag
function syncEmoteTag(f){
  const t = f.tag; if (!t) return;
  if (!t.emo){ t.emo = document.createElement('div'); t.emo.className = 'temo'; t.el.insertBefore(t.emo, t.el.firstChild); t.emoKey = ''; }
  const on = f.emo && f.emo.until > G.frame, key = on ? f.emo.id + ':' + f.emo.until : '';
  if (key === t.emoKey) return;
  t.emoKey = key;
  t.emo.classList.remove('on');
  if (!on) return;
  const [e] = EMOTES[f.emo.id];
  t.emo.textContent = e; t.emo.classList.toggle('word', e.length > 2 || /^[A-Z]/.test(e));
  void t.emo.offsetWidth; t.emo.classList.add('on');
}

/* ---------- Victory: whoever won stops, turns to the camera and celebrates until the result screen ---------- */
function winnersNow(){
  if (G.zombie && G.zbWin != null) return G.fighters.filter(f => (G.zbWin === 1) === !!f.zombie && alive(f) && f.stocks > 0);
  if (G.winner) return [G.winner];
  if (G.winTeam !== null && G.winTeam !== undefined) return G.fighters.filter(f => f.side === G.winTeam && alive(f) && f.stocks > 0);
  if (G.raidWin) return G.fighters.filter(f => alive(f) && f.stocks > 0);
  return [];
}
// Host / offline: called every tick while the match is ending
function stepVictory(){
  for (const f of winnersNow()){
    if (f.state === 'win'){ f.stateT++; continue; }
    if (!f.onGround || f.state === 'out' || f.state === 'wait' || f.state === 'respawn') continue;
    f.state = 'win'; f.stateT = 0; f.move = null; f.moveKey = ''; f.vel.set(0, f.vel.y, 0); f.facing = 0; f.formT = Math.min(f.formT, 1);
    doEmote(f, EMOTE_TROPHY, true); chatOnWin(f);
  }
}
const WIN_CONFETTI = [0xffd23a, 0xff5d4a, 0x2f8cff, 0x3fbf5a, 0xff7fb5, 0xffffff];
// Three celebrations, picked by the fighter's number: jump for joy, fist pumps, a spin into a pose
function animWin(f, v, t){
  const {tilt, armL, armR, legL, legR, head} = v, k = f.idx % 3;
  if (k === 0){
    const j = Math.abs(Math.sin(t*.16));
    tilt.position.y += j*.55; armL.rotation.set(0, 0, 2.5 + Math.sin(t*.32)*.35); armR.rotation.set(0, 0, -2.5 - Math.sin(t*.32)*.35);
    legL.rotation.x = -j*.5; legR.rotation.x = j*.3; head.rotation.x = -.15;
  } else if (k === 1){
    const p = Math.sin(t*.3);
    armR.rotation.set(-2.7 + p*.35, 0, -.25); armL.rotation.set(-.4, 0, .9); tilt.rotation.z = .08 + p*.04; tilt.position.y += Math.max(0, p)*.08; head.rotation.x = -.2;
  } else {
    if (t < 40) v.root.rotation.y = f.facing + (1 - t/40)*PI*4;
    armL.rotation.set(0, 0, 1.4); armR.rotation.set(-3, 0, -.2); legL.rotation.z = .3; legR.rotation.z = -.3; tilt.rotation.z = Math.sin(t*.12)*.12;
  }
  if (G.frame % 4 === 0) emit(new V(f.pos.x, f.pos.y + 2.6, f.pos.z), 2, WIN_CONFETTI[(G.frame >> 2) % WIN_CONFETTI.length], 3, 6, 50, 1.1, 5);
}

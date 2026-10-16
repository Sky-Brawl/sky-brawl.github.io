// Sky Brawl · replay.js — ไฮไลต์ย้อนหลังท้ายแมตช์ (สโลว์ตอน KO) + บันทึกเป็นคลิปวิดีโอเพื่อแชร์
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Highlight replay ----------
   While a match runs, every drawn frame stores a small snapshot of what is on screen (fighters, mechs, bullets,
   bombs) in a ring of RP_KEEP frames, plus the effects and sounds fired since the last frame (emit / flash /
   popup / banner / Sfx calls made outside render()). Nothing is recorded as video during play.
   Each KO is scored (my KO > me KO'd > the last KO > others) and the best one keeps the frames around it.
   On the result screen "ดูไฮไลต์" plays it back with a moving camera and slow motion at the KO, and
   "บันทึกคลิป" plays it again while drawing every frame onto a 1280×720 canvas recorded with MediaRecorder,
   then offers the file to share (Web Share) or save. Ticks are paused during playback and the world is put back. ---------- */
const RP_KEEP = 420, RP_BEFORE = 270, RP_AFTER = 60;
const Replay = {
  ring:[], n:0, ev:[], on:false, rec:null, best:null, pending:null, matchId:-1, inRender:false,
  // ---- recording ----
  reset(){ this.ring = []; this.n = 0; this.ev = []; this.best = null; this.pending = null; this.clip = null; this.file = null; },
  log(type, args){ if (!this.on && G.mode === 'play' && !G.tut && !this.inRender && this.ev.length < 400) this.ev.push([type, args]); },
  snap(){
    const r = v => Math.round(v*100)/100;
    return {
      f:G.fighters.map(f => [r(f.pos.x), r(f.pos.y), r(f.pos.z), r(f.facing), f.state, f.stateT, f.moveKey, Math.round(f.hp), f.stocks, f.invuln > 0 ? 1 : 0,
        f.held, f.weapon, f.formT, f.apeT, f.rage, f.chill, f.shock, f.squash, f.onGround ? 1 : 0, f.emo && f.emo.until > G.frame ? [f.emo.id, f.emo.until - G.frame] : null,
        f.mech ? f.mech.id : -1, f.stun]),
      m:G.mechs.map(m => [m.id, r(m.pos.x), r(m.pos.y), r(m.pos.z), r(m.facing), m.rider ? m.rider.idx : -1]),
      b:G.bullets.slice(0, 40).map(b => [b.kind || 'bullet', r(b.pos.x), r(b.pos.y), r(b.pos.z), r(b.mesh.rotation.y)]),
      bm:G.bombs.slice(0, 20).map(b => [b.kind, r(b.pos.x), r(b.pos.y), r(b.pos.z)]),
    };
  },
  record(){
    if (this.on || G.tut) return;
    if (G.mode !== 'play'){ this.ev = []; return; }
    if (this.matchId !== G.matchId){ this.matchId = G.matchId; this.reset(); }
    const s = this.snap(); s.ev = this.ev; this.ev = [];
    this.ring.push(s); this.n++;
    if (this.ring.length > RP_KEEP) this.ring.shift();
    if (this.pending && this.n >= this.pending.at + RP_AFTER) this.keep();
  },
  // Every KO (host, guest and offline all announce them)
  onKO(f, killer, why){
    if (G.tut || G.mode !== 'play' || this.on) return;
    const me = G.fighters.find(o => o.isLocal && (G.net === 'guest' || o.ctrl === 'p1')) || G.fighters.find(o => o.isLocal);
    const last = G.fighters.filter(o => o.stocks > 0).length <= 1;
    const score = (killer && killer === me ? 5 : f === me ? 3 : 1) + (killer && killer !== f ? 1 : 0) + (last ? 2 : 0);
    if (this.pending) this.keep();
    if (this.best && this.best.score > score) return;
    this.pending = {at:this.n, score, victim:f.idx, killer:killer && killer !== f ? killer.idx : -1, why};
  },
  keep(){
    const p = this.pending; this.pending = null; if (!p) return;
    if (this.best && this.best.score > p.score) return;
    const start = this.n - this.ring.length, from = Math.max(0, p.at - RP_BEFORE - start), to = Math.min(this.ring.length, p.at + RP_AFTER - start);
    if (to - from < 30) return;
    this.best = {...p, frames:this.ring.slice(from, to), ko:p.at - start - from};
  },
  has(){ if (this.pending) this.keep(); return !!this.best; },
  caption(){
    const b = this.best, v = G.fighters[b.victim], k = G.fighters[b.killer];
    const what = b.why === 'ring' ? STAGE.fallText : 'ถูก KO';
    return k ? k.name + ' ส่ง ' + (v ? v.name : '?') + ' ' + what + '!' : (v ? v.name : '?') + ' ' + what + '!';
  },
  // ---- playback ----
  apply(s){
    s.f.forEach((a, i) => {
      const f = G.fighters[i]; if (!f) return;
      f.pos.set(a[0], a[1], a[2]); f.facing = a[3]; f.state = a[4]; f.stateT = a[5]; f.moveKey = a[6] || ''; f.move = a[6] ? MOVES[a[6]] || null : null;
      f.hp = a[7]; f.stocks = a[8]; f.invuln = a[9] ? 10 : 0; f.held = a[10]; f.weapon = a[11]; f.formT = a[12]; f.apeT = a[13]; f.rage = a[14]; f.chill = a[15]; f.shock = a[16];
      f.squash = a[17]; f.onGround = !!a[18]; f.emo = a[19] ? {id:a[19][0], until:G.frame + a[19][1]} : null; f.mech = null; f.rpMech = a[20]; f.stun = a[21];
    });
  },
  pool:null,
  vis(kind, key, make){ const P = this.pool[kind]; const list = P[key] || (P[key] = []); if (P.used[key] === undefined) P.used[key] = 0; let o = list[P.used[key]]; if (!o){ o = make(); list.push(o); } P.used[key]++; return o; },
  drawExtras(s, T){
    const P = this.pool;
    for (const k of ['b', 'bm', 'm']) for (const key in P[k].used) P[k].used[key] = 0;
    // mechs: one model per mech id; the pilot (if any) drives the pose
    const riders = {};
    for (const a of s.m){
      const m = this.vis('m', a[0], () => { const v = buildMech(); scene.add(v.root); return {vis:v, pos:new V()}; });
      m.pos.set(a[1], a[2], a[3]); const rider = G.fighters[a[5]];
      m.vis.root.visible = true; m.vis.root.position.copy(m.pos); m.vis.root.rotation.y = rider ? rider.vis.root.rotation.y : a[4];
      poseMech(rider || null, m, m.vis, T);
      if (rider){ rider.vis.root.visible = false; riders[a[5]] = 1; }
    }
    for (const a of s.b){ const b = this.vis('b', a[0], () => makeBullet(-1, a[0])); b.mesh.visible = true; b.mesh.position.set(a[1], a[2], a[3]); b.mesh.rotation.y = a[4]; }
    for (const a of s.bm){ const b = this.vis('bm', a[0], () => makeBomb(-1, a[0])); b.mesh.visible = true; b.mesh.position.set(a[1], a[2], a[3]); b.mesh.rotation.x += .25; }
    for (const k of ['b', 'bm', 'm']) for (const key in P[k]) if (key !== 'used') P[k][key].forEach((o, i) => { if (i >= (P[k].used[key] || 0)) (o.mesh || o.vis.root).visible = false; });
    return riders;
  },
  fire(evs){
    for (const [t, a] of evs){
      if (t === 'emit') emit.raw(...a); else if (t === 'flash') flash.raw(...a); else if (t === 'popup') popup.raw(...a); else if (t === 'banner') banner.raw(...a);
      else if (t === 'sfx') Sfx.play.raw(...a); else if (t === 'move') Sfx.move.raw(...a); else if (t === 'proj') Sfx.proj.raw(...a);
    }
  },
  targets(){
    const b = this.best, out = [G.fighters[b.victim], G.fighters[b.killer]].filter(f => f && alive(f) && f.pos.y > -3);
    return out.length ? out : [G.fighters[b.victim] || G.fighters[0]];
  },
  play(record){
    if (this.on || !this.has()) return;
    const b = this.best;
    this.on = true; this.i = 0; this.done = -1; this.rec = record ? this.startRec() : null;
    this.saved = {now:this.snap(), zoom:G.camZoom, yaw:G.camYaw, yawT:G.camYawT, mechs:G.mechs.map(m => m.vis.root.visible)};
    for (const m of G.mechs) m.vis.root.visible = false;
    for (const x of [...G.bullets, ...G.bombs]) x.mesh.visible = false;
    this.pool = {b:{used:{}}, bm:{used:{}}, m:{used:{}}};
    G.camZoom = 1; G.camYaw = G.camYawT = -.3;
    $('result').hidden = true; $('hud').hidden = true; $('touch').hidden = true;
    $('rpUi').hidden = false; $('rpCap').textContent = this.caption(); $('rpRec').hidden = !record;
    document.body.classList.add('replaying');
    if (this.rec) this.rec.r.start(200);
  },
  // Called by the main loop instead of render() while a replay runs
  frame(){
    const b = this.best, F = b.frames, L = F.length;
    const slow = this.i >= b.ko - 55 && this.i <= b.ko + 18;
    const idx = Math.min(L - 1, Math.floor(this.i));
    for (let k = this.done + 1; k <= idx; k++) this.fire(F[k].ev);
    this.done = Math.max(this.done, idx);
    this.apply(F[idx]);
    G.camYawT = -.3 + .6*(this.i/L); G.camYaw += (G.camYawT - G.camYaw)*.1;
    this.inRender = true;
    render();
    this.drawExtras(F[idx], G.frame);
    renderer.render(scene, camera);
    this.inRender = false;
    if (this.rec) this.paint(slow, idx >= b.ko && idx < b.ko + 40);
    this.i += slow ? .35 : 1;
    if (this.i >= L) this.stop();
  },
  stop(){
    if (!this.on) return;
    this.on = false;
    this.apply(this.saved.now);
    for (const f of G.fighters){ f.rpMech = -1; f.emo = null; }
    G.mechs.forEach((m, i) => { m.vis.root.visible = this.saved.mechs[i] !== false; if (m.rider) m.rider.mech = m; });
    for (const x of [...G.bullets, ...G.bombs]) x.mesh.visible = true;
    for (const k of ['b', 'bm', 'm']) for (const key in this.pool[k]) if (key !== 'used') for (const o of this.pool[k][key]){
      if (o.mesh){ scene.remove(o.mesh); if (o.mesh.geometry !== BULLET_GEO && o.mesh.geometry) o.mesh.geometry.dispose(); } else scene.remove(o.vis.root);
    }
    this.pool = null;
    G.camZoom = this.saved.zoom; G.camYaw = this.saved.yaw; G.camYawT = this.saved.yawT;
    $('rpUi').hidden = true; document.body.classList.remove('replaying');
    $('result').hidden = false;
    if (this.rec){ const r = this.rec; this.rec = null; if (r.r.state !== 'inactive') r.r.stop(); }
  },
  // ---- video ----
  startRec(){
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream){ toast('เบราว์เซอร์นี้บันทึกวิดีโอไม่ได้ ลองใช้ Chrome หรือ Edge'); return null; }
    const c = document.createElement('canvas'); c.width = 1280; c.height = 720;
    const types = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const type = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
    let r;
    try { r = new MediaRecorder(c.captureStream(30), type ? {mimeType:type, videoBitsPerSecond:5e6} : {videoBitsPerSecond:5e6}); } catch (e) { toast('เริ่มบันทึกวิดีโอไม่ได้'); return null; }
    const parts = [];
    r.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };
    r.onstop = () => {
      const mime = (r.mimeType || type || 'video/webm').split(';')[0], ext = mime.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(parts, {type:mime});
      this.file = new File([blob], 'sky-brawl-highlight-' + new Date().toISOString().slice(0, 10) + '.' + ext, {type:mime});
      renderReplayBtns(); toast('🎬 บันทึกคลิปเสร็จแล้ว กดแชร์หรือบันทึกไฟล์ได้เลย');
    };
    return {r, c, ctx:c.getContext('2d')};
  },
  paint(slow, ko){
    const {c, ctx} = this.rec, W = c.width, H = c.height, src = renderer.domElement;
    const s = Math.max(W/src.width, H/src.height), w = src.width*s, h = src.height*s;
    ctx.drawImage(src, (W - w)/2, (H - h)/2, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillRect(0, 0, W, 54); ctx.fillRect(0, H - 64, W, 64);
    ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.font = '700 30px Silkscreen, monospace'; ctx.fillStyle = '#d6d6d6'; ctx.fillText('SKY', 24, 28); ctx.fillStyle = '#7ccf3f'; ctx.fillText('BRAWL', 24 + ctx.measureText('SKY ').width, 28);
    ctx.font = '700 26px Kanit, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#ffc23a'; ctx.fillText(slow ? '🎬 SLOW-MO' : '🎬 HIGHLIGHT', W - 24, 28);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(this.caption(), 24, H - 32);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ffc23a'; ctx.font = '700 22px Kanit, sans-serif'; ctx.fillText('sky-brawl.github.io', W - 24, H - 32);
    if (ko){ ctx.textAlign = 'center'; ctx.font = '700 120px Kanit, sans-serif'; ctx.lineWidth = 16; ctx.strokeStyle = '#14213a'; ctx.strokeText('K.O.!', W/2, H/2); ctx.fillStyle = '#ff5d4a'; ctx.fillText('K.O.!', W/2, H/2); }
    ctx.textAlign = 'left';
  },
  async share(){
    const f = this.file; if (!f) return;
    try { await navigator.share({files:[f], title:'Sky Brawl', text:this.caption() + ' 🎮 sky-brawl.github.io'}); }
    catch (e) { if (e && e.name !== 'AbortError') this.save(); }
  },
  save(){
    const f = this.file; if (!f) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  },
};
// Effects and sounds made by the game (not by drawing) are logged for the replay
for (const [name, type] of [['emit', 'emit'], ['flash', 'flash'], ['popup', 'popup'], ['banner', 'banner']]){
  const raw = window[name];
  const w = function(...a){ Replay.log(type, a.map(x => x && x.isVector3 ? x.clone() : x)); return raw.apply(this, a); };
  w.raw = raw; window[name] = w;
}
for (const [k, type] of [['play', 'sfx'], ['move', 'move'], ['proj', 'proj']]){
  const raw = Sfx[k];
  const w = (...a) => { Replay.log(type, a.map(x => x && x.isVector3 ? x.clone() : x)); return raw(...a); };
  w.raw = raw; Sfx[k] = w;
}
function renderReplayBtns(){
  const ok = !G.tut && Replay.has();
  $('hlBtns').hidden = !ok;
  if (!ok) return;
  const canShare = !!(Replay.file && navigator.canShare && (() => { try { return navigator.canShare({files:[Replay.file]}); } catch (e) { return false; } })());
  $('hlShare').hidden = !canShare; $('hlSave').hidden = !Replay.file;
  $('hlRec').textContent = Replay.file ? '🎥 บันทึกใหม่' : '🎥 บันทึกคลิป';
}
// render() marks itself so the effects it makes while drawing are not logged twice
{ const raw = render; window.render = function(){ Replay.inRender = true; try { raw(); } finally { Replay.inRender = false; } }; }
$('hlPlay').onclick = () => Replay.play(false);
$('hlRec').onclick = () => Replay.play(true);
$('hlShare').onclick = () => Replay.share();
$('hlSave').onclick = () => Replay.save();
$('rpSkip').onclick = () => Replay.stop();

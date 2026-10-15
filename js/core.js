// Sky Brawl · core.js — ค่าพื้นฐาน ตัวช่วยเล็กๆ และระบบเสียง (สังเคราะห์ด้วย Web Audio ไม่มีไฟล์เสียง)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
const V = THREE.Vector3, PI = Math.PI;
const DT = 1/60, GRAV = 40, INK = 0x14213a;
// Fighter basics; config.js → fighter can change them (applyConfig)
let MAX_HP = 100, WALK = 6.4, JUMP = 12.5, RICE_HEAL = 30;
let SPRINT = 1.6, SPRINT_SECS = 3;   // speed multiplier, and how long a full stamina bar lasts (config.js → fighter)
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_TOUCH = matchMedia('(pointer:coarse)').matches || (navigator.maxTouchPoints || 0) > 0;
const $ = id => document.getElementById(id);
let touchPref = null;
try { touchPref = localStorage.getItem('skybrawl.touch'); } catch (e) {}
const touchOn = () => touchPref ? touchPref === 'on' : IS_TOUCH;
const L = (a,b,t) => a + (b-a)*t;
const hex = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
const cleanName = (s, fb) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, '').trim().slice(0, 12) || fb;

/* ---------- Sound: every effect and the music are synthesized with Web Audio, so there are no audio files to download ---------- */
const SND = {vol:.8, music:true, effects:true};   // config.js → sound can change these
(function(){
  const C = window.SKY_CONFIG && window.SKY_CONFIG.sound;
  if (!C || typeof C !== 'object') return;
  const warn = m => console.warn('[config.js] ' + m);
  if (C.volume !== undefined){ const v = Number(C.volume); if (Number.isFinite(v) && v >= 0 && v <= 1) SND.vol = v; else warn('sound.volume = ' + C.volume + ' ใช้ไม่ได้ (ต้องเป็นตัวเลข 0–1) ใช้ค่าเดิมแทน'); }
  for (const k of ['music', 'effects']) if (C[k] !== undefined){ if (typeof C[k] === 'boolean') SND[k] = C[k]; else warn('sound.' + k + ' = ' + C[k] + ' ใช้ไม่ได้ (ต้องเป็น true หรือ false) ใช้ค่าเดิมแทน'); }
})();
const mtof = n => 440*Math.pow(2, (n - 69)/12);
// A small synth bound to one AudioContext (the live one, or an offline one when testing)
function makeKit(ctx){
  const len = ctx.sampleRate | 0, nb = ctx.createBuffer(1, len, ctx.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random()*2 - 1;
  return {
    ctx,
    // pitch-sliding oscillator: quick attack, exponential decay
    T(t, f0, f1, dur, vol, type, out, att){
      const o = ctx.createOscillator(), g = ctx.createGain(), a = att || .006;
      o.type = type || 'sine'; o.frequency.setValueAtTime(Math.max(20, f0), t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .03);
    },
    // filtered noise burst with the cutoff gliding f0 → f1
    N(t, dur, vol, type, f0, f1, out, q){
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = nb; f.type = type; f.Q.value = q || .8;
      f.frequency.setValueAtTime(Math.max(30, f0), t); if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()*.4); s.stop(t + dur + .03);
    },
  };
}
// gap = minimum ms between two plays, v = loudness, dur = seconds it rings, prio = ignore the voice limit, ui = plays outside a match
const SFX_R = {
  punch:   {gap:40, v:.7, dur:.14, f(k, t, o){ k.N(t, .07, .9, 'lowpass', 1800, 300, o); k.T(t, 170, 70, .1, .8, 'sine', o); }},
  hit:     {gap:40, v:.9, dur:.18, f(k, t, o){ k.N(t, .09, 1, 'lowpass', 2600, 350, o); k.T(t, 210, 60, .14, 1, 'sine', o); k.T(t, 900, 300, .04, .25, 'square', o); }},
  smash:   {gap:60, v:1, dur:.5, prio:1, f(k, t, o){ k.N(t, .26, 1, 'lowpass', 3200, 200, o); k.T(t, 140, 35, .38, 1.1, 'sine', o); k.T(t, 1200, 200, .08, .3, 'sawtooth', o); }},
  guard:   {gap:50, v:.7, dur:.25, f(k, t, o){ k.T(t, 1500, 1500, .2, .3, 'square', o); k.T(t, 2300, 2300, .13, .18, 'square', o); k.N(t, .04, .5, 'highpass', 3000, 3000, o); }},
  gbreak:  {gap:80, v:1, dur:.55, prio:1, f(k, t, o){ k.N(t, .35, 1, 'highpass', 2500, 800, o); k.T(t, 600, 90, .35, .6, 'sawtooth', o); }},
  swing:   {gap:45, v:.5, dur:.2, f(k, t, o){ k.N(t, .14, 1.9, 'bandpass', 500, 2200, o, 1.2); }},
  swingBig:{gap:60, v:.6, dur:.3, f(k, t, o){ k.N(t, .24, 1.7, 'bandpass', 280, 1500, o, 1); k.T(t, 160, 70, .2, .4, 'triangle', o); }},
  jump:    {gap:80, v:.4, dur:.16, f(k, t, o){ k.T(t, 260, 560, .13, .6, 'sine', o); }},
  land:    {gap:90, v:.45, dur:.14, f(k, t, o){ k.N(t, .08, .8, 'lowpass', 500, 120, o); k.T(t, 90, 45, .1, .8, 'sine', o); }},
  shot:    {gap:30, v:.55, dur:.22, f(k, t, o){ k.N(t, .12, 1, 'highpass', 1800, 500, o); k.T(t, 900, 120, .1, .7, 'square', o); }},
  shotgun: {gap:70, v:1, dur:.4, prio:1, f(k, t, o){ k.N(t, .22, 1.1, 'lowpass', 4000, 300, o); k.T(t, 150, 40, .25, 1, 'sine', o); }},
  arrow:   {gap:35, v:.5, dur:.2, f(k, t, o){ k.T(t, 700, 260, .14, .5, 'triangle', o); k.N(t, .06, .4, 'bandpass', 2500, 1000, o); }},
  magic:   {gap:50, v:.55, dur:.5, f(k, t, o){ [660, 880, 1320].forEach((fr, i) => k.T(t + i*.06, fr, fr*1.01, .22, .3, 'triangle', o)); }},
  fire:    {gap:60, v:.7, dur:.42, f(k, t, o){ k.N(t, .35, .9, 'bandpass', 300, 1400, o); k.T(t, 200, 80, .3, .5, 'sawtooth', o); }},
  beam:    {gap:90, v:.65, dur:.5, f(k, t, o){ k.T(t, 1400, 300, .42, .4, 'sawtooth', o); k.T(t, 700, 150, .42, .3, 'square', o); }},
  boom:    {gap:60, v:1, dur:.9, prio:1, f(k, t, o){ k.N(t, .7, 1.2, 'lowpass', 2200, 80, o); k.T(t, 100, 28, .6, 1.2, 'sine', o); }},
  splash:  {gap:90, v:.8, dur:.55, f(k, t, o){ k.N(t, .4, 1, 'bandpass', 900, 250, o, .8); [0, .08, .15].forEach((d, i) => k.T(t + d, 500 + i*180, 900 + i*250, .08, .15, 'sine', o)); }},
  stomp:   {gap:100, v:1, dur:.7, prio:1, f(k, t, o){ k.T(t, 80, 24, .6, 1.4, 'sine', o); k.N(t, .35, .9, 'lowpass', 900, 90, o); }},
  pickup:  {gap:50, v:.7, dur:.25, f(k, t, o){ k.T(t, 660, 660, .08, .35, 'square', o); k.T(t + .07, 990, 990, .12, .35, 'square', o); }},
  heal:    {gap:80, v:.6, dur:.5, f(k, t, o){ [523, 659, 784].forEach((fr, i) => k.T(t + i*.07, fr, fr, .3, .28, 'sine', o)); }},
  ko:      {gap:60, v:1, dur:.7, prio:1, f(k, t, o){ k.T(t, 520, 70, .5, .6, 'sawtooth', o); k.N(t, .2, .9, 'lowpass', 2800, 300, o); k.T(t, 150, 40, .4, 1, 'sine', o); }},
  freeze:  {gap:90, v:.6, dur:.4, f(k, t, o){ k.T(t, 2400, 3300, .3, .25, 'sine', o); k.T(t + .04, 3100, 2000, .25, .18, 'sine', o); k.N(t, .12, .4, 'highpass', 5000, 5000, o); }},
  zap:     {gap:90, v:.55, dur:.3, f(k, t, o){ k.T(t, 1900, 180, .22, .35, 'square', o); k.N(t, .15, .5, 'highpass', 3500, 1500, o); }},
  skill:   {gap:80, v:.7, dur:.5, f(k, t, o){ k.T(t, 320, 1300, .3, .35, 'sawtooth', o); k.T(t + .05, 640, 2600, .28, .18, 'triangle', o); k.N(t, .22, .35, 'bandpass', 800, 3000, o, 1.4); }},
  howl:    {gap:200, v:.9, dur:1.1, prio:1, f(k, t, o){ k.T(t, 300, 640, .3, .5, 'sawtooth', o, .05); k.T(t + .3, 640, 340, .7, .5, 'sawtooth', o, .02); k.T(t, 600, 1280, .3, .18, 'triangle', o, .05); k.N(t, .5, .25, 'bandpass', 900, 500, o, 1.5); }},
  roar:    {gap:200, v:1, dur:1, prio:1, f(k, t, o){ k.T(t, 120, 55, .8, .8, 'sawtooth', o, .03); k.T(t, 240, 80, .6, .4, 'square', o, .03); k.N(t, .7, 1, 'lowpass', 1400, 180, o); }},
  skull:   {gap:200, v:.9, dur:1, prio:1, f(k, t, o){ k.T(t, 95, 42, .7, .8, 'sawtooth', o, .04); k.N(t, .6, .7, 'lowpass', 900, 120, o); [0, .07, .13, .2, .26].forEach(d => k.T(t + .15 + d, 1100 - d*1400, 700, .04, .22, 'square', o)); }},
  spirit:  {gap:200, v:.8, dur:1, prio:1, f(k, t, o){ k.T(t, 520, 260, .8, .35, 'triangle', o, .08); k.T(t, 527, 263, .8, .3, 'triangle', o, .08); k.T(t + .1, 1040, 700, .6, .12, 'sine', o, .05); k.N(t, .7, .3, 'bandpass', 1500, 500, o, 2); }},
  lance:   {gap:150, v:.7, dur:.4, f(k, t, o){ k.N(t, .3, 1.4, 'bandpass', 900, 3000, o, 1.3); k.T(t, 600, 1400, .25, .25, 'sawtooth', o); }},
  skyslash:{gap:120, v:.9, dur:.5, prio:1, f(k, t, o){ k.N(t, .4, 1.6, 'bandpass', 4200, 700, o, 2); k.T(t, 1900, 420, .35, .35, 'sawtooth', o); k.T(t + .02, 3800, 900, .2, .15, 'sine', o); }},
  claw:    {gap:60, v:.65, dur:.25, f(k, t, o){ k.N(t, .14, 1.5, 'bandpass', 1200, 4200, o, 1.4); k.T(t, 900, 280, .1, .3, 'sawtooth', o); }},
  flame:   {gap:110, v:.7, dur:.3, f(k, t, o){ k.N(t, .26, 1, 'bandpass', 500, 1700, o, .9); k.T(t, 180, 90, .2, .3, 'sawtooth', o); }},
  click:   {ui:1, gap:30, v:.5, dur:.06, f(k, t, o){ k.T(t, 900, 700, .045, .4, 'square', o); }},
  beep:    {ui:1, gap:100, prio:1, v:.6, dur:.22, f(k, t, o){ k.T(t, 440, 440, .18, .45, 'square', o); }},
  go:      {ui:1, gap:100, prio:1, v:.7, dur:.5, f(k, t, o){ k.T(t, 880, 880, .12, .45, 'square', o); k.T(t + .1, 1320, 1320, .35, .45, 'square', o); }},
  win:     {ui:1, gap:500, prio:1, v:.8, dur:1.2, f(k, t, o){ [523, 659, 784, 1047].forEach((fr, i) => k.T(t + i*.13, fr, fr, .3, .4, 'triangle', o)); k.T(t + .52, 1047, 1047, .6, .35, 'sine', o); }},
  lose:    {ui:1, gap:500, prio:1, v:.7, dur:1.1, f(k, t, o){ [392, 349, 311, 262].forEach((fr, i) => k.T(t + i*.18, fr, fr*.99, .35, .4, 'triangle', o)); }},
  level:   {ui:1, gap:500, prio:1, v:.8, dur:1.3, f(k, t, o){ [523, 659, 784, 1047, 1319].forEach((fr, i) => k.T(t + i*.09, fr, fr, .28, .4, 'square', o)); k.T(t + .45, 1319, 1319, .7, .3, 'triangle', o); }},
};
const PROJ_SND = {bullet:'shot', arrow:'arrow', falcon:'arrow', fireball:'fire', potion:'fire', beam:'beam', mega:'beam', saber:'beam', thunder:'beam', spark:'beam', ice:'freeze', snow:'swing', dark:'fire', darkbig:'fire'};
// Music: two loops, four bars each. Chords are [root MIDI note, minor/major]
const MUS_TRK = {
  battle:{bpm:140, chords:[[45, 'm'], [41, 'M'], [48, 'M'], [43, 'M']], drums:true},
  menu:{bpm:82, chords:[[48, 'M'], [45, 'm'], [41, 'M'], [43, 'M']], drums:false},
};
const MUS_TRIAD = {m:[0, 3, 7, 12], M:[0, 4, 7, 12]}, MUS_ARP = [0, 1, 2, 3, 2, 1, 2, 1];
function musicStep(k, trk, st, t, out){
  const spb = 60/trk.bpm/4, s = st & 15, [root, q] = trk.chords[(st >> 4) & 3], tones = MUS_TRIAD[q];
  if (trk.drums){
    if (s === 0 || s === 8 || s === 10) k.T(t, 150, 45, .16, .9, 'sine', out);
    if (s === 4 || s === 12){ k.N(t, .13, .5, 'highpass', 1800, 1200, out); k.T(t, 220, 120, .08, .25, 'triangle', out); }
    if (s % 2 === 0){
      k.N(t, s === 14 ? .12 : .035, s === 14 ? .22 : .16, 'highpass', 7000, 7000, out);
      k.T(t, mtof(root + (s === 6 ? 12 : s === 14 ? 7 : 0)), 0, spb*1.8, .3, 'triangle', out);
    }
    k.T(t, mtof(root + 12 + tones[MUS_ARP[s & 7]]), 0, spb*.9, .07, 'square', out);
  } else {
    if (s === 0) for (const n of tones.slice(0, 3)) k.T(t, mtof(root + 12 + n), 0, spb*15, .16, 'triangle', out, .5);
    if (s % 4 === 0) k.T(t, mtof(root + 24 + tones[MUS_ARP[((s >> 2)*2) % 8]]), 0, spb*5, .22, 'sine', out, .02);
  }
}
const Sfx = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const LABEL = {all:'เสียง: เปิด', sfx:'เสียง: เอฟเฟกต์', off:'เสียง: ปิด'};
  let ctx = null, kit = null, master = null, sfxBus = null, musBus = null, voices = 0, track = null, step = 0, nextT = 0, lastF = -1, unlocked = false;
  const last = {}, L = {x:0, z:0}, sv = new THREE.Vector3();
  let mode = SND.effects ? (SND.music ? 'all' : 'sfx') : 'off';
  try { const m = localStorage.getItem('skybrawl.sound'); if (m === 'all' || m === 'sfx' || m === 'off') mode = m; } catch (e) {}

  function build(){
    if (ctx || !AC) return !!ctx;
    try {
      const c = new AC({latencyHint:'interactive'});
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = .004; comp.release.value = .18;
      master = c.createGain(); master.gain.value = SND.vol*.9;
      sfxBus = c.createGain(); musBus = c.createGain(); musBus.gain.value = 0;
      sfxBus.connect(comp); musBus.connect(comp); comp.connect(master); master.connect(c.destination);
      kit = makeKit(c); ctx = c;
    } catch (e) { ctx = null; }
    return !!ctx;
  }
  // Browsers only allow sound after a tap or key press, so the first one wakes the engine
  function unlock(){
    if (!build()) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (!unlocked){
      unlocked = true;
      try { const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, 22050); s.connect(ctx.destination); s.start(0); } catch (e) {}   // iOS wants a blip inside the gesture
    }
  }
  const ready = () => !!ctx && ctx.state === 'running' && mode !== 'off';
  function listener(){
    if (lastF !== G.frame){
      lastF = G.frame;
      const me = G.fighters.find(f => f.isLocal && alive(f));
      if (me){ L.x = me.pos.x; L.z = me.pos.z; } else { L.x = camLook.x; L.z = camLook.z; }
    }
    return L;
  }
  // pos = where it happens: quieter with distance from you, panned by where it is on screen
  function play(name, pos, vol){
    if (!ready()) return;
    const r = SFX_R[name]; if (!r) return;
    if (G.mode !== 'play' && !r.ui) return;
    const now = performance.now(); if (now - (last[name] || 0) < r.gap) return;
    let v = (vol === undefined ? 1 : vol)*r.v, pan = 0;
    if (pos){
      const l = listener(), d = Math.hypot(pos.x - l.x, pos.z - l.z), k = Math.max(0, 1 - d/34);
      v *= k*k;
      if (v < .05) return;
      sv.set(pos.x, pos.y || 0, pos.z).project(camera);
      pan = sv.z < 1 ? Math.max(-.8, Math.min(.8, sv.x*.8)) : 0;
    }
    if (voices >= 26 && !r.prio) return;
    last[name] = now; voices++; setTimeout(() => { voices--; }, (r.dur + .05)*1000);
    const out = ctx.createGain(); out.gain.value = v;
    if (ctx.createStereoPanner){ const p = ctx.createStereoPanner(); p.pan.value = pan; out.connect(p); p.connect(sfxBus); } else out.connect(sfxBus);
    r.f(kit, ctx.currentTime + .005, out);
  }
  function sched(){
    if (!ctx || ctx.state !== 'running' || !track) return;
    const trk = MUS_TRK[track], spb = 60/trk.bpm/4;
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + .05;
    while (nextT < ctx.currentTime + .25){ musicStep(kit, trk, step, nextT, musBus); step++; nextT += spb; }
  }
  // Every 0.4 s: pick the loop that suits the screen, and turn it down while the game is paused
  function steer(){
    if (!ctx) return;
    let want = null, lvl = .24;
    if (mode === 'all' && !document.hidden){
      if (G.mode === 'play'){ if ($('result').hidden && !G.endT) want = 'battle'; if (G.paused || !$('pause').hidden) lvl = .09; }
      else if (G.mode === 'menu' || G.mode === 'custom') want = 'menu';
    }
    if (want !== track){ track = want; step = 0; nextT = 0; }
    musBus.gain.setTargetAtTime(want ? lvl : 0, ctx.currentTime, .25);
  }
  function labels(){ for (const id of ['soundBtn', 'soundBtnMenu']){ const b = document.getElementById(id); if (b) b.textContent = LABEL[mode]; } }
  function setMode(m){
    mode = m; try { localStorage.setItem('skybrawl.sound', m); } catch (e) {}
    labels(); unlock(); steer(); if (m !== 'off') play('click');
  }
  const cycle = () => setMode(mode === 'all' ? 'sfx' : mode === 'sfx' ? 'off' : 'all');

  for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, unlock, {capture:true, passive:true});
  // A tap on any button or label clicks, except the on-screen game controls
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target.closest('button, a.btn, label') : null;
    if (!t || t.closest('#touch') || t.id === 'soundBtn' || t.id === 'soundBtnMenu') return;
    play('click');
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {}); else if (mode !== 'off') ctx.resume().catch(() => {});
  });
  setInterval(sched, 60); setInterval(steer, 400);
  for (const id of ['soundBtn', 'soundBtnMenu']){ const b = document.getElementById(id); if (b) b.addEventListener('click', cycle); }
  labels();

  return {
    play, cycle, setMode, labels, get mode(){ return mode; }, get state(){ return ctx ? ctx.state : (AC ? 'idle' : 'unsupported'); },
    // The swing sound of a move: skills whoosh up, heavy weapons and slams whoosh low, shots wait for the bullet
    move(f, m){
      if (!m) return;
      if (m.snd){ play(m.snd, f.pos); return; }
      if (m.skill){ play('skill', f.pos); return; }
      if (m.gun || (m.noHit && (m.anim === 'shoot' || m.anim === 'cast'))) return;
      play(m.anim === 'slam' || m.anim === 'uppercut' || m.anim === 'iai' || m.weapon ? 'swingBig' : 'swing', f.pos);
    },
    proj(kind, pos){ play(PROJ_SND[kind] || 'magic', pos); },
    banner(text){
      if (text === '3' || text === '2' || text === '1') play('beep');
      else if (text === 'FIGHT!') play('go');
      else if (text === 'LEVEL UP!') play('level');
      else if (text === 'ยักษ์หิมะคลั่ง!') play('stomp');
    },
    result(rows){
      const me = G.fighters.find(f => f.isLocal);
      let win = false;
      if (G.raid) win = !!G.raidWin;
      else if (G.teamMode && G.winTeam !== null && G.winTeam !== undefined) win = !!me && me.side === G.winTeam;
      else win = !!me && !!rows && rows.some(r => r.f === me && r.place === 1);
      play(win ? 'win' : 'lose');
    },
  };
})();

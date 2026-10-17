// Sky Brawl · input.js — ปุ่มคีย์บอร์ด
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Input ---------- */
const keys = new Set();
const MAP1 = {up:['KeyW'], down:['KeyS'], left:['KeyA'], right:['KeyD'], atk:['KeyF'], jump:['KeyG','Space'], guard:['KeyH'], grab:['KeyR'], skill:['KeyE'], lock:['KeyQ'], sprint:['ShiftLeft','ShiftRight']};
const MAP2 = {up:['ArrowUp'], down:['ArrowDown'], left:['ArrowLeft'], right:['ArrowRight'], sprint:['KeyN','Numpad7'], atk:['Comma','Numpad1'], jump:['Period','Numpad2'], guard:['Slash','Numpad3'], grab:['KeyM','Numpad0'], skill:['Semicolon','Numpad4'], lock:['Quote','Numpad6']};
const MAPALT = {up:['ArrowUp'], down:['ArrowDown'], left:['ArrowLeft'], right:['ArrowRight'], atk:['KeyJ'], jump:['KeyK'], guard:['KeyL'], grab:['KeyU'], skill:['KeyI'], lock:['KeyO'], sprint:['ShiftLeft','ShiftRight']};
const GAME_KEYS = new Set([...Object.values(MAP1), ...Object.values(MAP2), ...Object.values(MAPALT)].flat());
addEventListener('keydown', e => {
  if (e.code === 'Escape' && G.mode === 'custom'){ closeCustom(); return; }
  if (e.code === 'Escape' && !$('daily').hidden){ $('dailyClose').click(); return; }
  if (e.code === 'Escape' && !$('quests').hidden){ $('questClose').click(); return; }
  if (e.code === 'Escape' && !$('shop').hidden){ $('shopClose').click(); return; }
  if (e.code === 'Escape' && Replay.on){ Replay.stop(); return; }
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
  if (e.code === 'Escape' && G.mode === 'play' && $('result').hidden){ togglePause(); return; }
  if (e.code === 'KeyX' && !e.repeat) toggleDebug();
  if (e.code === 'KeyT' && !e.repeat) toggleAuto('p1');
  if ((e.code === 'KeyP' || e.code === 'Numpad5') && !e.repeat) toggleAuto('p2');
  if (G.mode === 'play' && (e.code === 'Minus' || e.code === 'NumpadSubtract')) camStep(1);
  if (G.mode === 'play' && (e.code === 'Equal' || e.code === 'NumpadAdd')) camStep(-1);
  if (G.mode === 'play' && (e.code === 'KeyZ' || e.code === 'KeyC')){ e.preventDefault(); keys.add(e.code); }
  if (G.mode === 'play' && e.code === 'KeyV' && !e.repeat) camYawReset();
  if (G.mode === 'play' && (e.code === 'Enter' || e.code === 'NumpadEnter') && !e.repeat && $('result').hidden){ e.preventDefault(); openChat(); return; }
  if (G.mode === 'play' && /^Digit[1-8]$/.test(e.code) && !e.repeat){ emoteLocal(Number(e.code.slice(5)) - 1); return; }
  if (G.mode === 'play' && GAME_KEYS.has(e.code)){ e.preventDefault(); keys.add(e.code); }
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
const touch = {x:0, z:0, sprint:false, atk:false, jump:false, guard:false, grab:false, atkL:false, jumpL:false, grabL:false, skill:false, skillL:false, lock:false, lockL:false};
function readRaw(maps, withTouch){
  const k = arr => arr.some(c => keys.has(c));
  let x = 0, z = 0, atk = false, jump = false, guard = false, grab = false, skill = false, lock = false, sprint = false;
  if (!G.paused || G.net){
    for (const m of maps){
      if (k(m.left)) x -= 1; if (k(m.right)) x += 1; if (k(m.up)) z -= 1; if (k(m.down)) z += 1;
      atk ||= k(m.atk); jump ||= k(m.jump); guard ||= k(m.guard); grab ||= k(m.grab); skill ||= k(m.skill); lock ||= k(m.lock); sprint ||= !!m.sprint && k(m.sprint);
    }
    if (withTouch){
      // Latches keep a tap that starts and ends between two frames from being lost
      x += touch.x; z += touch.z; guard ||= touch.guard; sprint ||= touch.sprint;
      atk ||= touch.atk || touch.atkL; jump ||= touch.jump || touch.jumpL; grab ||= touch.grab || touch.grabL; skill ||= touch.skill || touch.skillL; lock ||= touch.lock || touch.lockL;
      touch.atkL = touch.jumpL = touch.grabL = touch.skillL = touch.lockL = false;
    }
  }
  x = Math.max(-1, Math.min(1, x)); z = Math.max(-1, Math.min(1, z));
  const m = Math.hypot(x, z); if (m > 1){ x /= m; z /= m; }
  // the camera may be turned: "up" always means away from the camera
  if (G.camYaw && G.mode === 'play' && (x || z)){ const c = Math.cos(G.camYaw), s = Math.sin(G.camYaw), x0 = x; x = x0*c + z*s; z = -x0*s + z*c; }
  return {x, z, atk, jump, guard, grab, skill, lock, sprint};
}
function readHuman(f){
  const two = G.fighters.some(o => o.ctrl === 'p2');
  const maps = f.ctrl === 'p2' ? [MAP2] : two ? [MAP1] : [MAP1, MAPALT];
  Object.assign(f.input, readRaw(maps, f.ctrl === 'p1'));
}

// Sky Brawl · touch.js — ปุ่มบนจอมือถือ
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
// Touch controls: a floating stick anywhere on the left half, buttons on the right; multi-touch friendly
let homeJoy = () => {};
function syncTouch(){
  const locals = G.fighters.filter(f => f.isLocal).length;
  const show = G.mode === 'play' && touchOn() && locals === 1;
  $('touch').hidden = !show;
  $('touchBtn').textContent = 'ปุ่มจอ: ' + (touchOn() ? 'เปิด' : 'ปิด');
  $('touchBtn').hidden = locals !== 1;
  if (show) requestAnimationFrame(() => homeJoy());
}
{
  const zone = $('joyZone'), joy = $('joy'), knob = $('knob'); let id = null, cx = 95, cy = 0;
  const place = () => { joy.style.left = cx + 'px'; joy.style.top = cy + 'px'; };
  homeJoy = () => { const r = zone.getBoundingClientRect(); cx = Math.min(95, r.width/2); cy = Math.max(70, r.height - 95); place(); };
  const move = e => {
    const r = zone.getBoundingClientRect();
    let dx = e.clientX - r.left - cx, dy = e.clientY - r.top - cy;
    const d = Math.hypot(dx, dy), max = 50; if (d > max){ dx *= max/d; dy *= max/d; }
    const dead = d < 8 ? 0 : 1;
    touch.x = dx/max*dead; touch.z = dy/max*dead; knob.style.transform = `translate(${dx}px,${dy}px)`;
  };
  const end = e => {
    if (e.pointerId !== id) return;
    id = null; touch.x = touch.z = 0; knob.style.transform = ''; joy.classList.remove('act'); homeJoy();
  };
  zone.addEventListener('pointerdown', e => {
    if (id !== null) return;
    id = e.pointerId; zone.setPointerCapture(id);
    const r = zone.getBoundingClientRect(); cx = e.clientX - r.left; cy = e.clientY - r.top; place();
    joy.classList.add('act'); move(e); e.preventDefault();
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  zone.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('resize', () => { if (id === null) homeJoy(); });
  for (const b of document.querySelectorAll('#tbtns button')){
    const k = b.dataset.k;
    const on = e => {
      touch[k] = true; if (k !== 'guard' && k !== 'sprint') touch[k + 'L'] = true;
      b.classList.add('on'); b.setPointerCapture(e.pointerId); e.preventDefault();
      if (navigator.vibrate && k === 'atk') try { navigator.vibrate(8); } catch (err) {}
    };
    const off = () => { touch[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
  $('touchBtn').onclick = () => {
    touchPref = touchOn() ? 'off' : 'on';
    try { localStorage.setItem('skybrawl.touch', touchPref); } catch (e) {}
    for (const k of ['atk','jump','guard','grab','sprint']) touch[k] = false;
    touch.x = touch.z = 0;
    syncTouch();
  };
  $('touchNote').hidden = !IS_TOUCH;
  // iOS Safari: one finger on the stick plus one on a button reads as a pinch, quick taps as a double-tap zoom
  const stop = e => e.preventDefault();
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, stop, {passive:false});
  document.addEventListener('touchmove', e => { if (e.touches.length > 1 || (e.scale !== undefined && e.scale !== 1)) e.preventDefault(); }, {passive:false});
  for (const el of [zone, ...document.querySelectorAll('#tbtns button')]) el.addEventListener('touchstart', stop, {passive:false});
  let lastEnd = 0;
  document.addEventListener('touchend', e => {
    if (e.timeStamp - lastEnd < 350 && e.target.closest && !e.target.closest('input,select,textarea,a,label,button')) e.preventDefault();
    lastEnd = e.timeStamp;
  }, {passive:false});
}

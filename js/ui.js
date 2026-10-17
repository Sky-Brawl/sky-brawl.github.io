// Sky Brawl · ui.js — หน้าเมนูแบบใหม่ (รูปหน้า ปุ่มลัด) · บังคับแนวนอนบนมือถือ · ติดตั้งเป็นแอป (PWA)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Menu extras ---------- */
// The player's face next to the level, redrawn whenever the menu comes back (the look may have changed)
function renderMenuFace(){
  const img = $('menuFace'); if (!img) return;
  try { img.src = facePortrait(LOOKS[0]); } catch (e) { img.removeAttribute('src'); }
}
new MutationObserver(() => { if (!$('menu').hidden) renderMenuFace(); }).observe($('menu'), {attributes:true, attributeFilter:['hidden']});
$('helpBtn').onclick = () => { const d = $('keysD'); d.open = true; d.scrollIntoView({behavior:'smooth', block:'start'}); };
$('featCls').textContent = ON_K.filter(k => k !== 'none').length + ' อาชีพ';
$('featStg').textContent = document.querySelectorAll('#stageGrid input').length + ' ด่าน';
setTimeout(renderMenuFace, 0);

/* ---------- Phones and tablets: landscape only ----------
   iPhone Safari cannot lock the orientation, so portrait shows a "turn your phone" screen and pauses an offline
   match. Android browsers can lock it once the page is fullscreen, which the first tap (or the button) asks for.
   The installed app (manifest.webmanifest) opens in landscape by itself on Android. */
const STANDALONE = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const PORTRAIT = matchMedia('(orientation: portrait)');
const CAN_LOCK = !!(document.documentElement.requestFullscreen && screen.orientation && screen.orientation.lock);
async function goLandscape(){
  try {
    if (!document.fullscreenElement && !STANDALONE) await document.documentElement.requestFullscreen({navigationUI:'hide'});
    await screen.orientation.lock('landscape');
  } catch (e) {}
}
function checkOrientation(){
  const show = IS_TOUCH && PORTRAIT.matches;
  $('rotate').hidden = !show;
  $('rotFull').hidden = !CAN_LOCK;
  document.body.classList.toggle('portrait-block', show);
  if (show && G.mode === 'play' && !G.net && !G.paused && !G.tut && $('result').hidden) togglePause();
}
if (IS_TOUCH){
  PORTRAIT.addEventListener ? PORTRAIT.addEventListener('change', checkOrientation) : PORTRAIT.addListener(checkOrientation);
  addEventListener('resize', checkOrientation);
  checkOrientation();
  $('rotFull').onclick = goLandscape;
  // Android: the first tap anywhere goes fullscreen and locks landscape (browsers only allow it after a tap)
  if (CAN_LOCK) addEventListener('pointerup', function first(){ removeEventListener('pointerup', first); goLandscape(); });
}

/* ---------- Install as an app (PWA) ---------- */
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let installEvt = null;
function renderInstall(){ $('installBtn').hidden = STANDALONE || !(installEvt || IS_IOS); }
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; renderInstall(); });
addEventListener('appinstalled', () => { installEvt = null; $('installBtn').hidden = true; toast('📲 ติดตั้ง Sky Brawl แล้ว เปิดจากไอคอนบนหน้าจอได้เลย'); });
$('installBtn').onclick = async () => {
  if (installEvt){ const e = installEvt; installEvt = null; e.prompt(); try { await e.userChoice; } catch (er) {} renderInstall(); return; }
  hideAllPanels(); $('iosInstall').hidden = false; $('iosInstallClose').focus({preventScroll:true});
};
$('iosInstallClose').onclick = () => { $('iosInstall').hidden = true; $('menu').hidden = false; };
renderInstall();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')){
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('[sw]', e)));
}

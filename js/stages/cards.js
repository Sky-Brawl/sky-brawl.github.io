// Sky Brawl · stages/cards.js — รูปการ์ดเลือกด่านในเมนู (ถ่ายจากด่านจริงแล้วจำไว้)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Stage picture cards: each stage photographs itself once (fighters hidden) and the picture is kept in localStorage ---------- */
const THUMB_VER = 'v2-blox', STAGE_THUMBS = {}, THUMB_FAIL = new Set();
const thumbCam = new THREE.PerspectiveCamera(42, 16/10, .1, 700);
let thumbRT = null, thumbWait = 45;
function stageThumb(key){
  const st = STAGES[key], prev = STAGE_KEY, hidden = [], W = 640, H = 400;
  setStage(key);
  for (const o of scene.children) if (o.visible && o !== st.group && o !== sea && !o.isLight && !clouds.includes(o)){ o.visible = false; hidden.push(o); }
  const [x0, x1, z0, z1] = st.box, cx = (x0 + x1)/2, cz = (z0 + z1)/2, w = Math.max(x1 - x0, (z1 - z0)*1.7);
  thumbCam.position.set(cx + w*.1, w*.4, cz + w*.66); thumbCam.lookAt(cx, 0, cz - w*.05); thumbCam.updateMatrixWorld();
  const fn = scene.fog.near, ff = scene.fog.far, d = w*.75; scene.fog.near += d; scene.fog.far += d;
  if (!thumbRT) thumbRT = new THREE.WebGLRenderTarget(W, H);
  renderer.shadowMap.needsUpdate = true;
  renderer.setRenderTarget(thumbRT); renderer.render(scene, thumbCam);
  const px = new Uint8Array(W*H*4); renderer.readRenderTargetPixels(thumbRT, 0, 0, W, H, px);
  renderer.setRenderTarget(null);
  scene.fog.near = fn; scene.fog.far = ff;
  for (const o of hidden) o.visible = true;
  setStage(prev);
  // The render target is upside down; flip it, then halve it for smooth edges
  const big = document.createElement('canvas'); big.width = W; big.height = H;
  const bc = big.getContext('2d'), img = bc.createImageData(W, H);
  for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y)*W*4, (H - y)*W*4), y*W*4);
  bc.putImageData(img, 0, 0);
  const sm = document.createElement('canvas'); sm.width = W/2; sm.height = H/2;
  sm.getContext('2d').drawImage(big, 0, 0, W/2, H/2);
  return sm.toDataURL('image/jpeg', .8);
}
function paintStageCard(key){
  const t = STAGE_THUMBS[key], sky = STAGES[key].sky;
  for (const lb of document.querySelectorAll('label[for="sg-' + key + '"],label[for="rsg-' + key + '"]'))
    lb.style.backgroundImage = t ? 'url(' + t + ')' : 'linear-gradient(' + sky[0] + ',' + sky[2] + ' 65%,' + sky[3] + ')';
}
function loadStageThumbs(){
  for (const k of STAGE_KEYS){
    try { const v = localStorage.getItem('skybrawl.thumb.' + k); if (v && v.startsWith(THUMB_VER + '|')) STAGE_THUMBS[k] = v.slice(THUMB_VER.length + 1); } catch (e) {}
    paintStageCard(k);
  }
}
// Called from the main loop just before the frame is drawn, so the screen never shows the photo shoot. One stage at a time, only on the menu.
function thumbStep(){
  if (G.mode !== 'menu' || ($('menu').hidden && $('online').hidden) || --thumbWait > 0) return;
  const k = STAGE_KEYS.find(k => !STAGE_THUMBS[k] && !THUMB_FAIL.has(k) && $('sg-' + k)); if (!k) return;
  thumbWait = 20;
  try { STAGE_THUMBS[k] = stageThumb(k); } catch (e) { THUMB_FAIL.add(k); console.warn('[stage picture] ' + k, e); return; }
  try { localStorage.setItem('skybrawl.thumb.' + k, THUMB_VER + '|' + STAGE_THUMBS[k]); } catch (e) {}
  paintStageCard(k);
}
function syncStagePick(){
  const boss = G.cfg.mode === 'boss';
  $('stageGrid').classList.toggle('off', boss);
  $('stageNote').textContent = boss ? '· โหมดตีบอสเล่นที่ด่านคริสต์มาสเสมอ' : '';
}

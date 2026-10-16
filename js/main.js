// Sky Brawl · main.js — เริ่มเกม: ขนาดจอ เมนูแรก ลิงก์ชวนเพื่อน และลูปหลัก (โหลดเป็นไฟล์สุดท้าย)
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
function resize(){
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w/h;
  camera.fov = w/h < .8 ? 64 : 45; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

toMenu();
Net.init();
// Invite links look like .../#k7mpx: open the online panel and join that room
{
  const code = (decodeURIComponent(location.hash.slice(1)) || new URLSearchParams(location.search).get('room') || '').toLowerCase();
  if (CODE_RE.test(code) && Net.ready){
    ensureName(() => openCustom(() => { enterAttract(); openOnline(); $('codeIn').value = code; Net.join(code); }));
  } else if (!named) ensureName(() => { $('menu').hidden = false; });
}
let last = performance.now(), acc = 0;
function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(.1, (now - last)/1000); last = now;
  if (!G.paused && !Replay.on){
    acc += dt*(G.slow > 0 ? .35 : 1);
    let n = 0; while (acc >= DT && n < 5){ acc -= DT; tick(); n++; }
    if (n === 5) acc = 0;
  }
  thumbStep(); classThumbStep();
  if (Replay.on) Replay.frame(); else { Replay.record(); render(); }
}
requestAnimationFrame(loop);

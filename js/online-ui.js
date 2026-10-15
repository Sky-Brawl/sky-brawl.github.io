// Sky Brawl · online-ui.js — หน้าจอห้องออนไลน์
// Part of the game split into files: all js/ files share one global scope and must load in the order listed in index.html.
/* ---------- Online UI ---------- */
function showOnMsg(text){ const m = $('onMsg'); m.textContent = text || ''; m.hidden = !text; }
function showLobbyView(){
  $('lobbyView').hidden = false; $('roomView').hidden = true;
  $('myName').value = LOOKS[0].name; updateMyClass();
  renderLobby();
}
function showRoomView(){
  hideAllPanels(); $('online').hidden = false;
  $('lobbyView').hidden = true; $('roomView').hidden = false; showOnMsg('');
  renderRoomView();
}
function renderLobby(){
  $('mkRoom').disabled = $('codeGo').disabled = !Net.ready;
  $('lobbyInfo').textContent = (Lobby.status || (Lobby.connected ? 'ออนไลน์ ' + Lobby.online + ' คน' : '')) + ' (' + Lobby.badge + ')';
  const list = $('roomList'); list.textContent = '';
  const rooms = Lobby.rooms.filter(r => r.code !== Net.code);
  if (!rooms.length){
    const p = document.createElement('p'); p.className = 'note';
    p.textContent = Lobby.connected ? 'ยังไม่มีห้องเปิดอยู่ กดสร้างห้องใหม่แล้วชวนเพื่อนได้เลย' : 'กำลังโหลดรายการห้อง…';
    list.appendChild(p); return;
  }
  for (const r of rooms){
    const row = document.createElement('div'); row.className = 'rrow';
    const n = document.createElement('span'); n.className = 'rn'; n.textContent = 'ห้องของ ' + r.nm;
    const m = document.createElement('span'); m.className = 'rm';
    m.textContent = r.code + ' · คน ' + r.n + ' / นักสู้ ' + r.mx + ' · ' + (r.ph === 'play' ? 'กำลังแข่ง' : r.ph === 'end' ? 'จบรอบ' : 'รอเริ่ม');
    const b = document.createElement('button'); b.type = 'button'; b.textContent = r.ph === 'play' ? 'เข้าไปดู' : 'เข้าห้อง';
    b.onclick = () => { $('codeIn').value = r.code; Net.join(r.code); };
    row.append(n, m, b); list.appendChild(row);
  }
}
function renderRoomView(){
  const host = Net.role === 'host';
  $('rCode').textContent = Net.code || '';
  $('rRole').textContent = host ? 'คุณเป็น host · ส่งลิงก์เชิญให้เพื่อน' : 'คุณเป็นผู้เล่น · รอ host กดเริ่ม';
  if (Net.code){
    const link = Net.inviteLink();
    $('inviteLink').value = link;
    if (G.qrFor !== link){ G.qrFor = link; drawQr($('roomQr'), link); }
    setShares('room', 'มาตีกันใน Sky Brawl! ห้อง ' + Net.code + ' กดลิงก์แล้วเข้าห้องได้เลย', link);
  }
  $('shareLink').hidden = typeof navigator.share !== 'function';
  $('rCfg').hidden = !host; $('rCfgText').hidden = host;
  if (host){
    $('rN').value = G.cfg.n; $('rNOut').textContent = G.cfg.n; $('rSt').value = G.cfg.st; $('rDf').value = G.cfg.df; $('rStage').value = G.cfg.stage; $('rMode').value = G.cfg.mode;
  } else {
    const c = Net.cfg || [];
    $('rCfgText').textContent = `กติกา: นักสู้ ${Number(c[0]) || 2} ตัว · ${Number(c[1]) || 2} ชีวิต · บอทระดับ${['ง่าย','ปกติ','ยาก'][Number(c[2])] || 'ปกติ'} · ด่าน${(STAGES[stageFor(STAGE_KEYS[Number(c[3])], MODE_KEYS[Number(c[4])])] || STAGES.titanic).name}${Number(c[4]) === 1 ? ' · ทีมตีหิน' : Number(c[4]) === 2 ? ' · ตีบอส' : ''}`;
  }
  const list = $('slotList'); list.textContent = '';
  const slots = Net.slots || [], sides = Net.sides || [];
  syncRoomPicks(host);
  const team = (host ? G.cfg.mode : MODE_KEYS[Number((Net.cfg || [])[4])]) === 'team';
  $('teamRow').hidden = !team;
  for (const b of $('teamRow').querySelectorAll('button')) b.setAttribute('aria-pressed', String(Number(b.dataset.tm) === G.myTeam));
  const nSide = sd => sides.slice(0, slots.length).filter(v => v === sd).length;
  $('slotHead').textContent = team ? `นักสู้ในห้อง (${slots.length}) · แดง ${nSide(0)} · น้ำเงิน ${nSide(1)}` : `นักสู้ในห้อง (${slots.length})`;
  slots.forEach((s, i) => {
    const row = document.createElement('div'); row.className = 'srow';
    const dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = hex(team && sides[i] >= 0 ? SIDES[sides[i]].col : TEAM[i % TEAM.length]);
    const n = document.createElement('span'); n.className = 'sn'; n.textContent = slotName(s, i);
    row.append(dot, n);
    const tag = (cls, text) => { const b = document.createElement('span'); b.className = 'badge ' + cls; b.textContent = text; row.appendChild(b); };
    if (i === 0) tag('host', 'host');
    if (s[0] && s[0] === Net.me) tag('me', 'คุณ');
    if (!s[0] && i > 0) tag('bot', 'บอท');
    try {
      const lk = s[0] ? decLook(s[2], '') : seededLook(Number(s[1]) || 1, ''), o = OUTFITS[lk.outfit];
      if (o && lk.outfit !== 'none') tag('cls', o.name);
    } catch (e) {}
    list.appendChild(row);
  });
  $('rStart').hidden = !host;
  {
    const humans = slots.filter(x => x[0]).length, guests = Math.max(0, humans - 1);
    const mbps = Net.uploadMbps(slots.length, guests), warn = $('netWarn');
    warn.hidden = !host || guests < 8;
    warn.textContent = 'คนจริง ' + humans + ' คน: เครื่อง host ต้องอัปโหลดราว ' + mbps.toFixed(0) + ' Mbps ตลอดการแข่ง ถ้าเน็ต host ไม่พอ ทุกคนจะกระตุก ใช้สายแลนหรือ Wi-Fi แรงๆ จะดีที่สุด';
  }
}

# Sky Brawl — เอกสารส่งต่องาน

> อัปเดตล่าสุด: 11 ต.ค. 2026 · ไฟล์หลัก `index.html` ยาวประมาณ 4,500 บรรทัด
> ใช้ไฟล์นี้เป็นจุดเริ่มต้นเมื่อทำงานต่อจากบัญชีอื่น หรือส่งให้ AI ตัวใหม่อ่านก่อนลงมือ

---

## 1. ภาพรวม

**Sky Brawl** เป็นเกมต่อสู้ 3 มิติแนว GetAmped เล่นบนเว็บ (Three.js r128) ทั้งเกมอยู่ในไฟล์ HTML ไฟล์เดียว
เล่นบนมือถือได้ ไม่ต้องติดตั้ง

| ลิงก์ / ที่อยู่ | ค่า |
|---|---|
| เว็บจริง | https://sky-brawl.github.io/ (ย้ายมา 2026-10-15 · เว็บเก่า https://soradadofficial.github.io/sky-brawl/) |
| GitHub repo | `Sky-Brawl/sky-brawl.github.io` · branch **`main`** · ไฟล์อยู่ที่ราก repo (repo เก่า: `soradadofficial/soradadofficial.github.io` โฟลเดอร์ `sky-brawl/`) |
| ไฟล์บนเครื่อง (เครื่องเดิม) | `agent-trading/sky-brawl/` |
| Supabase project | `https://dngqblfvgjdoevctsnfy.supabase.co` (Region: Singapore) |
| Google OAuth | ตั้งไว้ใน Google Cloud แล้ว, Client ID ลงท้าย `…apps.googleusercontent.com` (ไม่ต้องใช้ในโค้ด) |
| เวอร์ชันเก่าบน claude.ai | https://claude.ai/artifact/HKcupQSrXvaJeHh5qnsR9o (**ล้าหลังมาก ไม่ได้ใช้แล้ว**) |

### ไฟล์ในโฟลเดอร์ `sky-brawl/`
| ไฟล์ | หน้าที่ | อัปขึ้น GitHub? |
|---|---|---|
| `index.html` | ตัวเกมทั้งหมด (HTML + CSS + JS) | ✅ |
| `og.png` | รูปปกตอนแชร์ลิงก์ 1200×630 | ✅ |
| `config.js` | ตั้งค่าที่ปรับบ่อย: คูลดาวน์/ดาเมจ/แรงกระเด็น/ฮีลของสกิล, เปิด-ปิดอาชีพ, ตัวคูณรวม | ✅ (ไม่มีไฟล์นี้เกมก็ใช้ค่าเดิม) |
| `supabase-setup.sql` | ตาราง profiles + แชตล็อบบี้ (รันแล้ว) | ❌ รันใน Supabase เท่านั้น |
| `supabase-levels.sql` | ตาราง player_stats + ฟังก์ชัน record_match (รันแล้ว) | ❌ |
| `HANDOFF.md` | ไฟล์นี้ | ไม่จำเป็น |

---

## 2. ฟีเจอร์ที่มีตอนนี้

- **ต่อสู้:** คอมโบ 3 จังหวะ, กัน, กระโดด, เตะกลางอากาศ, กระเด็น/ล้ม/ลุก, ตกขอบ = เสียชีวิต
- **อาชีพ 27 แบบ** (รวม "ไม่ใส่") — แต่ละอาชีพมีชุด, อาวุธในมือ, **คอมโบเฉพาะ** และ **สกิลเฉพาะ** (ปุ่ม E)
  none, knight, warrior, berserker, paladin, mage, priest, necro, druid, archer, assassin, ninja, samurai, monk, bard, gunner, engineer, pony, gundam, merchant, blacksmith, hunter, wizard, crusader, alchemist, rogue, taekwon
- **ไอเทม:** ค้อน, ปืนพก, ลูกซอง, ระเบิด, ข้าวปั้น (ฟื้นพลัง) — **กดปุ่มโจมตีใกล้ของ = เก็บของ** (ปุ่ม R ก็ได้)
- **ด่าน 8 ด่าน:** เรือไททานิก (`titanic`), วัดไทย (`temple`), สยาม (`siam`), สนามกิลวอ (`gvg`), ฮัลโลวีน (`halloween`), คริสต์มาส (`christmas`), ทะเลสาบน้ำแข็ง (`ice`: พื้นลื่น `slip:true` เร่ง/หยุดช้า ไถลต่อ), โรงพยาบาล (`hospital`: ห้องผ่าตัดแบบเปิดด้านหน้า มีกำแพงสามด้านเป็น BLOCKS kind `edge`, แผ่นกากบาทเขียว `pads` ฟื้นพลังตอนยืน `padHeal` ต่อ 1/3 วินาที ผ่าน `healPads()`) · โหมด: ตะลุมบอน (`ffa`), ทีมตีหิน (`team`), ตีบอส (`boss`, เล่นบนด่านคริสต์มาสเสมอ)
- **โหมด:** ตะลุมบอน (`ffa`) และ ทีมตีหิน (`team`, แบบ Emperium)
- **ออฟไลน์:** เล่นกับบอทได้สูงสุด 124 ตัว, 2 คนเครื่องเดียว
- **ออนไลน์:** ห้องละสูงสุด **64 นักสู้** (คนจริง + บอทเติม), ล็อบบี้มีรายการห้อง + แชต
- **บัญชี:** เข้าเล่นแบบไม่ระบุตัวตนอัตโนมัติ, **ผูก Google** เพื่อเก็บเลเวล/ชุดข้ามเครื่อง
- **เลเวล + ตารางอันดับ** (เลเวล / ชนะ / KO) — XP คิดฝั่งเซิร์ฟเวอร์
- **แชร์:** LINE / Facebook / X / QR code (เมนู, ห้อง, หน้าสรุปผล) + รูปปก og.png
- **อื่นๆ:** แต่งตัวละครก่อนเข้าเล่นทุกครั้ง, ปรับมุมกล้อง 5 ระดับ, ปุ่มบนจอมือถือ, ล็อกเป้า (Q), โหมดออโต้, โหมดดู hitbox (X)

### ปุ่ม (ผู้เล่น 1)
| ปุ่ม | หน้าที่ |
|---|---|
| WASD / ลูกศร | เดิน |
| F (หรือ J) | ต่อย / เก็บของ |
| G, Space (หรือ K) | กระโดด |
| H (หรือ L) | กัน (กดค้าง) |
| R (หรือ U) | หยิบ / ขว้างระเบิด |
| E (หรือ I) | สกิลอาชีพ |
| Q (หรือ O) | ล็อกเป้า |
| - / = / ล้อเมาส์ | ปรับมุมกล้อง |
| X | แสดง hitbox + เฟรมดาต้า |
| Esc | เมนูพัก |

---

## 3. โครงสร้างโค้ด

> **ตั้งแต่ 1.6.0 (2026-10-15) โค้ดแยกเป็นไฟล์แล้ว** ดูหัวข้อ "แยกไฟล์" ท้ายเอกสารและ [`js/README.md`](js/README.md) · ชื่อฟังก์ชัน/ตัวแปรด้านล่างยังถูกต้อง แต่ตอนนี้อยู่ในไฟล์ `js/*.js` ตามหัวข้อ (ค้นด้วยชื่อได้เลย)

ค้นหาด้วยหัวข้อคอมเมนต์ `/* ---------- ชื่อส่วน ---------- */` (เรียงตามลำดับในไฟล์)

| ส่วน | ของสำคัญในส่วนนั้น |
|---|---|
| Frame data | `MOVES` (ทุกท่าเป็นข้อมูล: startup/active/recovery/dmg/kb/…), `SKILL_INFO`, `CLASS_COMBO`, `CLASS_REACH` |
| The ship / Renderer & world | `hw(x)` รูปทรงเรือ, `scene`, `camera`, `renderer`, `toon()`, `part()`, `SPH()` |
| Draw-call batching | `mergeMeshes(container, skip)`, `stageSkip()` — รวมชิ้นส่วนที่ไม่ขยับเพื่อลดภาระวาดภาพ |
| More stages / Guild war / Halloween | `STAGES = {titanic, temple, siam, gvg, halloween}` แต่ละด่านมี `inside`, `pushOut`, `obstacles`, `fallY`, `spawn`, `preview`, `fx`; ฟังก์ชัน `setStage(key)` |
| Character customization | `OUTFITS` (อาชีพ/ชุด), `LOOKS[0]` (ผู้เล่น 1), `LOOKS[1]`, `encLook/decLook`, `seededLook` (หน้าตาบอทจาก seed) |
| Models | `buildChibi()`, `buildClassWeapon()`, `buildOffhand()`, `buildGun()` |
| FX | instanced particles `emit()`, `flash()`, `RINGS/BLOBS` (วงทีม/เงาใต้เท้า), `updateGroundMarks()` |
| Game state | `G` (สถานะเกมทั้งหมด), `class Fighter`, `createFighters()`, `spawnPoint()` |
| Input / Bots / Targeting | `MAP1/MAP2/MAPALT`, `touch`, `think(b)` (AI บอท), ล็อกเป้า |
| Combat / Items | `startMove`, `checkHits` (รองรับ `sweep`), `applyHit`, `aoe`, `fireProj`, `doGrab` (คืนค่า true เมื่อเก็บได้) |
| Team stones | โหมดทีม: `makeStones`, `damageStone`, `endTeamMatch` |
| Simulation | `stepFighter`, `physics`, `tick()` (60 Hz fixed step) |
| Pose & render / HUD / Flow | `pose()`, `render()`, `buildHud()`, `beginMatch()`, `startOffline()`, `showResult()` |
| Online (PeerJS) | `PeerLobby` (ล็อบบี้สำรอง), `Net` (host คำนวณเกม, guest ส่ง input + รับ snapshot), `Net.sendEvery()` |
| Supabase | `Supa` (client + anonymous sign-in), `SupaLobby` (presence = รายการห้อง, แชต), `Lobby` (ตัวเลือกใช้ Supa ก่อน ถ้าล่มใช้ PeerLobby) |
| Levels | `Progress` (record_match), `Ranks` (ตารางอันดับ), `renderLevelChip`, `showXp` |
| Google account | `Account` (`linkGoogle`, `useExisting`, `restore`, `signOut`), `renderAccount` |
| Online UI / Customize / Wiring | `renderLobby`, `renderRoomView`, หน้าแต่งตัว, ผูกปุ่มทั้งหมด, `ensureName`, การแชร์ (`setShares`, `drawQr`) |

### ระบบออนไลน์ทำงานยังไง
1. **ล็อบบี้:** Supabase Realtime channel `skybrawl-lobby` — แต่ละแท็บ `track({nm, room})` → ทุกคนเห็นรายการห้องจาก presence
2. **ตัวแมตช์:** PeerJS (WebRTC) แบบเครื่องคุยกันตรง — host สร้าง peer id `skybrawl-v1-<code>`, guest ต่อเข้ามา
3. host คำนวณเกมทั้งหมด → ส่ง snapshot (`hostSend`) 10–30 ครั้ง/วินาที ตามจำนวน guest; guest ส่งเฉพาะ input (`sendInput`)
4. ลิงก์เชิญ: `?room=<code>` (รองรับ `#<code>` แบบเก่าด้วย)
5. ⚠️ host ต้องเปิดแท็บค้างไว้; ห้องที่มีคนจริงเยอะต้องใช้เน็ตอัปโหลดแรง (63 guest ≈ 21 Mbps)

### Supabase (ตาราง + สิทธิ์)
| ตาราง / ฟังก์ชัน | ใครทำอะไรได้ |
|---|---|
| `profiles` (id, name, look) | ผู้เล่นที่ล็อกอินอ่านได้ทุกแถว, เขียน/แก้ได้เฉพาะของตัวเอง |
| `lobby_messages` | อ่านได้ทุกคนที่ล็อกอิน, ส่งได้ในชื่อตัวเอง, ≤120 ตัวอักษร, ≤1 ข้อความ/วินาที (trigger) |
| `player_stats` (xp, level, matches, wins, kos) | **อ่านได้อย่างเดียว** — เขียนผ่าน `record_match()` เท่านั้น |
| `record_match(p_place, p_players, p_kos, p_dmg, p_online)` | เซิร์ฟเวอร์คิด XP เอง: 20 + KO×5 + ชนะ 40 / Top3 20 + จำนวนคู่แข่ง (≤32), เพดาน 200, ออนไลน์ ×1.5, บันทึกได้ 1 แมตช์/30 วิ |

- สูตรเลเวล: เลเวล L เริ่มที่ `50 × (L−1)²` XP (Lv2=50, Lv5=800, Lv10=4,050)
- ตั้งค่าใน Supabase ที่เปิดไว้แล้ว: Anonymous sign-ins ✅, Google provider ✅, Manual linking ✅, Site URL = `https://soradadofficial.github.io/sky-brawl/`, Redirect URLs มี `https://soradadofficial.github.io/sky-brawl/**` และ `http://localhost:8765/**`
- **ย้ายโดเมน 2026-10-15:** ต้องตั้ง Supabase → Authentication → URL Configuration: Site URL = `https://sky-brawl.github.io/` และเพิ่ม `https://sky-brawl.github.io/**` ใน Redirect URLs ไม่อย่างนั้นปุ่มผูก Google จะเด้งกลับเว็บเก่า
- **anon key** อยู่ใน `index.html` (`SUPA_KEY`) — ใส่ในหน้าเว็บได้ปลอดภัย; **ห้ามใส่ `service_role` key ในไฟล์หรือส่งให้ใครเด็ดขาด**

---

## 4. วิธีทำงานต่อ (สำคัญ)

### กฎข้อแรก: ดึงไฟล์จาก GitHub มาเทียบก่อนแก้ทุกครั้ง
เจ้าของเกมแก้ไฟล์บน GitHub เองด้วย (เคยเพิ่มด่าน GvG, ฮาโลวีน, โหมดทีม, อาชีพเพิ่ม ฯลฯ ด้วยตัวเอง)
```bash
# ทุกไฟล์ในเว็บ: https://api.github.com/repos/Sky-Brawl/sky-brawl.github.io/git/trees/main?recursive=1
curl -sSL -o remote-index.html "https://raw.githubusercontent.com/Sky-Brawl/sky-brawl.github.io/main/index.html"
```
แล้ว diff กับไฟล์บนเครื่อง ถ้าต่างกัน ให้ใช้ไฟล์จาก GitHub เป็นตัวตั้ง

### วิธีแก้โค้ดที่ปลอดภัย
- ไฟล์ใหญ่มาก → แก้แบบ "หาข้อความเดิมแล้วแทนที่" โดย**ต้องเจอข้อความนั้นครบตามจำนวนที่คาด** ถ้าไม่เจอให้หยุด (กันแก้ผิดที่)
- หลังแก้ ตรวจไวยากรณ์ JS:
  ```bash
  awk '/<script>/{f=1;next}/<\/script>/{f=0}f' index.html > chk.js && node --check chk.js
  ```
- ทำตามสไตล์เดิม: ท่าใหม่ → เพิ่มใน `MOVES`; อาชีพใหม่ → เพิ่มใน `OUTFITS` + `SKILL_INFO` + `CLASS_COMBO` + `sk_<class>`; ด่านใหม่ → เพิ่มใน `STAGES` (ของที่ขยับได้ต้องเก็บไว้ใน `group.userData` ไม่งั้นจะถูก `mergeMeshes` รวมจนขยับไม่ได้)

### ทดสอบบนเครื่อง
```bash
python -m http.server 8765 --directory sky-brawl
```
เปิด http://localhost:8765 (Supabase อนุญาต localhost:8765 ไว้แล้ว)
- ทดสอบออนไลน์: เปิด 2 แท็บ — แท็บที่อยู่ข้างหลังจะหยุดทำงาน ต้องสลับไปมา
- เทคนิคทดสอบอัตโนมัติ: ชั่วคราวเติม `window.__SB = {G, tick, ...};` ต่อท้าย `requestAnimationFrame(loop);` แล้วเรียก `tick()` ตรงๆ — **ลบออกก่อนอัปทุกครั้ง**

### Gotchas ที่เคยเจอ
- ตัวละครที่ `ctrl: 'none'` ยังอ่านคีย์บอร์ดอยู่ → ถ้าจะให้ยืนนิ่งตอนทดสอบใช้ `ctrl: 'net'` + `peer: ''`
- `InstancedMesh.setColorAt` สร้างบัฟเฟอร์ตาม `count` ปัจจุบัน → ตั้งสีให้ครบก่อนค่อยตั้ง `count = 0`
- ตัวเลือก `.ctabs .tab` ต้องจำกัดด้วย `#custom` (หน้าแต่งตัว) ไม่งั้นไปจับแท็บตารางอันดับด้วย
- `Net.adv()` ต้องเช็ก `!this.peer` — ตอนออกจากห้อง การปิดการเชื่อมต่อเคยทำให้ห้องเด้งกลับเข้ารายการ
- Facebook ตัด `#fragment` ทิ้ง → ลิงก์ห้องต้องเป็น `?room=`
- หลัง OAuth ถ้าไปโผล่ `localhost:3000` = Site URL ใน Supabase ผิด

### กำแพง / ชั้นยืน (BLOCKS), บอส, ฮีลเพื่อน
- ด่านไหนจะมีกำแพงหรือชั้นยืน: ใส่ `blocks:[{x, z, hx, hz, h}]` ใน `STAGES` (hx/hz = ครึ่งความกว้าง) สูง ≤ 1.8 กระโดดขึ้นไปยืนได้, สูงกว่านั้นเป็นกำแพง; ฟิสิกส์ (`physics`), กระสุน, ระเบิด, จุดเกิด, ไอเทม และบอทเดินเลี่ยง (`steerAroundObstacles`) รองรับให้แล้ว ต้องสร้างโมเดลในฟังก์ชัน build ของด่านให้ตรงตำแหน่งเอง
- โหมด `boss` (`MODE_KEYS[2]`, `stageFor()` บังคับด่าน `christmas`) → `G.raid` = โหมดช่วยกันตีบอส ด่านคริสต์มาสในโหมดอื่นเล่นปกติไม่มีบอส, ทุกคน `side = 0` (ตีกันเองไม่เข้า), บอสอยู่ใน `G.boss` (`makeBoss`, `stepBoss`, `damageBoss`, `endRaid`), ท่าบอส: ทุบพื้น (ยืนบนชั้นหรือกระโดดหลบได้), ปาหิมะ (กำแพงบังได้), หมุนตัวตอนคลั่ง (<30%)
- สถานะผิดปกติ: `f.chill` = แช่แข็ง (นักเวทน้ำแข็ง `frost`, ท่า `sk_frost` มี `freeze`), `f.shock` = ชา (นักเวทสายฟ้า `volt`, `sk_volt` → `chainLightning`, มี `shock`) ใส่ `freeze`/`shock` ในท่าไหนก็ได้ผลเหมือนกัน (`applyHit` → `freezeF`/`shockF`) ส่งให้ guest ทาง flags 32/64 ใน `encF`
- อาชีพใหม่: นักดาบปีศาจ `demon` (ฟันแล้วปล่อย `darkWave` กระสุนทะลุ `pierce` กว้าง `b.rad`), ตำรวจอวกาศ `spacecop` (ดาบเลเซอร์ สกิลกระสุน `saber` บินกลับหาเจ้าของ `b.back`), ทหาร `soldier` (ระเบิด `throwGrenade` = bomb ชนิด `grenade`, ท่ามี `grenade:N` = ขว้างทุก N เฟรม)
- นักเวทน้ำแข็งใช้ `iceStorm` → พื้นที่ใน `G.zones` (`stepZones` ฝั่ง host, `zoneFx` วาดทั้งสองฝั่ง, ส่งให้ guest ใน `sn.zn`)
- สีชุดอาชีพ: `look.oc` = ลำดับใน `OUTFIT_TINTS` (0 = สีเดิม) `buildChibi` ทาสีใหม่เฉพาะชิ้นที่ชุดอาชีพสร้าง (`recolor`) ส่งเป็นช่องที่ 8 ของ `encLook`
- ห้องออนไลน์: `config.js` → `online.maxPlayers` / `maxHumans` (`ONLINE_MAX`, `ONLINE_HUMANS`, สูงสุด 124)
- HUD มือถือแนวนอน: `@media (max-height:520px)` ย่อทุกอย่าง ปุ่มเมนูเรียงแถวเดียว (`#hudBtns`) รายชื่อนักสู้ (`#board`) พับไว้ แตะหัวเพื่อเปิด
- ออนไลน์: host ส่งสถานะบอสใน snapshot `sn.bs`, ผลแข่ง raid ส่งเป็น win = -20 (ชนะ) / -21 (แพ้)
- ฮีล: `groupHeal` (นักบวช, รัศมี 7) และ `healOne` (อาชีพใหม่ `acolyte`, ฮีลเพื่อนเลือดน้อยสุดในระยะ 10) มีผลเฉพาะ `ally()` + ตัวเอง; บอทใช้เมื่อ `wantsHeal()`

### ปรับค่าเกมด้วย `config.js` (ไม่ต้องแก้ index.html)
- แก้ตัวเลขใน `config.js` แล้วอัปขึ้น GitHub ไว้ข้าง `index.html` → รีเฟรชเกมก็ได้ค่าใหม่
- `global` ตัวคูณรวม (skillCooldown / skillDamage / skillKnockback), `classes` เปิด-ปิดอาชีพ (`false` = ปิด), `skills.<อาชีพ>` = `cd` (วินาที), `dmg`, `kb`, `heal`
- ค่าที่ไม่ใส่ = ใช้ค่าในเกม, ค่าผิด = ข้ามพร้อมเตือนใน Console ขึ้นต้น `[config.js]`, ไฟล์พังหรือหาย = เกมใช้ค่าเดิมทั้งหมด
- ในโค้ด: `applyConfig()` อยู่ต่อจาก `OUTFIT_K`; อาชีพที่เปิดอยู่คือ `ON_K` / `CLASS_ON` (บอทสุ่ม, หน้าแต่งตัว, `setLook` ใช้ชุดนี้)
- สกิลมือปืนกับวิศวกรใช้ข้อมูลกระสุน `RAPID_SHOT` / `TURRET_SHOT` แทน `MOVES.sk_*`
- เพิ่มอาชีพใหม่แล้วอยากให้ปรับใน config ได้: ใส่บรรทัดใน `classes` และ `skills` ของ `config.js` ด้วย

---

### เสียง (Web Audio สังเคราะห์สด — ไม่มีไฟล์เสียง)
- โค้ดอยู่หัวข้อ `/* ---------- Sound … */` ก่อนตาราง `MOVES`: `makeKit(ctx)` (ตัวสร้างเสียง `T` = โทน, `N` = นอยส์), `SFX_R` (สูตรเสียงทุกตัว: `gap` ห่างกันขั้นต่ำกี่ ms, `v` ความดัง, `dur`, `prio` ข้ามเพดาน 26 เสียง, `ui` เล่นนอกแมตช์ได้), `MUS_TRK` + `musicStep()` (เพลงวน 2 แบบ `battle`/`menu`), `Sfx` (`play(name, pos, vol)`, `move`, `proj`, `banner`, `result`, `cycle`)
- เบราว์เซอร์ให้เล่นเสียงได้หลังผู้ใช้แตะ/กดครั้งแรกเท่านั้น → `unlock()` ผูกกับ pointerdown/keydown/touchend; แท็บถูกซ่อนจะ `suspend()` เอง
- เสียงมีตำแหน่ง: ยิ่งไกลจากตัวผู้เล่น (ไม่มีตัวเอง = จุดกล้องมอง) ยิ่งเบา ไกลเกิน 34 ช่องไม่ดัง และแพนซ้าย/ขวาตามตำแหน่งบนจอ; เล่นพร้อมกันได้สูงสุด 26 เสียง กันห้อง 124 คนดังเละ
- จุดที่เรียกเสียง: `startMove` (ฟาด/สกิล), `applyHit` (ต่อย/โดนแรง/กัน/กันแตก/KO), `fireGun` / `fireProj` (ยิง), `explodeFx` (ระเบิด), `splash` (ตกน้ำ), `doGrab` (เก็บของ), `popup(..., 'heal')` (ฮีล), กระโดด/ล้ม, `banner()` (นับถอยหลัง, LEVEL UP), `showResult` (ชนะ/แพ้), บอสหิมะ; **ผู้เล่นออนไลน์ที่เป็น guest** ไม่ได้คำนวณเกมเอง จึงมีจุดเรียกเสียงแยกใน `Net.applySnap` (พลังลด → เสียงโดนตี, ท่าเปลี่ยน → เสียงฟาด, กระสุนใหม่, ไอเทมหาย, KO)
- ปุ่ม "เสียง" ในเมนูหลักและเมนูพัก วนโหมด เปิดทั้งหมด → เฉพาะเอฟเฟกต์ → ปิด (จำใน localStorage `skybrawl.sound`); ค่าเริ่มต้นของคนที่ยังไม่เคยกดตั้งได้ที่ `config.js` → `sound: { volume, effects, music }`
- เพิ่มเสียงใหม่: เติมใน `SFX_R` แล้วเรียก `Sfx.play('ชื่อ', ตำแหน่ง)`; ทดสอบแบบไม่ต้องฟังได้ด้วย `OfflineAudioContext` (วัด peak/rms/NaN) ดูวิธีในประวัติแชต
- iPhone: สวิตช์ปิดเสียง (silent switch) ที่ข้างเครื่องจะปิดเสียงเกมด้วย

## 5. ข้อจำกัดที่รู้อยู่แล้ว

- **กันโกงไม่ 100%:** ผลแข่งคำนวณบนเครื่อง host/ผู้เล่น → แต่งผลได้ แต่ XP ถูกจำกัดเพดาน/ความถี่ฝั่งเซิร์ฟเวอร์แล้ว ถ้าจะกันจริงต้องมีเซิร์ฟเวอร์เกม
- **ห้องคนจริงเยอะ** ขึ้นกับเน็ตอัปโหลดของ host
- **การต่อเข้าห้อง:** ลองต่อตรง (WebRTC) ก่อน ถ้าไม่ติดใน 12 วินาที จะสลับไปส่งข้อมูลผ่าน Supabase Realtime เอง (`Relay` / `RelayConn` ใน index.html, ช่อง `sbr-<รหัสห้อง>` และ `sbr-<รหัสห้อง>-<id ผู้เล่น>`) ผู้เล่นทางนี้ได้ภาพ 10 ครั้ง/วินาที ใช้ราว 35 ข้อความ/วินาที แพ็กฟรีได้ 100 ข้อความ/วินาทีทั้งโปรเจกต์ และ 2 ล้านข้อความ/เดือน จึงจำกัดไว้ 3 คนต่อห้อง (`config.js` → `network.relayMax`, `supaRelay`)
- **TURN relay:** ไม่มี TURN สาธารณะในโค้ดแล้ว (บัญชี Open Relay แบบแชร์ใช้ไม่ได้แล้ว) ใส่ของตัวเองได้ใน `config.js` → `network.rmsKey` (คีย์ pk_live ของ Metered) / `turnApi` / `iceServers`
- **ยังไม่มีตัวกรองคำหยาบ / ปุ่มรายงาน** ทั้งชื่อและแชต
- **ชื่อ "กันดั้ม" / "โพนี่"** เป็นเครื่องหมายการค้าของบริษัทอื่น — ถ้าเกมเริ่มดังหรือหารายได้ ควรเปลี่ยนชื่อ/ดีไซน์
- หน้าล็อกอิน Google แสดงโดเมน `…supabase.co` (ถ้าอยากให้ขึ้นชื่อเว็บต้องใช้ custom domain แบบเสียเงิน)
- ข้อมูลทดสอบที่อาจค้างใน Supabase: บัญชี "HostTest" ในตารางอันดับ (id `2eeee655-d003-4131-92ac-6df943187d27`) และข้อความทดสอบในแชต ลบได้ใน SQL Editor

## 6. งานที่วางแผนไว้ (เรียงตามความสำคัญ)

1. **ตัวกรองคำหยาบ + ปุ่มรายงาน/ปิดเสียงผู้เล่น** (ชื่อ + แชต) — ก่อนเปิดให้คนแปลกหน้าเล่นเยอะๆ
2. **ของรางวัลตามเลเวล** เช่น ปลดล็อกชุดพิเศษที่ Lv.5/10/20
3. **คลิปไฮไลต์อัตโนมัติ** (อัด 10 วินาทีล่าสุดตอน KO แล้วแชร์ TikTok/Reels) + การ์ดผลแข่งเป็นรูป
4. **PWA** ให้กดเพิ่มลงหน้าจอมือถือได้
5. **เซิร์ฟเวอร์เกมจริง** (แนะนำ Cloudflare Durable Objects / PartyKit หรือ Colyseus) สำหรับห้อง 64–124 คนจริงและกันโกงเต็มรูปแบบ — ใช้บัญชี Supabase เดิมต่อได้
6. โหมดใหม่: Battle Royale เรือค่อยๆ จม, บอสใหญ่ vs คนดูสตรีม, กิจกรรมตามเทศกาล (สงกรานต์, ลอยกระทง)

---

## 7. ข้อความสั้นสำหรับเริ่มคุยกับ AI ตัวใหม่

> ผมกำลังทำเกม Sky Brawl (เกมต่อสู้ 3D บนเว็บ ไฟล์เดียว `index.html`, Three.js r128, PeerJS, Supabase)
> โปรดอ่าน `sky-brawl/HANDOFF.md` ก่อน แล้วดึงไฟล์ล่าสุดจาก GitHub มาเทียบกับไฟล์บนเครื่องก่อนแก้อะไร
> แก้แบบหาข้อความเดิมแล้วแทนที่ ตรวจ `node --check` หลังแก้ และทดสอบที่ http://localhost:8765 ก่อนให้ผมอัปขึ้น GitHub
> งานต่อไปที่อยากทำคือ: ______

## แปลงร่าง (มนุษย์หมาป่า / เทมเมอร์) + แต่งตัวจากล็อบบี้ (2026-10-12)
- คลาสใหม่ `werewolf`, `tamer` (ต่อท้าย `OUTFITS` เพื่อไม่ให้เลข index ของ look ที่เซฟไว้เลื่อน) ท่าปกติ `ww1-3` / `tm1-3` (แส้ของเทมเมอร์อยู่ใน `buildClassWeapon`)
- `FORM_INFO[cls]` = {secs, scale, speed, atk, moves, stop, reach}; สกิล `sk_werewolf`/`sk_tamer` (มี `form:true`, `fire:startForm`) ตั้ง `f.formT` (เฟรม) ระหว่างแปลงร่าง `attackKey()` คืนท่าของร่างนั้น (`wf1-3` ตะปบวงกว้าง `sweep` rad 2.8–3.4 / `dg1` พ่นไฟ `breath:true`)
- `dg1` ไม่ใช้ `checkHits` แต่ `breathTick()` (host เท่านั้น) ตีทุกคนในรูปกรวย (`range`, `arc`, ทุก `tick` เฟรม) + หินทีม + บอส; เอฟเฟกต์ไฟ/ฟ้าวาดจาก `formMoveFx()` ในฟังก์ชัน `pose` ทุกเครื่อง
- โมเดลร่างเป็นชิ้นส่วนสวมทับตัวเดิม (`attachForm`: หัว/ลำตัว/แขน/ขา/ปีก/หาง) ซ่อนไว้จน `formT>0`, ตัวใหญ่ขึ้นด้วย `root.scale` (`poseForm`), เนื่องจากอยู่ใต้ `tilt` ต้อง attach หลัง `mergeMeshes` ทุกอันใน `buildChibi`
- ออนไลน์: บิต 128 ใน flags ของ `Net.encF` = กำลังแปลงร่าง guest ตั้ง `formT=30` และยิง `formFx`/`endForm` ตอนบิตเปลี่ยน
- config.js: `classes.werewolf/tamer`, `skills.werewolf/tamer` มี `form` (วินาทีที่แปลงร่าง) เพิ่มจาก cd/dmg/kb โดย dmg/kb ของสกิลจะถูกคัดลอกไปที่ท่าของร่าง (`MOVES.wf*`/`dg1`, คูณด้วย `fmul`/`kbmul` ถ้ามี) ผ่าน `FORM_INFO[k].moves`
- เสียงใหม่ `howl`, `roar`, `claw`, `flame` และ `m.snd` ในท่า = เล่นเสียงนี้แทนเสียงเริ่มท่าปกติ (`Sfx.move`)
- แต่งตัวจากล็อบบี้/ห้อง: ปุ่ม `#lobbyCust`, `#roomCust` → `customizeFromOnline()` เปิด `#custom` (class `single` ซ่อนแท็บ P1/P2) กด "บันทึก" กลับไปล็อบบี้/ห้อง แล้วเรียก `Net.lookChanged()` (host = `refreshSlots`, guest = ส่ง presence `nm`+`lk`); รายชื่อนักสู้ในห้องแสดงป้ายอาชีพ

## ชาแมน + แลนเซอร์ (2026-10-12)
- `shaman`: ท่า `sm1-3` (ไม้เท้าวิญญาณ, `sm3` ระเบิดวิญญาณ `aoe`) สกิล `sk_shaman` → `summonGhost(f)` ผีนักดาบอยู่ใน `G.ghosts` (แบบเดียวกับ `G.turrets`) host เดินด้วย `stepGhosts()` ไล่ศัตรูใกล้สุดในรัศมี 16 จากชาแมน (หรือบอส) ฟันทุก `GHOST_INFO.every` เฟรมด้วย `ghostSlash()` = `GHOST_SLASH` วงหน้า + คลื่นดำ `dark` ทะลุแบบนักดาบปีศาจ; หายเมื่อครบ `GHOST_INFO.secs` หรือชาแมนตาย/เรียกตัวใหม่
- ออนไลน์: snapshot `gh:[id,x,z,rot,sw]` (`sw` = เฟรมตั้งแต่เริ่มฟัน, -1 = ไม่ฟัน) ท่าฟัน/แฟลชวาดใน `animGhosts()` (เรียกจาก `render()` ทุกเครื่อง)
- config: `skills.shaman` dmg/kb = ฟันของผี (`GHOST_SLASH`), `life` = วินาทีที่ผีอยู่
- `lancer`: หอก (`buildClassWeapon`) ท่า `ln1-2` ปกติ, `ln3` แทงทะลวงเป็นแนวยาว 5; สกิล `sk_lancer` (anim `jab`) ใช้ `lance:true` → `lanceTick()` (host) ตีทุกคนในแถบยาว `len` กว้าง `wid` ทุก `tick` เฟรม ครั้งสุดท้ายกระเด็น (kb×3.5); เอฟเฟกต์ `lanceFx()` ใน `pose`
- เสียงใหม่ `spirit`, `lance`

## เลือกทีมในห้องออนไลน์ + แก้ชื่อในรายชื่อห้อง (2026-10-12)
- รายชื่อนักสู้ในห้อง: `.srow` ให้ป้ายขึ้นบรรทัดใหม่ได้ (`flex-wrap`) ชื่อไม่ถูกบีบจนหาย
- โหมดทีมตีหิน: แถว `#teamRow` (อัตโนมัติ/แดง/น้ำเงิน) เก็บใน `G.myTeam` + localStorage `skybrawl.team`; guest ส่ง presence `tm`, host คำนวณ `Net.sides` ใน `computeSlots` (คนที่เลือกก่อน → คนอัตโนมัติ → บอท ลงฝั่งที่คนน้อยกว่า) แล้วส่ง `sd` ไปกับ `slots`
- `PRES_KEYS` ต้องมีทุก key ที่ส่งผ่าน presence (เพิ่ม `tm`, `sd`) ไม่งั้น `mergePres` ทิ้งเงียบๆ
- `Fighter` ใช้ `spec.side` ถ้ามี (ไม่มี = `idx % 2` เหมือนเดิม), `teamSpawn(side, k, m)` เรียงจุดเกิดตามลำดับในฝั่งตัวเอง

## ซามูไรพเนจร + ด่านเมืองญี่ปุ่นโบราณ (2026-10-11)
- `samurai` (key เดิม ไม่กระทบ look ที่เซฟ) เปลี่ยนชื่อเป็น "ซามูไรพเนจร" ชุดหมวกฟาง kasa + กิโมโนคราม, ดาบยาวขึ้น, `sa1/sa2` reach ไกลขึ้น, `sa3` ใหม่ = คลื่นดาบสั้น ~4 ช่อง
- สกิล `sk_samurai` "เพลงดาบร่องนภา" = ยิงกระสุนชนิดใหม่ `skyslash` (ต่อท้าย `PROJ_KINDS`, รูปจันทร์เสี้ยวใน `makeBullet`) pierce, speed 26 × life 16 ≈ โดนถึง ~9 ช่อง; dmg/kb ใน config.js = ต่อคนที่โดนคลื่น
- ด่าน `japan` (ต่อท้าย `STAGES`): `JP_OBS` (ซากุระ/โทโร), `JP_BLOCKS` (ร้านค้า h 3.4 หลบหลังได้, เวทีไม้ h 1.1 กระโดดขึ้นได้), คูน้ำ = water ของด่าน (fallY -4.5), ฉากหลังโทริอิ เจดีย์ ปราสาท ฟูจิ, `fx` = โคมกระพริบ + กลีบซากุระร่วง (SMOKE pool)

## การ์ดรูปภาพเลือกด่าน/โหมดในเมนู (2026-10-11)
- โหมด: การ์ด `.pickcard` 3 ใบ ภาพ SVG วาดในไฟล์ (ตะลุมบอน / ทีมตีหิน / ตีบอส) radio id เดิม `md-*`
- ด่าน: การ์ด `#stageGrid` radio id เดิม `sg-*`; ภาพจริงของแต่ละด่านถ่ายเองตอนอยู่หน้าเมนู (`thumbStep()` ใน `loop` ก่อน `render()`, ทีละด่าน) ด้วย `stageThumb()` = `setStage` ชั่วคราว ซ่อนทุกอย่างที่ไม่ใช่ด่าน/ทะเล/เมฆ/ไฟ เรนเดอร์ลง `WebGLRenderTarget` 640×400 → JPEG 320×200 เก็บ localStorage `skybrawl.thumb.<key>` = `THUMB_VER|dataURL` (แก้หน้าตาด่านแล้วอยากให้ภาพใหม่ = เปลี่ยน `THUMB_VER`)
- ด่านใหม่: เพิ่ม radio+label `class="pickcard"` ใน `#stageGrid` ภาพจะถูกถ่ายเองอัตโนมัติ; ก่อนถ่ายเสร็จการ์ดใช้สีท้องฟ้าของด่าน (`st.sky`) เป็นพื้นหลัง
- โหมดตีบอส: `syncStagePick()` ทำการ์ดด่านเป็นสีเทาและขึ้นข้อความว่าเล่นที่ด่านคริสต์มาสเสมอ
- ห้องออนไลน์ (2026-10-11): `#rPick` การ์ดโหมด/ด่านชุดเดียวกับเมนู (สร้างโดย `buildRoomPicks()` จากการ์ดเมนู id `rmd-*`/`rsg-*`) host กดแล้วไปตั้งค่า `<select id="rMode/rStage">` ที่ซ่อนไว้ + ยิง change เดิม; guest การ์ดเป็น disabled แสดงตาม `Net.cfg` (`syncRoomPicks()` เรียกใน `renderRoomView`); ภาพด่านถ่ายได้ทั้งตอนอยู่เมนูหรือหน้าออนไลน์

## เปลี่ยนชื่อเป็น BloxFighter + ภาพสไตล์โลกบล็อก (2026-10-11)
- ชื่อที่ผู้เล่นเห็นเปลี่ยนเป็น **BloxFighter** ทั้งหมด (title, meta/og, โลโก้, ข้อความแชร์) แต่ **ของภายในยังใช้ชื่อเดิม** เพื่อไม่ให้ของเก่าพัง: โฟลเดอร์/URL `sky-brawl/`, คีย์ localStorage `skybrawl.*`, peer id `skybrawl-v1-`, ช่อง Supabase `skybrawl-lobby`, Redirect URL ใน Supabase
- ภาพบล็อกทำที่บล็อก `/* ---------- Voxel look (BloxFighter) ---------- */` ต้น `<script>` หลัก (ก่อนสร้างโมเดลใดๆ): แทนคลาสเรขาคณิตของ THREE — `SphereGeometry` → กล่องตามกรอบของทรงกลม ×0.82 (ครึ่งทรงกลม/แถบก็ได้กล่องตามส่วนนั้น), `Cylinder/Cone/Lathe` → 4 เหลี่ยมหมุน 45°, `Torus/Ring/Circle` → สี่เหลี่ยม, `Icosahedron/Dodecahedron` → ลูกบาศก์ ของที่ต้องกลมจริงใช้ `THREE.RoundSphere` / `THREE.RoundCylinder` (ตอนนี้ใช้กับ hitbox และฟองโล่)
- ลายพิกเซล: `MeshToonMaterial.prototype.onBeforeCompile` เติมจุดสว่าง-มืดเป็นช่องละ 1/7 หน่วย (`VOX`) จากตำแหน่งในโมเดล ใช้กับ mesh ที่ถูก `mergeMeshes` ได้ (ไม่ต้องมี UV), บน WebGL2 ลายจางลงเองเมื่อช่องเล็กกว่าพิกเซล
- เส้นขอบดำ `OUT` ถูกซ่อน (`OUT.visible = false`) ถ้าอยากได้คืนลบบรรทัดนั้น
- UI: ท้าย `<style>` มีชุด `BloxFighter: blocky UI` — มุมเหลี่ยมทั้งหมด, โลโก้ฟอนต์ Silkscreen (`.logo.blox`), พื้นการ์ดลายตาราง
- `THUMB_VER` = `v2-blox` ภาพการ์ดด่านในเมนูถ่ายใหม่เองครั้งแรกที่เปิด, `og.png` ทำใหม่เป็นโลโก้ BloxFighter

## config ใหม่: fighter / forms (2026-10-11)
- `config.js` → `fighter`: `hp` (ตัวแปร `MAX_HP` แทนเลข 100 ทุกจุด: เลือดเริ่ม/เกิดใหม่ เพดานฮีล แถบเลือด แรงกระเด็นตามเลือดที่หาย เกณฑ์บอทหาฮีล), `walkSpeed` (`WALK`), `jump` (`JUMP`), `riceballHeal` (`RICE_HEAL`), `normalDamage`/`normalKnockback` = ตัวคูณทุกท่าใน `MOVES` ที่ไม่มี `skill:true` และไม่ใช่ท่าร่างแปลง
- `forms.<werewolf|tamer>`: `speed`, `scale` → `FORM_INFO`; `forms.tamer.breathRange`/`breathAngle` (องศาเต็ม) → `MOVES.dg1.range`/`arc` (ครึ่งมุม เรเดียน) และปรับระยะบอท `FORM_INFO.tamer.reach/stop` ตามระยะไฟ
- ค่าเริ่มต้นใหม่ของมังกร: speed 0.8 → 1.1, breathRange 7.5 → 9

## กันการซูมบน iPhone (2026-10-11)
- iOS Safari ไม่สน `user-scalable=no` ตั้งแต่ iOS 10: นิ้วหนึ่งบนจอย + อีกนิ้วบนปุ่ม = pinch, แตะเร็วๆ = double-tap zoom
- แก้: `body *{touch-action:manipulation}` (ไม่มี double-tap zoom แต่ยังเลื่อนได้), `#touch,#touch *,#hud{touch-action:none}`, preventDefault `gesturestart/change/end`, `touchmove` ที่มี 2 นิ้วขึ้นไป, `touchstart` บนจอย/ปุ่มกด, และ `touchend` ที่ห่างกันไม่ถึง 350ms (ยกเว้นปุ่ม/ลิงก์/ช่องกรอก); ช่องกรอกบนจอสัมผัสใช้ฟอนต์ 16px กัน iOS ซูมตอนโฟกัส
- ปุ่มควบคุมใช้ pointer events อยู่แล้ว การ preventDefault touch ไม่กระทบ

## เล่นง่ายขึ้น ขั้น 1 (2026-10-11)
- ปุ่ม `#quickPlay` "เล่นเลย" → `quickPlay()` = `startOffline('solo', {n:4, st:2, df:'easy', mode:'ffa', stage:สุ่ม})`; `startOffline(kind, over)` ใส่ทับค่าในเมนูชั่วคราว (`G.quick`) ไม่เปลี่ยนค่าที่ผู้เล่นตั้งไว้; แข่งอีกรอบ = สุ่มด่านใหม่
- ตั้งค่าในเมนูพับอยู่ใน `<details id="setD">` สรุปค่าใน `#setSum` (`setSummary()`), จำสถานะเปิด/ปิดใน localStorage `skybrawl.setOpen`
- ในเกม (`updateAids()` เรียกจาก render ตอน `G.mode === 'play'`, ออกจากเกมแล้ว `hideAids()`):
  - ลูกศรทองเด้งเหนือหัวผู้เล่นในเครื่อง (`.tag .marr` ใน `makeTag`)
  - ขอบจอแดง + "ระวังตก!" (`#edgeWarn`) เมื่อห่างขอบ < 2 ช่อง (`onDeck` margin 0/1/2) ไม่นับข้างกำแพง `kind:'edge'`
  - ลูกศรขอบจอสีตามศัตรู (`#offs`) ชี้ศัตรูที่ใกล้ที่สุด 4 คนที่อยู่นอกจอ

## เล่นง่ายขึ้น ขั้น 2: สอนเล่น (2026-10-11)
- ปุ่ม `#tutBtn` "📘 สอนเล่น 1 นาที" ในเมนู → `startTutorial()`; คนใหม่ (ไม่มี localStorage `skybrawl.tutDone` และ `Progress.stats.matches` = 0) กด "เล่นเลย" ครั้งแรกจะเข้าสอนเล่นก่อน
- ด่านเรือไททานิก ผู้เล่น + `หุ่นซ้อม` (ctrl `'net'` ไม่มี peer = ยืนนิ่ง) ชีวิตเติมเองไม่มีวันจบเกม/ไม่บันทึกผล; กล้องซูมระดับ "ปกติ" ระหว่างสอน แล้วคืนค่าเดิม
- `TUT_STEPS` 7 ขั้น: เดินไปช่องทอง → กระโดด 2 → ต่อยโดน 3 → กันหมัดหุ่น (หุ่น `startMove('jab1')` เมื่อเข้าใกล้) → ใช้สกิล → หยิบค้อน (`addItem('hammer')`) → ซัดหุ่นตกขอบ (หุ่นย้ายไปใกล้ขอบ เลือดถูกกดไว้ 20%); ตรวจใน `tutTick()` (เรียกจาก `tick`)
- `#tutBox` บอกขั้น/จุดความคืบหน้า/วิธีกด (ข้อความต่างกันระหว่างคีย์บอร์ดกับจอสัมผัส `IS_TOUCH`), บนมือถือปุ่มที่ต้องกดจะมีกรอบทองกระพริบ (`.tut-hl`), ปุ่ม "ข้ามบทสอน"; จบแล้วมีปุ่ม "เริ่มเล่นจริง" (→ `quickPlay`) / "กลับเมนู"
- ออกกลางคัน (เมนู/เริ่มเกมอื่น/ออนไลน์) → `tutClose()` ล้างทุกอย่าง
- มือถือแนวตั้ง (2026-10-11): `@media (orientation:portrait) and (max-width:600px)` HUD เป็น 2 แถว (การ์ดผู้เล่น + กล่องนักสู้ย่อ กดเปิดรายชื่อได้ / ปุ่มเมนู-กล้อง-ปุ่มจอ-ออโต้เรียงแถวเดียว), `#tbtns` แคบลงเหลือ 190px (สกิลย้ายไปเหนือปุ่มกัน) ไม่ทับจอย; `#tutBox` ใช้ `tutPlace()` วางใต้ HUD ทุก 15 เฟรม; ปุ่มหยิบเลื่อนเป็น right/bottom 104px (เดิมมุมทับปุ่มต่อยเมื่อเป็นสี่เหลี่ยม)

## เล่นง่ายขึ้น ขั้น 3: เลือกอาชีพ (2026-10-11)
- `CLASS_META[k] = [role, ดาว 1–3]` role = melee/ranged/magic/support/special (`ROLE_NAME`) **อาชีพใหม่ต้องเพิ่มบรรทัดที่นี่** (ไม่มี = ถือเป็น ระยะใกล้ ★★)
- ในหน้าแต่งตัว แถวปุ่มอาชีพเดิมถูกแทนด้วยแท็บกรอง (`CLASS_TABS`: แนะนำมือใหม่ = ดาว 1, ตาม role, ทั้งหมด; จำใน localStorage `skybrawl.clsTab`, ค่าเริ่มต้น "แนะนำมือใหม่") + การ์ด `.ccard` (data-key="outfit" ใช้ระบบ aria-pressed เดิมของ `reflectCustom` ซึ่งตอนนี้เลือกเฉพาะ `button[data-key]`)
- รูปบนการ์ด = โมเดลจริงของอาชีพ (`classThumb(k)`: `buildChibi` หน้าตา `DEF_LOOKS[0]` ไม่ใส่หมวก → ฉากแยก `clsScene` → render target 256 → JPEG 128) ถ่ายทีละ 2 รูป/เฟรมตอนเปิดหน้าแต่งตัว (`classThumbStep` ใน loop) เก็บ localStorage `skybrawl.cls.<k>` = `CLS_VER|dataURL` (แก้หน้าตาชุดแล้วอยากได้รูปใหม่ = เปลี่ยน `CLS_VER`)
- กล่องสกิลบอก "แนว: … · ความยาก ★★☆"; มือถือจอแคบ: แท็บเป็นแถวเดียวปัดได้, การ์ด 4 ต่อแถว

## ยมทูต `reaper` (2026-10-11)
- ชุดฮู้ดดำ หน้ากากกะโหลก ตาม่วง, อาวุธเคียว (`buildClassWeapon`), คอมโบ `rp1` ฟัน → `rp2` เคียวหมุน (sweep รอบตัว) → `rp3` ฟันลงลอย
- สกิล `sk_reaper` → `summonSkeleton()` สร้าง zone ชนิดใหม่ `skull` (ต่อท้าย `ZONE_KINDS` → ส่งผ่าน snapshot `zn` เดิม) ตรงศัตรูใกล้สุด/ที่ล็อก: โครงกระดูกยักษ์ (`buildSkeleton`) โผล่จากพื้น ~0.5 วินาที แล้วทุบที่เฟรม `SKULL_HIT` (34) → host `aoe(..., {root: stunT})` = ดาเมจ + มึนขยับไม่ได้; จากนั้นจมกลับ zone หายที่ 84 เฟรม; ภาพ/เอฟเฟกต์วาดใน `skullFx()` จากอายุ `G.frame - zn.born` ทุกเครื่อง
- config: `skills.reaper` → `dmg`, `stun` (วินาที → `stunT`, ตัว parser รองรับ `stun` ให้ทุกสกิลที่มี `stunT`), `radius`; `CLASS_META.reaper = ['special', 2]`
- (2026-10-11) โครงกระดูกอยู่ช่วยสู้: `stepSkeleton(zn)` (host) — หลังทุบแรก (มึนทั้งวง) อยู่ต่อ `MOVES.sk_reaper.life` วินาที (config `skills.reaper.life`) เดินช้า (.065/เฟรม) ไปหาศัตรูใกล้สุดในรัศมี 16 จากเจ้าของ หรือกลับไปหาเจ้าของ, ทุบทุก `SKULL_EVERY` (90) เฟรมเมื่อใกล้ < 3.2 = `aoe` วง 2.6 หน้าตัว แรง 80% ของ dmg กระเด็น; หมดเวลา/เจ้าของตาย/เรียกตัวใหม่ → `zn.sink` จมลง; snapshot `zn` เพิ่มช่อง 6 = `sw` หรือ 100+`sink`, ช่อง 7 = `rot` (×100)

## ชื่อกลับเป็น Sky Brawl + ด่านเกาะลอยฟ้า 128 คน + ยิงไกล (2026-10-11)
- ชื่อที่ผู้เล่นเห็นเปลี่ยนกลับเป็น **Sky Brawl** (โลโก้ `SKY<span>BRAWL</span>` สไตล์บล็อกเดิม); `og.png` ใหม่ถ่ายจากด่านเกาะลอยฟ้า
- ด่าน `skyisle` "เกาะลอยฟ้า" 124×80 ช่อง: `STAGE.walls` = ขอบเขตแข็งใน `physics` (ทุกสถานะ แม้โดนตีลอย) ไม่มีตกเกาะ แพ้ได้ทาง KO เท่านั้น; เนินขั้นบันได 3 ชั้น (`SI_HILLS`, ชั้นละ ~0.9 สูง กระโดดขึ้นได้) ×6, กำแพงซากปรักหักพัง h 3.4 บังกระสุน, ต้นไม้ใหญ่กลางเกาะ + ป่าเล็ก, หญ้าสูง `SI_BUSH` = `STAGE.bushes`: ใครยืนในหญ้าจะมองไม่เห็นจากคนที่อยู่ห่างเกิน `SI_HIDE` (4) (ซ่อนตัว/ป้ายชื่อ/วงใต้เท้า/ลูกศรขอบจอ, บอทก็มองไม่เห็น; เพื่อนร่วมทีมยังเห็น); หินทีมอยู่ x ≈ ±49 รองรับโหมดทีม (กิลวอ); "เล่นเลย" ไม่สุ่มด่านนี้
- รองรับ 128 คน (`nf` max, `ONLINE_MAX`/`ONLINE_HUMANS` เพดาน 128, config `online.maxPlayers: 128`)
- กระสุนทุกชนิดเล็งขึ้น/ลงหาเป้า (`fireProj` ตั้ง `vel.y` ตามความสูงเป้าที่อยู่ในทิศยิง) ยิงจากบนเนินโดนคนข้างล่างได้
- อาชีพสายเวท/ปืน (`POKE_KIND`: mage wizard frost volt necro druid bard priest acolyte crusader gundam alchemist spacecop soldier) กดต่อยตอนไม่มีศัตรูในระยะ 2.8 แต่มีในระยะ 13 → ยิงระยะไกล `rpk` (ร่ายเวท) / `rps` (ยิง) ดาเมจ 4 ต่อนัด; มีศัตรูประชิด = คอมโบเดิม
- บอท: อาชีพยิงไกลยืนห่าง 6.5 (`POKE_KIND`) และถอยหนีเมื่อโดนประชิด (`ai.kite` สุ่มทุก 45 เฟรม) ระยะโจมตีบอท 11; อาชีพประชิดเข้าตีใกล้เหมือนเดิม
- (2026-10-11) **ยกเลิก** ระบบยิงไกลอัตโนมัติของสายเวท/ปืน (`POKE_KIND`, `rpk`/`rps`) และการยืนห่าง/ถอยหนีของบอทสายนั้น ตามที่ผู้เล่นขอ (ยิงรัวเกินไปและตีไม่ถึงกัน) กลับเป็นคอมโบเดิม; ยังเก็บการเล็งกระสุนขึ้น/ลงหาเป้า (ยิงจากเนิน) ไว้

## เล็งอัตโนมัติ (2026-10-11)
- `G.autoLock` (ค่าเริ่มต้นเปิด, localStorage `skybrawl.autoLock`) ตั้งได้ในเมนู "ตั้งค่าเกม" (`input[name=al]`) และปุ่ม HUD `#aimBtn` → `setAutoLock()`
- `autoLockStep(f)` (ทุก 6 เฟรม ใน `stepFighter`): ล็อกศัตรูใกล้สุดใน 14 ช่องที่ `lockable` และไม่ได้ซ่อนในหญ้าสูงไกลเกิน `SI_HIDE`; เปลี่ยนเป้าเมื่อเป้าใหม่ใกล้กว่าเป้าเดิมชัดเจน (< 70%); กดล็อกเอง (`cycleLock`) แล้วเป้านั้นอยู่ 4 วินาที (`f.lockManual`); ปิดออโต้แล้วเป้าที่ออโต้เลือกจะถูกปลด (เป้าที่กดเองยังอยู่)
- ใช้กับผู้เล่นในเครื่อง (`p1`/`p2`, ไม่ใช่ตอนเปิดออโต้เล่นแทน) และ guest ออนไลน์: แถว input ของ guest ช่อง 8 = ค่า autoLock → host `f.netAuto`
- (2026-10-11) คูลดาวน์สกิลขั้นต่ำ 5 วินาที: `MIN_SKILL_CD = 300` ใน `applyConfig` (ตั้ง `skillCooldown`/`skills.*.cd` ต่ำกว่านี้ก็ไม่เร็วกว่า 5 วินาที); ปุ่ม "เล่นเลย" = นักสู้ 8 ตัว (ผู้เล่น + บอทง่าย 7) ด่านสุ่ม

## ระบบวิ่ง (2026-10-11)
- กดค้าง Shift (P2: N / Numpad7 — เดิมเป็น Numpad4 ซึ่งชนกับปุ่มสกิล แก้แล้ว 2026-10-12) หรือปุ่มสีฟ้า "วิ่ง" บนมือถือ (`input.sprint`, `touch.sprint` ไม่มี latch) → ความเร็วเดิน × `SPRINT` (1.6) เฉพาะตอนมีทิศทาง อยู่บนพื้น ไม่ติดสถานะชา; แถบแรง `f.stam` 0–100 ลดตาม `SPRINT_SECS` (3 วินาทีเต็มแถบ) พัก 40 เฟรมก่อนเริ่มฟื้น (ยืน .55/เฟรม เดิน .33 อย่างอื่น .2); หมดแล้ว `f.exh` = วิ่งไม่ได้จนแรงกลับ 25%
- config.js → `fighter.sprintSpeed`, `fighter.sprintSeconds`
- ออนไลน์: แถว input ช่อง 9 = กดวิ่ง (host คำนวณ), snapshot ช่อง 18 = แรง (guest แสดงแถบ); บอทวิ่งเมื่อเป้าอยู่ไกลเกิน 8 ช่องและแรง > 35%
- ภาพ: ขาวิ่งเร็วขึ้น ตัวโน้มไปหน้า มีฝุ่น (ดูจากความเร็วจริง ทุกเครื่องเห็นเหมือนกัน); HUD: แถบฟ้า `.stam` ใต้แถบสกิล (ส้มเมื่อหมดแรง); แนวตั้ง: ปุ่มวิ่งอยู่เหนือปุ่มหยิบ

## บัพ อัลเคมิสต์ + เบอร์เซิร์กเกอร์ (2026-10-11)
- อัลเคมิสต์ `sk_alchemist` → `lobFlask()`: ขวดกรดโค้ง (กระสุนมี `b.grav`, `stepBullets` ลด `vel.y` ทุกเฟรม) เล็งไปเป้า/ที่ล็อก (ไม่มีเป้า = 7 ช่องข้างหน้า) ตกพื้น (y ≤ .25) หรือโดนตัวคนก่อน → `burst()` ระเบิดวง `blast:3.5` (กว้าง 7 ช่อง) ทุกคนในวงโดนดาเมจ; guest เห็นเอฟเฟกต์ระเบิดตอนกระสุน acid หายจาก snapshot
- เบอร์เซิร์กเกอร์ (`f.rage`, 6 วินาที): ดูดเลือดเท่าดาเมจจริงที่ทำได้ (`rageSteal` ใน `applyHit`, รวมตอนโดนกัน 15% และตีบอส), ตีเร็วขึ้น (`rageMove()` ลดเวลาเริ่มท่า ×0.7 และพักท่า ×0.6 สำเนาของท่า ยกเว้นสกิล; guest ใช้กฎเดียวกันตามบิตคลั่ง), วิ่งเร็ว ×1.4 (เดิม 1.25), ตาแดง + ออร่าแดง + วงแดงที่พื้น (`vis.rageFx` สร้างเฉพาะอาชีพนี้) + ประกายแดง

## รางวัลล็อกอินรายวัน (2026-10-12)
- ฝั่งเซิร์ฟเวอร์: `supabase-daily.sql` (ต้องรันใน Supabase SQL Editor ครั้งเดียว) ตาราง `daily_login` (อ่านได้แค่แถวตัวเอง ไม่มี policy เขียน) + `daily_status()` / `claim_daily()` (security definer, วันที่ตามเวลาไทย `Asia/Bangkok` ฝั่งเซิร์ฟเวอร์ เปลี่ยนวันในเครื่องโกงไม่ได้) ต่อเนื่องเมื่อ `last_day = วันนี้ − 1` ไม่งั้นเริ่ม 1; ขาดวันแล้ว status คืน streak 0
- รางวัลวนทุก 7 วัน: `t:regular`, `h:halo`, `t:steady`, `h:tophat`, `t:guardian`, `h:flower`, `h:star` (+ `t:legend7` วันที่ 7); รวมครบ 14 / 30 วัน → `t:d14` / `t:d30` เก็บใน `unlocks text[]`
- ฝั่งเกม: `Daily` (cache `skybrawl.daily` ผูก uid), `renderDaily()`, หน้าต่าง `#daily` (ปุ่ม `#dailyBtn` ในเมนู + จุดแดง, เด้งเองครั้งแรกที่เข้าเมนูถ้ายังไม่รับ), `toast()`; ถ้ายังไม่ได้รัน SQL (RPC ไม่เจอ) ปุ่มซ่อนเอง
- หมวกใหม่ต่อท้าย `HATS` (index เดิมไม่เลื่อน): `halo`, `tophat`, `flower`, `star`; `DAILY_HATS`/`HAT_FREE` (บอทไม่สุ่มได้), `FLOAT_HATS` (halo/star ใส่คู่ชุดอาชีพที่มีหมวกเกราะได้ ยกสูงขึ้น .3)
- ฉายา `TITLES`/`TITLE_K`: `look.title` ส่งผ่านเครือข่ายเป็นช่อง 9 ของ `encLook` (index 8; presence slice เป็น 9) แสดงเป็น `.tag .tt` « ฉายา » เหนือชื่อ
- หน้าแต่งตัว: แถว "ฉายาเหนือหัว" ของที่ยังไม่ได้ขึ้น 🔒 กดแล้วบอกว่าได้จากวันไหน (`lockedItem`/`lockedHint`); `Daily.fixLooks()` ถอดของที่บัญชีนี้ไม่มีออก (เช่นสลับบัญชี)
- ของแต่งตัวเป็นแค่หน้าตา ไม่ตรวจฝั่งเซิร์ฟเวอร์ตอนใส่ (คนแก้โค้ดเองใส่ได้ แต่ไม่มีผลกับพลัง)

## เบียวมังกร `dragonblade` (2026-10-15)
- อาชีพแปลงร่างตัวที่ 3 (ต่อจาก werewolf/tamer) ใช้ระบบ `FORM_INFO` เดิม: `FORM_INFO.dragonblade` {secs 8, scale 1.15, speed 1.2, atk `db1`}; สกิล `sk_dragonblade` (`form:true` → `startForm`) · cd 840 เฟรม + เวลาแปลงร่าง
- ร่างปกติ: ดาบคู่ (`buildClassWeapon` + `buildOffhand` case `dragonblade`), คอมโบ `dk1`–`dk3`; หน้าตา `OUTFITS.dragonblade` (ต่อท้ายสุด): หมวกเกราะดำ พระจันทร์เสี้ยวทอง (กล่องบาง 3 ท่อนต่อข้าง เพราะ voxel shim ทำ Torus แบบส่วนโค้งเพี้ยน) แผ่นกันคอเฉพาะหลัง/ข้าง ผ้าปิดตาขวา เสื้อคลุมกรมท่า
- ร่างแปลง: `attachBladeForm()` ห้าดาบแผ่เป็นพัด (มือขวา 3 มือซ้าย 2 มีขอบเรืองฟ้า) + ตาเรืองฟ้า + ออร่า (`F.aura` RoundSphere) + วงที่เท้า (`F.ring`); `poseForm` มีสาขา `F.blades` (ซ่อนดาบคู่ ท่ายืนกางแขน ประกายฟ้าลอยขึ้น) และ `F.tail` กัน null แล้ว
- ท่าแปลงร่าง `db1`/`db2` ฟาดกวาดหน้า (`sweep`, rad 2.3) · `db3` หมุนรอบตัว rad 3.4 ลอย (`fmul` 1.5) · ธง `blades:true` → `formMoveFx` วาดรอยดาบสีฟ้าเป็นพัด (ท่าหมุน = วงเต็ม) บนทุกเครื่องจาก moveKey
- `config.js`: `classes.dragonblade`, `skills.dragonblade {cd, form, dmg, kb}`, `forms.dragonblade {speed, scale}` · ทดสอบแล้ว: แปลงร่าง/ฟาดโดน (12 / ท่าปิด 18), บอท 3 ตัว 3000 เฟรมแปลงร่างและใช้ท่าห้าดาบเอง ไม่มี error · ยังไม่ได้ทดสอบออนไลน์สองแท็บ (ใช้บิตแปลงร่าง 128 เดิม)

## แยกไฟล์ (1.6.0 · 2026-10-15)
- `index.html` เหลือแค่ HTML · CSS ย้ายไป `style.css` · โค้ดเกมแยกเป็น 43 ไฟล์ใน `js/` (รวม `js/stages/`) ด้วยการตัดแบ่งเฉยๆ ไม่ได้แก้โค้ด: เอา IIFE หลักออก ตัวแปรระดับบนสุด (`const`/`let`/`function`) จึงเป็น global ที่ทุกไฟล์ใช้ร่วมกันแบบ classic script ตามลำดับแท็กใน `index.html` (`voxel.js` ยังเป็น IIFE ของตัวเอง) · หน้าที่ของแต่ละไฟล์ดู [`js/README.md`](js/README.md)
- จุดที่ต้องย้าย: `refreshFormDescs()` ไปอยู่ท้าย `moves.js` เพราะ `config-apply.js` เรียกตอนโหลด (เดิมใช้ได้เพราะ function hoisting ในไฟล์เดียว) · กฎ: โค้ดที่รันตอนโหลดห้ามเรียกฟังก์ชันจากไฟล์ที่โหลดทีหลัง
- ทุกแท็กมี `?v=1.6.0` กันแคชปนเวอร์ชัน → อัปเดตครั้งต่อไปต้องเปลี่ยนเลขนี้ทุกแท็ก
- ตรวจแล้ว: ชื่อ global ไม่ชนกับ property ของ window · ผลจำลองบอท 10 ด่าน + ทีม + บอส (Math.random แบบ seed, `G.frame = 0`, 1500 เฟรม) ตรงกับฉบับไฟล์เดียวทุกค่า · ออนไลน์สองแท็บ host/guest เชื่อมตรงได้ เข้าเกม และ guest เห็นเบียวมังกรแปลงร่าง (ออร่า/ขนาด) · สอนเล่น · มือถือแนวตั้งไม่ล้นจอ
- ทดสอบอัตโนมัติ: ไม่ต้องทำ `_t.html` + `window.__SB` แล้ว เปิดหน้าเกมแล้วเรียก `G`, `tick()`, `startOffline()` จาก console ได้ตรงๆ · ถ้าจะเทียบผลจำลองให้ตั้ง `G.frame = 0` ก่อนทุกแมตช์ (`G.frame` ไม่ reset เอง)

## ด่านภูเขาไฟระเบิด `volcano` (1.7.0 · 2026-10-15)
- ไฟล์ `js/stages/volcano.js` + รายการใน `stages/registry.js` (ต่อท้ายสุด) + การ์ด/ตัวเลือกห้องใน `index.html` · ลานหินกลมรัศมี 22 กลางทะเลลาวา แบ่ง 5 วง (`VOL_RADII` 22/18/14.5/11/8) แต่ละวงเป็น group ของ tile ที่ merge แยกกัน มี `glow` (RingGeometry) เป็นตัวเตือน
- กลไก: `LAVA {sunk, t, match}` ทุก `VOL_PHASE` (1500 เฟรม = 25 วิ) วงนอกถล่ม เตือนก่อน `VOL_WARN` (5 วิ: วงเรืองส้ม + banner + ภูเขาไฟพ่น) จมให้เห็น `VOL_SINK` เฟรม · `inside = volInside`: ถามด้วย margin > .6 (บอท/จุดเกิด/เกิดใหม่/แถบเตือนขอบจอ) ระหว่างเตือนจะนับวงที่กำลังจะถล่มเป็นลาวาแล้ว ส่วนฟิสิกส์ (margin ≤ .45) ใช้รัศมีจริง
- หินภูเขาไฟ: `dropLavaBomb()` ใช้ bomb แบบ meteor (`owner:null`, `LAVA_BOMB`) ตกทุก 40 เฟรมระหว่างเตือน และทุก 150 เฟรมเมื่อเหลือวงสุดท้าย · มีจุดแดงใต้ลูกที่กำลังตก
- โหมดทีม: พื้นไม่ถล่ม (หินจักรพรรดิอยู่บนวงนอก) มีแค่หินภูเขาไฟทุก 4 วินาที · สอนเล่น: ไม่มีลาวา
- เสาออบซิเดียน (`VOL_OBS`) อยู่บนวง 1 พอวงจม เอาออกจากรายการชน (array เดียวกับ `FUNNELS`)
- ออนไลน์: host เป็นเจ้าของ `LAVA` ส่ง `sn.lv = [sunk, t]` ใน snapshot (`relay.js` hostSend/applySnap) guest นับ `t` ต่อเองระหว่าง snapshot · ตกลาวา: `STAGE.lavaFall` → `splash()` ใน `fx.js` เป็นไฟแทนน้ำ
- ทดสอบแล้ว: บอท 12 ตัว 3 ชีวิตจบใน ~95 วิ (ถล่ม 3 ครั้ง ไม่มี error), ระหว่างเตือนหินตก 6 ลูกระเบิดจริง, เสาหายตามวง, host+guest สองแท็บ guest เห็นวงจมตรงกัน
- ทุกแท็กใน `index.html` เปลี่ยนเป็น `?v=1.7.0`

## สีหน้าตัวละคร + รูปหน้าบน HUD (1.7.1 · 2026-10-15)
- หัวตัวละครมี 3 หน้า (`vis.face = {eyes, ouch, ko}`): ตาปกติ (`buildEyes` ใส่ group แยกแล้ว ไม่ถูก merge กับหัว), หน้าโดนตี `buildOuchFace()` (ตาปูดตาดำจุดเล็ก คิ้วยก อ้าปากเห็นฟัน+ลิ้น หยดเหงื่อ), หน้าน็อก `buildKoFace()` (ตา × ลิ้นแลบ) ทั้งคู่อยู่ใน `looks.js`
- `faceMood(f)` ใน `render.js`: 'ko' เมื่อ state ko/out หรือหมดชีวิต · 'ouch' เมื่อ hitstun / tumble / down 40 เฟรมแรก · นอกนั้น 'normal' — `pose()` สลับหน้าทุกเฟรม (guest เห็นด้วยเพราะใช้ state ที่ซิงก์อยู่แล้ว ไม่ต้องแก้ net)
- HUD: `facePortrait(look, mood)` ใน `customize.js` เรนเดอร์หัวตัวละคร 160px พื้นโปร่งใส แคชตาม encLook+mood · `buildHud` ใส่ `<img class="pface">` ซ้ายสุดของการ์ด (พื้นสีทีม `--c`) · `updateHud` สลับรูปตามอารมณ์ + class `.ouch` (พื้นแดง สั่น) / `.ko` (ซีดเทา)
- CSS: `.pcard` เป็น grid 2 คอลัมน์ กว้างขึ้น (เดสก์ท็อป min(370px,48vw), มือถือแนวนอน min(228px,31vw))
- ทุกแท็ก `?v=1.7.1`

## อีโมต + ท่าฉลองตอนชนะ + ปุ่ม HUD บนคอม (1.8.0 · 2026-10-15)
- ไฟล์ใหม่ `js/emotes.js` (โหลดหลัง `hud.js`): `EMOTES` 8 ตัวให้เลือก + 🏆 ของผู้ชนะ · `doEmote(f, id)` (คูลดาวน์ 50 เฟรม แสดง 150 เฟรม) · `emoteLocal(id)` ปุ่ม 1–8 (`input.js`) หรือแผง `#emoPanel` จากปุ่ม 😀 (`settings.js`) · ฟองคำพูดอยู่ในป้ายชื่อ (`syncEmoteTag` เรียกจาก `updateTags`)
- บอท: `botEmotes` ใน `loseStock` (คนน็อกได้หัวเราะ/โชว์กล้าม/GG 35%, คนโดนร้องไห้/โมโห 25%)
- ออนไลน์: guest ส่งตัวนับ + id อีโมตใน input row `in[10], in[11]` (host เทียบกับ `f.ne`) · host ส่งฟองของทุกคนใน snapshot `f[19] = emoSeq*16 + id` (guest เทียบกับ `f.emoCode`) · เวอร์ชันเก่าไม่อ่านค่าเหล่านี้
- ชนะ: state ใหม่ `'win'` ต่อท้าย `STATES` · ระหว่าง `G.endT` ทุกคนหยุดรับปุ่ม/บอทไม่คิด, `stepVictory()` เปลี่ยนผู้ชนะ (FFA = G.winner, ทีม = ฝั่ง winTeam ที่ยังอยู่, บอส = ทุกคนที่รอด) เป็น 'win' หันหน้าเข้ากล้อง + 🏆 · `animWin` 3 ท่าตาม `f.idx % 3` (กระโดดชูแขน / ชกฟ้า / หมุนแล้วโพส) + กระดาษสี · หน้า 'joy' (`buildJoyFace` ตา ^ ^ ยิ้มกว้าง) · กล้องซูมเข้าผู้ชนะ (`camTargets` เลือกคนที่ state 'win')
- เวลาก่อนขึ้นหน้าสรุปผลยาวขึ้น: FFA 100 → 180 เฟรม, ทีม 140 → 200, บอส 170 → 200
- คอม (pointer:fine, กว้าง > 600, สูง > 520): ปุ่ม HUD เรียงแถวเดียวที่ขอบล่างกลางจอ (`#hudBtns` fixed) แผงอีโมตเปิดขึ้นด้านบน · มือถือเหมือนเดิม
- ทดสอบแล้ว: อีโมตออฟไลน์ + host↔guest สองทิศทาง, guest เห็นท่าฉลอง/หน้ายิ้ม/🏆/กล้องตามผู้ชนะ, โหมดทีมบอท 8 ตัว ผู้ชนะ 4 คนฉลอง ไม่มี error
- ทุกแท็ก `?v=1.8.0`

## บอทใช้อีโมต (1.8.1 · 2026-10-15)
- `emotes.js`: `botEmoteTick()` (เรียกใน `tick` เมื่อยังไม่จบแมตช์, host/ออฟไลน์เท่านั้น) — ทักทายตอนนับถอยหลัง, เลือด < 30% ร้องไห้/ไหว้, โดนแรง ≥ 15 โมโห, ยั่วเป้าที่กำลังมึน · `botEmotes` ตอน KO (คนน็อกได้ 45%, คนโดน 35%, เพื่อนร่วมทีมใกล้ๆ ชม 20%)
- ตอบอีโมต: `doEmote` เรียก `scheduleReplies` ให้บอทใกล้สุด 2 ตัวในระยะ 12 ตอบ (55%) หลัง 0.5–1.2 วิ ตาม `EMO_REPLY` (เช่น GG → GG, 🙏 → 👍, 😂 → 😡/😂) · คำตอบไม่ทำให้เกิดการตอบต่อ (`isReply`)
- กันรก: `botMay` บอทแต่ละตัวพัก 5–9 วิ และทุกบอทรวมกันได้ไม่เกิน 1 ครั้งต่อ ~0.4 วิ (`G.botEmoT`) · ปรับความถี่ได้ที่ `config.js` → `fighter.botEmotes` (0 ปิด, 1 ปกติ, สูงสุด 3)
- ทดสอบ: บอท 8 ตัว 60 วิ อีโมต 29 ครั้ง ครบทุกแบบ ไม่มี error, บอทตอบอีโมตของผู้เล่น · `?v=1.8.1`

## แชทวิ่งบนจอ (Niconico) + บอทพิมพ์แชท (1.9.0 · 2026-10-15)
- ไฟล์ใหม่ `js/chat.js` (หลัง `emotes.js`): ข้อความวิ่งขวา→ซ้ายในครึ่งบนของจอ (`#nico`, Web Animations, เลือก lane ที่ว่างก่อน, สูงสุด 40 ข้อความ, REDUCE = ค่อยๆ โผล่ที่ซ้ายแทนการวิ่ง) · ชื่อคนพิมพ์ตัวเล็กสีทีมนำหน้า · ข้อความตัวเองสีทอง
- พิมพ์: Enter (`input.js`) หรือชิป 💬 → `#mChatBar` (ไม่ชนกับแชทล็อบบี้ `#chatForm/#chatIn`) · ยาวสุด 40 ตัว · ส่งได้ทุก 1.2 วิ · ปุ่ม "แชท: แสดง/ซ่อน" (localStorage `skybrawl.chatHidden`) · ข้อความแสดงด้วย textContent เสมอ · ยังไม่มีตัวกรองคำหยาบ
- ออนไลน์: guest ส่ง presence `ch:[seq, text, Net.epoch]` (เพิ่ม 'ch' ใน `PRES_KEYS` และ whitelist ของ `onGuestConn`) host รับเฉพาะ epoch ปัจจุบัน แล้ว `postChat` · host ส่ง `sn.ct = [[seq, idx, text]...]` ของ 4 วิล่าสุด · guest แสดงเฉพาะ seq ใหม่ และข้ามข้อความตัวเองที่ส่งไปแล้ว (`CHAT.pending`)
- บอท (host/ออฟไลน์): `chatTick` ทุกเฟรม — ทักตอนนับถอยหลัง, ด่านภูเขาไฟตอนเตือนลาวา, เลือด < 30%, โดนแรง ≥ 18, คุยเล่นทั่วไป (มีประโยคเฉพาะด่าน `STAGE_LINES`) · `botChatKO` ใน `loseStock` · `chatOnWin` ตอนชนะ (คนแพ้บางตัวพิมพ์ gg) · `botsAnswer` ตอบแชทคน 1–2 ตัวตาม `BOT_REPLIES` (gg, 555, หวัดดี, ขอโทษ, เก่ง, โกง, บอท, คำถาม…) หน่วง 1–3 วิเหมือนกำลังพิมพ์ · บอทแต่ละตัวพัก 9–16 วิ รวมทุกตัว ~1 ข้อความต่อ 1–2 วิ · `config.js` → `fighter.botChat` (0 ปิด)
- ทดสอบ: บอท 8 ตัว 60 วิ 14 ข้อความ, พิมพ์ "หวัดดีทุกคน gg" บอทตอบ "gg wp", host↔guest สองทิศทาง ไม่ซ้ำ, มือถือแนวนอนช่องพิมพ์อยู่บน ไม่มี error · `?v=1.9.0`

## บอทคุยโต้ตอบ (1.9.1 · 2026-10-16)
- ไฟล์ใหม่ `js/chatbot.js` (หลัง `chat.js`) = สมองแชทบอททั้งหมด · `chat.js` เหลือแค่แสดงผล/ส่ง/ออนไลน์ และ `chatTick` ที่เรียก `botChatTick()`
- คลังประโยค `BOT_LINES` ~200 ประโยค แยกสถานการณ์: start, kill, killAgain (ฆ่าคนเดิมซ้ำ), revenge (เอาคืนคนที่เคยฆ่าเรา), died/diedTo (@คนฆ่า), low, hit, idle, lava, win, lose, streak (ทุก 3 kill), lastTwo (เหลือ 2 คน), respawn, out/watch (บอทตกรอบแล้วดูต่อ) + `STAGE_LINES` · ตัวแปรในประโยค {to} {me} {cls} {kos} {stage} {lead} {ans}
- ตอบแชทคน `botsAnswer`: เข้าใจเจตนาจาก `BOT_INTENTS` (regex เรียงลำดับสำคัญ: gg, บาย, ทักทาย, ขอบคุณ, ขอโทษ, ด่า, โกง, บอท?, สอน/ทริค (ตอบปุ่มจริงจาก `BOT_TIPS`), ชม, อาชีพ (ตอบอาชีพตัวเองจริง), คะแนน/ใครนำ (ใช้ kos จริง), 1v1, ทีม, แลค, ชื่อ, อายุ, อยู่ไหน, ข้าว, ด่าน, ชอบ, 555, ง่วง, ตอบรับ, คำถามทั่วไป → `BOT_FALLBACK`)
  - ใครตอบ: เอ่ยชื่อบอท (@ชื่อ หรือชื่อ ≥ 4 ตัว) → ตัวนั้นตอบ · ถ้ามีบทสนทนาค้างกับบอทตัวไหน (`CHAT.threads` 11 วิ) ตัวเดิมตอบต่อ · ทักทาย/gg/บาย ถึงทุกคน → 2–3 ตัว · นอกนั้น 1–2 ตัว · ใส่ @ชื่อเรานำหน้า ~45%
  - ด่าหรือท้า 1v1 → บอทตั้งเป้าเป็นคนพิมพ์จริง (`ai.tgt`, 15 วิ)
  - บอทชวนคุยเอง `botAsk` ทุก 40–80 วิ (ถ้ามีคนเล่น): ถามอาชีพ/มาจากไหน/เล่นนานยัง/1v1/ชอบด่านไหน → คำตอบถัดไปของคนนั้นตีความตามหัวข้อ (`ANSWER_TO`, เช่นจับชื่ออาชีพในข้อความ, ตอบ "ได้" กับ 1v1 = บอทมาหาจริง)
  - บอทคุยกันเอง: ประโยค idle บางครั้งมีบอทอีกตัวตอบ (ชั้นเดียว)
- ความเป็นคน: หน่วงตามความยาวข้อความเหมือนพิมพ์, ลากเสียงท้าย, เติม 555 · ห้ามบอทพูดประโยคซ้ำกับที่อยู่บนจอ (`queueBotLine`)
- ทดสอบ: 8 บอท ~12 ข้อความ/นาที ไม่มี error · "หวัดดีทุกคน" ตอบ 2 ตัว · "สอนหน่อย" ตอบทริคปุ่ม · "@ชื่อ เล่นอาชีพอะไร" ตัวนั้นตอบอาชีพจริง · "ชื่อบอท 1v1 ไหม" → ai.tgt = เรา · บอทถาม "มาจากไหน" ตอบ "กรุงเทพ" → "ใกล้กันเลย" · `?v=1.9.1`

## 1.9.2 · 2026-10-16 — ท้า 1v1 ติดจริง
- เดิมบอทตั้งเป้าเป็นคนท้าแต่ `bots.js` เลือกเป้าใหม่ทันทีที่เราล้ม (state ko) → ตอนนี้ `ai.duel` / `ai.duelT` (15 วิ) ทำให้เลือกเราเป็นเป้าก่อนเสมอระหว่างนั้น (รีเซ็ตใน initAI) · ทดสอบ 5 รอบ บอทเล็งเราเฉลี่ย ~70% ของเวลา (ที่เหลือคือบอทเองตกขอบ/ไม่ตอบ) · `?v=1.9.2`

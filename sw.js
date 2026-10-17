// Sky Brawl · sw.js — service worker ของแอป (PWA): เปิดเร็วขึ้นและเปิดหน้าเกมได้แม้เน็ตหลุด
// Game files carry ?v=<version> (index.html), so a versioned file never changes: it is served from the cache.
// The page itself and unversioned files (config.js, manifest) always try the network first, so updates show up
// on the next visit. Supabase, PeerJS and every other server are never touched (the game needs them live).
const CACHE = 'skybrawl-v1';
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|unpkg\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

async function networkFirst(req){
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch (e) {
    return (await c.match(req, {ignoreSearch:req.mode === 'navigate'})) || Response.error();
  }
}
async function cacheFirst(req){
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque'){
    c.put(req, res.clone());
    // Drop older versions of the same game file
    const u = new URL(req.url);
    if (u.origin === location.origin) for (const k of await c.keys()){
      const o = new URL(k.url);
      if (o.pathname === u.pathname && o.search !== u.search) c.delete(k);
    }
  }
  return res;
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const same = u.origin === location.origin;
  if (!same && !CDN.test(req.url)) return;
  e.respondWith(same && (req.mode === 'navigate' || !u.searchParams.has('v')) ? networkFirst(req) : cacheFirst(req));
});

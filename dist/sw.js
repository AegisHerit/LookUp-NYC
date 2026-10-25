// Offline support for LookUp NYC.
// Pages, scripts and styles: try the network first so updates show up, fall back to the saved copy.
// Photos and icons: use the saved copy first for speed.
// Audio is left to the browser, since players request it in pieces.
const CACHE = 'lookup-v24';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'audio-ui.js', 'audio-engine.js', 'routes.js', 'lookup.js', 'story.js', 'historic.js', 'data.js', 'credits.js', 'sms.js', 'share.js', 'persona.js',
  'manifest.webmanifest', 'assets/leaflet.js', 'assets/leaflet.css', 'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png',
  ...['flatiron', 'grandcentral', 'haughwout', 'jefferson', 'nypl', 'plaza', 'puck', 'washington',
    'oldcathedral', 'germania', 'bayard', 'basquiat', 'publictheater'].flatMap(id => [`assets/${id}.webp`, `assets/${id}-2.webp`])];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range') || req.url.endsWith('.mp3')) return;
  const url = new URL(req.url);
  const sameSite = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameSite && !isFont) return;
  const cacheFirst = isFont || /\.(webp|png|svg)$/.test(url.pathname);
  e.respondWith(cacheFirst ? fromCache(req) : fromNetwork(req));
});
async function fromCache(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') (await caches.open(CACHE)).put(req, res.clone());
  return res;
}
async function fromNetwork(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await caches.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' && await caches.match('index.html'));
    if (hit) return hit;
    throw err;
  }
}

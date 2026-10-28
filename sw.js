// Keeps the game on the phone so it starts without internet (made by web_extras.py).
// The page itself: online first (so updates arrive), stored copy when offline. Everything else: stored copy first.
const STORE = "bgcoach-1793212672";
const FILES = ["./", "index.html", "manifest.json", "favicon.png", "icon-192.png", "icon-512.png", "game-1793212672.tar.gz", "cdn/0.9.3/pythons.js", "cdn/0.9.3/empty.html", "cdn/0.9.3/empty.ogg", "cdn/0.9.3/cpythonrc.py", "cdn/0.9.3/cpython312/main.js", "cdn/0.9.3/cpython312/main.data", "cdn/0.9.3/cpython312/main.wasm", "cdn/vtx.js", "cdn/vt/xterm.css", "cdn/vt/xterm.js", "cdn/vt/xterm-addon-image.js", "cdn/index-0.9.3-cp312.json", "cdn/cp312/pygame_ce-2.5.7-cp312-cp312-wasm32_bi_emscripten.whl"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(STORE).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(keys =>
  Promise.all(keys.filter(k => k !== STORE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.origin !== location.origin) {   // the engine still asks pygbag's CDN for a few files: answer with our copies
    if (!url.pathname.startsWith("/cdn/")) return;
    const local = new URL("cdn/" + url.pathname.slice(5), self.registration.scope).href;
    e.respondWith(caches.match(local).then(hit => hit || fetch(req)));
    return;
  }
  const home = new URL("./", self.registration.scope).pathname;
  if (req.mode === "navigate" && (url.pathname === home || url.pathname === home + "index.html")) {   // not the frame inside
    const stored = () => caches.match("./");   // also when the answer is an error page (no signal, Wi-Fi login...)
    e.respondWith(fetch(req).then(r => {
      if (!r.ok) return stored().then(hit => hit || r);
      const copy = r.clone(); caches.open(STORE).then(c => c.put("./", copy)); return r;
    }).catch(stored));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(STORE).then(c => c.put(req, copy)); }
    return r;
  })));
});

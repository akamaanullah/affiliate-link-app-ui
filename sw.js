/* Network-first cache. URLs are resolved from this script so the same
   files work at / locally and at /affiliate-link-app-ui/ on GitHub Pages. */
var CACHE = "northline-v2";
var BASE = new URL("./", self.location);
function abs(path) {
  return new URL(path, BASE).href;
}
var ASSETS = [
  "./",
  "./index.html",
  "./app.html",
  "./admin.html",
  "./manifest.json",
  "./css/app.css",
  "./js/boot.js",
  "./js/config.js",
  "./js/icons.js",
  "./js/links.js",
  "./js/data.js",
  "./js/store.js",
  "./js/ui.js",
  "./js/login.js",
  "./js/app.js",
  "./js/admin.js",
  "./js/pwa.js",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
].map(abs);

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(ASSETS);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && res.type === "basic") {
      var copy = res.clone();
      caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) {
      return hit || caches.match(abs("./index.html"));
    });
  }));
});

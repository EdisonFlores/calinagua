const CACHE_NAME = "calinagua-online-v32";
const OFFLINE_URL = "./offline.html";
const CORE_ASSETS = [
  OFFLINE_URL,
  "./manifest.webmanifest",
  "./img/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (isCoreAsset(event.request.url)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || offlineResponse()))
  );
});

function isCoreAsset(url) {
  return CORE_ASSETS.some((asset) => new URL(asset, self.location.href).href === url);
}

function offlineResponse() {
  return new Response("CALINAGUA requiere conexion a internet.", {
    status: 503,
    statusText: "Offline",
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

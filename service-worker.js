// Service worker orientado a PWA online: cachea solo recursos basicos y avisa si no hay conexion.
const CACHE_NAME = "calinagua-online-v33";
const OFFLINE_URL = "./offline.html";
const CORE_ASSETS = [
  OFFLINE_URL,
  "./manifest.webmanifest",
  "./img/logo.png",
  "./img/icons/icon-192.png",
  "./img/icons/icon-512.png",
  "./img/icons/maskable-512.png"
];

// Evento install: guarda los recursos minimos necesarios para mostrar la pantalla offline.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

// Evento activate: elimina caches antiguos y toma control inmediato de las paginas abiertas.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Evento fetch: prioriza internet y usa el cache solo como respaldo cuando no hay conexion.
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

// Funcion isCoreAsset: comprueba si una URL pertenece al cache basico.
function isCoreAsset(url) {
  return CORE_ASSETS.some((asset) => new URL(asset, self.location.href).href === url);
}

// Funcion offlineResponse: responde texto simple cuando no hay conexion.
function offlineResponse() {
  return new Response("CALINAGUA requiere conexion a internet.", {
    status: 503,
    statusText: "Offline",
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

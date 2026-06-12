// Subir VERSION en cada cambio del SW para purgar cachés viejas en clientes.
const VERSION = "v4";
const CACHE = `pinturas-bfm-${VERSION}`;

self.addEventListener("install", () => {
  // El nuevo SW toma control de inmediato, sin esperar a que cierren pestañas.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Archivos con hash inmutable (JS/CSS/fuentes de Next): cache-first.
  // El nombre cambia en cada build, así que nunca sirve contenido viejo y es rápido/offline.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, clone));
            return res;
          })
      )
    );
    return;
  }

  // Todo lo demás (HTML, RSC, imágenes locales): SIEMPRE de la red, sin caché del navegador.
  // La copia en caché solo se usa como respaldo cuando no hay conexión.
  event.respondWith(
    fetch(req, { cache: "no-store" })
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, clone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FORCE_UPDATE") {
    self.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "SW_UPDATED" }));
      });
  }
});

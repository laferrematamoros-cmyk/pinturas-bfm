// Subir VERSION en cada cambio del SW para purgar cachés viejas en clientes.
// v5: ya no se guardan respuestas con error (404/500) ni descargas rotas; al
// estrenar versión se tiran las copias viejas por si alguna quedó dañada.
const VERSION = "v5";
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

// Solo se guarda lo que llegó bien y completo: una respuesta 404/500 guardada en
// "cache-first" se serviría para siempre (p. ej. la hoja de estilos → página sin diseño).
// Si la descarga se corta a medias, cache.put falla y no se guarda nada.
function guardar(req, res) {
  if (!res || !res.ok || res.type !== "basic") return;
  const clone = res.clone();
  caches.open(CACHE).then((cache) => cache.put(req, clone)).catch(() => {});
}

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
            guardar(req, res);
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
        guardar(req, res);
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

/* Plantilla del service worker de AiDEN. El plugin `trabajadorSinConexion` de vite.config.js
   reemplaza __VERSION__ y __PRECARGA__ en cada build y la publica como /sw.js.
   Los datos de AiDEN ya viven en el navegador; esto guarda la aplicación para que abra
   y funcione completa en el vivero aunque no haya señal. */
/* global __VERSION__, __PRECARGA__ */

const VERSION = __VERSION__;
const CACHE_APP = `aiden-app-${VERSION}`;
const CACHE_EXTRA = "aiden-extra";
const PRECARGA = __PRECARGA__;

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE_APP).then((cache) => cache.addAll(PRECARGA)));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((clave) => clave.startsWith("aiden-app-") && clave !== CACHE_APP).map((clave) => caches.delete(clave))))
      .then(() => self.clients.claim()),
  );
});

// La versión nueva espera a que la persona decida actualizar: así no cambia la app
// en medio de un registro.
self.addEventListener("message", (evento) => {
  if (evento.data?.tipo === "ACTIVAR_VERSION") self.skipWaiting();
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;
    evento.respondWith(request.mode === "navigate" ? navegacion(request) : recurso(request));
    return;
  }

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    evento.respondWith(recursoExterno(request));
  }
});

// Red primero para recibir versiones nuevas; sin señal, el index.html de esta misma
// versión, que coincide con los archivos guardados.
async function navegacion(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_APP);
    return (await cache.match("/index.html", { ignoreVary: true })) || Response.error();
  }
}

// ignoreVary: los módulos diferidos se piden con cabecera Origin y la precarga no; si el
// servidor responde con `Vary: Origin`, sin esto la copia guardada nunca coincide.
async function recurso(request) {
  const guardado = await caches.match(request, { ignoreVary: true });
  if (guardado) return guardado;
  const respuesta = await fetch(request);
  if (respuesta.ok) {
    const cache = await caches.open(CACHE_EXTRA);
    cache.put(request, respuesta.clone());
  }
  return respuesta;
}

async function recursoExterno(request) {
  const cache = await caches.open(CACHE_EXTRA);
  const guardado = await cache.match(request, { ignoreVary: true });
  const red = fetch(request)
    .then((respuesta) => {
      if (respuesta.ok || respuesta.type === "opaque") cache.put(request, respuesta.clone());
      return respuesta;
    })
    .catch(() => guardado || Response.error());
  return guardado || red;
}

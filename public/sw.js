/// <reference lib="webworker" />

const CACHE_NAME = "al-cambio-v1";

// Archivos esenciales para el shell offline
const OFFLINE_URLS = [
    "/",
    "/manifest.json",
];

// Instalación: cachear el shell de la app
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
    );
    // Activar inmediatamente sin esperar a que se cierren las pestañas antiguas
    self.skipWaiting();
});

// Activación: limpiar caches antiguos
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    // Tomar control de todas las páginas abiertas inmediatamente
    self.clients.claim();
});

// Estrategia: Network First, fallback a cache
// Intenta la red primero; si falla (offline), sirve desde cache
self.addEventListener("fetch", (event) => {
    // Solo interceptar peticiones GET de navegación y assets
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Guardar respuesta exitosa en cache para uso offline futuro
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Sin conexión: servir desde cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;

                    // Para navegación, servir la página principal cacheada
                    if (event.request.mode === "navigate") {
                        return caches.match("/");
                    }

                    // Para otros recursos, responder con error 503
                    return new Response("Offline", {
                        status: 503,
                        statusText: "Service Unavailable",
                    });
                });
            })
    );
});

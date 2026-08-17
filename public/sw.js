/* Service worker del panel. Su función principal es hacer la app instalable en Android
   (Chrome exige un worker con manejador de `fetch`); el cacheo es deliberadamente conservador
   para que un despliegue nuevo nunca quede servido desde una versión vieja. */

const SHELL_CACHE = 'piddet-shell-v1';
const ASSET_CACHE = 'piddet-assets-v1';
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE];
const ADMIN_START = '/admin/';
const MAX_ASSET_ENTRIES = 24;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => !CURRENT_CACHES.includes(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Los assets llevan hash en el nombre: una vez cacheados no cambian nunca.
const isHashedAsset = (url) => url.pathname.startsWith('/assets/');
const isIcon = (url) => url.pathname.startsWith('/favicon/');

// La caché de assets acumula los bundles de despliegues anteriores; se recorta por FIFO.
async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

// Guardar en caché es best-effort: una respuesta redirigida o la cuota llena no deben
// tumbar la petición que el usuario está esperando.
function cacheQuietly(cacheName, key, response) {
  if (!response.ok || response.redirected) return;
  const copy = response.clone();
  caches.open(cacheName)
    .then((cache) => cache.put(key, copy).then(() => trimCache(cacheName, MAX_ASSET_ENTRIES)))
    .catch(() => {});
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    cacheQuietly(SHELL_CACHE, ADMIN_START, response);
    return response;
  } catch (error) {
    const cached = await caches.match(ADMIN_START);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  cacheQuietly(cacheName, request, response);
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Otro origen (API, fuentes, S3) o llamadas a la API propia: siempre red, sin caché.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) return;

  // Solo el panel se resuelve desde el shell cacheado; las páginas públicas (carta, portada,
  // check-in) las renderiza el servidor y deben pedirse siempre a la red.
  if (request.mode === 'navigate') {
    if (url.pathname === '/admin' || url.pathname.startsWith(ADMIN_START)) {
      event.respondWith(networkFirstNavigation(request));
    }
    return;
  }

  if (isHashedAsset(url) || isIcon(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
  }
});

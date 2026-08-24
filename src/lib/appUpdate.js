import { ADMIN_BASE } from './adminBase.js';

// El bundle que está corriendo ahora mismo: Vite le pone un hash del contenido al nombre, así
// que sirve de número de versión sin tener que generar uno aparte.
function bundleActual() {
  const script = document.querySelector('script[type="module"][src]');
  return script ? script.getAttribute('src') : null;
}

const BUNDLE_EN_HTML = /<script[^>]+type="module"[^>]+src="([^"]+)"/;

/** Pide el shell a la red (saltándose cualquier caché) y compara el bundle que referencia. */
async function bundlePublicado() {
  const res = await fetch(`${ADMIN_BASE}/`, { cache: 'no-store', credentials: 'same-origin' });
  if (!res.ok) return null;
  const html = await res.text();
  const m = html.match(BUNDLE_EN_HTML);
  return m ? m[1] : null;
}

const MARCA = 'piddet:recargado-por';
const ESPERA_MIN = 60_000;   // no comprobar más de una vez por minuto
let ultimaComprobacion = 0;

async function comprobar() {
  const ahora = Date.now();
  if (ahora - ultimaComprobacion < ESPERA_MIN) return;
  ultimaComprobacion = ahora;

  const actual = bundleActual();
  if (!actual) return;

  let publicado = null;
  try {
    publicado = await bundlePublicado();
  } catch {
    return; // sin red: se reintenta la próxima vez que la app vuelva al frente
  }
  if (!publicado || publicado === actual) return;

  // Guarda contra bucles: si ya se recargó por esta misma versión y aun así se sigue viendo la
  // anterior, es un problema del servidor y no vale la pena recargar en bucle.
  try {
    if (sessionStorage.getItem(MARCA) === publicado) return;
    sessionStorage.setItem(MARCA, publicado);
  } catch { /* modo privado: se sigue igual, solo se pierde la guarda */ }

  // Que el service worker tire sus cachés antes de recargar, o el arranque volvería a servir
  // los archivos viejos.
  try {
    navigator.serviceWorker?.controller?.postMessage('piddet:flush-caches');
    await new Promise((r) => { window.setTimeout(r, 150); });
  } catch { /* sin service worker no hay nada que limpiar */ }

  window.location.reload();
}

/**
 * Vigila si hay una versión nueva publicada y, si la hay, recarga.
 *
 * Hace falta porque una app instalada puede quedarse abierta días: el service worker sirve el
 * shell desde la red al arrancar, pero si nunca arranca de cero, nunca ve la versión nueva. Se
 * comprueba al volver del segundo plano —el momento en que el usuario acaba de volver y no está
 * escribiendo— y al recuperar la conexión.
 */
export function watchForUpdates() {
  if (!import.meta.env.PROD) return;
  const alVolver = () => { if (document.visibilityState === 'visible') comprobar(); };
  document.addEventListener('visibilitychange', alVolver);
  window.addEventListener('online', alVolver);
  window.addEventListener('focus', alVolver);
}

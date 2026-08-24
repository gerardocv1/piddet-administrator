// Identidad INSTALABLE de la app: el nombre y el icono con los que la PWA queda en la pantalla
// de inicio siguen a la compañía activa. Android/Chrome leen el manifest y iOS las metas
// `apple-*`, así que basta con reescribir ambos en runtime.
//
// EL MOMENTO IMPORTA. Chrome congela los datos del diálogo de instalación en el evento
// `beforeinstallprompt`, que dispara en cuanto el service worker queda registrado; si la
// identidad se aplicara más tarde (p. ej. desde un efecto de React) el diálogo seguiría
// proponiendo «Piddet» aunque el manifest ya fuera el de la compañía. De ahí las dos pasadas:
//
//   applyStoredCompanyPwa()  SÍNCRONA, al principio de main.jsx, antes de registrar el worker.
//                            Lee la compañía de la sesión guardada y deja la identidad puesta
//                            antes de que el navegador mire nada.
//   applyCompanyPwa(company) Asíncrona, desde App.jsx. Espera al logo de la compañía (que es una
//                            imagen remota) y publica el icono definitivo; es también la que
//                            reacciona al cambio de compañía y al guardado del perfil.
//
// El logo no puede cargarse de forma síncrona, así que la primera visita instala el icono de
// inicial y la segunda ya el definitivo: los iconos compuestos quedan cacheados en localStorage
// y la pasada síncrona los reutiliza, de modo que solo se publica UN manifest por carga.

import { readSession } from '../auth/storage.js';
import { ADMIN_BASE } from '../adminBase.js';
import { findPalette } from './palettes.js';
import { drawAppIcon, loadCompanyLogo } from './companyAppIcon.js';

// Valores del index.html / manifest estático a los que se vuelve al cerrar sesión.
const DEFAULTS = {
  manifestHref: '/manifest.webmanifest',
  appleTouchIcon: '/favicon/apple-touch-icon.png',
  appTitle: 'Piddet',
  // Se captura antes de la primera reescritura: es el título original del documento.
  documentTitle: typeof document !== 'undefined' ? document.title : '',
};

// Mismos colores de splash/estado que el manifest estático: la barra se funde con --bg-body.
const SPLASH_BG = '#fbfbfc';
const SHORT_NAME_MAX = 12; // lo que cabe bajo el icono en la pantalla de inicio
const FONT_TIMEOUT_MS = 1200;
const ICON_CACHE_KEY = 'piddet_pwa_icons';

let currentManifestUrl = null; // blob del último manifest generado, para revocarlo al reemplazar
let appliedKey = null;         // identidad ya publicada, para no republicar la misma

const meta = (name) => document.querySelector(`meta[name="${name}"]`);
const link = (rel) => document.querySelector(`link[rel="${rel}"]`);

// Todo lo que cambia el icono o el nombre entra en la clave: renombrar la compañía, cambiar su
// color o su logo invalidan tanto el caché como la identidad ya publicada.
const identityKey = (company) =>
  [company.id, company.name, company.brand_primary || '', company.icon || ''].join('|');

function readIconCache(company) {
  try {
    const cached = JSON.parse(localStorage.getItem(ICON_CACHE_KEY) || 'null');
    return cached?.key === identityKey(company) ? cached.icons : null;
  } catch {
    return null;
  }
}

function writeIconCache(company, icons) {
  try {
    localStorage.setItem(ICON_CACHE_KEY, JSON.stringify({ key: identityKey(company), icons }));
  } catch {
    // Cuota llena o storage bloqueado: se pierde solo la optimización, no la identidad.
  }
}

function clearIconCache() {
  try {
    localStorage.removeItem(ICON_CACHE_KEY);
  } catch {
    // Nada que limpiar si el storage no está disponible.
  }
}

function setDocumentIdentity({ manifestHref, appleTouchIcon, appTitle, documentTitle }) {
  const manifestLink = link('manifest');
  if (manifestLink) manifestLink.href = manifestHref;
  const appleIcon = link('apple-touch-icon');
  if (appleIcon) appleIcon.href = appleTouchIcon;
  meta('apple-mobile-web-app-title')?.setAttribute('content', appTitle);
  meta('application-name')?.setAttribute('content', appTitle);
  // Algunas versiones de iOS prefieren el <title> al meta al «Agregar a inicio».
  document.title = documentTitle;
}

function releaseManifestUrl() {
  if (!currentManifestUrl) return;
  URL.revokeObjectURL(currentManifestUrl);
  currentManifestUrl = null;
}

function restoreDefaults() {
  releaseManifestUrl();
  clearIconCache();
  appliedKey = null;
  setDocumentIdentity(DEFAULTS);
}

/**
 * Espera a la fuente del logo con tope: se carga de un CDN y, si tarda o no llega, el icono se
 * dibuja con el fallback del sistema en vez de quedarse esperando (misma política de carga no
 * bloqueante que index.html).
 */
function fontReady() {
  if (!document.fonts?.load) return Promise.resolve();
  return Promise.race([
    document.fonts.load('700 512px "Baloo 2"').catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS)),
  ]);
}

/** Nombre corto para la pantalla de inicio: recortado en el último espacio que quepa. */
function shortName(name) {
  if (name.length <= SHORT_NAME_MAX) return name;
  const cut = name.slice(0, SHORT_NAME_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 4 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/** Juego completo de iconos de la compañía. `logo` null → icono de inicial. */
function composeIcons(company, logo) {
  const palette = findPalette(company.brand_primary);
  const letter = ([...company.name.trim()][0] || 'P').toLocaleUpperCase('es');
  const draw = (size, maskable) => drawAppIcon({ size, palette, letter, logo, maskable });

  return {
    any192: draw(192, false),
    any512: draw(512, false),
    mask512: draw(512, true),
    // iOS redondea él las esquinas del apple-touch-icon: se le da el lienzo completo.
    apple180: draw(180, true),
  };
}

/** Publica manifest y metas con la identidad de la compañía y el juego de iconos dado. */
function applyIdentity(company, icons) {
  const name = company.name.trim();

  // El manifest vive en un blob: sin URL base, todas las rutas deben ser absolutas. El `id` se
  // mantiene fijo (misma app instalada aunque cambie la compañía activa: la identidad que queda
  // es la del momento de instalar).
  const { origin } = window.location;
  const manifest = {
    id: `${origin}/admin/`,
    name,
    short_name: shortName(name),
    description: `Panel de administración de ${name} en Piddet.`,
    lang: 'es',
    dir: 'ltr',
    start_url: `${origin}/admin/`,
    scope: `${origin}/admin/`,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: SPLASH_BG,
    theme_color: SPLASH_BG,
    icons: [
      { src: icons.any192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icons.any512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: icons.mask512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ].filter((i) => i.src),
  };

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })
  );
  releaseManifestUrl();
  currentManifestUrl = url;

  setDocumentIdentity({
    manifestHref: url,
    appleTouchIcon: icons.apple180 || DEFAULTS.appleTouchIcon,
    appTitle: name,
    documentTitle: `${name} · Panel de administración`,
  });
}

/**
 * Primera pasada, síncrona y sin red: deja la identidad de la compañía guardada en la sesión
 * antes de que el navegador evalúe la instalación. Usa los iconos cacheados si los hay (y son
 * de esta misma identidad); si no, dibuja el de inicial y espera a la pasada asíncrona.
 */
export function applyStoredCompanyPwa() {
  // Solo el panel: las páginas públicas (carta, portada, check-in) comparten documento pero no
  // son la app instalable, y además fijan su propio título para compartir.
  const path = window.location.pathname;
  if (path !== '/' && path !== ADMIN_BASE && !path.startsWith(`${ADMIN_BASE}/`)) return;

  try {
    const company = readSession().company;
    if (!company?.name?.trim()) return;

    const cached = readIconCache(company);
    applyIdentity(company, cached || composeIcons(company, null));
    // Solo el caché da el icono definitivo: sin él hay que dejar que la pasada asíncrona corra.
    if (cached) appliedKey = identityKey(company);
  } catch {
    // Sin canvas, sin storage o en modo privado la app arranca con la identidad Piddet.
  }
}

/**
 * Pasada definitiva: incorpora el logo de la compañía y cachea el resultado para que la próxima
 * carga lo tenga ya en la pasada síncrona. Con `null` (sin sesión) restaura la identidad Piddet.
 */
export async function applyCompanyPwa(company) {
  if (!company?.name?.trim()) {
    restoreDefaults();
    return;
  }
  // La pasada síncrona ya publicó esta misma identidad desde el caché: republicar solo obligaría
  // al navegador a releer un manifest idéntico.
  if (appliedKey === identityKey(company)) return;

  const logo = await loadCompanyLogo(company.icon);
  // La fuente solo la usa el icono de inicial: con logo no se espera a nadie.
  if (!logo) await fontReady();

  try {
    const icons = composeIcons(company, logo);
    applyIdentity(company, icons);
    appliedKey = identityKey(company);
    writeIconCache(company, icons);
  } catch {
    // Un fallo dibujando el icono no debe tumbar el arranque: queda la identidad ya aplicada.
  }
}

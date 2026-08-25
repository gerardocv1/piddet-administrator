// Identidad INSTALABLE de la app: el nombre y el icono con los que la PWA queda en la pantalla
// de inicio siguen a la compañía activa.
//
// Los iconos NO se dibujan aquí: los sirve el backend en URLs reales
// (`/public/{compañía}/app-icon-{tamaño}.png`). Es un requisito de iOS, que no acepta un `data:`
// URI como `apple-touch-icon`; dibujarlos en un canvas funcionaba en Android y dejaba a iOS con
// el icono genérico. El manifest sí sigue siendo un blob local porque su `scope` y su
// `start_url` deben ser del mismo origen que él, y el backend puede estar en otro.
//
// EL MOMENTO IMPORTA, y por partida doble:
//   - Chrome congela los datos del diálogo de instalación en `beforeinstallprompt`, que dispara
//     al registrarse el service worker. De ahí que main.jsx llame a `applyStoredCompanyPwa()`
//     antes de registrarlo.
//   - iOS fija el nombre de «Agregar a Inicio» al cargar el documento, antes incluso de que
//     corra este bundle. Por eso el nombre y el `apple-touch-icon` los pone además un script en
//     línea al final del <head> de index.html; esto los reaplica para los cambios en caliente.

import { readSession } from '../auth/storage.js';
import { ADMIN_BASE } from '../adminBase.js';

const API = import.meta.env.VITE_API_URL || '';

// Valores del index.html / manifest estático a los que se vuelve al cerrar sesión.
const DEFAULTS = {
  manifestHref: '/manifest.webmanifest',
  appleTouchIcon: '/favicon/apple-touch-icon.png',
  appTitle: 'Piddet',
  // El título original del documento. Se lee del dato que anota el script en línea del <head>,
  // porque para cuando corre este módulo ese script ya pudo haber puesto el de la compañía.
  documentTitle: typeof document !== 'undefined'
    ? (document.documentElement.dataset.defaultTitle || document.title)
    : '',
};

// Mismos colores de splash/estado que el manifest estático: la barra se funde con --bg-body.
const SPLASH_BG = '#fbfbfc';
const SHORT_NAME_MAX = 12; // lo que cabe bajo el icono en la pantalla de inicio

let currentManifestUrl = null; // blob del último manifest generado, para revocarlo al reemplazar

const meta = (name) => document.querySelector(`meta[name="${name}"]`);
const link = (rel) => document.querySelector(`link[rel="${rel}"]`);

/**
 * URL del icono servido por el backend. El `v` cuelga de logo y color para que cambiar
 * cualquiera de los dos estrene URL: si no, el teléfono seguiría mostrando el icono anterior
 * desde su caché. Devuelve null en modo demo (sin backend), donde rigen los iconos de Piddet.
 */
function iconUrl(company, size, maskable) {
  if (!API || !company.username) return null;
  const version = `${company.icon || ''}${company.brand_primary || ''}`.replace(/\W/g, '').slice(-12);
  const query = `${maskable ? 'maskable=1&' : ''}v=${encodeURIComponent(version)}`;

  return `${API}/public/${encodeURIComponent(company.username)}/app-icon-${size}.png?${query}`;
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

/** Nombre corto para la pantalla de inicio: recortado en el último espacio que quepa. */
function shortName(name) {
  if (name.length <= SHORT_NAME_MAX) return name;
  const cut = name.slice(0, SHORT_NAME_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 4 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/** Iconos del manifest: los de la compañía, o los de Piddet si no hay backend configurado. */
function manifestIcons(company, origin) {
  const company192 = iconUrl(company, 192, false);
  if (!company192) {
    return [
      { src: `${origin}/favicon/android-chrome-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${origin}/favicon/android-chrome-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${origin}/favicon/maskable-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ];
  }

  return [
    { src: company192, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: iconUrl(company, 512, false), sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: iconUrl(company, 512, true), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ];
}

/** Publica manifest y metas con la identidad de la compañía. */
function applyIdentity(company) {
  const name = company.name.trim();

  // El manifest vive en un blob: sin URL base, sus rutas deben ser absolutas. El `id` se mantiene
  // fijo (misma app instalada aunque cambie la compañía activa: la identidad que queda es la del
  // momento de instalar).
  const { origin } = window.location;
  const manifest = {
    id: `${origin}${ADMIN_BASE}/`,
    name,
    short_name: shortName(name),
    description: `Panel de administración de ${name} en Piddet.`,
    lang: 'es',
    dir: 'ltr',
    start_url: `${origin}${ADMIN_BASE}/`,
    scope: `${origin}${ADMIN_BASE}/`,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: SPLASH_BG,
    theme_color: SPLASH_BG,
    icons: manifestIcons(company, origin),
  };

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })
  );
  releaseManifestUrl();
  currentManifestUrl = url;

  setDocumentIdentity({
    manifestHref: url,
    // iOS redondea él las esquinas, así que se le pide el lienzo completo (maskable).
    appleTouchIcon: iconUrl(company, 180, true) || DEFAULTS.appleTouchIcon,
    appTitle: name,
    documentTitle: `${name} · Panel de administración`,
  });
}

/**
 * Identidad de la compañía guardada en la sesión. La llama main.jsx antes de registrar el
 * service worker, que es lo que destapa el diálogo de instalación de Chrome.
 */
export function applyStoredCompanyPwa() {
  // Solo el panel: las páginas públicas (carta, portada, check-in) comparten documento pero no
  // son la app instalable, y además fijan su propio título para compartir.
  const path = window.location.pathname;
  if (path !== '/' && path !== ADMIN_BASE && !path.startsWith(`${ADMIN_BASE}/`)) return;

  try {
    const company = readSession().company;
    if (company?.name?.trim()) applyIdentity(company);
  } catch {
    // Sin storage o en modo privado la app arranca con la identidad Piddet.
  }
}

/**
 * Reaplica la identidad al cambiar de compañía o al guardar el perfil. Con `null` (sin sesión)
 * restaura la identidad Piddet por defecto.
 */
export function applyCompanyPwa(company) {
  if (!company?.name?.trim()) {
    releaseManifestUrl();
    setDocumentIdentity(DEFAULTS);
    return;
  }
  applyIdentity(company);
}

// Identidad INSTALABLE de la app: el nombre y el icono con los que la PWA queda en la pantalla
// de inicio siguen a la compañía activa. Android/Chrome leen el manifest en el momento de
// instalar y iOS lee las metas `apple-*` del documento al "Agregar a inicio", así que basta con
// reescribir ambos en runtime: quien instala con una compañía activa se lleva su nombre y un
// icono con su color de marca (perfil → Identidad visual) y la inicial del nombre. Sin sesión
// (login) se restauran el manifest estático y los iconos Piddet de `public/`.

import { findPalette } from './palettes.js';

// Valores del index.html / manifest estático a los que se vuelve al cerrar sesión.
const DEFAULTS = {
  manifestHref: '/manifest.webmanifest',
  appleTouchIcon: '/favicon/apple-touch-icon.png',
  appTitle: 'Piddet',
};

// Mismos colores de splash/estado que el manifest estático: la barra se funde con --bg-body.
const SPLASH_BG = '#fbfbfc';

let currentManifestUrl = null; // blob del último manifest generado, para revocarlo al reemplazar

const meta = (name) => document.querySelector(`meta[name="${name}"]`);
const link = (rel) => document.querySelector(`link[rel="${rel}"]`);

// Trazo manual del rectángulo redondeado: `ctx.roundRect` aún falta en Safari < 16.
function roundedRectPath(ctx, size, radius) {
  const r = Math.min(radius, size / 2);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.arcTo(size, 0, size, r, r);
  ctx.lineTo(size, size - r);
  ctx.arcTo(size, size, size - r, size, r);
  ctx.lineTo(r, size);
  ctx.arcTo(0, size, 0, size - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
}

/**
 * Dibuja el icono de la compañía: fondo en degradado con su paleta y la inicial en blanco.
 * `maskable` pinta el lienzo completo (Android recorta él la silueta y exige margen seguro);
 * sin `maskable` el fondo es un cuadrado redondeado con esquinas transparentes (iOS/escritorio).
 */
function drawLetterIcon({ size, palette, letter, maskable = false }) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!maskable) {
    roundedRectPath(ctx, size, size * 0.22);
    ctx.clip();
  }
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, palette.accent);
  gradient.addColorStop(1, palette.strong);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // La zona segura maskable es el círculo central (80% del lado): la letra baja de tamaño.
  const fontPx = Math.round(size * (maskable ? 0.44 : 0.56));
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${fontPx}px "Baloo 2", "Open Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  // Centrado óptico por caja real del glifo: con `middle` las mayúsculas quedan caídas.
  const m = ctx.measureText(letter);
  const ascent = m.actualBoundingBoxAscent ?? fontPx * 0.72;
  const descent = m.actualBoundingBoxDescent ?? 0;
  ctx.fillText(letter, size / 2, size / 2 + (ascent - descent) / 2);

  return canvas.toDataURL('image/png');
}

function setInstallIdentity({ manifestHref, appleTouchIcon, appTitle }) {
  const manifestLink = link('manifest');
  if (manifestLink) manifestLink.href = manifestHref;
  const appleIcon = link('apple-touch-icon');
  if (appleIcon) appleIcon.href = appleTouchIcon;
  meta('apple-mobile-web-app-title')?.setAttribute('content', appTitle);
  meta('application-name')?.setAttribute('content', appTitle);
}

function releaseManifestUrl() {
  if (!currentManifestUrl) return;
  URL.revokeObjectURL(currentManifestUrl);
  currentManifestUrl = null;
}

/**
 * Reescribe manifest y metas de instalación con la identidad de la compañía activa;
 * con `null` (sin sesión) restaura la identidad Piddet por defecto.
 */
export async function applyCompanyPwa(company) {
  const name = company?.name?.trim();
  if (!name) {
    releaseManifestUrl();
    setInstallIdentity(DEFAULTS);
    return;
  }

  const palette = findPalette(company.brand_primary);
  const letter = ([...name][0] || 'P').toLocaleUpperCase('es');

  // El icono usa la fuente del logo si ya está disponible; si el CDN falla se dibuja igual
  // con el fallback del sistema (misma política de carga que index.html).
  try { await document.fonts.load('700 512px "Baloo 2"'); } catch { /* fallback del sistema */ }

  const icon = (size, maskable) => drawLetterIcon({ size, palette, letter, maskable });

  // El manifest vive en un blob: sin URL base, todas las rutas deben ser absolutas. El `id` se
  // mantiene fijo (misma app instalada aunque cambie la compañía activa: la identidad que queda
  // es la del momento de instalar).
  const origin = window.location.origin;
  const manifest = {
    id: `${origin}/admin/`,
    name,
    short_name: name.length <= 12 ? name : name.slice(0, 12).trimEnd(),
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
      { src: icon(192, false), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon(512, false), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: icon(512, true), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })
  );
  releaseManifestUrl();
  currentManifestUrl = url;

  setInstallIdentity({
    manifestHref: url,
    appleTouchIcon: icon(180, true), // iOS redondea él las esquinas: el lienzo va completo
    appTitle: name,
  });
}

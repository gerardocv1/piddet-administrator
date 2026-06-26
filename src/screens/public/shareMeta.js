// Utilidades compartidas por las vistas públicas (sin sesión): la portada de la compañía y la
// carta del menú. Resuelven la imagen de marca para la card al compartir y manipulan los <meta>
// del <head> (Open Graph/Twitter) para que el enlace se vea bien al difundirlo.

// Imagen para la card al compartir: se prefiere el thumbnail (más liviano; WhatsApp/Facebook
// descartan imágenes muy grandes). Si la compañía no subió logo (default company.png), se usa el
// ícono de piddet en vez del placeholder.
const DEFAULT_LOGO_RE = /\/company\.png(\?|$)/;

export const shareImage = (company) =>
  [company?.thumbnail_icon, company?.icon, company?.standard_icon].find((u) => u && !DEFAULT_LOGO_RE.test(u)) ||
  `${window.location.origin}/favicon/apple-touch-icon.png`;

// Crea/actualiza un <meta> en el <head> y devuelve los que creó (para limpiarlos al desmontar).
export function applyMetaTags(tags) {
  const created = [];
  tags.forEach(([attr, key, content]) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
      created.push(el);
    }
    el.setAttribute('content', content);
  });
  return created;
}

// Open Graph/Twitter estándar a partir de la info de compartir. Nota: WhatsApp/Facebook NO
// ejecutan JS, así que la card definitiva necesita estos tags servidos desde el servidor en esa
// URL (ver pendiente de despliegue); aquí cubren las apps que sí renderizan el enlace por JS.
export const buildShareMeta = ({ title, description, image, url }) => [
  ['name', 'description', description],
  ['property', 'og:type', 'website'],
  ['property', 'og:site_name', 'piddet'],
  ['property', 'og:title', title],
  ['property', 'og:description', description],
  ['property', 'og:image', image],
  ['property', 'og:url', url],
  ['name', 'twitter:card', 'summary'],
  ['name', 'twitter:title', title],
  ['name', 'twitter:description', description],
  ['name', 'twitter:image', image],
];

// Acción de compartir: usa la hoja nativa si existe; si no, copia el enlace al portapapeles.
// Devuelve true si copió (para mostrar un aviso temporal), false si abrió la hoja nativa.
export async function shareOrCopy({ title, description, url }) {
  if (navigator.share) {
    try { await navigator.share({ title, text: description, url }); } catch { /* cancelado por el usuario */ }
    return false;
  }
  await navigator.clipboard.writeText(url);
  return true;
}

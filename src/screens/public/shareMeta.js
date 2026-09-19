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

// Crea/actualiza metas y devuelve una limpieza que restaura el head anterior. Esto importa desde
// que index.html trae fallback SEO: desmontar una vista pública no puede dejar sus valores pegados.
export function applyMetaTags(tags) {
  const cleanups = [];
  tags.forEach(([attr, key, content]) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    const created = !el;
    const previousContent = el?.getAttribute('content');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
    cleanups.push(() => {
      if (created) el.remove();
      else el.setAttribute('content', previousContent || '');
    });
  });
  return () => cleanups.reverse().forEach((cleanup) => cleanup());
}

// Canonical, directiva de indexación y datos estructurados para vistas públicas. Devuelve una
// función de limpieza que restaura las etiquetas estáticas de index.html al desmontar la vista.
export function applySeoTags({ canonical, robots = 'index, follow', structuredData = null }) {
  const cleanups = [];

  let canonicalLink = document.head.querySelector('link[rel="canonical"]');
  const createdCanonical = !canonicalLink;
  const previousCanonical = canonicalLink?.getAttribute('href');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = canonical;
  cleanups.push(() => {
    if (createdCanonical) canonicalLink.remove();
    else canonicalLink.setAttribute('href', previousCanonical || '/');
  });

  let robotsMeta = document.head.querySelector('meta[name="robots"]');
  const createdRobots = !robotsMeta;
  const previousRobots = robotsMeta?.getAttribute('content');
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    document.head.appendChild(robotsMeta);
  }
  robotsMeta.content = robots;
  cleanups.push(() => {
    if (createdRobots) robotsMeta.remove();
    else robotsMeta.setAttribute('content', previousRobots || 'index, follow');
  });

  if (structuredData) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.piddetSeo = 'true';
    script.textContent = JSON.stringify(structuredData).replace(/</g, '\\u003c');
    document.head.appendChild(script);
    cleanups.push(() => script.remove());
  }

  return () => cleanups.reverse().forEach((cleanup) => cleanup());
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

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tarjeta para compartir de piddet.com/gym. WhatsApp, Facebook y compañía no ejecutan JS: leen las
// etiquetas del HTML que devuelve el servidor, así que esta entrada necesita su propio HTML
// estático. Al terminar el build se copia dist/index.html a dist/gym/index.html con las etiquetas
// cambiadas; el servidor lo entrega solo para /gym/ (try_files `$uri/`) y el resto de rutas sigue
// cayendo en el index.html de siempre. nginx lleva /gym a /gym/ con un 301 (los rastreadores lo
// siguen); por eso la URL canónica es /gym/. El README trae la línea que evita ese salto.
//
// Además resuelve un choque: public/gym/ (las siluetas de las medidas) hace de /gym un directorio,
// y sin index.html adentro el servidor respondía 403 en vez de la app.
const SITE = 'https://piddet.com';
const GYM_SHARE = {
  title: 'piddet gym · Tu gimnasio en tu bolsillo',
  description: 'Sigue tu suscripción, tu saldo y tus medidas del gimnasio desde el celular. '
    + 'Entra con tu número y un código por SMS, sin contraseñas.',
  url: `${SITE}/gym/`,
  image: `${SITE}/og/piddet-gym.png`,
  imageAlt: 'piddet gym: tu plan, los días que te quedan y tus medidas en el celular.',
  themeColor: '#0b2630', // --portal-bg: la entrada ya abre oscura, como el portal
};

const escapeAttr = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function gymShareHtml(html) {
  const c = GYM_SHARE;
  let out = html;
  const swap = (pattern, replacement) => {
    if (!pattern.test(out)) throw new Error(`gym-share-page: no se encontró ${pattern} en index.html`);
    out = out.replace(pattern, replacement);
  };
  const meta = (attr, key, value) => swap(
    new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`),
    (_, open, close) => `${open}${escapeAttr(value)}${close}`,
  );

  swap(/<title>[^<]*<\/title>/, `<title>${escapeAttr(c.title)}</title>`);
  swap(/(<link rel="canonical" href=")[^"]*(")/, (_, open, close) => `${open}${c.url}${close}`);
  meta('name', 'theme-color', c.themeColor);
  meta('name', 'description', c.description);
  meta('name', 'apple-mobile-web-app-title', 'piddet gym');
  meta('name', 'application-name', 'piddet gym');
  meta('property', 'og:site_name', 'piddet gym');
  meta('property', 'og:title', c.title);
  meta('property', 'og:description', c.description);
  meta('property', 'og:url', c.url);
  meta('property', 'og:image', c.image);
  meta('name', 'twitter:card', 'summary_large_image');
  meta('name', 'twitter:title', c.title);
  meta('name', 'twitter:description', c.description);
  meta('name', 'twitter:image', c.image);
  // Tamaño y texto de la imagen: con ellos WhatsApp la muestra grande desde el primer envío.
  swap(/(<meta property="og:image" content="[^"]*" \/>)/, (_, tag) => [
    tag,
    `<meta property="og:image:secure_url" content="${c.image}" />`,
    '<meta property="og:image:type" content="image/png" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${escapeAttr(c.imageAlt)}" />`,
    '<meta property="og:locale" content="es_CO" />',
    `<meta name="twitter:image:alt" content="${escapeAttr(c.imageAlt)}" />`,
  ].join('\n    '));
  return out;
}

function gymSharePage() {
  let outDir = 'dist';
  return {
    name: 'gym-share-page',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const html = await readFile(resolve(outDir, 'index.html'), 'utf8');
      await mkdir(resolve(outDir, 'gym'), { recursive: true });
      await writeFile(resolve(outDir, 'gym', 'index.html'), gymShareHtml(html));
    },
  };
}

export default defineConfig({
  plugins: [react(), gymSharePage()],
  server: { port: 5173, open: true },
});

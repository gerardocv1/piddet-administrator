// Dibujo del icono con el que la app queda instalada en la pantalla de inicio. Se compone como
// un icono de app de verdad: fondo en degradado con el color de marca de la compañía y, encima,
// su logo pequeño sobre una placa blanca (el logo suele ser oscuro y sin placa se perdería en el
// fondo). Sin logo cargado, el mismo fondo con la inicial del nombre en blanco.
//
// Dos formatos, porque los sistemas recortan distinto:
//   any      → cuadrado de esquinas redondeadas (iOS y escritorio lo usan tal cual)
//   maskable → lienzo completo a sangre; Android recorta la silueta que quiera (círculo,
//              squircle…), así que el contenido se encoge para caber en la zona segura.

// Android garantiza solo el círculo central del 80% del lado. El cuadrado más grande inscrito en
// ese círculo mide lado·0,8/√2 ≈ 0,566: por eso la placa baja de 0,62 a 0,54 en maskable.
const PLATE_RATIO = { any: 0.62, maskable: 0.54 };
const LETTER_RATIO = { any: 0.56, maskable: 0.44 };
const LOGO_PADDING = 0.14; // margen del logo dentro de la placa, en fracción del lado de la placa

// Trazo manual del rectángulo redondeado: `ctx.roundRect` aún falta en Safari < 16.
function roundedRectPath(ctx, x, y, size, radius) {
  const r = Math.min(radius, size / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + size, y, x + size, y + r, r);
  ctx.arcTo(x + size, y + size, x + size - r, y + size, r);
  ctx.arcTo(x, y + size, x, y + size - r, r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Fondo PLANO, no degradado: además de leerse mejor a tamaño de icono, el PNG comprime unas
// cinco veces mejor (51 KB frente a 253 KB a 512 px). Ese peso importa porque los iconos viajan
// como data URL dentro del manifest y se guardan en el caché de arranque.
function paintBackground(ctx, size, palette, maskable) {
  if (!maskable) {
    // Esquinas transparentes: el icono ya llega con su forma para quien no recorta.
    roundedRectPath(ctx, 0, 0, size, size * 0.22);
    ctx.clip();
  }
  ctx.fillStyle = palette.accent;
  ctx.fillRect(0, 0, size, size);
}

function paintLetter(ctx, size, letter, maskable) {
  const fontPx = Math.round(size * LETTER_RATIO[maskable ? 'maskable' : 'any']);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${fontPx}px "Baloo 2", "Open Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  // Centrado óptico por la caja real del glifo: con `textBaseline = middle` las mayúsculas
  // quedan visiblemente caídas respecto al centro del lienzo.
  const m = ctx.measureText(letter);
  const ascent = m.actualBoundingBoxAscent ?? fontPx * 0.72;
  const descent = m.actualBoundingBoxDescent ?? 0;
  ctx.fillText(letter, size / 2, size / 2 + (ascent - descent) / 2);
}

function paintLogoPlate(ctx, size, logo, maskable) {
  const plate = Math.round(size * PLATE_RATIO[maskable ? 'maskable' : 'any']);
  const origin = Math.round((size - plate) / 2);

  // Sombra suave bajo la placa: la separa del fondo sin dibujar un borde duro.
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
  ctx.shadowBlur = size * 0.045;
  ctx.shadowOffsetY = size * 0.015;
  ctx.fillStyle = '#ffffff';
  roundedRectPath(ctx, origin, origin, plate, plate * 0.26);
  ctx.fill();
  ctx.restore();

  // El logo se encaja completo dentro de la placa (contain): nunca se recorta ni se deforma.
  const box = plate * (1 - LOGO_PADDING * 2);
  const scale = Math.min(box / logo.width, box / logo.height);
  const w = logo.width * scale;
  const h = logo.height * scale;
  ctx.drawImage(logo, size / 2 - w / 2, size / 2 - h / 2, w, h);
}

/**
 * Devuelve el icono como data URL PNG. `logo` es un HTMLImageElement ya cargado y utilizable en
 * canvas; si falta (o si el canvas quedó contaminado por CORS) se cae a la inicial.
 */
export function drawAppIcon({ size, palette, letter, logo = null, maskable = false }) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  paintBackground(ctx, size, palette, maskable);
  if (logo) paintLogoPlate(ctx, size, logo, maskable);
  else paintLetter(ctx, size, letter, maskable);

  try {
    return canvas.toDataURL('image/png');
  } catch {
    // Lienzo contaminado (logo de otro origen sin CORS): se rehace solo con la inicial.
    return logo ? drawAppIcon({ size, palette, letter, logo: null, maskable }) : null;
  }
}

/**
 * Carga el logo de la compañía para poder pintarlo en el canvas. Exige CORS (`anonymous`): sin
 * las cabeceras del bucket el canvas quedaría contaminado y no podría exportarse. Resuelve a
 * `null` ante cualquier fallo — el icono se dibuja entonces con la inicial.
 */
export function loadCompanyLogo(url) {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img.width && img.height ? img : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

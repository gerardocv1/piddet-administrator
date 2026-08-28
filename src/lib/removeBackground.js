// Recorte del fondo por color ("varita mágica") sobre canvas, sin dependencias.
//
// Pensado para logos: casi siempre llegan sobre un fondo plano (blanco) que hay que volver
// transparente conservando el antialias de las letras. El pipeline es:
//   loadWorkImage → detectBackgroundColor → buildAlphaMask → composite → toPngBlob
// La máscara del pincel manual se aplica encima de la calculada por color (ver `composite`).

// Lado máximo de la imagen de trabajo. Un logo no necesita más y mantiene cada recálculo
// (mover un slider) por debajo de unos pocos milisegundos.
export const MAX_WORK_SIZE = 1400;

export const MANUAL_NONE = 0;
export const MANUAL_ERASE = 1;
export const MANUAL_KEEP = 2;

const MAX_DISTANCE = Math.sqrt(3 * 255 * 255);

// Los sliders van de 0 a 100; la curva cuadrática deja el rango fino (fondos planos con ruido
// de JPEG) en la primera mitad del recorrido.
const toDistance = (value) => (value / 100) ** 2;

export async function loadWorkImage(src, maxSize = MAX_WORK_SIZE) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = src;
  });

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/** Color de fondo más repetido en el marco exterior de la imagen. */
export function detectBackgroundColor(imageData) {
  const { data, width, height } = imageData;
  const margin = Math.max(1, Math.round(Math.min(width, height) * 0.02));
  const buckets = new Map();

  const sample = (x, y) => {
    const i = (y * width + x) * 4;
    if (data[i + 3] < 128) return;
    // Cuantizar a 16 niveles por canal: agrupa el ruido del JPEG en un mismo color.
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const acc = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
    acc.count += 1;
    acc.r += data[i];
    acc.g += data[i + 1];
    acc.b += data[i + 2];
    buckets.set(key, acc);
  };

  for (let x = 0; x < width; x += 1) {
    for (let m = 0; m < margin; m += 1) {
      sample(x, m);
      sample(x, height - 1 - m);
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (let m = 0; m < margin; m += 1) {
      sample(m, y);
      sample(width - 1 - m, y);
    }
  }

  let best = null;
  buckets.forEach((acc) => { if (!best || acc.count > best.count) best = acc; });
  if (!best) return [255, 255, 255];
  return [
    Math.round(best.r / best.count),
    Math.round(best.g / best.count),
    Math.round(best.b / best.count),
  ];
}

export function pickColorAt(imageData, x, y) {
  const i = (Math.round(y) * imageData.width + Math.round(x)) * 4;
  return [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]];
}

/**
 * Opacidad de cada píxel (0 = fondo, 1 = logo) según su distancia al color de fondo.
 * Con `contiguous` solo se vacía la mancha conectada con los bordes (y con `seeds`, si se pasan):
 * así un fondo blanco no se lleva por delante el blanco interior de una letra.
 *
 * @returns {Float32Array} un valor por píxel
 */
export function buildAlphaMask(imageData, { color, tolerance, softness, contiguous, seeds = [] }) {
  const { data, width, height } = imageData;
  const [cr, cg, cb] = color;
  const near = toDistance(tolerance) * MAX_DISTANCE;
  const far = near + toDistance(softness) * MAX_DISTANCE;
  const alpha = new Float32Array(width * height);

  for (let p = 0; p < alpha.length; p += 1) {
    const i = p * 4;
    const dr = data[i] - cr;
    const dg = data[i + 1] - cg;
    const db = data[i + 2] - cb;
    const d = Math.sqrt(dr * dr + dg * dg + db * db);
    let a = d <= near ? 0 : d >= far ? 1 : (d - near) / (far - near);
    if (data[i + 3] === 0) a = 0;
    alpha[p] = a;
  }

  if (!contiguous) return alpha;

  const queue = [];
  const reached = new Uint8Array(alpha.length);
  const push = (p) => {
    if (p < 0 || p >= alpha.length || reached[p] || alpha[p] >= 1) return;
    reached[p] = 1;
    queue.push(p);
  };

  seeds.forEach(({ x, y }) => push(Math.round(y) * width + Math.round(x)));
  for (let x = 0; x < width; x += 1) { push(x); push((height - 1) * width + x); }
  for (let y = 0; y < height; y += 1) { push(y * width); push(y * width + width - 1); }

  while (queue.length) {
    const p = queue.pop();
    const x = p % width;
    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    push(p - width);
    push(p + width);
  }

  for (let p = 0; p < alpha.length; p += 1) if (!reached[p]) alpha[p] = 1;
  return alpha;
}

/**
 * Aplica la máscara de color, encima la del pincel, y devuelve la imagen con transparencia.
 * `despill` recupera el color real de los píxeles semitransparentes del borde deshaciendo la
 * mezcla con el fondo: es lo que quita el halo claro alrededor del logo.
 */
export function composite(imageData, alpha, manual, { despill = true, color } = {}) {
  const { data, width, height } = imageData;
  const out = new ImageData(width, height);
  const [cr, cg, cb] = color || [255, 255, 255];

  for (let p = 0; p < alpha.length; p += 1) {
    const i = p * 4;
    let a = alpha[p];
    if (manual) {
      if (manual[p] === MANUAL_ERASE) a = 0;
      else if (manual[p] === MANUAL_KEEP) a = 1;
    }

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (despill && a > 0 && a < 1) {
      r = (r - (1 - a) * cr) / a;
      g = (g - (1 - a) * cg) / a;
      b = (b - (1 - a) * cb) / a;
    }

    out.data[i] = Math.min(255, Math.max(0, r));
    out.data[i + 1] = Math.min(255, Math.max(0, g));
    out.data[i + 2] = Math.min(255, Math.max(0, b));
    out.data[i + 3] = Math.round(a * data[i + 3]);
  }
  return out;
}

/** Recorta el lienzo a lo que quedó visible, con un margen mínimo. Devuelve la misma imagen si no hay nada que quitar. */
export function trimTransparent(imageData, padding = 0) {
  const { data, width, height } = imageData;
  let top = height; let left = width; let right = -1; let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (right < 0) return imageData;

  top = Math.max(0, top - padding);
  left = Math.max(0, left - padding);
  right = Math.min(width - 1, right + padding);
  bottom = Math.min(height - 1, bottom + padding);
  if (top === 0 && left === 0 && right === width - 1 && bottom === height - 1) return imageData;

  const canvas = toCanvas(imageData);
  const cut = document.createElement('canvas');
  cut.width = right - left + 1;
  cut.height = bottom - top + 1;
  cut.getContext('2d').drawImage(canvas, left, top, cut.width, cut.height, 0, 0, cut.width, cut.height);
  return cut.getContext('2d').getImageData(0, 0, cut.width, cut.height);
}

export function toCanvas(imageData) {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext('2d').putImageData(imageData, 0, 0);
  return canvas;
}

export function toPngBlob(imageData) {
  return new Promise((resolve) => toCanvas(imageData).toBlob(resolve, 'image/png'));
}

/** Marca un disco de la máscara manual con `value` (MANUAL_ERASE | MANUAL_KEEP | MANUAL_NONE). */
export function paintDisc(manual, width, height, cx, cy, radius, value) {
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(width - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(height - 1, Math.ceil(cy + radius));

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) manual[y * width + x] = value;
    }
  }
}

/** Traza continua entre dos puntos: sin esto un movimiento rápido del puntero deja huecos. */
export function paintStroke(manual, width, height, from, to, radius, value) {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / Math.max(1, radius / 2)));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    paintDisc(manual, width, height, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, radius, value);
  }
}

import { getCroppedBlob } from '../../../lib/cropImage.js';

// Foto de perfil lista para subir: el recorte que eligió el socio, cuadrado y reducido. Un
// teléfono entrega fotos de 12 MP; subir el original gasta datos y almacenamiento para mostrarse
// en un círculo de 120 px, así que se deja en 720 × 720 en JPEG.

const SIZE = 720;
const QUALITY = 0.88;

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/** Recorta (con el giro elegido) y reduce a un JPEG cuadrado. Devuelve un File. */
export async function profilePhotoFile(src, areaPixels, rotation) {
  // Siempre JPEG: una foto de persona no necesita transparencia y pesa mucho menos.
  const cropped = await getCroppedBlob(src, areaPixels, rotation, 'image/jpeg');
  const img = await loadImage(cropped);
  const side = Math.min(SIZE, img.width, img.height);

  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, side, side);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo preparar la foto'))), 'image/jpeg', QUALITY);
  });
  return new File([blob], 'perfil.jpg', { type: 'image/jpeg' });
}

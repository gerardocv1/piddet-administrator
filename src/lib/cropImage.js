// Utilidad de recorte/rotación sobre canvas para react-easy-crop.
//
// Toma la imagen original (object URL local), el área de recorte en píxeles que entrega el cropper
// y la rotación, y devuelve un Blob con el resultado ya recortado y rotado, listo para subir.
//
// El formato de salida preserva la transparencia: los PNG se exportan como PNG (mantienen su canal
// alfa tras recortar/girar) y el resto como JPEG (más liviano, sin transparencia que conservar).

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.src = url;
  });
}

const toRad = (deg) => (deg * Math.PI) / 180;

// Tamaño del cuadro que contiene la imagen tras rotarla.
function rotatedSize(width, height, rotation) {
  const r = toRad(rotation);
  return {
    width: Math.abs(Math.cos(r) * width) + Math.abs(Math.sin(r) * height),
    height: Math.abs(Math.sin(r) * width) + Math.abs(Math.cos(r) * height),
  };
}

/**
 * @param {string} imageSrc  object URL de la imagen local
 * @param {{x:number,y:number,width:number,height:number}} pixelCrop  área de recorte (croppedAreaPixels)
 * @param {number} rotation  grados
 * @param {string} [mimeType]  tipo MIME de la imagen original; 'image/png' conserva la transparencia
 * @returns {Promise<Blob>}
 */
export async function getCroppedBlob(imageSrc, pixelCrop, rotation = 0, mimeType = '') {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const isPng = mimeType === 'image/png';

  const { width: bw, height: bh } = rotatedSize(image.width, image.height, rotation);

  // Dibuja la imagen rotada centrada en un lienzo del tamaño del bounding box.
  // El lienzo arranca transparente; en PNG mantiene así las esquinas que la rotación deja vacías.
  canvas.width = bw;
  canvas.height = bh;
  ctx.translate(bw / 2, bh / 2);
  ctx.rotate(toRad(rotation));
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Extrae el recorte y lo vuelca en un lienzo del tamaño exacto del recorte.
  // getImageData/putImageData preservan el canal alfa, así que la transparencia llega intacta.
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  // PNG conserva la transparencia; el resto se exporta como JPEG (más liviano).
  return isPng
    ? new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
    : new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92));
}

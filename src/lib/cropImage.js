// Utilidad de recorte/rotación sobre canvas para react-easy-crop.
//
// Toma la imagen original (object URL local), el área de recorte en píxeles que entrega el cropper
// y la rotación, y devuelve un Blob (JPEG) con el resultado ya recortado y rotado, listo para subir.

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
 * @returns {Promise<Blob>}
 */
export async function getCroppedBlob(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const { width: bw, height: bh } = rotatedSize(image.width, image.height, rotation);

  // Dibuja la imagen rotada centrada en un lienzo del tamaño del bounding box.
  canvas.width = bw;
  canvas.height = bh;
  ctx.translate(bw / 2, bh / 2);
  ctx.rotate(toRad(rotation));
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Extrae el recorte y lo vuelca en un lienzo del tamaño exacto del recorte.
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92));
}

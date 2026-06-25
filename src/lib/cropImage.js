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
  const isPng = mimeType === 'image/png';

  const { width: bw, height: bh } = rotatedSize(image.width, image.height, rotation);

  // Lienzo intermedio: imagen rotada y centrada en su bounding box. Arranca transparente.
  const stage = document.createElement('canvas');
  stage.width = bw;
  stage.height = bh;
  const sctx = stage.getContext('2d');
  sctx.translate(bw / 2, bh / 2);
  sctx.rotate(toRad(rotation));
  sctx.translate(-image.width / 2, -image.height / 2);
  sctx.drawImage(image, 0, 0);

  // Lienzo final: tamaño exacto del recorte. Con zoom < 1 el recorte puede exceder la imagen
  // (queda margen): en JPEG se rellena de blanco; en PNG se deja transparente. drawImage solo
  // pinta la intersección con la imagen, así que el relleno se conserva donde no hay imagen.
  const w = Math.round(pixelCrop.width);
  const h = Math.round(pixelCrop.height);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d');
  if (!isPng) {
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, w, h);
  }
  octx.drawImage(stage, pixelCrop.x, pixelCrop.y, w, h, 0, 0, w, h);

  // PNG conserva la transparencia; el resto se exporta como JPEG (más liviano).
  return isPng
    ? new Promise((resolve) => out.toBlob((blob) => resolve(blob), 'image/png'))
    : new Promise((resolve) => out.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92));
}

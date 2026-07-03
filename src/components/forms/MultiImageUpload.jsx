import React from 'react';
import { api } from '../../lib/api.js';
import { getRotatedBlob } from '../../lib/cropImage.js';
import styles from './MultiImageUpload.module.css';

// Fotos por encima de este peso se reescalan/comprimen antes de subir (las de cámara pesan
// 3–8 MB y los servidores suelen limitar la subida); el lado mayor queda en MAX_DIMENSION px.
const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 2000;

/**
 * Subida de VARIAS imágenes a S3 (p. ej. las fotos de la factura de un gasto).
 *
 * A diferencia de FileUpload (una imagen con recorte), aquí no hay recorte: el usuario agrega
 * fotos, se previsualizan en una grilla local y puede GIRARLAS de a 90° (las fotos de factura
 * suelen llegar de lado desde el teléfono); la rotación se hornea en los píxeles al subir.
 * La subida ocurre solo cuando el contenedor invoca `uploadAll()` (al guardar): sube en
 * secuencia y devuelve los `name` de referencia que se guardan en la entidad.
 *
 * Props:
 *  - folder: carpeta destino en S3 (p. ej. 'expenses')
 *  - visibility: 'public' | 'private' (fijo por uso; sin UI)
 *  - max: máximo de imágenes (por defecto 5)
 *  - onChange(count): avisa cuántas imágenes hay listas para subir
 *  - hint: texto de ayuda
 *  - leading: fichas extra que se pintan ANTES en la misma grilla (p. ej. las fotos ya
 *    guardadas del gasto), para que todo fluya en una sola grilla sin saltos de fila
 */
export const MultiImageUpload = React.forwardRef(function MultiImageUpload(
  { folder = 'general', visibility = 'private', max = 5, onChange, hint, leading = null },
  ref,
) {
  const inputRef = React.useRef(null);
  const seq = React.useRef(0);
  const [images, setImages] = React.useState([]); // [{ id, file, previewUrl, rotation }]
  const [error, setError] = React.useState(null);

  React.useEffect(() => () => { images.forEach((img) => URL.revokeObjectURL(img.previewUrl)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setAll = (next) => {
    setImages(next);
    onChange && onChange(next.length);
  };

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) { setError('El archivo debe ser una imagen.'); return; }
    setError(null);
    const room = max - images.length;
    if (incoming.length > room) setError(`Máximo ${max} imágenes.`);
    const accepted = incoming.slice(0, Math.max(0, room)).map((file) => ({
      id: ++seq.current,
      file,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
    }));
    if (accepted.length) setAll([...images, ...accepted]);
  };

  const remove = (id) => {
    const img = images.find((i) => i.id === id);
    if (img) URL.revokeObjectURL(img.previewUrl);
    setError(null);
    setAll(images.filter((i) => i.id !== id));
  };

  const rotate = (id) => {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, rotation: (i.rotation + 90) % 360 } : i)));
  };

  React.useImperativeHandle(ref, () => ({
    count: () => images.length,
    // Sube todas en secuencia y devuelve los `name` de referencia (en el orden de la grilla).
    // Antes de subir se procesa la foto si hace falta: la rotación se hornea en los píxeles
    // y las fotos pesadas de cámara se reescalan/comprimen (evita chocar con los límites de
    // subida del servidor y ahorra datos móviles).
    async uploadAll() {
      const names = [];
      for (const img of images) {
        let file = img.file;
        const needsProcessing = img.rotation % 360 !== 0 || img.file.size > MAX_UPLOAD_BYTES;
        if (needsProcessing) {
          const blob = await getRotatedBlob(img.previewUrl, img.rotation, img.file.type, MAX_DIMENSION);
          const ext = blob.type === 'image/png' ? 'png' : 'jpg';
          const base = img.file.name.replace(/\.[^.]+$/, '');
          file = new File([blob], `${base}.${ext}`, { type: blob.type });
        }
        const res = await api.uploadFile(file, { folder, visibility });
        if (res?.name) names.push(res.name);
      }
      return names;
    },
  }), [images, folder, visibility]);

  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {leading}
        {images.map((img) => (
          <div key={img.id} className={styles.thumb}>
            <img src={img.previewUrl} alt="" data-rotation={img.rotation} />
            <button type="button" className={styles.remove} onClick={() => remove(img.id)} aria-label="Quitar imagen">
              <i className="fas fa-times" aria-hidden="true" />
            </button>
            <button type="button" className={styles.rotate} onClick={() => rotate(img.id)} aria-label="Girar 90°" title="Girar 90°">
              <i className="fas fa-rotate-right" aria-hidden="true" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button type="button" className={styles.add} onClick={() => inputRef.current?.click()}>
            <i className="fas fa-camera" aria-hidden="true" />
            <span>Añadir foto</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.input}
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
      />
      {(error || hint) && (
        <span className={[styles.hint, error ? styles.errorText : ''].filter(Boolean).join(' ')}>
          {error || hint}
        </span>
      )}
    </div>
  );
});

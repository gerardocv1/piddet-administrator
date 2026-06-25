import React from 'react';
import Cropper from 'react-easy-crop';
import { api } from '../../lib/api.js';
import { getCroppedBlob } from '../../lib/cropImage.js';
import styles from './FileUpload.module.css';

/**
 * Componente de subida de imágenes a S3 con edición previa (recorte y giro).
 *
 * Flujo: el usuario elige una imagen → se previsualiza en el navegador y puede recortarla/girarla →
 * la subida a S3 ocurre solo cuando el contenedor invoca `upload()` (p. ej. al pulsar "Guardar").
 * `upload()` (expuesto por ref) devuelve el resultado del backend (incluye `name`, la referencia a
 * guardar en la entidad) o `null` si el usuario no eligió una imagen nueva.
 *
 * La visibilidad (pública/privada) NO la elige el usuario: se fija al instanciar el componente con
 * la prop `visibility`, según el uso (las imágenes que se renderizan por URL deben ser públicas).
 *
 * Props:
 *  - folder: carpeta destino en S3 ('general'|'items'|'menus'|'categories'|'documents')
 *  - visibility: 'public' | 'private' (fijo por uso; sin UI)
 *  - value: URL de la imagen actual (previsualización inicial)
 *  - aspect: relación de aspecto del recorte (por defecto 1 = cuadrado)
 *  - cropShape: 'rect' | 'round'
 *  - onChange(hasImage): avisa cuando hay (o no) una imagen nueva lista para subir
 *  - hint: texto de ayuda
 */
export const FileUpload = React.forwardRef(function FileUpload(
  { folder = 'general', visibility = 'private', value = null, aspect = 1, cropShape = 'rect', onChange, hint },
  ref,
) {
  const inputRef = React.useRef(null);
  const srcRef = React.useRef(null); // object URL local de la imagen elegida (para recortar/subir)
  const mimeRef = React.useRef(''); // tipo MIME del archivo elegido (para conservar transparencia en PNG)

  const [src, setSrc] = React.useState(null); // imagen en edición (object URL); null = sin elegir
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [areaPixels, setAreaPixels] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [dragging, setDragging] = React.useState(false);

  React.useEffect(() => () => { if (srcRef.current) URL.revokeObjectURL(srcRef.current); }, []);

  const reset = () => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); setAreaPixels(null); };

  const loadFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('El archivo debe ser una imagen.'); return; }
    setError(null);
    if (srcRef.current) URL.revokeObjectURL(srcRef.current);
    const url = URL.createObjectURL(file);
    srcRef.current = url;
    mimeRef.current = file.type;
    reset();
    setSrc(url);
    onChange && onChange(true);
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    loadFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  };
  const onDragOver = (e) => { e.preventDefault(); if (!dragging) setDragging(true); };
  const onDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragging(false);
  };

  // Pegar imagen desde el portapapeles (Ctrl/Cmd+V) mientras el componente está montado.
  React.useEffect(() => {
    const onPaste = (e) => {
      const file = Array.from(e.clipboardData?.items || [])
        .find((it) => it.type.startsWith('image/'))?.getAsFile();
      if (file) loadFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = () => {
    if (srcRef.current) { URL.revokeObjectURL(srcRef.current); srcRef.current = null; }
    setSrc(null);
    reset();
    onChange && onChange(false);
  };

  const rotate = (delta) => setRotation((r) => (((r + delta) % 360) + 360) % 360);

  // Sube la imagen editada a S3. La invoca el contenedor al guardar. Devuelve el resultado o null.
  React.useImperativeHandle(ref, () => ({
    hasImage: () => !!src,
    async upload() {
      if (!src || !areaPixels) return null;
      const blob = await getCroppedBlob(src, areaPixels, rotation, mimeRef.current);
      const isPng = blob.type === 'image/png';
      const file = new File([blob], isPng ? 'image.png' : 'image.jpg', { type: blob.type });
      return api.uploadFile(file, { folder, visibility });
    },
  }), [src, areaPixels, rotation, folder, visibility]);

  const open = () => inputRef.current?.click();

  return (
    <div
      className={`${styles.root}${dragging ? ` ${styles.dragging}` : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {dragging && (
        <div className={styles.dropOverlay}>
          <i className="fas fa-cloud-arrow-up" aria-hidden="true" />
          <span>Suelta la imagen aquí</span>
        </div>
      )}
      {src ? (
        <>
          <div className={styles.stage}>
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_, areaPx) => setAreaPixels(areaPx)}
            />
          </div>
          <div className={styles.controls}>
            <button type="button" className={styles.ctrlBtn} onClick={() => rotate(-90)} title="Girar a la izquierda">
              <i className="fas fa-rotate-left" />
            </button>
            <button type="button" className={styles.ctrlBtn} onClick={() => rotate(90)} title="Girar a la derecha">
              <i className="fas fa-rotate-right" />
            </button>
            <label className={styles.zoom}>
              <i className="fas fa-magnifying-glass" aria-hidden="true" />
              <input type="range" min={1} max={3} step={0.01} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom" />
            </label>
            <div className={styles.spacer} />
            <button type="button" className={styles.ctrlBtn} onClick={open} title="Cambiar imagen">
              <i className="fas fa-image" /> Cambiar
            </button>
            <button type="button" className={styles.ctrlBtn} onClick={clear} title="Quitar imagen">
              <i className="fas fa-xmark" />
            </button>
          </div>
        </>
      ) : (
        <button type="button" className={styles.dropzone} onClick={open}>
          {value ? (
            <img className={styles.current} src={value} alt="Imagen actual" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <span className={styles.placeholder}>
              <i className="fas fa-cloud-arrow-up" aria-hidden="true" />
              <span>Haz clic, arrastra una imagen o pega desde el portapapeles</span>
            </span>
          )}
          <span className={styles.overlayHint}><i className="fas fa-camera" /> Elegir imagen</span>
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" className={styles.input} onChange={onPick} />

      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <div className={styles.error}><i className="fas fa-triangle-exclamation" /> {error}</div>}
    </div>
  );
});

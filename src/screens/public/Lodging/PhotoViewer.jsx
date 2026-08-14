import React from 'react';
import s from './PhotoViewer.module.css';

// Visor de fotos a pantalla completa para las vistas públicas. Se abre desde cualquier galería
// (la principal de la unidad o la de un espacio) con la lista de fotos y la que se tocó.
// Navegación por flechas, teclado y deslizamiento; se cierra con Esc, con la X o tocando el fondo.
export function PhotoViewer({ files = [], index = 0, alt = '', onClose }) {
  const [current, setCurrent] = React.useState(index);
  const touchStartX = React.useRef(null);

  const total = files.length;
  const go = React.useCallback(
    (step) => setCurrent((i) => (i + step + total) % total),
    [total],
  );

  React.useEffect(() => setCurrent(index), [index]);

  // Teclado y bloqueo del scroll del fondo mientras el visor está abierto.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  if (total === 0) return null;

  const onTouchEnd = (e) => {
    const startX = touchStartX.current;
    if (startX == null) return;
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label="Fotos"
      onClick={onClose}
      onTouchStart={(e) => { touchStartX.current = e.changedTouches[0].clientX; }}
      onTouchEnd={onTouchEnd}>
      <div className={s.bar}>
        {total > 1 && <span className={s.count}>{current + 1} / {total}</span>}
        <button type="button" className={s.close} onClick={onClose} aria-label="Cerrar">
          <i className="fas fa-times" />
        </button>
      </div>

      {/* El clic en la imagen no cierra: solo el fondo y la X. */}
      <img className={s.photo} src={files[current].url} alt={`${alt} · foto ${current + 1}`}
        onClick={(e) => e.stopPropagation()} />

      {total > 1 && (
        <>
          <button type="button" className={`${s.nav} ${s.prev}`} aria-label="Foto anterior"
            onClick={(e) => { e.stopPropagation(); go(-1); }}>
            <i className="fas fa-chevron-left" />
          </button>
          <button type="button" className={`${s.nav} ${s.next}`} aria-label="Foto siguiente"
            onClick={(e) => { e.stopPropagation(); go(1); }}>
            <i className="fas fa-chevron-right" />
          </button>
        </>
      )}
    </div>
  );
}

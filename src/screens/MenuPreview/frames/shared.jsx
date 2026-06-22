import React from 'react';
import s from './frames.module.css';

// Utilidades compartidas por los frames (plantillas de presentación de productos por categoría).

export const fmtPrice = (n) => (n == null ? '' : '$' + Number(n).toLocaleString('es-CO'));

// URLs candidatas de imagen del producto, en orden de preferencia.
export const thumbSrcs = (it) => [it.thumbnail_file, it.standard_file, it.file];

// Miniatura con cascada de URLs (thumbnail → standard → original) y degradación a icono.
// `className` define el tamaño según el frame; las clases base dan el aspecto común.
export function ItemThumb({ srcs, alt, className = '' }) {
  const list = (srcs || []).filter(Boolean);
  const [idx, setIdx] = React.useState(0);
  const src = list[idx];
  if (!src) {
    return (
      <span className={`${s.thumbFallback} ${className}`} aria-hidden="true">
        <i className="fas fa-utensils" />
      </span>
    );
  }
  return <img className={`${s.thumb} ${className}`} src={src} alt={alt} loading="lazy" onError={() => setIdx((i) => i + 1)} />;
}

// Bloque de texto del producto: nombre + filete + precio, y descripción debajo.
// `emphasis` agranda nombre/precio (para el producto destacado del frame Hero).
export function ItemBody({ it, emphasis = false }) {
  return (
    <div className={s.body}>
      <div className={s.itemTop}>
        <h3 className={`${s.itemName} ${emphasis ? s.itemNameLg : ''}`}>{it.name}</h3>
        <span className={s.leader} aria-hidden="true" />
        <span className={`${s.itemPrice} ${emphasis ? s.itemPriceLg : ''}`}>{fmtPrice(it.price)}</span>
      </div>
      {it.description && <p className={s.itemDesc}>{it.description}</p>}
    </div>
  );
}

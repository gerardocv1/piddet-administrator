import React from 'react';
import { ItemThumb, ItemBody, thumbSrcs } from './shared.jsx';
import s from './frames.module.css';

// 2 columnas con foto (presentación por defecto, equilibrada).
export function Grid2Frame({ items }) {
  return (
    <div className={s.grid2}>
      {items.map((it) => (
        <div key={it.id} className={s.g2Row}>
          <ItemThumb srcs={thumbSrcs(it)} alt={it.name} className={s.g2Thumb} />
          <ItemBody it={it} />
        </div>
      ))}
    </div>
  );
}

// 1 columna con foto grande: da protagonismo a cada producto (categorías cortas/destacadas).
export function ListFrame({ items }) {
  return (
    <div className={s.list}>
      {items.map((it) => (
        <div key={it.id} className={s.listRow}>
          <ItemThumb srcs={thumbSrcs(it)} alt={it.name} className={s.listThumb} />
          <ItemBody it={it} />
        </div>
      ))}
    </div>
  );
}

// 2 columnas sin foto: limpio y legible, sin imágenes (texto + precio).
export function Grid2TextFrame({ items }) {
  return (
    <div className={s.grid2Text}>
      {items.map((it) => (
        <div key={it.id} className={s.g3Item}>
          <ItemBody it={it} />
        </div>
      ))}
    </div>
  );
}

// 2 columnas sin foto ni descripción: solo nombre + precio, máxima compacidad.
export function Grid2TextCompactFrame({ items }) {
  return (
    <div className={s.grid2Text}>
      {items.map((it) => (
        <div key={it.id} className={s.g3Item}>
          <ItemBody it={it} hideDesc />
        </div>
      ))}
    </div>
  );
}

// 3 columnas sin foto: compacto, ideal para listas largas como bebidas.
export function Grid3Frame({ items }) {
  return (
    <div className={s.grid3}>
      {items.map((it) => (
        <div key={it.id} className={s.g3Item}>
          <ItemBody it={it} />
        </div>
      ))}
    </div>
  );
}

// Destacado con foto + lista: el primer producto como banner (foto grande arriba) y el resto
// en lista debajo, a lo ancho.
export function HeroListFrame({ items }) {
  const [first, ...rest] = items;
  if (!first) return null;
  return (
    <div className={s.bannerFrame}>
      <div className={s.banner}>
        <ItemThumb srcs={thumbSrcs(first)} alt={first.name} className={s.bannerImg} />
        <div className={s.bannerBody}><ItemBody it={first} /></div>
      </div>
      {rest.length > 0 && (
        <div className={s.bannerList}>
          {rest.map((it) => (
            <div key={it.id} className={s.heroRow}><ItemBody it={it} /></div>
          ))}
        </div>
      )}
    </div>
  );
}

// Destacado: el primer producto en grande (media columna con foto) y el resto en lista al lado.
export function HeroFrame({ items }) {
  const [first, ...rest] = items;
  if (!first) return null;
  return (
    <div className={s.hero}>
      <div className={s.heroMain}>
        <ItemThumb srcs={thumbSrcs(first)} alt={first.name} className={s.heroImg} />
        <div className={s.heroBody}><ItemBody it={first} /></div>
      </div>
      <div className={s.heroList}>
        {rest.map((it) => (
          <div key={it.id} className={s.heroRow}><ItemBody it={it} /></div>
        ))}
      </div>
    </div>
  );
}

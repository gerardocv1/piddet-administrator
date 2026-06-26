import React from 'react';
import s from './PublicBottomBar.module.css';

// Barra de acciones inferior compartida por las vistas públicas (portada de compañía y carta del
// menú): da una línea gráfica común y sensación de app. En móvil ocupa todo el ancho (alcance del
// pulgar); en escritorio flota como un "dock" centrado. No se imprime.
//
// Presentacional puro: recibe `items`, cada uno { key, icon, label, primary?, onClick? | href? }.
// Con `href` se renderiza como enlace nativo (las vistas públicas viven fuera del router); con
// `onClick`, como botón. `primary` resalta la acción principal (p. ej. Compartir).
export function PublicBottomBar({ items = [] }) {
  return (
    <nav className={s.bar} aria-label="Acciones">
      <div className={s.inner}>
        {items.map((it) => {
          const cls = [s.action, it.primary ? s.primary : ''].filter(Boolean).join(' ');
          const content = (
            <>
              <i className={it.icon} aria-hidden="true" />
              <span className={s.label}>{it.label}</span>
            </>
          );
          return it.href ? (
            <a key={it.key} className={cls} href={it.href}
              target={it.target} rel={it.target === '_blank' ? 'noopener noreferrer' : undefined}>
              {content}
            </a>
          ) : (
            <button key={it.key} type="button" className={cls} onClick={it.onClick}>
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

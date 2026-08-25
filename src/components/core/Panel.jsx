import React from 'react';
import styles from './Panel.module.css';

/**
 * Superficie compacta, hermana de Card: título y contenido en un solo bloque, separados por un
 * aire pequeño en vez de la línea + sombra de Card.Header. Para piezas densas tipo KPI o
 * resúmenes ("Ventas de hoy"), donde el encabezado no necesita leerse como sección aparte.
 *
 * A diferencia de Card, en móvil CONSERVA el marco: sigue viéndose como una tarjetita, solo
 * que con el aire interior más apretado.
 *
 * Props: `title` (encabezado), `action` (nodo a la derecha del título, p. ej. un IconButton);
 * sin título ni acción es solo la superficie compacta.
 */
export function Panel({ title, action, className = '', children, ...rest }) {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(' ')} {...rest}>
      {(title || action) && (
        <div className={styles.head}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

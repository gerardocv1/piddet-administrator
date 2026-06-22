import React from 'react';
import styles from './Spinner.module.css';

const SIZE_CLASS = { sm: styles.sm, md: styles.md, lg: styles.lg };

/**
 * Indicador de carga (ruedita girando). Da feedback al usuario mientras se
 * espera la respuesta de un servicio, en lugar de dejar la zona en blanco.
 *
 * Hereda el color del contexto (`currentColor`), así funciona igual dentro de
 * un botón naranja que sobre una tarjeta clara u oscura.
 *
 * - `size`: sm | md | lg
 * - `center`: ocupa el ancho disponible y centra el spinner (para paneles/zonas en carga)
 * - `label`: texto opcional junto al spinner
 */
export function Spinner({ size = 'md', center = false, label = null, className = '' }) {
  const ring = (
    <span
      className={[styles.spinner, SIZE_CLASS[size] || SIZE_CLASS.md, className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-label={label || 'Cargando'}
    />
  );

  if (!center && !label) return ring;

  return (
    <div className={[styles.wrap, center ? styles.center : ''].filter(Boolean).join(' ')}>
      {ring}
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

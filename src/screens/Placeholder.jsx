import React from 'react';
import styles from './Placeholder.module.css';

/** Marcador para módulos aún sin maquetar (p. ej. Roles). */
export function Placeholder({ name }) {
  return (
    <div className={styles.box}>
      <i className={`fas fa-screwdriver-wrench ${styles.icon}`} />
      <h3 className={styles.title}>Módulo «{name}»</h3>
      <p className={styles.text}>Reutiliza los mismos componentes en estilo flat. Pendiente de maquetar.</p>
    </div>
  );
}

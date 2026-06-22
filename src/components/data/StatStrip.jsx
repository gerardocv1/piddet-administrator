import React from 'react';
import { Spinner } from '../core/Spinner.jsx';
import styles from './StatStrip.module.css';

/** Franja de KPIs: un solo panel con columnas separadas por borde (estilo flat).
 *  Mientras `loading`, muestra una ruedita en lugar de una franja vacía. */
export function StatStrip({ stats = [], loading = false }) {
  if (loading) {
    return (
      <div className={styles.strip} style={{ '--cols': 1 }}>
        <Spinner center label="Cargando indicadores…" />
      </div>
    );
  }
  return (
    <div className={styles.strip} style={{ '--cols': stats.length || 1 }}>
      {stats.map((s) => (
        <div key={s.label} className={styles.item}>
          <div className={styles.label}>{s.label}</div>
          <div className={styles.value}>{s.value}</div>
          {s.delta && (
            <div className={[styles.delta, s.up ? styles.up : ''].filter(Boolean).join(' ')}>
              <i className={s.up ? 'fas fa-arrow-trend-up' : 'fas fa-arrow-trend-down'} />{s.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

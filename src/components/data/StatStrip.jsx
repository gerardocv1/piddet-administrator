import React from 'react';
import { Spinner } from '../core/Spinner.jsx';
import styles from './StatStrip.module.css';

/** Franja de KPIs: un solo panel con columnas separadas por borde (estilo flat).
 *  Mientras `loading`, muestra una ruedita en lugar de una franja vacía.
 *
 *  stats: [{ label, value, delta?, up?, desktopOnly? }]. Un KPI `desktopOnly` se oculta en el
 *  teléfono: la franja se queda con lo esencial y el dato secundario sigue en escritorio. */
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
        <div key={s.label} className={[styles.item, s.desktopOnly ? styles.desktopOnly : ''].filter(Boolean).join(' ')}>
          <div className={styles.label}>{s.label}</div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{s.value}</span>
            {s.delta && (
              <span className={[styles.delta, s.up ? styles.up : styles.down].join(' ')}>
                <i className={s.up ? 'fas fa-arrow-trend-up' : 'fas fa-arrow-trend-down'} />{s.delta}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

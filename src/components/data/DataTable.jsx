import React from 'react';
import styles from './DataTable.module.css';

/**
 * Tabla de listados flat (encabezado gris en mayúsculas, filas con hairline).
 * En móvil hace scroll horizontal con ancho mínimo. Centraliza los estados
 * de carga, error y vacío para que todas las pantallas se vean igual.
 *
 * columns: [{ key, header, width?, align?: 'left'|'right'|'center', render?: (row) => node }]
 */
export function DataTable({ columns = [], rows = [], rowKey = 'id', empty = 'Sin registros', loading = false, error = null }) {
  const colSpan = columns.length;
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={styles.th} style={{ width: c.width, textAlign: c.align || 'left' }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={colSpan} className={`${styles.td} ${styles.empty}`}><i className="fas fa-spinner fa-spin" /> Cargando…</td></tr>
          )}
          {!loading && error && (
            <tr><td colSpan={colSpan} className={`${styles.td} ${styles.error}`}><i className="fas fa-triangle-exclamation" /> {error}</td></tr>
          )}
          {!loading && !error && rows.length === 0 && (
            <tr><td colSpan={colSpan} className={`${styles.td} ${styles.empty}`}>{empty}</td></tr>
          )}
          {!loading && !error && rows.map((r, i) => (
            <tr key={r[rowKey] ?? i} className={styles.row}>
              {columns.map((c) => (
                <td key={c.key} className={styles.td} style={{ textAlign: c.align || 'left' }}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React from 'react';
import styles from './Pagination.module.css';

// Genera la lista de páginas a mostrar con elipsis: 1 … 4 5 [6] 7 8 … 20
function pageList(current, last) {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set([1, last, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

/**
 * Paginador reutilizable. Controlado por `page` / `lastPage`; avisa cambios con `onChange`.
 * `total` (opcional) muestra el conteo de registros.
 */
export function Pagination({ page = 1, lastPage = 1, total = null, onChange, disabled = false }) {
  // Se muestra siempre (al menos la página 1) para que el listado se vea consistente.
  const last = Math.max(1, lastPage);
  const go = (p) => { if (!disabled && p >= 1 && p <= last && p !== page) onChange && onChange(p); };

  return (
    <div className={styles.bar}>
      {total != null && <span className={styles.count}>{total} {total === 1 ? 'registro' : 'registros'}</span>}
      <div className={styles.pages}>
        <button type="button" className={styles.nav} disabled={disabled || page <= 1} onClick={() => go(page - 1)} aria-label="Anterior">
          <i className="fas fa-chevron-left" />
        </button>
        {pageList(page, last).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <button key={p} type="button"
              className={[styles.page, p === page ? styles.active : ''].filter(Boolean).join(' ')}
              disabled={disabled} onClick={() => go(p)}>
              {p}
            </button>
          )
        )}
        <button type="button" className={styles.nav} disabled={disabled || page >= last} onClick={() => go(page + 1)} aria-label="Siguiente">
          <i className="fas fa-chevron-right" />
        </button>
      </div>
    </div>
  );
}

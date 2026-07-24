import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
import styles from './PageHeader.module.css';

/**
 * Cabecera de pantalla de detalle: tarjeta con botón volver, subtítulo, acciones (badges +
 * botones) y, opcionalmente, una rejilla de metadatos etiqueta-valor y una nota al pie
 * (p. ej. aviso de cancelación/anulación). El título principal vive en el Topbar (useSetPageTitle).
 *
 * meta: [{ label, value }]  — se omiten las entradas falsy. El valor puede ser texto (se recorta
 * con ellipsis) o un nodo, p. ej. un Badge de estado (se muestra completo).
 */
export function PageHeader({ onBack, backTitle = 'Volver', subtitle, actions, meta, note }) {
  const metaItems = Array.isArray(meta) ? meta.filter(Boolean) : [];
  const isText = (v) => typeof v === 'string' || typeof v === 'number';
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        {onBack && <IconButton icon="fas fa-arrow-left" variant="light" title={backTitle} onClick={onBack} />}
        <div className={styles.text}>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {metaItems.length > 0 && (
        <dl className={styles.meta}>
          {metaItems.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd className={isText(m.value) ? '' : styles.metaNode}>{m.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {note && <div className={styles.note}>{note}</div>}
    </div>
  );
}

import React from 'react';
import styles from './LineList.module.css';

/** Listado de líneas nombre · precio (cargos, pagos, facturas, servicios): filas con hairline,
 *  precio alineado a la derecha y acción opcional al final. `compact` reduce el alto de fila
 *  para cuentas largas; `empty` pinta el texto de estado vacío cuando no hay líneas. */
export function LineList({ compact = false, empty = null, children, className = '' }) {
  if (React.Children.count(children) === 0) {
    return empty ? <p className={styles.empty}>{empty}</p> : null;
  }
  return (
    <ul className={[styles.lines, compact ? styles.compact : '', className].filter(Boolean).join(' ')}>
      {children}
    </ul>
  );
}

/** Una línea: `children` es el nombre (texto y fragmentos como LineList.Muted / LineList.Status),
 *  `price` va fijo a la derecha y `action` (p. ej. un IconButton) al final de la fila.
 *  `annulled` tacha la línea; con `onClick` toda la fila es un botón y muestra el chevron. */
function Item({ price = null, annulled = false, onClick = null, title, action = null, children }) {
  const body = (
    <>
      <span className={styles.name}>{children}</span>
      {price != null && <span className={styles.price}>{price}</span>}
    </>
  );
  return (
    <li className={[styles.line, annulled ? styles.annulled : ''].filter(Boolean).join(' ')}>
      {onClick ? (
        <button type="button" className={styles.rowButton} title={title} onClick={onClick}>
          {body}
          <i className={`fas fa-chevron-right ${styles.chevron}`} />
        </button>
      ) : body}
      {action}
    </li>
  );
}

/** Fragmento secundario del nombre (cantidad, fecha, numeración). */
function Muted({ children }) {
  return <span className={styles.muted}>{children}</span>;
}

/** Estado corto de la línea; tones: warning (por pagar), muted (pagada), off (anulada/cancelada). */
function Status({ tone = 'muted', children }) {
  const toneClass = { warning: styles.statusWarn, muted: styles.statusMuted, off: styles.statusOff }[tone] || styles.statusMuted;
  return <span className={`${styles.status} ${toneClass}`}>{children}</span>;
}

LineList.Item = Item;
LineList.Muted = Muted;
LineList.Status = Status;

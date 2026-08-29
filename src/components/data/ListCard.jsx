import React from 'react';
import styles from './ListCard.module.css';

/**
 * Tarjeta de una fila de listado en móvil: la versión "objeto de una lista" de lo que en
 * escritorio es una fila de `DataTable`.
 *
 * A diferencia de `Card` —que en el teléfono se disuelve a propósito, sin marco ni superficie—
 * esta conserva el marco, como `InfoCard`: en un listado, el borde es lo que separa un registro
 * del siguiente. Sin él, nombre, estado y acción de varias filas se leen como un solo bloque
 * de datos sueltos.
 *
 * Props:
 *  - media: nodo de identidad a la izquierda (un `Avatar`, una baldosa con icono)
 *  - title / subtitle: nombre del registro y su línea identificadora (código, documento)
 *  - badge: estado del registro (un `Badge`); abre el pie de la tarjeta
 *  - meta: dato corto que acompaña al estado (vigencia, plan, total)
 *  - action: única acción de la fila (un `Button` pequeño), a la derecha del pie
 *  - onClick: navegar al detalle — hace tappable la zona de identidad y pinta el chevron
 *
 * El pie solo existe si hay `badge`, `meta` o `action`.
 */
export function ListCard({
  media = null, title, subtitle = null, badge = null, meta = null, action = null,
  onClick = null, className = '',
}) {
  const head = (
    <>
      {media && <span className={styles.media}>{media}</span>}
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
      {onClick && <i className={`fas fa-chevron-right ${styles.chevron}`} aria-hidden="true" />}
    </>
  );

  return (
    <article className={[styles.card, className].filter(Boolean).join(' ')}>
      {onClick
        ? <button type="button" className={styles.head} onClick={onClick}>{head}</button>
        : <div className={styles.head}>{head}</div>}
      {(badge || meta || action) && (
        <div className={styles.foot}>
          <span className={styles.state}>
            {badge}
            {meta && <span className={styles.meta}>{meta}</span>}
          </span>
          {action}
        </div>
      )}
    </article>
  );
}

import React from 'react';
import { Dropdown } from '../core/Dropdown.jsx';
import { IconButton } from '../core/IconButton.jsx';
import { Button } from '../core/Button.jsx';
import styles from './InfoCard.module.css';

/**
 * Tarjeta de recurso plegable (un usuario, un producto, una tienda): colapsada muestra la
 * identidad —imagen o icono, nombre y descripción— con el menú de acciones a la derecha;
 * desplegada revela el detalle en pares etiqueta · valor.
 *
 * Props:
 *  - title: nombre del recurso
 *  - description: línea secundaria bajo el nombre (se recorta a una línea)
 *  - media: nodo libre para la identidad (p. ej. <Avatar/>); tiene prioridad sobre `icon`
 *  - icon: atajo — clase Font Awesome pintada en una baldosa con el acento de compañía
 *  - actions: ítems del Dropdown de la esquina ([{ label, icon?, onClick, variant?, disabled? }]);
 *    sin acciones no se pinta el menú
 *  - footerActions: mismos ítems, pero como tira de botones al pie de la tarjeta —siempre
 *    visibles, sin desplegar ni abrir el menú. Pensada para el teléfono, donde esconder las
 *    acciones del recurso en el ⋮ las vuelve invisibles; conviven con `actions` o la sustituyen
 *    (la pantalla decide según el tamaño)
 *  - defaultOpen: arranca desplegada
 *
 * El detalle son `InfoCard.Field` (label + children); cualquier otro nodo hijo se pinta tal
 * cual debajo de los campos.
 */
export function InfoCard({ title, description, media = null, icon = null, actions = [], footerActions = [], defaultOpen = false, className = '', children }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const detailId = React.useId();
  const toggle = () => setOpen((o) => !o);

  const fields = React.Children.toArray(children).filter((c) => c?.type === Field);
  const rest = React.Children.toArray(children).filter((c) => c?.type !== Field);

  return (
    <section className={[styles.card, open ? styles.open : '', className].filter(Boolean).join(' ')}>
      <div className={styles.head} onClick={toggle}>
        {media || (icon && <span className={styles.iconTile}><i className={icon} aria-hidden="true" /></span>)}
        <div className={styles.text}>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        <div className={styles.side}>
          {actions.length > 0 ? (
            <Dropdown items={actions}
              trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="ghost" size="sm" title="Acciones" />} />
          ) : <span />}
          <IconButton icon={`fas fa-chevron-down ${styles.chevIcon}`} variant="ghost" size="sm"
            aria-expanded={open} aria-controls={detailId}
            title={open ? 'Ocultar detalle' : 'Ver detalle'}
            onClick={(e) => { e.stopPropagation(); toggle(); }} />
        </div>
      </div>
      <div id={detailId} className={styles.detail} aria-hidden={!open}>
        <div className={styles.detailInner}>
          {fields.length > 0 && <dl className={styles.fields}>{fields}</dl>}
          {rest.length > 0 && <div className={styles.extra}>{rest}</div>}
        </div>
      </div>
      {footerActions.length > 0 && (
        <div className={styles.footer}>
          {footerActions.map((a) => (
            <Button key={a.label} variant={a.variant || 'secondary'} size="sm" icon={a.icon}
              className={styles.footerBtn} disabled={a.disabled} onClick={a.onClick}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}

/** Par etiqueta · valor del detalle; el valor admite nodos (un Badge, un enlace). */
function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{children}</dd>
    </div>
  );
}

InfoCard.Field = Field;

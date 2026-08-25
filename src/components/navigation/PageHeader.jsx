import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
import { Dropdown } from '../core/Dropdown.jsx';
import { useIsMobile } from '../../lib/useIsMobile.js';
import { useSetPageBack } from '../../lib/pageTitle.jsx';
import styles from './PageHeader.module.css';

/**
 * Cabecera de pantalla de detalle: título + subtítulo a la izquierda, UNA acción visible y el
 * resto en el menú ⋮, más la rejilla de metadatos etiqueta-valor y una nota al pie (p. ej.
 * aviso de cancelación). El título de la SECCIÓN vive en el Topbar (useSetPageTitle), igual que
 * la flecha de volver: `onBack` se publica allí (vía useSetPageBack) y aquí no hay botón propio.
 *
 * Reglas de la cabecera:
 *  - `title` es el nombre del recurso (la cabaña, el afiliado, el turno); `subtitle` es su dato
 *    de contexto en pequeño (la fecha abreviada de la estadía, el plan, la hora).
 *  - `action` es UN solo nodo (el botón primario de la pantalla). Si hay más acciones van en
 *    `menu` ([{ label, icon?, onClick, variant?, disabled? }]), que pinta el kebab ⋮.
 *  - El estado NO va en la fila de acciones: es un dato — va en `meta` como Badge
 *    ({ label: 'Estado', value: <Badge…/> }).
 *
 * meta: [{ label, value }] — se omiten las entradas falsy. El valor puede ser texto (se recorta
 * con ellipsis) o un nodo (se muestra completo).
 *
 * `onTitleClick` vuelve el título clicable (p. ej. el nombre del afiliado que navega a su
 * ficha) manteniendo exactamente la misma tipografía.
 *
 * En móvil la cabecera se comporta como InfoCard: tarjeta con marco donde la fila superior
 * queda visible y el detalle (meta + nota) se pliega; la columna derecha apila el ⋮ arriba y
 * el chevron abajo para no gastar ancho. En escritorio el detalle está siempre visible, no hay
 * chevron y acción + ⋮ van en línea.
 */
export function PageHeader({ onBack, title, subtitle, onTitleClick, action = null, menu = [], menuWidth = 210, meta, note }) {
  useSetPageBack(onBack);
  const metaItems = Array.isArray(meta) ? meta.filter(Boolean) : [];
  const isText = (v) => typeof v === 'string' || typeof v === 'number';
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const detailId = React.useId();
  const hasDetail = metaItems.length > 0 || Boolean(note);
  const collapsible = isMobile && hasDetail;
  const toggle = () => setOpen((o) => !o);

  return (
    <div className={[styles.card, collapsible && open ? styles.open : ''].filter(Boolean).join(' ')}>
      <div className={collapsible ? `${styles.top} ${styles.topTap}` : styles.top}
        onClick={collapsible ? toggle : undefined}>
        <div className={styles.text}>
          {title && (onTitleClick ? (
            <button type="button" className={`${styles.title} ${styles.titleLink}`} onClick={onTitleClick}>
              {title}
            </button>
          ) : (
            <h3 className={styles.title}>{title}</h3>
          ))}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action && <div className={styles.action} onClick={(e) => e.stopPropagation()}>{action}</div>}
        {(menu.length > 0 || collapsible) && (
          <div className={styles.side}>
            {menu.length > 0 ? (
              <span onClick={(e) => e.stopPropagation()}>
                <Dropdown items={menu} width={menuWidth}
                  trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Más acciones" />} />
              </span>
            ) : <span />}
            {collapsible && (
              <IconButton icon={`fas fa-chevron-down ${styles.chevIcon}`} variant="ghost" size="sm"
                aria-expanded={open} aria-controls={detailId}
                title={open ? 'Ocultar detalle' : 'Ver detalle'}
                onClick={(e) => { e.stopPropagation(); toggle(); }} />
            )}
          </div>
        )}
      </div>
      {hasDetail && (
        <div id={detailId} className={styles.detail} aria-hidden={collapsible && !open}>
          <div className={styles.detailInner}>
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
        </div>
      )}
    </div>
  );
}

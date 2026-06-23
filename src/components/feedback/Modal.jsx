import React from 'react';
import { useIsMobile } from '../../lib/useIsMobile.js';
import styles from './Modal.module.css';

/**
 * Modal — diálogo responsive.
 *
 *  size="sm"  → confirmación: tarjeta compacta, SIEMPRE flotante centrada (también en móvil).
 *  size="md" | "lg" → crear/editar: centrado en escritorio; en móvil se convierte en
 *                     bottom-sheet que sube desde abajo (como el modal de filtros),
 *                     con barra de arrastre y botones al alcance del pulgar.
 *
 * `sheet` permite forzar/desactivar el comportamiento de hoja en móvil.
 */
const WIDTHS = { sm: 400, md: 500, lg: 600 };

export function Modal({ open = true, title, subtitle, children, footer, onClose, size = 'md', width, sheet, style = {}, ...rest }) {
  const isMobile = useIsMobile();
  if (!open) return null;

  const asSheet = (sheet != null ? sheet : size !== 'sm') && isMobile;
  const maxW = width || WIDTHS[size] || WIDTHS.md;

  return (
    <div onClick={onClose} className={styles.overlay} data-sheet={asSheet}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" className={styles.panel} data-sheet={asSheet} style={{ maxWidth: maxW, ...style }} {...rest}>
        {asSheet && <div className={styles.grabber}><span /></div>}
        {(title || onClose) && (
          <div className={styles.header} data-sheet={asSheet}>
            <div>
              {title && <h3 className={styles.title}>{title}</h3>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {onClose && (
              <button onClick={onClose} aria-label="Cerrar" className={styles.close}>
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && (
          <div className={styles.footer} data-sheet={asSheet}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

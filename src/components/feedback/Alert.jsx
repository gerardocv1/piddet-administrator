import React from 'react';
import styles from './Alert.module.css';

// El icono lo decide el tono: no se pasa `icon` salvo que haya una razón concreta.
const TONE_ICON = {
  info: 'fas fa-circle-info',
  success: 'fas fa-circle-check',
  warning: 'fas fa-triangle-exclamation',
  danger: 'fas fa-circle-exclamation',
  primary: 'fas fa-bell',
};

/**
 * Alert — el único mensaje en línea o de pantalla del panel. Se queda visible mientras aplique
 * (no se auto-cierra): un error del servidor SIEMPRE es un Alert junto a la acción que falló,
 * nunca un toast.
 *
 * Props:
 *   tone: 'info' | 'success' | 'warning' | 'danger' | 'primary'  (obligatorio)
 *   variant: 'quiet' (por defecto) | 'tint'   — `tint` solo para avisos que bloquean la operación
 *   title?, icon?, action?, onClose?, children
 *
 * Escalera de mensajes (cuándo usar cuál):
 *   1. Nota bajo el campo — evita el error antes de que ocurra.
 *   2. Alert en línea — consecuencia de lo que se edita aquí (dentro de la tarjeta o el modal).
 *   3. Alert de pantalla — condición que afecta a toda la vista (bajo el PageHeader).
 *   4. Toast — una acción ya terminó bien.
 *   5. ConfirmDialog / Modal sm — hay que aprobar algo que no se deshace.
 */
export function Alert({
  tone = 'info', variant = 'quiet', title, icon, action, onClose,
  children, className = '', ...rest
}) {
  const block = !!(title || action || onClose);

  return (
    <div
      role="alert"
      data-tone={TONE_ICON[tone] ? tone : 'info'}
      data-variant={variant}
      data-block={block}
      className={[styles.alert, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <span className={styles.icon} aria-hidden="true">
        <i className={icon || TONE_ICON[tone] || TONE_ICON.info} />
      </span>
      <div className={styles.content}>
        {title && <strong className={styles.title}>{title}</strong>}
        {children != null && <span className={styles.body}>{children}</span>}
      </div>
      {action && <span className={styles.action}>{action}</span>}
      {onClose && (
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
          <i className="fas fa-xmark" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

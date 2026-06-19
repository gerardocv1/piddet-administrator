import React from 'react';
import styles from './IconButton.module.css';

const VARIANT_CLASS = {
  primary: styles.primary,
  light: styles.light,
  danger: styles.danger,
  success: styles.success,
  ghost: styles.ghost,
};
const SIZE_CLASS = { sm: styles.sm, md: styles.md, lg: styles.lg };

/** Botón solo-icono para acciones de fila y barras de herramientas. */
export function IconButton({ icon, variant = 'light', size = 'md', round = false, disabled = false, title, className = '', ...rest }) {
  const cls = [
    styles.btn,
    VARIANT_CLASS[variant] || VARIANT_CLASS.light,
    SIZE_CLASS[size] || SIZE_CLASS.md,
    round ? styles.round : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button title={title} aria-label={title} disabled={disabled} className={cls} {...rest}>
      <i className={icon} aria-hidden="true" />
    </button>
  );
}

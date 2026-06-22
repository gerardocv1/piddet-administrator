import React from 'react';
import { Spinner } from './Spinner.jsx';
import styles from './Button.module.css';

const VARIANT_CLASS = {
  primary: styles.primary,
  secondary: styles.secondary,
  dark: styles.dark,
  success: styles.success,
  danger: styles.danger,
  'outline-primary': styles.outlinePrimary,
};
const SIZE_CLASS = { sm: styles.sm, md: styles.md, lg: styles.lg };

/** Botón de acción — estilo flat (sin sombra). Naranja para la acción principal.
 *  `loading` muestra una ruedita y deshabilita el botón mientras se espera una
 *  respuesta del servidor, para dar feedback al usuario en cualquier acción async. */
export function Button({
  variant = 'primary', size = 'md', pill = false, block = false,
  disabled = false, loading = false, icon = null, iconRight = null, children, className = '', ...rest
}) {
  const cls = [
    styles.btn,
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    SIZE_CLASS[size] || SIZE_CLASS.md,
    pill ? styles.pill : '',
    block ? styles.block : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner size="sm" /> : (icon && <i className={icon} aria-hidden="true" />)}
      {children}
      {!loading && iconRight && <i className={iconRight} aria-hidden="true" />}
    </button>
  );
}

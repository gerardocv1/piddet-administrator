import React from 'react';
import styles from './Button.module.css';

const VARIANT_CLASS = {
  primary: styles.primary,
  secondary: styles.secondary,
  dark: styles.dark,
  success: styles.success,
  danger: styles.danger,
  neutral: styles.neutral,
  'outline-primary': styles.outlinePrimary,
  'outline-success': styles.outlineSuccess,
  link: styles.link,
};
const SIZE_CLASS = { sm: styles.sm, md: styles.md, lg: styles.lg };

/** Botón de acción — estilo flat (sin sombra). Naranja para la acción principal.
 *
 *  `loading` muestra la ruedita y bloquea el botón mientras se espera al servidor, pero
 *  CONSERVA el color pleno: cargando no es lo mismo que deshabilitado, y atenuar ambos igual
 *  hacía que se confundieran. Solo `disabled` puro baja la opacidad.
 *
 *  Variantes: primary | secondary | dark | success | danger | neutral | outline-primary |
 *  outline-success | link.
 *  `link` es texto sin caja (un «ver más»): para acciones secundarias que no deben competir
 *  con el contenido; se subraya al pasar el cursor.
 *  `dashed` (solo con las outline) traza el borde punteado: la acción que FALTA hacer —un pago
 *  por registrar, un dato por completar— se lee como un hueco por llenar, no como un botón más.
 *  Tamaños: sm | md | lg (en móvil el `md` llega a 44 px de alto). */
export function Button({
  variant = 'primary', size = 'md', pill = false, block = false, dashed = false,
  disabled = false, loading = false, icon = null, iconRight = null, children, className = '', ...rest
}) {
  const cls = [
    styles.btn,
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    SIZE_CLASS[size] || SIZE_CLASS.md,
    pill ? styles.pill : '',
    block ? styles.block : '',
    dashed ? styles.dashed : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading
        ? <span className={styles.spinner} aria-hidden="true" />
        : (icon && <i className={icon} aria-hidden="true" />)}
      {children}
      {!loading && iconRight && <i className={iconRight} aria-hidden="true" />}
    </button>
  );
}

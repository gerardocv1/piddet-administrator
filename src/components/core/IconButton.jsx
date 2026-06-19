import React from 'react';

const VARIANTS = {
  primary: { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' },
  light: { bg: 'var(--gray-100)', color: 'var(--gray-600)' },
  danger: { bg: 'var(--color-danger-100)', color: 'var(--color-danger)' },
  success: { bg: 'var(--color-success-100)', color: '#1aae6f' },
  ghost: { bg: 'transparent', color: 'var(--gray-500)' },
};
const SIZES = { sm: 30, md: 38, lg: 46 };

/** Botón solo-icono para acciones de fila y barras de herramientas. */
export function IconButton({ icon, variant = 'light', size = 'md', round = false, disabled = false, title, style = {}, ...rest }) {
  const v = VARIANTS[variant] || VARIANTS.light;
  const d = SIZES[size] || SIZES.md;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: d, height: d, padding: 0, border: '1px solid transparent',
    borderRadius: round ? 'var(--radius-pill)' : 'var(--radius)',
    background: v.bg, color: v.color, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, fontSize: size === 'sm' ? '0.8rem' : '0.95rem',
    transition: 'filter .15s ease', ...style,
  };
  return (
    <button title={title} aria-label={title} disabled={disabled} style={base}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.filter = 'brightness(0.93)')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.filter = 'none')}
      {...rest}>
      <i className={icon} aria-hidden="true" />
    </button>
  );
}

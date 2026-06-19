import React from 'react';

const VARIANTS = {
  primary: { bg: 'var(--color-primary)', color: '#fff', border: 'var(--color-primary)' },
  secondary: { bg: '#fff', color: 'var(--gray-700)', border: 'var(--border-input)' },
  dark: { bg: 'var(--brand-dark)', color: '#fff', border: 'var(--brand-dark)' },
  success: { bg: 'var(--color-success)', color: '#fff', border: 'var(--color-success)' },
  danger: { bg: 'var(--color-danger)', color: '#fff', border: 'var(--color-danger)' },
  'outline-primary': { bg: 'transparent', color: 'var(--color-primary)', border: 'var(--color-primary)' },
};
const SIZES = {
  sm: { padding: '0.375rem 0.875rem', fontSize: 'var(--text-xs)' },
  md: { padding: '0.55rem 1.1rem', fontSize: 'var(--text-base)' },
  lg: { padding: '0.8rem 1.6rem', fontSize: 'var(--text-md)' },
};

/** Botón de acción — estilo flat (sin sombra). Naranja para la acción principal. */
export function Button({
  variant = 'primary', size = 'md', pill = false, block = false,
  disabled = false, icon = null, iconRight = null, children, style = {}, ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const base = {
    display: block ? 'flex' : 'inline-flex', width: block ? '100%' : 'auto',
    alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    fontFamily: 'var(--font-sans)', fontWeight: 600, lineHeight: 1.2,
    border: `1px solid ${v.border}`, borderRadius: pill ? 'var(--radius-pill)' : 'var(--radius)',
    background: v.bg, color: v.color, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1, whiteSpace: 'nowrap',
    transition: 'filter .15s ease, background .15s ease', ...s, ...style,
  };
  return (
    <button style={base} disabled={disabled}
      onMouseEnter={(e) => { if (!disabled && v.bg !== 'transparent') e.currentTarget.style.filter = 'brightness(0.95)'; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.filter = 'none'; }}
      {...rest}>
      {icon && <i className={icon} aria-hidden="true" />}
      {children}
      {iconRight && <i className={iconRight} aria-hidden="true" />}
    </button>
  );
}

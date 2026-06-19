import React from 'react';

const VARIANTS = {
  primary: { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' },
  success: { bg: 'var(--color-success-100)', color: '#1aae6f' },
  danger: { bg: 'var(--color-danger-100)', color: 'var(--color-danger)' },
  warning: { bg: 'var(--color-warning-100)', color: '#d6451f' },
  info: { bg: 'var(--color-info-100)', color: '#0b9cb8' },
  neutral: { bg: 'var(--gray-200)', color: 'var(--gray-700)' },
};

/** Etiqueta de estado tipo píldora con tinte suave. */
export function Badge({ variant = 'neutral', dot = false, children, style = {}, ...rest }) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-pill)',
    fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-sans)',
    lineHeight: 1, whiteSpace: 'nowrap', background: v.bg, color: v.color, ...style,
  };
  return (
    <span style={base} {...rest}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  );
}

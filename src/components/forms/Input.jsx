import React from 'react';

/** Campo de texto con icono opcional, etiqueta, ayuda y error. */
export function Input({ label, icon, hint, error, type = 'text', style = {}, wrapStyle = {}, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const wrap = {
    display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'var(--surface-card)',
    borderRadius: 'var(--radius)', height: 46, padding: '0 0.875rem',
    border: `1px solid ${error ? 'var(--color-danger)' : focus ? 'var(--color-primary)' : 'var(--border-input)'}`,
    boxShadow: focus ? 'var(--ring-primary)' : 'none',
    transition: 'border-color .15s ease, box-shadow .15s ease', ...wrapStyle,
  };
  const input = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--gray-700)', height: '100%', ...style,
  };
  return (
    <label style={{ display: 'block' }}>
      {label && <span style={{ display: 'block', marginBottom: 6, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--gray-600)' }}>{label}</span>}
      <span style={wrap}>
        {icon && <i className={icon} style={{ color: focus ? 'var(--color-primary)' : 'var(--gray-400)', fontSize: '0.9rem' }} aria-hidden="true" />}
        <input type={type} style={input} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...rest} />
      </span>
      {(hint || error) && <span style={{ display: 'block', marginTop: 5, fontSize: 'var(--text-xs)', color: error ? 'var(--color-danger)' : 'var(--gray-500)' }}>{error || hint}</span>}
    </label>
  );
}

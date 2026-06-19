import React from 'react';

/** Select nativo con el estilo de los inputs. */
export function Select({ label, icon, hint, options = [], children, style = {}, wrapStyle = {}, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const wrap = {
    display: 'flex', alignItems: 'center', gap: '0.625rem', position: 'relative',
    background: 'var(--surface-card)', borderRadius: 'var(--radius)', height: 46, padding: '0 0.875rem',
    border: `1px solid ${focus ? 'var(--color-primary)' : 'var(--border-input)'}`,
    boxShadow: focus ? 'var(--ring-primary)' : 'none',
    transition: 'border-color .15s ease, box-shadow .15s ease', ...wrapStyle,
  };
  const sel = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--gray-700)',
    height: '100%', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', ...style,
  };
  return (
    <label style={{ display: 'block' }}>
      {label && <span style={{ display: 'block', marginBottom: 6, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--gray-600)' }}>{label}</span>}
      <span style={wrap}>
        {icon && <i className={icon} style={{ color: focus ? 'var(--color-primary)' : 'var(--gray-400)', fontSize: '0.9rem' }} aria-hidden="true" />}
        <select style={sel} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...rest}>
          {options.map((o) => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>)}
          {children}
        </select>
        <i className="fas fa-chevron-down" style={{ color: 'var(--gray-400)', fontSize: '0.7rem', pointerEvents: 'none' }} aria-hidden="true" />
      </span>
      {hint && <span style={{ display: 'block', marginTop: 5, fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{hint}</span>}
    </label>
  );
}

import React from 'react';

/** Checkbox naranja personalizado. Controlado o no controlado. */
export function Checkbox({ label, checked, defaultChecked, onChange, disabled = false, style = {}, ...rest }) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  const toggle = (e) => { if (disabled) return; if (!isControlled) setInternal(e.target.checked); onChange && onChange(e); };
  const box = {
    width: 20, height: 20, borderRadius: 'var(--radius-sm)', flex: '0 0 auto',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: `1px solid ${on ? 'var(--color-primary)' : 'var(--border-input)'}`,
    background: on ? 'var(--color-primary)' : '#fff', color: '#fff', fontSize: '0.7rem',
    transition: 'all .15s ease',
  };
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1, fontSize: 'var(--text-base)', color: 'var(--gray-700)', ...style }}>
      <input type="checkbox" checked={on} onChange={toggle} disabled={disabled} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...rest} />
      <span style={box}>{on && <i className="fas fa-check" aria-hidden="true" />}</span>
      {label && <span>{label}</span>}
    </label>
  );
}

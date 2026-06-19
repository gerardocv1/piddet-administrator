import React from 'react';

/** Interruptor tipo píldora para estados on/off (tienda abierta, disponible). */
export function Switch({ label, checked, defaultChecked, onChange, disabled = false, style = {}, ...rest }) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  const toggle = (e) => { if (disabled) return; if (!isControlled) setInternal(e.target.checked); onChange && onChange(e); };
  const track = {
    width: 46, height: 26, borderRadius: 'var(--radius-pill)', flex: '0 0 auto', position: 'relative',
    background: on ? 'var(--color-primary)' : 'var(--gray-300)', transition: 'background .2s ease',
  };
  const knob = {
    position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%',
    background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left .2s cubic-bezier(.4,1.4,.6,1)',
  };
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1, fontSize: 'var(--text-base)', color: 'var(--gray-700)', ...style }}>
      <input type="checkbox" checked={on} onChange={toggle} disabled={disabled} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...rest} />
      <span style={track}><span style={knob} /></span>
      {label && <span>{label}</span>}
    </label>
  );
}

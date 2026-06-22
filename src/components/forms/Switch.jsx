import React from 'react';
import styles from './Switch.module.css';

/** Interruptor tipo píldora para estados on/off (tienda abierta, disponible). `size`: 'md' | 'sm'. */
export function Switch({ label, checked, defaultChecked, onChange, disabled = false, size = 'md', className = '', ...rest }) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  const toggle = (e) => { if (disabled) return; if (!isControlled) setInternal(e.target.checked); onChange && onChange(e); };

  return (
    <label className={[styles.root, size === 'sm' ? styles.sm : '', disabled ? styles.disabled : '', className].filter(Boolean).join(' ')}>
      <input type="checkbox" checked={on} onChange={toggle} disabled={disabled} className={styles.input} {...rest} />
      <span className={[styles.track, on ? styles.on : ''].filter(Boolean).join(' ')}><span className={styles.knob} /></span>
      {label && <span>{label}</span>}
    </label>
  );
}

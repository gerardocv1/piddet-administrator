import React from 'react';
import styles from './Checkbox.module.css';

/** Checkbox naranja personalizado. Controlado o no controlado. */
export function Checkbox({ label, checked, defaultChecked, onChange, disabled = false, className = '', ...rest }) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  const toggle = (e) => { if (disabled) return; if (!isControlled) setInternal(e.target.checked); onChange && onChange(e); };

  return (
    <label className={[styles.root, disabled ? styles.disabled : '', className].filter(Boolean).join(' ')}>
      <input type="checkbox" checked={on} onChange={toggle} disabled={disabled} className={styles.input} {...rest} />
      <span className={[styles.box, on ? styles.checked : ''].filter(Boolean).join(' ')}>{on && <i className="fas fa-check" aria-hidden="true" />}</span>
      {label && <span>{label}</span>}
    </label>
  );
}

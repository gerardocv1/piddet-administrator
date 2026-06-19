import React from 'react';
import styles from './Select.module.css';

/** Select nativo con el estilo de los inputs. */
export function Select({ label, icon, hint, options = [], children, className = '', wrapClassName = '', ...rest }) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={[styles.wrap, wrapClassName].filter(Boolean).join(' ')}>
        {icon && <i className={`${icon} ${styles.icon}`} aria-hidden="true" />}
        <select className={[styles.select, className].filter(Boolean).join(' ')} {...rest}>
          {options.map((o) => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>)}
          {children}
        </select>
        <i className={`fas fa-chevron-down ${styles.chevron}`} aria-hidden="true" />
      </span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}

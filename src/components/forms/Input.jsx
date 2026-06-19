import React from 'react';
import styles from './Input.module.css';

/** Campo de texto con icono opcional, etiqueta, ayuda y error. */
export function Input({ label, icon, hint, error, type = 'text', className = '', wrapClassName = '', ...rest }) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={[styles.wrap, error ? styles.error : '', wrapClassName].filter(Boolean).join(' ')}>
        {icon && <i className={`${icon} ${styles.icon}`} aria-hidden="true" />}
        <input type={type} className={[styles.input, className].filter(Boolean).join(' ')} {...rest} />
      </span>
      {(hint || error) && <span className={[styles.hint, error ? styles.errorText : ''].filter(Boolean).join(' ')}>{error || hint}</span>}
    </label>
  );
}

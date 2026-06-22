import React from 'react';
import styles from './Textarea.module.css';

/** Área de texto multilínea con el mismo estilo de los inputs (etiqueta, ayuda y error). */
export function Textarea({ label, hint, error, rows = 3, className = '', wrapClassName = '', ...rest }) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={[styles.wrap, error ? styles.error : '', wrapClassName].filter(Boolean).join(' ')}>
        <textarea rows={rows} className={[styles.textarea, className].filter(Boolean).join(' ')} {...rest} />
      </span>
      {(hint || error) && <span className={[styles.hint, error ? styles.errorText : ''].filter(Boolean).join(' ')}>{error || hint}</span>}
    </label>
  );
}

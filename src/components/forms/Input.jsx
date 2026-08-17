import React from 'react';
import styles from './Input.module.css';

/** Campo de texto con icono opcional, etiqueta, ayuda y error.
 *  Los campos `type="password"` incluyen un botón para mostrar/ocultar la contraseña. */
export function Input({ label, icon, hint, error, type = 'text', className = '', wrapClassName = '', ...rest }) {
  const isPassword = type === 'password';
  const [visible, setVisible] = React.useState(false);
  const inputType = isPassword && visible ? 'text' : type;
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={[styles.wrap, error ? styles.error : '', wrapClassName].filter(Boolean).join(' ')}>
        {icon && <i className={`${icon} ${styles.icon}`} aria-hidden="true" />}
        <input type={inputType} className={[styles.input, className].filter(Boolean).join(' ')} {...rest} />
        {isPassword && (
          <button type="button" className={styles.reveal}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setVisible((v) => !v)}>
            <i className={visible ? 'fas fa-eye-slash' : 'fas fa-eye'} aria-hidden="true" />
          </button>
        )}
      </span>
      {(hint || error) && <span className={[styles.hint, error ? styles.errorText : ''].filter(Boolean).join(' ')}>{error || hint}</span>}
    </label>
  );
}

import React from 'react';
import styles from './Placeholder.module.css';

/** Estado vacío cuando el usuario no tiene permisos para ningún módulo en la compañía activa. */
export function NoModules() {
  return (
    <div className={styles.box}>
      <i className={`fas fa-lock ${styles.icon}`} />
      <h3 className={styles.title}>Sin módulos habilitados</h3>
      <p className={styles.text}>
        Tu usuario no tiene permisos para ver módulos en esta compañía. Contacta al administrador.
      </p>
    </div>
  );
}

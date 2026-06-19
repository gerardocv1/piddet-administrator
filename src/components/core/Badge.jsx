import React from 'react';
import styles from './Badge.module.css';

const VARIANT_CLASS = {
  primary: styles.primary,
  success: styles.success,
  danger: styles.danger,
  warning: styles.warning,
  info: styles.info,
  neutral: styles.neutral,
};

/** Etiqueta de estado tipo píldora con tinte suave. */
export function Badge({ variant = 'neutral', dot = false, children, className = '', ...rest }) {
  const cls = [styles.badge, VARIANT_CLASS[variant] || VARIANT_CLASS.neutral, className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}

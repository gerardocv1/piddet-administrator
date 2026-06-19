import React from 'react';
import styles from './Card.module.css';

/** Superficie base flat: blanca, borde fino, sin sombra. */
export function Card({ children, padding, className = '', style = {}, ...rest }) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')} style={padding ? { padding, ...style } : style} {...rest}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ title, action, children, className = '', ...rest }) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(' ')} {...rest}>
      {title ? <h3 className={styles.headerTitle}>{title}</h3> : children}
      {action}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '', ...rest }) {
  return <div className={[styles.body, className].filter(Boolean).join(' ')} {...rest}>{children}</div>;
};

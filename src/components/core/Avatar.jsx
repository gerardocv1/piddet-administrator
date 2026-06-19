import React from 'react';
import styles from './Avatar.module.css';

const SIZE_CLASS = { sm: styles.sm, md: styles.md, lg: styles.lg, xl: styles.xl };

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/** Avatar con imagen o iniciales en gris neutro. */
export function Avatar({ src, name = '', size = 'md', className = '', ...rest }) {
  const cls = [styles.avatar, SIZE_CLASS[size] || SIZE_CLASS.md, className].filter(Boolean).join(' ');
  return src
    ? <img src={src} alt={name} className={cls} {...rest} />
    : <span className={cls} {...rest}>{initials(name) || '?'}</span>;
}

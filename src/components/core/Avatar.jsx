import React from 'react';

const SIZES = { sm: 32, md: 40, lg: 48, xl: 64 };

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/** Avatar con imagen o iniciales en gris neutro. */
export function Avatar({ src, name = '', size = 'md', style = {}, ...rest }) {
  const d = SIZES[size] || SIZES.md;
  const base = {
    width: d, height: d, borderRadius: '50%', objectFit: 'cover',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--gray-200)', color: 'var(--gray-600)',
    fontWeight: 700, fontSize: d * 0.4, fontFamily: 'var(--font-sans)',
    flex: '0 0 auto', overflow: 'hidden', ...style,
  };
  return src
    ? <img src={src} alt={name} style={base} {...rest} />
    : <span style={base} {...rest}>{initials(name) || '?'}</span>;
}

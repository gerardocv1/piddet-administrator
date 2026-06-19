import React from 'react';

/** Superficie base flat: blanca, borde fino, sin sombra. */
export function Card({ children, padding, style = {}, ...rest }) {
  const base = {
    background: 'var(--surface-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    ...(padding ? { padding } : {}), ...style,
  };
  return <div style={base} {...rest}>{children}</div>;
}

Card.Header = function CardHeader({ title, action, children, style = {}, ...rest }) {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-color)', ...style,
  };
  return (
    <div style={base} {...rest}>
      {title ? <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>{title}</h3> : children}
      {action}
    </div>
  );
};

Card.Body = function CardBody({ children, style = {}, ...rest }) {
  return <div style={{ padding: '1.5rem', ...style }} {...rest}>{children}</div>;
};

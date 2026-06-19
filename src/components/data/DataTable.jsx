import React from 'react';

/** Tabla de listados flat (encabezado gris en mayúsculas, filas con hairline). */
export function DataTable({ columns = [], rows = [], rowKey = 'id', empty = 'Sin registros' }) {
  const th = {
    textAlign: 'left', padding: '0.8rem 1.5rem', fontSize: 'var(--text-xs)', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gray-500)',
    borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap',
  };
  const td = { padding: '0.9rem 1.5rem', fontSize: 'var(--text-base)', color: 'var(--gray-700)', verticalAlign: 'middle' };
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
      <thead>
        <tr>{columns.map((c) => <th key={c.key} style={{ ...th, width: c.width, textAlign: c.align || 'left' }}>{c.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={columns.length} style={{ ...td, textAlign: 'center', color: 'var(--gray-400)', padding: '2.5rem' }}>{empty}</td></tr>
        )}
        {rows.map((r, i) => (
          <tr key={r[rowKey] ?? i} style={{ borderTop: i ? '1px solid var(--gray-100)' : 'none' }}>
            {columns.map((c) => (
              <td key={c.key} style={{ ...td, textAlign: c.align || 'left' }}>
                {c.render ? c.render(r) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

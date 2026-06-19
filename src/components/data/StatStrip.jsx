import React from 'react';

/** Franja de KPIs: un solo panel con columnas separadas por borde (estilo flat). */
export function StatStrip({ stats = [] }) {
  return (
    <div className="pd-statstrip" style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length || 1}, 1fr)`, background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{ padding: '1.4rem 1.6rem', borderLeft: i ? '1px solid var(--border-color)' : 'none' }}>
          <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)', fontWeight: 600 }}>{s.label}</div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.1, marginTop: 6 }}>{s.value}</div>
          {s.delta && (
            <div style={{ fontSize: 'var(--text-sm)', marginTop: 4, color: s.up ? '#1aae6f' : 'var(--color-danger)', fontWeight: 600 }}>
              <i className={s.up ? 'fas fa-arrow-trend-up' : 'fas fa-arrow-trend-down'} style={{ marginRight: 6 }} />{s.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

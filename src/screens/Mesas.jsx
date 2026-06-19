import React from 'react';
import { Button } from '../components';
import { api } from '../lib/api.js';

const ST = {
  libre: { label: 'Libre', dot: 'var(--color-success)', txt: '#1aae6f' },
  ocupada: { label: 'Ocupada', dot: 'var(--color-primary)', txt: 'var(--color-primary-700)' },
  cuenta: { label: 'Por pagar', dot: 'var(--color-warning)', txt: '#d6451f' },
  reservada: { label: 'Reservada', dot: 'var(--color-info)', txt: '#0b9cb8' },
};

export function Mesas() {
  const [mesas, setMesas] = React.useState([]);
  const [hover, setHover] = React.useState(null);

  React.useEffect(() => { api.mesas().then(setMesas).catch(() => {}); }, []);

  const cycle = (n) => {
    const order = ['libre', 'ocupada', 'cuenta'];
    setMesas((ms) => ms.map((m) => {
      if (m.n !== n) return m;
      const next = order[(order.indexOf(m.st) + 1) % order.length] || 'libre';
      return { ...m, st: next, t: next === 'libre' ? undefined : '0 min', tot: next === 'libre' ? undefined : '$0' };
    }));
  };
  const count = (st) => mesas.filter((m) => m.st === st).length;

  return (
    <div style={{ maxWidth: 'var(--container-max)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem' }}>
        {Object.entries(ST).map(([k, s]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.dot }} />{s.label} <strong style={{ color: 'var(--gray-800)' }}>{count(k)}</strong>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <Button size="sm" variant="secondary" icon="fas fa-plus">Añadir mesa</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 14 }}>
        {mesas.map((m) => {
          const s = ST[m.st];
          const hot = hover === m.n;
          return (
            <div key={m.n} onClick={() => cycle(m.n)} onMouseEnter={() => setHover(m.n)} onMouseLeave={() => setHover(null)} title="Clic para cambiar estado"
              style={{ background: 'var(--surface-card)', border: `1px solid ${hot ? 'var(--color-primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-lg)', padding: '1.1rem 1.2rem', cursor: 'pointer', transition: 'border-color .12s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Mesa {m.n}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 700, color: s.txt }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot }} />{s.label}
                </span>
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.1, margin: '6px 0 10px' }}>{m.n}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--gray-100)', fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                <span><i className="fas fa-user" style={{ marginRight: 4 }} />{m.cap}</span>
                {m.t ? <span><i className="far fa-clock" style={{ marginRight: 4 }} />{m.t}</span> : <span>—</span>}
                {m.tot && <strong style={{ color: 'var(--gray-700)' }}>{m.tot}</strong>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

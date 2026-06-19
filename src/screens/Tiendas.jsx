import React from 'react';
import { Button } from '../components';
import { IconButton } from '../components';
import { Switch } from '../components';
import { api } from '../lib/api.js';

export function Tiendas() {
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => { api.tiendasDetalle().then(setRows).catch(() => {}); }, []);

  const toggle = (id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, open: !r.open } : r));

  return (
    <div style={{ maxWidth: 'var(--container-max)', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: 'var(--text-base)' }}>Restaurantes conectados a tu cuenta de Piddet.</p>
        <div style={{ flex: 1, minWidth: 0 }} />
        <Button variant="primary" icon="fas fa-plus">Añadir tienda</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {rows.map((s) => (
          <div key={s.id} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{ width: 44, height: 44, flex: '0 0 auto', borderRadius: 'var(--radius)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', color: 'var(--gray-500)', border: '1px solid var(--border-color)', fontSize: '1.05rem' }}><i className="fas fa-store" /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: 'var(--text-md)' }}>{s.name}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 600, color: s.open ? '#1aae6f' : 'var(--gray-400)', marginTop: 2 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.open ? 'var(--color-success)' : 'var(--gray-400)' }} />{s.open ? 'Abierta' : 'Cerrada'}
                  </span>
                </div>
              </div>
              <IconButton icon="fas fa-ellipsis-v" variant="ghost" title="Más" size="sm" />
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
              <span><i className="fas fa-location-dot" style={{ width: 18, color: 'var(--gray-400)' }} />{s.dir}</span>
              <span><i className="fas fa-phone" style={{ width: 18, color: 'var(--gray-400)' }} />{s.tel}</span>
              <span><i className="fas fa-receipt" style={{ width: 18, color: 'var(--gray-400)' }} />{s.pedidos} pedidos en curso</span>
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Switch label="Abierta" checked={s.open} onChange={() => toggle(s.id)} />
              <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>Administrar</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

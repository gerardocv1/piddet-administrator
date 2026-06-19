import React from 'react';
import { StatStrip, Card, Badge, Avatar } from '../components';
import { useIsMobile } from '../lib/useIsMobile.js';
import { api } from '../lib/api.js';

const ESTADO = { 'En cocina': 'warning', 'Listo': 'info', 'Entregado': 'success', 'Cancelado': 'danger' };
const panel = { background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' };

export function Dashboard() {
  const isMobile = useIsMobile();
  const [stats, setStats] = React.useState([]);
  const [pedidos, setPedidos] = React.useState([]);
  const [tiendas, setTiendas] = React.useState([]);

  React.useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.pedidos().then(setPedidos).catch(() => {});
    api.tiendas().then(setTiendas).catch(() => {});
  }, []);

  const openCount = tiendas.filter((s) => s.open).length;
  const liveOrders = tiendas.reduce((a, s) => a + (s.pedidos || 0), 0);
  const allOpen = tiendas.length > 0 && openCount === tiendas.length;

  // Pulso operativo (solo móvil): lo primero que ve el dueño al entrar.
  const pulse = (
    <div style={{ ...panel, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
      <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: allOpen ? 'var(--color-success)' : 'var(--color-warning)' }} />Tiendas
        </span>
        <span style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.1 }}>{openCount}<span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-400)' }}> / {tiendas.length}</span></span>
        <span style={{ fontSize: 'var(--text-sm)', color: allOpen ? '#1aae6f' : 'var(--color-warning)', fontWeight: 600 }}>{allOpen ? 'Todas abiertas' : 'abiertas ahora'}</span>
      </div>
      <div style={{ padding: '1.1rem', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)', fontWeight: 600 }}>
          <i className="fas fa-fire-burner" style={{ color: 'var(--color-accent)', fontSize: '0.8rem' }} />En curso
        </span>
        <span style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.1 }}>{liveOrders}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', fontWeight: 600 }}>pedidos activos</span>
      </div>
    </div>
  );

  const ordersPanel = (
    <Card>
      <Card.Header title="Pedidos recientes" action={<a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>Ver todos</a>} />
      {isMobile ? (
        <div>
          {pedidos.map((o, i) => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.9rem 1.1rem', borderTop: i ? '1px solid var(--gray-100)' : 'none' }}>
              <Avatar name={o.cliente} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: 'var(--text-base)' }}>{o.id}</span>
                  <span style={{ color: 'var(--gray-700)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.cliente}</span>
                </div>
                <div style={{ marginTop: 4 }}><Badge variant={ESTADO[o.estado] || 'neutral'} dot>{o.estado}</Badge></div>
              </div>
              <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: 'var(--text-base)' }}>{o.total}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: 2 }}>{o.tienda}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pd-table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
            <thead><tr>
              {['Pedido', 'Cliente', 'Tienda', 'Total', 'Estado'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 3 ? 'right' : 'left', padding: '0.7rem 1.5rem', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gray-500)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {pedidos.map((o, i) => (
                <tr key={o.id} style={{ borderTop: i ? '1px solid var(--gray-100)' : 'none' }}>
                  <td style={{ padding: '0.85rem 1.5rem', fontWeight: 700, color: 'var(--gray-800)' }}>{o.id}</td>
                  <td style={{ padding: '0.85rem 1.5rem' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--gray-700)' }}><Avatar name={o.cliente} size="sm" />{o.cliente}</span></td>
                  <td style={{ padding: '0.85rem 1.5rem', color: 'var(--gray-600)' }}>{o.tienda}</td>
                  <td style={{ padding: '0.85rem 1.5rem', textAlign: 'right', color: 'var(--gray-800)', fontWeight: 600 }}>{o.total}</td>
                  <td style={{ padding: '0.85rem 1.5rem' }}><Badge variant={ESTADO[o.estado] || 'neutral'} dot>{o.estado}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const storesPanel = (
    <Card>
      <Card.Header title="Tiendas" />
      {tiendas.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.9rem 1.1rem' : '1rem 1.5rem', borderTop: i ? '1px solid var(--gray-100)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 'var(--radius)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', color: 'var(--gray-500)', border: '1px solid var(--border-color)' }}><i className="fas fa-store" /></span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 'var(--text-base)' }}>{s.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{s.pedidos} pedidos en curso</div>
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 600, color: s.open ? '#1aae6f' : 'var(--gray-400)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.open ? 'var(--color-success)' : 'var(--gray-400)' }} />{s.open ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
      ))}
    </Card>
  );

  // ─── Móvil: pulso → KPIs → tiendas (operativo) → pedidos ───
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {pulse}
        <StatStrip stats={stats} />
        {storesPanel}
        {ordersPanel}
      </div>
    );
  }

  // ─── Escritorio: grid 2fr / 1fr ───
  return (
    <div style={{ maxWidth: 'var(--container-max)', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <StatStrip stats={stats} />
      <div className="pd-grid-main" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 22, alignItems: 'start' }}>
        {ordersPanel}
        {storesPanel}
      </div>
    </div>
  );
}

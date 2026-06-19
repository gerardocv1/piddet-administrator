import React from 'react';
import { StatStrip, Card, Badge, Avatar, DataTable } from '../components';
import { useIsMobile } from '../lib/useIsMobile.js';
import { useResource } from '../lib/useResource.js';
import { api } from '../lib/api.js';
import s from './Dashboard.module.css';

const ESTADO = { 'En cocina': 'warning', 'Listo': 'info', 'Entregado': 'success', 'Cancelado': 'danger' };

export function Dashboard() {
  const isMobile = useIsMobile();
  const { data: stats } = useResource(api.stats, []);
  const { data: pedidos, loading: loadingPedidos, error: errorPedidos } = useResource(api.pedidos, []);
  const { data: tiendas } = useResource(api.tiendas, []);

  const openCount = tiendas.filter((x) => x.open).length;
  const liveOrders = tiendas.reduce((a, x) => a + (x.pedidos || 0), 0);
  const allOpen = tiendas.length > 0 && openCount === tiendas.length;

  // Pulso operativo (solo móvil): lo primero que ve el dueño al entrar.
  const pulse = (
    <div className={s.pulse}>
      <div className={s.pulseCell}>
        <span className={s.pulseLabel}>
          <span className={[s.pulseDot, allOpen ? s.ok : ''].filter(Boolean).join(' ')} />Tiendas
        </span>
        <span className={s.pulseValue}>{openCount}<span className={s.pulseValueSub}> / {tiendas.length}</span></span>
        <span className={[s.pulseSub, allOpen ? s.ok : s.warn].join(' ')}>{allOpen ? 'Todas abiertas' : 'abiertas ahora'}</span>
      </div>
      <div className={[s.pulseCell, s.bordered].join(' ')}>
        <span className={s.pulseLabel}>
          <i className={`fas fa-fire-burner ${s.pulseIcon}`} />En curso
        </span>
        <span className={s.pulseValue}>{liveOrders}</span>
        <span className={s.pulseSub}>pedidos activos</span>
      </div>
    </div>
  );

  const orderColumns = [
    { key: 'id', header: 'Pedido', render: (o) => <span className={s.cellId}>{o.id}</span> },
    { key: 'cliente', header: 'Cliente', render: (o) => <span className={s.cellClient}><Avatar name={o.cliente} size="sm" />{o.cliente}</span> },
    { key: 'tienda', header: 'Tienda', render: (o) => <span className={s.cellStore}>{o.tienda}</span> },
    { key: 'total', header: 'Total', align: 'right', render: (o) => <span className={s.cellTotal}>{o.total}</span> },
    { key: 'estado', header: 'Estado', render: (o) => <Badge variant={ESTADO[o.estado] || 'neutral'} dot>{o.estado}</Badge> },
  ];

  const ordersPanel = (
    <Card>
      <Card.Header title="Pedidos recientes" action={<a href="#" onClick={(e) => e.preventDefault()} className={s.link}>Ver todos</a>} />
      {isMobile ? (
        <div>
          {pedidos.map((o) => (
            <div key={o.id} className={s.orderItem}>
              <Avatar name={o.cliente} size="sm" />
              <div className={s.orderMain}>
                <div className={s.orderTop}>
                  <span className={s.orderId}>{o.id}</span>
                  <span className={s.orderClient}>{o.cliente}</span>
                </div>
                <div className={s.orderBadge}><Badge variant={ESTADO[o.estado] || 'neutral'} dot>{o.estado}</Badge></div>
              </div>
              <div className={s.orderRight}>
                <div className={s.orderTotal}>{o.total}</div>
                <div className={s.orderStore}>{o.tienda}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable columns={orderColumns} rows={pedidos} loading={loadingPedidos} error={errorPedidos} empty="Sin pedidos recientes" />
      )}
    </Card>
  );

  const storesPanel = (
    <Card>
      <Card.Header title="Tiendas" />
      {tiendas.map((x) => (
        <div key={x.id} className={s.store}>
          <div className={s.storeLeft}>
            <span className={s.storeIcon}><i className="fas fa-store" /></span>
            <div>
              <div className={s.storeName}>{x.name}</div>
              <div className={s.storeSub}>{x.pedidos} pedidos en curso</div>
            </div>
          </div>
          <span className={[s.storeStatus, x.open ? s.open : ''].filter(Boolean).join(' ')}>
            <span className={s.storeDot} />{x.open ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
      ))}
    </Card>
  );

  // ─── Móvil: pulso → KPIs → tiendas (operativo) → pedidos ───
  if (isMobile) {
    return (
      <div className={s.pageMobile}>
        {pulse}
        <StatStrip stats={stats} />
        {storesPanel}
        {ordersPanel}
      </div>
    );
  }

  // ─── Escritorio: grid 2fr / 1fr ───
  return (
    <div className={s.page}>
      <StatStrip stats={stats} />
      <div className={s.grid}>
        {ordersPanel}
        {storesPanel}
      </div>
    </div>
  );
}

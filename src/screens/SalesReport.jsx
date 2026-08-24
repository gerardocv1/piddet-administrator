import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, DataTable, FilterBar, RefreshButton, SalesByTypeChart, StatStrip } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { todayIso } from '../lib/orderLabels.js';
import { phrase } from '../lib/terms.js';
import s from './screens.module.css';
import t from './SalesReport.module.css';

// Fecha local (no UTC) de hace n días, en ISO yyyy-mm-dd.
const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const defaultFromIso = () => isoDaysAgo(6);

const quantity = (v) => Number(v || 0).toLocaleString('es-CO');

// Reporte de ventas de la compañía activa: resumen (subtotal, descuentos, impuestos, total),
// ticket promedio, distribución del recaudo por método de pago, top de productos/servicios y
// ventas por día. Filtros por rango de fechas (últimos 7 días por defecto), usuario que
// registró y producto/servicio (órdenes que lo incluyen); todos viven en la URL.
export function SalesReport() {
  const [params, setParams] = useSearchParams();
  const dateFrom = params.get('date_from') || defaultFromIso();
  const dateTo = params.get('date_to') || todayIso();
  const creatorId = params.get('creator_id') || undefined;
  const itemId = params.get('item_id') || undefined;

  const setQuery = (next = {}) => {
    const q = {};
    const from = next.date_from ?? dateFrom;
    const to = next.date_to ?? dateTo;
    if (from && from !== defaultFromIso()) q.date_from = from;
    if (to && to !== todayIso()) q.date_to = to;
    const creator = 'creator_id' in next ? next.creator_id : creatorId;
    const item = 'item_id' in next ? next.item_id : itemId;
    if (creator) q.creator_id = creator;
    if (item) q.item_id = item;
    setParams(q);
  };

  const fetcher = React.useCallback(
    () => api.salesReport({ dateFrom, dateTo, creatorId, itemId }),
    [dateFrom, dateTo, creatorId, itemId],
  );
  const { data, loading, error, reload } = useResource(fetcher, null, [dateFrom, dateTo, creatorId, itemId]);

  // Con solo `sales-report-own` el backend limita el reporte a lo que registró el usuario: sin
  // filtro por creador (y sin poder listar los creadores de la compañía).
  const { can } = usePermissions();
  const companyWide = can('sales-report');
  const creatorsFetcher = React.useCallback(
    () => (companyWide ? api.orderCreators() : Promise.resolve([])),
    [companyWide],
  );
  const { data: creators } = useResource(creatorsFetcher, [], [companyWide]);
  const creatorOptions = React.useMemo(
    () => (creators || []).map((c) => ({ value: String(c.user_id), label: c.name || c.first_name })),
    [creators],
  );

  const itemsFetcher = React.useCallback(() => api.items({ row: 200 }).then((r) => r.items), []);
  const { data: items } = useResource(itemsFetcher, [], []);
  const itemOptions = React.useMemo(
    () => (items || []).map((i) => ({ value: String(i.id), label: i.name })),
    [items],
  );

  const totals = data?.totals;
  const payments = data?.payments;
  const methods = payments?.methods || [];
  const topItems = data?.top_items || [];
  const daily = data?.daily || [];
  const maxMethod = methods.reduce((mx, m) => Math.max(mx, Number(m.value)), 0);

  const balanceStats = [
    { label: 'Subtotal', value: totals?.subtotal_formatted ?? '—' },
    { label: 'Descuentos', value: totals?.discount_formatted ?? '—' },
    { label: 'Impuestos', value: totals?.tax_formatted ?? '—' },
    { label: 'Total', value: totals?.total_formatted ?? '—' },
  ];
  const kpiStats = [
    { label: 'Facturas', value: totals ? quantity(totals.orders_count) : '—' },
    { label: 'Ticket promedio', value: totals?.avg_ticket_formatted ?? '—' },
  ];

  const topColumns = [
    { key: 'name', header: 'Producto / servicio', ellipsis: true, render: (r) => <span className={s.cellStrong}>{r.name}</span> },
    { key: 'quantity', header: 'Cant.', width: 80, align: 'right', render: (r) => quantity(r.quantity) },
    { key: 'percent', header: 'Partic.', width: 80, align: 'right', render: (r) => <span className={s.muted}>{r.percent}%</span> },
    { key: 'total', header: 'Total', width: 130, align: 'right', render: (r) => <span className={s.priceCell}>{r.total_formatted}</span> },
  ];

  const filterDefs = [
    { key: 'range', type: 'daterange', label: 'Fecha', icon: 'fas fa-calendar', fromKey: 'date_from', toKey: 'date_to', max: todayIso() },
    companyWide && { key: 'creator_id', type: 'select', label: 'Registró', icon: 'fas fa-user', options: creatorOptions, placeholder: 'Todos los usuarios' },
    { key: 'item_id', type: 'select', label: 'Producto', icon: 'fas fa-burger', options: itemOptions, placeholder: 'Todos los productos' },
  ].filter(Boolean);

  const onFilters = (next) => {
    let from = next.date_from || dateFrom;
    let to = next.date_to || dateTo;
    if (from > to) [from, to] = [to, from];
    setQuery({ date_from: from, date_to: to, creator_id: next.creator_id, item_id: next.item_id });
  };

  return (
    <div className={s.page}>
      <FilterBar
        filters={filterDefs}
        values={{ date_from: dateFrom, date_to: dateTo, creator_id: creatorId, item_id: itemId }}
        onChange={onFilters}
        inlineThreshold={0}
        actions={
          <>
            <RefreshButton loading={loading} onClick={reload} />
            {(dateFrom !== defaultFromIso() || dateTo !== todayIso()) && (
              <Button variant="secondary" size="sm" icon="fas fa-rotate-left"
                onClick={() => setQuery({ date_from: defaultFromIso(), date_to: todayIso() })}>
                Últimos 7 días
              </Button>
            )}
            {totals != null && (
              <p className={s.toolbarText}>
                {totals.orders_count === 0 ? phrase('Sin ventas en el rango') : `${quantity(totals.orders_count)} factura${totals.orders_count === 1 ? '' : 's'}`}
              </p>
            )}
          </>
        }
      />

      {error ? (
        <Alert tone="danger" title="No se pudo cargar el reporte">{error}</Alert>
      ) : (
        <>
          <Card>
            <Card.Header title="Resumen del período" />
            <Card.Body>
              <StatStrip stats={balanceStats} loading={loading} />
            </Card.Body>
          </Card>

          <Card>
            <Card.Header title="Indicadores" />
            <Card.Body>
              <StatStrip stats={kpiStats} loading={loading} />
            </Card.Body>
          </Card>

          <div className={t.grid}>
            <Card padding="0">
              <Card.Header title="Métodos de pago" />
              {loading ? (
                <Card.Body><StatStrip stats={[]} loading /></Card.Body>
              ) : methods.length === 0 ? (
                <Card.Body><p className={s.faint}>No hay pagos registrados en el rango.</p></Card.Body>
              ) : (
                <ul className={t.methods}>
                  {methods.map((m) => (
                    <li key={`${m.payment_method_id}-${m.payment_method_entity_id}`} className={t.methodRow}>
                      <span className={t.methodInfo}>
                        <span className={t.methodName}>{m.name}</span>
                        <span className={t.bar}>
                          <span className={t.barFill} style={{ width: `${maxMethod > 0 ? (Number(m.value) / maxMethod) * 100 : 0}%` }} />
                        </span>
                      </span>
                      <span className={t.methodPct}>{m.percent}%</span>
                      <span className={t.methodTotal}>{m.value_formatted}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card padding="0">
              <Card.Header title="Top productos y servicios" />
              <DataTable
                columns={topColumns}
                rows={topItems}
                rowKey="item_id"
                loading={loading}
                empty={phrase('No hay ventas en el rango seleccionado.')}
              />
            </Card>
          </div>

          <Card>
            <Card.Header title={phrase('Ventas por día')} />
            <Card.Body>
              <SalesByTypeChart daily={daily} loading={loading} />
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}

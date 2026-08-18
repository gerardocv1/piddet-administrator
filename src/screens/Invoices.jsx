import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, Button, FilterBar, Pagination, RefreshButton } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { ORDER_STATUS, orderStatusOf, todayIso, timeOf, firstNameOf, hasDiscount } from '../lib/orderLabels.js';
import { formatShortDate } from '../lib/dates.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };

const STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(([value, st]) => ({ value, label: st.label }));

// Listado de facturas (órdenes) de la compañía activa. El rango de fechas (hoy por defecto),
// el estado, el usuario que registró y la página viven en la URL (?date_from=&date_to=&status=
// &creator_id=&page=) para que volver desde el detalle conserve la consulta.
export function Invoices() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const dateFrom = params.get('date_from') || todayIso();
  const dateTo = params.get('date_to') || todayIso();
  const status = params.get('status') || undefined;
  const creatorId = params.get('creator_id') || undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (next = {}, nextPage = 1) => {
    const q = {};
    const from = next.date_from ?? dateFrom;
    const to = next.date_to ?? dateTo;
    if (from && from !== todayIso()) q.date_from = from;
    if (to && to !== todayIso()) q.date_to = to;
    const st = 'status' in next ? next.status : status;
    const creator = 'creator_id' in next ? next.creator_id : creatorId;
    if (st) q.status = st;
    if (creator) q.creator_id = creator;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const fetcher = React.useCallback(
    () => api.orders({ dateFrom, dateTo, status, creatorId, page }),
    [dateFrom, dateTo, status, creatorId, page],
  );
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, [dateFrom, dateTo, status, creatorId, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  // Alcance propio (solo `api-module-orders-own`): el backend ya filtra por el usuario, así que
  // el filtro por creador no aplica ni se pueden listar los creadores de la compañía.
  const { can } = usePermissions();
  const companyWide = can('api-module-orders');
  const creatorsFetcher = React.useCallback(
    () => (companyWide ? api.orderCreators() : Promise.resolve([])),
    [companyWide],
  );
  const { data: creators } = useResource(creatorsFetcher, [], [companyWide]);
  const creatorOptions = React.useMemo(
    () => (creators || []).map((c) => ({ value: String(c.user_id), label: c.name || c.first_name })),
    [creators],
  );

  const columns = [
    { key: 'date', header: 'Fecha', width: 110, nowrap: true, render: (r) => formatShortDate(r.created_date) },
    { key: 'order_number', header: 'Nº', width: 90, render: (r) => <span className={s.cellStrong}>{r.order_number || '—'}</span> },
    { key: 'time', header: 'Hora', width: 80, render: (r) => timeOf(r.created_date) },
    { key: 'customer_name', header: 'Cliente', ellipsis: true, render: (r) => r.customer_name?.trim() || <span className={s.faint}>—</span> },
    {
      key: 'creator_first_name', header: 'Registró', width: 120, ellipsis: true,
      render: (r) => firstNameOf(r.creator_first_name || r.creator_name) || <span className={s.faint}>—</span>,
    },
    {
      // Las facturas anteriores al envío de `biller` no lo traen: ahí cobró quien registró.
      key: 'biller_first_name', header: 'Facturó', width: 120, ellipsis: true,
      render: (r) => firstNameOf(r.biller_first_name || r.creator_first_name || r.creator_name) || <span className={s.faint}>—</span>,
    },
    {
      key: 'status', header: 'Estado', width: 130,
      render: (r) => { const st = orderStatusOf(r.status); return <Badge variant={st.variant} dot>{st.label}</Badge>; },
    },
    {
      key: 'discount', header: 'Descuento', width: 120, align: 'right',
      render: (r) => (hasDiscount(r)
        ? <span className={s.priceCell}>{r.discount_formatted}</span>
        : <span className={s.faint}>—</span>),
    },
    { key: 'total_formatted', header: 'Total', width: 130, align: 'right', render: (r) => <span className={s.priceCell}>{r.total_formatted}</span> },
  ];

  const filterDefs = [
    { key: 'range', type: 'daterange', label: 'Fecha', icon: 'fas fa-calendar', fromKey: 'date_from', toKey: 'date_to', max: todayIso() },
    { key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-circle-check', options: STATUS_OPTIONS, placeholder: 'Todos los estados' },
    companyWide && { key: 'creator_id', type: 'select', label: 'Registró', icon: 'fas fa-user', options: creatorOptions, placeholder: 'Todos los usuarios' },
  ].filter(Boolean);

  const onFilters = (next) => {
    let from = next.date_from || dateFrom;
    let to = next.date_to || dateTo;
    if (from > to) [from, to] = [to, from];
    setQuery({ date_from: from, date_to: to, status: next.status, creator_id: next.creator_id });
  };

  return (
    <div className={s.page}>
      <FilterBar
        filters={filterDefs}
        values={{ date_from: dateFrom, date_to: dateTo, status, creator_id: creatorId }}
        onChange={onFilters}
        inlineThreshold={0}
        resultCount={pg?.total}
        actions={
          <>
            <RefreshButton loading={loading} onClick={reload} />
            {(dateFrom !== todayIso() || dateTo !== todayIso()) && (
              <Button variant="secondary" size="sm" icon="fas fa-rotate-left"
                onClick={() => setQuery({ date_from: todayIso(), date_to: todayIso() })}>
                Hoy
              </Button>
            )}
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin facturas en el rango' : `${pg.total} factura${pg.total === 1 ? '' : 's'}`}
              </p>
            )}
          </>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          empty="No hay facturas para el rango seleccionado."
          onRowClick={(r) => navigate(`/invoices/${r.id}?${params.toString()}`)}
        />
      </Card>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}
    </div>
  );
}

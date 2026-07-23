import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, Button, FilterBar, Pagination } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { orderStatusOf, paymentStatusOf, serviceTypeLabel, originLabel, todayIso, timeOf } from '../lib/orderLabels.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };

// Listado de facturas (órdenes) de la compañía activa para un día. La fecha y la página viven
// en la URL (?date=&page=) para que volver desde el detalle conserve la consulta.
export function Invoices() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const date = params.get('date') || todayIso();
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (nextDate, nextPage = 1) => {
    const q = {};
    if (nextDate && nextDate !== todayIso()) q.date = nextDate;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const fetcher = React.useCallback(() => api.orders({ date, page }), [date, page]);
  const { data, loading, error } = useResource(fetcher, EMPTY, [date, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  const columns = [
    { key: 'order_number', header: 'Nº', width: 90, render: (r) => <span className={s.cellStrong}>{r.order_number || '—'}</span> },
    { key: 'time', header: 'Hora', width: 80, render: (r) => timeOf(r.created_date) },
    { key: 'customer_name', header: 'Cliente', ellipsis: true, render: (r) => r.customer_name?.trim() || <span className={s.faint}>—</span> },
    { key: 'origin_code', header: 'Origen', width: 110, ellipsis: true, render: (r) => originLabel(r.origin_code) },
    { key: 'service_type', header: 'Servicio', width: 120, ellipsis: true, render: (r) => serviceTypeLabel(r.service_type) },
    {
      key: 'status', header: 'Estado', width: 130,
      render: (r) => { const st = orderStatusOf(r.status); return <Badge variant={st.variant} dot>{st.label}</Badge>; },
    },
    {
      key: 'status_payment', header: 'Pago', width: 120,
      render: (r) => { const st = paymentStatusOf(r.status_payment); return <Badge variant={st.variant}>{st.label}</Badge>; },
    },
    { key: 'total_formatted', header: 'Total', width: 130, align: 'right', render: (r) => <span className={s.priceCell}>{r.total_formatted}</span> },
  ];

  const dateFilters = [{ key: 'date', type: 'date', label: 'Fecha', icon: 'fas fa-calendar', max: todayIso() }];

  return (
    <div className={s.page}>
      <FilterBar
        filters={dateFilters}
        values={{ date }}
        onChange={(next) => { if (next.date) setQuery(next.date); }}
        actions={
          <>
            {date !== todayIso() && (
              <Button variant="secondary" size="sm" icon="fas fa-rotate-left" onClick={() => setQuery(todayIso())}>
                Hoy
              </Button>
            )}
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin facturas este día' : `${pg.total} factura${pg.total === 1 ? '' : 's'}`}
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
          empty="No hay facturas para la fecha seleccionada."
          onRowClick={(r) => navigate(`/invoices/${r.id}?${params.toString()}`)}
        />
      </Card>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery(date, p)} disabled={loading} />
      )}
    </div>
  );
}

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, FilterBar, Pagination } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { supportStatusOf, SUPPORT_STATUS_OPTIONS, formatDateTime } from '../lib/syncFailureLabels.js';
import { originLabel } from '../lib/orderLabels.js';
import s from './screens.module.css';
import t from './SyncFailures.module.css';

const EMPTY = { items: [], pagination: null };

// Listado de fallos de sincronización de órdenes de la compañía activa (soporte). El estado
// y la página viven en la URL (?status=&page=) para que volver desde el detalle conserve la consulta.
export function SyncFailures() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (nextStatus, nextPage = 1) => {
    const q = {};
    if (nextStatus) q.status = nextStatus;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const fetcher = React.useCallback(() => api.getSyncFailureReports({ status, page }), [status, page]);
  const { data, loading, error } = useResource(fetcher, EMPTY, [status, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  const columns = [
    { key: 'created_at', header: 'Fecha', width: 140, render: (r) => formatDateTime(r.created_at) },
    { key: 'order_number', header: 'Nº orden', width: 100, render: (r) => <span className={s.cellStrong}>{r.order_number || '—'}</span> },
    { key: 'reported_origin', header: 'Origen', width: 90, render: (r) => originLabel(r.reported_origin) },
    {
      key: 'error_message', header: 'Error',
      render: (r) => <span className={t.errorCell} title={r.error_message || ''}>{r.error_message || <span className={s.faint}>—</span>}</span>,
    },
    { key: 'attempts', header: 'Intentos', width: 90, align: 'right', render: (r) => r.attempts },
    { key: 'reported_username', header: 'Reportó', width: 120, render: (r) => r.reported_username || <span className={s.faint}>—</span> },
    {
      key: 'support_status', header: 'Estado', width: 140,
      render: (r) => { const st = supportStatusOf(r.support_status); return <Badge variant={st.variant} dot>{st.label}</Badge>; },
    },
  ];

  const filters = [{ key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-filter', options: SUPPORT_STATUS_OPTIONS }];

  return (
    <div className={s.page}>
      <FilterBar
        filters={filters}
        values={{ status }}
        onChange={(next) => setQuery(next.status || '')}
        actions={
          pg != null && (
            <p className={s.toolbarText}>
              {pg.total === 0 ? 'Sin fallos reportados' : `${pg.total} reporte${pg.total === 1 ? '' : 's'}`}
            </p>
          )
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          empty="No hay fallos de sincronización con el filtro actual."
          onRowClick={(r) => navigate(`/sync-failures/${r.id}?${params.toString()}`)}
        />
      </Card>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery(status, p)} disabled={loading} />
      )}
    </div>
  );
}

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, Button, FilterBar, Pagination } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { todayIso } from '../lib/orderLabels.js';
import { reservationMoney, reservationStatusMeta } from '../lib/reservationLabels.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };

const STATUS_OPTIONS = [
  { value: '1', label: 'Pendiente' },
  { value: '2', label: 'Confirmada' },
  { value: '3', label: 'En estadía' },
  { value: '4', label: 'Finalizada' },
  { value: '0', label: 'Cancelada' },
];

// Listado de reservas de la compañía activa, filtrable por rango de fechas de entrada, estado y
// unidad. Todo vive en la URL para conservar la consulta al volver del detalle.
export function Reservations() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const dateFrom = params.get('date_from') || undefined;
  const dateTo = params.get('date_to') || undefined;
  const status = params.get('status') || undefined;
  const unitId = params.get('rentable_unit_id') || undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (next = {}, nextPage = 1) => {
    const q = {};
    const from = 'date_from' in next ? next.date_from : dateFrom;
    const to = 'date_to' in next ? next.date_to : dateTo;
    const st = 'status' in next ? next.status : status;
    const unit = 'rentable_unit_id' in next ? next.rentable_unit_id : unitId;
    if (from) q.date_from = from;
    if (to) q.date_to = to;
    if (st) q.status = st;
    if (unit) q.rentable_unit_id = unit;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const fetcher = React.useCallback(
    () => api.reservations({ dateFrom, dateTo, status, unitId, page }),
    [dateFrom, dateTo, status, unitId, page],
  );
  const { data, loading, error } = useResource(fetcher, EMPTY, [dateFrom, dateTo, status, unitId, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  const { data: units } = useResource(React.useCallback(() => api.rentableUnits({ perPage: 100 }), []), EMPTY, []);
  const unitOptions = React.useMemo(
    () => (units.items || []).map((u) => ({ value: String(u.id), label: u.name })),
    [units],
  );

  const columns = [
    { key: 'code', header: 'Código', width: 120, render: (r) => <span className={s.cellStrong}>{r.code}</span> },
    { key: 'holder_user_name', header: 'Titular', render: (r) => r.holder_user_name },
    { key: 'rentable_unit_name', header: 'Unidad', render: (r) => r.rentable_unit_name },
    {
      key: 'check_in_date', header: 'Estadía', width: 190,
      render: (r) => <span className={s.muted}>{r.check_in_date} → {r.check_out_date} ({r.nights}n)</span>,
    },
    {
      key: 'status', header: 'Estado', width: 130,
      render: (r) => {
        const m = reservationStatusMeta(r.status);
        return <Badge variant={m.variant} dot>{m.label}</Badge>;
      },
    },
    { key: 'total', header: 'Total', align: 'right', render: (r) => <span className={s.priceCell}>{reservationMoney(r.total)}</span> },
  ];

  const filterDefs = [
    { key: 'range', type: 'daterange', label: 'Entrada', icon: 'fas fa-calendar', fromKey: 'date_from', toKey: 'date_to' },
    { key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-circle-check', options: STATUS_OPTIONS },
    { key: 'rentable_unit_id', type: 'select', label: 'Unidad', icon: 'fas fa-house-chimney', options: unitOptions, placeholder: 'Todas las unidades' },
  ];

  return (
    <div className={s.page}>
      <FilterBar
        filters={filterDefs}
        values={{ date_from: dateFrom, date_to: dateTo, status, rentable_unit_id: unitId }}
        onChange={(next) => setQuery({
          date_from: next.date_from, date_to: next.date_to, status: next.status, rentable_unit_id: next.rentable_unit_id,
        })}
        inlineThreshold={0}
        resultCount={pg?.total}
        actions={
          <>
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin reservas' : `${pg.total} reserva${pg.total === 1 ? '' : 's'}`}
              </p>
            )}
            <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => navigate('/reservations/new')}>
              Nueva reserva
            </Button>
          </>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          empty="No hay reservas para los filtros seleccionados."
          onRowClick={(r) => navigate(`/reservations/${r.id}?${params.toString()}`)}
        />
      </Card>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}
    </div>
  );
}

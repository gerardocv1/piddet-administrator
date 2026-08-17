import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, Button, FilterBar, Pagination, RefreshButton } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { formatShortDate } from '../lib/dates.js';
import { reservationMoney, reservationStatusMeta } from '../lib/reservationLabels.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };

// `open` = todas menos las canceladas; es el filtro por defecto para que las canceladas
// no estorben en la operación diaria.
const DEFAULT_STATUS = 'open';
const STATUS_OPTIONS = [
  { value: 'open', label: 'Abiertas' },
  { value: '0', label: 'Canceladas' },
];

// Listado de reservas de la compañía activa, filtrable por rango de fechas de entrada, estado
// (abiertas/canceladas), unidad y búsqueda por código o titular. Todo vive en la URL para
// conservar la consulta al volver del detalle.
export function Reservations() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const dateFrom = params.get('date_from') || undefined;
  const dateTo = params.get('date_to') || undefined;
  const status = params.get('status') || DEFAULT_STATUS;
  const unitId = params.get('rentable_unit_id') || undefined;
  const search = params.get('q') || undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (next = {}, nextPage = 1) => {
    const q = {};
    const from = 'date_from' in next ? next.date_from : dateFrom;
    const to = 'date_to' in next ? next.date_to : dateTo;
    const st = 'status' in next ? next.status : status;
    const unit = 'rentable_unit_id' in next ? next.rentable_unit_id : unitId;
    const term = 'q' in next ? next.q : search;
    if (from) q.date_from = from;
    if (to) q.date_to = to;
    if (st && st !== DEFAULT_STATUS) q.status = st;
    if (unit) q.rentable_unit_id = unit;
    if (term) q.q = term;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  // Búsqueda con debounce: escribe en la URL y vuelve a la primera página.
  const [searchInput, setSearchInput] = React.useState(search || '');
  React.useEffect(() => {
    const id = setTimeout(() => {
      if ((searchInput.trim() || undefined) !== search) setQuery({ q: searchInput.trim() || undefined });
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetcher = React.useCallback(
    () => api.reservations({ dateFrom, dateTo, status, unitId, search, page }),
    [dateFrom, dateTo, status, unitId, search, page],
  );
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, [dateFrom, dateTo, status, unitId, search, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  const { data: units } = useResource(React.useCallback(() => api.rentableUnits({ perPage: 100 }), []), EMPTY, []);
  const unitOptions = React.useMemo(
    () => (units.items || []).map((u) => ({ value: String(u.id), label: u.name })),
    [units],
  );

  const columns = [
    { key: 'code', header: 'Código', width: 110, render: (r) => <span className={s.cellStrong}>{r.code}</span> },
    { key: 'holder_user_name', header: 'Titular', ellipsis: true, render: (r) => r.holder_user_name },
    { key: 'rentable_unit_name', header: 'Unidad', ellipsis: true, render: (r) => r.rentable_unit_name },
    {
      key: 'check_in_date', header: 'Entrada', width: 160, nowrap: true,
      render: (r) => (
        <span className={s.muted}>
          {formatShortDate(r.check_in_date)}{' '}
          <Badge variant="neutral">{Number(r.nights) === 1 ? '1 noche' : `${r.nights} noches`}</Badge>
        </span>
      ),
    },
    {
      key: 'status', header: 'Estado', width: 130,
      render: (r) => {
        const m = reservationStatusMeta(r.status);
        return <Badge variant={m.variant} dot>{m.label}</Badge>;
      },
    },
    { key: 'total', header: 'Total', width: 130, align: 'right', render: (r) => <span className={s.priceCell}>{reservationMoney(r.total)}</span> },
  ];

  const filterDefs = [
    { key: 'range', type: 'daterange', label: 'Entrada', icon: 'fas fa-calendar', fromKey: 'date_from', toKey: 'date_to' },
    { key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-circle-check', options: STATUS_OPTIONS },
    { key: 'rentable_unit_id', type: 'select', label: 'Unidad', icon: 'fas fa-house-chimney', options: unitOptions, placeholder: 'Todas las unidades' },
  ];

  return (
    <div className={s.page}>
      <FilterBar
        searchable
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Buscar por titular o código"
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
            <RefreshButton loading={loading} onClick={reload} />
            <Button variant="secondary" size="sm" icon="fas fa-calendar-days"
              onClick={() => navigate(`/reservations/calendar${params.toString() ? `?${params.toString()}` : ''}`)}>
              Calendario
            </Button>
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

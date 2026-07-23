import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, Button, FilterBar, Pagination } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { reservationMoney } from '../lib/reservationLabels.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };

const STATUS_OPTIONS = [
  { value: '1', label: 'Reservable' },
  { value: '0', label: 'Inactiva' },
];

// Listado de unidades reservables de la compañía activa (cabañas, habitaciones, lugares). Filtros
// por tipo, estado y búsqueda, todo en la URL para conservar la consulta al volver del detalle.
export function RentableUnits() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const typeId = params.get('rentable_unit_type_id') || undefined;
  const status = params.get('status') || undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (next = {}, nextPage = 1) => {
    const q = {};
    const type = 'rentable_unit_type_id' in next ? next.rentable_unit_type_id : typeId;
    const st = 'status' in next ? next.status : status;
    if (type) q.rentable_unit_type_id = type;
    if (st) q.status = st;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const fetcher = React.useCallback(
    () => api.rentableUnits({ typeId, status, page }),
    [typeId, status, page],
  );
  const { data, loading, error } = useResource(fetcher, EMPTY, [typeId, status, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  const { data: types } = useResource(React.useCallback(() => api.rentableUnitTypes(), []), [], []);
  const typeOptions = React.useMemo(
    () => (types || []).map((t) => ({ value: String(t.id), label: t.name })),
    [types],
  );

  const columns = [
    { key: 'name', header: 'Unidad', ellipsis: true, render: (r) => <span className={s.cellStrong}>{r.name}</span> },
    { key: 'type_name', header: 'Tipo', ellipsis: true, render: (r) => r.type_name || <span className={s.faint}>—</span> },
    { key: 'capacity', header: 'Capacidad', width: 110, render: (r) => `${r.capacity} pers.` },
    {
      key: 'status', header: 'Estado', width: 120,
      render: (r) => (Number(r.status) === 1
        ? <Badge variant="success" dot>Reservable</Badge>
        : <Badge variant="neutral" dot>Inactiva</Badge>),
    },
    { key: 'base_price_per_night', header: 'Tarifa / noche', width: 140, align: 'right', render: (r) => <span className={s.priceCell}>{reservationMoney(r.base_price_per_night)}</span> },
  ];

  const filterDefs = [
    { key: 'rentable_unit_type_id', type: 'select', label: 'Tipo', icon: 'fas fa-house-chimney', options: typeOptions, placeholder: 'Todos los tipos' },
    { key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-circle-check', options: STATUS_OPTIONS },
  ];

  return (
    <div className={s.page}>
      <FilterBar
        filters={filterDefs}
        values={{ rentable_unit_type_id: typeId, status }}
        onChange={(next) => setQuery({ rentable_unit_type_id: next.rentable_unit_type_id, status: next.status })}
        inlineThreshold={0}
        resultCount={pg?.total}
        actions={
          <>
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin unidades' : `${pg.total} unidad${pg.total === 1 ? '' : 'es'}`}
              </p>
            )}
            <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => navigate('/rentable-units/new')}>
              Nueva unidad
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
          empty="No hay unidades registradas."
          onRowClick={(r) => navigate(`/rentable-units/${r.id}?${params.toString()}`)}
        />
      </Card>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}
    </div>
  );
}

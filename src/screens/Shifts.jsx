import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, Button, FilterBar, Pagination } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { todayIso, firstNameOf } from '../lib/orderLabels.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { shiftMoney, shiftDateTime, SHIFT_TYPE_LABELS } from '../lib/shiftLabels.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Abierto' },
  { value: 'CLOSED', label: 'Cerrado' },
];

const TYPE_OPTIONS = [
  { value: 'GLOBAL', label: 'Global' },
  { value: 'EMPLOYEE', label: 'Cajero' },
];

// Listado de turnos de caja de la compañía activa: abiertos primero, luego el histórico por
// apertura descendente. El backend decide qué se ve: el cajero (api-module-shifts-own) solo
// recibe los suyos y los turnos GLOBAL solo llegan con shift-global-admin. Los filtros viven
// en la URL para que volver desde el detalle conserve la consulta.
export function Shifts() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canGlobal = can('shift-global-admin');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || undefined;
  const type = params.get('type') || undefined;
  const dateFrom = params.get('date_from') || undefined;
  const dateTo = params.get('date_to') || undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (next = {}, nextPage = 1) => {
    const q = {};
    const st = 'status' in next ? next.status : status;
    const ty = 'type' in next ? next.type : type;
    const from = 'date_from' in next ? next.date_from : dateFrom;
    const to = 'date_to' in next ? next.date_to : dateTo;
    if (st) q.status = st;
    if (ty) q.type = ty;
    if (from) q.date_from = from;
    if (to) q.date_to = to;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const fetcher = React.useCallback(
    () => api.shifts({ status, type, dateFrom, dateTo, page }),
    [status, type, dateFrom, dateTo, page],
  );
  const { data, loading, error } = useResource(fetcher, EMPTY, [status, type, dateFrom, dateTo, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  const columns = [
    { key: 'opened_at', header: 'Apertura', width: 150, nowrap: true, render: (r) => <span className={s.cellStrong}>{shiftDateTime(r.opened_at)}</span> },
    {
      key: 'type', header: 'Tipo', width: 110,
      render: (r) => (r.type === 'GLOBAL'
        ? <Badge variant="info">{SHIFT_TYPE_LABELS.GLOBAL}</Badge>
        : <Badge variant="neutral">{SHIFT_TYPE_LABELS.EMPLOYEE}</Badge>),
    },
    {
      key: 'assigned_user_name', header: 'Asignado a', ellipsis: true,
      render: (r) => (r.type === 'EMPLOYEE'
        ? firstNameOf(r.assigned_user_name) || <span className={s.faint}>—</span>
        : <span className={s.faint}>Toda la compañía</span>),
    },
    { key: 'base_amount', header: 'Base', width: 120, align: 'right', render: (r) => <span className={s.priceCell}>{shiftMoney(r.base_amount)}</span> },
    {
      key: 'difference', header: 'Diferencia', width: 120, align: 'right',
      render: (r) => (r.difference == null
        ? <span className={s.faint}>—</span>
        : Number(r.difference) === 0
          ? <span className={s.muted}>Exacta</span>
          : <span className={s.priceCell}>{shiftMoney(r.difference)}</span>),
    },
    {
      key: 'status', header: 'Estado', width: 110,
      render: (r) => (r.status === 'OPEN'
        ? <Badge variant="success" dot>Abierto</Badge>
        : <Badge variant="neutral" dot>Cerrado</Badge>),
    },
  ];

  const filterDefs = [
    { key: 'range', type: 'daterange', label: 'Apertura', icon: 'fas fa-calendar', fromKey: 'date_from', toKey: 'date_to', max: todayIso() },
    // Sin shift-global-admin no hay turnos globales que listar: el filtro de tipo sobra.
    ...(canGlobal
      ? [{ key: 'type', type: 'select', label: 'Tipo', icon: 'fas fa-cash-register', options: TYPE_OPTIONS, placeholder: 'Todos los tipos' }]
      : []),
    { key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-circle-check', options: STATUS_OPTIONS, placeholder: 'Todos los estados' },
  ];

  const onFilters = (next) => {
    let from = next.date_from;
    let to = next.date_to;
    if (from && to && from > to) [from, to] = [to, from];
    setQuery({ date_from: from, date_to: to, type: next.type, status: next.status });
  };

  return (
    <div className={s.page}>
      <FilterBar
        filters={filterDefs}
        values={{ date_from: dateFrom, date_to: dateTo, type, status }}
        onChange={onFilters}
        inlineThreshold={0}
        resultCount={pg?.total}
        actions={
          <>
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin turnos' : `${pg.total} turno${pg.total === 1 ? '' : 's'}`}
              </p>
            )}
            <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => navigate('/shifts/open')}>
              Abrir turno
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
          empty="No hay turnos para los filtros seleccionados."
          onRowClick={(r) => navigate(`/shifts/${r.id}?${params.toString()}`)}
        />
      </Card>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}
    </div>
  );
}

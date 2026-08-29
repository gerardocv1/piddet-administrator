import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, Button, FilterBar, Pagination, RefreshButton, ListCard, Avatar, Spinner, Alert } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { formatShortDate } from '../lib/dates.js';
import { reservationMoney, reservationStatusMeta, checkInProximity, DECORATION_EMOJI, DECORATION_LABEL } from '../lib/reservationLabels.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };

// `active` = ni canceladas ni finalizadas. Es el filtro por defecto: el listado es la operación
// viva, y lo cerrado (una estadía que ya terminó, una reserva que se canceló) solo estorba ahí.
// No se pierde nada: los otros estados están a un filtro de distancia.
const DEFAULT_STATUS = 'active';
const STATUS_OPTIONS = [
  { value: 'active', label: 'Activas' },
  { value: '4', label: 'Finalizadas' },
  { value: '0', label: 'Canceladas' },
  { value: 'all', label: 'Todas' },
];

// Listado de reservas de la compañía activa, filtrable por rango de fechas de entrada, estado
// (abiertas/canceladas), unidad y búsqueda por código o titular. Todo vive en la URL para
// conservar la consulta al volver del detalle.
//
// El orden lo fija el backend: las reservas vigentes que entran hoy o mañana encabezan siempre el
// listado (con su badge «Hoy»/«Mañana», que reemplaza a la fecha) y las que llevan decoración
// llevan el badge 🎈 — las dos cosas son alertas de operación: son las que hay que preparar.
//
// En escritorio es una tabla; en el teléfono, tarjetas (`ListCard`): cinco columnas no caben en
// 390px sin dejar el titular en «T…».
// El badge de decoración es el mismo en la tabla y en las tarjetas del teléfono.
const decorationBadge = (
  <Badge variant="primary" title={DECORATION_LABEL} aria-label={DECORATION_LABEL}>{DECORATION_EMOJI}</Badge>
);

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

  // Anchos en porcentaje, no en píxeles: la tabla es `table-layout: fixed`, así que un ancho fijo
  // en la mitad de las columnas dejaba a las flexibles con lo que sobrara —en pantallas angostas,
  // «T…» y «U…»—. En porcentaje la proporción se mantiene a cualquier ancho.
  const columns = [
    { key: 'holder_user_name', header: 'Titular', width: '30%', ellipsis: true, render: (r) => <span className={s.cellStrong}>{r.holder_user_name}</span> },
    { key: 'rentable_unit_name', header: 'Unidad', width: '22%', ellipsis: true, render: (r) => r.rentable_unit_name },
    {
      key: 'check_in_date', header: 'Entrada', width: '24%', nowrap: true,
      render: (r) => {
        // Las que entran hoy o mañana llegan de primeras desde el backend, y el badge sustituye a
        // la fecha: decir «Hoy» y «29 ago 2026» a la vez es repetir el mismo dato dos veces.
        const soon = checkInProximity(r.check_in_date, r.status);
        const nights = Number(r.nights);
        return (
          <span className={s.muted}>
            {soon
              ? <Badge variant={soon.variant} dot>{soon.label}</Badge>
              : formatShortDate(r.check_in_date)}
            {r.has_decoration && <> {decorationBadge}</>}
            {/* Una noche es lo normal: solo se anuncia la estadía cuando son varias. */}
            {nights > 1 && <> <Badge variant="neutral">{nights} noches</Badge></>}
          </span>
        );
      },
    },
    {
      key: 'status', header: 'Estado', width: '14%',
      render: (r) => {
        const m = reservationStatusMeta(r.status);
        return <Badge variant={m.variant} dot>{m.label}</Badge>;
      },
    },
    { key: 'total', header: 'Total', width: '10%', align: 'right', render: (r) => <span className={s.priceCell}>{reservationMoney(r.total)}</span> },
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

      <div className={s.desktopList}>
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
      </div>

      {/* Teléfono: una tarjeta por reserva. Arriba quién llega y a dónde; abajo las alertas
          («Hoy»/«Mañana» y decoración) y, al otro extremo, estado y total. */}
      <div className={s.mobileList}>
        {loading && <Card><div className={s.mobileState}><Spinner size="sm" label="Cargando…" /></div></Card>}
        {!loading && error && (
          <Card><Alert tone="danger" title="No se pudieron cargar las reservas">{error}</Alert></Card>
        )}
        {!loading && !error && rows.length === 0 && (
          <Card><div className={s.mobileState}>No hay reservas para los filtros seleccionados.</div></Card>
        )}
        {!loading && !error && rows.map((r) => {
          const soon = checkInProximity(r.check_in_date, r.status);
          const nights = Number(r.nights);
          const st = reservationStatusMeta(r.status);
          // La fecha vive en el subtítulo salvo que el badge «Hoy»/«Mañana» ya la diga.
          const stay = [
            r.rentable_unit_name,
            soon ? null : formatShortDate(r.check_in_date),
            nights > 1 ? `${nights} noches` : null,
          ].filter(Boolean).join(' · ');
          return (
            <ListCard key={r.id}
              media={<Avatar name={r.holder_user_name} size="sm" />}
              title={r.holder_user_name}
              subtitle={stay}
              badge={
                <span className={s.rowBadges}>
                  {soon && <Badge variant={soon.variant} dot>{soon.label}</Badge>}
                  {r.has_decoration && decorationBadge}
                  <Badge variant={st.variant} dot>{st.label}</Badge>
                </span>
              }
              meta={reservationMoney(r.total)}
              onClick={() => navigate(`/reservations/${r.id}?${params.toString()}`)} />
          );
        })}
      </div>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}
    </div>
  );
}

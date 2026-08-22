import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, FilterBar, Pagination, RefreshButton } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { gymMoney, gymSubscriptionStatusMeta, GYM_SUBSCRIPTION_STATUS } from '../lib/gymLabels.js';
import { formatShortDate } from '../lib/dates.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };

const STATUS_OPTIONS = [
  { value: String(GYM_SUBSCRIPTION_STATUS.ACTIVE), label: 'Activa' },
  { value: String(GYM_SUBSCRIPTION_STATUS.GRACE), label: 'En gracia' },
  { value: String(GYM_SUBSCRIPTION_STATUS.EXPIRED), label: 'Vencida' },
  { value: String(GYM_SUBSCRIPTION_STATUS.CANCELLED), label: 'Cancelada' },
];

const EXPIRING_OPTIONS = [
  { value: '7', label: 'En 7 días' },
  { value: '3', label: 'En 3 días' },
];

// Listado operativo de todas las suscripciones de la compañía: quién está vigente, quién está en
// gracia y quién vence pronto. Las acciones (renovar, cancelar, registrar pago) se hacen desde la
// ficha del miembro; aquí solo se navega a ella.
export function GymSubscriptions() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || undefined;
  const expiringWithin = params.get('expiring_within') || undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (next = {}, nextPage = 1) => {
    const q = {};
    const st = 'status' in next ? next.status : status;
    const exp = 'expiring_within' in next ? next.expiring_within : expiringWithin;
    if (st) q.status = st;
    if (exp) q.expiring_within = exp;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const fetcher = React.useCallback(
    () => api.gymSubscriptions({ status, expiringWithin, page }),
    [status, expiringWithin, page],
  );
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, [status, expiringWithin, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  const columns = [
    { key: 'member_name', header: 'Miembro', ellipsis: true, render: (r) => <span className={s.cellStrong}>{r.member_name}</span> },
    { key: 'plan_name', header: 'Plan', ellipsis: true, render: (r) => r.plan_name },
    { key: 'end_date', header: 'Vence', width: 130, render: (r) => formatShortDate(r.end_date) },
    { key: 'price', header: 'Precio', width: 120, align: 'right', render: (r) => <span className={s.priceCell}>{gymMoney(r.price)}</span> },
    {
      key: 'status', header: 'Estado', width: 130,
      render: (r) => {
        const m = gymSubscriptionStatusMeta(r.status);
        return <Badge variant={m.variant} dot>{m.label}</Badge>;
      },
    },
  ];

  const filterDefs = [
    { key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-circle-check', options: STATUS_OPTIONS },
    { key: 'expiring_within', type: 'select', label: 'Vencen', icon: 'fas fa-hourglass-half', options: EXPIRING_OPTIONS, placeholder: 'Cualquier fecha' },
  ];

  return (
    <div className={s.page}>
      <FilterBar
        filters={filterDefs}
        values={{ status, expiring_within: expiringWithin }}
        onChange={(next) => setQuery({ status: next.status, expiring_within: next.expiring_within })}
        inlineThreshold={0}
        resultCount={pg?.total}
        actions={
          <>
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin suscripciones' : `${pg.total} suscripción${pg.total === 1 ? '' : 'es'}`}
              </p>
            )}
            <RefreshButton loading={loading} onClick={reload} />
          </>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          empty="No hay suscripciones para los filtros seleccionados."
          onRowClick={(r) => navigate(`/gym/members/${r.gym_member_id}`)}
        />
      </Card>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}
    </div>
  );
}

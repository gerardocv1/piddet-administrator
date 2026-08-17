import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, Spinner, DataTable, PageHeader } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { shiftMoney, shiftDateTime, SHIFT_TYPE_LABELS, MOVEMENT_TYPE_LABELS } from '../lib/shiftLabels.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import t from './ShiftDetail.module.css';

const MOVEMENT_BADGE = { order: 'success', expense: 'danger', adjustment: 'warning' };

// Detalle de un turno de caja: datos de apertura, balance en vivo (base + ventas − gastos,
// con desglose por método de pago) y el historial de movimientos que el backend asoció
// automáticamente (ventas, gastos y el ajuste del cierre). Los movimientos de recursos
// cancelados/anulados con el turno abierto aparecen tachados y no cuentan en el balance.
// El ajuste del cierre enlaza a su documento contable: el sobrante se factura y el faltante
// se registra como gasto, para que la contabilidad cuadre con la plata contada.
export function ShiftDetail() {
  const { shiftId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { can, canAny } = usePermissions();

  const fetcher = React.useCallback(() => api.shift(shiftId), [shiftId]);
  const { data, loading, error } = useResource(fetcher, null, [shiftId]);

  useSetPageTitle(data?.id ? `Turno #${data.id}` : null);

  // Conserva la consulta del listado al volver.
  const goBack = () => navigate(`/shifts${params.toString() ? `?${params.toString()}` : ''}`);

  if (loading) return <Spinner center label="Cargando turno…" />;
  if (error || !data) {
    return (
      <div className={s.page}>
        <div className={s.stateError}>
          <i className="fas fa-triangle-exclamation" /> {error || 'No se encontró el turno.'}
        </div>
      </div>
    );
  }

  const documentPath = (movement) => {
    if (!movement.reference_id) return null;
    return movement.reference_type === 'order'
      ? `/invoices/${movement.reference_id}`
      : `/expenses/${movement.reference_id}`;
  };
  const canOpenDocument = (movement) => (movement.reference_type === 'order'
    ? can('api-module-orders')
    : canAny(['api-module-expenses', 'api-module-expenses-own']));

  const open = data.status === 'OPEN';
  const balance = data.balance || {};
  const movements = data.movements || [];
  // El turno GLOBAL solo lo cierra quien tenga shift-global-admin; el de cajero, su dueño o
  // un admin (los cajeros solo llegan a ver los suyos: el backend filtra).
  const canClose = open && (data.type === 'GLOBAL' ? can('shift-global-admin') : true);
  const difference = data.difference != null ? Number(data.difference) : null;

  const movementColumns = [
    {
      key: 'resource_type', header: 'Tipo', width: 90,
      render: (r) => <Badge variant={MOVEMENT_BADGE[r.resource_type] || 'neutral'}>{MOVEMENT_TYPE_LABELS[r.resource_type] || r.resource_type}</Badge>,
    },
    {
      key: 'resource_label', header: 'Detalle', width: 180, ellipsis: true,
      render: (r) => {
        const label = r.resource_label || r.resource_id || '—';
        const to = documentPath(r);
        // El ajuste enlaza al documento contable que lo respalda (factura del sobrante o gasto
        // del faltante), si el usuario tiene acceso a ese módulo.
        return to && canOpenDocument(r) ? (
          <Link className={t.docLink} to={to} onClick={(e) => e.stopPropagation()}>
            {label} <i className="fas fa-up-right-from-square" />
          </Link>
        ) : withStrike(r, label);
      },
    },
    { key: 'payment_method', header: 'Método', width: 140, ellipsis: true, render: (r) => withStrike(r, r.payment_method_name || r.payment_method || '—') },
    {
      key: 'amount', header: 'Monto', width: 120, align: 'right',
      render: (r) => withStrike(r, <span className={s.priceCell}>{shiftMoney(r.amount)}</span>),
    },
    { key: 'occurred_at', header: 'Fecha', width: 130, nowrap: true, render: (r) => withStrike(r, shiftDateTime(r.occurred_at)) },
  ];

  return (
    <div className={s.page}>
      <PageHeader
        onBack={goBack}
        backTitle="Volver a turnos"
        subtitle={`Turno ${SHIFT_TYPE_LABELS[data.type] || data.type} · ${shiftDateTime(data.opened_at)}`}
        actions={<>
          {open
            ? <Badge variant="success" dot>Abierto</Badge>
            : <Badge variant="neutral" dot>Cerrado</Badge>}
          {canClose && (
            <Button variant="primary" size="sm" icon="fas fa-lock" onClick={() => navigate(`/shifts/${data.id}/close`)}>
              Cerrar turno
            </Button>
          )}
        </>}
        meta={[
          { label: 'Base', value: shiftMoney(data.base_amount) },
          data.type === 'EMPLOYEE' && { label: 'Asignado a', value: data.assigned_user_name || '—' },
          { label: 'Abierto por', value: data.opened_by_name || '—' },
          !open && { label: 'Cerrado por', value: data.closed_by_name || '—' },
          !open && { label: 'Cierre', value: shiftDateTime(data.closed_at) },
        ].filter(Boolean)}
        note={!open && difference != null && difference !== 0 ? (
          <><i className={difference > 0 ? 'fas fa-arrow-trend-up' : 'fas fa-arrow-trend-down'} />{' '}
            {difference > 0 ? 'Sobrante' : 'Faltante'} de <strong>{shiftMoney(Math.abs(difference))}</strong> en el
            arqueo{data.closing_notes ? <>: «{data.closing_notes}»</> : '.'}</>
        ) : (!open && data.closing_notes ? <><i className="fas fa-note-sticky" /> {data.closing_notes}</> : null)}
      />

      <div className={t.mainGrid}>
        {/* La tabla va directa en la Card (sin Card.Body) para ocupar todo el ancho, como en
            los listados; el título propio de la tabla vive en el header de la tarjeta. */}
        <Card>
          <Card.Header title={`Movimientos${movements.length ? ` (${movements.length})` : ''}`} />
          <DataTable
            columns={movementColumns}
            rows={movements}
            rowKey="id"
            empty="Aún no hay movimientos en este turno."
          />
        </Card>

        <div className={t.sideCol}>
          <Card>
            <Card.Header title={open ? 'Balance en vivo' : 'Balance del cierre'} />
            <Card.Body>
              <div className={t.balance}>
                <div className={t.balanceRow}>
                  <span>Base</span>
                  <strong>{shiftMoney(balance.base_amount)}</strong>
                </div>
                <div className={t.balanceRow}>
                  <span>Ventas ({balance.sales?.count ?? 0})</span>
                  <strong className={t.income}>+ {shiftMoney(balance.sales?.total)}</strong>
                </div>
                <MethodBreakdown rows={balance.sales?.by_method} />
                <div className={t.balanceRow}>
                  <span>Gastos ({balance.expenses?.count ?? 0})</span>
                  <strong className={t.outcome}>− {shiftMoney(balance.expenses?.total)}</strong>
                </div>
                <MethodBreakdown rows={balance.expenses?.by_method} />
                <div className={`${t.balanceRow} ${t.balanceTotal}`}>
                  <span>Esperado en caja</span>
                  <strong>{shiftMoney(balance.expected_amount)}</strong>
                </div>
                {!open && (
                  <>
                    <div className={t.balanceRow}>
                      <span>Contado al cierre</span>
                      <strong>{shiftMoney(data.counted_amount)}</strong>
                    </div>
                    <div className={t.balanceRow}>
                      <span>Diferencia</span>
                      <strong className={difference > 0 ? t.income : difference < 0 ? t.outcome : ''}>
                        {difference === 0 ? 'Exacta' : shiftMoney(data.difference)}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Tacha el contenido cuando el movimiento quedó excluido del balance (recurso cancelado/anulado).
function withStrike(row, content) {
  return Number(row.status) === 1 ? content : <span className={t.excluded}>{content}</span>;
}

// Desglose informativo por método de pago dentro del balance.
function MethodBreakdown({ rows }) {
  if (!rows?.length) return null;
  return (
    <ul className={t.methods}>
      {rows.map((m) => (
        <li key={m.payment_method || 'none'}>
          <span>{m.payment_method_name || m.payment_method || 'Sin método'}</span>
          <span>{shiftMoney(m.total)}</span>
        </li>
      ))}
    </ul>
  );
}

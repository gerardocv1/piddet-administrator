import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, IconButton, RefreshButton, Spinner, DataTable, PageHeader, Dropdown, Modal, MoneyInput, ConfirmDialog, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { shiftMoney, shiftDateTime, SHIFT_TYPE_LABELS, MOVEMENT_TYPE_LABELS } from '../lib/shiftLabels.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import t from './ShiftDetail.module.css';

const MOVEMENT_BADGE = { order: 'success', expense: 'danger', adjustment: 'warning' };
const DOCUMENT_PATHS = { order: '/invoices', expense: '/expenses' };

// Detalle de un turno de caja: datos de apertura, balance en vivo (base + ventas − gastos,
// con desglose por método de pago) y el historial de movimientos que el backend asoció
// automáticamente (ventas, gastos y el ajuste del cierre). Los movimientos de recursos
// cancelados/anulados con el turno abierto aparecen tachados y no cuentan en el balance.
// Cada movimiento enlaza a su documento: la venta a su factura, el gasto a su detalle y el
// ajuste del cierre al documento contable que lo respalda (el sobrante se factura y el
// faltante se registra como gasto, para que la contabilidad cuadre con la plata contada).
export function ShiftDetail() {
  const { shiftId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { can, canAny } = usePermissions();
  const { toast } = useToast();

  const fetcher = React.useCallback(() => api.shift(shiftId), [shiftId]);
  const { data, loading, error, reload } = useResource(fetcher, null, [shiftId]);

  useSetPageTitle(data?.id ? `Turno #${data.id}` : null);

  const [editBaseOpen, setEditBaseOpen] = React.useState(false);
  const [baseValue, setBaseValue] = React.useState('');
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState(null);

  // Conserva la consulta del listado al volver.
  const goBack = () => navigate(`/shifts${params.toString() ? `?${params.toString()}` : ''}`);

  if (loading) return <Spinner center label="Cargando turno…" />;
  if (error || !data) {
    return (
      <div className={s.page}>
        <Alert tone="danger" title="No se pudo cargar el turno">{error || 'No se encontró el turno.'}</Alert>
      </div>
    );
  }

  // El movimiento enlaza al documento que lo originó (la factura o el gasto); el ajuste del
  // cierre no tiene recurso propio, así que enlaza al documento contable que lo respalda.
  const documentTarget = (movement) => {
    const type = movement.reference_id ? movement.reference_type : movement.resource_type;
    const id = movement.reference_id || movement.resource_id;
    const base = DOCUMENT_PATHS[type];
    return base && id ? { type, to: `${base}/${id}` } : null;
  };
  const canOpenDocument = (type) => (type === 'order'
    ? canAny(['api-module-orders', 'api-module-orders-own'])
    : canAny(['api-module-expenses', 'api-module-expenses-own']));

  const open = data.status === 'OPEN';
  const cancelled = data.status === 'CANCELLED';
  const balance = data.balance || {};
  const movements = data.movements || [];
  // El turno GLOBAL solo lo cierra quien tenga shift-global-admin; el de cajero, su dueño o
  // un admin (los cajeros solo llegan a ver los suyos: el backend filtra).
  const canClose = open && (data.type === 'GLOBAL' ? can('shift-global-admin') : true);
  // Corregir la base y cancelar el turno son acciones solo del admin del módulo (el backend
  // gatea las rutas con api-module-shifts); el GLOBAL exige además shift-global-admin.
  const canManage = open && can('api-module-shifts') && (data.type === 'GLOBAL' ? can('shift-global-admin') : true);
  const difference = data.difference != null ? Number(data.difference) : null;

  const openEditBase = () => {
    setBaseValue(String(Number(data.base_amount || 0)));
    setActionError(null);
    setEditBaseOpen(true);
  };

  const validBase = baseValue !== '' && Number(baseValue) >= 0;

  const submitBase = async () => {
    if (busy || !validBase) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.updateShiftBase(data.id, Number(baseValue));
      setEditBaseOpen(false);
      reload();
      toast({ tone: 'success', title: 'Base actualizada' });
    } catch (e) {
      setActionError(e?.message || 'No se pudo actualizar la base.');
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = async (reason) => {
    setBusy(true);
    setActionError(null);
    try {
      await api.cancelShift(data.id, reason);
      setCancelOpen(false);
      reload();
      toast({ tone: 'neutral', title: 'Turno cancelado' });
    } catch (e) {
      setActionError(e?.message || 'No se pudo cancelar el turno.');
    } finally {
      setBusy(false);
    }
  };

  const movementColumns = [
    {
      key: 'resource_type', header: 'Tipo', width: 90,
      render: (r) => <Badge variant={MOVEMENT_BADGE[r.resource_type] || 'neutral'}>{MOVEMENT_TYPE_LABELS[r.resource_type] || r.resource_type}</Badge>,
    },
    {
      key: 'resource_label', header: 'Detalle', width: 180, ellipsis: true,
      render: (r) => {
        const label = r.resource_label || r.resource_id || '—';
        const target = documentTarget(r);
        return target && canOpenDocument(target.type)
          ? withStrike(r, <Link className={t.docLink} to={target.to} onClick={(e) => e.stopPropagation()}>{label}</Link>)
          : withStrike(r, label);
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
          <RefreshButton loading={loading} onClick={reload} />
          {open
            ? <Badge variant="success" dot>Abierto</Badge>
            : cancelled
              ? <Badge variant="danger" dot>Cancelado</Badge>
              : <Badge variant="neutral" dot>Cerrado</Badge>}
          {canClose && (
            <Button variant="primary" size="sm" icon="fas fa-lock" onClick={() => navigate(`/shifts/${data.id}/close`)}>
              Cerrar turno
            </Button>
          )}
          {canManage && (
            <Dropdown
              trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Más acciones" />}
              items={[
                { label: 'Editar base', icon: 'fas fa-pen', onClick: openEditBase },
                { label: 'Cancelar turno', icon: 'fas fa-ban', variant: 'danger', onClick: () => { setActionError(null); setCancelOpen(true); } },
              ]}
            />
          )}
        </>}
        meta={[
          { label: 'Base', value: shiftMoney(data.base_amount) },
          data.type === 'EMPLOYEE' && { label: 'Asignado a', value: data.assigned_user_name || '—' },
          { label: 'Abierto por', value: data.opened_by_name || '—' },
          cancelled && { label: 'Cancelado por', value: data.cancelled_by_name || '—' },
          cancelled && { label: 'Cancelación', value: shiftDateTime(data.cancelled_at) },
          !open && !cancelled && { label: 'Cerrado por', value: data.closed_by_name || '—' },
          !open && !cancelled && { label: 'Cierre', value: shiftDateTime(data.closed_at) },
        ].filter(Boolean)}
        note={cancelled ? (
          <><i className="fas fa-ban" /> Turno cancelado{data.cancellation_reason ? <>: «{data.cancellation_reason}»</> : '.'}</>
        ) : !open && difference != null && difference !== 0 ? (
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
            <Card.Header title={open ? 'Balance en vivo' : cancelled ? 'Balance al cancelar' : 'Balance del cierre'} />
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
                {!open && !cancelled && (
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

      <Modal open={editBaseOpen} size="sm" title="Editar base"
        onClose={() => !busy && setEditBaseOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => !busy && setEditBaseOpen(false)}>Volver</Button>
          <Button variant="primary" icon="fas fa-pen" loading={busy} disabled={!validBase} onClick={submitBase}>
            Guardar base
          </Button>
        </>}>
        <div className={s.formCol}>
          <MoneyInput label="Base en caja" icon="fas fa-dollar-sign" placeholder="0"
            value={baseValue} onChange={setBaseValue}
            hint="El esperado en caja se recalcula con la nueva base." />
          {actionError && <Alert tone="danger" onClose={() => setActionError(null)}>{actionError}</Alert>}
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar turno"
        confirmLabel="Cancelar turno"
        reason="required"
        reasonLabel="Motivo de la cancelación"
        reasonPlaceholder="Ej.: el turno se abrió por error"
        loading={busy}
        error={actionError}
        onConfirm={confirmCancel}
        onClose={() => !busy && setCancelOpen(false)}
      >
        <p>
          Esta acción es <strong>irreversible</strong>: el turno quedará cancelado, dejará de
          registrar ventas y gastos, y no contará para el arqueo de caja.
        </p>
      </ConfirmDialog>
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

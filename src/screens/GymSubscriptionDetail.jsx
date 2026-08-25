import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Panel, Badge, Button, Spinner, Alert, Select, MoneyInput, DatePicker, Checkbox,
  Modal, ConfirmDialog, PageHeader, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import {
  gymMoney, gymSubscriptionStatusMeta, gymPeriodStatusMeta, gymPendingBalance,
  gymSubscriptionPending, GYM_SUBSCRIPTION_STATUS, GYM_PERIOD_STATUS,
} from '../lib/gymLabels.js';
import { formatShortDate, formatStayRangeShort } from '../lib/dates.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import g from './GymSubscriptionDetail.module.css';

// Detalle de LA suscripción continua del afiliado: su estado y el historial de períodos de
// cobro que el sistema genera solo, cada uno con sus pagos (abonos) y su saldo. No hay
// "renovar": el período siguiente aparece automáticamente; si uno agota su gracia sin ningún
// abono, la suscripción entera se cancela sola.
export function GymSubscriptionDetail() {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  const fetcher = React.useCallback(() => api.gymSubscription(subscriptionId), [subscriptionId]);
  const { data, setData, loading, error } = useResource(fetcher, null, [subscriptionId]);

  const { data: paymentMethods } = useResource(api.paymentMethods, [], []);
  const methodOptions = React.useMemo(
    () => (paymentMethods || []).map((m) => ({ value: m.id, label: m.name })),
    [paymentMethods],
  );

  // La barra superior lleva un título fijo: el nombre del afiliado ya está en la cabecera de la
  // ficha, justo debajo, y repetirlo arriba era ruido.
  useSetPageTitle('Suscripción');

  const goBack = () => navigate(`/gym/subscriptions${params.toString() ? `?${params.toString()}` : ''}`);

  const status = data ? Number(data.status) : null;
  const isActive = status === GYM_SUBSCRIPTION_STATUS.ACTIVE;

  // El abono siempre se aplica al período más antiguo con saldo (regla del backend): se calcula
  // aquí solo para precargar el valor y nombrarlo en el modal.
  const periodsAsc = React.useMemo(
    () => [...(data?.periods || [])].sort((a, b) => a.number - b.number),
    [data],
  );
  const payTarget = periodsAsc.find(
    (p) => Number(p.status) !== GYM_PERIOD_STATUS.CANCELLED && gymPendingBalance(p) > 0,
  );

  // ── Registrar pago (abono al período pendiente más antiguo) ──────────────
  const emptyPayForm = { payment_method: '', value: '', payment_date: '', notes: '', registers_income: true };
  const [payOpen, setPayOpen] = React.useState(false);
  const [payForm, setPayForm] = React.useState(emptyPayForm);
  const [payBusy, setPayBusy] = React.useState(false);
  const [payError, setPayError] = React.useState('');

  const openPay = () => {
    setPayForm({ ...emptyPayForm, value: payTarget ? gymPendingBalance(payTarget) : '' });
    setPayError('');
    setPayOpen(true);
  };

  const submitPay = async () => {
    if (payBusy || !payForm.payment_method || !payForm.value) return;
    setPayBusy(true);
    setPayError('');
    try {
      const updated = await api.addGymSubscriptionPayment(subscriptionId, {
        payment_method: payForm.payment_method,
        value: payForm.value,
        payment_date: payForm.payment_date || undefined,
        notes: payForm.notes.trim() || undefined,
        registers_income: payForm.registers_income,
      });
      setData(updated);
      toast({ tone: 'success', title: 'Pago registrado' });
      setPayOpen(false);
    } catch (e) {
      setPayError(e?.message || 'No se pudo registrar el pago.');
    } finally {
      setPayBusy(false);
    }
  };

  // ── Anular pago ──────────────────────────────────────────────────────────
  const [annulTarget, setAnnulTarget] = React.useState(null);
  const [annulBusy, setAnnulBusy] = React.useState(false);
  const [annulError, setAnnulError] = React.useState('');

  const submitAnnul = async (reason) => {
    if (annulBusy || !annulTarget) return;
    setAnnulBusy(true);
    setAnnulError('');
    try {
      const updated = await api.annulGymPayment(annulTarget.id, reason);
      setData(updated);
      toast({ tone: 'neutral', title: 'Pago anulado' });
      setAnnulTarget(null);
    } catch (e) {
      setAnnulError(e?.message || 'No se pudo anular el pago.');
    } finally {
      setAnnulBusy(false);
    }
  };

  // ── Cancelar suscripción ─────────────────────────────────────────────────
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelBusy, setCancelBusy] = React.useState(false);
  const [cancelError, setCancelError] = React.useState('');

  const submitCancel = async (reason) => {
    if (cancelBusy) return;
    setCancelBusy(true);
    setCancelError('');
    try {
      const updated = await api.cancelGymSubscription(subscriptionId, reason);
      setData(updated);
      toast({ tone: 'neutral', title: 'Suscripción cancelada' });
      setCancelOpen(false);
    } catch (e) {
      setCancelError(e?.message || 'No se pudo cancelar la suscripción.');
    } finally {
      setCancelBusy(false);
    }
  };

  if (loading) return <Spinner center label="Cargando suscripción…" />;
  if (error || !data) {
    return (
      <div className={s.page}>
        <Alert tone="danger" title="No se pudo abrir la suscripción">{error || 'No se encontró la suscripción.'}</Alert>
      </div>
    );
  }

  const pendingTotal = gymSubscriptionPending(data);
  const currentPeriod = data.current_period;
  const currentStatus = currentPeriod ? Number(currentPeriod.computed_status ?? currentPeriod.status) : null;
  const currentInGrace = isActive && currentStatus === GYM_PERIOD_STATUS.GRACE;
  const currentUnpaid = currentPeriod && Number(currentPeriod.paid_total || 0) === 0;

  // Con una activa cuyo período está en gracia, el badge lo advierte; si no, manda el estado
  // de la suscripción.
  const headerMeta = currentInGrace
    ? gymPeriodStatusMeta(GYM_PERIOD_STATUS.GRACE)
    : gymSubscriptionStatusMeta(status);

  return (
    <div className={s.page}>
      <PageHeader
        onBack={goBack}
        title={data.member_name}
        onTitleClick={() => navigate(`/gym/members/${data.gym_member_id}`)}
        subtitle={data.plan_name}
        menu={isActive ? [
          ...(pendingTotal > 0 ? [{ label: 'Registrar pago', icon: 'fas fa-dollar-sign', onClick: openPay }] : []),
          { label: 'Cancelar suscripción', icon: 'fas fa-ban', variant: 'danger', onClick: () => setCancelOpen(true) },
        ] : []}
        meta={[
          { label: 'Suscrito desde', value: formatShortDate(data.subscribed_at) },
          { label: 'Estado', value: <Badge variant={headerMeta.variant} dot>{headerMeta.label}</Badge> },
          {
            label: 'Pago',
            value: pendingTotal > 0
              ? <Badge variant="warning" dot>Saldo {gymMoney(pendingTotal)}</Badge>
              : <Badge variant="success" dot>Al día</Badge>,
          },
        ]}
        note={status === GYM_SUBSCRIPTION_STATUS.CANCELLED && data.cancellation_reason
          ? `Cancelada${data.cancelled_automatically ? ' automáticamente' : ''}: ${data.cancellation_reason}`
          : undefined}
      />

      {currentInGrace && (
        <Alert tone="warning" title="Período en gracia">
          {currentUnpaid ? (
            <>El período venció el {formatShortDate(currentPeriod.end_date)} sin ningún abono:
              si no se registra un pago antes del {formatShortDate(currentPeriod.grace_ends_at)},
              la suscripción se cancelará automáticamente.</>
          ) : (
            <>El período venció el {formatShortDate(currentPeriod.end_date)} con un saldo de{' '}
              {gymMoney(gymPendingBalance(currentPeriod))}; el acceso termina el{' '}
              {formatShortDate(currentPeriod.grace_ends_at)}.</>
          )}
        </Alert>
      )}

      {/* ── Historial de períodos de cobro (el más reciente primero) ── */}
      {(data.periods || []).map((p) => {
        const pStatus = Number(p.computed_status ?? p.status);
        const pMeta = gymPeriodStatusMeta(pStatus);
        const pending = Number(p.status) === GYM_PERIOD_STATUS.CANCELLED ? 0 : gymPendingBalance(p);
        const payments = p.payments || [];
        return (
          <Panel key={p.id}
            title={`Período ${p.number} · ${formatStayRangeShort(p.start_date, p.end_date)}`}
            action={<Badge variant={pMeta.variant} dot>{pMeta.label}</Badge>}>
            {payments.length === 0 ? (
              <p className={s.faint}>Sin pagos en este período.</p>
            ) : (
              <ul className={g.payList}>
                {payments.map((pay) => {
                  const annulled = Number(pay.status) !== 1;
                  return (
                    <li key={pay.id} className={g.payRow}>
                      <div className={g.payInfo}>
                        <span className={[g.payValue, annulled ? g.payAnnulled : ''].filter(Boolean).join(' ')}>
                          {gymMoney(pay.value)}
                        </span>
                        <span className={g.payMeta}>
                          {formatShortDate(pay.payment_date)} · {pay.payment_method_name || '—'}
                          {pay.registers_income === false && ' · sin factura'}
                        </span>
                        {annulled && pay.annulment_reason && (
                          <span className={g.payReason}>Anulado: {pay.annulment_reason}</span>
                        )}
                      </div>
                      {annulled ? (
                        <Badge variant="neutral" dot>Anulado</Badge>
                      ) : (
                        <Button variant="outline-primary" size="sm" onClick={() => setAnnulTarget(pay)}>Anular</Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className={g.payTotal}>
              <span>Total pagado</span>
              <span className={g.payTotalRight}>
                <strong>{gymMoney(p.paid_total)}</strong>
                {pending > 0 && <Badge variant="danger" dot>Pendiente {gymMoney(pending)}</Badge>}
              </span>
            </div>
          </Panel>
        );
      })}

      <Modal open={payOpen} title="Registrar pago" onClose={() => setPayOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={payBusy} disabled={!payForm.payment_method || !payForm.value} onClick={submitPay}>Registrar</Button>
        </>}>
        <div className={s.formCol}>
          {payTarget && (
            <p className={s.faint}>
              El abono se aplica al período {payTarget.number}{' '}
              ({formatStayRangeShort(payTarget.start_date, payTarget.end_date)}) · saldo{' '}
              <strong>{gymMoney(gymPendingBalance(payTarget))}</strong>.
            </p>
          )}
          <Select label="Método de pago" icon="fas fa-wallet" value={payForm.payment_method}
            onChange={(e) => setPayForm((f) => ({ ...f, payment_method: e.target.value }))}
            options={[{ value: '', label: 'Selecciona…' }, ...methodOptions]} />
          <MoneyInput label="Valor" icon="fas fa-dollar-sign"
            value={payForm.value} onChange={(v) => setPayForm((f) => ({ ...f, value: v }))} />
          <DatePicker label="Fecha del pago (opcional)" value={payForm.payment_date}
            onChange={(iso) => setPayForm((f) => ({ ...f, payment_date: iso }))} />
          <Checkbox label="Registrar el cobro como ingreso"
            checked={payForm.registers_income}
            onChange={(e) => setPayForm((f) => ({ ...f, registers_income: e.target.checked }))} />
          <p className={s.faint}>
            {payForm.registers_income
              ? 'El pago genera su factura en la fecha indicada.'
              : 'El pago queda registrado en la suscripción, pero sin factura: no entra a la caja. Es lo que corresponde a un dinero que se cobró antes de usar la plataforma.'}
          </p>
          {payError && <Alert tone="danger" onClose={() => setPayError('')}>{payError}</Alert>}
        </div>
      </Modal>

      <ConfirmDialog open={cancelOpen} title="Cancelar suscripción" reason="required"
        reasonLabel="Motivo de la cancelación" loading={cancelBusy} error={cancelError}
        onConfirm={submitCancel} onClose={() => setCancelOpen(false)}>
        Esta acción es irreversible: se cancelan también los períodos pendientes y el afiliado
        pierde el acceso. Para que vuelva a tener membresía habrá que suscribirlo de nuevo.
      </ConfirmDialog>

      <ConfirmDialog open={!!annulTarget} title="Anular pago" reason="required"
        reasonLabel="Motivo de la anulación" loading={annulBusy} error={annulError}
        onConfirm={submitAnnul} onClose={() => setAnnulTarget(null)}>
        {annulTarget?.registers_income === false
          ? 'Esta acción es irreversible. Este pago no generó factura, así que no hay nada que cancelar en la caja.'
          : 'Esta acción es irreversible: se cancela también la factura de este pago.'}
      </ConfirmDialog>
    </div>
  );
}

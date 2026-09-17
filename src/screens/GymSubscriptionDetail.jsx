import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Panel, Badge, Button, IconButton, Dropdown, Spinner, Alert, Select, MoneyInput, DatePicker, Checkbox,
  Modal, ConfirmDialog, PageHeader, InfoCard, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import {
  gymMoney, gymSubscriptionStatusMeta, gymPeriodStatusMeta, gymPendingBalance,
  gymSubscriptionPending, GYM_SUBSCRIPTION_STATUS, GYM_PERIOD_STATUS,
} from '../lib/gymLabels.js';
import { formatShortDate, formatStayRangeShort, todayIso, addDaysIso } from '../lib/dates.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import g from './GymSubscriptionDetail.module.css';

// Detalle de LA suscripción continua del afiliado. La pantalla se lee de arriba abajo en tres
// alturas, de lo vigente a lo viejo:
//   1. la suscripción (cabecera): plan, desde cuándo, estado y si está al día;
//   2. el período EN CURSO, con sus pagos y —si debe— el recordatorio de cobro;
//   3. el historial, plegado: los períodos anteriores, uno por tarjeta desplegable.
// No hay "renovar": el período siguiente aparece automáticamente con la corrida diaria del
// backend; si uno agota su gracia sin ningún abono, la suscripción entera se cancela sola.
// Cuando esa corrida no ha pasado (el período vigente ya venció y no existe el siguiente), el
// operador puede forzar el mismo ciclo desde aquí con "Generar período".
export function GymSubscriptionDetail() {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const { can } = usePermissions();

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

  // El historial nace plegado: arriba lo vigente, y lo viejo solo si alguien lo pide.
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const historyId = React.useId();

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

  // ── Generar período siguiente (forzar el ciclo diario del backend) ───────
  const [processOpen, setProcessOpen] = React.useState(false);
  const [processBusy, setProcessBusy] = React.useState(false);
  const [processError, setProcessError] = React.useState('');

  const submitProcess = async () => {
    if (processBusy) return;
    setProcessBusy(true);
    setProcessError('');
    try {
      const updated = await api.processGymSubscription(subscriptionId);
      const before = (data?.periods || []).length;
      const after = (updated?.periods || []).length;
      setData(updated);
      if (Number(updated?.status) === GYM_SUBSCRIPTION_STATUS.CANCELLED) {
        toast({ tone: 'neutral', title: 'Suscripción cancelada por no pago' });
      } else if (after > before) {
        toast({ tone: 'success', title: after - before === 1 ? 'Período siguiente generado' : `${after - before} períodos generados` });
      } else {
        toast({ tone: 'neutral', title: 'No había nada que generar' });
      }
      setProcessOpen(false);
    } catch (e) {
      setProcessError(e?.message || 'No se pudo generar el período.');
    } finally {
      setProcessBusy(false);
    }
  };

  // ── Mover el inicio del período vigente ──────────────────────────────────
  const [startTarget, setStartTarget] = React.useState(null);
  const [startValue, setStartValue] = React.useState('');
  const [startBusy, setStartBusy] = React.useState(false);
  const [startError, setStartError] = React.useState('');

  const openStart = (period) => {
    setStartTarget(period);
    setStartValue(period.start_date);
    setStartError('');
  };

  const submitStart = async () => {
    if (startBusy || !startTarget || !startValue) return;
    setStartBusy(true);
    setStartError('');
    try {
      const updated = await api.updateGymPeriodStartDate(subscriptionId, startTarget.id, startValue);
      setData(updated);
      toast({ tone: 'success', title: 'Inicio del período actualizado' });
      setStartTarget(null);
    } catch (e) {
      setStartError(e?.message || 'No se pudo mover el inicio del período.');
    } finally {
      setStartBusy(false);
    }
  };

  // ── Cancelar el período vigente (y con él la suscripción) ────────────────
  const [cancelPeriodTarget, setCancelPeriodTarget] = React.useState(null);
  const [cancelPeriodAnnul, setCancelPeriodAnnul] = React.useState(false);
  const [cancelPeriodBusy, setCancelPeriodBusy] = React.useState(false);
  const [cancelPeriodError, setCancelPeriodError] = React.useState('');

  const openCancelPeriod = (period) => {
    setCancelPeriodTarget(period);
    setCancelPeriodAnnul(false);
    setCancelPeriodError('');
  };

  const submitCancelPeriod = async (reason) => {
    if (cancelPeriodBusy || !cancelPeriodTarget) return;
    setCancelPeriodBusy(true);
    setCancelPeriodError('');
    try {
      const updated = await api.cancelGymPeriod(subscriptionId, cancelPeriodTarget.id, { reason, annulPayments: cancelPeriodAnnul });
      setData(updated);
      toast({ tone: 'neutral', title: cancelPeriodAnnul ? 'Período cancelado y pagos anulados' : 'Período cancelado' });
      setCancelPeriodTarget(null);
    } catch (e) {
      setCancelPeriodError(e?.message || 'No se pudo cancelar el período.');
    } finally {
      setCancelPeriodBusy(false);
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

  // `current_period` viaja como resumen (sin pagos): el período completo, con sus abonos, está
  // en la lista. Lo que no es el vigente es historial, y ahí abajo va plegado.
  const periodsDesc = data.periods || [];
  // La tarjeta destacada es el período en curso; con la suscripción cancelada, el último que
  // existió —aunque sea el que el corte canceló—, porque es el que cuenta cómo terminó.
  const currentFull = (isActive
    ? periodsDesc.find((p) => p.id === currentPeriod?.id)
    : periodsDesc[0]) || null;
  const pastPeriods = periodsDesc.filter((p) => p.id !== currentFull?.id);
  const currentPending = currentFull && Number(currentFull.status) !== GYM_PERIOD_STATUS.CANCELLED
    ? gymPendingBalance(currentFull)
    : 0;
  // Lo que se debe de períodos ya pasados: el abono cae ahí primero, así que el recordatorio del
  // período en curso lo nombra en vez de esconderlo dentro del historial.
  const olderPending = Math.max(0, pendingTotal - currentPending);

  // `current_period` es el último no cancelado: si ya venció, el siguiente no existe todavía,
  // es decir, la corrida diaria del backend no ha pasado por esta suscripción. Forzarla genera
  // el período siguiente… o aplica el corte, si el vigente agotó su gracia sin ningún abono.
  const today = todayIso();
  const nextPending = isActive && !!currentPeriod && currentPeriod.end_date < today;
  const wouldCancel = nextPending && currentUnpaid && currentPeriod.grace_ends_at < today;
  const canProcess = nextPending && can('gym-subscriptions-create');
  const openProcess = () => { setProcessError(''); setProcessOpen(true); };

  // Solo el período vigente (el último no cancelado, vivo) admite mover su inicio: los
  // anteriores ya tienen el siguiente encadenado. El anterior marca el mínimo permitido.
  const canMoveStart = (p) => isActive && can('gym-subscriptions-create')
    && p.id === currentPeriod?.id
    && [GYM_PERIOD_STATUS.CURRENT, GYM_PERIOD_STATUS.GRACE].includes(Number(p.status));
  const previousOf = (p) => periodsAsc.filter((q) => q.number < p.number && Number(q.status) !== GYM_PERIOD_STATUS.CANCELLED).slice(-1)[0];
  const startMin = startTarget && previousOf(startTarget) ? addDaysIso(previousOf(startTarget).end_date, 1) : undefined;

  // El mismo período vigente admite cancelarse (con la suscripción). Sus pagos activos se
  // pueden anular en el mismo paso solo con `gym-payments-annul`, porque cancela facturas.
  const isLiveLatest = (p) => isActive && p.id === currentPeriod?.id
    && [GYM_PERIOD_STATUS.CURRENT, GYM_PERIOD_STATUS.GRACE].includes(Number(p.status));
  const canCancelPeriod = (p) => isLiveLatest(p) && can('gym-subscriptions-cancel');
  const activePaymentsOf = (p) => (p?.payments || []).filter((pay) => Number(pay.status) === 1);
  const invoicedPaymentsOf = (p) => activePaymentsOf(p).filter((pay) => pay.registers_income !== false);
  const canAnnulPayments = can('gym-payments-annul');

  // Anular un pago es la excepción, no la acción de cada fila: vive en el menú ⋮ del período,
  // un ítem por pago activo (nombrado por su valor y fecha cuando hay más de uno).
  const annulItems = (p) => {
    if (!canAnnulPayments) return [];
    const active = activePaymentsOf(p);
    return active.map((pay) => ({
      label: active.length === 1 ? 'Anular pago' : `Anular pago de ${gymMoney(pay.value)} (${formatShortDate(pay.payment_date)})`,
      icon: 'fas fa-rotate-left', variant: 'danger', onClick: () => setAnnulTarget(pay),
    }));
  };
  const periodMenu = (p) => [
    ...(canMoveStart(p) ? [{ label: 'Mover inicio', icon: 'fas fa-calendar-day', onClick: () => openStart(p) }] : []),
    ...annulItems(p),
    ...(canCancelPeriod(p) ? [{ label: 'Cancelar período', icon: 'fas fa-ban', variant: 'danger', onClick: () => openCancelPeriod(p) }] : []),
  ];

  // Título del período: su número y el rango de fechas, que es lo que lo identifica.
  const periodTitle = (p) => `Período ${p.number} · ${formatStayRangeShort(p.start_date, p.end_date)}`;
  const periodPending = (p) => (Number(p.status) === GYM_PERIOD_STATUS.CANCELLED ? 0 : gymPendingBalance(p));
  // Línea de resumen del período pasado, plegado: su estado y en qué quedó el dinero.
  const periodSummary = (p) => {
    const meta = gymPeriodStatusMeta(Number(p.computed_status ?? p.status));
    const pending = periodPending(p);
    if (pending > 0) return `${meta.label} · saldo ${gymMoney(pending)}`;
    if (Number(p.paid_total || 0) > 0) return `${meta.label} · pagado ${gymMoney(p.paid_total)}`;
    return `${meta.label} · sin pagos`;
  };

  // Con una activa cuyo período está en gracia, el badge lo advierte; si no, manda el estado
  // de la suscripción.
  const headerMeta = currentInGrace
    ? gymPeriodStatusMeta(GYM_PERIOD_STATUS.GRACE)
    : gymSubscriptionStatusMeta(status);
  const currentMeta = currentFull
    ? gymPeriodStatusMeta(Number(currentFull.computed_status ?? currentFull.status))
    : null;

  return (
    <div className={s.page}>
      <PageHeader
        onBack={goBack}
        title={data.member_name}
        onTitleClick={() => navigate(`/gym/members/${data.gym_member_id}`)}
        subtitle={data.plan_name}
        menu={isActive ? [
          ...(pendingTotal > 0 ? [{ label: 'Registrar pago', icon: 'fas fa-dollar-sign', onClick: openPay }] : []),
          ...(canProcess ? [{ label: 'Generar período siguiente', icon: 'fas fa-calendar-plus', onClick: openProcess }] : []),
          {
            label: 'Cancelar suscripción', icon: 'fas fa-ban', variant: 'danger',
            onClick: () => (currentPeriod && canCancelPeriod(currentPeriod) ? openCancelPeriod(currentPeriod) : setCancelOpen(true)),
          },
        ] : []}
        meta={[
          { label: 'Suscrito desde', value: formatShortDate(data.subscribed_at) },
          { label: 'Estado', value: <Badge variant={headerMeta.variant}>{headerMeta.label}</Badge> },
          {
            label: 'Pago',
            value: pendingTotal > 0
              ? <Badge variant="warning">Saldo {gymMoney(pendingTotal)}</Badge>
              : <Badge variant="success">Al día</Badge>,
          },
        ]}
        note={status === GYM_SUBSCRIPTION_STATUS.CANCELLED && data.cancellation_reason
          ? `Cancelada${data.cancelled_automatically ? ' automáticamente' : ''}: ${data.cancellation_reason}`
          : undefined}
      />

      {/* Falta el período siguiente: no es un recordatorio de cobro, es trabajo del sistema que
          no ha corrido, así que se queda arriba, fuera de la tarjeta del período. */}
      {nextPending && (
        <Alert tone={wouldCancel ? 'danger' : 'warning'}
          title={wouldCancel ? 'Período vencido sin pago' : 'Período siguiente sin generar'}
          action={canProcess && (
            <Button variant={wouldCancel ? 'secondary' : 'primary'} size="sm" icon="fas fa-calendar-plus" onClick={openProcess}>
              Generar período
            </Button>
          )}>
          El período {currentPeriod.number} venció el {formatShortDate(currentPeriod.end_date)} y el
          sistema aún no generó el siguiente: lo hace en su corrida diaria, o se puede generar ahora.{' '}
          {wouldCancel && (
            <>Ojo: agotó la gracia el {formatShortDate(currentPeriod.grace_ends_at)} sin ningún abono,
              así que al procesarla la suscripción se cancelará por no pago.</>
          )}
        </Alert>
      )}

      {/* ── El período en curso: lo que está pasando hoy ── */}
      {currentFull && (
        <section className={g.section}>
          <h2 className={g.sectionTitle}>{isActive ? 'Período en curso' : 'Último período'}</h2>
          <Panel
            title={periodTitle(currentFull)}
            action={(
              <span className={g.periodActions}>
                {currentMeta && <Badge variant={currentMeta.variant}>{currentMeta.label}</Badge>}
                {periodMenu(currentFull).length > 0 && (
                  <Dropdown
                    trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Acciones del período" />}
                    items={periodMenu(currentFull)} />
                )}
              </span>
            )}>
            {/* El recordatorio de cobro: el color va en la línea, no en el fondo — salta a la
                vista dentro de la tarjeta sin convertirla en un aviso de pantalla. */}
            {isActive && pendingTotal > 0 && (
              <Alert variant="outline" tone={currentInGrace ? 'danger' : 'warning'}
                title={currentInGrace ? 'Pago vencido' : 'Pendiente de pago'}
                action={(
                  <Button variant="outline-success" dashed size="sm" icon="fas fa-dollar-sign" onClick={openPay}>
                    Registrar pago
                  </Button>
                )}>
                {currentPending <= 0 ? (
                  <>Este período está pagado, pero quedan {gymMoney(olderPending)} de períodos
                    anteriores: el abono se aplica ahí primero.</>
                ) : currentInGrace ? (
                  currentUnpaid ? (
                    <>El período venció el {formatShortDate(currentFull.end_date)} sin ningún abono:
                      si no se registra el pago antes del {formatShortDate(currentFull.grace_ends_at)},
                      la suscripción se cancelará automáticamente.</>
                  ) : (
                    <>El período venció el {formatShortDate(currentFull.end_date)} con un saldo de{' '}
                      {gymMoney(currentPending)}; el acceso termina el{' '}
                      {formatShortDate(currentFull.grace_ends_at)}.</>
                  )
                ) : (
                  <>Falta por cobrar {gymMoney(currentPending)} de este período, que vence el{' '}
                    {formatShortDate(currentFull.end_date)}.</>
                )}
                {currentPending > 0 && olderPending > 0 && (
                  <> Además hay {gymMoney(olderPending)} de períodos anteriores, y el abono se
                    aplica ahí primero.</>
                )}
              </Alert>
            )}
            {/* La pregunta del período en curso es "¿ya pagó?": el badge del total la responde.
                El saldo solo se repite aquí si arriba no hay recordatorio que ya lo diga. */}
            <PeriodPayments period={currentFull} badge={currentPending > 0
              ? (isActive && pendingTotal > 0 ? null : <Badge variant="warning">Pendiente {gymMoney(currentPending)}</Badge>)
              : (Number(currentFull.paid_total || 0) > 0 ? <Badge variant="success">Pagado</Badge> : null)} />
          </Panel>
        </section>
      )}

      {/* ── Historial: los períodos anteriores, plegados y en letra menor ── */}
      {pastPeriods.length > 0 && (
        <section className={[g.section, g.history, historyOpen ? g.historyOpen : ''].filter(Boolean).join(' ')}>
          <button type="button" className={g.historyHead} onClick={() => setHistoryOpen((o) => !o)}
            aria-expanded={historyOpen} aria-controls={historyId}>
            <span className={g.sectionTitle}>Historial</span>
            <span className={g.historyCount}>
              {pastPeriods.length === 1 ? '1 período anterior' : `${pastPeriods.length} períodos anteriores`}
            </span>
            <i className={`fas fa-chevron-down ${g.historyChev}`} aria-hidden="true" />
          </button>
          <div id={historyId} className={g.historyBody} aria-hidden={!historyOpen}>
            <div className={g.historyInner}>
              {pastPeriods.map((p) => (
                <InfoCard key={p.id} title={periodTitle(p)} description={periodSummary(p)}
                  actions={periodMenu(p)}>
                  <PeriodPayments period={p} badge={periodPending(p) > 0
                    ? <Badge variant="warning">Pendiente {gymMoney(periodPending(p))}</Badge>
                    : null} />
                </InfoCard>
              ))}
            </div>
          </div>
        </section>
      )}

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

      <Modal open={!!startTarget} title="Mover el inicio del período" onClose={() => setStartTarget(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setStartTarget(null)}>Cancelar</Button>
          <Button variant="primary" loading={startBusy} disabled={!startValue || startValue === startTarget?.start_date} onClick={submitStart}>Guardar</Button>
        </>}>
        <div className={s.formCol}>
          <p className={s.faint}>
            Para el afiliado que volvió días después de que arrancara su período: el ciclo empieza
            cuando de verdad regresó. El vencimiento y el fin de gracia se recalculan con la duración
            del período ({startTarget?.duration_months
              ? `${startTarget.duration_months} ${startTarget.duration_months === 1 ? 'mes' : 'meses'} de calendario`
              : `${startTarget?.duration_days} días`}); los pagos no cambian.
          </p>
          <DatePicker label="Nuevo inicio" value={startValue} min={startMin}
            onChange={(iso) => setStartValue(iso)} />
          {startMin && (
            <p className={s.faint}>No puede solaparse con el período anterior: el mínimo es el {formatShortDate(startMin)}.</p>
          )}
          {startError && <Alert tone="danger" onClose={() => setStartError('')}>{startError}</Alert>}
        </div>
      </Modal>

      <ConfirmDialog open={!!cancelPeriodTarget} title={`Cancelar el período ${cancelPeriodTarget?.number ?? ''}`}
        reason="required" reasonLabel="Motivo de la cancelación" confirmLabel="Sí, cancelar el período"
        loading={cancelPeriodBusy} error={cancelPeriodError}
        onConfirm={submitCancelPeriod} onClose={() => setCancelPeriodTarget(null)}>
        <p>
          Esta acción es irreversible. Se cancela el período{' '}
          {cancelPeriodTarget ? `${cancelPeriodTarget.number} (${formatStayRangeShort(cancelPeriodTarget.start_date, cancelPeriodTarget.end_date)})` : ''}{' '}
          y, con él, <strong>la suscripción completa</strong>: el afiliado pierde el acceso y para volver
          habrá que suscribirlo de nuevo.
        </p>
        {activePaymentsOf(cancelPeriodTarget).length > 0 && (
          canAnnulPayments ? (
            <>
              <Checkbox
                label={`Anular también los pagos de este período (${activePaymentsOf(cancelPeriodTarget).length === 1 ? '1 pago' : `${activePaymentsOf(cancelPeriodTarget).length} pagos`}, ${invoicedPaymentsOf(cancelPeriodTarget).length} con factura)`}
                checked={cancelPeriodAnnul}
                onChange={(e) => setCancelPeriodAnnul(e.target.checked)} />
              <p className={s.faint}>
                {cancelPeriodAnnul
                  ? 'Cada pago queda anulado y su factura cancelada en la caja: el dinero deja de contar como ingreso.'
                  : 'Los pagos y sus facturas quedan como están: el cobro sigue contando como ingreso.'}
              </p>
            </>
          ) : (
            <p className={s.faint}>
              Este período tiene {invoicedPaymentsOf(cancelPeriodTarget).length === 1 ? 'un pago facturado' : `${invoicedPaymentsOf(cancelPeriodTarget).length} pagos facturados`} que
              quedarán como están: anularlos requiere el permiso de anular pagos.
            </p>
          )
        )}
      </ConfirmDialog>

      <ConfirmDialog open={processOpen} title="Generar período siguiente"
        variant={wouldCancel ? 'danger' : 'primary'} icon={wouldCancel ? 'fas fa-ban' : 'fas fa-calendar-plus'}
        confirmLabel={wouldCancel ? 'Procesar de todos modos' : 'Generar'}
        loading={processBusy} error={processError}
        onConfirm={submitProcess} onClose={() => setProcessOpen(false)}>
        {wouldCancel ? (
          <>El período {currentPeriod?.number} agotó su gracia sin ningún abono: al procesarla, la
            suscripción se cancelará por no pago y el afiliado perderá el acceso. Si en realidad
            pagó, registra primero ese pago con su fecha real y vuelve aquí.</>
        ) : (
          <>Se creará el período {currentPeriod ? currentPeriod.number + 1 : ''} desde el{' '}
            {currentPeriod ? formatShortDate(addDaysIso(currentPeriod.end_date, 1)) : ''} con el precio
            actual del plan, pendiente de pago. Es exactamente lo que hace el sistema en su corrida
            diaria; si hay varios ciclos atrasados, los genera todos hasta cubrir hoy.</>
        )}
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

/**
 * Los abonos de un período y su total, tal como se ven dentro de la tarjeta del período: filas
 * apiladas (móvil primero, sin tabla) y el total al pie.
 *
 * `badge` es el nodo que acompaña al total —«Pagado» o el saldo pendiente— y lo decide quien
 * pinta la tarjeta: el período en curso omite el saldo cuando arriba ya está el recordatorio de
 * cobro, porque la misma deuda dicha dos veces en la misma tarjeta se lee como si fueran dos.
 */
function PeriodPayments({ period, badge = null }) {
  const payments = period.payments || [];
  return (
    <>
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
                {annulled && <Badge variant="neutral">Anulado</Badge>}
              </li>
            );
          })}
        </ul>
      )}
      <div className={g.payTotal}>
        <span>Total pagado</span>
        <span className={g.payTotalRight}>
          <strong>{gymMoney(period.paid_total)}</strong>
          {badge}
        </span>
      </div>
    </>
  );
}

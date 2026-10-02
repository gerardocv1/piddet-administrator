import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Panel, Badge, Button, IconButton, Dropdown, Spinner, Alert, Select, MoneyInput, DatePicker, Checkbox,
  Modal, ConfirmDialog, InfoCard, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import {
  gymMoney, gymSubscriptionStatusMeta, gymPeriodStatusMeta, gymPendingBalance,
  gymSubscriptionPending, gymPlanDurationLabel, GYM_SUBSCRIPTION_STATUS, GYM_PERIOD_STATUS,
} from '../lib/gymLabels.js';
import { formatShortDate, formatStayRangeShort, todayIso, addDaysIso } from '../lib/dates.js';
import { useSetPageTitle, useSetPageBack } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import g from './GymSubscriptionDetail.module.css';

// Detalle de LA suscripción continua del afiliado. Una sola tarjeta cuenta lo vigente, de
// arriba abajo: el plan y desde cuándo (con las acciones secundarias en el ⋮), el período EN
// CURSO con sus datos y —si debe— el recordatorio de cobro, y al pie las acciones primarias
// (cobrar, generar el período que falta). Debajo, aparte y en letra menor, el historial: los
// períodos anteriores, cada uno plegado y desplegable. El afiliado da nombre a la pantalla en
// la barra superior.
// No hay "renovar": el período siguiente aparece automáticamente con la corrida diaria del
// backend; si uno agota su gracia sin ningún abono, la suscripción entera se cancela sola.
// Cuando esa corrida no ha pasado (el período vigente ya venció y no existe el siguiente), el
// operador puede forzar el mismo ciclo desde aquí con "Generar período".
// Lo que sí hay es "Cambiar de plan": el afiliado que termina su trimestre y sigue con el
// mensual (o paga el siguiente por adelantado). El backend lo aplica al primer período sin
// pagos —el vigente si no tiene abonos, o el siguiente, que se crea en ese momento— y admite el
// pago en la misma llamada. Si el período creado empieza después de hoy, la tarjeta lo muestra
// aparte como "Próximo período", debajo del que todavía corre.
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

  // Los planes activos, para el selector de "Cambiar de plan".
  const { data: plansPage } = useResource(React.useCallback(() => api.gymPlans({ status: '1', perPage: 100 }), []), { items: [] }, []);
  const planOptions = React.useMemo(
    () => (plansPage.items || []).map((p) => ({ value: String(p.id), label: `${p.name} · ${gymMoney(p.price)}` })),
    [plansPage],
  );

  // La tarjeta habla del plan, así que el afiliado da nombre a la pantalla desde la barra
  // superior; en el teléfono, solo su nombre de pila.
  const memberName = data?.member_name ? String(data.member_name).trim() : '';
  useSetPageTitle(memberName || 'Suscripción', { shortTitle: memberName ? memberName.split(/\s+/)[0] : null });

  const goBack = () => navigate(`/gym/subscriptions${params.toString() ? `?${params.toString()}` : ''}`);
  useSetPageBack(goBack);

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

  // ── Cambiar de plan (con pago opcional del período que lo recibe) ────────
  const emptyPlanForm = { plan_id: '', pay: false, payment_method: '', value: '', payment_date: '', notes: '', registers_income: true };
  const [planOpen, setPlanOpen] = React.useState(false);
  const [planForm, setPlanForm] = React.useState(emptyPlanForm);
  const [planBusy, setPlanBusy] = React.useState(false);
  const [planError, setPlanError] = React.useState('');
  const selectedPlan = (plansPage.items || []).find((p) => String(p.id) === planForm.plan_id) || null;

  const openPlan = () => {
    setPlanForm(emptyPlanForm);
    setPlanError('');
    setPlanOpen(true);
  };
  // El precio del plan precarga el valor del pago; el operador lo ajusta si cobra menos.
  const pickPlan = (planId) => {
    const plan = (plansPage.items || []).find((p) => String(p.id) === planId);
    setPlanForm((f) => ({ ...f, plan_id: planId, value: plan ? plan.price : f.value }));
  };

  const submitPlan = async () => {
    if (planBusy || !planForm.plan_id) return;
    if (planForm.pay && (!planForm.payment_method || !planForm.value)) return;
    setPlanBusy(true);
    setPlanError('');
    try {
      const updated = await api.changeGymSubscriptionPlan(subscriptionId, {
        plan_id: Number(planForm.plan_id),
        payment: planForm.pay ? {
          payment_method: planForm.payment_method,
          value: planForm.value,
          payment_date: planForm.payment_date || undefined,
          notes: planForm.notes.trim() || undefined,
          registers_income: planForm.registers_income,
        } : undefined,
      });
      const before = (data?.periods || []).length;
      const after = (updated?.periods || []).length;
      setData(updated);
      toast({
        tone: 'success',
        title: after > before
          ? `Período ${updated.current_period?.number ?? ''} creado: ${updated.plan_name}`
          : `Período ${updated.current_period?.number ?? ''} cambiado a ${updated.plan_name}`,
      });
      setPlanOpen(false);
    } catch (e) {
      setPlanError(e?.message || 'No se pudo cambiar el plan.');
    } finally {
      setPlanBusy(false);
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
  const today = todayIso();
  // El último período no cancelado. Si empieza después de hoy (se creó por adelantado al
  // cambiar de plan), es el "próximo": el que corre de verdad es el anterior.
  const latestFull = (isActive ? periodsDesc.find((p) => p.id === currentPeriod?.id) : null) || null;
  const runningBeforeLatest = latestFull
    ? periodsDesc.find((p) => p.number < latestFull.number && Number(p.status) !== GYM_PERIOD_STATUS.CANCELLED) || null
    : null;
  const upcoming = latestFull && latestFull.start_date > today && runningBeforeLatest ? latestFull : null;
  // La tarjeta destacada es el período en curso; con la suscripción cancelada, el último que
  // existió —aunque sea el que el corte canceló—, porque es el que cuenta cómo terminó.
  const currentFull = (isActive
    ? (upcoming ? runningBeforeLatest : latestFull)
    : periodsDesc[0]) || null;
  const pastPeriods = periodsDesc.filter((p) => p.id !== currentFull?.id && p.id !== upcoming?.id);
  const currentPending = currentFull && Number(currentFull.status) !== GYM_PERIOD_STATUS.CANCELLED
    ? gymPendingBalance(currentFull)
    : 0;
  const upcomingPending = upcoming ? gymPendingBalance(upcoming) : 0;
  // Lo que se debe de períodos ya pasados: el abono cae ahí primero, así que el recordatorio del
  // período en curso lo nombra en vez de esconderlo dentro del historial.
  const olderPending = Math.max(0, pendingTotal - currentPending - upcomingPending);

  // `current_period` es el último no cancelado: si ya venció, el siguiente no existe todavía,
  // es decir, la corrida diaria del backend no ha pasado por esta suscripción. Forzarla genera
  // el período siguiente… o aplica el corte, si el vigente agotó su gracia sin ningún abono.
  const nextPending = isActive && !!currentPeriod && currentPeriod.end_date < today;
  const wouldCancel = nextPending && currentUnpaid && currentPeriod.grace_ends_at < today;
  const canProcess = nextPending && can('gym-subscriptions-create');
  const openProcess = () => { setProcessError(''); setProcessOpen(true); };

  // Cambiar de plan: el backend lo aplica al primer período sin pagos. Se calcula aquí solo para
  // contarle al operador, antes de confirmar, a qué período le va a caer.
  const canChangePlan = isActive && !!latestFull && can('gym-subscriptions-create');
  const planReplacesLatest = !!latestFull && Number(latestFull.paid_total || 0) === 0
    && [GYM_PERIOD_STATUS.CURRENT, GYM_PERIOD_STATUS.GRACE].includes(Number(latestFull.status));

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
  const currentPayments = currentFull?.payments || [];

  // Lo secundario, en el ⋮ de la tarjeta: ir al afiliado, lo que admite el período vigente
  // (mover el inicio, anular un pago) y cancelar. Cancelar la suscripción pasa por cancelar su
  // período vivo cuando lo hay: es el mismo corte, con la opción de anular los pagos.
  const secondaryMenu = [
    { label: 'Ver afiliado', icon: 'fas fa-user', onClick: () => navigate(`/gym/members/${data.gym_member_id}`) },
    ...(currentFull ? periodMenu(currentFull).filter((item) => item.label !== 'Cancelar período') : []),
    ...(isActive ? [{
      label: 'Cancelar suscripción', icon: 'fas fa-ban', variant: 'danger',
      onClick: () => (currentFull && canCancelPeriod(currentFull) ? openCancelPeriod(currentFull) : setCancelOpen(true)),
    }] : []),
  ];

  // Lo primario, al pie de la tarjeta: cobrar lo que se debe y, si el sistema no ha corrido,
  // generar el período que falta. Sin nada que hacer, el pie no existe.
  const primaryActions = [
    ...(isActive && pendingTotal > 0
      ? [<Button key="pay" variant="primary" icon="fas fa-dollar-sign" onClick={openPay}>Registrar pago</Button>]
      : []),
    ...(canProcess
      ? [<Button key="process" variant={wouldCancel || pendingTotal > 0 ? 'secondary' : 'primary'} icon="fas fa-calendar-plus" onClick={openProcess}>Generar período</Button>]
      : []),
    ...(canChangePlan
      ? [<Button key="plan" variant="secondary" icon="fas fa-arrow-right-arrow-left" onClick={openPlan}>Cambiar de plan</Button>]
      : []),
  ];

  return (
    <div className={s.page}>
      <Panel className={g.sub}>
        {/* ── El plan y desde cuándo; a la derecha, el estado y lo secundario ── */}
        <div className={g.subHead}>
          <div className={g.subText}>
            <h3 className={g.subPlan}>{data.plan_name}</h3>
            <p className={g.subSince}>Suscrito desde {formatShortDate(data.subscribed_at)}</p>
          </div>
          <span className={g.periodActions}>
            <Badge variant={headerMeta.variant}>{headerMeta.label}</Badge>
            {secondaryMenu.length > 0 && (
              <Dropdown items={secondaryMenu} width={230}
                trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Más acciones" />} />
            )}
          </span>
        </div>
        {status === GYM_SUBSCRIPTION_STATUS.CANCELLED && data.cancellation_reason && (
          <p className={g.subNote}>
            Cancelada{data.cancelled_automatically ? ' automáticamente' : ''}: {data.cancellation_reason}
          </p>
        )}

        {/* ── El período en curso: fechas, estado, dinero ── */}
        <div className={g.period}>
          {currentFull ? (
            <>
              <div className={g.periodHead}>
                <span className={g.periodEyebrow}>{isActive ? 'Período en curso' : 'Último período'}</span>
                <div className={g.periodTitleRow}>
                  <h4 className={g.periodTitle}>{periodTitle(currentFull)}</h4>
                  {currentMeta && <Badge variant={currentMeta.variant}>{currentMeta.label}</Badge>}
                </div>
              </div>
              <dl className={g.rows}>
                <div className={g.row}>
                  <dt>{currentFull.end_date < today ? 'Venció' : 'Vence'}</dt>
                  <dd>
                    {formatShortDate(currentFull.end_date)}
                    {currentInGrace && <span className={g.rowHint}> · gracia hasta el {formatShortDate(currentFull.grace_ends_at)}</span>}
                  </dd>
                </div>
                {/* El plan del período solo cuando no es el de la suscripción: pasa cuando el
                    afiliado cambió de plan y el ciclo viejo todavía corre. */}
                {currentFull.plan_name && currentFull.plan_name !== data.plan_name && (
                  <div className={g.row}>
                    <dt>Plan</dt>
                    <dd>{currentFull.plan_name}</dd>
                  </div>
                )}
                <div className={g.row}>
                  <dt>Valor</dt>
                  <dd>{gymMoney(currentFull.price)}</dd>
                </div>
                <PaymentRows payments={currentPayments} />
                <div className={g.row}>
                  <dt>Saldo</dt>
                  <dd>
                    {currentPending > 0
                      ? <Badge variant="warning">{gymMoney(currentPending)}</Badge>
                      : (Number(currentFull.status) === GYM_PERIOD_STATUS.CANCELLED
                        ? <Badge variant="neutral">Cancelado</Badge>
                        : <Badge variant="success">Al día</Badge>)}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className={s.faint}>Esta suscripción todavía no tiene períodos.</p>
          )}

          {/* Falta el período siguiente: no es un cobro, es trabajo del sistema que no ha corrido.
              La acción está al pie; aquí solo se explica. */}
          {nextPending && (
            <Alert tone={wouldCancel ? 'danger' : 'info'}
              title={wouldCancel ? 'Período vencido sin pago' : 'Período siguiente sin generar'}>
              El sistema aún no generó el período {currentPeriod.number + 1}: lo hace en su corrida
              diaria, o se puede generar ahora.{' '}
              {wouldCancel && (
                <>Ojo: este agotó la gracia el {formatShortDate(currentPeriod.grace_ends_at)} sin
                  ningún abono, así que al procesarla la suscripción se cancelará por no pago.</>
              )}
            </Alert>
          )}

          {/* El recordatorio de cobro: el color va en la línea, no en el fondo — salta a la
              vista dentro de la tarjeta sin convertirla en un aviso de pantalla. */}
          {isActive && pendingTotal > 0 && currentFull && (
            <Alert variant="outline" tone={currentInGrace ? 'danger' : 'warning'}
              title={currentInGrace ? 'Pago vencido' : 'Pendiente de pago'}>
              {currentPending <= 0 && olderPending > 0 ? (
                <>Este período está pagado, pero quedan {gymMoney(olderPending)} de períodos
                  anteriores: el abono se aplica ahí primero.</>
              ) : currentPending <= 0 ? (
                <>Este período está pagado; el próximo (período {upcoming?.number}, desde el{' '}
                  {upcoming ? formatShortDate(upcoming.start_date) : ''}) tiene un saldo de{' '}
                  {gymMoney(upcomingPending)}.</>
              ) : currentInGrace ? (
                currentUnpaid ? (
                  <>El período venció sin ningún abono: si no se registra el pago antes del{' '}
                    {formatShortDate(currentFull.grace_ends_at)}, la suscripción se cancelará
                    automáticamente.</>
                ) : (
                  <>El período venció con un saldo de {gymMoney(currentPending)}; el acceso termina
                    el {formatShortDate(currentFull.grace_ends_at)}.</>
                )
              ) : (
                <>Falta por cobrar {gymMoney(currentPending)} de este período antes del{' '}
                  {formatShortDate(currentFull.end_date)}.</>
              )}
              {currentPending > 0 && olderPending > 0 && (
                <> Además hay {gymMoney(olderPending)} de períodos anteriores, y el abono se
                  aplica ahí primero.</>
              )}
            </Alert>
          )}
        </div>

        {/* ── El próximo período, cuando ya existe antes de empezar (cambio de plan o pago por
            adelantado): su plan, desde cuándo y en qué va el dinero. Es el último vivo, así que
            sus acciones (mover inicio, cancelar) van en su propio ⋮. ── */}
        {upcoming && (
          <div className={g.period}>
            <div className={g.periodHead}>
              <span className={g.periodEyebrow}>Próximo período</span>
              <div className={g.periodTitleRow}>
                <h4 className={g.periodTitle}>{periodTitle(upcoming)}</h4>
                <span className={g.periodActions}>
                  {upcomingPending > 0
                    ? <Badge variant="warning">Saldo {gymMoney(upcomingPending)}</Badge>
                    : <Badge variant="success">Pagado</Badge>}
                  {periodMenu(upcoming).length > 0 && (
                    <Dropdown items={periodMenu(upcoming)} width={230}
                      trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Acciones del período" />} />
                  )}
                </span>
              </div>
            </div>
            <dl className={g.rows}>
              <div className={g.row}>
                <dt>Plan</dt>
                <dd>{upcoming.plan_name}</dd>
              </div>
              <div className={g.row}>
                <dt>Empieza</dt>
                <dd>{formatShortDate(upcoming.start_date)}<span className={g.rowHint}> · vence el {formatShortDate(upcoming.end_date)}</span></dd>
              </div>
              <div className={g.row}>
                <dt>Valor</dt>
                <dd>{gymMoney(upcoming.price)}</dd>
              </div>
              <PaymentRows payments={upcoming.payments || []} />
            </dl>
          </div>
        )}

        {/* ── Las acciones primarias ── */}
        {primaryActions.length > 0 && <div className={g.actions}>{primaryActions}</div>}
      </Panel>

      {/* ── Historial: los períodos anteriores, cada uno plegado ── */}
      {pastPeriods.length > 0 && (
        <section className={g.section}>
          <div className={g.historyHead}>
            <h2 className={g.sectionTitle}>Historial</h2>
            <span className={g.historyCount}>
              {pastPeriods.length === 1 ? '1 período anterior' : `${pastPeriods.length} períodos anteriores`}
            </span>
          </div>
          {pastPeriods.map((p) => (
            <InfoCard key={p.id} title={periodTitle(p)} description={periodSummary(p)}
              actions={periodMenu(p)}>
              <PeriodPayments period={p} badge={periodPending(p) > 0
                ? <Badge variant="warning">Pendiente {gymMoney(periodPending(p))}</Badge>
                : null} />
            </InfoCard>
          ))}
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

      <Modal open={planOpen} title="Cambiar de plan" onClose={() => setPlanOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setPlanOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={planBusy}
            disabled={!planForm.plan_id || (planForm.pay && (!planForm.payment_method || !planForm.value))}
            onClick={submitPlan}>
            {planForm.pay ? 'Cambiar y registrar pago' : 'Cambiar de plan'}
          </Button>
        </>}>
        <div className={s.formCol}>
          <Select label="Plan nuevo" icon="fas fa-id-card" value={planForm.plan_id}
            onChange={(e) => pickPlan(e.target.value)}
            options={[{ value: '', label: planOptions.length ? 'Selecciona…' : 'No hay planes activos' }, ...planOptions]} />
          {latestFull && (
            <p className={s.faint}>
              {planReplacesLatest ? (
                <>El período {latestFull.number} ({formatStayRangeShort(latestFull.start_date, latestFull.end_date)})
                  todavía no tiene pagos, así que es el que cambia: conserva su inicio y el
                  vencimiento, la gracia y el valor se recalculan con el plan nuevo
                  {selectedPlan ? <> ({gymPlanDurationLabel(selectedPlan).toLowerCase()}, {gymMoney(selectedPlan.price)})</> : null}.</>
              ) : (
                <>El período {latestFull.number} ya está cobrado con su plan, así que el nuevo rige desde el
                  período {latestFull.number + 1}: se crea ahora, desde el {formatShortDate(addDaysIso(latestFull.end_date, 1))}
                  {selectedPlan ? <> ({gymPlanDurationLabel(selectedPlan).toLowerCase()}, {gymMoney(selectedPlan.price)})</> : null},
                  sin esperar la corrida diaria.</>
              )}
            </p>
          )}
          {can('gym-payments-create') && (
            <>
              <Checkbox label="Registrar el pago ahora"
                checked={planForm.pay}
                onChange={(e) => setPlanForm((f) => ({ ...f, pay: e.target.checked }))} />
              {planForm.pay && (
                <>
                  <Select label="Método de pago" icon="fas fa-wallet" value={planForm.payment_method}
                    onChange={(e) => setPlanForm((f) => ({ ...f, payment_method: e.target.value }))}
                    options={[{ value: '', label: 'Selecciona…' }, ...methodOptions]} />
                  <MoneyInput label="Valor" icon="fas fa-dollar-sign"
                    value={planForm.value} onChange={(v) => setPlanForm((f) => ({ ...f, value: v }))} />
                  <DatePicker label="Fecha del pago (opcional)" value={planForm.payment_date}
                    onChange={(iso) => setPlanForm((f) => ({ ...f, payment_date: iso }))} />
                  <Checkbox label="Registrar el cobro como ingreso"
                    checked={planForm.registers_income}
                    onChange={(e) => setPlanForm((f) => ({ ...f, registers_income: e.target.checked }))} />
                  <p className={s.faint}>
                    {planForm.registers_income
                      ? 'El pago se aplica al período que recibe el plan nuevo y genera su factura en la fecha indicada.'
                      : 'El pago queda registrado en el período que recibe el plan nuevo, pero sin factura: no entra a la caja.'}
                  </p>
                </>
              )}
            </>
          )}
          {planError && <Alert tone="danger" onClose={() => setPlanError('')}>{planError}</Alert>}
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
 * Los pagos de un período como filas etiqueta · valor de la tarjeta (los del período en curso y
 * los del próximo): cada pago con su fecha y método, o una sola fila "Sin pagos".
 */
function PaymentRows({ payments }) {
  if (payments.length === 0) {
    return (
      <div className={g.row}>
        <dt>Pagos</dt>
        <dd className={s.faint}>Sin pagos</dd>
      </div>
    );
  }
  return payments.map((pay) => {
    const annulled = Number(pay.status) !== 1;
    return (
      <div key={pay.id} className={g.row}>
        <dt>Pago{annulled ? ' anulado' : ''}</dt>
        <dd className={annulled ? g.payAnnulled : ''}>
          {gymMoney(pay.value)}
          <span className={g.rowHint}>
            {' '}· {formatShortDate(pay.payment_date)} · {pay.payment_method_name || '—'}
            {pay.registers_income === false && ' · sin factura'}
          </span>
        </dd>
      </div>
    );
  });
}

/**
 * Los abonos de un período del historial y su total, dentro de su tarjeta desplegable: filas
 * apiladas (móvil primero, sin tabla) y el total al pie. `badge` es el nodo que acompaña al
 * total (el saldo pendiente, si lo hay).
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

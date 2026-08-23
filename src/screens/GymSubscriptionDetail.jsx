import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Card, Badge, Button, IconButton, Dropdown, Spinner, Alert, Select, MoneyInput, DatePicker,
  Modal, ConfirmDialog, PageHeader, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { gymMoney, gymSubscriptionStatusMeta, GYM_SUBSCRIPTION_STATUS } from '../lib/gymLabels.js';
import { formatShortDate } from '../lib/dates.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import g from './GymSubscriptionDetail.module.css';

// Detalle de UNA suscripción, enfocado en lo transaccional: el plan, su vigencia y sus pagos.
// El nombre del afiliado (arriba) navega a su perfil; las acciones de aquí son las de la
// suscripción: registrar pago, anular un pago, renovar y cancelar. Mobile-first: los pagos son
// filas apiladas, no tabla.
export function GymSubscriptionDetail() {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const fetcher = React.useCallback(() => api.gymSubscription(subscriptionId), [subscriptionId]);
  const { data, setData, loading, error } = useResource(fetcher, null, [subscriptionId]);

  const { data: paymentMethods } = useResource(api.paymentMethods, [], []);
  const methodOptions = React.useMemo(
    () => (paymentMethods || []).map((m) => ({ value: m.id, label: m.name })),
    [paymentMethods],
  );
  const { data: plansPage } = useResource(React.useCallback(() => api.gymPlans({ status: '1', perPage: 100 }), []), { items: [] }, []);
  const planOptions = React.useMemo(
    () => (plansPage.items || []).map((p) => ({ value: String(p.id), label: `${p.name} · ${gymMoney(p.price)}` })),
    [plansPage],
  );

  useSetPageTitle(data?.member_name ? `Suscripción · ${data.member_name}` : null);

  const goBack = () => navigate(`/gym/subscriptions${params.toString() ? `?${params.toString()}` : ''}`);

  const status = data ? Number(data.computed_status ?? data.status) : null;
  const isAlive = status === GYM_SUBSCRIPTION_STATUS.ACTIVE || status === GYM_SUBSCRIPTION_STATUS.GRACE;

  // ── Registrar pago ───────────────────────────────────────────────────────
  const emptyPayForm = { payment_method: '', value: '', payment_date: '', notes: '' };
  const [payOpen, setPayOpen] = React.useState(false);
  const [payForm, setPayForm] = React.useState(emptyPayForm);
  const [payBusy, setPayBusy] = React.useState(false);
  const [payError, setPayError] = React.useState('');

  const openPay = () => {
    // Precarga el precio de la suscripción: el caso típico es cobrar la mensualidad completa.
    setPayForm({ ...emptyPayForm, value: data?.price ?? '' });
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

  // ── Renovar (crea una suscripción nueva encadenada y navega a ella) ──────
  // El pago va incluido si se eligió un método ("Sin pago por ahora" = solo renovar).
  const emptyRenewForm = { plan_id: '', payment_method: '', value: '', payment_date: '' };
  const [renewOpen, setRenewOpen] = React.useState(false);
  const [renewForm, setRenewForm] = React.useState(emptyRenewForm);
  const [renewBusy, setRenewBusy] = React.useState(false);
  const [renewError, setRenewError] = React.useState('');

  const openRenew = () => {
    // Preselecciona el mismo plan de esta suscripción (el caso típico es renovar igual).
    const samePlan = (plansPage.items || []).find((p) => p.id === data?.plan_id);
    setRenewForm({
      ...emptyRenewForm,
      plan_id: samePlan ? String(samePlan.id) : '',
      value: samePlan ? samePlan.price : '',
    });
    setRenewError('');
    setRenewOpen(true);
  };

  const pickRenewPlan = (planId) => {
    const plan = (plansPage.items || []).find((p) => String(p.id) === planId);
    setRenewForm((f) => ({ ...f, plan_id: planId, value: plan ? plan.price : f.value }));
  };

  const submitRenew = async () => {
    if (renewBusy || !renewForm.plan_id) return;
    const withPayment = !!renewForm.payment_method;
    if (withPayment && !renewForm.value) {
      setRenewError('Indica el valor del pago, o quita el método para renovar sin cobro.');
      return;
    }
    setRenewBusy(true);
    setRenewError('');
    try {
      const created = await api.createGymSubscription(data.gym_member_id, {
        plan_id: Number(renewForm.plan_id),
        payment: withPayment ? {
          payment_method: renewForm.payment_method,
          value: renewForm.value,
          payment_date: renewForm.payment_date || undefined,
        } : undefined,
      });
      toast({ tone: 'success', title: 'Suscripción renovada' });
      setRenewOpen(false);
      navigate(`/gym/subscriptions/${created.id}`, { replace: true });
    } catch (e) {
      setRenewError(e?.message || 'No se pudo renovar la suscripción.');
    } finally {
      setRenewBusy(false);
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

  const meta = gymSubscriptionStatusMeta(status);
  const payments = data.payments || [];
  const activeTotal = payments
    .filter((p) => Number(p.status) === 1)
    .reduce((sum, p) => sum + Number(p.value || 0), 0);

  return (
    <div className={s.page}>
      <PageHeader
        onBack={goBack}
        subtitle={
          <button type="button" className={g.memberLink}
            onClick={() => navigate(`/gym/members/${data.gym_member_id}`)}>
            {data.member_name} <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
          </button>
        }
        actions={
          <>
            {/* En el teléfono la cabecera se queda con Renovar: registrar el pago ya es la acción
                de la tarjeta de Pagos y cancelar es excepcional, así que va en el menú ⋮. */}
            {isAlive && !isMobile && (
              <Button variant="outline-primary" size="sm" icon="fas fa-dollar-sign" onClick={openPay}>Registrar pago</Button>
            )}
            {isAlive && !isMobile && (
              <Button variant="neutral" size="sm" icon="fas fa-ban" onClick={() => setCancelOpen(true)}>Cancelar</Button>
            )}
            <Button variant="primary" size="sm" icon="fas fa-rotate" onClick={openRenew}>Renovar</Button>
            {isAlive && isMobile && (
              <Dropdown
                trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Más acciones" />}
                items={[
                  { label: 'Registrar pago', icon: 'fas fa-dollar-sign', onClick: openPay },
                  { label: 'Cancelar suscripción', icon: 'fas fa-ban', variant: 'danger', onClick: () => setCancelOpen(true) },
                ]}
              />
            )}
          </>
        }
        meta={[
          { label: 'Plan', value: data.plan_name },
          { label: 'Vigencia', value: `${formatShortDate(data.start_date)} – ${formatShortDate(data.end_date)}` },
          { label: 'Precio', value: gymMoney(data.price) },
          { label: 'Estado', value: <Badge variant={meta.variant} dot>{meta.label}</Badge> },
        ]}
        note={data.cancellation_reason ? `Cancelada: ${data.cancellation_reason}` : undefined}
      />

      {status === GYM_SUBSCRIPTION_STATUS.GRACE && (
        <Alert tone="warning" title="En período de gracia">
          Venció el {formatShortDate(data.end_date)}; el acceso termina el {formatShortDate(data.grace_ends_at)}. Renueva para no interrumpirlo.
        </Alert>
      )}

      <Card>
        <Card.Header title="Pagos"
          action={isAlive
            ? <Button variant="primary" size="sm" icon="fas fa-plus" onClick={openPay}>Registrar pago</Button>
            : undefined} />
        <Card.Body>
          {payments.length === 0 ? (
            <p className={s.faint}>Esta suscripción no tiene pagos registrados.</p>
          ) : (
            <>
              <ul className={g.payList}>
                {payments.map((p) => {
                  const annulled = Number(p.status) !== 1;
                  return (
                    <li key={p.id} className={g.payRow}>
                      <div className={g.payInfo}>
                        <span className={[g.payValue, annulled ? g.payAnnulled : ''].filter(Boolean).join(' ')}>
                          {gymMoney(p.value)}
                        </span>
                        <span className={g.payMeta}>
                          {formatShortDate(p.payment_date)} · {p.payment_method_name || '—'}
                        </span>
                        {annulled && p.annulment_reason && (
                          <span className={g.payReason}>Anulado: {p.annulment_reason}</span>
                        )}
                      </div>
                      {annulled ? (
                        <Badge variant="neutral" dot>Anulado</Badge>
                      ) : (
                        <Button variant="outline-primary" size="sm" onClick={() => setAnnulTarget(p)}>Anular</Button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className={g.payTotal}>
                <span>Total pagado</span>
                <strong>{gymMoney(activeTotal)}</strong>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal open={payOpen} title="Registrar pago" onClose={() => setPayOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={payBusy} disabled={!payForm.payment_method || !payForm.value} onClick={submitPay}>Registrar</Button>
        </>}>
        <div className={s.formCol}>
          <p className={s.muted}>El pago genera su factura en la fecha indicada.</p>
          <Select label="Método de pago" icon="fas fa-wallet" value={payForm.payment_method}
            onChange={(e) => setPayForm((f) => ({ ...f, payment_method: e.target.value }))}
            options={[{ value: '', label: 'Selecciona…' }, ...methodOptions]} />
          <MoneyInput label="Valor" icon="fas fa-dollar-sign"
            value={payForm.value} onChange={(v) => setPayForm((f) => ({ ...f, value: v }))} />
          <DatePicker label="Fecha del pago (opcional)" value={payForm.payment_date}
            onChange={(iso) => setPayForm((f) => ({ ...f, payment_date: iso }))} />
          {payError && <Alert tone="danger" onClose={() => setPayError('')}>{payError}</Alert>}
        </div>
      </Modal>

      <Modal open={renewOpen} title="Renovar suscripción" onClose={() => setRenewOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setRenewOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={renewBusy} disabled={!renewForm.plan_id} onClick={submitRenew}>Renovar</Button>
        </>}>
        <div className={s.formCol}>
          {isAlive && (
            <p className={s.faint}>La nueva vigencia empieza el día siguiente al vencimiento actual ({formatShortDate(data.end_date)}).</p>
          )}
          <Select label="Plan" icon="fas fa-id-card" value={renewForm.plan_id}
            onChange={(e) => pickRenewPlan(e.target.value)}
            options={[{ value: '', label: planOptions.length ? 'Selecciona…' : 'No hay planes activos' }, ...planOptions]} />
          <div className={s.formGrid}>
            <Select label="Método de pago" icon="fas fa-wallet" value={renewForm.payment_method}
              onChange={(e) => setRenewForm((f) => ({ ...f, payment_method: e.target.value }))}
              options={[{ value: '', label: 'Sin pago por ahora' }, ...methodOptions]} />
            <MoneyInput label="Valor" icon="fas fa-dollar-sign"
              value={renewForm.value} onChange={(v) => setRenewForm((f) => ({ ...f, value: v }))} />
          </div>
          <p className={s.faint}>Con método de pago seleccionado, el cobro se registra y factura en la misma operación.</p>
          {renewError && <Alert tone="danger" onClose={() => setRenewError('')}>{renewError}</Alert>}
        </div>
      </Modal>

      <ConfirmDialog open={cancelOpen} title="Cancelar suscripción" reason="required"
        reasonLabel="Motivo de la cancelación" loading={cancelBusy} error={cancelError}
        onConfirm={submitCancel} onClose={() => setCancelOpen(false)}>
        Esta acción es irreversible: el afiliado perderá el acceso vigente. Para que vuelva a tener suscripción habrá que registrar una nueva.
      </ConfirmDialog>

      <ConfirmDialog open={!!annulTarget} title="Anular pago" reason="required"
        reasonLabel="Motivo de la anulación" loading={annulBusy} error={annulError}
        onConfirm={submitAnnul} onClose={() => setAnnulTarget(null)}>
        Esta acción es irreversible: se cancela también la factura de este pago.
      </ConfirmDialog>
    </div>
  );
}

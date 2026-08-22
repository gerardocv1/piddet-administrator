import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Card, DataTable, Badge, Button, Spinner, Alert, Input, Textarea, Switch, Select, MoneyInput,
  DatePicker, Modal, ConfirmDialog, PageHeader, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { gymMemberStatusMeta, GYM_MEMBER_STATUS, gymMoney, gymSubscriptionStatusMeta, gymPaymentStatusMeta, GYM_SUBSCRIPTION_STATUS } from '../lib/gymLabels.js';
import { formatShortDate } from '../lib/dates.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';

const EMPTY_SUBS = [];

// Ficha de un miembro del gimnasio: datos propios del gimnasio (talla, objetivo, notas, estado) y
// su suscripción vigente (plan, vencimiento, pagos). Renovar crea una suscripción nueva encadenada
// a la anterior (nunca se mutan sus fechas); cancelar y anular pago son irreversibles y piden
// motivo. El progreso de medidas físicas se agrega en una fase posterior.
export function GymMemberDetail() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  const fetcher = React.useCallback(() => api.gymMember(memberId), [memberId]);
  const { data, setData, loading, error } = useResource(fetcher, null, [memberId]);

  const subsFetcher = React.useCallback(() => api.gymMemberSubscriptions(memberId), [memberId]);
  const { data: subscriptions, setData: setSubscriptions, reload: reloadSubs } = useResource(subsFetcher, EMPTY_SUBS, [memberId]);
  const current = subscriptions[0] || null;
  const history = subscriptions.slice(1);
  const currentStatus = current ? Number(current.computed_status ?? current.status) : null;
  const currentIsAlive = currentStatus === GYM_SUBSCRIPTION_STATUS.ACTIVE || currentStatus === GYM_SUBSCRIPTION_STATUS.GRACE;

  const { data: plansPage } = useResource(React.useCallback(() => api.gymPlans({ status: '1', perPage: 100 }), []), { items: [] }, []);
  const planOptions = React.useMemo(
    () => (plansPage.items || []).map((p) => ({ value: String(p.id), label: `${p.name} · ${gymMoney(p.price)}` })),
    [plansPage],
  );
  const { data: paymentMethods } = useResource(api.paymentMethods, [], []);
  const methodOptions = React.useMemo(
    () => (paymentMethods || []).map((m) => ({ value: m.id, label: m.name })),
    [paymentMethods],
  );

  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  React.useEffect(() => {
    if (data) {
      setForm({
        height_cm: data.height_cm ?? '',
        goal: data.goal || '',
        health_notes: data.health_notes || '',
        active: Number(data.status) === GYM_MEMBER_STATUS.ACTIVE,
      });
    }
  }, [data]);

  useSetPageTitle(data?.member_name ? `Miembro · ${data.member_name}` : null);

  const goBack = () => navigate(`/gym/members${params.toString() ? `?${params.toString()}` : ''}`);

  // ── Suscripción: alta/renovación ────────────────────────────────────────
  const emptySubscribeForm = { plan_id: '', addPayment: false, payment_method: '', value: '', payment_date: '', notes: '' };
  const [subscribeOpen, setSubscribeOpen] = React.useState(false);
  const [subscribeForm, setSubscribeForm] = React.useState(emptySubscribeForm);
  const [subscribeBusy, setSubscribeBusy] = React.useState(false);
  const [subscribeError, setSubscribeError] = React.useState('');

  const openSubscribe = () => { setSubscribeForm(emptySubscribeForm); setSubscribeError(''); setSubscribeOpen(true); };

  const pickSubscribePlan = (planId) => {
    const plan = (plansPage.items || []).find((p) => String(p.id) === planId);
    setSubscribeForm((f) => ({ ...f, plan_id: planId, value: f.addPayment && plan ? plan.price : f.value }));
  };

  const submitSubscribe = async () => {
    if (subscribeBusy || !subscribeForm.plan_id) return;
    if (subscribeForm.addPayment && (!subscribeForm.payment_method || !subscribeForm.value)) {
      setSubscribeError('Completa el método y el valor del pago, o desactívalo.');
      return;
    }
    setSubscribeBusy(true);
    setSubscribeError('');
    try {
      await api.createGymSubscription(memberId, {
        plan_id: Number(subscribeForm.plan_id),
        payment: subscribeForm.addPayment ? {
          payment_method: subscribeForm.payment_method,
          value: subscribeForm.value,
          payment_date: subscribeForm.payment_date || undefined,
          notes: subscribeForm.notes.trim() || undefined,
        } : undefined,
      });
      toast({ tone: 'success', title: currentIsAlive ? 'Suscripción renovada' : 'Suscripción registrada' });
      setSubscribeOpen(false);
      reloadSubs();
    } catch (e) {
      setSubscribeError(e?.message || 'No se pudo registrar la suscripción.');
    } finally {
      setSubscribeBusy(false);
    }
  };

  // ── Suscripción: cancelar ────────────────────────────────────────────────
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelBusy, setCancelBusy] = React.useState(false);
  const [cancelError, setCancelError] = React.useState('');

  const submitCancel = async (reason) => {
    if (cancelBusy || !current) return;
    setCancelBusy(true);
    setCancelError('');
    try {
      await api.cancelGymSubscription(current.id, reason);
      toast({ tone: 'neutral', title: 'Suscripción cancelada' });
      setCancelOpen(false);
      reloadSubs();
    } catch (e) {
      setCancelError(e?.message || 'No se pudo cancelar la suscripción.');
    } finally {
      setCancelBusy(false);
    }
  };

  // ── Pago sobre la suscripción vigente ────────────────────────────────────
  const emptyPayForm = { payment_method: '', value: '', payment_date: '', notes: '' };
  const [payOpen, setPayOpen] = React.useState(false);
  const [payForm, setPayForm] = React.useState(emptyPayForm);
  const [payBusy, setPayBusy] = React.useState(false);
  const [payError, setPayError] = React.useState('');

  const openPay = () => { setPayForm(emptyPayForm); setPayError(''); setPayOpen(true); };

  const submitPay = async () => {
    if (payBusy || !current || !payForm.payment_method || !payForm.value) return;
    setPayBusy(true);
    setPayError('');
    try {
      await api.addGymSubscriptionPayment(current.id, {
        payment_method: payForm.payment_method,
        value: payForm.value,
        payment_date: payForm.payment_date || undefined,
        notes: payForm.notes.trim() || undefined,
      });
      toast({ tone: 'success', title: 'Pago registrado' });
      setPayOpen(false);
      reloadSubs();
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
      await api.annulGymPayment(annulTarget.id, reason);
      toast({ tone: 'neutral', title: 'Pago anulado' });
      setAnnulTarget(null);
      reloadSubs();
    } catch (e) {
      setAnnulError(e?.message || 'No se pudo anular el pago.');
    } finally {
      setAnnulBusy(false);
    }
  };

  if (loading) return <Spinner center label="Cargando miembro…" />;
  if (error || !data) {
    return (
      <div className={s.page}>
        <Alert tone="danger" title="No se pudo abrir el miembro">{error || 'No se encontró el miembro.'}</Alert>
      </div>
    );
  }

  const meta = gymMemberStatusMeta(data.status);
  const dirty = form && (
    (form.height_cm || '') !== (data.height_cm ?? '') ||
    form.goal !== (data.goal || '') ||
    form.health_notes !== (data.health_notes || '') ||
    form.active !== (Number(data.status) === GYM_MEMBER_STATUS.ACTIVE)
  );

  const save = async () => {
    if (saving || !form) return;
    setSaving(true);
    setSaveError('');
    try {
      const updated = await api.updateGymMember(data.id, {
        height_cm: form.height_cm === '' ? null : form.height_cm,
        goal: form.goal.trim() || null,
        health_notes: form.health_notes.trim() || null,
        status: form.active ? GYM_MEMBER_STATUS.ACTIVE : GYM_MEMBER_STATUS.INACTIVE,
      });
      setData(updated);
      toast({ tone: 'success', title: 'Miembro actualizado' });
    } catch (e) {
      setSaveError(e?.message || 'No se pudo guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const paymentColumns = [
    { key: 'payment_date', header: 'Fecha', width: 120, render: (p) => formatShortDate(p.payment_date) },
    { key: 'payment_method_name', header: 'Método', ellipsis: true, render: (p) => p.payment_method_name || '—' },
    { key: 'value', header: 'Valor', width: 120, align: 'right', render: (p) => <span className={s.priceCell}>{gymMoney(p.value)}</span> },
    {
      key: 'status', header: 'Estado', width: 110,
      render: (p) => { const m = gymPaymentStatusMeta(p.status); return <Badge variant={m.variant} dot>{m.label}</Badge>; },
    },
    {
      key: 'actions', header: '', width: 90,
      render: (p) => (Number(p.status) === 1 ? (
        <Button variant="outline-primary" size="sm" onClick={() => setAnnulTarget(p)}>Anular</Button>
      ) : null),
    },
  ];

  const historyColumns = [
    { key: 'plan_name', header: 'Plan', ellipsis: true, render: (r) => r.plan_name },
    { key: 'start_date', header: 'Inicio', width: 120, render: (r) => formatShortDate(r.start_date) },
    { key: 'end_date', header: 'Fin', width: 120, render: (r) => formatShortDate(r.end_date) },
    {
      key: 'status', header: 'Estado', width: 130,
      render: (r) => { const m = gymSubscriptionStatusMeta(r.computed_status ?? r.status); return <Badge variant={m.variant} dot>{m.label}</Badge>; },
    },
  ];

  return (
    <div className={s.page}>
      <PageHeader
        onBack={goBack}
        subtitle={data.member_name}
        meta={[
          { label: 'Código', value: data.member_code },
          { label: 'Documento', value: data.document_snapshot || '—' },
          { label: 'Ingreso', value: formatShortDate(data.joined_at) },
          { label: 'Estado', value: <Badge variant={meta.variant} dot>{meta.label}</Badge> },
        ]}
      />

      {saveError && <Alert tone="danger" title="No se pudo completar la acción" onClose={() => setSaveError('')}>{saveError}</Alert>}

      <Card>
        <Card.Header title="Datos del gimnasio" />
        <Card.Body>
          {form && (
            <div className={s.formCol}>
              <div className={s.formGrid}>
                <Input label="Talla (cm)" type="number" min="0" icon="fas fa-ruler-vertical"
                  value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
                <Input label="Objetivo" icon="fas fa-bullseye" placeholder="Ej. Pérdida de grasa"
                  value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
              </div>
              <Textarea label="Notas de salud" placeholder="Lesiones, condiciones a tener en cuenta…"
                value={form.health_notes} onChange={(e) => setForm({ ...form, health_notes: e.target.value })} />
              <Switch label="Miembro activo" checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <div className={s.actions}>
                <Button variant="primary" loading={saving} disabled={!dirty} onClick={save}>Guardar cambios</Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Suscripción"
          action={
            <div className={s.actions}>
              {currentIsAlive && (
                <Button variant="outline-primary" size="sm" icon="fas fa-dollar-sign" onClick={openPay}>Registrar pago</Button>
              )}
              {currentIsAlive && (
                <Button variant="neutral" size="sm" icon="fas fa-ban" onClick={() => setCancelOpen(true)}>Cancelar</Button>
              )}
              <Button variant="primary" size="sm" icon="fas fa-plus" onClick={openSubscribe}>
                {currentIsAlive ? 'Renovar' : 'Nueva suscripción'}
              </Button>
            </div>
          } />
        <Card.Body>
          {!current ? (
            <p className={s.faint}>Este miembro todavía no tiene una suscripción.</p>
          ) : (
            <div className={s.formCol}>
              <div className={s.formGrid}>
                <div><span className={s.muted}>Plan</span><br /><strong>{current.plan_name}</strong></div>
                <div><span className={s.muted}>Precio</span><br /><strong>{gymMoney(current.price)}</strong></div>
              </div>
              <div className={s.formGrid}>
                <div><span className={s.muted}>Vigencia</span><br />{formatShortDate(current.start_date)} – {formatShortDate(current.end_date)}</div>
                <div>
                  <span className={s.muted}>Estado</span><br />
                  {(() => { const m = gymSubscriptionStatusMeta(current.computed_status ?? current.status); return <Badge variant={m.variant} dot>{m.label}</Badge>; })()}
                </div>
              </div>
              {current.cancellation_reason && (
                <Alert tone="neutral">Cancelada: {current.cancellation_reason}</Alert>
              )}
              <DataTable columns={paymentColumns} rows={current.payments || []} empty="Sin pagos registrados." />
            </div>
          )}
        </Card.Body>
      </Card>

      {history.length > 0 && (
        <Card>
          <Card.Header title="Historial de suscripciones" />
          <Card.Body>
            <DataTable columns={historyColumns} rows={history} empty="Sin historial." />
          </Card.Body>
        </Card>
      )}

      <Modal open={subscribeOpen} title={currentIsAlive ? 'Renovar suscripción' : 'Nueva suscripción'} onClose={() => setSubscribeOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setSubscribeOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={subscribeBusy} onClick={submitSubscribe}>Guardar</Button>
        </>}>
        <div className={s.formCol}>
          {currentIsAlive && (
            <p className={s.faint}>Empieza el día siguiente al vencimiento de la suscripción vigente ({formatShortDate(current.end_date)}).</p>
          )}
          <Select label="Plan" icon="fas fa-id-card" value={subscribeForm.plan_id}
            onChange={(e) => pickSubscribePlan(e.target.value)}
            options={[{ value: '', label: planOptions.length ? 'Selecciona…' : 'No hay planes activos' }, ...planOptions]} />
          <Switch label="Registrar el pago ahora" checked={subscribeForm.addPayment}
            onChange={(e) => setSubscribeForm((f) => ({ ...f, addPayment: e.target.checked }))} />
          {subscribeForm.addPayment && (
            <>
              <div className={s.formGrid}>
                <Select label="Método de pago" icon="fas fa-wallet" value={subscribeForm.payment_method}
                  onChange={(e) => setSubscribeForm((f) => ({ ...f, payment_method: e.target.value }))}
                  options={[{ value: '', label: 'Selecciona…' }, ...methodOptions]} />
                <MoneyInput label="Valor" icon="fas fa-dollar-sign"
                  value={subscribeForm.value} onChange={(v) => setSubscribeForm((f) => ({ ...f, value: v }))} />
              </div>
              <DatePicker label="Fecha del pago (opcional)" value={subscribeForm.payment_date}
                onChange={(iso) => setSubscribeForm((f) => ({ ...f, payment_date: iso }))} />
            </>
          )}
          {subscribeError && <Alert tone="danger" onClose={() => setSubscribeError('')}>{subscribeError}</Alert>}
        </div>
      </Modal>

      <Modal open={payOpen} size="sm" title="Registrar pago" onClose={() => setPayOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={payBusy} onClick={submitPay}>Registrar</Button>
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

      <ConfirmDialog open={cancelOpen} title="Cancelar suscripción" reason="required"
        reasonLabel="Motivo de la cancelación" loading={cancelBusy} error={cancelError}
        onConfirm={submitCancel} onClose={() => setCancelOpen(false)}>
        Esta acción es irreversible: el miembro perderá el acceso vigente. Para que vuelva a tener suscripción habrá que registrar una nueva.
      </ConfirmDialog>

      <ConfirmDialog open={!!annulTarget} title="Anular pago" reason="required"
        reasonLabel="Motivo de la anulación" loading={annulBusy} error={annulError}
        onConfirm={submitAnnul} onClose={() => setAnnulTarget(null)}>
        Esta acción es irreversible: se cancela también la factura de este pago.
      </ConfirmDialog>
    </div>
  );
}

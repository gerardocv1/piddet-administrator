import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Card, Badge, Button, Spinner, Alert, Input, Textarea, Switch, Select, MoneyInput,
  Modal, PageHeader, StatStrip, BodyMeasuresChart, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { gymMemberStatusMeta, GYM_MEMBER_STATUS, gymMoney, gymSubscriptionStatusMeta, GYM_SUBSCRIPTION_STATUS } from '../lib/gymLabels.js';
import { formatShortDate } from '../lib/dates.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import g from './GymMemberDetail.module.css';

const EMPTY_SUBS = [];
const EMPTY_TYPES = [];

// Ficha del miembro, en orden de uso móvil: primero su suscripción (resumen compacto — el
// detalle transaccional con los pagos vive en /gym/subscriptions/:id), luego su progreso
// físico (una medida a la vez, elegida con un selector) y al final el perfil editable.
// Registrar medidas abre el asistente paso a paso (/gym/members/:id/checkin).
export function GymMemberDetail() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();

  const fetcher = React.useCallback(() => api.gymMember(memberId), [memberId]);
  const { data, setData, loading, error } = useResource(fetcher, null, [memberId]);

  const subsFetcher = React.useCallback(() => api.gymMemberSubscriptions(memberId), [memberId]);
  const { data: subscriptions, reload: reloadSubs } = useResource(subsFetcher, EMPTY_SUBS, [memberId]);
  const current = subscriptions[0] || null;
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

  useSetPageTitle(data?.member_name ? `Miembro · ${data.member_name}` : null);

  const goBack = () => navigate(`/gym/members${params.toString() ? `?${params.toString()}` : ''}`);

  // ── Suscripción: alta/renovación (con pago si se elige método) ───────────
  const emptySubscribeForm = { plan_id: '', payment_method: '', value: '' };
  const [subscribeOpen, setSubscribeOpen] = React.useState(false);
  const [subscribeForm, setSubscribeForm] = React.useState(emptySubscribeForm);
  const [subscribeBusy, setSubscribeBusy] = React.useState(false);
  const [subscribeError, setSubscribeError] = React.useState('');

  const openSubscribe = React.useCallback(() => {
    // Preselecciona el plan de la suscripción vigente y precarga su precio: el caso típico es
    // renovar lo mismo y cobrar completo.
    const samePlan = current ? (plansPage.items || []).find((p) => p.id === current.plan_id) : null;
    setSubscribeForm({
      plan_id: samePlan ? String(samePlan.id) : '',
      payment_method: '',
      value: samePlan ? samePlan.price : '',
    });
    setSubscribeError('');
    setSubscribeOpen(true);
  }, [current, plansPage]);

  // ?action=renew (acción rápida desde el listado): abre el formulario apenas hay datos.
  const wantsRenew = params.get('action') === 'renew';
  React.useEffect(() => {
    if (wantsRenew && data && !subscribeOpen) {
      openSubscribe();
      const q = new URLSearchParams(params);
      q.delete('action');
      setParams(q, { replace: true });
    }
  }, [wantsRenew, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickSubscribePlan = (planId) => {
    const plan = (plansPage.items || []).find((p) => String(p.id) === planId);
    // El precio del plan siempre precarga el valor (antes solo lo hacía con el pago ya activado,
    // así que en el orden natural del formulario nunca se autocompletaba).
    setSubscribeForm((f) => ({ ...f, plan_id: planId, value: plan ? plan.price : f.value }));
  };

  const submitSubscribe = async () => {
    if (subscribeBusy || !subscribeForm.plan_id) return;
    const withPayment = !!subscribeForm.payment_method;
    if (withPayment && !subscribeForm.value) {
      setSubscribeError('Indica el valor del pago, o quita el método para registrar sin cobro.');
      return;
    }
    setSubscribeBusy(true);
    setSubscribeError('');
    try {
      const created = await api.createGymSubscription(memberId, {
        plan_id: Number(subscribeForm.plan_id),
        payment: withPayment ? {
          payment_method: subscribeForm.payment_method,
          value: subscribeForm.value,
        } : undefined,
      });
      toast({ tone: 'success', title: currentIsAlive ? 'Suscripción renovada' : 'Suscripción registrada' });
      setSubscribeOpen(false);
      reloadSubs();
      if (created?.id) navigate(`/gym/subscriptions/${created.id}`);
    } catch (e) {
      setSubscribeError(e?.message || 'No se pudo registrar la suscripción.');
    } finally {
      setSubscribeBusy(false);
    }
  };

  // ── Progreso: una medida a la vez, elegida con un selector ───────────────
  const { data: measurementTypes } = useResource(api.gymMeasurementTypes, EMPTY_TYPES, []);
  const typeByKey = React.useMemo(() => Object.fromEntries((measurementTypes || []).map((t) => [t.key, t])), [measurementTypes]);
  const [chartKey, setChartKey] = React.useState('');
  const selectedKey = chartKey || (typeByKey.weight ? 'weight' : (measurementTypes[0]?.key || ''));

  const progressFetcher = React.useCallback(() => api.gymMemberProgress(memberId), [memberId]);
  const { data: progress, loading: progressLoading } = useResource(progressFetcher, {}, [memberId]);

  const checkinsFetcher = React.useCallback(() => api.gymMemberCheckins(memberId, { perPage: 5 }), [memberId]);
  const { data: checkinsPage } = useResource(checkinsFetcher, { items: [] }, [memberId]);

  const weightPoints = progress.weight?.points || [];
  const latestWeight = weightPoints[weightPoints.length - 1];
  const prevWeight = weightPoints.length > 1 ? weightPoints[weightPoints.length - 2] : null;
  const heightM = data?.height_cm ? Number(data.height_cm) / 100 : null;
  const bmi = latestWeight && heightM ? Number(latestWeight.value) / (heightM * heightM) : null;
  const progressStats = [];
  if (latestWeight) {
    const delta = prevWeight ? Number(latestWeight.value) - Number(prevWeight.value) : 0;
    progressStats.push({
      label: 'Peso actual', value: `${latestWeight.value} kg`,
      delta: prevWeight ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg` : undefined,
      up: delta >= 0,
    });
  }
  if (bmi) progressStats.push({ label: 'IMC', value: bmi.toFixed(1) });

  const measureOptions = React.useMemo(
    () => (measurementTypes || []).map((t) => ({ value: t.key, label: t.label })),
    [measurementTypes],
  );

  // ── Perfil editable ──────────────────────────────────────────────────────
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

  const dirty = form && data && (
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

  if (loading) return <Spinner center label="Cargando miembro…" />;
  if (error || !data) {
    return (
      <div className={s.page}>
        <Alert tone="danger" title="No se pudo abrir el miembro">{error || 'No se encontró el miembro.'}</Alert>
      </div>
    );
  }

  const meta = gymMemberStatusMeta(data.status);
  const subMeta = current ? gymSubscriptionStatusMeta(currentStatus) : null;

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

      {/* ── Suscripción: resumen compacto; el detalle (pagos) vive en su propia vista ── */}
      <Card>
        <Card.Header title="Suscripción"
          action={
            <Button variant="primary" size="sm" icon={currentIsAlive ? 'fas fa-rotate' : 'fas fa-plus'} onClick={openSubscribe}>
              {currentIsAlive ? 'Renovar' : 'Nueva suscripción'}
            </Button>
          } />
        <Card.Body>
          {!current ? (
            <p className={s.faint}>Este miembro todavía no tiene una suscripción.</p>
          ) : (
            <button type="button" className={g.subSummary}
              onClick={() => navigate(`/gym/subscriptions/${current.id}`)}>
              <div className={g.subInfo}>
                <span className={g.subPlan}>{current.plan_name}</span>
                <span className={g.subDates}>
                  {currentStatus === GYM_SUBSCRIPTION_STATUS.EXPIRED || currentStatus === GYM_SUBSCRIPTION_STATUS.CANCELLED
                    ? `Venció el ${formatShortDate(current.end_date)}`
                    : `Vence el ${formatShortDate(current.end_date)}`}
                  {' · '}{gymMoney(current.price)}
                </span>
              </div>
              <span className={g.subRight}>
                <Badge variant={subMeta.variant} dot>{subMeta.label}</Badge>
                <i className={`fas fa-chevron-right ${g.subChevron}`} aria-hidden="true" />
              </span>
            </button>
          )}
          {subscriptions.length > 1 && (
            <p className={g.subHistoryNote}>
              {subscriptions.length - 1} suscripción{subscriptions.length - 1 === 1 ? '' : 'es'} anterior{subscriptions.length - 1 === 1 ? '' : 'es'} — se abren desde el listado de suscripciones.
            </p>
          )}
        </Card.Body>
      </Card>

      {/* ── Progreso físico ── */}
      <Card>
        <Card.Header title="Progreso"
          action={
            <Button variant="primary" size="sm" icon="fas fa-plus"
              onClick={() => navigate(`/gym/members/${memberId}/checkin`)}>
              Tomar medidas
            </Button>
          } />
        <Card.Body>
          <div className={s.formCol}>
            {progressStats.length > 0 && <StatStrip stats={progressStats} />}
            {measureOptions.length > 0 && (
              <Select label="Medida a graficar" icon="fas fa-chart-line" value={selectedKey}
                onChange={(e) => setChartKey(e.target.value)} options={measureOptions} />
            )}
            <BodyMeasuresChart series={progress} selectedKeys={selectedKey ? [selectedKey] : []} loading={progressLoading}
              labelFor={(key) => typeByKey[key]?.label || key}
              emptyLabel="Aún no hay mediciones de esta medida." />
            {(checkinsPage.items || []).length > 0 && (
              <ul className={g.checkinList}>
                {checkinsPage.items.map((c) => (
                  <li key={c.id} className={g.checkinRow}>
                    <span className={g.checkinDate}>{formatShortDate(c.measured_at)}</span>
                    <span className={g.checkinMeta}>
                      {(c.values || []).length} medida{(c.values || []).length === 1 ? '' : 's'} · {c.measured_by_name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* ── Perfil ── */}
      {saveError && <Alert tone="danger" title="No se pudo completar la acción" onClose={() => setSaveError('')}>{saveError}</Alert>}
      <Card>
        <Card.Header title="Perfil" />
        <Card.Body>
          {form && (
            <div className={s.formCol}>
              <div className={s.formGrid}>
                <Input label="Talla (cm)" type="number" inputMode="decimal" min="0" icon="fas fa-ruler-vertical"
                  hint="Se usa para calcular el IMC."
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

      <Modal open={subscribeOpen} title={currentIsAlive ? 'Renovar suscripción' : 'Nueva suscripción'} onClose={() => setSubscribeOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setSubscribeOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={subscribeBusy} disabled={!subscribeForm.plan_id} onClick={submitSubscribe}>Guardar</Button>
        </>}>
        <div className={s.formCol}>
          {currentIsAlive && (
            <p className={s.faint}>La nueva vigencia empieza el día siguiente al vencimiento actual ({formatShortDate(current.end_date)}).</p>
          )}
          <Select label="Plan" icon="fas fa-id-card" value={subscribeForm.plan_id}
            onChange={(e) => pickSubscribePlan(e.target.value)}
            options={[{ value: '', label: planOptions.length ? 'Selecciona…' : 'No hay planes activos' }, ...planOptions]} />
          <div className={s.formGrid}>
            <Select label="Método de pago" icon="fas fa-wallet" value={subscribeForm.payment_method}
              onChange={(e) => setSubscribeForm((f) => ({ ...f, payment_method: e.target.value }))}
              options={[{ value: '', label: 'Sin pago por ahora' }, ...methodOptions]} />
            <MoneyInput label="Valor" icon="fas fa-dollar-sign"
              value={subscribeForm.value} onChange={(v) => setSubscribeForm((f) => ({ ...f, value: v }))} />
          </div>
          <p className={s.faint}>Con método de pago seleccionado, el cobro se registra y factura en la misma operación.</p>
          {subscribeError && <Alert tone="danger" onClose={() => setSubscribeError('')}>{subscribeError}</Alert>}
        </div>
      </Modal>
    </div>
  );
}

import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Panel, Badge, Button, Spinner, Alert, Input, Textarea, Switch, Select,
  MoneyInput, DatePicker, Checkbox, Modal, InfoCard, Avatar, StatStrip, DataTable, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { gymMemberStatusMeta, GYM_MEMBER_STATUS, GYM_SEX_OPTIONS, gymSexLabel, gymMoney, gymSubscriptionStatusMeta, gymPeriodStatusMeta, gymSubscriptionPending, GYM_SUBSCRIPTION_STATUS, GYM_PERIOD_STATUS } from '../lib/gymLabels.js';
import { ID_TYPES } from '../lib/reservationLabels.js';
import { todayIso, yearsAgoIso } from '../lib/orderLabels.js';
import { formatShortDate, ageFromBirthdate } from '../lib/dates.js';
import { useSetPageTitle, useSetPageBack } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import g from './GymMemberDetail.module.css';

const EMPTY_SUBS = [];
const SIDE_LABEL = { L: 'izq.', R: 'der.' };
// 100 años atrás cubre a cualquier afiliado y acota el desplegable de años del calendario.
const OLDEST_BIRTHDATE = () => yearsAgoIso(100);

// Ficha del afiliado, en orden de uso móvil: arriba su identidad y todos sus datos en el
// InfoCard plegable (se editan juntos desde "Editar datos"), luego la suscripción como Panel
// compacto (el detalle transaccional con los pagos vive en /gym/subscriptions/:id) y las
// medidas en otro Panel (el análisis visual vive en /gym/members/:id/progress).
// Registrar medidas abre el asistente paso a paso.
export function GymMemberDetail() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const fetcher = React.useCallback(() => api.gymMember(memberId), [memberId]);
  const { data, setData, loading, error } = useResource(fetcher, null, [memberId]);

  const subsFetcher = React.useCallback(() => api.gymMemberSubscriptions(memberId), [memberId]);
  const { data: subscriptions, reload: reloadSubs } = useResource(subsFetcher, EMPTY_SUBS, [memberId]);
  // La suscripción es continua: solo puede haber una activa; si no hay, se muestra la última
  // (cancelada) como historial de solo lectura.
  const current = subscriptions.find((sub) => Number(sub.status) === GYM_SUBSCRIPTION_STATUS.ACTIVE)
    || subscriptions[0] || null;
  const currentIsActive = current ? Number(current.status) === GYM_SUBSCRIPTION_STATUS.ACTIVE : false;

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

  // La barra superior lleva un título fijo: el nombre completo ya está en la ficha, justo
  // debajo, y repetirlo arriba era ruido (además de cortarse con "…" en el teléfono).
  useSetPageTitle('Afiliado');

  const goBack = () => navigate(`/gym/members${params.toString() ? `?${params.toString()}` : ''}`);
  // La cabecera de esta ficha es un InfoCard (sin PageHeader), así que el "volver" del Topbar
  // se publica directo desde la pantalla.
  useSetPageBack(goBack);

  // ── Suscribir (solo si el afiliado no tiene una suscripción activa) ──────
  const emptySubscribeForm = { plan_id: '', start_date: todayIso(), payment_method: '', value: '', registers_income: true };
  const [subscribeOpen, setSubscribeOpen] = React.useState(false);
  const [subscribeForm, setSubscribeForm] = React.useState(emptySubscribeForm);
  const [subscribeBusy, setSubscribeBusy] = React.useState(false);
  const [subscribeError, setSubscribeError] = React.useState('');

  const openSubscribe = React.useCallback(() => {
    setSubscribeForm(emptySubscribeForm);
    setSubscribeError('');
    setSubscribeOpen(true);
  }, []);

  // ?action=subscribe (acción rápida desde el listado): abre el formulario apenas hay datos.
  const wantsSubscribe = params.get('action') === 'subscribe';
  React.useEffect(() => {
    if (wantsSubscribe && data && !currentIsActive && !subscribeOpen) {
      openSubscribe();
      const q = new URLSearchParams(params);
      q.delete('action');
      setParams(q, { replace: true });
    }
  }, [wantsSubscribe, data, currentIsActive]); // eslint-disable-line react-hooks/exhaustive-deps

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
        start_date: subscribeForm.start_date,
        payment: withPayment ? {
          payment_method: subscribeForm.payment_method,
          value: subscribeForm.value,
          registers_income: subscribeForm.registers_income,
        } : undefined,
      });
      toast({ tone: 'success', title: 'Suscripción registrada' });
      setSubscribeOpen(false);
      reloadSubs();
      if (created?.id) navigate(`/gym/subscriptions/${created.id}`);
    } catch (e) {
      setSubscribeError(e?.message || 'No se pudo registrar la suscripción.');
    } finally {
      setSubscribeBusy(false);
    }
  };

  // ── Editar datos: un solo formulario (dividido en dos apartados) que junta los datos
  // personales de la persona (nombres, correo, documento, nacimiento) y el perfil del afiliado
  // (sexo, talla, objetivo, notas, estado). Son dos recursos del backend (usuario y afiliado),
  // así que se guardan con dos llamadas encadenadas, pero para quien edita es una sola acción.
  // El celular no se edita: es la credencial con la que la persona inicia sesión.
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState(null);
  const [editBusy, setEditBusy] = React.useState(false);
  const [editError, setEditError] = React.useState('');

  const openEdit = () => {
    const per = data?.personal || {};
    const nameParts = (data?.member_name || '').trim().split(/\s+/);
    setEditForm({
      first_name: per.first_name || nameParts[0] || '',
      last_name: per.last_name || nameParts.slice(1).join(' '),
      email: per.email || '',
      id_type_id: per.id_type_id ? String(per.id_type_id) : '1',
      id_number: per.id_number || data?.document_snapshot || '',
      birthdate: per.birthdate || '',
      sex: data.sex || '',
      height_cm: data.height_cm ?? '',
      goal_id: data.goal_id ? String(data.goal_id) : '',
      health_notes: data.health_notes || '',
      active: Number(data.status) === GYM_MEMBER_STATUS.ACTIVE,
    });
    setEditError('');
    setEditOpen(true);
  };

  // Eco de la edad mientras se elige el día, para confirmar que la fecha es la correcta.
  const editAge = ageFromBirthdate(editForm?.birthdate);

  const submitEdit = async () => {
    if (editBusy) return;
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      setEditError('Nombres y apellidos son obligatorios.');
      return;
    }
    setEditBusy(true);
    setEditError('');
    try {
      await api.updateGymMemberPersonal(data.id, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim() || null,
        id_type_id: editForm.id_type_id ? Number(editForm.id_type_id) : null,
        id_number: editForm.id_number.trim() || null,
        birthdate: editForm.birthdate || null,
      });
      const updated = await api.updateGymMember(data.id, {
        sex: editForm.sex || null,
        height_cm: editForm.height_cm === '' ? null : editForm.height_cm,
        goal_id: editForm.goal_id === '' ? null : Number(editForm.goal_id),
        health_notes: editForm.health_notes.trim() || null,
        status: editForm.active ? GYM_MEMBER_STATUS.ACTIVE : GYM_MEMBER_STATUS.INACTIVE,
      });
      setData(updated);
      toast({ tone: 'success', title: 'Datos del afiliado actualizados' });
      setEditOpen(false);
    } catch (e) {
      setEditError(e?.message || 'No se pudieron guardar los datos.');
    } finally {
      setEditBusy(false);
    }
  };

  // ── Medidas: peso/IMC de un vistazo y la tabla de mediciones (el análisis con la figura
  // corporal y las gráficas vive en /gym/members/:id/progress) ──
  const progressFetcher = React.useCallback(() => api.gymMemberProgress(memberId, { types: ['weight'] }), [memberId]);
  const { data: progress, reload: reloadProgress } = useResource(progressFetcher, {}, [memberId]);

  const checkinsFetcher = React.useCallback(() => api.gymMemberCheckins(memberId, { perPage: 10 }), [memberId]);
  const { data: checkinsPage, loading: checkinsLoading, reload: reloadCheckins } = useResource(checkinsFetcher, { items: [] }, [memberId]);
  // Al tocar una fila de la tabla se abre el detalle de esa medición. El mismo modal sirve para
  // corregirla: `checkinForm` deja de ser null y las medidas pasan a campos editables. Es el
  // camino para las medidas cargadas con la fecha equivocada, o con un número mal digitado.
  const [openCheckin, setOpenCheckin] = React.useState(null);
  const [checkinForm, setCheckinForm] = React.useState(null);
  const [checkinBusy, setCheckinBusy] = React.useState(false);
  const [checkinError, setCheckinError] = React.useState('');

  const closeCheckin = () => { setOpenCheckin(null); setCheckinForm(null); setCheckinError(''); };

  const editCheckin = () => {
    setCheckinForm({
      measured_at: openCheckin.measured_at,
      notes: openCheckin.notes || '',
      values: (openCheckin.values || []).map((v) => ({
        measurement_type_id: v.measurement_type_id,
        side: v.side || null,
        label: v.label || v.key,
        unit: v.unit,
        value: String(v.value ?? ''),
      })),
    });
    setCheckinError('');
  };

  const setCheckinValue = (index, raw) => {
    setCheckinForm((f) => ({
      ...f,
      values: f.values.map((v, i) => (i === index ? { ...v, value: raw.replace(',', '.') } : v)),
    }));
  };

  const submitCheckin = async () => {
    if (checkinBusy) return;
    // Una medida que se deja en blanco desaparece del chequeo: el PUT reemplaza la lista entera.
    const values = checkinForm.values
      .filter((v) => String(v.value).trim() !== '')
      .map((v) => ({
        measurement_type_id: v.measurement_type_id,
        ...(v.side ? { side: v.side } : {}),
        value: v.value,
      }));
    if (!values.length) {
      setCheckinError('Deja al menos una medida con valor.');
      return;
    }
    setCheckinBusy(true);
    setCheckinError('');
    try {
      const updated = await api.updateGymCheckin(openCheckin.id, {
        measured_at: checkinForm.measured_at,
        notes: checkinForm.notes.trim() || null,
        values,
      });
      toast({ tone: 'success', title: 'Medición actualizada' });
      setOpenCheckin(updated);
      setCheckinForm(null);
      reloadCheckins();
      reloadProgress();
    } catch (e) {
      setCheckinError(e?.message || 'No se pudo guardar la medición.');
    } finally {
      setCheckinBusy(false);
    }
  };

  const checkinColumns = [
    { key: 'measured_at', header: 'Fecha', width: 110, render: (c) => <span className={s.cellStrong}>{formatShortDate(c.measured_at)}</span> },
    { key: 'values', header: 'Medidas', width: 90, align: 'center', render: (c) => (c.values || []).length },
    { key: 'measured_by_name', header: 'Registró', ellipsis: true, render: (c) => c.measured_by_name || '—' },
  ];

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

  // El objetivo es cerrado: se elige del catálogo, tanto para mostrarlo como para editarlo.
  const { data: goals } = useResource(api.gymGoals, [], []);
  const goalOptions = React.useMemo(
    () => [{ value: '', label: 'Sin objetivo' }, ...(goals || []).map((goal) => ({ value: String(goal.id), label: goal.label }))],
    [goals],
  );

  if (loading) return <Spinner center label="Cargando afiliado…" />;
  if (error || !data) {
    return (
      <div className={s.page}>
        <Alert tone="danger" title="No se pudo abrir el afiliado">{error || 'No se encontró el afiliado.'}</Alert>
      </div>
    );
  }

  const meta = gymMemberStatusMeta(data.status);
  // Con una activa cuyo período está en gracia, el badge advierte eso; si no, el estado de
  // la suscripción (activa/cancelada).
  const subMeta = current
    ? (currentIsActive && Number(current.current_period?.computed_status ?? current.current_period?.status) === GYM_PERIOD_STATUS.GRACE
      ? gymPeriodStatusMeta(GYM_PERIOD_STATUS.GRACE)
      : gymSubscriptionStatusMeta(current.status))
    : null;

  return (
    <div className={s.page}>
      {/* La identidad del afiliado como InfoCard: avatar + nombre + teléfono, acciones en el
          ⋮ y el resto de datos (personales y de perfil) en el detalle plegable — un solo lugar,
          se editan juntos desde "Editar datos". */}
      <InfoCard
        media={<Avatar name={data.member_name} size="lg" />}
        title={data.member_name}
        description={data.phone_number
          ? <><i className="fas fa-phone" aria-hidden="true" /> {data.phone_number}</>
          : data.member_code}
        actions={[
          { label: 'Editar datos', icon: 'fas fa-pen', onClick: openEdit },
          { label: 'Ver progreso', icon: 'fas fa-chart-line', onClick: () => navigate(`/gym/members/${memberId}/progress`) },
        ]}
      >
        <InfoCard.Field label="Código">{data.member_code}</InfoCard.Field>
        <InfoCard.Field label="Documento">{data.document_snapshot || '—'}</InfoCard.Field>
        <InfoCard.Field label="Sexo">{gymSexLabel(data.sex) || 'Sin definir'}</InfoCard.Field>
        <InfoCard.Field label="Edad">
          {data.age == null ? 'Sin definir' : `${data.age} años · ${formatShortDate(data.birthdate)}`}
        </InfoCard.Field>
        <InfoCard.Field label="Talla">{data.height_cm ? `${data.height_cm} cm` : '—'}</InfoCard.Field>
        <InfoCard.Field label="Objetivo">{data.goal || 'Sin objetivo'}</InfoCard.Field>
        <InfoCard.Field label="Ingreso">{formatShortDate(data.joined_at)}</InfoCard.Field>
        <InfoCard.Field label="Estado"><Badge variant={meta.variant} dot>{meta.label}</Badge></InfoCard.Field>
        {data.health_notes && <p className={g.healthNotes}><i className="fas fa-notes-medical" aria-hidden="true" /> {data.health_notes}</p>}
      </InfoCard>

      {/* ── Suscripción: resumen compacto; el detalle (períodos y pagos) vive en su propia vista ── */}
      <Panel title="Suscripción"
        action={!currentIsActive ? (
          <Button variant="outline-primary" size="sm" icon="fas fa-plus" onClick={openSubscribe}>
            Suscribir
          </Button>
        ) : null}>
        {!current ? (
          <p className={s.faint}>Este afiliado todavía no tiene una suscripción.</p>
        ) : (
          <button type="button" className={g.subSummary}
            onClick={() => navigate(`/gym/subscriptions/${current.id}`)}>
            <div className={g.subInfo}>
              <span className={g.subPlan}>{current.plan_name}</span>
              <span className={g.subDates}>
                {current.current_period ? (
                  Number(current.current_period.computed_status ?? current.current_period.status) === GYM_PERIOD_STATUS.GRACE
                    ? `Venció el ${formatShortDate(current.current_period.end_date)}`
                    : `Vence el ${formatShortDate(current.current_period.end_date)}`
                ) : 'Sin período vigente'}
                {' · '}{gymMoney(current.current_period?.price)}
                {currentIsActive && gymSubscriptionPending(current) > 0 && (
                  <span className={g.subSaldo}> · saldo {gymMoney(gymSubscriptionPending(current))}</span>
                )}
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
      </Panel>

      {/* ── Medidas: tabla de mediciones; el análisis visual vive en la vista de progreso ── */}
      <Panel title="Medidas"
        action={
          <span className={g.headerActions}>
            {!isMobile && (
              <Button variant="secondary" size="sm" icon="fas fa-chart-line"
                onClick={() => navigate(`/gym/members/${memberId}/progress`)}>
                Ver progreso
              </Button>
            )}
            <Button variant="outline-primary" size="sm" icon="fas fa-plus"
              onClick={() => navigate(`/gym/members/${memberId}/checkin`)}>
              Medidas
            </Button>
          </span>
        }>
        <div className={s.formCol}>
            {progressStats.length > 0 && <StatStrip stats={progressStats} />}
            <div className={s.desktopList}>
              <DataTable
                columns={checkinColumns}
                rows={checkinsPage.items || []}
                loading={checkinsLoading}
                empty="Aún no hay mediciones registradas."
                onRowClick={(c) => setOpenCheckin(c)}
              />
            </div>
            {/* Móvil: una fila por medición (fecha · nº de medidas), tappable para ver el
                detalle. La tabla no cabía a lo ancho y recortaba quién la registró. */}
            <div className={s.mobileList}>
              {checkinsLoading && <div className={s.mobileState}><Spinner size="sm" label="Cargando…" /></div>}
              {!checkinsLoading && (checkinsPage.items || []).length === 0 && (
                <p className={s.faint}>Aún no hay mediciones registradas.</p>
              )}
              {!checkinsLoading && (checkinsPage.items || []).length > 0 && (
                <ul className={g.checkinList}>
                  {(checkinsPage.items || []).map((c) => (
                    <li key={c.id}>
                      <button type="button" className={g.checkinRow} onClick={() => setOpenCheckin(c)}>
                        <span className={g.checkinDate}>{formatShortDate(c.measured_at)}</span>
                        <span className={g.checkinMeta}>
                          {(c.values || []).length} {(c.values || []).length === 1 ? 'medida' : 'medidas'}
                          <i className={`fas fa-chevron-right ${g.checkinChevron}`} aria-hidden="true" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
      </Panel>

      {/* Detalle de una medición del historial, y su corrección en el mismo modal */}
      <Modal open={!!openCheckin}
        title={openCheckin ? (checkinForm ? 'Corregir medición' : `Medición del ${formatShortDate(openCheckin.measured_at)}`) : ''}
        onClose={closeCheckin}
        footer={checkinForm ? (
          <>
            <Button variant="secondary" onClick={() => { setCheckinForm(null); setCheckinError(''); }}>Cancelar</Button>
            <Button variant="primary" loading={checkinBusy} onClick={submitCheckin}>Guardar</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={closeCheckin}>Cerrar</Button>
            <Button variant="primary" icon="fas fa-pen" onClick={editCheckin}>Editar</Button>
          </>
        )}>
        {openCheckin && !checkinForm && (
          <div className={s.formCol}>
            <p className={g.checkinBy}>Registrada por {openCheckin.measured_by_name}</p>
            <ul className={g.valueList}>
              {(openCheckin.values || []).map((v, i) => (
                <li key={i} className={g.valueRow}>
                  <span className={g.valueLabel}>
                    {v.label || v.key}{v.side ? ` (${SIDE_LABEL[v.side] || v.side})` : ''}
                  </span>
                  <span className={g.valueNumber}>{v.value} {v.unit}</span>
                </li>
              ))}
            </ul>
            {openCheckin.notes && <p className={s.faint}>{openCheckin.notes}</p>}
          </div>
        )}
        {checkinForm && (
          <div className={s.formCol}>
            <DatePicker label="Fecha de la medición" icon="fas fa-calendar" max={todayIso()}
              value={checkinForm.measured_at}
              onChange={(d) => setCheckinForm((f) => ({ ...f, measured_at: d }))} />
            <div className={s.formGrid}>
              {checkinForm.values.map((v, i) => (
                <Input key={`${v.measurement_type_id}_${v.side || ''}`}
                  label={`${v.label}${v.side ? ` (${SIDE_LABEL[v.side] || v.side})` : ''} (${v.unit})`}
                  type="text" inputMode="decimal" value={v.value}
                  onChange={(e) => setCheckinValue(i, e.target.value)} />
              ))}
            </div>
            <Textarea label="Notas" placeholder="Condiciones de la toma, observaciones…"
              value={checkinForm.notes}
              onChange={(e) => setCheckinForm((f) => ({ ...f, notes: e.target.value }))} />
            <p className={s.faint}>Una medida que dejes en blanco se quita de esta medición.</p>
            {checkinError && <Alert tone="danger" onClose={() => setCheckinError('')}>{checkinError}</Alert>}
          </div>
        )}
      </Modal>

      {/* Editar datos: un solo formulario para todo el afiliado, dividido en dos apartados
          (datos personales del backend `users` + perfil del afiliado), que se guardan en dos
          llamadas encadenadas pero como una sola acción del punto de vista de quien edita. */}
      <Modal open={editOpen} title="Editar datos" onClose={() => setEditOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={editBusy} onClick={submitEdit}>Guardar</Button>
        </>}>
        {editForm && (
          <div className={s.formCol}>
            <span className={g.formSectionTitle}>Datos personales</span>
            <div className={s.formGrid}>
              <Input label="Nombres" icon="fas fa-user" value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
              <Input label="Apellidos" icon="fas fa-user" value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
            </div>
            <Input label="Correo" icon="fas fa-envelope" type="email" inputMode="email" placeholder="Opcional"
              value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <div className={s.formGrid}>
              <Select label="Tipo de documento" icon="fas fa-id-card" value={editForm.id_type_id}
                onChange={(e) => setEditForm({ ...editForm, id_type_id: e.target.value })} options={ID_TYPES} />
              <Input label="Número de documento" icon="fas fa-hashtag" inputMode="numeric"
                value={editForm.id_number} onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })} />
            </div>
            {/* Se guarda la fecha, no la edad: los años salen calculados en la ficha. */}
            <DatePicker label="Fecha de nacimiento" icon="fas fa-cake-candles"
              captionLayout="dropdown" min={OLDEST_BIRTHDATE()} max={todayIso()}
              hint={editAge === null ? undefined : `Tiene ${editAge} años.`}
              value={editForm.birthdate} onChange={(d) => setEditForm({ ...editForm, birthdate: d })} />
            <p className={s.faint}>
              El celular{data.personal?.phone_number ? ` (${data.personal.phone_number})` : ''} no se edita aquí:
              es el acceso de la cuenta de la persona.
            </p>

            <span className={g.formSectionTitle}>Perfil</span>
            <div className={s.formGrid}>
              <Select label="Sexo" icon="fas fa-venus-mars" value={editForm.sex}
                hint="Decide la silueta de la vista de progreso."
                onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}
                options={[{ value: '', label: 'Sin definir' }, ...GYM_SEX_OPTIONS]} />
              <Input label="Talla (cm)" type="number" inputMode="decimal" min="0" icon="fas fa-ruler-vertical"
                hint="Se usa para calcular el IMC."
                value={editForm.height_cm} onChange={(e) => setEditForm({ ...editForm, height_cm: e.target.value })} />
            </div>
            <Select label="Objetivo" icon="fas fa-bullseye" value={editForm.goal_id}
              onChange={(e) => setEditForm({ ...editForm, goal_id: e.target.value })} options={goalOptions} />
            <Textarea label="Notas de salud" placeholder="Lesiones, condiciones a tener en cuenta…"
              value={editForm.health_notes} onChange={(e) => setEditForm({ ...editForm, health_notes: e.target.value })} />
            <Switch label="Afiliado activo" checked={editForm.active}
              onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} />

            {editError && <Alert tone="danger" onClose={() => setEditError('')}>{editError}</Alert>}
          </div>
        )}
      </Modal>

      <Modal open={subscribeOpen} title="Nueva suscripción" onClose={() => setSubscribeOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setSubscribeOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={subscribeBusy} disabled={!subscribeForm.plan_id} onClick={submitSubscribe}>Guardar</Button>
        </>}>
        <div className={s.formCol}>
          <Select label="Plan" icon="fas fa-id-card" value={subscribeForm.plan_id}
            onChange={(e) => pickSubscribePlan(e.target.value)}
            options={[{ value: '', label: planOptions.length ? 'Selecciona…' : 'No hay planes activos' }, ...planOptions]} />
          <DatePicker label="Inicio de la vigencia" icon="fas fa-calendar-day"
            hint="El vencimiento se calcula desde esta fecha. Cámbiala si el afiliado ya venía pagando de antes."
            value={subscribeForm.start_date}
            onChange={(d) => setSubscribeForm((f) => ({ ...f, start_date: d }))} />
          <div className={s.formGrid}>
            <Select label="Método de pago" icon="fas fa-wallet" value={subscribeForm.payment_method}
              onChange={(e) => setSubscribeForm((f) => ({ ...f, payment_method: e.target.value }))}
              options={[{ value: '', label: 'Sin pago por ahora' }, ...methodOptions]} />
            <MoneyInput label="Valor" icon="fas fa-dollar-sign"
              value={subscribeForm.value} onChange={(v) => setSubscribeForm((f) => ({ ...f, value: v }))} />
          </div>
          {!subscribeForm.payment_method ? (
            <p className={s.faint}>Con método de pago seleccionado, el cobro se registra y factura en la misma operación.</p>
          ) : (
            <>
              <Checkbox label="Registrar el cobro como ingreso"
                checked={subscribeForm.registers_income}
                onChange={(e) => setSubscribeForm((f) => ({ ...f, registers_income: e.target.checked }))} />
              <p className={s.faint}>
                {subscribeForm.registers_income
                  ? 'Se genera la factura del cobro y entra a la caja.'
                  : 'El pago queda registrado en la suscripción, pero sin factura: no entra a la caja. Es lo que corresponde a un dinero que se cobró antes de usar la plataforma.'}
              </p>
            </>
          )}
          {subscribeError && <Alert tone="danger" onClose={() => setSubscribeError('')}>{subscribeError}</Alert>}
        </div>
      </Modal>
    </div>
  );
}

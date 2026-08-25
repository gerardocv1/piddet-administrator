import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Card, Badge, Button, IconButton, Dropdown, Spinner, Alert, Input, Textarea, Switch, Select,
  MoneyInput, DatePicker, Checkbox, Modal, PageHeader, StatStrip, DataTable, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { gymMemberStatusMeta, GYM_MEMBER_STATUS, GYM_SEX_OPTIONS, gymSexLabel, gymMoney, gymSubscriptionStatusMeta, GYM_SUBSCRIPTION_STATUS } from '../lib/gymLabels.js';
import { ID_TYPES } from '../lib/reservationLabels.js';
import { todayIso, yearsAgoIso } from '../lib/orderLabels.js';
import { formatShortDate, ageFromBirthdate } from '../lib/dates.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import g from './GymMemberDetail.module.css';

const EMPTY_SUBS = [];
const SIDE_LABEL = { L: 'izq.', R: 'der.' };
// 100 años atrás cubre a cualquier afiliado y acota el desplegable de años del calendario.
const OLDEST_BIRTHDATE = () => yearsAgoIso(100);

// Tarjeta plegable: el título es el interruptor (tocar minimiza/maximiza); la acción del header
// queda siempre visible, así "Renovar" sigue a un toque aunque la tarjeta esté plegada.
function CollapsibleCard({ title, action, defaultOpen = true, children }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Card>
      <Card.Header action={action} className={open ? '' : g.collapsedHeader}>
        <button type="button" className={g.collapseToggle} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {title}
          <i className={`fas fa-chevron-down ${g.collapseChevron} ${open ? g.chevronOpen : ''}`} aria-hidden="true" />
        </button>
      </Card.Header>
      {open && <Card.Body>{children}</Card.Body>}
    </Card>
  );
}

// Ficha del afiliado, en orden de uso móvil: primero su suscripción (resumen compacto — el
// detalle transaccional con los pagos vive en /gym/subscriptions/:id), luego su progreso
// físico (todas las medidas configuradas en una gráfica, ocultables desde la leyenda, con el
// historial de mediciones debajo) y al final el perfil como resumen de solo lectura, abierto
// por defecto; su edición vive en un modal. Suscripción y perfil se pueden minimizar/maximizar.
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

  // La barra superior lleva un título fijo: el nombre completo ya está en la ficha, justo
  // debajo, y repetirlo arriba era ruido (además de cortarse con "…" en el teléfono).
  useSetPageTitle('Afiliado');

  const goBack = () => navigate(`/gym/members${params.toString() ? `?${params.toString()}` : ''}`);

  // ── Suscripción: alta/renovación (con pago si se elige método) ───────────
  const emptySubscribeForm = { plan_id: '', start_date: todayIso(), payment_method: '', value: '', registers_income: true };
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
      start_date: todayIso(),
      payment_method: '',
      value: samePlan ? samePlan.price : '',
      registers_income: true,
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
        // En una renovación encadenada el backend ignora la fecha: la vigencia arranca al día
        // siguiente de la anterior, así que ni se manda.
        start_date: currentIsAlive ? undefined : subscribeForm.start_date,
        payment: withPayment ? {
          payment_method: subscribeForm.payment_method,
          value: subscribeForm.value,
          registers_income: subscribeForm.registers_income,
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

  // ── Datos personales de la persona (nombres, correo, documento). El celular no se edita:
  // es la credencial con la que inicia sesión. ──
  const [personalOpen, setPersonalOpen] = React.useState(false);
  const [personalForm, setPersonalForm] = React.useState(null);
  const [personalBusy, setPersonalBusy] = React.useState(false);
  const [personalError, setPersonalError] = React.useState('');

  const openPersonal = () => {
    const per = data?.personal || {};
    const nameParts = (data?.member_name || '').trim().split(/\s+/);
    setPersonalForm({
      first_name: per.first_name || nameParts[0] || '',
      last_name: per.last_name || nameParts.slice(1).join(' '),
      email: per.email || '',
      id_type_id: per.id_type_id ? String(per.id_type_id) : '1',
      id_number: per.id_number || data?.document_snapshot || '',
      birthdate: per.birthdate || '',
    });
    setPersonalError('');
    setPersonalOpen(true);
  };

  // Eco de la edad mientras se elige el día, para confirmar que la fecha es la correcta.
  const personalAge = ageFromBirthdate(personalForm?.birthdate);

  const submitPersonal = async () => {
    if (personalBusy) return;
    if (!personalForm.first_name.trim() || !personalForm.last_name.trim()) {
      setPersonalError('Nombres y apellidos son obligatorios.');
      return;
    }
    setPersonalBusy(true);
    setPersonalError('');
    try {
      const updated = await api.updateGymMemberPersonal(data.id, {
        first_name: personalForm.first_name.trim(),
        last_name: personalForm.last_name.trim(),
        email: personalForm.email.trim() || null,
        id_type_id: personalForm.id_type_id ? Number(personalForm.id_type_id) : null,
        id_number: personalForm.id_number.trim() || null,
        birthdate: personalForm.birthdate || null,
      });
      setData(updated);
      toast({ tone: 'success', title: 'Datos personales actualizados' });
      setPersonalOpen(false);
    } catch (e) {
      setPersonalError(e?.message || 'No se pudieron guardar los datos.');
    } finally {
      setPersonalBusy(false);
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

  // ── Perfil (objetivo cerrado: se elige del catálogo). En la ficha solo va el resumen de
  // lectura; el formulario vive en un modal que se precarga al abrirlo. ──
  const { data: goals } = useResource(api.gymGoals, [], []);
  const goalOptions = React.useMemo(
    () => [{ value: '', label: 'Sin objetivo' }, ...(goals || []).map((goal) => ({ value: String(goal.id), label: goal.label }))],
    [goals],
  );

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  const openProfile = () => {
    setForm({
      sex: data.sex || '',
      height_cm: data.height_cm ?? '',
      goal_id: data.goal_id ? String(data.goal_id) : '',
      health_notes: data.health_notes || '',
      active: Number(data.status) === GYM_MEMBER_STATUS.ACTIVE,
    });
    setSaveError('');
    setProfileOpen(true);
  };

  const dirty = form && data && (
    form.sex !== (data.sex || '') ||
    (form.height_cm || '') !== (data.height_cm ?? '') ||
    form.goal_id !== (data.goal_id ? String(data.goal_id) : '') ||
    form.health_notes !== (data.health_notes || '') ||
    form.active !== (Number(data.status) === GYM_MEMBER_STATUS.ACTIVE)
  );

  const save = async () => {
    if (saving || !form) return;
    setSaving(true);
    setSaveError('');
    try {
      const updated = await api.updateGymMember(data.id, {
        sex: form.sex || null,
        height_cm: form.height_cm === '' ? null : form.height_cm,
        goal_id: form.goal_id === '' ? null : Number(form.goal_id),
        health_notes: form.health_notes.trim() || null,
        status: form.active ? GYM_MEMBER_STATUS.ACTIVE : GYM_MEMBER_STATUS.INACTIVE,
      });
      setData(updated);
      toast({ tone: 'success', title: 'Afiliado actualizado' });
      setProfileOpen(false);
    } catch (e) {
      setSaveError(e?.message || 'No se pudo guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner center label="Cargando afiliado…" />;
  if (error || !data) {
    return (
      <div className={s.page}>
        <Alert tone="danger" title="No se pudo abrir el afiliado">{error || 'No se encontró el afiliado.'}</Alert>
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
        actions={isMobile ? (
          // En el teléfono la cabecera no lleva botones sueltos: editar los datos y ver el
          // progreso son secundarios frente a cobrar y tomar medidas, y viven en el menú.
          <Dropdown
            trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Más acciones" />}
            items={[
              { label: 'Editar datos', icon: 'fas fa-pen', onClick: openPersonal },
              { label: 'Ver progreso', icon: 'fas fa-chart-line', onClick: () => navigate(`/gym/members/${memberId}/progress`) },
            ]}
          />
        ) : (
          <Button variant="secondary" size="sm" icon="fas fa-pen" onClick={openPersonal}>
            Editar datos
          </Button>
        )}
        meta={[
          { label: 'Código', value: data.member_code },
          { label: 'Documento', value: data.document_snapshot || '—' },
          { label: 'Ingreso', value: formatShortDate(data.joined_at) },
          { label: 'Estado', value: <Badge variant={meta.variant} dot>{meta.label}</Badge> },
        ]}
      />

      {/* ── Suscripción: resumen compacto; el detalle (pagos) vive en su propia vista ── */}
      <CollapsibleCard title="Suscripción" defaultOpen
        action={
          <Button variant="primary" size="sm" icon={currentIsAlive ? 'fas fa-rotate' : 'fas fa-plus'} onClick={openSubscribe}>
            {currentIsAlive ? 'Renovar' : 'Nueva suscripción'}
          </Button>
        }>
        {!current ? (
          <p className={s.faint}>Este afiliado todavía no tiene una suscripción.</p>
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
      </CollapsibleCard>

      {/* ── Medidas: tabla de mediciones; el análisis visual vive en la vista de progreso ── */}
      <Card>
        <Card.Header title="Medidas"
          action={
            <span className={g.headerActions}>
              {!isMobile && (
                <Button variant="secondary" size="sm" icon="fas fa-chart-line"
                  onClick={() => navigate(`/gym/members/${memberId}/progress`)}>
                  Ver progreso
                </Button>
              )}
              <Button variant="primary" size="sm" icon="fas fa-plus"
                onClick={() => navigate(`/gym/members/${memberId}/checkin`)}>
                Tomar medidas
              </Button>
            </span>
          } />
        <Card.Body>
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
        </Card.Body>
      </Card>

      {/* ── Perfil: resumen de solo lectura, abierto por defecto; la edición abre un modal ── */}
      <CollapsibleCard title="Perfil" defaultOpen
        action={
          <Button variant="secondary" size="sm" icon="fas fa-pen" onClick={openProfile}>
            Editar
          </Button>
        }>
        <ul className={g.profileList}>
          <li className={g.profileRow}>
            <span className={g.profileLabel}>Sexo</span>
            <span className={g.profileValue}>{gymSexLabel(data.sex) || 'Sin definir'}</span>
          </li>
          {/* La edad la calcula el backend desde la fecha de nacimiento; se edita en "Editar datos". */}
          <li className={g.profileRow}>
            <span className={g.profileLabel}>Edad</span>
            <span className={g.profileValue}>
              {data.age == null ? 'Sin definir' : `${data.age} años · ${formatShortDate(data.birthdate)}`}
            </span>
          </li>
          <li className={g.profileRow}>
            <span className={g.profileLabel}>Talla</span>
            <span className={g.profileValue}>{data.height_cm ? `${data.height_cm} cm` : '—'}</span>
          </li>
          <li className={g.profileRow}>
            <span className={g.profileLabel}>Objetivo</span>
            <span className={g.profileValue}>{data.goal || 'Sin objetivo'}</span>
          </li>
          <li className={g.profileRow}>
            <span className={g.profileLabel}>Notas de salud</span>
            <span className={g.profileValue}>{data.health_notes || '—'}</span>
          </li>
        </ul>
      </CollapsibleCard>

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

      {/* Perfil del afiliado (sexo, talla, objetivo, notas y estado): la ficha solo muestra el
          resumen; los cambios se hacen aquí. */}
      <Modal open={profileOpen} title="Editar perfil" onClose={() => setProfileOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setProfileOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={saving} disabled={!dirty} onClick={save}>Guardar</Button>
        </>}>
        {form && (
          <div className={s.formCol}>
            <div className={s.formGrid}>
              <Select label="Sexo" icon="fas fa-venus-mars" value={form.sex}
                hint="Decide la silueta de la vista de progreso."
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
                options={[{ value: '', label: 'Sin definir' }, ...GYM_SEX_OPTIONS]} />
              <Input label="Talla (cm)" type="number" inputMode="decimal" min="0" icon="fas fa-ruler-vertical"
                hint="Se usa para calcular el IMC."
                value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
            </div>
            <Select label="Objetivo" icon="fas fa-bullseye" value={form.goal_id}
              onChange={(e) => setForm({ ...form, goal_id: e.target.value })} options={goalOptions} />
            <Textarea label="Notas de salud" placeholder="Lesiones, condiciones a tener en cuenta…"
              value={form.health_notes} onChange={(e) => setForm({ ...form, health_notes: e.target.value })} />
            <Switch label="Afiliado activo" checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            {saveError && <Alert tone="danger" onClose={() => setSaveError('')}>{saveError}</Alert>}
          </div>
        )}
      </Modal>

      {/* Datos personales de la persona (users + perfil): el celular queda fuera a propósito. */}
      <Modal open={personalOpen} title="Editar datos personales" onClose={() => setPersonalOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setPersonalOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={personalBusy} onClick={submitPersonal}>Guardar</Button>
        </>}>
        {personalForm && (
          <div className={s.formCol}>
            <div className={s.formGrid}>
              <Input label="Nombres" icon="fas fa-user" value={personalForm.first_name}
                onChange={(e) => setPersonalForm({ ...personalForm, first_name: e.target.value })} />
              <Input label="Apellidos" icon="fas fa-user" value={personalForm.last_name}
                onChange={(e) => setPersonalForm({ ...personalForm, last_name: e.target.value })} />
            </div>
            <Input label="Correo" icon="fas fa-envelope" type="email" inputMode="email" placeholder="Opcional"
              value={personalForm.email} onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })} />
            <div className={s.formGrid}>
              <Select label="Tipo de documento" icon="fas fa-id-card" value={personalForm.id_type_id}
                onChange={(e) => setPersonalForm({ ...personalForm, id_type_id: e.target.value })} options={ID_TYPES} />
              <Input label="Número de documento" icon="fas fa-hashtag" inputMode="numeric"
                value={personalForm.id_number} onChange={(e) => setPersonalForm({ ...personalForm, id_number: e.target.value })} />
            </div>
            {/* Se guarda la fecha, no la edad: los años salen calculados en la ficha. */}
            <DatePicker label="Fecha de nacimiento" icon="fas fa-cake-candles"
              captionLayout="dropdown" min={OLDEST_BIRTHDATE()} max={todayIso()}
              hint={personalAge === null ? undefined : `Tiene ${personalAge} años.`}
              value={personalForm.birthdate} onChange={(d) => setPersonalForm({ ...personalForm, birthdate: d })} />
            <p className={s.faint}>
              El celular{data.personal?.phone_number ? ` (${data.personal.phone_number})` : ''} no se edita aquí:
              es el acceso de la cuenta de la persona.
            </p>
            {personalError && <Alert tone="danger" onClose={() => setPersonalError('')}>{personalError}</Alert>}
          </div>
        )}
      </Modal>

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
          {/* En la renovación encadenada la fecha la decide el vencimiento anterior (arriba se
              explica), así que el campo solo aparece cuando la vigencia sí arranca aquí. */}
          {!currentIsAlive && (
            <DatePicker label="Inicio de la vigencia" icon="fas fa-calendar-day"
              hint="El vencimiento se calcula desde esta fecha. Cámbiala si el afiliado ya venía pagando de antes."
              value={subscribeForm.start_date}
              onChange={(d) => setSubscribeForm((f) => ({ ...f, start_date: d }))} />
          )}
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

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card, DataTable, Badge, Button, IconButton, Dropdown, FilterBar, Pagination, RefreshButton,
  Modal, Input, Textarea, Select, MoneyInput, Switch, Alert, Spinner, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { gymMoney, gymPlanStatusMeta, gymPlanDurationLabel, GYM_PLAN_DURATION_PRESETS, GYM_PLAN_STATUS } from '../lib/gymLabels.js';
import s from './screens.module.css';
import gl from './GymLists.module.css';

const EMPTY = { items: [], pagination: null };

const STATUS_OPTIONS = [
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' },
];

const emptyForm = {
  name: '', description: '', price: '', durationPreset: '30', durationDays: '30',
  grace_period_days: '3', allows_pause: false, item_id: '',
};

// Catálogo de planes de membresía del gimnasio (mensual, trimestral, anual, promos). El estado se
// desactiva, nunca se borra: las suscripciones ya emitidas conservan un snapshot del plan.
export function GymPlans() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (next = {}, nextPage = 1) => {
    const q = {};
    const st = 'status' in next ? next.status : status;
    if (st) q.status = st;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const fetcher = React.useCallback(() => api.gymPlans({ status, page }), [status, page]);
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, [status, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  // Items tipo SERVICE del catálogo de productos, para el item de facturación del plan.
  const { data: serviceItems } = useResource(React.useCallback(() => api.gymServiceItems(), []), [], []);
  const itemOptions = React.useMemo(
    () => (serviceItems || []).map((it) => ({ value: String(it.id), label: `${it.name} · ${gymMoney(it.price)}` })),
    [serviceItems],
  );

  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  const openNew = () => { setForm({ ...emptyForm }); setFormError(''); };
  const openEdit = (plan) => {
    setForm({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      durationPreset: GYM_PLAN_DURATION_PRESETS.some((p) => p.value === String(plan.duration_days)) ? String(plan.duration_days) : 'custom',
      durationDays: String(plan.duration_days),
      grace_period_days: String(plan.grace_period_days),
      allows_pause: !!plan.allows_pause,
      item_id: String(plan.item_id || ''),
    });
    setFormError('');
  };

  const setDurationPreset = (value) => {
    setForm((f) => ({ ...f, durationPreset: value, durationDays: value === 'custom' ? f.durationDays : value }));
  };

  const save = async () => {
    if (saving) return;
    const durationDays = Number(form.durationDays);
    if (!form.name.trim() || form.price === '' || !durationDays) {
      setFormError('Completa nombre, precio y duración.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: form.price,
        duration_days: durationDays,
        grace_period_days: Number(form.grace_period_days) || 0,
        allows_pause: form.allows_pause,
        item_id: form.item_id ? Number(form.item_id) : null,
      };
      if (form.id) {
        await api.updateGymPlan(form.id, payload);
        toast({ tone: 'success', title: 'Plan actualizado' });
      } else {
        await api.createGymPlan(payload);
        toast({ tone: 'success', title: 'Plan creado' });
      }
      setForm(null);
      reload();
    } catch (e) {
      setFormError(e?.message || 'No se pudo guardar el plan.');
    } finally {
      setSaving(false);
    }
  };

  const [statusBusyId, setStatusBusyId] = React.useState(null);
  const [statusError, setStatusError] = React.useState('');
  const toggleStatus = async (plan) => {
    if (statusBusyId) return;
    const next = Number(plan.status) === GYM_PLAN_STATUS.ACTIVE ? GYM_PLAN_STATUS.INACTIVE : GYM_PLAN_STATUS.ACTIVE;
    setStatusBusyId(plan.id);
    setStatusError('');
    try {
      await api.setGymPlanStatus(plan.id, next);
      toast({ tone: 'neutral', title: next === GYM_PLAN_STATUS.ACTIVE ? 'Plan activado' : 'Plan desactivado' });
      reload();
    } catch (e) {
      setStatusError(e?.message || 'No se pudo cambiar el estado del plan.');
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns = [
    { key: 'name', header: 'Plan', ellipsis: true, render: (r) => <span className={s.cellStrong}>{r.name}</span> },
    { key: 'duration_days', header: 'Duración', width: 160, render: (r) => gymPlanDurationLabel(r.duration_days) },
    { key: 'grace_period_days', header: 'Gracia', width: 100, render: (r) => `${r.grace_period_days} día${Number(r.grace_period_days) === 1 ? '' : 's'}` },
    { key: 'price', header: 'Precio', width: 130, align: 'right', render: (r) => <span className={s.priceCell}>{gymMoney(r.price)}</span> },
    {
      key: 'status', header: 'Estado', width: 120,
      render: (r) => {
        const m = gymPlanStatusMeta(r.status);
        return <Badge variant={m.variant} dot>{m.label}</Badge>;
      },
    },
    {
      key: 'actions', header: '', width: 90,
      render: (r) => (
        <Button variant="outline-primary" size="sm" loading={statusBusyId === r.id}
          onClick={(e) => { e.stopPropagation(); toggleStatus(r); }}>
          {Number(r.status) === GYM_PLAN_STATUS.ACTIVE ? 'Desactivar' : 'Activar'}
        </Button>
      ),
    },
  ];

  const filterDefs = [
    { key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-circle-check', options: STATUS_OPTIONS },
  ];

  return (
    <div className={s.page}>
      <FilterBar
        filters={filterDefs}
        values={{ status }}
        onChange={(next) => setQuery({ status: next.status })}
        inlineThreshold={0}
        resultCount={pg?.total}
        actions={
          <>
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin planes' : `${pg.total} plan${pg.total === 1 ? '' : 'es'}`}
              </p>
            )}
            <RefreshButton loading={loading} onClick={reload} />
            <Button variant="primary" size="sm" icon="fas fa-plus" onClick={openNew}>
              Nuevo plan
            </Button>
          </>
        }
      />

      {statusError && <Alert tone="danger" title="No se pudo cambiar el estado" onClose={() => setStatusError('')}>{statusError}</Alert>}

      <div className={s.desktopList}>
        <Card>
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            error={error}
            empty="No hay planes registrados."
            onRowClick={openEdit}
          />
        </Card>
      </div>

      <div className={s.mobileList}>
        {loading && <Card><div className={s.mobileState}><Spinner size="sm" label="Cargando…" /></div></Card>}
        {!loading && error && (
          <Card><Alert tone="danger" title="No se pudieron cargar los planes">{error}</Alert></Card>
        )}
        {!loading && !error && rows.length === 0 && (
          <Card><div className={s.mobileState}>No hay planes registrados.</div></Card>
        )}
        {!loading && !error && rows.map((r) => {
          const m = gymPlanStatusMeta(r.status);
          return (
            <Card key={r.id} className={gl.cardPad}>
              {/* Tocar la tarjeta abre el editor, así que "Editar" no necesita botón propio:
                  el pie a lo ancho se cambia por el menú ⋮ con lo que no es tocar la fila. */}
              <div className={gl.row}>
                <button type="button" className={gl.tapArea} onClick={() => openEdit(r)}>
                  <div className={gl.info}>
                    <span className={gl.name}>{r.name}</span>
                    <span className={gl.metaRow}>
                      <Badge variant={m.variant} dot>{m.label}</Badge>
                      <span className={gl.meta}>{gymPlanDurationLabel(r.duration_days)} · {gymMoney(r.price)}</span>
                    </span>
                  </div>
                </button>
                <Dropdown
                  trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Más acciones" />}
                  items={[
                    { label: 'Editar plan', icon: 'fas fa-pen', onClick: () => openEdit(r) },
                    {
                      label: Number(r.status) === GYM_PLAN_STATUS.ACTIVE ? 'Desactivar' : 'Activar',
                      icon: Number(r.status) === GYM_PLAN_STATUS.ACTIVE ? 'fas fa-toggle-off' : 'fas fa-toggle-on',
                      disabled: statusBusyId === r.id,
                      onClick: () => toggleStatus(r),
                    },
                  ]}
                />
              </div>

            </Card>
          );
        })}
      </div>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}

      <Modal open={!!form} title={form?.id ? 'Editar plan' : 'Nuevo plan'} onClose={() => setForm(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Guardar</Button>
        </>}>
        {form && (
          <div className={s.formCol}>
            <Input label="Nombre del plan" icon="fas fa-id-card" placeholder="Ej. Plan mensual"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className={s.formGrid}>
              <MoneyInput label="Precio" icon="fas fa-dollar-sign"
                value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
              <Select label="Duración" icon="fas fa-calendar" value={form.durationPreset}
                onChange={(e) => setDurationPreset(e.target.value)} options={GYM_PLAN_DURATION_PRESETS} />
            </div>
            {form.durationPreset === 'custom' && (
              <Input label="Duración en días" type="number" min="1" icon="fas fa-calendar-day"
                value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
            )}
            <div className={s.formGrid}>
              <Input label="Días de gracia" type="number" min="0" icon="fas fa-hourglass-half"
                hint="Días de acceso tras vencer, antes de marcar la suscripción como vencida."
                value={form.grace_period_days} onChange={(e) => setForm({ ...form, grace_period_days: e.target.value })} />
              <Select label="Item de facturación" icon="fas fa-receipt"
                value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })}
                options={[{ value: '', label: itemOptions.length ? 'Selecciona…' : 'No hay items de servicio activos' }, ...itemOptions]} />
            </div>
            <p className={s.faint}>Cada pago de una suscripción de este plan se factura con este item de servicio del catálogo de productos.</p>
            <Switch label="Permite pausar la suscripción" checked={form.allows_pause}
              onChange={(e) => setForm({ ...form, allows_pause: e.target.checked })} />
            <Textarea label="Descripción" placeholder="Opcional"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {formError && <Alert tone="danger" onClose={() => setFormError('')}>{formError}</Alert>}
          </div>
        )}
      </Modal>
    </div>
  );
}

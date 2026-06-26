import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, IconButton, Input, Select, Switch, Spinner, MapPickerModal } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';
import t from './StoreDetail.module.css';

// Orden de presentación de los días (el catálogo viene 0=Domingo … 6=Sábado, 7=Festivos).
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0, 7];
const STATUS_ACTIVE = 1;

const hhmm = (time) => (time ? String(time).slice(0, 5) : '');

// Agrupa los horarios planos ([{day_id, start_time, end_time}]) en { day_id: [{start, end}] }.
function schedulesToByDay(schedules = []) {
  const byDay = {};
  schedules.forEach((sc) => {
    const day = Number(sc.day_id);
    (byDay[day] = byDay[day] || []).push({ start: hhmm(sc.start_time), end: hhmm(sc.end_time) });
  });
  return byDay;
}

export function StoreDetail() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!storeId;

  const storeFetcher = React.useCallback(() => (isEdit ? api.store(storeId) : Promise.resolve(null)), [storeId, isEdit]);
  const { data: store, loading, error } = useResource(storeFetcher, null, [storeId]);
  const { data: catalogs } = useResource(React.useCallback(() => api.storeCatalogs(), []), null, []);

  const statuses = catalogs?.statuses || [];
  const types = catalogs?.types || [];
  const days = React.useMemo(() => {
    const byId = new Map((catalogs?.days || []).map((d) => [d.id, d]));
    return DAY_ORDER.map((id) => byId.get(id)).filter(Boolean);
  }, [catalogs]);

  const [form, setForm] = React.useState({
    name: '', address: '', phone_number: '', phone_code: '57',
    store_status_id: STATUS_ACTIVE, store_type_id: '', latitude: null, longitude: null,
  });
  const [byDay, setByDay] = React.useState({});
  const [mapOpen, setMapOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  React.useEffect(() => {
    if (!isEdit || !store) return;
    setForm({
      name: store.name || '',
      address: store.address || '',
      phone_number: store.phone_number || '',
      phone_code: store.phone_code || '57',
      store_status_id: store.store_status_id || STATUS_ACTIVE,
      store_type_id: store.store_type_id || '',
      latitude: store.latitude ?? null,
      longitude: store.longitude ?? null,
    });
    setByDay(schedulesToByDay(store.schedules));
  }, [store, isEdit]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const ranges = (day) => byDay[day] || [];
  const setDayOpen = (day, open) =>
    setByDay((bd) => ({ ...bd, [day]: open ? (ranges(day).length ? ranges(day) : [{ start: '09:00', end: '18:00' }]) : [] }));
  const addRange = (day) =>
    setByDay((bd) => ({ ...bd, [day]: [...ranges(day), { start: '09:00', end: '18:00' }] }));
  const removeRange = (day, idx) =>
    setByDay((bd) => ({ ...bd, [day]: ranges(day).filter((_, i) => i !== idx) }));
  const setRange = (day, idx, key, value) =>
    setByDay((bd) => ({ ...bd, [day]: ranges(day).map((r, i) => i === idx ? { ...r, [key]: value } : r) }));
  const copyToAll = (day) =>
    setByDay(() => {
      const src = ranges(day).map((r) => ({ ...r }));
      const next = {};
      days.forEach((d) => { next[d.id] = src.map((r) => ({ ...r })); });
      return next;
    });

  const onMapSelect = ({ lat, lng, address }) =>
    setForm((f) => ({ ...f, latitude: lat, longitude: lng, address: address || f.address }));

  const buildSchedules = () => {
    const out = [];
    days.forEach((d) => {
      ranges(d.id).forEach((r) => {
        if (r.start && r.end) out.push({ day_id: d.id, start_time: r.start, end_time: r.end });
      });
    });
    return out;
  };

  const validate = () => {
    if (!form.name.trim()) return 'El nombre de la tienda es obligatorio.';
    for (const d of days) {
      for (const r of ranges(d.id)) {
        if (!r.start || !r.end) return `Completa las horas de ${d.name}.`;
        if (r.start >= r.end) return `En ${d.name}, la apertura debe ser anterior al cierre.`;
      }
    }
    return '';
  };

  const save = async () => {
    const msg = validate();
    if (msg) { setFormError(msg); return; }
    setFormError('');
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      address: form.address?.trim() || '',
      phone_code: form.phone_code || '57',
      phone_number: form.phone_number?.trim() || '',
      store_status_id: Number(form.store_status_id) || STATUS_ACTIVE,
      store_type_id: form.store_type_id ? Number(form.store_type_id) : null,
      latitude: form.latitude,
      longitude: form.longitude,
      schedules: buildSchedules(),
    };
    try {
      if (isEdit) await api.updateStore(storeId, payload);
      else await api.createStore(payload);
      navigate('/stores');
    } catch (err) {
      setFormError(err?.message || 'No se pudo guardar la tienda.');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) return <Spinner center label="Cargando tienda…" />;
  if (isEdit && error) return <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>;

  const hasLocation = form.latitude != null && form.longitude != null;

  return (
    <div className={s.page}>
      <button type="button" className={t.backLink} onClick={() => navigate('/stores')}>
        <i className="fas fa-arrow-left" /> Tiendas
      </button>

      <div className={s.toolbar}>
        <h2 className={t.title}>{isEdit ? (form.name || 'Editar tienda') : 'Nueva tienda'}</h2>
        <div className={s.spacer} />
        <Button variant="primary" icon="fas fa-check" loading={saving} onClick={save}>Guardar</Button>
      </div>

      {formError && <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {formError}</div>}

      <div className={t.layout}>
        <section className={t.card}>
          <h3 className={t.cardTitle}>Datos de la tienda</h3>
          <div className={s.formCol}>
            <Input label="Nombre" icon="fas fa-store" placeholder="Ej. Sede Centro"
              value={form.name} onChange={setField('name')} />
            <Input label="Dirección" icon="fas fa-location-dot" placeholder="Ej. Cra. 43 #12-30"
              value={form.address} onChange={setField('address')} />
            <Input label="Teléfono" icon="fas fa-phone" placeholder="Ej. 3201112233"
              value={form.phone_number} onChange={setField('phone_number')} />
            <Select label="Estado" icon="fas fa-circle-dot"
              value={form.store_status_id} onChange={setField('store_status_id')}
              options={statuses.map((st) => ({ value: st.id, label: st.name }))} />
            <Select label="Tipo de tienda" icon="fas fa-tag"
              value={form.store_type_id} onChange={setField('store_type_id')}
              options={[{ value: '', label: 'Sin especificar' }, ...types.map((ty) => ({ value: ty.id, label: ty.name }))]} />
          </div>

          <div className={t.locationBox}>
            <div>
              <div className={t.locLabel}>Ubicación GPS</div>
              {hasLocation
                ? <div className={t.locValue}><i className="fas fa-map-pin" /> {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}</div>
                : <div className={t.locHint}>Sin ubicación fijada.</div>}
            </div>
            <Button variant="secondary" size="sm" icon="fas fa-map-location-dot" onClick={() => setMapOpen(true)}>
              {hasLocation ? 'Cambiar' : 'Ubicar en mapa'}
            </Button>
          </div>
        </section>

        <section className={t.card}>
          <h3 className={t.cardTitle}>Horario de atención</h3>
          <div className={t.days}>
            {days.map((d) => {
              const list = ranges(d.id);
              const open = list.length > 0;
              return (
                <div key={d.id} className={t.day}>
                  <div className={t.dayHead}>
                    <Switch label={d.name} checked={open} onChange={() => setDayOpen(d.id, !open)} />
                    {open
                      ? (
                        <div className={t.dayActions}>
                          <button type="button" className={t.smallLink} onClick={() => addRange(d.id)}>
                            <i className="fas fa-plus" /> Rango
                          </button>
                          <button type="button" className={t.smallLink} onClick={() => copyToAll(d.id)} title="Aplicar este horario a todos los días">
                            <i className="fas fa-copy" /> A todos
                          </button>
                        </div>
                      )
                      : <span className={t.closedTag}>Cerrado</span>}
                  </div>

                  {open && (
                    <div className={t.ranges}>
                      {list.map((r, idx) => (
                        <div key={idx} className={t.range}>
                          <input type="time" className={t.time} value={r.start}
                            onChange={(e) => setRange(d.id, idx, 'start', e.target.value)} />
                          <span className={t.dash}>a</span>
                          <input type="time" className={t.time} value={r.end}
                            onChange={(e) => setRange(d.id, idx, 'end', e.target.value)} />
                          <IconButton icon="fas fa-trash" variant="ghost" size="sm" title="Quitar rango"
                            onClick={() => removeRange(d.id, idx)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <MapPickerModal
        open={mapOpen}
        lat={form.latitude}
        lng={form.longitude}
        onClose={() => setMapOpen(false)}
        onSelect={onMapSelect}
      />
    </div>
  );
}

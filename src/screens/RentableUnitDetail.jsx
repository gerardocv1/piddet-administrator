import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Card, Button, IconButton, Input, Select, Textarea, MoneyInput, Switch, Spinner, Modal, Alert, useToast, MultiImageUpload, PageHeader,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { reservationMoney } from '../lib/reservationLabels.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import t from './RentableUnitDetail.module.css';

const emptyForm = {
  name: '', rentable_unit_type_id: '', capacity: 1, included_guests: 1, extra_guest_item_id: '', base_price_per_night: '', item_id: '', description: '',
  check_in_time: '15:00', check_out_time: '12:00',
};

// Detalle de una unidad reservable: crear (/rentable-units/new) o administrar (/rentable-units/:id).
// En creación captura datos base + fotos generales + espacios (nombre/descripción). En edición
// permite actualizar los datos, alternar el estado (reservable/inactiva), administrar las fotos
// (generales y por espacio, con borrado en S3) y el CRUD de espacios.
export function RentableUnitDetail() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const isEdit = !!unitId;

  const unitFetcher = React.useCallback(
    () => (isEdit ? api.rentableUnit(unitId) : Promise.resolve(null)),
    [unitId, isEdit],
  );
  const { data, setData, loading, error, reload } = useResource(unitFetcher, null, [unitId]);
  const { data: types } = useResource(React.useCallback(() => api.rentableUnitTypes(), []), [], []);
  const typeOptions = React.useMemo(
    () => (types || []).map((ty) => ({ value: String(ty.id), label: ty.name })),
    [types],
  );
  // Item tipo servicio del catálogo con el que se factura el hospedaje en el checkout.
  const { data: serviceItems } = useResource(React.useCallback(() => api.serviceItems(), []), [], []);
  const itemOptions = React.useMemo(
    () => (serviceItems || []).map((it) => ({ value: String(it.id), label: `${it.name} · ${reservationMoney(it.price)}` })),
    [serviceItems],
  );

  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useSetPageTitle(isEdit ? (data?.name || null) : 'Nueva unidad');

  // Creación: fotos generales y espacios locales (los espacios se envían con el POST).
  const generalPhotosRef = React.useRef(null);
  const [newSpaces, setNewSpaces] = React.useState([]);
  const [newInclusions, setNewInclusions] = React.useState([]);

  React.useEffect(() => {
    if (!isEdit || !data) return;
    setForm({
      name: data.name || '',
      rentable_unit_type_id: String(data.rentable_unit_type_id || ''),
      capacity: data.capacity ?? 1,
      included_guests: data.included_guests ?? 1,
      extra_guest_item_id: String(data.extra_guest_item_id || ''),
      base_price_per_night: data.base_price_per_night ?? '',
      item_id: String(data.item_id || ''),
      description: data.description || '',
      check_in_time: data.check_in_time || '15:00',
      check_out_time: data.check_out_time || '12:00',
    });
  }, [data, isEdit]);

  const goBack = () => navigate(`/rentable-units${params.toString() ? `?${params.toString()}` : ''}`);

  // ── Creación ──────────────────────────────────────────────────────────
  const create = async () => {
    if (saving) return;
    setFormError('');
    if (!form.name.trim() || !form.rentable_unit_type_id || form.base_price_per_night === '' || !form.item_id) {
      setFormError('Completa nombre, tipo, tarifa por noche e item de facturación.');
      return;
    }
    setSaving(true);
    try {
      const files = await generalPhotosRef.current?.uploadAll() ?? [];
      const payload = {
        name: form.name.trim(),
        rentable_unit_type_id: Number(form.rentable_unit_type_id),
        capacity: Number(form.capacity) || 1,
        included_guests: Math.min(Number(form.included_guests) || 1, Number(form.capacity) || 1),
        extra_guest_item_id: form.extra_guest_item_id ? Number(form.extra_guest_item_id) : null,
        base_price_per_night: form.base_price_per_night,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
        item_id: Number(form.item_id),
        description: form.description.trim() || null,
        files,
        spaces: newSpaces
          .filter((sp) => sp.name.trim())
          .map((sp) => ({ name: sp.name.trim(), description: sp.description.trim() || null })),
        inclusions: newInclusions
          .filter((inc) => inc.name.trim())
          .map((inc) => ({ name: inc.name.trim(), description: inc.description.trim() || null })),
      };
      const created = await api.createRentableUnit(payload);
      toast({ tone: 'success', title: 'Unidad creada' });
      navigate(`/rentable-units/${created.id}`);
    } catch (e) {
      setFormError(e?.message || 'No se pudo crear la unidad.');
    } finally {
      setSaving(false);
    }
  };

  // ── Edición de datos base ────────────────────────────────────────────
  const save = async () => {
    if (saving) return;
    setFormError('');
    if (!form.name.trim() || !form.rentable_unit_type_id || form.base_price_per_night === '' || !form.item_id) {
      setFormError('Completa nombre, tipo, tarifa por noche e item de facturación.');
      return;
    }
    setSaving(true);
    try {
      setData(await api.updateRentableUnit(unitId, {
        name: form.name.trim(),
        rentable_unit_type_id: Number(form.rentable_unit_type_id),
        capacity: Number(form.capacity) || 1,
        included_guests: Math.min(Number(form.included_guests) || 1, Number(form.capacity) || 1),
        extra_guest_item_id: form.extra_guest_item_id ? Number(form.extra_guest_item_id) : null,
        base_price_per_night: form.base_price_per_night,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
        item_id: Number(form.item_id),
        description: form.description.trim() || null,
      }));
      toast({ tone: 'success', title: 'Unidad guardada' });
    } catch (e) {
      setFormError(e?.message || 'No se pudo guardar la unidad.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    const next = Number(data.status) === 1 ? 0 : 1;
    setData(await api.setRentableUnitStatus(unitId, next));
    // Desactivar es lo que quita la unidad de la operación: va en tono neutro.
    toast(next === 1
      ? { tone: 'success', title: 'Unidad activada' }
      : { tone: 'neutral', title: 'Unidad desactivada' });
  };

  if (isEdit && loading) return <Spinner center label="Cargando unidad…" />;
  if (isEdit && (error || !data)) {
    return (
      <div className={s.page}>
        <Alert tone="danger" title="No se pudo abrir la unidad">{error || 'No se encontró la unidad.'}</Alert>
      </div>
    );
  }

  const active = isEdit && Number(data.status) === 1;
  const generalFiles = isEdit ? (data.files || []) : [];
  const spaces = isEdit ? (data.spaces || []) : [];

  return (
    <div className={s.page}>
      <PageHeader
        onBack={goBack}
        title={isEdit ? (data.type_name || 'Unidad reservable') : 'Nueva unidad'}
        subtitle={isEdit ? null : 'Registra una cabaña, habitación o lugar para reservar.'}
        action={isEdit ? <Switch checked={active} onChange={toggleStatus} label="Reservable" /> : null}
        menu={isEdit ? [
          { label: 'Actualizar', icon: 'fas fa-rotate-right', disabled: loading, onClick: reload },
        ] : []}
      />

      <div className={t.grid}>
        <Card>
          <Card.Header title="Datos de la unidad" />
          <Card.Body>
            <div className={s.formCol}>
              <Input label="Nombre" icon="fas fa-tag" placeholder="Ej. Cabaña El Roble"
                value={form.name} onChange={(e) => set('name', e.target.value)} />
              <Select label="Tipo" icon="fas fa-house-chimney"
                value={form.rentable_unit_type_id} onChange={(e) => set('rentable_unit_type_id', e.target.value)}
                options={[{ value: '', label: 'Selecciona…' }, ...typeOptions]} />
              <div className={s.formGrid}>
                <Input label="Capacidad máxima (personas)" icon="fas fa-users" type="number" min="1"
                  value={form.capacity} onChange={(e) => set('capacity', e.target.value)} />
                <Input label="Personas incluidas" icon="fas fa-user-check" type="number" min="1" max={form.capacity || undefined}
                  value={form.included_guests} onChange={(e) => set('included_guests', e.target.value)} />
              </div>
              <p className={s.faint}>Las personas incluidas van en la tarifa base; las que superen (hasta el máximo) se cobran como adicionales.</p>
              <Select label="Item de persona adicional" icon="fas fa-user-plus"
                value={form.extra_guest_item_id} onChange={(e) => set('extra_guest_item_id', e.target.value)}
                options={[{ value: '', label: 'Sin cobro de adicionales' }, ...itemOptions]} />
              <p className={s.faint}>
                Se cobra <strong>por cada persona sobre las incluidas y por cada noche</strong>. La reserva
                agrega y recalcula esta línea sola. Si lo dejas vacío, la unidad no cobra adicionales y la
                reserva lo advierte al superar las incluidas.
              </p>
              <MoneyInput label="Tarifa por noche" icon="fas fa-dollar-sign" placeholder="0"
                value={form.base_price_per_night} onChange={(v) => set('base_price_per_night', v)} />
              <div className={s.formGrid}>
                <Input label="Hora de ingreso" icon="fas fa-right-to-bracket" type="time"
                  value={form.check_in_time} onChange={(e) => set('check_in_time', e.target.value)} />
                <Input label="Hora de salida" icon="fas fa-right-from-bracket" type="time"
                  value={form.check_out_time} onChange={(e) => set('check_out_time', e.target.value)} />
              </div>
              <p className={s.faint}>El huésped ve estos horarios en su pre-check-in.</p>
              <Select label="Item de facturación" icon="fas fa-receipt"
                value={form.item_id} onChange={(e) => set('item_id', e.target.value)}
                options={[{ value: '', label: itemOptions.length ? 'Selecciona…' : 'No hay items de servicio activos' }, ...itemOptions]} />
              <p className={s.faint}>El hospedaje se factura en el checkout con este item de servicio del catálogo de productos.</p>
              <Textarea label="Descripción" placeholder="Descripción comercial de la unidad (opcional)"
                value={form.description} onChange={(e) => set('description', e.target.value)} />
              {formError && <Alert tone="danger" onClose={() => setFormError('')}>{formError}</Alert>}
              <div className={t.formActions}>
                {isEdit
                  ? <Button variant="primary" icon="fas fa-check" loading={saving} onClick={save}>Guardar cambios</Button>
                  : <Button variant="primary" icon="fas fa-check" loading={saving} onClick={create}>Crear unidad</Button>}
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header title="Fotos de la unidad" />
          <Card.Body>
            {isEdit ? (
              <PhotoGallery
                files={generalFiles}
                folder="rentable-units"
                onAdd={async (names) => setData(await api.attachRentableUnitFiles(unitId, names, null))}
                onRemove={async (name) => setData(await api.detachRentableUnitFile(unitId, name))}
              />
            ) : (
              <MultiImageUpload ref={generalPhotosRef} folder="rentable-units" visibility="public"
                max={20} hint="Opcional · fotos generales de la unidad (JPG, PNG o WEBP)" />
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Lo que incluye la tarifa: lo ve el huésped en la página pública de la unidad. */}
      {isEdit ? (
        <InclusionsEditor unit={data} onChange={setData} />
      ) : (
        <NewInclusions inclusions={newInclusions} onChange={setNewInclusions} />
      )}

      {/* Espacios (composición interna). En creación son locales; en edición se administran vía API. */}
      {isEdit ? (
        <SpacesEditor unit={data} onChange={setData} />
      ) : (
        <NewSpaces spaces={newSpaces} onChange={setNewSpaces} />
      )}
    </div>
  );
}

// ── Galería reutilizable: fotos existentes (con quitar) + MultiImageUpload para agregar ──
function PhotoGallery({ files, folder, onAdd, onRemove }) {
  const { toast } = useToast();
  const ref = React.useRef(null);
  const [count, setCount] = React.useState(0);
  const [uploadKey, setUploadKey] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [delName, setDelName] = React.useState(null);
  const [err, setErr] = React.useState(null);

  const visible = (files || []).filter((f) => f.url);

  const add = async () => {
    if (saving) return;
    setSaving(true); setErr(null);
    try {
      const names = await ref.current?.uploadAll() ?? [];
      if (names.length) await onAdd(names);
      setCount(0);
      setUploadKey((k) => k + 1);
      if (names.length) toast({ tone: 'success', title: names.length === 1 ? 'Foto guardada' : 'Fotos guardadas' });
    } catch (e) {
      setErr(e?.message || 'No se pudieron guardar las fotos.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (saving) return;
    setSaving(true); setErr(null);
    try {
      await onRemove(delName);
      setDelName(null);
      toast({ tone: 'neutral', title: 'Foto eliminada' });
    } catch (e) {
      setErr(e?.message || 'No se pudo eliminar la foto.');
    } finally {
      setSaving(false);
    }
  };

  const tiles = visible.map((f) => (
    <div key={f.name} className={t.photoWrap}>
      <a className={t.photo} href={f.url} target="_blank" rel="noreferrer" title="Ver original">
        <img src={f.thumbnail_url || f.url} alt="Foto de la unidad" />
      </a>
      <button type="button" className={t.photoRemove} onClick={() => setDelName(f.name)}
        aria-label="Quitar foto" title="Quitar foto">
        <i className="fas fa-times" />
      </button>
    </div>
  ));

  return (
    <div className={t.photoUpload}>
      <MultiImageUpload key={uploadKey} ref={ref} folder={folder} visibility="public"
        max={20 - visible.length} onChange={setCount} leading={tiles}
        hint="Agrega fotos · usa ⟳ si quedaron de lado" />
      {count > 0 && (
        <Button variant="primary" size="sm" icon="fas fa-check" loading={saving} onClick={add}>
          Guardar foto{count === 1 ? '' : 's'}
        </Button>
      )}
      {err && <Alert tone="danger">{err}</Alert>}

      <Modal open={!!delName} size="sm" title="Quitar foto" onClose={() => setDelName(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelName(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={remove}>Quitar</Button>
        </>}>
        ¿Seguro que deseas quitar esta foto? Se borra definitivamente (también del almacenamiento).
      </Modal>
    </div>
  );
}

// ── Inclusiones locales (modo creación) ───────────────────────────────────
function NewInclusions({ inclusions, onChange }) {
  const add = () => onChange([...inclusions, { key: Date.now(), name: '', description: '' }]);
  const setField = (key, field, value) =>
    onChange(inclusions.map((inc) => (inc.key === key ? { ...inc, [field]: value } : inc)));
  const remove = (key) => onChange(inclusions.filter((inc) => inc.key !== key));

  return (
    <Card>
      <Card.Header title="Qué incluye la tarifa" action={
        <Button variant="secondary" size="sm" icon="fas fa-plus" onClick={add}>Agregar</Button>
      } />
      <Card.Body>
        {inclusions.length === 0 ? (
          <p className={s.faint}>Sin inclusiones. Agrega lo que cubre el precio de la noche
            (desayuno, fogata, ingreso al sitio, piscina…); el huésped las ve en la página pública.</p>
        ) : (
          <div className={t.spaceList}>
            {inclusions.map((inc) => (
              <div key={inc.key} className={t.spaceRow}>
                <Input label="Qué incluye" placeholder="Ej. Desayuno"
                  value={inc.name} onChange={(e) => setField(inc.key, 'name', e.target.value)} />
                <Input label="Detalle" placeholder="Ej. Tipo americano, servido de 7 a 10 a. m."
                  value={inc.description} onChange={(e) => setField(inc.key, 'description', e.target.value)} />
                <div className={t.spaceRemove}>
                  <IconButton icon="fas fa-trash" variant="light" title="Quitar"
                    onClick={() => remove(inc.key)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

// ── Inclusiones administradas vía API (modo edición) ──────────────────────
function InclusionsEditor({ unit, onChange }) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(null); // { id?, name, description }
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [delInclusion, setDelInclusion] = React.useState(null);

  const inclusions = unit.inclusions || [];

  const submit = async () => {
    if (saving || !editing.name.trim()) return;
    setSaving(true); setErr(null);
    try {
      const payload = { name: editing.name.trim(), description: editing.description.trim() || null };
      const isNew = !editing.id;
      onChange(editing.id
        ? await api.updateRentableUnitInclusion(unit.id, editing.id, payload)
        : await api.createRentableUnitInclusion(unit.id, payload));
      setEditing(null);
      toast({ tone: 'success', title: isNew ? 'Inclusión agregada' : 'Inclusión guardada' });
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true); setErr(null);
    try {
      onChange(await api.deleteRentableUnitInclusion(unit.id, delInclusion.id));
      setDelInclusion(null);
      toast({ tone: 'neutral', title: 'Inclusión eliminada' });
    } catch (e) {
      setErr(e?.message || 'No se pudo eliminar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Card.Header title="Qué incluye la tarifa" action={
        <Button variant="secondary" size="sm" icon="fas fa-plus"
          onClick={() => setEditing({ name: '', description: '' })}>Agregar</Button>
      } />
      <Card.Body>
        {inclusions.length === 0 ? (
          <p className={s.faint}>Sin inclusiones. Agrega lo que cubre el precio de la noche
            (desayuno, fogata, ingreso al sitio, piscina…); el huésped las ve en la página pública.</p>
        ) : (
          <div className={t.inclusionList}>
            {inclusions.map((inc) => (
              <div key={inc.id} className={t.inclusionRow}>
                <div className={t.inclusionInfo}>
                  <h4 className={t.spaceName}>{inc.name}</h4>
                  {inc.description && <p className={t.spaceDesc}>{inc.description}</p>}
                </div>
                <div className={t.spaceActions}>
                  <IconButton icon="fas fa-pen" variant="light" title="Editar"
                    onClick={() => setEditing({ id: inc.id, name: inc.name, description: inc.description || '' })} />
                  <IconButton icon="fas fa-trash" variant="light" title="Eliminar"
                    onClick={() => setDelInclusion(inc)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>

      <Modal open={!!editing} size="sm" title={editing?.id ? 'Editar inclusión' : 'Agregar inclusión'}
        onClose={() => setEditing(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-check" loading={saving} onClick={submit}>Guardar</Button>
        </>}>
        {editing && (
          <div className={s.formCol}>
            <Input label="Qué incluye" placeholder="Ej. Desayuno"
              value={editing.name} onChange={(e) => setEditing((ed) => ({ ...ed, name: e.target.value }))} />
            <Input label="Detalle" placeholder="Ej. Tipo americano, servido de 7 a 10 a. m."
              value={editing.description} onChange={(e) => setEditing((ed) => ({ ...ed, description: e.target.value }))} />
            {err && <Alert tone="danger">{err}</Alert>}
          </div>
        )}
      </Modal>

      <Modal open={!!delInclusion} size="sm" title="Eliminar inclusión" onClose={() => setDelInclusion(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelInclusion(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={remove}>Eliminar</Button>
        </>}>
        ¿Eliminar <strong>{delInclusion?.name}</strong> de lo que incluye la tarifa?
      </Modal>
    </Card>
  );
}

// ── Espacios locales (modo creación) ──────────────────────────────────────
function NewSpaces({ spaces, onChange }) {
  const add = () => onChange([...spaces, { key: Date.now(), name: '', description: '' }]);
  const setField = (key, field, value) =>
    onChange(spaces.map((sp) => (sp.key === key ? { ...sp, [field]: value } : sp)));
  const remove = (key) => onChange(spaces.filter((sp) => sp.key !== key));

  return (
    <Card>
      <Card.Header title="Espacios de la unidad" action={
        <Button variant="secondary" size="sm" icon="fas fa-plus" onClick={add}>Agregar espacio</Button>
      } />
      <Card.Body>
        {spaces.length === 0 ? (
          <p className={s.faint}>Sin espacios. Agrégalos aquí (habitación, sala, minibar…); podrás
            subir sus fotos después de crear la unidad.</p>
        ) : (
          <div className={t.spaceList}>
            {spaces.map((sp) => (
              <div key={sp.key} className={t.spaceRow}>
                <Input label="Nombre" placeholder="Ej. Habitación principal"
                  value={sp.name} onChange={(e) => setField(sp.key, 'name', e.target.value)} />
                <Input label="Descripción" placeholder="Ej. Cama queen, A/C"
                  value={sp.description} onChange={(e) => setField(sp.key, 'description', e.target.value)} />
                <div className={t.spaceRemove}>
                  <IconButton icon="fas fa-trash" variant="light" title="Quitar espacio"
                    onClick={() => remove(sp.key)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

// ── Espacios administrados vía API (modo edición) ─────────────────────────
function SpacesEditor({ unit, onChange }) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(null); // { id?, name, description }
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [delSpace, setDelSpace] = React.useState(null);

  const spaces = unit.spaces || [];

  const submit = async () => {
    if (saving || !editing.name.trim()) return;
    setSaving(true); setErr(null);
    try {
      const payload = { name: editing.name.trim(), description: editing.description.trim() || null };
      const isNew = !editing.id;
      const updated = editing.id
        ? await api.updateRentableUnitSpace(unit.id, editing.id, payload)
        : await api.createRentableUnitSpace(unit.id, payload);
      onChange(updated);
      setEditing(null);
      toast({ tone: 'success', title: isNew ? 'Espacio agregado' : 'Espacio guardado' });
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar el espacio.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true); setErr(null);
    try {
      onChange(await api.deleteRentableUnitSpace(unit.id, delSpace.id));
      setDelSpace(null);
      toast({ tone: 'neutral', title: 'Espacio eliminado' });
    } catch (e) {
      setErr(e?.message || 'No se pudo eliminar el espacio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Card.Header title="Espacios de la unidad" action={
        <Button variant="secondary" size="sm" icon="fas fa-plus"
          onClick={() => setEditing({ name: '', description: '' })}>Agregar espacio</Button>
      } />
      <Card.Body>
        {spaces.length === 0 ? (
          <p className={s.faint}>Sin espacios. Agrega la composición interna de la unidad.</p>
        ) : (
          <div className={t.spaces}>
            {spaces.map((sp) => (
              <div key={sp.id} className={t.space}>
                <div className={t.spaceHead}>
                  <div>
                    <h4 className={t.spaceName}>{sp.name}</h4>
                    {sp.description && <p className={t.spaceDesc}>{sp.description}</p>}
                  </div>
                  <div className={t.spaceActions}>
                    <IconButton icon="fas fa-pen" variant="light" title="Editar espacio"
                      onClick={() => setEditing({ id: sp.id, name: sp.name, description: sp.description || '' })} />
                    <IconButton icon="fas fa-trash" variant="light" title="Eliminar espacio"
                      onClick={() => setDelSpace(sp)} />
                  </div>
                </div>
                <PhotoGallery
                  files={sp.files || []}
                  folder="rentable-units"
                  onAdd={async (names) => onChange(await api.attachRentableUnitFiles(unit.id, names, sp.id))}
                  onRemove={async (name) => onChange(await api.detachRentableUnitFile(unit.id, name))}
                />
              </div>
            ))}
          </div>
        )}
      </Card.Body>

      <Modal open={!!editing} size="sm" title={editing?.id ? 'Editar espacio' : 'Agregar espacio'}
        onClose={() => setEditing(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-check" loading={saving} onClick={submit}>Guardar</Button>
        </>}>
        {editing && (
          <div className={s.formCol}>
            <Input label="Nombre" placeholder="Ej. Habitación principal"
              value={editing.name} onChange={(e) => setEditing((ed) => ({ ...ed, name: e.target.value }))} />
            <Input label="Descripción" placeholder="Ej. Cama queen, A/C, baño privado"
              value={editing.description} onChange={(e) => setEditing((ed) => ({ ...ed, description: e.target.value }))} />
            {err && <Alert tone="danger">{err}</Alert>}
          </div>
        )}
      </Modal>

      <Modal open={!!delSpace} size="sm" title="Eliminar espacio" onClose={() => setDelSpace(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelSpace(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={remove}>Eliminar</Button>
        </>}>
        ¿Eliminar el espacio <strong>{delSpace?.name}</strong>? Sus fotos también se borran del
        almacenamiento. Esta acción no se puede deshacer.
      </Modal>
    </Card>
  );
}

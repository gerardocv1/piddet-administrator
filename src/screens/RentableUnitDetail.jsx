import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Card, Badge, Button, IconButton, Input, Select, Textarea, MoneyInput, Switch, Spinner, Modal, MultiImageUpload,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { reservationMoney } from '../lib/reservationLabels.js';
import s from './screens.module.css';
import t from './RentableUnitDetail.module.css';

const emptyForm = {
  name: '', rentable_unit_type_id: '', capacity: 1, base_price_per_night: '', item_id: '', description: '',
};

// Detalle de una unidad reservable: crear (/rentable-units/new) o administrar (/rentable-units/:id).
// En creación captura datos base + fotos generales + espacios (nombre/descripción). En edición
// permite actualizar los datos, alternar el estado (reservable/inactiva), administrar las fotos
// (generales y por espacio, con borrado en S3) y el CRUD de espacios.
export function RentableUnitDetail() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isEdit = !!unitId;

  const unitFetcher = React.useCallback(
    () => (isEdit ? api.rentableUnit(unitId) : Promise.resolve(null)),
    [unitId, isEdit],
  );
  const { data, setData, loading, error } = useResource(unitFetcher, null, [unitId]);
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

  // Creación: fotos generales y espacios locales (los espacios se envían con el POST).
  const generalPhotosRef = React.useRef(null);
  const [newSpaces, setNewSpaces] = React.useState([]);

  React.useEffect(() => {
    if (!isEdit || !data) return;
    setForm({
      name: data.name || '',
      rentable_unit_type_id: String(data.rentable_unit_type_id || ''),
      capacity: data.capacity ?? 1,
      base_price_per_night: data.base_price_per_night ?? '',
      item_id: String(data.item_id || ''),
      description: data.description || '',
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
        base_price_per_night: form.base_price_per_night,
        item_id: Number(form.item_id),
        description: form.description.trim() || null,
        files,
        spaces: newSpaces
          .filter((sp) => sp.name.trim())
          .map((sp) => ({ name: sp.name.trim(), description: sp.description.trim() || null })),
      };
      const created = await api.createRentableUnit(payload);
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
        base_price_per_night: form.base_price_per_night,
        item_id: Number(form.item_id),
        description: form.description.trim() || null,
      }));
    } catch (e) {
      setFormError(e?.message || 'No se pudo guardar la unidad.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    const next = Number(data.status) === 1 ? 0 : 1;
    setData(await api.setRentableUnitStatus(unitId, next));
  };

  if (isEdit && loading) return <Spinner center label="Cargando unidad…" />;
  if (isEdit && (error || !data)) {
    return (
      <div className={s.page}>
        <div className={s.stateError}>
          <i className="fas fa-triangle-exclamation" /> {error || 'No se encontró la unidad.'}
        </div>
      </div>
    );
  }

  const active = isEdit && Number(data.status) === 1;
  const generalFiles = isEdit ? (data.files || []) : [];
  const spaces = isEdit ? (data.spaces || []) : [];

  return (
    <div className={s.page}>
      <div className={t.header}>
        <IconButton icon="fas fa-arrow-left" variant="light" title="Volver a unidades" onClick={goBack} />
        <div className={t.headText}>
          <h2 className={t.title}>{isEdit ? data.name : 'Nueva unidad'}</h2>
          <span className={s.muted}>
            {isEdit ? (data.type_name || 'Unidad reservable') : 'Registra una cabaña, habitación o lugar para reservar.'}
          </span>
        </div>
        {isEdit && (
          <div className={t.headActions}>
            <Badge variant={active ? 'success' : 'neutral'} dot>{active ? 'Reservable' : 'Inactiva'}</Badge>
            <Switch checked={active} onChange={toggleStatus} label="Reservable" />
          </div>
        )}
      </div>

      <div className={t.grid}>
        <Card>
          <Card.Header title="Datos de la unidad" />
          <Card.Body>
            <div className={s.formCol}>
              <Input label="Nombre" icon="fas fa-tag" placeholder="Ej. Cabaña El Roble"
                value={form.name} onChange={(e) => set('name', e.target.value)} />
              <div className={s.formGrid}>
                <Select label="Tipo" icon="fas fa-house-chimney"
                  value={form.rentable_unit_type_id} onChange={(e) => set('rentable_unit_type_id', e.target.value)}
                  options={[{ value: '', label: 'Selecciona…' }, ...typeOptions]} />
                <Input label="Capacidad (personas)" icon="fas fa-users" type="number" min="1"
                  value={form.capacity} onChange={(e) => set('capacity', e.target.value)} />
              </div>
              <MoneyInput label="Tarifa por noche" icon="fas fa-dollar-sign" placeholder="0"
                value={form.base_price_per_night} onChange={(v) => set('base_price_per_night', v)} />
              <Select label="Item de facturación" icon="fas fa-receipt"
                value={form.item_id} onChange={(e) => set('item_id', e.target.value)}
                options={[{ value: '', label: itemOptions.length ? 'Selecciona…' : 'No hay items de servicio activos' }, ...itemOptions]} />
              <p className={s.faint}>El hospedaje se factura en el checkout con este item de servicio del catálogo de productos.</p>
              <Textarea label="Descripción" placeholder="Descripción comercial de la unidad (opcional)"
                value={form.description} onChange={(e) => set('description', e.target.value)} />
              {formError && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {formError}</div>}
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
      {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}

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
      const updated = editing.id
        ? await api.updateRentableUnitSpace(unit.id, editing.id, payload)
        : await api.createRentableUnitSpace(unit.id, payload);
      onChange(updated);
      setEditing(null);
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
            {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
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

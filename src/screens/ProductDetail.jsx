import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, IconButton, Badge, Input, MoneyInput, Textarea, Switch, Modal, Spinner } from '../components';
import { SortableList, FileUpload } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { ItemFormModal } from './ItemFormModal.jsx';
import s from './screens.module.css';
import t from './ProductDetail.module.css';

const fmtPrice = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('es-CO'));
const extraPrice = (n) => (Number(n) > 0 ? '+' + fmtPrice(n) : 'Sin costo');

// Resumen legible de las reglas de selección de un grupo.
function rulesText(g) {
  const kind = g.multiple ? 'Selección múltiple' : 'Selección única';
  const min = Number(g.min) || 0;
  const max = Number(g.max) || 0;
  const range = max > 0 ? `mín. ${min} · máx. ${max}` : (min > 0 ? `mín. ${min}` : 'sin límite');
  return `${kind} · ${range}`;
}

export function ProductDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const itemRes = useResource(React.useCallback(() => api.item(itemId), [itemId]), null, [itemId]);
  const groupsRes = useResource(React.useCallback(() => api.optionGroups(itemId), [itemId]), [], [itemId]);
  const optsRes = useResource(React.useCallback(() => api.options(itemId), [itemId]), [], [itemId]);

  const item = itemRes.data;
  const groups = React.useMemo(
    () => [...(groupsRes.data || [])].sort((a, b) => a.position - b.position),
    [groupsRes.data],
  );
  const options = optsRes.data || [];
  const optsByGroup = React.useMemo(() => {
    const map = new Map();
    [...options].sort((a, b) => a.position - b.position).forEach((o) => {
      if (!map.has(o.group_id)) map.set(o.group_id, []);
      map.get(o.group_id).push(o);
    });
    return map;
  }, [options]);

  const [editItem, setEditItem] = React.useState(false);

  // Atajo desde el menú: si se llega con `?edit=1`, abre el modal de edición y limpia el parámetro
  // (una sola vez) para que recargar la página no lo vuelva a destapar.
  React.useEffect(() => {
    if (searchParams.get('edit') == null) return;
    setEditItem(true);
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const [photo, setPhoto] = React.useState(false);
  const [groupForm, setGroupForm] = React.useState(null); // {} nuevo | grupo (editar)
  const [delGroup, setDelGroup] = React.useState(null);
  const [optForm, setOptForm] = React.useState(null); // { groupId, option? }
  const [delOpt, setDelOpt] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // Reorden de grupos: optimista + un sort en lote.
  const reorderGroups = (next) => {
    const elements = next.map((g, i) => ({ id: g.id, position: i }));
    groupsRes.setData(next.map((g, i) => ({ ...g, position: i })));
    api.sortOptionGroups(itemId, elements);
  };

  // Reorden de opciones dentro de un grupo: optimista + sort en lote.
  const reorderOptions = (groupId, nextRows) => {
    const posById = new Map(nextRows.map((r, i) => [r.id, i]));
    optsRes.setData(options.map((o) => (posById.has(o.id) ? { ...o, position: posById.get(o.id) } : o)));
    api.sortOptions(itemId, nextRows.map((r, i) => ({ id: r.id, position: i })));
  };

  const removeGroup = async () => {
    setSaving(true);
    try { await api.deleteOptionGroup(itemId, delGroup.id); setDelGroup(null); groupsRes.reload(); optsRes.reload(); }
    finally { setSaving(false); }
  };
  const removeOpt = async () => {
    setSaving(true);
    try { await api.deleteOption(itemId, delOpt.id); setDelOpt(null); optsRes.reload(); }
    finally { setSaving(false); }
  };

  const loading = itemRes.loading || groupsRes.loading || optsRes.loading;
  const itemImage = item && (item.thumbnail_file || item.file);

  return (
    <div className={s.page}>
      <button type="button" className={t.backLink} onClick={() => navigate('/products')}>
        <i className="fas fa-arrow-left" aria-hidden="true" /> Volver a productos
      </button>

      {/* Tarjeta del producto (hero): imagen + datos + editar. La foto se cambia desde la imagen. */}
      {item ? (
        <div className={t.hero}>
          <button type="button" className={t.heroImage} onClick={() => setPhoto(true)} title="Cambiar foto" aria-label="Cambiar foto">
            {itemImage
              ? <img src={itemImage} alt={item.name} />
              : <i className="fas fa-burger" aria-hidden="true" />}
            <span className={t.heroCam} aria-hidden="true"><i className="fas fa-camera" /></span>
            <span className={t.heroCamHover} aria-hidden="true"><i className="fas fa-camera" /> Cambiar foto</span>
          </button>
          <div className={t.heroInfo}>
            <h2 className={t.heroName}>{item.name}</h2>
            {item.description && <p className={t.heroDesc}>{item.description}</p>}
            <div className={t.heroMeta}>
              {item.category_name && <Badge variant="neutral">{item.category_name}</Badge>}
              <span className={t.heroPrice}>{fmtPrice(item.value)}</span>
            </div>
          </div>
          <IconButton className={t.heroEdit} icon="fas fa-pen" variant="ghost" size="sm"
            title="Editar producto" onClick={() => setEditItem(true)} />
        </div>
      ) : itemRes.loading ? (
        <div className={t.hero}><Spinner label="Cargando producto…" /></div>
      ) : null}

      <div className={t.card}>
        <div className={t.cardHead}>
          <div className={t.cardHeadText}>
            <h3 className={t.cardTitle}>Opciones</h3>
            <p className={t.cardSub}>Grupos de opciones con sus reglas de selección.</p>
          </div>
          <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => setGroupForm({})}>Nuevo grupo</Button>
        </div>

        <div className={t.cardBody}>
          {loading ? (
            <Spinner center label="Cargando opciones…" />
          ) : groupsRes.error ? (
            <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {groupsRes.error}</div>
          ) : groups.length === 0 ? (
            <div className={t.empty}>
              <i className="fas fa-list-check" />
              Este producto aún no tiene grupos de opciones. Usa “Nuevo grupo”.
            </div>
          ) : (
            <SortableList items={groups} onReorder={reorderGroups} renderItem={(g, { handleProps }) => {
              const rows = optsByGroup.get(g.id) || [];
              return (
                <div className={t.group}>
                  <div className={t.groupHead}>
                    <button {...handleProps} className={t.handle} type="button" aria-label="Arrastrar grupo">
                      <i className="fas fa-grip-vertical" />
                    </button>
                    <div className={t.groupInfo}>
                      <div className={t.groupTitleRow}>
                        <span className={t.groupName}>{g.name}</span>
                        {!g.status && <Badge variant="neutral" dot>Inactivo</Badge>}
                      </div>
                      <span className={t.groupRules}>{rulesText(g)}</span>
                    </div>
                    <span className={t.groupActions}>
                      <Button variant="outline-primary" size="sm" icon="fas fa-plus"
                        onClick={() => setOptForm({ groupId: g.id })}>Opción</Button>
                      <IconButton icon="fas fa-pen" variant="light" title="Editar grupo" size="sm" onClick={() => setGroupForm(g)} />
                      <IconButton icon="fas fa-trash" variant="danger" title="Eliminar grupo" size="sm" onClick={() => setDelGroup(g)} />
                    </span>
                  </div>

                  {rows.length === 0 ? (
                    <div className={t.optEmpty}>Sin opciones en este grupo.</div>
                  ) : (
                    <SortableList items={rows} onReorder={(next) => reorderOptions(g.id, next)}
                      renderItem={(o, { handleProps: oh }) => (
                        <div className={t.optRow}>
                          <button {...oh} className={t.handle} type="button" aria-label="Arrastrar opción">
                            <i className="fas fa-grip-vertical" />
                          </button>
                          <span className={t.optName}>{o.name}</span>
                          <span className={t.optPrice}>{extraPrice(o.value)}</span>
                          <span className={t.optActions}>
                            <IconButton icon="fas fa-pen" variant="light" title="Editar opción" size="sm" onClick={() => setOptForm({ groupId: g.id, option: o })} />
                            <IconButton icon="fas fa-trash" variant="danger" title="Eliminar opción" size="sm" onClick={() => setDelOpt(o)} />
                          </span>
                        </div>
                      )} />
                  )}
                </div>
              );
            }} />
          )}
        </div>
      </div>

      {editItem && item && (
        <ItemFormModal item={item} onClose={() => setEditItem(false)}
          onSaved={() => { setEditItem(false); itemRes.reload(); }} />
      )}
      {photo && item && (
        <ProductImageModal item={item} onClose={() => setPhoto(false)}
          onSaved={() => { setPhoto(false); itemRes.reload(); }} />
      )}
      {groupForm && (
        <GroupModal itemId={itemId} group={groupForm.id ? groupForm : null}
          onClose={() => setGroupForm(null)} onSaved={() => { setGroupForm(null); groupsRes.reload(); }} />
      )}
      {optForm && (
        <OptionModal itemId={itemId} groupId={optForm.groupId} option={optForm.option}
          onClose={() => setOptForm(null)} onSaved={() => { setOptForm(null); optsRes.reload(); }} />
      )}

      <Modal open={!!delGroup} size="sm" title="Eliminar grupo" onClose={() => setDelGroup(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelGroup(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={removeGroup}>Eliminar</Button>
        </>}>
        ¿Eliminar el grupo <strong>{delGroup?.name}</strong> y todas sus opciones?
      </Modal>
      <Modal open={!!delOpt} size="sm" title="Eliminar opción" onClose={() => setDelOpt(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelOpt(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={removeOpt}>Eliminar</Button>
        </>}>
        ¿Eliminar la opción <strong>{delOpt?.name}</strong>?
      </Modal>
    </div>
  );
}

// ── Modal: subir/cambiar la foto del producto ──
// La imagen se edita (recorte/giro) y solo al Guardar se sube a S3 (pública, para renderizarla por
// URL); luego se guarda su `name` en el producto.
function ProductImageModal({ item, onClose, onSaved }) {
  const uploaderRef = React.useRef(null);
  const [hasImage, setHasImage] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await uploaderRef.current?.upload(); // sube la imagen editada a S3
      if (res?.name) await api.setItemImage(item.id, res.name);
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar la imagen del producto.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title="Foto del producto" subtitle={item.name} size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!hasImage} onClick={save}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <FileUpload ref={uploaderRef} folder="items" visibility="public" aspect={1}
          value={item.standard_file || item.file}
          hint="JPG, PNG o WEBP · máx. 10 MB. Recorta o gira la imagen; se subirá al guardar."
          onChange={setHasImage} />
        {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
      </div>
    </Modal>
  );
}

// ── Modal: crear/editar un grupo de opciones (reglas de selección) ──
function GroupModal({ itemId, group, onClose, onSaved }) {
  const editing = !!group;
  const [form, setForm] = React.useState(() => ({
    name: group?.name || '',
    description: group?.description || '',
    min: group?.min != null ? String(group.min) : '0',
    max: group?.max != null ? String(group.max) : '0',
    multiple: group ? !!group.multiple : false,
    status: group ? !!group.status : true,
  }));
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const name = form.name.trim();
    if (!name) return;
    setSaving(true);
    setErr(null);
    const payload = {
      name,
      type: group?.type || 'OPTION',
      description: form.description.trim(),
      min: Number(form.min) || 0,
      max: Number(form.max) || 0,
      multiple: form.multiple,
      status: form.status,
    };
    try {
      if (editing) await api.updateOptionGroup(itemId, group.id, payload);
      else await api.createOptionGroup(itemId, payload);
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar el grupo.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={editing ? 'Editar grupo' : 'Nuevo grupo de opciones'}
      subtitle="Define las reglas de selección que verá el cliente" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <Input label="Nombre del grupo" icon="fas fa-list-check" placeholder="Ej. Adiciones"
          value={form.name} onChange={(e) => set('name', e.target.value)} />
        <Textarea label="Descripción" placeholder="Opcional"
          value={form.description} onChange={(e) => set('description', e.target.value)} />
        <div className={s.formGrid}>
          <Input label="Mínimo de selección" icon="fas fa-arrow-down-1-9" type="number" min="0"
            value={form.min} onChange={(e) => set('min', e.target.value)} />
          <Input label="Máximo de selección" icon="fas fa-arrow-up-1-9" type="number" min="0"
            hint="0 = sin límite" value={form.max} onChange={(e) => set('max', e.target.value)} />
        </div>
        <Switch label="Selección múltiple (permite elegir varias opciones)"
          checked={form.multiple} onChange={(e) => set('multiple', e.target.checked)} />
        <Switch label="Grupo activo" checked={form.status} onChange={(e) => set('status', e.target.checked)} />
        {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
      </div>
    </Modal>
  );
}

// ── Modal: crear/editar una opción (precio extra) ──
function OptionModal({ itemId, groupId, option, onClose, onSaved }) {
  const editing = !!option;
  const [name, setName] = React.useState(option?.name || '');
  const [value, setValue] = React.useState(option?.value != null ? String(option.value) : '');
  const [status, setStatus] = React.useState(option ? Number(option.status) === 1 : true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const submit = async () => {
    const n = name.trim();
    if (!n) return;
    setSaving(true);
    setErr(null);
    const payload = { group_id: Number(groupId), name: n, value: value.trim() ? Number(value) : 0, status: status ? 1 : 0 };
    try {
      if (editing) await api.updateOption(itemId, option.id, payload);
      else await api.createOption(itemId, payload);
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar la opción.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={editing ? 'Editar opción' : 'Nueva opción'} onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <Input label="Nombre de la opción" icon="fas fa-circle-dot" placeholder="Ej. Tocineta"
          value={name} onChange={(e) => setName(e.target.value)} />
        <MoneyInput label="Precio extra" icon="fas fa-dollar-sign" placeholder="0 (sin costo)"
          value={value} onChange={setValue} />
        <Switch label="Opción activa" checked={status} onChange={(e) => setStatus(e.target.checked)} />
        {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
      </div>
    </Modal>
  );
}

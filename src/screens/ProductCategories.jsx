import React from 'react';
import { Button, IconButton, Input, Textarea, Select, Modal, Spinner, Card, SortableList } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';
import t from './MenuAdmin.module.css';

const EMPTY = { items: [], pagination: null };

export function ProductCategories() {
  // Tipo de ítem activo: las categorías pertenecen a un tipo y se administran por tipo.
  const [types, setTypes] = React.useState([]);
  const [typeId, setTypeId] = React.useState('');

  React.useEffect(() => {
    api.itemTypes().then((d) => {
      const list = d.items || [];
      setTypes(list);
      setTypeId((cur) => cur || (list[0] ? String(list[0].id) : ''));
    }).catch(() => {});
  }, []);

  const fetcher = React.useCallback(
    () => (typeId ? api.allItemCategories({ typeId }) : Promise.resolve(EMPTY)),
    [typeId],
  );
  const { data, loading, error, setData, reload } = useResource(fetcher, EMPTY, [typeId]);
  const cats = React.useMemo(
    () => [...(data.items || [])].sort((a, b) => a.position - b.position),
    [data],
  );

  const [form, setForm] = React.useState(null); // { id?, name, description }
  const [del, setDel] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  const openNew = () => setForm({ name: '', description: '' });
  const openEdit = (c) => setForm({ id: c.id, name: c.name, description: c.description || '' });

  const save = async () => {
    const name = form.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      if (form.id) await api.updateItemCategory(form.id, { name, description: form.description });
      else await api.createItemCategory({ item_type_id: Number(typeId), name, description: form.description });
      setForm(null);
      reload();
    } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true);
    try { await api.deleteItemCategory(del.id); setDel(null); reload(); }
    finally { setSaving(false); }
  };

  // Reorden: optimista local + un sort en lote.
  const onReorder = (next) => {
    setData({ ...data, items: next.map((c, i) => ({ ...c, position: i })) });
    api.sortItemCategories(next.map((c, i) => ({ id: c.id, position: i })));
  };

  return (
    <div className={s.page}>
      <div className={t.headerBar}>
        <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}
          options={types.map((ty) => ({ value: String(ty.id), label: ty.name }))} />
        <p className={t.hint}>
          Las categorías pertenecen a un tipo de ítem y este orden define cómo se agrupan los
          productos de ese tipo.
        </p>
        <div className={t.spacer} />
        <Button variant="primary" icon="fas fa-plus" disabled={!typeId} onClick={openNew}>Nueva categoría</Button>
      </div>

      {loading ? (
        <Spinner center label="Cargando categorías…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
      ) : cats.length === 0 ? (
        <div className={t.empty}>
          <i className="fas fa-tags" />
          Aún no hay categorías para este tipo.
        </div>
      ) : (
        <Card padding="14px">
          <SortableList items={cats} onReorder={onReorder} renderItem={(c, { handleProps }) => (
            <div className={t.rowInner}>
              <button {...handleProps}><i className="fas fa-grip-vertical" /></button>
              <div className={t.info}>
                <div className={t.name}>{c.name}</div>
                {c.description && <div className={t.desc}>{c.description}</div>}
              </div>
              <span className={t.rowActions}>
                <IconButton icon="fas fa-pen" variant="light" title="Editar" size="sm" onClick={() => openEdit(c)} />
                <IconButton icon="fas fa-trash" variant="danger" title="Eliminar" size="sm" onClick={() => setDel(c)} />
              </span>
            </div>
          )} />
        </Card>
      )}

      {/* Crear / editar categoría */}
      <Modal open={!!form} title={form?.id ? 'Editar categoría' : 'Nueva categoría'}
        onClose={() => setForm(null)}
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>Guardar</Button>
        </>}>
        {form && (
          <div className={s.formCol}>
            <Input label="Nombre de la categoría" icon="fas fa-tags" placeholder="Ej. Hamburguesas"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea label="Descripción" placeholder="Opcional"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        )}
      </Modal>

      {/* Eliminar categoría */}
      <Modal open={!!del} size="sm" title="Eliminar categoría" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" size="sm" icon="fas fa-trash" loading={saving} onClick={remove}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas eliminar <strong>{del?.name}</strong>? Los productos de esta categoría
        quedarán sin categoría.
      </Modal>
    </div>
  );
}

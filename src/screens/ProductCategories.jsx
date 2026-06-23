import React from 'react';
import { Button, IconButton, Input, Textarea, Modal, Spinner, Badge, Card, SortableList } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';
import t from './MenuAdmin.module.css';
import c from './ProductCategories.module.css';

const EMPTY = { types: [], items: [] };

export function ProductCategories() {
  // Trae tipos de ítem y todas las categorías de la compañía; se agrupan por tipo en el cliente.
  const fetcher = React.useCallback(
    () => Promise.all([api.itemTypes(), api.allItemCategories({})])
      .then(([ty, cat]) => ({ types: ty.items || [], items: cat.items || [] })),
    [],
  );
  const { data, loading, error, setData, reload } = useResource(fetcher, EMPTY, []);

  // Agrupa por tipo respetando el orden de los tipos y el `position` de cada categoría dentro de su tipo.
  const groups = React.useMemo(() => {
    const byType = new Map(data.types.map((ty) => [ty.id, { type: ty, cats: [] }]));
    for (const cat of data.items) byType.get(cat.item_type_id)?.cats.push(cat);
    for (const g of byType.values()) g.cats.sort((a, b) => a.position - b.position);
    return [...byType.values()];
  }, [data]);

  const [form, setForm] = React.useState(null); // { id?, typeId?, typeName?, name, description }
  const [del, setDel] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  const openNew = (type) => setForm({ typeId: type.id, typeName: type.name, name: '', description: '' });
  const openEdit = (cat) => setForm({ id: cat.id, name: cat.name, description: cat.description || '' });

  const save = async () => {
    const name = form.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      if (form.id) await api.updateItemCategory(form.id, { name, description: form.description });
      else await api.createItemCategory({ item_type_id: form.typeId, name, description: form.description });
      setForm(null);
      reload();
    } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true);
    try { await api.deleteItemCategory(del.id); setDel(null); reload(); }
    finally { setSaving(false); }
  };

  // Reorden dentro de un tipo: optimista local + un sort en lote (las posiciones son por tipo).
  const onReorder = (typeId, next) => {
    const reordered = next.map((cat, i) => ({ ...cat, position: i }));
    const others = data.items.filter((cat) => cat.item_type_id !== typeId);
    setData({ ...data, items: [...others, ...reordered] });
    api.sortItemCategories(reordered.map((cat, i) => ({ id: cat.id, position: i })));
  };

  return (
    <div className={s.page}>
      <p className={c.intro}>
        Las categorías se agrupan por tipo de ítem. Dentro de cada tipo, arrastra para ordenarlas:
        ese orden define cómo se agrupan los productos.
      </p>

      {loading ? (
        <Spinner center label="Cargando categorías…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
      ) : groups.length === 0 ? (
        <div className={t.empty}>
          <i className="fas fa-tags" />
          No hay tipos de ítem disponibles.
        </div>
      ) : (
        <div className={c.groups}>
          {groups.map((g) => (
            <Card key={g.type.id} className={c.group} padding="0">
              <div className={c.groupHead}>
                <div className={c.groupTitle}>
                  <i className="fas fa-layer-group" />
                  <h3>{g.type.name}</h3>
                  <Badge variant="neutral">{g.cats.length}</Badge>
                </div>
                <Button variant="secondary" size="sm" icon="fas fa-plus" onClick={() => openNew(g.type)}>
                  Nueva categoría
                </Button>
              </div>

              {g.cats.length === 0 ? (
                <div className={c.groupEmpty}>
                  <i className="fas fa-tags" /> Aún no hay categorías en este tipo.
                </div>
              ) : (
                <div className={c.groupBody}>
                  <SortableList items={g.cats} onReorder={(next) => onReorder(g.type.id, next)}
                    renderItem={(cat, { handleProps }) => (
                      <div className={t.rowInner}>
                        <button {...handleProps}><i className="fas fa-grip-vertical" /></button>
                        <div className={t.info}>
                          <div className={t.name}>{cat.name}</div>
                          {cat.description && <div className={t.desc}>{cat.description}</div>}
                        </div>
                        <span className={t.rowActions}>
                          <IconButton icon="fas fa-pen" variant="light" title="Editar" size="sm" onClick={() => openEdit(cat)} />
                          <IconButton icon="fas fa-trash" variant="danger" title="Eliminar" size="sm" onClick={() => setDel(cat)} />
                        </span>
                      </div>
                    )} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Crear / editar categoría */}
      <Modal open={!!form} title={form?.id ? 'Editar categoría' : `Nueva categoría en ${form?.typeName ?? ''}`}
        onClose={() => setForm(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Guardar</Button>
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
          <Button variant="secondary" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={remove}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas eliminar <strong>{del?.name}</strong>? Los productos de esta categoría
        quedarán sin categoría.
      </Modal>
    </div>
  );
}

import React from 'react';
import { Button, IconButton, Input, Textarea, Select, Modal, Spinner, Badge, Card } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';
import t from './MenuAdmin.module.css';
import c from './ProductCategories.module.css';

const EMPTY = { types: [], roots: [] };

// Administración MAESTRA del catálogo GLOBAL de categorías ("elite"), ahora JERÁRQUICO. Solo
// visible para administradores con el permiso `item-category-master`. Las categorías se anidan sin
// límite (Bebidas → Bebidas calientes → Café): el backend expone el árbol ya anidado (children[])
// y soporta crear subcategorías (parent_id) y mover ramas. Las compañías solo las ordenan.
export function AdminProductCategories() {
  const fetcher = React.useCallback(
    () => Promise.all([api.itemTypes(), api.masterItemCategoriesTree({})])
      .then(([ty, tree]) => ({ types: ty.items || [], roots: tree || [] })),
    [],
  );
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, []);

  // Agrupa las raíces del árbol por tipo de ítem, respetando el orden de los tipos.
  const groups = React.useMemo(() => {
    const byType = new Map(data.types.map((ty) => [ty.id, { type: ty, roots: [] }]));
    for (const root of data.roots) byType.get(root.item_type_id)?.roots.push(root);
    for (const g of byType.values()) g.roots.sort((a, b) => a.position - b.position);
    return [...byType.values()];
  }, [data]);

  // Nodos expandidos. Al cargar se abre el primer nivel para que el contenido sea visible.
  const [expanded, setExpanded] = React.useState(() => new Set());
  React.useEffect(() => {
    setExpanded(new Set(data.roots.map((r) => r.id)));
  }, [data.roots]);
  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const [form, setForm] = React.useState(null);
  const [del, setDel] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // Aperturas del modal según contexto (raíz nueva, subcategoría, edición).
  const openNewRoot = (type) =>
    setForm({ typeId: type.id, contextLabel: type.name, parentId: '', name: '', description: '' });
  const openNewChild = (parent) =>
    setForm({ typeId: parent.item_type_id, contextLabel: parent.name, parentId: parent.id, name: '', description: '', isChild: true });
  const openEdit = (node) =>
    setForm({ id: node.id, typeId: node.item_type_id, parentId: node.parent_id ?? '', name: node.name, description: node.description || '' });

  // Opciones del <Select> de categoría padre: árbol del mismo tipo aplanado e indentado,
  // excluyendo (al editar) el propio nodo y sus descendientes para no crear ciclos.
  const parentOptions = React.useMemo(() => {
    if (!form) return [];
    const group = groups.find((g) => g.type.id === form.typeId);
    if (!group) return [];
    const out = [];
    const walk = (nodes, depth) => {
      for (const n of nodes) {
        if (n.id === form.id) continue; // excluye su propia rama
        out.push({ value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` });
        if (n.children?.length) walk(n.children, depth + 1);
      }
    };
    walk(group.roots, 0);
    return out;
  }, [form, groups]);

  const save = async () => {
    const name = form.name.trim();
    if (!name) return;
    const parentId = form.parentId === '' || form.parentId == null ? null : Number(form.parentId);
    setSaving(true);
    try {
      if (form.id) {
        await api.updateMasterItemCategory(form.id, { name, description: form.description, parent_id: parentId });
      } else {
        await api.createMasterItemCategory({ item_type_id: form.typeId, parent_id: parentId, name, description: form.description });
      }
      setForm(null);
      reload();
    } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true);
    try { await api.deleteMasterItemCategory(del.id); setDel(null); reload(); }
    finally { setSaving(false); }
  };

  const modalTitle = !form ? '' : form.id
    ? 'Editar categoría'
    : form.isChild ? `Nueva subcategoría en ${form.contextLabel}` : `Nueva categoría en ${form.contextLabel}`;

  return (
    <div className={s.page}>
      <p className={c.introWide}>
        Catálogo global de categorías de producto. Se organizan en árbol: una categoría puede tener
        subcategorías (ej. <strong>Bebidas → Bebidas calientes → Café</strong>). Usa la flecha para
        desplegar, <i className="fas fa-plus" /> para agregar una subcategoría dentro de otra, y al
        editar puedes cambiar su categoría padre para reagruparla.
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
                  <Badge variant="neutral">{g.roots.length}</Badge>
                </div>
                <Button variant="secondary" size="sm" icon="fas fa-plus" onClick={() => openNewRoot(g.type)}>
                  Nueva categoría
                </Button>
              </div>

              {g.roots.length === 0 ? (
                <div className={c.groupEmpty}>
                  <i className="fas fa-tags" /> Aún no hay categorías en este tipo.
                </div>
              ) : (
                <div className={c.tree}>
                  {g.roots.map((node) => (
                    <CategoryNode
                      key={node.id}
                      node={node}
                      expanded={expanded}
                      onToggle={toggle}
                      onAddChild={openNewChild}
                      onEdit={openEdit}
                      onDelete={setDel}
                    />
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Crear / editar categoría global */}
      <Modal open={!!form} title={modalTitle} onClose={() => setForm(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Guardar</Button>
        </>}>
        {form && (
          <div className={s.formCol}>
            <Select
              label="Categoría padre"
              icon="fas fa-sitemap"
              hint="Déjala sin padre para que sea una categoría principal."
              value={form.parentId === null ? '' : String(form.parentId)}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            >
              <option value="">— Sin padre (categoría principal) —</option>
              {parentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Input label="Nombre de la categoría" icon="fas fa-tags" placeholder="Ej. Bebidas calientes"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea label="Descripción" placeholder="Opcional"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        )}
      </Modal>

      {/* Eliminar categoría global */}
      <Modal open={!!del} size="sm" title="Eliminar categoría" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={remove}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas eliminar <strong>{del?.name}</strong>?
        {del?.children?.length > 0 && (
          <> Incluye <strong>{del.children.length}</strong> subcategoría(s).</>
        )} Dejará de estar disponible para todas las compañías de la plataforma.
      </Modal>
    </div>
  );
}

// Nodo recursivo del árbol. La indentación se logra anidando el contenedor de hijos (.children),
// no con estilos inline.
function CategoryNode({ node, expanded, onToggle, onAddChild, onEdit, onDelete }) {
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(node.id);

  return (
    <div className={c.node}>
      <div className={c.nodeRow}>
        {hasChildren ? (
          <button type="button" className={c.toggle} onClick={() => onToggle(node.id)}
            title={isOpen ? 'Colapsar' : 'Desplegar'} aria-label={isOpen ? 'Colapsar' : 'Desplegar'}>
            <i className={`fas ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
          </button>
        ) : (
          <span className={c.toggleSpacer} />
        )}

        <div className={c.nodeName}>
          <span className={c.nodeLabel}>{node.name}</span>
          {hasChildren && <Badge variant="neutral">{children.length}</Badge>}
          {node.description && <span className={c.nodeDesc}>{node.description}</span>}
        </div>

        <span className={c.nodeActions}>
          <IconButton icon="fas fa-plus" variant="light" title="Agregar subcategoría" size="sm" onClick={() => onAddChild(node)} />
          <IconButton icon="fas fa-pen" variant="light" title="Editar" size="sm" onClick={() => onEdit(node)} />
          <IconButton icon="fas fa-trash" variant="danger" title="Eliminar" size="sm" onClick={() => onDelete(node)} />
        </span>
      </div>

      {hasChildren && isOpen && (
        <div className={c.children}>
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

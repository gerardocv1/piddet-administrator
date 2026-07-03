import React from 'react';
import { Button, IconButton, Input, Textarea, Select, Modal, Spinner, Badge, Card } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';
import c from './ProductCategories.module.css';

// Categorías de gasto de la compañía. El árbol mezcla el catálogo GLOBAL (sembrado por la
// plataforma, con badge "Global", no editable) con las categorías PROPIAS de la compañía,
// que puede crear colgándolas de cualquier nodo (o como raíz propia). Clasificar con el
// catálogo común mantiene los resúmenes comparables; las propias cubren lo específico
// (ej. "Insumos de finca").
export function ExpenseCategories() {
  const fetcher = React.useCallback(() => api.expenseCategoriesTree(), []);
  const { data: roots, loading, error, reload } = useResource(fetcher, [], []);

  const [expanded, setExpanded] = React.useState(() => new Set());
  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const openNew = (parent = null) =>
    setForm({ parentId: parent ? String(parent.id) : '', contextLabel: parent?.name, name: '', description: '' });

  // Opciones del <Select> de padre: árbol completo aplanado e indentado (globales y propias).
  const parentOptions = React.useMemo(() => {
    const out = [];
    const walk = (nodes, depth) => {
      for (const n of nodes) {
        out.push({ value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` });
        if (n.children?.length) walk(n.children, depth + 1);
      }
    };
    walk(roots || [], 0);
    return out;
  }, [roots]);

  const save = async () => {
    const name = form.name.trim();
    if (!name || saving) return;
    setSaving(true);
    setErr(null);
    try {
      await api.createExpenseCategory({
        name,
        parent_id: form.parentId === '' ? null : Number(form.parentId),
        description: form.description.trim() || undefined,
      });
      if (form.parentId) setExpanded((prev) => new Set(prev).add(Number(form.parentId)));
      setForm(null);
      reload();
    } catch (e) {
      setErr(e?.message || 'No se pudo crear la categoría.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <p className={c.introWide}>
          Así se clasifican los gastos. Las categorías <Badge variant="neutral">Global</Badge> son el
          catálogo común de la plataforma; además puedes crear categorías propias de tu compañía,
          incluso dentro de una global (ej. <strong>Insumos y alimentos → Insumos de finca</strong>).
        </p>
        <div className={s.spacer} />
        <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => openNew()}>
          Nueva categoría
        </Button>
      </div>

      {loading ? (
        <Spinner center label="Cargando categorías…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
      ) : (
        <Card padding="0">
          <div className={c.tree}>
            {(roots || []).map((node) => (
              <ExpenseCategoryNode key={node.id} node={node} expanded={expanded} onToggle={toggle} onAddChild={openNew} />
            ))}
          </div>
        </Card>
      )}

      <Modal open={!!form}
        title={form?.contextLabel ? `Nueva subcategoría en ${form.contextLabel}` : 'Nueva categoría de gasto'}
        onClose={() => setForm(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="primary" loading={saving} disabled={!form?.name.trim()} onClick={save}>Guardar</Button>
        </>}>
        {form && (
          <div className={s.formCol}>
            <Select
              label="Categoría padre"
              icon="fas fa-sitemap"
              hint="Déjala sin padre para que sea una categoría principal propia."
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            >
              <option value="">— Sin padre (categoría principal) —</option>
              {parentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Input label="Nombre de la categoría" icon="fas fa-tags" placeholder="Ej. Insumos de finca"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea label="Descripción" placeholder="Opcional"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}

// Nodo recursivo del árbol. Las globales muestran badge; sobre cualquier nodo se puede colgar
// una subcategoría propia.
function ExpenseCategoryNode({ node, expanded, onToggle, onAddChild }) {
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(node.id);
  const isGlobal = node.company_id == null;

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
          {isGlobal ? <Badge variant="neutral">Global</Badge> : <Badge variant="primary">Propia</Badge>}
        </div>
        <div className={c.nodeActions}>
          <IconButton icon="fas fa-plus" variant="light" size="sm" title="Agregar subcategoría propia"
            onClick={() => onAddChild(node)} />
        </div>
      </div>
      {isOpen && hasChildren && (
        <div className={c.children}>
          {children.map((child) => (
            <ExpenseCategoryNode key={child.id} node={child} expanded={expanded} onToggle={onToggle} onAddChild={onAddChild} />
          ))}
        </div>
      )}
    </div>
  );
}

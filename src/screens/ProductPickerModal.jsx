import React from 'react';
import { Button, Input, Select, Checkbox, Badge, Modal, Spinner, Alert, Pagination, useToast } from '../components';
import { api } from '../lib/api.js';
import { entityTerm, cap } from '../lib/terms.js';
import s from './screens.module.css';
import p from './ProductPickerModal.module.css';

/**
 * Selector de productos para un grupo de opciones general: lista los productos de la compañía
 * (búsqueda por nombre y filtro por categoría, paginado como en /products), marca los que ya
 * tiene el grupo y al guardar envía la lista COMPLETA de ids (`PUT …/items`): lo que se
 * desmarque se desasigna. La selección sobrevive a cambiar de página o de filtro: se guarda
 * por id, y las chips de arriba permiten quitar un producto aunque no esté en la página actual.
 */
export function ProductPickerModal({ group, onClose, onSaved }) {
  const prodT = entityTerm('product');
  const { toast } = useToast();

  // Selección: Map id → producto (para pintar la chip con su nombre).
  const [selected, setSelected] = React.useState(null); // null = aún cargando los asignados
  const [initialError, setInitialError] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    api.generalOptionGroupItems(group.id)
      .then((rows) => { if (alive) setSelected(new Map((rows || []).map((it) => [it.id, it]))); })
      .catch(() => { if (alive) setInitialError(`No se pudieron cargar los ${prodT.many} del grupo.`); });
    return () => { alive = false; };
  }, [group.id, prodT.many]);

  // Listado paginado con búsqueda (debounce) y filtro por categoría.
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [cats, setCats] = React.useState([]);
  const [list, setList] = React.useState({ items: [], pagination: null });
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState(null);

  React.useEffect(() => {
    const id = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [q]);

  React.useEffect(() => {
    api.productFilters().then(({ categories }) => setCats(categories)).catch(() => {});
  }, []);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setListError(null);
    api.items({ page, search, categoryId: categoryId || undefined, row: 10 })
      .then((d) => { if (alive) setList(d); })
      .catch(() => { if (alive) setListError(`No se pudieron cargar los ${prodT.many}.`); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [page, search, categoryId, prodT.many]);

  const toggle = (it) => {
    setSelected((m) => {
      const next = new Map(m);
      if (next.has(it.id)) next.delete(it.id); else next.set(it.id, it);
      return next;
    });
  };
  const items = list.items || [];
  const pg = list.pagination;
  const allOnPage = items.length > 0 && selected && items.every((it) => selected.has(it.id));
  const togglePage = () => {
    setSelected((m) => {
      const next = new Map(m);
      if (allOnPage) items.forEach((it) => next.delete(it.id));
      else items.forEach((it) => next.set(it.id, it));
      return next;
    });
  };

  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);
  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.setGeneralOptionGroupItems(group.id, [...selected.keys()]);
      onSaved();
      toast({ tone: 'success', title: `${cap(prodT.many)} del grupo guardados` });
    } catch (e) {
      setSaveError(e?.message || `No se pudieron guardar los ${prodT.many} del grupo.`);
    } finally { setSaving(false); }
  };

  const count = selected ? selected.size : 0;
  const chips = selected ? [...selected.values()] : [];

  return (
    <Modal open size="lg" title={`${cap(prodT.many)} a los que aplica`} subtitle={group.name} onClose={onClose}
      footer={<>
        <span className={p.footerCount}>{count === 1 ? `1 ${prodT.one} seleccionado` : `${count} ${prodT.many} seleccionados`}</span>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!selected} onClick={save}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <div className={p.filters}>
          <Input icon="fas fa-magnifying-glass" placeholder={`Buscar ${prodT.one} por nombre`}
            value={q} onChange={(e) => setQ(e.target.value)} wrapClassName={p.search} />
          <Select icon="fas fa-tags" value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            options={[{ value: '', label: 'Todas las categorías' }, ...cats.map((c) => ({ value: String(c.id), label: c.name }))]} />
        </div>

        {initialError && <Alert tone="danger">{initialError}</Alert>}
        {saveError && <Alert tone="danger" onClose={() => setSaveError(null)}>{saveError}</Alert>}

        {/* Seleccionados: se pueden quitar desde aquí aunque no estén en la página visible. */}
        {chips.length > 0 && (
          <div className={p.chips}>
            {chips.map((it) => (
              <button key={it.id} type="button" className={p.chip} onClick={() => toggle(it)} title="Quitar de la selección">
                <span className={p.chipName}>{it.name}</span>
                <i className="fas fa-xmark" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        <div className={p.list}>
          <div className={`${p.row} ${p.headRow}`}>
            <Checkbox checked={!!allOnPage} onChange={togglePage} disabled={!selected || items.length === 0}
              aria-label="Seleccionar los de esta página" />
            <span>{cap(prodT.one)}</span>
            <span className={p.colCat}>Categoría</span>
          </div>
          {loading ? (
            <div className={p.state}><Spinner center label={`Cargando ${prodT.many}…`} /></div>
          ) : listError ? (
            <div className={p.state}><Alert tone="danger">{listError}</Alert></div>
          ) : items.length === 0 ? (
            <div className={p.state}>{search || categoryId ? `No hay ${prodT.many} que coincidan.` : `Aún no hay ${prodT.many}.`}</div>
          ) : items.map((it) => {
            const on = !!selected?.has(it.id);
            return (
              <label key={it.id} className={[p.row, on ? p.rowOn : ''].filter(Boolean).join(' ')}>
                <Checkbox checked={on} onChange={() => toggle(it)} disabled={!selected} />
                <span className={p.itemCell}>
                  <span className={p.icon} aria-hidden="true">
                    {it.thumbnail_file || it.file
                      ? <img src={it.thumbnail_file || it.file} alt="" loading="lazy" />
                      : (it.icon || <i className="fas fa-burger" />)}
                  </span>
                  <span className={p.itemText}>
                    <span className={p.name}>{it.name}</span>
                    {it.code && <span className={p.code}>{it.code}</span>}
                  </span>
                </span>
                <span className={p.colCat}><Badge variant="neutral">{it.category_name || '—'}</Badge></span>
              </label>
            );
          })}
        </div>

        {pg && pg.last_page > 1 && (
          <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total} onChange={setPage} disabled={loading} />
        )}
      </div>
    </Modal>
  );
}

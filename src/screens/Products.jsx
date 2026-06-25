import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, Badge, Switch, Modal, Spinner, Pagination, Dropdown, FilterBar } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { ItemFormModal } from './ItemFormModal.jsx';
import s from './screens.module.css';
import t from './Products.module.css';

const EMPTY = { items: [], pagination: null };
const fmtPrice = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('es-CO'));
const STATUS_ACTIVE = 1;
const STATUS_DRAFT = 2;

// Miniatura del producto: la imagen viene resuelta del backend (URL completa, con `product.png`
// por defecto). Si la imagen no carga, cae a un icono para no dejar un hueco roto.
function ProductThumb({ src, alt }) {
  const [failed, setFailed] = React.useState(false);
  if (!src || failed) return <span className={t.icon}><i className="fas fa-burger" /></span>;
  return <img className={t.thumb} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export function Products() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState({ type: undefined, category: undefined });
  const typeId = filters.type;
  const categoryId = filters.category;

  // Búsqueda con debounce: vuelve a la primera página al cambiar el término.
  React.useEffect(() => {
    const id = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [q]);

  // Opciones de los filtros: solo tipos y categorías que la compañía USA (tienen productos),
  // derivados del ordering y cacheados por compañía (30 min) en el servicio.
  const [types, setTypes] = React.useState([]);
  const [cats, setCats] = React.useState([]);
  React.useEffect(() => {
    api.productFilters()
      .then(({ types, categories }) => { setTypes(types); setCats(categories); })
      .catch(() => {});
  }, []);

  // Al elegir un tipo, las categorías se acotan a ese tipo; sin tipo, se ofrecen todas.
  const catOptions = (typeId ? cats.filter((c) => String(c.item_type_id) === String(typeId)) : cats)
    .map((c) => ({ value: String(c.id), label: c.name }));
  const filterDefs = [
    { key: 'type', label: 'Tipo', icon: 'fas fa-layer-group', type: 'select',
      options: types.map((tp) => ({ value: String(tp.id), label: tp.name })) },
    { key: 'category', label: 'Categoría', icon: 'fas fa-tags', type: 'select', options: catOptions },
  ];

  // Cambiar el tipo invalida la categoría si ya no pertenece a ese tipo (las categorías son por tipo).
  const onFilters = (next) => {
    const cleaned = { ...next };
    if (cleaned.type !== filters.type && cleaned.type) {
      const match = cats.some((c) => String(c.id) === String(cleaned.category) && String(c.item_type_id) === String(cleaned.type));
      if (!match) cleaned.category = undefined;
    }
    setFilters(cleaned);
    setPage(1);
  };

  const fetcher = React.useCallback(() => api.items({ page, search, typeId, categoryId }), [page, search, typeId, categoryId]);
  const { data, loading, error, setData, reload } = useResource(fetcher, EMPTY, [page, search, typeId, categoryId]);
  const items = data.items || [];
  const pg = data.pagination;
  const filtered = !!(search || typeId || categoryId);

  const [form, setForm] = React.useState(null); // null | {} (nuevo) | item (editar)
  const [del, setDel] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // Alterna activo/borrador con actualización optimista; revierte si el backend falla.
  const toggleStatus = async (it) => {
    const next = it.item_status_id === STATUS_ACTIVE ? STATUS_DRAFT : STATUS_ACTIVE;
    setData({ ...data, items: items.map((x) => (x.id === it.id ? { ...x, item_status_id: next } : x)) });
    try { await api.setItemStatus(it.id, next); }
    catch { setData({ ...data, items: items.map((x) => (x.id === it.id ? { ...x, item_status_id: it.item_status_id } : x)) }); }
  };

  const remove = async () => {
    setSaving(true);
    try { await api.deleteItem(del.id); setDel(null); reload(); }
    finally { setSaving(false); }
  };

  return (
    <div className={s.page}>
      <FilterBar
        searchable
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Buscar producto"
        filters={filterDefs}
        values={filters}
        onChange={onFilters}
        inlineThreshold={0}
        actions={<Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => setForm({})}>Nuevo producto</Button>}
      />

      {loading ? (
        <Spinner center label="Cargando productos…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
      ) : items.length === 0 ? (
        <div className={t.empty}>
          <i className="fas fa-burger" />
          {filtered ? 'No hay productos que coincidan con los filtros.' : 'Aún no has creado productos.'}
        </div>
      ) : (
        <div className={t.tableCard}>
          <div className={`${t.row} ${t.headRow}`}>
            <span>Producto</span>
            <span className={t.colCat}>Categoría</span>
            <span className={t.colNum}>Precio</span>
            <span className={t.colStatus}>Estado</span>
            <span className={t.colActions} />
          </div>
          {items.map((it) => (
            <div key={it.id} className={t.row} role="button" tabIndex={0}
              onClick={() => navigate(`/products/${it.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/products/${it.id}`); }}>
              <div className={t.itemCell}>
                <ProductThumb src={it.thumbnail_file || it.file} alt={it.name} />
                <div className={t.itemText}>
                  <div className={t.name}>{it.name}</div>
                  {it.code && <div className={t.desc}>{it.code}</div>}
                </div>
              </div>
              <span className={t.colCat}><Badge variant="neutral">{it.category_name || '—'}</Badge></span>
              <span className={t.colNum}>{fmtPrice(it.value)}</span>
              {/* stopPropagation: el toggle y el menú no deben disparar la navegación de la fila. */}
              <span className={t.colStatus} onClick={(e) => e.stopPropagation()}
                title={it.item_status_id === STATUS_ACTIVE ? 'Activo' : 'Borrador'}>
                <Switch size="sm" checked={it.item_status_id === STATUS_ACTIVE} onChange={() => toggleStatus(it)} />
              </span>
              <span className={t.colActions}>
                <Dropdown
                  trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Acciones" />}
                  items={[
                    { label: 'Administrar opciones', icon: 'fas fa-sliders', onClick: () => navigate(`/products/${it.id}`) },
                    { label: 'Editar', icon: 'fas fa-pen', onClick: () => setForm(it) },
                    { label: 'Eliminar', icon: 'fas fa-trash', variant: 'danger', onClick: () => setDel(it) },
                  ]}
                />
              </span>
            </div>
          ))}
        </div>
      )}

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total} onChange={setPage} disabled={loading} />
      )}

      {form && (
        <ItemFormModal item={form.id ? form : null}
          onClose={() => setForm(null)} onSaved={() => { setForm(null); reload(); }} />
      )}

      <Modal open={!!del} size="sm" title="Eliminar producto" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={remove}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas eliminar <strong>{del?.name}</strong>? Esta acción no se puede deshacer.
      </Modal>
    </div>
  );
}

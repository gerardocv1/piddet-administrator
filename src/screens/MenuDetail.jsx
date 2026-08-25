import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, IconButton, RefreshButton, Input, MoneyInput, Select, Textarea, Modal, Spinner, SortableList, Autocomplete, Dropdown, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { useSetPageBack } from '../lib/pageTitle.jsx';
import { useFunctionalities } from '../lib/permissions/useFunctionalities.js';
import { ADMIN_BASE } from '../lib/adminBase.js';
import { entityTerm, cap } from '../lib/terms.js';
import s from './screens.module.css';
import t from './MenuDetail.module.css';

const fmtPrice = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('es-CO'));
const EMPTY_PAGE = { items: [], pagination: null };

const plural = (n, sing, plur) => `${n} ${n === 1 ? sing : plur}`;

export function MenuDetail() {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Terminología por tipo de compañía: "menú" puede ser "catálogo público"; "producto", "ítem" o "servicio".
  const menuT = entityTerm('menu');
  const prodT = entityTerm('product');

  // El "volver" se publica al Topbar: la flecha se pinta arriba, junto al título de la sección.
  useSetPageBack(() => navigate('/menus'));

  const menuRes = useResource(React.useCallback(() => api.menu(menuId), [menuId]), null, [menuId]);
  const catsRes = useResource(React.useCallback(() => api.menuCategories(menuId), [menuId]), EMPTY_PAGE, [menuId]);
  const itemsRes = useResource(React.useCallback(() => api.menuItems(menuId), [menuId]), [], [menuId]);

  const cats = React.useMemo(
    () => [...(catsRes.data.items || [])].sort((a, b) => a.position - b.position),
    [catsRes.data],
  );
  const items = itemsRes.data || [];

  const [selectedCat, setSelectedCat] = React.useState(null); // null = "Todas las categorías"
  const [catQuery, setCatQuery] = React.useState('');

  const [adding, setAdding] = React.useState(false);
  const [newCat, setNewCat] = React.useState(false);
  const [editCat, setEditCat] = React.useState(null);
  const [delCat, setDelCat] = React.useState(null);
  const [edit, setEdit] = React.useState(null);
  const [del, setDel] = React.useState(null);
  const [toggle, setToggle] = React.useState(false); // confirmación de activar/desactivar el menú
  const [saving, setSaving] = React.useState(false);
  // Error de la última mutación. Se pinta dentro de cada modal: los tres fallan con el overlay
  // puesto, así que un banner de pantalla quedaría tapado.
  const [actionError, setActionError] = React.useState('');

  // Conteo de productos por categoría (dentro de este menú).
  const countByCat = React.useMemo(() => {
    const map = new Map();
    items.forEach((i) => map.set(i.menu_category_id, (map.get(i.menu_category_id) || 0) + 1));
    return map;
  }, [items]);

  // Categorías visibles en el panel lateral: todas las del menú (incluidas las vacías, para poder
  // ordenarlas antes de asignar productos), filtradas por el buscador local.
  const visibleCats = React.useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    return q ? cats.filter((c) => c.name.toLowerCase().includes(q)) : cats;
  }, [cats, catQuery]);

  // El arrastre de categorías solo tiene sentido sin filtro de búsqueda (orden sobre la lista completa).
  const canDragCats = !catQuery.trim();

  // Orden manual: siempre por `position` (se reordena arrastrando dentro de una categoría).
  const sortRows = React.useCallback(
    (rows) => [...rows].sort((a, b) => a.position - b.position),
    [],
  );

  // Productos a mostrar a la derecha: solo los de la categoría activa (o agrupados si "Todas").
  const groups = React.useMemo(() => {
    if (selectedCat != null) {
      const cat = cats.find((c) => c.id === selectedCat);
      const rows = sortRows(items.filter((i) => i.menu_category_id === selectedCat));
      return [{ cat: cat || { id: selectedCat, name: 'Categoría' }, rows }];
    }
    return cats
      .map((c) => ({ cat: c, rows: sortRows(items.filter((i) => i.menu_category_id === c.id)) }))
      .filter((g) => g.rows.length > 0);
  }, [selectedCat, cats, items, sortRows]);

  // El arrastre de productos solo tiene sentido con una categoría concreta seleccionada.
  const canDrag = selectedCat != null;

  // Reorden dentro de una categoría: optimista local + un PUT por ítem que cambió de posición.
  const reorderGroup = (nextRows) => {
    const posById = new Map(nextRows.map((r, i) => [r.id, i]));
    itemsRes.setData(items.map((it) => (posById.has(it.id) ? { ...it, position: posById.get(it.id) } : it)));
    nextRows.forEach((r, i) => { if (r.position !== i) api.updateMenuItem(menuId, r.id, { position: i }); });
  };

  // Reorden de categorías en el panel lateral: optimista local + un PUT por categoría que cambió.
  const reorderCats = (next) => {
    catsRes.setData({ ...catsRes.data, items: next.map((c, i) => ({ ...c, position: i })) });
    next.forEach((c, i) => { if (c.position !== i) api.updateMenuCategory(menuId, c.id, { position: i }); });
  };

  const removeItem = async () => {
    setSaving(true); setActionError('');
    try {
      await api.deleteMenuItem(menuId, del.id);
      setDel(null);
      itemsRes.reload();
      toast({ tone: 'neutral', title: `${cap(prodT.one)} quitado del ${menuT.one}` });
    } catch (e) {
      setActionError(e?.message || `No se pudo quitar el ${prodT.one} del ${menuT.one}.`);
    } finally { setSaving(false); }
  };

  const confirmToggle = async () => {
    setSaving(true); setActionError('');
    const activating = !menuRes.data.is_active;
    try {
      await api.setMenuActive(menuId, activating);
      setToggle(false);
      menuRes.reload();
      toast({
        tone: activating ? 'success' : 'neutral',
        title: activating ? `${cap(menuT.one)} activado` : `${cap(menuT.one)} desactivado`,
      });
    } catch (e) {
      setActionError(e?.message || `No se pudo cambiar el estado del ${menuT.one}.`);
    } finally { setSaving(false); }
  };

  const removeCat = async () => {
    setSaving(true); setActionError('');
    try {
      await api.deleteMenuCategory(menuId, delCat.id);
      if (selectedCat === delCat.id) setSelectedCat(null);
      setDelCat(null);
      catsRes.reload();
      itemsRes.reload();
      toast({ tone: 'neutral', title: `Categoría del ${menuT.one} eliminada` });
    } catch (e) {
      setActionError(e?.message || 'No se pudo eliminar la categoría.');
    } finally { setSaving(false); }
  };

  const menu = menuRes.data;
  const loading = itemsRes.loading || catsRes.loading;
  const usedCats = countByCat.size; // categorías con al menos un producto en este menú

  // Cabecera de la card: nombre y conteo de la categoría activa (o "Todas").
  const activeCat = selectedCat != null ? cats.find((c) => c.id === selectedCat) : null;
  const activeName = activeCat ? activeCat.name : 'Todas las categorías';
  const activeCount = selectedCat != null ? (countByCat.get(selectedCat) || 0) : items.length;

  // Subtítulo del encabezado: descripción + resumen, separados por puntos.
  const headerInfo = [menu?.description, plural(items.length, prodT.one, prodT.many), plural(cats.length, 'categoría', 'categorías')]
    .filter(Boolean).join(' · ');

  // Subcomponente: fila de producto. `handleProps` solo llega cuando el arrastre está activo
  // (categoría concreta + orden manual); si no, se muestra un icono de producto, no el grip.
  const renderItemRow = (it, handleProps) => (
    <div className={t.itemRow}>
      {handleProps ? (
        <button {...handleProps} className={t.handle} type="button" aria-label="Arrastrar para reordenar">
          <i className="fas fa-grip-vertical" />
        </button>
      ) : (
        <span className={t.itemIcon} aria-hidden="true"><i className="fas fa-utensils" /></span>
      )}
      <div className={t.itemInfo}>
        <span className={t.itemName}>{it.name}</span>
      </div>
      <span className={t.itemPrice}>{fmtPrice(it.price)}</span>
      <span className={t.itemActions}>
        <IconButton icon="fas fa-pen" variant="light" title="Editar" size="sm" onClick={() => setEdit(it)} />
        <IconButton icon="fas fa-trash" variant="danger" title="Quitar" size="sm" onClick={() => setDel(it)} />
      </span>
    </div>
  );

  // Subcomponente: fila de categoría en el panel lateral (seleccionar + editar/borrar + arrastrar).
  const renderCatRow = (c, handleProps) => (
    <div className={`${t.catRow} ${selectedCat === c.id ? t.catActive : ''}`}>
      {handleProps ? (
        <button {...handleProps} className={t.catHandle} type="button" aria-label="Arrastrar para ordenar">
          <i className="fas fa-grip-vertical" />
        </button>
      ) : (
        <span className={t.catHandle} aria-hidden="true"><i className="fas fa-tag" /></span>
      )}
      <button type="button" className={t.catSelect} onClick={() => setSelectedCat(c.id)}>
        <span className={t.catName}>{c.name}</span>
        <span className={t.catCount}>{countByCat.get(c.id) || 0}</span>
      </button>
      <span className={t.catActions} onClick={(e) => e.stopPropagation()}>
        <Dropdown
          trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Acciones de la categoría" />}
          items={[
            { label: 'Editar', icon: 'fas fa-pen', onClick: () => setEditCat(c) },
            { label: 'Eliminar', icon: 'fas fa-trash', variant: 'danger', onClick: () => setDelCat(c) },
          ]}
        />
      </span>
    </div>
  );

  return (
    <div className={s.page}>
      {/* Encabezado: nombre + descripción/resumen (el volver vive en el Topbar) */}
      <div className={t.header}>
        <div className={t.headerText}>
          <div className={t.headerTitleLine}>
            <h2 className={t.headerTitle}>{menu?.name || cap(menuT.one)}</h2>
            {menu && (
              <span className={`${t.badge} ${menu.is_active ? t.badgeOn : t.badgeOff}`}>
                <i className={menu.is_active ? 'fas fa-circle-check' : 'fas fa-circle-pause'} />
                {menu.is_active ? 'Activo' : 'Inactivo'}
              </span>
            )}
          </div>
          <p className={t.headerSub}>{headerInfo}</p>
        </div>
        <div className={s.spacer} />
        <RefreshButton
          loading={menuRes.loading || catsRes.loading || itemsRes.loading}
          onClick={() => { menuRes.reload(); catsRes.reload(); itemsRes.reload(); }} />
        {menu && (
          <Button variant={menu.is_active ? 'secondary' : 'outline-primary'} size="sm"
            icon={menu.is_active ? 'fas fa-toggle-off' : 'fas fa-toggle-on'}
            onClick={() => setToggle(true)}>
            {menu.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        )}
        <Button variant="outline-primary" size="sm" icon="fas fa-eye"
          onClick={() => window.open(`${ADMIN_BASE}/menus/${menuId}/preview`, '_blank')}>Ver {menuT.pub}</Button>
      </div>

      {!catsRes.loading && cats.length === 0 ? (
        <div className={t.empty}>
          <span className={t.emptyIcon} aria-hidden="true"><i className="fas fa-layer-group" /></span>
          <div className={t.emptyText}>
            <h3 className={t.emptyTitle}>Este {menuT.one} aún no tiene categorías</h3>
            <p className={t.emptyDesc}>Crea la primera para empezar a asignar {prodT.many}.</p>
          </div>
          <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => setNewCat(true)}>Nueva categoría</Button>
        </div>
      ) : (
        <div className={t.layout}>
          {/* ── Panel lateral de categorías (sticky) ── */}
          <aside className={t.sidebar}>
            <div className={t.catSearch}>
              <i className="fas fa-search" />
              <input value={catQuery} onChange={(e) => setCatQuery(e.target.value)} placeholder="Buscar categoría" />
            </div>
            <nav className={t.catList}>
              <button type="button"
                className={`${t.catItem} ${selectedCat == null ? t.catActive : ''}`}
                onClick={() => setSelectedCat(null)}>
                <span className={t.catMain}>
                  <i className={`fas fa-list ${t.catIcon}`} aria-hidden="true" />
                  <span className={t.catName}>Todas las categorías</span>
                </span>
                <span className={t.catCount}>{items.length}</span>
              </button>
              {canDragCats ? (
                <SortableList items={visibleCats} onReorder={reorderCats}
                  renderItem={(c, { handleProps }) => renderCatRow(c, handleProps)} />
              ) : (
                visibleCats.map((c) => (
                  <React.Fragment key={c.id}>{renderCatRow(c, null)}</React.Fragment>
                ))
              )}
            </nav>
            <button type="button" className={t.newCatBtn} onClick={() => setNewCat(true)}>
              <i className="fas fa-plus" aria-hidden="true" /> Nueva categoría
            </button>
          </aside>

          {/* ── Productos de la categoría seleccionada ── */}
          <section className={t.content}>
            <div className={t.card}>
              <div className={t.cardHead}>
                <div className={t.cardHeadText}>
                  <h3 className={t.cardTitle}>{activeName}</h3>
                  <p className={t.cardSub}>{plural(activeCount, prodT.one, prodT.many)}</p>
                </div>
                <div className={t.controls}>
                  <Button variant="primary" size="sm" icon="fas fa-plus" disabled={cats.length === 0}
                    onClick={() => setAdding(true)}>Agregar {prodT.one}</Button>
                </div>
              </div>

              <div className={t.cardBody}>
              {loading ? (
                <Spinner center label={`Cargando ${prodT.many}…`} />
              ) : itemsRes.error ? (
                <Alert tone="danger" title={`No se pudo cargar los ${prodT.many} del ${menuT.one}`}>{itemsRes.error}</Alert>
              ) : groups.every((g) => g.rows.length === 0) ? (
                <div className={t.cardEmpty}>
                  <i className="fas fa-utensils" />
                  {selectedCat != null
                    ? `No hay ${prodT.many} en esta categoría.`
                    : `Este ${menuT.one} aún no tiene ${prodT.many}. Usa “Agregar ${prodT.one}”.`}
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g.cat.id} className={t.group}>
                    {selectedCat == null && (
                      <div className={t.groupHead}>
                        <span className={t.groupName}>{g.cat.name}</span>
                        <span className={t.groupCount}>{g.rows.length}</span>
                      </div>
                    )}
                    {canDrag ? (
                      <SortableList items={g.rows} onReorder={reorderGroup}
                        renderItem={(it, { handleProps }) => renderItemRow(it, handleProps)} />
                    ) : (
                      <div className={t.itemList}>
                        {g.rows.map((it) => (
                          <React.Fragment key={it.id}>{renderItemRow(it, null)}</React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              </div>
            </div>
          </section>
        </div>
      )}

      {adding && (
        <AddProductModal menuId={menuId} categories={cats} defaultCat={selectedCat}
          onClose={() => setAdding(false)} onAdded={() => { setAdding(false); itemsRes.reload(); }} />
      )}
      {edit && (
        <EditItemModal menuId={menuId} item={edit} categories={cats}
          onClose={() => setEdit(null)} onSaved={() => { setEdit(null); itemsRes.reload(); }} />
      )}
      {newCat && (
        <CategoryModal menuId={menuId} onClose={() => setNewCat(false)}
          onSaved={() => { setNewCat(false); catsRes.reload(); }} />
      )}
      {editCat && (
        <CategoryModal menuId={menuId} category={editCat} onClose={() => setEditCat(null)}
          onSaved={() => { setEditCat(null); catsRes.reload(); }} />
      )}

      <Modal open={toggle} size="sm" title={menu?.is_active ? `Desactivar ${menuT.one}` : `Activar ${menuT.one}`}
        onClose={() => setToggle(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setToggle(false)}>Cancelar</Button>
          <Button variant={menu?.is_active ? 'danger' : 'primary'}
            icon={menu?.is_active ? 'fas fa-toggle-off' : 'fas fa-toggle-on'}
            loading={saving} onClick={confirmToggle}>
            {menu?.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </>}>
        {actionError && <Alert tone="danger" onClose={() => setActionError('')}>{actionError}</Alert>}
        {menu?.is_active
          ? <>Al desactivar <strong>{menu?.name}</strong> dejará de mostrarse en la página pública de la empresa y su {menuT.pub} no podrá abrirse, ni siquiera con el enlace directo. Podrás volver a activarlo cuando quieras.</>
          : <>Al activar <strong>{menu?.name}</strong> volverá a mostrarse en la página pública de la empresa y su {menuT.pub} será accesible.</>}
      </Modal>

      <Modal open={!!del} size="sm" title={`Quitar ${prodT.one}`} onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={removeItem}>Quitar</Button>
        </>}>
        {actionError && <Alert tone="danger" onClose={() => setActionError('')}>{actionError}</Alert>}
        ¿Quitar <strong>{del?.name}</strong> de este {menuT.one}?
      </Modal>

      <Modal open={!!delCat} size="sm" title="Eliminar categoría" onClose={() => setDelCat(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelCat(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={removeCat}>Eliminar</Button>
        </>}>
        {actionError && <Alert tone="danger" onClose={() => setActionError('')}>{actionError}</Alert>}
        ¿Eliminar la categoría <strong>{delCat?.name}</strong> de este {menuT.one}?
        {(countByCat.get(delCat?.id) || 0) > 0 && (
          <> Sus {countByCat.get(delCat?.id)} {prodT.one}(s) dejarán de mostrarse en el {menuT.one}.</>
        )}
      </Modal>
    </div>
  );
}

// ── Modal: buscar un producto y asignarlo (categoría + precio + disponibilidad) ──
function AddProductModal({ menuId, categories, defaultCat, onClose, onAdded }) {
  const { has } = useFunctionalities();
  const { toast } = useToast();
  const menuT = entityTerm('menu');
  const prodT = entityTerm('product');
  const menuPriceOn = has('functionality_menu_item_price');
  const [sel, setSel] = React.useState(null);
  const initialCat = defaultCat != null ? defaultCat : (categories[0] ? categories[0].id : '');
  const [catId, setCatId] = React.useState(String(initialCat));
  const [price, setPrice] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  // El buscador del Autocomplete: trae productos disponibles (el backend excluye los ya asignados).
  const searchProducts = React.useCallback(
    (q) => api.searchMenuProducts(menuId, { q }).then((d) => (Array.isArray(d.items) ? d.items : [])),
    [menuId],
  );

  const submit = async () => {
    if (!sel || !catId) return;
    setSaving(true);
    setErr(null);
    try {
      await api.addMenuItem(menuId, {
        item_id: sel.id,
        menu_category_id: Number(catId),
        ...(menuPriceOn ? { price: price.trim() ? Number(price) : null } : {}),
      });
      onAdded();
      toast({ tone: 'success', title: `${cap(prodT.one)} agregado al ${menuT.one}` });
    } catch (e) {
      setErr(e?.message || `No se pudo agregar el ${prodT.one} al ${menuT.one}.`);
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={`Agregar ${prodT.one}`}
      subtitle={menuPriceOn ? `Busca un ${prodT.one} y asígnale categoría y precio` : `Busca un ${prodT.one} y asígnale una categoría`}
      size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!sel || !catId} onClick={submit}>Agregar</Button>
      </>}>
      <div className={s.formCol}>
        <Autocomplete
          label={cap(prodT.one)}
          placeholder="Busca por nombre o SKU (mín. 3 letras)"
          minChars={3}
          fetcher={searchProducts}
          value={sel}
          onChange={setSel}
          getOptionLabel={(p) => p.name}
          getOptionValue={(p) => p.id}
          renderOption={(p) => (
            <>
              <span className={t.resultName}>{p.name}</span>
              <span className={t.resultMeta}>{[p.sku, p.value_print].filter(Boolean).join(' · ')}</span>
            </>
          )}
          noResultsText={`No hay ${prodT.many} disponibles para agregar`}
        />
        <div className={s.formGrid}>
          <Select label="Categoría" value={catId} onChange={(e) => setCatId(e.target.value)}
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
          {menuPriceOn && (
            <MoneyInput label="Precio (opcional)" icon="fas fa-dollar-sign"
              placeholder={`Usar precio del ${prodT.one}`} value={price} onChange={setPrice} />
          )}
        </div>
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}

// ── Modal: editar categoría/precio/disponibilidad de un ítem ya asignado ──
function EditItemModal({ menuId, item, categories, onClose, onSaved }) {
  const navigate = useNavigate();
  const { has } = useFunctionalities();
  const { toast } = useToast();
  const prodT = entityTerm('product');
  const menuPriceOn = has('functionality_menu_item_price');
  const [catId, setCatId] = React.useState(String(item.menu_category_id));
  const [price, setPrice] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  // Atajo a la ficha del producto con el modal de edición abierto (edita el producto en sí,
  // no su vínculo con este menú). `?edit=1` lo destapa ProductDetail al cargar.
  const goToProduct = () => navigate(`/products/${item.item_id}?edit=1`);

  const subtitle = (
    <span className={t.subtitleLink}>
      {item.name}
      <button type="button" className={t.editProductBtn} onClick={goToProduct} title={`Abrir la ficha del ${prodT.one} para editarlo`}>
        <i className="fas fa-up-right-from-square" aria-hidden="true" /> Editar {prodT.one}
      </button>
    </span>
  );

  const submit = async () => {
    if (!catId) return;
    setSaving(true);
    setErr(null);
    try {
      await api.updateMenuItem(menuId, item.id, {
        menu_category_id: Number(catId),
        ...(menuPriceOn ? { price: price.trim() ? Number(price) : null } : {}),
      });
      onSaved();
      toast({ tone: 'success', title: `${cap(prodT.one)} actualizado` });
    } catch (e) {
      setErr(e?.message || `No se pudo actualizar el ${prodT.one}.`);
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={`Editar ${prodT.one}`} subtitle={subtitle} onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <Select label="Categoría" value={catId} onChange={(e) => setCatId(e.target.value)}
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
        {menuPriceOn && (
          <MoneyInput label="Precio (opcional)" icon="fas fa-dollar-sign"
            placeholder={`Actual: ${fmtPrice(item.price)} · vacío = precio del ${prodT.one}`}
            value={price} onChange={setPrice} />
        )}
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}

// ── Modal: crear o editar una categoría del menú ──
function CategoryModal({ menuId, category, onClose, onSaved }) {
  const editing = !!category;
  const { toast } = useToast();
  const menuT = entityTerm('menu');
  const prodT = entityTerm('product');
  const [name, setName] = React.useState(category?.name || '');
  const [description, setDescription] = React.useState(category?.description || '');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const submit = async () => {
    const n = name.trim();
    if (!n) return;
    setSaving(true);
    setErr(null);
    try {
      if (editing) await api.updateMenuCategory(menuId, category.id, { name: n, description });
      else await api.createMenuCategory(menuId, { name: n, description });
      onSaved();
      toast({ tone: 'success', title: editing ? `Categoría del ${menuT.one} actualizada` : `Categoría del ${menuT.one} creada` });
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar la categoría.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={editing ? 'Editar categoría' : 'Nueva categoría'}
      subtitle={`Las categorías pertenecen a este ${menuT.one} y definen cómo se agrupan sus ${prodT.many}`} onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <Input label="Nombre de la categoría" icon="fas fa-layer-group" placeholder="Ej. Entradas"
          value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Descripción" placeholder="Opcional"
          value={description} onChange={(e) => setDescription(e.target.value)} />
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}

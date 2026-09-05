import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, IconButton, RefreshButton, Badge, Modal, Spinner, Alert, useToast } from '../components';
import { SortableList, FileUpload } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { useSetPageBack } from '../lib/pageTitle.jsx';
import { ItemFormModal } from './ItemFormModal.jsx';
import { GroupFormModal, OptionFormModal, isRemoveGroup, rulesText, fmtPrice, extraPrice } from './OptionGroupModals.jsx';
import { entityTerm } from '../lib/terms.js';
import s from './screens.module.css';
import t from './ProductDetail.module.css';

// Los modales de grupo y de opción (y sus helpers de tipo REMOVE, precio y reglas) viven en
// OptionGroupModals.jsx: también los usa el módulo de opciones generales.

export function ProductDetail() {
  // Terminología por tipo de compañía: el "producto" puede llamarse "ítem" o "servicio".
  const prodT = entityTerm('product');
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // El "volver" se publica al Topbar: la flecha se pinta arriba, junto al título de la sección.
  useSetPageBack(() => navigate('/products'));

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
  const [actionError, setActionError] = React.useState('');

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
    setActionError('');
    try {
      await api.deleteOptionGroup(itemId, delGroup.id);
      setDelGroup(null); groupsRes.reload(); optsRes.reload();
      toast({ tone: 'neutral', title: 'Grupo eliminado' });
    } catch (e) {
      setActionError(e?.message || 'No se pudo eliminar el grupo.');
    } finally { setSaving(false); }
  };
  const removeOpt = async () => {
    setSaving(true);
    setActionError('');
    try {
      await api.deleteOption(itemId, delOpt.id);
      setDelOpt(null); optsRes.reload();
      toast({ tone: 'neutral', title: 'Opción eliminada' });
    } catch (e) {
      setActionError(e?.message || 'No se pudo eliminar la opción.');
    } finally { setSaving(false); }
  };

  const loading = itemRes.loading || groupsRes.loading || optsRes.loading;
  const itemImage = item && (item.thumbnail_file || item.file);
  // Un error del servidor se queda junto a la acción que falló (nunca es un toast). Como estas
  // acciones se confirman en un modal, el Alert se pinta DENTRO del cuerpo de cada modal.
  const errorBlock = actionError
    ? <Alert tone="danger" title="No se pudo completar la acción" onClose={() => setActionError('')}>{actionError}</Alert>
    : null;

  return (
    <div className={s.page}>
      {/* Solo el refrescar: el volver vive en el Topbar. */}
      <div className={t.header}>
        <div className={s.spacer} />
        <RefreshButton
          loading={itemRes.loading || groupsRes.loading || optsRes.loading}
          onClick={() => { itemRes.reload(); groupsRes.reload(); optsRes.reload(); }} />
      </div>

      {/* Tarjeta del producto (hero): imagen + datos + editar. La foto se cambia desde la imagen. */}
      {item ? (
        <div className={t.hero}>
          <button type="button" className={t.heroImage} onClick={() => setPhoto(true)} title="Cambiar foto" aria-label="Cambiar foto">
            {itemImage
              ? <img src={itemImage} alt={item.name} />
              : item.icon
                ? <span className={t.heroEmoji} aria-hidden="true">{item.icon}</span>
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
            title={`Editar ${prodT.one}`} onClick={() => setEditItem(true)} />
        </div>
      ) : itemRes.loading ? (
        <div className={t.hero}><Spinner label={`Cargando ${prodT.one}…`} /></div>
      ) : itemRes.error ? (
        <Alert tone="danger" title={`No se pudo cargar el ${prodT.one}`}>{itemRes.error}</Alert>
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
            <Alert tone="danger" title="No se pudieron cargar las opciones">{groupsRes.error}</Alert>
          ) : groups.length === 0 ? (
            <div className={t.empty}>
              <i className="fas fa-list-check" />
              Este {prodT.one} aún no tiene grupos de opciones. Usa “Nuevo grupo”.
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
                        {isRemoveGroup(g) && <Badge variant="warning">Para quitar</Badge>}
                        {!g.status && <Badge variant="neutral" dot>Inactivo</Badge>}
                      </div>
                      <span className={t.groupRules}>{rulesText(g)}</span>
                    </div>
                    <span className={t.groupActions}>
                      <Button variant="outline-primary" size="sm" icon="fas fa-plus"
                        onClick={() => setOptForm({ groupId: g.id, groupType: g.type })}>{isRemoveGroup(g) ? 'Ingrediente' : 'Opción'}</Button>
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
                          <span className={t.optName}>{isRemoveGroup(g) ? `− ${o.name}` : o.name}</span>
                          <span className={t.optPrice}>{isRemoveGroup(g) ? 'Se quita' : extraPrice(o.value)}</span>
                          <span className={t.optActions}>
                            <IconButton icon="fas fa-pen" variant="light" title="Editar opción" size="sm" onClick={() => setOptForm({ groupId: g.id, groupType: g.type, option: o })} />
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
        <GroupFormModal group={groupForm.id ? groupForm : null}
          onSubmit={(payload) => (groupForm.id ? api.updateOptionGroup(itemId, groupForm.id, payload) : api.createOptionGroup(itemId, payload))}
          onClose={() => setGroupForm(null)} onSaved={() => { setGroupForm(null); groupsRes.reload(); }} />
      )}
      {optForm && (
        <OptionFormModal groupType={optForm.groupType} option={optForm.option}
          onSubmit={(payload) => {
            const body = { group_id: Number(optForm.groupId), ...payload };
            return optForm.option ? api.updateOption(itemId, optForm.option.id, body) : api.createOption(itemId, body);
          }}
          onClose={() => setOptForm(null)} onSaved={() => { setOptForm(null); optsRes.reload(); }} />
      )}

      <Modal open={!!delGroup} size="sm" title="Eliminar grupo" onClose={() => setDelGroup(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelGroup(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={removeGroup}>Eliminar</Button>
        </>}>
        <div className={s.formCol}>
          {errorBlock}
          <p>¿Eliminar el grupo <strong>{delGroup?.name}</strong> y todas sus opciones?</p>
        </div>
      </Modal>
      <Modal open={!!delOpt} size="sm" title="Eliminar opción" onClose={() => setDelOpt(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelOpt(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={removeOpt}>Eliminar</Button>
        </>}>
        <div className={s.formCol}>
          {errorBlock}
          <p>¿Eliminar la opción <strong>{delOpt?.name}</strong>?</p>
        </div>
      </Modal>
    </div>
  );
}

// ── Modal: subir/cambiar la foto del producto ──
// La imagen se edita (recorte/giro) y solo al Guardar se sube a S3 (pública, para renderizarla por
// URL); luego se guarda su `name` en el producto.
function ProductImageModal({ item, onClose, onSaved }) {
  const prodT = entityTerm('product');
  const { toast } = useToast();
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
      toast({ tone: 'success', title: 'Imagen actualizada' });
    } catch (e) {
      setErr(e?.message || `No se pudo guardar la imagen del ${prodT.one}.`);
    } finally { setSaving(false); }
  };

  return (
    <Modal open title={`Foto del ${prodT.one}`} subtitle={item.name} size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!hasImage} onClick={save}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <FileUpload ref={uploaderRef} folder="items" visibility="public" aspect={1}
          value={item.standard_file || item.file}
          hint="JPG, PNG o WEBP · máx. 10 MB. Recorta o gira la imagen; se subirá al guardar."
          onChange={setHasImage} />
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}

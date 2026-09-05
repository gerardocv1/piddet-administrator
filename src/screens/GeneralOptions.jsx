import React from 'react';
import { Button, IconButton, RefreshButton, Badge, Modal, Spinner, Alert, FilterBar, SortableList, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { entityTerm } from '../lib/terms.js';
import { GroupFormModal, OptionFormModal, isRemoveGroup, rulesText, extraPrice } from './OptionGroupModals.jsx';
import { ProductPickerModal } from './ProductPickerModal.jsx';
import s from './screens.module.css';
import t from './ProductDetail.module.css';
import g from './GeneralOptions.module.css';

/**
 * Opciones generales: grupos de opciones de la COMPAÑÍA (p. ej. «Servicios»: despachar,
 * cubiertos) que se asignan a varios productos a la vez. El menú del POS los expone dentro de
 * cada producto asignado, detrás de sus grupos propios, con la misma forma. Cada grupo trae sus
 * opciones y `items_count` en el mismo listado; la lista de productos se administra desde el
 * modal de selección (búsqueda y filtro por categoría, con guardado de la lista completa).
 */
export function GeneralOptions() {
  const prodT = entityTerm('product');
  const { toast } = useToast();
  const [q, setQ] = React.useState('');

  const { data, loading, error, setData, reload } = useResource(api.generalOptionGroups, []);
  const groups = React.useMemo(
    () => [...(data || [])].sort((a, b) => a.position - b.position),
    [data],
  );
  // La búsqueda filtra en memoria: el listado ya trae todos los grupos de la compañía.
  const term = q.trim().toLowerCase();
  const visible = term
    ? groups.filter((gr) => gr.name.toLowerCase().includes(term) || (gr.options || []).some((o) => o.name.toLowerCase().includes(term)))
    : groups;

  const [groupForm, setGroupForm] = React.useState(null); // {} nuevo | grupo (editar)
  const [delGroup, setDelGroup] = React.useState(null);
  const [optForm, setOptForm] = React.useState(null); // { group, option? }
  const [delOpt, setDelOpt] = React.useState(null); // { group, option }
  const [picker, setPicker] = React.useState(null); // grupo al que se le eligen productos
  const [saving, setSaving] = React.useState(false);
  const [actionError, setActionError] = React.useState('');

  // Reorden de grupos: optimista + un sort en lote. Solo se reordena sin filtro activo, para
  // que las posiciones enviadas correspondan a la lista completa.
  const reorderGroups = (next) => {
    setData(next.map((gr, i) => ({ ...gr, position: i })));
    api.sortGeneralOptionGroups(next.map((gr, i) => ({ id: gr.id, position: i })));
  };

  // Reorden de opciones dentro de un grupo: optimista + sort en lote.
  const reorderOptions = (group, nextRows) => {
    setData(groups.map((gr) => (gr.id === group.id
      ? { ...gr, options: nextRows.map((o, i) => ({ ...o, position: i })) }
      : gr)));
    api.sortGeneralOptions(group.id, nextRows.map((o, i) => ({ id: o.id, position: i })));
  };

  const removeGroup = async () => {
    setSaving(true);
    setActionError('');
    try {
      await api.deleteGeneralOptionGroup(delGroup.id);
      setDelGroup(null); reload();
      toast({ tone: 'neutral', title: 'Grupo eliminado' });
    } catch (e) {
      setActionError(e?.message || 'No se pudo eliminar el grupo.');
    } finally { setSaving(false); }
  };
  const removeOpt = async () => {
    setSaving(true);
    setActionError('');
    try {
      await api.deleteGeneralOption(delOpt.group.id, delOpt.option.id);
      setDelOpt(null); reload();
      toast({ tone: 'neutral', title: 'Opción eliminada' });
    } catch (e) {
      setActionError(e?.message || 'No se pudo eliminar la opción.');
    } finally { setSaving(false); }
  };

  // Un error del servidor se queda junto a la acción que falló (nunca es un toast). Como estas
  // acciones se confirman en un modal, el Alert se pinta DENTRO del cuerpo de cada modal.
  const errorBlock = actionError
    ? <Alert tone="danger" title="No se pudo completar la acción" onClose={() => setActionError('')}>{actionError}</Alert>
    : null;

  const itemsLabel = (n) => (n === 1 ? `1 ${prodT.one}` : `${n} ${prodT.many}`);

  const renderGroup = (gr, { handleProps }) => {
    const rows = [...(gr.options || [])].sort((a, b) => a.position - b.position);
    const count = Number(gr.items_count) || 0;
    return (
      <div className={t.group}>
        <div className={`${t.groupHead} ${g.groupHead}`}>
          <button {...handleProps} className={t.handle} type="button" aria-label="Arrastrar grupo" disabled={!!term}>
            <i className="fas fa-grip-vertical" />
          </button>
          <div className={t.groupInfo}>
            <div className={t.groupTitleRow}>
              <span className={t.groupName}>{gr.name}</span>
              {isRemoveGroup(gr) && <Badge variant="warning">Para quitar</Badge>}
              {!gr.status && <Badge variant="neutral" dot>Inactivo</Badge>}
            </div>
            <span className={t.groupRules}>{rulesText(gr)}</span>
          </div>
          <span className={`${t.groupActions} ${g.groupActions}`}>
            {/* Los productos a los que aplica el grupo: el contador abre el selector. */}
            <Button variant={count > 0 ? 'outline-primary' : 'secondary'} size="sm" icon="fas fa-burger"
              title={`Elegir ${prodT.many} a los que aplica`} onClick={() => setPicker(gr)}>
              {count > 0 ? itemsLabel(count) : `Asignar ${prodT.many}`}
            </Button>
            <Button variant="outline-primary" size="sm" icon="fas fa-plus"
              onClick={() => setOptForm({ group: gr })}>{isRemoveGroup(gr) ? 'Ingrediente' : 'Opción'}</Button>
            <IconButton icon="fas fa-pen" variant="light" title="Editar grupo" size="sm" onClick={() => setGroupForm(gr)} />
            <IconButton icon="fas fa-trash" variant="danger" title="Eliminar grupo" size="sm" onClick={() => setDelGroup(gr)} />
          </span>
        </div>

        {count === 0 && (
          <div className={g.unassigned}>
            <i className="fas fa-circle-info" aria-hidden="true" />
            Este grupo aún no aplica a ningún {prodT.one}: no se verá en el menú hasta asignarle {prodT.many}.
          </div>
        )}

        {rows.length === 0 ? (
          <div className={t.optEmpty}>Sin opciones en este grupo.</div>
        ) : (
          <SortableList items={rows} onReorder={(next) => reorderOptions(gr, next)}
            renderItem={(o, { handleProps: oh }) => (
              <div className={t.optRow}>
                <button {...oh} className={t.handle} type="button" aria-label="Arrastrar opción">
                  <i className="fas fa-grip-vertical" />
                </button>
                <span className={t.optName}>{isRemoveGroup(gr) ? `− ${o.name}` : o.name}</span>
                {Number(o.status) !== 1 && <Badge variant="neutral" dot>Inactiva</Badge>}
                <span className={t.optPrice}>{isRemoveGroup(gr) ? 'Se quita' : extraPrice(o.value)}</span>
                <span className={t.optActions}>
                  <IconButton icon="fas fa-pen" variant="light" title="Editar opción" size="sm" onClick={() => setOptForm({ group: gr, option: o })} />
                  <IconButton icon="fas fa-trash" variant="danger" title="Eliminar opción" size="sm" onClick={() => setDelOpt({ group: gr, option: o })} />
                </span>
              </div>
            )} />
        )}
      </div>
    );
  };

  return (
    <div className={s.page}>
      <FilterBar
        searchable
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Buscar grupo u opción"
        actions={<>
          <RefreshButton loading={loading} onClick={reload} />
          <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => setGroupForm({})}>Nuevo grupo</Button>
        </>}
      />

      <div className={t.card}>
        <div className={t.cardHead}>
          <div className={t.cardHeadText}>
            <h3 className={t.cardTitle}>Grupos de opciones generales</h3>
            <p className={t.cardSub}>
              Un mismo grupo (por ejemplo «Servicios»: despachar, cubiertos) aplica a varios {prodT.many} y el menú lo muestra en cada uno.
            </p>
          </div>
        </div>

        <div className={t.cardBody}>
          {loading ? (
            <Spinner center label="Cargando opciones generales…" />
          ) : error ? (
            <Alert tone="danger" title="No se pudieron cargar las opciones generales">{error}</Alert>
          ) : groups.length === 0 ? (
            <div className={t.empty}>
              <i className="fas fa-sliders" />
              Aún no hay grupos de opciones generales. Usa “Nuevo grupo”.
            </div>
          ) : visible.length === 0 ? (
            <div className={t.empty}>
              <i className="fas fa-magnifying-glass" />
              No hay grupos ni opciones que coincidan con “{q}”.
            </div>
          ) : (
            <SortableList items={visible} disabled={!!term} onReorder={reorderGroups} renderItem={renderGroup} />
          )}
        </div>
      </div>

      {groupForm && (
        <GroupFormModal group={groupForm.id ? groupForm : null}
          subtitle={`Reglas de selección que verá el cliente en cada ${prodT.one} asignado`}
          onSubmit={(payload) => (groupForm.id ? api.updateGeneralOptionGroup(groupForm.id, payload) : api.createGeneralOptionGroup(payload))}
          onClose={() => setGroupForm(null)}
          onSaved={() => { setGroupForm(null); reload(); }} />
      )}
      {optForm && (
        <OptionFormModal groupType={optForm.group.type} option={optForm.option}
          onSubmit={(payload) => (optForm.option
            ? api.updateGeneralOption(optForm.group.id, optForm.option.id, payload)
            : api.createGeneralOption(optForm.group.id, payload))}
          onClose={() => setOptForm(null)}
          onSaved={() => { setOptForm(null); reload(); }} />
      )}
      {picker && (
        <ProductPickerModal group={picker} onClose={() => setPicker(null)}
          onSaved={() => { setPicker(null); reload(); }} />
      )}

      <Modal open={!!delGroup} size="sm" title="Eliminar grupo" onClose={() => setDelGroup(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelGroup(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={removeGroup}>Eliminar</Button>
        </>}>
        <div className={s.formCol}>
          {errorBlock}
          <p>¿Eliminar el grupo <strong>{delGroup?.name}</strong> y todas sus opciones? Dejará de verse en los {prodT.many} a los que aplica.</p>
        </div>
      </Modal>
      <Modal open={!!delOpt} size="sm" title="Eliminar opción" onClose={() => setDelOpt(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDelOpt(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={removeOpt}>Eliminar</Button>
        </>}>
        <div className={s.formCol}>
          {errorBlock}
          <p>¿Eliminar la opción <strong>{delOpt?.option?.name}</strong>?</p>
        </div>
      </Modal>
    </div>
  );
}

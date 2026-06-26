import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, Switch, Spinner, Pagination, Dropdown, Modal } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';
import t from './Stores.module.css';

const EMPTY = { items: [], pagination: null };

export function Stores() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState('');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const id = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const fetcher = React.useCallback(() => api.stores({ page, search }), [page, search]);
  const { data, setData, loading, error, reload } = useResource(fetcher, EMPTY, [page, search]);
  const stores = data.items || [];
  const pg = data.pagination;

  const [del, setDel] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const ACTIVE = 1;
  const INACTIVE = 2;
  const patchStore = (id, patch) =>
    setData((d) => ({ ...d, items: (d.items || []).map((x) => x.id === id ? { ...x, ...patch } : x) }));

  const isActive = (store) => store.store_status_id === ACTIVE;

  const toggleStatus = async (store) => {
    const prev = { store_status_id: store.store_status_id, status: store.status };
    const next = isActive(store) ? INACTIVE : ACTIVE;
    patchStore(store.id, { store_status_id: next, status: { id: next, name: next === ACTIVE ? 'Activo' : 'Inactiva' } });
    try {
      await api.setStoreStatus(store.id, next);
    } catch {
      patchStore(store.id, prev); // revertir si falla
    }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.deleteStore(del.id); setDel(null); reload(); }
    finally { setBusy(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <div className={t.search}>
          <i className="fas fa-search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tienda" />
        </div>
        <div className={s.spacer} />
        <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => navigate('/stores/new')}>
          Añadir tienda
        </Button>
      </div>

      {loading ? (
        <Spinner center label="Cargando tiendas…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
      ) : stores.length === 0 ? (
        <div className={t.empty}>
          <i className="fas fa-store" />
          {search ? 'No hay tiendas que coincidan con la búsqueda.' : 'Aún no has creado tiendas.'}
        </div>
      ) : (
        <div className={t.grid}>
          {stores.map((x) => (
            <div key={x.id} className={[t.card, isActive(x) ? '' : t.cardOff].filter(Boolean).join(' ')} role="button" tabIndex={0}
              onClick={() => navigate(`/stores/${x.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/stores/${x.id}`); }}>
              <div className={t.cardTop}>
                <div className={t.head}>
                  <span className={t.icon}><i className="fas fa-store" /></span>
                  <div style={{ minWidth: 0 }}>
                    <div className={t.name}>{x.name}</div>
                    <span className={[s.status, isActive(x) ? s.on : s.off].join(' ')}>
                      <span className={s.statusDot} />{x.status?.name || (isActive(x) ? 'Activo' : 'Inactiva')}
                    </span>
                  </div>
                </div>
                <span onClick={(e) => e.stopPropagation()}>
                  <Dropdown
                    trigger={<IconButton icon="fas fa-ellipsis-v" variant="ghost" size="sm" title="Acciones" />}
                    items={[
                      { label: 'Administrar', icon: 'fas fa-sliders', onClick: () => navigate(`/stores/${x.id}`) },
                      { label: isActive(x) ? 'Inactivar' : 'Activar', icon: isActive(x) ? 'fas fa-pause' : 'fas fa-play', onClick: () => toggleStatus(x) },
                      { label: 'Eliminar', icon: 'fas fa-trash', variant: 'danger', onClick: () => setDel(x) },
                    ]}
                  />
                </span>
              </div>

              <div className={t.meta}>
                {x.address && <span><i className="fas fa-location-dot" />{x.address}</span>}
                {x.phone_number && <span><i className="fas fa-phone" />{x.phone_code ? `+${x.phone_code} ` : ''}{x.phone_number}</span>}
                {x.latitude != null && x.longitude != null && (
                  <span><i className="fas fa-map-pin" />{Number(x.latitude).toFixed(4)}, {Number(x.longitude).toFixed(4)}</span>
                )}
              </div>

              <div className={t.foot} onClick={(e) => e.stopPropagation()}>
                <Switch label="Activa" checked={isActive(x)} onChange={() => toggleStatus(x)} />
                <span className={t.link} onClick={() => navigate(`/stores/${x.id}`)}>Administrar</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total} onChange={setPage} disabled={loading} />
      )}

      <Modal open={!!del} size="sm" title="Eliminar tienda" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={busy} onClick={remove}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas eliminar <strong>{del?.name}</strong>? La tienda dejará de estar disponible.
      </Modal>
    </div>
  );
}

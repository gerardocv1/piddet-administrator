import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, Input, Textarea, Modal, Spinner, Pagination, Dropdown } from '../components';
import { api } from '../lib/api.js';
import { auth } from '../lib/auth/index.js';
import { useResource } from '../lib/useResource.js';
import { slugifyUsername } from '../lib/slug.js';
import { ADMIN_BASE } from '../lib/adminBase.js';
import s from './screens.module.css';
import t from './Menus.module.css';

const EMPTY = { items: [], pagination: null };

export function Menus() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState('');
  const [search, setSearch] = React.useState('');

  // Búsqueda con debounce: vuelve a la primera página al cambiar el término.
  React.useEffect(() => {
    const id = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const fetcher = React.useCallback(() => api.menus({ page, search }), [page, search]);
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, [page, search]);
  const menus = data.items || [];
  const pg = data.pagination;

  const [form, setForm] = React.useState(null); // { id?, name, username, description }
  const [usernameTouched, setUsernameTouched] = React.useState(false);
  const [del, setDel] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // Identificador de la compañía activa para construir la URL pública de la carta.
  const companyUsername = React.useMemo(() => {
    const c = auth.getCompany();
    return c?.username ?? c?.id;
  }, []);
  const publicUrl = (username) => `${window.location.origin}/${companyUsername}/m/${username}`;

  const openNew = () => { setUsernameTouched(false); setForm({ name: '', username: '', description: '' }); };
  const openEdit = (m) => { setUsernameTouched(true); setForm({ id: m.id, name: m.name, username: m.username || '', description: m.description || '' }); };

  // Al teclear el nombre, autogenera el username mientras el usuario no lo haya editado a mano.
  const onNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, username: usernameTouched ? f.username : slugifyUsername(name) }));
  };
  const onUsernameChange = (e) => {
    setUsernameTouched(true);
    setForm((f) => ({ ...f, username: slugifyUsername(e.target.value) }));
  };

  const copyPublicUrl = (m) => {
    navigator.clipboard?.writeText(publicUrl(m.username)).catch(() => {});
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) return;
    const username = form.username.trim() || slugifyUsername(name);
    setSaving(true);
    try {
      if (form.id) await api.updateMenu(form.id, { name, username, description: form.description });
      else await api.createMenu({ name, username, description: form.description });
      setForm(null);
      reload();
    } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true);
    try { await api.deleteMenu(del.id); setDel(null); reload(); }
    finally { setSaving(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <div className={t.search}>
          <i className="fas fa-search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar menú" />
        </div>
        <div className={s.spacer} />
        <Button variant="primary" size="sm" icon="fas fa-plus" onClick={openNew}>Nuevo menú</Button>
      </div>

      {loading ? (
        <Spinner center label="Cargando menús…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
      ) : menus.length === 0 ? (
        <div className={t.empty}>
          <i className="fas fa-book-open" />
          {search ? 'No hay menús que coincidan con la búsqueda.' : 'Aún no has creado menús.'}
        </div>
      ) : (
        <div className={t.tableCard}>
          <div className={`${t.row} ${t.headRow}`}>
            <span>Menú</span>
            <span className={t.colNum}>Productos</span>
            <span className={t.colActions} />
          </div>
          {menus.map((m) => (
            <div key={m.id} className={t.row} role="button" tabIndex={0}
              onClick={() => navigate(`/menus/${m.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/menus/${m.id}`); }}>
              <div className={t.menuCell}>
                <span className={t.icon}><i className="fas fa-book-open" /></span>
                <div className={t.menuText}>
                  <div className={t.name}>{m.name}</div>
                  {m.description && <div className={t.desc}>{m.description}</div>}
                </div>
              </div>
              <span className={t.colNum}>
                <span className={t.count}>
                  <i className="fas fa-burger" />
                  {m.items_count ?? 0} {m.items_count === 1 ? 'producto' : 'productos'}
                </span>
              </span>
              {/* stopPropagation evita que las acciones disparen la navegación de la fila. */}
              <span className={t.colActions} onClick={(e) => e.stopPropagation()}>
                <Dropdown
                  trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Acciones" />}
                  items={[
                    { label: 'Administrar', icon: 'fas fa-sliders', onClick: () => navigate(`/menus/${m.id}`) },
                    { label: 'Generar menú (carta)', icon: 'fas fa-eye', onClick: () => window.open(`${ADMIN_BASE}/menus/${m.id}/preview`, '_blank') },
                    { label: 'Ver carta pública', icon: 'fas fa-share-nodes', onClick: () => window.open(publicUrl(m.username), '_blank') },
                    { label: 'Copiar enlace público', icon: 'fas fa-link', onClick: () => copyPublicUrl(m) },
                    { label: 'Editar', icon: 'fas fa-pen', onClick: () => openEdit(m) },
                    { label: 'Eliminar', icon: 'fas fa-trash', variant: 'danger', onClick: () => setDel(m) },
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

      {/* Crear / editar menú */}
      <Modal open={!!form} title={form?.id ? 'Editar menú' : 'Nuevo menú'}
        subtitle={form?.id ? 'Actualiza los datos del menú' : 'Crea un menú para un momento o aplicación'}
        onClose={() => setForm(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Guardar</Button>
        </>}>
        {form && (
          <div className={s.formCol}>
            <Input label="Nombre del menú" icon="fas fa-book-open" placeholder="Ej. Carta principal"
              value={form.name} onChange={onNameChange} />
            <Input label="Identificador (URL)" icon="fas fa-link" placeholder="Ej. carta_principal"
              value={form.username} onChange={onUsernameChange}
              hint={form.username ? `Carta pública: ${publicUrl(form.username)}` : 'Se usará en la URL pública del menú; se genera del nombre.'} />
            {form.username && (
              <Button variant="secondary" size="sm" icon="fas fa-copy"
                onClick={() => copyPublicUrl(form)}>Copiar enlace público</Button>
            )}
            <Textarea label="Descripción" placeholder="Opcional"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        )}
      </Modal>

      {/* Eliminar menú */}
      <Modal open={!!del} size="sm" title="Eliminar menú" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={remove}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas eliminar <strong>{del?.name}</strong>? Esta acción no se puede deshacer.
      </Modal>
    </div>
  );
}

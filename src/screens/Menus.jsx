import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, RefreshButton, Input, Textarea, Modal, Spinner, Pagination, Dropdown, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { auth } from '../lib/auth/index.js';
import { useResource } from '../lib/useResource.js';
import { slugifyUsername } from '../lib/slug.js';
import { ADMIN_BASE } from '../lib/adminBase.js';
import { entityTerm, cap } from '../lib/terms.js';
import s from './screens.module.css';
import t from './Menus.module.css';

const EMPTY = { items: [], pagination: null };

export function Menus() {
  const navigate = useNavigate();
  const { toast } = useToast();
  // Terminología por tipo de compañía: aquí el "menú" puede llamarse "catálogo público"
  // (gimnasio/tienda/hospedaje) y el "producto", "ítem" o "servicio".
  const menuT = entityTerm('menu');
  const prodT = entityTerm('product');
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
  const [toggle, setToggle] = React.useState(null); // menú pendiente de confirmar activación/desactivación
  const [saving, setSaving] = React.useState(false);
  // Error de la última mutación. Vive aquí y se pinta DENTRO de cada modal: los tres fallan con
  // el overlay puesto, así que un banner de pantalla quedaría tapado.
  const [actionError, setActionError] = React.useState('');
  const errorBlock = actionError
    ? <Alert tone="danger" title="No se pudo completar la acción" onClose={() => setActionError('')}>{actionError}</Alert>
    : null;

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
    setSaving(true); setActionError('');
    try {
      if (form.id) await api.updateMenu(form.id, { name, username, description: form.description });
      else await api.createMenu({ name, username, description: form.description });
      setForm(null);
      reload();
      toast({ tone: 'success', title: form.id ? `${cap(menuT.one)} actualizado` : `${cap(menuT.one)} creado` });
    } catch (e) {
      setActionError(e?.message || `No se pudo guardar el ${menuT.one}.`);
    } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true); setActionError('');
    try {
      await api.deleteMenu(del.id);
      setDel(null);
      reload();
      toast({ tone: 'neutral', title: `${cap(menuT.one)} eliminado` });
    } catch (e) {
      setActionError(e?.message || `No se pudo eliminar el ${menuT.one}.`);
    } finally { setSaving(false); }
  };

  const confirmToggle = async () => {
    setSaving(true); setActionError('');
    const activating = !toggle.is_active;
    try {
      await api.setMenuActive(toggle.id, activating);
      setToggle(null);
      reload();
      toast({
        tone: activating ? 'success' : 'neutral',
        title: activating ? `${cap(menuT.one)} activado` : `${cap(menuT.one)} desactivado`,
      });
    } catch (e) {
      setActionError(e?.message || `No se pudo cambiar el estado del ${menuT.one}.`);
    } finally { setSaving(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <div className={t.search}>
          <i className="fas fa-search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar ${menuT.one}`} />
        </div>
        <div className={s.spacer} />
        <RefreshButton loading={loading} onClick={reload} />
        <Button variant="primary" size="sm" icon="fas fa-plus" onClick={openNew}>Nuevo {menuT.one}</Button>
      </div>

      {loading ? (
        <Spinner center label={`Cargando ${menuT.many}…`} />
      ) : error ? (
        <Alert tone="danger" title={`No se pudo cargar los ${menuT.many}`}>{error}</Alert>
      ) : menus.length === 0 ? (
        <div className={t.empty}>
          <i className="fas fa-book-open" />
          {search ? `No hay ${menuT.many} que coincidan con la búsqueda.` : `Aún no has creado ${menuT.many}.`}
        </div>
      ) : (
        <div className={t.tableCard}>
          <div className={`${t.row} ${t.headRow}`}>
            <span>{cap(menuT.one)}</span>
            <span className={t.colNum}>{cap(prodT.many)}</span>
            <span className={t.colActions} />
          </div>
          {menus.map((m) => (
            <div key={m.id} className={`${t.row} ${m.is_active ? '' : t.rowOff}`} role="button" tabIndex={0}
              onClick={() => navigate(`/menus/${m.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/menus/${m.id}`); }}>
              <div className={t.menuCell}>
                <span className={t.icon}><i className="fas fa-book-open" /></span>
                <div className={t.menuText}>
                  <div className={t.nameLine}>
                    <span className={t.name}>{m.name}</span>
                    <span className={`${t.badge} ${m.is_active ? t.badgeOn : t.badgeOff}`}>
                      <i className={m.is_active ? 'fas fa-circle-check' : 'fas fa-circle-pause'} />
                      {m.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {m.description && <div className={t.desc}>{m.description}</div>}
                </div>
              </div>
              <span className={t.colNum}>
                <span className={t.count}>
                  <i className="fas fa-burger" />
                  {m.items_count ?? 0} {m.items_count === 1 ? prodT.one : prodT.many}
                </span>
              </span>
              {/* stopPropagation evita que las acciones disparen la navegación de la fila. */}
              <span className={t.colActions} onClick={(e) => e.stopPropagation()}>
                <Dropdown
                  trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Acciones" />}
                  items={[
                    { label: 'Administrar', icon: 'fas fa-sliders', onClick: () => navigate(`/menus/${m.id}`) },
                    { label: menuT.pub === menuT.one ? `Generar ${menuT.one}` : `Generar ${menuT.one} (${menuT.pub})`, icon: 'fas fa-eye', onClick: () => window.open(`${ADMIN_BASE}/menus/${m.id}/preview`, '_blank') },
                    { label: `Ver ${menuT.pubFull}`, icon: 'fas fa-share-nodes', onClick: () => window.open(publicUrl(m.username), '_blank') },
                    { label: 'Copiar enlace público', icon: 'fas fa-link', onClick: () => copyPublicUrl(m) },
                    {
                      label: m.is_active ? 'Desactivar' : 'Activar',
                      icon: m.is_active ? 'fas fa-toggle-off' : 'fas fa-toggle-on',
                      onClick: () => setToggle(m),
                    },
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
      <Modal open={!!form} title={form?.id ? `Editar ${menuT.one}` : `Nuevo ${menuT.one}`}
        subtitle={form?.id ? `Actualiza los datos del ${menuT.one}` : `Crea un ${menuT.one} para un momento o aplicación`}
        onClose={() => setForm(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Guardar</Button>
        </>}>
        {form && (
          <div className={s.formCol}>
            {errorBlock}
            <Input label={`Nombre del ${menuT.one}`} icon="fas fa-book-open" placeholder={`Ej. ${menuT.sample}`}
              value={form.name} onChange={onNameChange} />
            <Input label="Identificador (URL)" icon="fas fa-link" placeholder="Ej. carta_principal"
              value={form.username} onChange={onUsernameChange}
              hint={form.username ? `${cap(menuT.pubFull)}: ${publicUrl(form.username)}` : `Se usará en la URL pública del ${menuT.one}; se genera del nombre.`} />
            {form.username && (
              <Button variant="secondary" size="sm" icon="fas fa-copy"
                onClick={() => copyPublicUrl(form)}>Copiar enlace público</Button>
            )}
            <Textarea label="Descripción" placeholder="Opcional"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        )}
      </Modal>

      {/* Activar / desactivar menú */}
      <Modal open={!!toggle} size="sm" title={toggle?.is_active ? `Desactivar ${menuT.one}` : `Activar ${menuT.one}`}
        onClose={() => setToggle(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setToggle(null)}>Cancelar</Button>
          <Button variant={toggle?.is_active ? 'danger' : 'primary'}
            icon={toggle?.is_active ? 'fas fa-toggle-off' : 'fas fa-toggle-on'}
            loading={saving} onClick={confirmToggle}>
            {toggle?.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </>}>
        {errorBlock}
        {toggle?.is_active
          ? <>Al desactivar <strong>{toggle?.name}</strong> dejará de mostrarse en la página pública de la empresa y su {menuT.pub} no podrá abrirse, ni siquiera con el enlace directo. Podrás volver a activarlo cuando quieras.</>
          : <>Al activar <strong>{toggle?.name}</strong> volverá a mostrarse en la página pública de la empresa y su {menuT.pub} será accesible.</>}
      </Modal>

      {/* Eliminar menú */}
      <Modal open={!!del} size="sm" title={`Eliminar ${menuT.one}`} onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" loading={saving} onClick={remove}>Eliminar</Button>
        </>}>
        {errorBlock}
        ¿Seguro que deseas eliminar <strong>{del?.name}</strong>? Esta acción no se puede deshacer.
      </Modal>
    </div>
  );
}

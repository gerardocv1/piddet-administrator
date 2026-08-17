import React from 'react';
import { Avatar, Badge, Button, IconButton, RefreshButton, Input, Select, Checkbox, Modal, Card, DataTable, Pagination, FilterBar, Spinner } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };
const ROLES_VISIBLE = 2;

// Tipo del usuario dentro de la compañía (company_users.user_type_id).
const USER_TYPE_CLIENT = '1';
const USER_TYPE_EMPLOYEE = '2';
const USER_TYPES = [
  { value: USER_TYPE_EMPLOYEE, label: 'Empleado' },
  { value: USER_TYPE_CLIENT, label: 'Cliente' },
];
const userTypeLabel = (id) => (String(id) === USER_TYPE_CLIENT ? 'Cliente' : 'Empleado');

// Muestra hasta ROLES_VISIBLE roles y agrupa el resto en un "+N" (con el detalle en el tooltip).
function RolesCell({ roles = [] }) {
  if (!roles.length) return <span className={s.muted}>—</span>;
  const shown = roles.slice(0, ROLES_VISIBLE);
  const rest = roles.slice(ROLES_VISIBLE);
  return (
    <span className={s.actions}>
      {shown.map((r) => <Badge key={r.name} variant="neutral">{r.label}</Badge>)}
      {rest.length > 0 && (
        <Badge variant="neutral" title={rest.map((r) => r.label).join(', ')}>+{rest.length}</Badge>
      )}
    </span>
  );
}

export function Users() {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState('');
  const [search, setSearch] = React.useState('');
  // Por defecto se listan solo los empleados: son los usuarios que se administran a diario.
  const [filters, setFilters] = React.useState({ user_type_id: USER_TYPE_EMPLOYEE, role: undefined });

  // Búsqueda con debounce: vuelve a la primera página al cambiar el término.
  React.useEffect(() => {
    const id = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [q]);

  // Catálogo (una sola vez): roles asignables con los permisos que otorga cada uno.
  const [roles, setRoles] = React.useState([]);
  React.useEffect(() => {
    api.assignableRoles().then((d) => setRoles(d || [])).catch(() => {});
  }, []);

  const { user_type_id: userTypeId, role } = filters;
  const fetcher = React.useCallback(
    () => api.users({ page, search, userTypeId, role }),
    [page, search, userTypeId, role],
  );
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, [page, search, userTypeId, role]);
  const items = data.items || [];
  const pg = data.pagination;

  const [form, setForm] = React.useState(null);   // null | {} (nuevo) | user (editar)
  const [rolesOf, setRolesOf] = React.useState(null); // usuario al que asignar roles
  const [pwd, setPwd] = React.useState(null);     // usuario al que fijar contraseña
  const [del, setDel] = React.useState(null);     // usuario a desvincular
  const [saving, setSaving] = React.useState(false);

  const unlink = async () => {
    setSaving(true);
    try { await api.unlinkUser(del.id); setDel(null); reload(); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'name', header: 'Usuario', ellipsis: true, render: (r) => (
      <span className={s.user}><Avatar name={r.name} size="sm" />{r.name}</span>
    ) },
    { key: 'phone', header: 'Teléfono', width: 170, nowrap: true, render: (r) => (
      <span className={s.muted}>{r.phone_number ? `+${r.phone_code} ${r.phone_number}` : '—'}</span>
    ) },
    { key: 'type', header: 'Tipo', width: 120, render: (r) => (
      <Badge variant={String(r.user_type_id) === USER_TYPE_CLIENT ? 'info' : 'neutral'}>{userTypeLabel(r.user_type_id)}</Badge>
    ) },
    { key: 'roles', header: 'Roles', render: (r) => <RolesCell roles={r.roles} /> },
    { key: 'status', header: 'Estado', width: 120, render: (r) => (
      <span className={[s.status, r.status ? s.on : s.off].join(' ')}>
        <span className={s.statusDot} />{r.status ? 'Activo' : 'Inactivo'}
      </span>
    ) },
    { key: 'acc', header: '', width: 165, align: 'right', render: (r) => (
      <span className={s.actions}>
        <IconButton icon="fas fa-pen" variant="light" title="Editar" size="sm" onClick={() => setForm(r)} />
        <IconButton icon="fas fa-user-shield" variant="light" title="Asignar roles" size="sm" onClick={() => setRolesOf(r)} />
        <IconButton icon="fas fa-key" variant="light" title="Cambiar contraseña" size="sm" onClick={() => setPwd(r)} />
        <IconButton icon="fas fa-link-slash" variant="danger" title="Desvincular" size="sm" onClick={() => setDel(r)} />
      </span>
    ) },
  ];

  return (
    <div className={s.page}>
      <FilterBar
        searchable
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Buscar usuario"
        filters={[
          { key: 'user_type_id', label: 'Tipo', icon: 'fas fa-user-tag', type: 'select', options: USER_TYPES },
          { key: 'role', label: 'Rol', icon: 'fas fa-user-shield', type: 'select', placeholder: 'Todos los roles',
            options: roles.map((r) => ({ value: r.name, label: r.label })) },
        ]}
        values={filters}
        onChange={(next) => { setFilters(next); setPage(1); }}
        actions={<>
          <RefreshButton loading={loading} onClick={reload} />
          <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => setForm({})}>Nuevo usuario</Button>
        </>}
      />

      <div className={s.desktopList}>
        <Card>
          <DataTable columns={columns} rows={items} loading={loading} error={error} empty="Aún no hay usuarios vinculados a la compañía." />
        </Card>
      </div>

      <div className={s.mobileList}>
        {loading && <Card><div className={s.mobileState}><Spinner size="sm" label="Cargando…" /></div></Card>}
        {!loading && error && (
          <Card><div className={`${s.mobileState} ${s.mobileStateError}`}><i className="fas fa-triangle-exclamation" /> {error}</div></Card>
        )}
        {!loading && !error && items.length === 0 && (
          <Card><div className={s.mobileState}>Aún no hay usuarios vinculados a la compañía.</div></Card>
        )}
        {!loading && !error && items.map((r) => (
          <UserMobileCard key={r.id} user={r}
            onEdit={() => setForm(r)} onRoles={() => setRolesOf(r)}
            onPassword={() => setPwd(r)} onUnlink={() => setDel(r)} />
        ))}
      </div>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total} onChange={setPage} disabled={loading} />
      )}

      {form && (
        <UserFormModal user={form.id ? form : null} roles={roles}
          onClose={() => setForm(null)} onSaved={() => { setForm(null); reload(); }} />
      )}

      {rolesOf && (
        <UserRolesModal user={rolesOf} roles={roles}
          onClose={() => setRolesOf(null)} onSaved={() => { setRolesOf(null); reload(); }} />
      )}

      {pwd && (
        <PasswordModal user={pwd} onClose={() => setPwd(null)} onSaved={() => setPwd(null)} />
      )}

      <Modal open={!!del} size="sm" title="Desvincular usuario" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-link-slash" loading={saving} onClick={unlink}>Desvincular</Button>
        </>}>
        ¿Seguro que deseas retirar el acceso de <strong>{del?.name}</strong> a esta compañía? El usuario
        no se elimina; solo deja de pertenecer a la compañía.
      </Modal>
    </div>
  );
}

// ── Tarjeta de usuario en móvil (reemplaza la fila de la tabla) ─────────────────
function UserMobileCard({ user, onEdit, onRoles, onPassword, onUnlink }) {
  return (
    <Card>
      <div className={s.userCardBody}>
        <div className={s.userCardTop}>
          <Avatar name={user.name} size="sm" />
          <div className={s.userCardInfo}>
            <span className={s.userCardName}>{user.name}</span>
            <span className={s.userCardPhone}>
              {user.phone_number ? `+${user.phone_code} ${user.phone_number}` : '—'}
            </span>
          </div>
          <Badge variant={String(user.user_type_id) === USER_TYPE_CLIENT ? 'info' : 'neutral'}>
            {userTypeLabel(user.user_type_id)}
          </Badge>
        </div>
        {user.roles?.length > 0 && (
          <div className={s.userCardRoles}>
            {user.roles.map((r) => <Badge key={r.name} variant="neutral">{r.label}</Badge>)}
          </div>
        )}
        <div className={s.userCardFoot}>
          <span className={[s.status, user.status ? s.on : s.off].join(' ')}>
            <span className={s.statusDot} />{user.status ? 'Activo' : 'Inactivo'}
          </span>
          <span className={s.actions}>
            <IconButton icon="fas fa-pen" variant="light" title="Editar" size="sm" onClick={onEdit} />
            <IconButton icon="fas fa-user-shield" variant="light" title="Asignar roles" size="sm" onClick={onRoles} />
            <IconButton icon="fas fa-key" variant="light" title="Cambiar contraseña" size="sm" onClick={onPassword} />
            <IconButton icon="fas fa-link-slash" variant="danger" title="Desvincular" size="sm" onClick={onUnlink} />
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── Tipo del usuario dentro de la compañía ─────────────────────────────────────
function UserTypeField({ value, onChange }) {
  return (
    <Select label="Tipo de usuario" icon="fas fa-user-tag" options={USER_TYPES}
      value={value} onChange={(e) => onChange(e.target.value)}
      hint="Los empleados operan la compañía; los clientes solo consumen." />
  );
}

// ── Selector de roles (multi-selección con checkboxes) ──────────────────────────
// Solo la etiqueta corta del rol: qué permisos otorga cada uno se consulta en /roles.
function RolesField({ roles, selected, onToggle }) {
  if (!roles.length) return <span className={s.muted}>No hay roles asignables.</span>;
  return (
    <div className={s.formCol}>
      <span className={s.muted}>Roles</span>
      {roles.map((r) => (
        <Checkbox key={r.name} label={r.label} checked={selected.includes(r.name)} onChange={() => onToggle(r.name)} />
      ))}
    </div>
  );
}

// ── Modal: roles del usuario en la compañía ────────────────────────────────────
// Sincroniza los roles (reemplaza los que tenía). No toca datos básicos ni permisos directos:
// el update solo envía `roles`, así que el backend deja el resto intacto.
function UserRolesModal({ user, roles, onClose, onSaved }) {
  const [selected, setSelected] = React.useState(() => (user.roles || []).map((r) => r.name));
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const toggle = (name) => setSelected((xs) => (xs.includes(name) ? xs.filter((x) => x !== name) : [...xs, name]));

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      await api.updateCompanyUser(user.id, { roles: selected });
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudieron guardar los roles.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title="Roles del usuario" subtitle={user.name} size="md" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <span className={s.muted}>
          Los roles definen a qué puede acceder el usuario en esta compañía. Se guardan tal cual
          queden marcados: lo que desmarques se retira.
        </span>
        <RolesField roles={roles} selected={selected} onToggle={toggle} />
        {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
      </div>
    </Modal>
  );
}

// ── Modal: crear usuario nuevo / vincular existente / editar ────────────────────
// Al editar solo se tocan los datos básicos: los roles se asignan desde su propio modal y los
// permisos se administran a través de los roles (/roles).
function UserFormModal({ user, roles, onClose, onSaved }) {
  const editing = !!user;

  const [form, setForm] = React.useState(() => ({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_code: user?.phone_code || '57',
    phone_number: user?.phone_number || '',
    password: '',
    user_type_id: user?.user_type_id ? String(user.user_type_id) : USER_TYPE_EMPLOYEE,
  }));
  const [selected, setSelected] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  // Estado de la búsqueda por teléfono (solo al crear).
  const [searching, setSearching] = React.useState(false);
  const [result, setResult] = React.useState(null); // null | { exists, linked, user }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleRole = (name) => setSelected((xs) => (xs.includes(name) ? xs.filter((x) => x !== name) : [...xs, name]));

  // Modo del formulario al crear: buscar → vincular | crear | bloqueado.
  const mode = editing ? 'edit'
    : !result ? 'search'
    : result.exists && result.linked ? 'linked'
    : result.exists ? 'link'
    : 'create';

  const runSearch = async () => {
    const phone = form.phone_number.trim();
    if (!phone) return;
    setSearching(true);
    setErr(null);
    setResult(null);
    try {
      const r = await api.searchUserByPhone(phone);
      setResult(r);
      if (r?.exists && r.user) {
        setForm((f) => ({
          ...f,
          first_name: r.user.first_name || '',
          last_name: r.user.last_name || '',
          email: r.user.email || '',
          phone_code: r.user.phone_code || f.phone_code,
        }));
      }
    } catch (e) {
      setErr(e?.message || 'No se pudo realizar la búsqueda.');
    } finally {
      setSearching(false);
    }
  };

  // Si editan el teléfono tras buscar, se reinicia el resultado para forzar una nueva búsqueda.
  const onPhoneChange = (v) => { set('phone_number', v); if (!editing && result) setResult(null); };

  const valid = (() => {
    if (mode === 'edit') return form.first_name.trim() && form.last_name.trim();
    if (mode === 'link') return true;
    if (mode === 'create') return form.first_name.trim() && form.last_name.trim() && form.phone_number.trim() && form.password.length >= 8;
    return false;
  })();

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setErr(null);
    try {
      if (mode === 'edit') {
        // Sin `roles` ni `permissions`: el backend solo sincroniza lo que recibe, así que los
        // accesos del usuario quedan intactos al editar sus datos.
        await api.updateCompanyUser(user.id, {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim() || null,
          phone_code: form.phone_code.trim(),
          phone_number: form.phone_number.trim(),
          user_type_id: Number(form.user_type_id),
        });
      } else if (mode === 'link') {
        await api.createCompanyUser({ user_id: result.user.id, roles: selected, user_type_id: Number(form.user_type_id) });
      } else {
        await api.createCompanyUser({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim() || null,
          phone_code: form.phone_code.trim(),
          phone_number: form.phone_number.trim(),
          password: form.password,
          roles: selected,
          user_type_id: Number(form.user_type_id),
        });
      }
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const title = editing ? 'Editar usuario' : 'Nuevo usuario';
  const subtitle = editing ? user.name : 'Busca a la persona por su teléfono para vincularla o crearla';

  return (
    <Modal open title={title} subtitle={subtitle} size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        {mode !== 'search' && mode !== 'linked' && (
          <Button variant="primary" loading={saving} disabled={!valid} onClick={submit}>
            {mode === 'link' ? 'Vincular' : 'Guardar'}
          </Button>
        )}
      </>}>
      <div className={s.formCol}>
        {!editing && (
          <div className={s.formGrid}>
            <Input label="Código" icon="fas fa-globe" value={form.phone_code}
              onChange={(e) => set('phone_code', e.target.value)} />
            <Input label="Teléfono" icon="fas fa-phone" placeholder="300 000 0000" value={form.phone_number}
              onChange={(e) => onPhoneChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }} />
          </div>
        )}

        {mode === 'search' && (
          <Button variant="outline-primary" icon="fas fa-magnifying-glass" loading={searching}
            disabled={!form.phone_number.trim()} onClick={runSearch}>
            Buscar usuario
          </Button>
        )}

        {mode === 'linked' && (
          <div className={s.formError}>
            <i className="fas fa-circle-info" /> <strong>{result.user.name}</strong> ya pertenece a esta compañía.
          </div>
        )}

        {mode === 'link' && (
          <>
            <div className={s.user}><Avatar name={result.user.name} size="sm" />{result.user.name}</div>
            <span className={s.muted}>Usuario encontrado. Indica su tipo y asígnale uno o más roles para vincularlo a la compañía.</span>
            <UserTypeField value={form.user_type_id} onChange={(v) => set('user_type_id', v)} />
            <RolesField roles={roles} selected={selected} onToggle={toggleRole} />
          </>
        )}

        {mode === 'create' && (
          <>
            <span className={s.muted}>No existe un usuario con ese teléfono. Completa sus datos para crearlo.</span>
            <div className={s.formGrid}>
              <Input label="Nombre" icon="fas fa-user" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
              <Input label="Apellido" icon="fas fa-user" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
            <Input label="Correo (opcional)" icon="fas fa-envelope" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <Input label="Contraseña" icon="fas fa-lock" type="password" hint="Mínimo 8 caracteres" value={form.password} onChange={(e) => set('password', e.target.value)} />
            <UserTypeField value={form.user_type_id} onChange={(v) => set('user_type_id', v)} />
            <RolesField roles={roles} selected={selected} onToggle={toggleRole} />
          </>
        )}

        {mode === 'edit' && (
          <>
            <div className={s.formGrid}>
              <Input label="Nombre" icon="fas fa-user" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
              <Input label="Apellido" icon="fas fa-user" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
            <Input label="Correo (opcional)" icon="fas fa-envelope" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <div className={s.formGrid}>
              <Input label="Código" icon="fas fa-globe" value={form.phone_code} onChange={(e) => set('phone_code', e.target.value)} />
              <Input label="Teléfono" icon="fas fa-phone" value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)} />
            </div>
            <UserTypeField value={form.user_type_id} onChange={(v) => set('user_type_id', v)} />
            <span className={s.muted}>
              Los roles del usuario se asignan desde la acción <i className="fas fa-user-shield" /> del listado.
            </span>
          </>
        )}

        {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
      </div>
    </Modal>
  );
}

// ── Modal: fijar contraseña temporal (admin) ────────────────────────────────────
function PasswordModal({ user, onClose, onSaved }) {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const valid = password.length >= 8 && password === confirm;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setErr(null);
    try {
      await api.setUserPassword(user.id, password);
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open size="sm" title="Cambiar contraseña" subtitle={user.name} onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!valid} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <span className={s.muted}>Se fija una contraseña temporal; comunícasela al usuario para que la cambie luego.</span>
        <Input label="Nueva contraseña" icon="fas fa-lock" type="password" hint="Mínimo 8 caracteres"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input label="Confirmar contraseña" icon="fas fa-lock" type="password"
          error={confirm && confirm !== password ? 'No coincide' : undefined}
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
      </div>
    </Modal>
  );
}

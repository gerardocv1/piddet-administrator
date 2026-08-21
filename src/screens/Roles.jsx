import React from 'react';
import { Alert, Badge, Button, Card, Checkbox, ConfirmDialog, DataTable, FilterBar, IconButton, Input, Modal, RefreshButton, Spinner, Textarea, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { roleLabel } from '../lib/roleLabels.js';
import s from './screens.module.css';
import a from './Access.module.css';

// Roles base de la plataforma: se editan como cualquier otro, pero eliminarlos exige `admin-general`.
const SYSTEM_ROLES = ['super-admin', 'client', 'employee'];
const isSystemRole = (role) => SYSTEM_ROLES.includes(role.name);

const matches = (role, term) => {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return `${role.name} ${role.description || ''}`.toLowerCase().includes(q);
};

/**
 * Catálogo de roles: agrupan permisos y son lo que se asigna a cada usuario de la compañía
 * (desde /users). El catálogo es de la PLATAFORMA: un rol y sus permisos son los mismos para
 * todas las compañías, por eso la pantalla avisa antes de editar.
 */
export function Roles() {
  const { can } = usePermissions();
  const canCreate = can('role-create');
  const canUpdate = can('role-update');
  const canDelete = can('role-delete');
  const canAssign = can('role-assign') && can('permission-list');
  // Cualquier rol se edita y se le cambian los permisos; eliminar uno del sistema exige además
  // `admin-general` (es irreversible y afecta a toda la plataforma).
  const canDeleteRole = (role) => canDelete && (!isSystemRole(role) || can('admin-general'));

  const { data: roles, loading, error, reload } = useResource(api.roles, [], []);

  // El selector de permisos del rol necesita el catálogo completo; solo se pide si hay permiso.
  const fetchCatalog = React.useCallback(
    () => (canAssign ? api.permissionCatalog() : Promise.resolve([])),
    [canAssign]
  );
  const { data: catalog } = useResource(fetchCatalog, [], [canAssign]);

  const [q, setQ] = React.useState('');
  const [form, setForm] = React.useState(null);       // null | 'new' | rol a editar
  const [permsOf, setPermsOf] = React.useState(null); // rol al que editar permisos
  const [del, setDel] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);
  const [delError, setDelError] = React.useState(null);
  const { toast } = useToast();

  const rows = (roles || []).filter((r) => matches(r, q));

  const remove = async () => {
    setDeleting(true);
    setDelError(null);
    try {
      await api.deleteRole(del.id);
      setDel(null);
      reload();
      toast({ tone: 'neutral', title: 'Rol eliminado' });
    } catch (e) {
      setDelError(e?.message || 'No se pudo eliminar el rol.');
    } finally {
      setDeleting(false);
    }
  };

  const actionsFor = (role) => (
    <span className={s.actions}>
      {canAssign && (
        <IconButton icon="fas fa-key" variant="light" size="sm" title="Permisos del rol"
          onClick={() => setPermsOf(role)} />
      )}
      {canUpdate && (
        <IconButton icon="fas fa-pen" variant="light" size="sm" title="Editar rol"
          onClick={() => setForm(role)} />
      )}
      {canDeleteRole(role) && (
        <IconButton icon="fas fa-trash" variant="danger" size="sm" title="Eliminar rol"
          onClick={() => { setDelError(null); setDel(role); }} />
      )}
    </span>
  );

  const columns = [
    { key: 'name', header: 'Rol', ellipsis: true, render: (r) => (
      <span className={a.identity}>
        <span className={a.name}>{roleLabel(r.name)}</span>
        <span className={a.code}>{r.name}</span>
      </span>
    ) },
    { key: 'permissions', header: 'Permisos', width: 140, render: (r) => (
      r.permissions?.length
        ? <Badge variant="info">{r.permissions.length}</Badge>
        : <span className={s.muted}>Sin permisos</span>
    ) },
    { key: 'kind', header: 'Tipo', width: 140, render: (r) => (
      isSystemRole(r) ? <Badge variant="neutral">Del sistema</Badge> : <Badge variant="success">Personalizado</Badge>
    ) },
    { key: 'acc', header: '', width: 130, align: 'right', render: actionsFor },
  ];

  return (
    <div className={s.page}>
      <FilterBar
        searchable
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Buscar rol"
        actions={<>
          <RefreshButton loading={loading} onClick={reload} />
          {canCreate && (
            <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => setForm('new')}>Nuevo rol</Button>
          )}
        </>}
      />

      <div className={s.desktopList}>
        <Card>
          <DataTable columns={columns} rows={rows} loading={loading} error={error}
            empty="No hay roles que coincidan." />
        </Card>
      </div>

      <div className={s.mobileList}>
        {loading && <Card><div className={s.mobileState}><Spinner size="sm" label="Cargando…" /></div></Card>}
        {!loading && error && (
          <Card><Alert tone="danger" title="No se pudieron cargar los roles">{error}</Alert></Card>
        )}
        {!loading && !error && rows.length === 0 && (
          <Card><div className={s.mobileState}>No hay roles que coincidan.</div></Card>
        )}
        {!loading && !error && rows.map((r) => (
          <Card key={r.id}>
            <Card.Body>
              <div className={a.roleCard}>
                <div className={a.moduleHead}>
                  <span className={a.name}>{roleLabel(r.name)}</span>
                  <span className={a.spacer} />
                  {isSystemRole(r) ? <Badge variant="neutral">Del sistema</Badge> : <Badge variant="success">Personalizado</Badge>}
                </div>
                <span className={a.code}>{r.name}</span>
                <span className={a.desc}>
                  {r.permissions?.length ? `${r.permissions.length} permisos` : 'Sin permisos'}
                </span>
                <div>{actionsFor(r)}</div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {form && (
        <RoleFormModal role={form === 'new' ? null : form}
          onClose={() => setForm(null)} onSaved={() => { setForm(null); reload(); }} />
      )}

      {permsOf && (
        <RolePermissionsModal role={permsOf} catalog={catalog || []}
          onClose={() => setPermsOf(null)} onSaved={() => { setPermsOf(null); reload(); }} />
      )}

      <ConfirmDialog
        open={!!del}
        title="Eliminar rol"
        confirmLabel="Eliminar"
        icon="fas fa-trash"
        loading={deleting}
        error={delError}
        onConfirm={remove}
        onClose={() => setDel(null)}>
        El rol <strong>{roleLabel(del?.name)}</strong> se elimina de la plataforma y los
        usuarios que lo tengan pierden los permisos que otorgaba, en cualquier compañía.
      </ConfirmDialog>
    </div>
  );
}

// ── Modal: crear / editar un rol (nombre técnico + descripción) ────────────────
function RoleFormModal({ role, onClose, onSaved }) {
  const [name, setName] = React.useState(role?.name || '');
  const [description, setDescription] = React.useState(role?.description || '');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const { toast } = useToast();

  const valid = name.trim().length >= 3;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = { name: name.trim(), description: description.trim() || null };
      if (role) await api.updateRole(role.id, payload);
      else await api.createRole(payload);
      toast({ tone: 'success', title: role ? 'Rol actualizado' : 'Rol creado' });
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar el rol.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={role ? 'Editar rol' : 'Nuevo rol'} subtitle={role?.description || role?.name} size="md" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!valid} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        {role && isSystemRole(role) && (
          <Alert tone="warning">
            Es un rol del sistema: cambiar su nombre o sus permisos afecta a toda la plataforma.
          </Alert>
        )}
        <Input label="Nombre técnico" icon="fas fa-hashtag" placeholder="Ej. supervisor" value={name}
          onChange={(e) => setName(e.target.value)}
          hint="Identificador único del rol, en inglés y sin espacios (así lo guarda el backend)." />
        <Textarea label="Descripción" rows={2} value={description}
          onChange={(e) => setDescription(e.target.value)}
          hint="Es lo que se muestra al asignar el rol a un usuario." />
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}

// ── Modal: permisos que otorga el rol ──────────────────────────────────────────
// Reemplaza la lista completa de permisos del rol (el backend sincroniza, no agrega).
function RolePermissionsModal({ role, catalog, onClose, onSaved }) {
  const [selected, setSelected] = React.useState(() => new Set((role.permissions || []).map((p) => p.name)));
  const [q, setQ] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const { toast } = useToast();

  const toggle = (name) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  const groups = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return catalog
      .map((mod) => ({
        ...mod,
        permissions: mod.permissions.filter((p) =>
          !term || `${p.name} ${p.description || ''}`.toLowerCase().includes(term)),
      }))
      .filter((mod) => mod.permissions.length > 0);
  }, [catalog, q]);

  // Módulos colapsados por defecto; con un término de búsqueda se abren todos los que coinciden
  // para no obligar a expandirlos uno por uno.
  const [openModules, setOpenModules] = React.useState(() => new Set());
  const searching = q.trim().length > 0;
  const isOpen = (mod) => searching || openModules.has(mod.module_id);
  const toggleOpen = (moduleId) => setOpenModules((prev) => {
    const next = new Set(prev);
    if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
    return next;
  });

  const toggleModule = (mod) => {
    const names = mod.permissions.map((p) => p.name);
    const allOn = names.every((n) => selected.has(n));
    setSelected((prev) => {
      const next = new Set(prev);
      names.forEach((n) => (allOn ? next.delete(n) : next.add(n)));
      return next;
    });
  };

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      await api.syncRolePermissions(role.id, [...selected]);
      toast({ tone: 'success', title: 'Permisos guardados' });
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudieron guardar los permisos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title="Permisos del rol" subtitle={roleLabel(role.name)} size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Guardar</Button>
      </>}>
      <div className={s.formCol}>
        <div className={a.pickerHead}>
          <Input placeholder="Buscar permiso" icon="fas fa-magnifying-glass" value={q}
            onChange={(e) => setQ(e.target.value)} />
          <span className={a.pickerCount}>{selected.size} seleccionados</span>
        </div>

        <div className={a.pickerBody}>
          {groups.length === 0 && <div className={a.empty}>No hay permisos que coincidan.</div>}
          {groups.map((mod) => (
            <PermissionModuleGroup key={mod.module_id} module={mod} selected={selected}
              open={isOpen(mod)} onToggleOpen={() => toggleOpen(mod.module_id)}
              onToggleAll={() => toggleModule(mod)} onTogglePermission={toggle} />
          ))}
        </div>

        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}

// ── Módulo colapsable del selector de permisos ──────────────────────────────────
// Cada permiso se identifica por su key (el nombre técnico) y muestra la descripción debajo.
function PermissionModuleGroup({ module, selected, open, onToggleOpen, onToggleAll, onTogglePermission }) {
  const count = module.permissions.filter((p) => selected.has(p.name)).length;
  const allOn = count === module.permissions.length;

  return (
    <div className={a.pickerModule}>
      <div className={a.pickerModuleHead}>
        <Checkbox checked={allOn} onChange={onToggleAll} aria-label={`Todos los permisos de ${module.module_name || 'Otros'}`} />
        <button type="button" className={a.pickerModuleToggle} onClick={onToggleOpen} aria-expanded={open}>
          <i className={`fas fa-chevron-${open ? 'up' : 'down'} ${a.pickerChevron}`} aria-hidden="true" />
          <span className={a.moduleName}>{module.module_name || 'Otros'}</span>
          <span className={a.spacer} />
          <span className={a.pickerCount}>{count}/{module.permissions.length}</span>
        </button>
      </div>
      {open && (
        <div className={a.pickerOptions}>
          {module.permissions.map((p) => (
            <div key={p.name} className={a.pickerOption}>
              <Checkbox checked={selected.has(p.name)} onChange={() => onTogglePermission(p.name)}
                label={<span className={a.pickerKeyLine}>
                  <span className={a.pickerKey}>{p.name}</span>
                  {p.is_api && (
                    <Badge variant="info" className={a.pickerApi} title="El panel lo conoce: llega en /me/permissions">API</Badge>
                  )}
                </span>} />
              <span className={a.pickerDesc}>{p.description || 'Sin descripción'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

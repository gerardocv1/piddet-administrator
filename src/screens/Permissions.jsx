import React from 'react';
import { Badge, Card, FilterBar, Spinner, Switch } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { roleLabel } from '../lib/roleLabels.js';
import s from './screens.module.css';
import a from './Access.module.css';

const matches = (permission, term) => {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return `${permission.name} ${permission.description || ''}`.toLowerCase().includes(q);
};

/**
 * Catálogo de permisos de la plataforma, agrupado por módulo. Es la referencia de qué puede
 * concederse desde un rol y qué roles conceden cada permiso.
 *
 * El interruptor controla `is_api`: un permiso oculto sigue rigiendo en el backend, pero no viaja
 * al panel, así que ninguna pantalla lo ve ni puede ofrecerlo para asignar.
 */
export function Permissions() {
  const { can } = usePermissions();
  const canUpdate = can('permission-update');
  const canSeeRoles = can('role-list');

  const { data: catalog, loading, error, reload } = useResource(api.permissionCatalog, [], []);

  const fetchRoles = React.useCallback(
    () => (canSeeRoles ? api.roles() : Promise.resolve([])),
    [canSeeRoles]
  );
  const { data: roles } = useResource(fetchRoles, [], [canSeeRoles]);

  const [q, setQ] = React.useState('');
  const [filters, setFilters] = React.useState({ module: undefined });
  const [busyId, setBusyId] = React.useState(null);
  const [actionError, setActionError] = React.useState(null);

  // Permiso → roles que lo otorgan (para saber a quién afecta antes de tocarlo).
  const rolesByPermission = React.useMemo(() => {
    const map = new Map();
    (roles || []).forEach((role) => {
      (role.permissions || []).forEach((p) => {
        if (!map.has(p.name)) map.set(p.name, []);
        map.get(p.name).push(roleLabel(role.name));
      });
    });
    return map;
  }, [roles]);

  const groups = React.useMemo(() => (catalog || [])
    .filter((mod) => !filters.module || String(mod.module_id) === filters.module)
    .map((mod) => ({ ...mod, permissions: mod.permissions.filter((p) => matches(p, q)) }))
    .filter((mod) => mod.permissions.length > 0), [catalog, filters.module, q]);

  const totals = (catalog || []).reduce((acc, mod) => {
    acc.total += mod.permissions.length;
    acc.visible += mod.permissions.filter((p) => p.is_api).length;
    return acc;
  }, { total: 0, visible: 0 });

  const toggleVisibility = async (permission) => {
    setBusyId(permission.id);
    setActionError(null);
    try {
      await api.setPermissionApiVisibility(permission.id, !permission.is_api);
      reload();
    } catch (e) {
      setActionError(e?.message || 'No se pudo cambiar la visibilidad del permiso.');
    } finally {
      setBusyId(null);
    }
  };

  const moduleFilter = {
    key: 'module', label: 'Módulo', icon: 'fas fa-layer-group', type: 'select',
    options: (catalog || []).map((mod) => ({ value: String(mod.module_id), label: mod.module_name || 'Otros' })),
  };

  return (
    <div className={s.page}>
      <div className={a.notice}>
        <i className="fas fa-circle-info" />
        <span>
          El catálogo de permisos es de la plataforma y se comparte entre todas las compañías. Los
          permisos se conceden a través de los roles; aquí solo se define cuáles llegan al panel.
        </span>
      </div>

      <FilterBar
        searchable
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Buscar permiso"
        filters={[moduleFilter]}
        values={filters}
        onChange={setFilters}
        actions={<span className={a.pickerCount}>{totals.visible} de {totals.total} visibles en el panel</span>}
      />

      {actionError && <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {actionError}</div>}

      {loading ? (
        <Spinner center label="Cargando permisos…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> No se pudo cargar el catálogo de permisos.</div>
      ) : groups.length === 0 ? (
        <Card><Card.Body><div className={a.empty}>No hay permisos que coincidan.</div></Card.Body></Card>
      ) : (
        <div className={a.modules}>
          {groups.map((mod) => (
            <Card key={mod.module_id}>
              <Card.Body>
                <div className={a.moduleHead}>
                  <h3 className={a.moduleName}>{mod.module_name || 'Otros'}</h3>
                  <span className={a.moduleCount}>{mod.permissions.length} permisos</span>
                </div>
                <div className={a.permList}>
                  {mod.permissions.map((p) => {
                    const grantedBy = rolesByPermission.get(p.name) || [];
                    return (
                      <div key={p.id} className={a.permRow}>
                        <div className={a.permInfo}>
                          <span className={a.name}>{p.description || p.name}</span>
                          <span className={a.code}>{p.name}</span>
                        </div>
                        {canSeeRoles && (
                          <div className={a.permRoles}>
                            {grantedBy.length === 0
                              ? <span className={s.faint}>Sin roles</span>
                              : grantedBy.map((label) => <Badge key={label} variant="neutral">{label}</Badge>)}
                          </div>
                        )}
                        <Switch size="sm" checked={!!p.is_api} disabled={!canUpdate || busyId === p.id}
                          onChange={() => toggleVisibility(p)}
                          aria-label={`Mostrar ${p.name} en el panel`} />
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

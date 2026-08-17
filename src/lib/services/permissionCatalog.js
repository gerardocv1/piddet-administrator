// Servicio: catálogo de permisos de la plataforma, agrupado por módulo.
//
// No confundir con `permissions.js`, que resuelve los permisos DEL USUARIO en la compañía activa.
// Aquí se administra el catálogo completo: qué permisos existen y cuáles se exponen al panel
// (`is_api`). Un permiso con is_api = false sigue rigiendo en el backend, pero no viaja en
// /me/permissions, así que el panel no puede mostrarlo ni ofrecerlo para asignar.
//
// Formas de respuesta:
//   permissionCatalog() → [{ module_id, module_name, permissions: [{ id, name, description, module_id, is_api }] }]

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}/permissions`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const permissionCatalogService = {
  permissionCatalog: ({ search = '', moduleId = '' } = {}) =>
    http.get(`${base()}${qs({ search, module_id: moduleId })}`),
  setPermissionApiVisibility: (id, isApi) =>
    http.patch(`${base()}/${id}/api-visibility`, { is_api: isApi }),
};

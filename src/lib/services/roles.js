// Servicio: catálogo de roles y sus permisos.
//
// La ruta cuelga de /companies/{company} (así resuelve el backend la sesión), pero el catálogo es
// de PLATAFORMA: crear un rol, renombrarlo o cambiar sus permisos afecta a TODAS las compañías que
// lo usen. Los roles del sistema (super-admin, client, employee) los protege el backend: responde
// 400 si se intentan editar o eliminar.
//
// Formas de respuesta:
//   roles() → [{ id, name, description, permissions: [{ id, name, description, module_id, is_api }] }]

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}/permissions`;
};

export const rolesService = {
  roles: () => http.get(`${base()}/roles`),
  createRole: (data) => http.post(`${base()}/roles`, data),
  updateRole: (id, data) => http.put(`${base()}/roles/${id}`, data),
  deleteRole: (id) => http.del(`${base()}/roles/${id}`),
  // Reemplaza (no agrega) los permisos del rol por la lista enviada.
  syncRolePermissions: (id, permissions) => http.put(`${base()}/roles/${id}/permissions`, { permissions }),
};

// Servicio: usuarios de la compañía activa (administración de accesos).
//
// Company-scoped: cuelga de /companies/{company}/users. La compañía activa se resuelve desde la
// fachada `auth`. La administración es sobre la pertenencia a la compañía (tabla company_users):
// se listan los usuarios vinculados, se busca a uno por teléfono en TODA la base para vincularlo
// (o se crea si no existe), se editan sus datos básicos, se asignan roles y se fija una contraseña
// temporal. Desvincular solo retira el acceso a la compañía; nunca elimina el usuario global.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const usersService = {
  // Listado paginado de usuarios vinculados a la compañía. { page, search }
  users: ({ page = 1, search = '', row = 12 } = {}) =>
    http.get(`${base()}/users${qs({ page, _search: search, _row: row })}`, { paginated: true }),
  // Búsqueda global por teléfono → { exists, linked, user }.
  searchUserByPhone: (phone) => http.get(`${base()}/users/search${qs({ phone })}`),
  // Roles asignables (sin super-admin), con etiqueta amigable: [{ name, label, description }].
  assignableRoles: () => http.get(`${base()}/users/assignable-roles`),
  companyUser: (id) => http.get(`${base()}/users/${id}`),
  // Crea un usuario nuevo o vincula uno existente (con `user_id`), con sus roles.
  createCompanyUser: (data) => http.post(`${base()}/users`, data),
  // Actualiza datos básicos y/o sincroniza roles.
  updateCompanyUser: (id, data) => http.put(`${base()}/users/${id}`, data),
  // Fija una contraseña temporal al usuario (admin).
  setUserPassword: (id, password) => http.put(`${base()}/users/${id}/password`, { password }),
  // Desvincula al usuario de la compañía (no borra el usuario global).
  unlinkUser: (id) => http.del(`${base()}/users/${id}`),
};

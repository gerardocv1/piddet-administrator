// Servicio: administración MAESTRA de compañías de la plataforma ("elite").
//
// Las rutas cuelgan de /companies/{company}/master/companies — el segmento {company} solo sirve
// para el chequeo del permiso de plataforma `company-master`; los datos NO están scopeados a esa
// compañía. La compañía sobre la que se opera va en {companyId}, así que desde aquí se administra
// CUALQUIER compañía (incluidos sus usuarios) sin cambiar de compañía activa.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const root = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}/master`;
};

const base = () => `${root()}/companies`;

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const masterCompaniesService = {
  // Listado paginado de todas las compañías. { page, search, status, row }
  masterCompanies: ({ page = 1, search = '', status, row = 20 } = {}) =>
    http.get(`${base()}${qs({ page, _search: search, status, _row: row })}`, { paginated: true }),
  masterCompany: (companyId) => http.get(`${base()}/${companyId}`),
  // Crea la compañía (nombre + dirección web + su administrador). El resto del perfil
  // (ubicación, marca, módulos contratados) se completa después dentro de la compañía.
  createMasterCompany: (data) => http.post(base(), data),
  setMasterCompanyStatus: (companyId, status) => http.patch(`${base()}/${companyId}/status`, { status }),
  // Búsqueda global por teléfono para el ALTA (aún no hay compañía destino) → { exists, user }.
  masterSearchUser: (phone) => http.get(`${root()}/users/search${qs({ phone })}`),

  // ── Usuarios de una compañía cualquiera ──
  masterCompanyUsers: (companyId, { page = 1, search = '', row = 12 } = {}) =>
    http.get(`${base()}/${companyId}/users${qs({ page, _search: search, _row: row })}`, { paginated: true }),
  // Búsqueda global por teléfono → { exists, linked, user }; `linked` es respecto a esa compañía.
  masterSearchUserByPhone: (companyId, phone) => http.get(`${base()}/${companyId}/users/search${qs({ phone })}`),
  masterAssignableRoles: (companyId) => http.get(`${base()}/${companyId}/users/assignable-roles`),
  // Vincula un usuario existente (`user_id`) o crea uno nuevo con sus datos básicos.
  addMasterCompanyUser: (companyId, data) => http.post(`${base()}/${companyId}/users`, data),
  // Desvincula al usuario de esa compañía (no borra el usuario global).
  removeMasterCompanyUser: (companyId, userId) => http.del(`${base()}/${companyId}/users/${userId}`),
};

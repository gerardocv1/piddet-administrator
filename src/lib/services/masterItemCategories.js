// Servicio: administración MAESTRA del catálogo global de categorías de producto ("elite").
//
// A diferencia de itemCategories.js (lado compañía, solo ordenar), esto opera sobre el catálogo
// GLOBAL: company_id null en el backend. Las rutas cuelgan de /companies/{company}/master/... —
// el segmento {company} solo sirve para el chequeo del permiso de plataforma `item-category-master`;
// los datos NO están scopeados por compañía. Solo lo ven administradores con ese permiso.

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

export const masterItemCategoriesService = {
  // Listado paginado del catálogo global. { page, search, typeId, status, row }
  masterItemCategories: ({ page = 1, search = '', typeId, status, row = 200 } = {}) =>
    http.get(`${base()}/master/item-categories${qs({ page, _search: search, item_type_id: typeId, status, _row: row })}`, { paginated: true }),
  // Árbol jerárquico anidado del catálogo global (raíces con children[]). Opcional: filtrar por tipo.
  masterItemCategoriesTree: ({ typeId } = {}) =>
    http.get(`${base()}/master/item-categories/tree${qs({ item_type_id: typeId })}`),
  createMasterItemCategory: (data) => http.post(`${base()}/master/item-categories`, data),
  updateMasterItemCategory: (id, data) => http.put(`${base()}/master/item-categories/${id}`, data),
  deleteMasterItemCategory: (id) => http.del(`${base()}/master/item-categories/${id}`),
  setMasterItemCategoryStatus: (id, status) => http.patch(`${base()}/master/item-categories/${id}/status`, { status }),
};

// Servicio: categorías de productos (item-categories) de la compañía activa.
//
// Company-scoped. Las categorías están scopeadas por compañía Y por tipo de ítem (item_type_id):
// cada categoría pertenece a un tipo y se reutiliza al crear productos de ese tipo. Su `position`
// define el orden dentro del tipo.

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

export const itemCategoriesService = {
  // Listado paginado. { page, search, typeId }
  itemCategories: ({ page = 1, search = '', typeId, row = 12 } = {}) =>
    http.get(`${base()}/item-categories${qs({ page, _search: search, item_type_id: typeId, _row: row })}`, { paginated: true }),
  // Todas las categorías de un tipo (para los <Select> de productos). `_row` alto: traerlas de una vez.
  allItemCategories: ({ typeId } = {}) =>
    http.get(`${base()}/item-categories${qs({ item_type_id: typeId, _row: 200 })}`, { paginated: true }),
  createItemCategory: (data) => http.post(`${base()}/item-categories`, data),
  updateItemCategory: (id, data) => http.put(`${base()}/item-categories/${id}`, data),
  deleteItemCategory: (id) => http.del(`${base()}/item-categories/${id}`),
  // Reorden en lote: { elements: [{ id, position }] }.
  sortItemCategories: (elements) => http.put(`${base()}/item-categories/sort`, { elements }),
};

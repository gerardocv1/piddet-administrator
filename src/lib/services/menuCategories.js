// Servicio: categorías de un menú.
//
// Las categorías pertenecen a un menú concreto (anidadas bajo `menus/{menuId}/categories`) y su
// `position` define el orden con el que se agrupan sus productos dentro de ese menú. Company-scoped
// a través del menú, como el resto del módulo (ver services/menus.js).

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = (menuId) => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}/menus/${menuId}`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const menuCategoriesService = {
  // Todas las categorías del menú (orden por `position`); `_row` alto para traerlas de una vez.
  menuCategories: (menuId) =>
    http.get(`${base(menuId)}/categories${qs({ _row: 200 })}`, { paginated: true }),
  createMenuCategory: (menuId, data) => http.post(`${base(menuId)}/categories`, data),
  updateMenuCategory: (menuId, id, data) => http.put(`${base(menuId)}/categories/${id}`, data),
  deleteMenuCategory: (menuId, id) => http.del(`${base(menuId)}/categories/${id}`),
};

// Servicio: opciones de un producto (grupos de opciones + opciones), de la compañía activa.
//
// Company-scoped y anidado por ítem: las opciones viven dentro de cada producto. Un grupo define
// las reglas de selección (min, max, multiple = único/múltiple); cada opción tiene su precio extra
// (`value`). El backend valida que el ítem pertenezca a la compañía.

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

export const itemOptionsService = {
  // ── Grupos de opciones ──
  optionGroups: (itemId) => http.get(`${base()}/items/${itemId}/option-groups`),
  createOptionGroup: (itemId, data) => http.post(`${base()}/items/${itemId}/option-groups`, data),
  updateOptionGroup: (itemId, groupId, data) => http.put(`${base()}/items/${itemId}/option-groups/${groupId}`, data),
  deleteOptionGroup: (itemId, groupId) => http.del(`${base()}/items/${itemId}/option-groups/${groupId}`),
  sortOptionGroups: (itemId, elements) => http.put(`${base()}/items/${itemId}/option-groups/sort`, { elements }),

  // ── Opciones (de un grupo) ──
  options: (itemId, { groupId } = {}) =>
    http.get(`${base()}/items/${itemId}/options${qs({ group_id: groupId })}`),
  createOption: (itemId, data) => http.post(`${base()}/items/${itemId}/options`, data),
  updateOption: (itemId, optionId, data) => http.put(`${base()}/items/${itemId}/options/${optionId}`, data),
  deleteOption: (itemId, optionId) => http.del(`${base()}/items/${itemId}/options/${optionId}`),
  sortOptions: (itemId, elements) => http.put(`${base()}/items/${itemId}/options/sort`, { elements }),
};

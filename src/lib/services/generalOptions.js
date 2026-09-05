// Servicio: opciones generales de la compañía activa.
//
// Un grupo GENERAL (p. ej. «Servicios»: despachar, cubiertos) vive a nivel de compañía y se asigna
// a varios productos a la vez; el menú del POS lo expone dentro de cada producto asignado, detrás
// de sus grupos propios y con la misma forma. Las opciones cuelgan del grupo (no de un producto).
// Company-scoped: todo cuelga de /companies/{company}/general-option-groups.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}/general-option-groups`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const generalOptionsService = {
  // ── Grupos generales (lista completa de la compañía, con `items_count`) ──
  generalOptionGroups: ({ search = '' } = {}) => http.get(`${base()}${qs({ _search: search })}`),
  generalOptionGroup: (groupId) => http.get(`${base()}/${groupId}`),
  createGeneralOptionGroup: (data) => http.post(base(), data),
  updateGeneralOptionGroup: (groupId, data) => http.put(`${base()}/${groupId}`, data),
  deleteGeneralOptionGroup: (groupId) => http.del(`${base()}/${groupId}`),
  sortGeneralOptionGroups: (elements) => http.put(`${base()}/sort`, { elements }),

  // ── Productos a los que aplica el grupo ──
  generalOptionGroupItems: (groupId) => http.get(`${base()}/${groupId}/items`),
  // Reemplaza la lista COMPLETA: lo que no viaje en `item_ids` se desasigna.
  setGeneralOptionGroupItems: (groupId, itemIds) => http.put(`${base()}/${groupId}/items`, { item_ids: itemIds }),

  // ── Opciones del grupo ──
  generalOptions: (groupId) => http.get(`${base()}/${groupId}/options`),
  createGeneralOption: (groupId, data) => http.post(`${base()}/${groupId}/options`, data),
  updateGeneralOption: (groupId, optionId, data) => http.put(`${base()}/${groupId}/options/${optionId}`, data),
  deleteGeneralOption: (groupId, optionId) => http.del(`${base()}/${groupId}/options/${optionId}`),
  sortGeneralOptions: (groupId, elements) => http.put(`${base()}/${groupId}/options/sort`, { elements }),
};

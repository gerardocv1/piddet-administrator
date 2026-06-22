// Servicio: productos (items) de la compañía activa.
//
// Company-scoped: todas las rutas cuelgan de /companies/{company}/items (como menus.js). La
// compañía activa se resuelve internamente desde la fachada `auth`. Las claves del JSON
// (category_name, type_name, value, file, tax_family_id…) se mantienen como las expone el backend.

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

export const itemsService = {
  // Listado paginado de productos. { page, search }
  items: ({ page = 1, search = '', row = 12 } = {}) =>
    http.get(`${base()}/items${qs({ page, _search: search, _row: row })}`, { paginated: true }),
  item: (id) => http.get(`${base()}/items/${id}`),
  createItem: (data) => http.post(`${base()}/items`, data),
  updateItem: (id, data) => http.put(`${base()}/items/${id}`, data),
  deleteItem: (id) => http.del(`${base()}/items/${id}`),
  // Cambia el estado (activo/borrador) sin tocar el resto del producto.
  setItemStatus: (id, item_status_id) => http.patch(`${base()}/items/${id}/status`, { item_status_id }),
  // Asigna la imagen del producto: guarda el `name` del archivo ya subido a S3 en items.image.
  setItemImage: (id, image) => http.post(`${base()}/items/${id}/image`, { image }),
  // Reorden en lote: { elements: [{ id, position }] }.
  sortItems: (elements) => http.put(`${base()}/items/sort`, { elements }),
};

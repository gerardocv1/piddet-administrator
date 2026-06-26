// Servicio: tiendas de la compañía activa (CRUD + horarios + ubicación GPS).
//
// Company-scoped: todas las rutas cuelgan de /companies/{company}/stores (igual que menús/usuarios).
// La compañía activa se resuelve internamente desde la fachada `auth`, así las pantallas no la pasan.
// Cada tienda lleva su nombre, dirección, teléfono, lat/lng, estado (store_status) y un arreglo de
// horarios (rangos start_time→end_time por day_id; un día sin rangos se considera cerrado).

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

export const storesService = {
  // Listado paginado de tiendas. { page, search }
  stores: ({ page = 1, search = '', row = 12 } = {}) =>
    http.get(`${base()}/stores${qs({ page, _search: search, _row: row })}`, { paginated: true }),
  // Catálogos para los formularios: estados (store_status), tipos (store_types) y días (days).
  storeCatalogs: () => http.get(`${base()}/stores/catalogs`),
  store: (id) => http.get(`${base()}/stores/${id}`),
  createStore: (data) => http.post(`${base()}/stores`, data),
  updateStore: (id, data) => http.put(`${base()}/stores/${id}`, data),
  // Cambia el estado de la tienda al id del catálogo store_status (1 Activo, 2 Inactiva, 3 Cierre temporal).
  setStoreStatus: (id, storeStatusId) => http.patch(`${base()}/stores/${id}/status`, { store_status_id: storeStatusId }),
  deleteStore: (id) => http.del(`${base()}/stores/${id}`),
};

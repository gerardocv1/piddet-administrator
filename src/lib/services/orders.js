// Servicio: facturas/órdenes de la compañía activa (solo lectura).
//
// Company-scoped: las rutas cuelgan de /companies/{company}/orders. El listado se consulta
// por fecha (un solo día; sin `date` el backend asume hoy) y viene paginado. El detalle
// devuelve la orden completa: ítems con opciones, impuestos agrupados, pagos, estado y
// los usuarios OWNER (cliente) y CREATOR (quien la creó).

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

export const ordersService = {
  // Listado paginado de órdenes de un día. { date: 'YYYY-MM-DD', page }
  orders: ({ date = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/orders${qs({ date, page, per_page: perPage })}`, { paginated: true }),
  // Detalle completo de una orden por uuid.
  order: (orderId) => http.get(`${base()}/orders/${orderId}`),
};

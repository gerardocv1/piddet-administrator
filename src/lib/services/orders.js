// Servicio: facturas/órdenes de la compañía activa (consulta y cancelación).
//
// Company-scoped: las rutas cuelgan de /companies/{company}/orders. El listado se consulta
// por rango de fechas (sin fechas el backend asume hoy) y viene paginado. El detalle
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
  // Listado paginado por rango de fechas, estados (CSV) y usuario que registró la orden.
  orders: ({ dateFrom = '', dateTo = '', status = '', creatorId = '', page = 1, perPage = 15 } = {}) =>
    http.get(
      `${base()}/orders${qs({ date_from: dateFrom, date_to: dateTo, status, creator_id: creatorId, page, per_page: perPage })}`,
      { paginated: true },
    ),
  // Usuarios que han registrado órdenes en la compañía: [{ user_id, name, first_name }].
  orderCreators: () => http.get(`${base()}/orders/creators`),
  // Detalle completo de una orden por uuid.
  order: (orderId) => http.get(`${base()}/orders/${orderId}`),
  // Cancela la factura (permiso order-cancel). El motivo es obligatorio y queda en el historial
  // de estados; la orden cancelada sale de las métricas de ventas. Devuelve el detalle actualizado.
  cancelOrder: (orderId, reason) => http.patch(`${base()}/orders/${orderId}/cancel`, { reason }),
};

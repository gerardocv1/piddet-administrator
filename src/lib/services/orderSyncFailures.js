// Servicio: reportes de fallo de sincronización de órdenes (módulo de soporte).
//
// Company-scoped: las rutas cuelgan de /companies/{company}/orders/sync-failure-reports.
// El listado viene paginado y excluye order_payload/context (pesados); el detalle los
// incluye. El retry re-ejecuta la creación de la orden con el payload guardado: en éxito
// el reporte queda resolved con recovered_order_uuid; en fallo el backend responde el paso
// exacto que falló (errors campo a campo cuando es validación).

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}/orders/sync-failure-reports`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const orderSyncFailuresService = {
  // Listado paginado, filtrable por estado de soporte. { status, page }
  getSyncFailureReports: ({ status = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}${qs({ support_status: status, page, per_page: perPage })}`, { paginated: true }),
  // Detalle completo (incluye order_payload y context).
  getSyncFailureReport: (reportId) => http.get(`${base()}/${reportId}`),
  // Reemplaza el JSON de la orden (string JSON válido).
  updateSyncFailureReportPayload: (reportId, orderPayload) =>
    http.put(`${base()}/${reportId}/payload`, { order_payload: orderPayload }),
  // Transición manual del estado de soporte. { support_status, resolution_notes }
  updateSyncFailureReportStatus: (reportId, { support_status, resolution_notes = null } = {}) =>
    http.patch(`${base()}/${reportId}/status`, { support_status, resolution_notes }),
  // Reintenta la creación de la orden con el payload guardado.
  retrySyncFailureReport: (reportId) => http.post(`${base()}/${reportId}/retry`),
};

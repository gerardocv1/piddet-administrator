// Servicio: historial de notificaciones ENVIADAS por la compañía activa (SMS y push).
//
// Una notificación es el registro de algo que ya pasó: no se edita ni se borra. Lo único que se
// puede hacer es REENVIARLA, y eso crea otra fila (la original no cambia), o disparar un SMS DE
// PRUEBA a un número escrito a mano, que entra al historial como una más. Es de la compañía
// activa: el backend saca el `company_id` de la ruta, no del cliente.
//
// No confundir con `notifications.js`, que es la campana del usuario: aquello es lo que UNA
// PERSONA no ha leído; esto es lo que LA COMPAÑÍA ha enviado.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}/notifications`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

// Filtros compartidos por el listado y el resumen: los contadores cuentan lo mismo que se ve.
const filterParams = ({ dateFrom = '', dateTo = '', status = '', type = '', sourceReference = '', search = '' } = {}) => ({
  date_from: dateFrom,
  date_to: dateTo,
  status,
  type,
  source_reference: sourceReference,
  _search: search,
});

export const sentNotificationsService = {
  // Listado paginado, más recientes primero.
  getSentNotifications: ({ page = 1, perPage = 15, ...filters } = {}) =>
    http.get(`${base()}${qs({ ...filterParams(filters), page, per_page: perPage })}`, { paginated: true }),
  // Motivos de envío que la compañía ha usado de verdad (alimentan el filtro). El endpoint trae
  // también contadores por estado, que el panel ya no muestra.
  getSentNotificationsSummary: (filters = {}) =>
    http.get(`${base()}/summary${qs(filterParams(filters))}`),
  // SMS de prueba: texto tal cual al número indicado. Queda en el historial con motivo MANUAL_TEST
  // y se cobra como cualquier otro; si la pasarela lo rechaza en el acto, el backend responde 502
  // con el motivo.
  sendTestNotification: ({ to, message }) =>
    http.post(`${base()}/test`, { to, message }),
  // Reenvío = envío nuevo (otra fila, otra referencia en la pasarela). Sin `force` el backend solo
  // acepta una fallida: una enviada o pendiente responde 409, porque se paga otra vez.
  resendSentNotification: (id, { force = false } = {}) =>
    http.post(`${base()}/${id}/resend`, { force }),
};

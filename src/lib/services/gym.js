// Servicio: administración de gimnasio de la compañía activa (planes de membresía; miembros y
// suscripciones se agregan en fases posteriores).
//
// Company-scoped: las rutas cuelgan de /companies/{company}/gym. Requiere la funcionalidad
// `functionality_gym` activa en la compañía y los permisos `api-module-gym-plans` (ver) /
// `gym-plans-create` / `gym-plans-edit`. Los métodos van prefijados `gym*` para no colisionar
// con otros servicios en el barril de src/lib/api.js.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}/gym`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

// El backend omite la clave `data` cuando una lista viene vacía (ControllerApi::responseJson),
// y el cliente HTTP devuelve entonces el envoltorio en vez de un array. Esto garantiza que los
// endpoints de lista NO paginados siempre resuelvan a un array.
const list = (promise) => promise.then((d) => (Array.isArray(d) ? d : []));

// Mismo problema que `list`, para endpoints que devuelven un objeto (no un array): un miembro sin
// chequeos hace que el backend omita `data` y el cliente devuelva el envoltorio {status, message}
// crudo. Lo distingue de una serie real (que nunca tiene ambas claves a la vez) y lo normaliza a {}.
const obj = (promise) => promise.then((d) => (d && typeof d === 'object' && !Array.isArray(d) && !('status' in d && 'message' in d) ? d : {}));

export const gymService = {
  // ── Planes de membresía ─────────────────────────────────────────────────
  gymPlans: ({ status = '', search = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/plans${qs({ status, _search: search, page, per_page: perPage })}`, { paginated: true }),

  gymPlan: (planId) => http.get(`${base()}/plans/${planId}`),

  createGymPlan: (data) => http.post(`${base()}/plans`, data),

  updateGymPlan: (planId, data) => http.put(`${base()}/plans/${planId}`, data),

  // Activa/desactiva el plan (nunca se borra: las suscripciones ya creadas mantienen su snapshot).
  setGymPlanStatus: (planId, status) => http.put(`${base()}/plans/${planId}/status`, { status }),

  // ── Miembros ─────────────────────────────────────────────────────────────
  // Los miembros son usuarios reales de la plataforma (resueltos como "pasivos" al registrarlos,
  // mismo patrón que los huéspedes de Reservas): el backend hace find-or-create por documento o
  // celular, así que crear con los datos de alguien ya existente lo reutiliza en vez de duplicarlo.
  gymMembers: ({ status = '', search = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/members${qs({ status, _search: search, page, per_page: perPage })}`, { paginated: true }),

  gymMember: (memberId) => http.get(`${base()}/members/${memberId}`),

  createGymMember: (data) => http.post(`${base()}/members`, data),

  // Solo los datos propios del gimnasio (altura, objetivo, notas, estado); nombre y documento se
  // editan desde el perfil del usuario.
  updateGymMember: (memberId, data) => http.put(`${base()}/members/${memberId}`, data),

  // ── Suscripciones ────────────────────────────────────────────────────────
  gymSubscriptions: ({ status = '', expiringWithin = '', search = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/subscriptions${qs({ status, expiring_within: expiringWithin, _search: search, page, per_page: perPage })}`, { paginated: true }),

  gymSubscription: (subscriptionId) => http.get(`${base()}/subscriptions/${subscriptionId}`),

  // Historial de suscripciones del miembro, más reciente primero.
  gymMemberSubscriptions: (memberId) => list(http.get(`${base()}/members/${memberId}/subscriptions`)),

  // Da de alta o renueva (si el miembro tiene una vigente, la nueva se encadena automáticamente
  // desde el backend). `payment` es opcional: registra el primer pago en la misma llamada.
  createGymSubscription: (memberId, data) => http.post(`${base()}/members/${memberId}/subscriptions`, data),

  // Cancela una suscripción vigente (irreversible, motivo obligatorio).
  cancelGymSubscription: (subscriptionId, reason) => http.put(`${base()}/subscriptions/${subscriptionId}/cancel`, { reason }),

  // ── Pagos de suscripción ─────────────────────────────────────────────────
  // Cada pago genera su factura (orden GYM) en la fecha del pago.
  addGymSubscriptionPayment: (subscriptionId, data) => http.post(`${base()}/subscriptions/${subscriptionId}/payments`, data),

  // Anula el pago y cancela su factura (irreversible, motivo obligatorio).
  annulGymPayment: (paymentId, reason) => http.put(`${base()}/payments/${paymentId}/annul`, { reason }),

  // ── Medidas físicas ──────────────────────────────────────────────────────
  // Catálogo de tipos de medida visibles para la compañía (del sistema + propios):
  // [{ id, key, label, unit, sided, sort_order }].
  gymMeasurementTypes: () => list(http.get(`${base()}/measurement-types`)),

  // Historial paginado de chequeos del miembro, más reciente primero.
  gymMemberCheckins: (memberId, { page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/members/${memberId}/checkins${qs({ page, per_page: perPage })}`, { paginated: true }),

  // Registra un chequeo: { measured_at?, notes?, values: [{ measurement_type_id, side?, value }] }.
  createGymCheckin: (memberId, data) => http.post(`${base()}/members/${memberId}/checkins`, data),

  gymCheckin: (checkinId) => http.get(`${base()}/checkins/${checkinId}`),

  // Corrige fecha, notas y/o valores de un chequeo (sin efecto contable).
  updateGymCheckin: (checkinId, data) => http.put(`${base()}/checkins/${checkinId}`, data),

  // Series de progreso para graficar: { [type_key]: { unit, points: [{date, value, side}] } }.
  gymMemberProgress: (memberId, { types = [], from = '', to = '' } = {}) => {
    const sp = new URLSearchParams();
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    types.forEach((t) => sp.append('types[]', t));
    const q = sp.toString();
    return obj(http.get(`${base()}/members/${memberId}/progress${q ? `?${q}` : ''}`));
  },
};

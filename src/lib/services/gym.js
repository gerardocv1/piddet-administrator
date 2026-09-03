// Servicio: administración de gimnasio de la compañía activa (planes de membresía; afiliados y
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

// Mismo problema que `list`, para endpoints que devuelven un objeto (no un array): un afiliado sin
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

  // Items tipo SERVICE activos del catálogo de productos, para el selector del item de
  // facturación del plan: [{ id, name, description, price }].
  gymServiceItems: () => list(http.get(`${base()}/service-items`)),

  // ── Afiliados ─────────────────────────────────────────────────────────────
  // Los afiliados son usuarios reales de la plataforma (resueltos como "pasivos" al registrarlos,
  // mismo patrón que los huéspedes de Reservas): el backend hace find-or-create por documento o
  // celular, así que crear con los datos de alguien ya existente lo reutiliza en vez de duplicarlo.
  gymMembers: ({ status = '', search = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/members${qs({ status, _search: search, page, per_page: perPage })}`, { paginated: true }),

  gymMember: (memberId) => http.get(`${base()}/members/${memberId}`),

  // Búsqueda previa al registro: se manda celular O correo y responde
  // { found, user: {...} | null, member: {...} | null }. `member` viene lleno si esa persona ya
  // está afiliada a esta compañía; `user`, si ya tiene cuenta en la plataforma (para reutilizarla).
  gymMemberLookup: ({ phone_number = '', email = '' } = {}) =>
    obj(http.get(`${base()}/members/lookup${qs({ phone_number, email })}`)),

  createGymMember: (data) => http.post(`${base()}/members`, data),

  // Solo los datos propios del gimnasio (sexo, altura, objetivo, notas, estado).
  updateGymMember: (memberId, data) => http.put(`${base()}/members/${memberId}`, data),

  // Datos personales de la persona (nombres, correo, documento). El celular NO se edita: es la
  // credencial de acceso de la cuenta. Refresca los snapshots (nombre en ficha y suscripciones).
  updateGymMemberPersonal: (memberId, data) => http.put(`${base()}/members/${memberId}/personal`, data),

  // ── Suscripciones (continuas, con períodos de cobro que genera el sistema) ─
  // Cada fila trae su período vigente embebido y el saldo pendiente total.
  gymSubscriptions: ({ status = '', expiringWithin = '', search = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/subscriptions${qs({ status, expiring_within: expiringWithin, _search: search, page, per_page: perPage })}`, { paginated: true }),

  // Detalle con `periods[]` (más reciente primero), cada uno con sus pagos.
  gymSubscription: (subscriptionId) => http.get(`${base()}/subscriptions/${subscriptionId}`),

  // Historial de suscripciones del afiliado, más reciente primero.
  gymMemberSubscriptions: (memberId) => list(http.get(`${base()}/members/${memberId}/subscriptions`)),

  // Suscribe al afiliado a un plan (rechaza si ya tiene una suscripción activa: los períodos
  // siguientes los genera el sistema, no un alta nueva). `payment` es opcional: registra el
  // primer pago en la misma llamada.
  createGymSubscription: (memberId, data) => http.post(`${base()}/members/${memberId}/subscriptions`, data),

  // Cancela una suscripción activa (irreversible, motivo obligatorio): cancela también sus
  // períodos vivos.
  cancelGymSubscription: (subscriptionId, reason) => http.put(`${base()}/subscriptions/${subscriptionId}/cancel`, { reason }),

  // Fuerza a demanda el ciclo diario de UNA suscripción (permiso `gym-subscriptions-create`):
  // transiciona sus períodos, aplica el corte por no pago si agotó la gracia sin abonos y genera
  // el período siguiente cuando el vigente ya venció. Es lo que hace el cron del backend; el botón
  // existe para cuando no corrió. Responde el detalle actualizado de la suscripción.
  processGymSubscription: (subscriptionId) => http.post(`${base()}/subscriptions/${subscriptionId}/process`, {}),

  // Mueve el inicio del período vigente (el último, vivo) y el backend recalcula vencimiento y
  // gracia con la duración del período. Para el afiliado que volvió días después de que se
  // encadenara su período. Responde el detalle actualizado de la suscripción.
  updateGymPeriodStartDate: (subscriptionId, periodId, startDate) =>
    http.put(`${base()}/subscriptions/${subscriptionId}/periods/${periodId}/start-date`, { start_date: startDate }),

  // Cancela el período vigente y, con él, la suscripción (permiso `gym-subscriptions-cancel`).
  // `annulPayments` anula además los pagos activos del período con sus facturas (exige
  // `gym-payments-annul`). Motivo obligatorio. Responde el detalle actualizado.
  cancelGymPeriod: (subscriptionId, periodId, { reason, annulPayments = false }) =>
    http.put(`${base()}/subscriptions/${subscriptionId}/periods/${periodId}/cancel`, { reason, annul_payments: annulPayments }),

  // Mantenimiento (permiso `gym-periods-recalculate`, solo super-admin): recalcula por calendario
  // las fechas de los períodos vivos de la compañía, para arreglar las suscripciones creadas
  // cuando el vencimiento se sumaba en días. Con `dryRun` no escribe: devuelve lo que cambiaría.
  // Responde { scanned, updated, dry_run, changes: [{ subscription_id, member_name, number,
  // start_date, old_end_date, new_end_date, old_grace_ends_at, new_grace_ends_at }] }.
  recalculateGymPeriodDates: ({ dryRun = false } = {}) =>
    http.post(`${base()}/subscriptions/recalculate-period-dates`, { dry_run: dryRun }),

  // ── Pagos de suscripción ─────────────────────────────────────────────────
  // Abona al período pendiente más antiguo (el backend decide cuál; no se indica period_id).
  // Cada pago genera su factura (orden GYM) en la fecha del pago.
  addGymSubscriptionPayment: (subscriptionId, data) => http.post(`${base()}/subscriptions/${subscriptionId}/payments`, data),

  // Anula el pago y cancela su factura (irreversible, motivo obligatorio).
  annulGymPayment: (paymentId, reason) => http.put(`${base()}/payments/${paymentId}/annul`, { reason }),

  // Catálogo cerrado de objetivos del afiliado (el objetivo se elige, no es texto libre):
  // [{ id, key, label }].
  gymGoals: () => list(http.get(`${base()}/goals`)),

  // ── Medidas físicas ──────────────────────────────────────────────────────
  // Medidas que la compañía pide a sus afiliados (el catálogo filtrado por su selección; sin
  // selección guardada, todas): [{ id, key, label, unit, sided, sort_order }].
  gymMeasurementTypes: () => list(http.get(`${base()}/measurement-types`)),

  // Configuración de medidas: TODO el catálogo, cada tipo con `enabled`.
  gymMeasurementSettings: () => list(http.get(`${base()}/measurement-settings`)),

  // Reemplaza la selección de medidas de la compañía (mínimo una).
  updateGymMeasurementSettings: (typeIds) => http.put(`${base()}/measurement-settings`, { type_ids: typeIds }),

  // Historial paginado de chequeos del afiliado, más reciente primero.
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

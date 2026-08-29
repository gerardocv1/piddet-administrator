// Servicio: reservas de hospedaje de la compañía activa (cabañas, habitaciones, lugares).
//
// Company-scoped: las rutas cuelgan de /companies/{company}. El módulo tiene dos permisos:
// `api-module-rentable-units` (configurar unidades y tipos) y `api-module-reservations`
// (operar reservas). Una unidad reservable es un encabezado (tipo, capacidad, tarifa por noche,
// item de facturación, fotos públicas en S3) con espacios internos (habitación, sala, minibar…),
// cada uno con sus fotos. Los servicios adicionales de una reserva son items tipo SERVICE del
// catálogo de productos. Los huéspedes son usuarios reales de la plataforma (creados como
// "pasivos"); el pre-check-in público vive en rutas /public/checkin/{code} (sin sesión).

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

// El backend omite la clave `data` cuando una lista viene vacía (ControllerApi::responseJson),
// y el cliente HTTP devuelve entonces el envoltorio en vez de un array. Esto garantiza que los
// endpoints de lista siempre resuelvan a un array.
const list = (promise) => promise.then((d) => (Array.isArray(d) ? d : []));

export const reservationsService = {
  // ── Unidades reservables ────────────────────────────────────────────────
  // Tipos de unidad visibles para la compañía (globales + propios): [{ id, name, icon }].
  rentableUnitTypes: () => list(http.get(`${base()}/rentable-unit-types`)),

  // Listado paginado de unidades (con tipo y conteo de fotos).
  rentableUnits: ({ typeId = '', status = '', search = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/rentable-units${qs({ rentable_unit_type_id: typeId, status, _search: search, page, per_page: perPage })}`, { paginated: true }),

  // Detalle de la unidad: tipo, espacios (con fotos) y fotos generales con URL.
  rentableUnit: (unitId) => http.get(`${base()}/rentable-units/${unitId}`),

  // Crea la unidad. `files` y `spaces[].files` son los `name` devueltos por uploadFile (folder
  // 'rentable-units', públicos).
  createRentableUnit: (data) => http.post(`${base()}/rentable-units`, data),

  updateRentableUnit: (unitId, data) => http.put(`${base()}/rentable-units/${unitId}`, data),

  // Cambia el estado (1 reservable / 0 inactiva). Devuelve el detalle.
  setRentableUnitStatus: (unitId, status) => http.patch(`${base()}/rentable-units/${unitId}/status`, { status }),

  // Adjunta fotos (names ya subidos con uploadFile) a la unidad o a uno de sus espacios.
  attachRentableUnitFiles: (unitId, names, spaceId = null) =>
    http.post(`${base()}/rentable-units/${unitId}/files`, { files: names, space_id: spaceId }),

  // Quita una foto de la unidad y la borra de S3 (irreversible). Devuelve el detalle.
  detachRentableUnitFile: (unitId, name) => http.del(`${base()}/rentable-units/${unitId}/files${qs({ name })}`),

  // ── Lo que incluye la tarifa (desayuno, fogata, ingreso al sitio…) ──────
  // Cada operación devuelve el detalle completo de la unidad, como los espacios.
  createRentableUnitInclusion: (unitId, data) => http.post(`${base()}/rentable-units/${unitId}/inclusions`, data),
  updateRentableUnitInclusion: (unitId, inclusionId, data) => http.put(`${base()}/rentable-units/${unitId}/inclusions/${inclusionId}`, data),
  deleteRentableUnitInclusion: (unitId, inclusionId) => http.del(`${base()}/rentable-units/${unitId}/inclusions/${inclusionId}`),

  // ── Espacios (composición interna) de la unidad ─────────────────────────
  createRentableUnitSpace: (unitId, data) => http.post(`${base()}/rentable-units/${unitId}/spaces`, data),
  updateRentableUnitSpace: (unitId, spaceId, data) => http.put(`${base()}/rentable-units/${unitId}/spaces/${spaceId}`, data),
  deleteRentableUnitSpace: (unitId, spaceId) => http.del(`${base()}/rentable-units/${unitId}/spaces/${spaceId}`),

  // Unidades activas con su disponibilidad para un rango (selector del wizard de reserva).
  unitAvailability: ({ checkIn, checkOut }) =>
    list(http.get(`${base()}/rentable-units/availability${qs({ check_in: checkIn, check_out: checkOut })}`)),

  // ── Items de servicio del catálogo de productos ─────────────────────────
  // Items tipo SERVICE activos: [{ id, name, description, price }]. Alimentan el selector del
  // item de facturación de la unidad y el de agregar servicio en el detalle de la reserva.
  // Con `reservable: true` limita a los marcados como disponibles para reservas: es el catálogo
  // que se ofrece SOLO al crear la reserva (wizard y agente de IA).
  serviceItems: ({ reservable = false } = {}) =>
    list(http.get(`${base()}/service-items${qs({ reservable: reservable ? 1 : '' })}`)),

  // Items activos facturables en la cuenta de una reserva (productos Y servicios):
  // [{ id, name, description, price, type: 'PRODUCT'|'SERVICE' }]. `q` busca por nombre.
  consumableItems: (q = '') => list(http.get(`${base()}/consumable-items${qs({ q })}`)),

  // ── Huéspedes (usuarios de la compañía como clientes) ───────────────────
  guestsSearch: (q) => list(http.get(`${base()}/guests${qs({ q })}`)),
  guest: (userId) => http.get(`${base()}/guests/${userId}`),

  // ── Reservas ────────────────────────────────────────────────────────────
  // El backend encabeza el listado con las reservas vigentes que entran hoy o mañana (el resto va
  // por creación descendente) y marca con `has_decoration` las que llevan un servicio de
  // decoración: el panel las alerta con un emoji de bombas.
  reservations: ({ dateFrom = '', dateTo = '', status = '', unitId = '', search = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/reservations${qs({ date_from: dateFrom, date_to: dateTo, status, rentable_unit_id: unitId, _search: search, page, per_page: perPage })}`, { paginated: true }),

  // Reservas que se solapan con un rango, para la vista de calendario:
  // [{ id, code, rentable_unit_name, holder_user_name, guests_count, check_in_date, check_out_date,
  //    nights, total, status, services_count }].
  reservationsCalendar: ({ from, to }) =>
    list(http.get(`${base()}/reservations/calendar${qs({ from, to })}`)),

  // Agenda de reservas de un día (hoy si no se pasa fecha), para el widget del dashboard:
  // { date, totals: { arrivals, departures, staying, decorated }, arrivals, departures, staying }.
  // Cada fila trae los mismos campos del listado más `has_decoration` y `precheckin_completed`.
  reservationsDayAgenda: ({ date = '' } = {}) =>
    http.get(`${base()}/reservations/day-agenda${qs({ date })}`),

  // Detalle completo: huéspedes, servicios, pagos y resumen de saldo.
  reservation: (reservationId) => http.get(`${base()}/reservations/${reservationId}`),

  // Crea la reserva (unidad + fechas + titular + acompañantes + servicios + adelanto opcional).
  createReservation: (data) => http.post(`${base()}/reservations`, data),

  confirmReservation: (reservationId) => http.patch(`${base()}/reservations/${reservationId}/confirm`),
  // Registra la entrada. Exige el pre-check-in completo; con `force` se salta esa regla
  // (check-in forzado: entra sin los datos del huésped cuando conseguirlos no es viable).
  checkInReservation: (reservationId, { force = false } = {}) =>
    http.patch(`${base()}/reservations/${reservationId}/check-in`, force ? { force: true } : undefined),
  // Cancela la reserva en cualquier estado no cancelado; cancela también sus facturas vigentes.
  cancelReservation: (reservationId, reason) => http.patch(`${base()}/reservations/${reservationId}/cancel`, { reason }),
  // Reabre una reserva finalizada conservando pagos y facturas (los consolidados no se anulan).
  reopenReservation: (reservationId) => http.patch(`${base()}/reservations/${reservationId}/reopen`),
  // ¿La unidad de la reserva está libre en ese rango? Excluye la propia reserva. Devuelve
  // { check_in_date, check_out_date, nights, available, conflicts: [...] }.
  reservationAvailability: (reservationId, { checkIn, checkOut }) =>
    http.get(`${base()}/reservations/${reservationId}/availability${qs({ check_in: checkIn, check_out: checkOut })}`),

  // Modifica la estadía de una reserva abierta: { check_in_date, check_out_date, guests_count? }.
  // El backend revalida disponibilidad y recalcula noches, hospedaje y total con la tarifa pactada.
  // Con la reserva en estadía (check-in hecho) solo se puede mover la fecha de salida.
  rescheduleReservation: (reservationId, data) => http.put(`${base()}/reservations/${reservationId}/dates`, data),
  // Cambia la tarifa por noche (solo reserva abierta); el backend recalcula hospedaje y total.
  updateReservationPrice: (reservationId, pricePerNight) => http.put(`${base()}/reservations/${reservationId}/price`, { price_per_night: pricePerNight }),
  syncReservationGuests: (reservationId, data) => http.put(`${base()}/reservations/${reservationId}/guests`, data),
  addReservationService: (reservationId, data) => http.post(`${base()}/reservations/${reservationId}/services`, data),
  removeReservationService: (reservationId, lineId) => http.del(`${base()}/reservations/${reservationId}/services/${lineId}`),

  // Cargos de la cuenta (productos o servicios del catálogo); se facturan en el checkout.
  addReservationCharge: (reservationId, data) => http.post(`${base()}/reservations/${reservationId}/charges`, data),
  removeReservationCharge: (reservationId, chargeId) => http.del(`${base()}/reservations/${reservationId}/charges/${chargeId}`),

  // Pagos/abonos de la reserva. Cada abono genera su factura (orden LODGING) en la fecha del pago;
  // anular el pago cancela también esa factura.
  addReservationPayment: (reservationId, data) => http.post(`${base()}/reservations/${reservationId}/payments`, data),
  annulReservationPayment: (reservationId, paymentId) => http.patch(`${base()}/reservations/${reservationId}/payments/${paymentId}/annul`),

  // Checkout: factura toda la cuenta (hospedaje + servicios + cargos) con los anticipos aplicados
  // como descuento y salda los consumos POS pendientes. Acepta un pago final opcional.
  checkoutReservation: (reservationId, payment = null) => http.post(`${base()}/reservations/${reservationId}/checkout`, payment ? { payment } : {}),
  // Facturas vinculadas a la reserva: abonos, consumos POS y orden de cierre
  // [{ id, order_number, type: 'advance'|'consumption'|'checkout', total, date, status_payment, … }].
  reservationOrders: (reservationId) => list(http.get(`${base()}/reservations/${reservationId}/orders`)),

  // ── Hospedaje público (sin sesión): unidades reservables visibles en la portada ──
  // Listado de unidades activas de la compañía (por username). Con check_in/check_out cada
  // unidad trae `available`; sin fechas, `available` viene null. Devuelve { company, units }.
  publicRentableUnits: (companyUsername, { checkIn = '', checkOut = '' } = {}) =>
    http.get(`/public/${encodeURIComponent(companyUsername)}/rentable-units${qs({ check_in: checkIn, check_out: checkOut })}`),
  // Detalle público de una unidad activa: fotos, espacios (con fotos), tarifas y horarios.
  // Devuelve { company, unit }.
  publicRentableUnit: (companyUsername, unitId) =>
    http.get(`/public/${encodeURIComponent(companyUsername)}/rentable-units/${unitId}`),
  // Consulta (sin reservar) si la unidad está libre en un rango: { check_in, check_out, nights, available }.
  publicRentableUnitAvailability: (companyUsername, unitId, { checkIn, checkOut }) =>
    http.get(`/public/${encodeURIComponent(companyUsername)}/rentable-units/${unitId}/availability${qs({ check_in: checkIn, check_out: checkOut })}`),

  // ── Pre-check-in público (sin sesión, autenticado por el código de reserva) ──
  // Única entrada a la reserva: código + nombre del titular (el código por sí solo no abre nada).
  // Devuelve el resumen de la estadía con los datos del alojamiento y de la unidad.
  checkinAccess: (code, name) => http.post('/public/checkin/access', { code, name }),
  checkinSubmit: (code, data) => http.post(`/public/checkin/${code}/guests`, data),
  checkinUploadDocument: (code, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.post(`/public/checkin/${code}/files`, fd);
  },
};

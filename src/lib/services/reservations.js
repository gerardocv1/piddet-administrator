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

  // ── Espacios (composición interna) de la unidad ─────────────────────────
  createRentableUnitSpace: (unitId, data) => http.post(`${base()}/rentable-units/${unitId}/spaces`, data),
  updateRentableUnitSpace: (unitId, spaceId, data) => http.put(`${base()}/rentable-units/${unitId}/spaces/${spaceId}`, data),
  deleteRentableUnitSpace: (unitId, spaceId) => http.del(`${base()}/rentable-units/${unitId}/spaces/${spaceId}`),

  // Unidades activas con su disponibilidad para un rango (selector del wizard de reserva).
  unitAvailability: ({ checkIn, checkOut }) =>
    list(http.get(`${base()}/rentable-units/availability${qs({ check_in: checkIn, check_out: checkOut })}`)),

  // ── Items de servicio del catálogo de productos ─────────────────────────
  // Items tipo SERVICE activos: [{ id, name, description, price }]. Alimentan el selector del
  // item de facturación de la unidad y los servicios adicionales de la reserva.
  serviceItems: () => list(http.get(`${base()}/service-items`)),

  // Items activos facturables en la cuenta de una reserva (productos Y servicios):
  // [{ id, name, description, price, type: 'PRODUCT'|'SERVICE' }]. `q` busca por nombre.
  consumableItems: (q = '') => list(http.get(`${base()}/consumable-items${qs({ q })}`)),

  // ── Huéspedes (usuarios de la compañía como clientes) ───────────────────
  guestsSearch: (q) => list(http.get(`${base()}/guests${qs({ q })}`)),
  guest: (userId) => http.get(`${base()}/guests/${userId}`),

  // ── Reservas ────────────────────────────────────────────────────────────
  reservations: ({ dateFrom = '', dateTo = '', status = '', unitId = '', search = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/reservations${qs({ date_from: dateFrom, date_to: dateTo, status, rentable_unit_id: unitId, _search: search, page, per_page: perPage })}`, { paginated: true }),

  // Detalle completo: huéspedes, servicios, pagos y resumen de saldo.
  reservation: (reservationId) => http.get(`${base()}/reservations/${reservationId}`),

  // Crea la reserva (unidad + fechas + titular + acompañantes + servicios + adelanto opcional).
  createReservation: (data) => http.post(`${base()}/reservations`, data),

  confirmReservation: (reservationId) => http.patch(`${base()}/reservations/${reservationId}/confirm`),
  checkInReservation: (reservationId) => http.patch(`${base()}/reservations/${reservationId}/check-in`),
  // Cancela la reserva en cualquier estado no cancelado; cancela también sus facturas vigentes.
  cancelReservation: (reservationId, reason) => http.patch(`${base()}/reservations/${reservationId}/cancel`, { reason }),
  // Reabre una reserva finalizada conservando pagos y facturas (los consolidados no se anulan).
  reopenReservation: (reservationId) => http.patch(`${base()}/reservations/${reservationId}/reopen`),
  rescheduleReservation: (reservationId, data) => http.put(`${base()}/reservations/${reservationId}/dates`, data),
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

  // ── Pre-check-in público (sin sesión, autenticado por el código de reserva) ──
  checkinSummary: (code) => http.get(`/public/checkin/${code}`),
  checkinLookup: (code, document) => http.get(`/public/checkin/${code}/guests/lookup?document=${encodeURIComponent(document)}`),
  checkinSubmit: (code, data) => http.post(`/public/checkin/${code}/guests`, data),
  checkinUploadDocument: (code, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.post(`/public/checkin/${code}/files`, fd);
  },
};

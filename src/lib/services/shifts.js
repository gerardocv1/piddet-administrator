// Servicio: turnos de caja de la compañía activa (sesiones con base, movimientos y arqueo).
//
// Company-scoped: las rutas cuelgan de /companies/{company}. Un turno se abre con una base de
// dinero y puede ser GLOBAL (toda la compañía), EMPLOYEE (uno o varios cajeros: caja
// compartida, `assigned_users`) o PURCHASE (compras: uno o varios compradores que no venden).
// Mientras está abierto, el backend le asocia automáticamente las ventas y gastos que registran
// sus asignados (movimientos con monto y método de pago denormalizados); al de compras solo le
// entran gastos y las adiciones a la base que se registran a mano. El cierre es un arqueo: se
// cuenta el efectivo por denominación y se reporta lo recibido por cada otro método de pago; el
// backend suma ese desglose, lo compara contra base + ventas + adiciones − gastos y registra la
// diferencia como ajuste (sobrante/faltante); en el de compras la diferencia solo queda
// registrada, sin factura ni gasto de respaldo. Reglas del backend: máximo 1 GLOBAL abierto por
// compañía, ningún usuario en dos turnos abiertos a la vez (cajero o compras), y el GLOBAL no se
// puede cerrar con turnos de cajero o de compras abiertos (409).

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

export const shiftsService = {
  // Listado paginado: abiertos primero, luego por apertura descendente. El cajero
  // (api-module-shifts-own) solo recibe los turnos en los que está asignado; el filtro lo
  // aplica el backend. assignedUserId filtra por un usuario asignado.
  shifts: ({ status = '', type = '', dateFrom = '', dateTo = '', assignedUserId = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/shifts${qs({ status, type, date_from: dateFrom, date_to: dateTo, assigned_user_id: assignedUserId, page, per_page: perPage })}`, { paginated: true }),

  // Turnos abiertos relevantes para el usuario (Dashboard): { global, mine (cajero o compras),
  // open_employee_count, open_purchase_count }.
  currentShifts: () => http.get(`${base()}/shifts/current`),

  // Detalle: turno + balance en vivo + movimientos (ventas, adiciones, gastos, ajustes).
  shift: (shiftId) => http.get(`${base()}/shifts/${shiftId}`),

  // Balance del turno, con lo que necesita el wizard de cierre: el esperado total, el esperado
  // partido en efectivo y por cada otro método (`cash`, `non_cash.by_method`) y el catálogo de
  // denominaciones con el que se cuentan los billetes (`cash_denominations`).
  shiftBalance: (shiftId) => http.get(`${base()}/shifts/${shiftId}/balance`),

  // Abre un turno. { type: 'GLOBAL'|'EMPLOYEE'|'PURCHASE', base_amount, assigned_user_ids? (solo
  // admin: uno o varios usuarios; sin lista el turno es del propio usuario) }
  openShift: (data) => http.post(`${base()}/shifts`, data),

  // Suma dinero a la base de un turno de compras ABIERTO. { amount, payment_method, notes? }
  // Queda como movimiento `addition` con quién lo registró. 409 si el turno no es de compras o
  // ya está cerrado. Devuelve el detalle.
  addShiftAddition: (shiftId, data) => http.post(`${base()}/shifts/${shiftId}/additions`, data),

  // Cierra el turno con su arqueo. { cash_count: [{ code, quantity }] (las monedas van con
  // `amount`), method_count: [{ payment_method, amount }], notes? } El total contado lo suma el
  // backend a partir del desglose: aquí no se manda `counted_amount`. Devuelve el detalle.
  closeShift: (shiftId, data) => http.post(`${base()}/shifts/${shiftId}/close`, data),

  // Corrige la base de un turno ABIERTO (solo admin del módulo). Devuelve el detalle.
  updateShiftBase: (shiftId, baseAmount) => http.put(`${base()}/shifts/${shiftId}/base`, { base_amount: baseAmount }),

  // Cancela un turno ABIERTO mal registrado, con motivo obligatorio (solo admin del módulo).
  // Irreversible: queda CANCELLED, no recibe más movimientos ni bloquea nuevas aperturas.
  cancelShift: (shiftId, reason) => http.post(`${base()}/shifts/${shiftId}/cancel`, { reason }),
};

// Servicio: turnos de caja de la compañía activa (sesiones con base, movimientos y arqueo).
//
// Company-scoped: las rutas cuelgan de /companies/{company}. Un turno se abre con una base de
// dinero y puede ser GLOBAL (toda la compañía) o EMPLOYEE (un cajero). Mientras está abierto,
// el backend le asocia automáticamente las ventas y gastos que se registran (movimientos con
// monto y método de pago denormalizados). El cierre compara el dinero contado contra
// base + ventas − gastos y registra la diferencia como ajuste (sobrante/faltante). Reglas del
// backend: máximo 1 GLOBAL abierto por compañía, 1 turno abierto por empleado, y el GLOBAL no
// se puede cerrar con turnos de empleado abiertos (409).

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
  // (api-module-shifts-own) solo recibe los suyos; el filtro lo aplica el backend.
  shifts: ({ status = '', type = '', dateFrom = '', dateTo = '', assignedUserId = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/shifts${qs({ status, type, date_from: dateFrom, date_to: dateTo, assigned_user_id: assignedUserId, page, per_page: perPage })}`, { paginated: true }),

  // Turnos abiertos relevantes para el usuario (Dashboard): { global, mine, open_employee_count }.
  currentShifts: () => http.get(`${base()}/shifts/current`),

  // Detalle: turno + balance en vivo + movimientos (ventas, gastos, ajustes).
  shift: (shiftId) => http.get(`${base()}/shifts/${shiftId}`),

  // Balance del turno para el paso 2 del wizard de cierre.
  shiftBalance: (shiftId) => http.get(`${base()}/shifts/${shiftId}/balance`),

  // Abre un turno. { type: 'GLOBAL'|'EMPLOYEE', base_amount, assigned_user_id? (solo admin) }
  openShift: (data) => http.post(`${base()}/shifts`, data),

  // Cierra el turno con el dinero contado. { counted_amount, notes? } Devuelve el detalle.
  closeShift: (shiftId, data) => http.post(`${base()}/shifts/${shiftId}/close`, data),

  // Corrige la base de un turno ABIERTO (solo admin del módulo). Devuelve el detalle.
  updateShiftBase: (shiftId, baseAmount) => http.put(`${base()}/shifts/${shiftId}/base`, { base_amount: baseAmount }),

  // Cancela un turno ABIERTO mal registrado, con motivo obligatorio (solo admin del módulo).
  // Irreversible: queda CANCELLED, no recibe más movimientos ni bloquea nuevas aperturas.
  cancelShift: (shiftId, reason) => http.post(`${base()}/shifts/${shiftId}/cancel`, { reason }),
};

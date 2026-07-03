// Servicio: métricas/reportes del dashboard de la compañía activa.
//
// Company-scoped: las rutas cuelgan de /companies/{company}/metrics (como items.js). La
// compañía activa se resuelve internamente desde la fachada `auth`. Las claves del JSON
// (period, totals, daily…) se mantienen como las expone el backend.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  return sp.toString() ? `?${sp.toString()}` : '';
};

export const metricsService = {
  // Reporte de ventas por tipo (productos vs servicios) por día.
  // days: 1..30 (default 15), endDate: 'yyyy-mm-dd', force: ignora cache del backend.
  salesByType: ({ days = 15, endDate, force = false } = {}) =>
    http.get(`${base()}/metrics/sales-by-type${qs({ days, end_date: endDate, force: force ? 1 : '' })}`),

  // Comparación de ventas: período actual vs. el período anterior de igual longitud
  // (alineado por día de la semana si days es múltiplo de 7). days: 1..28 (default 7).
  salesComparison: ({ days = 7, endDate, force = false } = {}) =>
    http.get(`${base()}/metrics/sales-comparison${qs({ days, end_date: endDate, force: force ? 1 : '' })}`),

  // Reporte de gastos por día con KPIs (total, registros, promedio, mayor gasto) y deltas.
  // Con solo api-module-expenses-own el backend limita todo a los gastos del usuario.
  expensesReport: ({ days = 15, endDate, force = false } = {}) =>
    http.get(`${base()}/metrics/expenses-report${qs({ days, end_date: endDate, force: force ? 1 : '' })}`),

  // Comparación de gastos: período actual vs. el anterior de igual longitud (mismo scoping).
  expensesComparison: ({ days = 7, endDate, force = false } = {}) =>
    http.get(`${base()}/metrics/expenses-comparison${qs({ days, end_date: endDate, force: force ? 1 : '' })}`),
};

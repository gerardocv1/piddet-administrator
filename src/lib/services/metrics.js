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
};

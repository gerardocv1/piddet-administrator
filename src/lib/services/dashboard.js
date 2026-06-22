// Servicio: dashboard.
//
// Datos del panel inicial: estadísticas, pedidos recientes y tiendas (resumen).

import { http } from '../http/client.js';

export const dashboardService = {
  stats: () => http.get('/stats'),
  orders: () => http.get('/pedidos'),
  stores: () => http.get('/tiendas'),
};

// Servicio: tiendas (detalle).
//
// Listado detallado de tiendas para la pantalla de gestión. El resumen para el dashboard
// vive en dashboardService.stores().

import { http } from '../http/client.js';

export const storesService = {
  storesDetail: () => http.get('/tiendas-detalle'),
};

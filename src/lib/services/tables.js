// Servicio: mesas (operación).

import { http } from '../http/client.js';

export const tablesService = {
  tables: () => http.get('/mesas'),
  updateTable: (n, data) => http.put(`/mesas/${n}`, data),
};

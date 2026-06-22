// Servicio: empresa (tenant).
//
// Una empresa agrupa tiendas/productos. El panel es multi-tenant: se puede consultar la
// empresa activa, listar las disponibles y cambiar de empresa.

import { http } from '../http/client.js';

export const companyService = {
  company: () => http.get('/company'),
  companies: () => http.get('/companies'),
  switchCompany: (id) => http.post('/company/switch', { id }),
};

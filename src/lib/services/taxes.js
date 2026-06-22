// Servicio: familias de impuestos (taxes) de la compañía activa.
//
// Solo lectura: el backend no expone CRUD de impuestos. Se usan para asignar una familia a un
// producto (item.tax_family_id) cuando la compañía tiene activa la funcionalidad de impuestos
// (ver services/functionalities.js). Cada familia llega con `name` ya formateado ("IVA (19.0%)").

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

export const taxesService = {
  taxes: () => http.get(`${base()}/taxes`),
};

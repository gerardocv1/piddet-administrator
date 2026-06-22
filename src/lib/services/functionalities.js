// Servicio: funcionalidades de la compañía activa.
//
// El backend devuelve las funcionalidades del sistema con un flag `is_active` por compañía
// (p. ej. `functionality_taxes` decide si se manejan impuestos en los productos). Es
// **company-scoped**, por eso recibe el identificador de compañía (id o username), igual que
// permissions.js. La fachada `auth` las carga/cachea; el hook `useFunctionalities` las consume.
//
// Respuesta (ya desempaquetada por http): [{ id, name, description, is_active }].

import { http } from '../http/client.js';

export const functionalitiesService = {
  // GET /companies/{company}/functionalities
  companyFunctionalities: (companyRef) => http.get(`/companies/${companyRef}/functionalities`),
};

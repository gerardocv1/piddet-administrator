// Servicio: funcionalidades de la compañía activa.
//
// El backend devuelve las funcionalidades del sistema con un flag `is_active` por compañía
// (p. ej. `functionality_taxes` decide si se manejan impuestos en los productos). Es
// **company-scoped**, por eso recibe el identificador de compañía (id o username), igual que
// permissions.js. La fachada `auth` las carga/cachea; el hook `useFunctionalities` las consume.
//
// Respuesta (ya desempaquetada por http): [{ id, name, label, icon, description, is_active }].
// `label`, `icon` (clase FontAwesome) y `description` vienen del catálogo y son los textos que
// se muestran al usuario en el modal de funcionalidades del perfil de empresa.

import { http } from '../http/client.js';

export const functionalitiesService = {
  // GET /companies/{company}/functionalities
  companyFunctionalities: (companyRef) => http.get(`/companies/${companyRef}/functionalities`),
  // PUT /companies/{company}/functionalities — activa/desactiva las funcionalidades de esa
  // compañía (permiso company-edit-functionalities). Body: { functionalities: [{ id, is_active }] }.
  // Devuelve el catálogo completo ya actualizado.
  updateCompanyFunctionalities: (companyRef, functionalities) =>
    http.put(`/companies/${companyRef}/functionalities`, { functionalities }),
};

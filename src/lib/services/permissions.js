// Servicio: permisos del usuario en la compañía activa.
//
// El backend devuelve los permisos expuestos al front (is_api = true) para decidir qué módulos
// y funcionalidades mostrar. Es **company-scoped**: depende de la compañía bajo la que opera el
// usuario, por eso recibe el identificador de compañía (id o username).
//
// Respuesta (ya desempaquetada por http): { roles: string[], permissions: string[] }.

import { http } from '../http/client.js';

export const permissionsService = {
  // GET /companies/{company}/me/permissions
  myPermissions: (companyRef) => http.get(`/companies/${companyRef}/me/permissions`),
};

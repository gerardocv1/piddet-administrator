// Servicio: empresa (tenant).
//
// Una empresa agrupa tiendas/productos. El panel es multi-tenant: se listan las empresas del
// usuario, se cambia la empresa activa (persiste como predeterminada en el backend) y se
// consulta/edita el perfil (datos + logo) de la empresa activa.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

export const companyService = {
  // Empresas a las que pertenece el usuario autenticado (para el selector del sidebar).
  companies: () => http.get('/auth/me/companies'),
  // Cambia la empresa activa del usuario y la fija como predeterminada (company_default_id).
  switchCompany: (id) => http.put('/auth/me/company', { company_id: id }),
  // Perfil completo de la empresa activa (Company + CompanyDetail, con icon resuelto).
  companyProfile: () => http.get(base()),
  // Actualiza datos de la empresa activa y/o su logo (campo `icon`: name de archivo ya subido).
  updateCompanyProfile: (data) => http.put(base(), data),
};

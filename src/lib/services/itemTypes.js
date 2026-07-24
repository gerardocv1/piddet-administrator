// Servicio: tipos de ítem.
//
// Los tipos son GLOBALES del sistema (no scopeados por compañía), pero el backend los expone bajo
// la ruta company-scoped. Aquí se usan solo como selector (no se administran desde el panel).

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

// Contrato del backend (ItemType::TYPE_SERVICE): identifica los items de tipo servicio,
// los únicos que pueden marcarse como disponibles para reservas.
export const SERVICE_ITEM_TYPE_ID = 2;

export const itemTypesService = {
  itemTypes: () => http.get(`${base()}/item-types?_row=200`, { paginated: true }),
};

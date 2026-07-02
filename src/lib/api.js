// Cliente de API de Piddet — barril agregador de servicios.
//
// `api` es la superficie ÚNICA que consumen las pantallas. No define endpoints: agrega los
// servicios por dominio de src/lib/services/. Cada servicio declara sus rutas contra el
// cliente HTTP único (src/lib/http/). Para añadir un endpoint, edita (o crea) su servicio
// en services/ y agrégalo al spread de abajo — las pantallas no cambian.
//
// El transporte real (headers, token, refresh, desempaquetado, errores, modo demo) vive en
// el cliente HTTP: src/lib/http/HttpClient.js.
//
// Modo demo: si VITE_API_URL está vacío, el cliente responde con datos de ejemplo (data/mock.js).
// Para autenticación, usa la fachada `auth` (src/lib/auth/index.js), no llames a /auth/login aquí.

import { USE_MOCK } from './http/client.js';
import { auth } from './auth/index.js';

import { accountService } from './services/account.js';
import { companyService } from './services/company.js';
import { dashboardService } from './services/dashboard.js';
import { metricsService } from './services/metrics.js';
import { itemsService } from './services/items.js';
import { itemCategoriesService } from './services/itemCategories.js';
import { masterItemCategoriesService } from './services/masterItemCategories.js';
import { itemTypesService } from './services/itemTypes.js';
import { itemOptionsService } from './services/itemOptions.js';
import { taxesService } from './services/taxes.js';
import { filesService } from './services/files.js';
import { ordersService } from './services/orders.js';
import { storesService } from './services/stores.js';
import { usersService } from './services/users.js';
import { tablesService } from './services/tables.js';
import { notificationsService } from './services/notifications.js';
import { permissionsService } from './services/permissions.js';
import { menusService } from './services/menus.js';
import { menuCategoriesService } from './services/menuCategories.js';

export const api = {
  // Auth: el login se delega en la fachada (gestiona token/refresh/persistencia).
  login: (creds) => auth.login(creds),

  ...accountService,
  ...companyService,
  ...dashboardService,
  ...metricsService,
  ...itemsService,
  ...itemCategoriesService,
  ...masterItemCategoriesService,
  ...itemTypesService,
  ...itemOptionsService,
  ...taxesService,
  ...filesService,
  ...ordersService,
  ...storesService,
  ...usersService,
  ...tablesService,
  ...notificationsService,
  ...permissionsService,
  ...menusService,
  ...menuCategoriesService,
};

export { USE_MOCK };

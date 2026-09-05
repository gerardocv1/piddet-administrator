// Control de acceso por módulo — fuente única de verdad.
//
// Cada módulo (ruta del panel) declara el permiso del backend que lo habilita. El Sidebar y las
// rutas de App.jsx se gatean a partir de aquí, así no se duplica el mapeo.
//
// POLÍTICA: whitelist estricta. Un módulo SOLO se muestra si el usuario tiene su permiso.
//   - `perm: '<permiso>'`  → visible si el usuario tiene ese permiso.
//   - `perm: ['a', 'b']`   → visible con CUALQUIERA de los permisos (OR).
//   - `perm: ALWAYS`       → siempre visible (sin requerir permiso).
//   - sin `perm`           → OCULTO por defecto (hasta asignarle un permiso aquí).
//
// Para habilitar un módulo nuevo: añádelo a su grupo con el `perm` que lo controla.

// Sentinela para módulos siempre visibles (no requieren permiso).
export const ALWAYS = '*';

// Inicio (Dashboard): siempre visible, no requiere permiso. Se renderiza fuera de los grupos.
export const HOME_ITEM = { to: '/', label: 'Inicio', icon: 'fas fa-house', end: true, perm: ALWAYS };

// Punto de venta: app externa (no es una ruta del panel). Abre pos-lite.piddet.com en otra pestaña.
// Se renderiza fuera de los grupos, como enlace externo, y solo si la compañía tiene contratada
// la funcionalidad del POS (`functionality_pos`).
export const POS_ITEM = { href: 'https://pos-lite.piddet.com', label: 'Punto de venta', icon: 'fas fa-cash-register', func: 'functionality_pos' };

// Grupos del menú lateral, en orden de aparición.
export const MODULE_GROUPS = [
  {
    section: 'Oferta',
    items: [
      // Grupo desplegable: el padre solo expande/colapsa; las rutas reales viven en `children`.
      // Las categorías de producto salieron del menú: se entra a ellas desde el listado de
      // productos (ver HIDDEN_MODULES). Las categorías de menú se administran dentro del detalle
      // de cada menú (/menus/:menuId).
      {
        label: 'Menús', icon: 'fas fa-utensils',
        children: [
          { to: '/products', label: 'Productos', icon: 'fas fa-burger', perm: 'api-module-products' },
          { to: '/menus', label: 'Carta', icon: 'fas fa-book-open', perm: 'api-module-menus' },
          // Opciones generales: grupos de opciones (servicios, adiciones…) que aplican a varios
          // productos a la vez; el menú del POS los expone dentro de cada producto asignado.
          { to: '/general-options', label: 'Opciones generales', icon: 'fas fa-sliders', perm: 'api-module-general-options' },
        ],
      },
      // Hospedaje: reservas de cabañas/habitaciones/lugares. `api-module-reservations` opera las
      // reservas; `api-module-rentable-units` configura unidades (los servicios adicionales salen
      // de los items tipo servicio del catálogo de productos). Además del permiso del usuario,
      // la compañía debe tener activa la funcionalidad de reservas (`func`).
      {
        label: 'Hospedaje', icon: 'fas fa-bed',
        children: [
          { to: '/reservations', label: 'Reservas', icon: 'fas fa-calendar-check', perm: 'api-module-reservations', func: 'functionality_reservations' },
          { to: '/rentable-units', label: 'Unidades', icon: 'fas fa-house-chimney', perm: 'api-module-rentable-units', func: 'functionality_reservations' },
        ],
      },
      // Gimnasio: suscripciones y medidas físicas se suman en fases posteriores. Los afiliados son
      // usuarios de la plataforma (mismo patrón "pasivo" de Reservas). Requiere la funcionalidad
      // `functionality_gym` activa en la compañía.
      {
        label: 'Gimnasio', icon: 'fas fa-dumbbell',
        children: [
          { to: '/gym/members', label: 'Afiliados', icon: 'fas fa-users', perm: 'api-module-gym', func: 'functionality_gym' },
          { to: '/gym/subscriptions', label: 'Suscripciones', icon: 'fas fa-calendar-check', perm: 'api-module-gym', func: 'functionality_gym' },
          { to: '/gym/plans', label: 'Planes', icon: 'fas fa-id-card', perm: 'api-module-gym-plans', func: 'functionality_gym' },
          { to: '/gym/measurements', label: 'Medidas', icon: 'fas fa-ruler', perm: 'api-module-gym-plans', func: 'functionality_gym' },
        ],
      },
    ],
  },
  {
    section: 'Operación',
    items: [
      // Ventas: facturas (órdenes consultables por fecha; el detalle /invoices/:orderId reusa el
      // permiso) y reporte (resumen, métodos de pago, top productos y ventas por día, con filtros).
      // Cada uno tiene su par de permisos: el de TODA la compañía (con filtro por usuario) y su
      // variante `-own`, con la que el usuario solo ve lo que registró él (lo filtra el backend).
      {
        label: 'Ventas', icon: 'fas fa-sack-dollar',
        children: [
          { to: '/invoices', label: 'Facturas', icon: 'fas fa-file-invoice', perm: ['api-module-orders', 'api-module-orders-own'] },
          { to: '/sales-report', label: 'Reporte', icon: 'fas fa-chart-line', perm: ['sales-report', 'sales-report-own'] },
        ],
      },
      // Egresos: registro de gastos (encabezado + líneas + fotos), reporte por categoría y
      // categorías propias. El detalle (/expenses/:expenseId) y la creación (/expenses/new,
      // /expenses/quick) reusan el permiso del listado; anular requiere además `expense-annul`
      // (solo oculta el botón). `api-module-expenses-own` es el acceso de empleado: registra y ve
      // SOLO sus gastos (el backend aplica el filtro); no ve Categorías. El Reporte tiene su
      // propio par de permisos: `expenses-report` (toda la compañía, con filtro por usuario) y
      // `expenses-report-own` (solo los gastos que registró él).
      // Además del permiso, la compañía debe tener activa la funcionalidad de egresos (`func`).
      {
        label: 'Egresos', icon: 'fas fa-receipt',
        children: [
          { to: '/expenses', label: 'Gastos', icon: 'fas fa-receipt', perm: ['api-module-expenses', 'api-module-expenses-own'], func: 'functionality_expenses' },
          { to: '/expenses/summary', label: 'Reporte', icon: 'fas fa-chart-pie', perm: ['expenses-report', 'expenses-report-own'], func: 'functionality_expenses' },
          { to: '/expense-categories', label: 'Categorías', icon: 'fas fa-tags', perm: 'api-module-expenses', func: 'functionality_expenses' },
        ],
      },
      // Mesas: configuración (nombre, capacidad), estado de ocupación y códigos QR para el POS.
      // `table-list` deja ver; crear/editar/liberar exigen además table-create / table-update.
      // Requiere la funcionalidad de mesas activa en la compañía.
      { to: '/tables', label: 'Mesas', icon: 'fas fa-chair', perm: 'table-list', func: 'functionality_tables' },
      // Turnos de caja: apertura con base, movimientos automáticos (ventas y gastos) y cierre
      // con arqueo. Abrir (/shifts/open), el detalle (/shifts/:shiftId) y el cierre paso a paso
      // (/shifts/:shiftId/close) reusan el permiso del listado. `api-module-shifts-own` es el
      // acceso de cajero: abre/cierra y ve SOLO sus turnos (el backend aplica el filtro). El
      // turno GLOBAL solo lo abre/cierra `shift-global-admin` (gatea la opción en la UI, el
      // backend lo exige) — `api-module-shifts` da visibilidad de todos, no gestión del global.
      // Requiere además la funcionalidad de turnos activa en la compañía.
      { to: '/shifts', label: 'Turnos', icon: 'fas fa-cash-register', perm: ['api-module-shifts', 'api-module-shifts-own'], func: 'functionality_shifts' },
    ],
  },
  {
    // Configuración de la compañía: los ajustes generales en un desplegable y todo lo de accesos
    // (usuarios de la compañía, catálogo de roles y catálogo de permisos) en otro.
    section: 'Configuración',
    items: [
      {
        label: 'Configuraciones', icon: 'fas fa-gear',
        children: [
          { to: '/stores', label: 'Tiendas', icon: 'fas fa-store', perm: 'api-module-stores' },
          { to: '/admin/product-categories', label: 'Categorías globales', icon: 'fas fa-tags', perm: 'item-category-master' },
          // Alta de compañías nuevas y activar/inactivar cualquiera: permiso de PLATAFORMA,
          // solo super-admin (igual que item-category-master).
          { to: '/admin/companies', label: 'Compañías', icon: 'fas fa-building', perm: 'company-master' },
          // Soporte: fallos del POS al sincronizar órdenes; el detalle (/sync-failures/:reportId) reusa este permiso.
          { to: '/sync-failures', label: 'Fallos de órdenes', icon: 'fas fa-triangle-exclamation', perm: 'order-sync-failure-admin' },
        ],
      },
      // Accesos: el listado administra a los usuarios de la compañía (y les asigna roles); Roles y
      // Permisos administran el catálogo de la PLATAFORMA (compartido por todas las compañías).
      {
        label: 'Usuarios', icon: 'fas fa-user',
        children: [
          { to: '/users', label: 'Listado', icon: 'fas fa-list', perm: 'user-administrator' },
          { to: '/roles', label: 'Roles', icon: 'fas fa-user-shield', perm: 'role-list' },
          { to: '/permissions', label: 'Permisos', icon: 'fas fa-key', perm: 'permission-list' },
        ],
      },
    ],
  },
];

// Rutas gateadas que NO aparecen en el menú lateral: se llega a ellas desde otra pantalla.
// Declaran su permiso aquí para que `canAccess` (y por tanto `RequirePermission`) las autorice.
export const HIDDEN_MODULES = [
  // Categorías de producto: se abren desde el menú de acciones del listado de productos.
  { to: '/product-categories', label: 'Categorías de producto', icon: 'fas fa-tags', perm: 'api-module-products' },
];

// Lista plana de módulos en orden (Inicio primero, luego los gateados por grupo, y al final las
// rutas ocultas — nunca deben ganar como landing). Los grupos desplegables (`children`) se
// aplanan a sus rutas reales para gatear rutas y elegir landing.
const flattenItems = (items) => items.flatMap((m) => (m.children ? m.children : [m]));
export const MODULES = [HOME_ITEM, ...MODULE_GROUPS.flatMap((g) => flattenItems(g.items)), ...HIDDEN_MODULES];

// Mapa ruta → permiso requerido (undefined si la ruta no declara permiso).
export const ROUTE_PERMISSION = Object.fromEntries(MODULES.map((m) => [m.to, m.perm]));

// Mapa ruta → funcionalidad de compañía requerida (solo rutas que declaran `func`).
export const ROUTE_FUNCTIONALITY = Object.fromEntries(
  MODULES.filter((m) => m.func).map((m) => [m.to, m.func])
);

/**
 * ¿Puede el usuario acceder a esta ruta, dados sus permisos y las funcionalidades activas de
 * la compañía? `activeFunctionalities` es la lista de nombres activos; `null` significa "aún
 * no cargadas" y omite ese chequeo (los guards de ruta esperan con `ready` antes de decidir).
 * El menú, en cambio, pasa `[]` mientras cargan: prefiere no mostrar un módulo a mostrarlo y
 * quitarlo al resolverse.
 */
export function canAccess(path, permissions = [], activeFunctionalities = null) {
  const required = ROUTE_PERMISSION[path];
  if (required === ALWAYS) return true;
  if (!required) return false; // ruta sin permiso declarado → oculta (whitelist estricta)
  // `perm` puede ser un string o una lista de alternativas (basta tener una).
  const hasPerm = [].concat(required).some((p) => permissions.includes(p));
  if (!hasPerm) return false;
  const func = ROUTE_FUNCTIONALITY[path];
  if (!func || activeFunctionalities === null) return true;
  return activeFunctionalities.includes(func);
}

/** Primer módulo accesible (en orden de menú) para usar como landing; null si ninguno. */
export function firstAccessible(permissions = [], activeFunctionalities = null) {
  return MODULES.find((m) => canAccess(m.to, permissions, activeFunctionalities))?.to ?? null;
}

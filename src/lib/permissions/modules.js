// Control de acceso por módulo — fuente única de verdad.
//
// Cada módulo (ruta del panel) declara el permiso del backend que lo habilita. El Sidebar y las
// rutas de App.jsx se gatean a partir de aquí, así no se duplica el mapeo.
//
// POLÍTICA: whitelist estricta. Un módulo SOLO se muestra si el usuario tiene su permiso.
//   - `perm: '<permiso>'`  → visible si el usuario tiene ese permiso.
//   - `perm: ALWAYS`       → siempre visible (sin requerir permiso).
//   - sin `perm`           → OCULTO por defecto (hasta asignarle un permiso aquí).
//
// Para habilitar un módulo nuevo: añádelo a su grupo con el `perm` que lo controla.

// Sentinela para módulos siempre visibles (no requieren permiso).
export const ALWAYS = '*';

// Inicio (Dashboard): siempre visible, no requiere permiso. Se renderiza fuera de los grupos.
export const HOME_ITEM = { to: '/', label: 'Inicio', icon: 'fas fa-house', end: true, perm: ALWAYS };

// Punto de venta: app externa (no es una ruta del panel). Abre pos.piddet.com en otra pestaña.
// Se renderiza fuera de los grupos, como enlace externo, siempre visible.
export const POS_ITEM = { href: 'https://pos.piddet.com', label: 'Punto de venta', icon: 'fas fa-cash-register' };

// Grupos del menú lateral, en orden de aparición.
export const MODULE_GROUPS = [
  {
    section: 'Oferta',
    items: [
      // Grupo desplegable: el padre solo expande/colapsa; las rutas reales viven en `children`.
      // Productos cubre items, sus categorías y sus opciones (las opciones se editan dentro del
      // detalle de cada producto, /products/:itemId).
      {
        label: 'Productos', icon: 'fas fa-burger',
        children: [
          { to: '/products', label: 'Listado', icon: 'fas fa-list', perm: 'api-module-products' },
          { to: '/product-categories', label: 'Categorías', icon: 'fas fa-tags', perm: 'api-module-products' },
        ],
      },
      // Las categorías de menú ahora se administran dentro del detalle de cada menú (/menus/:menuId),
      // así que el módulo es una entrada plana, sin submenú de "Categorías".
      { to: '/menus', label: 'Menús', icon: 'fas fa-book-open', perm: 'api-module-menus' },
    ],
  },
  {
    section: 'Operación',
    items: [
      { to: '/tables', label: 'Mesas', icon: 'fas fa-chair', badge: 4 }, // sin permiso aún → oculto
      { to: '/roles', label: 'Roles', icon: 'fas fa-user-shield' }, // sin permiso aún → oculto
    ],
  },
  {
    // Configuración de la compañía agrupada en un único menú desplegable. Incluye tiendas,
    // usuarios y el catálogo global de categorías (taxonomía "elite" común a todas las
    // compañías, gateado por item-category-master).
    section: 'Configuración',
    items: [
      {
        label: 'Configuraciones', icon: 'fas fa-gear',
        children: [
          { to: '/stores', label: 'Tiendas', icon: 'fas fa-store', perm: 'api-module-stores' },
          { to: '/users', label: 'Usuarios', icon: 'fas fa-user', perm: 'user-administrator' },
          { to: '/admin/product-categories', label: 'Categorías globales', icon: 'fas fa-tags', perm: 'item-category-master' },
        ],
      },
    ],
  },
];

// Lista plana de módulos en orden (Inicio primero, luego los gateados por grupo). Los grupos
// desplegables (`children`) se aplanan a sus rutas reales para gatear rutas y elegir landing.
const flattenItems = (items) => items.flatMap((m) => (m.children ? m.children : [m]));
export const MODULES = [HOME_ITEM, ...MODULE_GROUPS.flatMap((g) => flattenItems(g.items))];

// Mapa ruta → permiso requerido (undefined si la ruta no declara permiso).
export const ROUTE_PERMISSION = Object.fromEntries(MODULES.map((m) => [m.to, m.perm]));

/** ¿Puede el usuario acceder a esta ruta, dados sus permisos? */
export function canAccess(path, permissions = []) {
  const required = ROUTE_PERMISSION[path];
  if (required === ALWAYS) return true;
  if (!required) return false; // ruta sin permiso declarado → oculta (whitelist estricta)
  return permissions.includes(required);
}

/** Primer módulo accesible (en orden de menú) para usar como landing; null si ninguno. */
export function firstAccessible(permissions = []) {
  return MODULES.find((m) => canAccess(m.to, permissions))?.to ?? null;
}

// Datos de ejemplo (mock). Se usan cuando VITE_API_URL está vacío,
// para que el panel funcione sin backend. Replican la forma que debería
// devolver la API real de Piddet.

import { slugifyUsername } from '../lib/slug.js';
import { roleLabel } from '../lib/roleLabels.js';

export const mockStats = [
  { label: 'Pedidos hoy', value: '128', delta: '+3.48%', up: true },
  { label: 'Ventas', value: '$1.24M', delta: '+12%', up: true },
  { label: 'Ticket promedio', value: '$41k', delta: '+2.1%', up: true },
  { label: 'Cancelados', value: '4', delta: '-1.1%', up: false },
];

export const mockOrders = [
  { id: '#1042', cliente: 'María López', tienda: 'La Cevichería', total: '$54.000', estado: 'En cocina' },
  { id: '#1041', cliente: 'Carlos Mejía', tienda: 'Pizza Nostra', total: '$38.500', estado: 'Listo' },
  { id: '#1040', cliente: 'Ana Ruiz', tienda: 'Burguer Lab', total: '$22.000', estado: 'Entregado' },
  { id: '#1039', cliente: 'Jorge Díaz', tienda: 'La Cevichería', total: '$71.200', estado: 'Cancelado' },
];

export const mockStores = [
  { id: 1, name: 'La Cevichería', open: true, pedidos: 18 },
  { id: 2, name: 'Pizza Nostra', open: true, pedidos: 11 },
  { id: 3, name: 'Burguer Lab', open: false, pedidos: 0 },
];

// ── Módulo de productos (items) — datos en memoria; las mutaciones persisten en la sesión ──────
// Tipos de ítem: GLOBALES del sistema (no por compañía). Solo selector en el front.
export const mockItemTypes = [
  { id: 1, name: 'Comida', status: 1 },
  { id: 2, name: 'Bebida', status: 1 },
];

// Familias de impuestos de la compañía (solo lectura). `name` ya formateado como lo entrega el backend.
export const mockTaxFamilies = [
  { id: 1, name: 'IVA (19.0%)', value: 19 },
  { id: 2, name: 'Exento (0.0%)', value: 0 },
  { id: 3, name: 'Impoconsumo (8.0%)', value: 8 },
];

// Funcionalidades de la compañía activa (flag is_active por compañía). Con impuestos activos.
export const mockFunctionalities = [
  {
    id: 1,
    name: 'functionality_taxes',
    label: 'Impuestos',
    icon: 'fas fa-percent',
    description: 'Permite asignar impuestos a los productos y calcularlos en las facturas.',
    is_active: true,
  },
  {
    id: 2,
    name: 'functionality_tables',
    label: 'Mesas',
    icon: 'fas fa-chair',
    description: 'Habilita la administración de mesas: asignarlas a las órdenes y ver su ocupación en el POS.',
    is_active: false,
  },
  {
    id: 3,
    name: 'functionality_logistic',
    label: 'Logística de cocina',
    icon: 'fas fa-utensils',
    description: 'Activa el seguimiento de preparación en cocina: estados de la orden y tiempos de atención.',
    is_active: false,
  },
  {
    id: 4,
    name: 'functionality_reservations',
    label: 'Reservas y hospedaje',
    icon: 'fas fa-bed',
    description: 'Habilita reservas de unidades rentables, check-in, cuenta del huésped y checkout.',
    is_active: true,
  },
  {
    id: 5,
    name: 'functionality_menu_item_price',
    label: 'Precio por menú',
    icon: 'fas fa-tags',
    description: 'Permite asignar a un producto un precio propio dentro de cada menú, distinto de su precio base.',
    is_active: true,
  },
  {
    id: 6,
    name: 'functionality_gym',
    label: 'Gimnasio',
    icon: 'fas fa-dumbbell',
    description: 'Administración de gimnasio: miembros, planes, suscripciones y medidas físicas.',
    is_active: true,
  },
];

// Categorías de producto: scopeadas por compañía y por tipo de ítem (item_type_id). `position` ordena dentro del tipo.
export const mockItemCategories = [
  { id: 1, item_type_id: 1, name: 'Hamburguesas', description: 'A la parrilla', image: null, position: 0, status: 1 },
  { id: 2, item_type_id: 1, name: 'Pizzas', description: '', image: null, position: 1, status: 1 },
  { id: 3, item_type_id: 1, name: 'Entradas', description: '', image: null, position: 2, status: 1 },
  { id: 4, item_type_id: 1, name: 'Postres', description: '', image: null, position: 3, status: 1 },
  { id: 5, item_type_id: 2, name: 'Gaseosas', description: '', image: null, position: 0, status: 1 },
  { id: 6, item_type_id: 2, name: 'Jugos naturales', description: '', image: null, position: 1, status: 1 },
];

// Productos de la compañía (status: 1 activo, 2 borrador, 3 eliminado).
export const mockItems = [
  { id: 1, name: 'Hamburguesa Clásica', code: 'HC-001', value: 18500, file: null, item_type_id: 1, item_category_id: 1, item_status_id: 1, tax_family_id: 1, description: 'Carne 150g, queso y vegetales', position: 0 },
  { id: 2, name: 'Hamburguesa Doble', code: 'HD-002', value: 26000, file: null, item_type_id: 1, item_category_id: 1, item_status_id: 1, tax_family_id: 1, description: 'Doble carne y doble queso', position: 1 },
  { id: 3, name: 'Pizza Margarita', code: 'PM-003', value: 32000, file: null, item_type_id: 1, item_category_id: 2, item_status_id: 1, tax_family_id: 1, description: 'Salsa de tomate, mozzarella y albahaca', position: 2 },
  { id: 4, name: 'Ceviche mixto', code: 'CM-004', value: 28000, file: null, item_type_id: 1, item_category_id: 3, item_status_id: 2, tax_family_id: 3, description: 'Pescado y mariscos', position: 3 },
  { id: 5, name: 'Brownie con helado', code: 'BH-005', value: 12000, file: null, item_type_id: 1, item_category_id: 4, item_status_id: 1, tax_family_id: 1, description: 'Brownie tibio con helado de vainilla', position: 4 },
  { id: 6, name: 'Gaseosa 400ml', code: 'GA-006', value: 5000, file: null, item_type_id: 2, item_category_id: 5, item_status_id: 1, tax_family_id: 1, description: 'Bebida gaseosa fría', position: 5 },
];

// Grupos de opciones (anidados por ítem). `multiple` = selección múltiple; reglas min/max.
export const mockOptionGroups = [
  { id: 1, item_id: 1, name: 'Punto de la carne', type: 'OPTION', description: '', min: 1, max: 1, multiple: false, status: 1, position: 0 },
  { id: 2, item_id: 1, name: 'Adiciones', type: 'OPTION', description: 'Extras con costo', min: 0, max: 3, multiple: true, status: 1, position: 1 },
  { id: 3, item_id: 3, name: 'Tamaño', type: 'OPTION', description: '', min: 1, max: 1, multiple: false, status: 1, position: 0 },
];

// Opciones de cada grupo. `value` = precio extra (0 = sin costo).
export const mockItemOptions = [
  { id: 1, item_id: 1, group_id: 1, name: 'Término medio', description: '', value: 0, status: 1, position: 0 },
  { id: 2, item_id: 1, group_id: 1, name: 'Bien cocida', description: '', value: 0, status: 1, position: 1 },
  { id: 3, item_id: 1, group_id: 2, name: 'Tocineta', description: '', value: 3000, status: 1, position: 0 },
  { id: 4, item_id: 1, group_id: 2, name: 'Queso extra', description: '', value: 2500, status: 1, position: 1 },
  { id: 5, item_id: 1, group_id: 2, name: 'Huevo', description: '', value: 2000, status: 1, position: 2 },
  { id: 6, item_id: 3, group_id: 3, name: 'Personal', description: '', value: 0, status: 1, position: 0 },
  { id: 7, item_id: 3, group_id: 3, name: 'Familiar', description: '', value: 10000, status: 1, position: 1 },
];

// Mesas de la compañía activa, con el mismo shape del backend.
export const mockTables = [
  { id: 1, name: 'Mesa 1', description: 'Ventana', capacity: 2, status: 'available', is_active: true },
  { id: 2, name: 'Mesa 2', description: '', capacity: 4, status: 'occupied', is_active: true },
  { id: 3, name: 'Mesa 3', description: 'Terraza', capacity: 4, status: 'occupied', is_active: true },
  { id: 4, name: 'Mesa 4', description: '', capacity: 2, status: 'available', is_active: true },
  { id: 5, name: 'Mesa 5', description: 'Salón principal', capacity: 6, status: 'available', is_active: true },
  { id: 6, name: 'Mesa 6', description: '', capacity: 4, status: 'available', is_active: false },
  { id: 7, name: 'Barra 1', description: 'Barra', capacity: 2, status: 'occupied', is_active: true },
  { id: 8, name: 'Salón privado', description: 'Eventos', capacity: 8, status: 'available', is_active: true },
];

export const mockNotifications = [
  { type: 'pedido', title: 'Nuevo pedido #1043', sub: 'La Cevichería · $34.000', time: 'hace 2 min', unread: true },
  { type: 'mesa', title: 'Mesa 5 pidió la cuenta', sub: 'Salón principal', time: 'hace 8 min', unread: true },
  { type: 'alerta', title: 'Limonada de coco agotada', sub: 'Inventario en 0', time: 'hace 25 min', unread: false },
  { type: 'tienda', title: 'Burguer Lab cerró', sub: 'Fuera de horario', time: 'hace 1 h', unread: false },
];

export const mockStoresDetail = [
  { id: 1, name: 'La Cevichería', open: true, dir: 'Cra. 43 #12-30', tel: '320 111 2233', pedidos: 18 },
  { id: 2, name: 'Pizza Nostra', open: true, dir: 'Cl. 10 #5-40', tel: '301 444 5566', pedidos: 11 },
  { id: 3, name: 'Burguer Lab', open: false, dir: 'Av. Las Vegas #80-21', tel: '315 777 8899', pedidos: 0 },
  { id: 4, name: 'Sushi Express', open: true, dir: 'Cra. 70 #1-15', tel: '300 222 3344', pedidos: 6 },
];

// Catálogos de tiendas (espejo de piddet_stores). days: 0=Domingo … 6=Sábado, 7=Festivos.
export const mockStoreStatuses = [
  { id: 1, name: 'Activo' },
  { id: 2, name: 'Inactiva' },
  { id: 3, name: 'Cierre Temporal' },
];
export const mockStoreTypes = [
  { id: 1, name: 'Restaurantes' },
  { id: 2, name: 'Farmacias' },
  { id: 3, name: 'Supermercados' },
];
export const mockStoreDays = [
  { id: 0, name: 'Domingo' },
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 7, name: 'Festivos' },
];

// Tiendas company-scoped (CRUD real). `schedules`: rangos por día (day_id + start_time/end_time).
const dayRange = (start, end, days) =>
  days.map((day_id) => ({ day_id, start_time: start, end_time: end }));

export const mockStoresList = [
  {
    id: 1, store_type_id: 1, store_status_id: 1, name: 'La Cevichería', address: 'Cra. 43 #12-30, Medellín',
    phone_code: '57', phone_number: '3201112233', latitude: 6.208, longitude: -75.567,
    schedules: dayRange('11:00', '22:00', [1, 2, 3, 4, 5, 6, 0]),
  },
  {
    id: 2, store_type_id: 1, store_status_id: 1, name: 'Pizza Nostra', address: 'Cl. 10 #5-40, Medellín',
    phone_code: '57', phone_number: '3014445566', latitude: 6.211, longitude: -75.571,
    schedules: [
      ...dayRange('12:00', '15:00', [1, 2, 3, 4, 5]),
      ...dayRange('18:00', '23:00', [1, 2, 3, 4, 5]),
      ...dayRange('12:00', '23:00', [6]),
    ],
  },
  {
    id: 3, store_type_id: 3, store_status_id: 2, name: 'Burguer Lab', address: 'Av. Las Vegas #80-21, Envigado',
    phone_code: '57', phone_number: '3157778899', latitude: 6.171, longitude: -75.591,
    schedules: [],
  },
];

const storeStatusObj = (id) => mockStoreStatuses.find((x) => x.id === id) || null;

// Catálogo demo de roles de la plataforma (fuente única: de aquí salen también los roles
// asignables del módulo de usuarios). `system` marca los que el backend protege.
export const mockRoles = [
  { id: 1, name: 'super-admin', label: 'Superadministrador', description: 'Acceso total a la plataforma', system: true, permissions: [] },
  { id: 2, name: 'client', label: 'Cliente', description: 'Cliente final de la app', system: true, permissions: [] },
  { id: 3, name: 'employee', label: 'Empleado', description: 'Empleado sin módulos asignados', system: true, permissions: [] },
  { id: 4, name: 'admin', label: 'Administrador', description: 'Acceso total a la compañía', permissions: ['user-administrator', 'role-list', 'role-create', 'role-update', 'role-delete', 'role-assign', 'permission-list', 'permission-update', 'api-module-products', 'api-module-menus', 'api-module-orders', 'order-cancel', 'api-module-expenses', 'expense-annul', 'table-list', 'table-create', 'table-update'] },
  { id: 5, name: 'cashier', label: 'Cajero', description: 'Gestión de pagos y caja', permissions: ['api-module-orders', 'api-module-shifts-own'] },
  { id: 6, name: 'waiter', label: 'Mesero', description: 'Toma de pedidos en sala', permissions: ['table-list'] },
  { id: 7, name: 'cook', label: 'Cocinero', description: 'Operación de cocina', permissions: [] },
];

// Roles asignables a un usuario de la compañía. Los del sistema solo se ofrecen a quien tiene
// `admin-general` (en la demo, el usuario lo tiene). Se calcula en cada llamada para que los roles
// creados durante la demo aparezcan de inmediato.
export const mockAssignableRoles = () => {
  const canSystem = mockPermissions.permissions.includes('admin-general');
  return mockRoles
    .filter((r) => canSystem || !r.system)
    .map(({ name, label, description, permissions, system }) => ({
      name, label, description, permissions, is_system: !!system,
    }));
};

// Catálogo demo de permisos asignables (is_api = true) agrupado por módulo, como lo expone el
// backend en /users/assignable-permissions.
export const mockAssignablePermissions = [
  { module_id: 1, module_name: 'Usuarios', permissions: [
    { name: 'user-administrator', description: 'Administrar los usuarios de la compañía' },
    { name: 'admin-general', description: 'Administrar los roles del sistema (super-admin, client, employee)' },
  ] },
  { module_id: 3, module_name: 'Productos y menús', permissions: [
    { name: 'api-module-products', description: 'Administrar productos y categorías' },
    { name: 'api-module-menus', description: 'Administrar menús y sus categorías' },
  ] },
  { module_id: 4, module_name: 'Órdenes', permissions: [
    { name: 'api-module-orders', description: 'Consultar las facturas de toda la compañía' },
    { name: 'api-module-orders-own', description: 'Consultar solo las facturas que registró el usuario' },
    { name: 'sales-report', description: 'Ver el reporte de ventas de toda la compañía' },
    { name: 'sales-report-own', description: 'Ver el reporte de ventas de lo que registró el usuario' },
    { name: 'order-cancel', description: 'Cancelar facturas con motivo' },
    { name: 'order-sync-failure-admin', description: 'Administrar fallos de sincronización del POS' },
  ] },
  { module_id: 5, module_name: 'Gastos', permissions: [
    { name: 'api-module-expenses', description: 'Administrar los gastos de la compañía' },
    { name: 'api-module-expenses-own', description: 'Registrar y ver solo sus propios gastos' },
    { name: 'expenses-report', description: 'Ver el resumen de gastos de toda la compañía' },
    { name: 'expenses-report-own', description: 'Ver el resumen de los gastos que registró el usuario' },
    { name: 'expense-annul', description: 'Anular gastos' },
  ] },
  { module_id: 8, module_name: 'Turnos', permissions: [
    { name: 'api-module-shifts', description: 'Administrar los turnos de caja de la compañía' },
    { name: 'api-module-shifts-own', description: 'Abrir y cerrar solo sus propios turnos' },
    { name: 'shift-global-admin', description: 'Abrir y cerrar el turno global' },
  ] },
  { module_id: 6, module_name: 'Mesas', permissions: [
    { name: 'table-list', description: 'Ver las mesas del local' },
    { name: 'table-create', description: 'Crear mesas' },
    { name: 'table-update', description: 'Editar y cambiar el estado de las mesas' },
  ] },
  { module_id: 7, module_name: 'Compañía', permissions: [
    { name: 'api-module-company', description: 'Editar el perfil de la compañía' },
    { name: 'company-edit-functionalities', description: 'Administrar las funcionalidades de la compañía' },
  ] },
];

// Catálogo demo COMPLETO de permisos (el que administra la pantalla /permissions): a los
// asignables les añade id y el flag is_api, y suma el módulo de administración de accesos con
// algunos permisos ocultos al panel (is_api = false) para poder probar el interruptor.
export const mockPermissionCatalog = (() => {
  let seq = 0;
  const withIds = (moduleId, permissions) => permissions.map(([name, description, isApi = true]) => ({
    id: ++seq, name, description, module_id: moduleId, is_api: isApi,
  }));

  const accessModule = {
    module_id: 2,
    module_name: 'Permisos',
    permissions: withIds(2, [
      ['role-list', 'Ver el catálogo de roles de la plataforma.'],
      ['role-create', 'Crear roles nuevos en el catálogo.'],
      ['role-update', 'Editar el nombre y la descripción de un rol.'],
      ['role-delete', 'Eliminar un rol del catálogo (los del sistema exigen además admin-general).'],
      ['role-assign', 'Cambiar los permisos que otorga un rol (reemplaza su lista de permisos).'],
      ['permission-list', 'Ver el catálogo de permisos agrupado por módulo.'],
      ['permission-update', 'Cambiar la visibilidad de un permiso en el panel (is_api).'],
      ['permission-create', '[no se usa] Creación de permisos; el catálogo se administra por seeders.', false],
      ['permission-delete', '[no se usa] Eliminación de permisos; el catálogo se administra por seeders.', false],
    ]),
  };

  const rest = mockAssignablePermissions.map((mod) => ({
    module_id: mod.module_id,
    module_name: mod.module_name,
    permissions: withIds(mod.module_id, mod.permissions.map((p) => [p.name, p.description])),
  }));

  return [...rest, accessModule].sort((a, b) => a.module_id - b.module_id);
})();

// Usuarios vinculados a la compañía activa (forma del backend: datos básicos + roles + permisos
// directos, adicionales a los heredados por rol).
export const mockUsers = [
  { id: 1, name: 'Gerardo Cruz', first_name: 'Gerardo', last_name: 'Cruz', phone_code: '57', phone_number: '3001234567', email: 'gerardo@piddet.com', status: true, roles: [{ name: 'admin', label: 'Administrador' }], direct_permissions: [], user_type_id: 2 },
  { id: 2, name: 'María López', first_name: 'María', last_name: 'López', phone_code: '57', phone_number: '3112223344', email: 'maria@piddet.com', status: true, roles: [{ name: 'cashier', label: 'Cajero' }], direct_permissions: ['order-cancel'], user_type_id: 2 },
  { id: 3, name: 'Carlos Mejía', first_name: 'Carlos', last_name: 'Mejía', phone_code: '57', phone_number: '3205556677', email: null, status: true, roles: [{ name: 'waiter', label: 'Mesero' }], direct_permissions: [], user_type_id: 2 },
  { id: 4, name: 'Ana Ruiz', first_name: 'Ana', last_name: 'Ruiz', phone_code: '57', phone_number: '3158889900', email: null, status: false, roles: [{ name: 'cook', label: 'Cocinero' }], direct_permissions: [], user_type_id: 2 },
  { id: 5, name: 'Jorge Díaz', first_name: 'Jorge', last_name: 'Díaz', phone_code: '57', phone_number: '3014441122', email: null, status: true, roles: [{ name: 'waiter', label: 'Mesero' }], direct_permissions: ['api-module-expenses-own'], user_type_id: 1 },
];

export const mockUser = { name: 'Gerardo Cruz', role: 'Administrador' };

// ── Módulo de menús (datos en memoria; las mutaciones persisten durante la sesión) ──────
// Replican la forma del backend: los menús son de la compañía activa y cada categoría pertenece a
// un menú concreto (`menu_id`); su `position` define el orden de sus productos dentro de ese menú.
// `status` es el borrado lógico del menú (1 vigente, 0 eliminado); `is_active` es el interruptor
// que la compañía enciende/apaga para publicarlo o no en la portada pública y su carta.
export const mockMenus = [
  { id: 1, name: 'Carta principal', username: 'carta_principal', description: 'Disponible todo el día', file: null, position: 0, status: 1, is_active: true },
  { id: 2, name: 'Desayunos', username: 'desayunos', description: 'Hasta las 11 a. m.', file: null, position: 1, status: 0, is_active: true },
  { id: 3, name: 'Bebidas', username: 'bebidas', description: 'Carta de bebidas y cócteles', file: null, position: 2, status: 1, is_active: false },
  { id: 4, name: 'Menú Secundary', username: 'menu_secundary', description: 'Carta de fin de semana', file: null, position: 3, status: 1, is_active: true },
];

// Categorías de menú: cada una pertenece a UN menú (`menu_id`). Su `position` define el orden con
// el que se agrupan sus productos dentro de ese menú. Distintos menús tienen sus propias categorías
// (aunque coincida el nombre, p. ej. "Entradas" del menú 1 ≠ "Entradas" del menú 4).
export const mockMenuCategories = [
  // Carta principal (menú 1)
  { id: 1, menu_id: 1, name: 'Entradas', description: 'Para empezar', file: null, position: 0, status: 1 },
  { id: 2, menu_id: 1, name: 'Platos fuertes', description: '', file: null, position: 1, status: 1 },
  { id: 3, menu_id: 1, name: 'Postres', description: '', file: null, position: 2, status: 1 },
  { id: 4, menu_id: 1, name: 'Bebidas', description: '', file: null, position: 3, status: 1 }, // sin productos (demo de categoría vacía)
  // Menú Secundary (menú 4)
  { id: 5, menu_id: 4, name: 'Entradas', description: '', file: null, position: 0, status: 1 },
  { id: 6, menu_id: 4, name: 'Hamburguesas', description: '', file: null, position: 1, status: 1 },
  { id: 7, menu_id: 4, name: 'Carnes', description: '', file: null, position: 2, status: 1 },
  { id: 8, menu_id: 4, name: 'Pizzas', description: '', file: null, position: 3, status: 1 },
  { id: 9, menu_id: 4, name: 'Bebidas', description: '', file: null, position: 4, status: 1 },
];

// Catálogo de productos de la compañía (alimenta el buscador "agregar al menú").
// `image` es el nombre crudo del archivo (como `items.image` en el backend); la URL completa se
// resuelve con `resolveItemImage`. `description` viene del item (fuente con la info completa).
const mockMenuProducts = [
  { id: 101, name: 'Hamburguesa Clásica', sku: 'HC-001', image: 'hamburguesa-clasica.jpg', value: 18000, category_id: 5, description: 'Carne de res 150g, queso cheddar, lechuga, tomate y salsa de la casa.' },
  { id: 102, name: 'Pizza Margarita', sku: 'PM-002', image: 'pizza-margarita.jpg', value: 32000, category_id: 7, description: 'Salsa de tomate San Marzano, mozzarella fresca y albahaca.' },
  { id: 103, name: 'Limonada de coco', sku: 'LC-003', image: 'limonada-coco.jpg', value: 9000, category_id: 4, description: 'Limonada cremosa de coco bien fría, endulzada al punto.' },
  { id: 104, name: 'Ceviche mixto', sku: 'CM-004', image: 'ceviche-mixto.jpg', value: 28000, category_id: 1, description: 'Pescado blanco y mariscos en leche de tigre, con cebolla morada y cilantro.' },
  { id: 105, name: 'Brownie con helado', sku: 'BH-005', image: 'brownie-helado.jpg', value: 12000, category_id: 3, description: 'Brownie tibio de chocolate con bola de helado de vainilla.' },
  { id: 106, name: 'Papas a la francesa', sku: 'PF-006', image: 'papas-francesa.jpg', value: 8500, category_id: 1, description: 'Porción generosa de papas crocantes con sal de mar.' },
  { id: 107, name: 'Pollo apanado', sku: 'PA-007', image: 'pollo-apanado.jpg', value: 21000, category_id: 2, description: 'Pechuga de pollo apanada y crujiente, acompañada de papas.' },
  { id: 108, name: 'Cerveza artesanal', sku: 'CA-008', image: 'cerveza-artesanal.jpg', value: 11000, category_id: 4, description: 'Cerveza artesanal local de barril, estilo rotativo.' },
  { id: 109, name: 'Aros de cebolla', sku: 'AC-009', image: 'aros-cebolla.jpg', value: 9500, category_id: 1, description: 'Aros de cebolla rebozados, dorados y crujientes.' },
  { id: 110, name: 'Nachos con queso', sku: 'NQ-010', image: 'nachos-queso.jpg', value: 14000, category_id: 1, description: 'Totopos con queso fundido, pico de gallo y jalapeños.' },
  { id: 111, name: 'Alitas BBQ', sku: 'AB-011', image: 'alitas-bbq.jpg', value: 19000, category_id: 1, description: 'Alitas bañadas en salsa BBQ ahumada, ocho unidades.' },
  { id: 112, name: 'Hamburguesa Doble', sku: 'HD-012', image: 'hamburguesa-doble.jpg', value: 26000, category_id: 5, description: 'Doble carne y doble queso cheddar con cebolla caramelizada.' },
  { id: 113, name: 'Hamburguesa BBQ', sku: 'HB-013', image: 'hamburguesa-bbq.jpg', value: 24000, category_id: 5, description: 'Carne de res, tocineta, aros de cebolla y salsa BBQ.' },
  { id: 114, name: 'Lomo de res', sku: 'LR-014', image: 'lomo-res.jpg', value: 35000, category_id: 6, description: 'Lomo de res a la parrilla término al gusto, con guarnición.' },
  { id: 115, name: 'Churrasco', sku: 'CH-015', image: 'churrasco.jpg', value: 38000, category_id: 6, description: 'Churrasco de res con chimichurri, papas y ensalada.' },
  { id: 116, name: 'Pizza Pepperoni', sku: 'PP-016', image: 'pizza-pepperoni.jpg', value: 34000, category_id: 7, description: 'Mozzarella y abundante pepperoni sobre masa artesanal.' },
  { id: 117, name: 'Pizza Hawaiana', sku: 'PH-017', image: 'pizza-hawaiana.jpg', value: 33000, category_id: 7, description: 'Jamón, piña y mozzarella sobre salsa de tomate.' },
  { id: 118, name: 'Pizza Cuatro Quesos', sku: 'PC-018', image: 'pizza-cuatro-quesos.jpg', value: 36000, category_id: 7, description: 'Mozzarella, parmesano, azul y de cabra.' },
  { id: 119, name: 'Gaseosa', sku: 'GA-019', image: 'gaseosa.jpg', value: 5000, category_id: 4, description: 'Gaseosa en lata 330ml, sabor a elección.' },
  { id: 120, name: 'Jugo natural', sku: 'JN-020', image: 'jugo-natural.jpg', value: 8000, category_id: 4, description: 'Jugo natural del día en agua o leche.' },
  { id: 121, name: 'Agua', sku: 'AG-021', image: 'agua.jpg', value: 4000, category_id: 4, description: 'Agua mineral con o sin gas, 500ml.' },
  { id: 122, name: 'Café', sku: 'CF-022', image: 'cafe.jpg', value: 5500, category_id: 4, description: 'Café de origen, preparado al momento.' },
];

// Ítems asignados a cada menú (price=null → usa el valor del producto).
export const mockMenuItems = [
  // Carta principal
  { id: 1, menu_id: 1, menu_category_id: 1, item_id: 104, position: 0, status: 1, price: null },
  { id: 2, menu_id: 1, menu_category_id: 1, item_id: 106, position: 1, status: 1, price: null },
  { id: 3, menu_id: 1, menu_category_id: 2, item_id: 101, position: 0, status: 1, price: null },
  { id: 4, menu_id: 1, menu_category_id: 2, item_id: 102, position: 1, status: 1, price: 30000 },
  { id: 5, menu_id: 1, menu_category_id: 3, item_id: 105, position: 0, status: 1, price: null },
  // Menú Secundary — Entradas (4)
  { id: 6, menu_id: 4, menu_category_id: 5, item_id: 106, position: 0, status: 1, price: null },
  { id: 7, menu_id: 4, menu_category_id: 5, item_id: 109, position: 1, status: 1, price: null },
  { id: 8, menu_id: 4, menu_category_id: 5, item_id: 110, position: 2, status: 1, price: null },
  { id: 9, menu_id: 4, menu_category_id: 5, item_id: 111, position: 3, status: 1, price: null },
  // Menú Secundary — Hamburguesas (3)
  { id: 10, menu_id: 4, menu_category_id: 6, item_id: 101, position: 0, status: 1, price: null },
  { id: 11, menu_id: 4, menu_category_id: 6, item_id: 112, position: 1, status: 1, price: null },
  { id: 12, menu_id: 4, menu_category_id: 6, item_id: 113, position: 2, status: 1, price: null },
  // Menú Secundary — Carnes (2)
  { id: 13, menu_id: 4, menu_category_id: 7, item_id: 114, position: 0, status: 1, price: null },
  { id: 14, menu_id: 4, menu_category_id: 7, item_id: 115, position: 1, status: 1, price: null },
  // Menú Secundary — Pizzas (4)
  { id: 15, menu_id: 4, menu_category_id: 8, item_id: 102, position: 0, status: 1, price: null },
  { id: 16, menu_id: 4, menu_category_id: 8, item_id: 116, position: 1, status: 1, price: null },
  { id: 17, menu_id: 4, menu_category_id: 8, item_id: 117, position: 2, status: 1, price: null },
  { id: 18, menu_id: 4, menu_category_id: 8, item_id: 118, position: 3, status: 1, price: null },
  // Menú Secundary — Bebidas (6)
  { id: 19, menu_id: 4, menu_category_id: 9, item_id: 103, position: 0, status: 1, price: null },
  { id: 20, menu_id: 4, menu_category_id: 9, item_id: 108, position: 1, status: 1, price: null },
  { id: 21, menu_id: 4, menu_category_id: 9, item_id: 119, position: 2, status: 1, price: null },
  { id: 22, menu_id: 4, menu_category_id: 9, item_id: 120, position: 3, status: 1, price: null },
  { id: 23, menu_id: 4, menu_category_id: 9, item_id: 121, position: 4, status: 1, price: null },
  { id: 24, menu_id: 4, menu_category_id: 9, item_id: 122, position: 5, status: 1, price: null },
];

// Permisos demo del usuario en la compañía activa (los is_api expuestos al front). Con estos,
// el panel muestra Productos (y sus categorías), Menús y Usuarios; el resto queda oculto.
const mockPermissions = {
  roles: ['Administrador'],
  permissions: ['user-administrator', 'admin-general', 'role-list', 'role-create', 'role-update', 'role-delete', 'role-assign', 'permission-list', 'permission-update', 'api-module-menus', 'api-module-products', 'api-module-company', 'company-edit-functionalities', 'api-module-stores', 'table-list', 'table-create', 'table-update', 'api-module-orders', 'sales-report', 'order-cancel', 'order-sync-failure-admin', 'api-module-expenses', 'expenses-report', 'expense-annul', 'api-module-shifts', 'shift-global-admin', 'api-module-reservations', 'api-module-rentable-units', 'reservation-checkout', 'reservation-cancel', 'reservation-payment-annul', 'api-module-gym', 'api-module-gym-plans', 'gym-plans-create', 'gym-plans-edit', 'gym-members-create', 'gym-members-edit'],
};

// Empresa (tenant) activa y empresas disponibles para el usuario (SaaS multi-tenant).
export const mockCompany = {
  id: 'pid-001', name: 'Grupo Sabor', username: 'grupo_sabor', legal_name: 'Grupo Sabor S.A.S', plan: 'Pro', tiendas: 4,
  identification: 'NIT 900.123.456-7',
  address: 'Cra. 43A #1-50', city: 'Medellín, Colombia', phone: '+57 300 123 4567',
  email: 'hola@gruposabor.co', website: 'www.gruposabor.co',
  brand_primary: 'forest', brand_secondary: 'gold',
  stores_count: 4, menus_count: 5, items_count: 86, users_count: 12,
};
export const mockCompanies = [
  { id: 'pid-001', name: 'Grupo Sabor', plan: 'Pro', tiendas: 4 },
  { id: 'pid-002', name: 'Cocinas del Norte', plan: 'Básico', tiendas: 2 },
  { id: 'pid-003', name: 'Antojitos S.A.', plan: 'Pro', tiendas: 7 },
];

// Tokens de agentes de IA de la compañía (el listado nunca incluye el token completo).
const mockAgentTokens = [
  { id: 1, company_id: 'pid-001', name: 'Agente de reservas', token_prefix: 'agt_9fK2dL1m', status: 1, expires_at: '2027-06-01T00:00:00', last_used_at: '2026-07-12T15:20:00', created_at: '2026-06-01T10:00:00' },
  { id: 2, company_id: 'pid-001', name: 'Integración piloto', token_prefix: 'agt_Zx81mQ4p', status: 0, expires_at: '2026-12-31T00:00:00', last_used_at: '2026-04-02T11:05:00', created_at: '2026-03-15T09:00:00' },
];

// Respuesta demo de login: imita el envoltorio del backend ya desempaquetado (solo `data`).
// expiration_at muy lejano para que el tokenManager nunca intente refrescar en modo demo.
const mockAuth = {
  auth: {
    token: 'demo-token',
    expiration_at: 4102444800, // 2100-01-01
    refresh_token: 'demo-refresh',
  },
  user: mockUser,
  company: mockCompany,
};

// Historial de sesiones demo (logins exitosos en distintos dispositivos).
const mockLoginHistory = Array.from({ length: 23 }, (_, i) => {
  const samples = [
    { platform: 'ADMIN', device: 'MacBook Pro', browser: 'Chrome', os: 'macOS', ip: '190.85.12.4' },
    { platform: 'POS', device: 'iPad', browser: 'Safari', os: 'iPadOS', ip: '181.49.7.220' },
    { platform: 'TV', device: 'Android TV', browser: 'WebView', os: 'Android', ip: '200.118.45.9' },
    { platform: 'ADMIN', device: 'Windows PC', browser: 'Edge', os: 'Windows', ip: '186.155.3.77' },
  ];
  const s = samples[i % samples.length];
  const d = new Date(Date.now() - i * 36e5 * 7); // cada ~7 horas hacia atrás
  return { id: i + 1, ...s, logged_at: d.toISOString() };
});

// Construye una respuesta paginada demo a partir de la query (?page=&per_page=).
function mockPaginate(rows, query) {
  // El backend usa `_row` (items por página); se acepta también `per_page` por compatibilidad.
  const perPage = Math.max(1, Number(query.get('_row')) || Number(query.get('per_page')) || 10);
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, Number(query.get('page')) || 1), lastPage);
  const start = (page - 1) * perPage;
  const items = rows.slice(start, start + perPage);
  return {
    items,
    pagination: {
      current_page: page,
      from: total ? start + 1 : null,
      last_page: lastPage,
      per_page: perPage,
      to: start + items.length,
      total,
    },
  };
}

// ── Helpers del módulo de menús ─────────────────────────────────────────────
const nextId = (rows) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
const priceFmt = (n) => '$' + Number(n || 0).toLocaleString('es-CO');

// Decora un ítem de menú con los datos del producto y la categoría (como hace el join del backend).
// CONTRATO BACKEND: el endpoint real `/companies/{company}/menus/{menuId}/items` debe incluir, vía
// el join con el item, `description` y la imagen resuelta (`file`/`thumbnail_file`/`standard_file`);
// el item es la fuente con la info completa. La carta (vista "Generar menú") los consume desde aquí.
function decorateMenuItem(mi) {
  const prod = mockMenuProducts.find((p) => p.id === mi.item_id) || {};
  const cat = mockMenuCategories.find((c) => c.id === mi.menu_category_id) || {};
  const effective = mi.price != null ? mi.price : prod.value;
  const img = resolveItemImage(prod);
  return {
    id: mi.id,
    menu_id: mi.menu_id,
    menu_category_id: mi.menu_category_id,
    item_id: mi.item_id,
    position: mi.position,
    status: mi.status,
    category_name: cat.name || '',
    name: prod.name || '',
    description: prod.description || '',
    file: img.file,
    thumbnail_file: img.thumbnail_file,
    standard_file: img.standard_file,
    item_value: prod.value ?? null,
    price: effective ?? null,
  };
}

// Resuelve las rutas company-scoped del módulo de menús. Devuelve `undefined` si no aplica
// (para que el enrutador siga buscando) y simula GET/POST/PUT/DELETE sobre datos en memoria.
// Arma la carta de un menú (menú + productos agrupados por categoría no vacía), forma que comparten
// el endpoint autenticado `/menus/{id}/full` y el público `/public/{company}/m/{username}`.
function buildMenuFull(menu) {
  const items = mockMenuItems
    .filter((i) => i.menu_id === menu.id && i.status === 1)
    .map(decorateMenuItem);
  const cats = mockMenuCategories.filter((c) => c.menu_id === menu.id).sort((a, b) => a.position - b.position);
  const categories = cats
    .map((c) => ({
      id: c.id,
      name: c.name,
      position: c.position,
      config: c.config || null,
      items: items.filter((i) => i.menu_category_id === c.id).sort((a, b) => a.position - b.position),
    }))
    .filter((g) => g.items.length > 0);
  return { menu, categories };
}

// Resolver de la carta pública: /public/{company}/m/{menuUsername}. Devuelve también los datos de
// marca de la compañía (el visitante no tiene sesión). En demo solo existe una compañía activa.
function resolvePublicMenuMock(path) {
  const m = path.match(/^\/public\/([^/]+)\/m\/([^/]+)$/);
  if (!m) return undefined;
  const menu = mockMenus.find((x) => x.username === m[2] && x.status === 1 && x.is_active);
  if (!menu) return null;
  return {
    ...buildMenuFull(menu),
    company: { name: mockCompany.name, username: mockCompany.username, icon: mockCompany.icon ?? null },
  };
}

// Resolver de la portada pública de la compañía: /public/{company}. Devuelve el perfil de la
// empresa (datos de marca + contacto) y sus menús públicos (activos, ordenados por posición). En
// demo solo existe una compañía activa.
function resolvePublicCompanyMock(path) {
  const m = path.match(/^\/public\/([^/]+)$/);
  if (!m) return undefined;
  const menus = mockMenus
    .filter((x) => x.status === 1 && x.is_active)
    .sort((a, b) => a.position - b.position)
    .map((x) => ({ id: x.id, name: x.name, username: x.username, description: x.description, file: x.file, position: x.position, status: x.status, is_active: x.is_active }));
  // Tiendas públicas: todas menos las inactivas (store_status_id 2). Incluye horarios y ubicación.
  const stores = mockStoresList
    .filter((st) => st.store_status_id !== 2)
    .map((st) => ({
      id: st.id, store_status_id: st.store_status_id, status: storeStatusObj(st.store_status_id),
      name: st.name, address: st.address, phone_code: st.phone_code, phone_number: st.phone_number,
      latitude: st.latitude, longitude: st.longitude,
      schedules: (st.schedules || []).map((r) => ({ day_id: r.day_id, start_time: r.start_time, end_time: r.end_time })),
    }));
  const activeUnits = mockRentableUnits.filter((u) => u.status === 1);
  return {
    company: { ...mockCompany },
    menus,
    stores,
    // Hospedaje: en demo la funcionalidad de reservas está activa, así que la portada trae la
    // vista previa (primeras 3 unidades activas + total).
    rentable_units: activeUnits.slice(0, 3).map(publicUnitCard),
    rentable_units_count: activeUnits.length,
  };
}

// ── Hospedaje público (sin sesión): /public/{company}/rentable-units[/{unitId}] ──
const publicUnitCard = (u) => ({
  id: u.id, type_name: u.type_name, name: u.name, description: u.description,
  capacity: u.capacity, included_guests: u.included_guests,
  base_price_per_night: u.base_price_per_night,
  check_in_time: u.check_in_time, check_out_time: u.check_out_time,
  cover_url: u.files.find((f) => f.url && f.rentable_unit_space_id == null)?.url ?? null,
  cover_thumbnail_url: u.files.find((f) => f.url && f.rentable_unit_space_id == null)?.thumbnail_url ?? null,
  photos_count: u.files.length,
});

const publicCompanyBrand = () => ({
  name: mockCompany.name, username: mockCompany.username, icon: mockCompany.icon ?? null,
  brand_primary: mockCompany.brand_primary ?? null, brand_secondary: mockCompany.brand_secondary ?? null,
});

const publicFiles = (files) => files.filter((f) => f.url).map((f) => ({ url: f.url, thumbnail_url: f.thumbnail_url }));

function resolvePublicLodgingMock(path, query) {
  let m = path.match(/^\/public\/[^/]+\/rentable-units$/);
  if (m) {
    const checkIn = query.get('check_in');
    const checkOut = query.get('check_out');
    // Mismos estados que bloquean disponibilidad en el backend (BLOCKING_STATUSES).
    const busy = checkIn && checkOut
      ? new Set(mockReservations
        .filter((r) => [1, 2, 3, 5].includes(r.status) && r.check_in_date < checkOut && r.check_out_date > checkIn)
        .map((r) => r.rentable_unit_id))
      : null;
    return {
      company: publicCompanyBrand(),
      whatsapp_number: mockCompany.phone ?? null,
      units: mockRentableUnits
        .filter((u) => u.status === 1)
        .map((u) => ({ ...publicUnitCard(u), available: busy ? !busy.has(u.id) : null })),
    };
  }

  m = path.match(/^\/public\/[^/]+\/rentable-units\/(\d+)\/availability$/);
  if (m) {
    const unit = mockRentableUnits.find((u) => u.id === Number(m[1]) && u.status === 1);
    if (!unit) return null;
    const checkIn = query.get('check_in');
    const checkOut = query.get('check_out');
    const busy = mockReservations.some((r) => [1, 2, 3, 5].includes(r.status)
      && r.rentable_unit_id === unit.id && r.check_in_date < checkOut && r.check_out_date > checkIn);
    return {
      check_in: checkIn,
      check_out: checkOut,
      nights: Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000),
      available: !busy,
    };
  }

  m = path.match(/^\/public\/[^/]+\/rentable-units\/(\d+)$/);
  if (m) {
    const unit = mockRentableUnits.find((u) => u.id === Number(m[1]) && u.status === 1);
    if (!unit) return null;
    syncUnitSpaceFiles(unit);
    return {
      company: publicCompanyBrand(),
      whatsapp_number: mockCompany.phone ?? null,
      unit: {
        id: unit.id, type_name: unit.type_name, name: unit.name, description: unit.description,
        capacity: unit.capacity, included_guests: unit.included_guests,
        base_price_per_night: unit.base_price_per_night,
        check_in_time: unit.check_in_time, check_out_time: unit.check_out_time,
        files: publicFiles(unit.files.filter((f) => f.rentable_unit_space_id == null)),
        inclusions: (unit.inclusions || []).map((inc) => ({
          id: inc.id, name: inc.name, description: inc.description,
        })),
        spaces: unit.spaces.map((sp) => ({
          id: sp.id, name: sp.name, description: sp.description, files: publicFiles(sp.files || []),
        })),
      },
    };
  }

  return undefined;
}

function resolveMenuMock(path, query, { method = 'GET', body } = {}) {
  const scoped = path.match(/^\/companies\/[^/]+\/(.+)$/);
  if (!scoped) return undefined;
  const sub = scoped[1];
  let m;

  // ── Categorías de un menú (anidadas: pertenecen al menú) ──
  m = sub.match(/^menus\/(\d+)\/categories$/);
  if (m) {
    const menuId = Number(m[1]);
    if (method === 'POST') {
      const maxPos = mockMenuCategories.filter((c) => c.menu_id === menuId).reduce((mx, c) => Math.max(mx, c.position), -1);
      const row = { id: nextId(mockMenuCategories), menu_id: menuId, name: body.name, description: body.description || '', file: null, position: body.position ?? maxPos + 1, status: 1 };
      mockMenuCategories.push(row);
      return row;
    }
    let rows = mockMenuCategories.filter((c) => c.menu_id === menuId).sort((a, b) => a.position - b.position);
    const s = (query.get('_search') || '').toLowerCase();
    if (s) rows = rows.filter((r) => r.name.toLowerCase().includes(s));
    return mockPaginate(rows, query);
  }
  m = sub.match(/^menus\/(\d+)\/categories\/(\d+)$/);
  if (m) {
    const idx = mockMenuCategories.findIndex((c) => c.id === Number(m[2]) && c.menu_id === Number(m[1]));
    if (method === 'PUT') { if (idx >= 0) mockMenuCategories[idx] = { ...mockMenuCategories[idx], ...body }; return mockMenuCategories[idx] || null; }
    if (method === 'DELETE') { if (idx >= 0) mockMenuCategories.splice(idx, 1); return { ok: true }; }
    return mockMenuCategories[idx] || null;
  }

  // ── Buscador de productos disponibles para un menú (excluye ya asignados) ──
  m = sub.match(/^menus\/(\d+)\/items\/search$/);
  if (m) {
    const menuId = Number(m[1]);
    const assigned = new Set(mockMenuItems.filter((i) => i.menu_id === menuId && i.status === 1).map((i) => i.item_id));
    const q = (query.get('q') || '').toLowerCase();
    let rows = mockMenuProducts.filter((p) => !assigned.has(p.id));
    if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
    rows = rows.map((p) => ({ ...p, value_print: priceFmt(p.value) }));
    return mockPaginate(rows, query);
  }

  // ── Carta del menú: menú + productos (con descripción e imagen) agrupados por categoría ──
  m = sub.match(/^menus\/(\d+)\/full$/);
  if (m) {
    const menu = mockMenus.find((x) => x.id === Number(m[1]));
    return menu ? buildMenuFull(menu) : null;
  }

  // ── Configuración de presentación de una categoría (p. ej. su plantilla/frame) ──
  m = sub.match(/^menus\/(\d+)\/categories\/(\d+)\/config$/);
  if (m) {
    const menuId = Number(m[1]);
    const idx = mockMenuCategories.findIndex((c) => c.id === Number(m[2]) && c.menu_id === menuId);
    if (method === 'PUT') {
      if (idx >= 0) mockMenuCategories[idx] = { ...mockMenuCategories[idx], config: body.config || null };
      return body.config || null;
    }
    return idx >= 0 ? mockMenuCategories[idx].config || null : null;
  }

  // ── Configuración de presentación de la carta (diseño/color/fondo) ──
  m = sub.match(/^menus\/(\d+)\/config$/);
  if (m) {
    const idx = mockMenus.findIndex((x) => x.id === Number(m[1]));
    if (method === 'PUT') {
      if (idx >= 0) mockMenus[idx] = { ...mockMenus[idx], config: body.config || null };
      return body.config || null;
    }
    return idx >= 0 ? mockMenus[idx].config || null : null;
  }

  // ── Ítems de un menú ──
  m = sub.match(/^menus\/(\d+)\/items$/);
  if (m) {
    const menuId = Number(m[1]);
    if (method === 'POST') {
      const row = { id: nextId(mockMenuItems), menu_id: menuId, menu_category_id: Number(body.menu_category_id), item_id: Number(body.item_id), price: body.price ?? null, position: body.position ?? 0, status: 1 };
      mockMenuItems.push(row);
      return decorateMenuItem(row);
    }
    // status === 1: el ítem está activo en el menú (status 0 = eliminado/soft-delete).
    return mockMenuItems
      .filter((i) => i.menu_id === menuId && i.status === 1)
      .map(decorateMenuItem)
      .sort((a, b) => {
        const ca = mockMenuCategories.find((c) => c.id === a.menu_category_id)?.position ?? 0;
        const cb = mockMenuCategories.find((c) => c.id === b.menu_category_id)?.position ?? 0;
        return ca - cb || a.position - b.position;
      });
  }
  m = sub.match(/^menus\/(\d+)\/items\/(\d+)$/);
  if (m) {
    const idx = mockMenuItems.findIndex((i) => i.id === Number(m[2]));
    if (method === 'PUT') {
      if (idx >= 0) mockMenuItems[idx] = { ...mockMenuItems[idx], ...body, menu_category_id: body.menu_category_id != null ? Number(body.menu_category_id) : mockMenuItems[idx].menu_category_id };
      return idx >= 0 ? decorateMenuItem(mockMenuItems[idx]) : null;
    }
    if (method === 'DELETE') { if (idx >= 0) mockMenuItems.splice(idx, 1); return { ok: true }; }
    return idx >= 0 ? decorateMenuItem(mockMenuItems[idx]) : null;
  }

  // ── Menús ──
  if (sub === 'menus') {
    if (method === 'POST') {
      const username = slugifyUsername(body.username || body.name);
      const row = { id: nextId(mockMenus), name: body.name, username, description: body.description || '', file: null, position: body.position ?? mockMenus.length, status: 1, is_active: true };
      mockMenus.push(row);
      return row;
    }
    let rows = [...mockMenus].sort((a, b) => a.position - b.position);
    const s = (query.get('_search') || '').toLowerCase();
    if (s) rows = rows.filter((r) => r.name.toLowerCase().includes(s));
    // Conteos derivados (convención Laravel `withCount`): productos y categorías del menú.
    rows = rows.map((r) => {
      const items = mockMenuItems.filter((i) => i.menu_id === r.id && i.status === 1);
      return {
        ...r,
        items_count: items.length,
        menu_categories_count: mockMenuCategories.filter((c) => c.menu_id === r.id && c.status === 1).length,
      };
    });
    return mockPaginate(rows, query);
  }
  m = sub.match(/^menus\/(\d+)\/active$/);
  if (m) {
    const menu = mockMenus.find((c) => c.id === Number(m[1]));
    if (!menu) return null;
    menu.is_active = !!body?.is_active;
    return menu;
  }
  m = sub.match(/^menus\/(\d+)$/);
  if (m) {
    const idx = mockMenus.findIndex((c) => c.id === Number(m[1]));
    if (method === 'PUT') { if (idx >= 0) mockMenus[idx] = { ...mockMenus[idx], ...body }; return mockMenus[idx] || null; }
    if (method === 'DELETE') { if (idx >= 0) mockMenus.splice(idx, 1); return { ok: true }; }
    return mockMenus[idx] || null;
  }

  return undefined;
}

// ── Helpers del módulo de productos ─────────────────────────────────────────
const ITEM_STATUS_NAME = { 1: 'Activo', 2: 'Borrador', 3: 'Eliminado' };

// Resolución de imágenes igual que el helper File del backend (app/Models/Utils/File.php):
// nombre crudo (items.image) → URL completa; `product.png` por defecto si no hay imagen.
const PATH_FILES = 'https://piddet-s3-files.s3.amazonaws.com/files/images/';
const FILE_PRODUCT_DEFAULT = 'product.png';
function resolveItemImage(it) {
  const name = it.image || FILE_PRODUCT_DEFAULT;
  return {
    file: PATH_FILES + name,
    thumbnail_file: PATH_FILES + 'thumbnails/' + name,
    standard_file: PATH_FILES + 'standard/' + name,
  };
}

// Decora un producto con los nombres derivados (como hacen los joins del backend) y la imagen.
function decorateItem(it) {
  const cat = mockItemCategories.find((c) => c.id === it.item_category_id);
  const type = mockItemTypes.find((t) => t.id === it.item_type_id);
  return {
    ...it,
    ...resolveItemImage(it),
    category_name: cat?.name || '',
    type_name: type?.name || '',
    status_name: ITEM_STATUS_NAME[it.item_status_id] || '',
  };
}

const applySort = (rows, elements) => {
  (elements || []).forEach((e) => {
    const i = rows.findIndex((r) => r.id === e.id);
    if (i >= 0) rows[i].position = e.position;
  });
  return { ok: true };
};

// Resuelve las rutas company-scoped del módulo de productos (items, categorías, tipos, taxes,
// funcionalidades, grupos de opciones y opciones). Devuelve `undefined` si no aplica.
function resolveItemsMock(path, query, { method = 'GET', body } = {}) {
  const scoped = path.match(/^\/companies\/[^/]+\/(.+)$/);
  if (!scoped) return undefined;
  const sub = scoped[1];
  let m;

  // ── Lecturas simples ──
  if (sub === 'taxes') return mockTaxFamilies;
  if (sub === 'functionalities') {
    if (method === 'PUT') {
      (body?.functionalities || []).forEach((change) => {
        const f = mockFunctionalities.find((x) => x.id === change.id);
        if (f) f.is_active = !!change.is_active;
      });
    }
    return mockFunctionalities;
  }
  if (sub === 'item-types') return mockPaginate(mockItemTypes.filter((t) => t.status !== 0), query);

  // ── Mesas ──
  if (sub === 'tables') {
    if (method === 'POST') {
      const table = {
        id: Math.max(0, ...mockTables.map((t) => t.id)) + 1,
        name: body?.name || 'Mesa',
        description: body?.description || '',
        capacity: Number(body?.capacity) || 1,
        status: 'available',
        is_active: true,
      };
      mockTables.push(table);
      return table;
    }
    return mockTables;
  }
  if (sub === 'tables/make-all-available') {
    mockTables.forEach((t) => { if (t.is_active) t.status = 'available'; });
    return { updated: mockTables.filter((t) => t.is_active).length };
  }
  if ((m = sub.match(/^tables\/(\d+)(?:\/(active|status))?$/))) {
    const table = mockTables.find((t) => t.id === Number(m[1]));
    if (!table) return { ok: false };
    if (m[2] === 'active') table.is_active = !!body?.is_active;
    else if (m[2] === 'status') table.status = body?.status === 'occupied' ? 'occupied' : 'available';
    else if (method === 'PUT') {
      table.name = body?.name ?? table.name;
      table.description = body?.description ?? table.description;
      table.capacity = Number(body?.capacity) || table.capacity;
    }
    return table;
  }

  // ── Subida de archivos a S3 (demo) ──
  if (sub === 'files') {
    if (method !== 'POST') return { ok: true };
    const f = body && typeof body.get === 'function' ? body.get('file') : null;
    const vis = (body && typeof body.get === 'function' && body.get('visibility')) || 'private';
    const orig = (f && f.name) || 'archivo';
    const ext = (orig.split('.').pop() || 'bin').toLowerCase();
    // En demo no hay S3: se devuelve un `name` de referencia y url null (la previsualización local
    // del componente se conserva). El backend real devuelve url/thumbnail_url resueltas.
    return { name: `demo-${Date.now()}.${ext}`, original_name: orig, visibility: vis, ext, size: (f && f.size) || 0, url: null, thumbnail_url: null };
  }

  // Categorías que la compañía USA (tiene productos), en su orden — para ordenar y para los filtros.
  if (sub === 'item-categories/ordering') {
    const usedIds = new Set(mockItems.map((it) => it.item_category_id));
    return mockItemCategories
      .filter((c) => usedIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        file: null,
        item_type_id: c.item_type_id,
        type_name: mockItemTypes.find((t) => t.id === c.item_type_id)?.name ?? '',
        position: c.position,
      }))
      .sort((a, b) => a.position - b.position);
  }

  // ── Categorías de producto (por tipo) ──
  if (sub === 'item-categories') {
    if (method === 'POST') {
      const typeId = Number(body.item_type_id);
      const row = { id: nextId(mockItemCategories), item_type_id: typeId, name: body.name, description: body.description || '', image: null, position: body.position ?? mockItemCategories.filter((c) => c.item_type_id === typeId).length, status: 1 };
      mockItemCategories.push(row);
      return row;
    }
    let rows = [...mockItemCategories];
    const typeId = query.get('item_type_id');
    if (typeId) rows = rows.filter((c) => c.item_type_id === Number(typeId));
    rows.sort((a, b) => a.position - b.position);
    const s = (query.get('_search') || '').toLowerCase();
    if (s) rows = rows.filter((r) => r.name.toLowerCase().includes(s));
    return mockPaginate(rows, query);
  }
  if (sub === 'item-categories/sort') return applySort(mockItemCategories, body.elements);
  m = sub.match(/^item-categories\/(\d+)$/);
  if (m) {
    const idx = mockItemCategories.findIndex((c) => c.id === Number(m[1]));
    if (method === 'PUT') { if (idx >= 0) mockItemCategories[idx] = { ...mockItemCategories[idx], ...body, item_type_id: body.item_type_id != null ? Number(body.item_type_id) : mockItemCategories[idx].item_type_id }; return mockItemCategories[idx] || null; }
    if (method === 'DELETE') { if (idx >= 0) mockItemCategories.splice(idx, 1); return { ok: true }; }
    return mockItemCategories[idx] || null;
  }

  // ── Grupos de opciones (anidados por ítem) ──
  m = sub.match(/^items\/(\d+)\/option-groups\/sort$/);
  if (m) return applySort(mockOptionGroups, body.elements);
  m = sub.match(/^items\/(\d+)\/option-groups\/(\d+)$/);
  if (m) {
    const idx = mockOptionGroups.findIndex((g) => g.id === Number(m[2]));
    if (method === 'PUT') { if (idx >= 0) mockOptionGroups[idx] = { ...mockOptionGroups[idx], ...body, multiple: body.multiple != null ? !!body.multiple : mockOptionGroups[idx].multiple }; return mockOptionGroups[idx] || null; }
    if (method === 'DELETE') {
      if (idx >= 0) {
        const gid = mockOptionGroups[idx].id;
        mockOptionGroups.splice(idx, 1);
        for (let i = mockItemOptions.length - 1; i >= 0; i--) if (mockItemOptions[i].group_id === gid) mockItemOptions.splice(i, 1);
      }
      return { ok: true };
    }
    return mockOptionGroups[idx] || null;
  }
  m = sub.match(/^items\/(\d+)\/option-groups$/);
  if (m) {
    const itemId = Number(m[1]);
    if (method === 'POST') {
      const row = { id: nextId(mockOptionGroups), item_id: itemId, name: body.name, type: body.type || 'OPTION', description: body.description || '', min: Number(body.min) || 0, max: Number(body.max) || 0, multiple: !!body.multiple, status: body.status != null ? (body.status ? 1 : 0) : 1, position: mockOptionGroups.filter((g) => g.item_id === itemId).length };
      mockOptionGroups.push(row);
      return row;
    }
    return mockOptionGroups.filter((g) => g.item_id === itemId).sort((a, b) => a.position - b.position);
  }

  // ── Opciones (de un grupo, anidadas por ítem) ──
  m = sub.match(/^items\/(\d+)\/options\/sort$/);
  if (m) return applySort(mockItemOptions, body.elements);
  m = sub.match(/^items\/(\d+)\/options\/(\d+)$/);
  if (m) {
    const idx = mockItemOptions.findIndex((o) => o.id === Number(m[2]));
    if (method === 'PUT') { if (idx >= 0) mockItemOptions[idx] = { ...mockItemOptions[idx], ...body, value: body.value != null ? Number(body.value) : mockItemOptions[idx].value }; return mockItemOptions[idx] || null; }
    if (method === 'DELETE') { if (idx >= 0) mockItemOptions.splice(idx, 1); return { ok: true }; }
    return mockItemOptions[idx] || null;
  }
  m = sub.match(/^items\/(\d+)\/options$/);
  if (m) {
    const itemId = Number(m[1]);
    if (method === 'POST') {
      const groupId = Number(body.group_id);
      const row = { id: nextId(mockItemOptions), item_id: itemId, group_id: groupId, name: body.name, description: body.description || '', value: Number(body.value) || 0, status: body.status != null ? Number(body.status) : 1, position: mockItemOptions.filter((o) => o.group_id === groupId).length };
      mockItemOptions.push(row);
      return row;
    }
    let rows = mockItemOptions.filter((o) => o.item_id === itemId);
    const gid = query.get('group_id');
    if (gid) rows = rows.filter((o) => o.group_id === Number(gid));
    return rows.sort((a, b) => a.position - b.position);
  }

  // ── Productos (items) ──
  if (sub === 'items/sort') return applySort(mockItems, body.elements);
  m = sub.match(/^items\/(\d+)\/status$/);
  if (m) { const idx = mockItems.findIndex((it) => it.id === Number(m[1])); if (idx >= 0) mockItems[idx].item_status_id = Number(body.item_status_id); return { ok: true }; }
  m = sub.match(/^items\/(\d+)\/image$/);
  if (m) { const idx = mockItems.findIndex((it) => it.id === Number(m[1])); if (idx >= 0) mockItems[idx].image = body.image; return idx >= 0 ? decorateItem(mockItems[idx]) : null; }
  m = sub.match(/^items\/(\d+)$/);
  if (m) {
    const idx = mockItems.findIndex((it) => it.id === Number(m[1]));
    if (method === 'PUT') {
      if (idx >= 0) {
        const b = { ...body };
        ['item_type_id', 'item_category_id', 'tax_family_id'].forEach((k) => { if (b[k] != null && b[k] !== '') b[k] = Number(b[k]); });
        if (b.value != null && b.value !== '') b.value = Number(b.value);
        mockItems[idx] = { ...mockItems[idx], ...b };
      }
      return idx >= 0 ? decorateItem(mockItems[idx]) : null;
    }
    if (method === 'DELETE') { if (idx >= 0) mockItems[idx].item_status_id = 3; return { ok: true }; } // soft-delete
    return idx >= 0 ? decorateItem(mockItems[idx]) : null;
  }
  if (sub === 'items') {
    if (method === 'POST') {
      const row = { id: nextId(mockItems), name: body.name, code: body.code || null, value: Number(body.value) || 0, file: null, item_type_id: Number(body.item_type_id), item_category_id: Number(body.item_category_id), item_status_id: 1, tax_family_id: body.tax_family_id != null && body.tax_family_id !== '' ? Number(body.tax_family_id) : null, description: body.description || '', position: mockItems.length, reservable: !!body.reservable };
      mockItems.push(row);
      return decorateItem(row);
    }
    let rows = mockItems.filter((it) => it.item_status_id !== 3).sort((a, b) => a.position - b.position);
    const s = (query.get('_search') || '').toLowerCase();
    if (s) rows = rows.filter((r) => r.name.toLowerCase().includes(s) || (r.code || '').toLowerCase().includes(s));
    const typeId = query.get('item_type_id');
    if (typeId) rows = rows.filter((r) => r.item_type_id === Number(typeId));
    const categoryId = query.get('item_category_id');
    if (categoryId) rows = rows.filter((r) => r.item_category_id === Number(categoryId));
    return mockPaginate(rows.map(decorateItem), query);
  }

  return undefined;
}

// ── Módulo de métricas (company-scoped): reporte de ventas por tipo ──────────────────────
const MOCK_DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function mockMoney(value) {
  return '$' + Math.round(value).toLocaleString('es-CO');
}

// Ventas por tipo (productos/servicios) por día para un período que termina en `end`.
function mockDailyByType(days, end, factor) {
  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const base = weekend ? 900000 : 600000;
    const products = Math.round((base + Math.random() * 300000) * factor);
    const services = Math.round((base * 0.35 + Math.random() * 150000) * factor);
    const ordersCount = Math.round((weekend ? 45 : 30) + Math.random() * 20);
    daily.push({
      date: d.toISOString().slice(0, 10),
      label: MOCK_DAY_NAMES[d.getDay()] + ' ' + String(d.getDate()).padStart(2, '0'),
      products,
      services,
      total: products + services,
      orders_count: ordersCount,
    });
  }
  return daily;
}

function mockSumByType(daily) {
  const products = daily.reduce((s, x) => s + x.products, 0);
  const services = daily.reduce((s, x) => s + x.services, 0);
  const ordersCount = daily.reduce((s, x) => s + x.orders_count, 0);
  const total = products + services;
  return { products, services, ordersCount, total, avgTicket: ordersCount > 0 ? total / ordersCount : 0 };
}

function mockDelta(current, previous) {
  const difference = current - previous;
  return {
    difference,
    difference_formatted: mockMoney(Math.abs(difference)),
    percent: previous > 0 ? Math.round((difference / previous) * 1000) / 10 : null,
    is_increase: difference >= 0,
  };
}

// Genera el reporte de ventas por tipo con la misma forma que el backend.
function buildSalesByTypeReport(days, endDateStr, force) {
  const end = endDateStr ? new Date(endDateStr + 'T00:00:00') : new Date();
  const factor = force ? 1.08 : 1; // el long-press (force) recalcula → valores algo distintos en demo

  const daily = mockDailyByType(days, end, factor);
  const cur = mockSumByType(daily);

  const prevEnd = new Date(end);
  prevEnd.setDate(end.getDate() - days);
  const prev = mockSumByType(mockDailyByType(days, prevEnd, factor * 0.85));

  return {
    period: {
      start_date: daily[0]?.date ?? null,
      end_date: daily[daily.length - 1]?.date ?? null,
      days,
    },
    totals: {
      products: cur.products,
      products_formatted: mockMoney(cur.products),
      services: cur.services,
      services_formatted: mockMoney(cur.services),
      total: cur.total,
      total_formatted: mockMoney(cur.total),
      orders_count: cur.ordersCount,
      avg_ticket: cur.avgTicket,
      avg_ticket_formatted: mockMoney(cur.avgTicket),
    },
    deltas: {
      total: mockDelta(cur.total, prev.total),
      products: mockDelta(cur.products, prev.products),
      services: mockDelta(cur.services, prev.services),
      avg_ticket: mockDelta(cur.avgTicket, prev.avgTicket),
    },
    daily,
  };
}

// Suma de ventas total por día para un período que termina en `end`, con la misma
// heurística (fin de semana vende más) que el reporte por tipo, para que ambos cuadren.
function mockDailySales(days, end, factor) {
  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const base = weekend ? 900000 : 600000;
    const total = Math.round((base * 1.35 + Math.random() * 450000) * factor);
    daily.push({
      date: d.toISOString().slice(0, 10),
      label: MOCK_DAY_NAMES[d.getDay()] + ' ' + String(d.getDate()).padStart(2, '0'),
      total,
    });
  }
  return daily;
}

// Comparación período actual vs. anterior con la misma forma que el backend.
function buildSalesComparison(days, endDateStr, force) {
  const end = endDateStr ? new Date(endDateStr + 'T00:00:00') : new Date();
  const factor = force ? 1.08 : 1;

  const prevEnd = new Date(end);
  prevEnd.setDate(end.getDate() - days); // el período anterior termina justo antes del actual

  const current = mockDailySales(days, end, factor);
  const previous = mockDailySales(days, prevEnd, factor * 0.85);

  const currentTotal = current.reduce((s, x) => s + x.total, 0);
  const previousTotal = previous.reduce((s, x) => s + x.total, 0);
  const difference = currentTotal - previousTotal;
  const percentChange = previousTotal > 0 ? Math.round((difference / previousTotal) * 10000) / 100 : 0;

  return {
    dates: current.map((x) => x.date),
    labels: current.map((x) => x.label),
    current_period: {
      label: 'Período actual',
      data: current.map((x) => x.total),
      total: currentTotal,
      total_formatted: mockMoney(currentTotal),
      start_date: current[0]?.date ?? null,
      end_date: current[current.length - 1]?.date ?? null,
    },
    previous_period: {
      label: 'Período anterior',
      data: previous.map((x) => x.total),
      total: previousTotal,
      total_formatted: mockMoney(previousTotal),
      start_date: previous[0]?.date ?? null,
      end_date: previous[previous.length - 1]?.date ?? null,
    },
    comparison: {
      difference,
      difference_formatted: mockMoney(Math.abs(difference)),
      percent_change: percentChange,
      is_increase: currentTotal >= previousTotal,
    },
  };
}

// Gastos diarios sintéticos: montos menores que las ventas y sin sesgo de fin de semana.
function mockDailyExpenses(days, end, factor) {
  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const count = 1 + Math.round(Math.random() * 3);
    const total = Math.round((120000 + Math.random() * 260000) * factor);
    daily.push({
      date: d.toISOString().slice(0, 10),
      label: MOCK_DAY_NAMES[d.getDay()] + ' ' + String(d.getDate()).padStart(2, '0'),
      total,
      expenses_count: count,
      max_expense: Math.round(total * (0.4 + Math.random() * 0.5)),
    });
  }
  return daily;
}

function mockSumExpenses(daily) {
  const total = daily.reduce((s, x) => s + x.total, 0);
  const count = daily.reduce((s, x) => s + x.expenses_count, 0);
  const max = daily.reduce((s, x) => Math.max(s, x.max_expense), 0);
  return { total, count, avg: count > 0 ? total / count : 0, max };
}

// Reporte de gastos con la misma forma que el backend (totals + deltas + daily).
function buildExpensesReport(days, endDateStr, force) {
  const end = endDateStr ? new Date(endDateStr + 'T00:00:00') : new Date();
  const factor = force ? 1.08 : 1;

  const daily = mockDailyExpenses(days, end, factor);
  const cur = mockSumExpenses(daily);

  const prevEnd = new Date(end);
  prevEnd.setDate(end.getDate() - days);
  const prev = mockSumExpenses(mockDailyExpenses(days, prevEnd, factor * 0.9));

  return {
    period: {
      start_date: daily[0]?.date ?? null,
      end_date: daily[daily.length - 1]?.date ?? null,
      days,
    },
    totals: {
      total: cur.total,
      total_formatted: mockMoney(cur.total),
      count: cur.count,
      avg: cur.avg,
      avg_formatted: mockMoney(cur.avg),
      max: cur.max,
      max_formatted: mockMoney(cur.max),
    },
    deltas: {
      total: mockDelta(cur.total, prev.total),
      count: mockDelta(cur.count, prev.count),
      avg: mockDelta(cur.avg, prev.avg),
      max: mockDelta(cur.max, prev.max),
    },
    daily,
  };
}

// Comparación de gastos período actual vs. anterior con la misma forma que el backend.
function buildExpensesComparison(days, endDateStr, force) {
  const end = endDateStr ? new Date(endDateStr + 'T00:00:00') : new Date();
  const factor = force ? 1.08 : 1;

  const prevEnd = new Date(end);
  prevEnd.setDate(end.getDate() - days);

  const current = mockDailyExpenses(days, end, factor);
  const previous = mockDailyExpenses(days, prevEnd, factor * 0.9);

  const currentTotal = current.reduce((s, x) => s + x.total, 0);
  const previousTotal = previous.reduce((s, x) => s + x.total, 0);
  const difference = currentTotal - previousTotal;

  return {
    dates: current.map((x) => x.date),
    labels: current.map((x) => x.label),
    current_period: {
      label: 'Período actual',
      data: current.map((x) => x.total),
      total: currentTotal,
      total_formatted: mockMoney(currentTotal),
      start_date: current[0]?.date ?? null,
      end_date: current[current.length - 1]?.date ?? null,
    },
    previous_period: {
      label: 'Período anterior',
      data: previous.map((x) => x.total),
      total: previousTotal,
      total_formatted: mockMoney(previousTotal),
      start_date: previous[0]?.date ?? null,
      end_date: previous[previous.length - 1]?.date ?? null,
    },
    comparison: {
      difference,
      difference_formatted: mockMoney(Math.abs(difference)),
      percent_change: previousTotal > 0 ? Math.round((difference / previousTotal) * 10000) / 100 : 0,
      is_increase: difference >= 0,
    },
  };
}

// Reporte de ventas con rango libre y filtros (creator_id/item_id), misma forma que el backend.
// Los filtros solo escalan los montos en demo, para que se note que la consulta cambió.
function buildSalesReport(query) {
  const toStr = query.get('date_to');
  const fromStr = query.get('date_from');
  let end = toStr ? new Date(toStr + 'T00:00:00') : new Date();
  let start = fromStr ? new Date(fromStr + 'T00:00:00') : null;
  if (!start) { start = new Date(end); start.setDate(end.getDate() - 6); }
  if (start > end) [start, end] = [end, start];
  const days = Math.min(92, Math.max(1, Math.round((end - start) / 86400000) + 1));

  const factor = (query.get('creator_id') ? 0.45 : 1) * (query.get('item_id') ? 0.3 : 1);
  const daily = mockDailyByType(days, end, factor);
  const cur = mockSumByType(daily);

  const total = cur.total;
  const tax = Math.round(total * 0.16);
  const discount = Math.round(total * 0.04);
  const subtotal = total + discount - tax;

  const methodShares = [
    { payment_method_id: 'CASH', payment_method_entity_id: 'CASH', name: 'Efectivo', share: 0.46 },
    { payment_method_id: 'TRANSFER', payment_method_entity_id: 'NEQUI', name: 'Nequi', share: 0.27 },
    { payment_method_id: 'CREDIT_CARD', payment_method_entity_id: 'CREDIT_CARD', name: 'Tarjeta de crédito', share: 0.18 },
    { payment_method_id: 'TRANSFER', payment_method_entity_id: 'DAVIPLATA', name: 'Daviplata', share: 0.09 },
  ];
  const methods = methodShares.map((m) => {
    const value = Math.round(total * m.share);
    return {
      payment_method_id: m.payment_method_id,
      payment_method_entity_id: m.payment_method_entity_id,
      name: m.name,
      orders_count: Math.max(1, Math.round(cur.ordersCount * m.share)),
      value,
      value_formatted: mockMoney(value),
      percent: Math.round(m.share * 1000) / 10,
    };
  });
  const paymentsTotal = methods.reduce((s, m) => s + m.value, 0);

  const topShares = [
    ['Hamburguesa de la casa', 0.22], ['Limonada de coco', 0.14], ['Picada familiar', 0.12],
    ['Salchipapa especial', 0.09], ['Jugo natural', 0.07], ['Cerveza artesanal', 0.05],
  ];
  const topItems = topShares.map(([name, share], i) => {
    const itemTotal = Math.round(total * share);
    return {
      item_id: 101 + i,
      name,
      quantity: Math.max(1, Math.round((itemTotal / 18000))),
      total: itemTotal,
      total_formatted: mockMoney(itemTotal),
      percent: Math.round(share * 1000) / 10,
    };
  });

  const avgTicket = cur.ordersCount > 0 ? total / cur.ordersCount : 0;

  return {
    period: {
      start_date: daily[0]?.date ?? null,
      end_date: daily[daily.length - 1]?.date ?? null,
      days,
    },
    filters: {
      creator_id: query.get('creator_id') ? Number(query.get('creator_id')) : null,
      item_id: query.get('item_id') ? Number(query.get('item_id')) : null,
    },
    totals: {
      subtotal,
      subtotal_formatted: mockMoney(subtotal),
      discount,
      discount_formatted: mockMoney(discount),
      tax,
      tax_formatted: mockMoney(tax),
      total,
      total_formatted: mockMoney(total),
      orders_count: cur.ordersCount,
      avg_ticket: avgTicket,
      avg_ticket_formatted: mockMoney(avgTicket),
    },
    payments: {
      total: paymentsTotal,
      total_formatted: mockMoney(paymentsTotal),
      methods,
    },
    top_items: topItems,
    daily,
  };
}

function resolveMetricsMock(path, query) {
  if (path.match(/^\/companies\/[^/]+\/metrics\/sales-report$/)) {
    return buildSalesReport(query);
  }
  if (path.match(/^\/companies\/[^/]+\/metrics\/sales-by-type$/)) {
    const days = Math.max(1, Math.min(30, parseInt(query.get('days'), 10) || 15));
    return buildSalesByTypeReport(days, query.get('end_date'), query.get('force') === '1');
  }
  if (path.match(/^\/companies\/[^/]+\/metrics\/sales-comparison$/)) {
    const days = Math.max(1, Math.min(28, parseInt(query.get('days'), 10) || 7));
    return buildSalesComparison(days, query.get('end_date'), query.get('force') === '1');
  }
  if (path.match(/^\/companies\/[^/]+\/metrics\/expenses-report$/)) {
    const days = Math.max(1, Math.min(30, parseInt(query.get('days'), 10) || 15));
    return buildExpensesReport(days, query.get('end_date'), query.get('force') === '1');
  }
  if (path.match(/^\/companies\/[^/]+\/metrics\/expenses-comparison$/)) {
    const days = Math.max(1, Math.min(28, parseInt(query.get('days'), 10) || 7));
    return buildExpensesComparison(days, query.get('end_date'), query.get('force') === '1');
  }
  return undefined;
}

// Enrutador de mocks: mapea ruta → respuesta. Soporta query string (?...) y mutaciones.
// Resuelve las rutas company-scoped del módulo de usuarios. Devuelve `undefined` si no aplica
// y simula GET/POST/PUT/DELETE sobre `mockUsers` en memoria.
function resolveStoresMock(path, query, { method = 'GET', body } = {}) {
  const m = path.match(/^\/companies\/[^/]+\/stores(\/.*)?$/);
  if (!m) return undefined;
  const sub = m[1] || '';

  const normSchedules = (rows = []) => rows.map((r) => ({
    day_id: Number(r.day_id),
    start_time: r.start_time,
    end_time: r.end_time,
  }));
  const withStatus = (st) => ({ ...st, status: storeStatusObj(st.store_status_id) });

  if (sub === '/catalogs') {
    return { statuses: mockStoreStatuses, types: mockStoreTypes, days: mockStoreDays };
  }

  if (sub === '') {
    if (method === 'POST') {
      const store = {
        id: nextId(mockStoresList),
        store_type_id: body?.store_type_id ?? null,
        store_status_id: body?.store_status_id ?? 1,
        name: body?.name || 'Tienda',
        address: body?.address ?? null,
        phone_code: body?.phone_code ?? '57',
        phone_number: body?.phone_number ?? '',
        latitude: body?.latitude ?? null,
        longitude: body?.longitude ?? null,
        schedules: normSchedules(body?.schedules),
      };
      mockStoresList.push(store);
      return withStatus(store);
    }
    // El listado paginado no necesita los horarios; se omiten para un payload liviano.
    const rows = [...mockStoresList]
      .map(({ schedules, ...rest }) => withStatus(rest));
    return mockPaginate(rows, query);
  }

  const idMatch = sub.match(/^\/(\d+)(\/status)?$/);
  if (idMatch) {
    const id = Number(idMatch[1]);
    const idx = mockStoresList.findIndex((st) => st.id === id);

    if (idMatch[2] === '/status') {
      if (idx >= 0) mockStoresList[idx].store_status_id = Number(body?.store_status_id) || 1;
      return { status: 'success', message: 'Estado actualizado (demo)' };
    }
    if (method === 'PUT') {
      if (idx >= 0) {
        const st = mockStoresList[idx];
        if (body?.name != null) st.name = body.name;
        if (body?.address !== undefined) st.address = body.address;
        if (body?.phone_code !== undefined) st.phone_code = body.phone_code;
        if (body?.phone_number !== undefined) st.phone_number = body.phone_number;
        if (body?.store_type_id !== undefined) st.store_type_id = body.store_type_id;
        if (body?.store_status_id !== undefined) st.store_status_id = body.store_status_id;
        if (body?.latitude !== undefined) st.latitude = body.latitude;
        if (body?.longitude !== undefined) st.longitude = body.longitude;
        if (Array.isArray(body?.schedules)) st.schedules = normSchedules(body.schedules);
        return withStatus(st);
      }
      return { status: 'success', message: 'ok' };
    }
    if (method === 'DELETE') {
      if (idx >= 0) mockStoresList.splice(idx, 1);
      return { status: 'success', message: 'Tienda eliminada (demo)' };
    }
    return idx >= 0 ? withStatus(mockStoresList[idx]) : null;
  }

  return undefined;
}

// ── Administración de accesos (company-scoped en la ruta, global en los datos) ─────────
// CONTRATO BACKEND: /companies/{company}/permissions (catálogo), .../permissions/{id}/api-visibility,
// y .../permissions/roles[/{id}[/permissions]] para el CRUD de roles.
function resolvePermissionsAdminMock(path, query, { method = 'GET', body } = {}) {
  const m = path.match(/^\/companies\/[^/]+\/permissions(\/.*)?$/);
  if (!m) return undefined;
  const sub = m[1] || '';

  const allPermissions = () => mockPermissionCatalog.flatMap((mod) => mod.permissions);
  // El rol guarda nombres de permiso; el backend los devuelve como objetos del catálogo.
  const roleOut = (role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: allPermissions().filter((p) => role.permissions.includes(p.name)),
  });

  if (sub === '') {
    const search = (query.get('search') || '').toLowerCase();
    const moduleId = query.get('module_id');
    return mockPermissionCatalog
      .filter((mod) => !moduleId || String(mod.module_id) === String(moduleId))
      .map((mod) => ({
        ...mod,
        permissions: mod.permissions.filter((p) =>
          !search || `${p.name} ${p.description || ''}`.toLowerCase().includes(search)),
      }))
      .filter((mod) => mod.permissions.length > 0);
  }

  const visibilityMatch = sub.match(/^\/(\d+)\/api-visibility$/);
  if (visibilityMatch) {
    const permission = allPermissions().find((p) => p.id === Number(visibilityMatch[1]));
    if (permission) permission.is_api = !!body?.is_api;
    return permission || null;
  }

  if (sub === '/roles') {
    if (method === 'POST') {
      const role = {
        id: nextId(mockRoles),
        name: body?.name || 'nuevo-rol',
        label: roleLabel(body?.name || 'nuevo-rol'),
        description: body?.description ?? null,
        permissions: [],
      };
      mockRoles.push(role);
      return roleOut(role);
    }
    return mockRoles.map(roleOut);
  }

  const roleMatch = sub.match(/^\/roles\/(\d+)(\/permissions)?$/);
  if (roleMatch) {
    const id = Number(roleMatch[1]);
    const idx = mockRoles.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    const role = mockRoles[idx];

    if (roleMatch[2]) {
      role.permissions = Array.isArray(body?.permissions) ? body.permissions : [];
      return roleOut(role);
    }
    if (method === 'PUT') {
      if (body?.name != null) role.name = body.name;
      if (body?.description !== undefined) { role.description = body.description; role.label = body.description || role.name; }
      return roleOut(role);
    }
    if (method === 'DELETE') {
      mockRoles.splice(idx, 1);
      return { status: 'success', message: 'Rol eliminado (demo)' };
    }
    return roleOut(role);
  }

  return undefined;
}

function resolveUsersMock(path, query, { method = 'GET', body } = {}) {
  const m = path.match(/^\/companies\/[^/]+\/users(\/.*)?$/);
  if (!m) return undefined;
  const sub = m[1] || '';

  const toRoles = (names = []) => names
    .map((n) => mockRoles.find((r) => r.name === n))
    .filter(Boolean)
    .map((r) => ({ name: r.name, label: r.label }));

  if (sub === '/assignable-roles') return mockAssignableRoles();
  if (sub === '/assignable-permissions') return mockAssignablePermissions;

  if (sub === '/search') {
    const phone = query.get('phone') || '';
    const user = mockUsers.find((u) => u.phone_number === phone);
    // En demo: si el teléfono ya está en la compañía, se considera vinculado; si no, no existe
    // (para poder probar el alta de un usuario nuevo).
    if (!user) return { exists: false, linked: false, user: null };
    return {
      exists: true,
      linked: true,
      user: {
        id: user.id, name: user.name, first_name: user.first_name, last_name: user.last_name,
        email: user.email, phone_code: user.phone_code, phone_number: user.phone_number,
      },
    };
  }

  if (sub === '') {
    if (method === 'POST') {
      const u = {
        id: nextId(mockUsers),
        first_name: body?.first_name || 'Usuario',
        last_name: body?.last_name || '',
        phone_code: body?.phone_code || '57',
        phone_number: body?.phone_number || '',
        email: body?.email ?? null,
        status: true,
        roles: toRoles(body?.roles),
        direct_permissions: Array.isArray(body?.permissions) ? body.permissions : [],
        user_type_id: Number(body?.user_type_id) || 2,
      };
      u.name = `${u.first_name} ${u.last_name}`.trim();
      mockUsers.push(u);
      return u;
    }
    const userTypeId = query.get('user_type_id');
    const role = query.get('_role');
    const rows = mockUsers
      .filter((u) => !userTypeId || String(u.user_type_id) === String(userTypeId))
      .filter((u) => !role || (u.roles || []).some((r) => r.name === role));
    return mockPaginate(rows, query);
  }

  const idMatch = sub.match(/^\/(\d+)(\/password)?$/);
  if (idMatch) {
    const id = Number(idMatch[1]);
    const idx = mockUsers.findIndex((u) => u.id === id);

    if (idMatch[2] === '/password') {
      return { status: 'success', message: 'Contraseña actualizada (demo)' };
    }
    if (method === 'PUT') {
      if (idx >= 0) {
        const u = mockUsers[idx];
        if (body?.first_name != null) u.first_name = body.first_name;
        if (body?.last_name != null) u.last_name = body.last_name;
        if (body?.email !== undefined) u.email = body.email;
        if (body?.phone_code != null) u.phone_code = body.phone_code;
        if (body?.phone_number != null) u.phone_number = body.phone_number;
        if (body?.user_type_id != null) u.user_type_id = Number(body.user_type_id);
        if (Array.isArray(body?.roles)) u.roles = toRoles(body.roles);
        if (Array.isArray(body?.permissions)) u.direct_permissions = body.permissions;
        u.name = `${u.first_name} ${u.last_name}`.trim();
        return u;
      }
      return { status: 'success', message: 'ok' };
    }
    if (method === 'DELETE') {
      if (idx >= 0) mockUsers.splice(idx, 1);
      return { status: 'success', message: 'Usuario desvinculado (demo)' };
    }
    return idx >= 0 ? mockUsers[idx] : null;
  }

  return undefined;
}

// ── Módulo de facturas/órdenes (company-scoped): listado por fecha + detalle ───────────
// CONTRATO BACKEND: GET /companies/{company}/orders?date=YYYY-MM-DD (paginado) y
// GET /companies/{company}/orders/{uuid}. El dinero se formatea como el backend
// (printMoney → "$ 19,000") y el detalle replica getOrderDetail(): order, customer,
// creator, items (con options), taxes agrupados, status y payments.

const orderMoney = (v) => '$ ' + Math.round(Number(v || 0)).toLocaleString('en-US');

const isoDay = (offsetDays = 0) => {
  const d = new Date(Date.now() - offsetDays * 864e5);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const ORDER_STATUS_NAMES = {
  CREATED: 'Creada',
  ACCEPTED_IN_STORE: 'Aceptada por la tienda',
  CANCELLED: 'Cancelada',
};

// Fábrica de una orden demo con su detalle completo (totales coherentes entre sí).
function buildMockInvoice({ seq, dayOffset, time, status, statusPayment, originCode, serviceType, tableId, customer, creator, items, taxName = 'IVA', taxPct = 0, discount = 0, paymentMethod = 'Efectivo' }) {
  const date = isoDay(dayOffset);
  const id = `demo-${date}-${String(seq).padStart(4, '0')}`;
  const orderNumber = `AY${String(seq).padStart(4, '0')}`;

  const detailItems = items.map((it, i) => {
    const options = (it.options || []).map((op, j) => ({
      id: `${id}-op-${i}-${j}`,
      order_id: id,
      order_item_id: `${id}-it-${i}`,
      item_id: 100 + i,
      name: op.name,
      value: op.value,
      quantity: op.quantity ?? it.quantity,
      total: op.value * (op.quantity ?? it.quantity),
      value_formatted: orderMoney(op.value),
      total_formatted: orderMoney(op.value * (op.quantity ?? it.quantity)),
    }));
    const optionsTotal = options.reduce((s, op) => s + op.total, 0);
    const subtotal = it.value * it.quantity + optionsTotal;
    const tax = subtotal * taxPct;
    return {
      id: `${id}-it-${i}`,
      order_id: id,
      item_id: 100 + i,
      name: it.name,
      reference: it.reference || `REF-${100 + i}`,
      quantity: it.quantity,
      value: it.value,
      subtotal,
      tax,
      discount: 0,
      total: subtotal + tax,
      subtotal_formatted: orderMoney(subtotal),
      tax_formatted: orderMoney(tax),
      discount_formatted: orderMoney(0),
      total_formatted: orderMoney(subtotal + tax),
      unit_price: it.value,
      unit_price_formatted: orderMoney(it.value),
      total_item: it.value * it.quantity,
      total_item_formatted: orderMoney(it.value * it.quantity),
      options,
    };
  });

  const subtotal = detailItems.reduce((s, it) => s + it.subtotal, 0);
  const tax = detailItems.reduce((s, it) => s + it.tax, 0);
  const total = subtotal + tax - discount;
  const createdAt = `${date}T${time}:00`;
  const createdDate = `${date} ${time}:00`;
  const customerName = customer ? `${customer.first_name} ${customer.last_name}`.trim() : null;

  const order = {
    id,
    company_id: 1,
    order_number: orderNumber,
    service_type: serviceType,
    status,
    status_payment: statusPayment,
    status_logistic: 'IN_STORE',
    origin_code: originCode,
    table_id: tableId ?? null,
    subtotal,
    tax,
    discount,
    total,
    created_at: createdAt,
    date,
    subtotal_formatted: orderMoney(subtotal),
    tax_formatted: orderMoney(tax),
    discount_formatted: orderMoney(discount),
    total_formatted: orderMoney(total),
    created_date: createdDate,
  };

  return {
    // Fila del listado (misma forma que el select paginado del backend).
    id,
    order_number: orderNumber,
    service_type: serviceType,
    status,
    status_payment: statusPayment,
    subtotal,
    tax,
    discount,
    total,
    created_at: createdAt,
    origin_code: originCode,
    total_formatted: orderMoney(total),
    discount_formatted: orderMoney(discount),
    created_date: createdDate,
    customer_name: customerName,
    creator_first_name: creator?.first_name ?? null,
    creator_user_id: creator?.user_id ?? null,
    date,
    detail: {
      order,
      customer: customer
        ? { order_id: id, order_user_type_id: 'OWNER', ...customer, customer_name: customerName }
        : null,
      creator: creator
        ? { order_id: id, order_user_type_id: 'CREATOR', ...creator, creator_name: `${creator.first_name} ${creator.last_name}`.trim() }
        : null,
      items: detailItems,
      taxes: tax > 0
        ? [{ tax_id: 1, name: taxName, percentage: (taxPct * 100).toFixed(2), value: tax, value_formatted: orderMoney(tax) }]
        : [],
      status: { type: 'GENERAL', name: ORDER_STATUS_NAMES[status] || status },
      payments: statusPayment === 'PAID'
        ? [{ order_id: id, payment_method_id: 1, payment_method_name: paymentMethod, value: total, value_formatted: orderMoney(total) }]
        : [],
    },
  };
}

const demoCustomers = [
  { user_id: 11, first_name: 'Juan', last_name: 'Pérez', email: 'juan.perez@mail.com', phone_code: '57', phone_number: '3001112233' },
  { user_id: 12, first_name: 'Ana', last_name: 'Gómez', email: 'ana.gomez@mail.com', phone_code: '57', phone_number: '3014445566' },
  { user_id: 13, first_name: 'Carlos', last_name: 'Ruiz', email: '', phone_code: '57', phone_number: '3157778899' },
];
const demoCreators = [
  { user_id: 1, first_name: 'María', last_name: 'Restrepo', email: 'maria@gruposabor.co', phone_code: '57', phone_number: '3009990001' },
  { user_id: 2, first_name: 'Pedro', last_name: 'Salazar', email: 'pedro@gruposabor.co', phone_code: '57', phone_number: '3009990002' },
];

const mockInvoiceOrders = [
  buildMockInvoice({
    seq: 12, dayOffset: 0, time: '13:45', status: 'ACCEPTED_IN_STORE', statusPayment: 'PAID',
    originCode: 'POS', serviceType: 'DINE_IN', tableId: 4,
    customer: demoCustomers[0], creator: demoCreators[0], taxPct: 0.19,
    items: [
      { name: 'Hamburguesa clásica', quantity: 2, value: 15000, options: [{ name: 'Queso extra', value: 2000 }] },
      { name: 'Limonada natural', quantity: 1, value: 8000 },
    ],
  }),
  buildMockInvoice({
    seq: 11, dayOffset: 0, time: '13:20', status: 'CREATED', statusPayment: 'WITHOUT_PAYMENT',
    originCode: 'WAITER', serviceType: 'DINE_IN', tableId: 2,
    customer: null, creator: demoCreators[1], taxPct: 0.19,
    items: [
      { name: 'Bandeja paisa', quantity: 1, value: 32000 },
      { name: 'Jugo de mango', quantity: 2, value: 7000 },
    ],
  }),
  buildMockInvoice({
    seq: 10, dayOffset: 0, time: '12:58', status: 'CANCELLED', statusPayment: 'WITHOUT_PAYMENT',
    originCode: 'POS', serviceType: 'TAKE_OUT',
    customer: demoCustomers[1], creator: demoCreators[0],
    items: [{ name: 'Pizza mediana pepperoni', quantity: 1, value: 28000 }],
  }),
  buildMockInvoice({
    seq: 9, dayOffset: 0, time: '12:30', status: 'ACCEPTED_IN_STORE', statusPayment: 'PAID',
    originCode: 'POS', serviceType: 'TAKE_OUT',
    customer: demoCustomers[2], creator: demoCreators[1], taxPct: 0.19, paymentMethod: 'Nequi', discount: 5000,
    items: [
      { name: 'Wrap de pollo', quantity: 2, value: 14000, options: [{ name: 'Salsa picante', value: 0 }, { name: 'Papas medianas', value: 5000 }] },
    ],
  }),
  buildMockInvoice({
    seq: 8, dayOffset: 0, time: '11:05', status: 'ACCEPTED_IN_STORE', statusPayment: 'PAID',
    originCode: 'WAITER', serviceType: 'DINE_IN', tableId: 7,
    customer: demoCustomers[1], creator: demoCreators[0],
    items: [
      { name: 'Desayuno americano', quantity: 3, value: 12000 },
      { name: 'Café americano', quantity: 3, value: 4000 },
    ],
  }),
  buildMockInvoice({
    seq: 7, dayOffset: 1, time: '19:40', status: 'ACCEPTED_IN_STORE', statusPayment: 'PAID',
    originCode: 'POS', serviceType: 'DINE_IN', tableId: 1,
    customer: demoCustomers[0], creator: demoCreators[1], taxPct: 0.19,
    items: [{ name: 'Parrillada mixta', quantity: 1, value: 58000, options: [{ name: 'Chimichurri', value: 1500 }] }],
  }),
  buildMockInvoice({
    seq: 6, dayOffset: 1, time: '13:10', status: 'ACCEPTED_IN_STORE', statusPayment: 'PAID',
    originCode: 'POS', serviceType: 'TAKE_OUT',
    customer: demoCustomers[2], creator: demoCreators[0], discount: 3000,
    items: [{ name: 'Ensalada césar', quantity: 2, value: 16000 }],
  }),
  buildMockInvoice({
    seq: 5, dayOffset: 2, time: '20:15', status: 'CREATED', statusPayment: 'WITHOUT_PAYMENT',
    originCode: 'WAITER', serviceType: 'DINE_IN', tableId: 3,
    customer: null, creator: demoCreators[1], taxPct: 0.19,
    items: [{ name: 'Picada familiar', quantity: 1, value: 45000 }],
  }),
];

function resolveOrdersMock(path, query, { method = 'GET', body } = {}) {
  const m = path.match(/^\/companies\/[^/]+\/orders(\/.*)?$/);
  if (!m) return undefined;
  const sub = m[1] || '';

  if (sub === '') {
    const from = query.get('date_from') || query.get('date') || isoDay(0);
    const to = query.get('date_to') || query.get('date') || from;
    const statuses = (query.get('status') || '').split(',').map((x) => x.trim()).filter(Boolean);
    const creatorId = query.get('creator_id') || '';
    const rows = mockInvoiceOrders
      .filter((o) => o.date >= from && o.date <= to)
      .filter((o) => statuses.length === 0 || statuses.includes(o.status))
      .filter((o) => !creatorId || String(o.creator_user_id) === String(creatorId))
      .map(({ detail, date: _d, ...row }) => row);
    return mockPaginate(rows, query);
  }

  if (sub === '/creators') {
    return demoCreators.map((c) => ({
      user_id: c.user_id,
      name: `${c.first_name} ${c.last_name}`.trim(),
      first_name: c.first_name,
    }));
  }

  // Cancelación con motivo obligatorio: /orders/{uuid}/cancel
  const cancelMatch = sub.match(/^\/([^/]+)\/cancel$/);
  if (cancelMatch && method === 'PATCH') {
    const found = mockInvoiceOrders.find((o) => o.id === cancelMatch[1]);
    if (!found || !body?.reason) return null;
    found.status = 'CANCELLED';
    found.detail.order.status = 'CANCELLED';
    found.detail.status = { type: 'GENERAL', name: ORDER_STATUS_NAMES.CANCELLED };
    found.detail.cancellation = { comment: String(body.reason), created_at: new Date().toISOString() };
    return found.detail;
  }

  const idMatch = sub.match(/^\/([^/]+)$/);
  if (idMatch) {
    const found = mockInvoiceOrders.find((o) => o.id === idMatch[1]);
    return found ? found.detail : null;
  }

  return undefined;
}

// ─── Fallos de sincronización de órdenes (soporte) ─────────────────────────
// CONTRATO BACKEND: /companies/{company}/orders/sync-failure-reports (listado paginado sin
// order_payload/context, detalle completo, PUT payload, PATCH status, POST retry). El retry
// simula la validación del backend: payload sin company_id / JSON corrupto → error 422 con
// `errors` campo a campo; payload corregido → orden creada y reporte resuelto.

const syncFailureError = (message, status, errors) => {
  const err = new Error(message);
  err.status = status;
  if (errors) err.errors = errors;
  throw err;
};

const buildSyncFailurePayload = ({ companyId, uuid, orderNumber, itemName, value, quantity }) => {
  const subtotal = value * quantity;
  const tax = Math.round(subtotal * 0.19);
  const total = subtotal + tax;
  return JSON.stringify({
    origin: 'POS',
    company_id: companyId,
    table_id: null,
    user: { id: 0, name: 'Cliente mostrador' },
    creator: { id: 1, first_name: 'María', last_name: 'Restrepo', email: 'maria@gruposabor.co', phone_code: '57', phone_number: '3009990001' },
    order: {
      uuid,
      status: 'CREATE',
      service_type: 'TAKE_OUT',
      order_number: orderNumber,
      date: { date: `${isoDay(0)} 13:40:00`, timezone: 'America/Bogota' },
    },
    items: [{
      id: 101,
      preorder_item_id: `${uuid}-it-0`,
      quantity,
      subtotal,
      tax,
      discount: 0,
      total,
      options: [],
      value,
      name: itemName,
    }],
    payment: { status: 'PAID', subtotal, tax, discount: 0, total, methods: [{ method: 'cash', value: total }] },
  }, null, 2);
};

const mockSyncFailureReports = [
  {
    id: 'sfr-0001',
    order_uuid: 'f7a2c1d0-demo-0001',
    company_id: null, // huérfano: la falla reportada es justamente el company_id ausente
    company_username: 'grupo_sabor',
    order_number: 'AY0031',
    attempts: 3,
    error_message: 'company_id ausente en el payload: el POS perdió el contexto de la compañía al reintentar desde localStorage.',
    paid_sync_status: 'PAID',
    reported_origin: 'POS',
    order_payload: buildSyncFailurePayload({ companyId: null, uuid: 'f7a2c1d0-demo-0001', orderNumber: 'AY0031', itemName: 'Hamburguesa clásica', value: 15000, quantity: 2 }),
    context: JSON.stringify({ localStorage_key: 'pos_pending_orders', retries: 3, last_http_status: 422 }, null, 2),
    reported_by: 1,
    reported_username: 'maria.pos',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) piddet-pos/2.4.1',
    ip: '190.85.10.21',
    support_status: 'pending',
    resolution_notes: null,
    resolved_by: null,
    resolved_username: null,
    resolved_at: null,
    recovered_order_uuid: null,
    last_retry_error: '[validation] Validation error',
    last_retry_at: `${isoDay(0)}T14:10:00`,
    created_at: `${isoDay(0)}T13:47:00`,
    updated_at: `${isoDay(0)}T14:10:00`,
  },
  {
    id: 'sfr-0002',
    order_uuid: 'b3e9d4a2-demo-0002',
    company_id: 1,
    company_username: 'grupo_sabor',
    order_number: 'AY0029',
    attempts: 1,
    error_message: 'Timeout al sincronizar con el servidor (la red del local se cayó durante el cierre).',
    paid_sync_status: 'PAID',
    reported_origin: 'POS',
    order_payload: buildSyncFailurePayload({ companyId: 1, uuid: 'b3e9d4a2-demo-0002', orderNumber: 'AY0029', itemName: 'Wrap de pollo', value: 14000, quantity: 1 }),
    context: JSON.stringify({ localStorage_key: 'pos_pending_orders', retries: 1, last_http_status: null }, null, 2),
    reported_by: 2,
    reported_username: 'pedro.pos',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) piddet-pos/2.4.1',
    ip: '190.85.10.21',
    support_status: 'pending',
    resolution_notes: null,
    resolved_by: null,
    resolved_username: null,
    resolved_at: null,
    recovered_order_uuid: null,
    last_retry_error: null,
    last_retry_at: null,
    created_at: `${isoDay(0)}T11:02:00`,
    updated_at: `${isoDay(0)}T11:02:00`,
  },
  {
    id: 'sfr-0003',
    order_uuid: 'c8d1e5f3-demo-0003',
    company_id: 1,
    company_username: 'grupo_sabor',
    order_number: null,
    attempts: 5,
    error_message: 'Payload corrupto: el navegador truncó el registro de localStorage.',
    paid_sync_status: 'WITHOUT_PAYMENT',
    reported_origin: 'POS',
    order_payload: '{"origin":"POS","company_id":1,"items":[{"id":101,"qua', // JSON truncado a propósito
    context: null,
    reported_by: 1,
    reported_username: 'maria.pos',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) piddet-pos/2.3.0',
    ip: '181.49.22.7',
    support_status: 'unrecoverable',
    resolution_notes: 'Payload truncado, imposible reconstruir la orden. Se re-digitó a mano en el POS.',
    resolved_by: 1,
    resolved_username: 'admin.soporte',
    resolved_at: `${isoDay(1)}T09:15:00`,
    recovered_order_uuid: null,
    last_retry_error: '[validation] Invalid JSON payload: Syntax error',
    last_retry_at: `${isoDay(1)}T09:10:00`,
    created_at: `${isoDay(2)}T20:31:00`,
    updated_at: `${isoDay(1)}T09:15:00`,
  },
  {
    id: 'sfr-0004',
    order_uuid: 'a1f6b2c4-demo-0004',
    company_id: 1,
    company_username: 'grupo_sabor',
    order_number: 'AY0018',
    attempts: 2,
    error_message: 'origin not found: el POS envió un código de origen desactualizado.',
    paid_sync_status: 'PAID',
    reported_origin: 'POS',
    order_payload: buildSyncFailurePayload({ companyId: 1, uuid: 'a1f6b2c4-demo-0004', orderNumber: 'AY0018', itemName: 'Ensalada césar', value: 16000, quantity: 2 }),
    context: null,
    reported_by: 2,
    reported_username: 'pedro.pos',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) piddet-pos/2.4.1',
    ip: '190.85.10.21',
    support_status: 'resolved',
    resolution_notes: 'Se corrigió el código de origen en el payload y la orden se creó al reintentar.',
    resolved_by: 1,
    resolved_username: 'admin.soporte',
    resolved_at: `${isoDay(1)}T16:42:00`,
    recovered_order_uuid: 'demo-recovered-a1f6b2c4',
    last_retry_error: null,
    last_retry_at: `${isoDay(1)}T16:42:00`,
    created_at: `${isoDay(1)}T15:58:00`,
    updated_at: `${isoDay(1)}T16:42:00`,
  },
];

// Reglas mínimas del backend que el retry demo valida sobre el payload editado.
function validateSyncFailurePayload(payload) {
  const errors = {};
  if (payload.company_id == null) errors.company_id = ['El campo company_id es obligatorio.'];
  if (!payload.origin) errors.origin = ['El campo origin es obligatorio.'];
  if (!Array.isArray(payload.items) || payload.items.length === 0) errors.items = ['La orden debe tener al menos un ítem.'];
  if (!payload.payment?.status) errors['payment.status'] = ['El campo payment.status es obligatorio.'];
  if (!payload.creator) errors.creator = ['El payload no trae creator; en el retry no hay fallback al usuario autenticado.'];
  return errors;
}

function resolveSyncFailuresMock(path, query, { method = 'GET', body } = {}) {
  const m = path.match(/^\/companies\/[^/]+\/orders\/sync-failure-reports(\/.*)?$/);
  if (!m) return undefined;
  const sub = m[1] || '';
  const nowStamp = () => new Date().toISOString().slice(0, 19);

  if (sub === '') {
    const status = query.get('support_status');
    const rows = mockSyncFailureReports
      .filter((r) => !status || r.support_status === status)
      .map(({ order_payload, context, ...row }) => row);
    return mockPaginate(rows, query);
  }

  const idMatch = sub.match(/^\/([^/]+)(\/payload|\/status|\/retry)?$/);
  if (!idMatch) return undefined;
  const report = mockSyncFailureReports.find((r) => r.id === idMatch[1]);
  if (!report) return null;
  const action = idMatch[2] || '';

  if (action === '' && method === 'GET') return { ...report };

  if (action === '/payload' && method === 'PUT') {
    if (report.support_status === 'resolved') syncFailureError('Report already resolved', 409);
    try { JSON.parse(body?.order_payload); } catch (e) { syncFailureError(`Invalid JSON payload: ${e.message}`, 422); }
    report.order_payload = body.order_payload;
    report.updated_at = nowStamp();
    return { ...report };
  }

  if (action === '/status' && method === 'PATCH') {
    if (report.support_status === 'resolved') {
      syncFailureError(`Invalid transition from resolved to ${body?.support_status}`, 422);
    }
    report.support_status = body?.support_status;
    report.resolution_notes = body?.resolution_notes ?? null;
    if (body?.support_status === 'pending') {
      report.resolved_by = null;
      report.resolved_username = null;
      report.resolved_at = null;
    } else {
      report.resolved_by = 1;
      report.resolved_username = 'admin.demo';
      report.resolved_at = nowStamp();
    }
    report.updated_at = nowStamp();
    return { ...report };
  }

  if (action === '/retry' && method === 'POST') {
    if (report.support_status === 'resolved') syncFailureError('Report already resolved', 409);
    report.attempts += 1;
    report.last_retry_at = nowStamp();
    report.updated_at = nowStamp();

    let payload = null;
    try {
      payload = JSON.parse(report.order_payload);
    } catch (e) {
      report.last_retry_error = `[validation] Invalid JSON payload: ${e.message}`;
      syncFailureError(`Invalid JSON payload: ${e.message}`, 422);
    }
    const errors = validateSyncFailurePayload(payload);
    if (Object.keys(errors).length) {
      report.last_retry_error = '[validation] Validation error';
      syncFailureError('Validation error', 422, errors);
    }

    report.support_status = 'resolved';
    report.last_retry_error = null;
    report.recovered_order_uuid = `demo-recovered-${report.id}`;
    report.resolved_by = 1;
    report.resolved_username = 'admin.demo';
    report.resolved_at = nowStamp();
    return {
      report: { ...report },
      order: { id: report.recovered_order_uuid, order_number: report.order_number },
    };
  }

  return undefined;
}

// ── Módulo de gastos ────────────────────────────────────────────────────────
// Catálogo de categorías en árbol, espejo del seeder global del backend
// (GlobalExpenseCategoryCatalogSeeder): 12 raíces con subcategorías, company_id null.
const EXPENSE_CATALOG = [
  ['Insumos y alimentos', ['Carnes y aves', 'Pescados y mariscos', 'Frutas y verduras', 'Granos y abarrotes', 'Lácteos y huevos', 'Panadería y repostería', 'Café e infusiones', 'Bebidas no alcohólicas', 'Bebidas alcohólicas', 'Mercado general']],
  ['Personal', ['Nómina y salarios', 'Seguridad social y prestaciones', 'Horas extra y bonificaciones', 'Uniformes y dotación', 'Capacitación', 'Alimentación de empleados']],
  ['Servicios públicos', ['Energía', 'Agua', 'Gas', 'Internet y telefonía', 'Televisión y streaming']],
  ['Arriendo e infraestructura', ['Arriendo del local', 'Administración', 'Bodegaje']],
  ['Mantenimiento y reparaciones', ['Equipos de cocina', 'Refrigeración', 'Locativas', 'Jardinería y zonas verdes', 'Piscina']],
  ['Aseo y desechables', ['Productos de aseo', 'Desechables y empaques', 'Control de plagas', 'Lavandería y mantelería']],
  ['Transporte y combustibles', ['Combustible', 'Domicilios y mensajería', 'Fletes y acarreos', 'Peajes y parqueaderos']],
  ['Equipos y menaje', ['Menaje y vajilla', 'Utensilios de cocina', 'Muebles y decoración', 'Tecnología y POS']],
  ['Marketing y ventas', ['Publicidad y pauta', 'Comisiones de plataformas', 'Eventos y promociones', 'Impresos y menús']],
  ['Administrativos y legales', ['Contabilidad y asesorías', 'Licencias y permisos', 'Seguros', 'Papelería', 'Software y suscripciones']],
  ['Impuestos y financieros', ['Impuestos y tasas', 'Comisiones bancarias y datáfono', 'Intereses y créditos']],
  ['Otros gastos', []],
];

export const mockExpenseCategories = (() => {
  const rows = [];
  let id = 0;
  EXPENSE_CATALOG.forEach(([name, children], i) => {
    const rootId = ++id;
    rows.push({ id: rootId, company_id: null, parent_id: null, depth: 0, path: String(rootId), name, description: null, position: i + 1, status: 1 });
    children.forEach((childName, j) => {
      const childId = ++id;
      rows.push({ id: childId, company_id: null, parent_id: rootId, depth: 1, path: `${rootId}/${childId}`, name: childName, description: null, position: j + 1, status: 1 });
    });
  });
  // Categoría propia de la compañía demo, colgada de una raíz global (company_id ≠ null).
  const own = ++id;
  const root = rows.find((r) => r.name === 'Insumos y alimentos');
  rows.push({ id: own, company_id: 'pid-001', parent_id: root.id, depth: 1, path: `${root.id}/${own}`, name: 'Insumos de finca', description: null, position: 99, status: 1 });
  return rows;
})();

export const mockExpenseSuppliers = [
  { id: 1, name: 'Distribuidora El Trébol' },
  { id: 2, name: 'Carnes La Dorada' },
  { id: 3, name: 'Surtifruver del Campo' },
];

// Catálogo de entidades de pago (espejo de piddet_orders.payment_method_entities): el nivel
// granular al que órdenes/POS registran cada pago + las dos exclusivas de gastos.
export const mockPaymentMethods = [
  { id: 'bancolombia', name: 'Ahorro a la mano Bancolombia' },
  { id: 'credit', name: 'Crédito (por pagar)' },
  { id: 'datafono', name: 'Datafono' },
  { id: 'daviplata', name: 'Daviplata' },
  { id: 'cash', name: 'Efectivo' },
  { id: 'nequi', name: 'Nequi' },
  { id: 'other', name: 'Otro' },
];

const paymentMethodName = (id) => mockPaymentMethods.find((p) => p.id === id)?.name ?? null;

const expenseCatByName = (name) => mockExpenseCategories.find((c) => c.name === name);
const expenseDayIso = (offset = 0) => new Date(Date.now() - offset * 864e5).toISOString().slice(0, 10);

export const mockExpenses = [
  {
    id: 1,
    expense_date: expenseDayIso(1),
    payment_method: 'cash',
    notes: 'Compra semanal de mercado',
    status: 1,
    supplier_id: 1,
    created_by: 1,
    created_by_name: 'Gerardo Cruz',
    created_at: new Date(Date.now() - 864e5).toISOString(),
    annulled_by_name: null,
    annulled_at: null,
    items: [
      { id: 1, expense_category_id: expenseCatByName('Carnes y aves').id, description: 'Res 10 kg', value: '120000.00', position: 1 },
      { id: 2, expense_category_id: expenseCatByName('Productos de aseo').id, description: 'Cloro 30 kg', value: '80000.00', position: 2 },
      { id: 3, expense_category_id: expenseCatByName('Granos y abarrotes').id, description: 'Arroz bulto 50 kg', value: '95000.00', position: 3 },
    ],
    files: [{ name: 'demo-factura-1.jpg', url: 'https://picsum.photos/seed/factura1/900/1200', thumbnail_url: 'https://picsum.photos/seed/factura1/300/400' }],
  },
  {
    id: 2,
    expense_date: expenseDayIso(3),
    payment_method: 'nequi',
    notes: null,
    status: 1,
    supplier_id: 3,
    created_by: 2,
    created_by_name: 'Laura Pérez',
    created_at: new Date(Date.now() - 3 * 864e5).toISOString(),
    annulled_by_name: null,
    annulled_at: null,
    items: [
      { id: 4, expense_category_id: expenseCatByName('Frutas y verduras').id, description: 'Fruta y verdura de la semana', value: '210000.00', position: 1 },
    ],
    files: [],
  },
  {
    id: 3,
    expense_date: expenseDayIso(6),
    payment_method: 'datafono',
    notes: 'Se anuló: quedó doble',
    status: 0,
    supplier_id: 2,
    created_by: 1,
    created_by_name: 'Gerardo Cruz',
    created_at: new Date(Date.now() - 6 * 864e5).toISOString(),
    annulled_by_name: 'Gerardo Cruz',
    annulled_at: new Date(Date.now() - 5 * 864e5).toISOString(),
    items: [
      { id: 5, expense_category_id: expenseCatByName('Carnes y aves').id, description: 'Pollo 20 kg', value: '160000.00', position: 1 },
    ],
    files: [],
  },
];

// Total del gasto = suma de líneas (como lo calcula el backend).
const expenseTotal = (e) => e.items.reduce((sum, it) => sum + Number(it.value), 0);

// Árbol anidado (raíces con children[]) a partir de la lista plana, como /expense-categories/tree.
function buildExpenseCategoryTree() {
  const byId = new Map();
  mockExpenseCategories.filter((c) => c.status === 1).forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots = [];
  byId.forEach((node) => {
    if (node.parent_id != null && byId.has(node.parent_id)) byId.get(node.parent_id).children.push(node);
    else roots.push(node);
  });
  return roots;
}

// Fila del listado (shape del backend: proveedor y conteo de líneas ya resueltos).
function decorateExpenseRow(e) {
  return {
    id: e.id,
    expense_date: e.expense_date,
    payment_method: e.payment_method,
    payment_method_name: paymentMethodName(e.payment_method),
    notes: e.notes,
    total: expenseTotal(e).toFixed(2),
    status: e.status,
    created_by: e.created_by,
    created_by_name: e.created_by_name,
    supplier_name: mockExpenseSuppliers.find((s) => s.id === e.supplier_id)?.name ?? null,
    items_count: e.items.length,
  };
}

// Detalle completo (líneas con categoría, fotos, proveedor), como GET /expenses/{id}.
function decorateExpenseDetail(e) {
  const supplier = mockExpenseSuppliers.find((s) => s.id === e.supplier_id);
  return {
    id: e.id,
    expense_date: e.expense_date,
    payment_method: e.payment_method,
    payment_method_name: paymentMethodName(e.payment_method),
    notes: e.notes,
    total: expenseTotal(e).toFixed(2),
    status: e.status,
    supplier: supplier ? { id: supplier.id, name: supplier.name } : null,
    created_by: e.created_by ?? 1,
    created_by_name: e.created_by_name,
    created_at: e.created_at,
    annulled_by_name: e.annulled_by_name,
    annulled_at: e.annulled_at,
    items: e.items.map((it) => {
      const cat = mockExpenseCategories.find((c) => c.id === it.expense_category_id);
      return {
        id: it.id,
        description: it.description,
        value: it.value,
        position: it.position,
        category: cat ? { id: cat.id, name: cat.name, path: cat.path } : null,
      };
    }),
    files: e.files,
  };
}

function resolveExpensesMock(path, query, { method = 'GET', body } = {}) {
  const scoped = path.match(/^\/companies\/[^/]+\/(.+)$/);
  if (!scoped) return undefined;
  const sub = scoped[1];
  let m;

  if (sub === 'payment-methods') return mockPaymentMethods;

  if (sub === 'expense-categories/tree') return buildExpenseCategoryTree();

  if (sub === 'expense-categories' && method === 'POST') {
    const parent = body.parent_id ? mockExpenseCategories.find((c) => c.id === Number(body.parent_id)) : null;
    const id = nextId(mockExpenseCategories);
    const row = {
      id,
      company_id: 'pid-001',
      parent_id: parent ? parent.id : null,
      depth: parent ? parent.depth + 1 : 0,
      path: parent ? `${parent.path}/${id}` : String(id),
      name: body.name,
      description: body.description || null,
      position: 99,
      status: 1,
    };
    mockExpenseCategories.push(row);
    return row;
  }

  if (sub === 'expense-suppliers') {
    const q = (query.get('q') || '').toLowerCase();
    return mockExpenseSuppliers.filter((s) => !q || s.name.toLowerCase().includes(q)).slice(0, 10);
  }

  // Usuarios que han registrado gastos, distintos y ordenados por nombre (como el backend).
  if (sub === 'expenses/creators') {
    const byId = new Map();
    mockExpenses.forEach((e) => { if (e.created_by != null) byId.set(e.created_by, e.created_by_name); });
    return [...byId.entries()]
      .map(([user_id, name]) => ({ user_id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Reporte de gastos: mismos agregados del backend, sumando a nivel de línea para que los
  // totales de todas las cards sean consistentes cuando se filtra por subárbol de categoría.
  if (sub === 'expenses/summary') {
    const from = query.get('date_from') || expenseDayIso(30);
    const to = query.get('date_to') || expenseDayIso(0);
    const createdBy = query.get('created_by') ? Number(query.get('created_by')) : null;
    const categoryId = query.get('category_id') ? Number(query.get('category_id')) : null;
    const categoryPath = categoryId ? mockExpenseCategories.find((c) => c.id === categoryId)?.path : null;
    const inSubtree = (catId) => {
      if (!categoryPath) return true;
      const path = mockExpenseCategories.find((c) => c.id === catId)?.path || '';
      return path === categoryPath || path.startsWith(`${categoryPath}/`);
    };

    const perExpense = mockExpenses
      .filter((e) => e.status === 1 && e.expense_date >= from && e.expense_date <= to)
      .filter((e) => createdBy == null || e.created_by === createdBy)
      .map((e) => {
        const lines = e.items.filter((it) => inSubtree(it.expense_category_id));
        return { expense: e, lines, total: lines.reduce((s, it) => s + Number(it.value), 0) };
      })
      .filter((x) => x.lines.length > 0);

    const byCat = new Map();
    perExpense.forEach(({ lines }) => lines.forEach((it) => {
      byCat.set(it.expense_category_id, (byCat.get(it.expense_category_id) || 0) + Number(it.value));
    }));
    const byRoot = new Map();
    let total = 0;
    byCat.forEach((sum, catId) => {
      const cat = mockExpenseCategories.find((c) => c.id === catId);
      const rootId = Number(cat.path.split('/')[0]);
      if (!byRoot.has(rootId)) byRoot.set(rootId, []);
      byRoot.get(rootId).push({ id: cat.id, name: cat.name, depth: cat.depth, total: sum });
      total += sum;
    });
    const roots = [...byRoot.entries()].map(([rootId, rows]) => ({
      id: rootId,
      name: mockExpenseCategories.find((c) => c.id === rootId)?.name ?? '',
      total: rows.reduce((s, r) => s + r.total, 0).toFixed(2),
      children: rows
        .filter((r) => r.id !== rootId)
        .sort((a, b) => b.total - a.total)
        .map((r) => ({ ...r, total: r.total.toFixed(2) })),
    })).sort((a, b) => Number(b.total) - Number(a.total));

    const distribution = (keyOf, labelOf) => {
      const groups = new Map();
      perExpense.forEach((x) => {
        const key = keyOf(x.expense);
        if (!groups.has(key)) groups.set(key, { ...labelOf(x.expense), total: 0, count: 0 });
        const g = groups.get(key);
        g.total += x.total;
        g.count += 1;
      });
      return [...groups.values()]
        .sort((a, b) => b.total - a.total)
        .map((g) => ({ ...g, total: g.total.toFixed(2) }));
    };

    const topRow = perExpense.reduce((mx, x) => (!mx || x.total > mx.total ? x : mx), null);

    return {
      date_from: from,
      date_to: to,
      total: total.toFixed(2),
      count: perExpense.length,
      average: (perExpense.length > 0 ? total / perExpense.length : 0).toFixed(2),
      top_expense: topRow
        ? {
            id: topRow.expense.id,
            expense_date: topRow.expense.expense_date,
            supplier_name: mockExpenseSuppliers.find((sp) => sp.id === topRow.expense.supplier_id)?.name ?? null,
            total: topRow.total.toFixed(2),
          }
        : null,
      by_payment_method: distribution(
        (e) => e.payment_method ?? '',
        (e) => ({ id: e.payment_method, name: paymentMethodName(e.payment_method) ?? 'Sin método' }),
      ),
      by_creator: distribution(
        (e) => e.created_by ?? '',
        (e) => ({ user_id: e.created_by, name: e.created_by_name ?? 'Sin usuario' }),
      ),
      roots,
    };
  }

  if (sub === 'expenses') {
    if (method === 'POST') {
      let supplierId = body.supplier_id ? Number(body.supplier_id) : null;
      if (!supplierId && body.supplier_name) {
        const name = body.supplier_name.trim();
        const found = mockExpenseSuppliers.find((s) => s.name.toLowerCase() === name.toLowerCase());
        supplierId = found ? found.id : nextId(mockExpenseSuppliers);
        if (!found) mockExpenseSuppliers.push({ id: supplierId, name });
      }
      const id = nextId(mockExpenses);
      let itemId = mockExpenses.flatMap((e) => e.items).reduce((mx, it) => Math.max(mx, it.id), 0);
      const row = {
        id,
        expense_date: body.expense_date,
        payment_method: body.payment_method,
        notes: body.notes || null,
        status: 1,
        supplier_id: supplierId,
        created_by: 1,
        created_by_name: mockUser.name,
        created_at: new Date().toISOString(),
        annulled_by_name: null,
        annulled_at: null,
        items: (body.items || []).map((it, i) => ({
          id: ++itemId,
          expense_category_id: Number(it.expense_category_id),
          description: it.description,
          value: Number(it.value).toFixed(2),
          position: i + 1,
        })),
        // En demo no hay S3: se guarda el name de referencia con url null.
        files: (body.files || []).map((name) => ({ name, url: null, thumbnail_url: null })),
      };
      mockExpenses.unshift(row);
      return decorateExpenseDetail(row);
    }
    let rows = mockExpenses.filter((e) => {
      const from = query.get('date_from');
      const to = query.get('date_to');
      if (from && e.expense_date < from) return false;
      if (to && e.expense_date > to) return false;
      const payment = query.get('payment_method');
      if (payment && e.payment_method !== payment) return false;
      const status = query.get('status');
      if (status !== null && status !== '' && String(e.status) !== status) return false;
      const creator = query.get('created_by');
      if (creator && String(e.created_by) !== creator) return false;
      const catId = query.get('category_id');
      if (catId) {
        const cat = mockExpenseCategories.find((c) => c.id === Number(catId));
        if (!cat) return false;
        const inSubtree = (it) => {
          const c = mockExpenseCategories.find((x) => x.id === it.expense_category_id);
          return c && (c.path === cat.path || c.path.startsWith(cat.path + '/'));
        };
        if (!e.items.some(inSubtree)) return false;
      }
      return true;
    });
    rows = rows
      .sort((a, b) => (a.expense_date === b.expense_date ? b.id - a.id : (a.expense_date < b.expense_date ? 1 : -1)))
      .map(decorateExpenseRow);
    return mockPaginate(rows, query);
  }

  m = sub.match(/^expenses\/(\d+)\/annul$/);
  if (m && method === 'PATCH') {
    const e = mockExpenses.find((x) => x.id === Number(m[1]));
    if (!e || e.status !== 1) return null;
    e.status = 0;
    e.annulled_by_name = mockUser.name;
    e.annulled_at = new Date().toISOString();
    return decorateExpenseDetail(e);
  }

  // Fotos del gasto (solo activos): POST adjunta names ya "subidos"; DELETE quita por ?name=.
  m = sub.match(/^expenses\/(\d+)\/files$/);
  if (m) {
    const e = mockExpenses.find((x) => x.id === Number(m[1]));
    if (!e || e.status !== 1) return null;
    if (method === 'POST') {
      const names = (body?.files || []).slice(0, Math.max(0, 10 - e.files.length));
      // En demo no hay S3: se usa una imagen de muestra como url firmada.
      names.forEach((name) => e.files.push({
        name,
        url: `https://picsum.photos/seed/${encodeURIComponent(name)}/600/800`,
        thumbnail_url: `https://picsum.photos/seed/${encodeURIComponent(name)}/150/200`,
      }));
      return decorateExpenseDetail(e);
    }
    if (method === 'DELETE') {
      const name = query.get('name');
      e.files = e.files.filter((f) => f.name !== name);
      return decorateExpenseDetail(e);
    }
  }

  m = sub.match(/^expenses\/(\d+)$/);
  if (m) {
    const e = mockExpenses.find((x) => x.id === Number(m[1]));
    return e ? decorateExpenseDetail(e) : null;
  }

  return undefined;
}

// ── Módulo de turnos de caja (datos en memoria; las mutaciones persisten durante la sesión) ──
// Replican la forma del backend: turno GLOBAL o EMPLOYEE con base de dinero, movimientos con
// monto/método denormalizados (una venta con pago mixto genera una fila por pago) y cierre con
// arqueo (counted/expected/difference + ajuste). El usuario demo (id 1) es admin del módulo.
const shiftDateIso = (dayOffset = 0, time = '09:00:00') =>
  `${new Date(Date.now() - dayOffset * 864e5).toISOString().slice(0, 10)} ${time}`;

export const mockShifts = [
  {
    id: 1, type: 'GLOBAL', status: 'OPEN', base_amount: '200000.00',
    assigned_user_id: null, assigned_user_name: null,
    opened_by: 1, opened_by_name: 'Gerardo Cruz', opened_at: shiftDateIso(0, '08:00:00'),
    counted_amount: null, expected_amount: null, difference: null, closing_notes: null,
    closed_by: null, closed_by_name: null, closed_at: null,
  },
  {
    id: 2, type: 'EMPLOYEE', status: 'OPEN', base_amount: '100000.00',
    assigned_user_id: 2, assigned_user_name: 'María López',
    opened_by: 1, opened_by_name: 'Gerardo Cruz', opened_at: shiftDateIso(0, '08:15:00'),
    counted_amount: null, expected_amount: null, difference: null, closing_notes: null,
    closed_by: null, closed_by_name: null, closed_at: null,
  },
  {
    id: 3, type: 'EMPLOYEE', status: 'CLOSED', base_amount: '100000.00',
    assigned_user_id: 2, assigned_user_name: 'María López',
    opened_by: 1, opened_by_name: 'Gerardo Cruz', opened_at: shiftDateIso(1, '08:00:00'),
    counted_amount: '575000.00', expected_amount: '580000.00', difference: '-5000.00',
    closing_notes: 'Faltó cambio de un billete.', closed_by: 2, closed_by_name: 'María López',
    closed_at: shiftDateIso(1, '18:00:00'),
  },
  {
    id: 4, type: 'GLOBAL', status: 'CLOSED', base_amount: '200000.00',
    assigned_user_id: null, assigned_user_name: null,
    opened_by: 1, opened_by_name: 'Gerardo Cruz', opened_at: shiftDateIso(1, '07:30:00'),
    counted_amount: '1240000.00', expected_amount: '1225000.00', difference: '15000.00',
    closing_notes: null, closed_by: 1, closed_by_name: 'Gerardo Cruz',
    closed_at: shiftDateIso(1, '20:00:00'),
  },
];

export const mockShiftMovements = [
  // Turno GLOBAL abierto (1): ventas de hoy (una con pago mixto) + un gasto.
  { id: 1, shift_id: 1, resource_type: 'order', resource_id: 'ord-9001', resource_label: 'F-0091', payment_method: 'cash', amount: '85000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(0, '10:05:00') },
  { id: 2, shift_id: 1, resource_type: 'order', resource_id: 'ord-9002', resource_label: 'F-0092', payment_method: 'cash', amount: '40000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(0, '11:20:00') },
  { id: 3, shift_id: 1, resource_type: 'order', resource_id: 'ord-9002', resource_label: 'F-0092', payment_method: 'datafono', amount: '32000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(0, '11:20:00') },
  { id: 4, shift_id: 1, resource_type: 'order', resource_id: 'ord-9003', resource_label: 'F-0093', payment_method: 'nequi', amount: '56000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(0, '12:40:00') },
  { id: 5, shift_id: 1, resource_type: 'expense', resource_id: '1', resource_label: 'Distribuidora La Cosecha', payment_method: 'cash', amount: '60000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(0, '12:00:00') },
  // Venta cancelada con el turno abierto: queda excluida del balance (status 0).
  { id: 6, shift_id: 1, resource_type: 'order', resource_id: 'ord-9004', resource_label: 'F-0094', payment_method: 'cash', amount: '25000.00', status: 0, annulled_at: shiftDateIso(0, '13:00:00'), occurred_at: shiftDateIso(0, '12:50:00') },
  // Turno EMPLOYEE abierto (2): las ventas del cajero también cuentan en el global.
  { id: 7, shift_id: 2, resource_type: 'order', resource_id: 'ord-9001', resource_label: 'F-0091', payment_method: 'cash', amount: '85000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(0, '10:05:00') },
  { id: 8, shift_id: 2, resource_type: 'order', resource_id: 'ord-9003', resource_label: 'F-0093', payment_method: 'nequi', amount: '56000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(0, '12:40:00') },
  // Turno EMPLOYEE cerrado (3): con ajuste de faltante.
  { id: 9, shift_id: 3, resource_type: 'order', resource_id: 'ord-8001', resource_label: 'F-0081', payment_method: 'cash', amount: '300000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(1, '11:00:00') },
  { id: 10, shift_id: 3, resource_type: 'order', resource_id: 'ord-8002', resource_label: 'F-0082', payment_method: 'datafono', amount: '180000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(1, '13:30:00') },
  { id: 11, shift_id: 3, resource_type: 'adjustment', resource_id: null, resource_label: 'Faltante de caja · Gasto #2', reference_type: 'expense', reference_id: '2', payment_method: 'cash', amount: '-5000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(1, '18:00:00') },
  // Turno GLOBAL cerrado (4): con ajuste de sobrante.
  { id: 12, shift_id: 4, resource_type: 'order', resource_id: 'ord-8001', resource_label: 'F-0081', payment_method: 'cash', amount: '300000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(1, '11:00:00') },
  { id: 13, shift_id: 4, resource_type: 'order', resource_id: 'ord-8002', resource_label: 'F-0082', payment_method: 'datafono', amount: '180000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(1, '13:30:00') },
  { id: 14, shift_id: 4, resource_type: 'order', resource_id: 'ord-8003', resource_label: 'F-0083', payment_method: 'cash', amount: '605000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(1, '16:10:00') },
  { id: 15, shift_id: 4, resource_type: 'expense', resource_id: '2', resource_label: 'Ferretería El Tornillo', payment_method: 'cash', amount: '60000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(1, '15:00:00') },
  { id: 16, shift_id: 4, resource_type: 'adjustment', resource_id: null, resource_label: 'Sobrante de caja · A0000001', reference_type: 'order', reference_id: 'ord-8001', payment_method: 'cash', amount: '15000.00', status: 1, annulled_at: null, occurred_at: shiftDateIso(1, '20:00:00') },
];

const shiftMovementRow = (mv) => ({ ...mv, payment_method_name: paymentMethodName(mv.payment_method) });

// Balance del turno replicando el backend: SUM por tipo y método sobre movimientos activos;
// expected = base + ventas (todos los métodos) − gastos. Los ajustes nunca entran en expected.
function buildShiftBalance(shift) {
  const active = mockShiftMovements.filter((mv) => mv.shift_id === shift.id && mv.status === 1);
  const money = (n) => n.toFixed(2);

  const section = (type) => {
    const rows = active.filter((mv) => mv.resource_type === type);
    const byMethod = new Map();
    rows.forEach((mv) => {
      const key = mv.payment_method || '';
      byMethod.set(key, (byMethod.get(key) || 0) + Number(mv.amount));
    });
    return {
      total: money(rows.reduce((s, mv) => s + Number(mv.amount), 0)),
      count: new Set(rows.map((mv) => mv.resource_id ?? `mv-${mv.id}`)).size,
      by_method: [...byMethod.entries()].map(([id, total]) => ({
        payment_method: id || null,
        payment_method_name: paymentMethodName(id),
        total: money(total),
      })),
    };
  };

  const sales = section('order');
  const expenses = section('expense');
  return {
    base_amount: shift.base_amount,
    sales,
    expenses,
    adjustments: section('adjustment'),
    expected_amount: money(Number(shift.base_amount) + Number(sales.total) - Number(expenses.total)),
  };
}

const decorateShiftDetail = (shift) => ({
  ...shift,
  balance: buildShiftBalance(shift),
  movements: mockShiftMovements
    .filter((mv) => mv.shift_id === shift.id)
    .map(shiftMovementRow),
});

// Simula los códigos de conflicto del backend: el HttpClient del modo demo propaga el throw y
// las pantallas muestran err.message, igual que con un 409 real.
const shiftConflict = (message) => { throw Object.assign(new Error(message), { status: 409 }); };

function resolveShiftsMock(path, query, { method = 'GET', body } = {}) {
  const scoped = path.match(/^\/companies\/[^/]+\/(.+)$/);
  if (!scoped) return undefined;
  const sub = scoped[1];
  let m;

  // Los turnos GLOBAL solo son visibles con shift-global-admin (el backend aplica la misma
  // regla: sin el permiso ni siquiera el admin del módulo los lista ni abre su detalle).
  const canGlobal = mockPermissions.permissions.includes('shift-global-admin');
  const visible = (sh) => sh.type !== 'GLOBAL' || canGlobal;

  if (sub === 'shifts/current') {
    return {
      global: (canGlobal && mockShifts.find((sh) => sh.type === 'GLOBAL' && sh.status === 'OPEN')) || null,
      mine: mockShifts.find((sh) => sh.type === 'EMPLOYEE' && sh.status === 'OPEN' && sh.assigned_user_id === 1) || null,
      open_employee_count: mockShifts.filter((sh) => sh.type === 'EMPLOYEE' && sh.status === 'OPEN').length,
    };
  }

  if (sub === 'shifts' && method === 'POST') {
    const type = body?.type;
    if (type === 'GLOBAL' && mockShifts.some((sh) => sh.type === 'GLOBAL' && sh.status === 'OPEN')) {
      shiftConflict('Ya hay un turno global abierto');
    }
    const assignedId = type === 'EMPLOYEE' ? Number(body?.assigned_user_id || 1) : null;
    if (type === 'EMPLOYEE'
      && mockShifts.some((sh) => sh.type === 'EMPLOYEE' && sh.status === 'OPEN' && sh.assigned_user_id === assignedId)) {
      shiftConflict('El empleado ya tiene un turno abierto');
    }
    const assigned = assignedId ? mockUsers.find((u) => u.id === assignedId) : null;
    const row = {
      id: nextId(mockShifts), type, status: 'OPEN',
      base_amount: Number(body?.base_amount || 0).toFixed(2),
      assigned_user_id: assignedId, assigned_user_name: assigned?.name ?? (assignedId ? `Usuario ${assignedId}` : null),
      opened_by: 1, opened_by_name: 'Gerardo Cruz',
      opened_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      counted_amount: null, expected_amount: null, difference: null, closing_notes: null,
      closed_by: null, closed_by_name: null, closed_at: null,
    };
    mockShifts.unshift(row);
    return decorateShiftDetail(row);
  }

  if (sub === 'shifts') {
    let rows = mockShifts.filter(visible);
    const status = query.get('status');
    const type = query.get('type');
    const from = query.get('date_from');
    const to = query.get('date_to');
    if (status) rows = rows.filter((sh) => sh.status === status);
    if (type) rows = rows.filter((sh) => sh.type === type);
    if (from) rows = rows.filter((sh) => sh.opened_at >= `${from} 00:00:00`);
    if (to) rows = rows.filter((sh) => sh.opened_at <= `${to} 23:59:59`);
    rows.sort((a, b) => (a.status === b.status ? b.opened_at.localeCompare(a.opened_at) : (a.status === 'OPEN' ? -1 : 1)));
    return mockPaginate(rows, query);
  }

  m = sub.match(/^shifts\/(\d+)\/balance$/);
  if (m) {
    const sh = mockShifts.find((x) => x.id === Number(m[1]) && visible(x));
    return sh ? buildShiftBalance(sh) : null;
  }

  m = sub.match(/^shifts\/(\d+)\/close$/);
  if (m && method === 'POST') {
    const sh = mockShifts.find((x) => x.id === Number(m[1]));
    if (!sh) return null;
    if (sh.status !== 'OPEN') shiftConflict('El turno ya está cerrado');
    if (sh.type === 'GLOBAL'
      && mockShifts.some((x) => x.type === 'EMPLOYEE' && x.status === 'OPEN')) {
      shiftConflict('No se puede cerrar el turno global con turnos de empleado abiertos');
    }
    const balance = buildShiftBalance(sh);
    const counted = Number(body?.counted_amount || 0);
    const difference = counted - Number(balance.expected_amount);
    if (difference !== 0) {
      // Como en el backend: el sobrante se factura y el faltante se registra como gasto, y el
      // ajuste guarda la referencia al documento (sin sumarlo al balance del turno).
      const doc = difference > 0
        ? { reference_type: 'order', reference_id: `ord-adj-${sh.id}`, label: `A${String(sh.id).padStart(7, '0')}` }
        : { reference_type: 'expense', reference_id: String(nextId(mockExpenses)), label: `Gasto #${nextId(mockExpenses)}` };
      mockShiftMovements.push({
        id: nextId(mockShiftMovements), shift_id: sh.id, resource_type: 'adjustment', resource_id: null,
        resource_label: `${difference > 0 ? 'Sobrante de caja' : 'Faltante de caja'} · ${doc.label}`,
        reference_type: doc.reference_type, reference_id: doc.reference_id,
        payment_method: 'cash',
        amount: difference.toFixed(2), status: 1, annulled_at: null,
        occurred_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    sh.status = 'CLOSED';
    sh.counted_amount = counted.toFixed(2);
    sh.expected_amount = balance.expected_amount;
    sh.difference = difference.toFixed(2);
    sh.closing_notes = body?.notes || null;
    sh.closed_by = 1;
    sh.closed_by_name = 'Gerardo Cruz';
    sh.closed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return decorateShiftDetail(sh);
  }

  m = sub.match(/^shifts\/(\d+)\/base$/);
  if (m && method === 'PUT') {
    const sh = mockShifts.find((x) => x.id === Number(m[1]) && visible(x));
    if (!sh) return null;
    if (sh.status !== 'OPEN') shiftConflict('El turno no está abierto');
    sh.base_amount = Number(body?.base_amount || 0).toFixed(2);
    return decorateShiftDetail(sh);
  }

  m = sub.match(/^shifts\/(\d+)\/cancel$/);
  if (m && method === 'POST') {
    const sh = mockShifts.find((x) => x.id === Number(m[1]) && visible(x));
    if (!sh) return null;
    if (sh.status !== 'OPEN') shiftConflict('El turno no está abierto');
    sh.status = 'CANCELLED';
    sh.cancellation_reason = body?.reason || null;
    sh.cancelled_by = 1;
    sh.cancelled_by_name = 'Gerardo Cruz';
    sh.cancelled_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return decorateShiftDetail(sh);
  }

  m = sub.match(/^shifts\/(\d+)$/);
  if (m) {
    const sh = mockShifts.find((x) => x.id === Number(m[1]) && visible(x));
    return sh ? decorateShiftDetail(sh) : null;
  }

  return undefined;
}

// Tokens de agentes de IA (company-scoped: /companies/{company}/ai-agent-tokens[/{id}]).
// POST imita al backend: devuelve el token plano una única vez junto al registro creado.
function resolveAiTokensMock(path, { method = 'GET', body } = {}) {
  const m = path.match(/^\/companies\/[^/]+\/ai-agent-tokens(?:\/(\d+))?$/);
  if (!m) return undefined;
  const tokenId = m[1] ? Number(m[1]) : null;

  if (method === 'DELETE' && tokenId) {
    const tk = mockAgentTokens.find((t) => t.id === tokenId);
    if (!tk) return null;
    tk.status = 0;
    return { revoked: true };
  }

  if (method === 'POST') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const plain = `agt_${Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`;
    const days = Number(body?.expires_in_days) || 365;
    const row = {
      id: nextId(mockAgentTokens),
      company_id: 'pid-001',
      name: body?.name || 'Token',
      token_prefix: plain.slice(0, 12),
      status: 1,
      expires_at: new Date(Date.now() + days * 86400000).toISOString().slice(0, 19),
      last_used_at: null,
      created_at: new Date().toISOString().slice(0, 19),
    };
    mockAgentTokens.unshift(row);
    return { token: plain, agent_token: row };
  }

  return [...mockAgentTokens];
}

// ── Módulo de reservas de hospedaje (demo) ──────────────────────────────────
const mockRentableUnitTypes = [
  { id: 1, company_id: null, name: 'Cabaña', icon: 'fas fa-house-chimney' },
  { id: 2, company_id: null, name: 'Habitación', icon: 'fas fa-bed' },
  { id: 3, company_id: null, name: 'Glamping', icon: 'fas fa-tent' },
  { id: 4, company_id: null, name: 'Apartamento', icon: 'fas fa-building' },
  { id: 5, company_id: null, name: 'Casa', icon: 'fas fa-house' },
  { id: 6, company_id: null, name: 'Lugar de eventos', icon: 'fas fa-champagne-glasses' },
];

// Items tipo SERVICE del catálogo de productos: facturan el hospedaje de las unidades y los
// servicios adicionales de las reservas. Solo los marcados `reservable` se ofrecen al reservar.
const mockServiceItems = [
  { id: 901, name: 'Hospedaje cabaña', description: 'Noche de hospedaje en cabaña', price: '320000.00', reservable: false },
  { id: 902, name: 'Hospedaje habitación', description: 'Noche de hospedaje en habitación', price: '180000.00', reservable: false },
  { id: 903, name: 'Cena romántica', description: 'Cena para dos con decoración', price: '120000.00', reservable: true },
  { id: 904, name: 'Decoración de aniversario', description: 'Globos, pétalos y velas', price: '80000.00', reservable: true },
  { id: 905, name: 'Membresía gimnasio', description: 'Pago de suscripción mensual de gimnasio', price: '90000.00', reservable: false },
];

const serviceItemName = (id) => mockServiceItems.find((it) => it.id === Number(id))?.name || null;

// Catálogo facturable en la cuenta de una reserva: servicios + productos (para los cargos).
const mockConsumableItems = [
  ...mockServiceItems.map((it) => ({ ...it, type: 'SERVICE' })),
  { id: 905, name: 'Hamburguesa de la casa', description: 'Con papas rústicas', price: '32000.00', type: 'PRODUCT' },
  { id: 906, name: 'Plato de carne a la parrilla', description: 'Con guarnición', price: '48000.00', type: 'PRODUCT' },
  { id: 907, name: 'Limonada de coco', description: null, price: '12000.00', type: 'PRODUCT' },
];

// Fotos de ejemplo de las unidades (en demo no hay S3; se sirven de picsum como el resto del mock).
const demoUnitFile = (seed, spaceId = null, position = 1) => ({
  name: `demo-unit-${seed}.jpg`,
  rentable_unit_space_id: spaceId,
  url: `https://picsum.photos/seed/${seed}/1200/900`,
  thumbnail_url: `https://picsum.photos/seed/${seed}/300/220`,
  position,
});

const mockRentableUnits = [
  {
    id: 1, rentable_unit_type_id: 1, type_name: 'Cabaña', name: 'Cabaña El Roble',
    description: 'Cabaña de montaña con vista al valle.', capacity: 4, included_guests: 2, base_price_per_night: '320000.00',
    check_in_time: '15:00', check_out_time: '12:00',
    item_id: 901, item_name: 'Hospedaje cabaña',
    position: 1, status: 1,
    files: [
      demoUnitFile('roble-1', null, 1),
      demoUnitFile('roble-2', null, 2),
      demoUnitFile('roble-3', null, 3),
      demoUnitFile('roble-hab-1', 1, 4),
      demoUnitFile('roble-hab-2', 1, 5),
      demoUnitFile('roble-sala-1', 2, 6),
    ],
    files_count: 6,
    inclusions: [
      { id: 1, name: 'Desayuno', description: 'Tipo americano, servido de 7 a 10 a. m.', position: 1 },
      { id: 2, name: 'Fogata', description: 'Con vino de cortesía', position: 2 },
      { id: 3, name: 'Ingreso al sitio', description: null, position: 3 },
      { id: 4, name: 'Piscina', description: 'Abierta de 9 a. m. a 6 p. m.', position: 4 },
    ],
    spaces: [
      { id: 1, name: 'Habitación principal', description: 'Cama queen, A/C, baño privado', position: 1, files: [] },
      { id: 2, name: 'Sala de estar', description: 'Sofá cama, chimenea', position: 2, files: [] },
    ],
  },
  {
    id: 2, rentable_unit_type_id: 2, type_name: 'Habitación', name: 'Habitación Colibrí',
    description: 'Habitación doble estándar.', capacity: 2, included_guests: 2, base_price_per_night: '180000.00',
    check_in_time: '14:00', check_out_time: '11:00',
    item_id: 902, item_name: 'Hospedaje habitación',
    position: 2, status: 1,
    files: [], files_count: 0, spaces: [], inclusions: [],
  },
];

const mockGuests = [
  { user_id: 501, first_name: 'Laura', last_name: 'Martínez', name: 'Laura Martínez', email: 'laura@example.com', phone_code: '57', phone_number: '3001112233', id_type_id: 1, id_number: '43567890' },
];

const mockReservations = [];
let mockReservationOrderSeq = 0;

// Vista de listado (sin espacios ni fotos completas, con conteo).
const unitRow = (u) => ({
  id: u.id, rentable_unit_type_id: u.rentable_unit_type_id, name: u.name, type_name: u.type_name,
  capacity: u.capacity, included_guests: u.included_guests, base_price_per_night: u.base_price_per_night, position: u.position, status: u.status,
  files_count: (u.files || []).length,
});

function resolveReservationsMock(path, query, { method = 'GET', body } = {}) {
  const scoped = path.match(/^\/companies\/[^/]+\/(.+)$/);
  if (!scoped) return undefined;
  const sub = scoped[1];

  if (sub === 'rentable-unit-types') return mockRentableUnitTypes;

  // Disponibilidad de unidades para un rango: /rentable-units/availability
  if (sub === 'rentable-units/availability') {
    const checkIn = query.get('check_in');
    const checkOut = query.get('check_out');
    const busy = new Set(mockReservations
      .filter((r) => [1, 2, 3].includes(r.status) && r.check_in_date < checkOut && r.check_out_date > checkIn)
      .map((r) => r.rentable_unit_id));
    return mockRentableUnits.filter((u) => u.status === 1).map((u) => ({
      id: u.id, name: u.name, rentable_unit_type_id: u.rentable_unit_type_id, type_name: u.type_name,
      capacity: u.capacity, included_guests: u.included_guests, base_price_per_night: u.base_price_per_night,
      available: !busy.has(u.id),
    }));
  }

  // Items de servicio del catálogo de productos: /service-items[?reservable=1]
  if (sub === 'service-items') {
    const reservableOnly = query.get('reservable') === '1';
    return mockServiceItems.filter((it) => !reservableOnly || it.reservable);
  }

  // Catálogo facturable en la cuenta de una reserva (productos + servicios): /consumable-items[?q=]
  if (sub === 'consumable-items') {
    const q = (query.get('q') || '').toLowerCase();
    return mockConsumableItems.filter((it) => !q || it.name.toLowerCase().includes(q));
  }

  // Huéspedes: /guests[?q=] y /guests/{userId}
  if (sub === 'guests') {
    const q = (query.get('q') || '').toLowerCase();
    return mockGuests.filter((g) => !q || g.name.toLowerCase().includes(q) || (g.id_number || '').includes(q) || (g.phone_number || '').includes(q));
  }
  let gm = sub.match(/^guests\/(\d+)$/);
  if (gm) {
    const userId = Number(gm[1]);
    const g = mockGuests.find((x) => x.user_id === userId);
    if (g) return { ...g, birthdate: null, origin_city: null, destination_city: null, id_document_url: null };
    // Acompañantes creados al vuelo en reservas demo: perfil mínimo a partir de la reserva.
    for (const r of mockReservations) {
      const rg = (r.guests || []).find((x) => x.user_id === userId);
      if (rg) {
        return {
          user_id: userId, first_name: rg.first_name, last_name: rg.last_name, name: rg.name,
          email: null, phone_code: null, phone_number: null, id_type_id: 1, id_number: rg.document_number,
          birthdate: null, origin_city: null, destination_city: null, id_document_url: null,
        };
      }
    }
    return null;
  }

  // Reservas
  const reservationResult = resolveReservationsCore(sub, query, { method, body });
  if (reservationResult !== undefined) return reservationResult;

  // Fotos de una unidad/espacio: /rentable-units/{id}/files
  let m = sub.match(/^rentable-units\/(\d+)\/files$/);
  if (m) {
    const unit = mockRentableUnits.find((u) => u.id === Number(m[1]));
    if (!unit) return null;
    if (method === 'POST') {
      const spaceId = body?.space_id ?? null;
      (body?.files || []).forEach((name, i) => {
        unit.files.push({ name, rentable_unit_space_id: spaceId, url: null, thumbnail_url: null, position: unit.files.length + i + 1 });
      });
      syncUnitSpaceFiles(unit);
      return unit;
    }
    if (method === 'DELETE') {
      const name = query.get('name');
      unit.files = unit.files.filter((f) => f.name !== name);
      syncUnitSpaceFiles(unit);
      return unit;
    }
  }

  // Qué incluye la tarifa: /rentable-units/{id}/inclusions[/{inclusionId}]
  m = sub.match(/^rentable-units\/(\d+)\/inclusions(?:\/(\d+))?$/);
  if (m) {
    const unit = mockRentableUnits.find((u) => u.id === Number(m[1]));
    if (!unit) return null;
    unit.inclusions = unit.inclusions || [];
    const inclusionId = m[2] ? Number(m[2]) : null;
    if (method === 'POST') {
      const id = (unit.inclusions.reduce((mx, inc) => Math.max(mx, inc.id), 0) || 0) + 1;
      unit.inclusions.push({ id, name: body.name, description: body.description || null, position: unit.inclusions.length + 1 });
      return unitDetail(unit);
    }
    if (method === 'PUT' && inclusionId) {
      const inc = unit.inclusions.find((x) => x.id === inclusionId);
      if (inc) { inc.name = body.name; inc.description = body.description || null; }
      return unitDetail(unit);
    }
    if (method === 'DELETE' && inclusionId) {
      unit.inclusions = unit.inclusions.filter((x) => x.id !== inclusionId);
      return unitDetail(unit);
    }
  }

  // Espacios: /rentable-units/{id}/spaces[/{spaceId}]
  m = sub.match(/^rentable-units\/(\d+)\/spaces(?:\/(\d+))?$/);
  if (m) {
    const unit = mockRentableUnits.find((u) => u.id === Number(m[1]));
    if (!unit) return null;
    const spaceId = m[2] ? Number(m[2]) : null;
    if (method === 'POST') {
      const id = (unit.spaces.reduce((mx, sp) => Math.max(mx, sp.id), 0) || 0) + 1;
      unit.spaces.push({ id, name: body.name, description: body.description || null, position: unit.spaces.length + 1, files: [] });
      return unit;
    }
    if (method === 'PUT' && spaceId) {
      const sp = unit.spaces.find((x) => x.id === spaceId);
      if (sp) { sp.name = body.name; sp.description = body.description || null; }
      return unit;
    }
    if (method === 'DELETE' && spaceId) {
      unit.files = unit.files.filter((f) => f.rentable_unit_space_id !== spaceId);
      unit.spaces = unit.spaces.filter((x) => x.id !== spaceId);
      syncUnitSpaceFiles(unit);
      return unit;
    }
  }

  // Unidad concreta: /rentable-units/{id} (+ /status)
  m = sub.match(/^rentable-units\/(\d+)(\/status)?$/);
  if (m) {
    const unit = mockRentableUnits.find((u) => u.id === Number(m[1]));
    if (!unit) return null;
    if (m[2] === '/status' && method === 'PATCH') {
      unit.status = Number(body.status);
      return unitDetail(unit);
    }
    if (method === 'PUT') {
      Object.assign(unit, {
        rentable_unit_type_id: body.rentable_unit_type_id ?? unit.rentable_unit_type_id,
        name: body.name ?? unit.name,
        description: body.description ?? unit.description,
        capacity: body.capacity ?? unit.capacity,
        included_guests: body.included_guests ?? unit.included_guests,
        base_price_per_night: body.base_price_per_night ?? unit.base_price_per_night,
        item_id: body.item_id ?? unit.item_id,
      });
      unit.type_name = mockRentableUnitTypes.find((ty) => ty.id === Number(unit.rentable_unit_type_id))?.name || unit.type_name;
      unit.item_name = serviceItemName(unit.item_id);
      return unitDetail(unit);
    }
    return unitDetail(unit); // GET detalle
  }

  // Listado / creación: /rentable-units
  if (sub === 'rentable-units') {
    if (method === 'POST') {
      const id = (mockRentableUnits.reduce((mx, u) => Math.max(mx, u.id), 0) || 0) + 1;
      const type = mockRentableUnitTypes.find((ty) => ty.id === Number(body.rentable_unit_type_id));
      const unit = {
        id, rentable_unit_type_id: Number(body.rentable_unit_type_id), type_name: type?.name || '',
        name: body.name, description: body.description || null, capacity: Number(body.capacity) || 1,
        included_guests: Math.min(Number(body.included_guests) || 1, Number(body.capacity) || 1),
        base_price_per_night: Number(body.base_price_per_night).toFixed(2),
        item_id: Number(body.item_id) || null, item_name: serviceItemName(body.item_id),
        position: id, status: 1,
        files: (body.files || []).map((name, i) => ({ name, rentable_unit_space_id: null, url: null, thumbnail_url: null, position: i + 1 })),
        spaces: (body.spaces || []).map((sp, i) => ({ id: i + 1, name: sp.name, description: sp.description || null, position: i + 1, files: [] })),
        inclusions: (body.inclusions || []).map((inc, i) => ({ id: i + 1, name: inc.name, description: inc.description || null, position: i + 1 })),
      };
      mockRentableUnits.push(unit);
      return unitDetail(unit);
    }
    let rows = mockRentableUnits.map(unitRow);
    const typeId = query.get('rentable_unit_type_id');
    if (typeId) rows = rows.filter((u) => String(u.rentable_unit_type_id) === typeId);
    const status = query.get('status');
    if (status !== null && status !== '') rows = rows.filter((u) => String(u.status) === status);
    const search = (query.get('_search') || '').toLowerCase();
    if (search) rows = rows.filter((u) => u.name.toLowerCase().includes(search));
    return mockPaginate(rows, query);
  }

  return undefined;
}

// En demo no hay S3: las fotos por espacio se reparten desde unit.files según rentable_unit_space_id.
function syncUnitSpaceFiles(unit) {
  unit.spaces.forEach((sp) => {
    sp.files = unit.files.filter((f) => f.rentable_unit_space_id === sp.id);
  });
}

function unitDetail(unit) {
  syncUnitSpaceFiles(unit);
  return {
    ...unit,
    files: unit.files.filter((f) => f.rentable_unit_space_id == null),
  };
}

// Núcleo del mock de reservas (todas las subrutas /reservations…). Devuelve undefined si no matchea.
function resolveReservationsCore(sub, query, { method, body }) {
  const detail = (r) => {
    const activePayments = r.payments.filter((p) => p.status === 1);
    const paid = activePayments.reduce((s, p) => s + Number(p.value), 0);
    const chargesTotal = (r.charges || []).reduce((s, ch) => s + Number(ch.total), 0);
    const accountTotal = Number(r.total) + chargesTotal;
    // Igual que el backend: lo facturado a la cuenta se suma desde las órdenes (soporta
    // reaperturas) y los fondos disponibles son pagos activos sin factura ni consolidar.
    const advancesInvoiced = (r.linked_orders || [])
      .filter((o) => o.type !== 'consumption' && o.status !== 'CANCELLED')
      .reduce((s, o) => s + Number(o.total), 0);
    const availableFunds = activePayments.filter((p) => !p.order_id && !p.consolidated_at).reduce((s, p) => s + Number(p.value), 0);
    const balance = accountTotal - advancesInvoiced - availableFunds;
    const consumptionOrders = (r.linked_orders || []).filter((o) => o.type === 'consumption' && o.status !== 'CANCELLED');
    const consumptionsTotal = consumptionOrders.reduce((s, o) => s + Number(o.total), 0);
    const consumptionsPaid = consumptionOrders.filter((o) => o.status_payment === 'PAID').reduce((s, o) => s + Number(o.total), 0);
    const stayUnit = mockRentableUnits.find((u) => u.id === r.rentable_unit_id);
    return {
      ...r,
      check_in_time: stayUnit?.check_in_time || null,
      check_out_time: stayUnit?.check_out_time || null,
      summary: {
        lodging_subtotal: r.lodging_subtotal, services_total: r.services_total,
        charges_total: chargesTotal.toFixed(2), total: r.total, account_total: accountTotal.toFixed(2),
        paid: paid.toFixed(2), advances_invoiced: advancesInvoiced.toFixed(2), balance: balance.toFixed(2),
        consumptions: {
          count: consumptionOrders.length, total: consumptionsTotal.toFixed(2),
          paid: consumptionsPaid.toFixed(2), pending: (consumptionsTotal - consumptionsPaid).toFixed(2),
        },
        stay_grand_total: (accountTotal + consumptionsTotal).toFixed(2),
        pending_total: (balance + consumptionsTotal - consumptionsPaid).toFixed(2),
      },
    };
  };
  const recalc = (r) => {
    const servicesTotal = r.services.reduce((s, sv) => s + Number(sv.total), 0);
    r.services_total = servicesTotal.toFixed(2);
    r.total = (Number(r.lodging_subtotal) + servicesTotal).toFixed(2);
  };
  const find = (id) => mockReservations.find((r) => r.id === id);
  // Consecutivo corto propio de las facturas de reserva: prefijo «R» + secuencia por compañía.
  const nextReservationOrderNumber = () => 'R' + String(++mockReservationOrderSeq).padStart(7, '0');
  // Cada abono genera su factura (orden LODGING pagada) vinculada a la reserva.
  const invoiceAdvance = (r, payment) => {
    const orderId = 'ord-' + Math.random().toString(36).slice(2, 10);
    r.linked_orders.unshift({
      id: orderId, order_number: nextReservationOrderNumber(), status: 'ACCEPTED_IN_STORE', status_payment: 'PAID',
      service_type: 'LODGING', is_lodging: true, type: 'advance', discount: '0.00',
      total: Number(payment.value).toFixed(2), date: new Date().toISOString(),
    });
    payment.order_id = orderId;
  };
  const newPayment = (r, data) => ({
    id: nextId(r.payments), payment_method: data.payment_method, payment_method_name: data.payment_method,
    value: Number(data.value).toFixed(2), payment_date: data.payment_date || expenseDayIso(0),
    notes: data.notes || null, order_id: null, consolidated_at: null, status: 1, created_by_name: mockUser.name,
    annulled_by_name: null, annulled_at: null,
  });

  // Calendario: reservas que se solapan con [from, to], excluyendo canceladas.
  if (sub === 'reservations/calendar') {
    const from = query.get('from');
    const to = query.get('to');
    return mockReservations
      .filter((r) => r.status !== 0 && r.check_in_date <= to && r.check_out_date >= from)
      .map((r) => ({
        id: r.id, code: r.code, rentable_unit_name: r.rentable_unit_name, holder_user_name: r.holder_user_name,
        guests_count: r.guests_count || 1, check_in_date: r.check_in_date, check_out_date: r.check_out_date,
        nights: r.nights, total: r.total, status: r.status, services_count: (r.services || []).length,
      }));
  }

  // Listado / creación
  if (sub === 'reservations') {
    if (method === 'POST') {
      const unit = mockRentableUnits.find((u) => u.id === Number(body.rentable_unit_id));
      const nights = Math.round((new Date(body.check_out_date) - new Date(body.check_in_date)) / 86400000);
      const pricePerNight = Number(body.price_per_night || unit?.base_price_per_night || 0);
      const lodging = pricePerNight * nights;
      const services = (body.services || []).map((sv, i) => {
        const st = mockServiceItems.find((s) => s.id === Number(sv.item_id));
        const qty = Number(sv.quantity) || 1;
        return { id: i + 1, item_id: st.id, name: st.name, quantity: qty, unit_price: st.price, total: (Number(st.price) * qty).toFixed(2) };
      });
      const servicesTotal = services.reduce((s, sv) => s + Number(sv.total), 0);
      const hasPayment = body.payment && body.payment.value;
      const id = 'rsv-' + Math.random().toString(36).slice(2, 10);
      const code = Array.from({ length: 10 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
      const holderName = `${body.holder.first_name} ${body.holder.last_name}`;
      const guests = [{ id: 1, user_id: 501, is_holder: true, first_name: body.holder.first_name, last_name: body.holder.last_name, name: holderName, document_number: body.holder.id_number || null }];
      (body.companions || []).forEach((c, i) => guests.push({ id: i + 2, user_id: 600 + i, is_holder: false, first_name: c.first_name, last_name: c.last_name, name: `${c.first_name} ${c.last_name}`, document_number: c.id_number || null }));
      const row = {
        id, code, rentable_unit_id: unit.id, rentable_unit_name: unit.name,
        guests_count: Number(body.guests_count) || 1,
        holder_user_id: 501, holder_user_name: holderName, holder_document_number: body.holder.id_number || null,
        holder_first_name: body.holder.first_name, holder_last_name: body.holder.last_name,
        holder_phone_number: body.holder.phone_number || '',
        check_in_date: body.check_in_date, check_out_date: body.check_out_date, expected_arrival_time: null,
        nights, price_per_night: pricePerNight.toFixed(2), lodging_subtotal: lodging.toFixed(2),
        services_total: servicesTotal.toFixed(2), total: (lodging + servicesTotal).toFixed(2),
        status: hasPayment ? 2 : 1, precheckin_completed_at: null, checkin_at: null, checkout_at: null,
        checkout_order_id: null, notes: body.notes || null, created_by_name: mockUser.name,
        cancelled_by_name: null, cancelled_at: null, cancellation_reason: null,
        guests, services, charges: [], linked_orders: [],
        payments: [],
      };
      if (hasPayment) {
        const payment = newPayment(row, body.payment);
        row.payments.push(payment);
        invoiceAdvance(row, payment);
      }
      mockReservations.unshift(row);
      return detail(row);
    }
    let rows = mockReservations.map((r) => ({
      id: r.id, code: r.code, rentable_unit_id: r.rentable_unit_id, rentable_unit_name: r.rentable_unit_name,
      holder_user_name: r.holder_user_name,
      check_in_date: r.check_in_date, check_out_date: r.check_out_date, nights: r.nights, total: r.total, status: r.status,
      precheckin_completed_at: r.precheckin_completed_at,
    }));
    const status = query.get('status');
    if (status === 'open') rows = rows.filter((r) => r.status !== 0);
    else if (status !== null && status !== '') rows = rows.filter((r) => String(r.status) === status);
    const unitId = query.get('rentable_unit_id');
    if (unitId) rows = rows.filter((r) => String(r.rentable_unit_id) === unitId);
    const term = (query.get('_search') || '').toLowerCase();
    if (term) rows = rows.filter((r) => r.code.toLowerCase().includes(term) || r.holder_user_name.toLowerCase().includes(term));
    return mockPaginate(rows, query);
  }

  const m = sub.match(/^reservations\/([^/]+)(?:\/(.+))?$/);
  if (!m) return undefined;
  const r = find(m[1]);
  if (!r) return null;
  const action = m[2];

  if (!action) return detail(r); // GET detalle
  if (action === 'confirm') { if (r.status === 1) r.status = 2; return detail(r); }
  // El check-in exige el pre-check-in del huésped (misma regla que el backend).
  if (action === 'check-in') {
    if (!r.precheckin_completed_at) throw new Error('El huésped debe completar el pre-check-in antes de registrar la entrada');
    if (r.status === 2) { r.status = 3; r.checkin_at = new Date().toISOString(); }
    return detail(r);
  }
  if (action === 'cancel') {
    r.status = 0; r.cancelled_by_name = mockUser.name; r.cancellation_reason = body.reason || null;
    // Cancelar la reserva cancela también todas sus facturas vigentes.
    (r.linked_orders || []).forEach((o) => { if (o.status !== 'CANCELLED') o.status = 'CANCELLED'; });
    return detail(r);
  }
  if (action === 'reopen') {
    if (r.status !== 4) return null;
    r.status = 3; r.checkout_at = null; r.checkout_order_id = null;
    // Los cierres previos quedan como abonos de la cuenta reabierta.
    (r.linked_orders || []).forEach((o) => { if (o.type === 'checkout') o.type = 'advance'; });
    return detail(r);
  }
  if (action === 'dates') {
    const nights = Math.round((new Date(body.check_out_date) - new Date(body.check_in_date)) / 86400000);
    r.check_in_date = body.check_in_date; r.check_out_date = body.check_out_date; r.nights = nights;
    r.lodging_subtotal = (Number(r.price_per_night) * nights).toFixed(2); recalc(r); return detail(r);
  }
  if (action === 'price') {
    if (![1, 2, 3].includes(r.status)) throw new Error('Solo se puede modificar el precio de una reserva abierta');
    r.price_per_night = Number(body.price_per_night).toFixed(2);
    r.lodging_subtotal = (Number(r.price_per_night) * Number(r.nights)).toFixed(2);
    recalc(r); return detail(r);
  }
  if (action === 'orders') return [...(r.linked_orders || [])];
  if (action === 'checkout' && method === 'POST') {
    if (r.status !== 3) return null;
    if (body.payment && body.payment.value) {
      r.payments.push(newPayment(r, body.payment));
    }
    // La orden de cierre factura hospedaje + servicios + cargos con lo ya facturado a la cuenta
    // (abonos y cierres previos) aplicado como descuento: sale por el saldo. Los consumos POS
    // pendientes quedan pagados y los pagos activos se consolidan (dejan de ser anulables).
    const chargesTotal = (r.charges || []).reduce((s, ch) => s + Number(ch.total), 0);
    const accountTotal = Number(r.total) + chargesTotal;
    const advances = (r.linked_orders || [])
      .filter((o) => o.type !== 'consumption' && o.status !== 'CANCELLED')
      .reduce((s, o) => s + Number(o.total), 0);
    const applied = Math.min(advances, accountTotal);
    (r.linked_orders || []).forEach((o) => { if (o.type === 'consumption') o.status_payment = 'PAID'; });
    r.payments.forEach((p) => { if (p.status === 1 && !p.consolidated_at) p.consolidated_at = new Date().toISOString(); });
    r.status = 4; r.checkout_at = new Date().toISOString(); r.checkout_order_id = 'ord-' + Math.random().toString(36).slice(2, 10);
    r.linked_orders.unshift({
      id: r.checkout_order_id, order_number: nextReservationOrderNumber(), status: 'ACCEPTED_IN_STORE', status_payment: 'PAID',
      service_type: 'LODGING', is_lodging: true, type: 'checkout', discount: applied.toFixed(2),
      total: (accountTotal - applied).toFixed(2), date: new Date().toISOString(),
    });
    return detail(r);
  }
  if (action === 'guests') {
    r.holder_user_name = `${body.holder.first_name} ${body.holder.last_name}`;
    r.guests = [{ id: 1, user_id: 501, is_holder: true, first_name: body.holder.first_name, last_name: body.holder.last_name, name: r.holder_user_name, document_number: body.holder.id_number || null },
      ...(body.companions || []).map((c, i) => ({ id: i + 2, user_id: 600 + i, is_holder: false, first_name: c.first_name, last_name: c.last_name, name: `${c.first_name} ${c.last_name}`, document_number: c.id_number || null }))];
    return detail(r);
  }
  if (action === 'services' && method === 'POST') {
    const st = mockServiceItems.find((s) => s.id === Number(body.item_id));
    const qty = Number(body.quantity) || 1;
    r.services.push({ id: nextId(r.services), item_id: st.id, name: st.name, quantity: qty, unit_price: st.price, total: (Number(st.price) * qty).toFixed(2) });
    recalc(r); return detail(r);
  }
  let sm = action.match(/^services\/(\d+)$/);
  if (sm && method === 'DELETE') { r.services = r.services.filter((sv) => sv.id !== Number(sm[1])); recalc(r); return detail(r); }
  if (action === 'charges' && method === 'POST') {
    const it = mockConsumableItems.find((x) => x.id === Number(body.item_id));
    const qty = Number(body.quantity) || 1;
    r.charges = r.charges || [];
    r.charges.push({ id: nextId(r.charges), item_id: it.id, name: it.name, quantity: qty, unit_price: it.price, total: (Number(it.price) * qty).toFixed(2), created_by_name: mockUser.name, created_at: new Date().toISOString() });
    return detail(r);
  }
  let cm = action.match(/^charges\/(\d+)$/);
  if (cm && method === 'DELETE') { r.charges = (r.charges || []).filter((ch) => ch.id !== Number(cm[1])); return detail(r); }
  if (action === 'payments' && method === 'POST') {
    const payment = newPayment(r, body);
    r.payments.push(payment);
    invoiceAdvance(r, payment);
    if (r.status === 1) r.status = 2;
    return detail(r);
  }
  let pm = action.match(/^payments\/(\d+)\/annul$/);
  if (pm) {
    const p = r.payments.find((x) => x.id === Number(pm[1]));
    if (p && !p.consolidated_at) {
      p.status = 0; p.annulled_by_name = mockUser.name;
      // Anular el abono cancela también su factura.
      const order = (r.linked_orders || []).find((o) => o.id === p.order_id);
      if (order) order.status = 'CANCELLED';
    }
    return detail(r);
  }

  return undefined;
}

// Pre-check-in público (demo): resuelve /public/checkin/{code}… contra mockReservations.
function resolveCheckinMock(path, query, { method = 'GET', body } = {}) {
  // Entrada digitando código + nombre: el nombre se compara sin tildes ni mayúsculas y basta con
  // acertar cualquiera de las palabras del titular (mismo criterio que el backend).
  if (path === '/public/checkin/access' && method === 'POST') {
    const normalize = (v) => String(v || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ').trim().replace(/\s+/g, ' ');
    const wanted = String(body?.code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const found = mockReservations.find((x) => x.code === wanted);
    const holderParts = found ? normalize(found.holder_user_name).split(' ').filter(Boolean) : [];
    const typedParts = normalize(body?.name).split(' ').filter(Boolean);
    const matches = found && typedParts.length > 0 && typedParts.every((p) => p.length >= 2 && holderParts.includes(p));
    if (!matches) return null;

    // Reserva del titular pero ya cerrada: 409 con el motivo, igual que el backend.
    if (![1, 2, 3, 5].includes(found.status)) {
      const cancelled = found.status === 0;
      const err = new Error(cancelled ? 'Esta reserva fue cancelada' : 'Esta reserva ya finalizó');
      err.status = 409;
      err.data = {
        cancelled,
        title: cancelled ? 'Esta reserva fue cancelada' : 'Esta reserva ya finalizó',
        detail: cancelled
          ? 'Ya no es posible hacer el pre-check-in. Si crees que es un error, comunícate con el alojamiento.'
          : 'Tu estadía terminó, así que el pre-check-in ya no está disponible. ¡Gracias por visitarnos!',
        company_name: mockCompany.name, company_phone: mockCompany.phone,
        check_in_date: found.check_in_date, check_out_date: found.check_out_date,
        unit_name: found.rentable_unit_name,
      };
      throw err;
    }

    return resolveCheckinMock(`/public/checkin/${found.code}`, query, {});
  }

  const m = path.match(/^\/public\/checkin\/([^/]+)(?:\/(.+))?$/);
  if (!m) return undefined;
  const code = m[1];
  const action = m[2];
  const r = mockReservations.find((x) => x.code === code && [1, 2, 3, 5].includes(x.status));

  const summary = (res) => {
    const paid = res.payments.filter((p) => p.status === 1).reduce((s, p) => s + Number(p.value), 0);
    const maskDoc = (d) => (!d ? null : (String(d).length <= 4 ? '****' : '****' + String(d).slice(-4)));
    const unit = mockRentableUnits.find((u) => u.id === res.rentable_unit_id);
    return {
      code: res.code,
      company_name: mockCompany.name,
      company_logo: mockCompany.icon || null,
      company_address: mockCompany.address || null,
      unit_name: res.rentable_unit_name,
      unit_type_name: unit?.type_name || null,
      unit_description: unit?.description || null,
      unit_capacity: unit?.capacity || null,
      unit_check_in_time: unit?.check_in_time || null,
      unit_check_out_time: unit?.check_out_time || null,
      unit_photo: null,
      check_in_date: res.check_in_date, check_out_date: res.check_out_date, nights: res.nights,
      guests_count: res.guests_count || 1,
      total: res.total, paid: paid.toFixed(2), balance: (Number(res.total) - paid).toFixed(2),
      expected_arrival_time: res.expected_arrival_time, precheckin_completed: !!res.precheckin_completed_at,
      // Pago sin confirmar (pendiente o en validación): bloquea el pre-check-in. Las reservas demo
      // no guardan created_at, así que el plazo se simula a 40 minutos de ahora.
      payment_pending: [1, 5].includes(res.status),
      payment_validating: res.status === 5,
      payment_deadline: [1, 5].includes(res.status) ? new Date(Date.now() + 40 * 60000).toISOString() : null,
      whatsapp_number: mockCompany.phone,
      holder: {
        name: res.holder_user_name,
        document_masked: maskDoc(res.holder_document_number),
        first_name: res.holder_first_name || null,
        last_name: res.holder_last_name || null,
        phone_number: res.holder_phone_number || '',
        id_number: res.holder_document_number || '',
        has_document_photo: !!res.holder_has_document_photo,
      },
      companions: res.guests.filter((g) => !g.is_holder).map((g) => ({
        name: g.name, first_name: g.first_name, last_name: g.last_name, document_number: g.document_number,
      })),
    };
  };

  if (!action) return r ? summary(r) : null;
  if (!r) return null;
  if (action === 'files' && method === 'POST') return { name: 'doc-' + Math.random().toString(36).slice(2, 8) };
  if (action === 'guests' && method === 'POST') {
    if ([1, 5].includes(r.status)) throw new Error('El pre-check-in estará disponible cuando confirmemos el pago de tu reserva.');
    r.expected_arrival_time = body.expected_arrival_time || null;
    r.precheckin_completed_at = new Date().toISOString();
    r.holder_user_name = `${body.holder.first_name} ${body.holder.last_name}`;
    r.holder_document_number = body.holder.id_number || r.holder_document_number;
    r.guests = [{ id: 1, user_id: 501, is_holder: true, first_name: body.holder.first_name, last_name: body.holder.last_name, name: r.holder_user_name, document_number: body.holder.id_number || null },
      ...(body.companions || []).map((c, i) => (
        { id: i + 2, user_id: 600 + i, is_holder: false, first_name: c.first_name, last_name: c.last_name, name: `${c.first_name} ${c.last_name}`.trim(), document_number: c.id_number || null }
      ))];
    return summary(r);
  }
  return null;
}

// ── Gimnasio: catálogo de planes de membresía (miembros/suscripciones llegan en fases
// posteriores). Mutan en memoria durante la sesión, como el resto de los mocks.
let mockGymPlans = [
  { id: 1, name: 'Plan mensual', description: 'Acceso ilimitado al gimnasio, mes a mes', price: '90000.00', duration_days: 30, grace_period_days: 3, allows_pause: false, item_id: 905, status: 1, sort_order: 0 },
  { id: 2, name: 'Plan trimestral', description: 'Tres meses con un mes de descuento', price: '240000.00', duration_days: 90, grace_period_days: 3, allows_pause: true, item_id: 905, status: 1, sort_order: 1 },
  { id: 3, name: 'Plan anual', description: 'Doce meses al mejor precio', price: '840000.00', duration_days: 365, grace_period_days: 7, allows_pause: true, item_id: 905, status: 1, sort_order: 2 },
];

const gymPlanPresent = (p) => ({ ...p, item_name: p.item_id ? serviceItemName(p.item_id) : null });

// Miembros: personas ya resueltas como usuarios de la plataforma (user_id ficticio en el demo).
let mockGymMembers = [
  { id: 1, user_id: 5001, member_code: 'M00001', member_name: 'Laura Gómez', document_snapshot: '1017234567', height_cm: '165.0', goal: 'Tonificación', health_notes: '', status: 1, joined_at: '2026-05-02' },
  { id: 2, user_id: 5002, member_code: 'M00002', member_name: 'Carlos Restrepo', document_snapshot: '1098765432', height_cm: '178.0', goal: 'Ganancia muscular', health_notes: 'Molestia leve en rodilla derecha', status: 1, joined_at: '2026-05-10' },
  { id: 3, user_id: 5003, member_code: 'M00003', member_name: 'Daniela Ríos', document_snapshot: '1023456789', height_cm: '160.0', goal: 'Pérdida de grasa', health_notes: '', status: 1, joined_at: '2026-06-01' },
  { id: 4, user_id: 5004, member_code: 'M00004', member_name: 'Andrés Mejía', document_snapshot: '1076543210', height_cm: '182.0', goal: '', health_notes: '', status: 0, joined_at: '2026-04-15' },
];

function resolveGymMock(path, query, { method = 'GET', body } = {}) {
  const scoped = path.match(/^\/companies\/[^/]+\/gym\/(.+)$/);
  if (!scoped) return undefined;
  const sub = scoped[1];

  if (sub === 'plans') {
    if (method === 'POST') {
      const plan = {
        id: (mockGymPlans.reduce((max, p) => Math.max(max, p.id), 0) || 0) + 1,
        name: body.name,
        description: body.description || null,
        price: body.price,
        duration_days: Number(body.duration_days),
        grace_period_days: Number(body.grace_period_days ?? 3),
        allows_pause: !!body.allows_pause,
        item_id: body.item_id ? Number(body.item_id) : null,
        status: 1,
        sort_order: Number(body.sort_order ?? mockGymPlans.length),
      };
      mockGymPlans.push(plan);
      return gymPlanPresent(plan);
    }

    const status = query.get('status');
    const search = (query.get('_search') || '').toLowerCase();
    const rows = mockGymPlans
      .filter((p) => (status === '' || status == null ? true : String(p.status) === status))
      .filter((p) => !search || p.name.toLowerCase().includes(search))
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
      .map(gymPlanPresent);
    return mockPaginate(rows, query);
  }

  const planMatch = sub.match(/^plans\/(\d+)(\/status)?$/);
  if (planMatch) {
    const plan = mockGymPlans.find((p) => p.id === Number(planMatch[1]));
    if (!plan) return null;
    const isStatus = !!planMatch[2];

    if (method === 'PUT' && isStatus) {
      plan.status = Number(body.status);
      return gymPlanPresent(plan);
    }
    if (method === 'PUT') {
      ['name', 'description', 'price', 'duration_days', 'grace_period_days', 'allows_pause', 'item_id', 'sort_order'].forEach((key) => {
        if (key in body) plan[key] = key === 'duration_days' || key === 'grace_period_days' || key === 'sort_order'
          ? Number(body[key])
          : (key === 'item_id' ? (body[key] ? Number(body[key]) : null) : body[key]);
      });
      return gymPlanPresent(plan);
    }
    return gymPlanPresent(plan);
  }

  if (sub === 'members') {
    if (method === 'POST') {
      const idNumber = (body.id_number || '').trim();
      const dup = mockGymMembers.find((m) => (idNumber && m.document_snapshot === idNumber));
      if (dup) throw new Error('Esta persona ya es miembro del gimnasio');
      const nextNum = mockGymMembers.reduce((max, m) => Math.max(max, Number(m.member_code.slice(1))), 0) + 1;
      const member = {
        id: (mockGymMembers.reduce((max, m) => Math.max(max, m.id), 0) || 0) + 1,
        user_id: 5000 + (mockGymMembers.reduce((max, m) => Math.max(max, m.user_id - 5000), 0) || 0) + 1,
        member_code: 'M' + String(nextNum).padStart(5, '0'),
        member_name: `${body.first_name} ${body.last_name}`.trim(),
        document_snapshot: idNumber || null,
        height_cm: body.height_cm || null,
        goal: body.goal || null,
        health_notes: body.health_notes || null,
        status: 1,
        joined_at: new Date().toISOString().slice(0, 10),
      };
      mockGymMembers.push(member);
      return member;
    }

    const status = query.get('status');
    const search = (query.get('_search') || '').toLowerCase();
    const rows = mockGymMembers
      .filter((m) => (status === '' || status == null ? true : String(m.status) === status))
      .filter((m) => !search
        || m.member_name.toLowerCase().includes(search)
        || m.member_code.toLowerCase().includes(search)
        || (m.document_snapshot || '').includes(search))
      .sort((a, b) => a.member_name.localeCompare(b.member_name));
    return mockPaginate(rows, query);
  }

  const memberMatch = sub.match(/^members\/(\d+)$/);
  if (memberMatch) {
    const member = mockGymMembers.find((m) => m.id === Number(memberMatch[1]));
    if (!member) return null;
    if (method === 'PUT') {
      ['height_cm', 'goal', 'health_notes', 'status'].forEach((key) => {
        if (key in body) member[key] = key === 'status' ? Number(body[key]) : body[key];
      });
    }
    return member;
  }

  return null;
}

export function resolveMock(rawPath, opts = {}) {
  const [path, qs = ''] = rawPath.split('?');
  const query = new URLSearchParams(qs);

  // Rutas paginadas
  if (path === '/auth/me/login-history') return mockPaginate(mockLoginHistory, query);

  // Permisos del usuario en la compañía activa: /companies/{company}/me/permissions
  if (/^\/companies\/[^/]+\/me\/permissions$/.test(path)) return mockPermissions;

  // Empresas del usuario (selector del sidebar).
  if (path === '/auth/me/companies') return mockCompanies;
  // Cambio de empresa activa: devuelve la elegida.
  if (path === '/auth/me/company') {
    const picked = mockCompanies.find((c) => String(c.id) === String(opts.body?.company_id));
    return picked || mockCompany;
  }
  // Perfil de la empresa activa: GET devuelve el detalle; PUT fusiona el body y lo devuelve.
  const profileMatch = path.match(/^\/companies\/([^/]+)$/);
  if (profileMatch) {
    const picked = mockCompanies.find((c) => String(c.id) === String(profileMatch[1]));
    const profile = { ...mockCompany, ...(picked ? { id: picked.id, name: picked.name } : {}) };
    return opts.method === 'PUT' ? { ...profile, ...(opts.body || {}) } : profile;
  }

  // Pre-check-in público (sin sesión): /public/checkin/{code}…
  const checkin = resolveCheckinMock(path, query, opts);
  if (checkin !== undefined) return checkin;

  // Hospedaje público (sin sesión): /public/{company}/rentable-units[/{unitId}]
  const publicLodging = resolvePublicLodgingMock(path, query);
  if (publicLodging !== undefined) return publicLodging;

  // Portada pública de la compañía (sin sesión): /public/{company}
  const publicCompany = resolvePublicCompanyMock(path);
  if (publicCompany !== undefined) return publicCompany;

  // Carta pública (sin sesión): /public/{company}/m/{menuUsername}
  const publicMenu = resolvePublicMenuMock(path);
  if (publicMenu !== undefined) return publicMenu;

  // Módulo de menús (company-scoped: /companies/{company}/menus, con categorías e ítems anidados…)
  const menu = resolveMenuMock(path, query, opts);
  if (menu !== undefined) return menu;

  // Módulo de productos (company-scoped: /companies/{company}/items|item-categories|taxes…)
  const item = resolveItemsMock(path, query, opts);
  if (item !== undefined) return item;

  // Módulo de métricas (company-scoped: /companies/{company}/metrics/sales-by-type)
  const metrics = resolveMetricsMock(path, query);
  if (metrics !== undefined) return metrics;

  // Módulo de fallos de sincronización (company-scoped: /companies/{company}/orders/sync-failure-reports…).
  // Debe resolverse ANTES que orders: su ruta cuelga de /orders y el matcher de órdenes la capturaría.
  const syncFailures = resolveSyncFailuresMock(path, query, opts);
  if (syncFailures !== undefined) return syncFailures;

  // Módulo de facturas/órdenes (company-scoped: /companies/{company}/orders…)
  const orders = resolveOrdersMock(path, query, opts);
  if (orders !== undefined) return orders;

  // Módulo de gastos (company-scoped: /companies/{company}/expenses|expense-categories|expense-suppliers…)
  const expenses = resolveExpensesMock(path, query, opts);
  if (expenses !== undefined) return expenses;

  // Módulo de turnos de caja (company-scoped: /companies/{company}/shifts…)
  const shifts = resolveShiftsMock(path, query, opts);
  if (shifts !== undefined) return shifts;

  // Métrica de hospedaje (demo): /companies/{company}/metrics/reservations-report
  if (/\/metrics\/reservations-report$/.test(path)) {
    const active = mockReservations.filter((r) => r.status !== 0);
    const nights = active.reduce((sum, r) => sum + (r.nights || 0), 0);
    const revenue = mockReservations.flatMap((r) => r.payments || []).filter((p) => p.status === 1).reduce((sum, p) => sum + Number(p.value), 0);
    const unitsActive = mockRentableUnits.filter((u) => u.status === 1).length;
    const days = Math.max(1, Number(query.get('days')) || 15);
    const occupancy = unitsActive > 0 ? Math.round((nights / (unitsActive * days)) * 10000) / 100 : 0;
    return {
      period: { days },
      totals: { reservations: active.length, nights_sold: nights, units_active: unitsActive, occupancy_rate: occupancy, revenue: Math.round(revenue * 100) / 100 },
      deltas: { reservations: 0, nights_sold: 0, occupancy_rate: 0, revenue: 0 },
    };
  }

  // Módulo de reservas de hospedaje (company-scoped: /companies/{company}/rentable-units|rentable-unit-types…)
  const reservations = resolveReservationsMock(path, query, opts);
  if (reservations !== undefined) return reservations;

  // Módulo de gimnasio (company-scoped: /companies/{company}/gym/plans…)
  const gym = resolveGymMock(path, query, opts);
  if (gym !== undefined) return gym;

  // Administración de accesos: catálogo de permisos y CRUD de roles
  // (/companies/{company}/permissions…). No colisiona con /me/permissions, resuelto arriba.
  const permissionsAdmin = resolvePermissionsAdminMock(path, query, opts);
  if (permissionsAdmin !== undefined) return permissionsAdmin;

  // Módulo de usuarios de la compañía (company-scoped: /companies/{company}/users…)
  const users = resolveUsersMock(path, query, opts);
  if (users !== undefined) return users;

  // Módulo de tiendas (company-scoped: /companies/{company}/stores…)
  const stores = resolveStoresMock(path, query, opts);
  if (stores !== undefined) return stores;

  // Tokens de agentes de IA (company-scoped: /companies/{company}/ai-agent-tokens…)
  const aiTokens = resolveAiTokensMock(path, opts);
  if (aiTokens !== undefined) return aiTokens;

  const map = {
    '/auth/login': mockAuth,
    '/auth/me/password': { status: 'success', message: 'Contraseña actualizada (demo)' },
    '/stats': mockStats,
    '/pedidos': mockOrders,
    '/tiendas': mockStores,
    '/tiendas-detalle': mockStoresDetail,
    '/usuarios': mockUsers,
    '/notificaciones': mockNotifications,
    '/me': mockUser,
  };
  return map[path] ?? null;
}

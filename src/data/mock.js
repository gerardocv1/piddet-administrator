// Datos de ejemplo (mock). Se usan cuando VITE_API_URL está vacío,
// para que el panel funcione sin backend. Replican la forma que debería
// devolver la API real de Piddet.

import { slugifyUsername } from '../lib/slug.js';

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
  { id: 1, name: 'functionality_taxes', description: 'Funcionalidad de impuestos', is_active: true },
  { id: 2, name: 'functionality_tables', description: 'Funcionalidad de mesas', is_active: false },
  { id: 3, name: 'functionality_logistic', description: 'Funcionalidad de logística', is_active: false },
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

export const mockTables = [
  { n: 1, cap: 2, st: 'libre' }, { n: 2, cap: 4, st: 'ocupada', t: '24 min', tot: '$48.000' },
  { n: 3, cap: 4, st: 'cuenta', t: '52 min', tot: '$96.500' }, { n: 4, cap: 2, st: 'libre' },
  { n: 5, cap: 6, st: 'ocupada', t: '8 min', tot: '$31.000' }, { n: 6, cap: 4, st: 'reservada', t: '19:30' },
  { n: 7, cap: 2, st: 'libre' }, { n: 8, cap: 8, st: 'ocupada', t: '40 min', tot: '$120.000' },
  { n: 9, cap: 4, st: 'cuenta', t: '61 min', tot: '$74.000' }, { n: 10, cap: 2, st: 'libre' },
  { n: 11, cap: 4, st: 'libre' }, { n: 12, cap: 6, st: 'reservada', t: '20:00' },
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

// Roles asignables demo (sin super-admin), con etiqueta amigable.
export const mockCompanyRoles = [
  { name: 'admin', label: 'Administrador', description: 'Acceso total a la compañía' },
  { name: 'cashier', label: 'Cajero', description: 'Gestión de pagos y caja' },
  { name: 'waiter', label: 'Mesero', description: 'Toma de pedidos en sala' },
  { name: 'cook', label: 'Cocinero', description: 'Operación de cocina' },
];

// Usuarios vinculados a la compañía activa (forma del backend: datos básicos + roles).
export const mockUsers = [
  { id: 1, name: 'Gerardo Cruz', first_name: 'Gerardo', last_name: 'Cruz', phone_code: '57', phone_number: '3001234567', email: 'gerardo@piddet.com', status: true, roles: [{ name: 'admin', label: 'Administrador' }] },
  { id: 2, name: 'María López', first_name: 'María', last_name: 'López', phone_code: '57', phone_number: '3112223344', email: 'maria@piddet.com', status: true, roles: [{ name: 'cashier', label: 'Cajero' }] },
  { id: 3, name: 'Carlos Mejía', first_name: 'Carlos', last_name: 'Mejía', phone_code: '57', phone_number: '3205556677', email: null, status: true, roles: [{ name: 'waiter', label: 'Mesero' }] },
  { id: 4, name: 'Ana Ruiz', first_name: 'Ana', last_name: 'Ruiz', phone_code: '57', phone_number: '3158889900', email: null, status: false, roles: [{ name: 'cook', label: 'Cocinero' }] },
  { id: 5, name: 'Jorge Díaz', first_name: 'Jorge', last_name: 'Díaz', phone_code: '57', phone_number: '3014441122', email: null, status: true, roles: [{ name: 'waiter', label: 'Mesero' }] },
];

export const mockUser = { name: 'Gerardo Cruz', role: 'Administrador' };

// ── Módulo de menús (datos en memoria; las mutaciones persisten durante la sesión) ──────
// Replican la forma del backend: los menús son de la compañía activa y cada categoría pertenece a
// un menú concreto (`menu_id`); su `position` define el orden de sus productos dentro de ese menú.
export const mockMenus = [
  { id: 1, name: 'Carta principal', username: 'carta_principal', description: 'Disponible todo el día', file: null, position: 0, status: 1 },
  { id: 2, name: 'Desayunos', username: 'desayunos', description: 'Hasta las 11 a. m.', file: null, position: 1, status: 0 },
  { id: 3, name: 'Bebidas', username: 'bebidas', description: 'Carta de bebidas y cócteles', file: null, position: 2, status: 1 },
  { id: 4, name: 'Menú Secundary', username: 'menu_secundary', description: 'Carta de fin de semana', file: null, position: 3, status: 1 },
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
  permissions: ['user-administrator', 'api-module-menus', 'api-module-products', 'api-module-company', 'api-module-stores', 'api-module-orders', 'order-cancel', 'order-sync-failure-admin', 'api-module-expenses', 'expense-annul', 'api-module-reservations', 'api-module-rentable-units', 'reservation-checkout', 'reservation-cancel', 'reservation-payment-annul'],
};

// Empresa (tenant) activa y empresas disponibles para el usuario (SaaS multi-tenant).
export const mockCompany = {
  id: 'pid-001', name: 'Grupo Sabor', username: 'grupo_sabor', legal_name: 'Grupo Sabor S.A.S', plan: 'Pro', tiendas: 4,
  identification: 'NIT 900.123.456-7',
  address: 'Cra. 43A #1-50', city: 'Medellín, Colombia', phone: '+57 300 123 4567',
  email: 'hola@gruposabor.co', website: 'www.gruposabor.co',
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
  const menu = mockMenus.find((x) => x.username === m[2] && x.status === 1);
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
    .filter((x) => x.status === 1)
    .sort((a, b) => a.position - b.position)
    .map((x) => ({ id: x.id, name: x.name, username: x.username, description: x.description, file: x.file, position: x.position, status: x.status }));
  // Tiendas públicas: todas menos las inactivas (store_status_id 2). Incluye horarios y ubicación.
  const stores = mockStoresList
    .filter((st) => st.store_status_id !== 2)
    .map((st) => ({
      id: st.id, store_status_id: st.store_status_id, status: storeStatusObj(st.store_status_id),
      name: st.name, address: st.address, phone_code: st.phone_code, phone_number: st.phone_number,
      latitude: st.latitude, longitude: st.longitude,
      schedules: (st.schedules || []).map((r) => ({ day_id: r.day_id, start_time: r.start_time, end_time: r.end_time })),
    }));
  return { company: { ...mockCompany }, menus, stores };
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
      const row = { id: nextId(mockMenus), name: body.name, username, description: body.description || '', file: null, position: body.position ?? mockMenus.length, status: 1 };
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
  if (sub === 'functionalities') return mockFunctionalities;
  if (sub === 'item-types') return mockPaginate(mockItemTypes.filter((t) => t.status !== 0), query);

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

function resolveMetricsMock(path, query) {
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

function resolveUsersMock(path, query, { method = 'GET', body } = {}) {
  const m = path.match(/^\/companies\/[^/]+\/users(\/.*)?$/);
  if (!m) return undefined;
  const sub = m[1] || '';

  const toRoles = (names = []) => names
    .map((n) => mockCompanyRoles.find((r) => r.name === n))
    .filter(Boolean)
    .map((r) => ({ name: r.name, label: r.label }));

  if (sub === '/assignable-roles') return mockCompanyRoles;

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
      };
      u.name = `${u.first_name} ${u.last_name}`.trim();
      mockUsers.push(u);
      return u;
    }
    return mockPaginate(mockUsers, query);
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
        if (Array.isArray(body?.roles)) u.roles = toRoles(body.roles);
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
    created_date: createdDate,
    customer_name: customerName,
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
    customer: demoCustomers[2], creator: demoCreators[1], taxPct: 0.19, paymentMethod: 'Nequi',
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
    customer: demoCustomers[2], creator: demoCreators[0],
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
    const date = query.get('date') || isoDay(0);
    const rows = mockInvoiceOrders
      .filter((o) => o.date === date)
      .map(({ detail, date: _d, ...row }) => row);
    return mockPaginate(rows, query);
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
    created_by: 1,
    created_by_name: 'Gerardo Cruz',
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

  if (sub === 'expenses/summary') {
    const from = query.get('date_from') || expenseDayIso(30);
    const to = query.get('date_to') || expenseDayIso(0);
    const byCat = new Map();
    mockExpenses
      .filter((e) => e.status === 1 && e.expense_date >= from && e.expense_date <= to)
      .forEach((e) => e.items.forEach((it) => {
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
    return { date_from: from, date_to: to, total: total.toFixed(2), roots };
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
];

const serviceItemName = (id) => mockServiceItems.find((it) => it.id === Number(id))?.name || null;

// Catálogo facturable en la cuenta de una reserva: servicios + productos (para los cargos).
const mockConsumableItems = [
  ...mockServiceItems.map((it) => ({ ...it, type: 'SERVICE' })),
  { id: 905, name: 'Hamburguesa de la casa', description: 'Con papas rústicas', price: '32000.00', type: 'PRODUCT' },
  { id: 906, name: 'Plato de carne a la parrilla', description: 'Con guarnición', price: '48000.00', type: 'PRODUCT' },
  { id: 907, name: 'Limonada de coco', description: null, price: '12000.00', type: 'PRODUCT' },
];

const mockRentableUnits = [
  {
    id: 1, rentable_unit_type_id: 1, type_name: 'Cabaña', name: 'Cabaña El Roble',
    description: 'Cabaña de montaña con vista al valle.', capacity: 4, base_price_per_night: '320000.00',
    item_id: 901, item_name: 'Hospedaje cabaña',
    position: 1, status: 1,
    files: [], files_count: 0,
    spaces: [
      { id: 1, name: 'Habitación principal', description: 'Cama queen, A/C, baño privado', position: 1, files: [] },
      { id: 2, name: 'Sala de estar', description: 'Sofá cama, chimenea', position: 2, files: [] },
    ],
  },
  {
    id: 2, rentable_unit_type_id: 2, type_name: 'Habitación', name: 'Habitación Colibrí',
    description: 'Habitación doble estándar.', capacity: 2, base_price_per_night: '180000.00',
    item_id: 902, item_name: 'Hospedaje habitación',
    position: 2, status: 1,
    files: [], files_count: 0, spaces: [],
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
  capacity: u.capacity, base_price_per_night: u.base_price_per_night, position: u.position, status: u.status,
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
      capacity: u.capacity, base_price_per_night: u.base_price_per_night, available: !busy.has(u.id),
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
        base_price_per_night: Number(body.base_price_per_night).toFixed(2),
        item_id: Number(body.item_id) || null, item_name: serviceItemName(body.item_id),
        position: id, status: 1,
        files: (body.files || []).map((name, i) => ({ name, rentable_unit_space_id: null, url: null, thumbnail_url: null, position: i + 1 })),
        spaces: (body.spaces || []).map((sp, i) => ({ id: i + 1, name: sp.name, description: sp.description || null, position: i + 1, files: [] })),
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
    return {
      ...r,
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
        holder_user_id: 501, holder_user_name: holderName, holder_document_number: body.holder.id_number || null,
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
      id: r.id, code: r.code, rentable_unit_name: r.rentable_unit_name, holder_user_name: r.holder_user_name,
      check_in_date: r.check_in_date, check_out_date: r.check_out_date, nights: r.nights, total: r.total, status: r.status,
      precheckin_completed_at: r.precheckin_completed_at,
    }));
    const status = query.get('status');
    if (status !== null && status !== '') rows = rows.filter((r) => String(r.status) === status);
    const unitId = query.get('rentable_unit_id');
    if (unitId) rows = rows.filter((r) => String(r.rentable_unit_id) === unitId);
    return mockPaginate(rows, query);
  }

  const m = sub.match(/^reservations\/([^/]+)(?:\/(.+))?$/);
  if (!m) return undefined;
  const r = find(m[1]);
  if (!r) return null;
  const action = m[2];

  if (!action) return detail(r); // GET detalle
  if (action === 'confirm') { if (r.status === 1) r.status = 2; return detail(r); }
  if (action === 'check-in') { if (r.status === 2) { r.status = 3; r.checkin_at = new Date().toISOString(); } return detail(r); }
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
  const m = path.match(/^\/public\/checkin\/([^/]+)(?:\/(.+))?$/);
  if (!m) return undefined;
  const code = m[1];
  const action = m[2];
  const r = mockReservations.find((x) => x.code === code && [1, 2, 3].includes(x.status));

  const summary = (res) => {
    const paid = res.payments.filter((p) => p.status === 1).reduce((s, p) => s + Number(p.value), 0);
    const maskDoc = (d) => (!d ? null : (String(d).length <= 4 ? '****' : '****' + String(d).slice(-4)));
    return {
      code: res.code, company_name: mockCompany.name, unit_name: res.rentable_unit_name, unit_photo: null,
      check_in_date: res.check_in_date, check_out_date: res.check_out_date, nights: res.nights,
      total: res.total, paid: paid.toFixed(2), balance: (Number(res.total) - paid).toFixed(2),
      expected_arrival_time: res.expected_arrival_time, precheckin_completed: !!res.precheckin_completed_at,
      holder: { name: res.holder_user_name, document_masked: maskDoc(res.holder_document_number) },
      companions: res.guests.filter((g) => !g.is_holder).map((g) => ({ name: g.name })),
    };
  };

  if (!action) return r ? summary(r) : null;
  if (action === 'guests/lookup') return { exists: false };
  if (!r) return null;
  if (action === 'files' && method === 'POST') return { name: 'doc-' + Math.random().toString(36).slice(2, 8) };
  if (action === 'guests' && method === 'POST') {
    r.expected_arrival_time = body.expected_arrival_time || null;
    r.precheckin_completed_at = new Date().toISOString();
    r.holder_user_name = `${body.holder.first_name} ${body.holder.last_name}`;
    r.holder_document_number = body.holder.id_number || r.holder_document_number;
    r.guests = [{ id: 1, user_id: 501, is_holder: true, first_name: body.holder.first_name, last_name: body.holder.last_name, name: r.holder_user_name, document_number: body.holder.id_number || null },
      ...(body.companions || []).map((c, i) => ({ id: i + 2, user_id: 600 + i, is_holder: false, first_name: c.first_name, last_name: c.last_name, name: `${c.first_name} ${c.last_name}`, document_number: c.id_number || null }))];
    return summary(r);
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
    '/mesas': mockTables,
    '/notificaciones': mockNotifications,
    '/me': mockUser,
  };
  return map[path] ?? null;
}

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
  permissions: ['user-administrator', 'api-module-menus', 'api-module-products', 'api-module-company', 'api-module-stores'],
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
      const row = { id: nextId(mockItems), name: body.name, code: body.code || null, value: Number(body.value) || 0, file: null, item_type_id: Number(body.item_type_id), item_category_id: Number(body.item_category_id), item_status_id: 1, tax_family_id: body.tax_family_id != null && body.tax_family_id !== '' ? Number(body.tax_family_id) : null, description: body.description || '', position: mockItems.length };
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

// Genera el reporte de ventas por tipo con la misma forma que el backend.
function buildSalesByTypeReport(days, endDateStr, force) {
  const end = endDateStr ? new Date(endDateStr + 'T00:00:00') : new Date();
  const factor = force ? 1.08 : 1; // el long-press (force) recalcula → valores algo distintos en demo

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

  const products = daily.reduce((s, x) => s + x.products, 0);
  const services = daily.reduce((s, x) => s + x.services, 0);
  const ordersCount = daily.reduce((s, x) => s + x.orders_count, 0);
  const total = products + services;
  const avgTicket = ordersCount > 0 ? total / ordersCount : 0;

  return {
    period: {
      start_date: daily[0]?.date ?? null,
      end_date: daily[daily.length - 1]?.date ?? null,
      days,
    },
    totals: {
      products,
      products_formatted: mockMoney(products),
      services,
      services_formatted: mockMoney(services),
      total,
      total_formatted: mockMoney(total),
      orders_count: ordersCount,
      avg_ticket: avgTicket,
      avg_ticket_formatted: mockMoney(avgTicket),
    },
    daily,
  };
}

function resolveMetricsMock(path, query) {
  const m = path.match(/^\/companies\/[^/]+\/metrics\/sales-by-type$/);
  if (!m) return undefined;
  const days = Math.max(1, Math.min(30, parseInt(query.get('days'), 10) || 15));
  return buildSalesByTypeReport(days, query.get('end_date'), query.get('force') === '1');
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

  // Módulo de usuarios de la compañía (company-scoped: /companies/{company}/users…)
  const users = resolveUsersMock(path, query, opts);
  if (users !== undefined) return users;

  // Módulo de tiendas (company-scoped: /companies/{company}/stores…)
  const stores = resolveStoresMock(path, query, opts);
  if (stores !== undefined) return stores;

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

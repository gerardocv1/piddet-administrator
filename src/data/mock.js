// Datos de ejemplo (mock). Se usan cuando VITE_API_URL está vacío,
// para que el panel funcione sin backend. Replican la forma que debería
// devolver la API real de Piddet.

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

export const mockProducts = [
  { id: 1, name: 'Hamburguesa Clásica', cat: 'Hamburguesas', price: '$18.500', avail: true, destacado: true },
  { id: 2, name: 'Pizza Margarita', cat: 'Pizzas', price: '$32.000', avail: true, destacado: false },
  { id: 3, name: 'Limonada de coco', cat: 'Bebidas', price: '$9.000', avail: false, destacado: false },
  { id: 4, name: 'Ceviche mixto', cat: 'Entradas', price: '$28.000', avail: true, destacado: true },
  { id: 5, name: 'Brownie con helado', cat: 'Postres', price: '$12.000', avail: true, destacado: false },
  { id: 6, name: 'Papas a la francesa', cat: 'Acompañamientos', price: '$8.500', avail: false, destacado: false },
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

export const mockCategories = [
  { id: 1, name: 'Hamburguesas', productos: 8, orden: 1, activa: true },
  { id: 2, name: 'Pizzas', productos: 6, orden: 2, activa: true },
  { id: 3, name: 'Entradas', productos: 5, orden: 3, activa: true },
  { id: 4, name: 'Bebidas', productos: 12, orden: 4, activa: true },
  { id: 5, name: 'Postres', productos: 4, orden: 5, activa: false },
  { id: 6, name: 'Acompañamientos', productos: 7, orden: 6, activa: true },
];

export const mockToppings = [
  { id: 1, name: 'Queso extra', grupo: 'Hamburguesas', price: '$2.500', avail: true },
  { id: 2, name: 'Tocineta', grupo: 'Hamburguesas', price: '$3.000', avail: true },
  { id: 3, name: 'Champiñones', grupo: 'Pizzas', price: '$2.000', avail: true },
  { id: 4, name: 'Borde de queso', grupo: 'Pizzas', price: '$5.000', avail: false },
  { id: 5, name: 'Salsa de la casa', grupo: 'General', price: '$1.000', avail: true },
  { id: 6, name: 'Doble carne', grupo: 'Hamburguesas', price: '$6.000', avail: true },
];

export const mockStoresDetail = [
  { id: 1, name: 'La Cevichería', open: true, dir: 'Cra. 43 #12-30', tel: '320 111 2233', pedidos: 18 },
  { id: 2, name: 'Pizza Nostra', open: true, dir: 'Cl. 10 #5-40', tel: '301 444 5566', pedidos: 11 },
  { id: 3, name: 'Burguer Lab', open: false, dir: 'Av. Las Vegas #80-21', tel: '315 777 8899', pedidos: 0 },
  { id: 4, name: 'Sushi Express', open: true, dir: 'Cra. 70 #1-15', tel: '300 222 3344', pedidos: 6 },
];

export const mockUsers = [
  { id: 1, name: 'Gerardo Cruz', tel: '300 123 4567', rol: 'Administrador', activo: true },
  { id: 2, name: 'María López', tel: '311 222 3344', rol: 'Cajero', activo: true },
  { id: 3, name: 'Carlos Mejía', tel: '320 555 6677', rol: 'Mesero', activo: true },
  { id: 4, name: 'Ana Ruiz', tel: '315 888 9900', rol: 'Cocina', activo: false },
  { id: 5, name: 'Jorge Díaz', tel: '301 444 1122', rol: 'Mesero', activo: true },
];

export const mockUser = { name: 'Gerardo Cruz', role: 'Administrador' };

// Empresa (tenant) activa y empresas disponibles para el usuario (SaaS multi-tenant).
export const mockCompany = { id: 'pid-001', name: 'Grupo Sabor', plan: 'Pro', tiendas: 4 };
export const mockCompanies = [
  { id: 'pid-001', name: 'Grupo Sabor', plan: 'Pro', tiendas: 4 },
  { id: 'pid-002', name: 'Cocinas del Norte', plan: 'Básico', tiendas: 2 },
  { id: 'pid-003', name: 'Antojitos S.A.', plan: 'Pro', tiendas: 7 },
];

// Enrutador de mocks: mapea ruta → respuesta.
export function resolveMock(path) {
  const map = {
    '/stats': mockStats,
    '/pedidos': mockOrders,
    '/tiendas': mockStores,
    '/productos': mockProducts,
    '/categorias': mockCategories,
    '/toppings': mockToppings,
    '/tiendas-detalle': mockStoresDetail,
    '/usuarios': mockUsers,
    '/mesas': mockTables,
    '/notificaciones': mockNotifications,
    '/me': mockUser,
    '/company': mockCompany,
    '/companies': mockCompanies,
  };
  return map[path] ?? null;
}

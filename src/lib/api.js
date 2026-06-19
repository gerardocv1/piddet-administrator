// Cliente de API de Piddet.
// - Si VITE_API_URL está definido, hace fetch real contra ese backend.
// - Si está vacío, responde con datos de ejemplo (src/data/mock.js)
//   para que el panel funcione sin backend.
//
// Cuando conectes el backend real, define VITE_API_URL en tu archivo .env
// y ajusta las rutas/headers si tu API difiere.

import { resolveMock } from '../data/mock.js';

const BASE = import.meta.env.VITE_API_URL || '';
const USE_MOCK = !BASE;

function token() {
  return localStorage.getItem('piddet_token') || '';
}

async function request(path, { method = 'GET', body } = {}) {
  // --- Modo demo (sin backend) ---
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250)); // latencia simulada
    if (path === '/auth/login') return { token: 'demo-token', user: resolveMock('/me') };
    const data = resolveMock(path);
    if (data == null) throw new Error(`Mock sin datos para ${path}`);
    return data;
  }

  // --- Modo real (fetch) ---
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.status === 204 ? null : res.json();
}

// Nombres de método en inglés; las rutas (paths) se mantienen como las expone
// el backend de Piddet. Si tu API usa otras rutas, ajústalas aquí.
export const api = {
  // Auth
  login: (phone, password) => request('/auth/login', { method: 'POST', body: { phone, password } }),
  me: () => request('/me'),
  // Empresa (tenant)
  company: () => request('/company'),
  companies: () => request('/companies'),
  switchCompany: (id) => request('/company/switch', { method: 'POST', body: { id } }),
  // Dashboard
  stats: () => request('/stats'),
  orders: () => request('/pedidos'),
  stores: () => request('/tiendas'),
  // Oferta
  products: () => request('/productos'),
  createProduct: (data) => request('/productos', { method: 'POST', body: data }),
  updateProduct: (id, data) => request(`/productos/${id}`, { method: 'PUT', body: data }),
  deleteProduct: (id) => request(`/productos/${id}`, { method: 'DELETE' }),
  categories: () => request('/categorias'),
  createCategory: (data) => request('/categorias', { method: 'POST', body: data }),
  toppings: () => request('/toppings'),
  createTopping: (data) => request('/toppings', { method: 'POST', body: data }),
  // Tiendas y usuarios
  storesDetail: () => request('/tiendas-detalle'),
  users: () => request('/usuarios'),
  createUser: (data) => request('/usuarios', { method: 'POST', body: data }),
  // Operación
  tables: () => request('/mesas'),
  updateTable: (n, data) => request(`/mesas/${n}`, { method: 'PUT', body: data }),
  // Avisos
  notifications: () => request('/notificaciones'),
};

export { USE_MOCK };

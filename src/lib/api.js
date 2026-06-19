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

export const api = {
  // Auth
  login: (phone, password) => request('/auth/login', { method: 'POST', body: { phone, password } }),
  me: () => request('/me'),
  // Empresa (tenant)
  company: () => request('/company'),
  companies: () => request('/companies'),
  cambiarEmpresa: (id) => request('/company/switch', { method: 'POST', body: { id } }),
  // Dashboard
  stats: () => request('/stats'),
  pedidos: () => request('/pedidos'),
  tiendas: () => request('/tiendas'),
  // Oferta
  productos: () => request('/productos'),
  crearProducto: (data) => request('/productos', { method: 'POST', body: data }),
  actualizarProducto: (id, data) => request(`/productos/${id}`, { method: 'PUT', body: data }),
  eliminarProducto: (id) => request(`/productos/${id}`, { method: 'DELETE' }),
  categorias: () => request('/categorias'),
  crearCategoria: (data) => request('/categorias', { method: 'POST', body: data }),
  toppings: () => request('/toppings'),
  crearTopping: (data) => request('/toppings', { method: 'POST', body: data }),
  // Tiendas y usuarios
  tiendasDetalle: () => request('/tiendas-detalle'),
  usuarios: () => request('/usuarios'),
  crearUsuario: (data) => request('/usuarios', { method: 'POST', body: data }),
  // Operación
  mesas: () => request('/mesas'),
  actualizarMesa: (n, data) => request(`/mesas/${n}`, { method: 'PUT', body: data }),
  // Avisos
  notificaciones: () => request('/notificaciones'),
};

export { USE_MOCK };

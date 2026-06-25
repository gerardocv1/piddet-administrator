// Servicio: menús de la compañía activa y sus ítems (productos asignados).
//
// Company-scoped: todas las rutas cuelgan de /companies/{company}/… (igual que permissions).
// La compañía activa se resuelve internamente desde la fachada `auth`, así las pantallas no
// tienen que pasarla. El orden (categorías/ítems) se persiste con el campo `position` en cada
// PUT, porque el backend no expone un endpoint de reorden en lote.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

// Prefijo company-scoped. Usa username si existe (rutas legibles) o el id como respaldo.
const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

// Construye un query string a partir de un objeto (omite null/undefined/'').
const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const menusService = {
  // Listado paginado de menús. { page, search }
  menus: ({ page = 1, search = '', row = 12 } = {}) =>
    http.get(`${base()}/menus${qs({ page, _search: search, _row: row })}`, { paginated: true }),
  menu: (id) => http.get(`${base()}/menus/${id}`),
  // Carta del menú: menú + productos (con descripción e imagen) agrupados por categoría.
  menuContent: (id) => http.get(`${base()}/menus/${id}/full`),
  // Carta pública (sin sesión): se resuelve por username de compañía + de menú. Devuelve también
  // los datos de marca de la compañía (no hay `auth` desde el que leerlos). NO usa base().
  publicMenuContent: (companyUsername, menuUsername) =>
    http.get(`/public/${companyUsername}/m/${menuUsername}`),
  // Guarda la configuración de presentación de la carta (diseño, color, fondo) en el menú.
  saveMenuConfig: (id, config) => http.put(`${base()}/menus/${id}/config`, { config }),
  // Guarda la configuración de presentación de una categoría (p. ej. su plantilla/frame).
  saveCategoryConfig: (menuId, categoryId, config) =>
    http.put(`${base()}/menus/${menuId}/categories/${categoryId}/config`, { config }),
  createMenu: (data) => http.post(`${base()}/menus`, data),
  updateMenu: (id, data) => http.put(`${base()}/menus/${id}`, data),
  deleteMenu: (id) => http.del(`${base()}/menus/${id}`),

  // Ítems del menú (array plano, ya ordenado por categoría y posición; se agrupa en cliente).
  menuItems: (menuId) => http.get(`${base()}/menus/${menuId}/items`),
  addMenuItem: (menuId, data) => http.post(`${base()}/menus/${menuId}/items`, data),
  updateMenuItem: (menuId, itemId, data) => http.put(`${base()}/menus/${menuId}/items/${itemId}`, data),
  deleteMenuItem: (menuId, itemId) => http.del(`${base()}/menus/${menuId}/items/${itemId}`),

  // Buscador de productos disponibles para asignar (el backend excluye los ya asignados).
  searchMenuProducts: (menuId, { q = '', page = 1, row = 15 } = {}) =>
    http.get(`${base()}/menus/${menuId}/items/search${qs({ q, page, _row: row })}`, { paginated: true }),
};

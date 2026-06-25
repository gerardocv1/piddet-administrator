// Servicio: categorías de productos (item-categories) — lado COMPAÑÍA.
//
// Las categorías son un CATÁLOGO GLOBAL ("elite") administrado por plataforma (ver
// masterItemCategories.js). Desde la compañía NO se crean ni editan: solo se LEEN (para elegir
// categoría al crear un producto) y se ORDENAN las que la compañía usa. El orden por compañía
// vive en item_category_companies y se persiste con `sortItemCategories`.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';
import { createTtlCache } from '../cache.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

const FILTERS_TTL_MS = 30 * 60 * 1000; // opciones de filtro: se cachean 30 min antes de re-consultar
const filtersCache = createTtlCache(FILTERS_TTL_MS);
const companyKey = () => {
  const c = auth.getCompany();
  return String(c?.id ?? c?.username ?? '');
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const itemCategoriesService = {
  // Listado paginado del catálogo visible (legadas de la compañía + globales). { page, search, typeId }
  itemCategories: ({ page = 1, search = '', typeId, row = 12 } = {}) =>
    http.get(`${base()}/item-categories${qs({ page, _search: search, item_type_id: typeId, _row: row })}`, { paginated: true }),
  // Todas las categorías de un tipo (para los <Select> de productos). `_row` alto: traerlas de una vez.
  allItemCategories: ({ typeId } = {}) =>
    http.get(`${base()}/item-categories${qs({ item_type_id: typeId, _row: 200 })}`, { paginated: true }),
  // Árbol jerárquico anidado del catálogo activo (raíces con children[]), para elegir la categoría
  // en cascada al crear/editar un producto. Filtra por tipo.
  itemCategoriesTree: ({ typeId } = {}) =>
    http.get(`${base()}/item-categories/tree${qs({ item_type_id: typeId })}`),
  // Categorías que la compañía usa (tiene productos), en su orden actual — para la vista de orden.
  categoryOrdering: () => http.get(`${base()}/item-categories/ordering`),
  // Reorden en lote por compañía (escribe item_category_companies): { elements: [{ id, position }] }.
  sortItemCategories: (elements) => {
    filtersCache.delete(companyKey());
    return http.put(`${base()}/item-categories/sort`, { elements });
  },
  // Opciones de los filtros de productos (pantalla Productos): tipos y categorías que la compañía
  // realmente usa (tiene productos), derivados del ordering. Cacheado por compañía 30 min para no
  // re-consultar en cada visita; `force` ignora la caché. Estructura: { types[], categories[] }.
  productFilters: async ({ force = false } = {}) => {
    const key = companyKey();
    if (!force) {
      const hit = filtersCache.get(key);
      if (hit) return hit;
    }
    const rows = await http.get(`${base()}/item-categories/ordering`);
    const list = Array.isArray(rows) ? rows : [];
    const types = [];
    const seenTypes = new Set();
    const categories = [];
    for (const row of list) {
      categories.push({ id: row.id, name: row.name, item_type_id: row.item_type_id });
      if (row.item_type_id != null && !seenTypes.has(row.item_type_id)) {
        seenTypes.add(row.item_type_id);
        types.push({ id: row.item_type_id, name: row.type_name });
      }
    }
    const result = { types, categories };
    filtersCache.set(key, result);
    return result;
  },
};

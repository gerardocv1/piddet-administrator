// Servicio: gastos de la compañía activa (compras, nómina, servicios, etc.).
//
// Company-scoped: las rutas cuelgan de /companies/{company}. Un gasto es un encabezado
// (fecha, proveedor, método de pago, nota, fotos privadas en S3, quién registró) con varias
// líneas (categoría + descripción libre + valor); el total lo calcula el backend. Los gastos
// no se editan: solo se crean y se anulan (permiso expense-annul). Las categorías forman un
// árbol global (sembrado por la plataforma) al que la compañía puede añadir las suyas, y los
// proveedores se crean al vuelo enviando supplier_name en lugar de supplier_id.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const expensesService = {
  // Listado paginado por rango de fechas, categoría (incluye su subárbol), método de pago y estado.
  expenses: ({ dateFrom = '', dateTo = '', categoryId = '', paymentMethod = '', status = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/expenses${qs({ date_from: dateFrom, date_to: dateTo, category_id: categoryId, payment_method: paymentMethod, status, page, per_page: perPage })}`, { paginated: true }),

  // Detalle completo: líneas con categoría, fotos con URL firmada temporal, proveedor, creador.
  expense: (expenseId) => http.get(`${base()}/expenses/${expenseId}`),

  // Crea el gasto. `files` son los `name` devueltos por uploadFile (folder 'expenses', privados).
  createExpense: (data) => http.post(`${base()}/expenses`, data),

  // Anula el gasto (irreversible). Devuelve el detalle actualizado.
  annulExpense: (expenseId) => http.patch(`${base()}/expenses/${expenseId}/annul`),

  // Adjunta fotos (names ya subidos con uploadFile) a un gasto ACTIVO. Devuelve el detalle.
  attachExpenseFiles: (expenseId, names) => http.post(`${base()}/expenses/${expenseId}/files`, { files: names }),

  // Quita una foto del gasto y la borra de S3 (irreversible). Devuelve el detalle.
  detachExpenseFile: (expenseId, name) => http.del(`${base()}/expenses/${expenseId}/files${qs({ name })}`),

  // Totales por categoría raíz con drill-down a subcategorías, excluyendo anulados.
  expensesSummary: ({ dateFrom = '', dateTo = '' } = {}) =>
    http.get(`${base()}/expenses/summary${qs({ date_from: dateFrom, date_to: dateTo })}`),

  // Árbol de categorías visible para la compañía (globales + propias), raíces con children[].
  expenseCategoriesTree: () => http.get(`${base()}/expense-categories/tree`),

  // Crea una categoría propia de la compañía (puede colgar de una global). { name, parent_id? }
  createExpenseCategory: (data) => http.post(`${base()}/expense-categories`, data),

  // Búsqueda de proveedores para el autocomplete del formulario.
  expenseSuppliers: (q) => http.get(`${base()}/expense-suppliers${qs({ q })}`),

  // Catálogo global de métodos de pago (piddet_orders.payment_methods): [{ id, name }].
  paymentMethods: () => http.get(`${base()}/payment-methods`),
};

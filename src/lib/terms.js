// Terminología por tipo de compañía (perfil → Tipo de empresa).
//
// La terminología por defecto del panel es la de un restaurante; cada tipo declara SOLO lo que
// renombra. Diccionarios por tipo:
//   modules     → etiquetas de módulos padre y migas ('Menús', 'Ventas', 'Egresos'…)
//   moduleIcons → icono del módulo padre cuando el renombre pide otra metáfora
//   routes      → etiquetas de rutas del menú, por path ('/products', '/menus'…)
//   routeIcons  → icono de la ruta cuando cambia con la etiqueta
//   titles      → títulos de pantalla del topbar (META del Layout), por path
//   phrases     → frases sueltas dentro de las vistas ('Ventas totales', 'Ventas por día'…)
//   entities    → cómo se llama la ENTIDAD dentro de su módulo (botones, modales, toasts):
//                 { one, many, pub, pubFull, sample }. Todos los nombres son masculinos
//                 (menú, catálogo público, ítem, producto, servicio), así los participios
//                 alrededor ("creado", "eliminado") no necesitan flexión.
//
// El tipo viaja en la compañía de la sesión (`company_type_key`, lo resuelve el backend).
// Cambiarlo desde el perfil fuerza una recarga completa —mismo patrón que cambiar de
// compañía— para que ninguna pantalla conserve la terminología anterior.

import { auth } from './auth/index.js';

// La entidad "menu" distingue el registro que se administra (`one`/`many`) de su cara pública
// compartible (`pub`/`pubFull`): en un restaurante el menú se publica como "carta"; en los
// demás tipos ambos colapsan en "catálogo público".
const DEFAULT_ENTITIES = {
  menu: { one: 'menú', many: 'menús', pub: 'carta', pubFull: 'carta pública', sample: 'Carta principal' },
  product: { one: 'producto', many: 'productos' },
};

const CATALOG_MENU = {
  one: 'catálogo público',
  many: 'catálogos públicos',
  pub: 'catálogo público',
  pubFull: 'catálogo público',
  sample: 'Catálogo general',
};

export const COMPANY_TYPE_TERMS = {
  // La terminología por defecto ya es de restaurante: no renombra nada.
  restaurant: {},
  gym: {
    modules: { 'Menús': 'Catálogo', 'Ventas': 'Ingresos', 'Egresos': 'Gastos' },
    moduleIcons: { 'Menús': 'fas fa-box-open' },
    routes: { '/products': 'Ítems', '/menus': 'Catálogo público' },
    routeIcons: { '/products': 'fas fa-boxes-stacked', '/menus': 'fas fa-share-nodes' },
    titles: {
      '/products': 'Ítems',
      '/menus': 'Catálogos públicos',
      '/sales-report': 'Reporte de ingresos',
    },
    phrases: {
      'Ventas': 'Ingresos',
      'ventas': 'ingresos',
      'Ventas totales': 'Ingresos totales',
      'Ventas por día': 'Ingresos por día',
      'Sin ventas en el rango': 'Sin ingresos en el rango',
      'No hay ventas en el rango seleccionado.': 'No hay ingresos en el rango seleccionado.',
      'Cargando ventas…': 'Cargando ingresos…',
      'No hay ventas en el período seleccionado.': 'No hay ingresos en el período seleccionado.',
    },
    entities: { menu: CATALOG_MENU, product: { one: 'ítem', many: 'ítems' } },
  },
  store: {
    modules: { 'Menús': 'Catálogo', 'Egresos': 'Gastos' },
    moduleIcons: { 'Menús': 'fas fa-box-open' },
    routes: { '/menus': 'Catálogo público' },
    routeIcons: { '/menus': 'fas fa-share-nodes' },
    titles: { '/menus': 'Catálogos públicos' },
    entities: { menu: CATALOG_MENU },
  },
  lodging: {
    modules: { 'Menús': 'Servicios', 'Ventas': 'Ingresos', 'Egresos': 'Gastos' },
    moduleIcons: { 'Menús': 'fas fa-bell-concierge' },
    routes: { '/products': 'Servicios', '/menus': 'Catálogo público' },
    routeIcons: { '/products': 'fas fa-bell-concierge', '/menus': 'fas fa-share-nodes' },
    titles: {
      '/products': 'Servicios',
      '/menus': 'Catálogos públicos',
      '/sales-report': 'Reporte de ingresos',
    },
    phrases: {
      'Ventas': 'Ingresos',
      'ventas': 'ingresos',
      'Ventas totales': 'Ingresos totales',
      'Ventas por día': 'Ingresos por día',
      'Sin ventas en el rango': 'Sin ingresos en el rango',
      'No hay ventas en el rango seleccionado.': 'No hay ingresos en el rango seleccionado.',
      'Cargando ventas…': 'Cargando ingresos…',
      'No hay ventas en el período seleccionado.': 'No hay ingresos en el período seleccionado.',
    },
    entities: { menu: CATALOG_MENU, product: { one: 'servicio', many: 'servicios' } },
  },
};

const dict = () => COMPANY_TYPE_TERMS[auth.getCompany()?.company_type_key] || null;

/** Etiqueta de un módulo padre o miga ('Menús', 'Ventas'…) según el tipo de compañía. */
export const moduleTerm = (label) => dict()?.modules?.[label] ?? label;

/** Icono del módulo padre según el tipo de compañía; sin renombre, el declarado. */
export const moduleIcon = (label, fallback) => dict()?.moduleIcons?.[label] ?? fallback;

/** Etiqueta de una ruta del menú según el tipo de compañía; sin renombre, la declarada. */
export const routeTerm = (to, fallback) => dict()?.routes?.[to] ?? fallback;

/** Icono de una ruta del menú según el tipo de compañía; sin renombre, el declarado. */
export const routeIcon = (to, fallback) => dict()?.routeIcons?.[to] ?? fallback;

/** Título de pantalla (topbar) para una ruta según el tipo de compañía. */
export const titleTerm = (path, fallback) => dict()?.titles?.[path] ?? fallback;

/** Frase suelta de una vista ('Ventas totales'…) según el tipo de compañía. */
export const phrase = (text) => dict()?.phrases?.[text] ?? text;

/** Nombres de una entidad ('menu' | 'product') según el tipo de compañía, con los defaults
 *  de restaurante como base. Las pantallas componen sus textos con esto. */
export const entityTerm = (name) => ({ ...DEFAULT_ENTITIES[name], ...(dict()?.entities?.[name] || {}) });

/** Primera letra en mayúscula, para abrir títulos y toasts con la entidad. */
export const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

// Terminología por tipo de compañía (perfil → Tipo de empresa).
//
// La terminología por defecto del panel es la de un restaurante; cada tipo declara SOLO lo que
// renombra. Tres diccionarios por tipo:
//   modules → etiquetas de módulos padre y migas ('Menús', 'Ventas', 'Egresos'…)
//   routes  → etiquetas de rutas del menú, por path ('/products', '/menus'…)
//   titles  → títulos de pantalla del topbar (META del Layout), por path
//   phrases → frases sueltas dentro de las vistas ('Ventas totales', 'Ventas por día'…)
//
// El tipo viaja en la compañía de la sesión (`company_type_key`, lo resuelve el backend).
// Cambiarlo desde el perfil fuerza una recarga completa —mismo patrón que cambiar de
// compañía— para que ninguna pantalla conserve la terminología anterior.

import { auth } from './auth/index.js';

export const COMPANY_TYPE_TERMS = {
  // La terminología por defecto ya es de restaurante: no renombra nada.
  restaurant: {},
  gym: {
    modules: { 'Menús': 'Catálogo', 'Ventas': 'Ingresos', 'Egresos': 'Gastos' },
    routes: { '/products': 'Ítems', '/menus': 'Catálogo público' },
    titles: {
      '/products': 'Ítems',
      '/menus': 'Catálogos públicos',
      '/sales-report': 'Reporte de ingresos',
    },
    phrases: {
      'Ventas': 'Ingresos',
      'Ventas totales': 'Ingresos totales',
      'Ventas por día': 'Ingresos por día',
    },
  },
  store: {
    modules: { 'Menús': 'Catálogo', 'Egresos': 'Gastos' },
    routes: { '/menus': 'Catálogo público' },
    titles: { '/menus': 'Catálogos públicos' },
  },
  lodging: {
    modules: { 'Menús': 'Servicios', 'Ventas': 'Ingresos', 'Egresos': 'Gastos' },
    routes: { '/products': 'Servicios', '/menus': 'Catálogo público' },
    titles: {
      '/products': 'Servicios',
      '/menus': 'Catálogos públicos',
      '/sales-report': 'Reporte de ingresos',
    },
    phrases: {
      'Ventas': 'Ingresos',
      'Ventas totales': 'Ingresos totales',
      'Ventas por día': 'Ingresos por día',
    },
  },
};

const dict = () => COMPANY_TYPE_TERMS[auth.getCompany()?.company_type_key] || null;

/** Etiqueta de un módulo padre o miga ('Menús', 'Ventas'…) según el tipo de compañía. */
export const moduleTerm = (label) => dict()?.modules?.[label] ?? label;

/** Etiqueta de una ruta del menú según el tipo de compañía; sin renombre, la declarada. */
export const routeTerm = (to, fallback) => dict()?.routes?.[to] ?? fallback;

/** Título de pantalla (topbar) para una ruta según el tipo de compañía. */
export const titleTerm = (path, fallback) => dict()?.titles?.[path] ?? fallback;

/** Frase suelta de una vista ('Ventas totales'…) según el tipo de compañía. */
export const phrase = (text) => dict()?.phrases?.[text] ?? text;

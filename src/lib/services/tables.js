// Servicio: mesas (operación).
//
// Mesas físicas del local, **company-scoped**. El panel las configura (nombre, descripción,
// capacidad), las activa/desactiva y consulta/fuerza su estado de ocupación; el POS es quien
// normalmente mueve `status` entre available/occupied al asignar o liberar la mesa.
//
// Una mesa nunca se borra: se desactiva (`is_active = false`) para conservar el historial de
// órdenes que la referencian.
//
// Registro: { id, name, description, capacity, status: 'available'|'occupied', is_active }.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

export const tablesService = {
  // Todas las mesas de la compañía (activas e inactivas), para el panel.
  tables: () => http.get(`${base()}/tables`),
  // Crea una mesa: { name, description, capacity }. Nace activa y disponible.
  createTable: (data) => http.post(`${base()}/tables`, data),
  // Actualiza nombre/descripción/capacidad.
  updateTable: (tableId, data) => http.put(`${base()}/tables/${tableId}`, data),
  // Activa/desactiva la mesa: { is_active }.
  setTableActive: (tableId, isActive) =>
    http.patch(`${base()}/tables/${tableId}/active`, { is_active: isActive }),
  // Fuerza el estado de ocupación desde el panel: { status: 'available' | 'occupied' }.
  setTableStatus: (tableId, status) =>
    http.patch(`${base()}/tables/${tableId}/status`, { status }),
  // Libera todas las mesas activas (cierre de turno).
  makeAllTablesAvailable: () => http.patch(`${base()}/tables/make-all-available`),
};

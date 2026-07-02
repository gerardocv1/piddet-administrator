// Etiquetas y variantes visuales de las claves de estado/origen/servicio de las órdenes.
// Las claves son las que expone el backend (piddet_orders); el texto visible va en español.

export const ORDER_STATUS = {
  CREATED: { label: 'Creada', variant: 'info' },
  UPDATE: { label: 'Actualizada', variant: 'info' },
  ACCEPTED_IN_STORE: { label: 'Aceptada', variant: 'success' },
  CANCELLED: { label: 'Cancelada', variant: 'danger' },
};

export const PAYMENT_STATUS = {
  PAID: { label: 'Pagada', variant: 'success' },
  WITHOUT_PAYMENT: { label: 'Sin pago', variant: 'warning' },
};

export const SERVICE_TYPES = {
  DINE_IN: 'En mesa',
  TAKE_OUT: 'Para llevar',
};

export const ORIGINS = {
  POS: 'Punto de venta',
  WAITER: 'Mesero',
};

export const PAYMENT_METHODS = {
  cash: 'Efectivo',
  nequi: 'Nequi',
};

export const orderStatusOf = (key) => ORDER_STATUS[key] || { label: key || '—', variant: 'neutral' };
export const paymentStatusOf = (key) => PAYMENT_STATUS[key] || { label: key || '—', variant: 'neutral' };
export const serviceTypeLabel = (key) => SERVICE_TYPES[key] || key || '—';
export const originLabel = (key) => ORIGINS[key] || key || '—';
export const paymentMethodLabel = (key) => PAYMENT_METHODS[key] || key || '—';

/** Fecha local de hoy en formato YYYY-MM-DD (para el selector de día). */
export const todayIso = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Hora HH:mm a partir del `created_date` del backend ("YYYY-MM-DD HH:mm:ss"). */
export const timeOf = (createdDate) => (createdDate || '').slice(11, 16) || '—';

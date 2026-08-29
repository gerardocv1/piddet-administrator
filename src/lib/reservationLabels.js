// Helpers del módulo de reservas de hospedaje: formato de moneda y etiquetas de estado.

import { addDaysIso, todayIso } from './dates.js';

// Formato de moneda local (los montos llegan canónicos: "295000.00").
export const reservationMoney = (value) =>
  '$ ' + Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });

// Estados de una reserva (deben coincidir con las constantes del modelo Reservation del backend).
export const RESERVATION_STATUS = {
  CANCELLED: 0,
  PENDING: 1,
  CONFIRMED: 2,
  CHECKED_IN: 3,
  CHECKED_OUT: 4,
  VALIDATING_PAYMENT: 5,
};

// Etiqueta + variante de Badge por estado de reserva. Cancelada va en gris a propósito:
// es un estado terminal sin relevancia operativa y no debe llamar la atención en los listados.
export const reservationStatusMeta = (status) => {
  switch (Number(status)) {
    case RESERVATION_STATUS.PENDING: return { label: 'Pendiente', variant: 'warning' };
    case RESERVATION_STATUS.VALIDATING_PAYMENT: return { label: 'Validando pago', variant: 'warning' };
    case RESERVATION_STATUS.CONFIRMED: return { label: 'Confirmada', variant: 'info' };
    case RESERVATION_STATUS.CHECKED_IN: return { label: 'En estadía', variant: 'success' };
    case RESERVATION_STATUS.CHECKED_OUT: return { label: 'Finalizada', variant: 'neutral' };
    case RESERVATION_STATUS.CANCELLED: return { label: 'Cancelada', variant: 'neutral' };
    default: return { label: '—', variant: 'neutral' };
  }
};

// Emoji de las reservas con decoración (`has_decoration` del backend): son bombas porque lo que
// avisa es un montaje que hay que dejar listo antes de que llegue el huésped. Va junto al código
// de la reserva en los listados, el calendario y el detalle.
export const DECORATION_EMOJI = '🎈';
export const DECORATION_LABEL = 'Reserva con decoración';

// Estados que todavía ocupan la unidad: los mismos que el backend considera vigentes.
const LIVE_STATUSES = [
  RESERVATION_STATUS.PENDING,
  RESERVATION_STATUS.VALIDATING_PAYMENT,
  RESERVATION_STATUS.CONFIRMED,
  RESERVATION_STATUS.CHECKED_IN,
];

// Aviso de entrada inminente: 'Hoy' / 'Mañana' para las reservas vigentes, null para el resto.
// El backend ya las sube al principio del listado; esta etiqueta explica por qué están ahí.
export const checkInProximity = (checkInDate, status) => {
  if (!checkInDate || !LIVE_STATUSES.includes(Number(status))) return null;
  const today = todayIso();
  if (checkInDate === today) return { label: 'Hoy', variant: 'danger' };
  if (checkInDate === addDaysIso(today, 1)) return { label: 'Mañana', variant: 'warning' };
  return null;
};

// Tipos de documento de identidad soportados (ids del catálogo del backend).
export const ID_TYPES = [
  { value: '1', label: 'Cédula' },
  { value: '3', label: 'Cédula de extranjería' },
  { value: '4', label: 'Pasaporte' },
];

export const idTypeLabel = (idTypeId) =>
  ID_TYPES.find((it) => it.value === String(idTypeId))?.label || 'Documento';

// Franjas de hora aproximada de llegada del pre-check-in (valor guardado → etiqueta legible).
export const ARRIVAL_SLOTS = [
  { value: '12-15', label: '12:00 – 3:00 p. m.' },
  { value: '15-18', label: '3:00 – 6:00 p. m.' },
  { value: '18-21', label: '6:00 – 9:00 p. m.' },
  { value: '21+', label: 'Después de 9:00 p. m.' },
];

export const arrivalSlotLabel = (value) =>
  ARRIVAL_SLOTS.find((s) => s.value === value)?.label || value || '—';

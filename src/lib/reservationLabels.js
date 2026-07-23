// Helpers del módulo de reservas de hospedaje: formato de moneda y etiquetas de estado.

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
};

// Etiqueta + variante de Badge por estado de reserva.
export const reservationStatusMeta = (status) => {
  switch (Number(status)) {
    case RESERVATION_STATUS.PENDING: return { label: 'Pendiente', variant: 'warning' };
    case RESERVATION_STATUS.CONFIRMED: return { label: 'Confirmada', variant: 'info' };
    case RESERVATION_STATUS.CHECKED_IN: return { label: 'En estadía', variant: 'success' };
    case RESERVATION_STATUS.CHECKED_OUT: return { label: 'Finalizada', variant: 'neutral' };
    case RESERVATION_STATUS.CANCELLED: return { label: 'Cancelada', variant: 'danger' };
    default: return { label: '—', variant: 'neutral' };
  }
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

// Helpers del módulo de turnos: etiquetas en español y formato de moneda/fecha.

// Formato de moneda local (los montos llegan canónicos: "295000.00"). Los negativos
// (faltantes) conservan el signo.
export const shiftMoney = (value) => {
  const n = Number(value || 0);
  return (n < 0 ? '-$ ' : '$ ') + Math.abs(n).toLocaleString('es-CO', { maximumFractionDigits: 0 });
};

export const SHIFT_TYPE_LABELS = {
  GLOBAL: 'Global',
  EMPLOYEE: 'Cajero',
};

export const SHIFT_STATUS_LABELS = {
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
};

export const MOVEMENT_TYPE_LABELS = {
  order: 'Venta',
  expense: 'Gasto',
  adjustment: 'Ajuste',
};

// "2026-08-16 09:30:00" → "16 ago, 9:30 a. m." (fecha corta + hora local).
export const shiftDateTime = (value) => {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  const date = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${time}`;
};

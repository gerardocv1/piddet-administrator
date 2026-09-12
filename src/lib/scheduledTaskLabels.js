// Etiquetas de la bitácora del scheduler. Las claves son las del backend
// (ScheduledTaskRun: status 1|2|3|4, origin 1|2 y los nombres de comando); aquí se traducen a
// texto visible.

const STATUS = {
  1: { label: 'En curso', variant: 'info' },
  2: { label: 'Exitosa', variant: 'success' },
  3: { label: 'Fallida', variant: 'danger' },
  // Solo las lanzadas a mano: si se queda aquí, el worker de colas no está corriendo.
  4: { label: 'En cola', variant: 'warning' },
};

export function runStatusOf(status) {
  return STATUS[status] || { label: 'Sin ejecutar', variant: 'neutral' };
}

export const RUN_STATUS_OPTIONS = [
  { value: '2', label: 'Exitosa' },
  { value: '3', label: 'Fallida' },
  { value: '1', label: 'En curso' },
  { value: '4', label: 'En cola' },
];

// Una corrida sigue viva mientras esté en cola o en curso: es lo que el panel refresca solo.
export const ACTIVE_RUN_STATUSES = [1, 4];

export function isRunActive(status) {
  return ACTIVE_RUN_STATUSES.includes(Number(status));
}

// Qué es cada comando, en lenguaje del negocio y no del servidor.
const COMMANDS = {
  'gym:transition-subscriptions': {
    label: 'Suscripciones (cierre y cobro)',
    detail: 'Cierra períodos vencidos, corta por no pago y genera el cobro siguiente',
    schedule: '00:00',
  },
  'gym:emit-subscription-events': {
    label: 'Avisos de vencimiento',
    detail: 'Avisa al socio que su período con saldo vence pronto',
    schedule: '18:00',
  },
  'sales:aggregate-item-stats': {
    label: 'Orden de productos',
    detail: 'Consolida las ventas del día y reordena el menú por popularidad',
    schedule: '03:00',
  },
  'reservations:send-checkin-reminders': {
    label: 'Recordatorio de llegada',
    detail: 'Avisa por SMS al titular que hoy llega y que complete su pre-check-in',
    schedule: '10:00',
  },
};

export function commandOf(command) {
  return COMMANDS[command] || { label: command || '—', detail: '', schedule: '' };
}

export const COMMAND_OPTIONS = Object.entries(COMMANDS).map(([value, { label }]) => ({ value, label }));

// Contadores del `summary`, con nombre visible. Lo que no esté aquí se muestra con su clave.
const SUMMARY_LABELS = {
  date: 'Fecha procesada',
  candidates: 'Reservas del día',
  sent: 'Recordatorios enviados',
  already_notified: 'Ya avisadas',
  skipped_no_phone: 'Sin celular',
  skipped_no_code: 'Sin código',
  preview_total: 'Mensajes que saldrían',
  days: 'Días procesados',
  processed: 'Suscripciones procesadas',
  generated: 'Períodos generados',
  cancelled: 'Canceladas por no pago',
  expiring: 'Avisos enviados',
  daily_rows: 'Filas de venta diaria',
  companies: 'Compañías',
  stats_rows: 'Filas de ranking',
  purged_rows: 'Filas depuradas',
};

export function summaryLabel(key) {
  return SUMMARY_LABELS[key] || key;
}

// Quién lanzó la corrida. El origen manual es lo que explica una corrida a deshora.
export function originLabel(origin) {
  return Number(origin) === 2 ? 'Lanzada a mano' : 'Programada';
}

// 4120 → "4,1 s"; 320 → "320 ms". La duración es lo que delata una corrida que se degradó.
export function formatDuration(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1).replace('.', ',')} s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ${Math.round(seconds % 60)} s`;
}

// "2026-09-10T00:00:04" → "10/09/2026 00:00" (sin depender de la zona del navegador).
export function formatDateTime(value) {
  if (!value) return '—';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return String(value);
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
}

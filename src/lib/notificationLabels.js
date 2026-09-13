// Etiquetas del historial de notificaciones. Las claves son las del backend (NotificationStatus
// 1|2|3 y NotificationType 1 SMS | 2 push | 3 correo); aquí se traducen a texto visible.

const STATUS = {
  1: { label: 'Pendiente', variant: 'warning' },
  2: { label: 'Enviada', variant: 'success' },
  3: { label: 'Fallida', variant: 'danger' },
};

export function notificationStatusOf(status) {
  return STATUS[status] || { label: '—', variant: 'neutral' };
}

export const NOTIFICATION_STATUS_OPTIONS = [
  { value: '2', label: 'Enviada' },
  { value: '3', label: 'Fallida' },
  { value: '1', label: 'Pendiente' },
];

const TYPES = { 1: 'SMS', 2: 'Push', 3: 'Correo' };

export function notificationTypeOf(type) {
  return TYPES[type] || '—';
}

export const NOTIFICATION_TYPE_OPTIONS = [
  { value: '1', label: 'SMS' },
  { value: '2', label: 'Push' },
  { value: '3', label: 'Correo' },
];

// Por qué salió el mensaje. El backend devuelve los motivos que la compañía ha usado de verdad
// (`source_reference`); los conocidos se muestran en lenguaje del negocio y el resto, tal cual.
const SOURCE_REFERENCES = {
  RESERVATION_CHECKIN_REMINDER: 'Recordatorio de llegada',
  USER_CHANGE_PASSWORD: 'Cambio de contraseña',
  REGISTER_USER: 'Registro de usuario',
  TICKET_REGISTERED: 'Registro de ticket',
};

export function sourceReferenceLabel(reference) {
  if (!reference) return '—';
  return SOURCE_REFERENCES[reference] || reference;
}

// "2026-09-12" → "12/09/2026"; "2026-09-12T10:00:04" → "12/09/2026 10:00" (sin depender de la
// zona del navegador, como el resto de fechas que llegan ya formateadas del backend).
export function formatNotificationDate(value) {
  if (!value) return '—';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return String(value);
  return m[4] ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : `${m[3]}/${m[2]}/${m[1]}`;
}

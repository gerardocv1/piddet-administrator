// Etiquetas del módulo de fallos de sincronización de órdenes. Las claves son las del
// backend (support_status: pending | resolved | unrecoverable); aquí se traducen a texto
// visible y a la variante de Badge.

const SUPPORT_STATUS = {
  pending: { label: 'Pendiente', variant: 'warning' },
  resolved: { label: 'Resuelto', variant: 'success' },
  unrecoverable: { label: 'No recuperable', variant: 'danger' },
};

export function supportStatusOf(status) {
  return SUPPORT_STATUS[status] || { label: status || '—', variant: 'neutral' };
}

export const SUPPORT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'unrecoverable', label: 'No recuperable' },
];

// "2026-07-02T13:47:00" → "02/07/2026 13:47" (sin depender de la zona del navegador).
export function formatDateTime(value) {
  if (!value) return '—';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return String(value);
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
}

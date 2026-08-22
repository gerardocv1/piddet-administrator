// Helpers del módulo de gimnasio: formato de moneda y etiquetas de dominio.

// Formato de moneda local (los montos llegan canónicos: "295000.00").
export const gymMoney = (value) =>
  '$ ' + Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });

// Estado activo/inactivo (0/1), compartido por planes y afiliados — misma convención que el resto
// de catálogos del backend (RentableUnit, GymPlan, GymMember: STATUS_ACTIVE=1/STATUS_INACTIVE=0).
export const GYM_ACTIVE_STATUS = { INACTIVE: 0, ACTIVE: 1 };
export const gymActiveStatusMeta = (status) =>
  (Number(status) === GYM_ACTIVE_STATUS.ACTIVE
    ? { label: 'Activo', variant: 'success' }
    : { label: 'Inactivo', variant: 'neutral' });

// Alias históricos por dominio (mismas constantes/función, para que cada pantalla se lea sola).
export const GYM_PLAN_STATUS = GYM_ACTIVE_STATUS;
export const gymPlanStatusMeta = gymActiveStatusMeta;
export const GYM_MEMBER_STATUS = GYM_ACTIVE_STATUS;
export const gymMemberStatusMeta = gymActiveStatusMeta;

// Sexo del afiliado ('M'/'F'): decide la silueta corporal de la vista de progreso.
export const GYM_SEX_OPTIONS = [
  { value: 'M', label: 'Hombre' },
  { value: 'F', label: 'Mujer' },
];
export const gymSexLabel = (sex) => GYM_SEX_OPTIONS.find((o) => o.value === sex)?.label || '';

// Presets de duración para el formulario de planes (en días). "custom" deja el campo libre.
export const GYM_PLAN_DURATION_PRESETS = [
  { value: '30', label: 'Mensual (30 días)' },
  { value: '90', label: 'Trimestral (90 días)' },
  { value: '365', label: 'Anual (365 días)' },
  { value: 'custom', label: 'Personalizado' },
];

// Etiqueta corta de la duración del plan para listados y tarjetas.
export const gymPlanDurationLabel = (days) => {
  const preset = GYM_PLAN_DURATION_PRESETS.find((p) => p.value === String(days));
  if (preset) return preset.label.replace(/ \(.*\)/, '');
  return `${days} días`;
};

// Estados de una suscripción (deben coincidir con las constantes del modelo GymSubscription).
// La verdad son las fechas: el backend expone tanto `status` (materializado por el cron diario)
// como `computed_status` (calculado en vivo); el panel siempre pinta `computed_status`.
export const GYM_SUBSCRIPTION_STATUS = { ACTIVE: 1, GRACE: 2, EXPIRED: 3, CANCELLED: 4, PAUSED: 5 };

export const gymSubscriptionStatusMeta = (status) => {
  switch (Number(status)) {
    case GYM_SUBSCRIPTION_STATUS.ACTIVE: return { label: 'Activa', variant: 'success' };
    case GYM_SUBSCRIPTION_STATUS.GRACE: return { label: 'En gracia', variant: 'warning' };
    case GYM_SUBSCRIPTION_STATUS.EXPIRED: return { label: 'Vencida', variant: 'danger' };
    case GYM_SUBSCRIPTION_STATUS.CANCELLED: return { label: 'Cancelada', variant: 'neutral' };
    case GYM_SUBSCRIPTION_STATUS.PAUSED: return { label: 'Pausada', variant: 'info' };
    default: return { label: '—', variant: 'neutral' };
  }
};

// Estado de un pago de suscripción (0 anulado / 1 activo, igual que reservation_payments).
export const gymPaymentStatusMeta = (status) =>
  (Number(status) === 1
    ? { label: 'Activo', variant: 'success' }
    : { label: 'Anulado', variant: 'neutral' });

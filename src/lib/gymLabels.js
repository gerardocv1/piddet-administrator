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

// Presets de duración para el formulario de planes, en MESES de calendario: un plan mensual que
// arranca el 2 de octubre vence el 1 de noviembre, tenga el mes 28, 30 o 31 días. "custom" deja
// el valor libre y permite medirlo en días (semanal, quincenal, promos sueltas).
export const GYM_PLAN_DURATION_PRESETS = [
  { value: '1', label: 'Mensual (1 mes)' },
  { value: '3', label: 'Trimestral (3 meses)' },
  { value: '6', label: 'Semestral (6 meses)' },
  { value: '12', label: 'Anual (12 meses)' },
  { value: 'custom', label: 'Personalizado' },
];

// Unidad de la duración personalizada. El backend guarda `duration_months` (calendario) o
// `duration_days` (conteo), nunca los dos.
export const GYM_PLAN_DURATION_UNITS = [
  { value: 'months', label: 'Meses' },
  { value: 'days', label: 'Días' },
];

const durationPlural = (value, one, many) => `${value} ${Number(value) === 1 ? one : many}`;

// Etiqueta corta de la duración del plan para listados y tarjetas. Recibe el plan completo
// porque la duración puede venir en meses (lo normal) o en días.
export const gymPlanDurationLabel = (plan) => {
  const months = plan?.duration_months;
  const days = plan?.duration_days;
  if (months) {
    const preset = GYM_PLAN_DURATION_PRESETS.find((p) => p.value === String(months));
    return preset ? preset.label.replace(/ \(.*\)/, '') : durationPlural(months, 'mes', 'meses');
  }
  return days ? durationPlural(days, 'día', 'días') : '—';
};

// Estados de una suscripción (deben coincidir con las constantes del modelo GymSubscription).
// La suscripción es CONTINUA (una por afiliado): solo está activa o cancelada. La cancelación
// puede ser manual o automática (corte por no pago del período).
export const GYM_SUBSCRIPTION_STATUS = { ACTIVE: 1, CANCELLED: 2 };

export const gymSubscriptionStatusMeta = (status) => {
  switch (Number(status)) {
    case GYM_SUBSCRIPTION_STATUS.ACTIVE: return { label: 'Activa', variant: 'success' };
    case GYM_SUBSCRIPTION_STATUS.CANCELLED: return { label: 'Cancelada', variant: 'neutral' };
    default: return { label: '—', variant: 'neutral' };
  }
};

// Cada ciclo de cobro es un PERÍODO que el sistema genera solo: vigente → en gracia (ventana
// para pagar antes del corte) → cerrado (gracia agotada CON pagos; el saldo parcial persiste) o
// cancelado (corte sin pagos, o cancelación de la suscripción). El backend expone `status`
// (materializado por el cron) y `computed_status` (en vivo); el panel pinta `computed_status`.
export const GYM_PERIOD_STATUS = { CURRENT: 1, GRACE: 2, CLOSED: 3, CANCELLED: 4 };

export const gymPeriodStatusMeta = (status) => {
  switch (Number(status)) {
    case GYM_PERIOD_STATUS.CURRENT: return { label: 'Vigente', variant: 'success' };
    case GYM_PERIOD_STATUS.GRACE: return { label: 'En gracia', variant: 'warning' };
    case GYM_PERIOD_STATUS.CLOSED: return { label: 'Cerrado', variant: 'neutral' };
    case GYM_PERIOD_STATUS.CANCELLED: return { label: 'Cancelado', variant: 'neutral' };
    default: return { label: '—', variant: 'neutral' };
  }
};

// Estado de un pago de suscripción (0 anulado / 1 activo, igual que reservation_payments).
export const gymPaymentStatusMeta = (status) =>
  (Number(status) === 1
    ? { label: 'Activo', variant: 'success' }
    : { label: 'Anulado', variant: 'neutral' });

// Saldo pendiente de un período: precio menos pagos no anulados. Acepta el agregado
// `paid_total`/`pending` que expone el backend o la lista `payments` del detalle;
// sin información de pagos asume el período pagado (mejor no acusar deuda a ciegas).
export const gymPendingBalance = (period) => {
  if (!period) return 0;
  if (period.pending != null) return Math.max(0, Number(period.pending));
  const price = Number(period.price || 0);
  const paid = period.paid_total != null
    ? Number(period.paid_total)
    : (Array.isArray(period.payments)
      ? period.payments.filter((p) => Number(p.status) === 1).reduce((sum, p) => sum + Number(p.value || 0), 0)
      : price);
  return Math.max(0, price - paid);
};

// Saldo pendiente total de la suscripción (suma de los períodos no cancelados), tal como lo
// agrega el backend en `pending_total`.
export const gymSubscriptionPending = (sub) => Math.max(0, Number(sub?.pending_total ?? 0));

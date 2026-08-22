// Helpers del módulo de gimnasio: formato de moneda y etiquetas de dominio.

// Formato de moneda local (los montos llegan canónicos: "295000.00").
export const gymMoney = (value) =>
  '$ ' + Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });

// Estado activo/inactivo (0/1), compartido por planes y miembros — misma convención que el resto
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

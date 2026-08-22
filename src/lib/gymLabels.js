// Helpers del módulo de gimnasio: formato de moneda y etiquetas de dominio.

// Formato de moneda local (los montos llegan canónicos: "295000.00").
export const gymMoney = (value) =>
  '$ ' + Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });

// Estados de un plan de membresía (deben coincidir con las constantes del modelo GymPlan).
export const GYM_PLAN_STATUS = { INACTIVE: 0, ACTIVE: 1 };

export const gymPlanStatusMeta = (status) =>
  (Number(status) === GYM_PLAN_STATUS.ACTIVE
    ? { label: 'Activo', variant: 'success' }
    : { label: 'Inactivo', variant: 'neutral' });

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

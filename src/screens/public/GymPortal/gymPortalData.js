// Cálculos puros del portal del afiliado: fechas del período, estado de la suscripción y lectura
// de las series de medidas. Las fechas son ISO ("2026-09-26") y se comparan en UTC para no
// depender de la zona del navegador; el "hoy" lo manda el backend.

import { formatDayMonth, monthName } from '../../../lib/dates.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const toUtc = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

/** Días de `from` a `to` (negativo si `to` es anterior). */
export const daysBetween = (from, to) => {
  const a = toUtc(from);
  const b = toUtc(to);
  return a == null || b == null ? 0 : Math.round((b - a) / DAY_MS);
};

/** "2026-10-08" → "8 de octubre". */
export const longDayMonth = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} de ${monthName(Number(m[2]))}` : '';
};

/** "9 sep – 8 oct". */
export const periodRange = (start, end) => `${formatDayMonth(start)} – ${formatDayMonth(end)}`;

/** Número con coma decimal y hasta un decimal: 64.5 → "64,5". */
export const fmtNumber = (value, digits = 1) =>
  Number(value).toLocaleString('es-CO', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

/** Diferencia con signo tipográfico: +0,5 · −1,2 · 0. */
export const fmtDelta = (delta) => {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return '0';
  return `${rounded > 0 ? '+' : '−'}${fmtNumber(Math.abs(rounded))}`;
};

export const SUBSCRIPTION_STATE = {
  NONE: 'none',
  CANCELLED: 'cancelled',
  ACTIVE: 'active',
  PENDING: 'pending',
  GRACE: 'grace',
};

/**
 * Todo lo que la tarjeta de suscripción necesita, derivado de la respuesta del backend:
 * estado visual, días que quedan, día del período y el texto del saldo.
 */
export function subscriptionView(subscription, today) {
  if (!subscription) return { state: SUBSCRIPTION_STATE.NONE };
  if (Number(subscription.status) === 2) {
    return { state: SUBSCRIPTION_STATE.CANCELLED, planName: subscription.plan_name, cancelledAt: subscription.cancelled_at };
  }

  const period = subscription.current_period;
  if (!period) return { state: SUBSCRIPTION_STATE.NONE };

  const pendingTotal = Number(subscription.pending_total) || 0;
  const pendingPeriods = subscription.pending_periods || [];
  const inGrace = Number(period.computed_status) === 2;
  const totalDays = Math.max(1, daysBetween(period.start_date, period.end_date) + 1);
  const daysLeft = Math.max(0, daysBetween(today, period.end_date));
  const dayNumber = Math.min(totalDays, Math.max(1, daysBetween(period.start_date, today) + 1));
  const currentPending = Number(period.pending) > 0;

  let state = SUBSCRIPTION_STATE.ACTIVE;
  if (pendingTotal > 0) state = SUBSCRIPTION_STATE.PENDING;
  else if (inGrace) state = SUBSCRIPTION_STATE.GRACE;

  return {
    state,
    planName: subscription.plan_name,
    period,
    pendingTotal,
    pendingPeriods,
    currentPending,
    inGrace,
    expired: daysBetween(today, period.end_date) < 0,
    totalDays,
    daysLeft,
    dayNumber,
    // El anillo es una cuenta regresiva: la parte llena son los días que quedan.
    ringFraction: daysLeft / totalDays,
  };
}

// ── Medidas ──

const PREFERRED_FOCUS = ['waist', 'chest', 'hip', 'abdomen', 'thigh', 'bicep', 'shoulders', 'glute', 'calf', 'forearm', 'neck'];

const sortByDate = (points) => [...points].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

/**
 * Lectura de una medida: su serie principal (sin lado, o el derecho en las que tienen lado), el
 * último valor, el anterior y la diferencia; en las de lado, también el izquierdo.
 */
export function readMeasure(type, entry) {
  const points = sortByDate(entry?.points || []);
  if (!points.length) return null;

  const right = points.filter((p) => p.side === 'R');
  const left = points.filter((p) => p.side === 'L');
  const main = type.sided ? (right.length ? right : left) : points.filter((p) => !p.side);
  const series = main.length ? main : points;
  const last = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : null;

  return {
    key: type.key,
    label: type.label,
    unit: entry.unit || type.unit,
    sided: !!type.sided,
    values: series.map((p) => Number(p.value)),
    last: Number(last.value),
    lastDate: last.date,
    prev: prev ? Number(prev.value) : null,
    prevDate: prev ? prev.date : null,
    delta: prev ? Number(last.value) - Number(prev.value) : null,
    right: right.length ? Number(right[right.length - 1].value) : null,
    left: left.length ? Number(left[left.length - 1].value) : null,
  };
}

/** Todas las medidas con datos, en el orden del catálogo de la compañía. */
export function readMeasures(measurements) {
  const types = measurements?.types || [];
  const series = measurements?.series || {};
  const known = new Set(types.map((t) => t.key));
  // Una medida que la compañía dejó de tomar sigue siendo historia del socio: va al final.
  const extra = Object.keys(series)
    .filter((key) => !known.has(key))
    .map((key) => ({ key, label: key, unit: series[key].unit, sided: false }));

  return [...types, ...extra]
    .map((type) => readMeasure(type, series[type.key]))
    .filter(Boolean);
}

/** Texto del valor de una medida: "72 cm" o, con lado, "D 54 · I 53,5 cm". */
export const measureValueText = (m) => {
  if (m.sided && m.right != null && m.left != null) {
    return `D ${fmtNumber(m.right)} · I ${fmtNumber(m.left)} ${m.unit}`;
  }
  return `${fmtNumber(m.last)} ${m.unit}`;
};

/** Diferencia contra la toma anterior, con su unidad ("−1,2 kg"); el % de grasa va en puntos. */
export const measureDeltaText = (m) => {
  if (m.delta == null) return '';
  const unit = m.unit === '%' ? 'pts' : m.unit;
  return `${fmtDelta(m.delta)} ${unit}`;
};

/** Índice de masa corporal y su lectura. */
export function bodyMassIndex(weightKg, heightCm) {
  const h = Number(heightCm) / 100;
  if (!weightKg || !h) return null;
  const value = weightKg / (h * h);
  let label = 'Obesidad';
  if (value < 18.5) label = 'Bajo';
  else if (value < 25) label = 'Normal';
  else if (value < 30) label = 'Sobrepeso';
  return { value, label, healthy: label === 'Normal' };
}

/** Primera medida con datos que se puede señalar en la vista dada del mapa. */
export function defaultFocus(zones) {
  return PREFERRED_FOCUS.find((key) => zones.includes(key)) || zones[0] || '';
}

/** Puntos de la mini gráfica (viewBox 132×52): [[x, y], …]. */
export function sparkPoints(values, width = 132, height = 52) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const padX = 8;
  const top = 8;
  const bottom = height - 8;
  const step = values.length > 1 ? (width - padX * 2) / (values.length - 1) : 0;
  return values.map((v, i) => {
    const x = values.length > 1 ? padX + i * step : width / 2;
    const y = max === min ? (top + bottom) / 2 : bottom - ((v - min) / span) * (bottom - top);
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  });
}

const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const LONG_MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function parseDate(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { year: m[1], month: Number(m[2]), day: Number(m[3]) };
}

// "2026-07-02" → "2 jul 2026" (sin depender de la zona del navegador).
export function formatShortDate(value) {
  const d = parseDate(value);
  if (!d) return value ? String(value) : '—';
  return `${d.day} ${SHORT_MONTHS[d.month - 1]} ${d.year}`;
}

// Años cumplidos hoy a partir de una fecha de nacimiento; null si no hay fecha o es futura.
// El backend manda la edad ya calculada en la ficha; esto es para el eco inmediato en el
// formulario, mientras la persona todavía está eligiendo el día.
export function ageFromBirthdate(value) {
  const d = parseDate(value);
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - Number(d.year);
  const monthDiff = today.getMonth() + 1 - d.month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.day)) age -= 1;
  return age >= 0 ? age : null;
}

// Suma días a una fecha ISO sin depender de la zona del navegador: "2026-08-31" + 1 → "2026-09-01".
export function addDaysIso(value, days) {
  const d = parseDate(value);
  if (!d) return value;
  const date = new Date(Date.UTC(Number(d.year), d.month - 1, d.day + days));
  return date.toISOString().slice(0, 10);
}

// "2026-07-02" → "2 jul"
export function formatDayMonth(value) {
  const d = parseDate(value);
  if (!d) return value ? String(value) : '—';
  return `${d.day} ${SHORT_MONTHS[d.month - 1]}`;
}

// "2026-07-02", "2026-07-05" → "2 jul → 5 jul 2026"; si cruza de año, ambos llevan año.
export function formatStayRange(from, to) {
  const a = parseDate(from);
  const b = parseDate(to);
  if (!a || !b) return [formatShortDate(from), formatShortDate(to)].join(' → ');
  const start = a.year === b.year ? formatDayMonth(from) : formatShortDate(from);
  return `${start} → ${formatShortDate(to)}`;
}

// Rango abreviado, con lo repetido dicho una sola vez:
// "2026-08-30", "2026-08-31" → "30 – 31 ago 2026"
// "2026-08-28", "2026-09-02" → "28 ago – 2 sep 2026"
// si cruza de año, ambos extremos van completos.
export function formatStayRangeShort(from, to) {
  const a = parseDate(from);
  const b = parseDate(to);
  if (!a || !b) return [formatShortDate(from), formatShortDate(to)].join(' – ');
  if (a.year === b.year && a.month === b.month) return `${a.day} – ${formatShortDate(to)}`;
  if (a.year === b.year) return `${formatDayMonth(from)} – ${formatShortDate(to)}`;
  return `${formatShortDate(from)} – ${formatShortDate(to)}`;
}

// Rango en prosa, con lo repetido dicho una sola vez:
// "2026-08-23", "2026-08-24" → "23 al 24 de agosto de 2026"
// "2026-08-28", "2026-09-02" → "28 de agosto al 2 de septiembre de 2026"
// si cruza de año, ambos extremos van completos.
export function formatStayRangeLong(from, to) {
  const a = parseDate(from);
  const b = parseDate(to);
  if (!a || !b) return [formatShortDate(from), formatShortDate(to)].join(' al ');
  if (a.year === b.year && a.month === b.month) {
    return `${a.day} al ${b.day} de ${LONG_MONTHS[b.month - 1]} de ${b.year}`;
  }
  if (a.year === b.year) {
    return `${a.day} de ${LONG_MONTHS[a.month - 1]} al ${b.day} de ${LONG_MONTHS[b.month - 1]} de ${b.year}`;
  }
  return `${a.day} de ${LONG_MONTHS[a.month - 1]} de ${a.year} al ${b.day} de ${LONG_MONTHS[b.month - 1]} de ${b.year}`;
}

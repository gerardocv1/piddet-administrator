const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

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

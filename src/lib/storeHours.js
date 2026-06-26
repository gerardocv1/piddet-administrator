// Lógica de horarios de tienda (cliente): a partir de los rangos por día (day_id + start/end)
// calcula si está abierta ahora y el texto del próximo cambio ("Cierra a las…", "Abre mañana…"),
// además del horario semanal formateado para desplegar.
//
// day_id sigue el catálogo de piddet_stores: 0=Domingo … 6=Sábado, 7=Festivos. Coincide con
// Date.getDay() para 0–6; los festivos (7) se listan pero no entran en el cálculo de "abierto ahora".

export const DAY_NAMES = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Festivos',
};

// Orden de presentación: semana de lunes a domingo y, al final, festivos.
export const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0, 7];

const STATUS_TEMPORARY_CLOSE = 3;

const toMin = (hm) => {
  if (!hm) return null;
  const [h, m] = String(hm).split(':');
  return Number(h) * 60 + Number(m || 0);
};

// Formato de hora estilo "11:00 a. m." / "9:00 p. m." / "12:00 m." (mediodía).
export function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const mm = String(m).padStart(2, '0');
  if (h === 12) return `12:${mm} m.`;
  const ampm = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${ampm}`;
}

const formatRange = (r) => `${formatTime(r.start)} – ${formatTime(r.end)}`;

// Agrupa los rangos por día, ordenados por hora de inicio. { dayId: [{ start, end }] } en minutos.
function groupByDay(schedules = []) {
  const byDay = {};
  schedules.forEach((sc) => {
    const day = Number(sc.day_id);
    const start = toMin(sc.start_time);
    const end = toMin(sc.end_time);
    if (start == null || end == null) return;
    (byDay[day] = byDay[day] || []).push({ start, end });
  });
  Object.values(byDay).forEach((list) => list.sort((a, b) => a.start - b.start));
  return byDay;
}

/**
 * Estado actual de la tienda.
 * @returns {{ open: boolean, label: string, detail: string }}
 *   label: 'Abierto' | 'Cerrado' | 'Cerrado temporalmente'
 *   detail: 'Cierra a las 9:00 p. m.' | 'Abre mañana a las 11:00 a. m.' | ''
 */
export function getStoreStatus(schedules = [], storeStatusId = 1, now = new Date()) {
  if (storeStatusId === STATUS_TEMPORARY_CLOSE) {
    return { open: false, label: 'Cerrado temporalmente', detail: '' };
  }

  const byDay = groupByDay(schedules);
  const todayId = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const todayRanges = byDay[todayId] || [];
  const current = todayRanges.find((r) => nowMin >= r.start && nowMin < r.end);
  if (current) {
    return { open: true, label: 'Abierto', detail: `Cierra a las ${formatTime(current.end)}` };
  }

  // Próxima apertura hoy (más tarde) …
  const laterToday = todayRanges.find((r) => r.start > nowMin);
  if (laterToday) {
    return { open: false, label: 'Cerrado', detail: `Abre hoy a las ${formatTime(laterToday.start)}` };
  }

  // … o en los próximos días (festivos excluidos; el módulo no detecta días festivos del calendario).
  for (let i = 1; i <= 7; i += 1) {
    const dayId = (todayId + i) % 7;
    const ranges = byDay[dayId];
    if (ranges && ranges.length) {
      const when = i === 1 ? 'mañana' : `el ${DAY_NAMES[dayId]}`;
      return { open: false, label: 'Cerrado', detail: `Abre ${when} a las ${formatTime(ranges[0].start)}` };
    }
  }

  return { open: false, label: 'Cerrado', detail: 'Sin horario disponible' };
}

/**
 * Horario semanal formateado para desplegar.
 * @returns {Array<{ dayId, name, isToday, closed, text }>}
 */
export function getWeekSchedule(schedules = [], now = new Date()) {
  const byDay = groupByDay(schedules);
  const todayId = now.getDay();
  return DISPLAY_ORDER.map((dayId) => {
    const ranges = byDay[dayId] || [];
    return {
      dayId,
      name: DAY_NAMES[dayId],
      isToday: dayId === todayId, // festivos (7) nunca es "hoy"
      closed: ranges.length === 0,
      text: ranges.length ? ranges.map(formatRange).join(', ') : 'Cerrado',
    };
  });
}

// Consulta para Google Maps: prioriza lat/lng; si no hay, usa texto (nombre + dirección).
function mapsQuery({ latitude, longitude, name, address } = {}) {
  if (latitude != null && longitude != null) return `${latitude},${longitude}`;
  return [name, address].filter(Boolean).join(', ');
}

// URL de Google Maps para abrir en una pestaña (direcciones / búsqueda).
export function googleMapsUrl(store = {}) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(store))}`;
}

// URL para incrustar el mapa de Google en un <iframe> SIN API key (output=embed).
export function googleMapsEmbedUrl(store = {}) {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery(store))}&z=16&output=embed`;
}

import React from 'react';
import { monthName, shortMonthName } from '../../../lib/dates.js';
import { ChevronDownIcon } from './icons.jsx';
import s from './BirthdateSelects.module.css';

// Fecha de nacimiento en tres cajas (día, mes, año) que se eligen tocando, sin teclear formatos.
// La usan la entrada al portal y el perfil. Trabaja con strings: '' mientras no se elige.

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const THIS_YEAR = new Date().getFullYear();
// De los 10 a los 90 años: cubre a cualquier socio sin una lista interminable.
const YEARS = Array.from({ length: 81 }, (_, i) => THIS_YEAR - 10 - i);

const pad = (n) => String(n).padStart(2, '0');
const capitalize = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** {day, month, year} → "YYYY-MM-DD" ('' si falta algo). */
export const birthdateIso = ({ day, month, year }) => (day && month && year ? `${year}-${pad(month)}-${pad(day)}` : '');

/** "YYYY-MM-DD" → {day, month, year} como strings sin ceros. */
export const birthdateParts = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { day: String(Number(m[3])), month: String(Number(m[2])), year: m[1] } : { day: '', month: '', year: '' };
};

/** Mensaje si la fecha no existe (31 de febrero), o '' si está bien. */
export const birthdateProblem = ({ day, month, year }) => {
  if (!day || !month || !year) return '';
  return Number(day) > daysInMonth(Number(year), Number(month))
    ? `${capitalize(monthName(Number(month)))} de ${year} no tiene día ${day}. Revisa tu fecha de nacimiento.`
    : '';
};

function DateSelect({ id, label, value, onChange, placeholder, options }) {
  return (
    <div className={s.dateField}>
      <label htmlFor={id} className={s.dateLabel}>{label}</label>
      <select
        id={id}
        className={[s.select, value ? '' : s.selectEmpty].filter(Boolean).join(' ')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDownIcon size={14} className={s.chevron} />
    </div>
  );
}

export function BirthdateSelects({ idPrefix, value, onChange }) {
  const set = (key) => (v) => onChange({ ...value, [key]: v });
  return (
    <div className={s.dateGrid}>
      <DateSelect
        id={`${idPrefix}-day`} label="Día" placeholder="DD" value={value.day} onChange={set('day')}
        options={DAYS.map((d) => ({ value: String(d), label: pad(d) }))}
      />
      <DateSelect
        id={`${idPrefix}-month`} label="Mes" placeholder="MM" value={value.month} onChange={set('month')}
        options={MONTHS.map((m) => ({ value: String(m), label: capitalize(shortMonthName(m)) }))}
      />
      <DateSelect
        id={`${idPrefix}-year`} label="Año" placeholder="AAAA" value={value.year} onChange={set('year')}
        options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
      />
    </div>
  );
}

import React from 'react';
import { Spinner } from '../../../components';
import { monthName, shortMonthName } from '../../../lib/dates.js';
import { ArrowRightIcon, ChevronDownIcon, DumbbellIcon } from './icons.jsx';
import s from './GymPortalLogin.module.css';

// Entrada al portal: celular + fecha de nacimiento en tres cajas (día, mes, año) que se eligen
// tocando, sin teclear formatos. Es la misma fecha que el socio dio en recepción.

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const THIS_YEAR = new Date().getFullYear();
// De los 10 a los 90 años: cubre a cualquier socio sin una lista interminable.
const YEARS = Array.from({ length: 81 }, (_, i) => THIS_YEAR - 10 - i);

const pad = (n) => String(n).padStart(2, '0');
const capitalize = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// "3001234567" → "300 123 4567" mientras se escribe.
const formatPhone = (digits) => [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join(' ');

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

function CompanyMark({ company }) {
  const [failed, setFailed] = React.useState(false);
  const logo = company?.thumbnail_icon || company?.icon;
  if (logo && !failed) {
    return <img className={s.markLogo} src={logo} alt="" onError={() => setFailed(true)} />;
  }
  return (
    <span className={s.markIcon} aria-hidden="true">
      <DumbbellIcon size={13} />
    </span>
  );
}

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

export function GymPortalLogin({ company, onSubmit }) {
  const [phone, setPhone] = React.useState('');
  const [day, setDay] = React.useState('');
  const [month, setMonth] = React.useState('');
  const [year, setYear] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');

  const complete = phone.length === 10 && day && month && year;

  const submit = async (e) => {
    e.preventDefault();
    if (!complete || sending) return;
    if (Number(day) > daysInMonth(Number(year), Number(month))) {
      setError(`${capitalize(monthName(Number(month)))} de ${year} no tiene día ${day}. Revisa tu fecha de nacimiento.`);
      return;
    }
    setSending(true);
    setError('');
    try {
      await onSubmit({ phoneNumber: phone, birthdate: `${year}-${pad(month)}-${pad(day)}` });
    } catch (err) {
      setError(err?.status === 429
        ? 'Hiciste demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
        : err?.message || 'No pudimos verificar tus datos. Intenta de nuevo.');
      setSending(false);
    }
  };

  return (
    <div className={s.screen}>
      <div className={s.top}>
        <div className={s.mark}>
          <CompanyMark company={company} />
          <span className={s.markName}>{company?.name || 'Tu gimnasio'}</span>
        </div>
        <span className={s.wordmark}>piddet</span>
      </div>

      <div className={s.intro}>
        <h1 className={s.title}>Tu progreso,<br />en tu bolsillo.</h1>
        <p className={s.lead}>Consulta tu suscripción, tu saldo y las medidas que te han tomado en el gimnasio.</p>
      </div>

      <form className={s.card} onSubmit={submit} noValidate>
        <div className={s.phoneField}>
          <label htmlFor="portal-phone" className={s.fieldLabel}>Tu celular</label>
          <div className={s.phoneWrap}>
            <span className={s.prefix} aria-hidden="true">+57</span>
            <input
              id="portal-phone"
              className={s.phoneInput}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="300 123 4567"
              value={formatPhone(phone)}
              onChange={(e) => { setPhone(e.target.value.replace(/\D+/g, '').replace(/^57(?=\d{10})/, '').slice(0, 10)); setError(''); }}
            />
          </div>
        </div>

        <fieldset className={s.birth}>
          <legend className={s.fieldLabel}>Tu fecha de nacimiento</legend>
          <div className={s.dateGrid}>
            <DateSelect
              id="portal-day" label="Día" placeholder="DD" value={day}
              onChange={(v) => { setDay(v); setError(''); }}
              options={DAYS.map((d) => ({ value: String(d), label: pad(d) }))}
            />
            <DateSelect
              id="portal-month" label="Mes" placeholder="MM" value={month}
              onChange={(v) => { setMonth(v); setError(''); }}
              options={MONTHS.map((m) => ({ value: String(m), label: capitalize(shortMonthName(m)) }))}
            />
            <DateSelect
              id="portal-year" label="Año" placeholder="AAAA" value={year}
              onChange={(v) => { setYear(v); setError(''); }}
              options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
            />
          </div>
          <p className={s.hint}>La misma que registraste en recepción. Así confirmamos que eres tú.</p>
        </fieldset>

        {error && <p className={s.error} role="alert">{error}</p>}

        <button type="submit" className={s.cta} disabled={!complete || sending}>
          {sending ? (
            <>
              <Spinner size="sm" />
              <span>Verificando…</span>
            </>
          ) : (
            <>
              <span>Ver mi suscripción</span>
              <ArrowRightIcon size={20} />
            </>
          )}
        </button>
      </form>

      <div className={s.footer}>
        <p className={s.help}>¿No logras entrar? Pasa por recepción para actualizar tu celular o tu fecha de nacimiento.</p>
        <p className={s.powered}>Impulsado por <span className={s.poweredMark}>piddet</span></p>
      </div>
    </div>
  );
}

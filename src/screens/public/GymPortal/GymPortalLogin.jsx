import React from 'react';
import { Spinner } from '../../../components';
import { ArrowRightIcon, DumbbellIcon } from './icons.jsx';
import { BirthdateSelects, birthdateIso, birthdateProblem } from './BirthdateSelects.jsx';
import s from './GymPortalLogin.module.css';

// Entrada al portal: celular + fecha de nacimiento en tres cajas (día, mes, año) que se eligen
// tocando, sin teclear formatos. Es la misma fecha que el socio dio en recepción.

// "3001234567" → "300 123 4567" mientras se escribe.
const formatPhone = (digits) => [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join(' ');

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

export function GymPortalLogin({ company, onSubmit, notice = '' }) {
  const [phone, setPhone] = React.useState('');
  const [birth, setBirth] = React.useState({ day: '', month: '', year: '' });
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');

  const complete = phone.length === 10 && !!birthdateIso(birth);

  const submit = async (e) => {
    e.preventDefault();
    if (!complete || sending) return;
    const problem = birthdateProblem(birth);
    if (problem) {
      setError(problem);
      return;
    }
    setSending(true);
    setError('');
    try {
      await onSubmit({ phoneNumber: phone, birthdate: birthdateIso(birth) });
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
          <BirthdateSelects
            idPrefix="portal"
            value={birth}
            onChange={(v) => { setBirth(v); setError(''); }}
          />
          <p className={s.hint}>La misma que registraste en recepción. Así confirmamos que eres tú.</p>
        </fieldset>

        {!error && notice && <p className={s.error} role="status">{notice}</p>}
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

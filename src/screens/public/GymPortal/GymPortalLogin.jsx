import React from 'react';
import { Spinner } from '../../../components';
import { ArrowRightIcon, ChatIcon, DumbbellIcon } from './icons.jsx';
import { BirthdateSelects, birthdateIso, birthdateProblem } from './BirthdateSelects.jsx';
import s from './GymPortalLogin.module.css';

// Entrada al portal. La principal es por código: el socio escribe su celular, le llega un SMS y
// escribe (o el teléfono pega solo) el código. La entrada con fecha de nacimiento es alterna y
// solo aparece si el backend la tiene encendida.

// "3001234567" → "300 123 4567" mientras se escribe.
const formatPhone = (digits) => [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join(' ');
const cleanPhone = (value) => value.replace(/\D+/g, '').replace(/^57(?=\d{10})/, '').slice(0, 10);

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

function PhoneField({ value, onChange, autoFocus = false }) {
  return (
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
          autoFocus={autoFocus}
          value={formatPhone(value)}
          onChange={(e) => onChange(cleanPhone(e.target.value))}
        />
      </div>
    </div>
  );
}

// Código en cajas: un solo <input> transparente encima de las cajas, así el teclado numérico,
// pegar y el autocompletado del SMS (`one-time-code`) funcionan como en cualquier app.
function CodeBoxes({ length, value, onChange, disabled, invalid }) {
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current?.focus(); }, []);
  const cells = Array.from({ length }, (_, i) => value[i] || '');
  const active = Math.min(value.length, length - 1);

  return (
    <div className={s.codeWrap}>
      <div className={[s.codeCells, invalid ? s.codeInvalid : ''].filter(Boolean).join(' ')} aria-hidden="true">
        {cells.map((digit, i) => (
          <span key={i} className={[s.codeCell, digit ? s.codeCellFilled : '', !disabled && i === active ? s.codeCellActive : ''].filter(Boolean).join(' ')}>
            {digit}
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        id="portal-code"
        className={s.codeInput}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        aria-label={`Código de ${length} dígitos`}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D+/g, '').slice(0, length))}
      />
    </div>
  );
}

function useCountdown(seconds) {
  const [left, setLeft] = React.useState(seconds);
  React.useEffect(() => { setLeft(seconds); }, [seconds]);
  React.useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}

export function GymPortalLogin({ company, options, onRequestCode, onVerifyCode, onBirthdateLogin, notice = '' }) {
  const codeLength = options?.code_length || 6;
  const [step, setStep] = React.useState('phone'); // phone | code | birthdate
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [sent, setSent] = React.useState(null); // respuesta del envío: masked_phone, resend_in, demo_code
  const [birth, setBirth] = React.useState({ day: '', month: '', year: '' });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [resendLeft, setResendLeft] = useCountdown(0);

  const phoneReady = phone.length === 10;

  const requestCode = async (e) => {
    e?.preventDefault();
    if (!phoneReady || busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await onRequestCode(phone);
      setSent(data);
      setCode('');
      setStep('code');
      setResendLeft(Number(data?.resend_in) || 60);
    } catch (err) {
      if (err?.status === 429 && err?.data?.retry_in) {
        // Ya tiene un código en camino: se le deja escribirlo y se muestra cuánto falta para otro.
        setStep('code');
        setResendLeft(Number(err.data.retry_in));
      }
      setError(err?.message || 'No pudimos enviarte el código. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const verify = React.useCallback(async (value) => {
    if (busy || value.length !== codeLength) return;
    setBusy(true);
    setError('');
    try {
      await onVerifyCode(phone, value);
    } catch (err) {
      setError(err?.message || 'No pudimos verificar el código. Intenta de nuevo.');
      setCode('');
      setBusy(false);
    }
  }, [busy, codeLength, onVerifyCode, phone]);

  // Con el último dígito se entra solo, sin buscar un botón.
  const changeCode = (value) => {
    setCode(value);
    setError('');
    if (value.length === codeLength) verify(value);
  };

  // Android (Chrome): lee el código del SMS y lo pega solo, si el SMS trae `@dominio #código`.
  React.useEffect(() => {
    if (step !== 'code' || !('OTPCredential' in window)) return undefined;
    const ac = new AbortController();
    navigator.credentials.get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then((otp) => { if (otp?.code) changeCode(String(otp.code).slice(0, codeLength)); })
      .catch(() => {});
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sent]);

  const loginWithBirthdate = async (e) => {
    e.preventDefault();
    if (!phoneReady || !birthdateIso(birth) || busy) return;
    const problem = birthdateProblem(birth);
    if (problem) { setError(problem); return; }
    setBusy(true);
    setError('');
    try {
      await onBirthdateLogin({ phoneNumber: phone, birthdate: birthdateIso(birth) });
    } catch (err) {
      setError(err?.status === 429
        ? 'Hiciste demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
        : err?.message || 'No pudimos verificar tus datos. Intenta de nuevo.');
      setBusy(false);
    }
  };

  const goTo = (next) => { setStep(next); setError(''); setCode(''); };

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

      {step === 'phone' && (
        <form className={s.card} onSubmit={requestCode} noValidate>
          <PhoneField value={phone} onChange={(v) => { setPhone(v); setError(''); }} />
          <p className={s.hint}>Te enviaremos un código por mensaje de texto para confirmar que eres tú.</p>
          {!error && notice && <p className={s.error} role="status">{notice}</p>}
          {error && <p className={s.error} role="alert">{error}</p>}
          <button type="submit" className={s.cta} disabled={!phoneReady || busy}>
            {busy ? <><Spinner size="sm" /><span>Enviando…</span></> : <><ChatIcon size={20} /><span>Recibir código</span></>}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form className={s.card} onSubmit={(e) => { e.preventDefault(); verify(code); }} noValidate>
          <div className={s.sentTo}>
            <span className={s.fieldLabel}>Escribe el código</span>
            <p className={s.sentText}>
              Te lo enviamos por SMS al <strong>{sent?.masked_phone || `+57 ${formatPhone(phone)}`}</strong>.
            </p>
            <button type="button" className={s.textLink} onClick={() => goTo('phone')}>Cambiar número</button>
          </div>

          <CodeBoxes length={codeLength} value={code} onChange={changeCode} disabled={busy} invalid={!!error} />

          {sent?.demo_code && (
            <p className={s.demo}>Modo demo: el código es <strong>{sent.demo_code}</strong></p>
          )}
          {error && <p className={s.error} role="alert">{error}</p>}

          <button type="submit" className={s.cta} disabled={code.length !== codeLength || busy}>
            {busy ? <><Spinner size="sm" /><span>Verificando…</span></> : <><span>Entrar</span><ArrowRightIcon size={20} /></>}
          </button>

          <div className={s.resend}>
            {resendLeft > 0 ? (
              <span className={s.resendWait}>¿No te llegó? Pide otro en {resendLeft} s</span>
            ) : (
              <button type="button" className={s.textLink} onClick={requestCode} disabled={busy}>Enviarme otro código</button>
            )}
          </div>
        </form>
      )}

      {step === 'birthdate' && (
        <form className={s.card} onSubmit={loginWithBirthdate} noValidate>
          <PhoneField value={phone} onChange={(v) => { setPhone(v); setError(''); }} />
          <fieldset className={s.birth}>
            <legend className={s.fieldLabel}>Tu fecha de nacimiento</legend>
            <BirthdateSelects idPrefix="portal" value={birth} onChange={(v) => { setBirth(v); setError(''); }} />
            <p className={s.hint}>La misma que registraste en recepción.</p>
          </fieldset>
          {error && <p className={s.error} role="alert">{error}</p>}
          <button type="submit" className={s.cta} disabled={!phoneReady || !birthdateIso(birth) || busy}>
            {busy ? <><Spinner size="sm" /><span>Verificando…</span></> : <><span>Entrar</span><ArrowRightIcon size={20} /></>}
          </button>
        </form>
      )}

      {options?.birthdate_login && step !== 'code' && (
        <button type="button" className={s.altLink} onClick={() => goTo(step === 'birthdate' ? 'phone' : 'birthdate')}>
          {step === 'birthdate' ? 'Entrar con un código por SMS' : 'Entrar con mi fecha de nacimiento'}
        </button>
      )}

      <div className={s.footer}>
        <p className={s.help}>¿No logras entrar? Pasa por recepción para actualizar tu celular.</p>
        <p className={s.powered}>Impulsado por <span className={s.poweredMark}>piddet</span></p>
      </div>
    </div>
  );
}

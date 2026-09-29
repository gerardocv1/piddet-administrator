import React from 'react';
import { Spinner } from '../../../components';
import { CheckIcon, ScanIcon, XIcon } from './icons.jsx';
import { daysBetween, longDayMonth } from './gymPortalData.js';
import { DaysRing } from './DaysRing.jsx';
import { useQrScanner } from './qrScanner.js';
import { playAccessDenied, playAccessGranted, unlockSounds, vibrate } from './accessSounds.js';
import s from './GymPortalValidator.module.css';

// La entrada del gimnasio. Es la pantalla de quien tiene el permiso de validar ingresos: un solo
// botón grande, VALIDAR, que abre la cámara; al leer un QR pregunta al servidor y muestra el
// resultado a pantalla completa —verde con sonido de ok y los días que le quedan al socio, o rojo
// con sonido de error y el motivo—, y vuelve sola a leer el siguiente. Nada más: se usa de pie,
// con una mano y con gente esperando.

const RESULT_MS = 7000;

const initials = (name) => String(name || '')
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((w) => w[0] || '')
  .join('')
  .toUpperCase();

// Lo que dice la etiqueta de estado, por motivo. Es lo único que se lee además de los días.
const STATE_LABEL = {
  active: 'Al día',
  grace: 'En gracia',
  period_closed: 'Plan vencido',
  subscription_cancelled: 'Suscripción cancelada',
  no_subscription: 'Sin plan',
  member_inactive: 'Ficha inactiva',
  member_not_found: 'Sin ficha',
  qr_invalid: 'QR no válido',
  qr_expired: 'QR vencido',
};

// El anillo de la entrada: la misma cuenta regresiva de la tarjeta del socio. En gracia o
// vencido queda vacío con 0 y la etiqueta dice hace cuántos días venció.
function ringFor(subscription) {
  if (!subscription || !subscription.end_date) return null;
  const total = Math.max(1, daysBetween(subscription.start_date, subscription.end_date) + 1);
  const left = Number(subscription.days_left) || 0;
  return { days: left, fraction: left / total };
}

function Result({ result, onNext }) {
  const granted = result.result === 'granted';
  const member = result.member;
  const sub = result.subscription;
  const ring = ringFor(sub);
  const overdue = Number(sub?.days_overdue) || 0;
  const [photoFailed, setPhotoFailed] = React.useState(false);

  let detail = null;
  if (sub?.end_date) {
    if (overdue > 0) detail = `Venció hace ${overdue === 1 ? '1 día' : `${overdue} días`}`;
    else if (ring?.days === 0) detail = 'Vence hoy';
    else detail = `Vence el ${longDayMonth(sub.end_date)}`;
  }
  const repeat = granted && result.visit && !result.visit.first_today;

  // Vuelve sola al lector: en la puerta nadie quiere tocar el teléfono después de cada socio.
  React.useEffect(() => {
    const timer = setTimeout(onNext, RESULT_MS);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className={[s.result, granted ? s.resultOk : s.resultNo].join(' ')} role="status" aria-live="assertive">
      <span className={s.resultIcon} aria-label={granted ? 'Puede entrar' : 'No puede entrar'}>
        {granted ? <CheckIcon size={64} /> : <XIcon size={64} />}
      </span>

      {member ? (
        <div className={s.person}>
          <span className={s.personPhoto}>
            {member.photo_url && !photoFailed
              ? <img src={member.photo_url} alt="" onError={() => setPhotoFailed(true)} />
              : <span>{initials(member.member_name)}</span>}
          </span>
          <span className={s.personName}>{member.member_name}</span>
        </div>
      ) : null}

      {ring ? (
        <DaysRing days={ring.days} fraction={ring.fraction} size={190} className={s.ring} />
      ) : null}

      <div className={s.state}>
        <span className={s.stateBadge}>
          <span className={s.stateDot} />
          {STATE_LABEL[result.reason] || (granted ? 'Puede entrar' : 'No puede entrar')}
        </span>
        {detail && <span className={s.stateDetail}>{detail}</span>}
        {repeat && <span className={s.stateDetail}>Ya entró hoy · {String(result.visit.visited_at || '').slice(11, 16)}</span>}
      </div>

      <button type="button" className={s.next} onClick={onNext}>Siguiente</button>
    </div>
  );
}

export function GymPortalValidator({ gymName, validatorName, onValidate }) {
  const [mode, setMode] = React.useState('idle'); // idle | scanning | checking | result
  const [result, setResult] = React.useState(null);
  const [failure, setFailure] = React.useState('');
  const modeRef = React.useRef(mode);
  modeRef.current = mode;

  const scanner = useQrScanner({
    onDecode: async (text) => {
      if (modeRef.current !== 'scanning') return;
      setMode('checking');
      try {
        const data = await onValidate(text);
        setResult(data);
        setFailure('');
        if (data?.result === 'granted') {
          playAccessGranted();
          vibrate([80]);
        } else {
          playAccessDenied();
          vibrate([120, 60, 120]);
        }
        setMode('result');
      } catch (err) {
        playAccessDenied();
        setFailure(err?.message || 'No pudimos validar. Revisa la señal e intenta de nuevo.');
        setResult(null);
        setMode('result');
      }
    },
  });

  const begin = async () => {
    unlockSounds(); // desde el gesto: iOS solo deja sonar lo que se abre en un toque
    setFailure('');
    setResult(null);
    setMode('scanning');
    await scanner.start();
  };

  const cancel = () => {
    scanner.stop();
    setMode('idle');
  };

  // Después de cada resultado vuelve a leer. Si la cámara se soltó (se fue a segundo plano), se
  // vuelve a pedir; si el navegador la niega, se queda en el botón con el aviso.
  const next = React.useCallback(async () => {
    setResult(null);
    setFailure('');
    if (scanner.active) {
      scanner.resume();
      setMode('scanning');
      return;
    }
    setMode('scanning');
    await scanner.start();
  }, [scanner]);

  // Si el navegador negó la cámara, el botón vuelve a aparecer con el motivo.
  React.useEffect(() => {
    if (scanner.error && (mode === 'scanning' || mode === 'checking')) setMode('idle');
  }, [scanner.error, mode]);

  // La cámara se suelta en segundo plano: al volver, el botón está listo para reabrirla.
  React.useEffect(() => {
    if (!scanner.active && !scanner.starting && mode === 'scanning') setMode('idle');
  }, [scanner.active, scanner.starting, mode]);

  const scanning = mode === 'scanning' || mode === 'checking';

  return (
    <div className={s.root}>
      <header className={s.head}>
        <span className={s.eyebrow}>{gymName}</span>
        <h1 className={s.title}>Entrada</h1>
        {validatorName && <span className={s.who}>Valida {validatorName}</span>}
      </header>

      {mode === 'idle' && (
        <div className={s.idle}>
          <button type="button" className={s.validate} onClick={begin}>
            <ScanIcon size={44} strokeWidth={2.4} />
            <span>Validar</span>
          </button>
          <p className={s.hint}>Pídele al socio el QR de su tarjeta y apunta la cámara.</p>
          {scanner.error && <p className={s.error} role="alert">{scanner.error}</p>}
        </div>
      )}

      {/* El video queda montado siempre: el lector necesita la referencia para arrancar. */}
      <div className={[s.camera, scanning ? '' : s.cameraHidden].filter(Boolean).join(' ')} aria-hidden={!scanning}>
        <video ref={scanner.videoRef} className={s.video} muted playsInline />
        <div className={s.frame} aria-hidden="true">
          <span className={[s.corner, s.cornerTl].join(' ')} />
          <span className={[s.corner, s.cornerTr].join(' ')} />
          <span className={[s.corner, s.cornerBl].join(' ')} />
          <span className={[s.corner, s.cornerBr].join(' ')} />
        </div>
        <div className={s.cameraBottom}>
          {mode === 'checking' || scanner.starting ? (
            <Spinner size="sm" label={scanner.starting ? 'Abriendo la cámara…' : 'Validando…'} />
          ) : (
            <span className={s.cameraHint}>Apunta al QR del socio</span>
          )}
          <button type="button" className={s.cancel} onClick={cancel}>Cancelar</button>
        </div>
      </div>

      {mode === 'result' && result && <Result result={result} onNext={next} />}
      {mode === 'result' && !result && (
        <div className={[s.result, s.resultNo].join(' ')} role="alert">
          <span className={s.resultIcon}><XIcon size={64} /></span>
          <div className={s.state}>
            <span className={s.stateBadge}><span className={s.stateDot} />No se pudo validar</span>
            <span className={s.stateDetail}>{failure}</span>
          </div>
          <button type="button" className={s.next} onClick={next}>Intentar de nuevo</button>
        </div>
      )}
    </div>
  );
}

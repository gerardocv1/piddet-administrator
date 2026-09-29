import React from 'react';
import { Spinner } from '../../../components';
import { CheckIcon, ScanIcon, XIcon } from './icons.jsx';
import { longDayMonth } from './gymPortalData.js';
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

function daysLine(subscription) {
  if (!subscription) return null;
  const { days_left: left, days_overdue: overdue, end_date: end } = subscription;
  if (overdue > 0) {
    return { big: overdue, unit: overdue === 1 ? 'día de retraso' : 'días de retraso', small: `Venció el ${longDayMonth(end)} · en gracia` };
  }
  if (left === 0) return { big: 'Hoy', unit: 'vence', small: `Último día · ${longDayMonth(end)}` };
  return { big: left, unit: left === 1 ? 'día' : 'días', small: `Vence el ${longDayMonth(end)}` };
}

function visitLine(visit) {
  if (!visit) return null;
  if (visit.first_today) return 'Visita registrada';
  const time = String(visit.visited_at || '').slice(11, 16);
  return time ? `Ya había entrado hoy a las ${time}` : 'Ya había entrado hoy';
}

function Result({ result, onNext }) {
  const granted = result.result === 'granted';
  const member = result.member;
  const days = granted ? daysLine(result.subscription) : null;
  const [photoFailed, setPhotoFailed] = React.useState(false);

  // Vuelve sola al lector: en la puerta nadie quiere tocar el teléfono después de cada socio.
  React.useEffect(() => {
    const timer = setTimeout(onNext, RESULT_MS);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className={[s.result, granted ? s.resultOk : s.resultNo].join(' ')} role="status" aria-live="assertive">
      <div className={s.resultTop}>
        <span className={s.resultIcon}>
          {granted ? <CheckIcon size={56} /> : <XIcon size={56} />}
        </span>
        <span className={s.resultVerdict}>{granted ? 'Puede entrar' : 'No puede entrar'}</span>
      </div>

      {member ? (
        <div className={s.person}>
          <span className={s.personPhoto}>
            {member.photo_url && !photoFailed
              ? <img src={member.photo_url} alt="" onError={() => setPhotoFailed(true)} />
              : <span>{initials(member.member_name)}</span>}
          </span>
          <span className={s.personName}>{member.member_name}</span>
          {member.member_code && <span className={s.personCode}>{member.member_code}</span>}
        </div>
      ) : null}

      {granted && days ? (
        <div className={s.days}>
          <span className={s.daysBig}>{days.big}</span>
          <span className={s.daysUnit}>{days.unit}</span>
          <span className={s.daysSmall}>{days.small}</span>
        </div>
      ) : null}

      <p className={s.resultText}>
        {result.message}
        {granted && result.subscription?.plan_name ? <span className={s.resultPlan}>{result.subscription.plan_name}</span> : null}
        {granted && result.visit ? <span className={s.resultVisit}>{visitLine(result.visit)}</span> : null}
      </p>

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
          <div className={s.resultTop}>
            <span className={s.resultIcon}><XIcon size={56} /></span>
            <span className={s.resultVerdict}>No se pudo validar</span>
          </div>
          <p className={s.resultText}>{failure}</p>
          <button type="button" className={s.next} onClick={next}>Intentar de nuevo</button>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import QRCode from 'qrcode';
import { gymMoney } from '../../../lib/gymLabels.js';
import { formatDayMonth, formatShortDate } from '../../../lib/dates.js';
import { whatsappHref } from '../whatsapp.js';
import { AlertIcon, BicepsIcon, CashIcon, ChatIcon, CheckIcon, ClockIcon, FlipIcon, TicketIcon, TrendIcon } from './icons.jsx';
import {
  longDayMonth, measureHighlights, periodRange, readMeasures, subscriptionView, SUBSCRIPTION_STATE,
} from './gymPortalData.js';
import { GymPortalGym } from './GymPortalGym.jsx';
import { DaysRing } from './DaysRing.jsx';
import s from './GymPortalSubscription.module.css';

// Suscripción del socio: la tarjeta del plan (tipo pase), el período en curso o el saldo
// pendiente, y los últimos pagos. Al día, la tarjeta va con el gradiente de la marca; con algo
// por pagar, cambia a la variante de alerta en naranja. El tiquete de la esquina la gira (efecto
// de voltear) y por detrás está el QR de ingreso, que la entrada del gimnasio lee para dejarlo
// pasar y anotar su visita.

function StatusBadge({ tone, children }) {
  return (
    <span className={[s.badge, s[`badge_${tone}`]].join(' ')}>
      <span className={s.badgeDot} />
      {children}
    </span>
  );
}

// Una línea corta: desde cuándo debe y qué hacer. El monto ya lo dice todo.
function balanceText(view) {
  const periods = view.pendingPeriods;
  const first = periods[0];
  if (!first) return null;
  const since = <strong>{longDayMonth(first.start_date)}</strong>;
  if (periods.length > 1) return <>{periods.length} períodos sin pagar desde el {since}. Pásate por recepción.</>;
  return <>Sin pagar desde el {since}. Pásate por recepción.</>;
}

// El QR se pinta en el teléfono con la librería `qrcode` (la misma de los QR de mesa): el texto
// viene firmado del backend y aquí solo se dibuja. Los colores salen de los tokens del portal.
function useQrImage(text) {
  const [src, setSrc] = React.useState(null);
  React.useEffect(() => {
    if (!text) { setSrc(null); return undefined; }
    let alive = true;
    const styles = getComputedStyle(document.documentElement);
    const dark = styles.getPropertyValue('--portal-on-accent').trim() || '#0b2630';
    const light = styles.getPropertyValue('--portal-option-bg').trim() || '#ffffff';
    QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 480, color: { dark, light } })
      .then((url) => { if (alive) setSrc(url); })
      .catch(() => { if (alive) setSrc(null); });
    return () => { alive = false; };
  }, [text]);
  return src;
}

// Cara trasera de la tarjeta: el QR de ingreso, grande y sobre fondo claro para que el lector lo
// tome de lejos, con el nombre y el código del socio para que la recepción confirme quién es.
function AccessQrFace({ qr, memberName, memberCode, onFlip, hidden }) {
  const src = useQrImage(qr);
  return (
    <section
      aria-label="Mi código de ingreso"
      aria-hidden={hidden}
      className={[s.plan, s.flipFace, s.flipBack, s.planQr].join(' ')}
    >
      <div className={s.planHead}>
        <div className={s.planTitle}>
          <span className={s.planEyebrow}>Mi ingreso</span>
          <span className={s.qrName}>{memberName}</span>
        </div>
        <button
          type="button"
          className={[s.ticket, s.ticketOnLight].join(' ')}
          onClick={onFlip}
          aria-label="Volver a mi plan"
          tabIndex={hidden ? -1 : 0}
        >
          <FlipIcon size={20} />
        </button>
      </div>
      <div className={s.qrBox}>
        {src ? (
          <img className={s.qrImage} src={src} alt="Código QR de ingreso" />
        ) : (
          <span className={s.qrPending}>{qr ? 'Preparando tu código…' : 'Tu código no está disponible.'}</span>
        )}
      </div>
      <div className={[s.planFoot, s.qrFoot].join(' ')}>
        <span>Muéstralo en la entrada</span>
        {memberCode && <span className={s.code}>{memberCode}</span>}
      </div>
    </section>
  );
}

function PlanCard({ view, memberCode, memberName, accessQr }) {
  const [flipped, setFlipped] = React.useState(false);
  const flip = () => setFlipped((f) => !f);
  const alert = view.state !== SUBSCRIPTION_STATE.ACTIVE;
  let badge = <StatusBadge tone="success">Activa</StatusBadge>;
  if (view.state === SUBSCRIPTION_STATE.PENDING) badge = <StatusBadge tone="accent">Pago pendiente</StatusBadge>;
  else if (view.state === SUBSCRIPTION_STATE.GRACE) badge = <StatusBadge tone="accent">En gracia</StatusBadge>;

  let status = (
    <div className={s.statusLine}>
      <span className={[s.statusIcon, s.statusIconOk].join(' ')}><CheckIcon size={13} /></span>
      Estás al día
    </div>
  );
  if (alert) {
    let text = 'En período de gracia';
    if (view.state === SUBSCRIPTION_STATE.PENDING) text = view.currentPending ? 'Período sin pagar' : 'Saldo de meses anteriores';
    status = (
      <div className={[s.statusLine, s.statusLineAlert].join(' ')}>
        <span className={[s.statusIcon, s.statusIconAlert].join(' ')}><AlertIcon size={13} /></span>
        {text}
      </div>
    );
  }

  return (
    <div className={[s.flip, flipped ? s.flipped : ''].filter(Boolean).join(' ')}>
      <div className={s.flipInner}>
    <section
      aria-label="Plan actual"
      aria-hidden={flipped}
      className={[s.plan, s.flipFace, alert ? s.planAlert : s.planOk].join(' ')}
    >
      <div className={s.planHead}>
        <div className={s.planTitle}>
          <span className={s.planEyebrow}>Tu plan</span>
          <span className={s.planName}>{view.planName}</span>
        </div>
        <div className={s.planHeadRight}>
          {badge}
          {/* El tiquete: gira la tarjeta y muestra el QR de ingreso. */}
          <button
            type="button"
            className={s.ticket}
            onClick={flip}
            aria-label="Ver mi código de ingreso"
            tabIndex={flipped ? -1 : 0}
          >
            <TicketIcon size={22} />
          </button>
        </div>
      </div>

      <div className={s.planBody}>
        <DaysRing days={view.daysLeft} fraction={view.ringFraction} className={alert ? s.ringAlert : ''} />
        <div className={s.planDates}>
          <div className={s.due}>
            <span className={s.dueLabel}>{view.expired ? 'Venció el' : 'Vence el'}</span>
            <span className={s.dueDate}>{longDayMonth(view.period.end_date)}</span>
          </div>
          {status}
        </div>
      </div>

      <div className={s.planFoot}>
        <span>Período {view.period.number} · {periodRange(view.period.start_date, view.period.end_date)}</span>
        {memberCode && <span className={s.code}>{memberCode}</span>}
      </div>
    </section>
    <AccessQrFace qr={accessQr} memberName={memberName} memberCode={memberCode} onFlip={flip} hidden={!flipped} />
      </div>
    </div>
  );
}

function Balance({ view, whatsapp }) {
  return (
    <section aria-label="Saldo pendiente" className={s.balance}>
      <div className={s.balanceHead}>
        <span className={s.balanceIcon}><ClockIcon size={22} /></span>
        <div className={s.balanceTitle}>
          <span className={s.balanceEyebrow}>Pago pendiente</span>
          <span className={s.balanceAmount}>{gymMoney(view.pendingTotal)}</span>
        </div>
      </div>
      <p className={s.balanceText}>{balanceText(view)}</p>
      {whatsapp && (
        <a className={[s.whatsapp, s.whatsappCompact].join(' ')} href={whatsapp} target="_blank" rel="noopener noreferrer">
          <ChatIcon size={18} />
          <span>Escribirle al gimnasio</span>
        </a>
      )}
    </section>
  );
}

// Un avance por vez: cada vez que se abre el inicio se muestra el siguiente de la lista, para
// motivar sin saturar. El turno se guarda en el teléfono; sin almacenamiento, arranca del primero.
const HIGHLIGHT_KEY = 'piddet_gym_portal_highlight:';

function useHighlightTurn(memberCode, total) {
  const key = HIGHLIGHT_KEY + (memberCode || '');
  const [turn] = React.useState(() => {
    try {
      return Number(localStorage.getItem(key)) || 0;
    } catch {
      return 0;
    }
  });
  React.useEffect(() => {
    if (!total) return;
    try {
      localStorage.setItem(key, String(turn + 1));
    } catch {
      // Modo privado: se repite el mismo avance, no pasa nada.
    }
  }, [key, turn, total]);
  return total ? turn % total : 0;
}

function Progress({ data, onShowMeasures }) {
  const highlights = React.useMemo(
    () => measureHighlights(readMeasures(data.measurements), data.member?.goal),
    [data.measurements, data.member?.goal],
  );
  const index = useHighlightTurn(data.member?.member_code, highlights.length);
  const h = highlights[index];
  if (!h) return null;
  return (
    <button type="button" className={s.progress} onClick={onShowMeasures}>
      <span className={s.progressIcon}><BicepsIcon size={18} /></span>
      <span className={s.progressText}>
        <span className={s.progressTitle}>{h.verb} <strong>{h.amount}</strong>{h.tail ? ` ${h.tail}` : ''}</span>
        <span className={s.progressSince}>desde tu toma del {formatDayMonth(h.since)}</span>
      </span>
    </button>
  );
}

function Closed({ title, text, whatsapp }) {
  return (
    <section aria-label="Plan actual" className={[s.plan, s.planClosed].join(' ')}>
      <div className={s.planHead}>
        <div className={s.planTitle}>
          <span className={s.planEyebrow}>Tu plan</span>
          <span className={s.planName}>{title}</span>
        </div>
      </div>
      <p className={s.closedText}>{text}</p>
      {whatsapp && (
        <a className={s.whatsapp} href={whatsapp} target="_blank" rel="noopener noreferrer">
          <ChatIcon size={20} />
          <span>Escribirle al gimnasio</span>
        </a>
      )}
    </section>
  );
}

function Payments({ payments }) {
  if (!payments.length) return null;
  return (
    <section aria-label="Últimos pagos" className={s.payments}>
      <h2 className={[s.h2, s.paymentsTitle].join(' ')}>Últimos pagos</h2>
      <ul className={s.paymentList}>
        {payments.map((p, i) => (
          <li key={`${p.payment_date}-${i}`} className={s.payment}>
            <span className={s.paymentIcon}><CashIcon size={18} /></span>
            <div className={s.paymentText}>
              <span className={s.paymentTitle}>
                Período {p.period_number}{p.payment_method_name ? ` · ${p.payment_method_name}` : ''}
              </span>
              <span className={s.paymentDate}>{formatShortDate(p.payment_date)}</span>
            </div>
            <span className={s.paymentValue}>{gymMoney(p.value)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GymPortalSubscription({ data, onShowMeasures }) {
  const view = subscriptionView(data.subscription, data.today);
  const payments = data.payments || [];
  const memberName = data.member?.member_name || '';
  const whatsapp = whatsappHref(
    data.whatsapp_number,
    `Hola, soy ${memberName}. Quiero ponerme al día con mi suscripción.`,
  );

  if (view.state === SUBSCRIPTION_STATE.NONE) {
    return (
      <>
        <Closed
          title="Sin plan activo"
          text="Aún no tienes una suscripción activa. Pásate por recepción para elegir tu plan."
          whatsapp={whatsappHref(data.whatsapp_number, `Hola, soy ${memberName}. Quiero activar mi plan.`)}
        />
        <GymPortalGym data={data} />
        <Payments payments={payments} />
      </>
    );
  }

  if (view.state === SUBSCRIPTION_STATE.CANCELLED) {
    return (
      <>
        <Closed
          title={view.planName}
          text={`Tu suscripción se canceló${view.cancelledAt ? ` el ${longDayMonth(view.cancelledAt)}` : ''}. Pásate por recepción para renovarla.`}
          whatsapp={whatsappHref(data.whatsapp_number, `Hola, soy ${memberName}. Quiero renovar mi plan.`)}
        />
        <GymPortalGym data={data} />
        <Payments payments={payments} />
      </>
    );
  }

  const pending = view.state === SUBSCRIPTION_STATE.PENDING;

  return (
    <>
      <PlanCard view={view} memberCode={data.member?.member_code} memberName={memberName} accessQr={data.access_qr} />
      <Progress data={data} onShowMeasures={onShowMeasures} />
      {pending && <Balance view={view} whatsapp={whatsapp} />}
      <GymPortalGym data={data} />
      <Payments payments={payments} />
      {!pending && (
        <button type="button" className={s.ghost} onClick={onShowMeasures}>
          <TrendIcon size={18} className={s.ghostIcon} />
          <span>Ver mis medidas</span>
        </button>
      )}
    </>
  );
}

import React from 'react';
import { gymMoney } from '../../../lib/gymLabels.js';
import { formatShortDate } from '../../../lib/dates.js';
import { whatsappHref } from '../whatsapp.js';
import { AlertIcon, CashIcon, ChatIcon, CheckIcon, ClockIcon, TrendIcon } from './icons.jsx';
import { longDayMonth, periodRange, subscriptionView, SUBSCRIPTION_STATE } from './gymPortalData.js';
import { GymPortalGym } from './GymPortalGym.jsx';
import s from './GymPortalSubscription.module.css';

// Suscripción del socio: la tarjeta del plan (tipo pase), el período en curso o el saldo
// pendiente, y los últimos pagos. Al día, la tarjeta va con el gradiente de la marca; con algo
// por pagar, cambia a la variante de alerta en naranja.

const RING_R = 48;
const RING_C = 2 * Math.PI * RING_R;

function DaysRing({ days, fraction, tone }) {
  const offset = RING_C * (1 - Math.min(1, Math.max(0, fraction)));
  return (
    <div className={s.ring}>
      <svg width="116" height="116" viewBox="0 0 116 116" aria-hidden="true">
        <circle cx="58" cy="58" r={RING_R} className={tone === 'alert' ? s.ringTrackDim : s.ringTrack} />
        <circle
          cx="58" cy="58" r={RING_R}
          className={s.ringValue}
          strokeDasharray={RING_C.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
          transform="rotate(-90 58 58)"
        />
      </svg>
      <div className={s.ringCenter}>
        <span className={s.ringDays}>{days}</span>
        <span className={s.ringUnit}>{days === 1 ? 'día' : 'días'}</span>
      </div>
    </div>
  );
}

function StatusBadge({ tone, children }) {
  return (
    <span className={[s.badge, s[`badge_${tone}`]].join(' ')}>
      <span className={s.badgeDot} />
      {children}
    </span>
  );
}

function balanceText(view) {
  const periods = view.pendingPeriods;
  const first = periods[0];
  if (!first) return null;
  if (periods.length > 1) {
    return <>Tienes <strong>{periods.length} períodos</strong> con saldo desde el <strong>{longDayMonth(first.start_date)}</strong>. Pásate por recepción para ponerte al día.</>;
  }
  if (Number(first.number) === Number(view.period.number)) {
    return (
      <>
        {Number(first.number) > 1 ? 'Tu nuevo mes arrancó' : 'Tu plan arrancó'} el <strong>{longDayMonth(first.start_date)}</strong> y
        aún no está pagado. Pásate por recepción para renovar y tomarte las medidas del mes.
      </>
    );
  }
  return <>Tienes saldo del período que arrancó el <strong>{longDayMonth(first.start_date)}</strong>. Pásate por recepción para ponerte al día.</>;
}

function PlanCard({ view, memberCode }) {
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
    <section aria-label="Plan actual" className={[s.plan, alert ? s.planAlert : s.planOk].join(' ')}>
      <div className={s.planHead}>
        <div className={s.planTitle}>
          <span className={s.planEyebrow}>Tu plan</span>
          <span className={s.planName}>{view.planName}</span>
        </div>
        {badge}
      </div>

      <div className={s.planBody}>
        <DaysRing days={view.daysLeft} fraction={view.ringFraction} tone={alert ? 'alert' : 'ok'} />
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
  );
}

function Balance({ view, whatsapp }) {
  return (
    <section aria-label="Saldo pendiente" className={s.balance}>
      <div className={s.balanceHead}>
        <div className={s.balanceTitle}>
          <span className={s.balanceEyebrow}>Saldo pendiente</span>
          <span className={s.balanceAmount}>{gymMoney(view.pendingTotal)}</span>
        </div>
        <ClockIcon size={40} />
      </div>
      <p className={s.balanceText}>{balanceText(view)}</p>
      {whatsapp && (
        <a className={s.whatsapp} href={whatsapp} target="_blank" rel="noopener noreferrer">
          <ChatIcon size={20} />
          <span>Escribirle al gimnasio</span>
        </a>
      )}
    </section>
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
      <PlanCard view={view} memberCode={data.member?.member_code} />
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

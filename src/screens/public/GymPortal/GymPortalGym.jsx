import React from 'react';
import { getStoreStatus, getWeekSchedule, googleMapsUrl } from '../../../lib/storeHours.js';
import { whatsappHref } from '../whatsapp.js';
import { ChatIcon, ChevronDownIcon, ClockIcon, DumbbellIcon, NavigationIcon, PhoneCallIcon, PinIcon } from './icons.jsx';
import s from './GymPortalGym.module.css';

// Tu gimnasio: dónde queda, si está abierto ahora y a qué horas abre cada día, con los atajos
// para llegar, llamar o escribir. Es lo que el socio consulta antes de salir de la casa.
// Normalmente hay una sola sede; si hay varias, va una tarjeta por cada una.
//
// Tiene dos estados. Colapsada (por defecto) es una fila: nombre, si está abierto y la dirección
// en una línea, para no robarle protagonismo a la suscripción. Al tocarla se abre con la
// dirección completa, el horario y los atajos. El teléfono recuerda la última elección.

const OPEN_KEY = 'piddet_gym_portal_store_open';

function readOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) === '1';
  } catch {
    return false;
  }
}

function StoreCard({ store, gymName, whatsapp, single }) {
  const [now, setNow] = React.useState(() => new Date());
  const [open, setOpen] = React.useState(readOpen);
  const [expanded, setExpanded] = React.useState(false);
  const bodyId = React.useId();

  const toggle = () => {
    setOpen((v) => {
      try { localStorage.setItem(OPEN_KEY, v ? '0' : '1'); } catch { /* sin almacenamiento */ }
      return !v;
    });
  };

  // "Abierto / Cierra a las…" se recalcula solo mientras la pantalla está abierta.
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const schedules = store.schedules || [];
  const status = getStoreStatus(schedules, store.store_status_id, now);
  const week = getWeekSchedule(schedules, now).filter((d) => d.dayId !== 7 || !d.closed);
  const today = week.find((d) => d.isToday);
  const phoneDigits = String(store.phone_number || '').replace(/\D+/g, '');
  const phoneHref = phoneDigits ? `tel:+${String(store.phone_code || '57').replace(/\D+/g, '')}${phoneDigits}` : null;
  const hasSchedule = schedules.length > 0;

  const title = single ? (gymName || store.name) : store.name;
  // Colapsada, la segunda línea dice lo que más se pregunta: hasta qué hora está abierto (o
  // cuándo abre); si no hay horario, la dirección.
  const summary = (hasSchedule && status.detail) || store.address || '';

  return (
    <section className={[s.card, open ? '' : s.cardCollapsed].filter(Boolean).join(' ')} aria-label={single ? 'Tu gimnasio' : store.name}>
      <button type="button" className={s.toggle} onClick={toggle} aria-expanded={open} aria-controls={bodyId}>
        <span className={s.toggleIcon}><DumbbellIcon size={18} /></span>
        <span className={s.titles}>
          <span className={s.eyebrow}>{single ? 'Tu gimnasio' : gymName}</span>
          <span className={s.name}>{title}</span>
          {!open && summary && <span className={s.summary}>{summary}</span>}
        </span>
        {hasSchedule && (
          <span className={[s.status, status.open ? s.statusOpen : s.statusClosed].join(' ')}>
            <span className={s.statusDot} />
            {status.label}
          </span>
        )}
        <ChevronDownIcon size={18} className={[s.chevron, open ? s.chevronUp : ''].filter(Boolean).join(' ')} />
      </button>

      {open && (
        <div id={bodyId} className={s.body}>
          {store.address && (
            <a className={s.row} href={googleMapsUrl(store)} target="_blank" rel="noopener noreferrer">
              <span className={s.rowIcon}><PinIcon size={18} /></span>
              <span className={s.rowText}>
                {single && store.name && gymName && store.name !== gymName && <span className={s.rowLabel}>{store.name}</span>}
                <span className={s.rowValue}>{store.address}</span>
              </span>
            </a>
          )}

          {hasSchedule && (
            <div className={s.hours}>
              <button type="button" className={s.row} onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
                <span className={s.rowIcon}><ClockIcon size={18} /></span>
                <span className={s.rowText}>
                  <span className={s.rowLabel}>{status.detail || 'Horario'}</span>
                  <span className={s.rowValue}>Hoy: {today ? today.text : 'Cerrado'}</span>
                </span>
                <ChevronDownIcon size={18} className={[s.chevron, expanded ? s.chevronUp : ''].filter(Boolean).join(' ')} />
              </button>
              {expanded && (
                <ul className={s.week}>
                  {week.map((d) => (
                    <li key={d.dayId} className={[s.day, d.isToday ? s.dayToday : '', d.closed ? s.dayClosed : ''].filter(Boolean).join(' ')}>
                      <span>{d.name}</span>
                      <span className={s.dayHours}>{d.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className={s.actions}>
            {store.address && (
              <a className={[s.action, s.actionPrimary].join(' ')} href={googleMapsUrl(store)} target="_blank" rel="noopener noreferrer">
                <NavigationIcon size={18} />
                <span>Cómo llegar</span>
              </a>
            )}
            {phoneHref && (
              <a className={s.action} href={phoneHref}>
                <PhoneCallIcon size={18} />
                <span>Llamar</span>
              </a>
            )}
            {whatsapp && (
              <a className={s.action} href={whatsapp} target="_blank" rel="noopener noreferrer">
                <ChatIcon size={18} />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export function GymPortalGym({ data }) {
  const stores = data.stores || [];
  if (!stores.length) return null;
  const gymName = data.company?.name || '';
  const whatsapp = whatsappHref(data.whatsapp_number, `Hola, soy ${data.member?.member_name || 'afiliado'}.`);

  return (
    <>
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} gymName={gymName} whatsapp={whatsapp} single={stores.length === 1} />
      ))}
    </>
  );
}

import React from 'react';
import { api } from '../../../lib/api.js';
import { GymPortalLogin } from './GymPortalLogin.jsx';
import { GymPortalSubscription } from './GymPortalSubscription.jsx';
import { GymPortalMeasures } from './GymPortalMeasures.jsx';
import { CardIcon, LogoutIcon, TrendIcon } from './icons.jsx';
import { subscriptionView, SUBSCRIPTION_STATE } from './gymPortalData.js';
import s from './GymPortal.module.css';

// Portal público del afiliado (/{username-compañía}/afiliados): el socio entra con su celular y su
// fecha de nacimiento y ve su suscripción, su saldo y las medidas que le han tomado. Pensado para
// el teléfono: una columna, fondo oscuro fijo y navegación abajo, al alcance del pulgar.
//
// La sesión es solo de la pestaña (sessionStorage): recargar no saca al socio, cerrar la pestaña
// o tocar "Salir" sí. No guarda credenciales, solo lo que el backend ya devolvió.

const TABS = [
  { key: 'subscription', label: 'Suscripción', Icon: CardIcon },
  { key: 'measures', label: 'Medidas', Icon: TrendIcon },
];

const storageKey = (username) => `piddet_gym_portal:${username}`;

function readSession(username) {
  try {
    const raw = sessionStorage.getItem(storageKey(username));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(username, data) {
  try {
    if (data) sessionStorage.setItem(storageKey(username), JSON.stringify(data));
    else sessionStorage.removeItem(storageKey(username));
  } catch {
    // Sin almacenamiento (modo privado): la sesión dura lo que dure la página.
  }
}

const initials = (name) => String(name || '')
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((w) => w[0] || '')
  .join('')
  .toUpperCase();

// La barra de estado del teléfono se pinta del fondo del portal mientras está abierto.
function usePortalThemeColor(rootRef) {
  React.useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta || !rootRef.current) return undefined;
    const previous = meta.getAttribute('content');
    const color = getComputedStyle(rootRef.current).getPropertyValue('--portal-bg').trim();
    if (color) meta.setAttribute('content', color);
    return () => { if (previous) meta.setAttribute('content', previous); };
  }, [rootRef]);
}

export function GymPortal({ companyUsername }) {
  const rootRef = React.useRef(null);
  const [session, setSession] = React.useState(() => readSession(companyUsername));
  const [tab, setTab] = React.useState('subscription');
  const [company, setCompany] = React.useState(session?.company || null);

  usePortalThemeColor(rootRef);

  // Nombre y logo del gimnasio para la entrada, antes de que el socio se identifique.
  React.useEffect(() => {
    if (session) return undefined;
    let alive = true;
    api.publicCompany(companyUsername)
      .then((data) => { if (alive && data?.company) setCompany(data.company); })
      .catch(() => {});
    return () => { alive = false; };
  }, [companyUsername, session]);

  React.useEffect(() => {
    const name = session?.company?.name || company?.name;
    const previous = document.title;
    document.title = name ? `${name} · Afiliados` : 'Afiliados';
    return () => { document.title = previous; };
  }, [session, company]);

  const login = async ({ phoneNumber, birthdate }) => {
    const data = await api.gymPortalAccess(companyUsername, { phoneNumber, birthdate });
    writeSession(companyUsername, data);
    setSession(data);
    setTab('subscription');
    window.scrollTo(0, 0);
  };

  const logout = () => {
    writeSession(companyUsername, null);
    setSession(null);
    window.scrollTo(0, 0);
  };

  const goTo = (key) => {
    setTab(key);
    window.scrollTo(0, 0);
  };

  if (!session) {
    return (
      <div ref={rootRef} className={[s.page, s.glowLogin].join(' ')}>
        <GymPortalLogin company={company} onSubmit={login} />
      </div>
    );
  }

  const member = session.member || {};
  const gymName = session.company?.name || company?.name || '';
  // El resplandor del fondo acompaña el estado: naranja cuando hay algo pendiente de pago.
  const subState = subscriptionView(session.subscription, session.today).state;
  const warm = subState === SUBSCRIPTION_STATE.PENDING || subState === SUBSCRIPTION_STATE.GRACE;
  let glow = s.glowTeal;
  if (tab === 'measures') glow = s.glowMeasures;
  else if (warm) glow = s.glowAccent;

  return (
    <div ref={rootRef} className={[s.page, glow].join(' ')}>
      <div className={s.shell}>
        <main className={s.content}>
          {tab === 'subscription' && (
            <header className={s.header}>
              <div className={s.identity}>
                <span className={s.avatar} aria-hidden="true">{initials(member.member_name || member.first_name)}</span>
                <div className={s.identityText}>
                  <span className={s.eyebrow}>{gymName}</span>
                  <span className={s.hello}>Hola, {member.first_name}</span>
                </div>
              </div>
              <button type="button" className={s.logout} onClick={logout} aria-label="Salir">
                <LogoutIcon />
              </button>
            </header>
          )}

          {tab === 'subscription' ? (
            <GymPortalSubscription data={session} onShowMeasures={() => goTo('measures')} />
          ) : (
            <GymPortalMeasures data={session} gymName={gymName} />
          )}
        </main>

        <nav className={s.tabs} aria-label="Secciones">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className={[s.tab, tab === key ? s.tabOn : ''].filter(Boolean).join(' ')}
              aria-current={tab === key ? 'page' : undefined}
              onClick={() => goTo(key)}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

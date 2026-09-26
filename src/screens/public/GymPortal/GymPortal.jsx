import React from 'react';
import { api } from '../../../lib/api.js';
import { GymPortalSubscription } from './GymPortalSubscription.jsx';
import { GymPortalMeasures } from './GymPortalMeasures.jsx';
import { GymPortalProfile } from './GymPortalProfile.jsx';
import { CardIcon, LogoutIcon, TrendIcon, UserIcon } from './icons.jsx';
import { subscriptionView, SUBSCRIPTION_STATE } from './gymPortalData.js';
import { usePortalInstall } from './usePortalInstall.js';
import { InstallBanner, InstallButton, InstallSheet } from './GymPortalInstall.jsx';
import { Spinner } from '../../../components';
import { GYM_HUB_PATH, clearPending, peekPending } from './portalStorage.js';
import s from './GymPortal.module.css';

// Portal público del afiliado (/gym/{username-compañía}): el socio ve su suscripción, su saldo y
// las medidas que le han tomado. Pensado para el teléfono: una columna, fondo oscuro fijo y
// navegación abajo, al alcance del pulgar.
//
// No tiene entrada propia: se entra por la general (piddet.com/gym) con un código por SMS, que
// deja la sesión lista para este portal. La sesión queda guardada en el teléfono (localStorage) y
// en el servidor, y no vence: solo termina cuando el socio toca "Cerrar sesión". Al abrir se pinta
// enseguida lo último que se vio y se refresca por detrás. Sin sesión, al cerrarla o si ya no vale
// (401), vuelve a la entrada general.

const TABS = [
  { key: 'subscription', label: 'Suscripción', Icon: CardIcon },
  { key: 'measures', label: 'Medidas', Icon: TrendIcon },
  { key: 'profile', label: 'Perfil', Icon: UserIcon },
];

const TAB_PARAM = { medidas: 'measures', perfil: 'profile' };

const storageKey = (username) => `piddet_gym_portal_session:${username}`;

function readSession(username) {
  try {
    const raw = localStorage.getItem(storageKey(username));
    const saved = raw ? JSON.parse(raw) : null;
    return saved?.session_token ? saved : null;
  } catch {
    return null;
  }
}

function writeSession(username, data) {
  try {
    if (data) localStorage.setItem(storageKey(username), JSON.stringify(data));
    else localStorage.removeItem(storageKey(username));
    // Versión anterior del portal: la sesión vivía solo en la pestaña.
    sessionStorage.removeItem(`piddet_gym_portal:${username}`);
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

// Marca del gimnasio que lee el script de index.html al cargar la página para armar el manifest
// de la app instalable (nombre bajo el icono e icono de la compañía).
function writeBrand(username, company) {
  if (!company?.name) return;
  const brand = {
    name: company.name,
    app_name: company.app_name ?? null,
    username: company.username || username,
    icon: company.icon ?? null,
    thumbnail_icon: company.thumbnail_icon ?? null,
    app_icon_bg: company.app_icon_bg ?? null,
    brand_primary: company.brand_primary ?? null,
  };
  try {
    localStorage.setItem(`piddet_gym_portal_brand:${username}`, JSON.stringify(brand));
  } catch {
    // Sin almacenamiento: la app se instala con el nombre genérico.
  }
  // Chrome fija el diálogo tarde: si la página cargó sin la marca, se le pasa ya.
  const pwa = window.__piddetPwa;
  if (pwa?.portal && !pwa.portal.named && pwa.applyGymPortal) pwa.applyGymPortal(username, brand, true);
}

const BANNER_KEY = 'piddet_gym_portal_install_dismissed';
const BANNER_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_AFTER_MS = 60 * 1000;
const LOGOUT_WAIT_MS = 2500;

function bannerSnoozed() {
  try {
    return Date.now() - Number(localStorage.getItem(BANNER_KEY) || 0) < BANNER_SNOOZE_MS;
  } catch {
    return false;
  }
}

// Lo que trae la URL al abrir: la pestaña de un acceso directo (?tab=medidas), la vuelta tras
// preparar la instalación (?instalar=1) y la sesión que la app de iOS recibe en el fragmento
// (#s=…, ver index.html). Se lee una vez y la URL queda limpia.
function readLaunch(username) {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return {
    tab: TAB_PARAM[params.get('tab')] || 'subscription',
    install: params.get('instalar') === '1',
    // La sesión puede llegar en el fragmento (app de iOS) o dejarla lista la entrada general.
    handoff: hash.get('s') || peekPending(username) || null,
  };
}

function SignOut({ onConfirm }) {
  const [asking, setAsking] = React.useState(false);
  if (!asking) {
    return (
      <div className={s.signOutBox}>
        <button type="button" className={s.signOutLink} onClick={() => setAsking(true)}>
          <LogoutIcon size={14} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    );
  }
  return (
    <div className={[s.signOutBox, s.signOutAsk].join(' ')} role="group" aria-label="Cerrar sesión">
      <p className={s.signOutText}>¿Cerrar sesión en este teléfono? Para volver a entrar tendrás que pedir un código.</p>
      <div className={s.signOutActions}>
        <button type="button" className={s.signOutCancel} onClick={() => setAsking(false)}>Seguir dentro</button>
        <button type="button" className={s.signOutConfirm} onClick={onConfirm}>Cerrar sesión</button>
      </div>
    </div>
  );
}

export function GymPortal({ companyUsername }) {
  const rootRef = React.useRef(null);
  const [launch] = React.useState(() => readLaunch(companyUsername));
  // Una sesión recién entregada (fragmento o entrada general) manda sobre la guardada.
  const [session, setSession] = React.useState(() => {
    const saved = readSession(companyUsername);
    return launch.handoff && saved?.session_token !== launch.handoff ? null : saved;
  });
  const [resuming, setResuming] = React.useState(() => !session && !!launch.handoff);
  const [tab, setTab] = React.useState(launch.tab);
  const [company, setCompany] = React.useState(session?.company || null);
  const installer = usePortalInstall();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [bannerHidden, setBannerHidden] = React.useState(bannerSnoozed);
  const lastRefresh = React.useRef(0);
  const tokenRef = React.useRef(launch.handoff || session?.session_token);

  usePortalThemeColor(rootRef);

  // La sesión que dejó la entrada general ya está en el estado: se borra para no volver a usarla.
  React.useEffect(() => { clearPending(companyUsername); }, [companyUsername]);

  React.useEffect(() => {
    if (window.location.search || window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Nombre y logo del gimnasio mientras se abre una sesión recién entregada (la pantalla de carga).
  React.useEffect(() => {
    if (session || !resuming) return undefined;
    let alive = true;
    api.publicCompany(companyUsername)
      .then((data) => { if (alive && data?.company) setCompany(data.company); })
      .catch(() => {});
    return () => { alive = false; };
  }, [companyUsername, session, resuming]);

  const brand = session?.company || company;
  React.useEffect(() => { writeBrand(companyUsername, brand); }, [companyUsername, brand]);

  React.useEffect(() => {
    const name = brand?.name;
    const previous = document.title;
    document.title = name ? `${name} · Mi suscripción` : 'Mi suscripción · piddet gym';
    return () => { document.title = previous; };
  }, [brand]);

  // Por qué se vuelve a la entrada general, si hace falta decírselo (`?aviso=`, ver GymHub).
  const [leaving, setLeaving] = React.useState(null);

  // Refresca con la sesión guardada y renueva el token. Sin red se queda lo último que se vio;
  // con la sesión vencida se vuelve a la entrada.
  const refresh = React.useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    lastRefresh.current = Date.now();
    try {
      const data = await api.gymPortalResume(companyUsername, token);
      // Si mientras tanto cerró sesión (o entró con otra), la respuesta ya no es suya.
      if (tokenRef.current !== token || !data?.session_token) return;
      tokenRef.current = data.session_token;
      writeSession(companyUsername, data);
      setSession(data);
    } catch (err) {
      if (tokenRef.current !== token) return;
      if (err?.status === 401) {
        tokenRef.current = null;
        writeSession(companyUsername, null);
        setSession(null);
        setLeaving('sesion');
      } else if (!readSession(companyUsername)) {
        setLeaving('conexion');
      }
    } finally {
      setResuming(false);
    }
  }, [companyUsername]);

  React.useEffect(() => { refresh(); }, [refresh]);

  // Como una app: al volver a ella (desde otra app o la pantalla de inicio) se ponen al día los
  // datos, sin que el socio tenga que recargar.
  React.useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRefresh.current > REFRESH_AFTER_MS) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  // ── Instalar como app ──
  const reloadedForInstall = launch.install;
  React.useEffect(() => {
    if (launch.install && installer.mode !== 'none') setSheetOpen(true);
    // Solo al abrir tras preparar la instalación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // iPhone: mientras la hoja está abierta la URL lleva la sesión en el fragmento, por si Safari
  // toma la dirección actual y no el start_url del manifest al «Agregar a inicio».
  React.useEffect(() => {
    if (!sheetOpen || installer.mode !== 'ios' || !session?.session_token) return undefined;
    window.history.replaceState(null, '', `${window.location.pathname}#s=${encodeURIComponent(session.session_token)}`);
    return () => window.history.replaceState(null, '', window.location.pathname);
  }, [sheetOpen, installer.mode, session?.session_token]);

  const openInstall = async () => {
    // El manifest se arma al cargar la página. Si entonces aún no tenía el nombre del gimnasio
    // (primera visita) o, en iPhone, la sesión para la app, se recarga una vez para que se
    // instale lo correcto; la hoja se abre sola al volver.
    const pwa = window.__piddetPwa?.portal;
    const stale = pwa && ((!pwa.named && brand?.name) || (installer.mode === 'ios' && session && !pwa.handoff));
    if (stale && !reloadedForInstall && installer.mode !== 'in-app') {
      window.location.replace(`${window.location.pathname}?instalar=1`);
      return;
    }
    if (installer.mode === 'prompt') {
      await installer.promptInstall();
      return;
    }
    setSheetOpen(true);
  };

  const installFromSheet = async () => {
    const outcome = await installer.promptInstall();
    if (outcome) setSheetOpen(false);
  };

  const dismissBanner = () => {
    setBannerHidden(true);
    try { localStorage.setItem(BANNER_KEY, String(Date.now())); } catch { /* sin almacenamiento */ }
  };

  const closeSheet = React.useCallback(() => setSheetOpen(false), []);

  // Lo que devuelve cualquier acción del portal trae el portal completo y el token renovado.
  const applyData = (data) => {
    if (!data?.session_token) return;
    tokenRef.current = data.session_token;
    lastRefresh.current = Date.now();
    writeSession(companyUsername, data);
    setSession(data);
  };

  const expire = () => {
    tokenRef.current = null;
    writeSession(companyUsername, null);
    setSession(null);
    setLeaving('sesion');
  };

  // Acciones del perfil: una sesión vencida vuelve a la entrada; cualquier otro error sube a la
  // pantalla para que lo muestre donde ocurrió.
  const withSession = (call) => async (...args) => {
    try {
      applyData(await call(tokenRef.current, ...args));
    } catch (err) {
      if (err?.status === 401) expire();
      throw err;
    }
  };
  const saveProfile = withSession((token, changes) => api.gymPortalUpdateProfile(companyUsername, token, changes));
  const uploadPhoto = withSession((token, file) => api.gymPortalUploadPhoto(companyUsername, token, file));
  const removePhoto = withSession((token) => api.gymPortalRemovePhoto(companyUsername, token));

  // Sin sesión no hay nada que mostrar aquí: a la entrada general, diciendo por qué si hace falta.
  // `replace`: el botón atrás no debe devolverlo a un portal vacío.
  const noSession = !session && !resuming;
  React.useEffect(() => {
    if (!noSession) return;
    window.location.replace(leaving ? `${GYM_HUB_PATH}?aviso=${leaving}` : GYM_HUB_PATH);
  }, [noSession, leaving]);

  // La sesión no vence: solo termina aquí. Se avisa al servidor para que el token deje de servir
  // (con un tope: si no hay señal, el teléfono igual la olvida) y se vuelve a la entrada general.
  const [signingOut, setSigningOut] = React.useState(false);
  const logout = async () => {
    const token = tokenRef.current;
    tokenRef.current = null;
    writeSession(companyUsername, null);
    setSigningOut(true);
    if (token) {
      await Promise.race([
        api.gymPortalLogout(companyUsername, token).catch(() => {}),
        new Promise((resolve) => { setTimeout(resolve, LOGOUT_WAIT_MS); }),
      ]);
    }
    window.location.assign(GYM_HUB_PATH);
  };

  // Mientras escribe en un campo la barra se esconde: en el teléfono quedaría encima del teclado.
  const [typing, setTyping] = React.useState(false);
  React.useEffect(() => {
    const isField = (el) => el && el.matches?.('input, textarea, select');
    const onIn = (e) => { if (isField(e.target)) setTyping(true); };
    const onOut = (e) => { if (isField(e.target)) setTyping(false); };
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);

  const [tabPhotoFailed, setTabPhotoFailed] = React.useState(false);
  const photoUrl = session?.member?.photo_url;
  React.useEffect(() => { setTabPhotoFailed(false); }, [photoUrl]);

  const goTo = (key) => {
    setTab(key);
    window.scrollTo(0, 0);
  };

  const sheet = (
    <InstallSheet
      open={sheetOpen}
      mode={installer.mode}
      device={installer.device}
      company={brand}
      onClose={closeSheet}
      onInstall={installFromSheet}
    />
  );

  if (resuming || !session || signingOut) {
    let label = 'Abriendo tu suscripción…';
    if (signingOut) label = 'Cerrando sesión…';
    else if (!resuming) label = 'Volviendo a la entrada…';
    return (
      <div ref={rootRef} className={[s.page, s.glowLogin].join(' ')}>
        <div className={s.splash} aria-busy="true">
          <span className={s.splashName}>{brand?.name || 'Tu gimnasio'}</span>
          <Spinner size="md" label={label} />
        </div>
      </div>
    );
  }

  const canInstall = installer.mode !== 'none';
  const member = session.member || {};
  const gymName = session.company?.name || company?.name || '';
  // El resplandor del fondo acompaña el estado: naranja cuando hay algo pendiente de pago.
  const subState = subscriptionView(session.subscription, session.today).state;
  const warm = subState === SUBSCRIPTION_STATE.PENDING || subState === SUBSCRIPTION_STATE.GRACE;
  let glow = s.glowTeal;
  if (tab !== 'subscription') glow = s.glowMeasures;
  else if (warm) glow = s.glowAccent;

  return (
    <div ref={rootRef} className={[s.page, glow].join(' ')}>
      <div className={s.shell}>
        <main className={s.content}>
          {tab === 'subscription' && (
            <header className={s.header}>
              <div className={s.identity}>
                <button type="button" className={s.avatar} onClick={() => goTo('profile')} aria-label="Ver mi perfil">
                  {member.photo_url
                    ? <img src={member.photo_url} alt="" onError={(e) => { e.currentTarget.hidden = true; }} />
                    : null}
                  <span>{initials(member.member_name || member.first_name)}</span>
                </button>
                <div className={s.identityText}>
                  <span className={s.eyebrow}>{gymName}</span>
                  <span className={s.hello}>Hola, {member.first_name}</span>
                </div>
              </div>
            </header>
          )}

          {tab === 'subscription' && canInstall && (installer.installed || !bannerHidden) && (
            <InstallBanner
              company={brand}
              installed={installer.installed}
              onOpen={openInstall}
              onDismiss={dismissBanner}
            />
          )}

          {tab === 'subscription' && (
            <GymPortalSubscription data={session} onShowMeasures={() => goTo('measures')} />
          )}
          {tab === 'measures' && <GymPortalMeasures data={session} gymName={gymName} />}
          {tab === 'profile' && (
            <GymPortalProfile
              data={session}
              onSaveProfile={saveProfile}
              onUploadPhoto={uploadPhoto}
              onRemovePhoto={removePhoto}
            />
          )}

          {canInstall && !installer.installed && <InstallButton onOpen={openInstall} />}

          {/* Cerrar sesión, a propósito escondido: la idea es que el socio se quede dentro y no
              tenga que volver a pedir un código. Solo al final del perfil, pequeño y con
              confirmación. */}
          {tab === 'profile' && <SignOut onConfirm={logout} />}
        </main>

        <nav className={[s.tabs, typing ? s.tabsHidden : ''].filter(Boolean).join(' ')} aria-label="Secciones">
          <div className={s.tabsRow}>
            {TABS.map(({ key, label, Icon }) => {
              const on = tab === key;
              const photo = key === 'profile' && member.photo_url && !tabPhotoFailed;
              return (
                <button
                  key={key}
                  type="button"
                  className={[s.tab, on ? s.tabOn : ''].filter(Boolean).join(' ')}
                  aria-current={on ? 'page' : undefined}
                  onClick={() => goTo(key)}
                >
                  {photo ? (
                    <span className={s.tabAvatar}>
                      <img src={member.photo_url} alt="" onError={() => setTabPhotoFailed(true)} />
                    </span>
                  ) : (
                    <Icon size={24} strokeWidth={on ? 2.6 : 2} />
                  )}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
      {sheet}
    </div>
  );
}

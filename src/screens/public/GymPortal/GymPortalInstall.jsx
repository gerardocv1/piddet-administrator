import React from 'react';
import {
  AddSquareIcon, BoltIcon, CheckIcon, CloseIcon, DotsVerticalIcon, DownloadIcon, DumbbellIcon,
  LinkIcon, LockIcon, PhoneIcon, ShareIosIcon, WifiOffIcon,
} from './icons.jsx';
import s from './GymPortalInstall.module.css';

// Instalar el portal como app: un aviso arriba (se puede cerrar), un botón fijo al final de cada
// pestaña y una hoja inferior que guía según el teléfono. En Android con diálogo nativo instala
// en un toque; en iPhone explica Compartir → Agregar a inicio, que es el único camino que Apple
// permite; dentro de WhatsApp o Instagram pide abrir el enlace en el navegador.

function AppMark({ company }) {
  const [failed, setFailed] = React.useState(false);
  const logo = company?.thumbnail_icon || company?.icon;
  return (
    <span className={s.appMark} aria-hidden="true">
      {logo && !failed
        ? <img src={logo} alt="" onError={() => setFailed(true)} />
        : <DumbbellIcon size={26} />}
    </span>
  );
}

export function InstallBanner({ company, installed, onOpen, onDismiss }) {
  if (installed) {
    return (
      <div className={[s.banner, s.bannerDone].join(' ')} role="status">
        <span className={s.doneIcon}><CheckIcon size={16} /></span>
        <div className={s.bannerText}>
          <span className={s.bannerTitle}>¡Lista en tu pantalla de inicio!</span>
          <span className={s.bannerLead}>Ábrela desde el ícono de {company?.name || 'tu gimnasio'}.</span>
        </div>
      </div>
    );
  }
  return (
    <div className={s.banner}>
      <AppMark company={company} />
      <div className={s.bannerText}>
        <span className={s.bannerTitle}>Tenla como app</span>
        <span className={s.bannerLead}>Tu suscripción a un toque, sin buscar el enlace.</span>
      </div>
      <button type="button" className={s.bannerCta} onClick={onOpen}>Instalar</button>
      <button type="button" className={s.bannerClose} onClick={onDismiss} aria-label="Ahora no">
        <CloseIcon size={16} />
      </button>
    </div>
  );
}

export function InstallButton({ onOpen }) {
  return (
    <button type="button" className={s.installButton} onClick={onOpen}>
      <PhoneIcon size={18} />
      <span>Instalar como app</span>
    </button>
  );
}

function Step({ n, icon, children }) {
  return (
    <li className={s.step}>
      <span className={s.stepNumber}>{n}</span>
      <span className={s.stepText}>{children}</span>
      <span className={s.stepIcon} aria-hidden="true">{icon}</span>
    </li>
  );
}

const BENEFITS = [
  { Icon: BoltIcon, text: 'Abre directo en tu suscripción, como cualquier app.' },
  { Icon: LockIcon, text: 'Tu sesión queda guardada: no vuelves a ingresar datos.' },
  { Icon: WifiOffIcon, text: 'Muestra lo último que viste aunque no tengas señal.' },
];

export function InstallSheet({ open, mode, device, company, onClose, onInstall }) {
  const [copied, setCopied] = React.useState(false);
  const sheetRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    setCopied(false);
    sheetRef.current?.focus(); // el foco entra al diálogo sin marcar ningún botón
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const name = company?.name || 'tu gimnasio';
  const url = `${window.location.origin}${window.location.pathname}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const chromeIntent = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;

  let body = null;
  if (mode === 'prompt') {
    body = (
      <>
        <ul className={s.benefits}>
          {BENEFITS.map(({ Icon, text }) => (
            <li key={text} className={s.benefit}>
              <span className={s.benefitIcon}><Icon size={18} /></span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <button type="button" className={s.primary} onClick={onInstall}>
          <DownloadIcon size={20} />
          <span>Instalar ahora</span>
        </button>
      </>
    );
  } else if (mode === 'ios') {
    body = (
      <>
        <ol className={s.steps}>
          {device.iosBrowser === 'chrome' ? (
            <Step n="1" icon={<ShareIosIcon size={20} />}>Toca <strong>Compartir</strong> junto a la barra de direcciones.</Step>
          ) : (
            <Step n="1" icon={<ShareIosIcon size={20} />}>
              Toca <strong>Compartir</strong> en la barra de Safari. Si no lo ves, toca primero <strong>•••</strong>.
            </Step>
          )}
          <Step n="2" icon={<AddSquareIcon size={20} />}>Desliza y elige <strong>Agregar a inicio</strong>.</Step>
          <Step n="3" icon={<CheckIcon size={18} />}>Deja activo <strong>Abrir como app web</strong> y toca <strong>Agregar</strong>.</Step>
        </ol>
        <p className={s.note}>Listo: {name} queda en tu pantalla de inicio y abre sin barra del navegador.</p>
        {device.iosBrowser === 'other' && (
          <p className={s.note}>Si tu navegador no muestra «Agregar a inicio», abre este enlace en Safari.</p>
        )}
      </>
    );
  } else if (mode === 'android') {
    body = (
      <>
        <ol className={s.steps}>
          <Step n="1" icon={<DotsVerticalIcon size={20} />}>Toca el menú <strong>⋮</strong> del navegador.</Step>
          <Step n="2" icon={<AddSquareIcon size={20} />}>Elige <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.</Step>
          <Step n="3" icon={<CheckIcon size={18} />}>Confirma con <strong>Instalar</strong>.</Step>
        </ol>
        <p className={s.note}>La encontrarás con tus apps, con el ícono de {name}.</p>
      </>
    );
  } else if (mode === 'in-app') {
    body = (
      <>
        <p className={s.lead}>
          Estás viendo el portal dentro de otra app (WhatsApp, Instagram…) y desde ahí no se puede
          instalar. Ábrelo en {device.ios ? 'Safari' : 'Chrome'} y vuelve a tocar «Instalar».
        </p>
        {device.android && (
          <a className={s.primary} href={chromeIntent}>
            <span>Abrir en Chrome</span>
          </a>
        )}
        <button type="button" className={s.secondary} onClick={copy}>
          <LinkIcon size={18} />
          <span>{copied ? 'Enlace copiado' : 'Copiar enlace'}</span>
        </button>
        {device.ios && <p className={s.note}>Luego pégalo en Safari y sigue los pasos para agregarla a tu inicio.</p>}
      </>
    );
  }

  return (
    <div className={s.overlay} onClick={onClose} role="presentation">
      <section
        ref={sheetRef}
        tabIndex={-1}
        className={s.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-install-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={s.grabber} aria-hidden="true" />
        <div className={s.sheetHead}>
          <AppMark company={company} />
          <div className={s.sheetTitle}>
            <h2 id="portal-install-title" className={s.h2}>Instala {name}</h2>
            <span className={s.sheetLead}>Tu suscripción y tus medidas, siempre a la mano.</span>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Cerrar">
            <CloseIcon size={18} />
          </button>
        </div>
        {body}
      </section>
    </div>
  );
}

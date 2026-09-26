import React from 'react';
import { Spinner } from '../../../components';
import { api } from '../../../lib/api.js';
import { GymPortalLogin } from './GymPortalLogin.jsx';
import { PiddetGymLogo } from './PiddetGymLogo.jsx';
import { ArrowRightIcon } from './icons.jsx';
import { HUB_NOTICES, portalUrl, savePending, savedGyms } from './portalStorage.js';
import page from './GymPortal.module.css';
import s from './GymHub.module.css';

// Entrada general de los gimnasios de la plataforma (piddet.com/gym). No es de ningún gimnasio:
// el socio escribe su celular, recibe el código y entra al suyo (si es de varios, elige). Abajo,
// los gimnasios aliados (cada uno lleva a su perfil público). Si el teléfono ya tiene sesión en un
// gimnasio, va directo a él. Es también a donde vuelve el portal al cerrar sesión o si la sesión
// ya no vale (`?aviso=` dice por qué).

const HUB_OPTIONS = { code_length: 6, birthdate_login: false };
const profileUrl = (username) => `/${encodeURIComponent(username)}`;

function readNotice() {
  return HUB_NOTICES[new URLSearchParams(window.location.search).get('aviso')] || '';
}
const initial = (name) => String(name || '?').trim().charAt(0).toUpperCase();

function GymMark({ gym, size = 'md' }) {
  const [failed, setFailed] = React.useState(false);
  const logo = gym.thumbnail_icon || gym.icon;
  return (
    <span className={[s.mark, s[`mark_${size}`]].join(' ')} aria-hidden="true">
      {logo && !failed ? <img src={logo} alt="" onError={() => setFailed(true)} /> : initial(gym.name)}
    </span>
  );
}

function Partners() {
  const [partners, setPartners] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    api.gymPlatformPartners()
      .then((list) => { if (alive && Array.isArray(list)) setPartners(list); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!partners.length) return null;
  return (
    <section className={s.partners} aria-labelledby="hub-partners-title">
      <h2 id="hub-partners-title" className={s.partnersTitle}>Nuestros aliados</h2>
      <ul className={s.chips}>
        {partners.map((gym) => (
          <li key={gym.username}>
            <a className={s.chip} href={profileUrl(gym.username)}>
              <GymMark gym={gym} size="sm" />
              <span className={s.chipName}>{gym.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chooser({ gyms, onOther }) {
  return (
    <div className={s.chooser}>
      <PiddetGymLogo size="md" />
      <div className={s.chooserIntro}>
        <h1 className={s.chooserTitle}>¿A cuál gimnasio entras?</h1>
        <p className={s.chooserLead}>Eres socio de más de uno. Elige y te llevamos directo.</p>
      </div>
      <ul className={s.gymList}>
        {gyms.map((gym) => (
          <li key={gym.username}>
            <a className={s.gymRow} href={portalUrl(gym.username)}>
              <GymMark gym={gym} />
              <span className={s.gymName}>{gym.name}</span>
              <ArrowRightIcon size={20} />
            </a>
          </li>
        ))}
      </ul>
      <button type="button" className={s.other} onClick={onOther}>Entrar con otro número</button>
    </div>
  );
}

export function GymHub() {
  const [saved] = React.useState(savedGyms);
  const [chooser, setChooser] = React.useState(() => (saved.length > 1 ? saved : null));
  const redirecting = saved.length === 1 && !chooser;
  const [notice] = React.useState(readNotice);

  // El aviso se lee una vez: la URL queda limpia para compartirla o recargar.
  React.useEffect(() => {
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  React.useEffect(() => {
    const previous = document.title;
    document.title = 'piddet gym · Tu gimnasio en tu bolsillo';
    return () => { document.title = previous; };
  }, []);

  // Ya tiene sesión en un solo gimnasio: directo a él, como abrir la app.
  React.useEffect(() => {
    if (redirecting) window.location.replace(portalUrl(saved[0].username));
  }, [redirecting, saved]);

  const verifyCode = async (phoneNumber, code) => {
    const { gyms = [] } = await api.gymPlatformVerifyCode(phoneNumber, code);
    gyms.forEach((gym) => savePending(gym.company.username, gym));
    if (gyms.length === 1) {
      window.location.assign(portalUrl(gyms[0].company.username));
      return;
    }
    setChooser(gyms.map((gym) => ({ ...gym.company })));
  };

  if (redirecting) {
    return (
      <div className={[page.page, page.glowLogin].join(' ')}>
        <div className={page.splash} aria-busy="true">
          <PiddetGymLogo size="md" />
          <Spinner size="md" label={`Abriendo ${saved[0].name}…`} />
        </div>
      </div>
    );
  }

  return (
    <div className={[page.page, page.glowLogin].join(' ')}>
      {chooser ? (
        <Chooser gyms={chooser} onOther={() => setChooser(null)} />
      ) : (
        <GymPortalLogin
          options={HUB_OPTIONS}
          onRequestCode={(phone) => api.gymPlatformRequestCode(phone)}
          onVerifyCode={verifyCode}
          notice={notice}
          header={(
            <div className={s.top}>
              <PiddetGymLogo size="md" />
            </div>
          )}
          footer={<Partners />}
        />
      )}
    </div>
  );
}

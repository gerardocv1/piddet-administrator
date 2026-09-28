import React from 'react';
import { Spinner } from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import {
  shareImage, applyMetaTags, applySeoTags, buildShareMeta, shareOrCopy,
} from '../public/shareMeta.js';
import { UnitCard } from '../public/Lodging/UnitCard.jsx';
import { PiddetGymLogo } from '../public/GymPortal/PiddetGymLogo.jsx';
import { companyBrandTheme } from '../../lib/brand/palettes.js';
import { whatsappHref } from '../public/whatsapp.js';
import { getStoreStatus, getWeekSchedule, googleMapsUrl, googleMapsEmbedUrl } from '../../lib/storeHours.js';
import s from './PublicCompany.module.css';

const initial = (name = '') => (name.trim()[0] || '?').toUpperCase();
const httpHref = (url = '') => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
const GYM_HUB_PATH = '/gym';
const SCHEMA_TYPES = {
  restaurant: 'Restaurant',
  gym: 'ExerciseGym',
  store: 'Store',
  lodging: 'LodgingBusiness',
};

// Miniatura del menú: su imagen si la tiene; si no (o si falla), un icono neutro.
function MenuThumb({ file }) {
  const [failed, setFailed] = React.useState(false);
  return (
    <span className={s.thumb}>
      {file && !failed
        ? <img src={file} alt="" loading="lazy" onError={() => setFailed(true)} />
        : <i className="fas fa-utensils" aria-hidden="true" />}
    </span>
  );
}

function CompanyLogo({ company }) {
  const [failed, setFailed] = React.useState(false);
  if (!company.icon || failed) return initial(company.name);
  return <img src={company.icon} alt="" onError={() => setFailed(true)} />;
}

// Contacto de empresa que sí se mantiene en la portada (lo demás —dirección/teléfono/horario—
// se muestra por tienda). Correo y sitio web son a nivel de compañía.
const CONTACT_FIELDS = [
  { key: 'email', icon: 'fas fa-envelope', href: (v) => `mailto:${v}` },
  { key: 'website', icon: 'fas fa-globe', href: httpHref },
];

const storePhone = (store) => `${store.phone_code || ''}${store.phone_number || ''}`;
const telHref = (phone) => {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
};

// Abierto / cerrado como un punto y una línea de texto (sin pastilla de color): lo que importa
// es a qué hora cierra o abre.
function OpenStatus({ status }) {
  return (
    <span className={[s.status, status.open ? s.statusOpen : ''].filter(Boolean).join(' ')}>
      <span className={s.statusDot} aria-hidden="true" />
      {[status.label, status.detail].filter(Boolean).join(' · ')}
    </span>
  );
}

// Tarjeta de una sede, colapsable como la del portal del gimnasio. Cerrada es una fila: nombre,
// dirección y si está abierta ahora. Abierta suma el mapa, el horario de la semana y las acciones
// (cómo llegar, llamar, escribir por WhatsApp).
function StoreCard({ store, companyName, companyPhone }) {
  const [open, setOpen] = React.useState(false);
  const bodyId = React.useId();
  const status = React.useMemo(() => getStoreStatus(store.schedules || [], store.store_status_id), [store]);
  const week = React.useMemo(() => getWeekSchedule(store.schedules || []), [store]);
  const hasSchedule = (store.schedules || []).length > 0;
  const mapsUrl = googleMapsUrl(store);
  const embedUrl = googleMapsEmbedUrl(store);
  // Si la tienda no tiene su propio número, se escribe al de la compañía.
  const about = store.name || companyName;
  const whatsapp = whatsappHref(
    storePhone(store) || companyPhone,
    about ? `Hola, quiero información sobre ${about}.` : 'Hola, quiero información.',
  );
  const phone = telHref(storePhone(store));
  const showMap = (store.latitude != null && store.longitude != null) || !!store.address;

  return (
    <article className={[s.card, s.store].join(' ')}>
      <button type="button" className={s.storeHead} onClick={() => setOpen((v) => !v)}
        aria-expanded={open} aria-controls={bodyId}>
        <span className={s.storeIcon}><i className="fas fa-location-dot" aria-hidden="true" /></span>
        <span className={s.storeText}>
          <span className={s.storeName}>{store.name}</span>
          {store.address && <span className={s.storeAddr}>{store.address}</span>}
          {hasSchedule && <OpenStatus status={status} />}
        </span>
        <i className={`fas fa-chevron-down ${s.chevron} ${open ? s.chevronUp : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div id={bodyId} className={s.storeBody}>
          {showMap && (
            <a className={s.storeMap} href={mapsUrl} target="_blank" rel="noopener noreferrer"
              title="Abrir en Google Maps">
              <iframe title={`Mapa de ${store.name}`} src={embedUrl} loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" />
              <span className={s.storeMapVeil} />
            </a>
          )}
          {hasSchedule && (
            <ul className={s.week}>
              {week.map((d) => (
                <li key={d.dayId} className={[s.weekRow, d.isToday ? s.weekToday : ''].filter(Boolean).join(' ')}>
                  <span>{d.name}{d.isToday ? ' · hoy' : ''}</span>
                  <span className={d.closed ? s.weekClosed : ''}>{d.text}</span>
                </li>
              ))}
            </ul>
          )}
          <div className={s.storeActions}>
            <a className={[s.action, s.actionPrimary].join(' ')} href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <i className="fas fa-diamond-turn-right" aria-hidden="true" /> Cómo llegar
            </a>
            {phone && (
              <a className={s.action} href={phone}>
                <i className="fas fa-phone" aria-hidden="true" /> Llamar
              </a>
            )}
            {whatsapp && (
              <a className={s.action} href={whatsapp} target="_blank" rel="noopener noreferrer">
                <i className="fab fa-whatsapp" aria-hidden="true" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

// Portada pública de la compañía (sin sesión): identidad mínima (logo + nombre) y, debajo, un
// avance de su hospedaje, sus menús públicos, sus tiendas/ubicaciones con horario y mapa, y un
// contacto compacto. El orden va de lo que se reserva/consume a dónde encontrarlo.
export function PublicCompany({ companyUsername }) {
  const res = useResource(
    React.useCallback(() => api.publicCompany(companyUsername), [companyUsername]),
    null,
    [companyUsername],
  );

  const data = res.data;
  const company = data?.company || null;
  const menus = data?.menus || [];
  const stores = data?.stores || [];
  // Hospedaje: solo llega si la compañía tiene la funcionalidad de reservas activa.
  const units = data?.rentable_units || [];
  const unitsCount = data?.rentable_units_count || 0;

  const shareInfo = React.useMemo(() => {
    const title = company?.name ? `${company.name} | Piddet` : 'Piddet';
    const description = company?.description
      || (company?.name
        ? `Conoce ${company.name}${company.company_type_name ? `, ${company.company_type_name.toLowerCase()}` : ''} en Piddet.`
        : 'Descubre negocios en Piddet.');
    return {
      title,
      description,
      image: shareImage(company),
      url: typeof window !== 'undefined'
        ? `${window.location.origin}/${encodeURIComponent(companyUsername)}`
        : '',
    };
  }, [company, companyUsername]);

  React.useEffect(() => {
    if (!data) return undefined;
    const prevTitle = document.title;
    document.title = shareInfo.title;
    const cleanupMeta = applyMetaTags(buildShareMeta(shareInfo));
    const firstStore = stores[0];
    const cleanupSeo = applySeoTags({
      canonical: shareInfo.url,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': SCHEMA_TYPES[company.company_type_key] || 'LocalBusiness',
        '@id': `${shareInfo.url}#business`,
        name: company.name,
        description: shareInfo.description,
        url: shareInfo.url,
        image: shareInfo.image,
        email: company.email || undefined,
        telephone: company.phone || storePhone(firstStore || {}) || undefined,
        address: firstStore?.address
          ? { '@type': 'PostalAddress', streetAddress: firstStore.address }
          : undefined,
        sameAs: company.website ? [httpHref(company.website)] : undefined,
      },
    });
    return () => {
      document.title = prevTitle;
      cleanupMeta();
      cleanupSeo();
    };
  }, [company, data, shareInfo, stores]);

  React.useEffect(() => {
    if (!res.error) return undefined;
    const canonical = `${window.location.origin}/${encodeURIComponent(companyUsername)}`;
    return applySeoTags({ canonical, robots: 'noindex, follow' });
  }, [companyUsername, res.error]);

  const [shareMsg, setShareMsg] = React.useState('');
  const share = React.useCallback(async () => {
    try {
      if (await shareOrCopy(shareInfo)) {
        setShareMsg('Enlace copiado');
        setTimeout(() => setShareMsg(''), 2000);
      }
    } catch { /* sin portapapeles */ }
  }, [shareInfo]);

  if (res.loading) {
    return <div className={s.screen}><div className={s.pageState}><Spinner center label="Cargando empresa…" /></div></div>;
  }
  if (res.error || !company) {
    return (
      <div className={s.screen}>
        <div className={s.pageState}>
          <div className={s.state}><i className="fas fa-triangle-exclamation" /> No encontramos esta empresa.</div>
          <a className={s.exploreLink} href="/">Volver al directorio</a>
        </div>
      </div>
    );
  }

  const contacts = CONTACT_FIELDS.filter((f) => company[f.key]);
  const firstStore = stores[0] || null;
  // Contacto de la compañía: si no tiene teléfono propio, se usa el de su primera tienda.
  const companyWhatsapp = whatsappHref(
    company.phone || storePhone(firstStore || {}),
    `Hola, quiero información sobre ${company.name}.`,
  );
  const companyPhone = telHref(company.phone || storePhone(firstStore || {}));
  // El estado del encabezado es el de la primera sede con horario.
  const scheduled = stores.find((st) => (st.schedules || []).length > 0);
  const headStatus = scheduled ? getStoreStatus(scheduled.schedules, scheduled.store_status_id) : null;
  const meta = [company.company_type_name, company.city].filter(Boolean).join(' · ');
  const isGym = company.company_type_key === 'gym';
  // Los menús son la sección de los restaurantes: allí se muestra aunque esté vacía (dice que
  // aún no hay); en los demás tipos, solo si tienen alguno publicado.
  const showMenus = menus.length > 0 || company.company_type_key === 'restaurant';
  const quick = [
    companyWhatsapp && { key: 'wa', icon: 'fab fa-whatsapp', label: 'WhatsApp', href: companyWhatsapp, external: true },
    firstStore && { key: 'go', icon: 'fas fa-diamond-turn-right', label: 'Cómo llegar', href: googleMapsUrl(firstStore), external: true },
    companyPhone && { key: 'call', icon: 'fas fa-phone', label: 'Llamar', href: companyPhone },
  ].filter(Boolean);

  return (
    // Las variables de marca son la única excepción de estilo inline: companyBrandTheme devuelve
    // custom properties, no reglas visuales sueltas. Fuera del perfil todo es neutro; dentro, el
    // color de la compañía va solo en la franja, el logo, la acción principal y los iconos.
    <div className={s.screen} style={companyBrandTheme(company)}>
      <header className={s.topbar}>
        <a className={s.back} href="/"><i className="fas fa-chevron-left" aria-hidden="true" /> Explorar</a>
        <button type="button" className={s.iconBtn} onClick={share} aria-label="Compartir">
          <i className="fas fa-arrow-up-from-bracket" aria-hidden="true" />
        </button>
      </header>

      <main className={s.container}>
        <section className={[s.card, s.head].join(' ')}>
          <div className={s.band} aria-hidden="true" />
          <div className={s.headBody}>
            <span className={s.logo}><CompanyLogo company={company} /></span>
            <div>
              <h1 className={s.name}>{company.name}</h1>
              {meta && <p className={s.meta}>{meta}</p>}
            </div>
            {(company.description || company.legal_name) && (
              <p className={s.tagline}>{company.description || company.legal_name}</p>
            )}
            {headStatus && <OpenStatus status={headStatus} />}
          </div>
        </section>

        {quick.length > 0 && (
          <nav className={s.quick} aria-label="Contacto rápido">
            {quick.map((q, i) => (
              <a key={q.key} className={[s.quickBtn, i === 0 ? s.quickPrimary : ''].filter(Boolean).join(' ')}
                href={q.href} target={q.external ? '_blank' : undefined} rel={q.external ? 'noopener noreferrer' : undefined}>
                <i className={q.icon} aria-hidden="true" /> {q.label}
              </a>
            ))}
          </nav>
        )}

        {/* Gimnasios: el socio consulta su suscripción en la entrada general (piddet.com/gym),
            que es de todos los gimnasios; con su celular lo lleva al portal de este. Es la única
            pieza oscura: pertenece a piddet gym, no a la compañía. */}
        {isGym && (
          <section className={s.gymMember} aria-labelledby="gym-member-title">
            <span className={s.gymMemberGlow} aria-hidden="true" />
            <PiddetGymLogo size="sm" />
            <div className={s.gymMemberCopy}>
              <h2 id="gym-member-title" className={s.gymMemberTitle}>¿Ya eres socio de {company.name}?</h2>
              <p className={s.gymMemberText}>Mira tu progreso, tus medidas y tu plan desde el celular.</p>
            </div>
            <a className={s.gymMemberCta} href={GYM_HUB_PATH}>
              Ver mi suscripción <i className="fas fa-arrow-right" aria-hidden="true" />
            </a>
          </section>
        )}

        {units.length > 0 && (
          <section className={s.section} aria-labelledby="lodging-title">
            <div className={s.sectionHead}>
              <h2 id="lodging-title" className={s.sectionTitle}>Hospedaje</h2>
              <a className={s.sectionLink} href={`/${encodeURIComponent(companyUsername)}/hospedaje`}>
                {unitsCount > units.length ? `Ver los ${unitsCount}` : 'Ver todo'}
              </a>
            </div>
            <div className={s.unitList}>
              {units.map((u) => (
                <UnitCard key={u.id} unit={u} companyUsername={companyUsername} compact />
              ))}
            </div>
          </section>
        )}

        {showMenus && (
          <section className={s.section} aria-labelledby="menus-title">
            <div className={s.sectionHead}>
              <h2 id="menus-title" className={s.sectionTitle}>{menus.length === 1 ? 'Menú' : 'Menús'}</h2>
            </div>
            {menus.length === 0 ? (
              <div className={[s.card, s.empty].join(' ')}>Aún no hay menús publicados.</div>
            ) : (
              <ul className={[s.card, s.rows].join(' ')}>
                {menus.map((m) => (
                  <li key={m.id}>
                    <a className={s.row} href={`/${encodeURIComponent(companyUsername)}/m/${encodeURIComponent(m.username)}`}>
                      <MenuThumb file={m.file} />
                      <span className={s.rowText}>
                        <span className={s.rowTitle}>{m.name}</span>
                        {m.description && <span className={s.rowSub}>{m.description}</span>}
                      </span>
                      <i className={`fas fa-chevron-right ${s.chevron}`} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {stores.length > 0 && (
          <section className={s.section} aria-labelledby="stores-title">
            <div className={s.sectionHead}>
              <h2 id="stores-title" className={s.sectionTitle}>{stores.length === 1 ? 'Sede' : `Sedes (${stores.length})`}</h2>
            </div>
            <div className={s.storeList}>
              {stores.map((st) => (
                <StoreCard key={st.id} store={st} companyName={company.name} companyPhone={company.phone} />
              ))}
            </div>
          </section>
        )}

        {contacts.length > 0 && (
          <section className={s.section} aria-labelledby="contact-title">
            <div className={s.sectionHead}>
              <h2 id="contact-title" className={s.sectionTitle}>Contacto</h2>
            </div>
            <ul className={[s.card, s.rows].join(' ')}>
              {contacts.map((f) => (
                <li key={f.key}>
                  <a className={s.row} href={f.href(company[f.key])}
                    target={f.key === 'website' ? '_blank' : undefined} rel="noopener noreferrer">
                    <i className={`${f.icon} ${s.contactIcon}`} aria-hidden="true" />
                    <span className={s.rowText}><span className={s.rowTitle}>{company[f.key]}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className={s.footer}>
          <span>Negocios que se mueven con</span> <strong>piddet</strong>
        </footer>
      </main>

      {/* Barra de abajo del perfil: compartir y, como acción principal, escribir por WhatsApp
          (es por donde la gente pregunta y reserva). Sin WhatsApp, compartir ocupa todo. */}
      <nav className={s.actionBar} aria-label="Acciones">
        <div className={s.actionBarInner}>
          <button type="button" className={[s.barBtn, companyWhatsapp && !shareMsg ? s.barBtnIcon : ''].filter(Boolean).join(' ')}
            onClick={share} aria-label="Compartir">
            <i className="fas fa-arrow-up-from-bracket" aria-hidden="true" />
            {(!companyWhatsapp || shareMsg) && <span>{shareMsg || 'Compartir'}</span>}
          </button>
          {companyWhatsapp && (
            <a className={[s.barBtn, s.barBtnPrimary].join(' ')} href={companyWhatsapp} target="_blank" rel="noopener noreferrer">
              <i className="fab fa-whatsapp" aria-hidden="true" /> Escríbenos por WhatsApp
            </a>
          )}
        </div>
      </nav>
    </div>
  );
}

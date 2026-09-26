import React from 'react';
import { Spinner } from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import {
  shareImage, applyMetaTags, applySeoTags, buildShareMeta, shareOrCopy,
} from '../public/shareMeta.js';
import { PublicBottomBar } from '../public/PublicBottomBar.jsx';
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

// Tarjeta de una tienda: mini-mapa → Google Maps, estado con el horario como dato principal
// (el visitante quiere saber a qué hora abre, no solo que está cerrado), horario semanal
// desplegable y acciones (cómo llegar / escribir por WhatsApp).
function StoreCard({ store, companyName, companyPhone }) {
  const [open, setOpen] = React.useState(false);
  const status = React.useMemo(() => getStoreStatus(store.schedules || [], store.store_status_id), [store]);
  const week = React.useMemo(() => getWeekSchedule(store.schedules || []), [store]);
  const mapsUrl = googleMapsUrl(store);
  const embedUrl = googleMapsEmbedUrl(store);
  // Si la tienda no tiene su propio número, se escribe al de la compañía.
  const about = store.name || companyName;
  const whatsapp = whatsappHref(
    storePhone(store) || companyPhone,
    about ? `Hola, quiero información sobre ${about}.` : 'Hola, quiero información.',
  );
  const hasLocation = store.latitude != null && store.longitude != null;
  const showMap = hasLocation || !!store.address;

  return (
    <article className={s.storeCard}>
      <div className={s.storeBody}>
        <div className={s.storeTop}>
          {showMap && (
            <a className={s.storeMap} href={mapsUrl} target="_blank" rel="noopener noreferrer"
              title="Abrir en Google Maps">
              <iframe
                title={`Mapa de ${store.name}`}
                src={embedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <span className={s.storeMapVeil} />
            </a>
          )}
          <div className={s.storeHead}>
            <h3 className={s.storeName}>{store.name}</h3>
            {store.address && <p className={s.storeAddr}>{store.address}</p>}
          </div>
        </div>

        {/* El horario manda: el estado va como pastilla pequeña y el próximo cambio en grande. */}
        <button type="button" className={s.storeHours} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className={[s.badge, status.open ? s.badgeOpen : s.badgeClosed].join(' ')}>
            <span className={s.badgeDot} />{status.label}
          </span>
          <span className={s.storeHoursText}>{status.detail || 'Ver horario'}</span>
          <i className={`fas fa-chevron-${open ? 'up' : 'down'} ${s.storeHoursChevron}`} />
        </button>

        {open && (
          <ul className={s.week}>
            {week.map((d) => (
              <li key={d.dayId} className={[s.weekRow, d.isToday ? s.weekToday : ''].filter(Boolean).join(' ')}>
                <span className={s.weekDay}>
                  {d.name}
                  {d.isToday && <span className={s.todayTag}>Hoy</span>}
                </span>
                <span className={[s.weekHours, d.closed ? s.weekClosed : ''].filter(Boolean).join(' ')}>{d.text}</span>
              </li>
            ))}
          </ul>
        )}

        <div className={s.storeActions}>
          <a className={`${s.btn} ${s.btnPrimary}`} href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <i className="fas fa-diamond-turn-right" /> Cómo llegar
          </a>
          {whatsapp && (
            <a className={`${s.btn} ${s.btnWhatsapp}`} href={whatsapp} target="_blank" rel="noopener noreferrer">
              <i className="fab fa-whatsapp" /> Escribir
            </a>
          )}
        </div>
      </div>
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
  const storesCountText = stores.length === 1 ? '1 ubicación' : `${stores.length} ubicaciones`;
  // Contacto de la compañía: si no tiene teléfono propio, se usa el de su primera tienda.
  const companyWhatsapp = whatsappHref(
    company.phone || storePhone(stores[0] || {}),
    `Hola, quiero información sobre ${company.name}.`,
  );

  return (
    // Las variables de marca son la única excepción de estilo inline: companyBrandTheme devuelve
    // custom properties, no reglas visuales sueltas.
    <div className={s.screen} style={companyBrandTheme(company)}>
      <header className={s.topbar}>
        <a className={s.wordmark} href="/" aria-label="Piddet, inicio">piddet</a>
        <a className={s.exploreLink} href="/">
          <i className="fas fa-compass" aria-hidden="true" /> <span>Explorar negocios</span>
        </a>
      </header>

      <main className={s.container}>
        <section className={s.hero}>
          <span className={s.heroOrb} aria-hidden="true" />
          <div className={s.heroIdentity}>
            <span className={[s.logo, company.icon ? s.logoImg : ''].filter(Boolean).join(' ')}>
              <CompanyLogo company={company} />
            </span>
            <div className={s.heroCopy}>
              <p className={s.eyebrow}>{company.company_type_name || 'Negocio en Piddet'}</p>
              <h1 className={s.name}>{company.name}</h1>
              {(company.description || company.legal_name) && (
                <p className={s.tagline}>{company.description || company.legal_name}</p>
              )}
            </div>
          </div>
          <div className={s.heroFacts} aria-label="Información disponible">
            {menus.length > 0 && (
              <span><i className="fas fa-utensils" aria-hidden="true" />{menus.length} {menus.length === 1 ? 'menú' : 'menús'}</span>
            )}
            {stores.length > 0 && (
              <span><i className="fas fa-location-dot" aria-hidden="true" />{storesCountText}</span>
            )}
            {unitsCount > 0 && (
              <span><i className="fas fa-bed" aria-hidden="true" />{unitsCount} {unitsCount === 1 ? 'hospedaje' : 'hospedajes'}</span>
            )}
          </div>
        </section>

        <div className={s.contentGrid}>
          <div className={s.primaryColumn}>
            {/* Gimnasios: el socio consulta su suscripción en la entrada general (piddet.com/gym),
                que es de todos los gimnasios; con su celular lo lleva al portal de este. */}
            {company.company_type_key === 'gym' && (
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
              <section className={s.panel} aria-labelledby="lodging-title">
                <div className={s.sectionHead}>
                  <div className={s.sectionTitleGroup}>
                    <span className={s.sectionIcon}><i className="fas fa-bed" aria-hidden="true" /></span>
                    <div>
                      <p className={s.sectionKicker}>Reserva tu estadía</p>
                      <h2 id="lodging-title" className={s.sectionTitle}>Hospedaje</h2>
                    </div>
                  </div>
                  <a className={s.sectionLink} href={`/${encodeURIComponent(companyUsername)}/hospedaje`}>
                    {unitsCount > units.length ? `Ver las ${unitsCount}` : 'Ver todo'}
                    <i className="fas fa-chevron-right" aria-hidden="true" />
                  </a>
                </div>
                <div className={s.unitList}>
                  {units.map((u) => (
                    <UnitCard key={u.id} unit={u} companyUsername={companyUsername} compact />
                  ))}
                </div>
              </section>
            )}

            <section className={s.panel} aria-labelledby="menus-title">
              <div className={s.sectionHead}>
                <div className={s.sectionTitleGroup}>
                  <span className={s.sectionIcon}><i className="fas fa-utensils" aria-hidden="true" /></span>
                  <div>
                    <p className={s.sectionKicker}>Conoce lo que ofrecemos</p>
                    <h2 id="menus-title" className={s.sectionTitle}>Nuestros menús</h2>
                  </div>
                </div>
              </div>
              {menus.length === 0 ? (
                <div className={s.state}><i className="fas fa-utensils" /> Aún no hay menús publicados.</div>
              ) : (
                <ul className={s.menuList}>
                  {menus.map((m) => (
                    <li key={m.id}>
                      <a className={s.menuCard} href={`/${encodeURIComponent(companyUsername)}/m/${encodeURIComponent(m.username)}`}>
                        {m.file && <img className={s.menuThumb} src={m.file} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                        <span className={s.menuInfo}>
                          <span className={s.menuName}>{m.name}</span>
                          {m.description && <span className={s.menuDesc}>{m.description}</span>}
                        </span>
                        <i className={`fas fa-arrow-right ${s.menuArrow}`} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {(stores.length > 0 || contacts.length > 0) && (
            <aside className={s.sideColumn}>
              {stores.length > 0 && (
                <section className={s.panel} aria-labelledby="stores-title">
                  <div className={s.sectionHead}>
                    <div className={s.sectionTitleGroup}>
                      <span className={s.sectionIcon}><i className="fas fa-location-dot" aria-hidden="true" /></span>
                      <div>
                        <p className={s.sectionKicker}>{storesCountText}</p>
                        <h2 id="stores-title" className={s.sectionTitle}>Dónde estamos</h2>
                      </div>
                    </div>
                  </div>
                  <div className={s.storeList}>
                    {stores.map((st) => (
                      <StoreCard key={st.id} store={st} companyName={company.name} companyPhone={company.phone} />
                    ))}
                  </div>
                </section>
              )}

              {contacts.length > 0 && (
                <section className={s.panel} aria-labelledby="contact-title">
                  <div className={s.sectionHead}>
                    <div className={s.sectionTitleGroup}>
                      <span className={s.sectionIcon}><i className="fas fa-address-card" aria-hidden="true" /></span>
                      <h2 id="contact-title" className={s.sectionTitle}>Contacto</h2>
                    </div>
                  </div>
                  <ul className={s.contact}>
                    {contacts.map((f) => (
                      <li key={f.key} className={s.contactItem}>
                        <span className={s.contactIco}><i className={f.icon} aria-hidden="true" /></span>
                        <a href={f.href(company[f.key])} target={f.key === 'website' ? '_blank' : undefined} rel="noopener noreferrer">{company[f.key]}</a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          )}
        </div>

        <footer className={s.footer}>
          <span>Negocios que se mueven con</span> <strong>piddet</strong>
        </footer>
      </main>

      {/* Escribir por WhatsApp es la acción principal de la portada: es el canal por el que la
          gente pregunta y reserva. Compartir queda como acción secundaria. */}
      <PublicBottomBar items={[
        { key: 'share', icon: 'fas fa-share-nodes', label: shareMsg || 'Compartir', onClick: share },
        ...(companyWhatsapp ? [{
          key: 'whatsapp', icon: 'fab fa-whatsapp', label: 'Escríbenos', primary: true,
          href: companyWhatsapp, target: '_blank',
        }] : []),
      ]} />
    </div>
  );
}

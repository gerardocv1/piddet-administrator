import React from 'react';
import { Spinner } from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { shareImage, applyMetaTags, buildShareMeta, shareOrCopy } from '../public/shareMeta.js';
import { PublicBottomBar } from '../public/PublicBottomBar.jsx';
import { UnitCard } from '../public/Lodging/UnitCard.jsx';
import { companyBrandTheme } from '../../lib/brand/palettes.js';
import { whatsappHref } from '../public/whatsapp.js';
import { getStoreStatus, getWeekSchedule, googleMapsUrl, googleMapsEmbedUrl } from '../../lib/storeHours.js';
import s from './PublicCompany.module.css';

const initial = (name = '') => (name.trim()[0] || '?').toUpperCase();
const httpHref = (url = '') => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

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
    const title = company?.name || 'piddet';
    const description = company?.description
      || (company?.name ? `Conoce los menús de ${company.name}.` : 'Mira nuestros menús.');
    return {
      title,
      description,
      image: shareImage(company),
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
  }, [company]);

  React.useEffect(() => {
    if (!data) return undefined;
    const prevTitle = document.title;
    document.title = shareInfo.title;
    const created = applyMetaTags(buildShareMeta(shareInfo));
    return () => { document.title = prevTitle; created.forEach((el) => el.remove()); };
  }, [data, shareInfo]);

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
    return <div className={s.screen}><Spinner center label="Cargando empresa…" /></div>;
  }
  if (res.error || !company) {
    return (
      <div className={s.screen}>
        <div className={s.state}><i className="fas fa-triangle-exclamation" /> No encontramos esta empresa.</div>
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
    // Los colores del perfil de la compañía redefinen la escala de --color-primary para toda la
    // página: sin ellos, la portada llevaría el naranja de piddet en botones, enlaces y realces.
    <div className={s.screen} style={companyBrandTheme(company)}>
      <div className={s.container}>
        <header className={s.hero}>
          <span className={[s.logo, company.icon ? s.logoImg : ''].filter(Boolean).join(' ')}>
            {company.icon
              ? <img src={company.icon} alt={company.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              : initial(company.name)}
          </span>
          <h1 className={s.name}>{company.name}</h1>
          {(company.description || company.legal_name) && (
            <p className={s.tagline}>{company.description || company.legal_name}</p>
          )}
        </header>

        {units.length > 0 && (
          <section>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>Hospedaje</h2>
              <a className={s.sectionLink} href={`/${encodeURIComponent(companyUsername)}/hospedaje`}>
                {unitsCount > units.length ? `Ver las ${unitsCount}` : 'Ver todo'}
                <i className="fas fa-chevron-right" />
              </a>
            </div>
            <div className={s.unitList}>
              {units.map((u) => (
                <UnitCard key={u.id} unit={u} companyUsername={companyUsername} compact />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className={s.sectionTitle}>Nuestros menús</h2>
          {menus.length === 0 ? (
            <div className={s.state}><i className="fas fa-utensils" /> Aún no hay menús publicados.</div>
          ) : (
            <ul className={s.menuList}>
              {menus.map((m) => (
                <li key={m.id}>
                  <a className={s.menuCard} href={`/${encodeURIComponent(companyUsername)}/m/${encodeURIComponent(m.username)}`}>
                    {m.file && <img className={s.menuThumb} src={m.file} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                    <span className={s.menuInfo}>
                      <span className={s.menuName}>{m.name}</span>
                      {m.description && <span className={s.menuDesc}>{m.description}</span>}
                    </span>
                    <i className={`fas fa-chevron-right ${s.menuArrow}`} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {stores.length > 0 && (
          <section>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>Dónde estamos</h2>
              <span className={s.sectionMeta}>{storesCountText}</span>
            </div>
            <div className={s.storeList}>
              {stores.map((st) => (
                <StoreCard key={st.id} store={st} companyName={company.name} companyPhone={company.phone} />
              ))}
            </div>
          </section>
        )}

        {contacts.length > 0 && (
          <ul className={s.contact}>
            {contacts.map((f) => (
              <li key={f.key} className={s.contactItem}>
                <span className={s.contactIco}><i className={f.icon} /></span>
                <a href={f.href(company[f.key])} target={f.key === 'website' ? '_blank' : undefined} rel="noopener noreferrer">{company[f.key]}</a>
              </li>
            ))}
          </ul>
        )}

        <footer className={s.footer}>
          <span>Hecho con</span> <strong>piddet</strong>
        </footer>
      </div>

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

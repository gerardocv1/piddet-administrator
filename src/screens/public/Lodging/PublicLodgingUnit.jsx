import React from 'react';
import { Spinner } from '../../../components';
import { api } from '../../../lib/api.js';
import { useResource } from '../../../lib/useResource.js';
import { reservationMoney } from '../../../lib/reservationLabels.js';
import { shareImage, applyMetaTags, buildShareMeta, shareOrCopy } from '../shareMeta.js';
import { PublicBottomBar } from '../PublicBottomBar.jsx';
import { capacityText } from './UnitCard.jsx';
import { companyBrandTheme } from '../../../lib/brand/palettes.js';
import { whatsappHref } from '../whatsapp.js';
import { PhotoViewer } from './PhotoViewer.jsx';
import { AvailabilityModal } from './AvailabilityModal.jsx';
import s from './PublicLodgingUnit.module.css';

const AUTOPLAY_MS = 5000;

// Carrusel táctil de fotos (scroll con snap + contador) que avanza solo cada 5 s. Recibe
// [{ url, thumbnail_url }]. Al tocar una foto se abre el visor a pantalla completa.
function PhotoCarousel({ files, alt, paused, onOpen }) {
  const trackRef = React.useRef(null);
  const [index, setIndex] = React.useState(0);
  // El avance automático se detiene en cuanto el visitante toma el control (desliza o pasa el
  // cursor): a partir de ahí manda él, no el carrusel.
  const [taken, setTaken] = React.useState(false);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const count = files.length;
  const stop = paused || taken || count < 2;

  React.useEffect(() => {
    if (stop) return undefined;
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el || !el.clientWidth) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [stop, count]);

  if (count === 0) {
    return <div className={s.carouselEmpty}><i className="fas fa-bed" /></div>;
  }

  return (
    <div className={s.carousel}
      onPointerDown={() => setTaken(true)}
      onMouseEnter={() => setTaken(true)}>
      <div className={s.carouselTrack} ref={trackRef} onScroll={onScroll}>
        {files.map((f, i) => (
          <img key={f.url} src={f.url} alt={`${alt} · foto ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'}
            onClick={() => onOpen(i)} />
        ))}
      </div>
      {count > 1 && (
        <>
          {/* El icono avisa de que la foto se amplía al tocarla (en móvil no hay cursor que lo diga). */}
          <span className={s.carouselCount}>
            <i className="fas fa-up-right-and-down-left-from-center" /> {index + 1} / {count}
          </span>
          <div className={s.carouselDots}>
            {files.map((f, i) => (
              <span key={f.url} className={[s.dot, i === index ? s.dotActive : ''].filter(Boolean).join(' ')} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Un espacio de la unidad (habitación, sala, minibar…) con su franja de fotos.
function SpaceBlock({ space, onOpen }) {
  const files = (space.files || []).filter((f) => f.url);
  return (
    <div className={s.space}>
      <div className={s.spaceHead}>
        <span className={s.spaceIco}><i className="fas fa-door-open" /></span>
        <div>
          <h3 className={s.spaceName}>{space.name}</h3>
          {space.description && <p className={s.spaceDesc}>{space.description}</p>}
        </div>
      </div>
      {files.length > 0 && (
        <div className={s.spacePhotos}>
          {/* Enlace real a la foto: si algo falla con el visor, sigue abriéndose en otra pestaña. */}
          {files.map((f, i) => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" title="Ver foto"
              onClick={(e) => { e.preventDefault(); onOpen(files, i, space.name); }}>
              <img src={f.thumbnail_url || f.url} alt={space.name} loading="lazy" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// Detalle público de una unidad de hospedaje (sin sesión): /{compañía}/hospedaje/{unitId}. Fotos,
// tarifa, capacidad, horarios, descripción y espacios; la reserva se concreta por WhatsApp.
export function PublicLodgingUnit({ companyUsername, unitId }) {
  const res = useResource(
    React.useCallback(() => api.publicRentableUnit(companyUsername, unitId), [companyUsername, unitId]),
    null,
    [companyUsername, unitId],
  );

  // Visor a pantalla completa: { files, index, alt }. Lo abren tanto la galería principal como
  // las fotos de cada espacio, cada una con su propio conjunto de fotos.
  const [viewer, setViewer] = React.useState(null);
  const openViewer = React.useCallback((files, index, alt) => setViewer({ files, index, alt }), []);
  const closeViewer = React.useCallback(() => setViewer(null), []);

  const [checkingDates, setCheckingDates] = React.useState(false);

  const data = res.data;
  const company = data?.company || null;
  const unit = data?.unit || null;

  const shareInfo = React.useMemo(() => ({
    title: unit?.name ? `${unit.name}${company?.name ? ` · ${company.name}` : ''}` : 'Hospedaje',
    description: unit?.description || (unit?.name ? `Conoce ${unit.name} y resérvala.` : 'Conoce esta unidad de hospedaje.'),
    image: (unit?.files || [])[0]?.url || shareImage(company),
    url: typeof window !== 'undefined' ? window.location.href : '',
  }), [unit, company]);

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
    return <div className={s.screen}><Spinner center label="Cargando unidad…" /></div>;
  }
  if (res.error || !unit) {
    return (
      <div className={s.screen}>
        <div className={s.state}><i className="fas fa-triangle-exclamation" /> No encontramos esta unidad.</div>
      </div>
    );
  }

  const backHref = `/${encodeURIComponent(companyUsername)}/hospedaje`;

  const whatsapp = whatsappHref(
    data.whatsapp_number,
    `Hola, me interesa ${unit.name}. ¿Qué disponibilidad tienen?`,
  );

  const generalFiles = (unit.files || []).filter((f) => f.url);
  const spaces = (unit.spaces || []).filter((sp) => sp.name);

  const facts = [
    { icon: 'fas fa-users', label: 'Capacidad', value: capacityText(unit) },
    { icon: 'fas fa-user-check', label: 'Incluye', value: `${unit.included_guests} persona${unit.included_guests === 1 ? '' : 's'} en la tarifa` },
    unit.check_in_time && { icon: 'fas fa-right-to-bracket', label: 'Ingreso', value: `Desde las ${unit.check_in_time}` },
    unit.check_out_time && { icon: 'fas fa-right-from-bracket', label: 'Salida', value: `Hasta las ${unit.check_out_time}` },
  ].filter(Boolean);

  const bottomItems = [
    { key: 'back', icon: 'fas fa-arrow-left', label: 'Volver', href: backHref },
    { key: 'share', icon: 'fas fa-share-nodes', label: shareMsg || 'Compartir', onClick: share },
  ];
  if (whatsapp) {
    bottomItems.push({
      key: 'book', icon: 'fab fa-whatsapp', label: 'Reservar', primary: true,
      href: whatsapp, target: '_blank',
    });
  }

  return (
    <div className={s.screen} style={companyBrandTheme(company)}>
      <div className={s.container}>
        <PhotoCarousel files={generalFiles} alt={unit.name} paused={!!viewer}
          onOpen={(i) => openViewer(generalFiles, i, unit.name)} />

        <header className={s.head}>
          {unit.type_name && <span className={s.type}>{unit.type_name}</span>}
          <h1 className={s.name}>{unit.name}</h1>
          {company?.name && <p className={s.byCompany}>en <a href={`/${encodeURIComponent(companyUsername)}`}>{company.name}</a></p>}
          <p className={s.price}>
            <strong>{reservationMoney(unit.base_price_per_night)}</strong>
            <span> / noche</span>
          </p>
          {Number(unit.included_guests) < Number(unit.capacity) && (
            <p className={s.priceNote}>
              La tarifa cubre {unit.included_guests} persona{unit.included_guests === 1 ? '' : 's'}; se puede
              alojar hasta {unit.capacity} con cargo adicional.
            </p>
          )}
        </header>

        <button type="button" className={s.availabilityCta} onClick={() => setCheckingDates(true)}>
          <i className="fas fa-calendar-check" /> Consultar disponibilidad
        </button>

        <section className={s.factsCard}>
          {facts.map((f) => (
            <div key={f.label} className={s.fact}>
              <span className={s.factIco}><i className={f.icon} /></span>
              <span className={s.factText}>
                <span className={s.factLabel}>{f.label}</span>
                <span className={s.factValue}>{f.value}</span>
              </span>
            </div>
          ))}
        </section>

        {unit.description && (
          <section>
            <h2 className={s.sectionTitle}>Acerca de este lugar</h2>
            <p className={s.description}>{unit.description}</p>
          </section>
        )}

        {spaces.length > 0 && (
          <section>
            <h2 className={s.sectionTitle}>Lo que encontrarás</h2>
            <div className={s.spaces}>
              {spaces.map((sp) => <SpaceBlock key={sp.id} space={sp} onOpen={openViewer} />)}
            </div>
          </section>
        )}

        <footer className={s.footer}>
          <span>Hecho con</span> <strong>piddet</strong>
        </footer>
      </div>

      <PublicBottomBar items={bottomItems} />

      {viewer && (
        <PhotoViewer files={viewer.files} index={viewer.index} alt={viewer.alt} onClose={closeViewer} />
      )}

      {checkingDates && (
        <AvailabilityModal companyUsername={companyUsername} unit={unit}
          whatsappNumber={data.whatsapp_number} onClose={() => setCheckingDates(false)} />
      )}
    </div>
  );
}

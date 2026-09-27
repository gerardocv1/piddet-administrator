import React from 'react';
import { Button, Pagination, Spinner } from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { applyMetaTags, applySeoTags, buildShareMeta } from '../public/shareMeta.js';
import { whatsappHref } from '../public/whatsapp.js';
import { PiddetGymLogo } from '../public/GymPortal/PiddetGymLogo.jsx';
import s from './PublicHome.module.css';

const PAGE_SIZE = 8;
// En la portada cada categoría es un avance corto; el resto está en su página ("Ver los N").
const PREVIEW_SIZE = 4;

const initial = (name = '') => (name.trim()[0] || '?').toUpperCase();
const validPage = (value) => {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
};

function CompanyLogo({ company }) {
  const [failed, setFailed] = React.useState(false);
  const src = company.thumbnail_icon || company.icon;

  if (!src || failed) {
    return <span className={s.logoFallback} aria-hidden="true">{initial(company.name)}</span>;
  }

  return (
    <img
      className={s.logoImage}
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

// Un negocio en el directorio: fila compacta y neutra (logo, nombre, tipo y ciudad). El color
// de cada compañía vive dentro de su perfil, no aquí.
function CompanyRow({ company }) {
  const meta = [company.company_type_name, company.city].filter(Boolean).join(' · ');
  return (
    <a className={s.row} href={`/${encodeURIComponent(company.username)}`}>
      <span className={s.logo}><CompanyLogo company={company} /></span>
      <span className={s.rowText}>
        <span className={s.rowTitle}>{company.name}</span>
        {meta && <span className={s.rowSub}>{meta}</span>}
        {company.description && <span className={s.rowDesc}>{company.description}</span>}
      </span>
      <i className={`fas fa-chevron-right ${s.chevron}`} aria-hidden="true" />
    </a>
  );
}

function CompaniesState({ loading, error, empty, onRetry }) {
  if (loading) {
    return <div className={s.sectionState}><Spinner center label="Cargando negocios…" /></div>;
  }
  if (error) {
    return (
      <div className={s.sectionState} role="alert">
        <i className="fas fa-triangle-exclamation" aria-hidden="true" />
        <span>No pudimos cargar estos negocios.</span>
        <Button variant="link" size="sm" onClick={onRetry}>Intentar de nuevo</Button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className={s.sectionState}>
        <i className="fas fa-store-slash" aria-hidden="true" />
        <span>Aún no hay negocios publicados en esta categoría.</span>
      </div>
    );
  }
  return null;
}

function CompanyList({ companies }) {
  return (
    <ul className={s.list}>
      {companies.map((company) => <li key={company.username}><CompanyRow company={company} /></li>)}
    </ul>
  );
}

// Acceso a piddet gym dentro de la sección de gimnasios: la única pieza oscura de la portada,
// porque es de piddet gym y no de un negocio.
function GymStrip() {
  return (
    <a className={s.gymStrip} href="/gym">
      <span className={s.gymStripText}>
        <PiddetGymLogo size="sm" />
        <span>¿Eres socio? Sigue tu progreso y tu plan.</span>
      </span>
      <span className={s.gymStripGo}><i className="fas fa-arrow-right" aria-hidden="true" /></span>
    </a>
  );
}

// Categorías como pastillas: "Todos" y cada tipo con negocios. La activa va en oscuro.
function CategoryChips({ types, selectedKey }) {
  return (
    <nav className={s.chips} aria-label="Categorías">
      <a className={[s.chip, !selectedKey ? s.chipOn : ''].filter(Boolean).join(' ')} href="/"
        aria-current={!selectedKey ? 'page' : undefined}>Todos</a>
      {types.map((type) => (
        <a key={type.key} className={[s.chip, selectedKey === type.key ? s.chipOn : ''].filter(Boolean).join(' ')}
          href={`/?type=${encodeURIComponent(type.key)}`} aria-current={selectedKey === type.key ? 'page' : undefined}>
          {type.name}
        </a>
      ))}
    </nav>
  );
}

function TypeSection({ type }) {
  const fetcher = React.useCallback(
    () => api.publicCompanies({ companyTypeKey: type.key, page: 1, perPage: PREVIEW_SIZE }),
    [type.key],
  );
  const resource = useResource(fetcher, { items: [], pagination: null }, [fetcher]);
  const companies = resource.data?.items || [];

  return (
    <section className={s.section} aria-labelledby={`type-${type.key}`}>
      <div className={s.sectionHead}>
        <h2 id={`type-${type.key}`} className={s.sectionTitle}>{type.name}</h2>
        <a className={s.seeAll} href={`/?type=${encodeURIComponent(type.key)}`}>
          {type.active_companies_count > companies.length ? `Ver los ${type.active_companies_count}` : 'Ver todos'}
        </a>
      </div>

      <CompaniesState
        loading={resource.loading}
        error={resource.error}
        empty={!companies.length}
        onRetry={resource.reload}
      />
      {!resource.loading && !resource.error && companies.length > 0 && <CompanyList companies={companies} />}
      {type.key === 'gym' && <GymStrip />}
    </section>
  );
}

function TypeDirectory({ type, page, onPageChange, chips }) {
  const fetcher = React.useCallback(
    () => api.publicCompanies({ companyTypeKey: type.key, page, perPage: PAGE_SIZE }),
    [type.key, page],
  );
  const resource = useResource(fetcher, { items: [], pagination: null }, [fetcher]);
  const companies = resource.data?.items || [];
  const pagination = resource.data?.pagination || {};
  const hasResults = Number(pagination.total) > 0;

  React.useEffect(() => {
    const lastPage = Number(pagination.last_page);
    if (!resource.loading && Number.isSafeInteger(lastPage) && lastPage > 0 && page > lastPage) {
      onPageChange(lastPage, { replace: true, scroll: false });
    }
  }, [onPageChange, page, pagination.last_page, resource.loading]);

  return (
    <main className={s.main}>
      <section className={s.section} aria-labelledby="directory-title">
        <div className={s.directoryHead}>
          <h1 id="directory-title" className={s.title}>{type.name}</h1>
          {hasResults && (
            <p className={s.lead}>
              {pagination.total} {Number(pagination.total) === 1 ? 'negocio' : 'negocios'} en Piddet
            </p>
          )}
        </div>
        {chips}

        <CompaniesState
          loading={resource.loading}
          error={resource.error}
          empty={!companies.length && !hasResults}
          onRetry={resource.reload}
        />
        {!resource.loading && !resource.error && companies.length > 0 && (
          <>
            <CompanyList companies={companies} />
            {type.key === 'gym' && <GymStrip />}
            <Pagination
              page={pagination.current_page || page}
              lastPage={pagination.last_page || 1}
              total={pagination.total}
              onChange={onPageChange}
            />
          </>
        )}
      </section>
    </main>
  );
}

export function PublicHome() {
  const params = new URLSearchParams(window.location.search);
  const selectedTypeKey = params.get('type') || '';
  const initialPage = validPage(params.get('page'));
  const [page, setPage] = React.useState(initialPage);
  const typesResource = useResource(api.publicCompanyTypes, []);
  const types = typesResource.data || [];
  const selectedType = types.find((type) => type.key === selectedTypeKey);
  const contactHref = whatsappHref(
    import.meta.env.VITE_CONTACT_WHATSAPP,
    'Hola, quiero conocer cómo vincular mi negocio a Piddet.',
  );
  const invalidType = selectedTypeKey && !typesResource.loading && !typesResource.error && !selectedType;

  React.useEffect(() => {
    const title = selectedType ? `${selectedType.name} en Piddet` : 'Descubre negocios en Piddet';
    const description = selectedType
      ? `Explora ${selectedType.name.toLowerCase()} disponibles en Piddet.`
      : 'Descubre restaurantes, gimnasios, tiendas y hospedajes que hacen parte de Piddet.';
    const canonical = new URL('/', window.location.origin);
    if (selectedType) {
      canonical.searchParams.set('type', selectedType.key);
      if (page > 1) canonical.searchParams.set('page', String(page));
    }
    const previousTitle = document.title;
    document.title = title;
    const cleanupMeta = applyMetaTags(buildShareMeta({
      title,
      description,
      image: `${window.location.origin}/favicon/apple-touch-icon.png`,
      url: canonical.href,
    }));
    const cleanupSeo = applySeoTags({
      canonical: canonical.href,
      robots: invalidType ? 'noindex, follow' : 'index, follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${window.location.origin}/#website`,
            name: 'Piddet',
            url: `${window.location.origin}/`,
            inLanguage: 'es',
          },
          {
            '@type': 'CollectionPage',
            '@id': `${canonical.href}#directory`,
            name: title,
            description,
            url: canonical.href,
            isPartOf: { '@id': `${window.location.origin}/#website` },
            inLanguage: 'es',
          },
        ],
      },
    });
    return () => {
      document.title = previousTitle;
      cleanupMeta();
      cleanupSeo();
    };
  }, [invalidType, page, selectedType]);

  const changePage = React.useCallback((nextPage, { replace = false, scroll = true } = {}) => {
    const normalizedPage = validPage(nextPage);
    const next = new URL(window.location.href);
    next.searchParams.set('page', String(normalizedPage));
    if (replace) window.history.replaceState({}, '', next);
    else window.history.pushState({}, '', next);
    setPage(normalizedPage);
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    const syncPageFromHistory = () => {
      setPage(validPage(new URLSearchParams(window.location.search).get('page')));
    };
    window.addEventListener('popstate', syncPageFromHistory);
    return () => window.removeEventListener('popstate', syncPageFromHistory);
  }, []);

  const chips = types.length > 0 ? <CategoryChips types={types} selectedKey={selectedTypeKey} /> : null;

  return (
    <div className={s.screen}>
      <header className={s.header}>
        <a className={s.wordmark} href="/" aria-label="Piddet, inicio">piddet</a>
        <a className={s.adminLink} href="/admin/login">
          <i className="fas fa-user" aria-hidden="true" /> <span>Administrar</span>
        </a>
      </header>

      {typesResource.loading && (
        <main className={s.main}><div className={s.pageState}><Spinner center label="Cargando directorio…" /></div></main>
      )}
      {typesResource.error && (
        <main className={s.main}>
          <div className={s.pageState} role="alert">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            <h1>No pudimos abrir el directorio</h1>
            <p>Revisa tu conexión e inténtalo de nuevo.</p>
            <Button onClick={typesResource.reload}>Intentar de nuevo</Button>
          </div>
        </main>
      )}
      {!typesResource.loading && !typesResource.error && types.length === 0 && (
        <main className={s.main}>
          <div className={s.pageState}>
            <i className="fas fa-store-slash" aria-hidden="true" />
            <h1>Aún no hay negocios publicados</h1>
            <p>Vuelve pronto para descubrir nuevas opciones.</p>
          </div>
        </main>
      )}
      {invalidType && (
        <main className={s.main}>
          <div className={s.pageState}>
            <i className="fas fa-compass" aria-hidden="true" />
            <h1>No encontramos esa categoría</h1>
            <p>Puedes volver al directorio y explorar todos los negocios.</p>
            <a className={s.primaryLink} href="/">Ver todos los negocios</a>
          </div>
        </main>
      )}
      {!typesResource.loading && !typesResource.error && selectedType && (
        <TypeDirectory type={selectedType} page={page} onPageChange={changePage} chips={chips} />
      )}
      {!typesResource.loading && !typesResource.error && !selectedTypeKey && types.length > 0 && (
        <main id="directory" className={s.main}>
          <section className={s.intro}>
            <h1 className={s.title}>Encuentra negocios cerca de ti</h1>
            <p className={s.lead}>Horarios, cómo llegar y contacto directo por WhatsApp.</p>
          </section>
          {chips}
          {types.map((type) => <TypeSection key={type.key} type={type} />)}
        </main>
      )}

      <div className={s.main}>
        {contactHref ? (
          <a className={s.join} href={contactHref} target="_blank" rel="noopener noreferrer">
            <span className={s.joinText}>
              <span className={s.joinTitle}>¿Tienes un negocio?</span>
              <span>Muéstralo en Piddet con tu carta, tus horarios y tu WhatsApp.</span>
            </span>
            <i className={`fas fa-chevron-right ${s.chevron}`} aria-hidden="true" />
          </a>
        ) : (
          <div className={s.join}>
            <span className={s.joinText}>
              <span className={s.joinTitle}>¿Tienes un negocio?</span>
              <span>Muéstralo en Piddet con tu carta, tus horarios y tu WhatsApp.</span>
            </span>
          </div>
        )}
      </div>

      <footer className={s.footer}>
        <span>Negocios que se mueven con</span> <strong>piddet</strong>
      </footer>
    </div>
  );
}

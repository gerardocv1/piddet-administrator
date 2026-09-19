import React from 'react';
import { Button, Pagination, Spinner } from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { applyMetaTags, buildShareMeta } from '../public/shareMeta.js';
import { whatsappHref } from '../public/whatsapp.js';
import s from './PublicHome.module.css';

const PAGE_SIZE = 8;
const TYPE_ICONS = {
  restaurant: 'fas fa-utensils',
  gym: 'fas fa-dumbbell',
  store: 'fas fa-store',
  lodging: 'fas fa-bed',
};

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

function CompanyCard({ company }) {
  return (
    <a className={s.companyCard} href={`/${encodeURIComponent(company.username)}`}>
      <div className={s.cardTop}>
        <span className={s.companyLogo}><CompanyLogo company={company} /></span>
        <span className={s.cardIdentity}>
          <span className={s.companyName}>{company.name}</span>
          <span className={s.companyType}>{company.company_type_name}</span>
        </span>
        <i className={`fas fa-arrow-right ${s.cardArrow}`} aria-hidden="true" />
      </div>
      {company.description && <span className={s.companyDescription}>{company.description}</span>}
      {company.city && (
        <span className={s.companyCity}>
          <i className="fas fa-location-dot" aria-hidden="true" />
          {company.city}
        </span>
      )}
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

function CompanyGrid({ companies }) {
  return (
    <div className={s.companyGrid}>
      {companies.map((company) => <CompanyCard key={company.username} company={company} />)}
    </div>
  );
}

function TypeSection({ type }) {
  const fetcher = React.useCallback(
    () => api.publicCompanies({ companyTypeKey: type.key, page: 1, perPage: PAGE_SIZE }),
    [type.key],
  );
  const resource = useResource(fetcher, { items: [], pagination: null }, [fetcher]);
  const companies = resource.data?.items || [];

  return (
    <section className={s.typeSection} aria-labelledby={`type-${type.key}`}>
      <div className={s.sectionHeading}>
        <div className={s.sectionTitleGroup}>
          <span className={s.typeIcon}><i className={TYPE_ICONS[type.key] || 'fas fa-building'} /></span>
          <div>
            <h2 id={`type-${type.key}`}>{type.name}</h2>
            <p>{type.active_companies_count} {type.active_companies_count === 1 ? 'negocio' : 'negocios'}</p>
          </div>
        </div>
        <a className={s.seeAll} href={`/?type=${encodeURIComponent(type.key)}`}>
          Ver todos <i className="fas fa-chevron-right" aria-hidden="true" />
        </a>
      </div>

      <CompaniesState
        loading={resource.loading}
        error={resource.error}
        empty={!companies.length}
        onRetry={resource.reload}
      />
      {!resource.loading && !resource.error && companies.length > 0 && <CompanyGrid companies={companies} />}
    </section>
  );
}

function TypeDirectory({ type, page, onPageChange }) {
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
      <a className={s.backLink} href="/">
        <i className="fas fa-arrow-left" aria-hidden="true" /> Todos los negocios
      </a>
      <section className={s.directorySection} aria-labelledby="directory-title">
        <div className={s.directoryHeading}>
          <span className={s.typeIconLarge}>
            <i className={TYPE_ICONS[type.key] || 'fas fa-building'} aria-hidden="true" />
          </span>
          <div>
            <p className={s.eyebrow}>Directorio</p>
            <h1 id="directory-title">{type.name}</h1>
            <p>Descubre los negocios activos de esta categoría.</p>
          </div>
        </div>

        <CompaniesState
          loading={resource.loading}
          error={resource.error}
          empty={!companies.length && !hasResults}
          onRetry={resource.reload}
        />
        {!resource.loading && !resource.error && companies.length > 0 && (
          <>
            <CompanyGrid companies={companies} />
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

  React.useEffect(() => {
    const title = selectedType ? `${selectedType.name} en Piddet` : 'Descubre negocios en Piddet';
    const description = selectedType
      ? `Explora ${selectedType.name.toLowerCase()} disponibles en Piddet.`
      : 'Descubre restaurantes, gimnasios, tiendas y hospedajes que hacen parte de Piddet.';
    const previousTitle = document.title;
    document.title = title;
    const created = applyMetaTags(buildShareMeta({
      title,
      description,
      image: `${window.location.origin}/favicon/apple-touch-icon.png`,
      url: window.location.href,
    }));
    return () => {
      document.title = previousTitle;
      created.forEach((element) => element.remove());
    };
  }, [page, selectedType]);

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

  const invalidType = selectedTypeKey && !typesResource.loading && !typesResource.error && !selectedType;

  return (
    <div className={s.screen}>
      <header className={s.header}>
        <a className={s.wordmark} href="/" aria-label="Piddet, inicio">piddet</a>
        <a className={s.adminLink} href="/admin/login">
          <i className="fas fa-user" aria-hidden="true" /> Administrar
        </a>
      </header>

      {!selectedTypeKey && (
        <section className={s.hero}>
          <div className={s.heroContent}>
            <p className={s.eyebrow}>Negocios para descubrir</p>
            <h1>Encuentra tu próximo lugar favorito</h1>
            <p className={s.heroText}>
              Restaurantes, gimnasios, tiendas y hospedajes que están listos para recibirte.
            </p>
            <a className={s.heroAction} href="#directory">
              Explorar negocios <i className="fas fa-arrow-down" aria-hidden="true" />
            </a>
          </div>
          <div className={s.heroVisual} aria-hidden="true">
            <span><i className="fas fa-utensils" /></span>
            <span><i className="fas fa-dumbbell" /></span>
            <span><i className="fas fa-store" /></span>
            <span><i className="fas fa-bed" /></span>
          </div>
        </section>
      )}

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
        <TypeDirectory type={selectedType} page={page} onPageChange={changePage} />
      )}
      {!typesResource.loading && !typesResource.error && !selectedTypeKey && types.length > 0 && (
        <main id="directory" className={s.main}>
          <div className={s.directoryIntro}>
            <p className={s.eyebrow}>Directorio Piddet</p>
            <h2>Explora por categoría</h2>
            <p>Conoce negocios locales y entra a su espacio para ver todo lo que ofrecen.</p>
          </div>
          <div className={s.sections}>
            {types.map((type) => <TypeSection key={type.key} type={type} />)}
          </div>
        </main>
      )}

      <section className={s.join}>
        <div>
          <p className={s.eyebrow}>Crece con Piddet</p>
          <h2>¿Quieres hacer parte?</h2>
          <p>Organiza tu operación y crea una vitrina digital para que más personas te encuentren.</p>
        </div>
        {contactHref && (
          <a className={s.whatsappButton} href={contactHref} target="_blank" rel="noopener noreferrer">
            <i className="fab fa-whatsapp" aria-hidden="true" /> Hablemos por WhatsApp
          </a>
        )}
      </section>

      <footer className={s.footer}>
        <span>Negocios que se mueven con</span> <strong>piddet</strong>
      </footer>
    </div>
  );
}

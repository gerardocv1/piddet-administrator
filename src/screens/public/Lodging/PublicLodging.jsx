import React from 'react';
import { Spinner } from '../../../components';
import { api } from '../../../lib/api.js';
import { useResource } from '../../../lib/useResource.js';
import { shareImage, applyMetaTags, buildShareMeta, shareOrCopy } from '../shareMeta.js';
import { PublicBottomBar } from '../PublicBottomBar.jsx';
import { UnitCard } from './UnitCard.jsx';
import { companyBrandTheme } from '../../../lib/brand/palettes.js';
import s from './PublicLodging.module.css';

const initial = (name = '') => (name.trim()[0] || '?').toUpperCase();

// Listado público del hospedaje de una compañía (sin sesión): /{compañía}/hospedaje. Muestra el
// catálogo completo de unidades reservables; la disponibilidad se consulta por fechas dentro de
// cada unidad, que es donde el visitante ya sabe cuál le interesa.
export function PublicLodging({ companyUsername }) {
  const res = useResource(
    React.useCallback(() => api.publicRentableUnits(companyUsername), [companyUsername]),
    null,
    [companyUsername],
  );

  const data = res.data;
  const company = data?.company || null;
  const units = data?.units || [];

  const shareInfo = React.useMemo(() => ({
    title: company?.name ? `Hospedaje · ${company.name}` : 'Hospedaje',
    description: company?.name
      ? `Conoce las opciones de hospedaje de ${company.name}.`
      : 'Conoce nuestras opciones de hospedaje.',
    image: shareImage(company),
    url: typeof window !== 'undefined' ? window.location.href : '',
  }), [company]);

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

  const companyHref = `/${encodeURIComponent(companyUsername)}`;

  if (res.loading) {
    return <div className={s.screen}><Spinner center label="Cargando hospedaje…" /></div>;
  }
  if (res.error || !company) {
    return (
      <div className={s.screen}>
        <div className={s.state}><i className="fas fa-triangle-exclamation" /> No encontramos el hospedaje de esta empresa.</div>
      </div>
    );
  }

  return (
    <div className={s.screen} style={companyBrandTheme(company)}>
      <div className={s.container}>
        <header className={s.head}>
          <a className={s.brand} href={companyHref}>
            <span className={[s.brandLogo, company.icon ? s.brandLogoImg : ''].filter(Boolean).join(' ')}>
              {company.icon
                ? <img src={company.icon} alt={company.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : initial(company.name)}
            </span>
            <span className={s.brandName}>{company.name}</span>
          </a>
          <h1 className={s.title}>Hospedaje</h1>
          <p className={s.subtitle}>Entra a cada opción para ver todo lo que incluye y consultar tus fechas.</p>
        </header>

        {units.length === 0 ? (
          <div className={s.state}><i className="fas fa-bed" /> Aún no hay unidades de hospedaje publicadas.</div>
        ) : (
          <div className={s.grid}>
            {units.map((u) => <UnitCard key={u.id} unit={u} companyUsername={companyUsername} />)}
          </div>
        )}

        <footer className={s.footer}>
          <span>Hecho con</span> <strong>piddet</strong>
        </footer>
      </div>

      <PublicBottomBar items={[
        { key: 'back', icon: 'fas fa-arrow-left', label: 'Volver', href: companyHref },
        { key: 'share', icon: 'fas fa-share-nodes', label: shareMsg || 'Compartir', primary: true, onClick: share },
      ]} />
    </div>
  );
}

import React from 'react';
import { CATEGORY_FRAMES, DEFAULT_FRAME } from '../frames/index.js';
import { DisplayContext } from '../display.js';
import { DEFAULT_SHOW } from '../options.js';
import s from './ClassicLayout.module.css';

// Logo de la compañía: el backend siempre devuelve `icon` (con un default `company.png` si no
// hay logo subido). Descartamos ese default para preferir el wordmark de texto.
const DEFAULT_LOGO_RE = /\/company\.png(\?|$)/;
const pickLogo = (company) =>
  [company?.standard_icon, company?.icon, company?.thumbnail_icon].find((u) => u && !DEFAULT_LOGO_RE.test(u)) || null;

// Datos de contacto de la compañía para el pie. El backend los expone planos (company->address…),
// pero toleramos también la relación anidada (detail / company_detail) por si llega así.
const companyContact = (c) => {
  const d = c?.detail || c?.company_detail || {};
  const pick = (k) => c?.[k] || d?.[k] || null;
  return { address: pick('address'), phone: pick('phone'), email: pick('email'), website: pick('website') };
};

// Diseño "Clásico": carta centrada apta para A4, encabezado con la compañía y secciones por
// categoría. Cada categoría se presenta con el frame (plantilla) que tenga asignado.
// Si llega `onFrameChange`, muestra un selector de frame por categoría (oculto al imprimir).
export function ClassicLayout({ menu, company, groups, theme, show = DEFAULT_SHOW, framesByCat = {}, onFrameChange }) {
  const logo = pickLogo(company);
  const [logoFailed, setLogoFailed] = React.useState(false);
  const contact = companyContact(company);
  // El encabezado solo se dibuja si queda algo visible en él (evita el filete suelto).
  const hasHeader = show.brand || show.menuName || (show.menuDesc && menu?.description);
  return (
    <DisplayContext.Provider value={show}>
    <article className={s.page} style={theme}>
      {hasHeader && (
        <header className={s.header}>
          {show.brand && (logo && !logoFailed ? (
            <img className={s.logo} src={logo} alt={company?.name || 'Logo'} onError={() => setLogoFailed(true)} />
          ) : (
            <span className={s.wordmark}>{company?.name || 'Menú'}</span>
          ))}
          {show.menuName && <h1 className={s.menuName}>{menu?.name || 'Menú'}</h1>}
          {show.menuDesc && menu?.description && <p className={s.menuDesc}>{menu.description}</p>}
          <span className={s.headerRule} aria-hidden="true" />
        </header>
      )}

      {groups.map((g) => {
        const frameKey = CATEGORY_FRAMES[framesByCat[g.cat.id]] ? framesByCat[g.cat.id] : DEFAULT_FRAME;
        const Frame = CATEGORY_FRAMES[frameKey].Component;
        return (
          <section key={g.cat.id} className={s.category}>
            <div className={s.catHead}>
              <h2 className={s.catTitle}><span>{g.cat.name}</span></h2>
              {onFrameChange && (
                <select className={s.frameSelect} value={frameKey}
                  onChange={(e) => onFrameChange(g.cat.id, e.target.value)}
                  aria-label={`Plantilla de ${g.cat.name}`}>
                  {Object.entries(CATEGORY_FRAMES).map(([k, f]) => (
                    <option key={k} value={k}>{f.label}</option>
                  ))}
                </select>
              )}
            </div>
            <Frame items={g.items} />
          </section>
        );
      })}

      <footer className={s.footer}>
        {/* Datos de la empresa: opcionales (casilla). La marca piddet, no. */}
        {show.footer && (
          <div className={s.footerCompany}>
            {company?.name && <span className={s.footerName}>{company.name}</span>}
            {(contact.address || contact.phone || contact.email || contact.website) && (
              <div className={s.footerContact}>
                {contact.address && <span><i className="fas fa-location-dot" aria-hidden="true" /> {contact.address}</span>}
                {contact.phone && <span><i className="fas fa-phone" aria-hidden="true" /> {contact.phone}</span>}
                {contact.email && <span><i className="fas fa-envelope" aria-hidden="true" /> {contact.email}</span>}
                {contact.website && <span><i className="fas fa-globe" aria-hidden="true" /> {contact.website}</span>}
              </div>
            )}
          </div>
        )}
        {/* Marca del producto: siempre presente, no se puede ocultar. */}
        <div className={s.footerBrand}>piddet.com</div>
      </footer>
    </article>
    </DisplayContext.Provider>
  );
}

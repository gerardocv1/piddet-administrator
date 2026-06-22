import React from 'react';
import { CATEGORY_FRAMES, DEFAULT_FRAME } from '../frames/index.js';
import s from './ClassicLayout.module.css';

// Logo de la compañía: el backend siempre devuelve `icon` (con un default `company.png` si no
// hay logo subido). Descartamos ese default para preferir el wordmark de texto.
const DEFAULT_LOGO_RE = /\/company\.png(\?|$)/;
const pickLogo = (company) =>
  [company?.standard_icon, company?.icon, company?.thumbnail_icon].find((u) => u && !DEFAULT_LOGO_RE.test(u)) || null;

// Diseño "Clásico": carta centrada apta para A4, encabezado con la compañía y secciones por
// categoría. Cada categoría se presenta con el frame (plantilla) que tenga asignado.
// Si llega `onFrameChange`, muestra un selector de frame por categoría (oculto al imprimir).
export function ClassicLayout({ menu, company, groups, theme, framesByCat = {}, onFrameChange }) {
  const logo = pickLogo(company);
  const [logoFailed, setLogoFailed] = React.useState(false);
  return (
    <article className={s.page} style={theme}>
      <header className={s.header}>
        {logo && !logoFailed ? (
          <img className={s.logo} src={logo} alt={company?.name || 'Logo'} onError={() => setLogoFailed(true)} />
        ) : (
          <span className={s.wordmark}>{company?.name || 'Menú'}</span>
        )}
        <h1 className={s.menuName}>{menu?.name || 'Menú'}</h1>
        {menu?.description && <p className={s.menuDesc}>{menu.description}</p>}
        <span className={s.headerRule} aria-hidden="true" />
      </header>

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

      <footer className={s.footer}>{company?.name}</footer>
    </article>
  );
}

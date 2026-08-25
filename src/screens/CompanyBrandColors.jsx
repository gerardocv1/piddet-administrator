import React from 'react';
import { BRAND_PALETTES, findPalette, findIconBackground, DEFAULT_BRAND_SECONDARY } from '../lib/brand/palettes.js';
import t from './CompanyBrandColors.module.css';

// Selector de un color de marca: rejilla de muestras del catálogo (las mismas del diseño de la
// carta). Presentacional puro; el valor es la CLAVE de la paleta.
/** `options` permite usar otro catálogo (p. ej. los fondos del icono, que añaden el blanco). */
export function BrandColorPicker({ label, hint, value, fallback, onChange, options = BRAND_PALETTES, find = findPalette }) {
  const selected = find(value, fallback);

  return (
    <div className={t.picker}>
      <div className={t.pickerHead}>
        <span className={t.label}>{label}</span>
        <span className={t.selected}>{selected.label}</span>
      </div>
      {hint && <p className={t.hint}>{hint}</p>}
      <div className={t.swatches}>
        {options.map((p) => {
          const active = p.key === selected.key;
          return (
            <button
              key={p.key}
              type="button"
              className={[t.swatch, active ? t.swatchActive : ''].filter(Boolean).join(' ')}
              style={{ '--swatch': p.accent }}
              title={p.label}
              aria-label={p.label}
              aria-pressed={active}
              onClick={() => onChange(p.key)}
            >
              {active && <i className="fas fa-check" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Vista previa de la identidad: cómo se verán el logo y el botón principal de las páginas
// públicas con los colores elegidos.
export function BrandPreview({ primary, secondary, name = '' }) {
  const p = findPalette(primary);
  const sec = findPalette(secondary, DEFAULT_BRAND_SECONDARY);
  const initial = (name.trim()[0] || '?').toUpperCase();

  return (
    <div className={t.preview}>
      <span className={t.previewLogo}
        style={{ background: `linear-gradient(87deg, ${p.accent} 0%, ${sec.accent} 100%)` }}>
        {initial}
      </span>
      <span className={t.previewBtn} style={{ background: p.accent }}>Botón principal</span>
      <span className={t.previewChip} style={{ background: p.soft, color: p.strong }}>Realce</span>
    </div>
  );
}

/**
 * Vista previa del icono con el que la app queda instalada en la pantalla de inicio. Reproduce lo
 * que compone el backend (`AppIconRenderer`): fondo de un solo color y el logo centrado, o la
 * inicial si la compañía no tiene logo. La tinta de la inicial sigue al fondo, igual que allí.
 */
export function AppIconPreview({ background, logo, name = '', fallbackBackground }) {
  const bg = findIconBackground(background, fallbackBackground);
  const initial = (name.trim()[0] || '?').toUpperCase();

  return (
    <div className={t.iconPreview}>
      <span className={t.iconTile} style={{ background: bg.accent }}>
        {logo
          ? <img className={t.iconLogo} src={logo} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          : <span className={t.iconLetter} style={{ color: bg.key === 'white' ? '#2d2d2d' : '#ffffff' }}>{initial}</span>}
      </span>
      <span className={t.iconCaption}>{name.trim() || 'Nombre de la app'}</span>
    </div>
  );
}

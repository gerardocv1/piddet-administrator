import React from 'react';
import { BRAND_PALETTES, findPalette, DEFAULT_BRAND_SECONDARY } from '../lib/brand/palettes.js';
import t from './CompanyBrandColors.module.css';

// Selector de un color de marca: rejilla de muestras del catálogo (las mismas del diseño de la
// carta). Presentacional puro; el valor es la CLAVE de la paleta.
export function BrandColorPicker({ label, hint, value, fallback, onChange }) {
  const selected = findPalette(value, fallback);

  return (
    <div className={t.picker}>
      <div className={t.pickerHead}>
        <span className={t.label}>{label}</span>
        <span className={t.selected}>{selected.label}</span>
      </div>
      {hint && <p className={t.hint}>{hint}</p>}
      <div className={t.swatches}>
        {BRAND_PALETTES.map((p) => {
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

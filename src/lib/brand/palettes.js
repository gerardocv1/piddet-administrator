// Catálogo ÚNICO de colores de marca de la plataforma. Lo comparten la carta del menú (que elige
// un acento por menú) y la identidad de la compañía (color primario y secundario del perfil, con
// los que se pintan sus páginas públicas). Cada paleta es un conjunto armónico, no un color suelto:
//   accent → color principal
//   strong → variante oscura (texto/estados sobre claro, buena legibilidad)
//   soft   → tinte muy claro (fondos de realce)
//   onSoft → tono medio para iconos/detalles sobre el tinte claro

export const BRAND_PALETTES = [
  { key: 'orange', label: 'Naranja', accent: '#ff7c00', strong: '#b85a00', soft: '#fff1e0', onSoft: '#ffb866' },
  { key: 'teal', label: 'Verde petróleo', accent: '#0f7a86', strong: '#0b5a63', soft: '#e3f2f3', onSoft: '#57b3bc' },
  { key: 'blue', label: 'Azul océano', accent: '#1f6fb2', strong: '#15517f', soft: '#e7f0f8', onSoft: '#6aa0d0' },
  { key: 'forest', label: 'Verde bosque', accent: '#2f7d4f', strong: '#1f5a39', soft: '#e6f3ec', onSoft: '#6bae87' },
  { key: 'wine', label: 'Vino tinto', accent: '#9b2242', strong: '#6f182f', soft: '#f7e7eb', onSoft: '#c76d82' },
  { key: 'cocoa', label: 'Cacao', accent: '#8a5a2b', strong: '#67401d', soft: '#f4ebe0', onSoft: '#c2986a' },
  { key: 'charcoal', label: 'Grafito', accent: '#2d2d2d', strong: '#111111', soft: '#ececec', onSoft: '#9a9a9a' },
  { key: 'gold', label: 'Dorado', accent: '#c08a1e', strong: '#8a6312', soft: '#f8f0dd', onSoft: '#d8b766' },
  { key: 'plum', label: 'Ciruela', accent: '#7a3b8f', strong: '#592a69', soft: '#f1e7f4', onSoft: '#b07fc0' },
  { key: 'slate', label: 'Azul pizarra', accent: '#3f5a73', strong: '#2c4255', soft: '#e9eef3', onSoft: '#8aa1b5' },
  { key: 'crimson', label: 'Rojo carmesí', accent: '#c0392b', strong: '#922a20', soft: '#fbe7e4', onSoft: '#dd8e85' },
  { key: 'rose', label: 'Rosa frambuesa', accent: '#c2456b', strong: '#933350', soft: '#fbe8ee', onSoft: '#dd8aa3' },
];

// Naranja piddet: es el color de la plataforma y el que ve una compañía que no eligió el suyo.
export const DEFAULT_BRAND_PRIMARY = 'orange';
export const DEFAULT_BRAND_SECONDARY = 'gold';

export const findPalette = (key, fallback = DEFAULT_BRAND_PRIMARY) =>
  BRAND_PALETTES.find((p) => p.key === key) || BRAND_PALETTES.find((p) => p.key === fallback);

const channels = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

// Mezcla dos hex: ratio 0 devuelve `from`, 1 devuelve `to`.
const mix = (from, to, ratio) => {
  const a = channels(from);
  const b = channels(to);
  const hex = a.map((v, i) => Math.round(v + (b[i] - v) * ratio).toString(16).padStart(2, '0'));
  return `#${hex.join('')}`;
};

/**
 * Variables CSS con los colores de una compañía, para aplicarlas sobre el contenedor de sus
 * páginas públicas (mismo mecanismo que el tema de la carta). Redefine la escala completa de
 * `--color-primary` de tokens.css a partir de la paleta elegida, para que botones, enlaces,
 * pastillas y realces adopten la marca sin tocar un solo estilo de las pantallas.
 */
export function buildBrandTheme(primaryKey, secondaryKey) {
  const primary = findPalette(primaryKey);
  const secondary = findPalette(secondaryKey, DEFAULT_BRAND_SECONDARY);

  return {
    '--color-primary': primary.accent,
    '--color-primary-600': mix(primary.accent, primary.strong, 0.5),
    '--color-primary-700': primary.strong,
    '--color-primary-300': primary.onSoft,
    '--color-primary-100': mix(primary.soft, primary.onSoft, 0.3),
    '--color-primary-050': primary.soft,
    '--color-secondary': secondary.accent,
    '--gradient-primary': `linear-gradient(87deg, ${primary.accent} 0%, ${secondary.accent} 100%)`,
  };
}

// Tema de marca a partir del perfil público de la compañía (claves guardadas en su perfil).
export const companyBrandTheme = (company) =>
  buildBrandTheme(company?.brand_primary, company?.brand_secondary);

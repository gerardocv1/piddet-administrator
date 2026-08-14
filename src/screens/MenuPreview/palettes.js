// Paletas de la carta. El acento sale del catálogo único de colores de marca de la plataforma
// (src/lib/brand/palettes.js), el mismo que elige la compañía en su perfil; aquí se aplica como
// variables CSS (--carta-*) sobre el diseño. No son estilos sueltos: son tokens dinámicos.

import { BRAND_PALETTES } from '../../lib/brand/palettes.js';

// Color principal (acento): se usa en el nombre de la compañía, los títulos de categoría, el
// filete del encabezado, el precio y la miniatura de respaldo.
export const ACCENT_PALETTES = BRAND_PALETTES;

// Fondo de la página. Incluye crema cálida (por defecto), blanco, dos pasteles suaves y una
// opción transparente (al imprimir queda blanco del papel).
export const BACKGROUNDS = [
  { key: 'cream', label: 'Crema', value: '#fffdf8' },
  { key: 'white', label: 'Blanco', value: '#ffffff' },
  { key: 'ivory', label: 'Marfil', value: '#fbf4e9' },
  { key: 'mint', label: 'Menta suave', value: '#f1f7f4' },
  { key: 'sky', label: 'Cielo suave', value: '#eef4f8' },
  { key: 'sand', label: 'Arena', value: '#f7f1e6' },
  { key: 'blush', label: 'Rubor suave', value: '#fbf0f1' },
  { key: 'lavender', label: 'Lavanda', value: '#f3f0f9' },
  { key: 'sage', label: 'Salvia', value: '#eef3ec' },
  { key: 'pearl', label: 'Perla', value: '#f4f5f7' },
  { key: 'transparent', label: 'Transparente', value: 'transparent' },
];

export const DEFAULT_ACCENT = ACCENT_PALETTES[0].key;
export const DEFAULT_BACKGROUND = BACKGROUNDS[0].key;

// Construye el objeto de variables CSS (--carta-*) que se aplica al diseño según las elecciones.
export function buildTheme(accentKey, backgroundKey) {
  const accent = ACCENT_PALETTES.find((p) => p.key === accentKey) || ACCENT_PALETTES[0];
  const bg = BACKGROUNDS.find((b) => b.key === backgroundKey) || BACKGROUNDS[0];
  return {
    '--carta-accent': accent.accent,
    '--carta-accent-strong': accent.strong,
    '--carta-accent-soft': accent.soft,
    '--carta-accent-on-soft': accent.onSoft,
    '--carta-bg': bg.value,
  };
}

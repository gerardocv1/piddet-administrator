// Paletas de la carta. Cada paleta de acento define un conjunto armónico de tonos que se aplican
// como variables CSS (--carta-*) sobre el diseño, para que la persona elija el color principal y
// el fondo sin salirse de combinaciones cuidadas. No son estilos sueltos: son tokens dinámicos.

// Color principal (acento): se usa en el nombre de la compañía, los títulos de categoría, el
// filete del encabezado, el precio y la miniatura de respaldo.
//   accent     → color principal
//   strong     → variante oscura (títulos de categoría, buena legibilidad)
//   soft       → tinte muy claro (fondo de la imagen de respaldo)
//   onSoft     → color del icono sobre el tinte claro
export const ACCENT_PALETTES = [
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

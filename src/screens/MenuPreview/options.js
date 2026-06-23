// Opciones de presentación de la carta que NO son color: escala tipográfica, separación entre
// categorías y qué elementos se muestran. Igual que las paletas, son tokens dinámicos: la
// escala y la separación se inyectan como variables CSS (--carta-*) sobre el diseño.

// Escala tipográfica: multiplica los tamaños de letra de títulos y productos. "S" achica todo
// proporcionalmente para que quepa más por hoja; "L" lo agranda.
export const TEXT_SCALES = [
  { key: 's', label: 'Letra S', value: 0.88 },
  { key: 'm', label: 'Letra M', value: 1 },
  { key: 'l', label: 'Letra L', value: 1.14 },
];

// Separación (aire vertical) de las categorías. Abarca dos huecos a la vez:
//   `value` = margin-top entre bloques de categoría (pantalla); `print` = su equivalente como
//             padding-top tras un salto de página (la impresión usa mm, ver ClassicLayout).
//   `title` = aire interno entre el título de la categoría y sus productos.
export const CATEGORY_SPACINGS = [
  { key: 'tight', label: 'Compacto', value: '16px', print: '6mm', title: '12px' },
  { key: 'normal', label: 'Normal', value: '30px', print: '9mm', title: '18px' },
  { key: 'roomy', label: 'Amplio', value: '56px', print: '15mm', title: '30px' },
];

// Elementos opcionales de la carta (casillas mostrar/ocultar). Todos visibles por defecto.
// `brand` = logo o nombre de la compañía; `leaders` = la línea de puntos entre nombre y precio.
export const DISPLAY_TOGGLES = [
  { key: 'brand', label: 'Logo / nombre de compañía' },
  { key: 'menuName', label: 'Nombre del menú' },
  { key: 'menuDesc', label: 'Subtítulo del menú' },
  { key: 'leaders', label: 'Línea de puntos (nombre → precio)' },
  { key: 'itemDesc', label: 'Descripción de los productos' },
  { key: 'footer', label: 'Datos de la empresa en el pie' },
];

export const DEFAULT_SCALE = 'm';
export const DEFAULT_SPACING = 'normal';
export const DEFAULT_SHOW = DISPLAY_TOGGLES.reduce((acc, t) => ({ ...acc, [t.key]: true }), {});

// Normaliza el objeto `show` guardado: parte de "todo visible" y solo pisa con los valores
// booleanos conocidos, tolerando configuraciones viejas o claves sobrantes.
export function normalizeShow(saved) {
  const out = { ...DEFAULT_SHOW };
  if (saved && typeof saved === 'object') {
    DISPLAY_TOGGLES.forEach((t) => {
      if (typeof saved[t.key] === 'boolean') out[t.key] = saved[t.key];
    });
  }
  return out;
}

// Variables CSS de escala/separación que se suman al tema de color (buildTheme) en la página.
export function buildLayoutVars(scaleKey, spacingKey) {
  const sc = TEXT_SCALES.find((x) => x.key === scaleKey) || TEXT_SCALES.find((x) => x.key === DEFAULT_SCALE);
  const sp = CATEGORY_SPACINGS.find((x) => x.key === spacingKey) || CATEGORY_SPACINGS.find((x) => x.key === DEFAULT_SPACING);
  return {
    '--carta-scale': sc.value,
    '--carta-cat-gap': sp.value,
    '--carta-cat-gap-print': sp.print,
    '--carta-title-gap': sp.title,
  };
}

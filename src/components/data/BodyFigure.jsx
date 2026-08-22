import React from 'react';
import styles from './BodyFigure.module.css';

// Silueta corporal interactiva de la vista de progreso del gimnasio. Dibuja una figura frontal
// anatómica (hombre o mujer) construida con contornos suavizados (Catmull-Rom → bézier) y
// superpone zonas tocables solo para las medidas corporales que la compañía tiene configuradas.
// Las zonas son bandas horizontales RECORTADAS al contorno real (torso, brazos o piernas según
// la medida), así siguen la anatomía en vez de ser rectángulos flotantes. La zona seleccionada
// pulsa en el color primario.
//
// Props: sex ('M'|'F'), zones (keys de medidas corporales disponibles), selected (key),
// withData (keys que ya tienen mediciones), onSelect(key), labelFor(key).

const CX = 110; // eje de simetría del viewBox 0 0 220 460

// Convierte una lista de puntos [x,y] en un path cerrado suave (Catmull-Rom → bézier cúbica).
function smoothClosedPath(points) {
  const n = points.length;
  const pt = (i) => points[(i + n) % n];
  let d = `M ${pt(0)[0].toFixed(1)} ${pt(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pt(i - 1);
    const p1 = pt(i);
    const p2 = pt(i + 1);
    const p3 = pt(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

// Contorno simétrico: se define la mitad izquierda (offset positivo = distancia al eje) de
// arriba hacia abajo y se espeja para cerrar la silueta.
const mirrorClosed = (half) => smoothClosedPath([
  ...half.map(([o, y]) => [CX - o, y]),
  ...[...half].reverse().map(([o, y]) => [CX + o, y]),
]);

// Forma unilateral (brazo/pierna izquierdos): se define completa y se espeja para el derecho.
const flip = (pts) => pts.map(([x, y]) => [2 * CX - x, y]);

// ── Geometría por sexo ──────────────────────────────────────────────────────
// Hombre: hombros y espalda anchos, cintura moderada, cadera recta.
// Mujer: hombros más suaves, cintura marcada, cadera y muslos más amplios, cabello largo.
function buildFigure(sex) {
  const F = sex === 'F';

  // Torso: cuello → trapecio → hombro (con punto extra para que no se redondee de más) →
  // axila → costado → cintura → cadera → ingle.
  const torsoHalf = F ? [
    [9, 64], [21, 72], [38, 81], [41, 89], [35, 106], [37, 124], [30, 148],
    [24, 170], [33, 194], [43, 212], [37, 232], [14, 244], [0, 247],
  ] : [
    [10, 64], [27, 71], [45, 80], [49, 88], [43, 106], [44, 126], [36, 152],
    [31, 174], [34, 196], [38, 212], [33, 230], [14, 242], [0, 246],
  ];

  // Brazo izquierdo en coordenadas absolutas: deltoide → bíceps → codo → antebrazo → muñeca →
  // mano (mitón) y de regreso por la cara interna hasta la axila.
  const armLeft = F ? [
    [68, 84], [57, 99], [53, 133], [51, 163], [49, 196], [47, 224],
    [45, 238], [47, 256], [55, 260], [60, 246], [58, 228],
    [58, 220], [60, 196], [62, 164], [65, 134], [68, 108], [71, 98],
  ] : [
    [61, 83], [49, 99], [45, 133], [43, 163], [41, 196], [39, 224],
    [37, 238], [39, 256], [48, 260], [53, 246], [51, 228],
    [51, 220], [53, 196], [56, 164], [59, 134], [63, 107], [66, 96],
  ];

  // Pierna izquierda: cadera → cuádriceps → rodilla → pantorrilla → tobillo → pie (y de
  // regreso por la cara interna hasta la ingle, dejando luz entre las piernas).
  const legLeft = F ? [
    [68, 210], [66, 254], [71, 298], [70, 320], [67, 344], [74, 390],
    [76, 412], [72, 434], [70, 446], [96, 446], [94, 434], [90, 412],
    [96, 352], [94, 320], [98, 292], [102, 262], [106, 248],
  ] : [
    [72, 210], [70, 252], [73, 296], [72, 320], [69, 344], [76, 390],
    [78, 412], [74, 434], [72, 446], [98, 446], [96, 434], [92, 412],
    [97, 348], [96, 320], [100, 290], [104, 262], [107, 246],
  ];

  // Cuello (del mentón a los trapecios).
  const neckHalf = F ? [[8, 52], [9, 62], [13, 72], [16, 78]] : [[9, 52], [10, 62], [15, 72], [19, 78]];

  // Cabello (solo mujer): melena detrás de cabeza y hombros.
  const hairHalf = F ? [[0, 4], [22, 14], [29, 42], [30, 78], [27, 108], [18, 122], [8, 118]] : null;

  return {
    head: { cx: CX, cy: 34, rx: F ? 18.5 : 19.5, ry: F ? 23 : 24 },
    hair: hairHalf ? mirrorClosed(hairHalf) : null,
    neck: mirrorClosed(neckHalf),
    torso: mirrorClosed(torsoHalf),
    arms: `${smoothClosedPath(armLeft)} ${smoothClosedPath(flip(armLeft))}`,
    legs: `${smoothClosedPath(legLeft)} ${smoothClosedPath(flip(legLeft))}`,
  };
}

const FIGURES = { M: buildFigure('M'), F: buildFigure('F') };

// Bandas por medida: rango vertical + a qué contorno se recortan.
const ZONE_BANDS = [
  { key: 'neck', clip: 'neck', y: 50, h: 32 },
  { key: 'shoulders', clip: 'torso', y: 78, h: 22 },
  { key: 'chest', clip: 'torso', y: 100, h: 32 },
  { key: 'abdomen', clip: 'torso', y: 132, h: 28 },
  { key: 'waist', clip: 'torso', y: 160, h: 24 },
  { key: 'hip', clip: 'torso', y: 184, h: 26 },
  { key: 'glute', clip: 'torso', y: 210, h: 34 },
  { key: 'bicep', clip: 'arms', y: 88, h: 74 },
  { key: 'forearm', clip: 'arms', y: 170, h: 62 },
  { key: 'thigh', clip: 'legs', y: 244, h: 76 },
  { key: 'calf', clip: 'legs', y: 326, h: 88 },
];

/** Claves de medidas que la figura sabe ubicar en el cuerpo. */
export const BODY_FIGURE_KEYS = ZONE_BANDS.map((b) => b.key);

export function BodyFigure({ sex = 'M', zones = [], selected = '', withData = [], onSelect, labelFor }) {
  const fig = FIGURES[sex] || FIGURES.M;
  const uid = React.useId();
  const clipId = (part) => `${uid}-${part}`;

  const zoneClass = (key) => [
    styles.zone,
    withData.includes(key) ? styles.zoneData : '',
    selected === key ? styles.zoneSelected : '',
  ].filter(Boolean).join(' ');

  const zoneProps = (key) => ({
    className: zoneClass(key),
    onClick: onSelect ? () => onSelect(key) : undefined,
    role: 'button',
    tabIndex: 0,
    onKeyDown: onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(key); } } : undefined,
    'aria-label': labelFor ? labelFor(key) : key,
    'aria-pressed': selected === key,
  });

  return (
    <svg viewBox="0 0 220 460" className={styles.svg} aria-hidden={zones.length === 0}>
      <defs>
        <clipPath id={clipId('neck')}><path d={fig.neck} /></clipPath>
        <clipPath id={clipId('torso')}><path d={fig.torso} /></clipPath>
        <clipPath id={clipId('arms')}><path d={fig.arms} /></clipPath>
        <clipPath id={clipId('legs')}><path d={fig.legs} /></clipPath>
      </defs>

      {/* Cuerpo base */}
      {fig.hair && <path className={styles.hair} d={fig.hair} />}
      <path className={styles.base} d={fig.neck} />
      <ellipse className={styles.base} cx={fig.head.cx} cy={fig.head.cy} rx={fig.head.rx} ry={fig.head.ry} />
      <path className={styles.base} d={fig.legs} />
      <path className={styles.base} d={fig.arms} />
      <path className={styles.base} d={fig.torso} />

      {/* Zonas tocables, recortadas al contorno que les corresponde */}
      {ZONE_BANDS.filter((b) => zones.includes(b.key)).map((b) => (
        <g key={b.key} clipPath={`url(#${clipId(b.clip)})`}>
          <rect {...zoneProps(b.key)} x="20" y={b.y} width="180" height={b.h} />
        </g>
      ))}
    </svg>
  );
}

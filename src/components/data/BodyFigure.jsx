import React from 'react';
import styles from './BodyFigure.module.css';

// Silueta corporal interactiva de la vista de progreso del gimnasio. Dibuja una figura frontal
// (hombre o mujer) y superpone zonas tocables solo para las medidas corporales que la compañía
// tiene configuradas: las bandas del torso van recortadas al contorno (clipPath) y las
// extremidades son su propia zona. La zona seleccionada pulsa en el color primario.
//
// Props: sex ('M'|'F'), zones (keys de medidas corporales disponibles), selected (key),
// withData (keys que ya tienen mediciones), onSelect(key), labelFor(key).

// Geometría por sexo (viewBox 0 0 220 460, eje en x=110). La mujer lleva hombros más angostos,
// cintura más marcada y cadera más ancha; el resto de la retícula de zonas es compartida.
const FIGURES = {
  M: {
    torso: 'M 62 78 L 158 78 C 156 110 150 140 142 165 C 140 180 146 195 148 210 L 148 228 Q 110 246 72 228 L 72 210 C 74 195 80 180 78 165 C 70 140 64 110 62 78 Z',
    upperArm: { x: 38, y: 86, w: 19, h: 78 },
    forearm: { x: 35, y: 166, w: 16, h: 62 },
    hand: { cx: 43, cy: 238, r: 7 },
    hair: false,
  },
  F: {
    torso: 'M 70 78 L 150 78 C 149 108 143 135 136 160 C 133 175 146 192 152 210 L 152 228 Q 110 246 68 228 L 68 210 C 74 192 87 175 84 160 C 77 135 71 108 70 78 Z',
    upperArm: { x: 44, y: 86, w: 17, h: 76 },
    forearm: { x: 41, y: 164, w: 15, h: 62 },
    hand: { cx: 48, cy: 236, r: 6.5 },
    hair: true,
  },
};

// Bandas del torso por medida (recortadas al contorno del torso).
const TORSO_BANDS = [
  { key: 'shoulders', y: 78, h: 20 },
  { key: 'chest', y: 98, h: 30 },
  { key: 'abdomen', y: 128, h: 27 },
  { key: 'waist', y: 155, h: 26 },
  { key: 'hip', y: 181, h: 26 },
  { key: 'glute', y: 207, h: 28 },
];

// Extremidades (par izquierdo/derecho espejado sobre x=110) y cuello.
const LEGS = {
  thigh: { x: 76, y: 232, w: 30, h: 98, rx: 15 },
  calf: { x: 82, y: 332, w: 22, h: 84, rx: 11 },
};

const mirrored = (r) => ({ ...r, x: 220 - r.x - r.w });

/** Claves de medidas que la figura sabe ubicar en el cuerpo. */
export const BODY_FIGURE_KEYS = ['neck', 'shoulders', 'chest', 'abdomen', 'waist', 'hip', 'glute', 'bicep', 'forearm', 'thigh', 'calf'];

export function BodyFigure({ sex = 'M', zones = [], selected = '', withData = [], onSelect, labelFor }) {
  const fig = FIGURES[sex] || FIGURES.M;
  const clipId = React.useId();
  const has = (key) => zones.includes(key);
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

  const armR = mirrored(fig.upperArm);
  const foreR = mirrored(fig.forearm);

  return (
    <svg viewBox="0 0 220 460" className={styles.svg} aria-hidden={zones.length === 0}>
      <defs>
        <clipPath id={clipId}><path d={fig.torso} /></clipPath>
      </defs>

      {/* Cuerpo base */}
      {fig.hair && <circle className={styles.hair} cx="110" cy="40" r="27" />}
      {fig.hair && <rect className={styles.hair} x="84" y="42" width="12" height="44" rx="6" />}
      {fig.hair && <rect className={styles.hair} x="124" y="42" width="12" height="44" rx="6" />}
      <circle className={styles.base} cx="110" cy="38" r="21" />
      <rect className={styles.base} x="98" y="54" width="24" height="24" rx="6" />
      <path className={styles.base} d={fig.torso} />
      <rect className={styles.base} x={fig.upperArm.x} y={fig.upperArm.y} width={fig.upperArm.w} height={fig.upperArm.h} rx={fig.upperArm.w / 2} />
      <rect className={styles.base} x={armR.x} y={armR.y} width={armR.w} height={armR.h} rx={armR.w / 2} />
      <rect className={styles.base} x={fig.forearm.x} y={fig.forearm.y} width={fig.forearm.w} height={fig.forearm.h} rx={fig.forearm.w / 2} />
      <rect className={styles.base} x={foreR.x} y={foreR.y} width={foreR.w} height={foreR.h} rx={foreR.w / 2} />
      <circle className={styles.base} cx={fig.hand.cx} cy={fig.hand.cy} r={fig.hand.r} />
      <circle className={styles.base} cx={220 - fig.hand.cx} cy={fig.hand.cy} r={fig.hand.r} />
      {[LEGS.thigh, mirrored(LEGS.thigh), LEGS.calf, mirrored(LEGS.calf)].map((r, i) => (
        <rect key={i} className={styles.base} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx} />
      ))}
      <ellipse className={styles.base} cx="91" cy="428" rx="14" ry="9" />
      <ellipse className={styles.base} cx="129" cy="428" rx="14" ry="9" />

      {/* Zonas tocables */}
      {has('neck') && <rect {...zoneProps('neck')} x="96" y="52" width="28" height="28" rx="7" />}
      <g clipPath={`url(#${clipId})`}>
        {TORSO_BANDS.filter((b) => has(b.key)).map((b) => (
          <rect key={b.key} {...zoneProps(b.key)} x="40" y={b.y} width="140" height={b.h} />
        ))}
      </g>
      {has('bicep') && (
        <g>
          <rect {...zoneProps('bicep')} x={fig.upperArm.x} y={fig.upperArm.y} width={fig.upperArm.w} height={fig.upperArm.h} rx={fig.upperArm.w / 2} />
          <rect {...zoneProps('bicep')} x={armR.x} y={armR.y} width={armR.w} height={armR.h} rx={armR.w / 2} />
        </g>
      )}
      {has('forearm') && (
        <g>
          <rect {...zoneProps('forearm')} x={fig.forearm.x} y={fig.forearm.y} width={fig.forearm.w} height={fig.forearm.h} rx={fig.forearm.w / 2} />
          <rect {...zoneProps('forearm')} x={foreR.x} y={foreR.y} width={foreR.w} height={foreR.h} rx={foreR.w / 2} />
        </g>
      )}
      {has('thigh') && (
        <g>
          <rect {...zoneProps('thigh')} x={LEGS.thigh.x} y={LEGS.thigh.y} width={LEGS.thigh.w} height={LEGS.thigh.h} rx={LEGS.thigh.rx} />
          <rect {...zoneProps('thigh')} x={mirrored(LEGS.thigh).x} y={LEGS.thigh.y} width={LEGS.thigh.w} height={LEGS.thigh.h} rx={LEGS.thigh.rx} />
        </g>
      )}
      {has('calf') && (
        <g>
          <rect {...zoneProps('calf')} x={LEGS.calf.x} y={LEGS.calf.y} width={LEGS.calf.w} height={LEGS.calf.h} rx={LEGS.calf.rx} />
          <rect {...zoneProps('calf')} x={mirrored(LEGS.calf).x} y={LEGS.calf.y} width={LEGS.calf.w} height={LEGS.calf.h} rx={LEGS.calf.rx} />
        </g>
      )}
    </svg>
  );
}

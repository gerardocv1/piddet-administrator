import React from 'react';
import s from './DaysRing.module.css';

// Anillo de días restantes: cuenta regresiva del período. Lo usa la tarjeta del plan del socio y
// la pantalla de la entrada (más grande). La parte llena son los días que quedan; los colores del
// trazo salen de --ring-value / --ring-track, que cada superficie fija sobre sus tokens.

const RING_R = 48;
const RING_C = 2 * Math.PI * RING_R;

export function DaysRing({ days, fraction, size = 116, unit, className }) {
  const offset = RING_C * (1 - Math.min(1, Math.max(0, Number(fraction) || 0)));
  const label = unit ?? (days === 1 ? 'día' : 'días');
  return (
    <div className={[s.ring, size > 116 ? s.ringLarge : '', className].filter(Boolean).join(' ')} style={undefined}>
      <svg width={size} height={size} viewBox="0 0 116 116" aria-hidden="true">
        <circle cx="58" cy="58" r={RING_R} className={s.ringTrack} />
        <circle
          cx="58" cy="58" r={RING_R}
          className={s.ringValue}
          strokeDasharray={RING_C.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
          transform="rotate(-90 58 58)"
        />
      </svg>
      <div className={s.ringCenter}>
        <span className={s.ringDays}>{days}</span>
        <span className={s.ringUnit}>{label}</span>
      </div>
    </div>
  );
}

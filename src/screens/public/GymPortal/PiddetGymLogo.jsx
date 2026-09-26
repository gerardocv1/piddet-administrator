import React from 'react';
import s from './PiddetGymLogo.module.css';

// Marca de la entrada de gimnasios: la pesita en una placa naranja, "piddet" en el naranja de la
// plataforma y "gym" en una placa blanca con la letra oscura, separado. Es texto (Baloo 2, --font-logo), no imagen: se ve nítido en
// cualquier pantalla y hereda el tamaño que le dé quien lo use (`size`: sm | md | lg).
export function PiddetGymLogo({ size = 'md', className = '' }) {
  return (
    <span className={[s.logo, s[size], className].filter(Boolean).join(' ')} role="img" aria-label="piddet gym">
      <span className={s.badge} aria-hidden="true">
        <svg viewBox="0 0 32 32" className={s.dumbbell} focusable="false">
          {/* discos y barra de la pesita, inclinada como si se estuviera levantando */}
          <g transform="rotate(-30 16 16)">
            <rect x="3" y="10" width="4" height="12" rx="1.6" />
            <rect x="7.5" y="7.5" width="4" height="17" rx="1.6" />
            <rect x="11.5" y="14.2" width="9" height="3.6" rx="1.2" />
            <rect x="20.5" y="7.5" width="4" height="17" rx="1.6" />
            <rect x="25" y="10" width="4" height="12" rx="1.6" />
          </g>
        </svg>
      </span>
      <span className={s.word} aria-hidden="true">
        <span className={s.piddet}>piddet</span>
        <span className={s.gym}>gym</span>
      </span>
    </span>
  );
}

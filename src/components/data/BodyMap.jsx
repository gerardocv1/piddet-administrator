import React from 'react';
import styles from './BodyMap.module.css';

// Mapa corporal de la vista de progreso del gimnasio: las siluetas ilustradas del proyecto
// (public/gym/*, hombre/mujer, de frente y de perfil) con un punto tocable sobre cada músculo
// medible. Solo aparecen los puntos de las medidas que la compañía tiene configuradas; el
// seleccionado se resalta con su etiqueta, y los que ya tienen mediciones se pintan más firmes.
//
// Props: sex ('M'|'F'), zones (keys de medidas corporales disponibles), selected (key),
// withData (keys con mediciones), onSelect(key), labelFor(key).

const IMG = {
  M: { front: '/gym/man-front.png', side: '/gym/man-sideways.png' },
  F: { front: '/gym/women-front.png', side: '/gym/women-sideways.png' },
};

const VIEW_LABEL = { front: 'Frente', side: 'Perfil' };

// Posición de cada punto en porcentaje de la imagen (x, y). Un músculo puede aparecer en ambas
// vistas (seleccionarlo resalta sus dos puntos); el glúteo solo se ve de perfil.
const DOTS = {
  M: {
    front: {
      neck: [50, 18], shoulders: [29, 21], chest: [42, 27], bicep: [19.5, 31.5],
      forearm: [14.5, 44.5], abdomen: [50, 35.5], waist: [50, 41.5], hip: [50, 47],
      thigh: [40, 58], calf: [38, 76],
    },
    side: {
      neck: [53, 17], chest: [36, 27], abdomen: [38, 36], waist: [42, 41.5],
      glute: [69, 46], hip: [52, 47.5], thigh: [52, 58], calf: [60, 75],
    },
  },
  F: {
    front: {
      neck: [50, 17.5], shoulders: [29, 20.5], chest: [42, 27], bicep: [20.5, 31.5],
      forearm: [15.5, 44], abdomen: [50, 35.5], waist: [50, 41], hip: [50, 47.5],
      thigh: [40, 58], calf: [38, 76],
    },
    side: {
      neck: [55, 16.5], chest: [36, 28], abdomen: [40, 36.5], waist: [42, 41],
      glute: [70, 47], hip: [54, 47.5], thigh: [54, 58], calf: [60, 75],
    },
  },
};

/** Claves de medidas que el mapa corporal sabe ubicar. */
export const BODY_MAP_KEYS = Array.from(new Set(
  Object.values(DOTS).flatMap((views) => Object.values(views).flatMap((dots) => Object.keys(dots))),
));

export function BodyMap({ sex = 'M', zones = [], selected = '', withData = [], onSelect, labelFor }) {
  const imgs = IMG[sex] || IMG.M;
  const dots = DOTS[sex] || DOTS.M;

  const dotClass = (key) => [
    styles.dot,
    withData.includes(key) ? styles.dotData : '',
    selected === key ? styles.dotSelected : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.wrap}>
      {['front', 'side'].map((view) => (
        <figure key={view} className={styles.figure}>
          <div className={styles.canvas}>
            {/* El perfil de la mujer viene mirando al lado contrario que el del hombre: se
                espeja para que ambos miren igual y el glúteo quede atrás. Los puntos se
                posicionan sobre el lienzo (no sobre la imagen), así no se espejan. */}
            <img src={imgs[view]} alt=""
              className={[styles.img, sex === 'F' && view === 'side' ? styles.mirror : ''].filter(Boolean).join(' ')}
              draggable={false} />
            {Object.entries(dots[view])
              .filter(([key]) => zones.includes(key))
              .map(([key, [x, y]]) => {
                const label = labelFor ? labelFor(key) : key;
                return (
                  <button key={key} type="button"
                    className={dotClass(key)}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={label}
                    aria-label={label}
                    aria-pressed={selected === key}
                    onClick={onSelect ? () => onSelect(key) : undefined}>
                    <span className={styles.dotCore} aria-hidden="true" />
                    <span className={styles.tag}>{label}</span>
                  </button>
                );
              })}
          </div>
          <figcaption className={styles.caption}>{VIEW_LABEL[view]}</figcaption>
        </figure>
      ))}
    </div>
  );
}

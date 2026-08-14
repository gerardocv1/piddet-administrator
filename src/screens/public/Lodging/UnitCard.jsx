import React from 'react';
import { reservationMoney } from '../../../lib/reservationLabels.js';
import s from './UnitCard.module.css';

// Texto de capacidad para el visitante: cuántas personas cubre la tarifa y cuántas caben máximo.
export const capacityText = (unit) => {
  const cap = Number(unit.capacity) || 1;
  const included = Number(unit.included_guests) || cap;
  if (included >= cap) return `Hasta ${cap} persona${cap === 1 ? '' : 's'}`;
  return `${included} persona${included === 1 ? '' : 's'} · hasta ${cap}`;
};

// Tarjeta pública de una unidad reservable (portada y listado de hospedaje). Enlace nativo porque
// las vistas públicas viven fuera del router.
//
// `compact` es la variante en fila (miniatura + datos) que usa la portada: ahí el hospedaje es un
// avance entre otras secciones y no debe acaparar la pantalla. El listado usa la variante grande.
export function UnitCard({ unit, companyUsername, compact = false }) {
  const href = `/${encodeURIComponent(companyUsername)}/hospedaje/${unit.id}`;

  if (compact) {
    return (
      <a className={s.row} href={href}>
        <span className={s.rowThumb}>
          {unit.cover_thumbnail_url || unit.cover_url ? (
            <img src={unit.cover_thumbnail_url || unit.cover_url} alt={unit.name} loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <i className="fas fa-bed" />
          )}
        </span>
        <span className={s.rowInfo}>
          <span className={s.rowName}>{unit.name}</span>
          <span className={s.rowMeta}>
            {unit.type_name ? `${unit.type_name} · ` : ''}{capacityText(unit)}
          </span>
          <span className={s.rowPrice}>
            <strong>{reservationMoney(unit.base_price_per_night)}</strong> / noche
          </span>
        </span>
        <i className={`fas fa-chevron-right ${s.rowArrow}`} />
      </a>
    );
  }

  return (
    <a className={s.card} href={href}>
      <div className={s.cover}>
        {unit.cover_url ? (
          <img src={unit.cover_url} alt={unit.name} loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <span className={s.coverFallback}><i className="fas fa-bed" /></span>
        )}
      </div>

      <div className={s.body}>
        {unit.type_name && <span className={s.type}>{unit.type_name}</span>}
        <h3 className={s.name}>{unit.name}</h3>
        <p className={s.meta}><i className="fas fa-users" /> {capacityText(unit)}</p>
        <p className={s.price}>
          <strong>{reservationMoney(unit.base_price_per_night)}</strong>
          <span> / noche</span>
        </p>
      </div>
    </a>
  );
}

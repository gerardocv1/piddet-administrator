import React from 'react';
import { BODY_MAP_DOTS, BODY_MAP_IMAGES } from '../../../components';
import { formatDayMonth, formatShortDate } from '../../../lib/dates.js';
import { CalendarIcon } from './icons.jsx';
import {
  bodyMassIndex, defaultFocus, fmtDelta, fmtNumber, measureDeltaText, measureValueText,
  readMeasures, sparkPoints,
} from './gymPortalData.js';
import s from './GymPortalMeasures.module.css';

// Medidas del socio: franja de peso / IMC / grasa, la silueta (la misma del panel, hombre o
// mujer) con un punto por cada músculo medido, el detalle con su evolución y la lista completa.

const VIEWS = [
  { key: 'front', label: 'Frente' },
  { key: 'side', label: 'Perfil' },
];

function StatCard({ label, value, unit, note, noteTone, highlight }) {
  return (
    <div className={[s.stat, highlight ? s.statHighlight : ''].filter(Boolean).join(' ')}>
      <span className={s.statLabel}>{label}</span>
      <span className={s.statValue}>
        {value}
        {unit && <span className={s.statUnit}>{unit}</span>}
      </span>
      {note && <span className={[s.statNote, noteTone ? s[`note_${noteTone}`] : ''].filter(Boolean).join(' ')}>{note}</span>}
    </div>
  );
}

function Sparkline({ values }) {
  const pts = sparkPoints(values);
  if (!pts.length) return null;
  const last = pts[pts.length - 1];
  return (
    <svg className={s.spark} width="132" height="52" viewBox="0 0 132 52" aria-hidden="true">
      {pts.length > 1 && <polyline className={s.sparkLine} points={pts.map((p) => p.join(',')).join(' ')} />}
      <circle className={s.sparkDot} cx={last[0]} cy={last[1]} r="4.5" />
    </svg>
  );
}

function BodyFigure({ sex, view, zones, selected, onSelect, measures }) {
  const images = BODY_MAP_IMAGES[sex] || BODY_MAP_IMAGES.M;
  const dots = (BODY_MAP_DOTS[sex] || BODY_MAP_DOTS.M)[view];
  const visible = Object.entries(dots).filter(([key]) => zones.includes(key));
  const focus = dots[selected];
  const focusMeasure = measures.find((m) => m.key === selected);

  return (
    <div className={[s.figure, view === 'side' ? s.figureSide : ''].filter(Boolean).join(' ')}>
      <img
        className={[s.silhouette, sex === 'F' && view === 'side' ? s.mirror : ''].filter(Boolean).join(' ')}
        src={images[view]}
        alt={view === 'front' ? 'Silueta de frente' : 'Silueta de perfil'}
        draggable={false}
      />
      {visible.map(([key, [x, y]]) => {
        const m = measures.find((it) => it.key === key);
        return (
          <button
            key={key}
            type="button"
            className={[s.dot, key === selected ? s.dotOn : ''].filter(Boolean).join(' ')}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelect(key)}
            aria-label={m ? m.label : key}
            aria-pressed={key === selected}
          />
        );
      })}
      {focus && focusMeasure && (
        <div className={s.pill} style={{ left: `calc(${focus[0]}% + 16px)`, top: `${focus[1]}%` }} aria-hidden="true">
          {focusMeasure.label} · {fmtNumber(focusMeasure.last)} {focusMeasure.unit}
        </div>
      )}
    </div>
  );
}

export function GymPortalMeasures({ data, gymName }) {
  const measurements = data.measurements || {};
  const member = data.member || {};
  const measures = React.useMemo(() => readMeasures(measurements), [measurements]);
  const byKey = React.useMemo(() => Object.fromEntries(measures.map((m) => [m.key, m])), [measures]);

  const sex = member.sex === 'F' ? 'F' : 'M';
  const zonesFor = React.useCallback(
    (v) => Object.keys((BODY_MAP_DOTS[sex] || BODY_MAP_DOTS.M)[v]).filter((key) => byKey[key]),
    [sex, byKey],
  );

  const [view, setView] = React.useState('front');
  const [selected, setSelected] = React.useState(() => defaultFocus(zonesFor('front')) || defaultFocus(zonesFor('side')));
  const zones = zonesFor(view);
  const hasBody = zonesFor('front').length > 0 || zonesFor('side').length > 0;

  const changeView = (next) => {
    setView(next);
    const nextZones = zonesFor(next);
    if (!nextZones.includes(selected)) setSelected(defaultFocus(nextZones));
  };

  // Si en la vista inicial no hay puntos pero sí de perfil, se arranca de perfil.
  React.useEffect(() => {
    if (!zonesFor('front').length && zonesFor('side').length) setView('side');
  }, [zonesFor]);

  const weight = byKey.weight;
  const fat = byKey.body_fat_pct || null;
  const muscle = byKey.muscle_mass || null;
  const bmi = weight ? bodyMassIndex(weight.last, member.height_cm) : null;
  const third = fat || muscle;

  const current = byKey[selected];
  const count = Number(measurements.checkins_count) || 0;
  const last = measurements.last_checkin;

  return (
    <>
      <div className={s.head}>
        <div className={s.headText}>
          <span className={s.eyebrow}>{gymName}</span>
          <h1 className={s.title}>Tus medidas</h1>
          {last && (
            <span className={s.meta}>
              Última toma: {formatShortDate(last.measured_at)}{last.measured_by_name ? ` · por ${last.measured_by_name}` : ''}
            </span>
          )}
        </div>
        {count > 0 && (
          <span className={s.count}>
            <CalendarIcon size={14} className={s.countIcon} />
            {count} {count === 1 ? 'toma' : 'tomas'}
          </span>
        )}
      </div>

      {!measures.length ? (
        <section className={s.empty} aria-label="Sin medidas">
          <h2 className={s.h2}>Aún no tienes medidas</h2>
          <p className={s.emptyText}>
            Cuando te tomen las medidas en el gimnasio las verás aquí, con tu evolución toma a toma.
            Pídele a tu entrenador la primera.
          </p>
        </section>
      ) : (
        <>
          {(weight || third) && (
            <div className={[s.stats, s[`stats_${[weight, bmi, third].filter(Boolean).length}`]].join(' ')}>
              {weight && (
                <StatCard
                  highlight
                  label="Peso"
                  value={fmtNumber(weight.last)}
                  unit={weight.unit}
                  note={weight.delta != null ? `${fmtDelta(weight.delta)} ${weight.unit}` : null}
                />
              )}
              {bmi && (
                <StatCard
                  label="IMC"
                  value={fmtNumber(bmi.value)}
                  note={bmi.label}
                  noteTone={bmi.healthy ? 'success' : 'warning'}
                />
              )}
              {third && (
                <StatCard
                  label={third.key === 'body_fat_pct' ? 'Grasa' : 'Músculo'}
                  value={fmtNumber(third.last)}
                  unit={third.unit}
                  note={measureDeltaText(third) || null}
                  noteTone="info"
                />
              )}
            </div>
          )}

          {hasBody && (
            <section aria-label="Análisis corporal" className={s.body}>
              <div className={s.bodyHead}>
                <h2 className={s.h2}>Análisis corporal</h2>
                <div className={s.segment} role="group" aria-label="Vista">
                  {VIEWS.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      className={[s.segmentBtn, view === v.key ? s.segmentOn : ''].filter(Boolean).join(' ')}
                      aria-pressed={view === v.key}
                      disabled={!zonesFor(v.key).length}
                      onClick={() => changeView(v.key)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={s.stage}>
                <BodyFigure sex={sex} view={view} zones={zones} selected={selected} onSelect={setSelected} measures={measures} />
              </div>

              {current && (
                <div className={s.detail} aria-live="polite">
                  <div className={s.detailText}>
                    <span className={s.detailLabel}>{current.label}{current.sided ? ' · derecho' : ''}</span>
                    <span className={s.detailValue}>
                      {fmtNumber(current.last)}
                      <span className={s.detailUnit}>{current.unit}</span>
                    </span>
                    <span className={s.detailDelta}>
                      {current.delta != null
                        ? `${measureDeltaText(current)} desde el ${formatDayMonth(current.prevDate)}`
                        : `Primera toma: ${formatDayMonth(current.lastDate)}`}
                    </span>
                  </div>
                  <Sparkline values={current.values} />
                </div>
              )}
              <p className={s.hint}>Toca un punto para ver esa medida y su evolución.</p>
            </section>
          )}

          <section aria-label="Todas las medidas" className={s.all}>
            <h2 className={[s.h2, s.allTitle].join(' ')}>Todas las medidas</h2>
            <ul className={s.rows}>
              {measures.map((m) => (
                <li key={m.key} className={s.row}>
                  <span className={s.rowLabel}>{m.label}</span>
                  <span className={s.rowValue}>{measureValueText(m)}</span>
                  <span className={s.rowDelta}>{measureDeltaText(m)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}

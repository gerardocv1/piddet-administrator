import React from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import styles from './DatePicker.module.css';

const parseIsoDate = (iso) => {
  if (!iso) return undefined;
  const [y, m, d] = String(iso).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};

const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const DATE_FMT = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' });
const formatDate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return DATE_FMT.format(new Date(y, m - 1, d));
};

const PANEL_HEIGHT = 340;

/**
 * Selector de un rango de fechas (entrada → salida) con un solo calendario. Mantiene el panel
 * abierto mientras se elige el rango y lo cierra al completarlo. El panel usa position:fixed para
 * escapar del overflow de la Card contenedora.
 *
 * Props:
 *   label, icon, min?
 *   value: { from, to } con fechas ISO (o strings vacías)
 *   onChange({ from, to }) con fechas ISO; `to` puede ser '' mientras se elige
 */
export function DateRangePicker({ label, icon, value, onChange, min }) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState(null);
  // ¿El usuario ya empezó a elegir en esta apertura del panel? Mientras sea false el calendario
  // no muestra nada seleccionado, para que el primer clic no se lea como "mover el final".
  const [drafting, setDrafting] = React.useState(false);
  const triggerRef = React.useRef(null);

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const openUp = rect.bottom + PANEL_HEIGHT > window.innerHeight && rect.top > PANEL_HEIGHT;
    setCoords({
      left: rect.left,
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
    });
  };

  const close = () => {
    setOpen(false);
    setDrafting(false);
  };

  const toggle = () => {
    if (open) { close(); return; }
    place();
    setDrafting(false);
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return undefined;
    const onScroll = () => place();
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const committed = { from: parseIsoDate(value?.from), to: parseIsoDate(value?.to) };
  // Sin `drafting` el calendario va sin selección: el primer clic define SIEMPRE la entrada.
  const selected = drafting ? committed : undefined;

  const handleSelect = (range) => {
    const from = range?.from ? toIsoDate(range.from) : '';
    const to = range?.to ? toIsoDate(range.to) : '';
    setDrafting(true);
    onChange({ from, to });
    // Rango completo (y con al menos una noche): cierra el panel.
    if (from && to && from !== to) close();
  };

  const stepHint = !drafting || !value?.from
    ? 'Elige la fecha de entrada'
    : 'Ahora elige la fecha de salida';

  const disabledDays = min ? { before: parseIsoDate(min) } : undefined;
  const hasRange = value?.from && value?.to;
  const rangeLabel = value?.from
    ? (hasRange ? `${formatDate(value.from)} → ${formatDate(value.to)}` : `${formatDate(value.from)} → …`)
    : 'Selecciona las fechas';

  return (
    <div className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <button ref={triggerRef} type="button" onClick={toggle}
        className={[styles.trigger, value?.from ? '' : styles.empty].filter(Boolean).join(' ')}>
        {icon && <i className={`${icon} ${styles.triggerIcon}`} />}
        <span className={styles.triggerText}>{rangeLabel}</span>
        <i className={`fas fa-chevron-down ${styles.triggerCaret}`} />
      </button>
      {open && coords && (
        <>
          <div onClick={close} className={styles.scrim} />
          <div className={styles.panel} style={{ left: coords.left, top: coords.top, bottom: coords.bottom }}>
            <p className={styles.panelHint}>{stepHint}</p>
            <DayPicker
              mode="range"
              locale={es}
              selected={selected}
              onSelect={handleSelect}
              defaultMonth={committed.from}
              disabled={disabledDays}
              min={1}
            />
          </div>
        </>
      )}
    </div>
  );
}

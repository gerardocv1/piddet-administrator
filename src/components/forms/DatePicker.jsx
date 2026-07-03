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

const DATE_FMT = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
const formatDate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return DATE_FMT.format(new Date(y, m - 1, d));
};

const PANEL_HEIGHT = 320; // altura estimada del calendario, para decidir si abre hacia arriba

/**
 * Selector de una sola fecha con calendario react-day-picker. Al elegir un día se aplica y
 * cierra de inmediato (sin botón "Aplicar"). El panel se posiciona con position:fixed para no
 * quedar recortado por el overflow de la Card contenedora.
 *
 * Props: label, icon, value (ISO string), onChange(isoString), max?, min?
 *   variant: 'input' (formulario, por defecto) | 'chip' (filtros)
 */
export function DatePicker({ label, icon, value, onChange, max, min, variant = 'input' }) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState(null);
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

  const toggle = () => {
    if (!open) place();
    setOpen((o) => !o);
  };

  React.useEffect(() => {
    if (!open) return undefined;
    const onScroll = () => place();
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const handleSelect = (date) => {
    if (!date) return;
    onChange(toIsoDate(date));
    setOpen(false);
  };

  const disabledDays = max || min
    ? {
      ...(max ? { after: parseIsoDate(max) } : {}),
      ...(min ? { before: parseIsoDate(min) } : {}),
    }
    : undefined;

  const selected = parseIsoDate(value);

  const trigger = variant === 'chip' ? (
    <button ref={triggerRef} type="button" onClick={toggle}
      className={[styles.chip, value ? styles.active : ''].filter(Boolean).join(' ')}>
      {icon && <i className={`${icon} ${styles.chipIcon}`} />}
      {value ? formatDate(value) : label}
      <i className={`fas fa-chevron-down ${styles.chipCaret}`} />
    </button>
  ) : (
    <button ref={triggerRef} type="button" onClick={toggle}
      className={[styles.trigger, value ? '' : styles.empty].filter(Boolean).join(' ')}>
      {icon && <i className={`${icon} ${styles.triggerIcon}`} />}
      <span className={styles.triggerText}>{value ? formatDate(value) : 'Selecciona una fecha'}</span>
      <i className={`fas fa-chevron-down ${styles.triggerCaret}`} />
    </button>
  );

  const panel = open && coords && (
    <>
      <div onClick={() => setOpen(false)} className={styles.scrim} />
      <div className={styles.panel} style={{ left: coords.left, top: coords.top, bottom: coords.bottom }}>
        <DayPicker
          mode="single"
          locale={es}
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          disabled={disabledDays}
        />
      </div>
    </>
  );

  if (variant === 'chip') {
    return <>{trigger}{panel}</>;
  }

  return (
    <div className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      {trigger}
      {panel}
    </div>
  );
}

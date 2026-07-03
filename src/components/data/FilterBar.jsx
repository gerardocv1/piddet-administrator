import React from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { useIsMobile } from '../../lib/useIsMobile.js';
import styles from './FilterBar.module.css';

/**
 * FilterBar — barra de filtros responsive inspirada en patrones de e-commerce
 * (MercadoLibre / Airbnb): pocos filtros = dropdowns inline; muchos filtros o
 * móvil = botón "Filtros" → modal/bottom-sheet que ACUMULA selecciones en
 * borrador y se aplican todas de una vez. Chips de aplicados removibles.
 *
 * filters: [{ key, label, icon?, type: 'select'|'multi'|'toggle'|'date', options?: [{value,label}], placeholder?, max?, min? }]
 * values:  objeto controlado { key: string | string[] | boolean }
 * onChange(nextValues): se llama al APLICAR (no en cada cambio del borrador).
 *
 * El tipo 'date' se muestra siempre inline como un control con calendario nativo
 * (clic en todo el botón abre el picker); no entra al modal ni genera chips.
 *
 * El tipo 'daterange' es un ÚNICO control inline para un rango de fechas (calendario de
 * react-day-picker en un popover): `{ key, type: 'daterange', label, icon?, fromKey, toKey, max?, min? }`.
 * Lee/escribe DOS claves de `values` (fromKey/toKey); al aplicar, onChange recibe ambas.
 *
 * En el modal, un filtro 'select' con muchas opciones (más de SELECTOR_OPTIONS_THRESHOLD)
 * se pinta como selector nativo en vez de píldoras (`placeholder` = etiqueta del vacío).
 */

// Desde cuántas opciones un 'select' del modal deja de ser píldoras y pasa a selector nativo.
const SELECTOR_OPTIONS_THRESHOLD = 10;
export function FilterBar({
  filters = [],
  values = {},
  onChange,
  searchable = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar…',
  inlineThreshold = 3,
  resultCount,
  actions,
}) {
  const isMobile = useIsMobile();
  const dateFilters = filters.filter((f) => f.type === 'date' || f.type === 'daterange');
  const panelFilters = filters.filter((f) => f.type !== 'date' && f.type !== 'daterange');
  const useModal = isMobile || panelFilters.length > inlineThreshold;

  const [openKey, setOpenKey] = React.useState(null);   // popover inline abierto
  const [modalOpen, setModalOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(values);

  const active = countActive(panelFilters, values);

  const commit = (next) => { onChange && onChange(next); };
  const setOne = (key, val) => commit({ ...values, [key]: val });

  const openModal = () => { setDraft(values); setModalOpen(true); };
  const applyModal = () => { commit(draft); setModalOpen(false); };
  const clearDraft = () => setDraft({});

  const removeChip = (key, val) => {
    const cur = values[key];
    if (Array.isArray(cur)) setOne(key, cur.filter((v) => v !== val));
    else setOne(key, Array.isArray(values[key]) ? [] : undefined);
  };
  const clearAll = () => {
    const cleared = { ...values };
    panelFilters.forEach((f) => { cleared[f.key] = f.type === 'multi' ? [] : f.type === 'toggle' ? false : undefined; });
    commit(cleared);
  };

  const chips = buildChips(panelFilters, values);

  return (
    <div className={styles.root}>
      {/* Barra de herramientas */}
      <div className={styles.bar}>
        {searchable && (
          <div className={styles.search}>
            <i className="fas fa-search" />
            <input value={searchValue} onChange={(e) => onSearchChange && onSearchChange(e.target.value)} placeholder={searchPlaceholder} />
          </div>
        )}

        {dateFilters.map((f) => (f.type === 'daterange' ? (
          <DateRangeFilter key={f.key} filter={f} from={values[f.fromKey]} to={values[f.toKey]}
            onChange={(from, to) => commit({ ...values, [f.fromKey]: from, [f.toKey]: to })} />
        ) : (
          <DateFilter key={f.key} filter={f} value={values[f.key]} onChange={(v) => setOne(f.key, v)} />
        )))}

        {!useModal && panelFilters.map((f) => (
          <InlineDropdown key={f.key} filter={f} value={values[f.key]} open={openKey === f.key}
            onToggle={() => setOpenKey(openKey === f.key ? null : f.key)}
            onClose={() => setOpenKey(null)} onApply={(v) => { setOne(f.key, v); setOpenKey(null); }} />
        ))}

        {useModal && panelFilters.length > 0 && (
          <button onClick={openModal} aria-label="Abrir filtros" className={[styles.filterBtn, active ? styles.active : ''].filter(Boolean).join(' ')}>
            <i className="fas fa-sliders" />
            Filtros
            {active > 0 && <span className={styles.count}>{active}</span>}
          </button>
        )}

        <div className={styles.spacer} />
        {actions}
      </div>

      {/* Chips de filtros aplicados */}
      {chips.length > 0 && (
        <div className={styles.chips}>
          {chips.map((c) => (
            <span key={c.key + c.value} className={styles.chip}>
              {c.groupLabel && <span className={styles.group}>{c.groupLabel}:</span>}
              {c.label}
              <button onClick={() => removeChip(c.key, c.value)} aria-label={`Quitar ${c.label}`} className={styles.chipRemove}>
                <i className="fas fa-times" />
              </button>
            </span>
          ))}
          <button onClick={clearAll} className={styles.clearAll}>Limpiar todo</button>
        </div>
      )}

      {/* Modal / bottom-sheet con borrador */}
      {modalOpen && (
        <FilterSheet isMobile={isMobile} filters={panelFilters} draft={draft} setDraft={setDraft}
          onClose={() => setModalOpen(false)} onApply={applyModal} onClear={clearDraft}
          activeCount={countActive(filters, draft)} resultCount={resultCount} />
      )}
    </div>
  );
}

/* ---------- Dropdown inline (escritorio, pocos filtros) ---------- */
function InlineDropdown({ filter, value, open, onToggle, onClose, onApply }) {
  const summary = summaryText(filter, value);
  const has = isActive(filter, value);
  const [local, setLocal] = React.useState(value);
  React.useEffect(() => { if (open) setLocal(value); }, [open]);

  if (filter.type === 'toggle') {
    return (
      <button onClick={() => onApply(!value)} className={[styles.chipBtn, has ? styles.active : ''].filter(Boolean).join(' ')}>
        {filter.icon && <i className={`${filter.icon} ${styles.ico}`} />}
        {filter.label}
        <i className={`${value ? 'fas fa-check' : 'fas fa-chevron-down'} ${styles.caret}`} />
      </button>
    );
  }

  return (
    <div className={styles.popover}>
      <button onClick={onToggle} className={[styles.chipBtn, has ? styles.active : ''].filter(Boolean).join(' ')}>
        {filter.icon && <i className={`${filter.icon} ${styles.ico}`} />}
        {has ? summary : filter.label}
        <i className={`fas fa-chevron-down ${styles.caret}`} />
      </button>
      {open && (
        <>
          <div onClick={onClose} className={styles.scrim} />
          <div className={styles.menu}>
            <div className={styles.menuList}>
              {filter.options.map((o) => {
                const sel = filter.type === 'multi' ? (local || []).includes(o.value) : local === o.value;
                return (
                  <OptionRow key={o.value} label={o.label} selected={sel} multi={filter.type === 'multi'}
                    onClick={() => {
                      if (filter.type === 'multi') {
                        const arr = local || [];
                        setLocal(arr.includes(o.value) ? arr.filter((v) => v !== o.value) : [...arr, o.value]);
                      } else { onApply(o.value); }
                    }} />
                );
              })}
            </div>
            {filter.type === 'multi' && (
              <div className={styles.menuFooter}>
                <button onClick={() => setLocal([])} className={styles.ghostBtn}>Limpiar</button>
                <button onClick={() => onApply(local)} className={styles.solidBtn}>Aplicar</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Filtro de fecha (siempre inline; abre el calendario nativo) ---------- */
function DateFilter({ filter, value, onChange }) {
  const ref = React.useRef(null);
  const openPicker = () => {
    const el = ref.current;
    if (!el) return;
    try { el.showPicker(); } catch { el.focus(); } // fallback si el navegador no soporta showPicker
  };
  return (
    <button type="button" onClick={openPicker} className={[styles.chipBtn, styles.dateBtn].join(' ')}>
      {filter.icon && <i className={`${filter.icon} ${styles.ico}`} />}
      {value ? formatDate(value) : filter.label}
      <i className={`fas fa-chevron-down ${styles.caret}`} />
      <input ref={ref} type="date" className={styles.dateNative} tabIndex={-1} aria-label={filter.label}
        value={value || ''} max={filter.max} min={filter.min}
        onChange={(e) => { if (e.target.value) onChange(e.target.value); }} />
    </button>
  );
}

const DATE_FMT = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
function formatDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return DATE_FMT.format(new Date(y, m - 1, d));
}

/* ---------- Filtro de rango de fechas (un solo control; calendario en popover) ---------- */
const parseIsoDate = (iso) => {
  if (!iso) return undefined;
  const [y, m, d] = String(iso).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};
const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function DateRangeFilter({ filter, from, to, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState(undefined); // borrador { from: Date, to?: Date }

  // Al abrir, el borrador parte del rango aplicado.
  React.useEffect(() => {
    if (open) setRange(from ? { from: parseIsoDate(from), to: parseIsoDate(to) } : undefined);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = () => {
    if (!range?.from) return;
    // Un solo día también es un rango válido (from = to).
    onChange(toIsoDate(range.from), toIsoDate(range.to ?? range.from));
    setOpen(false);
  };

  const label = from && to
    ? (from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`)
    : filter.label;

  const disabledDays = filter.max || filter.min
    ? {
      ...(filter.max ? { after: parseIsoDate(filter.max) } : {}),
      ...(filter.min ? { before: parseIsoDate(filter.min) } : {}),
    }
    : undefined;

  return (
    <div className={styles.popover}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={[styles.chipBtn, styles.rangeBtn, from && to ? styles.active : ''].filter(Boolean).join(' ')}>
        {filter.icon && <i className={`${filter.icon} ${styles.ico}`} />}
        {label}
        <i className={`fas fa-chevron-down ${styles.caret}`} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className={styles.scrim} />
          <div className={[styles.menu, styles.rangeMenu].join(' ')}>
            <DayPicker
              mode="range"
              locale={es}
              selected={range}
              onSelect={setRange}
              defaultMonth={range?.from}
              disabled={disabledDays}
            />
            <div className={styles.menuFooter}>
              <button onClick={() => setRange(undefined)} className={styles.ghostBtn}>Limpiar</button>
              <button onClick={apply} disabled={!range?.from} className={styles.solidBtn}>Aplicar</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Modal / bottom-sheet (muchos filtros o móvil) ---------- */
function FilterSheet({ isMobile, filters, draft, setDraft, onClose, onApply, onClear, activeCount, resultCount }) {
  const setVal = (key, val) => setDraft({ ...draft, [key]: val });

  return (
    <div onClick={onClose} className={styles.sheetOverlay} data-mobile={isMobile}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" className={styles.sheetPanel} data-mobile={isMobile}>
        {/* Encabezado */}
        <div className={styles.sheetHead}>
          <h3 className={styles.sheetTitle}>Filtros</h3>
          <button onClick={onClose} aria-label="Cerrar" className={styles.close}><i className="fas fa-times" /></button>
        </div>

        {/* Grupos */}
        <div className={styles.sheetBody}>
          {filters.map((f) => (
            <div key={f.key} className={styles.group}>
              <div className={styles.groupTitle}>
                {f.icon && <i className={f.icon} />}{f.label}
              </div>
              {f.type === 'toggle' ? (
                <OptionRow label={f.onLabel || 'Activado'} selected={!!draft[f.key]} multi onClick={() => setVal(f.key, !draft[f.key])} />
              ) : f.type === 'select' && f.options.length > SELECTOR_OPTIONS_THRESHOLD ? (
                <div className={styles.selectWrap}>
                  <select
                    className={styles.select}
                    value={draft[f.key] ?? ''}
                    onChange={(e) => setVal(f.key, e.target.value || undefined)}
                    aria-label={f.label}
                  >
                    <option value="">{f.placeholder || 'Todos'}</option>
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <i className={`fas fa-chevron-down ${styles.selectChevron}`} aria-hidden="true" />
                </div>
              ) : (
                <div className={styles.pillWrap}>
                  {f.options.map((o) => {
                    const sel = f.type === 'multi' ? (draft[f.key] || []).includes(o.value) : draft[f.key] === o.value;
                    return (
                      <button key={o.value} onClick={() => {
                        if (f.type === 'multi') {
                          const arr = draft[f.key] || [];
                          setVal(f.key, arr.includes(o.value) ? arr.filter((v) => v !== o.value) : [...arr, o.value]);
                        } else { setVal(f.key, sel ? undefined : o.value); }
                      }} className={[styles.pill, sel ? styles.selected : ''].filter(Boolean).join(' ')}>{o.label}{sel && <i className="fas fa-check" />}</button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pie: limpiar + aplicar */}
        <div className={styles.sheetFooter}>
          <button onClick={onClear} className={styles.clearBtn}>Limpiar{activeCount > 0 ? ` (${activeCount})` : ''}</button>
          <div style={{ flex: 1 }} />
          <button onClick={onApply} className={styles.applyBtn}>
            {resultCount != null ? `Ver ${resultCount} resultados` : 'Aplicar filtros'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-componentes / helpers ---------- */
function OptionRow({ label, selected, multi, onClick }) {
  return (
    <button onClick={onClick} className={styles.optionRow}>
      <span className={[styles.optionMark, multi ? styles.multi : styles.single, selected ? styles.selected : ''].filter(Boolean).join(' ')}>{selected && <i className="fas fa-check" />}</span>
      {label}
    </button>
  );
}

function isActive(f, v) {
  if (f.type === 'multi') return Array.isArray(v) && v.length > 0;
  if (f.type === 'toggle') return !!v;
  return v != null && v !== '';
}
function countActive(filters, values) {
  return filters.reduce((n, f) => n + (isActive(f, values[f.key]) ? 1 : 0), 0);
}
function summaryText(f, v) {
  if (f.type === 'multi') { const arr = v || []; if (!arr.length) return f.label; const first = labelOf(f, arr[0]); return arr.length > 1 ? `${first} +${arr.length - 1}` : first; }
  if (f.type === 'select') return labelOf(f, v) || f.label;
  return f.label;
}
function labelOf(f, val) { const o = (f.options || []).find((x) => x.value === val); return o ? o.label : val; }
function buildChips(filters, values) {
  const chips = [];
  filters.forEach((f) => {
    const v = values[f.key];
    // trim(): las opciones de un selector pueden venir indentadas (árbol); el chip muestra el nombre limpio.
    if (f.type === 'multi' && Array.isArray(v)) v.forEach((val) => chips.push({ key: f.key, value: val, label: String(labelOf(f, val)).trim(), groupLabel: f.label }));
    else if (f.type === 'select' && v != null && v !== '') chips.push({ key: f.key, value: v, label: String(labelOf(f, v)).trim(), groupLabel: f.label });
    else if (f.type === 'toggle' && v) chips.push({ key: f.key, value: true, label: f.onLabel || f.label, groupLabel: null });
  });
  return chips;
}

import React from 'react';
import { useIsMobile } from '../../lib/useIsMobile.js';

/**
 * FilterBar — barra de filtros responsive inspirada en patrones de e-commerce
 * (MercadoLibre / Airbnb): pocos filtros = dropdowns inline; muchos filtros o
 * móvil = botón "Filtros" → modal/bottom-sheet que ACUMULA selecciones en
 * borrador y se aplican todas de una vez. Chips de aplicados removibles.
 *
 * filters: [{ key, label, icon?, type: 'select'|'multi'|'toggle', options?: [{value,label}] }]
 * values:  objeto controlado { key: string | string[] | boolean }
 * onChange(nextValues): se llama al APLICAR (no en cada cambio del borrador).
 */
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
  const useModal = isMobile || filters.length > inlineThreshold;

  const [openKey, setOpenKey] = React.useState(null);   // popover inline abierto
  const [modalOpen, setModalOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(values);

  const active = countActive(filters, values);

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
    const cleared = {};
    filters.forEach((f) => { cleared[f.key] = f.type === 'multi' ? [] : f.type === 'toggle' ? false : undefined; });
    commit(cleared);
  };

  const chips = buildChips(filters, values);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Barra de herramientas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {searchable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '0 0.85rem', height: 42, minWidth: 200, flex: isMobile ? '1 1 100%' : '0 1 260px', background: 'var(--surface-card)', color: 'var(--gray-400)' }}>
            <i className="fas fa-search" style={{ fontSize: '0.8rem' }} />
            <input value={searchValue} onChange={(e) => onSearchChange && onSearchChange(e.target.value)} placeholder={searchPlaceholder}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-base)', fontFamily: 'var(--font-sans)', color: 'var(--gray-700)', width: '100%' }} />
          </div>
        )}

        {!useModal && filters.map((f) => (
          <InlineDropdown key={f.key} filter={f} value={values[f.key]} open={openKey === f.key}
            onToggle={() => setOpenKey(openKey === f.key ? null : f.key)}
            onClose={() => setOpenKey(null)} onApply={(v) => { setOne(f.key, v); setOpenKey(null); }} />
        ))}

        {useModal && (
          <button onClick={openModal} aria-label="Abrir filtros"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 1rem', border: `1px solid ${active ? 'var(--color-primary)' : 'var(--border-input)'}`, borderRadius: 'var(--radius)', background: active ? 'var(--color-primary-050)' : 'var(--gray-100)', color: active ? 'var(--color-primary-700)' : 'var(--gray-700)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', fontWeight: 600, cursor: 'pointer', flex: isMobile ? '1 1 auto' : '0 0 auto', justifyContent: 'center' }}>
            <i className="fas fa-sliders" />
            Filtros
            {active > 0 && <span style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-pill)', fontSize: '0.66rem', fontWeight: 700, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{active}</span>}
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0 }} />
        {actions}
      </div>

      {/* Chips de filtros aplicados */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {chips.map((c) => (
            <span key={c.key + c.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 30, padding: '0 6px 0 11px', background: 'var(--color-primary-050)', border: '1px solid var(--color-primary-100)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-sm)', color: 'var(--color-primary-700)', fontWeight: 600 }}>
              {c.groupLabel && <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}>{c.groupLabel}:</span>}
              {c.label}
              <button onClick={() => removeChip(c.key, c.value)} aria-label={`Quitar ${c.label}`}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--color-primary-700)', cursor: 'pointer', fontSize: '0.7rem' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-100)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <i className="fas fa-times" />
              </button>
            </span>
          ))}
          <button onClick={clearAll} style={{ border: 'none', background: 'none', color: 'var(--gray-500)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '0 4px' }}>Limpiar todo</button>
        </div>
      )}

      {/* Modal / bottom-sheet con borrador */}
      {modalOpen && (
        <FilterSheet isMobile={isMobile} filters={filters} draft={draft} setDraft={setDraft}
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
      <button onClick={() => onApply(!value)}
        style={chipBtn(has)}>
        {filter.icon && <i className={filter.icon} style={{ fontSize: '0.8rem' }} />}
        {filter.label}
        <i className={value ? 'fas fa-check' : 'fas fa-chevron-down'} style={{ fontSize: '0.6rem', opacity: 0.7 }} />
      </button>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onToggle} style={chipBtn(has)}>
        {filter.icon && <i className={filter.icon} style={{ fontSize: '0.8rem' }} />}
        {has ? summary : filter.label}
        <i className="fas fa-chevron-down" style={{ fontSize: '0.6rem', opacity: 0.7 }} />
      </button>
      {open && (
        <>
          <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 41, minWidth: 220, background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ maxHeight: 260, overflowY: 'auto', padding: 6 }}>
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
              <div style={{ display: 'flex', gap: 8, padding: 8, borderTop: '1px solid var(--border-color)' }}>
                <button onClick={() => setLocal([])} style={ghostBtn}>Limpiar</button>
                <button onClick={() => onApply(local)} style={solidBtn}>Aplicar</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Modal / bottom-sheet (muchos filtros o móvil) ---------- */
function FilterSheet({ isMobile, filters, draft, setDraft, onClose, onApply, onClear, activeCount, resultCount }) {
  const setVal = (key, val) => setDraft({ ...draft, [key]: val });

  const panel = isMobile
    ? { position: 'fixed', left: 0, right: 0, bottom: 0, maxHeight: '88vh', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }
    : { position: 'relative', width: '100%', maxWidth: 460, maxHeight: '85vh', borderRadius: 'var(--radius-lg)' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--overlay-bg)', zIndex: 1050, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...panel }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border-color)', flex: '0 0 auto' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>Filtros</h3>
          <button onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: '1.1rem' }}><i className="fas fa-times" /></button>
        </div>

        {/* Grupos */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1.4rem 1rem', WebkitOverflowScrolling: 'touch' }}>
          {filters.map((f) => (
            <div key={f.key} style={{ padding: '1rem 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--gray-800)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                {f.icon && <i className={f.icon} style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }} />}{f.label}
              </div>
              {f.type === 'toggle' ? (
                <OptionRow label={f.onLabel || 'Activado'} selected={!!draft[f.key]} multi onClick={() => setVal(f.key, !draft[f.key])} />
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {f.options.map((o) => {
                    const sel = f.type === 'multi' ? (draft[f.key] || []).includes(o.value) : draft[f.key] === o.value;
                    return (
                      <button key={o.value} onClick={() => {
                        if (f.type === 'multi') {
                          const arr = draft[f.key] || [];
                          setVal(f.key, arr.includes(o.value) ? arr.filter((v) => v !== o.value) : [...arr, o.value]);
                        } else { setVal(f.key, sel ? undefined : o.value); }
                      }} style={pill(sel)}>{o.label}{sel && <i className="fas fa-check" style={{ fontSize: '0.62rem' }} />}</button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pie: limpiar + aplicar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.9rem 1.4rem', borderTop: '1px solid var(--border-color)', background: 'var(--gray-100)', flex: '0 0 auto' }}>
          <button onClick={onClear} style={{ border: 'none', background: 'none', color: 'var(--gray-600)', fontWeight: 600, fontSize: 'var(--text-base)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Limpiar{activeCount > 0 ? ` (${activeCount})` : ''}</button>
          <div style={{ flex: 1 }} />
          <button onClick={onApply} style={{ height: 44, padding: '0 1.5rem', border: 'none', borderRadius: 'var(--radius)', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-base)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
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
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 44, padding: '0 8px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--gray-700)', textAlign: 'left' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-100)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      <span style={{ width: 18, height: 18, flex: '0 0 auto', borderRadius: multi ? 'var(--radius-sm)' : '50%', border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--border-input)'}`, background: selected ? 'var(--color-primary)' : 'var(--surface-card)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem' }}>{selected && <i className="fas fa-check" />}</span>
      {label}
    </button>
  );
}

function chipBtn(active) {
  return { display: 'inline-flex', alignItems: 'center', gap: 7, height: 42, padding: '0 0.9rem', border: `1px solid ${active ? 'var(--color-primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius)', background: active ? 'var(--color-primary-050)' : 'var(--surface-card)', color: active ? 'var(--color-primary-700)' : 'var(--gray-700)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
}
const ghostBtn = { flex: 1, height: 36, border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', background: 'var(--surface-card)', color: 'var(--gray-600)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)' };
const solidBtn = { flex: 1, height: 36, border: 'none', borderRadius: 'var(--radius)', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)' };
function pill(sel) {
  return { display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 38, padding: '0 0.9rem', border: `1px solid ${sel ? 'var(--color-primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-pill)', background: sel ? 'var(--color-primary-050)' : 'var(--surface-card)', color: sel ? 'var(--color-primary-700)' : 'var(--gray-700)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer' };
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
    if (f.type === 'multi' && Array.isArray(v)) v.forEach((val) => chips.push({ key: f.key, value: val, label: labelOf(f, val), groupLabel: f.label }));
    else if (f.type === 'select' && v != null && v !== '') chips.push({ key: f.key, value: v, label: labelOf(f, v), groupLabel: f.label });
    else if (f.type === 'toggle' && v) chips.push({ key: f.key, value: true, label: f.onLabel || f.label, groupLabel: null });
  });
  return chips;
}

import React from 'react';
import { Spinner } from '../core/Spinner.jsx';
import s from './Autocomplete.module.css';

/**
 * Autocomplete — selector con búsqueda asíncrona (type-ahead).
 *
 * Pensado para reemplazar a `Select` cuando el catálogo es grande o vive en el backend: el usuario
 * escribe, a partir de `minChars` se dispara la consulta (con debounce), se muestra un cargador y
 * luego un desplegable con las coincidencias para elegir una. Genérico y controlado.
 *
 * Props:
 *  - fetcher(query) → Promise<item[]>   (obligatorio) consulta asíncrona; devuelve los ítems crudos.
 *  - value: item | null                 (controlado) ítem seleccionado.
 *  - onChange(item | null)              notifica selección/limpieza.
 *  - getOptionLabel(item) → string      texto visible de cada opción (def. item.label ?? item.name).
 *  - getOptionValue(item) → string|num  clave estable de cada opción (def. item.value ?? item.id).
 *  - renderOption(item) → node          (opcional) contenido personalizado de la fila.
 *  - minChars = 3, debounce = 300       umbral de disparo y espera entre teclas (ms).
 *  - creatable + onCreate(text)         (opcional) muestra una fila "Crear «texto»" cuando lo
 *                                       escrito no coincide exactamente con ninguna opción.
 *  - label, icon, hint, error, placeholder, disabled, autoFocus, clearable
 *  - loadingText, noResultsText, minCharsText
 */
export function Autocomplete({
  fetcher,
  value = null,
  onChange,
  getOptionLabel = (o) => (o?.label ?? o?.name ?? ''),
  getOptionValue = (o) => (o?.value ?? o?.id),
  renderOption,
  minChars = 3,
  debounce = 300,
  creatable = false,
  onCreate,
  label,
  icon = 'fas fa-magnifying-glass',
  hint,
  error,
  placeholder = 'Escribe para buscar…',
  disabled = false,
  autoFocus = false,
  clearable = true,
  loadingText = 'Buscando…',
  noResultsText = 'Sin resultados',
  minCharsText,
}) {
  const [text, setText] = React.useState(value ? getOptionLabel(value) : '');
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState(false);
  const [hi, setHi] = React.useState(-1); // índice resaltado para el teclado

  const rootRef = React.useRef(null);
  const reqId = React.useRef(0);
  const timer = React.useRef(null);

  // Refleja una selección establecida desde fuera (valor inicial, reseteo del formulario…).
  React.useEffect(() => {
    if (value) setText(getOptionLabel(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cierra el desplegable al hacer clic fuera.
  React.useEffect(() => {
    const onDocDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const runSearch = (query) => {
    const id = ++reqId.current;
    setLoading(true);
    setFetchError(false);
    Promise.resolve()
      .then(() => fetcher(query))
      .then((res) => { if (id === reqId.current) { setOptions(Array.isArray(res) ? res : []); setHi(-1); } })
      .catch(() => { if (id === reqId.current) { setOptions([]); setFetchError(true); } })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  };

  const onInput = (e) => {
    const v = e.target.value;
    setText(v);
    setOpen(true);
    if (value) onChange && onChange(null); // editar el texto invalida la selección previa
    clearTimeout(timer.current);
    const q = v.trim();
    if (q.length < minChars) {
      reqId.current++; // descarta respuestas en vuelo
      setOptions([]);
      setLoading(false);
      setFetchError(false);
      return;
    }
    timer.current = setTimeout(() => runSearch(q), debounce);
  };

  const select = (opt) => {
    onChange && onChange(opt);
    setText(getOptionLabel(opt));
    setOptions([]);
    setOpen(false);
    setHi(-1);
  };

  const clear = () => {
    onChange && onChange(null);
    setText('');
    setOptions([]);
    setFetchError(false);
    setOpen(false);
    reqId.current++;
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { if (hi >= 0 && options[hi]) { e.preventDefault(); select(options[hi]); } }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const q = text.trim();
  const showMenu = open && !disabled && q.length > 0;
  const belowMin = q.length < minChars;
  const minMsg = minCharsText || `Escribe al menos ${minChars} caracteres para buscar.`;

  // Fila "Crear «texto»": solo si lo escrito no coincide exactamente con ninguna opción.
  const exactMatch = options.some((o) => getOptionLabel(o).trim().toLowerCase() === q.toLowerCase());
  const showCreate = creatable && !!onCreate && !belowMin && !loading && !fetchError && q.length > 0 && !exactMatch;

  const create = () => {
    onCreate(q);
    setOptions([]);
    setOpen(false);
    setHi(-1);
  };

  return (
    <div className={s.field} ref={rootRef}>
      {label && <span className={s.label}>{label}</span>}
      <div className={[s.wrap, error ? s.wrapError : '', disabled ? s.disabled : ''].filter(Boolean).join(' ')}>
        {icon && <i className={`${icon} ${s.icon}`} aria-hidden="true" />}
        <input
          type="text"
          className={s.input}
          value={text}
          onChange={onInput}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={showMenu}
          aria-autocomplete="list"
          autoComplete="off"
        />
        {loading && <Spinner size="sm" />}
        {!loading && clearable && text && (
          <button type="button" className={s.clear} onClick={clear} aria-label="Limpiar" tabIndex={-1}>
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        )}
      </div>

      {showMenu && (
        <div className={s.menu} role="listbox">
          {belowMin ? (
            <div className={s.state}>{minMsg}</div>
          ) : loading ? (
            <div className={s.state}><Spinner size="sm" label={loadingText} /></div>
          ) : fetchError ? (
            <div className={[s.state, s.error].join(' ')}><i className="fas fa-triangle-exclamation" /> No se pudo buscar.</div>
          ) : options.length === 0 && !showCreate ? (
            <div className={s.state}>{noResultsText}</div>
          ) : (
            <div className={s.list}>
              {options.map((opt, i) => (
                <button
                  type="button"
                  key={getOptionValue(opt) ?? i}
                  role="option"
                  aria-selected={i === hi}
                  className={[s.option, i === hi ? s.active : ''].filter(Boolean).join(' ')}
                  onMouseEnter={() => setHi(i)}
                  onMouseDown={(e) => e.preventDefault()} /* evita blur antes del click */
                  onClick={() => select(opt)}
                >
                  {renderOption ? renderOption(opt) : <span className={s.optLabel}>{getOptionLabel(opt)}</span>}
                </button>
              ))}
              {showCreate && (
                <button
                  type="button"
                  className={[s.option, s.createOption].join(' ')}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={create}
                >
                  <i className="fas fa-plus" aria-hidden="true" />
                  <span className={s.optLabel}>Crear «{q}»</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {(hint || error) && <span className={[s.hint, error ? s.errorText : ''].filter(Boolean).join(' ')}>{error || hint}</span>}
    </div>
  );
}

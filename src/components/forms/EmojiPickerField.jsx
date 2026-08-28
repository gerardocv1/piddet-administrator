import React from 'react';
import { createPortal } from 'react-dom';
import styles from './EmojiPickerField.module.css';

// Mismo catálogo curado que ItemIconResolverImp en el backend (solo emojis de amplio soporte),
// agrupado para que el usuario reconozca de un vistazo la sección que necesita.
const GROUPS = [
  {
    label: 'Comidas rápidas',
    emojis: ['🍔', '🌭', '🍕', '🥪', '🌮', '🌯', '🥟', '🍟', '🥞', '🌽'],
  },
  {
    label: 'Platos fuertes',
    emojis: ['🍗', '🍖', '🥩', '🍢', '🍝', '🍜', '🍲', '🍛', '🍚', '🥗', '🍳', '🐟', '🦐', '🍣'],
  },
  {
    label: 'Panadería y postres',
    emojis: ['🥐', '🍞', '🍰', '🧁', '🍮', '🍦', '🍧', '🍩', '🍪', '🧇'],
  },
  {
    label: 'Bebidas',
    emojis: ['☕', '🍫', '🍵', '🥛', '🥤', '🧃', '🍋', '💧', '⚡'],
  },
  {
    label: 'Licores',
    emojis: ['🍺', '🍷', '🥂', '🍹', '🥃'],
  },
  {
    label: 'Hospedaje y recreación',
    emojis: ['🏊', '🏡', '👤', '🌙', '🅿️', '🧹', '🧺', '🛁', '🧖', '🔥', '🎉', '🧸', '⚽', '⛺'],
  },
  {
    label: 'Otros',
    emojis: ['🍽️', '📅', '🔑', '🧾', '📦', '🛠️'],
  },
];

/**
 * Campo de emoji del producto. Opcional: "Automático" (valor vacío) deja que el backend asigne
 * uno según nombre y categoría; `suggestion` muestra en vivo cuál sería ese automático mientras
 * el campo sigue vacío, para que el usuario vea qué obtendrá antes de guardar.
 */
export function EmojiPickerField({ label, hint, error, value, onChange, suggestion, suggesting }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null);
  const triggerRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const place = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 280) });
  };

  const toggle = () => { if (!open) place(); setOpen((o) => !o); };
  const close = () => setOpen(false);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!menuRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) close();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    // Captura (true) para detectar el scroll del fondo (el modal, la página) aunque no burbujee;
    // pero el scroll DENTRO del propio popover (su lista es más alta que 320px) también pasa por
    // aquí, y cerrarlo ahí sería no dejar desplazarlo nunca. Se ignora cuando el scroll ocurre
    // dentro del popover.
    const onScroll = (e) => { if (!menuRef.current?.contains(e.target)) close(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const displayEmoji = value || (suggesting ? null : suggestion?.icon) || null;
  const displayText = value
    ? null
    : suggesting
      ? 'Buscando sugerencia…'
      : suggestion?.icon
        ? `Automático: ${suggestion.icon}`
        : 'Automático';

  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.row}>
        <button type="button" ref={triggerRef} onClick={toggle}
          className={[styles.trigger, error ? styles.error : ''].filter(Boolean).join(' ')}>
          {displayEmoji ? <span className={styles.emoji}>{displayEmoji}</span> : <i className="fas fa-icons" aria-hidden="true" />}
          <span className={styles.text}>{value ? 'Elegido manualmente' : displayText}</span>
        </button>
        {value && (
          <button type="button" className={styles.clear} onClick={() => onChange('')} aria-label="Volver a automático" title="Volver a automático">
            <i className="fas fa-rotate-left" aria-hidden="true" />
          </button>
        )}
      </span>
      {(hint || error) && <span className={[styles.hint, error ? styles.errorText : ''].filter(Boolean).join(' ')}>{error || hint}</span>}

      {open && pos && createPortal(
        <div ref={menuRef} role="listbox" className={styles.popover} style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {GROUPS.map((group) => (
            <div key={group.label} className={styles.group}>
              <span className={styles.groupLabel}>{group.label}</span>
              <div className={styles.grid}>
                {group.emojis.map((emoji) => (
                  <button key={emoji} type="button" className={styles.option}
                    onClick={() => { onChange(emoji); close(); }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </label>
  );
}

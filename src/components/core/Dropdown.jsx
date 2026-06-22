import React from 'react';
import { createPortal } from 'react-dom';
import styles from './Dropdown.module.css';

/**
 * Menú desplegable de acciones. Se renderiza en un portal (position: fixed) para que no lo recorte
 * el `overflow` del contenedor (p. ej. la card de un listado). Cierra al hacer clic fuera, con
 * Escape o al desplazar.
 *
 * Props:
 *  - trigger: nodo que abre el menú (p. ej. un IconButton)
 *  - items: [{ label, icon?, onClick, variant?: 'danger', disabled? }]
 *  - align: 'end' (por defecto, alineado a la derecha del trigger) | 'start'
 */
export function Dropdown({ trigger, items = [], align = 'end', width = 210 }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null);
  const triggerRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const place = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = align === 'end' ? r.right - width : r.left;
    setPos({ top: r.bottom + 6, left: Math.min(Math.max(8, left), window.innerWidth - width - 8) });
  };

  const toggle = (e) => { e.stopPropagation(); if (!open) place(); setOpen((o) => !o); };
  const close = () => setOpen(false);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!menuRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) close();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const onMove = () => close();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  return (
    <>
      <span ref={triggerRef} className={styles.trigger} onClick={toggle}>{trigger}</span>
      {open && pos && createPortal(
        <div ref={menuRef} role="menu" className={styles.menu}
          style={{ top: pos.top, left: pos.left, width }} onClick={(e) => e.stopPropagation()}>
          {items.map((it, i) => (
            <button key={i} type="button" role="menuitem" disabled={it.disabled}
              className={[styles.item, it.variant === 'danger' ? styles.danger : ''].filter(Boolean).join(' ')}
              onClick={(e) => { e.stopPropagation(); close(); it.onClick && it.onClick(); }}>
              {it.icon && <i className={it.icon} aria-hidden="true" />}
              <span>{it.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

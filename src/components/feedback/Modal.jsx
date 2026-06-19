import React from 'react';
import { useIsMobile } from '../../lib/useIsMobile.js';

/**
 * Modal — diálogo responsive.
 *
 *  size="sm"  → confirmación: tarjeta compacta, SIEMPRE flotante centrada (también en móvil).
 *  size="md" | "lg" → crear/editar: centrado en escritorio; en móvil se convierte en
 *                     bottom-sheet que sube desde abajo (como el modal de filtros),
 *                     con barra de arrastre y botones al alcance del pulgar.
 *
 * `sheet` permite forzar/desactivar el comportamiento de hoja en móvil.
 */
const WIDTHS = { sm: 400, md: 500, lg: 600 };

export function Modal({ open = true, title, subtitle, children, footer, onClose, size = 'md', width, sheet, style = {}, ...rest }) {
  const isMobile = useIsMobile();
  if (!open) return null;

  const asSheet = (sheet != null ? sheet : size !== 'sm') && isMobile;
  const maxW = width || WIDTHS[size] || WIDTHS.md;

  const overlay = {
    position: 'fixed', inset: 0, background: 'var(--overlay-bg)', zIndex: 1050,
    display: 'flex', justifyContent: 'center',
    alignItems: asSheet ? 'flex-end' : 'center',
    padding: asSheet ? 0 : '1.5rem',
    animation: 'pdOverlayIn .18s ease',
  };
  const panel = {
    background: 'var(--surface-card)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', width: '100%',
    ...(asSheet
      ? { maxWidth: '100%', maxHeight: '90vh', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', animation: 'pdSheetUp .26s cubic-bezier(.32,.72,0,1)' }
      : { maxWidth: maxW, maxHeight: '88vh', borderRadius: 'var(--radius-lg)', animation: 'pdModalIn .22s cubic-bezier(.4,1.2,.5,1)' }),
    ...style,
  };

  return (
    <div onClick={onClose} style={overlay}>
      <style>{`
        @keyframes pdOverlayIn{from{opacity:0}to{opacity:1}}
        @keyframes pdModalIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
        @keyframes pdSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      `}</style>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={panel} {...rest}>
        {asSheet && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 2px', flex: '0 0 auto' }}>
            <span style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--gray-300)' }} />
          </div>
        )}
        {(title || onClose) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: asSheet ? '0.5rem 1.4rem 1rem' : '1.2rem 1.5rem', borderBottom: asSheet ? 'none' : '1px solid var(--border-color)', flex: '0 0 auto' }}>
          <div>
            {title && <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>{title}</h3>}
            {subtitle && <p style={{ margin: '3px 0 0', fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>{subtitle}</p>}
          </div>
            {onClose && (
              <button onClick={onClose} aria-label="Cerrar" style={{ flex: '0 0 auto', width: 34, height: 34, borderRadius: 'var(--radius)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: '1.05rem' }}>
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '1.3rem 1.5rem', color: 'var(--gray-700)', fontSize: 'var(--text-base)', lineHeight: 1.5 }}>{children}</div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: asSheet ? 'stretch' : 'flex-end', gap: '0.6rem', padding: asSheet ? '0.9rem 1.4rem calc(0.9rem + env(safe-area-inset-bottom))' : '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: asSheet ? '#fff' : 'var(--gray-100)', flex: '0 0 auto' }}>
            {asSheet
              ? React.Children.map(footer, (c) => React.isValidElement(c) ? React.cloneElement(c, { style: { flex: 1, justifyContent: 'center', ...(c.props.style || {}) } }) : c)
              : footer}
          </div>
        )}
      </div>
    </div>
  );
}

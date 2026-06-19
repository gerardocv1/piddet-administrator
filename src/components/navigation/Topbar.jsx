import React from 'react';
import { Avatar } from '../core/Avatar.jsx';
import { Notifications } from '../feedback/Notifications.jsx';

/** Barra superior flat: título + crumb, búsqueda, notificaciones y usuario.
 * `onMenu` muestra la hamburguesa (solo móvil). */
export function Topbar({ title, crumb, actions, user = {}, onMenu, theme = 'light', onToggleTheme }) {
  return (
    <header className="pd-topbar" style={{ height: 'var(--topbar-h)', flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0 2rem', background: 'var(--surface-card)', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-sans)' }}>
      <button onClick={onMenu} aria-label="Abrir menú" className="pd-hide-desktop" style={{ display: 'none', width: 38, height: 38, borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--surface-card)', color: 'var(--gray-600)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flex: '0 0 auto' }}><i className="fas fa-bars" /></button>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, minWidth: 0 }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--gray-900)', margin: 0, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
        {crumb && <span className="pd-hide-mobile" style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-400)', whiteSpace: 'nowrap', flex: '0 0 auto' }}>· {crumb}</span>}
      </div>
      <div style={{ flex: 1 }} />
      <div className="pd-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray-100)', borderRadius: 'var(--radius-pill)', padding: '0.5rem 0.95rem', minWidth: 210, color: 'var(--gray-400)' }}>
        <i className="fas fa-search" style={{ fontSize: '0.78rem' }} />
        <input placeholder="Buscar…" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-base)', fontFamily: 'var(--font-sans)', color: 'var(--gray-700)', width: '100%' }} />
      </div>
      {actions}
      <button onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        style={{ width: 38, height: 38, borderRadius: 'var(--radius)', border: 'none', background: 'transparent', color: 'var(--gray-500)', cursor: 'pointer', fontSize: '1rem', flex: '0 0 auto', transition: 'background .12s ease' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-100)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
        <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} />
      </button>
      <Notifications />
      <div className="pd-hide-mobile" style={{ width: 1, height: 26, background: 'var(--border-color)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Avatar name={user.name} size="sm" />
        <div className="pd-hide-mobile" style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-800)' }}>{user.name}</div>
          {user.role && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{user.role}</div>}
        </div>
      </div>
    </header>
  );
}

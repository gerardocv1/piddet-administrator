import React from 'react';
import { Avatar } from '../core/Avatar.jsx';
import { Notifications } from '../feedback/Notifications.jsx';
import styles from './Topbar.module.css';

/** Barra superior flat: título + crumb, búsqueda, notificaciones y usuario.
 * `onMenu` muestra la hamburguesa (solo móvil). */
export function Topbar({ title, crumb, actions, user = {}, onMenu, theme = 'light', onToggleTheme }) {
  return (
    <header className={styles.topbar}>
      <button onClick={onMenu} aria-label="Abrir menú" className={styles.menuBtn}><i className="fas fa-bars" /></button>
      <div className={styles.titleWrap}>
        <h1 className={styles.title}>{title}</h1>
        {crumb && <span className={styles.crumb}>· {crumb}</span>}
      </div>
      <div className={styles.spacer} />
      <div className={styles.search}>
        <i className="fas fa-search" />
        <input placeholder="Buscar…" />
      </div>
      {actions}
      <button onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} className={styles.themeBtn}>
        <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} />
      </button>
      <Notifications />
      <div className={styles.divider} />
      <div className={styles.user}>
        <Avatar name={user.name} size="sm" />
        <div className={styles.userText}>
          <div className={styles.userName}>{user.name}</div>
          {user.role && <div className={styles.userRole}>{user.role}</div>}
        </div>
      </div>
    </header>
  );
}

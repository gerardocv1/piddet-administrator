import React from 'react';
import { Avatar } from '../core/Avatar.jsx';
import { Notifications } from '../feedback/Notifications.jsx';
import { SessionsModal } from '../feedback/SessionsModal.jsx';
import { ChangePasswordModal } from '../feedback/ChangePasswordModal.jsx';
import styles from './Topbar.module.css';

/** Barra superior flat: título + crumb, notificaciones y menú de usuario.
 * `onMenu` muestra la hamburguesa (solo móvil). */
export function Topbar({ title, crumb, user = {}, onLogout, onMenu, theme = 'light', onToggleTheme }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [sessionsOpen, setSessionsOpen] = React.useState(false);
  const [pwdOpen, setPwdOpen] = React.useState(false);

  const openSessions = () => { setMenuOpen(false); setSessionsOpen(true); };
  const openPwd = () => { setMenuOpen(false); setPwdOpen(true); };
  const logout = () => { setMenuOpen(false); onLogout && onLogout(); };

  return (
    <header className={styles.topbar}>
      <button onClick={onMenu} aria-label="Abrir menú" className={styles.menuBtn}><i className="fas fa-bars" /></button>
      <div className={styles.titleWrap}>
        <h1 className={styles.title}>{title}</h1>
        {crumb && <span className={styles.crumb}>· {crumb}</span>}
      </div>
      <div className={styles.spacer} />
      <button onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} className={styles.themeBtn}>
        <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} />
      </button>
      <Notifications />
      <div className={styles.divider} />

      {/* Menú de usuario */}
      <div className={styles.userWrap}>
        <button type="button" className={styles.user} onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu" aria-expanded={menuOpen}>
          <Avatar name={user.name} src={user.image} size="sm" />
          <div className={styles.userText}>
            <div className={styles.userName}>{user.name}</div>
            {user.role && <div className={styles.userRole}>{user.role}</div>}
          </div>
          <i className={`fas fa-chevron-down ${styles.userChev} ${menuOpen ? styles.open : ''}`} />
        </button>

        {menuOpen && (
          <>
            <div className={styles.scrim} onClick={() => setMenuOpen(false)} />
            <div className={styles.menu} role="menu">
              <button type="button" role="menuitem" className={styles.menuItem} onClick={openSessions}>
                <i className="fas fa-clock-rotate-left" /> Mis sesiones
              </button>
              <button type="button" role="menuitem" className={styles.menuItem} onClick={openPwd}>
                <i className="fas fa-key" /> Cambiar contraseña
              </button>
              <div className={styles.menuSep} />
              <button type="button" role="menuitem" className={`${styles.menuItem} ${styles.danger}`} onClick={logout}>
                <i className="fas fa-arrow-right-from-bracket" /> Salir
              </button>
            </div>
          </>
        )}
      </div>

      {sessionsOpen && <SessionsModal open onClose={() => setSessionsOpen(false)} />}
      {pwdOpen && <ChangePasswordModal open onClose={() => setPwdOpen(false)} />}
    </header>
  );
}

import React from 'react';
import { Avatar } from '../core/Avatar.jsx';
import { Notifications } from '../feedback/Notifications.jsx';
import { SessionsModal } from '../feedback/SessionsModal.jsx';
import { ChangePasswordModal } from '../feedback/ChangePasswordModal.jsx';
import styles from './Topbar.module.css';

/**
 * Barra superior flat: título + crumb y menú de usuario.
 *
 * La barra no lleva botones sueltos: notificaciones y cambio de tema viven dentro del menú de
 * usuario, junto a sesiones y contraseña. En móvil no hay hamburguesa — la navegación es el
 * MobileDock — y la barra se funde con el fondo (ver CSS).
 */
export function Topbar({ title, crumb, user = {}, onLogout, theme = 'light', onToggleTheme }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notisOpen, setNotisOpen] = React.useState(false);
  const [sessionsOpen, setSessionsOpen] = React.useState(false);
  const [pwdOpen, setPwdOpen] = React.useState(false);

  const openSessions = () => { setMenuOpen(false); setSessionsOpen(true); };
  const openPwd = () => { setMenuOpen(false); setPwdOpen(true); };
  const openNotis = () => { setMenuOpen(false); setNotisOpen(true); };
  const toggleTheme = () => { setMenuOpen(false); onToggleTheme && onToggleTheme(); };
  const logout = () => { setMenuOpen(false); onLogout && onLogout(); };

  return (
    <header className={styles.topbar}>
      <div className={styles.titleWrap}>
        <h1 className={styles.title}>{title}</h1>
        {crumb && <span className={styles.crumb}>{crumb}</span>}
      </div>
      <div className={styles.spacer} />

      {/* Menú de usuario: concentra notificaciones, tema y cuenta, para dejar la barra limpia */}
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
              <button type="button" role="menuitem" className={styles.menuItem} onClick={openNotis}>
                <i className="far fa-bell" /> Notificaciones
              </button>
              <button type="button" role="menuitem" className={styles.menuItem} onClick={toggleTheme}>
                <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} />
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </button>
              <div className={styles.menuSep} />
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

        {/* El panel cuelga del widget de usuario: su acceso ya no ocupa un botón en la barra. */}
        <Notifications showTrigger={false} open={notisOpen} onOpenChange={setNotisOpen} />
      </div>

      {sessionsOpen && <SessionsModal open onClose={() => setSessionsOpen(false)} />}
      {pwdOpen && <ChangePasswordModal open onClose={() => setPwdOpen(false)} />}
    </header>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const NAV = [
  { to: '/', label: 'Inicio', icon: 'fas fa-house', end: true },
  { section: 'Oferta' },
  { to: '/productos', label: 'Productos', icon: 'fas fa-burger' },
  { to: '/categorias', label: 'Categorías', icon: 'fas fa-tags' },
  { to: '/toppings', label: 'Toppings', icon: 'fas fa-bacon' },
  { section: 'Operación' },
  { to: '/mesas', label: 'Mesas', icon: 'fas fa-chair', badge: 4 },
  { to: '/tiendas', label: 'Tiendas', icon: 'fas fa-store' },
  { section: 'Cuentas' },
  { to: '/usuarios', label: 'Usuarios', icon: 'fas fa-user' },
  { to: '/roles', label: 'Roles', icon: 'fas fa-user-shield' },
];

const initials = (s = '') => s.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Menú lateral oscuro fijo, con selector de EMPRESA (tenant SaaS), secciones
 * y resaltado naranja del activo. En móvil funciona como cajón deslizante. */
export function Sidebar({ onLogout, open = false, onClose, company, companies = [], onSwitchCompany }) {
  const [picker, setPicker] = React.useState(false);
  const multi = companies.length > 1;

  return (
    <nav className={[styles.sidebar, open ? styles.open : ''].filter(Boolean).join(' ')}>
      <div className={styles.head}>
        <span className={styles.logo}>pid<b>det</b></span>
        <button onClick={onClose} aria-label="Cerrar menú" className={styles.closeBtn}><i className="fas fa-times" /></button>
      </div>

      {/* ── Selector de empresa (tenant activo) ── */}
      {company && (
        <div className={styles.company}>
          <button onClick={() => setPicker((p) => !p)} aria-label="Cambiar empresa"
            className={[styles.companyBtn, multi ? styles.multi : styles.single, picker ? styles.open : ''].filter(Boolean).join(' ')}>
            <span className={styles.tile}>{initials(company.name)}</span>
            <span className={styles.companyInfo}>
              <span className={styles.companyName}>{company.name}</span>
              <span className={styles.companyMeta}>{company.plan ? `Plan ${company.plan}` : 'Empresa'}{company.tiendas != null ? ` · ${company.tiendas} tiendas` : ''}</span>
            </span>
            {multi && <i className={`fas fa-chevron-down ${styles.chev} ${picker ? styles.open : ''}`} />}
          </button>

          {picker && multi && (
            <>
              <div onClick={() => setPicker(false)} className={styles.scrim} />
              <div className={styles.picker}>
                <div className={styles.pickerLabel}>Cambiar empresa</div>
                {companies.map((c) => {
                  const cur = c.id === company.id;
                  return (
                    <button key={c.id} onClick={() => { setPicker(false); if (!cur) onSwitchCompany && onSwitchCompany(c); }}
                      className={[styles.pickerItem, cur ? styles.current : ''].filter(Boolean).join(' ')}>
                      <span className={styles.pickerTile}>{initials(c.name)}</span>
                      <span className={styles.companyInfo}>
                        <span className={styles.pickerName}>{c.name}</span>
                        <span className={styles.pickerMeta}>{c.tiendas} tiendas</span>
                      </span>
                      {cur && <i className={`fas fa-check ${styles.pickerCheck}`} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <div className={styles.nav}>
        {NAV.map((n, i) => n.section ? (
          <div key={`s${i}`} className={styles.section}>{n.section}</div>
        ) : (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={onClose}
            className={({ isActive }) => [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')}>
            <i className={`${n.icon} ${styles.icon}`} />
            <span className={styles.label}>{n.label}</span>
            {n.badge != null && <span className={styles.badge}>{n.badge}</span>}
          </NavLink>
        ))}
      </div>

      <div className={styles.foot}>
        <button onClick={onLogout} className={styles.logout}>
          <i className="fas fa-arrow-right-from-bracket" /> Salir
        </button>
      </div>
    </nav>
  );
}

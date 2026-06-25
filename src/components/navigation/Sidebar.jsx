import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { HOME_ITEM, POS_ITEM, MODULE_GROUPS, canAccess } from '../../lib/permissions/modules.js';
import { usePermissions } from '../../lib/permissions/usePermissions.js';

const initials = (s = '') => s.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Grupo desplegable del menú: el padre expande/colapsa y agrupa rutas hijas. Se abre solo
 * si alguna ruta hija está activa. */
function NavGroup({ item, onClose }) {
  const { pathname } = useLocation();
  const childActive = item.children.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`));
  const [open, setOpen] = React.useState(childActive);
  React.useEffect(() => { if (childActive) setOpen(true); }, [childActive]);

  return (
    <div className={styles.group}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className={[styles.link, styles.groupBtn, childActive ? styles.parentActive : ''].filter(Boolean).join(' ')}>
        <i className={`${item.icon} ${styles.icon}`} />
        <span className={styles.label}>{item.label}</span>
        <i className={`fas fa-chevron-down ${styles.groupChev} ${open ? styles.open : ''}`} />
      </button>
      {open && (
        <div className={styles.subnav}>
          {item.children.map((c) => (
            <NavLink key={c.to} to={c.to} onClick={onClose}
              className={({ isActive }) => [styles.sublink, isActive ? styles.active : ''].filter(Boolean).join(' ')}>
              <i className={`${c.icon} ${styles.icon}`} />
              <span className={styles.label}>{c.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

/** Menú lateral oscuro fijo, con selector de EMPRESA (tenant SaaS), secciones
 * y resaltado naranja del activo. En móvil funciona como cajón deslizante. */
export function Sidebar({ onLogout, open = false, onClose, company, companies = [], onSwitchCompany, onOpenProfile }) {
  const [picker, setPicker] = React.useState(false);
  const multi = companies.length > 1;
  const { permissions } = usePermissions();

  const openProfile = () => { onClose && onClose(); onOpenProfile && onOpenProfile(); };

  // Solo módulos con permiso; grupos sin módulos visibles se omiten (incluida su cabecera).
  // En items desplegables se filtran las rutas hijas y se descarta el padre si queda vacío.
  const groups = MODULE_GROUPS
    .map((g) => ({
      section: g.section,
      items: g.items
        .map((m) => (m.children ? { ...m, children: m.children.filter((c) => canAccess(c.to, permissions)) } : m))
        .filter((m) => (m.children ? m.children.length > 0 : canAccess(m.to, permissions))),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <nav className={[styles.sidebar, open ? styles.open : ''].filter(Boolean).join(' ')}>
      <div className={styles.head}>
        <span className={styles.logo}>pid<b>det</b></span>
        <button onClick={onClose} aria-label="Cerrar menú" className={styles.closeBtn}><i className="fas fa-times" /></button>
      </div>

      {/* ── Empresa activa: el tile abre el perfil; el chevron despliega el selector (solo multi) ── */}
      {company && (
        <div className={styles.company}>
          <div className={styles.companyRow}>
            <button onClick={openProfile} aria-label="Ver perfil de la empresa" className={styles.companyBtn}>
              <span className={[styles.tile, company.icon ? styles.tileImage : ''].filter(Boolean).join(' ')}>
                {company.icon
                  ? <img className={styles.tileImg} src={company.icon} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  : initials(company.name)}
              </span>
              <span className={styles.companyInfo}>
                <span className={styles.companyName}>{company.name}</span>
                <span className={styles.companyMeta}>{company.plan ? `Plan ${company.plan}` : 'Empresa'}{company.tiendas != null ? ` · ${company.tiendas} tiendas` : ''}</span>
              </span>
            </button>
            {multi && (
              <button onClick={() => setPicker((p) => !p)} aria-label="Cambiar empresa"
                className={[styles.companyToggle, picker ? styles.open : ''].filter(Boolean).join(' ')}>
                <i className={`fas fa-chevron-down ${styles.chev} ${picker ? styles.open : ''}`} />
              </button>
            )}
          </div>

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
                        <span className={styles.pickerMeta}>{c.tiendas != null ? `${c.tiendas} tiendas` : 'Empresa'}</span>
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
        <NavLink to={HOME_ITEM.to} end={HOME_ITEM.end} onClick={onClose}
          className={({ isActive }) => [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')}>
          <i className={`${HOME_ITEM.icon} ${styles.icon}`} />
          <span className={styles.label}>{HOME_ITEM.label}</span>
        </NavLink>
        {groups.map((g) => (
          <React.Fragment key={g.section}>
            <div className={styles.section}>{g.section}</div>
            {g.items.map((n) => (
              n.children ? (
                <NavGroup key={n.label} item={n} onClose={onClose} />
              ) : (
                <NavLink key={n.to} to={n.to} onClick={onClose}
                  className={({ isActive }) => [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')}>
                  <i className={`${n.icon} ${styles.icon}`} />
                  <span className={styles.label}>{n.label}</span>
                  {n.badge != null && <span className={styles.badge}>{n.badge}</span>}
                </NavLink>
              )
            ))}
          </React.Fragment>
        ))}
        <div className={styles.section}>Enlaces</div>
        <a href={POS_ITEM.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={styles.link}>
          <i className={`${POS_ITEM.icon} ${styles.icon}`} />
          <span className={styles.label}>{POS_ITEM.label}</span>
          <i className={`fas fa-arrow-up-right-from-square ${styles.ext}`} />
        </a>
      </div>

      <div className={styles.foot}>
        <button onClick={onLogout} className={styles.logout}>
          <i className="fas fa-arrow-right-from-bracket" /> Salir
        </button>
      </div>
    </nav>
  );
}

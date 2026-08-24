import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { HOME_ITEM, POS_ITEM, MODULE_GROUPS, canAccess } from '../../lib/permissions/modules.js';
import { usePermissions } from '../../lib/permissions/usePermissions.js';
import { useFunctionalities } from '../../lib/permissions/useFunctionalities.js';
import { useInstallPrompt } from '../../lib/pwa.js';

const initials = (s = '') => s.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const matchesRoute = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`);

/** Grupo desplegable del menú: el padre expande/colapsa y agrupa rutas hijas. Al navegar
 * solo queda abierto el grupo con la ruta activa; los demás se colapsan. */
function NavGroup({ item }) {
  const { pathname } = useLocation();
  // Entre hijos anidados (p. ej. /expenses y /expenses/summary) solo se resalta el más
  // específico, para que la subruta no marque también a su padre.
  const activeChild = item.children
    .filter((c) => matchesRoute(pathname, c.to))
    .sort((a, b) => b.to.length - a.to.length)[0];
  const childActive = Boolean(activeChild);
  const [open, setOpen] = React.useState(childActive);
  React.useEffect(() => { setOpen(childActive); }, [pathname, childActive]);

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
            <NavLink key={c.to} to={c.to}
              className={[styles.sublink, c === activeChild ? styles.active : ''].filter(Boolean).join(' ')}>
              <i className={`${c.icon} ${styles.icon}`} />
              <span className={styles.label}>{c.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

/** Menú lateral oscuro fijo, con selector de EMPRESA (tenant SaaS), secciones y resaltado
 * naranja del activo. Solo escritorio: en móvil la navegación es el MobileDock y la pantalla
 * «Más» (/more), así que el Layout ni siquiera lo monta ahí. */
export function Sidebar({ onLogout, company, companies = [], onSwitchCompany, onOpenProfile }) {
  const [picker, setPicker] = React.useState(false);
  const multi = companies.length > 1;
  const { permissions } = usePermissions();
  const { ready, activeNames } = useFunctionalities();
  const { canInstall, install } = useInstallPrompt();
  // Mientras las funcionalidades cargan se asume que NINGUNA está activa: los módulos que
  // dependen de una (p. ej. Mesas) nacen ocultos y aparecen al confirmarse, en vez de mostrarse
  // y desaparecer medio segundo después.
  const activeFunctionalities = ready ? activeNames : [];

  const openProfile = () => { onOpenProfile && onOpenProfile(); };

  // El enlace externo al POS también depende de la funcionalidad de la compañía: sin ella no se
  // muestra el enlace ni la sección «Enlaces» que lo contiene.
  const showPos = !POS_ITEM.func || activeFunctionalities.includes(POS_ITEM.func);

  // Solo módulos con permiso y funcionalidad activa; grupos sin módulos visibles se omiten
  // (incluida su cabecera). En items desplegables se filtran las rutas hijas y se descarta el
  // padre si queda vacío.
  const groups = MODULE_GROUPS
    .map((g) => ({
      section: g.section,
      items: g.items
        .map((m) => (m.children ? { ...m, children: m.children.filter((c) => canAccess(c.to, permissions, activeFunctionalities)) } : m))
        .filter((m) => (m.children ? m.children.length > 0 : canAccess(m.to, permissions, activeFunctionalities))),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <nav className={styles.sidebar}>
      <div className={styles.head}>
        <span className={styles.logo}>pid<b>det</b></span>
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
        <NavLink to={HOME_ITEM.to} end={HOME_ITEM.end}
          className={({ isActive }) => [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')}>
          <i className={`${HOME_ITEM.icon} ${styles.icon}`} />
          <span className={styles.label}>{HOME_ITEM.label}</span>
        </NavLink>
        {groups.map((g) => (
          <React.Fragment key={g.section}>
            <div className={styles.section}>{g.section}</div>
            {g.items.map((n) => (
              n.children ? (
                <NavGroup key={n.label} item={n} />
              ) : (
                <NavLink key={n.to} to={n.to}
                  className={({ isActive }) => [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')}>
                  <i className={`${n.icon} ${styles.icon}`} />
                  <span className={styles.label}>{n.label}</span>
                  {n.badge != null && <span className={styles.badge}>{n.badge}</span>}
                </NavLink>
              )
            ))}
          </React.Fragment>
        ))}
        {showPos && (
          <>
            <div className={styles.section}>Enlaces</div>
            <a href={POS_ITEM.href} target="_blank" rel="noopener noreferrer" className={styles.link}>
              <i className={`${POS_ITEM.icon} ${styles.icon}`} />
              <span className={styles.label}>{POS_ITEM.label}</span>
              <i className={`fas fa-arrow-up-right-from-square ${styles.ext}`} />
            </a>
          </>
        )}
      </div>

      <div className={styles.foot}>
        {canInstall && (
          <button onClick={install} className={[styles.logout, styles.install].join(' ')}>
            <i className="fas fa-mobile-screen-button" /> Instalar app
          </button>
        )}
        <button onClick={onLogout} className={styles.logout}>
          <i className="fas fa-arrow-right-from-bracket" /> Salir
        </button>
      </div>
    </nav>
  );
}

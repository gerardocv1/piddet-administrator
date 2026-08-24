import React from 'react';
import { NavLink, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { MODULE_GROUPS, POS_ITEM, canAccess } from '../lib/permissions/modules.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { useFunctionalities } from '../lib/permissions/useFunctionalities.js';
import { useInstallPrompt } from '../lib/pwa.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { moduleTerm, routeTerm } from '../lib/terms.js';
import styles from './MoreMenu.module.css';

const initials = (s = '') => s.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Fila del menú: icono en pastilla + etiqueta + chevron; navega a la ruta del módulo. */
function MenuRow({ item }) {
  return (
    <NavLink to={item.to} className={styles.row}>
      <span className={styles.rowIcon}><i className={item.icon} aria-hidden="true" /></span>
      <span className={styles.rowLabel}>{routeTerm(item.to, item.label)}</span>
      <i className={`fas fa-chevron-right ${styles.rowChev}`} aria-hidden="true" />
    </NavLink>
  );
}

/**
 * MoreMenu — el menú completo como pantalla propia (/more), solo móvil. Es el destino de «Más»
 * en el dock: reemplaza al cajón lateral, así el dock sigue visible abajo (con «Más» activo) y
 * desde aquí se salta a Inicio o a cualquier módulo sin cerrar nada.
 *
 * Superficie clara con acentos del color primario y el logo arriba (esta pantalla no pinta la
 * barra superior: el Layout la oculta en /more). Muestra lo mismo que el Sidebar de escritorio:
 * empresa activa (tap → perfil; con varias, selector), los módulos accesibles por sección, el
 * enlace al POS, instalar la app y salir. Permisos y funcionalidades se filtran igual que allí.
 *
 * En escritorio la ruta no existe como pantalla (el menú es el Sidebar): redirige a Inicio.
 */
export function MoreMenu() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { company, companies = [], onSwitchCompany, onLogout } = useOutletContext() ?? {};
  const { permissions } = usePermissions();
  const { ready, activeNames } = useFunctionalities();
  const { canInstall, install } = useInstallPrompt();
  const [picker, setPicker] = React.useState(false);

  if (!isMobile) return <Navigate to="/" replace />;

  // Igual que el Sidebar: mientras cargan las funcionalidades se asume que ninguna está activa.
  const activeFunctionalities = ready ? activeNames : [];
  const multi = companies.length > 1;

  // Secciones con sus módulos accesibles. Los desplegables no se aplanan del todo: conservan el
  // nombre del padre como subtítulo dentro de la tarjeta — sin él, «Reporte» de Ventas y
  // «Reporte» de Egresos serían dos filas idénticas.
  const groups = MODULE_GROUPS
    .map((g) => ({
      section: g.section,
      items: g.items
        .map((m) => (m.children
          ? { ...m, children: m.children.filter((c) => canAccess(c.to, permissions, activeFunctionalities)) }
          : m))
        .filter((m) => (m.children ? m.children.length > 0 : canAccess(m.to, permissions, activeFunctionalities))),
    }))
    .filter((g) => g.items.length > 0);

  const showPos = !POS_ITEM.func || activeFunctionalities.includes(POS_ITEM.func);

  return (
    <div className={styles.screen}>
      <header className={styles.head}>
        <span className={styles.logo}>pid<b>det</b></span>
      </header>

      {company && (
        <section className={styles.companyCard}>
          <button type="button" className={styles.companyBtn} onClick={() => navigate('/company')}
            aria-label="Ver perfil de la empresa">
            <span className={[styles.tile, company.icon ? styles.tileImage : ''].filter(Boolean).join(' ')}>
              {company.icon
                ? <img className={styles.tileImg} src={company.icon} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : initials(company.name)}
            </span>
            <span className={styles.companyInfo}>
              <span className={styles.companyName}>{company.name}</span>
              <span className={styles.companyMeta}>{company.plan ? `Plan ${company.plan}` : 'Empresa'}</span>
            </span>
            {!multi && <i className={`fas fa-chevron-right ${styles.rowChev}`} aria-hidden="true" />}
          </button>
          {multi && (
            <button type="button" onClick={() => setPicker((p) => !p)} aria-expanded={picker}
              aria-label="Cambiar empresa" className={styles.companyToggle}>
              <i className={`fas fa-chevron-down ${styles.chev} ${picker ? styles.open : ''}`} aria-hidden="true" />
            </button>
          )}
        </section>
      )}

      {picker && multi && (
        <section className={styles.picker} aria-label="Cambiar empresa">
          {companies.map((c) => {
            const cur = c.id === company.id;
            return (
              <button key={c.id} type="button" className={styles.pickerItem}
                onClick={() => { setPicker(false); if (!cur) onSwitchCompany && onSwitchCompany(c); }}>
                <span className={styles.pickerTile}>{initials(c.name)}</span>
                <span className={styles.pickerName}>{c.name}</span>
                {cur && <i className={`fas fa-check ${styles.pickerCheck}`} aria-hidden="true" />}
              </button>
            );
          })}
        </section>
      )}

      {groups.map((g) => (
        <section key={g.section} className={styles.group}>
          <h2 className={styles.section}>{g.section}</h2>
          <div className={styles.card}>
            {g.items.map((m) => (m.children ? (
              <div key={m.label} className={styles.subgroup}>
                <div className={styles.subhead}>{moduleTerm(m.label)}</div>
                {m.children.map((c) => <MenuRow key={c.to} item={c} />)}
              </div>
            ) : (
              <MenuRow key={m.to} item={m} />
            )))}
          </div>
        </section>
      ))}

      {showPos && (
        <section className={styles.group}>
          <h2 className={styles.section}>Enlaces</h2>
          <div className={styles.card}>
            <a href={POS_ITEM.href} target="_blank" rel="noopener noreferrer" className={styles.row}>
              <span className={styles.rowIcon}><i className={POS_ITEM.icon} aria-hidden="true" /></span>
              <span className={styles.rowLabel}>{POS_ITEM.label}</span>
              <i className={`fas fa-arrow-up-right-from-square ${styles.rowChev}`} aria-hidden="true" />
            </a>
          </div>
        </section>
      )}

      <section className={styles.group}>
        <div className={styles.card}>
          {canInstall && (
            <button type="button" onClick={install} className={styles.row}>
              <span className={styles.rowIcon}><i className="fas fa-mobile-screen-button" aria-hidden="true" /></span>
              <span className={styles.rowLabel}>Instalar app</span>
            </button>
          )}
          <button type="button" onClick={onLogout} className={[styles.row, styles.logout].join(' ')}>
            <span className={[styles.rowIcon, styles.logoutIcon].join(' ')}>
              <i className="fas fa-arrow-right-from-bracket" aria-hidden="true" />
            </span>
            <span className={styles.rowLabel}>Salir</span>
          </button>
        </div>
      </section>
    </div>
  );
}

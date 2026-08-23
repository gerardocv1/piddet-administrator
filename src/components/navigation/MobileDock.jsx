import React from 'react';
import { NavLink } from 'react-router-dom';
import { HOME_ITEM, MODULE_GROUPS, canAccess } from '../../lib/permissions/modules.js';
import { usePermissions } from '../../lib/permissions/usePermissions.js';
import { useFunctionalities } from '../../lib/permissions/useFunctionalities.js';
import styles from './MobileDock.module.css';

// Cuántos módulos de acceso rápido acompañan a Inicio (el resto vive tras «Más»).
const QUICK_SLOTS = 2;

/**
 * MobileDock — navegación principal en móvil: píldora flotante translúcida sobre el contenido
 * (línea nativa del catálogo visual). Reemplaza a la hamburguesa: Inicio + los primeros módulos
 * accesibles + «Más», que abre el cajón lateral con el menú completo.
 *
 * El ítem activo se expande con tinte y etiqueta; los inactivos son solo icono (con aria-label).
 * Solo se muestra en móvil (CSS) y respeta permisos y funcionalidades igual que el Sidebar.
 */
export function MobileDock({ onMore, moreOpen = false }) {
  const { permissions } = usePermissions();
  const { ready, activeNames } = useFunctionalities();
  // Igual que el Sidebar: mientras cargan las funcionalidades se asume que ninguna está activa.
  const activeFunctionalities = ready ? activeNames : [];

  // Primeros módulos hoja accesibles, en el orden del menú (los desplegables aportan sus hijas).
  const quick = React.useMemo(() => {
    const leaves = MODULE_GROUPS.flatMap((g) =>
      g.items.flatMap((m) => (m.children ? m.children : [m])));
    return leaves
      .filter((m) => m.to && canAccess(m.to, permissions, activeFunctionalities))
      .slice(0, QUICK_SLOTS);
  }, [permissions, activeFunctionalities]);

  const linkClass = ({ isActive }) =>
    [styles.item, isActive && !moreOpen ? styles.active : ''].filter(Boolean).join(' ');

  return (
    <nav className={styles.dock} aria-label="Navegación principal">
      <NavLink to={HOME_ITEM.to} end className={linkClass} aria-label={HOME_ITEM.label}>
        <i className={HOME_ITEM.icon} aria-hidden="true" />
        <span className={styles.label}>{HOME_ITEM.label}</span>
      </NavLink>
      {quick.map((m) => (
        <NavLink key={m.to} to={m.to} className={linkClass} aria-label={m.label}>
          <i className={m.icon} aria-hidden="true" />
          <span className={styles.label}>{m.label}</span>
        </NavLink>
      ))}
      <button type="button"
        className={[styles.item, moreOpen ? styles.active : ''].filter(Boolean).join(' ')}
        aria-label="Más opciones" aria-expanded={moreOpen}
        onClick={onMore}>
        <i className="fas fa-ellipsis" aria-hidden="true" />
        <span className={styles.label}>Más</span>
      </button>
    </nav>
  );
}

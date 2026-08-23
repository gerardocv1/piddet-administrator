import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { HOME_ITEM, MODULE_GROUPS, canAccess } from '../../lib/permissions/modules.js';
import { usePermissions } from '../../lib/permissions/usePermissions.js';
import { useFunctionalities } from '../../lib/permissions/useFunctionalities.js';
import styles from './MobileDock.module.css';

// Secciones cuyos módulos son "los principales" y merecen atajo en el dock; el resto del menú
// (Configuración, enlaces) vive tras «Más».
const PRIMARY_SECTIONS = ['Oferta', 'Operación'];

// Cuántos módulos principales acompañan a Inicio. Con más, el dock deja de caber en un teléfono.
const DOCK_SLOTS = 4;

// ¿La ruta activa cae dentro de este destino? (el detalle /expenses/8 sigue siendo Egresos)
const isUnder = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`);

/**
 * MobileDock — navegación principal en móvil: píldora flotante translúcida sobre el contenido
 * (línea nativa del catálogo visual). Reemplaza a la hamburguesa.
 *
 * Lleva Inicio + los primeros módulos principales (los de Oferta y Operación) como iconos, y
 * «Más», que abre el cajón lateral con el menú completo. De un módulo desplegable se toma su
 * icono y su etiqueta, y se navega a su primera ruta accesible; queda marcado activo mientras
 * se esté en cualquiera de sus pantallas. Todos los destinos son solo icono (el nombre lo da
 * `aria-label`); el activo se distingue por el tinte. Respeta permisos y funcionalidades igual
 * que el Sidebar.
 */
export function MobileDock({ onMore, moreOpen = false }) {
  const { pathname } = useLocation();
  const { permissions } = usePermissions();
  const { ready, activeNames } = useFunctionalities();
  // Igual que el Sidebar: mientras cargan las funcionalidades se asume que ninguna está activa.
  const activeFunctionalities = ready ? activeNames : [];

  const items = React.useMemo(() => {
    const primary = MODULE_GROUPS.filter((g) => PRIMARY_SECTIONS.includes(g.section));
    // Si las secciones se renombran, es preferible un dock con los primeros módulos que uno vacío.
    const groups = primary.length ? primary : MODULE_GROUPS;

    return groups
      .flatMap((g) => g.items)
      .map((m) => {
        // De un desplegable se muestran icono y etiqueta del padre; el destino es su primera
        // ruta accesible, y cualquiera de ellas lo marca activo.
        const routes = (m.children ? m.children : [m])
          .filter((c) => c.to && canAccess(c.to, permissions, activeFunctionalities))
          .map((c) => c.to);
        return routes.length ? { label: m.label, icon: m.icon, to: routes[0], routes } : null;
      })
      .filter(Boolean)
      .slice(0, DOCK_SLOTS);
  }, [permissions, activeFunctionalities]);

  const itemClass = (active) =>
    [styles.item, active && !moreOpen ? styles.active : ''].filter(Boolean).join(' ');

  return (
    <nav className={styles.dock} aria-label="Navegación principal">
      <NavLink to={HOME_ITEM.to} end aria-label={HOME_ITEM.label}
        className={({ isActive }) => itemClass(isActive)}>
        <i className={HOME_ITEM.icon} aria-hidden="true" />
      </NavLink>

      {items.map((m) => (
        <NavLink key={m.label} to={m.to} aria-label={m.label}
          className={itemClass(m.routes.some((to) => isUnder(pathname, to)))}>
          <i className={m.icon} aria-hidden="true" />
        </NavLink>
      ))}

      <button type="button" className={itemClass(moreOpen)}
        aria-label="Más opciones" aria-expanded={moreOpen} onClick={onMore}>
        <i className="fas fa-ellipsis" aria-hidden="true" />
      </button>
    </nav>
  );
}

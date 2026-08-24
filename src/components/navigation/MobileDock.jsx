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
 * Módulo desplegable al que pertenece la ruta actual, con sus rutas accesibles. Se busca en TODOS
 * los grupos —no solo en los del dock— para que un módulo al que se llega desde «Más» (Egresos,
 * por ejemplo) también ofrezca su submenú.
 */
function subItemsFor(pathname, permissions, activeFunctionalities) {
  for (const group of MODULE_GROUPS) {
    for (const m of group.items) {
      if (!m.children) continue;
      const routes = m.children.filter((c) => c.to && canAccess(c.to, permissions, activeFunctionalities));
      // Solo tiene sentido con dos o más hermanas: con una, el submenú repetiría el destino.
      if (routes.length > 1 && routes.some((c) => isUnder(pathname, c.to))) return routes;
    }
  }
  return [];
}

/**
 * MobileDock — navegación principal en móvil: barra inferior a lo ancho, sin superficie propia.
 * El fondo es un degradado que va de transparente (arriba) al fondo de la app (abajo), así que
 * el contenido **pasa por debajo** y se desvanece detrás de la barra en vez de chocar con un
 * borde. Reemplaza a la hamburguesa.
 *
 * Lleva Inicio + los primeros módulos principales (los de Oferta y Operación), y «Más», que abre
 * el cajón lateral con el menú completo. De un módulo desplegable se toma su icono y su etiqueta,
 * y se navega a su primera ruta accesible; queda marcado activo mientras se esté en cualquiera de
 * sus pantallas. Cada destino es icono con su nombre pequeño debajo y el activo se distingue
 * por el tinte. Respeta permisos y funcionalidades igual que el Sidebar.
 *
 * Cuando la pantalla activa pertenece a un módulo con varias secciones (Egresos → Gastos,
 * Reporte, Categorías), encima de los destinos aparece un submenú horizontal compacto con esas
 * hermanas: se salta entre ellas sin pasar por «Más».
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

  const subItems = React.useMemo(
    () => subItemsFor(pathname, permissions, activeFunctionalities),
    [pathname, permissions, activeFunctionalities],
  );

  // El alto del dock cambia según lleve submenú o no; el Layout lo lee para reservar abajo el
  // espacio justo y que ninguna barra de acciones quede debajo del menú.
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const publish = () => {
      document.documentElement.style.setProperty('--dock-h', `${Math.round(el.offsetHeight)}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--dock-h');
    };
  }, []);

  return (
    <nav ref={ref} className={styles.dock} aria-label="Navegación principal">
      {subItems.length > 0 && (
        <div className={styles.sub} aria-label="Secciones del módulo">
          {subItems.map((c) => (
            <NavLink key={c.to} to={c.to}
              className={({ isActive }) => [styles.subItem, isActive || isUnder(pathname, c.to) ? styles.subActive : ''].filter(Boolean).join(' ')}>
              {c.label}
            </NavLink>
          ))}
        </div>
      )}

      <div className={styles.items}>
      <NavLink to={HOME_ITEM.to} end aria-label={HOME_ITEM.label}
        className={({ isActive }) => itemClass(isActive)}>
        <i className={HOME_ITEM.icon} aria-hidden="true" />
        <span className={styles.label}>{HOME_ITEM.label}</span>
      </NavLink>

      {items.map((m) => (
        <NavLink key={m.label} to={m.to} aria-label={m.label}
          className={itemClass(m.routes.some((to) => isUnder(pathname, to)))}>
          <i className={m.icon} aria-hidden="true" />
          <span className={styles.label}>{m.label}</span>
        </NavLink>
      ))}

      <button type="button" className={itemClass(moreOpen)}
        aria-label="Más opciones" aria-expanded={moreOpen} onClick={onMore}>
        <i className="fas fa-ellipsis" aria-hidden="true" />
        <span className={styles.label}>Más</span>
      </button>
      </div>
    </nav>
  );
}

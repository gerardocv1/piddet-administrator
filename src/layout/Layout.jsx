import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, Topbar, MobileDock } from '../components';
import { api } from '../lib/api.js';
import { auth as authLib } from '../lib/auth/index.js';
import { ADMIN_BASE } from '../lib/adminBase.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { usePullToRefresh } from '../lib/usePullToRefresh.js';
import { PageTitleProvider, usePageTitle } from '../lib/pageTitle.jsx';
import { moduleTerm, titleTerm } from '../lib/terms.js';
import styles from './Layout.module.css';

// Normaliza el usuario de la sesión (formato backend o mock) a lo que pinta el Topbar.
function displayUser(u) {
  if (!u) return { name: '', role: '', image: undefined };
  // Solo el primer nombre para mantener el widget compacto.
  const name =
    u.first_name ||
    (u.name ? u.name.trim().split(/\s+/)[0] : '') ||
    u.username ||
    u.email ||
    '';
  // El backend expone varios tamaños; para el avatar pequeño basta el thumbnail.
  const image = u.thumbnail_image || u.standard_image || u.image || undefined;
  return { name, role: u.role || '', image: image || undefined };
}

// Metadatos de cada ruta para el título y la migaja del topbar.
const META = {
  '/': { title: 'Inicio', crumb: 'Resumen' },
  '/products': { title: 'Productos', crumb: 'Oferta' },
  '/product-categories': { title: 'Categorías de producto', crumb: 'Oferta' },
  '/admin/companies': { title: 'Compañías', crumb: 'Plataforma' },
  '/menus': { title: 'Menús', crumb: 'Oferta' },
  '/tables': { title: 'Mesas', crumb: 'Operación' },
  '/stores': { title: 'Tiendas', crumb: 'Operación' },
  '/users': { title: 'Usuarios', crumb: 'Cuentas' },
  '/roles': { title: 'Roles', crumb: 'Cuentas' },
  '/company': { title: 'Empresa', crumb: 'Cuenta' },
  '/reservations': { title: 'Reservas', crumb: 'Hospedaje' },
  '/rentable-units': { title: 'Unidades', crumb: 'Hospedaje' },
  '/gym/plans': { title: 'Planes', crumb: 'Gimnasio' },
  '/gym/members': { title: 'Afiliados', crumb: 'Gimnasio' },
  '/gym/subscriptions': { title: 'Suscripciones', crumb: 'Gimnasio' },
  '/gym/measurements': { title: 'Medidas', crumb: 'Gimnasio' },
  '/expenses': { title: 'Gastos', crumb: 'Operación' },
  '/shifts': { title: 'Turnos', crumb: 'Operación' },
  '/invoices': { title: 'Facturas', crumb: 'Ventas' },
  '/sales-report': { title: 'Reporte de ventas', crumb: 'Ventas' },
  '/more': { title: 'Más', crumb: '' },
};

// Flujos a pantalla completa con su propia barra fija de acciones (Continuar / Registrar…):
// ahí el dock estorba —tapaba esos botones— y la navegación durante el flujo es del propio
// asistente (Atrás/Cancelar), así que en estas rutas el dock no se pinta.
const FLOW_ROUTES = [
  /^\/expenses\/quick$/,
  /^\/reservations\/new$/,
  /^\/shifts\/[^/]+\/close$/,
  /^\/gym\/members\/[^/]+\/checkin$/,
];

/** Chrome de la app autenticada: menú lateral (escritorio) + barra superior + contenido (Outlet)
 * + dock inferior (móvil). */
export function Layout({ theme, onToggleTheme, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // Usuario y empresa vienen de la sesión guardada en el login (no hay endpoint /me en backend).
  const [user] = React.useState(() => displayUser(authLib.getUser()));
  const [company, setCompany] = React.useState(() => authLib.getCompany());
  const [companies, setCompanies] = React.useState([]);

  // Empresas del usuario (para el selector); el widget solo se despliega si hay más de una.
  React.useEffect(() => { api.companies().then(setCompanies).catch(() => setCompanies([])); }, []);

  // El perfil de la empresa (nombre/logo) puede cambiar fuera del Layout: refleja la activa persistida.
  React.useEffect(() => authLib.onCompanyChange(() => setCompany(authLib.getCompany())), []);

  const switchCompany = async (c) => {
    // El backend persiste company_default_id y devuelve la compañía completa (perfil + detalle);
    // el ítem `c` del selector es una versión reducida (id, username, code, name, icon).
    let next = c;
    try {
      const switched = await api.switchCompany(c.id);
      if (switched && switched.id) next = switched;
    } catch { /* si falla, seguimos en local con los datos del selector */ }
    authLib.setCompany(next); // persiste la empresa activa y notifica al widget
    // Permisos y funcionalidades son por compañía: forzar recarga para la nueva antes de salir.
    await authLib.loadPermissions(next.username ?? next.id, { force: true });
    // Recarga dura al inicio en vez de navegar: cada pantalla cachea datos de la compañía en la
    // que se montó (listados, resources, estado en memoria) y con una navegación interna esos
    // datos sobreviven al cambio. El arranque limpio garantiza que TODO sea de la nueva empresa.
    window.location.assign(`${ADMIN_BASE}/`);
  };

  const openCompanyProfile = () => navigate('/company');

  // Tirar hacia abajo para actualizar (solo en el teléfono: quien desplaza es <main>, así que el
  // gesto nativo del navegador no aplica, y en la app instalada no existe).
  const mainRef = React.useRef(null);
  const { pull, refreshing } = usePullToRefresh(mainRef, { enabled: isMobile });
  const pullStyle = pull > 0 ? { transform: `translateY(${pull}px)` } : undefined;
  // Al soltar, `pull` vuelve a 0 y el contenido sube; durante el arrastre no hay transición
  // para que siga al dedo sin retraso.
  const pullTransition = pull === 0 ? 'transform .2s ease' : 'none';

  // Sin dock (flujo a pantalla completa) el contenido no debe reservar espacio abajo: el
  // asistente trae su propia barra fija. Con dock, el alto real lo publica él mismo.
  const showDock = !FLOW_ROUTES.some((re) => re.test(location.pathname));
  React.useEffect(() => {
    if (showDock) return undefined;
    document.documentElement.style.setProperty('--dock-h', '0px');
    return () => document.documentElement.style.removeProperty('--dock-h');
  }, [showDock]);

  // La administración de un menú (/menus/:id) no tiene entrada exacta: usa un título genérico
  // (la propia pantalla muestra el nombre del menú en su cabecera).
  const sectionOf = (path) => {
    for (const base of ['/reservations', '/rentable-units', '/gym/plans', '/gym/members', '/gym/subscriptions', '/gym/measurements', '/expenses', '/shifts', '/invoices', '/products', '/menus']) {
      if (path === base || path.startsWith(`${base}/`)) return META[base] ? base : null;
    }
    return null;
  };
  // La ruta base con entrada en META (si la hay) permite renombrar título y miga según el tipo
  // de compañía (Ventas → Ingresos en un gimnasio, etc.).
  const metaBase = META[location.pathname] ? location.pathname : sectionOf(location.pathname);
  const rawMeta = (metaBase && META[metaBase])
    || (/^\/menus\/[^/]+$/.test(location.pathname) ? { title: 'Menú', crumb: 'Oferta' } : null)
    || (/^\/products\/[^/]+$/.test(location.pathname) ? { title: 'Producto', crumb: 'Oferta' } : null)
    || { title: 'Piddet', crumb: '' };
  const meta = {
    title: metaBase ? titleTerm(metaBase, rawMeta.title) : rawMeta.title,
    crumb: moduleTerm(rawMeta.crumb),
  };

  // «Más» en móvil es la pantalla /more (menú completo con su propio logo arriba): ahí la barra
  // superior sobra. En escritorio /more ni siquiera se pinta (la pantalla redirige a Inicio).
  const onMoreScreen = isMobile && location.pathname === '/more';

  return (
    <div className={styles.shell}>
      {/* El menú lateral es solo de escritorio: en móvil la navegación es el dock + /more. */}
      {!isMobile && (
        <Sidebar onLogout={onLogout}
          company={company} companies={companies} onSwitchCompany={switchCompany}
          onOpenProfile={openCompanyProfile} />
      )}
      <PageTitleProvider>
        <div className={styles.contentCol}>
          {!onMoreScreen && (
            <LayoutTopbar meta={meta} isMobile={isMobile} user={user} onLogout={onLogout}
              theme={theme} onToggleTheme={onToggleTheme} />
          )}
          {/* Indicador del gesto: asoma bajo la barra superior mientras se arrastra y gira
              mientras se releen los datos. */}
          {(pull > 0 || refreshing) && (
            <div className={styles.pullHint} style={{ transform: `translateY(${pull}px)` }} aria-hidden="true">
              <i className={`fas fa-arrow-rotate-right ${refreshing ? styles.pullSpin : ''}`}
                style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }} />
            </div>
          )}
          <main ref={mainRef} className={styles.main}
            style={{ ...pullStyle, transition: pullTransition }}>
            {/* La pantalla /more (menú móvil) toma de aquí la empresa activa y las acciones de
                cuenta, que de otro modo solo conoce el Layout. */}
            <Outlet context={{ company, companies, onSwitchCompany: switchCompany, onLogout }} />
          </main>
          {/* Navegación móvil (reemplaza a la hamburguesa); «Más» navega al menú completo (/more).
              En un flujo a pantalla completa no se pinta: su barra fija de acciones ocupa ese
              borde. */}
          {showDock && <MobileDock />}
        </div>
      </PageTitleProvider>
    </div>
  );
}

// El título dinámico (fijado por la pantalla activa vía useSetPageTitle) tiene prioridad
// sobre el título por ruta; al desmontarse la pantalla vuelve el título de la sección.
// En el teléfono manda la versión corta del título (si la pantalla la declaró). La barra recoge
// el "volver" que publica su PageHeader en ambas líneas: la flecha se pinta una sola vez,
// arriba, junto al título.
function LayoutTopbar({ meta, isMobile, ...rest }) {
  const { title, shortTitle, onBack } = usePageTitle();
  const shown = (isMobile && shortTitle) || title || meta.title;
  return (
    <Topbar title={shown} crumb={title ? '' : meta.crumb} onBack={onBack} {...rest} />
  );
}

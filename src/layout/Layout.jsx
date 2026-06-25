import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, Topbar } from '../components';
import { api } from '../lib/api.js';
import { auth as authLib } from '../lib/auth/index.js';
import { useIsMobile } from '../lib/useIsMobile.js';
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
  '/menus': { title: 'Menús', crumb: 'Oferta' },
  '/tables': { title: 'Mesas', crumb: 'Operación' },
  '/stores': { title: 'Tiendas', crumb: 'Operación' },
  '/users': { title: 'Usuarios', crumb: 'Cuentas' },
  '/roles': { title: 'Roles', crumb: 'Cuentas' },
  '/company': { title: 'Empresa', crumb: 'Cuenta' },
};

/** Chrome de la app autenticada: menú lateral + barra superior + contenido (Outlet). */
export function Layout({ theme, onToggleTheme, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = React.useState(false);
  // Usuario y empresa vienen de la sesión guardada en el login (no hay endpoint /me en backend).
  const [user] = React.useState(() => displayUser(authLib.getUser()));
  const [company, setCompany] = React.useState(() => authLib.getCompany());
  const [companies, setCompanies] = React.useState([]);

  // Empresas del usuario (para el selector); el widget solo se despliega si hay más de una.
  React.useEffect(() => { api.companies().then(setCompanies).catch(() => setCompanies([])); }, []);

  // El perfil de la empresa (nombre/logo) puede cambiar fuera del Layout: refleja la activa persistida.
  React.useEffect(() => authLib.onCompanyChange(() => setCompany(authLib.getCompany())), []);

  // Cierra el cajón al cambiar de ruta en móvil.
  React.useEffect(() => { setNavOpen(false); }, [location.pathname]);

  const switchCompany = async (c) => {
    try { await api.switchCompany(c.id); } catch { /* el backend persiste company_default_id; si falla, seguimos en local */ }
    authLib.setCompany(c); // persiste la empresa activa y notifica al widget
    // Permisos y funcionalidades son por compañía: forzar recarga para la nueva antes de ir al inicio.
    await authLib.loadPermissions(c.username ?? c.id, { force: true });
    await authLib.loadFunctionalities(c.username ?? c.id, { force: true });
    navigate('/');
  };

  const openCompanyProfile = () => navigate('/company');

  // La administración de un menú (/menus/:id) no tiene entrada exacta: usa un título genérico
  // (la propia pantalla muestra el nombre del menú en su cabecera).
  const meta = META[location.pathname]
    || (/^\/menus\/[^/]+$/.test(location.pathname) ? { title: 'Menú', crumb: 'Oferta' } : null)
    || (/^\/products\/[^/]+$/.test(location.pathname) ? { title: 'Producto', crumb: 'Oferta' } : null)
    || { title: 'Piddet', crumb: '' };

  return (
    <div className={styles.shell}>
      {isMobile && navOpen && <div className={styles.overlay} onClick={() => setNavOpen(false)} />}
      <Sidebar onLogout={onLogout} open={navOpen} onClose={() => setNavOpen(false)}
        company={company} companies={companies} onSwitchCompany={switchCompany}
        onOpenProfile={openCompanyProfile} />
      <div className={styles.contentCol}>
        <Topbar title={meta.title} crumb={meta.crumb} user={user} onLogout={onLogout} onMenu={() => setNavOpen(true)} theme={theme} onToggleTheme={onToggleTheme} />
        <main className={styles.main}><Outlet /></main>
      </div>
    </div>
  );
}

import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, Topbar, Button } from '../components';
import { api } from '../lib/api.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import styles from './Layout.module.css';

// Metadatos de cada ruta para el título y la migaja del topbar.
const META = {
  '/': { title: 'Inicio', crumb: 'Resumen' },
  '/productos': { title: 'Productos', crumb: 'Oferta' },
  '/categorias': { title: 'Categorías', crumb: 'Oferta' },
  '/toppings': { title: 'Toppings', crumb: 'Oferta' },
  '/mesas': { title: 'Mesas', crumb: 'Operación' },
  '/tiendas': { title: 'Tiendas', crumb: 'Operación' },
  '/usuarios': { title: 'Usuarios', crumb: 'Cuentas' },
  '/roles': { title: 'Roles', crumb: 'Cuentas' },
};

/** Chrome de la app autenticada: menú lateral + barra superior + contenido (Outlet). */
export function Layout({ theme, onToggleTheme, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = React.useState(false);
  const [user, setUser] = React.useState({ name: 'Gerardo Cruz', role: 'Administrador' });
  const [company, setCompany] = React.useState(null);
  const [companies, setCompanies] = React.useState([]);

  React.useEffect(() => {
    api.me().then(setUser).catch(() => {});
    api.company().then(setCompany).catch(() => {});
    api.companies().then(setCompanies).catch(() => {});
  }, []);

  // Cierra el cajón al cambiar de ruta en móvil.
  React.useEffect(() => { setNavOpen(false); }, [location.pathname]);

  const switchCompany = (c) => {
    setCompany(c);
    api.cambiarEmpresa(c.id).catch(() => {});
    navigate('/'); // los datos dependen del tenant: volver al inicio
  };

  const meta = META[location.pathname] || { title: 'Piddet', crumb: '' };
  const actions = location.pathname === '/' && !isMobile
    ? <Button size="md" variant="primary" icon="fas fa-plus">Nuevo pedido</Button>
    : null;

  return (
    <div className={styles.shell}>
      {isMobile && navOpen && <div className={styles.overlay} onClick={() => setNavOpen(false)} />}
      <Sidebar onLogout={onLogout} open={navOpen} onClose={() => setNavOpen(false)}
        company={company} companies={companies} onSwitchCompany={switchCompany} />
      <div className={styles.contentCol}>
        <Topbar title={meta.title} crumb={meta.crumb} actions={actions} user={user} onMenu={() => setNavOpen(true)} theme={theme} onToggleTheme={onToggleTheme} />
        <main className={styles.main}><Outlet /></main>
      </div>
    </div>
  );
}

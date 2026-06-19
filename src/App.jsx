import React from 'react';
import { Sidebar, Topbar, Button } from './components';
import { Login } from './screens/Login.jsx';
import { Dashboard } from './screens/Dashboard.jsx';
import { Productos } from './screens/Productos.jsx';
import { Mesas } from './screens/Mesas.jsx';
import { Categorias } from './screens/Categorias.jsx';
import { Toppings } from './screens/Toppings.jsx';
import { Tiendas } from './screens/Tiendas.jsx';
import { Usuarios } from './screens/Usuarios.jsx';
import { api } from './lib/api.js';
import { useIsMobile } from './lib/useIsMobile.js';

const META = {
  dashboard: { title: 'Inicio', crumb: 'Resumen' },
  productos: { title: 'Productos', crumb: 'Oferta' },
  categorias: { title: 'Categorías', crumb: 'Oferta' },
  toppings: { title: 'Toppings', crumb: 'Oferta' },
  mesas: { title: 'Mesas', crumb: 'Operación' },
  tiendas: { title: 'Tiendas', crumb: 'Operación' },
  usuarios: { title: 'Usuarios', crumb: 'Cuentas' },
};

function Placeholder({ name }) {
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '3rem', maxWidth: 560, textAlign: 'center' }}>
      <i className="fas fa-screwdriver-wrench" style={{ fontSize: '1.6rem', color: 'var(--color-primary)' }} />
      <h3 style={{ marginTop: 14, color: 'var(--gray-800)' }}>Módulo «{name}»</h3>
      <p style={{ color: 'var(--gray-500)', fontSize: 'var(--text-base)' }}>Reutiliza los mismos componentes en estilo flat. Pendiente de maquetar.</p>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = React.useState(!!localStorage.getItem('piddet_token'));
  const [screen, setScreen] = React.useState('dashboard');
  const [user, setUser] = React.useState({ name: 'Gerardo Cruz', role: 'Administrador' });
  const [navOpen, setNavOpen] = React.useState(false);
  const [theme, setTheme] = React.useState(() => localStorage.getItem('piddet_theme') || 'light');
  const [company, setCompany] = React.useState(null);
  const [companies, setCompanies] = React.useState([]);
  const isMobile = useIsMobile();

  // Aplica y persiste el tema (también afecta al login).
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('piddet_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  React.useEffect(() => {
    if (!auth) return;
    api.me().then(setUser).catch(() => {});
    api.company().then(setCompany).catch(() => {});
    api.companies().then(setCompanies).catch(() => {});
  }, [auth]);

  const switchCompany = (c) => {
    setCompany(c);
    api.cambiarEmpresa(c.id).catch(() => {});
    // Al cambiar de empresa se vuelve al inicio (los datos dependen del tenant).
    setScreen('dashboard');
  };

  const logout = () => { localStorage.removeItem('piddet_token'); setAuth(false); };

  if (!auth) return <Login onLogin={() => setAuth(true)} theme={theme} onToggleTheme={toggleTheme} />;

  const meta = META[screen] || { title: screen.charAt(0).toUpperCase() + screen.slice(1), crumb: '' };
  let body;
  if (screen === 'dashboard') body = <Dashboard />;
  else if (screen === 'productos') body = <Productos />;
  else if (screen === 'categorias') body = <Categorias />;
  else if (screen === 'toppings') body = <Toppings />;
  else if (screen === 'mesas') body = <Mesas />;
  else if (screen === 'tiendas') body = <Tiendas />;
  else if (screen === 'usuarios') body = <Usuarios />;
  else body = <Placeholder name={meta.title} />;

  const actions = screen === 'dashboard' && !isMobile
    ? <Button size="md" variant="primary" icon="fas fa-plus">Nuevo pedido</Button>
    : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-body)' }}>
      {isMobile && navOpen && <div className="pd-overlay" onClick={() => setNavOpen(false)} />}
      <Sidebar active={screen} onNavigate={setScreen} onLogout={logout} open={navOpen} onClose={() => setNavOpen(false)}
        company={company} companies={companies} onSwitchCompany={switchCompany} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar title={meta.title} crumb={meta.crumb} actions={actions} user={user} onMenu={() => setNavOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
        <main className="pd-main" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>{body}</main>
      </div>
    </div>
  );
}

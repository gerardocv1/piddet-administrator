import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layout/Layout.jsx';
import { Login } from './screens/Login.jsx';
import { Dashboard } from './screens/Dashboard.jsx';
import { Products } from './screens/Products.jsx';
import { ProductDetail } from './screens/ProductDetail.jsx';
import { ProductCategories } from './screens/ProductCategories.jsx';
import { AdminProductCategories } from './screens/AdminProductCategories.jsx';
import { Tables } from './screens/Tables.jsx';
import { Menus } from './screens/Menus.jsx';
import { MenuDetail } from './screens/MenuDetail.jsx';
import { MenuPreview } from './screens/MenuPreview/MenuPreview.jsx';
import { PublicMenu } from './screens/PublicMenu/PublicMenu.jsx';
import { PublicCompany } from './screens/PublicCompany/PublicCompany.jsx';
import { Invoices } from './screens/Invoices.jsx';
import { InvoiceDetail } from './screens/InvoiceDetail.jsx';
import { Stores } from './screens/Stores.jsx';
import { StoreDetail } from './screens/StoreDetail.jsx';
import { Users } from './screens/Users.jsx';
import { CompanyProfile } from './screens/CompanyProfile.jsx';
import { Placeholder } from './screens/Placeholder.jsx';
import { NoModules } from './screens/NoModules.jsx';
import { auth as authLib } from './lib/auth/index.js';
import { RequireAuth } from './lib/auth/RequireAuth.jsx';
import { RequirePermission } from './lib/permissions/RequirePermission.jsx';
import { usePermissions } from './lib/permissions/usePermissions.js';
import { canAccess, firstAccessible } from './lib/permissions/modules.js';
import { ADMIN_BASE } from './lib/adminBase.js';

// Patrón de la URL pública de una carta: /{username-compañía}/m/{username-menú}. Se sirve fuera
// del panel admin (sin sesión ni permisos), por eso se detecta antes de montar el router.
const PUBLIC_MENU_RE = /^\/([^/]+)\/m\/([^/]+)\/?$/;

// Patrón de la portada pública de una compañía: /{username-compañía} (un solo segmento). El panel
// vive bajo /admin, así que cualquier raíz limpia de un segmento (salvo `admin`) es una empresa.
const PUBLIC_COMPANY_RE = /^\/([^/]+)\/?$/;

// Landing de la raíz: muestra el Inicio si está habilitado; si no, redirige al primer módulo
// accesible; si no hay ninguno, muestra el estado "sin módulos".
function Home() {
  const { permissions } = usePermissions();
  if (canAccess('/', permissions)) return <Dashboard />;
  const first = firstAccessible(permissions);
  return first ? <Navigate to={first} replace /> : <NoModules />;
}

export default function App() {
  // 1) Mundo público (raíz limpia): la carta compartible se renderiza sin router ni sesión.
  //    El primer segmento `admin` se excluye para no colisionar con el panel.
  const path = window.location.pathname;
  const publicMatch = path.match(PUBLIC_MENU_RE);
  if (publicMatch && publicMatch[1] !== ADMIN_BASE.slice(1)) {
    return (
      <PublicMenu
        companyUsername={decodeURIComponent(publicMatch[1])}
        menuUsername={decodeURIComponent(publicMatch[2])}
      />
    );
  }

  // 1b) Portada pública de la compañía: raíz limpia de un solo segmento (salvo `admin`).
  const companyMatch = path.match(PUBLIC_COMPANY_RE);
  if (companyMatch && companyMatch[1] !== ADMIN_BASE.slice(1)) {
    return <PublicCompany companyUsername={decodeURIComponent(companyMatch[1])} />;
  }

  // 2) Todo lo administrativo vive bajo /admin: si entran fuera de ese prefijo (p. ej. la raíz),
  //    se redirige conservando la ruta para que el router (con basename) la resuelva.
  const isAdminPath = path === ADMIN_BASE || path.startsWith(ADMIN_BASE + '/');
  if (!isAdminPath) {
    const rest = path === '/' ? '/' : path;
    window.location.replace(ADMIN_BASE + rest + window.location.search + window.location.hash);
    return null;
  }

  return <AdminApp />;
}

function AdminApp() {
  const [auth, setAuth] = React.useState(() => authLib.isAuthenticated());
  const [theme, setTheme] = React.useState(() => localStorage.getItem('piddet_theme') || 'light');

  // Aplica y persiste el tema (también afecta al login).
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('piddet_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Cierre de sesión forzado (refresh fallido / 401 definitivo) → expulsa a /login.
  React.useEffect(() => authLib.onSessionExpired(() => setAuth(false)), []);

  // Al (re)entrar con sesión, carga permisos (si el caché venció) y funcionalidades (si no hay).
  React.useEffect(() => { if (auth) { authLib.loadPermissions(); authLib.loadFunctionalities(); } }, [auth]);

  const logout = () => { authLib.logout(); setAuth(false); };

  return (
    <BrowserRouter basename={ADMIN_BASE}>
      <Routes>
        {/* Única vista pública */}
        <Route path="/login"
          element={auth ? <Navigate to="/" replace /> : <Login onLogin={() => setAuth(true)} theme={theme} onToggleTheme={toggleTheme} />} />

        {/* Todo lo demás exige sesión: el guard redirige a /login si no hay token */}
        <Route element={<RequireAuth authed={auth} />}>
          {/* Carta del menú a pantalla completa (fuera del Layout: sin sidebar/topbar) */}
          <Route path="/menus/:menuId/preview"
            element={<RequirePermission path="/menus"><MenuPreview /></RequirePermission>} />
          <Route path="/" element={<Layout theme={theme} onToggleTheme={toggleTheme} onLogout={logout} />}>
            <Route index element={<Home />} />
            <Route path="products" element={<RequirePermission path="/products"><Products /></RequirePermission>} />
            <Route path="products/:itemId" element={<RequirePermission path="/products"><ProductDetail /></RequirePermission>} />
            <Route path="product-categories" element={<RequirePermission path="/product-categories"><ProductCategories /></RequirePermission>} />
            <Route path="admin/product-categories" element={<RequirePermission path="/admin/product-categories"><AdminProductCategories /></RequirePermission>} />
            <Route path="menus" element={<RequirePermission path="/menus"><Menus /></RequirePermission>} />
            <Route path="menus/:menuId" element={<RequirePermission path="/menus"><MenuDetail /></RequirePermission>} />
            <Route path="invoices" element={<RequirePermission path="/invoices"><Invoices /></RequirePermission>} />
            <Route path="invoices/:orderId" element={<RequirePermission path="/invoices"><InvoiceDetail /></RequirePermission>} />
            <Route path="tables" element={<RequirePermission path="/tables"><Tables /></RequirePermission>} />
            <Route path="stores" element={<RequirePermission path="/stores"><Stores /></RequirePermission>} />
            <Route path="stores/new" element={<RequirePermission path="/stores"><StoreDetail /></RequirePermission>} />
            <Route path="stores/:storeId" element={<RequirePermission path="/stores"><StoreDetail /></RequirePermission>} />
            <Route path="users" element={<RequirePermission path="/users"><Users /></RequirePermission>} />
            <Route path="company" element={<CompanyProfile />} />
            <Route path="roles" element={<RequirePermission path="/roles"><Placeholder name="Roles" /></RequirePermission>} />
            <Route path="*" element={<Placeholder name="No encontrado" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

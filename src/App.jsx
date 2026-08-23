import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layout/Layout.jsx';
import { ToastProvider } from './components/index.js';
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
import { CheckinWizard } from './screens/public/Checkin/CheckinWizard.jsx';
import { PublicLodging } from './screens/public/Lodging/PublicLodging.jsx';
import { PublicLodgingUnit } from './screens/public/Lodging/PublicLodgingUnit.jsx';
import { Invoices } from './screens/Invoices.jsx';
import { InvoiceDetail } from './screens/InvoiceDetail.jsx';
import { SalesReport } from './screens/SalesReport.jsx';
import { Expenses } from './screens/Expenses.jsx';
import { RentableUnits } from './screens/RentableUnits.jsx';
import { RentableUnitDetail } from './screens/RentableUnitDetail.jsx';
import { Reservations } from './screens/Reservations.jsx';
import { ReservationsCalendar } from './screens/ReservationsCalendar.jsx';
import { ReservationDetail } from './screens/ReservationDetail.jsx';
import { ReservationWizard } from './screens/ReservationWizard/ReservationWizard.jsx';
import { GymPlans } from './screens/GymPlans.jsx';
import { GymMembers } from './screens/GymMembers.jsx';
import { GymMemberDetail } from './screens/GymMemberDetail.jsx';
import { GymSubscriptions } from './screens/GymSubscriptions.jsx';
import { GymSubscriptionDetail } from './screens/GymSubscriptionDetail.jsx';
import { GymCheckinWizard } from './screens/GymCheckinWizard/GymCheckinWizard.jsx';
import { GymMemberProgress } from './screens/GymMemberProgress.jsx';
import { GymMeasurementSettings } from './screens/GymMeasurementSettings.jsx';
import { ExpenseForm } from './screens/ExpenseForm.jsx';
import { ExpenseWizard } from './screens/ExpenseWizard/ExpenseWizard.jsx';
import { ExpenseDetail } from './screens/ExpenseDetail.jsx';
import { ExpensesSummary } from './screens/ExpensesSummary.jsx';
import { ExpenseCategories } from './screens/ExpenseCategories.jsx';
import { Shifts } from './screens/Shifts.jsx';
import { ShiftDetail } from './screens/ShiftDetail.jsx';
import { ShiftOpen } from './screens/ShiftOpen.jsx';
import { ShiftCloseWizard } from './screens/ShiftCloseWizard/ShiftCloseWizard.jsx';
import { Stores } from './screens/Stores.jsx';
import { StoreDetail } from './screens/StoreDetail.jsx';
import { Users } from './screens/Users.jsx';
import { Roles } from './screens/Roles.jsx';
import { Permissions } from './screens/Permissions.jsx';
import { SyncFailures } from './screens/SyncFailures.jsx';
import { SyncFailureDetail } from './screens/SyncFailureDetail.jsx';
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

// Pre-check-in del huésped, fuera del panel y sin sesión. Se entra por /checkin?code={código}: el
// código solo autocompleta el formulario, que siempre pide además el nombre del titular. Se acepta
// /checkin/{código} por los enlaces ya compartidos.
const PUBLIC_CHECKIN_RE = /^\/checkin(?:\/([^/]+))?\/?$/;

// Patrón de la portada pública de una compañía: /{username-compañía} (un solo segmento). El panel
// vive bajo /admin, así que cualquier raíz limpia de un segmento (salvo `admin`) es una empresa.
const PUBLIC_COMPANY_RE = /^\/([^/]+)\/?$/;

// Hospedaje público: /{username-compañía}/hospedaje (listado de unidades reservables, con filtro
// de fechas) y /{username-compañía}/hospedaje/{unitId} (detalle de una unidad). El segmento es en
// español a propósito: es la URL que ve y comparte el visitante.
const PUBLIC_LODGING_RE = /^\/([^/]+)\/hospedaje\/?$/;
const PUBLIC_LODGING_UNIT_RE = /^\/([^/]+)\/hospedaje\/(\d+)\/?$/;

// Color de la barra de estado en la app instalada: debe seguir al tema activo, no a la
// preferencia del sistema. Se lee del propio token --bg-body (el fondo con el que la cabecera
// móvil se funde) en vez de repetir el valor aquí: si la barra no coincide EXACTO con el fondo,
// en el teléfono se ve una línea de corte bajo la hora.
const FALLBACK_THEME_COLORS = { light: '#fbfbfc', dark: '#11161f' };
function applyThemeColor(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const token = getComputedStyle(document.documentElement).getPropertyValue('--bg-body').trim();
  meta.setAttribute('content', token || FALLBACK_THEME_COLORS[theme] || FALLBACK_THEME_COLORS.light);
}

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

  // 1a-bis) Pre-check-in del huésped (sin sesión): el código puede venir en ?code= o en la ruta.
  const checkinMatch = path.match(PUBLIC_CHECKIN_RE);
  if (checkinMatch) {
    const queryCode = new URLSearchParams(window.location.search).get('code');
    const pathCode = checkinMatch[1] ? decodeURIComponent(checkinMatch[1]) : null;
    return <CheckinWizard code={queryCode || pathCode} />;
  }

  // 1a-ter) Hospedaje público de la compañía: listado de unidades y detalle de cada una.
  const lodgingUnitMatch = path.match(PUBLIC_LODGING_UNIT_RE);
  if (lodgingUnitMatch && lodgingUnitMatch[1] !== ADMIN_BASE.slice(1)) {
    return (
      <PublicLodgingUnit
        companyUsername={decodeURIComponent(lodgingUnitMatch[1])}
        unitId={lodgingUnitMatch[2]}
      />
    );
  }
  const lodgingMatch = path.match(PUBLIC_LODGING_RE);
  if (lodgingMatch && lodgingMatch[1] !== ADMIN_BASE.slice(1)) {
    return <PublicLodging companyUsername={decodeURIComponent(lodgingMatch[1])} />;
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
    applyThemeColor(theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Cierre de sesión forzado (refresh fallido / 401 definitivo) → expulsa a /login.
  React.useEffect(() => authLib.onSessionExpired(() => setAuth(false)), []);

  // Al (re)entrar con sesión, carga permisos (si el caché venció) y funcionalidades (si no hay).
  React.useEffect(() => { if (auth) { authLib.loadPermissions(); authLib.loadFunctionalities(); } }, [auth]);

  const logout = () => { authLib.logout(); setAuth(false); };

  // ToastProvider envuelve al router: la pila de confirmaciones sobrevive a los cambios de ruta.
  return (
    <ToastProvider>
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
            <Route path="sales-report" element={<RequirePermission path="/sales-report"><SalesReport /></RequirePermission>} />
            <Route path="expenses" element={<RequirePermission path="/expenses"><Expenses /></RequirePermission>} />
            <Route path="expenses/new" element={<RequirePermission path="/expenses"><ExpenseForm /></RequirePermission>} />
            <Route path="expenses/quick" element={<RequirePermission path="/expenses"><ExpenseWizard /></RequirePermission>} />
            <Route path="expenses/summary" element={<RequirePermission path="/expenses/summary"><ExpensesSummary /></RequirePermission>} />
            <Route path="expenses/:expenseId" element={<RequirePermission path="/expenses"><ExpenseDetail /></RequirePermission>} />
            <Route path="expense-categories" element={<RequirePermission path="/expense-categories"><ExpenseCategories /></RequirePermission>} />
            <Route path="shifts" element={<RequirePermission path="/shifts"><Shifts /></RequirePermission>} />
            <Route path="shifts/open" element={<RequirePermission path="/shifts"><ShiftOpen /></RequirePermission>} />
            <Route path="shifts/:shiftId/close" element={<RequirePermission path="/shifts"><ShiftCloseWizard /></RequirePermission>} />
            <Route path="shifts/:shiftId" element={<RequirePermission path="/shifts"><ShiftDetail /></RequirePermission>} />
            <Route path="rentable-units" element={<RequirePermission path="/rentable-units"><RentableUnits /></RequirePermission>} />
            <Route path="rentable-units/new" element={<RequirePermission path="/rentable-units"><RentableUnitDetail /></RequirePermission>} />
            <Route path="rentable-units/:unitId" element={<RequirePermission path="/rentable-units"><RentableUnitDetail /></RequirePermission>} />
            <Route path="reservations" element={<RequirePermission path="/reservations"><Reservations /></RequirePermission>} />
            <Route path="reservations/calendar" element={<RequirePermission path="/reservations"><ReservationsCalendar /></RequirePermission>} />
            <Route path="reservations/new" element={<RequirePermission path="/reservations"><ReservationWizard /></RequirePermission>} />
            <Route path="reservations/:reservationId" element={<RequirePermission path="/reservations"><ReservationDetail /></RequirePermission>} />
            <Route path="gym/plans" element={<RequirePermission path="/gym/plans"><GymPlans /></RequirePermission>} />
            <Route path="gym/members" element={<RequirePermission path="/gym/members"><GymMembers /></RequirePermission>} />
            <Route path="gym/members/:memberId/checkin" element={<RequirePermission path="/gym/members"><GymCheckinWizard /></RequirePermission>} />
            <Route path="gym/members/:memberId/progress" element={<RequirePermission path="/gym/members"><GymMemberProgress /></RequirePermission>} />
            <Route path="gym/members/:memberId" element={<RequirePermission path="/gym/members"><GymMemberDetail /></RequirePermission>} />
            <Route path="gym/subscriptions" element={<RequirePermission path="/gym/subscriptions"><GymSubscriptions /></RequirePermission>} />
            <Route path="gym/subscriptions/:subscriptionId" element={<RequirePermission path="/gym/subscriptions"><GymSubscriptionDetail /></RequirePermission>} />
            <Route path="gym/measurements" element={<RequirePermission path="/gym/measurements"><GymMeasurementSettings /></RequirePermission>} />
            <Route path="tables" element={<RequirePermission path="/tables"><Tables /></RequirePermission>} />
            <Route path="stores" element={<RequirePermission path="/stores"><Stores /></RequirePermission>} />
            <Route path="stores/new" element={<RequirePermission path="/stores"><StoreDetail /></RequirePermission>} />
            <Route path="stores/:storeId" element={<RequirePermission path="/stores"><StoreDetail /></RequirePermission>} />
            <Route path="users" element={<RequirePermission path="/users"><Users /></RequirePermission>} />
            <Route path="sync-failures" element={<RequirePermission path="/sync-failures"><SyncFailures /></RequirePermission>} />
            <Route path="sync-failures/:reportId" element={<RequirePermission path="/sync-failures"><SyncFailureDetail /></RequirePermission>} />
            <Route path="company" element={<CompanyProfile />} />
            <Route path="roles" element={<RequirePermission path="/roles"><Roles /></RequirePermission>} />
            <Route path="permissions" element={<RequirePermission path="/permissions"><Permissions /></RequirePermission>} />
            <Route path="*" element={<Placeholder name="No encontrado" />} />
          </Route>
        </Route>
      </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

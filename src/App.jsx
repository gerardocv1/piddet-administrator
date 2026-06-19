import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layout/Layout.jsx';
import { Login } from './screens/Login.jsx';
import { Dashboard } from './screens/Dashboard.jsx';
import { Products } from './screens/Products.jsx';
import { Tables } from './screens/Tables.jsx';
import { Categories } from './screens/Categories.jsx';
import { Toppings } from './screens/Toppings.jsx';
import { Stores } from './screens/Stores.jsx';
import { Users } from './screens/Users.jsx';
import { Placeholder } from './screens/Placeholder.jsx';

export default function App() {
  const [auth, setAuth] = React.useState(!!localStorage.getItem('piddet_token'));
  const [theme, setTheme] = React.useState(() => localStorage.getItem('piddet_theme') || 'light');

  // Aplica y persiste el tema (también afecta al login).
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('piddet_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const logout = () => { localStorage.removeItem('piddet_token'); setAuth(false); };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"
          element={auth ? <Navigate to="/" replace /> : <Login onLogin={() => setAuth(true)} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/"
          element={auth ? <Layout theme={theme} onToggleTheme={toggleTheme} onLogout={logout} /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="toppings" element={<Toppings />} />
          <Route path="tables" element={<Tables />} />
          <Route path="stores" element={<Stores />} />
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<Placeholder name="Roles" />} />
          <Route path="*" element={<Placeholder name="No encontrado" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

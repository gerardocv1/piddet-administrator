import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Guard de rutas: protege todo lo que cuelgue de él. Si no hay sesión, redirige a /login;
 * si la hay, renderiza las rutas hijas vía <Outlet/>.
 *
 * `authed` se recibe como prop desde App (fuente de verdad reactiva) para re-renderizar al
 * iniciar/cerrar sesión. `/login` es la única vista pública.
 */
export function RequireAuth({ authed }) {
  if (!authed) return <Navigate to="/login" replace />;
  return <Outlet />;
}

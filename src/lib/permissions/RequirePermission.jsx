import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from './usePermissions.js';
import { canAccess, firstAccessible } from './modules.js';

/**
 * Guard de ruta por permiso. Si el usuario no puede acceder a `path`, lo redirige al primer
 * módulo accesible (o a la raíz, que muestra el estado "sin módulos" si no hay ninguno).
 *
 *   <Route path="products" element={<RequirePermission path="/products"><Products /></RequirePermission>} />
 */
export function RequirePermission({ path, children }) {
  const { permissions } = usePermissions();
  if (canAccess(path, permissions)) return children;
  const first = firstAccessible(permissions);
  return <Navigate to={first || '/'} replace />;
}

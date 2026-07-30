import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from './usePermissions.js';
import { useFunctionalities } from './useFunctionalities.js';
import { canAccess, firstAccessible, ROUTE_FUNCTIONALITY } from './modules.js';

/**
 * Guard de ruta por permiso y funcionalidad de compañía. Si el usuario no puede acceder a
 * `path`, lo redirige al primer módulo accesible (o a la raíz, que muestra el estado "sin
 * módulos" si no hay ninguno).
 *
 *   <Route path="products" element={<RequirePermission path="/products"><Products /></RequirePermission>} />
 */
export function RequirePermission({ path, children }) {
  const { permissions } = usePermissions();
  const { ready, activeNames } = useFunctionalities();
  // Las funcionalidades cargan async y arrancan vacías: en rutas gateadas por funcionalidad
  // se espera a que resuelvan antes de decidir, para no redirigir en falso al recargar.
  if (ROUTE_FUNCTIONALITY[path] && !ready) return null;
  const activeFunctionalities = ready ? activeNames : null;
  if (canAccess(path, permissions, activeFunctionalities)) return children;
  const first = firstAccessible(permissions, activeFunctionalities);
  return <Navigate to={first || '/'} replace />;
}

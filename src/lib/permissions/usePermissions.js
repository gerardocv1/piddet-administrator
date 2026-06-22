import React from 'react';
import { auth } from '../auth/index.js';

/**
 * Expone los permisos de la sesión (compañía activa) de forma reactiva. Se actualiza cuando se
 * recargan tras login o cambio de compañía (auth.onPermissionsChange).
 *
 *   const { permissions, can } = usePermissions();
 *   if (can('api-module-products')) { ... }
 */
export function usePermissions() {
  const [permissions, setPermissions] = React.useState(() => auth.getPermissions());

  React.useEffect(() => auth.onPermissionsChange(() => setPermissions(auth.getPermissions())), []);

  const can = React.useCallback((perm) => permissions.includes(perm), [permissions]);
  const canAny = React.useCallback((list) => list.some((p) => permissions.includes(p)), [permissions]);

  return { permissions, can, canAny };
}

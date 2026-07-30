import React from 'react';
import { auth } from '../auth/index.js';

/**
 * Expone las funcionalidades de la compañía activa de forma reactiva (p. ej. impuestos). Dispara
 * una carga al montar (si aún no hay) y se actualiza en login / cambio de compañía.
 *
 *   const { has } = useFunctionalities();
 *   if (has('functionality_taxes')) { ...mostrar selector de impuesto... }
 */
export function useFunctionalities() {
  const [functionalities, setFunctionalities] = React.useState(() => auth.getFunctionalities());
  const [ready, setReady] = React.useState(() => auth.functionalitiesReady());

  React.useEffect(() => {
    const off = auth.onFunctionalitiesChange(() => {
      setFunctionalities(auth.getFunctionalities());
      setReady(auth.functionalitiesReady());
    });
    auth.loadFunctionalities(); // sin force: solo carga si aún no hay
    return off;
  }, []);

  const has = React.useCallback((name) => auth.hasFunctionality(name), [functionalities]);

  // Nombres de las funcionalidades activas, para pasar a canAccess/firstAccessible.
  const activeNames = React.useMemo(
    () => functionalities.filter((f) => f.is_active === true || f.is_active === 1).map((f) => f.name),
    [functionalities]
  );

  return { functionalities, has, ready, activeNames };
}

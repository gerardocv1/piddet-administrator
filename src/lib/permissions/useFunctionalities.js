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

  React.useEffect(() => {
    const off = auth.onFunctionalitiesChange(() => setFunctionalities(auth.getFunctionalities()));
    auth.loadFunctionalities(); // sin force: solo carga si aún no hay
    return off;
  }, []);

  const has = React.useCallback((name) => auth.hasFunctionality(name), [functionalities]);

  return { functionalities, has };
}

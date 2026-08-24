import React from 'react';
import { REFRESH_EVENT } from './usePullToRefresh.js';

/**
 * Carga datos de la API con estados unificados de carga/error y recarga.
 * Reemplaza el patrón `api.x().then(set).catch(() => {})` que tragaba errores.
 *
 *   const { data, loading, error, reload, setData } = useResource(api.items, []);
 *
 * `fetcher` debe ser estable (referencia de `api.*`). `initial` es el valor
 * mientras carga. `deps` reejecuta el fetch cuando cambian.
 */
export function useResource(fetcher, initial = [], deps = []) {
  const [data, setData] = React.useState(initial);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.resolve()
      .then(fetcher)
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setError('No se pudieron cargar los datos.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  React.useEffect(load, [load]);

  // Tirar hacia abajo para actualizar: relee sin recargar la app. Como escucha cada recurso
  // montado, la pantalla entera se refresca aunque cargue varias cosas a la vez.
  React.useEffect(() => {
    const onRefresh = () => { load(); };
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, [load]);

  return { data, setData, loading, error, reload: load };
}

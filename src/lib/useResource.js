import React from 'react';

/**
 * Carga datos de la API con estados unificados de carga/error y recarga.
 * Reemplaza el patrón `api.x().then(set).catch(() => {})` que tragaba errores.
 *
 *   const { data, loading, error, reload, setData } = useResource(api.products, []);
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

  return { data, setData, loading, error, reload: load };
}

import React from 'react';

const EMPTY = { title: null, shortTitle: null, onBack: null };
const PageTitleContext = React.createContext({ ...EMPTY, setPage: () => {}, setBack: () => {} });

export function PageTitleProvider({ children }) {
  const [page, setPageState] = React.useState(EMPTY);
  const setPage = React.useCallback((next) => {
    setPageState((prev) => ({ ...prev, ...next }));
  }, []);
  const setBack = React.useCallback((onBack) => {
    setPageState((prev) => (prev.onBack === onBack ? prev : { ...prev, onBack }));
  }, []);
  const value = React.useMemo(() => ({ ...page, setPage, setBack }), [page, setPage, setBack]);
  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
}

export function usePageTitle() {
  return React.useContext(PageTitleContext);
}

/**
 * Fija el título del Topbar mientras la pantalla esté montada (útil en detalles cuyo título
 * depende de datos cargados, p. ej. "Reserva {code}").
 *
 * `shortTitle` es el que se usa en el teléfono, donde la barra no da para un título largo: en la
 * ficha de una persona, su nombre de pila en vez del nombre completo con el prefijo del módulo.
 */
export function useSetPageTitle(title, { shortTitle } = {}) {
  const { setPage } = usePageTitle();
  React.useEffect(() => {
    setPage({ title: title || null, shortTitle: shortTitle || null });
    return () => setPage({ title: null, shortTitle: null });
  }, [title, shortTitle, setPage]);
}

/**
 * Publica el "volver" de la pantalla para que el Topbar lo pinte en el teléfono. Lo llama
 * `PageHeader` con su propio `onBack`, así que ninguna pantalla tiene que registrarlo a mano:
 * en móvil la flecha vive arriba (una sola vez) y la cabecera deja de repetirla.
 *
 * El callback se guarda en una ref para no re-suscribir en cada render: lo que viaja al contexto
 * es una función estable que siempre invoca la última versión.
 */
export function useSetPageBack(onBack) {
  const { setBack } = usePageTitle();
  const ref = React.useRef(onBack);
  ref.current = onBack;
  const hasBack = !!onBack;

  React.useEffect(() => {
    if (!hasBack) return undefined;
    const handler = () => ref.current && ref.current();
    setBack(handler);
    return () => setBack(null);
  }, [hasBack, setBack]);
}

import React from 'react';

const PageTitleContext = React.createContext({ title: null, setTitle: () => {} });

export function PageTitleProvider({ children }) {
  const [title, setTitle] = React.useState(null);
  const value = React.useMemo(() => ({ title, setTitle }), [title]);
  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
}

export function usePageTitle() {
  return React.useContext(PageTitleContext);
}

// Fija el título del Topbar mientras la pantalla esté montada (útil en detalles cuyo
// título depende de datos cargados, p. ej. "Reserva {code}").
export function useSetPageTitle(title) {
  const { setTitle } = usePageTitle();
  React.useEffect(() => {
    setTitle(title || null);
    return () => setTitle(null);
  }, [title, setTitle]);
}

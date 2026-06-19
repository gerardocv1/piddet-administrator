import React from 'react';

/** Devuelve true cuando el ancho de pantalla es <= breakpoint (por defecto 860px). */
export function useIsMobile(breakpoint = 860) {
  const query = `(max-width: ${breakpoint}px)`;
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
  const [isMobile, setIsMobile] = React.useState(get);

  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return isMobile;
}

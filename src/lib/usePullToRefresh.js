import React from 'react';

/** Evento global que pide a la pantalla activa releer sus datos (lo escucha `useResource`). */
export const REFRESH_EVENT = 'piddet:refresh';

/** Dispara la recarga de datos de todo lo montado. */
export function requestRefresh() {
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

const THRESHOLD = 68;   // px que hay que arrastrar para que cuente
const MAX_PULL = 96;    // tope del arrastre, para que el indicador no baje sin fin
const RESIST = 0.55;    // el dedo recorre más de lo que baja el indicador (tacto elástico)

/**
 * Tirar hacia abajo para actualizar, sobre un contenedor con scroll propio.
 *
 * Solo entra cuando el contenedor ya está arriba del todo y el gesto es claramente vertical
 * hacia abajo; si no, deja pasar el scroll normal. Al soltar pasado el umbral emite
 * `piddet:refresh`, que releen todos los `useResource` montados: se refrescan los datos de la
 * pantalla sin recargar la app entera (que en el teléfono cuesta segundos).
 *
 * El navegador solo ofrece su propio "pull to refresh" cuando quien desplaza es el documento;
 * aquí el scroll vive en `<main>`, y en la app instalada no existe, así que hay que implementarlo.
 *
 * @param {React.RefObject<HTMLElement>} ref  contenedor con scroll
 * @param {{ enabled?: boolean }} [opts]
 * @returns {{ pull: number, refreshing: boolean }} para pintar el indicador
 */
export function usePullToRefresh(ref, { enabled = true } = {}) {
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const state = React.useRef({ startY: 0, startX: 0, tracking: false, decided: false });

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;

    const onStart = (e) => {
      if (refreshing || e.touches.length !== 1) return;
      // Solo desde el tope: si la pantalla está desplazada, el gesto es scroll normal.
      if (el.scrollTop > 0) return;
      const t = e.touches[0];
      state.current = { startY: t.clientY, startX: t.clientX, tracking: true, decided: false };
    };

    const onMove = (e) => {
      const st = state.current;
      if (!st.tracking || refreshing) return;
      const t = e.touches[0];
      const dy = t.clientY - st.startY;
      const dx = t.clientX - st.startX;

      if (!st.decided) {
        // Un gesto horizontal (carrusel, deslizar una fila) o hacia arriba no es un "pull".
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { st.tracking = false; return; }
        st.decided = true;
      }
      // Ya es nuestro: se corta el rebote del contenedor para que el indicador mande.
      if (e.cancelable) e.preventDefault();
      setPull(Math.min(MAX_PULL, dy * RESIST));
    };

    const finish = () => {
      const st = state.current;
      st.tracking = false;
      setPull((current) => {
        if (current >= THRESHOLD) {
          setRefreshing(true);
          requestRefresh();
          // Un mínimo visible: sin esto, con datos en caché el indicador parpadea y no se lee
          // como que algo pasó.
          window.setTimeout(() => { setRefreshing(false); setPull(0); }, 700);
          return THRESHOLD;
        }
        return 0;
      });
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', finish);
    el.addEventListener('touchcancel', finish);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', finish);
      el.removeEventListener('touchcancel', finish);
    };
  }, [ref, enabled, refreshing]);

  return { pull, refreshing };
}

import React from 'react';

/** Hueco que el teclado virtual le roba a la pantalla, publicado como `--kb-h` en :root.
 *
 * El problema que resuelve: una barra `position: fixed; bottom: 0` se ancla al *layout*
 * viewport, y en iOS ese viewport NO se encoge al abrir el teclado (solo lo hace el visual
 * viewport). Resultado: la barra de acciones del asistente queda detrás del teclado y el
 * usuario no ve el botón Continuar. En Android lo arregla `interactive-widget=resizes-content`
 * (meta viewport de index.html), y ahí este hook mide 0 — no hay doble compensación.
 *
 * De paso corrige el otro efecto del teclado en iOS: Safari desplaza el documento raíz para
 * revelar el campo enfocado aunque el shell mida 100dvh con overflow hidden, y la barra
 * superior se va fuera de la pantalla. Devolver ese scroll a 0 la deja en su sitio; quien
 * desplaza el contenido es <main>.
 */
export function useKeyboardInset() {
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;

    const root = document.documentElement;
    let frame = 0;

    const measure = () => {
      frame = 0;
      // Lo que queda por debajo del visual viewport: el teclado (y cualquier otro widget del
      // navegador). `offsetTop` es el desplazamiento que iOS aplica para revelar el campo.
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      root.style.setProperty('--kb-h', `${inset}px`);
      // El documento raíz nunca debe desplazarse: si iOS lo movió, la cabecera se fue con él.
      if (inset > 0 && window.scrollY !== 0) window.scrollTo(0, 0);
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
      root.style.removeProperty('--kb-h');
    };
  }, []);
}

import React from 'react';
import { http } from '../../lib/http/client.js';
import styles from './LoadingBar.module.css';

// Aparecer al instante convierte cualquier respuesta rápida en un parpadeo; esperar un poco
// deja pasar lo instantáneo y avisa solo cuando de verdad hay espera.
const SHOW_AFTER_MS = 140;
// Y una vez visible se queda un mínimo, para que no desaparezca antes de que el ojo la registre.
const MIN_VISIBLE_MS = 400;

/**
 * Indicador global de "algo está cargando": una barra fina en el borde superior de la pantalla
 * mientras haya peticiones en vuelo (`http.onActivity`).
 *
 * Se monta una sola vez en la app. Al ir por el transporte —y no por cada pantalla— cubre por
 * igual el cambio de vista (la pantalla nueva pide sus datos al montarse), el filtro, la
 * paginación y el botón que guarda: en el teléfono, donde el contenido tarda en aparecer, es
 * la única señal de que la app está haciendo algo.
 *
 * No sustituye al estado de carga de cada pantalla (spinner del listado, `loading` del botón):
 * lo respalda para que nunca haya una espera muda.
 */
export function LoadingBar() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    let showTimer = 0;
    let hideTimer = 0;
    let shownAt = 0;

    const unsubscribe = http.onActivity((inFlight) => {
      if (inFlight > 0) {
        clearTimeout(hideTimer);
        if (showTimer || shownAt) return;
        showTimer = setTimeout(() => {
          showTimer = 0;
          shownAt = Date.now();
          setVisible(true);
        }, SHOW_AFTER_MS);
        return;
      }
      // Sin peticiones: si aún no llegó a verse, se cancela; si se vio, cumple su mínimo.
      clearTimeout(showTimer);
      showTimer = 0;
      if (!shownAt) return;
      const rest = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));
      hideTimer = setTimeout(() => {
        shownAt = 0;
        setVisible(false);
      }, rest);
    });

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      unsubscribe();
    };
  }, []);

  if (!visible) return null;
  return (
    <div className={styles.track} role="status" aria-live="polite" aria-label="Cargando">
      <div className={styles.bar} />
    </div>
  );
}

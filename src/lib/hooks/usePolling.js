import React from 'react';

/**
 * Sondeo repetido de una función asíncrona con tope de intentos, para tareas que corren en el
 * backend y no notifican por sockets (p. ej. el estado de una importación con agente IA).
 *
 * Usa `setTimeout` encadenado (no `setInterval`): cada vuelta agenda la siguiente solo después de
 * que la anterior resolvió, así nunca se acumulan llamadas si el backend responde lento. Limpia el
 * temporizador pendiente al desmontar o al cambiar `intervalMs`/`maxAttempts`, sin fugas de memoria.
 *
 *   const { data, error, attempts, running, timedOut } = usePolling(
 *     () => api.menuImportStatus(id),
 *     { intervalMs: 4000, maxAttempts: 75, stopWhen: (r) => r.status === 'completed' || r.status === 'failed' },
 *   );
 *
 * - `fn`: función (puede ser async) que hace el sondeo; su resultado más reciente queda en `data`.
 * - `intervalMs`: pausa entre intentos (el primero corre de inmediato).
 * - `maxAttempts`: tope de intentos; al alcanzarlo, `running` pasa a false y `timedOut` a true.
 * - `stopWhen(data)`: si devuelve true tras un intento, detiene el sondeo (éxito o resultado final).
 * - `enabled`: en false no arranca (ni agenda) el sondeo.
 */
export function usePolling(fn, { intervalMs = 5000, maxAttempts = Infinity, stopWhen = () => false, enabled = true } = {}) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [attempts, setAttempts] = React.useState(0);
  const [running, setRunning] = React.useState(enabled);
  const [timedOut, setTimedOut] = React.useState(false);

  // Refs para no reiniciar el efecto cuando `fn`/`stopWhen` cambian de referencia entre renders
  // (funciones inline en el componente que llama); solo intervalMs/maxAttempts/enabled lo reinician.
  const fnRef = React.useRef(fn);
  fnRef.current = fn;
  const stopWhenRef = React.useRef(stopWhen);
  stopWhenRef.current = stopWhen;

  React.useEffect(() => {
    if (!enabled) { setRunning(false); return undefined; }

    let alive = true;
    let timer = null;
    let attemptCount = 0;
    setRunning(true);
    setTimedOut(false);

    const tick = async () => {
      attemptCount += 1;
      try {
        const result = await fnRef.current();
        if (!alive) return;
        setData(result);
        setError(null);
        setAttempts(attemptCount);
        if (stopWhenRef.current(result)) { setRunning(false); return; }
      } catch (e) {
        if (!alive) return;
        setError(e);
        setAttempts(attemptCount);
      }
      if (!alive) return;
      if (attemptCount >= maxAttempts) { setRunning(false); setTimedOut(true); return; }
      timer = setTimeout(tick, intervalMs);
    };

    tick();

    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [intervalMs, maxAttempts, enabled]);

  return { data, error, attempts, running, timedOut };
}

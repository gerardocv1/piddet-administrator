import React from 'react';

const SW_URL = '/sw.js';

/** Registra el service worker (solo en build de producción: en `dev` estorbaría al HMR).
 * Sin él Chrome trata la app como un simple acceso directo y no ofrece instalarla. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL).catch(() => { /* sin PWA, la app sigue funcionando */ });
  });
}

/** True si la app corre ya instalada (ventana propia, sin barra del navegador). */
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.navigator.standalone === true;
}

/** Expone el botón "Instalar app": Chrome dispara `beforeinstallprompt` cuando la instalación
 * es posible y hay que guardar el evento para lanzarlo desde un gesto del usuario. */
export function useInstallPrompt() {
  const [prompt, setPrompt] = React.useState(null);

  React.useEffect(() => {
    const onAvailable = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => setPrompt(null);
    window.addEventListener('beforeinstallprompt', onAvailable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onAvailable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = React.useCallback(async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null); // el evento es de un solo uso: Chrome emite otro si el usuario cancela
  }, [prompt]);

  return { canInstall: !!prompt, install };
}

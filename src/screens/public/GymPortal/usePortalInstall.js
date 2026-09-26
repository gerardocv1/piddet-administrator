import React from 'react';
import { isStandalone, useInstallPrompt } from '../../../lib/pwa.js';

// Cómo se instala el portal en el teléfono de quien lo está viendo:
//  - 'prompt'   Chrome, Edge, Samsung Internet… ofrecieron el diálogo nativo de instalación.
//  - 'ios'      Safari o Chrome en iPhone/iPad: no hay diálogo, se guía por Compartir → Agregar a inicio.
//  - 'android'  Android sin diálogo (Firefox, u otro navegador): se guía por el menú del navegador.
//  - 'in-app'   Navegador interno de WhatsApp, Instagram, Facebook…: ahí no se puede instalar.
//  - 'none'     Ya instalada (abierta como app) o escritorio sin opción de instalar.

const IN_APP_RE = /FBAN|FBAV|FB_IAB|Instagram|Line\/|WhatsApp|Snapchat|TikTok|musical_ly|; wv\)/i;

export function detectDevice() {
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  let iosBrowser = 'safari';
  if (/CriOS/.test(ua)) iosBrowser = 'chrome';
  else if (/FxiOS|EdgiOS|OPiOS/.test(ua)) iosBrowser = 'other';
  return { ios, android, iosBrowser, inApp: IN_APP_RE.test(ua) };
}

export function usePortalInstall() {
  const { canInstall, install } = useInstallPrompt();
  const [device] = React.useState(detectDevice);
  const [standalone, setStandalone] = React.useState(isStandalone);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    const onInstalled = () => setInstalled(true);
    const media = window.matchMedia('(display-mode: standalone)');
    const onMode = () => setStandalone(isStandalone());
    window.addEventListener('appinstalled', onInstalled);
    media.addEventListener?.('change', onMode);
    return () => {
      window.removeEventListener('appinstalled', onInstalled);
      media.removeEventListener?.('change', onMode);
    };
  }, []);

  let mode = 'none';
  if (standalone) mode = 'none';
  else if (canInstall) mode = 'prompt';
  else if (device.inApp) mode = 'in-app';
  else if (device.ios) mode = 'ios';
  else if (device.android) mode = 'android';

  const promptInstall = React.useCallback(async () => {
    const outcome = await install();
    if (outcome === 'accepted') setInstalled(true);
    return outcome;
  }, [install]);

  return { mode, device, standalone, installed, promptInstall };
}

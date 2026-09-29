import React from 'react';
import jsQR from 'jsqr';

// Lector de QR con la cámara del teléfono. Usa el `BarcodeDetector` del navegador cuando existe
// (Chrome en Android: rápido y sin gastar batería) y, si no (Safari en iPhone), decodifica los
// cuadros del video con jsQR sobre un canvas. Abre la cámara trasera, pide un cuadro por
// animación y avisa una sola vez por lectura (`onDecode`); quien lo usa decide cuándo volver a
// leer (`resume`).
//
// La cámara solo se abre desde un gesto del usuario y por HTTPS: fuera de eso el navegador la
// niega, y eso se informa en `error`.

const ERRORS = {
  NotAllowedError: 'Sin permiso para usar la cámara. Actívalo en los ajustes del navegador.',
  NotFoundError: 'Este dispositivo no tiene una cámara disponible.',
  NotReadableError: 'La cámara está ocupada por otra app. Ciérrala e intenta de nuevo.',
  OverconstrainedError: 'No se pudo abrir la cámara trasera.',
  SecurityError: 'La cámara solo funciona en una conexión segura (https).',
};

function describe(err) {
  return ERRORS[err?.name] || 'No pudimos abrir la cámara. Intenta de nuevo.';
}

async function makeDetector() {
  if (!('BarcodeDetector' in window)) return null;
  try {
    const formats = await window.BarcodeDetector.getSupportedFormats?.();
    if (formats && !formats.includes('qr_code')) return null;
    return new window.BarcodeDetector({ formats: ['qr_code'] });
  } catch {
    return null;
  }
}

export function useQrScanner({ onDecode }) {
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const frameRef = React.useRef(0);
  const pausedRef = React.useRef(false);
  const onDecodeRef = React.useRef(onDecode);
  onDecodeRef.current = onDecode;
  const [active, setActive] = React.useState(false);
  const [error, setError] = React.useState('');
  const [starting, setStarting] = React.useState(false);

  const stop = React.useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const start = React.useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no puede usar la cámara.');
      return;
    }
    setError('');
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stop(); return; }
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      pausedRef.current = false;
      setActive(true);

      const detector = await makeDetector();
      const canvas = document.createElement('canvas');
      const ctx2d = detector ? null : canvas.getContext('2d', { willReadFrequently: true });
      let busy = false;

      const tick = async () => {
        if (!streamRef.current) return;
        frameRef.current = requestAnimationFrame(tick);
        if (pausedRef.current || busy || video.readyState < 2) return;
        busy = true;
        try {
          let text = null;
          if (detector) {
            const codes = await detector.detect(video);
            text = codes[0]?.rawValue || null;
          } else {
            // jsQR trabaja sobre un cuadro reducido: basta para un QR a 20-40 cm y no calienta el teléfono.
            const scale = Math.min(1, 640 / (video.videoWidth || 640));
            canvas.width = Math.round((video.videoWidth || 640) * scale);
            canvas.height = Math.round((video.videoHeight || 480) * scale);
            ctx2d.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
            text = code?.data || null;
          }
          if (text && !pausedRef.current) {
            pausedRef.current = true;
            onDecodeRef.current?.(text);
          }
        } catch {
          // Un cuadro que no se pudo leer: se intenta con el siguiente.
        } finally {
          busy = false;
        }
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      stop();
      setError(describe(err));
    } finally {
      setStarting(false);
    }
  }, [stop]);

  /** Vuelve a leer después de mostrar un resultado. */
  const resume = React.useCallback(() => { pausedRef.current = false; }, []);

  React.useEffect(() => stop, [stop]);

  // Si la app pasa a segundo plano, la cámara se suelta; al volver, quien la usa la reabre.
  React.useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') stop(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [stop]);

  return { videoRef, start, stop, resume, active, starting, error };
}

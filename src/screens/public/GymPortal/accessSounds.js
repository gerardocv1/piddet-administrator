// Sonidos de la entrada: uno de "ok" (dos notas que suben) cuando el socio pasa y uno de error
// (zumbido grave) cuando no. Se sintetizan con Web Audio para no cargar archivos: la app de la
// puerta suele estar instalada y con la señal justa. El contexto se crea (y se desbloquea) en el
// primer toque del usuario, que es lo que iOS exige para que suene.

let ctx = null;

function context() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) ctx = new Ctx();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Llamar desde un gesto del usuario (el botón de validar) para que iOS deje sonar después. */
export function unlockSounds() {
  const audio = context();
  if (!audio) return;
  // Un silencio de un instante basta para "abrir" la salida de audio.
  const gain = audio.createGain();
  gain.gain.value = 0;
  const osc = audio.createOscillator();
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.01);
}

function tone(audio, { frequency, start, duration, type = 'sine', volume = 0.25 }) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audio.currentTime + start);
  gain.gain.setValueAtTime(0, audio.currentTime + start);
  gain.gain.linearRampToValueAtTime(volume, audio.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(audio.currentTime + start);
  osc.stop(audio.currentTime + start + duration + 0.05);
}

/** "Puede pasar": dos notas cortas que suben. */
export function playAccessGranted() {
  const audio = context();
  if (!audio) return;
  tone(audio, { frequency: 880, start: 0, duration: 0.12 });
  tone(audio, { frequency: 1318.5, start: 0.13, duration: 0.22 });
}

/** "No puede pasar": zumbido grave, dos veces. */
export function playAccessDenied() {
  const audio = context();
  if (!audio) return;
  tone(audio, { frequency: 196, start: 0, duration: 0.22, type: 'square', volume: 0.12 });
  tone(audio, { frequency: 165, start: 0.27, duration: 0.32, type: 'square', volume: 0.12 });
}

/** Vibración corta (Android): apoya al sonido en un gimnasio ruidoso. */
export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    // Sin vibración: no pasa nada.
  }
}

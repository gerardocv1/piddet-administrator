// Lo que el teléfono guarda del portal de gimnasios, compartido entre la entrada general
// (piddet.com/gym) y el portal de cada gimnasio (/{compañía}/afiliados).
//
//  - `piddet_gym_portal_session:{compañía}`: la sesión abierta, con lo último que se vio.
//  - `piddet_gym_portal_pending:{compañía}`: una sesión que abrió la entrada general y que el
//    portal de ese gimnasio adopta la primera vez que se abre (y borra).

const SESSION_PREFIX = 'piddet_gym_portal_session:';
const PENDING_PREFIX = 'piddet_gym_portal_pending:';

function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Deja lista la sesión de un gimnasio para que su portal la tome al abrirse. */
export function savePending(username, { session_token: sessionToken, company }) {
  safe(() => localStorage.setItem(PENDING_PREFIX + username, JSON.stringify({ session_token: sessionToken, company })));
}

/** La sesión pendiente de un gimnasio, sin borrarla (leerla no puede tener efectos: React puede
 *  calcular el estado inicial dos veces). La borra `clearPending` una vez adoptada. */
export function peekPending(username) {
  return safe(() => {
    const raw = localStorage.getItem(PENDING_PREFIX + username);
    return raw ? JSON.parse(raw)?.session_token || null : null;
  }, null);
}

export function clearPending(username) {
  safe(() => localStorage.removeItem(PENDING_PREFIX + username));
}

/** Gimnasios con sesión en este teléfono (abierta o pendiente): [{ username, name, icon }]. */
export function savedGyms() {
  return safe(() => {
    const found = new Map();
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) || '';
      const prefix = [SESSION_PREFIX, PENDING_PREFIX].find((p) => key.startsWith(p));
      if (!prefix) continue;
      const username = key.slice(prefix.length);
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      if (!data?.session_token || found.has(username)) continue;
      const company = data.company || {};
      found.set(username, {
        username,
        name: company.name || username,
        icon: company.thumbnail_icon || company.icon || null,
      });
    }
    return [...found.values()];
  }, []);
}

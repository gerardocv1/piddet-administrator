// Persistencia de la sesión de Piddet.
//
// Abstrae DÓNDE se guardan los datos de sesión según la preferencia "Recordarme":
//   - remember = true  → localStorage  (persiste al cerrar el navegador → "mantener sesión")
//   - remember = false → sessionStorage (se borra al cerrar la pestaña   → "sesión corta")
//
// Un marcador `piddet_persist` en localStorage recuerda qué store contiene la sesión,
// para leerla de forma determinista al arrancar la app.

const KEYS = {
  token: 'piddet_token',
  refresh: 'piddet_refresh_token',
  exp: 'piddet_token_exp',
  user: 'piddet_user',
  company: 'piddet_company',
  permissions: 'piddet_permissions',
  permsExp: 'piddet_permissions_exp',
};
const PERSIST_FLAG = 'piddet_persist'; // '1' → localStorage, cualquier otra cosa → sessionStorage

// Acceso seguro a Storage (puede fallar en modo privado / SSR).
function safe(store) {
  try {
    return store ?? null;
  } catch {
    return null;
  }
}

const local = () => safe(typeof window !== 'undefined' ? window.localStorage : null);
const session = () => safe(typeof window !== 'undefined' ? window.sessionStorage : null);

// ¿La sesión actual se guardó como persistente?
function isPersistent() {
  const l = local();
  return !!l && l.getItem(PERSIST_FLAG) === '1';
}

// Store activo según el marcador guardado.
function activeStore() {
  return isPersistent() ? local() : session();
}

/**
 * Guarda la sesión completa en el store correspondiente a `remember`.
 * @param {{ token:string, refreshToken:string, expiresAt:number, user?:object, company?:object }} session
 * @param {{ remember?: boolean }} opts
 */
export function saveSession({ token, refreshToken, expiresAt, user, company }, { remember = false } = {}) {
  // Limpia cualquier sesión previa (en ambos stores) antes de escribir la nueva.
  clearSession();

  const l = local();
  if (l) l.setItem(PERSIST_FLAG, remember ? '1' : '0');

  const store = remember ? local() : session();
  if (!store) return;

  store.setItem(KEYS.token, token ?? '');
  store.setItem(KEYS.refresh, refreshToken ?? '');
  store.setItem(KEYS.exp, expiresAt != null ? String(expiresAt) : '');
  if (user !== undefined) store.setItem(KEYS.user, JSON.stringify(user ?? null));
  if (company !== undefined) store.setItem(KEYS.company, JSON.stringify(company ?? null));
}

/** Guarda los permisos de la compañía activa y su vencimiento (epoch s) en el store actual. */
export function savePermissions(permissions, expiresAt) {
  const store = activeStore();
  if (!store) return;
  store.setItem(KEYS.permissions, JSON.stringify(permissions ?? []));
  store.setItem(KEYS.permsExp, expiresAt != null ? String(expiresAt) : '');
}

/** Actualiza solo los tokens (tras un refresh), manteniendo el store y user/company actuales. */
export function updateTokens({ token, refreshToken, expiresAt }) {
  const store = activeStore();
  if (!store) return;
  store.setItem(KEYS.token, token ?? '');
  store.setItem(KEYS.refresh, refreshToken ?? '');
  store.setItem(KEYS.exp, expiresAt != null ? String(expiresAt) : '');
}

/** Lee la sesión guardada. Devuelve campos vacíos/null si no hay sesión. */
export function readSession() {
  const store = activeStore();
  if (!store) return { token: '', refreshToken: '', expiresAt: 0, user: null, company: null, permissions: [], permissionsExpiresAt: 0 };

  const parse = (raw) => {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  return {
    token: store.getItem(KEYS.token) || '',
    refreshToken: store.getItem(KEYS.refresh) || '',
    expiresAt: Number(store.getItem(KEYS.exp)) || 0,
    user: parse(store.getItem(KEYS.user)),
    company: parse(store.getItem(KEYS.company)),
    permissions: parse(store.getItem(KEYS.permissions)) || [],
    permissionsExpiresAt: Number(store.getItem(KEYS.permsExp)) || 0,
  };
}

/** Borra toda la sesión de ambos stores y el marcador de persistencia. */
export function clearSession() {
  for (const store of [local(), session()]) {
    if (!store) continue;
    for (const k of Object.values(KEYS)) store.removeItem(k);
  }
  const l = local();
  if (l) l.removeItem(PERSIST_FLAG);
}

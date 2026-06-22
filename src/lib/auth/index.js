// Fachada de autenticación de Piddet.
//
// Superficie única de auth para el resto de la plataforma. Las pantallas y App.jsx usan
// SOLO este módulo; nunca tocan storage, tokenManager ni el cliente directamente.

import { http, tokenManager } from '../http/client.js';
import { permissionsService } from '../services/permissions.js';
import { functionalitiesService } from '../services/functionalities.js';

const LOGIN_PATH = '/auth/login';
const PLATFORM = 'ADMIN'; // valor de plataforma para el panel de administración

// Funcionalidades de la compañía activa (p. ej. `functionality_taxes`). Se mantienen en memoria
// (no se persisten): se recargan al iniciar sesión o cambiar de compañía. Caché simple + listeners
// para que el hook `useFunctionalities` reaccione sin context global.
let _functionalities = [];
const _funcListeners = new Set();
const _notifyFunctionalities = () => {
  for (const l of _funcListeners) { try { l(); } catch { /* aislado */ } }
};

export const auth = {
  /**
   * Inicia sesión contra el backend y persiste la sesión.
   * @param {{ phoneCode:string, phoneNumber:string, password:string, remember?:boolean }} creds
   * @returns {Promise<object>} datos de sesión { auth, user, company }
   */
  async login({ phoneCode, phoneNumber, password, remember = false }) {
    const data = await http.post(
      LOGIN_PATH,
      {
        phone_code: phoneCode,
        phone_number: phoneNumber,
        password,
        platform: PLATFORM,
      },
      { auth: false }
    );
    tokenManager.setSession(data, { remember });
    // Tras el login, consulta y persiste los permisos de la compañía activa (caché ~30 min).
    await this.loadPermissions(undefined, { force: true });
    // Y las funcionalidades de la compañía (impuestos, etc.); no bloquea si falla.
    await this.loadFunctionalities(undefined, { force: true });
    return data;
  },

  /** Cierra la sesión local (el backend no expone logout). */
  logout() {
    tokenManager.clearSession();
    _functionalities = [];
    _notifyFunctionalities();
  },

  // ─── Permisos (qué módulos/funcionalidades puede ver el usuario) ────────────

  /**
   * Devuelve los permisos del usuario en la compañía activa, consultándolos al backend solo si
   * el caché está vencido (TTL ~30 min) o si `force` es true. Se persisten localmente.
   * @param {string|number} [companyRef] id/username de compañía; por defecto, la de la sesión.
   * @param {{ force?: boolean }} [opts] force=true ignora el caché (login / cambio de compañía).
   * @returns {Promise<string[]>} lista de permisos (conserva lo previo si la consulta falla).
   */
  async loadPermissions(companyRef, { force = false } = {}) {
    // Caché vigente y sin forzar: no se consulta el servicio.
    if (!force && tokenManager.permissionsFresh()) return tokenManager.getPermissions();

    const company = tokenManager.getSession().company;
    const ref = companyRef ?? (company && (company.username ?? company.id));
    if (!ref) {
      tokenManager.setPermissions([]);
      return [];
    }
    try {
      const data = await permissionsService.myPermissions(ref);
      const perms = (data && data.permissions) || [];
      tokenManager.setPermissions(perms);
      return perms;
    } catch {
      // Error transitorio: conserva los permisos ya guardados, no bloquea la sesión.
      return tokenManager.getPermissions();
    }
  },

  /** Permisos guardados de la compañía activa. */
  getPermissions() {
    return tokenManager.getPermissions();
  },

  /** ¿El usuario tiene este permiso? */
  can(permission) {
    return tokenManager.getPermissions().includes(permission);
  },

  /** ¿El usuario tiene alguno de estos permisos? */
  canAny(permissions = []) {
    const owned = tokenManager.getPermissions();
    return permissions.some((p) => owned.includes(p));
  },

  /** Suscribe un listener a cambios de permisos (login / cambio de compañía). */
  onPermissionsChange(listener) {
    return tokenManager.subscribePermissions(listener);
  },

  // ─── Funcionalidades (de la compañía activa) ────────────────────────────────

  /**
   * Carga las funcionalidades de la compañía activa. Sin `force` solo consulta si aún no hay
   * ninguna en memoria (se recargan en login / cambio de compañía). Conserva las previas si falla.
   * @param {string|number} [companyRef] id/username; por defecto, la de la sesión.
   * @param {{ force?: boolean }} [opts]
   * @returns {Promise<Array>} funcionalidades [{ id, name, description, is_active }].
   */
  async loadFunctionalities(companyRef, { force = false } = {}) {
    if (!force && _functionalities.length) return _functionalities;
    const company = tokenManager.getSession().company;
    const ref = companyRef ?? (company && (company.username ?? company.id));
    if (!ref) { _functionalities = []; _notifyFunctionalities(); return []; }
    try {
      const data = await functionalitiesService.companyFunctionalities(ref);
      _functionalities = Array.isArray(data) ? data : [];
      _notifyFunctionalities();
      return _functionalities;
    } catch {
      return _functionalities; // error transitorio: conserva lo que haya
    }
  },

  /** Funcionalidades guardadas de la compañía activa. */
  getFunctionalities() {
    return _functionalities;
  },

  /** ¿La compañía activa tiene activa esta funcionalidad? (por nombre, p. ej. 'functionality_taxes'). */
  hasFunctionality(name) {
    return _functionalities.some((f) => f.name === name && (f.is_active === true || f.is_active === 1));
  },

  /** Suscribe un listener a cambios de funcionalidades. Devuelve función para desuscribir. */
  onFunctionalitiesChange(listener) {
    _funcListeners.add(listener);
    return () => _funcListeners.delete(listener);
  },

  /** Devuelve un access token válido (refrescando si hace falta) o null. */
  getToken(opts) {
    return tokenManager.getToken(opts);
  },

  /** ¿Hay una sesión guardada? (token o refresh token presentes). */
  isAuthenticated() {
    if (http.useMock) return !!tokenManager.getSession().token;
    const { token, refreshToken } = tokenManager.getSession();
    return !!(token || refreshToken);
  },

  /** Usuario autenticado guardado en la sesión. */
  getUser() {
    return tokenManager.getSession().user;
  },

  /** Empresa (tenant) activa guardada en la sesión. */
  getCompany() {
    return tokenManager.getSession().company;
  },

  /** Suscribe un listener al cierre de sesión forzado. Devuelve función para desuscribir. */
  onSessionExpired(listener) {
    return tokenManager.subscribe(listener);
  },
};

// Cerebro del token de Piddet.
//
// Única responsabilidad: entregar SIEMPRE un access token válido a través de getToken(),
// refrescándolo por debajo cuando expira. No conoce la UI ni hace fetch directo: delega el
// transporte en el HttpClient inyectado (ver http/client.js).
//
//   getToken({ force }) → token válido | null
//     - token vigente            → lo devuelve
//     - expirado / por expirar   → refresh() transparente
//     - refresh inválido         → limpia sesión + emite 'session-expired' + lanza

import { saveSession, updateTokens, updateCompany, readSession, savePermissions, clearSession as clearStorage } from './storage.js';

const SKEW_SECONDS = 60; // margen para refrescar antes de la expiración real
const REFRESH_PATH = '/auth/refresh-tokens';
const PERMISSIONS_TTL_SECONDS = 30 * 60; // los permisos se cachean 30 min antes de re-consultar

class TokenManager {
  constructor() {
    this.client = null; // HttpClient, inyectado en el wiring
    this._refreshPromise = null; // dedupe de refrescos concurrentes
    this._listeners = new Set(); // suscriptores a 'session-expired'
    this._permListeners = new Set(); // suscriptores a cambios de permisos
    this._companyListeners = new Set(); // suscriptores a cambios de empresa activa
  }

  /** Inyecta el HttpClient (cableado en http/client.js). */
  attachClient(client) {
    this.client = client;
    return this;
  }

  get _useMock() {
    return !!(this.client && this.client.useMock);
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  /**
   * Devuelve un access token válido o null si no hay sesión.
   * @param {{ force?: boolean }} opts  force=true fuerza un refresh aunque el token parezca válido.
   */
  async getToken({ force = false } = {}) {
    if (this._useMock) return 'demo-token';

    const { token, refreshToken, expiresAt } = readSession();
    if (!token && !refreshToken) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    const stillValid = token && expiresAt && expiresAt - nowSec > SKEW_SECONDS;

    if (stillValid && !force) return token;

    if (!refreshToken) {
      // No hay con qué refrescar: sesión inservible.
      this.clearSession();
      return null;
    }

    return this.refresh();
  }

  /** Refresca el access token. Deduplica llamadas concurrentes en un único request. */
  refresh() {
    if (this._refreshPromise) return this._refreshPromise;

    this._refreshPromise = this._doRefresh().finally(() => {
      this._refreshPromise = null;
    });
    return this._refreshPromise;
  }

  async _doRefresh() {
    const { refreshToken } = readSession();
    if (!refreshToken) {
      this.clearSession();
      this.notifySessionExpired();
      throw new Error('No hay refresh token');
    }

    try {
      // El refresh viaja por el cliente con auth:false (no requiere Bearer y evita recursión).
      const data = await this.client.post(REFRESH_PATH, { refresh_token: refreshToken }, { auth: false });
      const auth = data && data.auth ? data.auth : data;
      updateTokens({
        token: auth.token,
        refreshToken: auth.refresh_token,
        expiresAt: auth.expiration_at,
      });
      return auth.token;
    } catch (err) {
      // Refresh inválido/expirado → cerrar sesión.
      this.clearSession();
      this.notifySessionExpired();
      throw err;
    }
  }

  /** Persiste la sesión tras un login. `data` = { auth:{token,expiration_at,refresh_token}, user, company }. */
  setSession(data, { remember = false } = {}) {
    const auth = data && data.auth ? data.auth : {};
    saveSession(
      {
        token: auth.token,
        refreshToken: auth.refresh_token,
        expiresAt: auth.expiration_at,
        user: data ? data.user : null,
        company: data ? data.company : null,
      },
      { remember }
    );
  }

  /** Datos guardados de la sesión actual. */
  getSession() {
    return readSession();
  }

  /** Reescribe la empresa activa persistida y notifica a los suscriptores. */
  setCompany(company) {
    updateCompany(company);
    this.notifyCompanyChanged();
  }

  /** Suscribe un listener a cambios de empresa activa. Devuelve función para desuscribir. */
  subscribeCompany(listener) {
    this._companyListeners.add(listener);
    return () => this._companyListeners.delete(listener);
  }

  notifyCompanyChanged() {
    for (const listener of this._companyListeners) {
      try {
        listener();
      } catch {
        /* un listener no debe romper a los demás */
      }
    }
  }

  // ─── Permisos (de la compañía activa) ───────────────────────────────────────

  /** Persiste los permisos con vencimiento (ahora + TTL) y notifica a los suscriptores. */
  setPermissions(permissions) {
    const expiresAt = Math.floor(Date.now() / 1000) + PERMISSIONS_TTL_SECONDS;
    savePermissions(permissions || [], expiresAt);
    this.notifyPermissionsChanged();
  }

  /** Permisos guardados de la sesión actual. */
  getPermissions() {
    return readSession().permissions || [];
  }

  /** ¿Los permisos cacheados siguen vigentes (no vencidos)? */
  permissionsFresh() {
    const { permissionsExpiresAt } = readSession();
    return permissionsExpiresAt > Math.floor(Date.now() / 1000);
  }

  /** Suscribe un listener a cambios de permisos. Devuelve función para desuscribir. */
  subscribePermissions(listener) {
    this._permListeners.add(listener);
    return () => this._permListeners.delete(listener);
  }

  notifyPermissionsChanged() {
    for (const listener of this._permListeners) {
      try {
        listener();
      } catch {
        /* un listener no debe romper a los demás */
      }
    }
  }

  /** Borra la sesión local. */
  clearSession() {
    clearStorage();
  }

  // ─── Eventos (cierre de sesión forzado) ─────────────────────────────────────

  /** Suscribe un listener al evento de sesión expirada. Devuelve función para desuscribir. */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Notifica a la app que la sesión ya no es válida (refresh fallido / 401 definitivo). */
  notifySessionExpired() {
    for (const listener of this._listeners) {
      try {
        listener();
      } catch {
        /* un listener no debe romper a los demás */
      }
    }
  }
}

export const tokenManager = new TokenManager();

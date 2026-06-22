// Cliente HTTP de Piddet — transporte ÚNICO hacia el backend.
//
// TODA llamada al backend (incluidos login y refresh) pasa por esta clase. Centraliza:
//   - headers (JSON + Authorization: Bearer <token>)
//   - obtención del token vía tokenManager.getToken() (salvo auth:false: login/refresh)
//   - desempaquetado del envoltorio del backend  { status, message, data } → data
//   - manejo de errores y reintento único ante 401 (token revocado server-side)
//   - modo demo (mock) sin backend
//
// No conoce React ni la UI. El tokenManager se inyecta tras construir (ver http/client.js)
// para evitar dependencias circulares.

export class HttpClient {
  /** @param {{ baseURL?: string, useMock?: boolean, resolveMock?: (path:string)=>any, mockLatency?: number }} opts */
  constructor({ baseURL = '', useMock = false, resolveMock = null, mockLatency = 250 } = {}) {
    this.baseURL = baseURL;
    this.useMock = useMock;
    this.resolveMock = resolveMock;
    this.mockLatency = mockLatency;
    this.tokenManager = null; // inyectado por http/client.js
  }

  /** Inyecta el cerebro del token (cableado en http/client.js). */
  attachTokenManager(tokenManager) {
    this.tokenManager = tokenManager;
    return this;
  }

  // ─── Atajos ─────────────────────────────────────────────────────────────
  get(path, opts) {
    return this.request(path, { ...opts, method: 'GET' });
  }
  post(path, body, opts) {
    return this.request(path, { ...opts, method: 'POST', body });
  }
  put(path, body, opts) {
    return this.request(path, { ...opts, method: 'PUT', body });
  }
  patch(path, body, opts) {
    return this.request(path, { ...opts, method: 'PATCH', body });
  }
  del(path, opts) {
    return this.request(path, { ...opts, method: 'DELETE' });
  }

  /**
   * Punto único de petición.
   * @param {string} path  ruta relativa al baseURL (p. ej. '/auth/login')
   * @param {{ method?: string, body?: any, auth?: boolean, paginated?: boolean }} opts
   *        auth=false → no adjunta token (login/refresh) y no reintenta por 401.
   *        paginated=true → devuelve { items, pagination } (data + metadata del backend).
   */
  async request(path, { method = 'GET', body, auth = true, paginated = false } = {}) {
    // --- Modo demo (sin backend) ---
    if (this.useMock) {
      await new Promise((r) => setTimeout(r, this.mockLatency));
      // El resolver recibe método y body para poder simular mutaciones (POST/PUT/DELETE)
      // sobre datos en memoria. Los resolvers de solo lectura ignoran el 2º argumento.
      const data = this.resolveMock ? this.resolveMock(path, { method, body }) : null;
      if (data == null) throw new Error(`Mock sin datos para ${path}`);
      return data;
    }

    // --- Modo real (fetch) ---
    let res = await this._fetch(path, { method, body, auth });

    // Reintento único ante 401 en llamadas autenticadas: fuerza refresh y reintenta.
    if (res.status === 401 && auth && this.tokenManager) {
      try {
        await this.tokenManager.getToken({ force: true });
        res = await this._fetch(path, { method, body, auth });
      } catch {
        // El refresh falló: getToken ya limpió la sesión y notificó.
        throw new Error('Sesión expirada');
      }
      if (res.status === 401) {
        this.tokenManager.notifySessionExpired();
      }
    }

    return this._parse(res, { paginated });
  }

  // ─── Internos ───────────────────────────────────────────────────────────

  async _fetch(path, { method, body, auth }) {
    // FormData (subida de archivos): el navegador define Content-Type con su boundary; no se
    // serializa a JSON ni se fija el header manualmente.
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;

    const headers = { Accept: 'application/json' };
    if (!isForm) headers['Content-Type'] = 'application/json';

    if (auth && this.tokenManager) {
      const token = await this.tokenManager.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    return fetch(this.baseURL + path, {
      method,
      headers,
      body: isForm ? body : (body ? JSON.stringify(body) : undefined),
    });
  }

  async _parse(res, { paginated = false } = {}) {
    const payload = res.status === 204 ? null : await res.json().catch(() => null);

    if (!res.ok) {
      const msg = (payload && payload.message) || res.statusText || `Error ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    // Desempaqueta el envoltorio { status, message, data, metadata } del backend Piddet.
    if (payload && typeof payload === 'object' && 'data' in payload && 'status' in payload) {
      if (payload.status === 'error' || payload.status === false) {
        const err = new Error(payload.message || 'Operación fallida');
        err.status = res.status;
        throw err;
      }
      // Listados paginados: conserva los metadatos de paginación junto a los items.
      if (paginated) return { items: payload.data || [], pagination: payload.metadata || null };
      return payload.data;
    }
    return payload;
  }
}

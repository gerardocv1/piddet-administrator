# Especificación Técnica del Proyecto

> Generado: 2026-06-19

## Stack Tecnológico

- **Frontend (lib):** React 18 (JSX, sin TypeScript).
- **Routing:** react-router-dom v6.
- **Build system:** Vite 5.
- **CSS:** CSS Modules + variables (design tokens). Sin librerías de CSS ni estilos inline.
- **Iconos:** FontAwesome 6 vía CDN (`index.html`), se pasan como string de clase.
- **Backend:** API REST externa (configurable). Envoltorio de respuesta `{ status, message, data, metadata }`.
- **Persistencia local:** `localStorage` / `sessionStorage` (sesión y tema).
- **Sin** test runner, linter ni TypeScript configurados.

## Arquitectura

SPA de panel de administración multi-tenant (Piddet: pedidos, menús, productos, tiendas,
mesas). Una empresa (`COMPANY`) agrupa tiendas/productos; el sidebar permite cambiar la
empresa activa.

**Capas (de afuera hacia adentro):**

```
Pantallas (src/screens)  ──usa──▶  useResource (hook)  ──llama──▶  api (barril)
                                                                      │
                                              ┌───────────────────────┤
                                              ▼                       ▼
                                   services/<dominio>.js        auth (fachada)
                                              │                       │
                                              └────────▶ http (HttpClient único) ◀──┘
                                                              │
                                                  ┌───────────┴───────────┐
                                                  ▼                       ▼
                                          fetch(VITE_API_URL)       mock (data/mock.js)
```

**Principios:**

- **Un único transporte.** Toda llamada al backend (incluidos login y refresh) pasa por
  `HttpClient`. Headers, Bearer, desempaquetado del envoltorio, reintento ante 401 y modo
  demo viven ahí; nadie más hace `fetch`.
- **Servicios por dominio.** Los endpoints se declaran en `src/lib/services/<dominio>.js`,
  no en las pantallas. `api` es solo un **barril agregador** que los compone.
- **Auth aislada.** Token, refresh, persistencia y "recordarme" viven en `src/lib/auth/`.
  El resto de la app usa solo la fachada `auth`; nunca toca `tokenManager` ni `storage`.
- **Sin estado global.** No hay Redux ni context para datos. Cada pantalla carga lo suyo
  con `useResource`.
- **Mock conmutable.** `VITE_API_URL` vacío → todo resuelve contra `data/mock.js` con
  latencia simulada. Con valor → `fetch` real.

## Estructura de Carpetas Clave

| Carpeta / archivo | Propósito |
|---|---|
| `src/lib/http/HttpClient.js` | Clase de transporte: fetch, headers, Bearer, desempaquetado, 401, mock. No conoce React. |
| `src/lib/http/client.js` | Singleton del `HttpClient` + wiring con `tokenManager` (evita imports circulares). |
| `src/lib/services/` | **Un archivo por dominio.** Declara los endpoints (`get/post/put/del`) de ese dominio. |
| `src/lib/api.js` | Barril agregador: `{ ...productsService, ... }`. Superficie única para las pantallas. |
| `src/lib/auth/` | Fachada `auth`, `tokenManager` (refresh/dedupe), `storage` (remember-me), `RequireAuth`. También carga/persiste los permisos de la compañía activa. |
| `src/lib/permissions/` | Control de acceso por módulo: mapa `modules.js` (ruta→permiso), `usePermissions`, `RequirePermission`. |
| `src/lib/useResource.js` | Hook de consumo: `{ data, setData, loading, error, reload }`. |
| `src/data/mock.js` | Datos de ejemplo + `resolveMock(path)` para el modo demo. |
| `src/components/` | Componentes por categoría (core/forms/data/feedback/navigation) + barril `index.js`. |
| `src/screens/` | Una pantalla por módulo funcional. |
| `src/styles/tokens.css` | Variables CSS globales (colores, espaciados, fuentes) + tema oscuro. |

## Cliente HTTP

`HttpClient` (`src/lib/http/HttpClient.js`) — punto único de petición:

- **Atajos:** `http.get(path, opts)`, `http.post(path, body, opts)`, `http.put(...)`, `http.del(...)`.
- **Opciones de `request`:**
  - `auth: false` → no adjunta Bearer y no reintenta por 401 (úsalo solo en login/refresh).
  - `paginated: true` → devuelve `{ items, pagination }` (data + `metadata` del backend).
- **Desempaquetado:** respuestas con forma `{ status, message, data }` se reducen a `data`;
  `status === 'error'` lanza `Error` con `message` y `.status`.
- **401:** en llamadas autenticadas fuerza un refresh (`tokenManager.getToken({ force: true })`)
  y reintenta una sola vez; si vuelve 401, emite `session-expired`.
- **Modo demo:** si `useMock`, resuelve vía `resolveMock(path)` con latencia simulada.

El singleton se construye en `src/lib/http/client.js`, que también lee
`VITE_API_URL` y expone `USE_MOCK`.

## Autenticación

`src/lib/auth/` — fachada `auth` como superficie única:

- `auth.login(creds)` — POST `/auth/login` (`auth:false`), persiste la sesión.
- `auth.logout()` — limpia la sesión local (el backend no expone logout).
- `auth.getToken()` — token válido (refresca si hace falta) o `null`.
- `auth.isAuthenticated()`, `auth.getUser()`, `auth.getCompany()`.
- `auth.onSessionExpired(listener)` — suscribe al cierre de sesión forzado.
- `auth.loadPermissions([companyRef], { force })` — devuelve los permisos de la compañía activa,
  consultando al backend solo si el caché venció (TTL ~30 min) o si `force` (login / cambio de
  compañía); los persiste localmente.
- `auth.getPermissions()`, `auth.can(perm)`, `auth.canAny([...])`, `auth.onPermissionsChange(l)`.

Piezas internas (no se usan fuera de `auth/`):

- `tokenManager.js` — entrega siempre un access token válido; refresh transparente con
  **dedupe** de llamadas concurrentes; emite `session-expired` si el refresh falla.
- `storage.js` — persiste según "recordarme": `localStorage` (persistente) vs
  `sessionStorage` (sesión corta); marcador `piddet_persist` para leer de forma determinista.
- `RequireAuth.jsx` — guard de rutas.

El token viaja como `Authorization: Bearer <token>`.

## Rutas (frontend)

`react-router-dom` v6 en `src/App.jsx`. `/login` es público; `/` monta `Layout` (Sidebar +
Topbar + `<Outlet>`) con rutas hijas (`products`, `categories`, `toppings`, `tables`,
`stores`, `users`, `roles`). Sin token, todo redirige a `/login`. Rutas en **inglés**;
texto visible al usuario en **español**.

Cada ruta de módulo se envuelve en `RequirePermission` (gateo por permiso, whitelist estricta).
El índice `/` (Inicio/Dashboard) es siempre accesible y es la landing por defecto; entrar a un
módulo sin permiso redirige a Inicio. Detalle en `specs/guides/permissions.md`.

## Vistas / Componentes

> Guía de uso/creación de componentes: `specs/guides/ui-components.md`.

Importar siempre desde el barril `src/components/index.js` (la categoría es transparente):

```jsx
import { Button, Card, DataTable, Badge, Switch, Modal } from '../components';
```

Componentes que centralizan patrones (usarlos en vez de reimplementar):

| Componente | Propósito | Props / claves |
|---|---|---|
| `DataTable` | Tabla de datos con estados | `columns`, `rows`, `loading`, `error`, `empty` |
| `FilterBar` | Filtros responsive + chips + búsqueda | array de filtros `type: 'multi'|'select'|'toggle'` |
| `Modal` | Confirmaciones y formularios | `size="sm"` (confirmación) / `"md"`/`"lg"` (crear/editar) |

## Estilos (CSS)

> Guía de estilos, tokens y modo oscuro: `specs/guides/styling.md`.

- **CSS Modules + variables, sin excepciones.** Cada componente y pantalla tiene su `*.module.css`.
- **Design tokens** en `src/styles/tokens.css`: todos los colores, espaciados y tipografías
  son variables CSS. Para cambiar un color, se edita la variable allí.
- **Modo oscuro:** el bloque `[data-theme="dark"]` reasigna las mismas variables; los
  componentes no necesitan lógica de tema. Se aplica como `data-theme` en `<html>` y persiste
  en `localStorage` (`piddet_theme`).

## Flujo estándar de una pantalla

```jsx
const { data, setData, loading, error, reload } = useResource(api.products, []);
```

1. La pantalla pide su recurso con `useResource(api.<metodo>, inicial)`.
2. `useResource` llama al método de `api`, que delega en el servicio del dominio y este en `http`.
3. Renderiza dentro de `<Card><DataTable loading={loading} error={error} .../></Card>`,
   con `FilterBar` arriba si hay filtros.
4. **Mutaciones optimistas** sobre el estado local con `setData` (ver `toggle`/`remove` en
   `screens/Products.jsx`).

## Convenciones y Patrones

- Nombres de **método** en inglés (`createProduct`); **rutas** (`/productos`) y **claves del
  JSON** (`cat`, `avail`, `estado`, `rol`) se mantienen como las expone el backend.
- Para adaptar a otro backend: ajustar rutas en `services/` o headers en `http/`, nunca en
  las pantallas.
- No copiar el patrón `api.x().then(set)` manualmente: usar `useResource`.
- Los modales de crear/eliminar son ejemplos de UI; aún no llaman a los `api.create*`/`delete*`.

## Sistema de Compilación / Assets

```bash
npm run dev      # desarrollo en http://localhost:5173
npm run build    # build de producción en /dist
npm run preview  # sirve /dist localmente
```

Entrypoint: `index.html` → `src/main.jsx`. Variable de entorno: `VITE_API_URL`
(ver `.env.example`).

## Documentación Existente

- `specs/functional.md` — especificación funcional (módulos y flujos).
- `specs/guides/backend-service.md` — guía paso a paso para añadir un servicio de backend.
- `specs/guides/permissions.md` — guía de permisos y visibilidad de módulos.
- `specs/guides/ui-components.md` — guía de componentes de UI.
- `specs/guides/styling.md` — guía de estilos, tokens y modo oscuro.
- `CLAUDE.md` — hoja de ruta: comandos, reglas innegociables y tabla de referencias a `specs/`.
- `README.md` — pendientes de marca conocidos.

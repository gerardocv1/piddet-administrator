# Especificación Técnica del Proyecto

> Actualizado: 2026-08-20 (rutas y notas alineadas con el código).

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

SPA de panel de administración multi-compañía (Piddet: productos y menús, facturas, gastos,
turnos de caja, mesas, reservas, reportes y accesos). Una compañía (`COMPANY`) agrupa todo lo
demás; el sidebar permite cambiar la compañía activa, lo que fuerza una recarga completa del
navegador. El panel es cliente de `backend-piddet`; los pedidos se toman en `piddet-pos`.

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

`react-router-dom` v6 en `src/App.jsx`. `/login` es público; `/` monta `Layout` (Sidebar en
escritorio + Topbar + `<Outlet>` + dock en móvil) con las rutas hijas de cada módulo: `more`
(menú completo móvil, destino de «Más» en el dock; en escritorio redirige a Inicio),
`products`, `product-categories`,
`menus`, `reservations`, `rentable-units`, `invoices`, `sales-report`, `expenses`,
`expense-categories`, `tables`, `shifts`, `stores`, `sync-failures`, `users`, `roles`,
`permissions`, `company`. Sin token, todo redirige a `/login`. Rutas en **inglés**; texto
visible al usuario en **español**.

El mapa ruta → permiso (y ruta → funcionalidad) es único y vive en
`src/lib/permissions/modules.js`; el catálogo explicado está en `specs/permissions-catalog.md`.

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

## Sistema de Compilación / Assets

```bash
npm run dev      # desarrollo en http://localhost:5173
npm run build    # build de producción en /dist
npm run preview  # sirve /dist localmente
```

Entrypoint: `index.html` → `src/main.jsx`. Variable de entorno: `VITE_API_URL`
(ver `.env.example`).

## PWA (instalable en Android/iOS)

El panel se instala como aplicación desde Chrome ("Instalar app") o desde el menú *Compartir* de
Safari ("Agregar a Inicio") y se abre a pantalla completa, sin barra del navegador
(`display: standalone`).

Instalada con sesión iniciada, toma el **nombre y el icono de la compañía activa**, que se
configuran en el perfil de empresa (sección *Logo*):

| Campo | Qué es |
|---|---|
| `icon` | El logo de la compañía. Va centrado en el icono, sin placa detrás. |
| `app_name` | El nombre bajo el icono. Vacío = el nombre comercial. Caben pocas letras, por eso se separa de `name`. |
| `app_icon_bg` | Fondo del icono: **un solo color**, del catálogo `ICON_BACKGROUNDS` (las paletas de marca más blanco). Vacío = sigue a `brand_primary`. El blanco existe porque un logo oscuro sobre fondo oscuro se perdería. |

Piezas:

| Archivo | Rol |
|---|---|
| `public/manifest.webmanifest` | Identidad por defecto (sin sesión): iconos y colores de Piddet. |
| `public/sw.js` | Service worker: red primero para el shell, caché para assets con hash e iconos; nunca cachea `/api` ni otros orígenes. Requisito de Chrome para ofrecer la instalación. |
| `src/lib/pwa.js` | `registerServiceWorker()` y `useInstallPrompt()`, que alimenta el botón "Instalar app". |
| **Script en línea al final del `<head>`** (`index.html`) | **Dueño de toda la identidad instalable**: inserta el `<link rel="manifest">` con el manifest de la compañía, el `apple-touch-icon`, las metas y el `<title>`, durante el parseo del documento. |
| `src/lib/brand/applyCompanyPwa.js` | Solo reenvía a `window.__piddetPwa` para los cambios en caliente (cambio de compañía, guardado del perfil, cierre de sesión). |
| **backend** `GET /public/{compañía}/app-icon-{tamaño}.png` | Sirve el icono ya compuesto: el logo centrado sobre el color de fondo elegido, o la inicial del nombre. |
| `src/screens/CompanyBrandColors.jsx` | `AppIconPreview`, la vista previa del icono en el perfil. Reproduce las reglas del backend, incluida la tinta de la inicial según el fondo. |

### Por qué el icono lo sirve el backend

**No es por compatibilidad:** un `data:` URI como `apple-touch-icon` sí funciona en iOS (se
comprobó en un iPhone, con el icono de inicial correcto). La razón es que componer el logo en el
navegador exige que el almacenamiento mande cabeceras **CORS**: `crossOrigin="anonymous"` es
obligatorio para poder exportar el canvas, y sin esas cabeceras el lienzo queda contaminado,
`toDataURL` falla y el icono cae a la inicial aunque la compañía tenga logo. En el servidor el
logo se lee del disco y no hay CORS de por medio.

De paso el panel se queda sin canvas, sin caché de iconos en `localStorage` y sin esperar a la
fuente del CDN, y el PNG pesa un tercio que el base64 equivalente. Los iconos son URLs reales
servidas por la API (`backend-piddet`: `PublicCompanyAppController` + `AppIconRenderer`) y el
panel solo las construye; llevan un `v` derivado del logo y el color, para que cambiar cualquiera
de los dos estrene URL en vez de dejar servido el icono anterior desde la caché del teléfono.

El **manifest**, en cambio, sigue siendo un blob local: su `scope` y su `start_url` deben ser del
mismo origen que él, y la API puede estar en otro. En modo demo (sin `VITE_API_URL`) se aplica el
nombre de la compañía pero rigen los iconos de Piddet.

### El momento importa, y por partida doble

| Plataforma | De dónde saca el nombre | Cuándo lo fija |
|---|---|---|
| Chrome / Android | El manifest | En `beforeinstallprompt`, que dispara al registrarse el service worker |
| Safari / iOS | **El manifest** (no `apple-mobile-web-app-title`) | Al cargar el documento |

**Por eso arriba no hay `<link rel="manifest">` escrito.** Se comprobó en un iPhone: el script
reescribía `apple-mobile-web-app-title` durante el parseo y aun así «Agregar a Inicio» seguía
proponiendo «Piddet», que es el `short_name` del manifest estático. Si Safari usara la meta habría
funcionado; luego usa el manifest, y lo toma del `<link>` que ya se había parseado 40 líneas antes
del script. Insertándolo desde el script, el primer y único manifest que el navegador llega a ver
es el de la compañía.

Sin sesión (login) o en una página pública, el script inserta el manifest estático de Piddet: la
app sigue siendo instalable, con la identidad de la plataforma.


Aplicarla más tarde —desde un efecto de React, por ejemplo— llega tarde en ambas: el diálogo
sigue proponiendo «Piddet» aunque el manifest ya sea el de la compañía. El script en línea repite
a propósito la lectura de la sesión de `src/lib/auth/storage.js` para no arrastrar el bundle hasta
el `<head>`, y anota el título original en `document.documentElement.dataset.defaultTitle` para
que el módulo pueda restaurarlo al cerrar sesión.

La identidad instalada es la del **momento de instalar**: cambiar de compañía activa después no
renombra el acceso ya creado. El `id` del manifest no cambia por compañía, así que es la misma app
instalada.

Requisitos de despliegue: **HTTPS** y que `/manifest.webmanifest` y `/sw.js` se sirvan desde la
raíz del dominio (el scope del worker debe cubrir `/admin/`). Instalada de verdad —no como acceso
directo—, Android la lista entre las apps y permite desinstalarla desde el propio icono.

El CSS reserva los recortes de pantalla (`env(safe-area-inset-*)` en topbar, dock y
contenido) y usa `100dvh`, porque a pantalla completa el sistema dibuja sobre la app.

### `apple-mobile-web-app-status-bar-style`: dejar en `default`

**No lo cambies a `black-translucent`.** Es tentador porque hace que la app pinte bajo la barra de
estado, pero en la app instalada deja el viewport de maquetación ~47 px más corto que la pantalla:
el dock va fijo a `bottom: 0`, queda anclado por encima del borde real y debajo asoma una franja
de `--bg-body`. Medido en un iPhone 12/13/14 (390×844): el último texto del dock caía en 752 px y
quedaban **91 px** en blanco, cuando lo correcto son ~37 (34 del indicador de inicio + el padding
propio del dock).

Con `default` la app sigue siendo pantalla completa —standalone, sin barra del navegador—, la
barra de estado la dibuja el sistema y el viewport coincide con la pantalla. Ojo: **iOS fija este
estilo al instalar**, así que para ver el cambio hay que quitar la app de la pantalla de inicio y
volver a agregarla.

## Documentación Existente

- `specs/functional.md` — especificación funcional (módulos y flujos).
- `specs/permissions-catalog.md` — qué habilita cada permiso y cada funcionalidad.
- `specs/guides/backend-service.md` — guía paso a paso para añadir un servicio de backend.
- `specs/guides/permissions.md` — guía de permisos y visibilidad de módulos.
- `specs/guides/ui-components.md` — guía de componentes de UI.
- `specs/guides/styling.md` — guía de estilos, tokens y modo oscuro.
- `CLAUDE.md` — hoja de ruta: comandos, reglas innegociables y tabla de referencias a `specs/`.
- Repos hermanos: `backend-piddet` (API, fuente de verdad) y `piddet-pos` (POS/KDS).
- `README.md` — pendientes de marca conocidos.

## Tirar hacia abajo para actualizar (móvil)

`usePullToRefresh` (en `src/lib/`) implementa el gesto sobre `<main>`, que es quien tiene el
scroll: por eso el gesto nativo del navegador no aplica, y en la app instalada directamente no
existe. Solo entra cuando el contenedor está arriba del todo y el arrastre es claramente vertical
hacia abajo; en cualquier otro caso deja pasar el scroll.

Al soltar pasado el umbral emite el evento global `piddet:refresh`, que **escucha cada
`useResource` montado**: se releen los datos de la pantalla —todos, aunque cargue varias cosas a
la vez— sin recargar la aplicación, que en un teléfono cuesta segundos. Para forzarlo desde
código: `requestRefresh()`.

## La app instalada y las versiones nuevas

Tres piezas trabajan juntas para que un despliegue llegue al teléfono:

1. **El service worker pide el shell con `cache: 'no-store'`.** Sin eso, ese `fetch` pasa por la
   caché HTTP del navegador y Safari puede devolver el shell antiguo — que es lo que dejaba la app
   instalada anclada a una versión vieja aunque el despliegue ya estuviera hecho.
2. **`watchForUpdates()`** (`src/lib/appUpdate.js`) compara el bundle que está corriendo con el
   que referencia el shell publicado (el hash del nombre hace de número de versión). Comprueba al
   volver del segundo plano, al recuperar red y al recibir el foco, como mucho una vez por minuto.
   Si difieren, pide al service worker que tire sus cachés y recarga. Hace falta porque una app
   instalada puede quedarse abierta días sin arrancar de cero.
3. **Las cabeceras del servidor**: `index.html` y `sw.js` con `Cache-Control: no-cache`; los
   assets, que llevan hash, cacheables para siempre. Ver el README (despliegue en Forge).

Al cambiar el contenido de `public/sw.js` conviene subir el número de las cachés
(`piddet-shell-vN`): el `activate` borra las que no estén en la lista actual.

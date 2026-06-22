# Guía: cómo implementar un servicio de backend

> Esta es la guía de referencia para **conectar una pantalla con el backend**. Sigue este
> patrón siempre; no introduzcas estado global, ni hagas `fetch` directo, ni declares
> endpoints dentro de las pantallas.

## TL;DR

```
1. Declara el endpoint en  src/lib/services/<dominio>.js   (usa http.get/post/put/del)
2. Agrégalo al barril en   src/lib/api.js                  (spread del servicio)
3. (modo demo) añade su dato en  src/data/mock.js          (resolveMock por path)
4. Consúmelo en la pantalla con  useResource(api.<metodo>, inicial)
```

Una pantalla **nunca** importa `http`, `fetch`, `auth` ni `tokenManager` para datos. Solo
usa `api` (vía `useResource`).

---

## El mapa de capas

```
Pantalla (screens/*.jsx)
   │  useResource(api.products, [])
   ▼
api  (src/lib/api.js)              ← barril: agrega los servicios, NO define endpoints
   │  ...productsService
   ▼
services/<dominio>.js             ← AQUÍ declaras tus endpoints
   │  http.get('/productos')
   ▼
http  (src/lib/http/HttpClient.js) ← transporte único: token, refresh, 401, desempaquetado, mock
   │
   ▼
fetch(VITE_API_URL)  ó  mock (data/mock.js)
```

Cada capa tiene una sola responsabilidad. Si respetas el mapa, no tienes que preocuparte por
headers, token, errores ni modo demo: el cliente HTTP ya lo resuelve.

---

## Carpetas que tocas (y las que NO)

| Necesitas… | Archivo a editar/crear |
|---|---|
| Declarar/editar un endpoint | `src/lib/services/<dominio>.js` |
| Exponerlo a las pantallas | `src/lib/api.js` (añadir al spread) |
| Que funcione en modo demo | `src/data/mock.js` |
| Usarlo en la UI | `src/screens/<Pantalla>.jsx` |

**No edites** `src/lib/http/` ni `src/lib/auth/` para añadir un endpoint normal. Solo se tocan
si cambia el contrato de transporte o de autenticación de **todo** el backend (p. ej. otro
formato de envoltorio, otra cabecera global).

---

## Paso 1 — Declarar el endpoint en su servicio

¿Ya existe un servicio para el dominio? Edítalo. ¿Es un dominio nuevo? Crea
`src/lib/services/<dominio>.js`. Un servicio es un objeto plano de funciones que llaman al
cliente `http`:

```js
// src/lib/services/orders.js
import { http } from '../http/client.js';

export const ordersService = {
  // GET listado
  orders: () => http.get('/pedidos'),
  // GET por id
  order: (id) => http.get(`/pedidos/${id}`),
  // POST crear
  createOrder: (data) => http.post('/pedidos', data),
  // PUT actualizar
  updateOrder: (id, data) => http.put(`/pedidos/${id}`, data),
  // DELETE
  deleteOrder: (id) => http.del(`/pedidos/${id}`),
};
```

Reglas:

- **Nombre del método en inglés** (`createOrder`). **Ruta y claves del JSON** como las expone
  el backend (`/pedidos`, `estado`, `cat`). No traduzcas la ruta.
- El método **devuelve la promesa** de `http.*`. El desempaquetado del envoltorio
  `{ status, message, data }` → `data` ya lo hace `http`; tú recibes el `data` limpio.
- **Listados paginados:** pasa `{ paginated: true }` y recibirás `{ items, pagination }`:

  ```js
  loginHistory: ({ page = 1, perPage = 10 } = {}) =>
    http.get(`/auth/me/login-history?page=${page}&per_page=${perPage}`, { paginated: true }),
  ```

- **No** pases `{ auth: false }` salvo en login/refresh (eso ya vive en `auth/`). Por defecto
  todas las llamadas adjuntan el Bearer y reintentan ante 401.

## Paso 2 — Agregar el servicio al barril `api`

`src/lib/api.js` no define endpoints: importa cada servicio y lo esparce. Añade tu dominio:

```js
import { ordersService } from './services/orders.js';

export const api = {
  login: (creds) => auth.login(creds),
  // ...otros servicios...
  ...ordersService,
};
```

Como se hace con spread, las pantallas siguen llamando `api.orders()`, `api.createOrder()`,
etc. — sin saber de qué archivo salen. **Evita colisiones de nombres** entre servicios (cada
método de `api` debe ser único).

## Paso 3 — Dato de ejemplo para el modo demo

Si `VITE_API_URL` está vacío, `http` resuelve contra `src/data/mock.js` mediante
`resolveMock(path)`. Añade ahí la entrada para tu ruta para que la pantalla funcione sin
backend:

```js
// src/data/mock.js  (dentro de resolveMock, según el patrón existente)
if (path.startsWith('/pedidos')) return MOCK_ORDERS;
```

Mira cómo están mapeadas las rutas actuales en `mock.js` y sigue el mismo estilo.

## Paso 4 — Consumir en la pantalla

Usa siempre `useResource`; no escribas `api.x().then(setState)` a mano (traga errores y crea
carreras):

```jsx
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { Card, DataTable } from '../components';

export default function Orders() {
  const { data: rows, setData, loading, error, reload } = useResource(api.orders, []);

  return (
    <Card>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        error={error}
        empty="No hay pedidos."
      />
    </Card>
  );
}
```

- `useResource(fetcher, inicial, deps)` — `fetcher` debe ser una **referencia estable** de
  `api.*`. Devuelve `{ data, setData, loading, error, reload }`.
- **Recarga manual:** llama `reload()` (p. ej. tras crear/editar).
- **Mutación optimista:** actualiza `data` con `setData` y dispara la llamada; revierte si
  falla. Ejemplo real en `screens/Products.jsx` (`toggle`/`remove`).

---

## Checklist al añadir una pantalla nueva con datos

1. [ ] `src/lib/services/<dominio>.js` con los endpoints (o ampliar uno existente).
2. [ ] Servicio agregado al spread en `src/lib/api.js`.
3. [ ] Entrada en `resolveMock` de `src/data/mock.js` (modo demo).
4. [ ] `src/screens/<Pantalla>.jsx` + su `*.module.css`, cargando con `useResource`.
5. [ ] Render dentro de `<Card><DataTable .../></Card>`, con `FilterBar` si hay filtros.
6. [ ] Ruta hija registrada en `src/App.jsx` (path en inglés) y el ítem en el `Sidebar`.
7. [ ] `npm run build` sin errores.

---

## Errores comunes a evitar

- ❌ Hacer `fetch` directo en una pantalla o componente. → ✅ Siempre vía un servicio + `http`.
- ❌ Declarar endpoints dentro de `api.js`. → ✅ `api.js` solo agrega; los endpoints van en `services/`.
- ❌ Tocar `tokenManager`/`storage` desde una pantalla. → ✅ Usar la fachada `auth`.
- ❌ Reimplementar loading/error/recarga. → ✅ `useResource`.
- ❌ Traducir las rutas o las claves del JSON. → ✅ Métodos en inglés; rutas/claves como el backend.

## ¿Por qué este diseño? (decisión de arquitectura)

El proyecto va a escalar a muchos módulos y muchas llamadas. Por eso:

- **Servicios por dominio** (en vez de un único `api.js` plano): cada dominio queda aislado,
  con espacio para co-localizar sus DTOs, transformaciones y paginación a medida que crece.
  Un archivo por dominio se mantiene legible aunque haya 20+ módulos.
- **`api` como barril agregador:** las pantallas tienen una superficie estable
  (`api.<metodo>`) y no les afecta cómo se organicen los servicios por dentro.
- **Transporte y auth únicos e intocables:** centralizar token, refresh, 401, desempaquetado
  y modo demo en una sola capa evita repetir (y olvidar) esa lógica en cada llamada. Adaptar
  el backend = tocar un solo lugar.

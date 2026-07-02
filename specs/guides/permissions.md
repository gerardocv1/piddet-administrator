# Guía: permisos y visibilidad de módulos

> Consulta esta guía cuando vayas a **habilitar/ocultar un módulo según permisos**, añadir un
> módulo nuevo gateado, o tocar el flujo de carga de permisos.

## Concepto

El backend decide qué puede ver el usuario. Tras el login (y al cambiar de compañía) el front
consulta los **permisos del usuario en la compañía activa** y los guarda en la sesión. Con esos
permisos se deciden qué módulos del menú y qué rutas se muestran.

**Caché con TTL (~30 min).** Para no consultar el servicio en cada navegación, los permisos se
cachean con un vencimiento. Solo se vuelven a pedir al backend cuando el caché está vencido (o
cuando se fuerza). Concretamente:

- **Login:** se consultan siempre (`force`) y se guardan con vencimiento `ahora + 30 min`.
- **Arranque/recarga con sesión:** se consultan **solo si están vencidos**; si siguen vigentes,
  se usan los del storage sin llamar al backend.
- **Cambio de compañía:** se fuerzan (el caché era de la compañía anterior). Si la consulta
  forzada falla, los permisos quedan **vacíos**: nunca se conservan los de otra compañía
  (whitelist estricta). Solo en renovaciones de TTL dentro de la misma compañía un error
  transitorio conserva lo guardado.
- **Logout:** se borran del storage (junto con el resto de la sesión).

El TTL es la constante `PERMISSIONS_TTL_SECONDS` en `src/lib/auth/tokenManager.js`.

Los permisos son **por compañía** (ver modelo multi-compañía en `functional.md`): el mismo
usuario puede tener permisos distintos en cada compañía.

## Contrato del backend

```
GET /companies/{company}/me/permissions      (requiere sesión)
{company} = id o username de la compañía activa

→ data: { roles: string[], permissions: string[] }
```

`permissions` son los nombres expuestos al front (los `is_api = true` en el backend), p. ej.:

| Permiso | Habilita |
|---|---|
| `api-module-products` | Productos |
| `api-module-menus` | Categorías y Toppings |
| `api-company-users` | Usuarios |
| `api-module-orders` | Facturas (órdenes por fecha y su detalle: `/invoices` y `/invoices/:orderId`) |

## Política: whitelist estricta

**Un módulo solo se muestra si el usuario tiene su permiso.** Un módulo sin permiso declarado
queda **oculto** (y su ruta bloqueada). No se asume acceso por defecto.

**Excepción — Inicio (Dashboard):** es el único módulo siempre visible (no requiere permiso).
Está declarado como `HOME_ITEM` con `perm: ALWAYS` y es la landing por defecto del panel.

- Sidebar: solo aparecen los módulos accesibles; un grupo sin módulos visibles no se pinta.
- Rutas: entrar por URL a un módulo sin permiso **redirige** al primer módulo accesible.
- Si el usuario no tiene ningún módulo accesible, se muestra el estado "sin módulos".

## Mapa de módulos (fuente única de verdad)

`src/lib/permissions/modules.js` declara cada módulo y el permiso que lo controla. El Sidebar y
las rutas se gatean a partir de aquí, sin duplicar el mapeo.

```js
export const MODULE_GROUPS = [
  { section: 'Oferta', items: [
    { to: '/products', label: 'Productos', icon: '...', perm: 'api-module-products' },
    { to: '/categories', label: 'Categorías', icon: '...', perm: 'api-module-menus' },
    { to: '/toppings', label: 'Toppings', icon: '...', perm: 'api-module-menus' },
  ]},
  // ...
];
```

- `perm: '<permiso>'` → visible si el usuario lo tiene.
- `perm: ALWAYS` → siempre visible (sin requerir permiso).
- sin `perm` → oculto por defecto (hasta asignarle uno).

## Cómo añadir / habilitar un módulo gateado

1. Declara el módulo en su grupo de `MODULE_GROUPS` con el `perm` que lo controla.
2. Registra su ruta en `src/App.jsx` envuelta en el guard:

   ```jsx
   <Route path="orders" element={
     <RequirePermission path="/orders"><Orders /></RequirePermission>
   } />
   ```

3. Listo: el Sidebar y el guard ya lo muestran/ocultan según el permiso. No hay que tocar nada
   más.

## Capas (dónde vive cada cosa)

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Endpoint | `src/lib/services/permissions.js` | `myPermissions(companyRef)` → GET del backend |
| Carga + persistencia | `src/lib/auth/` (`loadPermissions`, `getPermissions`, `can`) | consultar tras login/switch y guardar en la sesión |
| Mapa módulo→permiso | `src/lib/permissions/modules.js` | qué permiso habilita cada ruta + helpers |
| Hook reactivo | `src/lib/permissions/usePermissions.js` | `{ permissions, can, canAny }` para componentes |
| Guard de ruta | `src/lib/permissions/RequirePermission.jsx` | bloquea/redirige por permiso |

## Usar permisos en un componente

Para mostrar/ocultar acciones (no solo módulos), usa el hook:

```jsx
import { usePermissions } from '../lib/permissions/usePermissions.js';

const { can } = usePermissions();
{can('api-company-users') && <Button>Crear usuario</Button>}
```

Fuera de React, usa la fachada: `auth.can('...')` / `auth.canAny([...])`.

## Notas de implementación

- Los permisos se persisten junto a la sesión (`storage.js`) con su vencimiento, así sobreviven
  a recargas y solo se vuelven a pedir cuando el caché expira (TTL ~30 min) o se fuerza.
- Al **cambiar de compañía**, `Layout` llama a `auth.loadPermissions(nuevaCompañía)` antes de
  volver al inicio, porque los permisos cambian con la compañía.
- **Modo demo:** el mock responde `user-administrator`, `api-module-menus`, `api-module-products`,
  `api-module-company`, `api-module-stores` y `api-module-orders` (ver `mockPermissions` en
  `src/data/mock.js`), de modo que se ven todos los módulos gateados, incluido Facturas.

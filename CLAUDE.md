# CLAUDE.md

Hoja de ruta del proyecto para Claude Code. **No contiene el detalle**: según lo que vayas a
tocar, abre el spec indicado en la tabla de abajo (no leas todos los archivos en cada petición).

Piddet es una SPA de panel de administración SaaS **multi-compañía** para restaurantes
(Vite + React/JSX, sin TypeScript ni tests/linter configurados).

**Concepto central — todo gira en torno a la compañía (`Company`).** Productos, tiendas,
mesas, pedidos y usuarios pertenecen a una compañía (`company_id`) y solo existen dentro de
ella. Un usuario puede pertenecer a varias compañías pero opera bajo una **compañía activa**
(`company_default_id`), con rol/permisos por compañía; cambiarla recarga todo el contexto.
Cualquier listado/creación es **implícitamente de la compañía activa** — nunca asumas datos
globales entre compañías. Detalle en [`specs/functional.md`](specs/functional.md).

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # desarrollo en http://localhost:5173 (abre solo)
npm run build      # build de producción en /dist
npm run preview    # sirve /dist localmente
```

No inventes comandos de test/lint: no existen.

## Modo demo vs. backend real

La app arranca **sin backend** con datos de ejemplo. El interruptor es `VITE_API_URL`:
vacío → todo resuelve contra `src/data/mock.js` (mock); con valor → `fetch` real. Para
conectar: `cp .env.example .env`, define `VITE_API_URL` y reinicia. Detalle en `specs/tech.md`.

## Reglas innegociables

- **Acceso a datos:** nunca `fetch` directo. Endpoints en `src/lib/services/`, expuestos vía
  el barril `src/lib/api.js`, consumidos con `useResource`. Auth solo por la fachada `auth`.
- **Componentes:** importa siempre desde el barril `src/components`.
- **Estilos:** CSS Modules + variables de `src/styles/tokens.css`. Sin estilos inline ni
  librerías de CSS. Nada de valores de color/espaciado a mano.
- **Naming:** nombres de método/ruta/archivo en **inglés**; texto visible al usuario y
  documentación en **español**. Rutas y claves del JSON, como las expone el backend.
- **Estado:** sin Redux/context para datos; cada pantalla carga lo suyo con `useResource`.
- **Permisos:** los módulos se muestran según permisos de la compañía activa (whitelist
  estricta). Al añadir un módulo, decláralo en `src/lib/permissions/modules.js` y envuelve su
  ruta con `RequirePermission`. Permisos actuales: `api-module-products` (Productos: listado,
  Categorías y las opciones/toppings de cada producto), `api-module-menus` (Menús, con sus
  categorías), `user-administrator` (Usuarios: administración de los usuarios vinculados a la
  compañía — vincular/desvincular, editar datos básicos, asignar roles y fijar contraseña
  temporal), `api-module-orders` (Facturas: órdenes de la compañía consultables por fecha en
  `/invoices` — un solo día, hoy por defecto — con detalle completo de solo lectura en
  `/invoices/:orderId`: ítems con opciones, impuestos, pagos, cliente y creador; el detalle
  reusa el permiso del listado). Las **categorías de menú** pertenecen a un menú concreto
  (`menu_id`) y se administran dentro del detalle del menú (`/menus/:menuId`), que reusa el permiso
  de `/menus`; su `position` define el orden con el que se agrupan los productos dentro de ese menú.
  Las **categorías de producto**
  pertenecen a un tipo de ítem (`item_type_id`); el detalle de un producto (`/products/:itemId`)
  reusa el permiso de `/products` y es donde se administran sus grupos de opciones y opciones.
- **Funcionalidades:** algunas capacidades dependen de funcionalidades de la compañía
  (`functionality_taxes`, etc.), independientes de los permisos. Se consultan en
  `/companies/{company}/functionalities` y se exponen con el hook `useFunctionalities().has(name)`
  (p. ej. el selector de impuesto del producto solo aparece con `functionality_taxes` activa).

## Hoja de ruta de documentación (`specs/`)

| Si vas a… | Abre |
|---|---|
| Conectar/cambiar un servicio o endpoint de backend | [`specs/guides/backend-service.md`](specs/guides/backend-service.md) |
| Habilitar/ocultar módulos por permisos (o añadir uno gateado) | [`specs/guides/permissions.md`](specs/guides/permissions.md) |
| Construir o modificar componentes / pantallas | [`specs/guides/ui-components.md`](specs/guides/ui-components.md) |
| Tocar estilos, tokens o modo oscuro | [`specs/guides/styling.md`](specs/guides/styling.md) |
| Entender arquitectura técnica (capas, http, auth, routing, build) | [`specs/tech.md`](specs/tech.md) |
| Entender módulos de negocio y flujos | [`specs/functional.md`](specs/functional.md) |

Al crear un spec de trabajo nuevo (feature/fix), usa el flujo SDD (`/spec`).

## Pendientes de marca conocidos

Fuente del logo `MaditaBold` sustituida por *Baloo 2* (`--font-logo`); el wordmark "piddet" es
texto, no SVG. Documentado en el README.

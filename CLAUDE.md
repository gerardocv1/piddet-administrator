# CLAUDE.md — piddet-administrator

Hoja de ruta del proyecto para Claude Code. **No contiene el detalle**: según lo que vayas a
tocar, abre el spec indicado en la tabla del final (no leas todos los archivos en cada petición).

## Idioma

Responde **siempre en español**. Nombres de método, archivo y ruta en **inglés**; texto visible
al usuario y documentación en **español**. Las claves del JSON, como las expone el backend.

## Ecosistema Piddet

| Repo | Rol |
|---|---|
| `backend-piddet` | API REST Laravel 9 — **única fuente de verdad** (negocio, dinero, permisos) |
| `piddet-administrator` (este) | Panel de administración web: React 18 + Vite, JSX, CSS Modules, PWA |
| `piddet-pos` | POS y pantalla de cocina (Vue 3), offline-first |

Este panel no decide reglas de negocio: las consume. Sin tests ni linter configurados.

## Concepto central — todo gira en torno a la compañía (`Company`)

Productos, tiendas, mesas, pedidos, gastos, turnos, reservas y usuarios pertenecen a una compañía
(`company_id`) y solo existen dentro de ella. Un usuario puede pertenecer a varias compañías pero
opera bajo una **compañía activa** (`company_default_id`), con rol y permisos por compañía;
cambiarla desde el selector fuerza una **recarga completa del navegador**
(`window.location.assign`) para que ninguna pantalla conserve datos de la anterior.

Cualquier listado o creación es **implícitamente de la compañía activa** — nunca asumas datos
globales entre compañías. Detalle en [`specs/functional.md`](specs/functional.md).

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # desarrollo en http://localhost:5173
npm run build      # build de producción en /dist
npm run preview    # sirve /dist localmente
```

No inventes comandos de test/lint: no existen.

## Modo demo vs. backend real

La app arranca **sin backend** con datos de ejemplo. El interruptor es `VITE_API_URL`: vacío →
todo resuelve contra `src/data/mock.js`; con valor → `fetch` real (la URL incluye el prefijo
`/api/v1`). Para conectar: `cp .env.example .env`, define `VITE_API_URL` y reinicia.
Si agregas un endpoint, agrega también su mock. Detalle en `specs/tech.md`.

## Reglas innegociables

- **Acceso a datos:** nunca `fetch` directo. Los endpoints viven en `src/lib/services/`, se
  exponen por el barril `src/lib/api.js` y se consumen con `useResource`. Auth solo por la
  fachada `auth`.
- **Componentes:** importa siempre desde el barril `src/components`.
- **Estilos:** CSS Modules + variables de `src/styles/tokens.css`. Sin estilos inline, sin
  librerías de CSS, sin colores ni espaciados a mano.
- **Estado:** sin Redux ni context para datos; cada pantalla carga lo suyo con `useResource`.
- **Permisos (whitelist estricta):** un módulo se muestra solo si su ruta declara permiso en
  `src/lib/permissions/modules.js` y el usuario lo tiene. Al añadir un módulo: decláralo allí y
  envuelve su ruta con `RequirePermission`.
  → **Qué habilita cada permiso: [`specs/permissions-catalog.md`](specs/permissions-catalog.md).**
- **Funcionalidades:** algunas capacidades dependen además de funcionalidades contratadas por la
  compañía (`functionality_tables`, `functionality_reservations`, `functionality_taxes`,
  `functionality_menu_item_price`, `functionality_gym`, `functionality_expenses`,
  `functionality_shifts`, `functionality_pos`), independientes de los permisos. Se consultan en
  `/companies/{company}/functionalities` y se leen con `useFunctionalities().has(name)`. Se
  administran desde el perfil de empresa (`/company` → *Funcionalidades*), con el permiso
  `company-edit-functionalities`.
- **Alcance `-own`:** varios módulos tienen el par `X` / `X-own`. El filtro por usuario **lo
  aplica el backend** (un recurso ajeno responde 404); el panel solo oculta el filtro por usuario.
- **Nada se borra:** la mesa se desactiva, la factura se cancela, el gasto se anula, el turno se
  cancela o cierra.

## Hoja de ruta de documentación (`specs/`)

| Si vas a… | Abre |
|---|---|
| Conectar/cambiar un servicio o endpoint de backend | [`specs/guides/backend-service.md`](specs/guides/backend-service.md) |
| Habilitar/ocultar módulos por permisos (o añadir uno gateado) | [`specs/guides/permissions.md`](specs/guides/permissions.md) |
| Saber qué habilita un permiso concreto | [`specs/permissions-catalog.md`](specs/permissions-catalog.md) |
| Construir o modificar componentes / pantallas | [`specs/guides/ui-components.md`](specs/guides/ui-components.md) |
| Tocar estilos, tokens o modo oscuro | [`specs/guides/styling.md`](specs/guides/styling.md) |
| Mostrar un error, una confirmación o un aviso al usuario | [`specs/guides/feedback.md`](specs/guides/feedback.md) |
| Tocar la instalación como app (PWA) | [`specs/tech.md`](specs/tech.md) → *PWA* |
| Entender arquitectura técnica (capas, http, auth, routing, build) | [`specs/tech.md`](specs/tech.md) |
| Entender módulos de negocio y flujos | [`specs/functional.md`](specs/functional.md) |

Al crear un spec de trabajo nuevo (feature/fix), usa el flujo SDD (`/spec`).
Si un spec contradice al código, **gana el código**: corrige el spec en el mismo cambio.

## Pendientes de marca conocidos

La fuente del logo `MaditaBold` está sustituida por *Baloo 2* (`--font-logo`); el wordmark
"piddet" es texto, no SVG. Documentado en el README.

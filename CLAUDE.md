# CLAUDE.md

Hoja de ruta del proyecto para Claude Code. **No contiene el detalle**: según lo que vayas a
tocar, abre el spec indicado en la tabla de abajo (no leas todos los archivos en cada petición).

Piddet es una SPA de panel de administración SaaS **multi-compañía** para restaurantes
(Vite + React/JSX, sin TypeScript ni tests/linter configurados).

**Concepto central — todo gira en torno a la compañía (`Company`).** Productos, tiendas,
mesas, pedidos y usuarios pertenecen a una compañía (`company_id`) y solo existen dentro de
ella. Un usuario puede pertenecer a varias compañías pero opera bajo una **compañía activa**
(`company_default_id`), con rol/permisos por compañía; cambiarla desde el selector fuerza una
**recarga completa del navegador** (`window.location.assign`) para que ninguna pantalla conserve
datos de la compañía anterior.
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
  categorías; cada menú tiene un interruptor `is_active` — se enciende/apaga desde el listado o el
  detalle con confirmación, vía `api.setMenuActive` → `PUT /companies/{company}/menus/{id}/active` —
  que decide si se publica en la portada pública y si su carta es accesible; apagado se sigue
  administrando con normalidad), `user-administrator` (Usuarios: administración de los usuarios vinculados a la
  compañía en `/users` — vincular/desvincular, editar datos básicos, asignar roles y fijar
  contraseña temporal. El acceso se da SOLO por roles: el modal de datos no toca accesos y los
  roles se asignan desde su propio modal (`api.updateCompanyUser` con solo `roles`, que el backend
  sincroniza dejando intacto lo demás); los permisos directos ya no se editan desde el panel, los
  que un usuario tenga guardados se conservan. Cada vínculo tiene un TIPO
  (`company_users.user_type_id`: 1 cliente, 2 empleado) que se elige al crear/vincular y se puede
  cambiar al editar; el listado filtra por tipo —empleados por defecto— y por rol
  (`user_type_id` y `_role` en `GET /companies/{company}/users`); los roles del sistema solo
  aparecen en el selector —marcados «Del sistema»— con `admin-general`), `admin-general`
  (administración general: único permiso que habilita los roles del sistema —`super-admin`,
  `client`, `employee`— para asignarlos a un usuario y para eliminarlos en `/roles`; lo trae el
  rol `super-admin` por seeder), `api-module-orders` (Facturas: órdenes de la compañía consultables en
  `/invoices` por rango de fechas —hoy por defecto—, estado y usuario que las registró, con detalle completo en
  `/invoices/:orderId`: ítems con opciones, impuestos, pagos, cliente y creador; el detalle
  reusa el permiso del listado; también gatea el dash de Ventas del Dashboard),
  `api-module-orders-own` (Facturas de empleado: mismo listado y detalle pero SOLO de las que
  registró él — el backend fuerza `creator_id` y el detalle de una factura ajena responde 404; sin
  filtro por usuario en la barra),
  `sales-report` (Reporte de ventas en `/sales-report` — resumen de subtotal/descuentos/impuestos/
  total, ticket promedio, distribución por método de pago, top productos y ventas por día, con
  filtros de rango de fechas, usuario creador y producto vía
  `api.salesReport` → `GET /companies/{company}/metrics/sales-report`) y `sales-report-own`
  (el mismo reporte limitado a lo que registró el usuario, sin filtro por creador),
  `order-cancel` (cancelar una factura desde su detalle con motivo obligatorio — irreversible,
  el motivo queda en el historial de estados y la orden sale de las métricas de ventas; solo
  gatea el botón),
  `order-sync-failure-admin` (Fallos de órdenes: reportes de
  fallo de sincronización del POS en `/sync-failures` — listado por estado de soporte
  pendiente/resuelto/no recuperable — con detalle en `/sync-failures/:reportId` que reusa el
  permiso: edición del JSON de la orden, reintento de creación y cambio de estado; el estado
  `resolved` es terminal), `api-module-expenses` (Gastos: registro de gastos de la compañía
  como encabezado + líneas — categoría, descripción libre y valor — con fotos de la factura
  privadas en S3, proveedor con creación al vuelo y método de pago; listado por rango de
  fechas en `/expenses`, creación en `/expenses/new` — y asistente paso a paso optimizado
  para móvil en `/expenses/quick`, accesible desde el Dashboard —, detalle de solo lectura en
  `/expenses/:expenseId` y categorías en
  `/expense-categories` — árbol global sembrado por la plataforma + categorías propias por
  compañía; todo eso reusa este permiso. El reporte en `/expenses/summary` — tablero del rango
  filtrable por usuario y categoría (subárbol): total/conteo/promedio/gasto más alto, distribución
  por método de pago y por usuario, y top de categorías raíz con drill-down — tiene su propio par
  de permisos: `expenses-report` (toda la compañía) y `expenses-report-own` (solo los gastos que
  registró el usuario, sin filtro por usuario). Las FOTOS del gasto sí se editan desde el detalle mientras
  esté activo: agregar y quitar, borrando también de S3; también gatea el dash de Gastos del
  Dashboard), `api-module-expenses-own` (Gastos para
  empleados: registra gastos y ve listado/detalle SOLO de los suyos — el backend filtra por
  `created_by`; sin Categorías (el Resumen depende de `expenses-report*`); en `modules.js` la ruta `/expenses` declara ambos
  permisos como alternativas `perm: [a, b]`; ve el dash de Gastos del Dashboard calculado solo
  sobre sus gastos — el backend aplica el mismo filtro en `/metrics/expenses-*`) y `expense-annul` (anular un gasto desde su detalle —
  irreversible, las líneas no se editan; solo gatea el botón),
  `api-module-shifts` (Turnos: sesiones de caja en `/shifts` — un turno GLOBAL por compañía o
  de EMPLEADO por cajero, se abre en `/shifts/open` con una base de dinero y el backend le
  asocia automáticamente las ventas y gastos como movimientos con monto/método denormalizados;
  detalle con balance en vivo en `/shifts/:shiftId` y cierre paso a paso en
  `/shifts/:shiftId/close` — contar dinero → balance (base + ventas de todos los métodos −
  gastos, con desglose informativo) → confirmar, registrando sobrante/faltante como ajuste. La
  diferencia se respalda con un DOCUMENTO CONTABLE real para que la contabilidad cuadre con la
  plata contada: el sobrante genera una factura (origen `SHIFT`, ítem de servicio «Sobrante de
  caja», consecutivo propio `A0000001`) y el faltante un gasto (categoría global «Ajustes de
  caja → Faltante de caja», proveedor «Ajuste de caja»); ninguno se asocia a un turno abierto —
  ese dinero ya está contado en el arqueo— y el movimiento de ajuste guarda la referencia
  (`reference_type`/`reference_id`) para enlazar al documento desde el detalle. Este permiso da
  visibilidad de todos los turnos y gestión de los de cajero, y también gatea
  la acción rápida de turnos del Dashboard), `api-module-shifts-own`
  (Turnos para cajeros: abre/cierra y ve SOLO sus turnos — el backend filtra por
  `assigned_user_id`; en `modules.js` la ruta `/shifts` declara ambos permisos como
  alternativas `perm: [a, b]`) y `shift-global-admin` (ÚNICO permiso que abre y cierra el
  turno GLOBAL — gatea la opción en `/shifts/open` y el botón de cierre; el backend lo exige y
  además hace visible el global a quien solo tenga el acceso de cajero; el global no se cierra
  con turnos de cajero abiertos — 409),
  `table-list` (Mesas: rejilla de mesas del local en `/tables` con su estado de ocupación y el
  código QR que escanea el POS —descarga PNG por mesa y hoja imprimible de todas—; requiere
  además la funcionalidad `functionality_tables` de la compañía), `table-create` (crear mesas) y
  `table-update` (editar nombre/capacidad, activar/desactivar y forzar disponible/ocupada,
  incluido "liberar todas"; una mesa nunca se borra, se desactiva),
  `role-list` (Roles: catálogo de roles en `/roles` — cada rol agrupa permisos y es lo único que se
  asigna a un usuario. OJO: el catálogo es de la PLATAFORMA, no de la compañía; crear un rol o
  cambiar sus permisos aplica a todas las compañías que lo usen. CUALQUIER rol se edita y se le
  cambian los permisos (incluidos los del sistema —`super-admin`, `client`, `employee`—); lo que
  exige `admin-general` es ELIMINAR uno del sistema y asignarlo a un usuario. El selector de
  permisos del rol agrupa por módulo en desplegables (colapsados; se abren solos al buscar) y
  muestra la clave del permiso con su descripción debajo. Las acciones se gatean con
  `role-create`, `role-update`, `role-delete` y `role-assign` (este último abre el selector de
  permisos del rol, que además exige `permission-list`); todo cuelga de
  `GET/POST/PUT/DELETE /companies/{company}/permissions/roles[/{id}]` y
  `PUT …/roles/{id}/permissions`, que REEMPLAZA la lista de permisos del rol) y
  `permission-list` (Permisos: catálogo de permisos por módulo en `/permissions`, con buscador,
  filtro por módulo y los roles que otorgan cada uno; `permission-update` habilita el interruptor
  `is_api` vía `PATCH /companies/{company}/permissions/{id}/api-visibility` — un permiso con
  `is_api = false` sigue rigiendo en el backend pero no viaja en `/me/permissions`, así que el panel
  no lo ve ni puede asignarlo). Las **categorías de menú** pertenecen a un menú concreto
  (`menu_id`) y se administran dentro del detalle del menú (`/menus/:menuId`), que reusa el permiso
  de `/menus`; su `position` define el orden con el que se agrupan los productos dentro de ese menú.
  Las **categorías de producto**
  pertenecen a un tipo de ítem (`item_type_id`); el detalle de un producto (`/products/:itemId`)
  reusa el permiso de `/products` y es donde se administran sus grupos de opciones y opciones.
- **Funcionalidades:** algunas capacidades dependen de funcionalidades de la compañía
  (`functionality_taxes`, etc.), independientes de los permisos. Se consultan en
  `/companies/{company}/functionalities` y se exponen con el hook `useFunctionalities().has(name)`
  (p. ej. el selector de impuesto del producto solo aparece con `functionality_taxes` activa, y el
  campo de precio por menú en los modales del detalle del menú solo con `functionality_menu_item_price`
  activa — sin ella los ítems usan siempre el precio base del producto y el backend rechaza `price`).
  El catálogo trae `label`, `icon` (clase FontAwesome) y `description` para mostrarlas al usuario.
  Se administran desde el perfil de empresa (`/company` → tarjeta *Funcionalidades*), gateadas por
  el permiso `company-edit-functionalities`; se guardan con `auth.saveFunctionalities([{ id, is_active }])`,
  que hace `PUT /companies/{company}/functionalities` y refresca el caché en memoria.

## Hoja de ruta de documentación (`specs/`)

| Si vas a… | Abre |
|---|---|
| Conectar/cambiar un servicio o endpoint de backend | [`specs/guides/backend-service.md`](specs/guides/backend-service.md) |
| Habilitar/ocultar módulos por permisos (o añadir uno gateado) | [`specs/guides/permissions.md`](specs/guides/permissions.md) |
| Construir o modificar componentes / pantallas | [`specs/guides/ui-components.md`](specs/guides/ui-components.md) |
| Tocar estilos, tokens o modo oscuro | [`specs/guides/styling.md`](specs/guides/styling.md) |
| Tocar la instalación como app (PWA: manifest, service worker, iconos) | [`specs/tech.md`](specs/tech.md) → *PWA* |
| Entender arquitectura técnica (capas, http, auth, routing, build) | [`specs/tech.md`](specs/tech.md) |
| Entender módulos de negocio y flujos | [`specs/functional.md`](specs/functional.md) |

Al crear un spec de trabajo nuevo (feature/fix), usa el flujo SDD (`/spec`).

## Pendientes de marca conocidos

Fuente del logo `MaditaBold` sustituida por *Baloo 2* (`--font-logo`); el wordmark "piddet" es
texto, no SVG. Documentado en el README.

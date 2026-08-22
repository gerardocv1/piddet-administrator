# Catálogo de permisos del panel

> Fuente de verdad del **mapeo ruta → permiso**: [`src/lib/permissions/modules.js`](../src/lib/permissions/modules.js).
> Este documento explica qué habilita cada permiso y qué reglas de alcance aplica el backend.
> Si el código y este documento discrepan, **gana el código**: corrige el documento en el mismo cambio.

## Cómo funciona el gateo

- **Whitelist estricta.** Un módulo solo se ve si su ruta declara permiso en `modules.js` y el
  usuario lo tiene. Una ruta sin `perm` queda oculta.
- `perm: 'x'` → requiere ese permiso · `perm: ['a','b']` → basta cualquiera (OR) ·
  `perm: ALWAYS` → siempre visible.
- `func: 'functionality_x'` → además exige que la **compañía** tenga esa funcionalidad activa
  (eje independiente de los permisos).
- Cada ruta se envuelve con `RequirePermission`; el Sidebar usa el mismo mapa, así no se duplica.
- Las pantallas de detalle **reusan el permiso del listado** salvo que se indique lo contrario.
- Los permisos con `is_api = false` siguen rigiendo en el backend pero no viajan en
  `GET /companies/{company}/me/permissions`: el panel no los ve ni los puede asignar.

## Alcance `-own`

Varios módulos tienen el par `X` (toda la compañía) y `X-own` (solo lo que registró el usuario).
**El filtro lo aplica siempre el backend** (`creator_id`, `created_by`, `assigned_user_id`) y un
recurso ajeno responde 404. En el panel, la variante `-own` solo cambia la UI: se oculta el
filtro por usuario.

---

## Oferta

| Permiso | Rutas | Qué habilita |
|---|---|---|
| `api-module-products` | `/products`, `/products/:itemId`, `/product-categories` | Catálogo de productos: listado, detalle (grupos de opciones y opciones del producto) y categorías de producto. Las categorías de producto pertenecen a un **tipo de ítem** (`item_type_id`) y se abren desde el menú de acciones del listado (ruta oculta del menú lateral). |
| `api-module-menus` | `/menus`, `/menus/:menuId` | Cartas publicables. Las **categorías de menú** pertenecen a un menú (`menu_id`) y se administran dentro de su detalle; su `position` ordena los productos. Cada menú tiene el interruptor `is_active` (`api.setMenuActive` → `PUT /companies/{company}/menus/{id}/active`), que decide si se publica en la portada pública y si su carta es accesible; apagado se sigue administrando con normalidad. |
| `api-module-reservations` + funcionalidad `functionality_reservations` | `/reservations` | Reservas de hospedaje: calendario, detalle, asistente de creación, check-in/checkout y abonos. |
| `api-module-rentable-units` + funcionalidad `functionality_reservations` | `/rentable-units` | Configuración de unidades rentables (cabañas, habitaciones, lugares), sus espacios, inclusiones y fotos. Los servicios adicionales salen de los ítems tipo servicio del catálogo de productos. |
| `api-module-gym-plans` + funcionalidad `functionality_gym` | `/gym/plans` | Catálogo de planes de membresía del gimnasio (nombre, precio, duración en días, días de gracia, si permite pausar, ítem de facturación del catálogo de productos). Un plan nunca se borra: se desactiva (las suscripciones ya emitidas conservan su propio snapshot del plan). |
| `gym-plans-create` | (acción) | Crear un plan de membresía. |
| `gym-plans-edit` | (acción) | Editar o activar/desactivar un plan de membresía. |
| `api-module-gym` + funcionalidad `functionality_gym` | `/gym/members`, `/gym/members/:memberId`, `/gym/members/:memberId/progress` | Afiliados del gimnasio: personas registradas como usuarios reales de la plataforma (el backend las resuelve como "pasivas" al registrarlas —find-or-create por documento o celular— y las vincula a la compañía, mismo patrón que los huéspedes de Reservas). La ficha guarda solo lo que el gimnasio necesita y `user_profiles` no tiene: talla, objetivo (elegido del catálogo cerrado `GET /gym/goals`, mismo permiso), notas de salud, código de afiliado autogenerado. La ficha también muestra su suscripción, la gráfica de progreso y el historial de mediciones (cada una abre su detalle en un modal). |
| `gym-members-create` | (acción) | Registrar un afiliado nuevo, incluida la **búsqueda previa por celular o correo** (`GET /gym/members/lookup`) que reutiliza su cuenta de plataforma si ya existe en vez de crear otra. |
| `gym-members-edit` | (acción) | Editar la ficha de un afiliado (sexo, talla, objetivo del catálogo, notas de salud, estado) y sus datos personales con "Editar datos" (nombres, correo, documento — actualiza el usuario de la plataforma y los snapshots del gimnasio). El celular no se edita: es la credencial de acceso de la cuenta. |
| `api-module-gym` + funcionalidad `functionality_gym` | `/gym/subscriptions`, `/gym/subscriptions/:subscriptionId` | Listado operativo de todas las suscripciones (filtrable por estado y por "vencen en N días") y el **detalle de la suscripción**: el nombre del afiliado (arriba) navega a su perfil, y aquí viven sus pagos (registrar/anular), la renovación y la cancelación. |
| `gym-subscriptions-create` | (acción) | Dar de alta o renovar la suscripción de un afiliado a un plan (con pago inicial opcional). Si el afiliado tiene una suscripción vigente, la nueva se encadena automáticamente desde el día siguiente a su vencimiento. |
| `gym-subscriptions-cancel` | (acción) | Cancelar una suscripción vigente (irreversible, motivo obligatorio). |
| `gym-payments-create` | (acción) | Registrar un pago sobre una suscripción existente; genera su factura en el módulo de Facturas (origen "Gimnasio"). |
| `gym-payments-annul` | (acción) | Anular un pago de suscripción; cancela su factura (irreversible, motivo obligatorio). |
| `gym-checkins-create` | (acción) | Registrar un chequeo de medidas físicas de un afiliado con el asistente paso a paso (`/gym/members/:memberId/checkin`): una medida por pantalla, solo las configuradas por la compañía. |
| `gym-checkins-edit` | (acción) | Corregir fecha, notas o valores de un chequeo ya registrado (sin efecto contable, no hace falta anularlo). |
| `api-module-gym-plans` + funcionalidad `functionality_gym` | `/gym/measurements` | Ver qué medidas físicas pide el gimnasio a sus afiliados (subconjunto del catálogo: peso, % de grasa, circunferencias…). El asistente de medición solo recorre las activas. |
| `gym-measurement-config` | (acción) | Cambiar esa selección de medidas (los interruptores y el guardar de `/gym/measurements`). |

## Operación

### Ventas

| Permiso | Rutas | Qué habilita |
|---|---|---|
| `api-module-orders` | `/invoices`, `/invoices/:orderId` | Facturas de la compañía por rango de fechas (hoy por defecto), estado y usuario que las registró; detalle con ítems, opciones, impuestos, pagos, cliente y creador. También gatea el dash de Ventas del Dashboard. |
| `api-module-orders-own` | `/invoices`, `/invoices/:orderId` | Mismo listado y detalle pero **solo de lo que registró el usuario**; sin filtro por usuario en la barra. |
| `sales-report` | `/sales-report` | Reporte de ventas (`api.salesReport` → `GET /companies/{company}/metrics/sales-report`): subtotal, descuentos, impuestos, total, ticket promedio, distribución por método de pago, top de productos y ventas por día, con filtros de rango, creador y producto. |
| `sales-report-own` | `/sales-report` | El mismo reporte limitado a lo que registró el usuario, sin filtro por creador. |
| `order-cancel` | (acción) | Cancelar una factura desde su detalle, con motivo obligatorio. Irreversible: el motivo queda en el historial y la orden sale de las métricas. Solo gatea el botón. |

### Egresos

| Permiso | Rutas | Qué habilita |
|---|---|---|
| `api-module-expenses` | `/expenses`, `/expenses/new`, `/expenses/quick`, `/expenses/:expenseId`, `/expense-categories` | Gastos como encabezado + líneas (categoría, descripción libre, valor), con fotos de la factura **privadas en S3**, proveedor con creación al vuelo y método de pago. Incluye el asistente paso a paso optimizado para móvil (`/expenses/quick`, accesible desde el Dashboard), el detalle de solo lectura y las categorías (árbol global sembrado por la plataforma + categorías propias de la compañía). Las **fotos sí se editan** desde el detalle mientras el gasto esté activo (agregar y quitar, borrando también de S3). Gatea el dash de Gastos del Dashboard. |
| `api-module-expenses-own` | `/expenses`, `/expenses/new`, `/expenses/quick`, `/expenses/:expenseId` | Acceso de empleado: registra y ve **solo sus** gastos (el backend filtra por `created_by`). Sin Categorías. Ve el dash de Gastos calculado solo sobre sus gastos (mismo filtro en `/metrics/expenses-*`). |
| `expenses-report` | `/expenses/summary` | Tablero del rango filtrable por usuario y categoría (subárbol): total, conteo, promedio, gasto más alto, distribución por método de pago y por usuario, y top de categorías raíz con drill-down. |
| `expenses-report-own` | `/expenses/summary` | El mismo reporte limitado a los gastos que registró el usuario, sin filtro por usuario. |
| `expense-annul` | (acción) | Anular un gasto desde su detalle. Irreversible; las líneas no se editan. Solo gatea el botón. |

### Mesas

| Permiso | Rutas | Qué habilita |
|---|---|---|
| `table-list` + funcionalidad `functionality_tables` | `/tables` | Rejilla de mesas del local con estado de ocupación y el código QR que escanea el POS (descarga PNG por mesa y hoja imprimible de todas). |
| `table-create` | (acción) | Crear mesas. |
| `table-update` | (acción) | Editar nombre y capacidad, activar/desactivar y forzar disponible/ocupada, incluido «liberar todas». Una mesa **nunca se borra**: se desactiva. |

### Turnos de caja

| Permiso | Rutas | Qué habilita |
|---|---|---|
| `api-module-shifts` | `/shifts`, `/shifts/open`, `/shifts/:shiftId`, `/shifts/:shiftId/close` | Visibilidad de todos los turnos de la compañía y gestión de los de cajero. Un turno es **global** (por compañía) o **de empleado** (por cajero); se abre con una base de dinero y el backend le asocia automáticamente ventas y gastos como movimientos con monto y método denormalizados. El detalle muestra balance en vivo; el cierre es paso a paso (contar dinero → balance = base + ventas − gastos → confirmar) y registra sobrante/faltante como ajuste. Con el turno ABIERTO, desde el menú «⋯» junto a *Cerrar turno*: corregir la base (`api.updateShiftBase` → `PUT /shifts/{id}/base`) o cancelar el turno con motivo obligatorio (`api.cancelShift` → `POST /shifts/{id}/cancel`, irreversible: queda `CANCELLED`, no recibe más movimientos ni bloquea nuevas aperturas; sus movimientos se conservan como historial). Ambas acciones exigen `api-module-shifts` (sin variante `own`) y, para el turno global, además `shift-global-admin`. También gatea la acción rápida de turnos del Dashboard. |
| `api-module-shifts-own` | `/shifts` y subrutas | Acceso de cajero: abre, cierra y ve **solo sus** turnos (el backend filtra por `assigned_user_id`). |
| `shift-global-admin` | (acción) | **Único** permiso que abre y cierra el turno GLOBAL: gatea la opción en `/shifts/open` y el botón de cierre. El backend lo exige y además hace visible el turno global a quien solo tenga el acceso de cajero. El global no se cierra con turnos de cajero abiertos (409). |

> **Respaldo contable del arqueo:** la diferencia del cierre genera un documento real para que la
> contabilidad cuadre con la plata contada. Sobrante → factura (origen `SHIFT`, ítem de servicio
> «Sobrante de caja», consecutivo propio `A0000001`). Faltante → gasto (categoría global
> «Ajustes de caja → Faltante de caja», proveedor «Ajuste de caja»). Ninguno se asocia a un turno
> abierto —ese dinero ya está contado en el arqueo— y el movimiento de ajuste guarda
> `reference_type`/`reference_id` para enlazar al documento desde el detalle.

## Configuración

| Permiso | Rutas | Qué habilita |
|---|---|---|
| `api-module-stores` | `/stores` | Tiendas / locales de la compañía. |
| `item-category-master` | `/admin/product-categories` | Categorías globales de producto (catálogo de plataforma). |
| `order-sync-failure-admin` | `/sync-failures`, `/sync-failures/:reportId` | Reportes de fallo de sincronización del POS, por estado de soporte (pendiente / resuelto / no recuperable). El detalle permite editar el JSON de la orden, reintentar la creación y cambiar el estado; `resolved` es terminal. |
| `company-edit-functionalities` | `/company` (tarjeta *Funcionalidades*) | Activar/desactivar las funcionalidades contratadas de la compañía (`auth.saveFunctionalities` → `PUT /companies/{company}/functionalities`). |

## Accesos (usuarios, roles y permisos)

| Permiso | Rutas | Qué habilita |
|---|---|---|
| `user-administrator` | `/users` | Administración de los usuarios vinculados a la compañía: vincular/desvincular, editar datos básicos, asignar roles y fijar contraseña temporal. **El acceso se da SOLO por roles**: el modal de datos no toca accesos y los roles se asignan desde su propio modal (`api.updateCompanyUser` con solo `roles`, que el backend sincroniza dejando intacto lo demás). Los permisos directos ya no se editan desde el panel; los que un usuario tenga guardados se conservan. Cada vínculo tiene un **tipo** (`company_users.user_type_id`: 1 cliente, 2 empleado) que se elige al vincular y se puede cambiar al editar; el listado filtra por tipo (empleados por defecto) y por rol (`user_type_id` y `_role` en `GET /companies/{company}/users`). Los roles del sistema solo aparecen en el selector —marcados «Del sistema»— con `admin-general`. |
| `role-list` | `/roles` | Catálogo de roles. **Ojo: el catálogo es de la PLATAFORMA, no de la compañía**: crear un rol o cambiar sus permisos aplica a todas las compañías que lo usen. Cualquier rol se edita y se le cambian los permisos, incluidos los del sistema. Endpoints: `GET/POST/PUT/DELETE /companies/{company}/permissions/roles[/{id}]` y `PUT …/roles/{id}/permissions` (que **reemplaza** la lista de permisos del rol). |
| `role-create` / `role-update` / `role-delete` | (acciones) | Crear, editar y eliminar roles. Eliminar un rol **del sistema** exige además `admin-general`. |
| `role-assign` | (acción) | Abre el selector de permisos del rol (exige además `permission-list`). El selector agrupa por módulo en desplegables colapsados —se abren solos al buscar— y muestra la clave del permiso con su descripción debajo. |
| `permission-list` | `/permissions` | Catálogo de permisos por módulo, con buscador, filtro por módulo y los roles que otorgan cada uno. |
| `permission-update` | (acción) | Interruptor `is_api` vía `PATCH /companies/{company}/permissions/{id}/api-visibility`. Un permiso con `is_api = false` sigue rigiendo en el backend pero no viaja en `GET /companies/{company}/me/permissions`. |
| `admin-general` | (transversal) | **Único** permiso que habilita los roles del sistema (`super-admin`, `client`, `employee`) para asignarlos a un usuario y para eliminarlos en `/roles`. Lo trae el rol `super-admin` por seeder. |

## Siempre visible

| Ruta | Nota |
|---|---|
| `/` (Inicio / Dashboard) | `perm: ALWAYS`. Es la landing por defecto; entrar a un módulo sin permiso redirige aquí. Cada dash del tablero se gatea por su propio permiso. |
| `https://pos.piddet.com` | Enlace externo al punto de venta; no es una ruta del panel. |

---

## Funcionalidades de compañía (eje independiente)

Se consultan en `GET /companies/{company}/functionalities` y se exponen con
`useFunctionalities().has(name)`. El catálogo trae `label`, `icon` (clase FontAwesome) y
`description` para mostrarlas al usuario.

| Funcionalidad | Efecto en el panel |
|---|---|
| `functionality_tables` | Habilita el módulo de Mesas (junto con `table-list`). |
| `functionality_reservations` | Habilita Reservas y Unidades de hospedaje. |
| `functionality_taxes` | Muestra el selector de impuesto del producto. |
| `functionality_menu_item_price` | Habilita el campo de precio por menú en los modales del detalle del menú. Sin ella, los ítems usan siempre el precio base del producto y el backend rechaza `price`. |

## Añadir un módulo gateado

1. Declara la ruta y su `perm` (y `func` si aplica) en `src/lib/permissions/modules.js`.
2. Envuelve la ruta con `RequirePermission` en `App.jsx`.
3. Documenta el permiso en este catálogo.
4. Guía paso a paso: [`specs/guides/permissions.md`](guides/permissions.md).

# Especificación Funcional del Proyecto

> Actualizado: 2026-08-20 (catálogo de módulos alineado con `src/lib/permissions/modules.js`).

## Propósito del Proyecto

Piddet es un panel de administración SaaS **multi-compañía** para negocios de atención al
público (restaurantes, gimnasios y hospedaje). Permite gestionar la oferta (productos, menús,
unidades rentables), la operación (facturas, gastos, turnos de caja, mesas, reservas) y los
accesos (usuarios, roles y permisos), además de consultar reportes.

Es cliente de `backend-piddet` (única fuente de verdad); el POS `piddet-pos` es la otra
aplicación de la plataforma y toma los pedidos.

## Modelo multi-compañía (concepto central)

**Toda la plataforma gira en torno a la compañía (`Company`).** Es el eje del dominio: no
existe dato "suelto" — cada entidad de negocio pertenece a una compañía y solo es visible y
operable dentro de ella.

- **Todo está scopeado por compañía.** Productos, categorías, toppings, tiendas, mesas,
  pedidos/preórdenes, impuestos y notificaciones pertenecen a una compañía (`company_id` en
  el backend). Cuando se crea un pedido, ese pedido queda asociado a la compañía activa; lo
  mismo aplica a productos, tiendas, etc.
- **El usuario se relaciona con la compañía, no la posee.** Un usuario puede pertenecer a
  **varias compañías** (relación N:N), pero **opera bajo una compañía activa** a la vez. El
  backend la guarda como `company_default_id` del usuario; el rol/permisos del usuario son
  **por compañía** (pivote `company_users`).
- **Cambiar de compañía = cambiar todo el contexto.** Al cambiar la compañía activa, el panel
  recarga los datos para esa compañía: productos, usuarios, pedidos y demás cambian por
  completo. El sidebar muestra y permite cambiar la compañía activa.
- **Cada compañía tiene su propia configuración:** *funcionalidades* habilitadas (features
  según su plan) y un *período* activo (ciclo temporal). Dos compañías pueden tener menús,
  usuarios y features distintos.

> **Regla de oro para el desarrollo:** cualquier listado, creación o edición es **implícitamente
> de la compañía activa**. Nunca asumas datos globales entre compañías; al añadir un módulo,
> piensa siempre "esto pertenece a la compañía X".

## Módulos Principales

Cada módulo se habilita por **permiso** y, cuando se indica, además por una **funcionalidad**
contratada de la compañía. Catálogo completo: [`permissions-catalog.md`](permissions-catalog.md).

| Grupo | Módulo | Ruta | Permiso |
|---|---|---|---|
| — | **Inicio / Dashboard** | `/` | siempre visible |
| Oferta | **Productos** (con categorías y opciones) | `/products` | `api-module-products` |
| Oferta | **Carta / Menús** | `/menus` | `api-module-menus` |
| Oferta | **Reservas** (hospedaje) | `/reservations` | `api-module-reservations` + `functionality_reservations` |
| Oferta | **Unidades rentables** | `/rentable-units` | `api-module-rentable-units` + `functionality_reservations` |
| Oferta | **Planes de gimnasio** | `/gym/plans` | `api-module-gym-plans` + `functionality_gym` |
| Oferta | **Miembros de gimnasio** | `/gym/members` | `api-module-gym` + `functionality_gym` |
| Oferta | **Suscripciones de gimnasio** | `/gym/subscriptions` | `api-module-gym` + `functionality_gym` |
| Oferta | **Medidas de gimnasio** (configuración) | `/gym/measurements` | `api-module-gym-plans` + `functionality_gym` |
| Operación | **Facturas** | `/invoices` | `api-module-orders` · `api-module-orders-own` |
| Operación | **Reporte de ventas** | `/sales-report` | `sales-report` · `sales-report-own` |
| Operación | **Gastos** | `/expenses` | (`api-module-expenses` · `api-module-expenses-own`) + `functionality_expenses` |
| Operación | **Reporte de gastos** | `/expenses/summary` | (`expenses-report` · `expenses-report-own`) + `functionality_expenses` |
| Operación | **Categorías de gasto** | `/expense-categories` | `api-module-expenses` + `functionality_expenses` |
| Operación | **Mesas** | `/tables` | `table-list` + `functionality_tables` |
| Operación | **Turnos de caja** | `/shifts` | (`api-module-shifts` · `api-module-shifts-own`) + `functionality_shifts` |
| Configuración | **Tiendas** | `/stores` | `api-module-stores` |
| Configuración | **Categorías globales de producto** | `/admin/product-categories` | `item-category-master` |
| Configuración | **Fallos de órdenes** (soporte del POS) | `/sync-failures` | `order-sync-failure-admin` |
| Accesos | **Usuarios de la compañía** | `/users` | `user-administrator` |
| Accesos | **Roles** | `/roles` | `role-list` |
| Accesos | **Permisos** | `/permissions` | `permission-list` |
| Cuenta | **Perfil de empresa** | `/company` | funcionalidades con `company-edit-functionalities` |
| Cuenta | **Cuenta del usuario** | perfil, historial de sesiones, cambio de contraseña | — |

## Flujos por Módulo

### Autenticación

- **Descripción:** acceso al panel.
- **Actores:** administradores de la empresa.
- **Flujo principal:** el usuario ingresa código de país + teléfono + contraseña → si es
  válido, se persiste la sesión y entra al panel. "Recordarme" decide si la sesión sobrevive
  al cierre del navegador.
- **Reglas:** plataforma fija `ADMIN`. Token renovado de forma transparente; si el refresh
  falla, se cierra sesión y se avisa al usuario.

### Empresa (compañía activa)

- **Descripción:** define el contexto bajo el que opera todo el panel (ver "Modelo
  multi-compañía").
- **Actores:** cualquier usuario que pertenezca a más de una compañía.
- **Flujo principal:** el sidebar muestra la compañía activa y lista las compañías a las que
  el usuario pertenece; al cambiarla, **todos los datos del panel se recargan** para esa
  compañía (productos, pedidos, usuarios, tiendas, etc.).
- **Reglas:** un usuario puede pertenecer a varias compañías pero opera en una sola a la vez;
  su rol y permisos son por compañía. La compañía por defecto es `company_default_id`.

### Dashboard

- **Descripción:** vista inicial.
- **Flujo principal:** muestra estadísticas, pedidos recientes y tiendas. Solo lectura.

### Productos / Categorías / Toppings (oferta)

- **Descripción:** gestión del catálogo.
- **Flujo principal:** listado con filtros (búsqueda, categoría, disponibilidad) → crear,
  editar, activar/desactivar o eliminar.
- **Reglas:** las disponibilidades y categorías usan las claves del backend (`cat`, `avail`).

### Facturas (órdenes por fecha)

- **Descripción:** consulta de las facturas/órdenes realizadas por la compañía en un día.
- **Actores:** usuarios con el permiso `api-module-orders` en la compañía activa.
- **Flujo principal:** al entrar a `/invoices` se listan las órdenes de **hoy**; un selector de
  fecha (un solo día) permite consultar otro día. Al hacer clic en una fila se abre
  `/invoices/:orderId` con el detalle completo: ítems con sus opciones, impuestos, pagos,
  totales, estado, mesa, cliente que la solicitó (OWNER) y usuario que la creó (CREATOR).
- **Reglas:** solo lectura (las órdenes se crean desde el POS/mesero, no desde el panel). Se
  muestran **todas** las órdenes del día — pagadas, sin pago y canceladas — con su estado
  visible. Las claves (`status`, `status_payment`, `service_type`, `origin_code`) son las del
  backend; el panel las traduce a texto en español.

### Tiendas / Usuarios / Mesas

- **Descripción:** gestión de locales, equipo y mesas.
- **Flujo principal:** listado en `DataTable` con acciones de crear/editar.

### Accesos (Usuarios / Roles / Permisos)

- **Descripción:** quién entra a la compañía y qué puede hacer. Se administra en el grupo
  *Usuarios* del menú: **Listado** (usuarios de la compañía), **Roles** y **Permisos**.
- **Modelo:** el acceso se concede SOLO por roles. Un rol agrupa permisos; un usuario tiene uno o
  más roles en la compañía. Los permisos directos por usuario existen en el backend, pero ya no se
  editan desde el panel.
- **Flujo principal:**
  1. En `/roles` se crea el rol (nombre técnico + descripción) y se le marcan sus permisos.
  2. En `/users`, la acción *Asignar roles* del usuario sincroniza sus roles en la compañía.
  3. El modal de datos del usuario ya no toca accesos: solo nombre, correo y teléfono.
- **Alcance:** el catálogo de roles y permisos es de la **plataforma**, no de la compañía activa:
  crear un rol o cambiar sus permisos afecta a todas las compañías que lo usen. Los roles del
  sistema (`super-admin`, `client`, `employee`) no se editan ni se eliminan.
- **Visibilidad de un permiso (`is_api`):** en `/permissions` se decide qué permisos llegan al
  panel. Uno oculto sigue rigiendo en el backend, pero no viaja en `/me/permissions`, así que no
  puede mostrarse ni asignarse desde aquí.

### Gastos

- **Descripción:** registro de egresos de la compañía como encabezado + líneas.
- **Flujo principal:** `/expenses` lista por rango de fechas; `/expenses/new` (o el asistente
  móvil `/expenses/quick`, accesible desde el Dashboard) crea el gasto con proveedor —creable al
  vuelo—, método de pago y líneas (categoría, descripción libre, valor), adjuntando fotos de la
  factura. `/expenses/:expenseId` es de solo lectura salvo las fotos, que se agregan y quitan
  mientras el gasto esté activo.
- **Reglas:** las fotos viven en **S3 privado** (URL firmada). Un gasto no se borra: se **anula**
  (`expense-annul`), y sus líneas no se editan. Las categorías combinan un árbol global de la
  plataforma con las propias de la compañía. Con `api-module-expenses-own` el empleado registra y
  ve solo lo suyo: el filtro lo aplica el backend.

### Turnos de caja

- **Descripción:** sesiones de caja con base, movimientos y arqueo de cierre.
- **Flujo principal:** `/shifts/open` abre un turno **global** (compañía) o **de empleado**
  (cajero) con una base de dinero; el backend le asocia automáticamente ventas y gastos como
  movimientos. `/shifts/:shiftId` muestra el balance en vivo; `/shifts/:shiftId/close` guía el
  cierre: contar dinero → balance (base + ventas − gastos) → confirmar.
- **Reglas:** la diferencia se respalda con un documento contable real (sobrante → factura de
  origen `SHIFT`; faltante → gasto en «Ajustes de caja»), que no se asocia a un turno abierto. El
  turno global solo lo abre y cierra `shift-global-admin`, y no cierra con turnos de cajero
  abiertos. Cancelar un turno es irreversible y conserva sus movimientos como historial.

### Reservas y hospedaje

- **Descripción:** operación de cabañas, habitaciones o lugares reservables.
- **Flujo principal:** `/rentable-units` configura las unidades (espacios, inclusiones, fotos);
  `/reservations` opera calendario, creación asistida, confirmación, check-in, consumos y
  cargos, abonos y checkout.
- **Reglas:** requiere la funcionalidad `functionality_reservations` activa además del permiso.
  El pre-check-in del huésped ocurre fuera del panel, en la superficie pública del backend.

### Gimnasio

- **Descripción:** administración de gimnasio: suscripciones mensuales por miembro, con
  seguimiento periódico de sus medidas físicas. **Diseñado para operarse desde el teléfono**: el
  Inicio ofrece la acción rápida "Cobrar / renovar membresía", los listados se vuelven tarjetas
  en móvil (con "Renovar" directo en cada miembro) y las tareas largas son asistentes paso a paso.
- **Flujo principal:** `/gym/plans` administra los planes (nombre, precio, duración en días,
  días de gracia tras el vencimiento, si el plan permite pausar la suscripción y el ítem del
  catálogo de productos con el que se factura cada pago). `/gym/members` registra miembros: el
  formulario pide nombre, celular y documento, y el backend resuelve a la persona como usuario
  real de la plataforma —reutilizándola si ya existe por documento o celular— antes de crear su
  ficha con un código de miembro autogenerado (`M00001`, `M00002`…). **El listado de miembros
  muestra el estado de la membresía, no el activo/inactivo administrativo**: cada fila trae la
  suscripción más reciente (badge Activa/En gracia/Vencida/Cancelada/Sin suscripción y su
  vencimiento "Vence/Venció el …"), y la acción por fila es **Renovar** (membresía vigente) o
  **Suscribir** (sin membresía al día); tocar la tarjeta abre la ficha. El **objetivo del miembro
  es cerrado**: se elige de un catálogo (`GET /gym/goals`: bajar de peso, subir de peso, aumentar
  masa muscular, tonificar…), no es texto libre — la clave estable de cada objetivo permitirá a
  futuro asociarle recomendaciones. La ficha del miembro (`/gym/members/:memberId`) está ordenada
  por frecuencia de uso, con tarjetas **plegables**: primero la **suscripción como resumen
  compacto** (abierta por defecto; renovar en el sitio, el resumen abre el detalle), luego
  **Medidas** (peso/IMC y la tabla de mediciones — fecha, cuántas medidas, quién las registró;
  cada fila abre su detalle en un modal) y al final el **perfil** editable (sexo, talla,
  objetivo del catálogo, notas de salud, estado), plegado por defecto. **"Editar datos"** (en la
  cabecera de la ficha) corrige los datos personales de la persona —nombres, correo, tipo y
  número de documento—, actualizando su usuario de plataforma y los snapshots del gimnasio; el
  **celular no se edita** porque es la credencial con la que inicia sesión. El análisis visual
  vive en la **vista de progreso** (`/gym/members/:memberId/progress`). El detalle de la suscripción
  (`/gym/subscriptions/:subscriptionId`) es la vista transaccional: sus pagos (registrar con el
  precio precargado, anular), renovar y cancelar; el nombre del miembro arriba navega a su
  perfil. `/gym/subscriptions` es el listado operativo, filtrable por estado y por próximas a
  vencer. Las medidas se toman con el **asistente paso a paso**
  (`/gym/members/:memberId/checkin`): una medida por pantalla —solo las que la compañía activó en
  `/gym/measurements`— con teclado numérico, el valor anterior como referencia y omisión con solo
  dejar el campo vacío. Ni un plan ni un miembro se borran: se desactivan; una suscripción
  cancelada, un pago anulado y un chequeo no se borran, quedan en el historial (un chequeo sí se
  puede corregir, no tiene efecto contable).
- **Suscripciones:** la verdad son las fechas (inicio, fin, fin de gracia); el estado
  (`computed_status`: activa / en gracia / vencida / cancelada) se deriva de ellas. Renovar
  **nunca** muta la suscripción vigente: crea una fila nueva encadenada, que empieza el día
  siguiente al vencimiento de la anterior. Cancelar es irreversible y pide motivo.
- **Pagos:** cada pago manual (efectivo, tarjeta…) genera su propia factura en el módulo de
  Facturas (origen "Gimnasio", numeración propia), compartiendo la misma infraestructura de
  facturación que el resto de la plataforma. Anular un pago cancela también su factura;
  irreversible, pide motivo.
- **Medidas físicas:** un chequeo agrupa varios valores tomados el mismo día. **Cada compañía
  configura en `/gym/measurements` qué medidas pide** (peso, % de grasa, circunferencias…; sin
  selección guardada se piden todas); el catálogo distingue las que admiten lado
  izquierdo/derecho (bíceps, muslo, pantorrilla, antebrazo). La **vista de progreso**
  (`/gym/members/:memberId/progress`) es interactiva: un **mapa corporal** con las siluetas
  ilustradas del proyecto (`public/gym/*` — hombre o mujer según el sexo de la ficha; si falta,
  se pregunta ahí mismo y se guarda) **de frente y de perfil**, con un punto tocable sobre cada
  músculo de las medidas configuradas por la compañía (el punto muestra el nombre del músculo al
  pasar o seleccionar, y el glúteo solo aparece de perfil); tocar un punto (pecho, cintura,
  glúteo…) muestra sus
  **KPIs** (valor actual con el cambio desde la medición anterior, cambio total con porcentaje y
  número de mediciones; en medidas bilaterales, por lado), su **antes/después** animado y su
  gráfica de evolución (área con degradado para una serie; leyenda solo cuando hay
  izquierdo/derecho). Peso, % de grasa y masa muscular no viven en el cuerpo: se eligen como
  chips. Al final, el **Resumen de medidas** lista todas las que tienen historia (valor actual +
  cambio total en tinta neutra) y tocar una fila la selecciona. La ficha del miembro solo
  conserva el peso actual, el IMC y la tabla de mediciones.
- **Reglas:** requiere la funcionalidad `functionality_gym` activa además del permiso. Los
  miembros son usuarios de la plataforma (mismo patrón "pasivo" de Reservas). Un job diario
  (`gym:transition-subscriptions`, backend) transiciona automáticamente las suscripciones
  vencidas: activa → en gracia → vencida.

### Reportes

- **Descripción:** ventas y gastos del rango seleccionado.
- **Flujo principal:** `/sales-report` resume subtotal, descuentos, impuestos, total, ticket
  promedio, métodos de pago, top de productos y ventas por día, con filtros de rango, creador y
  producto. `/expenses/summary` hace lo propio con los gastos (total, conteo, promedio, gasto más
  alto, métodos de pago, usuarios y top de categorías con drill-down).
- **Reglas:** las variantes `-own` limitan el reporte a lo que registró el usuario y ocultan el
  filtro por creador. Las órdenes canceladas salen de las métricas.

### Fallos de órdenes (soporte del POS)

- **Descripción:** cuando el POS no logra facturar contra la API, envía un reporte de fallo.
- **Flujo principal:** `/sync-failures` lista los reportes por estado de soporte (pendiente,
  resuelto, no recuperable); el detalle permite editar el JSON de la orden, reintentar la
  creación y cambiar el estado.
- **Reglas:** el estado `resolved` es terminal. Es el mecanismo de rescate del modelo
  offline-first del POS: ninguna venta debería quedarse sin registrar.

## Roles y Permisos

El backend controla qué módulos y funcionalidades ve cada usuario mediante **permisos por
compañía**. Tras el login (y al cambiar de compañía) el panel consulta
`GET /companies/{company}/me/permissions`, guarda los permisos en la sesión y los usa para
mostrar/ocultar módulos.

- **Política:** whitelist estricta — un módulo solo se muestra si el usuario tiene su permiso;
  lo no autorizado se oculta del menú y su ruta se bloquea (redirige a Inicio).
- **Excepción:** Inicio (Dashboard) es siempre visible y es la landing por defecto.
- **Alcance `-own`:** varios módulos tienen el par `X` (toda la compañía) y `X-own` (solo lo que
  registró el usuario). El filtro **lo aplica el backend**; un recurso ajeno responde 404.
- **Funcionalidades:** eje independiente de los permisos. Un módulo con `func` declarado exige
  además que la compañía tenga esa funcionalidad activa.

Catálogo completo de permisos: [`permissions-catalog.md`](permissions-catalog.md).
Cómo añadir un módulo gateado: [`guides/permissions.md`](guides/permissions.md).

## Integraciones Externas

- **API REST de Piddet** (`VITE_API_URL`) — única integración. En modo demo se sustituye por
  datos de ejemplo locales.
- **FontAwesome 6** vía CDN para iconografía.

## Glosario

- **Compañía / Company / empresa:** eje del dominio. Cliente del sistema (restaurante, gimnasio u hospedaje);
  agrupa y "es dueña" de productos, tiendas, mesas, pedidos y usuarios. Todo se scopea por ella.
- **Compañía activa:** la compañía bajo la que opera el usuario en cada momento
  (`company_default_id`). Cambiarla recarga todo el contexto del panel.
- **company_users:** relación N:N usuario↔compañía; un usuario puede pertenecer a varias
  compañías, con rol/permisos propios en cada una.
- **Funcionalidad:** feature habilitado/deshabilitado por compañía según su plan.
- **Período:** ciclo temporal activo de una compañía.
- **Oferta:** conjunto de productos, categorías y toppings de una compañía.
- **Modo demo / mock:** funcionamiento sin backend, con datos de ejemplo.
- **Envoltorio:** forma de respuesta del backend `{ status, message, data, metadata }`.

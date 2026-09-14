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
| Oferta | **Opciones generales** (grupos de opciones para varios productos) | `/general-options` | `api-module-general-options` |
| Oferta | **Carta / Menús** | `/menus` | `api-module-menus` |
| Oferta | **Reservas** (hospedaje) | `/reservations` | `api-module-reservations` + `functionality_reservations` |
| Oferta | **Unidades rentables** | `/rentable-units` | `api-module-rentable-units` + `functionality_reservations` |
| Oferta | **Encargados de reservas** | `/reservations/managers` | `reservation-managers-config` + `functionality_reservations` |
| Oferta | **Planes de gimnasio** | `/gym/plans` | `api-module-gym-plans` + `functionality_gym` |
| Oferta | **Afiliados de gimnasio** | `/gym/members` | `api-module-gym` + `functionality_gym` |
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
| Configuración | **Notificaciones enviadas** | `/notifications` | `api-module-notifications` |
| Configuración | **Tareas programadas** (bitácora del scheduler) | `/scheduled-tasks` | `api-module-scheduled-tasks` |
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

- **Descripción:** vista inicial (`/`), siempre visible. Solo lectura.
- **Flujo principal:** acciones rápidas de móvil (cobrar membresía, registrar gasto, abrir/cerrar
  turno), el widget de **reservas por llegar** y, bajo un único control de período (fecha fin +
  semanas + refrescar), los reportes que permitan los permisos y funcionalidades: balance del
  período, ventas, gastos y hospedaje, cada uno con su franja de KPIs y su gráfico comparativo.
- **Reservas** (con `api-module-reservations` + `functionality_reservations`): lista resumida de
  las que siguen **pendientes de recibir** (pendiente, validando pago o confirmada) y entran hoy o
  mañana — nombre, unidad, hora estimada de llegada, badge «Hoy» o «Mañana», 🎈 si lleva
  decoración y el estado; tocar abre la reserva. Sin franja de totales: el widget avisa de lo que
  hay que preparar, no reporta. Es operación del día, así que va **antes** del control de período
  y no lo obedece. Sale de `GET /reservations/pending-arrivals`; el botón de refrescar lo recarga
  con los demás reportes. Su cuerpo no lleva relleno propio: en el teléfono las filas se alinean
  con el resto de la pantalla en vez de quedar doblemente metidas.
- **Gimnasio** (con `api-module-gym` + `functionality_gym`): dos widgets de operación del día,
  lado a lado en escritorio y apilados en el teléfono, que también van antes del control de
  período y se recargan con el mismo botón. **Vencimientos** (`GET /gym/dashboard/expiring`):
  un aviso cuyo tono sube con la urgencia —`danger` si hay suscripciones en gracia, `warning` si
  solo hay por vencer, `success` cuando todo está al día— con solo los conteos («2 vencidas ·
  1 por vencer», sin más texto) y debajo la lista en filas compactas, del más urgente al más
  lejano: en gracia primero (el corte automático está cerca), luego las que vencen hoy, mañana
  o en N días; cada fila lleva el nombre, una línea con plan (solo en escritorio), fecha de
  corte y saldo, y el estado a la derecha; tocarla abre la suscripción para cobrar o renovar.
  «Ver todas» abre Suscripciones con el filtro «Vencen en 7 días» puesto.
  **Cumpleaños del mes** (`GET /gym/dashboard/birthdays`): los afiliados activos que cumplen
  años este mes, en filas compactas de dos líneas —baldosa-calendario del día, nombre y años
  que cumple— con el badge de cuándo («Hoy», «Mañana», «En N días», «Ya pasó») y, a la derecha,
  el botón de WhatsApp con un saludo a nombre de la compañía cuando el afiliado tiene celular;
  tocar la identidad abre su ficha. Primero los de hoy, luego los próximos y al final,
  atenuados, los que ya pasaron. Se muestran seis y el resto se despliega con «Ver N más»;
  «Ver todos» abre Afiliados con el filtro «Cumpleaños: mes» puesto (`?birthday_month=`), que
  lista a todos los que cumplen ese mes ordenados por día con su fecha y los años que cumplen.
- **Reglas:** en el teléfono cada franja se queda con la cifra que se mira de un vistazo —ventas
  totales y ticket promedio; gastos totales; ingresos de hospedaje y ocupación— y el desglose
  (productos, servicios, registros, gasto promedio, mayor gasto, reservas, noches vendidas) se
  ve solo en escritorio: son los KPIs marcados `desktopOnly` en `StatStrip`. Mantener pulsado el
  botón de refrescar ~2s fuerza el recálculo sin caché.

### Productos / Categorías / Toppings (oferta)

- **Descripción:** gestión del catálogo.
- **Flujo principal:** listado con filtros (búsqueda, categoría, disponibilidad) → crear,
  editar, activar/desactivar o eliminar.
- **Reglas:** las disponibilidades y categorías usan las claves del backend (`cat`, `avail`).
- **Opciones del producto** (`/products/:itemId`): grupos de opciones con sus reglas de
  selección (`min`, `max`, `multiple`) y las opciones de cada grupo, ambos reordenables. Cada
  grupo tiene un **tipo** (`type`, lo define el backend): `OPTION` para términos, tamaños y
  adiciones (cada opción puede tener precio extra) y `REMOVE` para **ingredientes que el cliente
  pide quitar**: sus opciones no llevan precio y el POS las imprime con signo menos
  («− Cebolla»). El panel muestra la insignia *Para quitar* en esos grupos y no pide precio al
  crear sus ingredientes. Un nombre vacío o un mínimo mayor que el máximo se avisan junto al
  campo antes de enviar. Los modales de grupo y de opción son compartidos (`OptionGroupModals.jsx`).
- **Opciones generales** (`/general-options`): grupos de opciones de la **compañía** (sin
  producto), con las mismas reglas y tipos que los de un producto, que se asignan a varios
  productos a la vez —p. ej. «Servicios»: para llevar, cubiertos—. Cada grupo muestra sus
  opciones, cuántos productos lo usan y un botón que abre el **selector de productos**
  (`ProductPickerModal`): lista paginada con búsqueda por nombre y filtro por categoría, casillas
  por producto y chips removibles de lo seleccionado; al guardar se envía la lista completa de
  ids. Un grupo sin productos asignados avisa que no se verá en el menú. El backend los expone
  dentro de cada producto asignado en el menú del POS, detrás de sus grupos propios.

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
- **Flujo principal:** `/shifts/open` abre un turno **global** (compañía), **de cajero** o
  **de compras** con una base de dinero. Un admin asigna el turno de cajero o de compras a uno
  o **varios** usuarios (caja compartida: checkboxes de usuarios; sin selección es suyo); el
  cajero solo abre el propio (elige entre cajero y compras). El backend le asocia
  automáticamente las ventas y gastos de cualquiera de sus asignados como movimientos, y
  rechaza (409, con el nombre) a quien ya esté en otro abierto. `/shifts/:shiftId` muestra el
  balance en vivo; `/shifts/:shiftId/close` guía el cierre: contar dinero → balance (base +
  ventas − gastos) → confirmar.
- **Turno de compras (`PURCHASE`):** para quien solo compra. No recibe ventas: su balance es
  **base + adiciones − gastos**. Mientras está abierto, desde el balance del detalle se
  registran **adiciones a la base** (monto, método de pago y nota; el backend guarda quién la
  registró) que aparecen como movimientos `addition` con su método, para diferenciar el efectivo
  de las transferencias. Los gastos que registran sus asignados entran como en cualquier turno.
  Al cerrar, el arqueo es el mismo, pero la diferencia **solo queda registrada** en el turno
  (ajuste sin documento): no se factura el sobrante ni se registra el faltante como gasto.
- **El conteo es un arqueo, no un total tecleado:** el primer paso pide **cuántos billetes** hay
  de cada denominación (el catálogo lo manda el backend en el balance, `cash_denominations`; las
  **monedas** van por monto suelto) y **cuánto se recibió por cada método distinto al efectivo**
  —prellenado con lo que registró el sistema (`non_cash.by_method`), para confirmar contra el
  reporte del datáfono o de la app y corregir si no coincide—. Debajo va creciendo el total
  recibido. Al cerrar viajan las **cantidades** (`cash_count`, `method_count`), no el total: el
  dinero lo suma la API. El arqueo queda guardado y el detalle del turno lo muestra tal cual se
  contó; los turnos cerrados antes de esto solo tienen su total.
- **Reglas:** en los turnos global y de cajero la diferencia se respalda con un documento
  contable real (sobrante → factura de origen `SHIFT`; faltante → gasto en «Ajustes de caja»),
  que no se asocia a un turno abierto; en el de compras no. El turno global solo lo abre y
  cierra `shift-global-admin`, y no cierra con turnos de cajero o de compras abiertos. Cancelar
  un turno es irreversible y conserva sus movimientos como historial.

### Reservas y hospedaje

- **Descripción:** operación de cabañas, habitaciones o lugares reservables.
- **Flujo principal:** `/rentable-units` configura las unidades (espacios, inclusiones, fotos);
  `/reservations` opera calendario, creación asistida, confirmación, check-in, consumos y
  cargos, abonos y checkout.
- **Duplicar una unidad** (menú ⋮ del detalle → *Duplicar unidad*): pide solo el nombre de la
  copia y el backend clona el resto —datos, horarios, tarifa, inclusiones, espacios y fotos—,
  dejándola con el mismo estado que la original. Las fotos se copian también en el
  almacenamiento, así que quitar una en la copia no toca la unidad original. Registrar la
  segunda cabaña igual a la primera deja de ser volver a llenar el formulario.
- **Alertas del listado.** Las dos las decide el backend y el panel solo las pinta:
  - **🎈 decoración** — la reserva con un servicio de decoración llega con `has_decoration`: badge
    con el emoji tras la fecha de entrada (listado), emoji en el chip y el resumen del calendario,
    y en el título del detalle, que además muestra un aviso mientras la reserva siga abierta.
  - **Entradas de hoy y mañana primero** — el listado llega ordenado con las reservas vigentes que
    entran hoy o mañana al principio, y cada una lleva su badge «Hoy» o «Mañana». No es un filtro:
    el resto del listado sigue debajo, por creación descendente.
- **La columna de entrada dice una cosa a la vez.** El badge «Hoy»/«Mañana» **sustituye** a la
  fecha (no se repite el mismo dato), y el de noches solo aparece con más de una: una noche es lo
  normal y anunciarlo es ruido. El listado encabeza con el **titular**, no con el código: se busca
  y se reconoce por el nombre (el código sigue buscándose desde el campo de búsqueda).
- **Por defecto el listado solo muestra lo vivo** (`status=active`): sin canceladas ni
  finalizadas. Lo cerrado no se pierde —el filtro de estado ofrece *Finalizadas*, *Canceladas* y
  *Todas*—, simplemente no estorba en la operación diaria.
- **En el teléfono el listado son tarjetas** (`ListCard` bajo `s.mobileList`, como afiliados o
  usuarios): cinco columnas no caben en 390px sin dejar el titular en «T…». En escritorio sigue
  siendo tabla, con los anchos en **porcentaje** para que la proporción aguante cualquier ancho
  (`table-layout: fixed` reparte lo que sobra, así que mezclar píxeles y columnas flexibles
  ahogaba a estas últimas).
- **Encargados de reservas** (`/reservations/managers`, permiso `reservation-managers-config`):
  la lista de empleados que reciben cada noche a las 20:00 el resumen por SMS de las reservas que
  llegan mañana, con la decoración y los servicios que hay que preparar. Se agregan eligiéndolos
  de la lista de empleados de la compañía (búsqueda por nombre o celular) y se retiran con
  confirmación; el backend devuelve el listado actualizado en ambos casos. La pantalla muestra un
  ejemplo del SMS y avisa cuando no hay encargados (nadie recibe el resumen) o cuando alguno no
  tiene celular (ese envío no sale). En el teléfono son tarjetas (`ListCard`), como Usuarios. Lo
  enviado se ve en *Notificaciones* como «Resumen de reservas de mañana» y la corrida en *Tareas
  programadas*, donde también se puede probar sin enviar.
- **Reglas:** requiere la funcionalidad `functionality_reservations` activa además del permiso.
  El pre-check-in del huésped ocurre fuera del panel, en la superficie pública del backend.
  Registrar la entrada exige ese pre-check-in completo; para los casos donde conseguir los datos
  del huésped no es viable, el menú de acciones de una reserva confirmada ofrece **Check-in
  forzado**: un modal advierte que la entrada se registra sin los datos del pre-check-in y aun
  así permite pasar (el enlace de pre-check-in sigue activo durante la estadía).
- **Dos puertas al pre-check-in público** (ambas sin sesión, fuera del panel):
  `/checkin?code={código}` pide el **código de la reserva más el nombre del titular** —el código
  solo autocompleta el formulario—, y `/r/{código único de consulta}` **abre la reserva sin pedir
  nada**. La segunda es el enlace que el backend le manda por SMS al titular la mañana de su
  llegada: el código de consulta es secreto y solo llegó a su celular, y saltarse la validación es
  justo lo que evita que abandone ahí y llegue sin el pre-check-in hecho. Si el enlace ya no vale,
  la pantalla cae al formulario de siempre con un aviso; si la reserva ya cerró, explica el motivo.
  Ese código **no se muestra en el panel ni se dicta**: para eso está el código público.

- **En el teléfono** el detalle se descarga: la cabecera deja solo la acción principal del estado
  (confirmar, check-in, checkout o reabrir) y el menú ⋮, que absorbe actualizar y el enlace de
  pre-check-in; se omite lo que ya está en otro lado —la tarjeta de pre-check-in (el código está
  en el título y el aviso de pendiente sigue arriba), los consumos POS (se listan en las facturas)
  y las filas de total/abonado/personas de la estadía— y el resumen de la cuenta pasa a encabezar
  su pestaña.

### Gimnasio

- **Descripción:** administración de gimnasio: suscripciones mensuales por afiliado, con
  seguimiento periódico de sus medidas físicas. **Diseñado para operarse desde el teléfono**: el
  Inicio ofrece la acción rápida "Cobrar / renovar membresía", los listados se vuelven tarjetas
  en móvil (con "Renovar" directo en cada afiliado) y las tareas largas son asistentes paso a paso.
  En el teléfono cada sección deja **una sola acción visible** —cobrar en Suscripción, tomar
  medidas en Medidas, renovar en el detalle de la suscripción— y lo secundario (editar datos,
  ver progreso, registrar pago, cancelar, activar/desactivar un plan) vive en un menú ⋮: el de
  la cabecera en las fichas, el de la propia fila en el listado de planes. El historial de
  mediciones se lista como filas tappables en vez de tabla.
- **Flujo principal:** `/gym/plans` administra los planes (nombre, precio, **duración por
  calendario** —`duration_months`: un plan de un mes que arranca el 2 de octubre vence el 1 de
  noviembre, tenga el mes 28, 30 o 31 días, y el que arranca un 31 cubre el mes siguiente completo
  (31 de agosto → 30 de septiembre); `duration_days` solo para lo que se cuenta en días,
  como semanal o quincenal—, días de gracia tras el vencimiento, si el plan permite pausar la
  suscripción y el ítem del catálogo de productos con el que se factura cada pago). `/gym/members` registra afiliados **en
  dos pasos**: primero se busca a la persona por **celular o correo** (un solo campo: con `@`
  busca por correo, si no por celular) contra `GET /gym/members/lookup`, y según lo que responda,
  (a) si ya está afiliada a esta compañía no se duplica nada —se ofrece abrir su ficha—, (b) si ya
  tiene cuenta en la plataforma (por otra compañía, una reserva o un pedido) **se reutiliza**: sus
  datos personales los manda su cuenta y el segundo paso solo pide lo del gimnasio (sexo, fecha de
  nacimiento, talla, objetivo, notas; el documento solo si su cuenta aún no lo tiene), o (c) si no existe, el segundo
  paso pide la ficha completa y el backend crea su usuario. En cualquier caso el backend resuelve
  a la persona como usuario real de la plataforma —por `user_id`, documento o celular— antes de
  crear su ficha con un código de afiliado autogenerado (`M00001`, `M00002`…), que vive en la ficha
  y no se lista. **El listado de afiliados
  muestra el estado de la membresía, no el activo/inactivo administrativo**: cada fila trae la
  suscripción más reciente (badge Activa/En gracia/Vencida/Cancelada/Sin suscripción y su
  vencimiento "Vence/Venció el …"), y la acción por fila es **Renovar** (membresía vigente) o
  **Suscribir** (sin membresía al día); tocar la tarjeta abre la ficha. El **objetivo del afiliado
  es cerrado**: se elige de un catálogo (`GET /gym/goals`: bajar de peso, subir de peso, aumentar
  masa muscular, tonificar…), no es texto libre — la clave estable de cada objetivo permitirá a
  futuro asociarle recomendaciones. La ficha del afiliado (`/gym/members/:memberId`) está ordenada
  por frecuencia de uso, con tarjetas **plegables**: primero la **suscripción como resumen
  compacto** (abierta por defecto; renovar en el sitio, el resumen abre el detalle), luego
  **Medidas** (peso/IMC y la tabla de mediciones — fecha, cuántas medidas, quién las registró;
  cada fila abre su detalle en un modal, y ese mismo modal la **corrige**: fecha, valores y notas)
  y al final el **perfil** editable (sexo, talla, objetivo del catálogo, notas de salud, estado),
  plegado por defecto; el perfil muestra además la **edad**, que no se guarda ni se escribe: la
  calcula el backend desde la fecha de nacimiento. **"Editar datos"** (en la
  cabecera de la ficha) corrige los datos personales de la persona —nombres, correo, tipo y
  número de documento, **fecha de nacimiento**—, actualizando su usuario de plataforma y los
  snapshots del gimnasio; el **celular no se edita** porque es la credencial con la que inicia
  sesión. La fecha de nacimiento es de la persona, no de la compañía: vive en su perfil de
  plataforma y se comparte con los demás módulos. El análisis visual
  vive en la **vista de progreso** (`/gym/members/:memberId/progress`). El detalle de la suscripción
  (`/gym/subscriptions/:subscriptionId`) es la vista transaccional: sus pagos (registrar con el
  precio precargado, anular), renovar y cancelar; el nombre del afiliado arriba navega a su
  perfil. `/gym/subscriptions` es el listado operativo (con el botón *Revisar fechas* para el super-admin:
  recalcula por calendario las fechas de los períodos vigentes, con simulación previa), filtrable por estado y por próximas a
  vencer. Las medidas se toman con el **asistente paso a paso**
  (`/gym/members/:memberId/checkin`): una medida por pantalla —solo las que la compañía activó en
  `/gym/measurements`— con teclado numérico, el valor anterior como referencia y omisión con solo
  dejar el campo vacío. Ni un plan ni un afiliado se borran: se desactivan; una suscripción
  cancelada, un pago anulado y un chequeo no se borran, quedan en el historial (un chequeo sí se
  puede corregir, no tiene efecto contable).
- **Suscripciones:** la verdad son las fechas (inicio, fin, fin de gracia); el estado
  (`computed_status`: activa / en gracia / vencida / cancelada) se deriva de ellas. Renovar
  **nunca** muta la suscripción vigente: crea una fila nueva encadenada, que empieza el día
  siguiente al vencimiento de la anterior. Cuando la vigencia sí arranca en esta operación
  (afiliado sin membresía al día), el formulario pide el **inicio de la vigencia** —hoy por
  defecto, retroactivo para quien ya venía pagando antes de usar la plataforma— y de esa fecha
  salen el vencimiento y el fin de gracia; con fecha retroactiva la suscripción puede nacer ya en
  gracia o vencida. Encadenada, ese campo no aparece: la fecha la decide la anterior.
  Cancelar es irreversible y pide motivo. El **inicio del período vigente se puede mover**
  (*Mover inicio*, con `gym-subscriptions-create`): para el afiliado que volvió días después de
  que el sistema encadenara su período, el ciclo arranca cuando de verdad regresó y el backend
  recalcula vencimiento y gracia con la duración del período; solo el último período vivo, sin
  solaparse con el anterior, y los pagos quedan como están. Ambas acciones viven en el menú ⋮ del
  período vigente, junto a **Cancelar período** (`gym-subscriptions-cancel`): confirmación con
  motivo obligatorio que deja claro que se cancela la suscripción completa y, si el período tiene
  pagos activos, pregunta si se anulan también con sus facturas (solo con `gym-payments-annul`).
- **Pagos:** cada pago manual (efectivo, tarjeta…) genera su propia factura en el módulo de
  Facturas (origen "Gimnasio", numeración propia), compartiendo la misma infraestructura de
  facturación que el resto de la plataforma. Anular un pago cancela también su factura;
  irreversible, pide motivo. La casilla **"Registrar el cobro como ingreso"** (marcada por
  defecto) permite la excepción: al desmarcarla el pago queda registrado en la suscripción —consta
  que la persona pagó— pero **no genera factura y no entra a la caja**. Es lo que corresponde al
  dinero cobrado antes de usar la plataforma, que no puede aparecer como ingreso de hoy; esos
  pagos se listan con la marca "sin factura" y anularlos no cancela nada en la caja.
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
  cambio total en tinta neutra) y tocar una fila la selecciona. La ficha del afiliado solo
  conserva el peso actual, el IMC y la tabla de mediciones.
- **Reglas:** requiere la funcionalidad `functionality_gym` activa además del permiso. Los
  afiliados son usuarios de la plataforma (mismo patrón "pasivo" de Reservas). Un job diario
  (`gym:transition-subscriptions`, backend) transiciona automáticamente los períodos (vigente →
  en gracia → cerrado), aplica el corte por no pago y **genera el período siguiente**; nadie lo
  crea a mano. Si esa corrida no pasó (el período vigente ya venció y no existe el siguiente), el
  detalle lo avisa y, con `gym-subscriptions-create`, ofrece **Generar período**: fuerza el mismo
  ciclo para esa suscripción, con confirmación —y advertencia en rojo si el resultado va a ser el
  corte, porque el vigente agotó su gracia sin ningún abono—.

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

### Notificaciones enviadas

- **Descripción:** historial de lo que la compañía ha enviado (SMS por Háblame, push/correo):
  a quién salió cada mensaje, con qué texto, por qué motivo y en qué estado quedó. Responde
  «¿le llegó el SMS?» sin abrir el panel de la pasarela.
- **Flujo principal:** `/notifications` lista los envíos más recientes primero, solo filtros y
  tabla (sin resumen de contadores: se quitó porque ocupaba espacio y lo que se viene a mirar es
  la fila). Se filtra por rango de fechas, estado, canal y motivo, y se busca por **destinatario o
  texto** —las dos preguntas reales: «¿le llegó a este celular?» y «¿qué le dijimos?»—. Al tocar
  una fila, el detalle muestra el mensaje completo, la pasarela y la referencia de envío con la
  que se rastrea en el proveedor.
- **El desplegable de motivos** sale de lo que esa compañía ha enviado de verdad (`/summary`), no
  de un catálogo escrito en el panel.
- **Enviar prueba:** botón en la barra de filtros que abre un modal con celular y texto y dispara
  un SMS real (`POST /notifications/test`, `{ to, message }`). Es la forma de comprobar que la
  pasarela está configurada sin esperar a que el negocio mande algo: entra al historial como una
  notificación más, con motivo «Envío de prueba» (`MANUAL_TEST`), y **se cobra** como cualquier
  otra (el modal lo avisa). Si la pasarela la rechaza en el acto, el modal muestra el motivo
  —«El integration-hub no está configurado» es el típico en un entorno recién montado— y la
  fila queda como fallida.
- **Reenviar:** desde el detalle. El reenvío es un **envío nuevo** (`POST
  /notifications/{id}/resend`): otra fila en el historial, otra referencia en la pasarela; la
  original no cambia. Una **fallida** se reenvía directo; una enviada o pendiente exige **Forzar
  reenvío** (`force: true`), con confirmación que avisa que el destinatario recibirá el mensaje
  otra vez y se cobra de nuevo (sin forzar, el backend responde 409). Si la pasarela lo rechaza en
  el acto, el diálogo muestra el motivo y la fila nueva queda como fallida.
- **Reglas:** no se edita ni se borra —una notificación es el registro de algo que ya pasó— y es
  **siempre de la compañía activa** (el backend saca el `company_id` de la ruta). Lo llevan el
  `super-admin` y el `company-admin`. No confundir con la campana de la barra superior: eso es lo
  que **una persona** no ha leído; esto es lo que **la compañía** ha enviado.

### Tareas programadas (bitácora del scheduler)

- **Descripción:** el backend corre cuatro tareas de negocio en horario fijo y deja una fila por
  ejecución. Esta pantalla es la respuesta a "¿corrió anoche el cron?" sin entrar al servidor, y
  el sitio desde donde se lanza una tarea cuando no corrió.
- **Flujo principal:** `/scheduled-tasks` lista las ejecuciones más recientes primero, filtrables
  por tarea, resultado y rango de fechas. Encabeza con el botón **Tareas y ejecución manual** y
  una línea de salud ("5 tareas · 1 fallida en su última corrida · 1 nunca ha corrido"); el botón
  abre un modal con una tarjeta por tarea (su horario y cómo salió la última corrida, o *Nunca ha
  corrido*) y los botones de lanzar. Las tarjetas viven en el modal porque en la página ocupaban
  media pantalla y lo que se viene a mirar casi siempre es la bitácora. Al tocar una fila, el
  detalle muestra quién la lanzó, las opciones con las que se invocó, sus contadores y el error
  completo si falló.
- **Las cuatro tareas:** suscripciones de gimnasio (00:00, cierra períodos vencidos y genera el
  cobro siguiente), recordatorio de llegada a los titulares de reservas (10:00), avisos de
  vencimiento al socio (18:00) y orden de productos por popularidad (03:00).
- **Ejecutar a mano:** cada tarjeta trae **Ejecutar ahora**. Se abre un modal —incluso sin
  opciones que llenar— porque la tarea corre sobre **todas las compañías** salvo que se acote a
  una; ahí se puede fijar también la fecha (y los días hacia atrás, en la de ventas). La corrida
  no responde al instante: nace *En cola*, pasa a *En curso* y termina, y la pantalla se refresca
  sola durante unos minutos para verlo. Una que se queda *En cola* significa que el worker de
  colas no está corriendo en el servidor.
- **Probar primero:** las dos tareas que le escriben a una persona (recordatorio de llegada y
  avisos de vencimiento) traen además **Probar**: calcula a quién le llegaría y con qué texto
  exacto, **no envía nada** y no marca a nadie como avisado, así que se puede repetir y luego
  ejecutar de verdad. El detalle de esa corrida lista los mensajes que habrían salido. Las otras
  dos no lo ofrecen: son idempotentes, repetirlas no duplica nada.
- **Forzar:** esas mismas tareas marcan "avisado" **antes** de enviar; si el SMS no salió
  (pasarela caída, llave mal puesta), la siguiente corrida cuenta *Ya avisadas* y no manda nada.
  El modal de lanzamiento trae la casilla **Volver a avisar a quien ya figura como avisado
  (forzar)** (`force: true`), con aviso en rojo de que los envíos se repiten y se cobran; en
  *Probar* la misma casilla incluye en la vista previa lo que la tarea daría por enviado. El
  detalle de la corrida lo marca como *Forzada* y cuenta *Avisadas de nuevo*.
- **Reglas:** lo que muestra —y lo que lanza— es de plataforma, no de la compañía activa: por eso
  el permiso es solo del super-admin. La misma tarea no se puede lanzar dos veces a la vez (el
  backend responde 409 y los botones se apagan mientras hay una corrida viva). Una ejecución
  *En curso* que ya pasó su hora es una corrida que murió a mitad. El backend conserva 90 días.

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

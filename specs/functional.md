# Especificación Funcional del Proyecto

> Generado: 2026-06-19

## Propósito del Proyecto

Piddet es un panel de administración SaaS **multi-compañía** para restaurantes. Permite
gestionar la oferta (productos, categorías, toppings), las tiendas, las mesas y los usuarios
de una empresa, y consultar la operación (pedidos, estadísticas).

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

| Módulo | Descripción (una línea) |
|---|---|
| **Autenticación** | Login por teléfono + contraseña, sesión persistente y "recordarme". |
| **Empresa (tenant)** | Consultar y cambiar la empresa activa entre las disponibles. |
| **Dashboard** | Estadísticas, pedidos recientes y resumen de tiendas. |
| **Productos** | Catálogo de productos con CRUD y filtros. |
| **Categorías** | Categorías de la oferta. |
| **Toppings** | Complementos de la oferta. |
| **Facturas** | Órdenes de la compañía consultables por fecha, con detalle completo (solo lectura). |
| **Tiendas** | Listado detallado de tiendas. |
| **Usuarios** | Usuarios de la empresa con sus roles. |
| **Mesas** | Mesas de los locales (operación). |
| **Avisos** | Notificaciones del panel. |
| **Cuenta** | Perfil, historial de sesiones y cambio de contraseña del usuario. |

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

## Roles y Permisos

El backend controla qué módulos y funcionalidades ve cada usuario mediante **permisos por
compañía**. Tras el login (y al cambiar de compañía) el panel consulta
`GET /companies/{company}/me/permissions`, guarda los permisos en la sesión y los usa para
mostrar/ocultar módulos.

- **Política:** whitelist estricta — un módulo solo se muestra si el usuario tiene su permiso;
  lo no autorizado se oculta del menú y su ruta se bloquea (redirige a Inicio).
- **Excepción:** Inicio (Dashboard) es siempre visible y es la landing por defecto.
- **Permisos actuales:** `api-module-products` (Productos), `api-module-menus` (Menús; sus
  categorías se administran dentro del detalle de cada menú), `user-administrator` (Usuarios),
  `api-module-orders` (Facturas).

Detalle técnico y cómo añadir un módulo gateado en `specs/guides/permissions.md`. La ruta
`roles` (gestión de roles desde el panel) sigue siendo un placeholder.

## Integraciones Externas

- **API REST de Piddet** (`VITE_API_URL`) — única integración. En modo demo se sustituye por
  datos de ejemplo locales.
- **FontAwesome 6** vía CDN para iconografía.

## Glosario

- **Compañía / Company / empresa:** eje del dominio. Cliente del sistema (cada restaurante);
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

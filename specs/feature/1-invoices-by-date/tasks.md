# Plan de Tareas: [FEATURE-1] Facturas por fecha (módulo Facturas)

> **Generado:** 2026-07-01
> **Spec:** [spec.md](spec.md)

## Tareas

### Backend (backend-piddet, `~/www/backend-piddet`)

- [x] **1. Permiso `api-module-orders`**
  - Añadir constante `PERMISSION_ORDER_MODULE = 'api-module-orders'` en las constantes de permisos de órdenes.
  - Registrar el permiso en el seeder/catálogo donde se registran los `api-module-*` existentes, para poder asignarlo a roles.
  - Archivos: `app/Http/Constants/OrderPermissionsConstants.php`, seeder/registro de permisos existente.

- [x] **2. Repositorio: listado por compañía y fecha + detalle validado**
  - Nuevo método de listado paginado filtrando por `company_id` y el scope `Order::date($date)` existente, ordenado descendente por `created_at`.
  - Detalle: reutilizar `getOrderDetail()` validando que la orden pertenezca a la compañía (si no, resultado vacío → 404 en capa superior).
  - Archivos: `app/Repositories/Orders/OrdersRepository.php`, `app/Repositories/Orders/Imp/OrdersRepositoryImp.php`.

- [x] **3. Servicio: métodos de consulta**
  - `getOrdersByCompanyAndDate(int $companyId, string $date, ...)` — si no llega fecha, usar la actual.
  - `getOrderDetailForCompany(int $companyId, string $uuid)` — lanza not found si la orden no existe o es de otra compañía.
  - Archivos: `app/Services/Orders/OrderService.php`, `app/Services/Orders/Imp/OrderServiceImp.php`.

- [x] **4. Resources de serialización**
  - `OrderListResource`: uuid, order_number, created_at, origin, service_type, status, status_payment, subtotal, tax, discount, total, customer_name (OWNER si existe).
  - `OrderDetailResource`: estructura completa del contrato del spec (order, customer, creator, items con options, taxes, payments).
  - Archivos (nuevos): `app/Http/Resources/Orders/OrderListResource.php`, `app/Http/Resources/Orders/OrderDetailResource.php`.

- [x] **5. Controlador y rutas**
  - `OrdersController@index` (listado paginado, query `date` opcional) y `OrdersController@show` (detalle por uuid).
  - Rutas bajo el grupo `companies/{company}` + namespace `Orders`: `GET /orders` y `GET /orders/{uuid}`, middleware `jwt.auth` + `permission.api:api-module-orders`.
  - Respetar el envoltorio `{ status, message, data, metadata }` con paginación en `metadata`.
  - Archivos: `app/Http/Controllers/Modules/Api/Orders/OrdersController.php`, `routes/api/v1.php`.

- [x] **6. Verificación backend**
  - Probar: listado sin `date` (asume hoy), con `date` explícita, paginación, detalle completo (ítems + opciones + impuestos + pagos + OWNER/CREATOR).
  - Casos negativos: orden de otra compañía → 404; usuario sin `api-module-orders` → 403.
  - Notas: no hay suite de tests configurada como flujo estándar; verificar con curl/tinker contra datos reales.

### Frontend (piddet-administrator)

- [x] **7. Datos mock para modo demo**
  - Añadir a `resolveMock` los paths de listado (`/companies/{id}/orders?date=...`, con `metadata.pagination`) y detalle (`/companies/{id}/orders/{uuid}`) con datos de ejemplo realistas (varios estados, ítems con opciones, impuestos, pagos).
  - Archivos: `src/data/mock.js`.

- [x] **8. Servicio de órdenes y barril**
  - Nuevo `ordersService`: `getOrders({ date, page })` con `paginated: true` y `getOrder(orderId)`, sobre la compañía activa.
  - Componer en el barril `api`.
  - Archivos (nuevo): `src/lib/services/orders.js`; (modificar): `src/lib/api.js`.

- [x] **9. Permiso, rutas y menú**
  - Declarar módulo `invoices` → `api-module-orders` en `src/lib/permissions/modules.js`.
  - Rutas `/invoices` y `/invoices/:orderId` envueltas en `RequirePermission` en `src/App.jsx` (el detalle reusa el permiso del listado).
  - Entrada "Facturas" en el Sidebar con icono `fa-file-invoice`, visible según permiso.
  - Archivos: `src/lib/permissions/modules.js`, `src/App.jsx`, componente Sidebar.

- [x] **10. Pantalla de listado `Invoices.jsx`**
  - Selector de fecha (un solo día, default hoy) que recarga el listado; `useResource` + `Card` + `DataTable`.
  - Columnas: Nº, hora, cliente, origen, tipo de servicio, estado (`Badge` por estado con tokens), estado de pago, total.
  - Fila clickeable → navega a `/invoices/:orderId`. Paginación según `metadata`.
  - Archivos (nuevos): `src/screens/Invoices.jsx`, `src/screens/Invoices.module.css`.

- [x] **11. Pantalla de detalle `InvoiceDetail.jsx`**
  - Encabezado con número, fecha/hora y `Badge` de estado; secciones: ítems (con opciones/toppings), resumen de totales, impuestos, pagos, cliente (OWNER) y creada por (CREATOR); origen/servicio/mesa.
  - Botón/enlace de regreso al listado conservando la fecha consultada.
  - Archivos (nuevos): `src/screens/InvoiceDetail.jsx`, `src/screens/InvoiceDetail.module.css`.

- [x] **12. Documentación**
  - Añadir `api-module-orders` a los permisos actuales en `CLAUDE.md` y `specs/guides/permissions.md`; añadir el módulo Facturas a `specs/functional.md`.
  - Archivos: `CLAUDE.md`, `specs/guides/permissions.md`, `specs/functional.md`.

- [x] **13. Verificación en modo demo**
  - `npm run dev` sin `VITE_API_URL`: recorrer listado (fecha por defecto hoy, cambio de fecha), abrir detalle, verificar gateo por permiso (sin permiso: sin menú y redirect a Inicio) y modo oscuro.

## Notas de implementación

- **Orden:** las tareas 1–6 (backend) definen el contrato; el frontend (7–13) puede avanzar en paralelo apoyándose en el contrato del spec y el mock, pero la verificación contra backend real requiere 1–6 terminadas.
- **Dependencias internas:** 2→3→5 (repo → servicio → controlador); 8 depende de 7 para el modo demo; 10 y 11 dependen de 8 y 9.
- **Solo lectura:** sin mutaciones ni cambios de schema en BD; el único dato nuevo es el registro del permiso.
- **Convenciones:** rutas/métodos/archivos en inglés, texto visible en español; claves JSON tal como las exponga el backend; CSS Modules con tokens (nada de valores a mano).
- Al terminar, ejecutar con `/spec --run feature/1-invoices-by-date` (genera `result.md`).

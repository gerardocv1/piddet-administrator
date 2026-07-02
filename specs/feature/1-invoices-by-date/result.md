# Resultado: [FEATURE-1] Facturas por fecha (módulo Facturas)

> **Completado:** 2026-07-02

## Cómo probar

**Modo demo (sin backend):**

```bash
VITE_API_URL= npm run dev
```

1. Entrar a `http://localhost:5173/admin` y hacer login (el mock acepta cualquier credencial).
2. En el sidebar, sección **Operación**, aparece **Facturas** → lista 5 facturas de hoy con
   selector de fecha (chip con calendario nativo), estados con `Badge` y contador "5 facturas".
3. Cambiar la fecha a ayer → 2 facturas; aparece el botón "Hoy" para volver; la fecha queda en
   la URL (`?date=YYYY-MM-DD`).
4. Clic en una fila → `/invoices/:orderId` con el detalle: ítems con opciones, resumen de
   totales, impuestos, pagos, cliente (OWNER) y "Creada por" (CREATOR), origen/servicio/mesa.
5. El botón ← vuelve al listado conservando la fecha consultada.

**Backend real (backend-piddet):**

```bash
# Con el servidor corriendo (./piddet.sh start) y un JWT válido:
GET /api/v1/companies/{company}/orders?date=2026-07-01&per_page=15   # listado paginado (sin date → hoy)
GET /api/v1/companies/{company}/orders/{uuid}                        # detalle completo
```

Requiere el permiso `api-module-orders` en la compañía (403 sin él; 401 sin token; 404 si la
orden no existe o es de otra compañía). Para registrar el permiso en un entorno:
`php artisan db:seed --class="Database\Seeders\Permissions\AddPermissionOrders"` (idempotente).

## Cambios realizados

### backend-piddet

| Archivo | Cambio |
|---|---|
| `app/Http/Constants/OrderPermissionsConstants.php` | Constante `PERMISSION_ORDER_MODULE = 'api-module-orders'`. |
| `database/seeders/Permissions/AddPermissionOrders.php` (nuevo) | Registra el permiso (module_id 8 = Orders, `is_api = true`) y lo asigna al super admin. |
| `database/seeders/DatabaseSeeder.php` | Llama al nuevo seeder. |
| `app/Repositories/Orders/OrdersRepository.php` + `Imp/OrdersRepositoryImp.php` | `paginateByCompanyAndDate()` (select con `origin_code`, `customer_name` OWNER via left join, `total_formatted`, `created_date`; orden desc por `created_at`) y `getOrderDetailForCompany()` (valida `company_id`, reusa `getOrderDetail()` y añade el usuario CREATOR). |
| `app/Services/Orders/OrderService.php` + `Imp/OrderServiceImp.php` | `getOrdersByCompanyAndDate()` (sin fecha → hoy, timezone de órdenes) y `getOrderDetailForCompany()`. |
| `app/Http/Controllers/Modules/Api/Orders/OrdersController.php` | `index` (valida `date`/`per_page`, responde con `responsePaginated`) y `show` (404 si no es de la compañía). |
| `routes/api/v1.php` | `GET companies/{company}/orders` y `GET companies/{company}/orders/{uuid}` con `jwt.auth` + `permission.api:api-module-orders`. |

### piddet-administrator

| Archivo | Cambio |
|---|---|
| `src/lib/services/orders.js` (nuevo) | `orders({ date, page })` paginado y `order(orderId)`, company-scoped. |
| `src/lib/api.js` | Compone `ordersService` en el barril. |
| `src/lib/orderLabels.js` (nuevo) | Mapas clave backend → etiqueta/variante en español (estados, pago, servicio, origen, métodos) + helpers `todayIso`/`timeOf`. |
| `src/lib/permissions/modules.js` | Módulo `/invoices` ("Facturas", sección Operación) gateado por `api-module-orders`. |
| `src/App.jsx` | Rutas `/invoices` y `/invoices/:orderId` con `RequirePermission`. |
| `src/screens/Invoices.jsx` + `.module.css` (nuevos) | Listado con `FilterBar` (filtro tipo `date`, default hoy, máx. hoy), botón "Hoy", contador, `DataTable` con badges y fila clickeable, `Pagination`; fecha/página en la URL. |
| `src/screens/InvoiceDetail.jsx` + `.module.css` (nuevos) | Detalle completo en tarjetas (ítems+opciones, resumen, impuestos, pagos, cliente, creada por) con botón volver que conserva la consulta. |
| `src/components/data/DataTable.jsx` + `.module.css` | Prop opcional `onRowClick` (cursor, hover y Enter con teclado). |
| `src/data/mock.js` | Permiso demo `api-module-orders` + fábrica `buildMockInvoice` (8 órdenes en 3 días, totales coherentes) + `resolveOrdersMock`. |
| `CLAUDE.md`, `specs/functional.md`, `specs/guides/permissions.md` | Documentado el módulo y el permiso. |

## Notas

- **Sin Laravel Resources:** el plan preveía `OrderListResource`/`OrderDetailResource`, pero el
  backend no usa esa capa; siguiendo su CLAUDE.md, el shaping se hace en el select del
  repositorio (regla de paginación del proyecto). Mismo contrato, patrón nativo del repo.
- **Verificación backend:** queries probadas vía tinker contra datos reales (7 órdenes del día,
  detalle con items/opciones/pagos/OWNER/CREATOR; compañía ajena → null/404); rutas registradas
  (`route:list`); sin token → 401; permiso verificado con `validatePermissionByUserId` (la misma
  llamada del middleware). No se probó el 200 HTTP end-to-end por no disponer de credenciales.
- **Verificación frontend:** flujo completo en modo demo con navegador real (login → sidebar →
  listado hoy → cambio de fecha → detalle → volver), incluidos casos borde (uuid inexistente,
  día sin datos, `?date=` inválida en URL).
- **Deuda / siguientes pasos sugeridos:**
  - Asignar `api-module-orders` a los roles que corresponda (hoy solo super admin vía seeder).
  - El detalle de una orden con `?date=` inválida en la URL muestra la tabla vacía en demo; en
    backend real respondería 400 → mensaje de error genérico. Aceptable, pero se podría sanear
    el parámetro al leerlo.
  - `taxes` del backend agrupa por `tax_id` pero `OrderTax` no guarda el nombre del impuesto
    (`$first->name` llega null); el panel muestra "Impuesto" como fallback. Si se quiere el
    nombre real (p. ej. "IVA"), habría que joinear con el catálogo de taxes en el detalle.

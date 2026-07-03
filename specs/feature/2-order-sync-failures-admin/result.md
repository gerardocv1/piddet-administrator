# Resultado: [FEATURE-2] Fallos de sincronización de órdenes (módulo de soporte)

> **Completado:** 2026-07-02

## Cómo probar

**Modo demo** (`VITE_API_URL` vacío): `npm run dev` → login demo → menú
Configuración → Configuraciones → **Fallos de órdenes**.

1. El listado muestra 4 reportes (2 pendientes, 1 resuelto, 1 no recuperable); el filtro
   "Estado" y la paginación viven en la URL (`?status=&page=`).
2. Abrir `sfr-0001` (pendiente, huérfano con `company_id` null): "Reintentar orden" falla
   mostrando el error de validación campo a campo (`company_id` obligatorio).
3. Editar el JSON (poner `"company_id": 1`), "Guardar JSON" y reintentar → la orden se crea,
   el reporte pasa a **Resuelto** con la orden recuperada visible, y todo queda bloqueado
   (estado terminal; reintentar de nuevo daría 409).
4. Abrir `sfr-0003` (no recuperable, payload corrupto): "Reabrir" → reintentar → error
   "Invalid JSON payload". "Marcar no recuperable" con nota vuelve a cerrarlo.
5. Guardar un JSON con sintaxis inválida se rechaza localmente sin llamar al backend.

**Modo real**: requiere backend-piddet con FEATURE-0002 desplegada (migración + permiso
`order-sync-failure-admin` asignado al usuario en la compañía activa).

## Cambios realizados

- `src/lib/services/orderSyncFailures.js` (nuevo): `getSyncFailureReports` (paginado, filtro
  `support_status`), `getSyncFailureReport`, `updateSyncFailureReportPayload`,
  `updateSyncFailureReportStatus`, `retrySyncFailureReport`. Compuesto en `src/lib/api.js`.
- `src/lib/http/HttpClient.js`: en respuestas de error, el `Error` ahora adjunta
  `err.errors` (validación campo a campo) y `err.data` (recurso actualizado que el backend
  devuelve junto al fallo, p. ej. el reporte con `attempts`/`last_retry_error` tras un retry
  fallido).
- `src/lib/syncFailureLabels.js` (nuevo): `supportStatusOf` (etiqueta + variante de Badge),
  `SUPPORT_STATUS_OPTIONS` y `formatDateTime`.
- `src/lib/permissions/modules.js`: entrada "Fallos de órdenes"
  (`/sync-failures`, `order-sync-failure-admin`) en el grupo Configuraciones.
- `src/App.jsx`: rutas `/sync-failures` y `/sync-failures/:reportId` con `RequirePermission`
  (el detalle reusa el permiso del listado).
- `src/screens/SyncFailures.jsx` + `.module.css` (nuevos): listado con `FilterBar` (estado),
  `DataTable` (fecha, nº orden, origen, error truncado con title, intentos, reportó, Badge)
  y `Pagination`; fila → detalle conservando la consulta.
- `src/screens/SyncFailureDetail.jsx` + `.module.css` (nuevos): diagnóstico completo
  (error, contexto plegable, último retry, orden recuperada, notas), editor JSON
  monoespaciado con validación local, acciones (Guardar JSON, Reintentar con confirmación,
  Marcar no recuperable / Reabrir / Marcar resuelto con nota) y panel de resultado del
  reintento con errores campo a campo. `resolved` bloquea todo.
- `src/data/mock.js`: resolver `resolveSyncFailuresMock` (despachado antes que orders para
  que `/orders/sync-failure-reports` no lo capture el matcher de órdenes), 4 reportes demo y
  simulación completa de payload/status/retry (valida el JSON editado y transiciona estados
  en memoria); permiso `order-sync-failure-admin` añadido a `mockPermissions`.
- Documentación: permiso nuevo en `CLAUDE.md` y `specs/guides/permissions.md`.

## Notas

- Verificado: `npm run build` limpio y smoke test en Node del flujo mock completo (listado
  filtrado → retry fallido con `errors` → corregir JSON → resuelto → 409 terminal → JSON
  corrupto 422).
- El editor JSON es una textarea monoespaciada sin resaltado de sintaxis; si soporte lo
  pide, un editor con highlighting sería otro spec.
- El botón "Reintentar" avisa si hay cambios sin guardar en el editor (no se envían: el
  retry usa siempre el payload persistido).
- Backend espejo: backend-piddet `specs/feature/0002-order-sync-failure-reports-admin`
  (implementado en esta misma sesión).

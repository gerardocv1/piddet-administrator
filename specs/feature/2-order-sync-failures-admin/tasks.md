# Plan de Tareas: [FEATURE-2] Fallos de sincronización de órdenes (módulo de soporte)

> **Generado:** 2026-07-02
> **Spec:** [spec.md](spec.md)

## Tareas

- [x] **1. Servicio de dominio y barril**
  - Crear `src/lib/services/orderSyncFailures.js` con:
    `getSyncFailureReports({ status, page })` (GET
    `/companies/{activa}/orders/sync-failure-reports`, `paginated: true`),
    `getSyncFailureReport(reportId)`,
    `updateSyncFailureReportPayload(reportId, orderPayload)` (PUT `.../payload`),
    `updateSyncFailureReportStatus(reportId, { support_status, resolution_notes })`
    (PATCH `.../status`),
    `retrySyncFailureReport(reportId)` (POST `.../retry`).
  - Componer el servicio en el barril `src/lib/api.js`.
  - Archivos: `src/lib/services/orderSyncFailures.js`, `src/lib/api.js`
  - Notas: seguir `specs/guides/backend-service.md`; la compañía activa se resuelve como en
    `orders.js` (referencia directa del patrón de rutas `companies/{company}/orders`).

- [x] **2. Mock para modo demo**
  - Añadir a `src/data/mock.js` datos de ejemplo: reportes en los tres estados
    (`pending`, `resolved`, `unrecoverable`) con `order_payload` realista (estructura de
    `POST /orders`: origin, user, creator, company_id, items con options, payment),
    `error_message`, `attempts`, `last_retry_error`.
  - Simular las mutaciones: guardar payload, cambio de estado, y retry con un caso que
    resuelve (devuelve `{ report resolved, order }`) y uno que falla (error con `errors`
    campo a campo, p. ej. `company_id` requerido).
  - Archivos: `src/data/mock.js`
  - Notas: permite construir y probar las pantallas sin depender del backend (FEATURE-0002).

- [x] **3. Permiso, módulo y rutas**
  - Declarar en `src/lib/permissions/modules.js`, grupo Configuraciones:
    `{ to: '/sync-failures', label: 'Fallos de órdenes', icon: 'fas fa-triangle-exclamation', perm: 'order-sync-failure-admin' }`.
  - Rutas en `src/App.jsx`: `/sync-failures` y `/sync-failures/:reportId` envueltas en
    `RequirePermission` (el detalle reusa el permiso del listado, como Facturas).
  - Archivos: `src/lib/permissions/modules.js`, `src/App.jsx`
  - Notas: whitelist estricta — sin el permiso, el módulo no aparece y la ruta redirige a
    Inicio.

- [x] **4. Pantalla de listado (`/sync-failures`)**
  - `src/screens/SyncFailures.jsx` + `SyncFailures.module.css`: `useResource` sobre
    `api.getSyncFailureReports`, `FilterBar` con filtro de estado (Pendiente por defecto o
    Todos — decidir al implementar), `DataTable` dentro de `Card` con columnas: fecha,
    número de orden, origen, error (truncado con title completo), intentos, reportado por,
    estado con `Badge`; paginación; fila clickeable → `/sync-failures/:reportId`.
  - Mapa de estado → etiqueta/color: `pending` → Pendiente (amarillo/warning),
    `resolved` → Resuelto (verde/success), `unrecoverable` → No recuperable (rojo/danger),
    con tokens de `tokens.css`.
  - Archivos: `src/screens/SyncFailures.jsx`, `src/screens/SyncFailures.module.css`
  - Notas: referencia de estructura: `Invoices.jsx`. Reportes huérfanos pueden traer
    `company_id` null — no asumirlo presente.

- [x] **5. Pantalla de detalle (`/sync-failures/:reportId`)**
  - `src/screens/SyncFailureDetail.jsx` + `SyncFailureDetail.module.css` con:
    - Encabezado: volver al listado, número/fecha del reporte, `Badge` de estado.
    - Panel de diagnóstico: `error_message` completo, `context`, `paid_sync_status`,
      origen, reportado por, intentos, `last_retry_error`/`last_retry_at`,
      `recovered_order_uuid` (si resuelto) y `resolution_notes`.
    - Editor JSON: textarea monoespaciada, carga con `JSON.stringify(parsed, null, 2)`,
      valida con `JSON.parse` antes de guardar (error de sintaxis en línea, sin llamar al
      backend); botón "Guardar JSON".
    - Acciones: "Reintentar orden" (con confirmación), "Marcar no recuperable" (con
      confirmación en `Modal size="sm"`), "Reabrir" (unrecoverable → pending) y "Marcar
      resuelto" manual con nota opcional (`Modal` con textarea).
    - Panel de resultado del reintento: éxito → mensaje + uuid/número de la orden creada y
      Badge a Resuelto; fallo → mensaje del backend y lista campo a campo si llegan
      `errors` de validación.
    - Estado `resolved` deshabilita editor y todas las acciones.
  - Tras cada mutación, actualizar el estado local con la respuesta (`setData`) o `reload`.
  - Archivos: `src/screens/SyncFailureDetail.jsx`, `src/screens/SyncFailureDetail.module.css`
  - Notas: sin librerías nuevas de editor JSON; los errores del backend se muestran sin
    reinterpretar.

- [x] **6. Documentación de permisos**
  - Añadir `order-sync-failure-admin` a la lista de permisos de `CLAUDE.md` (sección
    Reglas innegociables → Permisos) y a `specs/guides/permissions.md`, describiendo el
    módulo (listado por compañía, edición de payload, retry, estados de soporte).
  - Archivos: `CLAUDE.md`, `specs/guides/permissions.md`

- [x] **7. Verificación en modo demo**
  - `npm run dev` con `VITE_API_URL` vacío: recorrer el flujo completo con el mock —
    listado con filtro, detalle, editar JSON (incluyendo JSON inválido → error local),
    retry fallido (errores campo a campo), retry exitoso (transición a Resuelto),
    marcar no recuperable y reabrir.
  - Verificar el gateo: sin el permiso en el mock de permisos, el módulo no aparece y la
    ruta redirige a Inicio.
  - Verificar modo oscuro y responsive básico de ambas pantallas.

## Notas de implementación

- Orden: 1–2 (datos) → 3 (gateo) → 4–5 (pantallas) → 6–7. Las pantallas se construyen
  contra el mock, por lo que no dependen de que el backend (FEATURE-0002) esté desplegado.
- Para probar en modo real se requiere el backend con la migración, las rutas y el permiso
  `order-sync-failure-admin` asignado al usuario en la compañía activa
  (backend-piddet `specs/feature/0002-order-sync-failure-reports-admin`).
- Reglas innegociables del repo: sin fetch directo (todo vía servicio + `useResource`),
  componentes desde el barril, CSS Modules con tokens, textos visibles en español y
  claves del JSON tal como las expone el backend (`support_status`, `order_payload`, etc.).

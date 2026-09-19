# Plan de tareas: [FEATURE-3] Directorio público de compañías

> **Generado:** 2026-09-19
> **Spec:** [spec.md](spec.md)

## Tareas

- [x] **1. Contrato público y modo demo**
  - Añadir `publicCompanyTypes` y `publicCompanies` a `companyService`.
  - Crear datos realistas para restaurante, gimnasio, tienda y hospedaje.
  - Resolver `/public/directory/company-types` y `/public/directory/companies` con filtro y paginación.

- [x] **2. Pantalla `PublicHome`**
  - Construir hero, cabecera de marca, acceso administrativo y sección de contacto.
  - Implementar vista agrupada por tipo con primera página de tarjetas.
  - Implementar vista `?type=` paginada y retorno al directorio completo.
  - Cubrir estados loading, error y empty mediante `useResource`.

- [x] **3. Estilos responsive**
  - Crear CSS Module mobile-first con tokens existentes.
  - Verificar composición a 375 px, 768 px y escritorio, además de tema oscuro.

- [x] **4. Integración pública**
  - Servir `PublicHome` en `/` sin alterar `/admin` ni `/{username}`.
  - Aplicar título y metadata social con `shareMeta.js`.
  - Conectar el CTA de WhatsApp a `VITE_CONTACT_WHATSAPP` y documentar la variable.

- [x] **5. Documentación y verificación**
  - Actualizar `specs/functional.md` y `specs/tech.md`.
  - Ejecutar `npm run build`.
  - Registrar comprobaciones, resultado y riesgos en `result.md`.

## Orden de ejecución

Datos y mocks → pantalla → estilos → rutas/metadata/contacto → documentación → build.

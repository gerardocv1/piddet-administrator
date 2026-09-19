# Resultado: [FEATURE-3] Directorio público de compañías

> **Completado:** 2026-09-19

## Resultado

La raíz `/` ahora es una portada pública mobile-first. Presenta la marca Piddet, una bienvenida,
los negocios activos agrupados por tipo y una llamada final para vincular nuevos negocios. El
modo `/?type=<key>` reemplaza las secciones por un catálogo paginado; cada tarjeta abre la portada
existente `/{username}`. `/admin/login` y las demás rutas públicas conservan su comportamiento.

## Cambios realizados

- `src/screens/PublicHome/PublicHome.jsx` y `.module.css`: nueva portada, tarjetas locales,
  estados loading/error/empty, modo por tipo, paginación, metadata social y CTA condicional.
- `src/lib/services/company.js`: métodos `publicCompanyTypes` y `publicCompanies`.
- `src/data/mock.js`: 21 compañías demo de restaurante, gimnasio, tienda y hospedaje; conteos,
  filtro y metadata paginada para los dos endpoints públicos.
- `src/App.jsx`: `/` se resuelve como `PublicHome` antes del panel; `/{username}` sigue atendiendo
  `PublicCompany`; el tema persistido se aplica también antes de renderizar vistas públicas.
- `src/screens/PublicCompany/`: perfil rediseñado con la cabecera de Piddet, hero de marca,
  resumen disponible y superficies responsive para hospedaje, menús, ubicaciones y contacto.
- `src/screens/public/shareMeta.js`: canonical, robots y JSON-LD reutilizables para vistas
  públicas.
- `index.html`: la raíz pública restaura manifest, nombre e icono de Piddet aunque exista una
  compañía administrativa guardada, y ofrece metadata SEO estática de respaldo.
- `src/styles/tokens.css`: escala de espaciado portada desde el catálogo visual (`09f842b`).
- `.env.example`: variable opcional `VITE_CONTACT_WHATSAPP`.
- `specs/functional.md` y `specs/tech.md`: flujo público, endpoints, routing y entorno.

## Verificación real

- `npm run build`: correcto; Vite transformó 1517 módulos y generó `dist`. Permanece el aviso
  preexistente de bundle principal mayor a 500 kB.
- Smoke de `resolveMock` en Node:
  - cuatro tipos con conteos `9 / 4 / 4 / 4`;
  - restaurantes página 1: 8 elementos, `last_page: 2`, `total: 9`.
- Navegador en modo demo:
  - 375 px: una columna de 343 px, sin desbordamiento horizontal;
  - 768 px: dos columnas de 352 px, sin desbordamiento;
  - 1440 px: cuatro columnas de 267 px, sin desbordamiento;
  - portada normal: 20 tarjetas iniciales;
  - `?type=restaurant`: 8 tarjetas en página 1 y 1 tarjeta (`Taller del Café`) en página 2;
  - `/grupo_sabor`: cargó `PublicCompany` y sus menús;
  - `/taller_del_cafe`: abrió el perfil demo correspondiente, no el perfil genérico;
  - `?type=restaurant&page=999`: se normalizó a la última página real (`page=2`);
  - en tema oscuro, `/` conservó `data-theme=dark`, manifest Piddet y metadata actualizada;
  - `/grupo_sabor` en 375 px: una columna, `scrollWidth=375`, sin overflow;
  - `/grupo_sabor` en 1440 px: columnas de 653/470 px y hero de 1148 px, sin overflow;
  - perfil: canonical limpio, descripción, `Restaurant` JSON-LD y `index, follow`;
  - categoría paginada: canonical/`og:url` sin `utm_source` y grafo `WebSite` + `CollectionPage`;
  - menú público: canonical propia sin `utm_source`;
  - `/checkin`: `robots=noindex, nofollow` para no indexar códigos de acceso;
  - `/admin/login`: cargó el formulario administrativo existente;
  - con el backend local no disponible se mostró el estado de error con reintento;
  - sin `VITE_CONTACT_WHATSAPP` el botón de contacto quedó oculto.
- `git diff --check`: correcto.

## Riesgos y pendientes externos

- El contrato real quedó implementado y cubierto por pruebas Feature en `backend-piddet`; la
  integración visual del cliente se verificó en modo demo porque el servidor API no estaba
  levantado durante la prueba de navegador.
- Open Graph creado en el navegador no cubre crawlers que no ejecutan JavaScript; la vista previa
  definitiva necesita metadata servida desde infraestructura/backend.
- El panel marca check-in y enlaces `/r/*` como `noindex, nofollow` al arrancar; la garantía para
  crawlers sin JavaScript requiere además `X-Robots-Tag` por ruta en CDN/servidor, configuración
  que no vive en este repositorio.
- La portada normal hace una petición por tipo. Es adecuado para los cuatro tipos actuales, pero
  convendría un endpoint agregado si el catálogo de tipos crece de forma importante.
- La advertencia de tamaño del bundle no nace en esta funcionalidad; el proyecto aún no separa
  rutas públicas y administrativas en chunks.

# Sistema de diseño — dónde vive y cómo se usa

La línea visual de Piddet se versiona e itera en su propio repositorio:

> **https://github.com/gerardocv1/piddet-visual-catalog**

Es un catálogo navegable (React + Vite, sin backend ni login) con los tokens de diseño y una
selección puramente visual de los componentes de este panel, montados con ejemplos interactivos
en tema claro y oscuro: principios, paleta, tipografía, superficies, botones, formularios,
tablas, feedback y navegación.

```bash
git clone https://github.com/gerardocv1/piddet-visual-catalog
cd piddet-visual-catalog && npm install && npm run dev   # → http://localhost:5174
```

## Regla de trabajo

**Cualquier tema de diseño se basa en el visual catalog.** Antes de crear o modificar un
componente, un color o un patrón en este panel:

1. **Consulta el catálogo**: si la pieza o la variante ya existe, úsala tal cual desde
   `src/components` de este repo (los componentes del catálogo son espejo de los de aquí).
2. **Si es un cambio de diseño** (token, variante nueva, componente nuevo de UI pura):
   propónlo e itéralo primero en `piddet-visual-catalog`, donde se ve junto a todas las demás
   variantes y en ambos temas. Aprobado allá, se porta aquí **archivo por archivo** — la
   estructura de `src/components` y `src/styles/tokens.css` es idéntica a propósito.
3. **Si es una pieza acoplada a la app** (api, permisos, PWA, dominio — p. ej. `SessionsModal`,
   `FileUpload`, `Sidebar`): vive solo en este repo, pero se construye con los tokens y las
   piezas base que el catálogo documenta.

## Correspondencia de rutas (espejo)

| piddet-visual-catalog | piddet-administrator (este repo) |
|---|---|
| `src/styles/tokens.css` | `src/styles/tokens.css` |
| `src/components/{core,forms,data,feedback,navigation}/…` | `src/components/{…}/…` (mismas rutas) |
| `src/components/index.js` (barril curado, solo UI pura) | `src/components/index.js` (barril completo) |
| `src/catalog/` (la app del catálogo) | — no existe aquí |

Al portar un cambio: copiar el archivo a la misma ruta, verificar las pantallas que usan la
pieza y correr `npm run build`. Si el cambio toca un componente que el catálogo no tiene
(acoplado a la app), el criterio visual sigue siendo el del catálogo.

## Sincronía

El punto de partida de la copia espejo quedó registrado en el README del catálogo (commit de
origen en este repo). Si los repos se desvían, **gana el catálogo en lo visual** y gana este
repo en lo funcional; la desviación se corrige portando en la dirección que corresponda.

**Estado de la copia espejo:** sincronizada de punta a punta en el catálogo `6f96d8e` (barrido
archivo por archivo de `tokens.css` y `src/components/`). Solo divergen a propósito el barril
—curado allá, completo aquí— y `PageHeader.jsx`, que aquí publica su `onBack` al Topbar
(`useSetPageBack`) y allá no, por ser un enganche de la app. Ese porteo fue en sentido
contrario (este repo → catálogo): se había adelantado en la capa móvil (botones compactos,
`FilterBar`, campos que siguen la escala de la interfaz, `StatStrip` con `desktopOnly` y el
`PageHeader` sin marco).

Último porteo aplicado (catálogo `212274d` → este repo): token `--shadow-header` y la sombra
corta que el encabezado de la `Card` proyecta sobre su cuerpo (cada sección se lee aparte), más
las fechas en ISO de la `FilterBar`.

Porteo anterior (catálogo `8464c0d` → este repo): tokens de acento de compañía
(`--company-accent`, `-strong`, `-soft`, `-on-dark` en `tokens.css`) — la identidad de la
compañía activa asoma solo en navegación y realces decorativos (dock móvil, menú «Más»,
iconos de módulo, accesos rápidos del dashboard, icono activo del sidebar); botones de
acción, foco y logo no se retiñen.

Porteo anterior (catálogo `201888c` → este repo): componente nuevo `LineList`
(`src/components/data/`), el listado de líneas nombre · precio de las cuentas — fragmentos
`Muted`/`Status`, acción al final, fila navegable, `annulled` y variante `compact` — usado
primero en el detalle de reserva.

Porteo anterior (catálogo `13b0211` → este repo): primario de acción azul petróleo con
el naranja como firma de marca (`--brand-piddet` en logo e ítem activo del menú), verde de
éxito esmeralda, capa móvil nativa (tarjetas sin marco, campos rellenos), cierres con Escape
en todos los flotantes, fuentes/iconos no bloqueantes en `index.html`, y el chasis móvil nuevo:
topbar limpio sin división (crumb como eyebrow) y `MobileDock` en vez de hamburguesa
(«Más» navega a la pantalla de menú completo `/more`, con el dock siempre visible).

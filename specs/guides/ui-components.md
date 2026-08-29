# Guía: componentes de UI

> Consulta esta guía cuando vayas a **construir o modificar interfaz** (pantallas, formularios,
> tablas, modales). Para estilos/tema, ver [`styling.md`](styling.md).

## Regla de oro: importar desde el barril

Importa **siempre** desde `src/components/index.js`. La categoría interna
(core/forms/data/feedback/navigation) es transparente; no importes por ruta profunda.

```jsx
import { Button, Card, DataTable, FilterBar, Modal, Switch } from '../components';
```

## Inventario de componentes

| Categoría | Componentes |
|---|---|
| **core** | `Button`, `IconButton`, `Badge`, `Avatar`, `Card`, `Spinner` |
| **forms** | `Input`, `Select`, `Checkbox`, `Switch`, `Autocomplete` |
| **data** | `DataTable`, `FilterBar`, `StatStrip`, `Pagination`, `SortableList` |
| **feedback** | `Modal`, `SessionsModal`, `ChangePasswordModal`, `Notifications` |
| **navigation** | `Sidebar`, `Topbar` |

Antes de crear un componente nuevo, revisa si uno existente ya cubre el caso. Si lo creas,
ubícalo en su categoría y reexpórtalo en el barril.

## Componentes que centralizan patrones (úsalos en vez de reimplementar)

### `DataTable`

Tabla de datos con estados de carga integrados. Combínalo con `useResource`.

- Props clave: `columns`, `rows`, y los estados `loading`, `error`, `empty`.
- Renderiza el estado correcto automáticamente (spinner, mensaje de error, vacío).

```jsx
const { data: rows, loading, error } = useResource(api.products, []);

<Card>
  <DataTable columns={COLUMNS} rows={rows} loading={loading} error={error} empty="Sin productos." />
</Card>
```

### `FilterBar`

Filtros responsive + chips removibles + búsqueda.

- En escritorio: dropdowns inline. En móvil: botón "Filtros" + bottom-sheet que **acumula**
  selecciones.
- La forma de cada filtro se declara como un array (`type: 'multi' | 'select' | 'toggle'`).
- Ejemplo real: constante `FILTERS` en `src/screens/Products.jsx`.

### `Modal`

- `size="sm"` → confirmaciones (flotante centrado).
- `size="md"` / `"lg"` → crear/editar. En móvil suben como bottom-sheet.

`SessionsModal` y `ChangePasswordModal` son modales de dominio ya construidos sobre `Modal`.

### `Autocomplete`

Selector con **búsqueda asíncrona** (type-ahead). Úsalo en vez de `Select` cuando el catálogo es
grande o vive en el backend: el usuario escribe, a partir de `minChars` (def. 3) se dispara la
consulta con debounce, se muestra un cargador y luego un desplegable con las coincidencias para
elegir una. Es **controlado** y **genérico** (trabaja con ítems crudos, sin forma fija).

- `fetcher(query) → Promise<item[]>` **(obligatorio)**: la consulta. Devuelve los ítems crudos;
  envuélvelo en `useCallback` para que sea estable. Cancela respuestas obsoletas internamente.
- `value` / `onChange(item|null)`: ítem seleccionado y su cambio (incluye limpiar → `null`).
- `getOptionLabel(item)` (def. `item.label ?? item.name`) y `getOptionValue(item)`
  (def. `item.value ?? item.id`); `renderOption(item)` para filas personalizadas.
- Personalizables: `minChars`, `debounce` (ms), `label`, `icon`, `hint`, `error`, `placeholder`,
  `disabled`, `autoFocus`, `clearable`, `loadingText`, `noResultsText`, `minCharsText`.
- Teclado: ↑/↓ navega, Enter selecciona, Esc cierra; cierra al hacer clic fuera.

```jsx
const search = React.useCallback(
  (q) => api.searchMenuProducts(menuId, { q }).then((d) => d.items),
  [menuId],
);

<Autocomplete
  label="Producto"
  placeholder="Busca por nombre o SKU (mín. 3 letras)"
  minChars={3}
  fetcher={search}
  value={sel}
  onChange={setSel}
  getOptionLabel={(p) => p.name}
  getOptionValue={(p) => p.id}
  renderOption={(p) => <>{p.name} · {p.value_print}</>}
/>
```

Ejemplo real: `AddProductModal` en `src/screens/MenuDetail.jsx`.

### `SortableList`

Lista vertical **reordenable por arrastre** (drag & drop, sobre `@dnd-kit`), accesible y táctil.
El orden se confirma al soltar con `onReorder(nextItems, { from, to })` (array ya reordenado); el
consumidor persiste el cambio. `renderItem(item, { handleProps, isDragging })` debe colocar
`handleProps` sobre el elemento que actúa como agarre. Ejemplo real: `src/screens/MenuCategories.jsx`.

### `FileUpload`

Subida de una imagen a S3 con edición previa en el navegador: recorte (`react-easy-crop`), giro y
zoom. Nada se sube al elegir el archivo — el contenedor llama a `upload()` por ref al guardar, y
recibe el resultado del backend (`name` es la referencia que se manda en el payload).

Con `allowBackgroundRemoval` aparece el botón **Sin fondo**, que abre `BackgroundRemover`: quita el
fondo por color (detectado solo o elegido con el cuentagotas, con tolerancia, borde suave y modo
«solo el fondo de alrededor»), corrige a mano con pinceles de borrar/restaurar y puede recortar el
sobrante transparente. Devuelve un PNG que sustituye a la imagen en edición, así que la exportación
conserva la transparencia. La lógica de imagen vive aparte, en `src/lib/removeBackground.js`, sin
dependencias externas. Hoy solo lo usa el logo en *Editar empresa* (`CompanyProfile`).

## Iconos

FontAwesome 6 por CDN (declarado en `index.html`). Se pasan como **string de clase**:

```jsx
<Button icon="fas fa-plus">Nuevo</Button>
```

## Móvil: la barra de navegación deja pasar el contenido

`MobileDock` es una barra inferior a lo ancho, **sin superficie propia**: arriba lleva un fade
corto por el que el contenido pasa y se desvanece, rematado por un **filete** que divide el body
del menú; de ahí hacia abajo la barra es opaca. Cada destino es **icono con su nombre pequeño
debajo** (texto fino) y el activo únicamente cambia de tinte, sin píldora de fondo. Son seis:
Inicio, cuatro módulos y «Más», que navega a la pantalla de menú completo (`/more`) — no abre
ningún cajón: en móvil el `Sidebar` ni se monta. La pantalla (`MoreMenu`) es superficie clara con
el logo arriba, la empresa activa (tap → perfil; con varias, selector), los módulos accesibles
agrupados por sección en tarjetas de filas (los desplegables conservan el nombre del padre como
subtítulo: «Reporte» de Ventas ≠ «Reporte» de Egresos), el enlace al POS, instalar la app y
salir. El dock sigue visible abajo con «Más» activo, y en `/more` el Layout oculta el topbar (la
pantalla trae su propia cabecera con el logo).

Cuando la pantalla activa pertenece a un módulo con varias secciones (Egresos → Gastos · Reporte ·
Categorías), encima de los destinos aparece un **submenú horizontal** con esas hermanas,
desplazable si no caben. Son **textos, no píldoras**: el activo se marca con color y peso, y solo
se marca la ruta más específica (`/expenses` es prefijo de `/expenses/summary`). La fila va
**centrada** y sobre un gris un punto más claro que el fondo, que es lo que la separa de los
destinos. Se calcula sobre
`MODULE_GROUPS` completo, así que también lo tienen los módulos a los que se llega desde «Más».
La propia `/more` no tiene submenú: no pertenece a ningún módulo.

> El `nav` lleva `pointer-events: none` para que el fade no intercepte toques: **toda zona
> interactiva que se añada dentro tiene que recuperarlos** con `pointer-events: auto`.

El dock **publica su alto real en `--dock-h`** (cambia según lleve submenú o no) y `Layout` lo usa
para reservar abajo el espacio justo — así ninguna barra de acciones queda debajo del menú. En los
**flujos a pantalla completa** con su propia barra fija (registrar gasto, nueva reserva, cerrar
turno, tomar medidas, crear carta con IA) el dock **no se pinta** y `--dock-h` vale `0px`: tapaba los botones
Continuar/Registrar, y durante el flujo la navegación es del propio asistente (la lista vive en
`FLOW_ROUTES`, en `Layout.jsx`).

## Móvil: la cabecera vive en el Topbar

En el teléfono la barra superior es la cabecera de la pantalla: lleva el **título** y la **flecha
de volver**, que ya no se repite dentro del contenido. `PageHeader` publica su `onBack` al Topbar
(vía `useSetPageBack`, que llama solo) y oculta su propio botón en ≤ 860 px — las pantallas no
tienen que hacer nada.

El título largo se corta en un teléfono, así que `useSetPageTitle` acepta una versión corta que
solo se usa ahí:

```jsx
useSetPageTitle(`Afiliado · ${member.name}`, { shortTitle: firstName });
```

Los **metadatos** de `PageHeader` (`meta`) se pintan en escritorio como rejilla (etiqueta arriba,
valor abajo) y en móvil como filas etiqueta→valor separadas por un filete: se lee de un vistazo
qué es cada dato, sin bloques sueltos. Entre secciones (`Card` hermanas) también hay filete: sin
marco, el aire solo no dejaba claro dónde termina una y empieza la otra.

## Móvil: una acción visible por sección, el resto en el menú ⋮

En el teléfono los botones son compactos (`Button` baja su alto y tipografía en ≤ 860 px) y **no
se estiran a lo ancho**: la cabecera (`PageHeader`) deja las acciones con su ancho natural a la
derecha. La regla de composición es una sola acción visible por sección —la que se usa en el
mostrador— y todo lo secundario agrupado en un `Dropdown` con el disparador `⋮`:

```jsx
const isMobile = useIsMobile();
<PageHeader
  actions={isMobile ? (
    <Dropdown
      trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Más acciones" />}
      items={[{ label: 'Editar datos', icon: 'fas fa-pen', onClick: openPersonal }]}
    />
  ) : (
    <Button variant="secondary" size="sm" icon="fas fa-pen" onClick={openPersonal}>Editar datos</Button>
  )}
/>
```

Al menú se llevan actualizar, enlaces auxiliares y cualquier cosa que no sea la acción principal
del estado. Lo que ya está en otro lado (el contador de resultados de un listado, un dato que
repite otra pestaña) se oculta en móvil en vez de duplicarse. Ejemplos reales:
`screens/GymMemberDetail.jsx` y `screens/ReservationDetail.jsx`.

### La excepción: acciones del recurso al pie del `InfoCard`

Cuando la ficha de un recurso tiene **dos o tres acciones que se usan sobre la marcha** (editar,
ver progreso, tomar medidas), esconderlas en el ⋮ —o repartirlas por las cabeceras de los paneles
de más abajo— las vuelve invisibles en el teléfono. Para eso `InfoCard` acepta `footerActions`:
una tira de botones al pie de la tarjeta, **fuera del plegable**, así que se ve con la ficha
cerrada. Se reparten el ancho a partes iguales y envuelven si no caben.

La pantalla decide según el tamaño y **no duplica**: si una acción sube a la tira, se quita de
sus otros escondites.

```jsx
<InfoCard
  actions={isMobile ? [] : [/* … el ⋮ de escritorio … */]}
  footerActions={!isMobile ? [] : [
    { label: 'Editar', icon: 'fas fa-pen', onClick: openEdit },
    { label: 'Progreso', icon: 'fas fa-chart-line', onClick: goProgress },
    { label: 'Medidas', icon: 'fas fa-plus', variant: 'outline-primary', onClick: goCheckin },
  ]}
>
```

Ejemplo real: `screens/GymMemberDetail.jsx` (en móvil el Panel «Medidas» se queda sin acciones
de cabecera, porque ya viven en la tira).

## Patrón de una pantalla con datos

Flujo completo (datos + UI) en [`backend-service.md`](backend-service.md). Resumen de UI:

1. `useResource(api.<metodo>, inicial)` para los datos.
2. Render dentro de `<Card><DataTable .../></Card>`, con `FilterBar` arriba si hay filtros.
3. Mutaciones optimistas sobre el estado local con `setData` (ver `toggle`/`remove` en
   `screens/Products.jsx`).

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

## Iconos

FontAwesome 6 por CDN (declarado en `index.html`). Se pasan como **string de clase**:

```jsx
<Button icon="fas fa-plus">Nuevo</Button>
```

## Patrón de una pantalla con datos

Flujo completo (datos + UI) en [`backend-service.md`](backend-service.md). Resumen de UI:

1. `useResource(api.<metodo>, inicial)` para los datos.
2. Render dentro de `<Card><DataTable .../></Card>`, con `FilterBar` arriba si hay filtros.
3. Mutaciones optimistas sobre el estado local con `setData` (ver `toggle`/`remove` en
   `screens/Products.jsx`).

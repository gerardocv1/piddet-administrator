# Guía: estilos, tokens y tema

> Consulta esta guía cuando vayas a **tocar estilos, colores, espaciados, tipografías o el
> modo oscuro**. Para componentes, ver [`ui-components.md`](ui-components.md).

## Regla innegociable: CSS Modules + variables

- Cada componente y pantalla tiene su propio `*.module.css`. **No** hay estilos inline ni
  librerías de CSS (ni Tailwind, ni Bootstrap).
- Todos los colores, espaciados y tipografías son **variables CSS (design tokens)** definidas
  en `src/styles/tokens.css`. Nunca escribas un valor de color/espaciado a mano: usa la
  variable, o crea una nueva en `tokens.css` si falta.

```css
/* Nombre.module.css */
.card {
  background: var(--color-surface);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
```

## Cambiar un color, espaciado o fuente en toda la app

Edita la variable en `src/styles/tokens.css` y se propaga a toda la app. No busques y
reemplaces valores por los archivos: el único lugar de verdad son los tokens.

## Modo oscuro

Funciona **sin lógica en los componentes**: el bloque `[data-theme="dark"]` de `tokens.css`
reasigna las mismas variables. Si un componente usa tokens (y no valores fijos), el modo
oscuro ya funciona gratis.

- El tema se aplica como atributo `data-theme` en `<html>`.
- Persiste en `localStorage` (`piddet_theme`); lo gestiona `src/App.jsx`.

**Implicación práctica:** si al añadir estilos usas un color fijo en vez de un token, romperás
el modo oscuro. Usa siempre tokens.

## Checklist al añadir/editar estilos

1. [ ] El estilo vive en el `*.module.css` del componente/pantalla (no inline).
2. [ ] Colores/espaciados/tipografías vía `var(--...)`, no valores fijos.
3. [ ] Si necesitas un token nuevo, lo defines en `tokens.css` (y su variante dark si aplica).
4. [ ] Verificado en claro y oscuro.

## Campos de formulario: una sola escala en el teléfono

En móvil **todos los campos usan `--text-md`** (15px en tablet, 14 en teléfono): `Input`,
`Select`, `Textarea`, `Autocomplete`, el buscador de `FilterBar` y el disparador de `DatePicker`.
Uno solo, la misma escala para todos.

Puede bajar de 16px **porque el viewport declara `maximum-scale=1`** (en `index.html`), que es lo
que suprime el zoom automático de Safari iOS al enfocar un campo. Si algún día se quita esa
declaración del viewport, los campos tienen que volver a 16px o el iPhone hará zoom al tocarlos
y no lo deshará al salir.

De ahí se sigue una consecuencia práctica: **una pantalla no debe imponer el tamaño de letra de
un campo**. La barra de filtros del inicio lo hacía (`font-size: var(--text-sm)` sobre
`input, select`) y el resultado era que la fecha salía a 12px y el selector a 16px —empataban en
especificidad y ganaba uno u otro—, que es como convivían dos escalas en la misma fila. Si un
control necesita ser más compacto, se usa la variante del componente (`size="sm"`), no un
`font-size` desde la pantalla.

En escritorio los campos siguen la escala de tokens (`--text-base`).

# Guía de diseño viva (styleguide)

Catálogo visual del sistema de diseño del panel: colores, tipografía, superficies, botones,
formularios, tablas, feedback y navegación, montados con los **componentes reales** de
`src/components` sobre los **tokens reales** de `src/styles/tokens.css`.

## Qué es (y qué no es)

- **Es** una segunda entrada de Vite (`styleguide.html`) dentro de este mismo repo. No duplica
  ni copia estilos: importa el barril de componentes y los tokens, así que **no puede
  desactualizarse** respecto a la app. Mejorar un componente en `src/components` mejora a la vez
  el panel y la guía.
- **No es** una app aparte con su propio CSS. Si algo se ve mal en la guía, se ve mal en el
  panel: el arreglo va en el componente o en los tokens, no en la guía.

## Cómo verla

```bash
npm run dev       # → http://localhost:5173/styleguide.html
npm run build     # compila las dos entradas (app y guía) en /dist
```

No requiere backend ni login. El botón **Tema oscuro/claro** de la barra lateral comparte la
clave `piddet_theme` con la app, para revisar cada pieza en ambos temas.

## Estructura

```
styleguide.html                      # entrada de Vite (sin PWA, sin auth)
src/styleguide/
  main.jsx                           # montaje (importa tokens.css)
  StyleguideApp.jsx                  # shell: índice lateral, scroll-spy, toggle de tema
  Styleguide.module.css              # estilos del shell
  Specimen.jsx / Specimen.module.css # piezas de presentación: Section, Specimen, Row, Labeled, Code
  sections/
    PrinciplesSection.jsx            # principios de la línea visual
    ColorSection.jsx                 # paleta por grupos, con valor resuelto por tema
    TypographySection.jsx            # familias, escala, pesos, tonos
    SurfaceSection.jsx               # Card, radios, sombras, layout
    ButtonsSection.jsx               # Button, IconButton, RefreshButton
    FormsSection.jsx                 # Input, MoneyInput, Select, Checkbox, Switch, Textarea, DatePicker, Autocomplete
    DataSection.jsx                  # Badge, Avatar, StatStrip, FilterBar, DataTable, Pagination
    FeedbackSection.jsx              # escalera de mensajes, Alert, Spinner, Toast, Modal, ConfirmDialog
    NavigationSection.jsx            # PageHeader, Dropdown
    sections.module.css              # estilos de las muestras de tokens
```

## Reglas al editar la guía

1. **Los ejemplos usan los componentes del barril** (`src/components`), nunca HTML que los
   imite. Un ejemplo que imita es un ejemplo que miente.
2. **Nada de colores ni espaciados a mano**: la guía consume los mismos tokens que documenta.
   Las muestras de tokens pasan la variable por CSS custom property (`--sw`, `--rad`, `--sh`),
   como hace `StatStrip` con `--cols`.
3. **Al crear o cambiar un componente del panel, actualiza su muestra** en la sección que le
   corresponda (o crea la sección si es una categoría nueva y añádela al índice de
   `StyleguideApp.jsx`).
4. **Revisar en claro y oscuro** antes de dar por buena una pieza; el toggle está en la barra
   lateral.
5. La guía **no entra en la PWA ni en el routing de la app**: es una entrada estática separada,
   sin auth. No importes nada de `src/lib/services` ni de `auth` aquí.

## Flujo de mejora visual

La guía es el lugar para iterar la línea visual con cambios de bajo riesgo y alta visibilidad:

1. Ajusta el token o el componente en su fuente (`tokens.css` / `src/components/...`).
2. Revisa el efecto en la guía (todas las variantes y estados juntos, en ambos temas).
3. Verifica las pantallas del panel que más usan la pieza.
4. `npm run build` para confirmar que ambas entradas compilan.

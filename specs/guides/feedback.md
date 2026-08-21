# Mensajes al usuario: Alert, Toast y Modal

Regla única del panel: **todos los mensajes se ven igual en todas las pantallas**. Nada de
inventar un `div` con su propia clase por pantalla — antes convivían `formError`, `stateError`,
`.notice`, `.banner`, `.noticeOk`, `.payNotice` y cada uno se veía distinto.

Origen: handoff *«alertas, botones y modales — módulo de Reservas»* del sistema de diseño Piddet
(Claude Design). Los valores de color, radio, espaciado y estados son finales; se consumen por
token desde `src/styles/tokens.css`.

---

## La escalera de mensajes

Elige por **qué tiene que hacer el usuario**, no por lo grave que suene el mensaje:

| # | Pieza | Cuándo | Dónde |
|---|---|---|---|
| 1 | Nota de campo (`<p className={s.faint}>`) | Evita el error **antes** de que ocurra | Debajo del campo, siempre visible |
| 2 | `<Alert>` en línea | Consecuencia de lo que se edita aquí | Dentro de la tarjeta o del modal |
| 3 | `<Alert>` de pantalla | Condición que afecta a toda la vista | Bajo el `PageHeader` |
| 4 | Toast (`useToast`) | Una acción **ya terminó bien** | Esquina, 4 s, se va solo |
| 5 | `ConfirmDialog` / `Modal size="sm"` | Hay que aprobar algo que no se deshace | Centrado, bloquea |

Dos reglas que resuelven casi todo:

- **Si el usuario no tiene que hacer nada, es toast. Si tiene que decidir, es modal.**
- **Un error del servidor nunca es un toast**: se queda en pantalla, junto a la acción que falló,
  como `<Alert tone="danger">`. Un toast de 4 segundos es exactamente lo que no quieres para un
  mensaje que hay que leer con calma.

---

## `<Alert>`

```jsx
<Alert tone="info">Los precios se toman del producto.</Alert>

<Alert tone="warning" title="Pre-check-in pendiente"
  action={<Button size="sm" variant="secondary" icon="fas fa-link" onClick={copiar}>Copiar enlace</Button>}>
  El huésped debe registrar sus datos antes de que puedas registrar la entrada.
</Alert>

<Alert tone="danger" title="No se pudo guardar" onClose={() => setError('')}>{error}</Alert>

{/* Solo cuando el aviso BLOQUEA la operación */}
<Alert tone="warning" variant="tint" title="La unidad ya está reservada">…</Alert>
```

- `tone`: `info | success | warning | danger | primary`. **Obligatorio.**
- `variant`: `quiet` (por defecto) — superficie blanca, borde hairline, el color vive solo en la
  pastilla del icono. `tint` — fondo tintado completo; resérvalo para lo que impide continuar.
- El icono lo decide el tono. No pases `icon` salvo que tengas una razón concreta.
- No se auto-cierra: la visibilidad la controla quien lo usa (`onClose` → estado local).

## Toast

Un solo `<ToastProvider>` en `App.jsx`; cualquier pantalla lo lanza con el hook:

```jsx
const { toast } = useToast();
toast({ tone: 'success', title: 'Reserva confirmada' });
toast({ tone: 'neutral', title: 'Reserva cancelada', actionLabel: 'Deshacer', onAction: restaurar });
```

Tarjeta petróleo de marca, 4 s, máximo 3 apiladas, abajo a la derecha (arriba en móvil).
Tonos: `success | info | warning | neutral`. **Nunca** para errores de servidor.

## Modal

`size="sm"` (400 px) confirma y **siempre** flota centrado, también en móvil. `md` (500) y `lg`
(600) son para crear/editar: bajo 860 px se convierten en bottom-sheet con barra de arrastre.
El cuerpo hace scroll; el footer alinea los botones a la derecha.

Cuando un modal puede fallar contra el servidor, **repite el Alert dentro del formulario**: el
banner de pantalla queda tapado por el overlay. Patrón usado en `ReservationDetail`:

```jsx
const errorBlock = actionError
  ? <Alert tone="danger" title="No se pudo completar la acción" onClose={() => setActionError('')}>{actionError}</Alert>
  : null;
// …y luego { errorBlock } tanto bajo el PageHeader como dentro de cada Modal.
```

## Button

Variantes: `primary | secondary | dark | success | danger | neutral | outline-primary`.
Tamaños `sm | md | lg` (en móvil `md` sube a 44 px de alto).

**Cargando ≠ deshabilitado.** `loading` muestra la ruedita, bloquea el botón y conserva el color
pleno con cursor `progress`; solo `disabled` puro baja a `opacity: 0.55`. Antes compartían la
misma atenuación y no se distinguía «esperando al servidor» de «no puedes hacer esto».
El foco de teclado pinta el anillo naranja (rojo en `danger`) vía `:focus-visible`; el clic con
ratón no lo dispara.

---

## Estado: migración completa

Todo el panel usa `Alert` y `Toast`. Las clases `.formError` y `.stateError` **ya no existen** en
`screens.module.css`: si escribes una, no pinta nada. Lo mismo con las variantes por pantalla que
había (`.notice`, `.noticeOk`, `.noticeError`, `.banner*` del cierre de turno).

Al agregar una pantalla nueva, no inventes su propio aviso: usa la escalera de arriba.

### Decisiones que se tomaron al migrar, y conviene repetir

- **Los asistentes que terminan en pantalla de éxito no llevan toast** (crear gasto, cerrar turno,
  crear reserva): la pantalla ya es la confirmación, y el toast diría lo mismo encima.
- **Las acciones optimistas tampoco**, cuando la lista ya se mueve delante del usuario (reordenar
  categorías con arrastre). Un toast por cada arrastre es ruido.
- **Un valor que hay que copiar nunca va en un toast** (el token de IA se muestra una sola vez):
  eso se lee con calma, así que es contenido en pantalla con su `<Alert tone="warning">` al lado.
- **Desactivar, anular, cancelar y eliminar usan `tone: 'neutral'`**, no `success`: terminaron
  bien, pero no son un logro.
- Al migrar aparecieron varios `try/finally` **sin `catch`**: la acción fallaba y el modal se
  quedaba abierto sin decir nada. Donde se encontró, se agregó el estado de error y su `Alert`
  dentro del modal. Si escribes una mutación nueva, no la dejes sin `catch`.

# Piddet · Panel de administración (React)

Front-end del panel de administración de **Piddet** — plataforma para gestionar
pedidos, menús, productos, tiendas y mesas de restaurantes. Proyecto **nuevo e
independiente**, en React + Vite, que consume todo **por API**.

Línea visual: **B2 flat** (menú lateral oscuro, superficies blancas con borde fino,
naranja `#ff7c00` solo para la acción principal y el ítem activo). Sin Laravel,
sin dependencias del backend anterior.

---

## Requisitos
- Node.js 18 o superior

## Arrancar
```bash
npm install
npm run dev
```
Abre http://localhost:5173 — funciona de inmediato con **datos de ejemplo**.
En el login, pulsa **Entrar** (las credenciales vienen rellenadas).

### Sistema de diseño

La línea visual (tokens, componentes y patrones, en claro y oscuro) se versiona e itera en
[`piddet-visual-catalog`](https://github.com/gerardocv1/piddet-visual-catalog), un catálogo
navegable espejo de los componentes de este panel. Cualquier tema de diseño se basa en ese
repo; el flujo de porteo está en [`specs/styleguide.md`](specs/styleguide.md).

## Conectar el backend real
1. Copia el archivo de entorno:
   ```bash
   cp .env.example .env
   ```
2. Edita `.env` y define la URL de tu API:
   ```
   VITE_API_URL=https://api.piddet.com
   ```
3. Reinicia `npm run dev`. Si `VITE_API_URL` tiene valor, la app deja de usar
   mocks y hace `fetch` real.

El token de sesión se guarda en `localStorage` (`piddet_token`) y se envía como
`Authorization: Bearer <token>`.

## Compilar para producción
```bash
npm run build      # genera /dist
npm run preview    # sirve /dist localmente
```

## Despliegue (Laravel Forge)

El panel es un sitio **estático**: Forge no ejecuta nada en el servidor, solo compila y sirve
`/dist`. Cuatro ajustes en el sitio, una sola vez:

**1 · Web Directory** → `/dist`
Forge lo trae en `/public` (por Laravel). Está en *Site → App / Meta → Web Directory*.

**2 · Environment** (*Site → Environment*), que Vite lee **al compilar**:
```
VITE_API_URL=https://api.piddet.com
```
Si queda vacío, la app arranca en modo demo con datos de ejemplo. `.env` está en `.gitignore`,
así que el `git pull` del despliegue no lo pisa.

**3 · Deploy Script** (*Site → Deployments*), reemplazando el de Laravel:
```bash
cd /home/forge/TU-DOMINIO
git pull origin master

npm ci
npm run build
```
`npm ci` exige `package-lock.json` (está versionado) y Node 18+ en el servidor (Vite 5).
El build tarda unos segundos durante los cuales `/dist` está a medias; para evitarlo, compila
aparte y cambia de golpe:
```bash
npm run build -- --outDir dist_new --emptyOutDir
rm -rf dist_old && mv dist dist_old && mv dist_new dist
```

**4 · Nginx** (*Site → Edit Files → Nginx Configuration*). Es el paso que más se olvida: **toda**
ruta tiene que devolver el mismo `index.html`, porque el panel (`/admin/...`) y las páginas
públicas (`/checkin`, `/{empresa}`) las resuelve el router de React. Sin esto, recargar en
cualquier pantalla da 404:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}

# Los assets llevan hash en el nombre: se pueden cachear para siempre.
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# El shell y el service worker, nunca: son los que traen cada versión nueva.
location = /index.html { add_header Cache-Control "no-cache"; }
location = /sw.js      { add_header Cache-Control "no-cache"; }
```

Con **Quick Deploy** activado, cada merge a `master` dispara el script y publica solo.

> Mergear a `master` **no publica nada** por sí mismo: sin Quick Deploy hay que darle a *Deploy
> Now* en Forge, o compilar y subir `/dist` a mano.

## Subir a GitHub (primer push)
Desde la carpeta del proyecto:
```bash
git init
git add .
git commit -m "Piddet admin – panel React responsive"
git branch -M main
git remote add origin https://github.com/gerardocv1/piddet-administrator.git
git push -u origin main
```
Después, para cada cambio: `git add .` → `git commit -m "..."` → `git push`.
`node_modules/` y `dist/` quedan fuera del repo gracias a `.gitignore`.

---

## Estructura
```
src/
  main.jsx              Punto de entrada
  App.jsx               Router (react-router-dom) + sesión + tema (claro/oscuro)
  layout/Layout.jsx     Chrome de la app autenticada: Sidebar + Topbar + <Outlet>
  styles/tokens.css     Variables de diseño + tema oscuro ([data-theme="dark"]) + reset
  lib/api.js            Cliente de API (fetch real o mock según VITE_API_URL)
  lib/useIsMobile.js    Hook responsive
  lib/useResource.js    Hook de carga de datos con estados loading/error/reload
  data/mock.js          Datos de ejemplo para el modo demo
  components/           Componentes reutilizables, agrupados por categoría
    core/               Button, IconButton, Badge, Avatar, Card
    forms/              Input, Select, Checkbox, Switch
    data/               DataTable, FilterBar, StatStrip
    feedback/           Modal, Notifications
    navigation/         Sidebar, Topbar
    index.js            Barril: reexporta todo
  screens/              Login, Dashboard, Products, Categories, Toppings,
                        Tables, Stores, Users, Placeholder
```

Convención de nomenclatura: el **código interno está en inglés** (archivos,
componentes, métodos de `api`, variables y rutas `/products`, `/tables`, …).
El **texto visible al usuario permanece en español**. Las **rutas de la API**
(`/productos`, …) y las **claves del JSON** (`cat`, `avail`, `estado`, `rol`, …)
se mantienen como las expone el backend.

Cada componente y pantalla tiene su propio `*.module.css` (CSS Modules) que
consume las variables de `tokens.css`. No hay estilos inline ni librerías de CSS:
el hover/focus y el responsive viven en CSS nativo. Para cambiar un color o un
espaciado, edita la variable en `tokens.css` y se propaga a toda la app (incluido
el tema oscuro).

### Componentes (`src/components/`)
Organizados en subcarpetas por categoría (**core / forms / data / feedback /
navigation**). Importa siempre desde el barril — la categoría es transparente:
```jsx
import { Button, Card, DataTable, Badge, Switch, Modal } from './components';
```
Disponibles: `Button`, `IconButton`, `Badge`, `Avatar`, `Card`, `Input`,
`Select`, `Checkbox`, `Switch`, `Modal`, `DataTable`, `FilterBar`, `StatStrip`, `Sidebar`,
`Topbar`, `Notifications`. Todos con CSS Modules basados en las variables CSS
de `tokens.css` — sin librerías de estilos.

> **`DataTable`** — además de `columns`/`rows`, centraliza los estados de la lista:
> pásale `loading`, `error` y `empty` y muestra el indicador correcto. Combínalo con
> `useResource(api.x)` para no repetir el patrón de carga en cada pantalla.

> **`FilterBar`** — filtros responsive estilo e-commerce (MercadoLibre): dropdowns
> inline cuando son pocos; botón "Filtros" + modal/bottom-sheet que **acumula** las
> selecciones y las aplica todas de una vez cuando son muchos o en móvil. Incluye
> chips de aplicados removibles y "Limpiar todo". Ver demo en la pantalla **Productos**.

> **`Modal`** — dos tamaños: `size="sm"` para confirmaciones (compacto, siempre
> flotante centrado) y `size="md"`/`"lg"` para crear/editar. En móvil los `md`/`lg`
> suben como **bottom-sheet** desde abajo (igual que el modal de filtros), con barra
> de arrastre y botones a ancho completo; los `sm` quedan flotantes. Ver demos en
> **Productos / Categorías / Toppings / Usuarios** (crear = lg, eliminar = sm).

### Empresa activa (multi-tenant / SaaS)
Piddet es SaaS: una **empresa** (`COMPANY`) agrupa varias tiendas, productos, etc.
El menú lateral muestra la empresa en la que el usuario tiene la sesión, con un
**selector** para cambiar de empresa cuando el usuario pertenece a más de una.
`App.jsx` guarda la empresa activa y la recarga al cambiar; conéctalo a tu backend
vía `api.company()`, `api.companies()` y `api.cambiarEmpresa(id)`.

### Modo oscuro
Tema claro/oscuro con el botón ☾/☀ del topbar (y del login). La preferencia se
guarda en `localStorage` (`piddet_theme`) y se aplica como `data-theme="dark"` en
`<html>`. Los colores viven en `src/styles/tokens.css`: el bloque `[data-theme="dark"]`
reasigna la escala de neutros, superficies, bordes y tintes — los componentes usan
esas variables, así que heredan el tema sin cambios.

### Endpoints que espera la API (`src/lib/api.js`)
| Método | Ruta | Devuelve |
|---|---|---|
| POST | `/auth/login` | `{ token, user }` |
| GET | `/me` | `{ name, role }` |
| GET | `/company` | `{ id, name, plan, tiendas }` |
| GET | `/companies` | `[{ id, name, plan, tiendas }]` |
| POST | `/company/switch` | `{ id }` |
| GET | `/stats` | `[{ label, value, delta, up }]` |
| GET | `/pedidos` | `[{ id, cliente, tienda, total, estado }]` |
| GET | `/tiendas` | `[{ id, name, open, pedidos }]` |
| GET | `/productos` | `[{ id, name, cat, price, avail }]` |
| POST/PUT/DELETE | `/productos/:id` | producto |
| GET | `/categorias` | `[{ id, name, productos, orden, activa }]` |
| GET | `/toppings` | `[{ id, name, grupo, price, avail }]` |
| GET | `/tiendas-detalle` | `[{ id, name, open, dir, tel, pedidos }]` |
| GET | `/usuarios` | `[{ id, name, tel, rol, activo }]` |
| GET | `/mesas` | `[{ n, cap, st, t, tot }]` |
| GET | `/notificaciones` | `[{ type, title, sub, time, unread }]` (type: `pedido`\|`mesa`\|`alerta`\|`tienda`) |

Ajusta rutas, headers o forma de los datos en `src/lib/api.js` para que calce con
tu backend.

---

## Pendientes de marca
- **Fuente del logo `MaditaBold`**: hoy se usa *Baloo 2* como sustituto
  (`--font-logo` en `tokens.css`). Coloca el archivo real y actualiza la variable.
- **Logo real**: el wordmark es texto ("piddet"). Reemplázalo por el SVG/PNG.
- **Iconos**: FontAwesome 6 por CDN (ver `index.html`).

## Módulos incluidos
Login · Inicio (dashboard) · Productos · Categorías · Toppings · Mesas · Tiendas ·
Usuarios. La sección restante del menú (Roles) muestra un marcador y se construye
reutilizando los mismos componentes.

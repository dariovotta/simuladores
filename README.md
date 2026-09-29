# MisFinanzas: Simuladores Financieros

Sitio con 6 simuladores financieros para inversores argentinos. Para usarlo hace falta una
cuenta: sin sesión aparece un popup para ingresar o crear la cuenta. Con la cuenta se pueden
guardar simulaciones:

| Simulador | Ruta |
|---|---|
| Comparador de Comisiones de Brokers | `/comisiones/` |
| Simulador de Rotación de ONs | `/rotacion-ons/` |
| Duration y Sensibilidad de Bonos | `/duration/` |
| ¿Cuándo vender una LECAP? | `/lecap/` |
| Simulador de Carry Trade | `/carry-trade/` |
| Calculadora de Cuotas (¿contado o cuotas?) | `/cuotas/` |

Otra página: `/guardadas/` (simulaciones guardadas).

El frontend es HTML + CSS + JavaScript puro (módulos ES), sin paso de build. Los gráficos usan
[Chart.js](https://www.chartjs.org/) desde CDN.

El backend es un Cloudflare Worker (`src/`) con una base D1 (`simuladores-db`), igual que en
`dariovotta/portfolio`: cuentas con email y contraseña (PBKDF2), sesión en cookie `HttpOnly` y
una tabla de simulaciones guardadas por usuario (nombre único por usuario, sin distinguir
mayúsculas). El Worker solo atiende `/api/*`; el resto lo sirve directo desde `public/`.

| Endpoint | Qué hace |
|---|---|
| `POST /api/auth/register` `login` `logout` | Crear cuenta, ingresar, salir |
| `GET /api/auth/me` | Usuario actual (`{ email: null }` si no hay sesión) |
| `GET /api/simulations` | Lista de simulaciones guardadas (nombre, simulador, fecha) |
| `POST /api/simulations` | Guarda `{ simulator, name, params }` (409 si el nombre ya existe) |
| `GET` `DELETE /api/simulations/:id` | Abre (con los parámetros) o borra una simulación |

## Cómo correrlo

Todo lo que se publica está en `public/`. Los módulos ES no funcionan abriendo el archivo
con doble click (`file://`), así que hace falta un servidor local:

```bash
npm run db:migrate:local   # una sola vez: crea la base D1 local
npm run dev                # Worker + sitio en http://localhost:8787 (con login y guardado)

npm start                  # solo el sitio estático en http://localhost:5173 (sin API: no se puede ingresar)
```

## Deploy en Cloudflare

El sitio no tiene paso de build: se publica la carpeta `public/` tal cual.

**Cloudflare Workers** (la configuración ya está en `wrangler.jsonc`): proyecto `simuladores`,
Worker en `src/index.js`, assets en `./public/`, página 404 propia y la base D1 `simuladores-db`
(binding `DB`, ya creada en la cuenta de Cloudflare con el esquema aplicado).

- Desde el dashboard, conectando el repo de GitHub (Workers Builds):
  - Build command: *(vacío)*
  - Deploy command: `npx wrangler deploy`
- Desde la terminal: `npm run deploy`

Si se agrega una migración nueva en `migrations/`, aplicarla con `npm run db:migrate:remote`.

Cada push a la rama de producción vuelve a publicar el sitio.

## Tests

La lógica de cálculo está separada del DOM y tiene tests con el runner nativo de Node (≥ 18):

```bash
npm test
```

## Estructura

```
wrangler.jsonc              Configuración de Cloudflare (Worker, assets, D1, cron)
migrations/                 Esquema de la base D1 (users, sessions, simulations)
src/                        Worker: API de cuentas y simulaciones guardadas
  index.js                  Router de /api/* (el resto va a los assets)
  auth.js  http.js          Contraseñas, sesiones, respuestas JSON y chequeo de origen
  routes/                   auth.js y simulations.js
public/                     Todo lo que se publica
  index.html                Home con el listado de simuladores
  404.html                  Página de error
  <simulador>/index.html    Una carpeta por simulador (solo markup)
  guardadas/                Listado de simulaciones guardadas
  assets/
    css/
      tokens.css              Colores (claro y oscuro), tipografía, radios, sombras  ← punto de entrada de la estética
      base.css                Reset, pantalla, topbar web, header móvil, título de página
      components.css          Cards, formularios, tablas, métricas, avisos, sliders…
      transitions.css         Animaciones de entrada entre pantallas (iguales a portfolio)
      pages/*.css             Ajustes propios de cada página
    js/
      theme-init.js           Aplica el tema y la dirección de la animación antes de pintar (sin parpadeo)
      config/site.js          Marca y catálogo de simuladores (home + navegación)
      core/                   Utilidades: formato es-AR, inputs, DOM, layout, tema, íconos, gráficos, API y sesión
      data/brokers.js         Comisiones de brokers, derechos de mercado e IVA
      calc/                   Lógica financiera pura (sin DOM), una por simulador
      ui/                     Componentes de UI compartidos (popup de ingreso y botón Guardar simulación)
      pages/                  Controlador de cada página: lee inputs → calc → render
    img/
      brand/                  Logo (también se usa como favicon)
      icons/                  Íconos de las tarjetas de la home
      brokers/                Logos de brokers
tests/                      Tests unitarios de calc/ y core/format.js
```

### Cómo tocar cada cosa

- **Cambiar la estética:** empezar por `public/assets/css/tokens.css` (variables del design system
  MisInversiones con primario verde). Los componentes solo usan esas variables. El tema oscuro
  redefine los mismos tokens en `:root[data-theme="dark"]`; el botón del header lo alterna y lo
  guarda en `localStorage`. Los gráficos leen los colores de los tokens y se redibujan al cambiar
  de tema. El layout (topbar web, header móvil y transiciones) replica al de `dariovotta/portfolio`.
- **Actualizar comisiones:** editar `public/assets/js/data/brokers.js` (y `DATA_UPDATED`). La misma
  data alimenta el Comparador y la Rotación de ONs.
- **Cambiar nombre o logo:** `public/assets/js/config/site.js` (`BRAND`) y `public/assets/img/brand/logo.svg`.
- **Agregar/quitar un simulador de la home o el menú:** `public/assets/js/config/site.js`.
- **Guardar simulaciones en un simulador nuevo:** en su controlador, llamar a `mountSaveSimulation`
  (`ui/save-sim.js`) con cómo leer y aplicar los parámetros, y sumar su id a `SIMULATORS` en
  `src/routes/simulations.js`.
- **Cambiar fórmulas:** `public/assets/js/calc/*.js` y correr `npm test`.

## Aviso

Herramientas de carácter informativo y educativo. No constituyen asesoramiento financiero.

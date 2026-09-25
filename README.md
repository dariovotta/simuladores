# Simuladores Financieros

Sitio estático con 5 simuladores financieros para inversores argentinos:

| Simulador | Ruta |
|---|---|
| Comparador de Comisiones de Brokers | `comisiones/` |
| Simulador de Rotación de ONs | `rotacion-ons/` |
| Duration y Sensibilidad de Bonos | `duration/` |
| ¿Cuándo vender una LECAP? | `lecap/` |
| Simulador de Carry Trade | `carry-trade/` |

Es HTML + CSS + JavaScript puro (módulos ES), sin paso de build. Los gráficos usan
[Chart.js](https://www.chartjs.org/) desde CDN.

## Cómo correrlo

Los módulos ES no funcionan abriendo el archivo con doble click (`file://`), así que hace
falta un servidor local:

```bash
npm start                    # sirve en http://localhost:5173
# o, sin Node:
python3 -m http.server 5173
```

Para publicarlo alcanza con cualquier hosting estático (GitHub Pages, Netlify, Vercel…),
apuntando a la raíz del repo.

## Tests

La lógica de cálculo está separada del DOM y tiene tests con el runner nativo de Node (≥ 18):

```bash
npm test
```

## Estructura

```
index.html                  Home con el listado de simuladores
<simulador>/index.html      Una carpeta por simulador (solo markup)
assets/
  css/
    tokens.css              Colores, tipografías, radios, sombras  ← punto de entrada para la nueva estética
    base.css                Reset, layout, header, navegación, hero, footer
    components.css          Cards, formularios, tablas, métricas, avisos, sliders, planes de brokers…
    pages/*.css             Ajustes propios de cada página
  js/
    config/site.js          Marca y catálogo de simuladores (home + navegación)
    core/                   Utilidades: formato es-AR, inputs, DOM, layout, gráficos
    data/brokers.js         Comisiones de brokers, derechos de mercado, IVA y planes
    calc/                   Lógica financiera pura (sin DOM), una por simulador
    ui/                     Componentes de UI compartidos
    pages/                  Controlador de cada página: lee inputs → calc → render
  img/
    brand/                  Logo y favicons
    brokers/                Logos de brokers
tests/                      Tests unitarios de calc/ y core/format.js
```

### Cómo tocar cada cosa

- **Cambiar la estética:** empezar por `assets/css/tokens.css` (variables). Los componentes
  solo usan esas variables. Cada simulador puede tener un acento propio con
  `<body data-accent="blue|green">`. Los gráficos leen los colores de los tokens.
- **Actualizar comisiones:** editar `assets/js/data/brokers.js` (y `DATA_UPDATED`). La misma
  data alimenta el Comparador y la Rotación de ONs.
- **Agregar/quitar un simulador de la home o el menú:** `assets/js/config/site.js`.
- **Cambiar fórmulas:** `assets/js/calc/*.js` y correr `npm test`.

## Aviso

Herramientas de carácter informativo y educativo. No constituyen asesoramiento financiero.

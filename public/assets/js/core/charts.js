// =========================================================
// Integración con Chart.js (cargado vía CDN como script global).
// Centraliza el estilo visual de los gráficos. Los colores se leen
// de los tokens CSS, así que siguen al tema claro / oscuro.
// =========================================================

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Paleta leída desde los tokens CSS del tema actual. */
export function chartTheme() {
    return {
        text: css('--text') || '#0F1B2D',
        muted: css('--muted') || '#667085',
        card: css('--card') || '#FFFFFF',
        grid: css('--border') || '#E3E7ED',
        primary: css('--primary') || '#0B7A55',
        pos: css('--pos') || '#12925A',
        warn: css('--warn') || '#B54708',
        neg: css('--neg') || '#D92D43',
        barNeutral: css('--barNeutral') || '#C9D0DA',
        font: "'DM Sans', system-ui, sans-serif",
    };
}

/** Devuelve el constructor global de Chart.js o null si no cargó (sin conexión). */
export function getChart() {
    return window.Chart ?? null;
}

/** Plugin de etiquetas de datos, si está disponible. */
export function getDataLabels() {
    return window.ChartDataLabels ?? null;
}

/** Tooltip con el estilo del sitio. */
export function tooltipStyle(theme = chartTheme()) {
    return {
        backgroundColor: theme.text,
        titleColor: theme.card,
        bodyColor: theme.card,
        titleFont: { family: theme.font, size: 12, weight: 600 },
        bodyFont: { family: theme.font, size: 13, weight: 700 },
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
    };
}

/** Estilo de ejes: ticks 11/600 `--muted`, grilla `--border`, sin borde de eje. */
export function axisStyle(theme = chartTheme(), extra = {}) {
    return {
        grid: { color: theme.grid },
        border: { display: false },
        ...extra,
        ticks: {
            color: theme.muted,
            font: { family: theme.font, size: 11, weight: 600 },
            ...(extra.ticks ?? {}),
        },
    };
}

/** Serie principal de un gráfico de líneas. */
export function mainLine(theme = chartTheme(), extra = {}) {
    return {
        borderColor: theme.primary,
        backgroundColor: theme.primary,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.3,
        ...extra,
    };
}

/** Serie de referencia (punteada, en `--muted`). */
export function referenceLine(theme = chartTheme(), extra = {}) {
    return {
        borderColor: theme.muted,
        backgroundColor: theme.muted,
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: false,
        tension: 0,
        ...extra,
    };
}

/** Estilo del punto destacado: radio 6, relleno `--text`, borde `--card`. */
export function highlightPoint(theme = chartTheme()) {
    return { radius: 6, fill: theme.text, stroke: theme.card, strokeWidth: 2 };
}

/**
 * Administra una instancia de gráfico sobre un canvas. Si ya existe un
 * gráfico del mismo tipo, lo actualiza en el lugar (más fluido con
 * sliders); si no, lo crea.
 */
export function createChartSlot(canvas) {
    let instance = null;
    let failed = false;
    return {
        render(config) {
            const Chart = getChart();
            if (!Chart) {
                if (!failed) {
                    failed = true;
                    canvas.replaceWith(Object.assign(document.createElement('p'), {
                        className: 'empty-state',
                        textContent: 'No se pudo cargar el gráfico (revisá tu conexión).',
                    }));
                }
                return null;
            }
            config.options = { animation: false, ...config.options };
            if (instance && instance.config.type === config.type) {
                instance.data = config.data;
                instance.options = config.options;
                instance.update('none');
                return instance;
            }
            instance?.destroy();
            instance = new Chart(canvas.getContext('2d'), config);
            return instance;
        },
        destroy() {
            instance?.destroy();
            instance = null;
        },
    };
}

/** Configuración común para gráficos de barras horizontales de ranking. */
export function horizontalBarConfig({ labels, data, colors, formatLabel, formatTick, formatTooltip }) {
    const theme = chartTheme();
    const DataLabels = getDataLabels();
    return {
        type: 'bar',
        plugins: DataLabels ? [DataLabels] : [],
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.72,
                categoryPercentage: 0.86,
            }],
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { right: 76 } },
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'right',
                    offset: 6,
                    font: { family: theme.font, size: 12, weight: 700 },
                    color: theme.text,
                    formatter: formatLabel,
                },
                tooltip: {
                    ...tooltipStyle(theme),
                    callbacks: { label: formatTooltip },
                },
            },
            scales: {
                x: axisStyle(theme, { beginAtZero: true, ticks: { callback: formatTick } }),
                y: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: theme.text, font: { family: theme.font, size: 13, weight: 600 } },
                },
            },
        },
    };
}

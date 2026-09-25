// =========================================================
// Integración con Chart.js (cargado vía CDN como script global).
// Centraliza el tema visual de los gráficos.
// =========================================================

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Paleta leída desde los tokens CSS, para que los gráficos sigan la estética. */
export function chartTheme() {
    return {
        text: css('--text-primary') || '#1A1D23',
        textSecondary: css('--text-secondary') || '#5A6270',
        muted: css('--text-muted') || '#8C939E',
        grid: css('--bg-tertiary') || '#F1F3F5',
        good: css('--success') || '#22C55E',
        mid: css('--warning') || '#F59E0B',
        bad: css('--danger') || '#EF4444',
        neutral: '#94A3B8',
        info: css('--info') || '#3B82F6',
        accent: css('--accent') || '#E63B2E',
        fontSans: css('--font-sans') || 'DM Sans, sans-serif',
        fontMono: css('--font-mono') || 'Space Mono, monospace',
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
        titleFont: { family: theme.fontSans, size: 13 },
        bodyFont: { family: theme.fontMono, size: 13 },
        padding: 12,
        cornerRadius: 8,
    };
}

/**
 * Administra una instancia de gráfico sobre un canvas. Si ya existe un
 * gráfico del mismo tipo, lo actualiza en el lugar (más fluido con
 * sliders); si no, lo crea.
 * @param {HTMLCanvasElement} canvas
 * @param {{animate?: boolean}} [opts] animate=false evita la animación al actualizar
 */
export function createChartSlot(canvas, { animate = true } = {}) {
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
            if (instance && instance.config.type === config.type) {
                instance.data = config.data;
                instance.options = config.options;
                instance.update(animate ? undefined : 'none');
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
                borderRadius: 6,
                borderSkipped: false,
                barPercentage: 0.65,
            }],
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { right: 90 } },
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'right',
                    offset: 6,
                    font: { family: theme.fontMono, size: 12, weight: 700 },
                    color: theme.text,
                    formatter: formatLabel,
                },
                tooltip: {
                    ...tooltipStyle(theme),
                    callbacks: { label: formatTooltip },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: theme.grid },
                    border: { display: false },
                    ticks: {
                        font: { family: theme.fontMono, size: 11 },
                        color: theme.muted,
                        callback: formatTick,
                    },
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { family: theme.fontSans, size: 13, weight: 500 },
                        color: theme.textSecondary,
                    },
                },
            },
        },
    };
}

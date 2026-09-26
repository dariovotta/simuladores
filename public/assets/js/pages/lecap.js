// =========================================================
// PÁGINA: ¿Cuándo vender una LECAP?
// =========================================================
import { mountLayout } from '../core/layout.js';
import { $ } from '../core/dom.js';
import { formatARS, formatNumber, formatSignedARS, formatSignedPct } from '../core/format.js';
import { axisStyle, chartTheme, createChartSlot, highlightPoint, mainLine, referenceLine, tooltipStyle } from '../core/charts.js';
import { icon } from '../core/icons.js';
import { bindRangeFill } from '../core/inputs.js';
import { onThemeChange } from '../core/theme.js';
import { simulateLecap } from '../calc/lecap.js';

const els = {};
let chart;
let current = { capital: 0, peak: null }; // leído por los callbacks del gráfico
let rangeFills = [];

// Diferencias menores a este monto se consideran "iguales" (ruido de redondeo).
const TOLERANCE = 500;

const VERDICTS = {
    sell: { tone: 'good', icon: 'check', text: '<strong>Conviene vender antes del vencimiento</strong>: la tasa bajó y el precio de mercado superó al valor técnico.' },
    wait: { tone: 'bad', icon: 'x', text: '<strong>Cuidado si vendés antes</strong>: la tasa subió y el precio de mercado está por debajo del valor técnico.' },
    hold: { tone: 'mid', icon: 'minus', text: '<strong>Las tasas son similares</strong>: vender antes o esperar al vencimiento da resultados parecidos.' },
};

function init() {
    mountLayout();
    for (const id of ['buyRate', 'marketRate', 'totalDays', 'changeDay', 'capital',
        'buyRateOut', 'marketRateOut', 'totalDaysOut', 'changeDayOut', 'capitalOut',
        'maturityValue', 'peakValue', 'peakSub', 'extraLabel', 'extraValue', 'extraSub', 'verdict', 'verdictIcon', 'verdictText', 'lecapTable']) {
        els[id] = $(`#${id}`);
    }
    chart = createChartSlot($('#lecapChart'));
    rangeFills = ['buyRate', 'marketRate', 'totalDays', 'changeDay', 'capital'].map((id) => bindRangeFill(els[id]));
    $('#lecapForm').addEventListener('input', update);
    update();
    onThemeChange(update);
}

function readInputs() {
    const totalDays = parseInt(els.totalDays.value, 10);
    // El cambio de tasa tiene que ocurrir antes del vencimiento.
    els.changeDay.max = String(Math.max(1, totalDays - 1));
    let changeDay = parseInt(els.changeDay.value, 10);
    if (changeDay >= totalDays) {
        changeDay = Math.max(1, totalDays - 7);
        els.changeDay.value = String(changeDay);
    }
    return {
        buyRate: parseFloat(els.buyRate.value),
        marketRate: parseFloat(els.marketRate.value),
        totalDays,
        changeDay,
        capital: parseFloat(els.capital.value),
    };
}

function toneFor(diff) {
    if (diff > TOLERANCE) return 'good';
    if (diff < -TOLERANCE) return 'bad';
    return 'muted';
}

function update() {
    const input = readInputs();
    rangeFills.forEach((paint) => paint());
    const sim = simulateLecap(input);

    els.buyRateOut.textContent = `${formatNumber(input.buyRate, 1)}% mensual`;
    els.marketRateOut.textContent = `${formatNumber(input.marketRate, 1)}% mensual`;
    els.totalDaysOut.textContent = `${input.totalDays} días`;
    els.changeDayOut.textContent = `día ${input.changeDay}`;
    els.capitalOut.textContent = formatARS(input.capital);

    els.maturityValue.textContent = formatARS(sim.maturityValue);

    if (sim.peak) {
        els.peakValue.textContent = formatARS(sim.peak.marketValue);
        els.peakValue.className = 'metric__value tone-good';
        els.peakSub.textContent = `Vendiendo el ${sim.peak.label.toLowerCase()}`;
        els.extraLabel.textContent = 'Extra vs. valor técnico';
        els.extraValue.textContent = formatSignedARS(sim.bestExtra);
        els.extraValue.className = `metric__value tone-${toneFor(sim.bestExtra)}`;
        els.extraSub.textContent = 'Ganancia adicional por la baja de tasa';
    } else {
        els.peakValue.textContent = 'Mantener';
        els.peakValue.className = 'metric__value tone-muted';
        els.peakSub.textContent = 'Vender antes no suma rendimiento';
        const losing = sim.worstGap < -TOLERANCE;
        els.extraLabel.textContent = losing ? 'Pérdida si vendés antes' : 'Extra vs. valor técnico';
        els.extraValue.textContent = formatSignedARS(losing ? sim.worstGap : 0);
        els.extraValue.className = `metric__value tone-${losing ? 'bad' : 'muted'}`;
        els.extraSub.textContent = losing ? 'Peor caso, vendiendo tras la suba de tasa' : 'Sin diferencia relevante';
    }

    const verdict = VERDICTS[sim.verdict];
    els.verdict.className = `verdict verdict--${verdict.tone}`;
    els.verdictIcon.innerHTML = icon(verdict.icon, 14);
    els.verdictText.innerHTML = verdict.text;

    renderTable(sim);
    current = { capital: input.capital, peak: sim.peakIndex };
    renderChart(sim);
}

function renderTable(sim) {
    els.lecapTable.innerHTML = sim.rows.map((r, i) => {
        const periodTone = i === 0 ? 'muted' : r.beatsBuyRate ? 'good' : 'bad';
        let tag = '<span class="pill pill--neutral">—</span>';
        if (r.isPeak) tag = '<span class="pill pill--good">mejor momento</span>';
        else if (r.vsHold < -TOLERANCE) tag = '<span class="pill pill--bad">perdés vs vencer</span>';

        return `<tr class="${r.isPeak ? 'is-highlight' : ''}">
            <td>${r.label}</td>
            <td class="tone-${periodTone}"><strong>${i === 0 ? '—' : formatSignedPct(r.periodReturn)}</strong></td>
            <td>${formatARS(r.marketValue)}</td>
            <td>${formatARS(r.technicalValue)}</td>
            <td>${formatARS(r.profit)} <span class="text-small">(${formatSignedPct(r.profitPct)})</span></td>
            <td class="t-left"><span class="tone-${toneFor(r.vsHold)}">${formatSignedARS(r.vsHold)}</span> ${tag}</td>
        </tr>`;
    }).join('');
}

// Marca el momento óptimo de venta con un punto destacado.
const peakMarker = {
    id: 'peakMarker',
    afterDatasetsDraw(c) {
        if (current.peak === null) return;
        const point = c.getDatasetMeta(0).data[current.peak];
        if (!point) return;
        const dot = highlightPoint();
        const { ctx } = c;
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = dot.fill;
        ctx.fill();
        ctx.lineWidth = dot.strokeWidth;
        ctx.strokeStyle = dot.stroke;
        ctx.stroke();
        ctx.restore();
    },
};

function renderChart(sim) {
    const theme = chartTheme();
    const values = sim.rows.flatMap((r) => [r.market, r.technical]);
    const min = Math.min(...values) * 0.997;
    const max = Math.max(...values) * 1.006;

    chart.render({
        type: 'line',
        plugins: [peakMarker],
        data: {
            labels: sim.rows.map((r) => (r.label === 'Vencimiento' ? 'Venc.' : r.label)),
            datasets: [
                mainLine(theme, { label: 'Precio de mercado', data: sim.rows.map((r) => r.market) }),
                referenceLine(theme, { label: 'Valor técnico', data: sim.rows.map((r) => r.technical) }),
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...tooltipStyle(theme),
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${formatSignedPct((ctx.parsed.y - 1) * 100)} (${formatARS(ctx.parsed.y * current.capital)})`,
                    },
                },
            },
            scales: {
                x: axisStyle(theme, { ticks: { autoSkip: false, maxRotation: 45 } }),
                y: axisStyle(theme, {
                    min,
                    max,
                    ticks: { callback: (v) => formatSignedPct((v - 1) * 100, 1) },
                }),
            },
        },
    });
}

init();

// =========================================================
// PÁGINA: Simulador de Rotación de ONs
// =========================================================
import { mountLayout, siteUrl } from '../core/layout.js';
import { $, $$, emptyState, escapeHTML, rankBadge, toggle } from '../core/dom.js';
import { formatARS, formatNumber, formatPct, formatSignedPct } from '../core/format.js';
import { bindAmountInput, readNumber } from '../core/inputs.js';
import { chartTheme, createChartSlot, horizontalBarConfig } from '../core/charts.js';
import { DATA_UPDATED } from '../data/brokers.js';
import { computeRotation, recoveryTone } from '../calc/rotacion.js';
import { renderBrokerPlans } from '../ui/broker-plans.js';

const els = {};
let chart;

const RECOVERY_ICON = { good: '✅', mid: '⚠️', bad: '⛔' };

function init() {
    mountLayout();
    Object.assign(els, {
        amount: $('#amount'),
        currentYield: $('#currentYield'),
        newYield: $('#newYield'),
        spreadStrip: $('#spreadStrip'),
        spreadCurrent: $('#spreadCurrent'),
        spreadNew: $('#spreadNew'),
        spreadDelta: $('#spreadDelta'),
        results: $('#results'),
        chartCard: $('#chartCard'),
    });

    $$('[data-bind="updated"]').forEach((el) => { el.textContent = DATA_UPDATED; });
    chart = createChartSlot($('#recoveryChart'));
    renderBrokerPlans($('#brokerPlans'), 'rotacion');

    bindAmountInput(els.amount, { onChange: update });
    bindAmountInput(els.currentYield, { allowDecimals: true, onChange: update });
    bindAmountInput(els.newYield, { allowDecimals: true, onChange: update });
    update();
}

function monthsLabel(months) {
    const tone = recoveryTone(months);
    const text = Number.isFinite(months) ? `${formatNumber(months, 1)} meses` : 'No recupera';
    return `<span class="pill pill--${tone}">${text} ${RECOVERY_ICON[tone]}</span>`;
}

function update() {
    const amount = readNumber(els.amount);
    const currentYield = readNumber(els.currentYield);
    const newYield = readNumber(els.newYield);

    if (!(amount > 0) || !Number.isFinite(currentYield) || !Number.isFinite(newYield)) {
        els.results.innerHTML = emptyState('🔄', 'Completá los datos para ver cuánto te cuesta la rotación en cada broker');
        toggle(els.spreadStrip, false);
        toggle(els.chartCard, false);
        chart.destroy();
        return;
    }

    const calc = computeRotation({ amount, currentYield, newYield });
    const { spread } = calc;

    toggle(els.spreadStrip, true);
    els.spreadCurrent.textContent = formatPct(currentYield);
    els.spreadNew.textContent = formatPct(newYield);
    els.spreadDelta.textContent = formatSignedPct(spread);
    els.spreadDelta.className = `compare-strip__value ${spread > 0 ? 'tone-good' : spread < 0 ? 'tone-bad' : ''}`;

    const rows = calc.results.map((r, i) => `<tr>
        <td class="rank">${rankBadge(i)}</td>
        <td><div class="broker-cell"><img class="broker-cell__logo" src="${siteUrl(r.logo)}" alt="" loading="lazy"><span class="broker-cell__name">${escapeHTML(r.name)}</span></div></td>
        <td>${formatNumber(r.rate, 2)}% (x2)</td>
        <td>${formatARS(r.commission)}</td>
        <td>${formatARS(r.marketFee)}</td>
        <td><span class="amount tone-${recoveryTone(r.months)}">${formatARS(r.totalCost)}</span></td>
        <td>${monthsLabel(r.months)}</td>
    </tr>`).join('');

    let html = `<div class="table-wrap"><table class="table">
        <thead><tr>
            <th>#</th><th>Broker</th><th>Comisión (%)</th><th>Costo Compra/Venta</th>
            <th>Der. Mercado</th><th>Costo Total</th><th>Recupero</th>
        </tr></thead>
        <tbody>${rows}</tbody>
    </table></div>`;

    if (spread > 0) {
        html += `<div class="notice"><strong>💡 Resumen:</strong> Con un diferencial de ${formatPct(spread)}, ganás <strong>${formatARS(calc.annualGain)}/año</strong> extra.
            En <strong>${escapeHTML(calc.best.name)}</strong> recuperás el costo en <strong>${formatNumber(calc.best.months, 1)} meses</strong>,
            mientras que en ${escapeHTML(calc.worst.name)} tardás <strong>${formatNumber(calc.worst.months, 1)} meses</strong>.</div>`;
    } else if (spread === 0) {
        html += `<div class="notice notice--warn"><strong>⚠️ Atención:</strong> Las TIRs son iguales. La rotación solo genera costos sin ganancia adicional.</div>`;
    } else {
        html += `<div class="notice notice--bad"><strong>⛔ Cuidado:</strong> La TIR nueva es menor que la actual. La rotación te haría perder ${formatPct(Math.abs(spread))} anual de rendimiento, además de las comisiones.</div>`;
    }
    els.results.innerHTML = html;

    toggle(els.chartCard, spread > 0);
    if (spread > 0) renderChart(calc.results);
    else chart.destroy();
}

function renderChart(results) {
    const theme = chartTheme();
    const toneColor = { good: theme.good, mid: theme.mid, bad: theme.bad };
    chart.render(horizontalBarConfig({
        labels: results.map((r) => r.name),
        data: results.map((r) => Number(r.months.toFixed(1))),
        colors: results.map((r) => toneColor[recoveryTone(r.months)]),
        formatLabel: (v) => `${formatNumber(v, 1)} meses`,
        formatTooltip: (ctx) => `${formatNumber(ctx.raw, 1)} meses`,
        formatTick: (v) => `${v} m`,
    }));
}

init();

// =========================================================
// PÁGINA: Duration y Sensibilidad de Bonos
// =========================================================
import { mountLayout } from '../core/layout.js';
import { $ } from '../core/dom.js';
import { formatNumber, formatSignedPct } from '../core/format.js';
import { axisStyle, chartTheme, createChartSlot, highlightPoint, mainLine, tooltipStyle } from '../core/charts.js';
import { rangePercent, setRangeFill } from '../core/inputs.js';
import { onThemeChange } from '../core/theme.js';
import { analyzeBond, priceShock, priceYieldCurve } from '../calc/bonos.js';

const els = {};
let chart;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function readParams() {
    const num = (el, fallback) => {
        const v = parseFloat(el.value);
        return Number.isFinite(v) ? v : fallback;
    };
    return {
        nominal: Math.max(1, num(els.nominal, 100)),
        coupon: clamp(num(els.coupon, 0), 0, 100),
        years: clamp(Math.round(num(els.years, 5)), 1, 50),
        yieldPct: clamp(num(els.yield, 7), 0.01, 100),
        frequency: parseInt(els.frequency.value, 10) || 2,
        amortization: els.amortization.value,
    };
}

function init() {
    mountLayout();
    for (const id of ['nominal', 'coupon', 'years', 'yield', 'frequency', 'amortization', 'shock',
        'metDuration', 'metModDuration', 'metPrice', 'shockValue', 'shockPrice', 'shockPriceSub',
        'shockPnl', 'shockPnlSub', 'cashflows']) {
        els[id] = $(`#${id}`);
    }
    chart = createChartSlot($('#priceChart'));

    $('#bondForm').addEventListener('input', update);
    $('#bondForm').addEventListener('change', update);
    els.shock.addEventListener('input', () => renderShock(readParams()));
    update();
    onThemeChange(update);
}

function update() {
    const params = readParams();
    const bond = analyzeBond(params);

    els.metDuration.textContent = formatNumber(bond.duration, 2);
    els.metModDuration.textContent = formatNumber(bond.modifiedDuration, 2);
    els.metPrice.textContent = formatNumber(bond.price, 2);

    renderShock(params);
    renderChart(params);
    renderCashflows(bond);
}

function renderShock(params) {
    const delta = parseInt(els.shock.value, 10) / 100;
    const shock = priceShock(params, delta);
    const tone = delta === 0 ? 'neutral' : shock.pnl >= 0 ? 'good' : 'bad';

    els.shockValue.textContent = formatSignedPct(delta);
    // El relleno sale del centro: verde si la tasa baja, rojo si sube.
    const pct = rangePercent(els.shock);
    setRangeFill(els.shock, Math.min(50, pct), Math.max(50, pct), delta < 0 ? 'var(--pos)' : 'var(--neg)');

    els.shockPrice.textContent = `USD ${formatNumber(shock.newPrice, 2)}`;
    els.shockPriceSub.textContent = `Tasa: ${formatNumber(shock.newYield, 2)}%`;
    const sign = shock.pnl > 0.004 ? '+' : shock.pnl < -0.004 ? '-' : '';
    els.shockPnl.textContent = `${sign}USD ${formatNumber(Math.abs(shock.pnl), 2)}`;
    els.shockPnlSub.textContent = `${formatSignedPct(shock.pnlPct)} del precio`;

    for (const value of [els.shockPrice, els.shockPnl]) {
        value.className = `metric__value${tone === 'neutral' ? '' : ` tone-${tone}`}`;
    }
}

function renderChart(params) {
    const theme = chartTheme();
    const { points, currentIndex } = priceYieldCurve(params);
    const dot = highlightPoint(theme);

    chart.render({
        type: 'line',
        data: {
            labels: points.map((p) => `${formatNumber(p.rate, 2)}%`),
            datasets: [mainLine(theme, {
                data: points.map((p) => p.price),
                pointRadius: points.map((_, i) => (i === currentIndex ? dot.radius : 0)),
                pointBackgroundColor: dot.fill,
                pointBorderColor: dot.stroke,
                pointBorderWidth: dot.strokeWidth,
            })],
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
                        title: (items) => `Tasa: ${items[0].label}`,
                        label: (item) => `Precio: USD ${formatNumber(item.raw, 2)}`,
                    },
                },
            },
            scales: {
                x: axisStyle(theme, {
                    ticks: { maxTicksLimit: 12 },
                    title: { display: true, text: 'Tasa (%)', color: theme.muted, font: { family: theme.font, size: 12, weight: 700 } },
                }),
                y: axisStyle(theme, {
                    ticks: { callback: (v) => `USD ${formatNumber(v, 1)}` },
                    title: { display: true, text: 'Precio', color: theme.muted, font: { family: theme.font, size: 12, weight: 700 } },
                }),
            },
        },
    });
}

function renderCashflows(bond) {
    let totalWeight = 0;
    let totalWeightedTime = 0;
    const rows = bond.flows.map((f) => {
        const wt = f.weight * f.time;
        totalWeight += f.weight;
        totalWeightedTime += wt;
        return `<tr>
            <td>${f.period}</td>
            <td>${formatNumber(f.time, 2)}</td>
            <td>${formatNumber(f.interest, 2)}</td>
            <td>${f.principal > 0 ? formatNumber(f.principal, 2) : '—'}</td>
            <td>${formatNumber(f.cashflow, 2)}</td>
            <td>${formatNumber(f.pv, 2)}</td>
            <td>${formatNumber(f.weight * 100, 2)}%</td>
            <td>${formatNumber(wt, 4)}</td>
        </tr>`;
    }).join('');

    els.cashflows.innerHTML = `
        <div class="table-wrap table-wrap--scroll">
            <table class="table table--numeric table--compact">
                <thead><tr>
                    <th>Período</th><th>Tiempo (años)</th><th>Cupón</th><th>Capital</th>
                    <th>Flujo total</th><th>Valor actual</th><th>Peso (%)</th><th>Peso × Tiempo</th>
                </tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr>
                    <td>Total</td><td></td><td></td><td></td><td></td>
                    <td>${formatNumber(bond.price, 2)}</td>
                    <td>${formatNumber(totalWeight * 100, 2)}%</td>
                    <td class="tone-info">${formatNumber(totalWeightedTime, 4)}</td>
                </tr></tfoot>
            </table>
        </div>
        <div class="notice"><strong>Duration</strong> = Σ (Peso × Tiempo) = <strong>${formatNumber(totalWeightedTime, 4)} años</strong></div>`;
}

init();

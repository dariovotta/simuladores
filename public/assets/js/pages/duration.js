// =========================================================
// PÁGINA: Duration y Sensibilidad de Bonos
// =========================================================
import { mountLayout } from '../core/layout.js';
import { $ } from '../core/dom.js';
import { formatNumber, formatSignedPct } from '../core/format.js';
import { chartTheme, createChartSlot, tooltipStyle } from '../core/charts.js';
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
        'shockPnl', 'shockPnlSub', 'shockPriceCard', 'shockPnlCard', 'cashflows']) {
        els[id] = $(`#${id}`);
    }
    chart = createChartSlot($('#priceChart'), { animate: false });

    $('#bondForm').addEventListener('input', update);
    $('#bondForm').addEventListener('change', update);
    els.shock.addEventListener('input', () => renderShock(readParams()));
    update();
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
    // Suba de tasa → rojo, baja → verde.
    els.shockValue.className = `pill pill--${delta > 0 ? 'bad' : delta < 0 ? 'good' : 'neutral'}`;

    els.shockPrice.textContent = `USD ${formatNumber(shock.newPrice, 2)}`;
    els.shockPriceSub.textContent = `Tasa: ${formatNumber(shock.newYield, 2)}%`;
    const sign = shock.pnl > 0.004 ? '+' : shock.pnl < -0.004 ? '-' : '';
    els.shockPnl.textContent = `${sign}USD ${formatNumber(Math.abs(shock.pnl), 2)}`;
    els.shockPnlSub.textContent = `${formatSignedPct(shock.pnlPct)} del precio`;

    for (const card of [els.shockPriceCard, els.shockPnlCard]) {
        card.className = `metric ${tone === 'neutral' ? 'metric--flat' : `metric--${tone}`}`;
    }
    for (const value of [els.shockPrice, els.shockPnl]) {
        value.className = `metric__value metric__value--sm${tone === 'neutral' ? '' : ` tone-${tone}`}`;
    }
}

function renderChart(params) {
    const theme = chartTheme();
    const { points, currentIndex } = priceYieldCurve(params);
    const bodyStyle = getComputedStyle(document.body);
    const accent = bodyStyle.getPropertyValue('--sim-accent').trim() || theme.info;
    const accentFill = bodyStyle.getPropertyValue('--sim-accent-ring').trim() || 'rgba(59, 130, 246, 0.1)';

    chart.render({
        type: 'line',
        data: {
            labels: points.map((p) => `${formatNumber(p.rate, 2)}%`),
            datasets: [{
                data: points.map((p) => p.price),
                borderColor: accent,
                backgroundColor: accentFill,
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: points.map((_, i) => (i === currentIndex ? 8 : 0)),
                pointHoverRadius: 6,
                pointBackgroundColor: accent,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }],
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
                x: {
                    grid: { color: theme.grid },
                    ticks: { font: { family: theme.fontMono, size: 10 }, color: theme.muted, maxTicksLimit: 12 },
                    title: { display: true, text: 'Tasa (%)', font: { family: theme.fontSans, size: 13, weight: 600 }, color: theme.textSecondary },
                },
                y: {
                    grid: { color: theme.grid },
                    ticks: { font: { family: theme.fontMono, size: 11 }, color: theme.muted, callback: (v) => `USD ${formatNumber(v, 1)}` },
                    title: { display: true, text: 'Precio', font: { family: theme.fontSans, size: 13, weight: 600 }, color: theme.textSecondary },
                },
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
                    <td class="mono">${formatNumber(bond.price, 2)}</td>
                    <td class="mono">${formatNumber(totalWeight * 100, 2)}%</td>
                    <td class="mono tone-info">${formatNumber(totalWeightedTime, 4)}</td>
                </tr></tfoot>
            </table>
        </div>
        <div class="notice notice--info"><strong>Duration</strong> = Σ (Peso × Tiempo) = <strong>${formatNumber(totalWeightedTime, 4)} años</strong></div>`;
}

init();

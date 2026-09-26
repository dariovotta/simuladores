// =========================================================
// PÁGINA: Comparador de Comisiones de Brokers
// =========================================================
import { mountLayout, siteUrl } from '../core/layout.js';
import { $, $$, emptyState, escapeHTML, rankBadge, setPressed, toggle } from '../core/dom.js';
import { formatARS, formatNumber } from '../core/format.js';
import { bindAmountInput, readNumber } from '../core/inputs.js';
import { chartTheme, createChartSlot, horizontalBarConfig } from '../core/charts.js';
import { onThemeChange } from '../core/theme.js';
import { CATEGORIES, DATA_UPDATED } from '../data/brokers.js';
import { categoryHasTna, computeCommissions, rateRanking } from '../calc/comisiones.js';
import { renderBrokerPlans } from '../ui/broker-plans.js';

const state = {
    category: 'acciones',
    double: false,
};

const els = {};
let chart;

function init() {
    mountLayout();

    Object.assign(els, {
        categories: $('#categories'),
        chartTitle: $('#chartTitle'),
        chartSubtitle: $('#chartSubtitle'),
        modeButtons: $$('.segmented__btn'),
        amount: $('#amount'),
        days: $('#days'),
        daysField: $('#daysField'),
        opType: $('#opType'),
        results: $('#results'),
    });

    $$('[data-bind="updated"]').forEach((el) => { el.textContent = DATA_UPDATED; });
    chart = createChartSlot($('#rateChart'));

    renderCategories();
    renderBrokerPlans($('#brokerPlans'), 'comisiones');

    els.modeButtons.forEach((btn) => btn.addEventListener('click', () => setMode(btn.dataset.mode === 'double')));
    els.opType.addEventListener('change', () => setMode(els.opType.value === 'double'));
    els.days.addEventListener('input', renderResults);
    bindAmountInput(els.amount, { onChange: renderResults });

    renderChart();
    renderResults();
    onThemeChange(renderChart);
}

// ---------- Estado ----------
function selectCategory(key) {
    state.category = key;
    setPressed($$('.chip-btn', els.categories), $(`[data-category="${key}"]`, els.categories));
    toggle(els.daysField, categoryHasTna(key));
    renderChart();
    renderResults();
}

// El toggle del gráfico y el selector de la calculadora comparten el mismo estado.
function setMode(double) {
    state.double = double;
    els.opType.value = double ? 'double' : 'single';
    setPressed(els.modeButtons, els.modeButtons.find((b) => (b.dataset.mode === 'double') === double));
    renderChart();
    renderResults();
}

// ---------- Render ----------
function renderCategories() {
    els.categories.innerHTML = Object.entries(CATEGORIES).map(([key, cat]) => `
        <button type="button" class="chip-btn" data-category="${key}" aria-pressed="${key === state.category}">
            ${escapeHTML(cat.label)}
        </button>`).join('');
    els.categories.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-category]');
        if (btn) selectCategory(btn.dataset.category);
    });
}

function renderChart() {
    const category = CATEGORIES[state.category];
    const isFixed = Boolean(category.isFixed);
    const hasTna = categoryHasTna(state.category);
    const allTna = hasTna && category.tnaBrokers.length === Object.keys(category.rates).length;

    els.chartTitle.textContent = `Comisiones por ${category.label}`;
    els.chartSubtitle.textContent = isFixed
        ? 'Costo fijo en ARS por especie'
        : allTna
            ? 'Comisión sobre monto colocado — * TNA = Tasa Nominal Anual prorrata'
            : hasTna
                ? 'Comisión del broker (%) — * TNA = Tasa Nominal Anual, no comparable directamente'
                : 'Comisión del broker (%) — Ordenado de menor a mayor';

    const entries = rateRanking(state.category, { double: state.double });
    const theme = chartTheme();
    const formatValue = (value, isTNA) => (isFixed
        ? `$${formatNumber(value)}`
        : `${formatNumber(value, 2)}%${isTNA ? ' TNA*' : ''}`);

    chart.render(horizontalBarConfig({
        labels: entries.map((e) => e.name),
        data: entries.map((e) => e.rate),
        colors: entries.map((_, i) => (i === 0 ? theme.pos : i === entries.length - 1 ? theme.neg : theme.barNeutral)),
        formatLabel: (value, ctx) => formatValue(value, entries[ctx.dataIndex].isTNA),
        formatTooltip: (ctx) => formatValue(ctx.raw, entries[ctx.dataIndex].isTNA),
        formatTick: (value) => (isFixed ? `$${formatNumber(value)}` : `${value}%`),
    }));
}

// El más barato en verde, el más caro en rojo, el resto neutro.
function totalTone(index, total) {
    if (index === 0) return 'good';
    if (index === total - 1) return 'bad';
    return 'text';
}

function renderResults() {
    const amount = readNumber(els.amount);
    if (!(amount > 0)) {
        els.results.innerHTML = emptyState('Ingresá un monto para ver la comparación de comisiones');
        return;
    }

    const days = Math.min(365, Math.max(1, parseInt(els.days.value, 10) || 7));
    const calc = computeCommissions({ categoryKey: state.category, amount, days, double: state.double });
    const isFixed = Boolean(calc.category.isFixed);
    const showIva = !calc.ivaExempt;

    const rows = calc.results.map((r, i) => {
        let rateCell;
        if (isFixed) {
            rateCell = formatARS(r.rate);
        } else if (r.isTNA) {
            rateCell = `${formatNumber(r.rate, 2)}% TNA* <span class="text-small">(${formatNumber(r.effectiveRate, 4)}% en ${days}d)</span>`;
        } else {
            rateCell = `${formatNumber(r.rate * r.multiplier, 2)}%`;
        }
        return `<tr>
            <td class="rank">${rankBadge(i)}</td>
            <td><div class="broker-cell"><img class="broker-cell__logo" src="${siteUrl(r.logo)}" alt="" loading="lazy"><span class="broker-cell__name">${escapeHTML(r.name)}</span></div></td>
            <td class="rate">${rateCell}</td>
            <td>${formatARS(r.brokerFee)}</td>
            ${calc.showMarketFee ? `<td>${formatARS(r.marketFee)}</td>` : ''}
            ${showIva ? `<td>${formatARS(r.iva)}</td>` : ''}
            <td><span class="amount tone-${totalTone(i, calc.results.length)}">${formatARS(r.total)}</span></td>
        </tr>`;
    }).join('');

    let html = `<div class="table-wrap"><table class="table table--numeric table--ranking">
        <thead><tr>
            <th>#</th>
            <th>Broker</th>
            <th>${isFixed ? 'Comisión' : 'Comisión (%)'}</th>
            <th>Comisión ($)</th>
            ${calc.showMarketFee ? '<th>Der. Mercado</th>' : ''}
            ${showIva ? '<th>IVA (21%)</th>' : ''}
            <th>Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
    </table></div>`;

    if (calc.hasTNA) {
        html += `<div class="notice notice--muted"><strong>* TNA</strong> = Tasa Nominal Anual. Estas comisiones se calculan de forma proporcional al plazo de la operación y no son directamente comparables con las comisiones porcentuales flat. El monto efectivo depende del plazo de la operación.</div>`;
    }
    if (calc.savings > 0) {
        html += `<div class="notice"><strong>Ahorro posible:</strong> Usando <strong>${escapeHTML(calc.cheapest.name)}</strong> en vez de ${escapeHTML(calc.mostExpensive.name)} te ahorrás <strong>${formatARS(calc.savings)}</strong> en esta operación.</div>`;
    }
    els.results.innerHTML = html;
}

init();

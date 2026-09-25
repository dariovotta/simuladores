// =========================================================
// PÁGINA: Simulador de Carry Trade
// =========================================================
import { mountLayout } from '../core/layout.js';
import { $, escapeHTML, showToast, toggle } from '../core/dom.js';
import { formatNumber, formatSignedARS, formatSignedPct, formatSignedUSD } from '../core/format.js';
import { bindAmountInput, readNumber, writeNumber } from '../core/inputs.js';
import { chartTheme, createChartSlot, tooltipStyle } from '../core/charts.js';
import { DOLLAR_TYPES, RATE_TYPES, breakevenSeries, computeCarry, sensitivityTable } from '../calc/carry.js';

const MAX_HISTORY = 3;
const els = {};
const history = [];
let chart;

const OUTCOME_TONE = { gain: 'good', loss: 'bad', neutral: 'mid' };

function init() {
    mountLayout();
    for (const id of ['carryForm', 'dollarType', 'startFx', 'endFx', 'capital', 'rateType', 'rate', 'rateLabel', 'days',
        'shareBtn', 'history', 'historyList', 'results', 'verdict', 'verdictIcon', 'verdictText',
        'pesoCard', 'pesoGain', 'pesoGainSub', 'usdCard', 'usdGain', 'usdGainSub', 'breakeven', 'breakevenSub',
        'fxChange', 'fxChangeSub', 'usdTea', 'sensitivity']) {
        els[id] = $(`#${id}`);
    }
    chart = createChartSlot($('#breakevenChart'));

    bindAmountInput(els.startFx, { allowDecimals: true });
    bindAmountInput(els.endFx, { allowDecimals: true });
    bindAmountInput(els.capital);
    bindAmountInput(els.rate, { allowDecimals: true });
    bindAmountInput(els.days);

    els.rateType.addEventListener('change', updateRateLabel);
    els.carryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        calculate({ scroll: true });
    });
    els.carryForm.addEventListener('reset', () => {
        // El reset nativo limpia los campos; después se restauran los labels y se ocultan resultados.
        setTimeout(() => {
            els.carryForm.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
            updateRateLabel();
            toggle(els.results, false);
            chart.destroy();
        });
    });
    els.shareBtn.addEventListener('click', share);
    els.historyList.addEventListener('click', (e) => {
        const item = e.target.closest('[data-index]');
        if (item) loadFromHistory(Number(item.dataset.index));
    });
    updateRateLabel();
}

function updateRateLabel() {
    els.rateLabel.textContent = `Tasa (${RATE_TYPES[els.rateType.value]})`;
}

function readForm() {
    const fields = {
        startFx: readNumber(els.startFx),
        endFx: readNumber(els.endFx),
        capital: readNumber(els.capital),
        ratePct: readNumber(els.rate),
        days: readNumber(els.days),
    };
    const inputFor = { startFx: els.startFx, endFx: els.endFx, capital: els.capital, ratePct: els.rate, days: els.days };
    let valid = true;
    for (const [key, value] of Object.entries(fields)) {
        const ok = Number.isFinite(value) && value > 0;
        inputFor[key].classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
    }
    if (!valid) {
        els.carryForm.querySelector('.is-invalid')?.focus();
        return null;
    }
    return { ...fields, rateType: els.rateType.value, dollarType: els.dollarType.value };
}

function calculate({ scroll = false, record = true } = {}) {
    const input = readForm();
    if (!input) return;

    const result = computeCarry(input);
    const tone = OUTCOME_TONE[result.outcome];
    const dollarLabel = DOLLAR_TYPES[input.dollarType];

    renderVerdict(input, result, dollarLabel);

    els.pesoCard.className = `metric metric--${tone}`;
    els.pesoGain.className = `metric__value metric__value--sm tone-${tone}`;
    els.pesoGain.textContent = formatSignedARS(result.pesoGain);
    els.pesoGainSub.textContent = `Capital final: $${formatNumber(result.finalPesos)}`;

    els.usdCard.className = `metric metric--${tone}`;
    els.usdGain.className = `metric__value metric__value--sm tone-${tone}`;
    els.usdGain.textContent = formatSignedUSD(result.usdGain);
    els.usdGainSub.textContent = `${formatSignedPct(result.usdReturnPct)} en USD · Capital inicial: U$D ${formatNumber(result.startUsd, 2)}`;

    els.breakeven.textContent = `$${formatNumber(result.breakeven, 1)}`;
    els.breakevenSub.textContent = input.endFx > result.breakeven
        ? `El dólar superó el break-even ($${formatNumber(input.endFx)} > $${formatNumber(result.breakeven, 1)})`
        : `El dólar no superó el break-even ($${formatNumber(input.endFx)} < $${formatNumber(result.breakeven, 1)})`;

    const fxTone = result.fxChangePct > 0 ? 'bad' : result.fxChangePct < 0 ? 'good' : 'mid';
    els.fxChange.className = `metric__value metric__value--sm tone-${fxTone}`;
    els.fxChange.textContent = formatSignedPct(result.fxChangePct);
    els.fxChangeSub.textContent = `De $${formatNumber(input.startFx)} a $${formatNumber(input.endFx)} en ${input.days} días`;

    els.usdTea.className = `mono tone-${result.usdTea > 0 ? 'good' : 'bad'}`;
    els.usdTea.textContent = `${formatSignedPct(result.usdTea)} TEA en USD`;

    toggle(els.results, true);
    renderChart(input, dollarLabel);
    renderSensitivity(input, result);

    if (record) addToHistory(input, result);
    if (scroll) els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderVerdict(input, result, dollarLabel) {
    const tone = OUTCOME_TONE[result.outcome];
    els.verdict.className = `verdict verdict--${tone}`;
    if (result.outcome === 'gain') {
        els.verdictIcon.textContent = '🚀';
        els.verdictText.innerHTML = `<strong>¡La tasa le ganó al dólar ${dollarLabel}!</strong> En ${input.days} días tu posición en pesos generó un rendimiento positivo en dólares de <strong>${formatSignedPct(result.usdReturnPct)}</strong>. La estrategia de carry trade fue exitosa.`;
    } else if (result.outcome === 'loss') {
        els.verdictIcon.textContent = '📉';
        els.verdictText.innerHTML = `<strong>El dólar ${dollarLabel} le ganó a la tasa.</strong> En ${input.days} días el dólar subió más que tu rendimiento en pesos. Perdiste <strong>U$D ${formatNumber(Math.abs(result.usdGain), 2)}</strong> en términos reales.`;
    } else {
        els.verdictIcon.textContent = '⚖️';
        els.verdictText.innerHTML = `<strong>Resultado neutral.</strong> La tasa prácticamente igualó la suba del dólar ${dollarLabel}. Estás en el punto de break-even.`;
    }
}

function renderChart(input, dollarLabel) {
    const theme = chartTheme();
    const series = breakevenSeries(input);
    chart.render({
        type: 'line',
        data: {
            labels: series.map((p) => p.day),
            datasets: [
                {
                    label: 'Dólar de break-even',
                    data: series.map((p) => p.breakeven),
                    borderColor: theme.good,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.3,
                },
                {
                    label: `Dólar actual (${dollarLabel})`,
                    data: series.map(() => input.endFx),
                    borderColor: 'rgba(220, 38, 38, 0.6)',
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    labels: { color: theme.textSecondary, font: { family: theme.fontSans, size: 12 }, boxWidth: 16, padding: 16 },
                },
                tooltip: {
                    ...tooltipStyle(theme),
                    callbacks: {
                        title: (items) => `Día ${items[0].label}`,
                        label: (item) => ` ${item.dataset.label}: $${formatNumber(item.raw, 1)}`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { color: theme.grid },
                    ticks: {
                        color: theme.muted,
                        font: { family: theme.fontMono, size: 11 },
                        maxTicksLimit: 8,
                        callback(value) { return `Día ${this.getLabelForValue(value)}`; },
                    },
                },
                y: {
                    grid: { color: theme.grid },
                    ticks: { color: theme.muted, font: { family: theme.fontMono, size: 11 }, callback: (v) => `$${formatNumber(v)}` },
                },
            },
        },
    });
}

function renderSensitivity(input, result) {
    const rows = sensitivityTable({ ...input, finalPesos: result.finalPesos, startUsd: result.startUsd });
    els.sensitivity.innerHTML = rows.map((r) => {
        const isBase = r.pct === 0;
        const tone = OUTCOME_TONE[r.outcome];
        const label = isBase ? '0% (sin cambio)' : `${r.pct > 0 ? '↑' : '↓'} ${Math.abs(r.pct)}%`;
        const chip = { gain: '✓ Ganaste', loss: '✗ Perdiste', neutral: '= Break-even' }[r.outcome];
        return `<tr class="${r.isCurrent ? 'is-highlight' : isBase ? 'is-muted' : ''}">
            <td class="${r.pct > 0 ? 'tone-bad' : ''}">${label}${r.isCurrent ? ' <span class="text-small">(escenario actual)</span>' : ''}</td>
            <td class="mono">$${formatNumber(r.fx)}</td>
            <td class="mono ${isBase ? '' : `tone-${tone}`}">${formatSignedARS(r.pesoGain)}</td>
            <td class="mono ${isBase ? '' : `tone-${tone}`}">${formatSignedUSD(r.usdGain)}</td>
            <td>${isBase ? '<span class="tone-muted">—</span>' : `<span class="pill pill--sans pill--${tone}">${chip}</span>`}</td>
        </tr>`;
    }).join('');
}

// ---------- Historial (en memoria, últimos 3) ----------
function addToHistory(input, result) {
    history.unshift({
        input,
        usdGain: result.usdGain,
        startUsd: result.startUsd,
        outcome: result.outcome,
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    });
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();
}

function renderHistory() {
    toggle(els.history, history.length > 0);
    els.historyList.innerHTML = history.map((h, i) => {
        const { input } = h;
        return `<button type="button" class="history-item" data-index="${i}">
            <span>
                <span class="history-item__meta">${escapeHTML(h.time)} · Dólar ${DOLLAR_TYPES[input.dollarType]} · ${RATE_TYPES[input.rateType]} ${formatNumber(input.ratePct, 2)}% · ${input.days} días</span><br>
                <span class="history-item__title">$${formatNumber(input.capital)} → U$D ${formatNumber(h.startUsd, 2)} — Dólar $${formatNumber(input.startFx, 2)} → $${formatNumber(input.endFx, 2)}</span>
            </span>
            <span class="pill pill--${OUTCOME_TONE[h.outcome]}">${formatSignedUSD(h.usdGain)}</span>
        </button>`;
    }).join('');
}

function loadFromHistory(index) {
    const { input } = history[index];
    els.dollarType.value = input.dollarType;
    els.rateType.value = input.rateType;
    updateRateLabel();
    writeNumber(els.startFx, input.startFx, { decimals: 2 });
    writeNumber(els.endFx, input.endFx, { decimals: 2 });
    writeNumber(els.capital, input.capital);
    writeNumber(els.rate, input.ratePct, { decimals: 4 });
    writeNumber(els.days, input.days);
    calculate({ scroll: true, record: false });
}

// ---------- Compartir ----------
async function share() {
    const url = window.location.href;
    const data = { title: 'Simulador de Carry Trade', text: '📊 Simulá tu carry trade con esta herramienta', url };
    if (navigator.share) {
        try { await navigator.share(data); } catch { /* cancelado por el usuario */ }
        return;
    }
    try {
        await navigator.clipboard.writeText(url);
        showToast('✓ Link copiado al portapapeles');
    } catch {
        showToast('No se pudo copiar el link');
    }
}

init();

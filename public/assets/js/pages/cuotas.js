// =========================================================
// PÁGINA: Calculadora de Cuotas (contado vs. cuotas)
// =========================================================
import { mountLayout } from '../core/layout.js';
import { $, $$, emptyState, setPressed, toggle } from '../core/dom.js';
import { formatARS, formatNumber, formatPct } from '../core/format.js';
import { bindAmountInput, readNumber, writeNumber } from '../core/inputs.js';
import { icon } from '../core/icons.js';
import { evaluateCuotas, surchargePct } from '../calc/cuotas.js';
import { mountSaveSimulation } from '../ui/save-sim.js';

const els = {};
const state = { credit: true, compare: false };

const VERDICT_ICON = { info: 'check', mid: 'minus' };

function init() {
    mountLayout();
    for (const id of ['cash', 'tna', 'totalA', 'countA', 'days', 'daysField', 'totalB', 'countB', 'planBFields',
        'compareBtn', 'installment', 'installmentSub', 'installmentB', 'installmentSubB', 'surcharge', 'surchargeSub',
        'surchargeB', 'verdict', 'verdictIcon', 'verdictTitle', 'verdictText',
        'projection', 'projectionSub']) {
        els[id] = $(`#${id}`);
    }
    els.paymentButtons = $$('[data-payment]');

    bindAmountInput(els.cash, { allowDecimals: true, onChange: update });
    bindAmountInput(els.tna, { allowDecimals: true, onChange: update });
    bindAmountInput(els.totalA, { allowDecimals: true, onChange: update });
    bindAmountInput(els.countA, { onChange: update });
    bindAmountInput(els.days, { onChange: update });
    bindAmountInput(els.totalB, { allowDecimals: true, onChange: update });
    bindAmountInput(els.countB, { onChange: update });

    els.paymentButtons.forEach((btn) => btn.addEventListener('click', () => setCredit(btn.dataset.payment === 'credito')));
    els.compareBtn.addEventListener('click', () => setCompare(!state.compare));
    update();

    mountSaveSimulation({
        simulator: 'cuotas',
        getParams: () => ({ credit: state.credit, compare: state.compare, ...readInputs() }),
        applyParams: (p) => {
            writeNumber(els.cash, p.cash, { decimals: 2 });
            writeNumber(els.tna, p.tnaPct, { decimals: 4 });
            writeNumber(els.totalA, p.totalA, { decimals: 2 });
            writeNumber(els.countA, p.countA);
            writeNumber(els.days, p.days);
            writeNumber(els.totalB, p.totalB, { decimals: 2 });
            writeNumber(els.countB, p.countB);
            state.credit = p.credit !== false;
            setCompare(Boolean(p.compare));
            setCredit(state.credit);
        },
        canSave: () => {
            const v = readInputs();
            return v.cash > 0 && v.totalA > 0 && v.countA > 0;
        },
    });
}

// ---------- Estado ----------
function setCredit(credit) {
    state.credit = credit;
    setPressed(els.paymentButtons, els.paymentButtons.find((b) => (b.dataset.payment === 'credito') === credit));
    update();
}

function setCompare(compare) {
    state.compare = compare;
    toggle(els.planBFields, compare);
    $$('[data-plan-tag], [data-plan-b-metric]').forEach((el) => toggle(el, compare));
    els.compareBtn.setAttribute('aria-pressed', String(compare));
    els.compareBtn.textContent = compare ? 'Quitar comparación' : '+ Comparar con otro plan';
    update();
}

function readInputs() {
    const n = (el) => {
        const v = readNumber(el);
        return Number.isFinite(v) ? v : 0;
    };
    return {
        cash: n(els.cash),
        tnaPct: n(els.tna),
        totalA: n(els.totalA),
        countA: Math.floor(n(els.countA)),
        days: n(els.days),
        totalB: n(els.totalB),
        countB: Math.floor(n(els.countB)),
    };
}

// ---------- Render ----------
function update() {
    const v = readInputs();
    toggle(els.daysField, !state.credit);

    const result = evaluateCuotas({
        cash: v.cash,
        tnaPct: v.tnaPct,
        days: v.days,
        credit: state.credit,
        planA: { installmentsTotal: v.totalA, count: v.countA },
        planB: state.compare ? { installmentsTotal: v.totalB, count: v.countB } : null,
    });

    const plural = (n) => `${n} cuota${n > 1 ? 's' : ''}`;
    const setSurcharge = (el, total) => {
        const ok = v.cash > 0 && total > 0;
        const pct = surchargePct(v.cash, total);
        el.textContent = ok ? formatPct(pct) : '—';
        el.className = `metric__value${ok ? (pct > 0 ? ' tone-bad' : ' tone-good') : ''}`;
    };

    const a = result.planA;
    els.installment.textContent = v.countA > 0 ? formatARS(a.installment, 2) : '—';
    els.installmentSub.textContent = v.countA > 0 ? `${plural(v.countA)}${state.compare ? ' (Plan A)' : ''}` : (state.compare ? 'Plan A' : '');
    setSurcharge(els.surcharge, v.totalA);
    els.surchargeSub.textContent = state.compare ? 'Plan A' : 'Cuánto más pagás en cuotas';

    if (state.compare) {
        const b = result.planB;
        els.installmentB.textContent = v.countB > 0 ? formatARS(b.installment, 2) : '—';
        els.installmentSubB.textContent = v.countB > 0 ? `${plural(v.countB)} (Plan B)` : 'Plan B';
        setSurcharge(els.surchargeB, v.totalB);
    }

    renderVerdict(result, v);
    renderProjection(result, v);
}

function renderVerdict(result, v) {
    const money = (n) => formatARS(n, 2);
    const V = {
        missing: ['mid', 'Cargá la cantidad de cuotas', 'Ingresá al menos 1 cuota para ver la proyección.'],
        missingBoth: ['mid', 'Completá ambos planes', 'Ingresá el monto y las cuotas del Plan A y del Plan B para comparar.'],
        installments: ['info', 'Conviene pagar en cuotas', `El saldo queda positivo en las ${v.countA} cuotas. Pagar en cuotas termina siendo más conveniente por el rendimiento de la tasa.`],
        tie: ['info', 'Los dos planes dan lo mismo', 'Los dos planes dejan el mismo saldo final.'],
    };
    let entry = V[result.kind];
    if (result.kind === 'cash') {
        entry = ['info', 'Conviene pagar de contado', result.planB
            ? `Los dos planes terminan con saldo negativo (Plan A: ${money(result.planA.finalBalance)}, Plan B: ${money(result.planB.finalBalance)}). Bajo estas condiciones, pagar de contado es lo más conveniente.`
            : `El saldo se vuelve negativo en el mes ${result.planA.firstNegative}. Bajo estas condiciones, pagar de contado es lo más conveniente.`];
    } else if (result.kind === 'planA' || result.kind === 'planB') {
        const [win, lose] = result.kind === 'planA' ? [result.planA, result.planB] : [result.planB, result.planA];
        const [wName, lName] = result.kind === 'planA' ? ['A', 'B'] : ['B', 'A'];
        entry = ['info', `Conviene el Plan ${wName}`,
            `Deja ${money(win.finalBalance)} contra ${money(lose.finalBalance)} del Plan ${lName}, una diferencia de <strong>${money(result.difference)}</strong>.`];
    }
    const [tone, title, text] = entry;
    els.verdict.className = `verdict verdict--${tone}`;
    els.verdictIcon.innerHTML = icon(VERDICT_ICON[tone], 14);
    els.verdictTitle.textContent = title;
    els.verdictText.innerHTML = text;
}

function planTable(plan) {
    const rows = plan.months.map((m) => `<tr class="${m.negative ? 'is-negative' : m.isLast ? 'is-positive-end' : ''}">
        <td><span class="month-dot"></span>Mes ${m.month}</td>
        <td class="tone-muted">-${formatARS(m.installment, 2)}</td>
        <td><strong class="${m.negative ? 'tone-bad' : m.isLast ? 'tone-good' : ''}">${formatARS(m.balance, 2)}</strong></td>
    </tr>`).join('');
    return `<div class="table-wrap"><table class="table table--compact table--numeric">
        <thead><tr><th>Período</th><th>Cuota pagada</th><th>Saldo restante</th></tr></thead>
        <tbody>${rows}</tbody>
    </table></div>`;
}

function planBlock(label, plan, total, count, badgeClass = '') {
    const info = count > 0 ? `${formatARS(total, 2)} en ${count} cuota${count > 1 ? 's' : ''} de ${formatARS(plan.installment, 2)}` : '';
    const body = count > 0 ? planTable(plan) : emptyState('Cargá el monto y la cantidad de cuotas.');
    return `<div>
        <div class="projection__head"><span class="plan-badge ${badgeClass}">${label}</span><span class="projection__info">${info}</span></div>
        ${body}
    </div>`;
}

function renderProjection(result, v) {
    els.projection.classList.toggle('projection--dual', state.compare);
    if (!state.compare) {
        els.projectionSub.textContent = v.countA > 0
            ? `Saldo que te queda cada mes después de pagar la cuota (${formatNumber(result.planA.count)} períodos)`
            : 'Saldo que te queda cada mes después de pagar la cuota';
        els.projection.innerHTML = v.countA > 0
            ? planTable(result.planA)
            : emptyState('Completá los datos para ver la proyección mes a mes.');
        return;
    }
    els.projectionSub.textContent = 'Saldo que te queda cada mes con cada plan';
    els.projection.innerHTML = planBlock('Plan A', result.planA, v.totalA, v.countA)
        + planBlock('Plan B', result.planB, v.totalB, v.countB, 'plan-badge--b');
}

init();

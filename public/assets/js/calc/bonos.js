// =========================================================
// Matemática de bonos: precio, duration y duration modificada.
// Funciones puras.
// =========================================================

/**
 * Pagos de capital por período.
 * @param {number} nominal
 * @param {number} periods  cantidad total de períodos
 * @param {'bullet'|'all'|number|string} amortization
 *        'bullet' = todo al final, 'all' = en todas las cuotas,
 *        N = en las últimas N cuotas (se limita a `periods`).
 */
export function amortizationSchedule(nominal, periods, amortization = 'bullet') {
    const schedule = new Array(periods).fill(0);
    if (periods <= 0) return schedule;

    if (amortization === 'bullet') {
        schedule[periods - 1] = nominal;
        return schedule;
    }
    const installments = amortization === 'all'
        ? periods
        : Math.min(periods, Math.max(1, parseInt(amortization, 10) || 1));
    const perPeriod = nominal / installments;
    for (let i = periods - installments; i < periods; i++) schedule[i] = perPeriod;
    return schedule;
}

/**
 * Flujos de fondos del bono descontados a `yieldPct`.
 * @returns {{price:number, duration:number, modifiedDuration:number, flows:Array}}
 */
export function analyzeBond({ nominal, coupon, years, yieldPct, frequency = 2, amortization = 'bullet' }) {
    const periods = Math.max(1, Math.round(years * frequency));
    const y = yieldPct / 100 / frequency;
    const schedule = amortizationSchedule(nominal, periods, amortization);

    let outstanding = nominal;
    let price = 0;
    let weightedTime = 0;
    const flows = [];

    for (let t = 1; t <= periods; t++) {
        const interest = (coupon / 100) * outstanding / frequency;
        const principal = schedule[t - 1];
        const cashflow = interest + principal;
        const pv = cashflow / Math.pow(1 + y, t);
        const time = t / frequency;
        price += pv;
        weightedTime += pv * time;
        flows.push({ period: t, time, interest, principal, cashflow, pv, outstanding, weight: 0 });
        outstanding -= principal;
    }

    flows.forEach((f) => { f.weight = price > 0 ? f.pv / price : 0; });
    const duration = price > 0 ? weightedTime / price : 0;

    return { price, duration, modifiedDuration: duration / (1 + y), flows };
}

/** Solo el precio. */
export function bondPrice(params) {
    return analyzeBond(params).price;
}

/** Nuevo precio y resultado ante un cambio de tasa (en puntos porcentuales). */
export function priceShock(params, deltaPct) {
    const base = bondPrice(params);
    const newYield = params.yieldPct + deltaPct;
    const newPrice = newYield > 0 ? bondPrice({ ...params, yieldPct: newYield }) : base;
    const pnl = newPrice - base;
    return { basePrice: base, newYield, newPrice, pnl, pnlPct: base ? (pnl / base) * 100 : 0 };
}

/** Curva precio/tasa en ±`range` puntos alrededor de la TIR actual. */
export function priceYieldCurve(params, { range = 5, step = 0.25, min = 0.5 } = {}) {
    const from = Math.max(min, params.yieldPct - range);
    const to = params.yieldPct + range;
    const points = [];
    // Se itera por índice para evitar errores de punto flotante acumulados.
    const count = Math.round((to - from) / step);
    for (let i = 0; i <= count; i++) {
        const rate = from + i * step;
        points.push({ rate, price: bondPrice({ ...params, yieldPct: rate }) });
    }
    let currentIndex = 0;
    points.forEach((p, i) => {
        if (Math.abs(p.rate - params.yieldPct) < Math.abs(points[currentIndex].rate - params.yieldPct)) currentIndex = i;
    });
    return { points, currentIndex };
}

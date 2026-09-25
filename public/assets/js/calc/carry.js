// =========================================================
// Carry trade: ¿la tasa en pesos le ganó al dólar?
// Funciones puras.
// =========================================================

export const RATE_TYPES = {
    tna: 'TNA',
    tem: 'TEM',
    tea: 'TEA',
};

export const DOLLAR_TYPES = {
    oficial: 'Oficial',
    mep: 'MEP',
    ccl: 'CCL',
    blue: 'Blue',
};

/**
 * Factor de crecimiento del capital en pesos tras `days` días.
 * TNA: interés simple (365 días). TEM (30 días) y TEA (365 días): compuesto.
 */
export function growthFactor(rateType, ratePct, days) {
    const r = ratePct / 100;
    switch (rateType) {
        case 'tem': return Math.pow(1 + r, days / 30);
        case 'tea': return Math.pow(1 + r, days / 365);
        case 'tna':
        default: return 1 + (r / 365) * days;
    }
}

/**
 * @param {object} p
 * @param {number} p.startFx    precio inicial del dólar
 * @param {number} p.endFx      precio actual del dólar
 * @param {number} p.capital    capital inicial en ARS
 * @param {string} p.rateType   'tna' | 'tem' | 'tea'
 * @param {number} p.ratePct    tasa en %
 * @param {number} p.days       días invertido
 */
export function computeCarry({ startFx, endFx, capital, rateType, ratePct, days }) {
    const factor = growthFactor(rateType, ratePct, days);
    const finalPesos = capital * factor;
    const startUsd = capital / startFx;
    const endUsd = finalPesos / endFx;
    const usdGain = endUsd - startUsd;
    const breakeven = finalPesos / startUsd;

    return {
        factor,
        finalPesos,
        pesoGain: finalPesos - capital,
        startUsd,
        endUsd,
        usdGain,
        usdReturnPct: (usdGain / startUsd) * 100,
        breakeven,
        fxChangePct: ((endFx - startFx) / startFx) * 100,
        usdTea: (Math.pow(endUsd / startUsd, 365 / days) - 1) * 100,
        outcome: usdGain > 0.001 ? 'gain' : usdGain < -0.001 ? 'loss' : 'neutral',
    };
}

/** Serie del dólar de break-even a lo largo del tiempo (hasta 2× el plazo). */
export function breakevenSeries({ startFx, capital, rateType, ratePct, days }) {
    const maxDays = Math.max(days * 2, 60);
    const step = Math.max(1, Math.floor(maxDays / 60));
    const startUsd = capital / startFx;
    const series = [];
    for (let d = 1; d <= maxDays; d += step) {
        series.push({ day: d, breakeven: (capital * growthFactor(rateType, ratePct, d)) / startUsd });
    }
    return series;
}

export const SCENARIOS = [-15, -10, -8, -5, -3, 0, 3, 5, 8, 10, 15];

/**
 * Resultado para distintas variaciones del dólar respecto del precio inicial.
 * Marca el escenario más cercano al dólar actual.
 */
export function sensitivityTable({ startFx, endFx, finalPesos, startUsd }, scenarios = SCENARIOS) {
    return scenarios.map((pct) => {
        const fx = startFx * (1 + pct / 100);
        const usdGain = finalPesos / fx - startUsd;
        const pesoGain = finalPesos - startUsd * fx;
        return {
            pct,
            fx,
            usdGain,
            pesoGain,
            outcome: usdGain > 0.001 ? 'gain' : usdGain < -0.001 ? 'loss' : 'neutral',
            isCurrent: pct !== 0 && Math.abs(fx - endFx) / endFx < 0.005,
        };
    });
}

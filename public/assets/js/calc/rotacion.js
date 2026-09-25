// =========================================================
// Rotación de ONs: costo de vender una ON y comprar otra, y
// meses necesarios para recuperarlo con el diferencial de TIR.
// =========================================================
import { BROKERS, CATEGORIES } from '../data/brokers.js';

const ONS = CATEGORIES.bonos_privados; // ONs: exentas de IVA, DM 0,01%

/** Clasificación de los meses de recupero. */
export function recoveryTone(months) {
    if (!Number.isFinite(months)) return 'bad';
    if (months <= 3) return 'good';
    if (months <= 12) return 'mid';
    return 'bad';
}

/**
 * @param {object} p
 * @param {number} p.amount      monto invertido
 * @param {number} p.currentYield TIR de la ON actual (%)
 * @param {number} p.newYield     TIR de la ON nueva (%)
 */
export function computeRotation({ amount, currentYield, newYield }) {
    const spread = newYield - currentYield;
    const annualGain = amount * (spread / 100);
    const monthlyGain = annualGain / 12;
    const marketFeeRate = ONS.marketFee ?? 0;

    const results = Object.entries(ONS.rates)
        .filter(([, rate]) => rate !== null)
        .map(([id, rate]) => {
            // Ida y vuelta: venta de la ON actual + compra de la nueva.
            const commission = 2 * amount * (rate / 100);
            const marketFee = 2 * amount * (marketFeeRate / 100);
            const totalCost = commission + marketFee; // ONs exentas de IVA
            const months = spread > 0 ? totalCost / monthlyGain : Infinity;
            return {
                id,
                name: BROKERS[id].name,
                logo: BROKERS[id].logo,
                rate,
                commission,
                marketFee,
                totalCost,
                months,
            };
        })
        .sort((a, b) => a.totalCost - b.totalCost);

    return {
        spread,
        annualGain,
        results,
        best: results[0],
        worst: results[results.length - 1],
    };
}

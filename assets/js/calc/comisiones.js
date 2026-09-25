// =========================================================
// Cálculo de comisiones por broker. Funciones puras.
// =========================================================
import { BROKERS, CATEGORIES, IVA } from '../data/brokers.js';

const isTnaBroker = (category, brokerId) => Boolean(category.tnaBrokers?.includes(brokerId));

/** ¿La categoría tiene al menos un broker con tasa TNA? */
export function categoryHasTna(categoryKey) {
    return Boolean(CATEGORIES[categoryKey].tnaBrokers?.length);
}

/**
 * Tasas por broker para el gráfico de ranking, ordenadas de menor a mayor.
 * En modo "double" (compra + venta) se duplica la tasa, salvo las TNA
 * y los costos fijos.
 */
export function rateRanking(categoryKey, { double = false } = {}) {
    const category = CATEGORIES[categoryKey];
    return Object.entries(category.rates)
        .filter(([, rate]) => rate !== null)
        .map(([id, rate]) => {
            const isTNA = isTnaBroker(category, id);
            const multiplier = !category.isFixed && !isTNA && double ? 2 : 1;
            return { id, name: BROKERS[id].name, rate: rate * multiplier, isTNA };
        })
        .sort((a, b) => a.rate - b.rate);
}

/**
 * Costo total por broker de una operación.
 * @param {object} p
 * @param {string} p.categoryKey  clave de CATEGORIES
 * @param {number} p.amount       monto operado en ARS
 * @param {number} [p.days=7]     plazo en días (para tasas TNA)
 * @param {boolean} [p.double]    compra + venta
 */
export function computeCommissions({ categoryKey, amount, days = 7, double = false }) {
    const category = CATEGORIES[categoryKey];
    const marketFee = category.marketFee ?? 0;
    const ivaExempt = Boolean(category.ivaExempt);
    const hasTNA = categoryHasTna(categoryKey);
    const tnaFactor = days / 365;

    const results = Object.entries(category.rates)
        .filter(([, rate]) => rate !== null)
        .map(([id, rate]) => {
            const broker = BROKERS[id];
            const isTNA = isTnaBroker(category, id);
            const multiplier = !category.isFixed && !isTNA && double ? 2 : 1;

            let brokerFee;
            let marketFeeAmount = 0;
            let effectiveRate = null;

            if (category.isFixed) {
                brokerFee = rate;
            } else {
                effectiveRate = rate * multiplier * (isTNA ? tnaFactor : 1);
                brokerFee = amount * (effectiveRate / 100);
                // Si todos los brokers cobran TNA (cauciones), los derechos de
                // mercado también son anuales y se prorratean por plazo.
                const marketFactor = category.tnaBrokers?.length === Object.keys(category.rates).length ? tnaFactor : 1;
                marketFeeAmount = amount * (marketFee / 100) * multiplier * marketFactor;
            }

            const iva = ivaExempt ? 0 : (brokerFee + marketFeeAmount) * IVA;
            return {
                id,
                name: broker.name,
                logo: broker.logo,
                rate,
                isTNA,
                multiplier,
                effectiveRate,
                brokerFee,
                marketFee: marketFeeAmount,
                iva,
                total: brokerFee + marketFeeAmount + iva,
            };
        })
        .sort((a, b) => a.total - b.total);

    const cheapest = results[0];
    const mostExpensive = results[results.length - 1];

    return {
        category,
        results,
        hasTNA,
        ivaExempt,
        showMarketFee: marketFee > 0 && !category.isFixed,
        savings: results.length >= 2 ? mostExpensive.total - cheapest.total : 0,
        cheapest,
        mostExpensive,
    };
}

/** Tono visual según la posición en el ranking (mismo criterio que el original). */
export function rankTone(index, total) {
    if (index === 0) return 'good';
    if (index >= total - 2) return 'bad';
    return 'mid';
}

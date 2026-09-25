// =========================================================
// LECAP: precio de mercado vs. valor técnico cuando cambia la
// tasa a mitad de camino. Funciones puras.
// =========================================================

/** TEM (% mensual) → tasa efectiva diaria (mes de 30 días). */
export function dailyFromMonthly(monthlyPct) {
    return Math.pow(1 + monthlyPct / 100, 1 / 30) - 1;
}

/**
 * Días a evaluar: ~8 tramos entre hoy y el vencimiento, más el día
 * exacto en que cambia la tasa (ahí se produce el salto de precio).
 */
export function samplingDays(totalDays, changeDay, sections = 8) {
    const step = Math.max(1, Math.round(totalDays / sections));
    const days = new Set([totalDays]);
    for (let d = 0; d <= totalDays; d += step) days.add(d);
    if (changeDay > 0 && changeDay < totalDays) days.add(changeDay);
    return [...days].sort((a, b) => a - b);
}

/**
 * @param {object} p
 * @param {number} p.buyRate     tasa de compra (% mensual)
 * @param {number} p.marketRate  nueva tasa de mercado (% mensual)
 * @param {number} p.totalDays   días al vencimiento
 * @param {number} p.changeDay   día en que cambia la tasa
 * @param {number} p.capital     inversión en $
 */
export function simulateLecap({ buyRate, marketRate, totalDays, changeDay, capital }) {
    const dBuy = dailyFromMonthly(buyRate);
    const dMarket = dailyFromMonthly(marketRate);
    const finalFactor = Math.pow(1 + dBuy, totalDays);

    const rows = samplingDays(totalDays, changeDay).map((day, i, days) => {
        const remaining = totalDays - day;
        // Valor técnico: lo que "vale" la LECAP devengando la tasa de compra.
        const technical = Math.pow(1 + dBuy, day);
        // Precio de mercado: el valor final descontado a la tasa vigente ese día.
        const rate = day < changeDay ? dBuy : dMarket;
        const market = remaining === 0 ? finalFactor : finalFactor / Math.pow(1 + rate, remaining);
        const marketValue = market * capital;
        const technicalValue = technical * capital;
        return {
            day,
            gap: i === 0 ? 0 : day - days[i - 1],
            label: day === 0 ? 'Hoy' : day === totalDays ? 'Vencimiento' : `Día ${day}`,
            market,
            technical,
            marketValue,
            technicalValue,
            profit: marketValue - capital,
            profitPct: (market - 1) * 100,
            // Diferencia entre vender a precio de mercado y el valor devengado a ese día.
            vsHold: marketValue - technicalValue,
        };
    });

    rows.forEach((row, i) => {
        const prev = rows[i - 1];
        row.periodReturn = prev ? ((row.market - prev.market) / prev.market) * 100 : 0;
        // ¿El tramo rindió más que la tasa de compra en ese mismo lapso?
        row.beatsBuyRate = Boolean(prev) && row.periodReturn >= (Math.pow(1 + dBuy, row.gap) - 1) * 100 - 1e-9;
    });

    // Momento óptimo de venta anticipada: donde el precio de mercado más supera
    // al valor técnico. Solo existe si la tasa bajó (premio positivo).
    let peakIndex = 0;
    rows.forEach((r, i) => { if (r.vsHold > rows[peakIndex].vsHold) peakIndex = i; });
    const hasPeak = rows[peakIndex].vsHold > capital * 1e-6 && peakIndex < rows.length - 1;
    rows.forEach((r, i) => { r.isPeak = hasPeak && i === peakIndex; });

    const peak = rows[peakIndex];
    let verdict = 'hold';
    if (marketRate < buyRate - 0.5) verdict = 'sell';
    else if (marketRate > buyRate + 0.5) verdict = 'wait';

    return {
        rows,
        peakIndex: hasPeak ? peakIndex : null,
        peak: hasPeak ? peak : null,
        maturityValue: finalFactor * capital,
        // Si no hay momento óptimo, la mejor opción es mantener hasta el vencimiento.
        bestExtra: hasPeak ? peak.vsHold : 0,
        // Peor desvío (la tasa subió): cuánto perdés si tenés que vender antes.
        worstGap: Math.min(...rows.map((r) => r.vsHold)),
        verdict,
    };
}

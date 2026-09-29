// =========================================================
// Calculadora de cuotas: ¿conviene pagar de contado o en cuotas?
// Proyección mes a mes: el dinero rinde a la TNA mientras se van
// pagando las cuotas. Si el saldo se vuelve negativo, conviene el
// contado. Funciones puras (portadas de calculadora-inflacion.html).
// =========================================================

/**
 * Proyecta el saldo mes a mes.
 * @param {object} p
 * @param {number} p.installmentsTotal  monto total en cuotas
 * @param {number} p.count              cantidad de cuotas
 * @param {number} p.cash               monto de contado
 * @param {number} p.tnaPct             TNA en %
 * @param {number} p.days               días al primer vencimiento (solo débito)
 * @param {boolean} p.credit            true si el contado se paga con tarjeta de crédito
 */
export function projectInstallments({ installmentsTotal, count, cash, tnaPct, days, credit }) {
    const tna = tnaPct / 100;
    const n = Math.max(0, Math.floor(count || 0));
    const installment = n > 0 ? installmentsTotal / n : 0;
    // Con crédito el contado se debita al mes 1; con débito hay un período 0 hasta el primer vencimiento.
    const rows = n > 0 ? (credit ? n : n + 1) : 0;
    const start = credit ? 1 : 0;

    let prev = credit ? cash : 0;
    let firstNegative = -1;
    let finalBalance = 0;
    const months = [];

    for (let m = start; m < start + rows; m++) {
        let balance;
        if (m === 0) {
            balance = cash * tna / 365 * days + cash;
        } else {
            const base = prev - installment;
            balance = base * tna / 365 * 30 + base;
        }
        const negative = balance < 0;
        const isLast = m === start + rows - 1;
        if (negative && firstNegative < 0) firstNegative = m;
        if (m > 0) months.push({ month: m, installment, balance, negative, isLast });
        prev = balance;
        finalBalance = balance;
    }

    return { months, finalBalance, firstNegative, installment, count: months.length };
}

/** Recargo de las cuotas sobre el contado, en %. */
export function surchargePct(cash, installmentsTotal) {
    return cash > 0 ? (installmentsTotal / cash - 1) * 100 : 0;
}

/**
 * Resultado para mostrar: un plan solo o la comparación de dos planes.
 * @returns {{ kind: string, planA: object, planB?: object, difference?: number }}
 *   kind: 'missing' | 'cash' | 'installments' (un plan)
 *         'missingBoth' | 'planA' | 'planB' | 'tie' (comparación)
 */
export function evaluateCuotas({ cash, tnaPct, days, credit, planA, planB = null }) {
    const common = { cash, tnaPct, days, credit };
    const a = projectInstallments({ ...common, ...planA });
    if (!planB) {
        let kind = 'installments';
        if (Math.floor(planA.count || 0) <= 0) kind = 'missing';
        else if (a.firstNegative >= 0) kind = 'cash';
        return { kind, planA: a };
    }
    const b = projectInstallments({ ...common, ...planB });
    if (Math.floor(planA.count || 0) <= 0 || Math.floor(planB.count || 0) <= 0) {
        return { kind: 'missingBoth', planA: a, planB: b };
    }
    const difference = Math.abs(a.finalBalance - b.finalBalance);
    let kind = 'tie';
    // Si los dos planes terminan con saldo negativo, conviene el contado.
    if (a.finalBalance < 0 && b.finalBalance < 0) kind = 'cash';
    else if (a.finalBalance > b.finalBalance) kind = 'planA';
    else if (b.finalBalance > a.finalBalance) kind = 'planB';
    return { kind, planA: a, planB: b, difference };
}

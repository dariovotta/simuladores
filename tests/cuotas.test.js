import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCuotas, projectInstallments, surchargePct } from '../public/assets/js/calc/cuotas.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

// Réplica literal de proyectar() del HTML original, para comparar resultados.
function original(enCuotas, cant, contado, tna, dias, esCredito) {
    const precioCuota = cant > 0 ? enCuotas / cant : 0;
    const nFilas = cant > 0 ? (esCredito ? cant : cant + 1) : 0;
    const startM = esCredito ? 1 : 0;
    let prev = esCredito ? contado : 0, firstNeg = -1, saldoFinal = 0;
    const filas = [];
    for (let m = startM; m < startM + nFilas; m++) {
        let saldo;
        if (m === 0) saldo = contado * tna / 365 * dias + contado;
        else { const base = prev - precioCuota; saldo = base * tna / 365 * 30 + base; }
        if (saldo < 0 && firstNeg < 0) firstNeg = m;
        if (m > 0) filas.push(saldo);
        prev = saldo; saldoFinal = saldo;
    }
    return { filas, saldoFinal, firstNeg };
}

test('cuotas: crédito coincide con el cálculo original', () => {
    const r = projectInstallments({ installmentsTotal: 120000, count: 6, cash: 100000, tnaPct: 40, days: 0, credit: true });
    const o = original(120000, 6, 100000, 0.4, 0, true);
    assert.equal(r.count, 6);
    r.months.forEach((m, i) => close(m.balance, o.filas[i]));
    close(r.finalBalance, o.saldoFinal);
    assert.equal(r.firstNegative, o.firstNeg);
    close(r.installment, 20000);
});

test('cuotas: débito agrega el período hasta el primer vencimiento', () => {
    const r = projectInstallments({ installmentsTotal: 100000, count: 3, cash: 100000, tnaPct: 30, days: 20, credit: false });
    const o = original(100000, 3, 100000, 0.3, 20, false);
    assert.equal(r.count, 3);
    r.months.forEach((m, i) => close(m.balance, o.filas[i]));
    close(r.finalBalance, o.saldoFinal);
});

test('cuotas: veredictos de un plan y de dos planes', () => {
    const base = { cash: 100000, tnaPct: 35, days: 0, credit: true };
    assert.equal(evaluateCuotas({ ...base, planA: { installmentsTotal: 100000, count: 0 } }).kind, 'missing');
    assert.equal(evaluateCuotas({ ...base, planA: { installmentsTotal: 200000, count: 3 } }).kind, 'cash');
    assert.equal(evaluateCuotas({ ...base, planA: { installmentsTotal: 100000, count: 6 } }).kind, 'installments');
    const cmp = evaluateCuotas({ ...base, planA: { installmentsTotal: 100000, count: 6 }, planB: { installmentsTotal: 110000, count: 6 } });
    assert.equal(cmp.kind, 'planA');
    close(cmp.difference, cmp.planA.finalBalance - cmp.planB.finalBalance);
    assert.equal(evaluateCuotas({ ...base, planA: { installmentsTotal: 1, count: 1 }, planB: { installmentsTotal: 1, count: 0 } }).kind, 'missingBoth');
    close(surchargePct(100000, 120000), 20);
});

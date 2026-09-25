import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCommissions, rateRanking } from '../public/assets/js/calc/comisiones.js';
import { computeRotation, recoveryTone } from '../public/assets/js/calc/rotacion.js';
import { analyzeBond, amortizationSchedule, priceShock, priceYieldCurve } from '../public/assets/js/calc/bonos.js';
import { simulateLecap } from '../public/assets/js/calc/lecap.js';
import { computeCarry, growthFactor, sensitivityTable } from '../public/assets/js/calc/carry.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('comisiones: acciones con IVA y derechos de mercado', () => {
    const { results, savings } = computeCommissions({ categoryKey: 'acciones', amount: 1_000_000 });
    const veta = results[0];
    assert.equal(veta.id, 'vetacap');
    close(veta.brokerFee, 1500);          // 0,15%
    close(veta.marketFee, 500);           // 0,05%
    close(veta.iva, (1500 + 500) * 0.21);
    close(veta.total, 2000 * 1.21);
    const rava = results.at(-1);
    assert.equal(rava.id, 'rava');
    close(savings, rava.total - veta.total);
});

test('comisiones: compra+venta duplica tasa y derechos', () => {
    const single = computeCommissions({ categoryKey: 'cedears', amount: 100_000 }).results.find((r) => r.id === 'iol');
    const double = computeCommissions({ categoryKey: 'cedears', amount: 100_000, double: true }).results.find((r) => r.id === 'iol');
    close(double.total, single.total * 2);
});

test('comisiones: bonos exentos de IVA', () => {
    const r = computeCommissions({ categoryKey: 'bonos_publicos', amount: 1_000_000 });
    assert.ok(r.results.every((x) => x.iva === 0));
});

test('comisiones: caución prorratea TNA y derechos por plazo', () => {
    const r = computeCommissions({ categoryKey: 'caucion_colocadora', amount: 1_000_000, days: 30 })
        .results.find((x) => x.id === 'iol');
    close(r.brokerFee, 1_000_000 * 0.018 * 30 / 365);
    close(r.marketFee, 1_000_000 * 0.0018 * 30 / 365);
    close(r.total, (r.brokerFee + r.marketFee) * 1.21);
});

test('comisiones: letras solo prorratea la tasa TNA de Cocos', () => {
    const res = computeCommissions({ categoryKey: 'letras', amount: 1_000_000, days: 30 }).results;
    const cocos = res.find((x) => x.id === 'cocos');
    const balanz = res.find((x) => x.id === 'balanz');
    close(cocos.brokerFee, 1_000_000 * 0.015 * 30 / 365);
    close(balanz.brokerFee, 1000);
    close(balanz.marketFee, 1_000_000 * 0.00001); // 0,001% sin prorrateo
});

test('comisiones: costo fijo de transferencia y null excluido', () => {
    const r = computeCommissions({ categoryKey: 'transferencia_titulos', amount: 1 });
    assert.ok(!r.results.some((x) => x.id === 'balanz'));
    const iol = r.results.find((x) => x.id === 'iol');
    close(iol.total, 750 * 1.21);
});

test('ranking ordenado ascendente', () => {
    const r = rateRanking('acciones', { double: true });
    assert.equal(r[0].rate, 0.3);
    assert.ok(r.every((x, i) => i === 0 || r[i - 1].rate <= x.rate));
});

test('rotación de ONs: costo ida y vuelta y meses de recupero', () => {
    const r = computeRotation({ amount: 10_000_000, currentYield: 6.5, newYield: 7 });
    const veta = r.results[0];
    close(veta.totalCost, 2 * 10_000_000 * 0.0015 + 2 * 10_000_000 * 0.0001);
    close(veta.months, veta.totalCost / (10_000_000 * 0.005 / 12));
    const neg = computeRotation({ amount: 1000, currentYield: 7, newYield: 6 });
    assert.ok(neg.results.every((x) => x.months === Infinity));
    assert.equal(recoveryTone(2), 'good');
    assert.equal(recoveryTone(6), 'mid');
    assert.equal(recoveryTone(Infinity), 'bad');
});

test('bonos: bono a la par tiene precio = nominal', () => {
    const b = analyzeBond({ nominal: 100, coupon: 7, years: 5, yieldPct: 7, frequency: 2 });
    close(b.price, 100, 1e-9);
    // Duration < vencimiento para bono con cupón
    assert.ok(b.duration < 5 && b.duration > 4);
    close(b.modifiedDuration, b.duration / 1.035);
});

test('bonos: cupón cero → duration = vencimiento', () => {
    const b = analyzeBond({ nominal: 100, coupon: 0, years: 10, yieldPct: 5, frequency: 1 });
    close(b.duration, 10);
    close(b.price, 100 / 1.05 ** 10);
});

test('bonos: amortización limitada a la cantidad de períodos', () => {
    const s = amortizationSchedule(100, 2, '10');
    assert.deepEqual(s, [50, 50]);
    const all = amortizationSchedule(100, 4, 'all');
    assert.deepEqual(all, [25, 25, 25, 25]);
});

test('bonos: suba de tasa baja el precio (convexidad)', () => {
    const p = { nominal: 100, coupon: 5, years: 5, yieldPct: 7, frequency: 2 };
    const up = priceShock(p, 1);
    const down = priceShock(p, -1);
    assert.ok(up.pnl < 0 && down.pnl > 0);
    assert.ok(Math.abs(down.pnl) > Math.abs(up.pnl));
    const { points, currentIndex } = priceYieldCurve(p);
    close(points[currentIndex].rate, 7);
});

test('LECAP: sin cambio de tasa el precio de mercado sigue al técnico', () => {
    const s = simulateLecap({ buyRate: 3, marketRate: 3, totalDays: 120, changeDay: 30, capital: 1_000_000 });
    s.rows.forEach((r) => close(r.market, r.technical, 1e-9));
    assert.equal(s.verdict, 'hold');
    assert.equal(s.peak, null);
    close(s.maturityValue, 1_000_000 * 1.03 ** 4, 1e-6);
});

test('LECAP: si baja la tasa el óptimo es el día del cambio', () => {
    const s = simulateLecap({ buyRate: 3, marketRate: 1.5, totalDays: 120, changeDay: 37, capital: 1_000_000 });
    assert.equal(s.verdict, 'sell');
    assert.ok(s.rows.some((r) => r.day === 37), 'el día del cambio se muestrea');
    assert.equal(s.peak.day, 37);
    assert.ok(s.bestExtra > 0);
    close(s.bestExtra, s.peak.marketValue - s.peak.technicalValue);
    assert.equal(s.rows.filter((r) => r.isPeak).length, 1);
});

test('LECAP: si sube la tasa no hay venta óptima y vender antes pierde', () => {
    const s = simulateLecap({ buyRate: 1.5, marketRate: 3, totalDays: 120, changeDay: 30, capital: 1_000_000 });
    assert.equal(s.verdict, 'wait');
    assert.equal(s.peak, null);
    assert.ok(s.worstGap < 0);
});

test('carry: TNA simple, TEM y TEA compuestas', () => {
    close(growthFactor('tna', 36.5, 30), 1.03);
    close(growthFactor('tem', 3, 60), 1.03 ** 2);
    close(growthFactor('tea', 50, 365), 1.5);
});

test('carry: resultado y break-even', () => {
    const r = computeCarry({ startFx: 1000, endFx: 1020, capital: 1_000_000, rateType: 'tna', ratePct: 36.5, days: 30 });
    close(r.finalPesos, 1_030_000);
    close(r.startUsd, 1000);
    close(r.endUsd, 1_030_000 / 1020);
    close(r.breakeven, 1030);
    assert.equal(r.outcome, 'gain');
    const rows = sensitivityTable({ startFx: 1000, endFx: 1020, finalPesos: r.finalPesos, startUsd: r.startUsd });
    assert.equal(rows.length, 11);
    assert.equal(rows.find((x) => x.pct === 5).outcome, 'loss');
    assert.equal(rows.find((x) => x.pct === 3).outcome, 'neutral'); // 1030 = break-even
    assert.equal(rows.find((x) => x.pct === -5).outcome, 'gain');
});

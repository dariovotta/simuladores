import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTyping, parseLocaleNumber, formatSignedPct, formatARS } from '../public/assets/js/core/format.js';

test('parseLocaleNumber entiende formato es-AR y decimales con punto', () => {
    assert.equal(parseLocaleNumber('1.234.567'), 1234567);
    assert.equal(parseLocaleNumber('1.234,56'), 1234.56);
    assert.equal(parseLocaleNumber('7,5'), 7.5);
    assert.equal(parseLocaleNumber('7.5'), 7.5);
    assert.equal(parseLocaleNumber('0.125'), 0.125);
    assert.equal(parseLocaleNumber('1.050'), 1050);
    assert.equal(parseLocaleNumber('$ 1.000'), 1000);
    assert.ok(Number.isNaN(parseLocaleNumber('')));
});

test('formatTyping agrega separadores de miles', () => {
    assert.equal(formatTyping('1000000'), '1.000.000');
    assert.equal(formatTyping('1.0000'), '10.000');
    assert.equal(formatTyping('1234,5', { allowDecimals: true }), '1.234,5');
    assert.equal(formatTyping('0012'), '12');
});

test('formatos de salida', () => {
    assert.equal(formatARS(1234.6), '$1.235');
    assert.equal(formatSignedPct(1.5), '+1,50%');
    assert.equal(formatSignedPct(-1.234), '-1,23%');
    assert.equal(formatSignedPct(-0.001), '0,00%');
});

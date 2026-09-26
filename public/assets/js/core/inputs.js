// =========================================================
// Comportamiento de inputs numéricos con formato es-AR.
// =========================================================
import { formatTyping, parseLocaleNumber } from './format.js';

/**
 * Convierte un <input type="text"> en un campo de montos que agrega
 * puntos de miles mientras se escribe, manteniendo el cursor en su lugar.
 */
export function bindAmountInput(input, { allowDecimals = false, onChange } = {}) {
    input.setAttribute('inputmode', allowDecimals ? 'decimal' : 'numeric');
    input.setAttribute('autocomplete', 'off');

    input.addEventListener('input', (event) => {
        const caret = input.selectionStart ?? input.value.length;
        let raw = input.value;
        // Si el usuario tipea "." en un campo con decimales, se toma como coma decimal
        // ("7.5" → "7,5"). Mismo largo, así que el cursor no se mueve.
        if (allowDecimals && event.data === '.' && !raw.includes(',') && caret > 0 && raw[caret - 1] === '.') {
            raw = `${raw.slice(0, caret - 1).replace(/\./g, '')},${raw.slice(caret).replace(/\./g, '')}`;
        }
        // Cantidad de dígitos (y coma decimal) a la izquierda del cursor: se preserva al reformatear.
        const digitsBefore = raw.slice(0, caret).replace(/[^\d,]/g, '').length;
        const formatted = formatTyping(raw, { allowDecimals });
        input.value = formatted;

        let pos = 0;
        let seen = 0;
        while (pos < formatted.length && seen < digitsBefore) {
            if (/[\d,]/.test(formatted[pos])) seen++;
            pos++;
        }
        input.setSelectionRange(pos, pos);
        input.classList.remove('is-invalid');
        onChange?.(readNumber(input));
    });
}

/** Lee el valor numérico de un input (NaN si está vacío o es inválido). */
export function readNumber(input) {
    return parseLocaleNumber(input.value);
}

/** Escribe un número en un input de montos respetando el formato. */
export function writeNumber(input, value, { decimals = 0 } = {}) {
    if (!Number.isFinite(value)) {
        input.value = '';
        return;
    }
    input.value = value.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });
}

/** Porcentaje (0–100) de la posición de un <input type="range">. */
export function rangePercent(input, value = Number(input.value)) {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    return max > min ? ((value - min) / (max - min)) * 100 : 0;
}

/** Pinta el relleno del track entre `start` y `end` (en %), con el color indicado. */
export function setRangeFill(input, start, end, color = 'var(--primary)') {
    input.style.setProperty('--fill-start', `${start}%`);
    input.style.setProperty('--fill-end', `${end}%`);
    input.style.setProperty('--fill-color', color);
}

/** Relleno clásico desde el mínimo hasta el valor actual, actualizado en cada cambio. */
export function bindRangeFill(input) {
    const paint = () => setRangeFill(input, 0, rangePercent(input));
    input.addEventListener('input', paint);
    paint();
    return paint;
}

// =========================================================
// Formateo y parseo de números (convención es-AR:
// "." separador de miles, "," separador decimal).
// Funciones puras, sin DOM.
// =========================================================

const LOCALE = 'es-AR';

/** Número con separador de miles y `decimals` decimales fijos. */
export function formatNumber(n, decimals = 0) {
    if (!Number.isFinite(n)) return '—';
    // Evita "-0,00" cuando el valor redondeado es cero.
    if (Number(n.toFixed(decimals)) === 0) n = 0;
    return n.toLocaleString(LOCALE, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/** Pesos redondeados: 1234.5 → "$1.235". */
export function formatARS(n, decimals = 0) {
    if (!Number.isFinite(n)) return '—';
    const sign = n < 0 ? '-' : '';
    return `${sign}$${formatNumber(Math.abs(n), decimals)}`;
}

/** Pesos con signo explícito: +$1.000 / -$1.000 / $0. */
export function formatSignedARS(n, decimals = 0) {
    if (!Number.isFinite(n)) return '—';
    const rounded = Number(n.toFixed(decimals));
    const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
    return `${sign}$${formatNumber(Math.abs(n), decimals)}`;
}

/** Dólares con signo explícito: +U$D 12,34. */
export function formatSignedUSD(n, decimals = 2) {
    if (!Number.isFinite(n)) return '—';
    const rounded = Number(n.toFixed(decimals));
    const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
    return `${sign}U$D ${formatNumber(Math.abs(n), decimals)}`;
}

/** Porcentaje: 1.5 → "1,50%". */
export function formatPct(n, decimals = 2) {
    if (!Number.isFinite(n)) return '—';
    return `${formatNumber(n, decimals)}%`;
}

/** Porcentaje con signo: 1.5 → "+1,50%". */
export function formatSignedPct(n, decimals = 2) {
    if (!Number.isFinite(n)) return '—';
    const rounded = Number(n.toFixed(decimals));
    const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
    return `${sign}${formatNumber(Math.abs(n), decimals)}%`;
}

/**
 * Convierte texto escrito por el usuario a número.
 * Acepta "1.234.567,89", "1234567.89", "7,5", "7.5".
 * Heurística: si hay coma, es el decimal y los puntos son miles.
 * Si solo hay puntos: un único punto seguido de 1–2 dígitos (o de 3+
 * dígitos cuando el entero es "0") es decimal; en otro caso son miles.
 */
export function parseLocaleNumber(value) {
    if (typeof value === 'number') return value;
    if (value == null) return NaN;
    let s = String(value).trim().replace(/\s|\$|%/g, '');
    if (!s) return NaN;
    const negative = s.startsWith('-');
    s = s.replace(/[^\d.,]/g, '');
    if (!s) return NaN;

    if (s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.').replace(/,/g, '');
    } else {
        const parts = s.split('.');
        if (parts.length === 2 && (parts[1].length !== 3 || parts[0] === '0' || parts[0] === '')) {
            // decimal con punto: "7.5", "0.125"
        } else {
            s = parts.join('');
        }
    }
    const n = parseFloat(s);
    return negative ? -n : n;
}

/**
 * Formatea mientras se escribe: agrega puntos de miles y conserva
 * la parte decimal (con coma) si `allowDecimals`.
 */
export function formatTyping(raw, { allowDecimals = false } = {}) {
    let s = String(raw).replace(allowDecimals ? /[^\d,]/g : /\D/g, '');
    let [intPart, ...rest] = s.split(',');
    intPart = intPart.replace(/^0+(?=\d)/, '');
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (allowDecimals && rest.length) return `${intPart},${rest.join('')}`;
    return intPart;
}

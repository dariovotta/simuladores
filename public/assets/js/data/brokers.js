// =========================================================
// DATOS DE BROKERS — tarifas publicadas para personas humanas
// operando online (web/app), vigentes a marzo 2026.
// Compartido por el Comparador de Comisiones y la Rotación de ONs.
// =========================================================

export const DATA_UPDATED = 'marzo 2026';

const LOGOS = 'assets/img/brokers/';

export const BROKERS = {
    cocos:      { name: 'Cocos Capital', logo: `${LOGOS}cocos.png` },
    iol:        { name: 'IOL',           logo: `${LOGOS}iol.png` },
    balanz:     { name: 'Balanz',        logo: `${LOGOS}balanz.webp` },
    bullmarket: { name: 'Bull Market',   logo: `${LOGOS}bullmarket.jpg` },
    ppi:        { name: 'PPI',           logo: `${LOGOS}ppi.jpeg` },
    rava:       { name: 'Rava Bursátil', logo: `${LOGOS}rava.jpg` },
    vetacap:    { name: 'Veta Cap',      logo: `${LOGOS}vetacap.png` },
    ecovalores: { name: 'Eco Valores',   logo: `${LOGOS}ecovalores.png` },
};

/**
 * Comisiones por categoría, en % sobre el monto operado.
 * `null` = el broker no ofrece el servicio / sin dato.
 *
 * Opciones por categoría:
 *  - tnaBrokers: brokers cuya tasa es TNA (se prorratea por días).
 *  - isFixed:    la tarifa es un monto fijo en ARS (no un %).
 *  - ivaExempt:  la operación está exenta de IVA.
 *  - marketFee:  derechos de mercado BYMA en %.
 */
export const CATEGORIES = {
    acciones: {
        label: 'Acciones',
        marketFee: 0.05, // Privados y fondos cerrados en acciones / CEDEAR: 0,0500%
        rates: { cocos: 0.45, iol: 0.50, balanz: 0.50, bullmarket: 0.50, ppi: 0.60, rava: 0.80, vetacap: 0.15, ecovalores: 0.33 },
    },
    cedears: {
        label: 'CEDEARs',
        marketFee: 0.05,
        rates: { cocos: 0.45, iol: 0.50, balanz: 0.50, bullmarket: 0.50, ppi: 0.60, rava: 0.80, vetacap: 0.15, ecovalores: 0.33 },
    },
    bonos_publicos: {
        label: 'Bonos Públicos',
        marketFee: 0.01, // Públicos: 0,0100%
        ivaExempt: true,
        rates: { cocos: 0.45, iol: 0.50, balanz: 0.50, bullmarket: 0.50, ppi: 0.60, rava: 0.80, vetacap: 0.15, ecovalores: 0.49 },
    },
    bonos_privados: {
        label: 'ONs / Bonos Privados',
        marketFee: 0.01, // Obligaciones Negociables: 0,0100%
        ivaExempt: true,
        rates: { cocos: 0.45, iol: 0.50, balanz: 0.50, bullmarket: 0.50, ppi: 0.60, rava: 0.80, vetacap: 0.15, ecovalores: 0.49 },
    },
    letras: {
        label: 'Letras',
        marketFee: 0.001, // Letras: 0,0010%
        ivaExempt: true,
        rates: { cocos: 1.50, iol: 0.20, balanz: 0.10, bullmarket: 0.25, ppi: 0.20, rava: 0.80, vetacap: 0.15, ecovalores: 0.49 },
        tnaBrokers: ['cocos'],
    },
    caucion_colocadora: {
        label: 'Cauciones (Colocadora)',
        marketFee: 0.18, // Administración de garantías: 0,045% cada 90 días → 0,18% anual
        rates: { cocos: 2.0, iol: 1.8, balanz: 2.0, bullmarket: 0.996, ppi: 2.0, rava: 5.4, vetacap: 1.5, ecovalores: 3.0 },
        tnaBrokers: ['cocos', 'iol', 'balanz', 'bullmarket', 'ppi', 'rava', 'vetacap', 'ecovalores'],
    },
    renta: {
        label: 'Renta (Cupones)',
        rates: { cocos: 0.25, iol: 0.10, balanz: 0.05, bullmarket: 1.00, ppi: 0.70, rava: 0.70, vetacap: 0, ecovalores: 1.00 },
    },
    dividendos: {
        label: 'Dividendos',
        rates: { cocos: 0.25, iol: 0.25, balanz: 1.00, bullmarket: 1.00, ppi: 1.00, rava: 1.00, vetacap: 0, ecovalores: 1.50 },
    },
    suscripcion_primaria: {
        label: 'Suscripción Primaria',
        rates: { cocos: 1.00, iol: 0.50, balanz: 0.50, bullmarket: 0.25, ppi: 1.50, rava: 1.00, vetacap: 0, ecovalores: null },
    },
    transferencia_titulos: {
        label: 'Transferencia de Títulos (Envío)',
        isFixed: true,
        rates: { cocos: 10000, iol: 750, balanz: null, bullmarket: 500, ppi: 100, rava: 0, vetacap: 0, ecovalores: 20000 },
    },
};

export const IVA = 0.21;

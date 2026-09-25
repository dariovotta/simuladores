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

/**
 * Planes diferenciales (tarifa plana o por volumen). Informativo:
 * el simulador usa siempre la tarifa estándar de cada broker.
 * `note` es un texto por contexto (comisiones / rotación).
 */
export const BROKER_PLANS = [
    {
        id: 'ieb',
        name: 'IEB+',
        logo: `${LOGOS}ieb.jpeg`,
        badge: 'Modelo Flat',
        background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
        note: {
            comisiones: 'IEB+ funciona con un modelo diferente: en lugar de cobrar comisiones por operación, cobra una <strong>tarifa fija mensual</strong>. Esto puede ser muy conveniente si operás con frecuencia.',
            rotacion: 'IEB+ cobra una tarifa fija mensual y no cobra comisiones por operación. Si rotás ONs seguido, el costo de cada rotación es $0 en comisiones (solo pagás derechos de mercado).',
        },
        tiers: [
            { name: 'Plan Rookie', price: 'Gratis', desc: 'FCI + Dólar MEP + Dólar CCL. Sin límites.' },
            { name: 'Plan Investor', price: '$5.000', priceSuffix: '+ IVA/mes', desc: 'Acciones + Bonos + CEDEARs + ONs + Letras. Sin comisión por operación, operá sin tope.' },
        ],
    },
    {
        id: 'iol',
        name: 'IOL',
        logo: `${LOGOS}iol.png`,
        badge: 'Planes Premium',
        background: 'linear-gradient(135deg, #6C3FEE 0%, #5028CC 100%)',
        note: {
            default: 'IOL ofrece planes con comisiones reducidas según tu volumen operado por mes. En el simulador usamos las comisiones del plan Gold (estándar).',
        },
        tiers: [
            { name: 'Gold*', price: '$0 — $7.5M', desc: 'Volumen operado x mes. Comisiones estándar.', background: 'linear-gradient(135deg, #C5A55A 0%, #A8893E 100%)' },
            { name: 'Platinum*', price: '$7.5M — $50M', desc: 'Volumen operado x mes. Comisiones reducidas.', background: 'linear-gradient(135deg, #9CA3AF 0%, #7B8290 100%)' },
            { name: 'Black*', price: '$50M+', desc: 'Volumen operado x mes. Las comisiones más bajas de IOL.', background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)' },
        ],
    },
    {
        id: 'vetacap',
        name: 'Veta Cap',
        logo: `${LOGOS}vetacap.png`,
        badge: 'Planes Flat',
        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        note: {
            comisiones: 'Veta Cap ofrece planes flat con tarifa fija mensual y comisión 0% en operaciones. En el simulador usamos las comisiones del plan Web (Persona Física).',
            rotacion: 'Veta Cap ofrece planes flat con tarifa fija mensual y comisión 0% en operaciones. Ideal si rotás ONs frecuentemente.',
        },
        tiers: [
            { name: '🟢 Flat Start', price: '$85 mil', desc: 'por mes + IVA. Descubierto: 150% valorizada, límite $80M.' },
            { name: '🟢 Flat Advance', price: '$160 mil', desc: 'por mes + IVA. Descubierto: 230% valorizada, límite $180M.' },
            { name: '🟢 Flat Elite', price: '$285 mil', desc: 'por mes + IVA. Descubierto: 320% valorizada, límite $500M.' },
        ],
    },
    {
        id: 'ecovalores',
        name: 'Eco Valores',
        logo: `${LOGOS}ecovalores.png`,
        badge: 'Club de los Millones',
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        note: {
            default: 'Eco Valores premia el volumen con descuentos automáticos. En el simulador usamos las comisiones estándar (sin club).',
        },
        tiers: [
            { name: 'Requisito', price: '$30M/semana', desc: 'Operá este monto semanal en 3+ días y accedé a descuentos automáticos.' },
            { name: 'Comisión con Club', price: 'Desde 0,13%', desc: 'En CEDEARs y acciones con Club + Intraday. Bonificación multi-especie incluida.' },
        ],
    },
];

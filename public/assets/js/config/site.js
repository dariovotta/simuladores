// =========================================================
// Configuración del sitio: marca y catálogo de simuladores.
// Es la única fuente para las tarjetas de la home y la
// navegación entre simuladores.
// =========================================================

export const BRAND = {
    name: 'MisFinanzas',
    tagline: 'Finanzas Personales · Inversiones · Economía',
    logo: 'assets/img/brand/logo.svg',
};

export const SIMULATORS = [
    {
        id: 'comisiones',
        path: 'comisiones/',
        icon: '💼',
        iconTone: 'blue',
        name: 'Comparador de Comisiones de Brokers',
        shortName: 'Comisiones',
        description: 'Compará las comisiones de 8 brokers argentinos para acciones, CEDEARs, bonos, ONs, letras, cauciones y más. Incluye IVA y derechos de mercado.',
    },
    {
        id: 'rotacion-ons',
        path: 'rotacion-ons/',
        icon: '🔄',
        iconTone: 'green',
        name: 'Simulador de Rotación de ONs',
        shortName: 'Rotación de ONs',
        description: 'Calculá si conviene vender una Obligación Negociable para comprar otra con mejor TIR. Te muestra cuántos meses tardás en recuperar el costo de las comisiones.',
    },
    {
        id: 'duration',
        path: 'duration/',
        icon: '📐',
        iconTone: 'purple',
        name: 'Duration y Sensibilidad de Bonos',
        shortName: 'Duration',
        description: 'Entendé cómo cambia el precio de un bono cuando se mueve la tasa. Slider interactivo, gráfico de curva precio/tasa y tabla de flujos detallada.',
    },
    {
        id: 'lecap',
        path: 'lecap/',
        icon: '📊',
        iconTone: 'orange',
        name: '¿Cuándo vender una LECAP?',
        shortName: 'LECAP',
        description: 'Simulá si te conviene vender una LECAP antes del vencimiento o esperar. Compará el rendimiento de mantener vs vender y reinvertir.',
    },
    {
        id: 'carry-trade',
        path: 'carry-trade/',
        icon: '💱',
        iconTone: 'red',
        name: 'Simulador de Carry Trade',
        shortName: 'Carry Trade',
        description: 'Calculá el rendimiento de un carry trade en Argentina. Simulá distintos escenarios de tipo de cambio y tasa para ver si conviene la estrategia.',
    },
];

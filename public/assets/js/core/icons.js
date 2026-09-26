// =========================================================
// Íconos de UI (estilo Lucide, viewBox 24, stroke currentColor).
// =========================================================
const PATHS = {
    moon: ['<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', 2],
    sun: ['<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 2],
    chevronDown: ['<path d="M6 9l6 6 6-6"/>', 2.5],
    chevronUp: ['<path d="M6 15l6-6 6 6"/>', 2.5],
    chevronRight: ['<path d="M9 6l6 6-6 6"/>', 2.5],
    check: ['<path d="M5 12l5 5 9-10"/>', 3.5],
    x: ['<path d="M6 6l12 12M18 6L6 18"/>', 3.5],
    minus: ['<path d="M6 12h12"/>', 3.5],
};

/** SVG inline de un ícono. */
export function icon(name, size = 18, className = '') {
    const [paths, stroke] = PATHS[name];
    return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

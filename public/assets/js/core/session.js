// =========================================================
// Sesión del usuario (la consulta se hace una sola vez por página).
// =========================================================
import { api } from './api.js';

let pending = null;

/** Usuario logueado ({ email }) o null si no hay sesión. */
export function getUser() {
    pending ??= api.me().then((data) => (data && data.email ? data : null)).catch(() => null);
    return pending;
}

/** Iniciales para el avatar: "dario.votta@..." → "DV". */
export function initials(email = '') {
    const local = email.split('@')[0] || '';
    const parts = local.split(/[._-]+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
    return letters.toUpperCase() || '?';
}

/** URL del login que vuelve a la página actual después de ingresar. */
export function loginUrl(root) {
    const next = location.pathname + location.search;
    return `${root}login/?next=${encodeURIComponent(next)}`;
}

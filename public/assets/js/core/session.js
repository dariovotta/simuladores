// =========================================================
// Sesión del usuario (la consulta se hace una sola vez por página).
// Para usar el sitio hace falta una cuenta: si no hay sesión, el
// layout muestra el popup de ingreso (ui/auth-gate.js).
// =========================================================
import { api } from './api.js';

/** Marca local "hay sesión": permite mostrar el popup sin esperar a la API. */
const FLAG = 'mf-auth';
const EVENT = 'mf:authchange';

let pending = null;

function saveFlag(user) {
    try {
        if (user) localStorage.setItem(FLAG, '1');
        else localStorage.removeItem(FLAG);
    } catch { /* sin storage */ }
}

/** true si la última vez que se consultó había sesión. */
export function hadSession() {
    try { return localStorage.getItem(FLAG) === '1'; } catch { return false; }
}

/** Usuario logueado ({ email }) o null si no hay sesión. */
export function getUser() {
    pending ??= api.me()
        .then((data) => (data && data.email ? data : null))
        .catch(() => null)
        .then((user) => { saveFlag(user); return user; });
    return pending;
}

/** Actualiza la sesión (al ingresar, salir o cuando vence) y avisa a la página. */
export function setUser(user) {
    pending = Promise.resolve(user);
    saveFlag(user);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: user }));
}

/** Escucha los cambios de sesión. */
export function onUserChange(fn) {
    window.addEventListener(EVENT, (e) => fn(e.detail));
}

/** Resuelve con el usuario apenas haya sesión (ya o después de ingresar). */
export function whenUser() {
    return getUser().then((user) => user || new Promise((resolve) => {
        const handler = (e) => {
            if (!e.detail) return;
            window.removeEventListener(EVENT, handler);
            resolve(e.detail);
        };
        window.addEventListener(EVENT, handler);
    }));
}

/** Iniciales para el avatar: "dario.votta@..." → "DV". */
export function initials(email = '') {
    const local = email.split('@')[0] || '';
    const parts = local.split(/[._-]+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
    return letters.toUpperCase() || '?';
}

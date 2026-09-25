// =========================================================
// Helpers de DOM mínimos.
// =========================================================

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Escapa texto para insertarlo de forma segura en templates HTML. */
export function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Muestra u oculta un elemento usando la clase utilitaria `.hidden`. */
export function toggle(el, visible) {
    el.classList.toggle('hidden', !visible);
}

/** Cambia el estado de un grupo de botones tipo toggle (aria-pressed). */
export function setPressed(buttons, activeButton) {
    buttons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn === activeButton)));
}

/** Plantilla reutilizable para el estado "sin datos". */
export function emptyState(icon, message) {
    return `<div class="empty-state"><div class="empty-state__icon">${icon}</div><p>${escapeHTML(message)}</p></div>`;
}

/** Medalla de ranking: 🥇🥈🥉 y luego número. */
export function rankBadge(index) {
    return ['🥇', '🥈', '🥉'][index] ?? `<span class="rank-badge">${index + 1}</span>`;
}

let toastTimer;
/** Muestra un mensaje temporal al pie de la pantalla. */
export function showToast(message, ms = 2500) {
    let toast = $('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), ms);
}

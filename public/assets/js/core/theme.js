// =========================================================
// Tema claro / oscuro.
// =========================================================
const EVENT = 'themechange';

export function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { /* sin storage */ }
    document.dispatchEvent(new CustomEvent(EVENT, { detail: { theme } }));
}

export function toggleTheme() {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

/** Ejecuta `callback` cada vez que cambia el tema (p. ej. para redibujar gráficos). */
export function onThemeChange(callback) {
    document.addEventListener(EVENT, callback);
}

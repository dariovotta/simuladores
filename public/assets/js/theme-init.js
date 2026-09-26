// =========================================================
// Tema inicial (script clásico, se carga en <head> sin defer
// para evitar el parpadeo). Usa la preferencia guardada o, si no
// hay, la del sistema operativo.
// =========================================================
(function () {
    var theme;
    try { theme = localStorage.getItem('theme'); } catch (e) { /* sin storage */ }
    if (theme !== 'light' && theme !== 'dark') {
        theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
}());

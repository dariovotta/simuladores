// =========================================================
// Se carga en <head> como script clásico (sin defer), antes del
// primer pintado, para evitar parpadeos:
// 1. Tema: preferencia guardada o, si no hay, la del sistema.
// 2. Dirección de la animación de entrada de la pantalla (como en
//    portfolio): adelante o atrás según el orden de las páginas.
// =========================================================
(function () {
    var root = document.documentElement;

    var theme;
    try { theme = localStorage.getItem('theme'); } catch (e) { /* sin storage */ }
    if (theme !== 'light' && theme !== 'dark') {
        theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', theme);

    // Orden de navegación: la home, las guardadas y los simuladores (mismo orden que el menú).
    var ORDER = ['', 'guardadas/', 'comisiones/', 'rotacion-ons/', 'duration/', 'lecap/', 'carry-trade/', 'cuotas/'];
    var KEY = 'mf-nav-index';
    // Página actual: último segmento de la ruta ("" en la home).
    var segs = location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean);
    var index = ORDER.indexOf(segs.length ? segs[segs.length - 1] + '/' : '');

    var enter = 'side';
    try {
        var prev = sessionStorage.getItem(KEY);
        if (prev !== null && index >= 0 && Number(prev) !== index) enter = index > Number(prev) ? 'fwd' : 'back';
        if (index >= 0) sessionStorage.setItem(KEY, String(index));
    } catch (e) { /* sin storage */ }

    function start() { root.setAttribute('data-enter', enter); }
    // Si la página se pre-renderizó (al pasar el mouse por un link), la animación arranca al mostrarse.
    if (document.prerendering) document.addEventListener('prerenderingchange', start, { once: true });
    else start();
}());

// =========================================================
// Layout compartido: header, navegación entre simuladores y footer.
// Cada página declara <body data-page="..."> y los contenedores
// [data-slot="header"] y [data-slot="footer"].
// =========================================================
import { BRAND, SIMULATORS } from '../config/site.js';
import { escapeHTML } from './dom.js';

/** URL raíz del sitio, calculada desde la ubicación de este módulo. */
export const ROOT_URL = new URL('../../../', import.meta.url);

/** Resuelve una ruta relativa a la raíz del sitio. */
export const siteUrl = (path = '') => new URL(path, ROOT_URL).href;

function renderHeader(currentId) {
    const current = SIMULATORS.find((s) => s.id === currentId);
    const nav = SIMULATORS.map((sim) => {
        const isCurrent = sim.id === currentId;
        return `<a class="sim-nav__link" href="${siteUrl(sim.path)}"${isCurrent ? ' aria-current="page"' : ''}>
            <span aria-hidden="true">${sim.icon}</span>${escapeHTML(sim.shortName)}
        </a>`;
    }).join('');

    return `
    <header class="site-header">
        <div class="container site-header__inner">
            <a class="brand" href="${siteUrl()}">
                <img class="brand__logo" src="${siteUrl(BRAND.logo)}" alt="" width="40" height="40">
                <span class="brand__text">
                    <span class="brand__name">${escapeHTML(BRAND.name)}</span>
                    <span class="brand__sub">${escapeHTML(BRAND.tagline)}</span>
                </span>
            </a>
            ${current ? `<span class="site-header__title">${escapeHTML(current.shortName)}</span>` : ''}
        </div>
    </header>
    ${current ? `
    <nav class="sim-nav" aria-label="Simuladores">
        <div class="container sim-nav__inner">
            <a class="sim-nav__link" href="${siteUrl()}"><span aria-hidden="true">🧰</span>Todos</a>
            ${nav}
        </div>
    </nav>` : ''}`;
}

function renderFooter() {
    const year = new Date().getFullYear();
    return `
    <footer class="site-footer">
        <p>Hecho con ❤️ por ${escapeHTML(BRAND.name)} · ${year}</p>
    </footer>`;
}

/** Inserta header y footer en los slots de la página. */
export function mountLayout() {
    const pageId = document.body.dataset.page;
    const header = document.querySelector('[data-slot="header"]');
    const footer = document.querySelector('[data-slot="footer"]');
    if (header) header.outerHTML = renderHeader(pageId);
    if (footer) footer.outerHTML = renderFooter();
}

// =========================================================
// Layout compartido: header (web y móvil) con navegación entre
// simuladores y botón de tema. Cada página declara
// <body data-page="..."> y el contenedor [data-slot="header"].
// =========================================================
import { BRAND, SIMULATORS } from '../config/site.js';
import { escapeHTML } from './dom.js';
import { icon } from './icons.js';
import { currentTheme, onThemeChange, toggleTheme } from './theme.js';

/** URL raíz del sitio, calculada desde la ubicación de este módulo. */
export const ROOT_URL = new URL('../../../', import.meta.url);

/** Resuelve una ruta relativa a la raíz del sitio. */
export const siteUrl = (path = '') => new URL(path, ROOT_URL).href;

const HOME = { id: 'home', path: '', shortName: 'Inicio' };

function tabs() {
    return [HOME, ...SIMULATORS];
}

function themeButton() {
    const isDark = currentTheme() === 'dark';
    return `<button type="button" class="theme-toggle" data-theme-toggle aria-label="${isDark ? 'Usar tema claro' : 'Usar tema oscuro'}">
        ${icon(isDark ? 'sun' : 'moon', 18)}
    </button>`;
}

function renderHeader(currentId) {
    const current = tabs().find((t) => t.id === currentId);
    const brandLogo = siteUrl(BRAND.logo);

    const webNav = tabs().map((t) => `
        <a class="topnav__link" href="${siteUrl(t.path)}"${t.id === currentId ? ' aria-current="page"' : ''}>${escapeHTML(t.shortName)}</a>`).join('');

    const mobileNav = tabs().map((t) => {
        const active = t.id === currentId;
        return `<a class="menu__link" href="${siteUrl(t.path)}"${active ? ' aria-current="page"' : ''}>
            ${escapeHTML(t.shortName)}${active ? icon('check', 16) : ''}
        </a>`;
    }).join('');

    return `
    <header class="topbar">
        <div class="topbar__inner">
            <a class="brand" href="${siteUrl()}">
                <img class="brand__logo" src="${brandLogo}" alt="" width="32" height="32">
                <span class="brand__text">
                    <span class="brand__name">${escapeHTML(BRAND.name)}</span>
                    <span class="brand__sub">${escapeHTML(BRAND.tagline)}</span>
                </span>
            </a>
            <nav class="topnav" aria-label="Simuladores">${webNav}</nav>
            ${current ? `<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="mobileMenu">
                <span>${escapeHTML(current.shortName)}</span>${icon('chevronDown', 16, 'menu-toggle__chevron')}
            </button>` : ''}
            <span data-theme-slot>${themeButton()}</span>
        </div>
        <nav class="menu" id="mobileMenu" aria-label="Simuladores" hidden>${mobileNav}</nav>
    </header>`;
}

function bindHeader() {
    const header = document.querySelector('.topbar');
    const toggle = header.querySelector('.menu-toggle');
    const menu = header.querySelector('.menu');

    const setOpen = (open) => {
        if (!toggle) return;
        toggle.setAttribute('aria-expanded', String(open));
        menu.hidden = !open;
        toggle.querySelector('.menu-toggle__chevron').outerHTML = icon(open ? 'chevronUp' : 'chevronDown', 16, 'menu-toggle__chevron');
    };

    toggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(menu.hidden);
    });
    document.addEventListener('click', (e) => {
        if (!menu.hidden && !menu.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.hidden) setOpen(false);
    });

    header.addEventListener('click', (e) => {
        if (e.target.closest('[data-theme-toggle]')) toggleTheme();
    });
    onThemeChange(() => {
        header.querySelector('[data-theme-slot]').innerHTML = themeButton();
    });
}

/** Inserta el header en la página. */
export function mountLayout() {
    const pageId = document.body.dataset.page;
    const slot = document.querySelector('[data-slot="header"]');
    if (!slot) return;
    slot.outerHTML = renderHeader(pageId);
    bindHeader();
}

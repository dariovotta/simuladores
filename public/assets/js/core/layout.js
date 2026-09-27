// =========================================================
// Layout compartido (igual que portfolio):
// - Web (≥1024px): topbar a todo el ancho con marca, pestañas y tema.
// - Móvil: header dentro de la pantalla. En la home, marca + tema;
//   en un simulador, volver + nombre con menú desplegable + tema.
// - Transición de entrada de la pantalla al cargar cada página.
// Cada página declara <body data-page="...">, el contenedor
// [data-slot="header"] y <main class="main screen">.
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
const TABS = [HOME, ...SIMULATORS];
const NAV_KEY = 'mf-nav-index';

function themeButton() {
    const isDark = currentTheme() === 'dark';
    return `<button type="button" class="icon-btn" data-theme-toggle aria-label="${isDark ? 'Usar tema claro' : 'Usar tema oscuro'}">
        ${icon(isDark ? 'sun' : 'moon', 18)}
    </button>`;
}

function brand(tag = 'a') {
    const attrs = tag === 'a' ? ` href="${siteUrl()}"` : '';
    return `<${tag} class="brand"${attrs}>
        <img class="brand__logo" src="${siteUrl(BRAND.logo)}" alt="" width="32" height="32">
        <span class="brand__name">${escapeHTML(BRAND.name)}</span>
    </${tag}>`;
}

function renderTopbar(currentId) {
    const tabs = TABS.map((t) => `
        <a class="tab" href="${siteUrl(t.path)}"${t.id === currentId ? ' aria-current="page"' : ''}>${escapeHTML(t.shortName)}</a>`).join('');
    return `
    <nav class="topbar only-web" aria-label="Simuladores">
        ${brand()}
        <div class="tabs">${tabs}</div>
        <div class="spacer"></div>
        <div class="header-actions" data-theme-slot>${themeButton()}</div>
    </nav>`;
}

function renderMobileHeader(currentId) {
    const current = SIMULATORS.find((s) => s.id === currentId);
    if (!current) {
        return `<header class="app-header only-mobile">
            ${brand('div')}
            <div class="header-actions" data-theme-slot>${themeButton()}</div>
        </header>`;
    }
    const items = TABS.map((t) => {
        const active = t.id === currentId;
        return `<a class="menu__link" href="${siteUrl(t.path)}"${active ? ' aria-current="page"' : ''}>
            <span>${escapeHTML(t.shortName)}</span>${active ? icon('check', 16) : ''}
        </a>`;
    }).join('');
    return `<header class="page-header only-mobile">
        <div class="page-header__left">
            <a class="icon-btn" href="${siteUrl()}" aria-label="Volver a los simuladores">${icon('back', 18)}</a>
            <button type="button" class="page-header__title" aria-expanded="false" aria-controls="mobileMenu">
                <span class="page-header__name"><span>${escapeHTML(current.shortName)}</span>${icon('chevronDown', 16)}</span>
                <span class="page-header__sub">Simuladores</span>
            </button>
        </div>
        <div class="header-actions" data-theme-slot>${themeButton()}</div>
        <nav class="menu" id="mobileMenu" aria-label="Simuladores" hidden>${items}</nav>
    </header>`;
}

function bindMobileMenu() {
    const toggle = document.querySelector('.page-header__title');
    const menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

    const setOpen = (open) => {
        toggle.setAttribute('aria-expanded', String(open));
        menu.hidden = !open;
        toggle.querySelector('.page-header__name .icon').outerHTML = icon(open ? 'chevronUp' : 'chevronDown', 16);
    };
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(menu.hidden);
    });
    document.addEventListener('click', (e) => {
        if (!menu.hidden && !menu.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.hidden) setOpen(false);
    });
}

function bindTheme() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-theme-toggle]')) toggleTheme();
    });
    onThemeChange(() => {
        document.querySelectorAll('[data-theme-slot]').forEach((slot) => { slot.innerHTML = themeButton(); });
    });
}

/**
 * Animación de entrada de la pantalla (como portfolio). En móvil entra desde
 * la derecha al avanzar y desde la izquierda al volver; en web, siempre sube.
 */
function playEnterTransition(screen, pageId) {
    const index = TABS.findIndex((t) => t.id === pageId);
    let previous = null;
    try {
        previous = sessionStorage.getItem(NAV_KEY);
        if (index >= 0) sessionStorage.setItem(NAV_KEY, String(index));
    } catch { /* sin storage */ }

    let direction = 'enter-side';
    if (previous !== null && index >= 0 && Number(previous) !== index) {
        direction = index > Number(previous) ? 'enter-fwd' : 'enter-back';
    }
    screen.classList.add(direction);
    // Chart.js toma el tamaño final del canvas cuando termina la animación.
    screen.addEventListener('animationend', (e) => {
        if (e.target === screen) window.dispatchEvent(new Event('resize'));
    }, { once: true });
}

/** Inserta el header (web y móvil) y dispara la transición de entrada. */
export function mountLayout() {
    const pageId = document.body.dataset.page;
    const slot = document.querySelector('[data-slot="header"]');
    if (slot) slot.outerHTML = renderTopbar(pageId);

    const screen = document.querySelector('.screen');
    if (screen) {
        screen.insertAdjacentHTML('afterbegin', renderMobileHeader(pageId));
        playEnterTransition(screen, pageId);
    }
    bindMobileMenu();
    bindTheme();
}

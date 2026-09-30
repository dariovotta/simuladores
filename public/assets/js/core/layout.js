// =========================================================
// Layout compartido (igual que portfolio):
// - Web (≥1024px): topbar a todo el ancho con marca, pestañas (con
//   indicador que se desliza entre páginas, como MisCompras), cuenta y tema.
// - Móvil: header dentro de la pantalla. En la home, marca + cuenta +
//   tema; en las demás páginas, volver + nombre con menú + cuenta + tema.
// - Web: botón de volver al lado del título en las páginas internas.
// - Sin sesión se muestra el popup de ingreso (hace falta una cuenta).
// Cada página declara <body data-page="...">, el contenedor
// [data-slot="header"] y <main class="main screen">.
// =========================================================
import { BRAND, SIMULATORS } from '../config/site.js';
import { escapeHTML } from './dom.js';
import { icon } from './icons.js';
import { currentTheme, onThemeChange, toggleTheme } from './theme.js';
import { api } from './api.js';
import { getUser, hadSession, initials, onUserChange, setUser } from './session.js';
import { closeAuthGate, openAuthGate } from '../ui/auth-gate.js';

/** URL raíz del sitio, calculada desde la ubicación de este módulo. */
export const ROOT_URL = new URL('../../../', import.meta.url);

/** Resuelve una ruta relativa a la raíz del sitio. */
export const siteUrl = (path = '') => new URL(path, ROOT_URL).href;

const HOME = { id: 'home', path: '', shortName: 'Inicio' };
const TABS = [HOME, ...SIMULATORS];
/** Páginas internas que no son simuladores (header móvil con volver). */
const EXTRA_PAGES = {
    guardadas: 'Guardadas',
};
const INDICATOR_KEY = 'mf-tab-indicator';

// ---------- Piezas ----------
function themeButton() {
    const isDark = currentTheme() === 'dark';
    return `<button type="button" class="icon-btn" data-theme-toggle aria-label="${isDark ? 'Usar tema claro' : 'Usar tema oscuro'}">
        ${icon(isDark ? 'sun' : 'moon', 18)}
    </button>`;
}

function headerActions() {
    return `<div class="header-actions">
        <span class="theme-slot" data-theme-slot>${themeButton()}</span>
        <span class="account-slot" data-account-slot></span>
    </div>`;
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
        <a class="tab" href="${siteUrl(t.path)}" data-tab="${t.id}"${t.id === currentId ? ' aria-current="page"' : ''}>${escapeHTML(t.shortName)}</a>`).join('');
    return `
    <nav class="topbar only-web" aria-label="Simuladores">
        ${brand()}
        <div class="tabs">${tabs}<span class="tab-indicator" aria-hidden="true"></span></div>
        <div class="spacer"></div>
        ${headerActions()}
    </nav>`;
}

function renderMobileHeader(currentId) {
    if (currentId === 'home') {
        return `<header class="app-header only-mobile">${brand('div')}${headerActions()}</header>`;
    }
    const sim = SIMULATORS.find((s) => s.id === currentId);
    const title = sim ? sim.shortName : (EXTRA_PAGES[currentId] ?? '');
    const items = TABS.map((t) => {
        const active = t.id === currentId;
        return `<a class="menu__link" href="${siteUrl(t.path)}"${active ? ' aria-current="page"' : ''}>
            <span>${escapeHTML(t.shortName)}</span>${active ? icon('check', 16) : ''}
        </a>`;
    }).join('');
    return `<header class="page-header only-mobile">
        <div class="page-header__left">
            <a class="icon-btn" href="${siteUrl()}" aria-label="Volver al inicio">${icon('back', 18)}</a>
            <button type="button" class="page-header__title" aria-expanded="false" aria-controls="mobileMenu">
                <span class="page-header__name"><span>${escapeHTML(title)}</span>${icon('chevronDown', 16)}</span>
                <span class="page-header__sub">Simuladores</span>
            </button>
        </div>
        ${headerActions()}
        <nav class="menu" id="mobileMenu" aria-label="Simuladores" hidden>${items}</nav>
    </header>`;
}

/** En web, flecha de volver al lado del título (como en portfolio). */
function addBackButton(pageId) {
    const head = document.querySelector('.page-head');
    if (!head || pageId === 'home') return;
    head.classList.add('page-head--back');
    head.insertAdjacentHTML('afterbegin',
        `<a class="icon-btn page-head__back only-web" href="${siteUrl()}" aria-label="Volver al inicio">${icon('back', 18)}</a>`);
}

// ---------- Indicador de la pestaña activa ----------
function readRect() {
    try { return JSON.parse(sessionStorage.getItem(INDICATOR_KEY)); } catch { return null; }
}
function saveRect(rect) {
    try { sessionStorage.setItem(INDICATOR_KEY, JSON.stringify(rect)); } catch { /* sin storage */ }
}

/**
 * Desliza el indicador verde desde la pestaña de la página anterior hasta la
 * actual (MisCompras hace lo mismo al cambiar de pestaña).
 */
function mountTabIndicator() {
    const tabs = document.querySelector('.topbar .tabs');
    const indicator = tabs?.querySelector('.tab-indicator');
    if (!indicator) return;
    const active = tabs.querySelector('.tab[aria-current="page"]');
    const measure = () => (active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    const place = (rect) => {
        indicator.style.opacity = rect ? '1' : '0';
        if (rect) {
            indicator.style.left = `${rect.left}px`;
            indicator.style.width = `${rect.width}px`;
        }
    };

    // Arranca donde estaba en la página anterior, sin transición.
    const from = readRect();
    const to = measure();
    place(from ?? to);
    if (to) saveRect(to);

    let ready = false;
    const slide = () => requestAnimationFrame(() => requestAnimationFrame(() => {
        ready = true;
        indicator.classList.add('is-animated');
        place(measure());
    }));
    if (document.prerendering) document.addEventListener('prerenderingchange', slide, { once: true });
    else slide();

    // Si cambian las fuentes o el ancho de las pestañas, se reubica (después de arrancar).
    const sync = () => {
        if (!ready) return;
        const rect = measure();
        place(rect);
        if (rect) saveRect(rect);
    };
    document.fonts?.ready.then(() => { const rect = measure(); if (rect) saveRect(rect); sync(); }).catch(() => {});
    new ResizeObserver(sync).observe(tabs);

    // En páginas sin pestaña activa (guardadas) no hay desde dónde deslizar.
    if (!active) saveRect(null);
}

// ---------- Menú móvil ----------
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

// ---------- Cuenta ----------
function accountLoggedIn(user) {
    return `<div class="account">
        <button type="button" class="avatar" data-account-toggle aria-haspopup="menu" aria-expanded="false" title="${escapeHTML(user.email)}">${escapeHTML(initials(user.email))}</button>
        <div class="account-menu" role="menu" hidden>
            <div class="account-menu__email">${escapeHTML(user.email)}</div>
            <button type="button" class="account-menu__item account-menu__item--danger" role="menuitem" data-logout>${icon('logout', 16)}Cerrar sesión</button>
        </div>
    </div>`;
}

function renderAccount(user) {
    document.querySelectorAll('[data-account-slot]').forEach((slot) => {
        slot.innerHTML = user ? accountLoggedIn(user) : '';
    });
    if (user) closeAuthGate();
    else openAuthGate();
}

/** Confirmación antes de salir (como la hoja "Tu cuenta" de portfolio). */
function confirmLogout() {
    let dialog = document.getElementById('logoutDialog');
    if (!dialog) {
        document.body.insertAdjacentHTML('beforeend', `<dialog class="dialog dialog--sheet" id="logoutDialog" aria-labelledby="logoutTitle">
            <div class="dialog__body">
                <span class="dialog__handle" aria-hidden="true"></span>
                <div class="dialog__head">
                    <h2 class="dialog__title" id="logoutTitle">Cerrar sesión</h2>
                    <p class="dialog__sub">¿Seguro que querés cerrar la sesión?</p>
                </div>
                <div class="dialog__actions">
                    <button type="button" class="btn btn--outline" data-logout-cancel>Cancelar</button>
                    <button type="button" class="btn btn--danger" data-logout-confirm>Cerrar sesión</button>
                </div>
            </div>
        </dialog>`);
        dialog = document.getElementById('logoutDialog');
        dialog.querySelector('[data-logout-cancel]').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (e) => { if (e.target === dialog && !dialog.dataset.busy) dialog.close(); });
        dialog.addEventListener('cancel', (e) => { if (dialog.dataset.busy) e.preventDefault(); });
        dialog.querySelector('[data-logout-confirm]').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            dialog.dataset.busy = '1';
            btn.disabled = true;
            dialog.querySelector('[data-logout-cancel]').disabled = true;
            btn.textContent = 'Cerrando…';
            await api.logout().catch(() => {});
            dialog.close();
            setUser(null);
            location.replace(siteUrl());
        });
    }
    delete dialog.dataset.busy;
    const ok = dialog.querySelector('[data-logout-confirm]');
    ok.disabled = false;
    ok.textContent = 'Cerrar sesión';
    dialog.querySelector('[data-logout-cancel]').disabled = false;
    dialog.showModal();
}

async function mountAccount() {
    // Si la última vez no había sesión, el popup aparece ya, sin esperar a la API.
    if (!hadSession()) openAuthGate();
    renderAccount(await getUser());
    onUserChange(renderAccount);
    // Sesión vencida en medio de la visita.
    window.addEventListener('mf:unauthorized', () => setUser(null));

    const closeAll = () => document.querySelectorAll('.account-menu').forEach((m) => {
        m.hidden = true;
        m.previousElementSibling?.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', async (e) => {
        const toggle = e.target.closest('[data-account-toggle]');
        if (toggle) {
            const menu = toggle.nextElementSibling;
            const open = menu.hidden;
            closeAll();
            menu.hidden = !open;
            toggle.setAttribute('aria-expanded', String(open));
            return;
        }
        if (e.target.closest('[data-logout]')) {
            closeAll();
            confirmLogout();
            return;
        }
        if (!e.target.closest('.account-menu')) closeAll();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
}

// ---------- Tema ----------
function bindTheme() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-theme-toggle]')) toggleTheme();
    });
    onThemeChange(() => {
        document.querySelectorAll('[data-theme-slot]').forEach((slot) => { slot.innerHTML = themeButton(); });
    });
}

/** Inserta el header (web y móvil), el botón de volver y la cuenta. */
export function mountLayout() {
    const pageId = document.body.dataset.page;
    const slot = document.querySelector('[data-slot="header"]');
    if (slot) slot.outerHTML = renderTopbar(pageId);

    const screen = document.querySelector('.screen');
    if (screen) {
        screen.insertAdjacentHTML('afterbegin', renderMobileHeader(pageId));
        // Chart.js toma el tamaño final del canvas cuando termina la animación de entrada.
        screen.addEventListener('animationend', (e) => {
            if (e.target === screen) window.dispatchEvent(new Event('resize'));
        }, { once: true });
    }
    addBackButton(pageId);
    mountTabIndicator();
    bindMobileMenu();
    bindTheme();
    mountAccount();
}

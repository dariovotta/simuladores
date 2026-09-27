// =========================================================
// PÁGINA: Ingreso y registro. Al terminar vuelve a ?next= (o al inicio).
// =========================================================
import { mountLayout, siteUrl } from '../core/layout.js';
import { $, $$, setPressed, toggle } from '../core/dom.js';
import { api } from '../core/api.js';
import { getUser } from '../core/session.js';

const COPY = {
    login: { title: 'Ingresá a tu cuenta', btn: 'Ingresar', auto: 'current-password' },
    register: { title: 'Creá tu cuenta', btn: 'Crear cuenta', auto: 'new-password' },
};
let mode = 'login';

/** Solo se vuelve a rutas del mismo sitio. */
function nextUrl() {
    const next = new URLSearchParams(location.search).get('next') || '';
    return next.startsWith('/') && !next.startsWith('//') ? next : siteUrl();
}

function setMode(next) {
    mode = next;
    const c = COPY[mode];
    $('#authTitle').textContent = c.title;
    $('#authSubmit').textContent = c.btn;
    $('#password').autocomplete = c.auto;
    $('#authError').textContent = '';
    toggle($('#passwordHint'), mode === 'register');
    const buttons = $$('[data-mode]');
    setPressed(buttons, buttons.find((b) => b.dataset.mode === mode));
}

function init() {
    mountLayout();
    $$('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

    $('#authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('#email').value.trim();
        const password = $('#password').value;
        const err = $('#authError');
        if (!email || !password) {
            err.textContent = 'Completá email y contraseña';
            return;
        }
        if (mode === 'register' && password.length < 8) {
            err.textContent = 'La contraseña tiene que tener al menos 8 caracteres';
            return;
        }
        const btn = $('#authSubmit');
        btn.disabled = true;
        btn.textContent = 'Un momento…';
        try {
            await (mode === 'login' ? api.login(email, password) : api.register(email, password));
            location.replace(nextUrl());
        } catch (ex) {
            err.textContent = ex.message;
            btn.disabled = false;
            btn.textContent = COPY[mode].btn;
        }
    });

    // Si ya hay sesión, vuelve directo.
    getUser().then((user) => { if (user) location.replace(nextUrl()); });
}

init();

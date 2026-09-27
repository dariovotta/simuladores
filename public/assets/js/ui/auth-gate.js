// =========================================================
// Popup de ingreso: para usar el sitio hace falta una cuenta.
// Se muestra sobre cualquier página cuando no hay sesión y no se
// puede cerrar hasta ingresar o crear la cuenta. Por defecto abre
// en "Ingresar".
// =========================================================
import { BRAND } from '../config/site.js';
import { api } from '../core/api.js';
import { setUser } from '../core/session.js';
import { escapeHTML, setPressed } from '../core/dom.js';

const ROOT = new URL('../../../', import.meta.url);

const COPY = {
    login: { title: 'Ingresá a tu cuenta', btn: 'Ingresar', auto: 'current-password' },
    register: { title: 'Creá tu cuenta', btn: 'Crear cuenta', auto: 'new-password' },
};

let dialog = null;
let mode = 'login';
let open = false;

function html() {
    return `<dialog class="dialog auth-gate" id="authGate" aria-labelledby="authTitle">
        <form class="dialog__body auth-gate__body" id="authForm" novalidate>
            <div class="auth-gate__brand">
                <img src="${new URL(BRAND.logo, ROOT).href}" alt="" width="40" height="40">
                <span>${escapeHTML(BRAND.name)}</span>
            </div>
            <h2 class="dialog__title auth-gate__title" id="authTitle">${COPY.login.title}</h2>
            <div class="segmented auth-gate__seg" role="group" aria-label="Modo">
                <button type="button" class="segmented__btn" data-mode="login" aria-pressed="true">Ingresar</button>
                <button type="button" class="segmented__btn" data-mode="register" aria-pressed="false">Crear cuenta</button>
            </div>
            <div class="field">
                <label class="field__label" for="authEmail">Email</label>
                <input class="input" id="authEmail" name="email" type="email" autocomplete="email" required autofocus>
            </div>
            <div class="field">
                <label class="field__label" for="authPassword">Contraseña</label>
                <input class="input" id="authPassword" name="password" type="password" autocomplete="current-password" required>
            </div>
            <p class="dialog__error" id="authError" role="alert"></p>
            <button class="btn btn--primary auth-gate__submit" id="authSubmit" type="submit">${COPY.login.btn}</button>
        </form>
    </dialog>`;
}

const q = (sel) => dialog.querySelector(sel);

function setMode(next) {
    mode = next;
    const c = COPY[mode];
    q('#authTitle').textContent = c.title;
    q('#authSubmit').textContent = c.btn;
    q('#authPassword').autocomplete = c.auto;
    q('#authError').textContent = '';
    const buttons = [...dialog.querySelectorAll('[data-mode]')];
    setPressed(buttons, buttons.find((b) => b.dataset.mode === mode));
}

async function submit(e) {
    e.preventDefault();
    const email = q('#authEmail').value.trim();
    const password = q('#authPassword').value;
    const err = q('#authError');
    if (!email || !password) {
        err.textContent = 'Completá email y contraseña';
        return;
    }
    if (mode === 'register' && password.length < 8) {
        err.textContent = 'La contraseña tiene que tener al menos 8 caracteres';
        return;
    }
    const btn = q('#authSubmit');
    btn.disabled = true;
    btn.textContent = 'Un momento…';
    try {
        const user = await (mode === 'login' ? api.login(email, password) : api.register(email, password));
        closeAuthGate();
        setUser({ email: user.email });
    } catch (ex) {
        err.textContent = ex.message;
    } finally {
        btn.disabled = false;
        btn.textContent = COPY[mode].btn;
    }
}

function build() {
    document.body.insertAdjacentHTML('beforeend', html());
    dialog = document.getElementById('authGate');
    dialog.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    dialog.addEventListener('submit', submit);
    // No se puede cerrar con Escape: si el navegador lo cierra igual, se vuelve a abrir.
    dialog.addEventListener('cancel', (e) => e.preventDefault());
    dialog.addEventListener('close', () => { if (open) dialog.showModal(); });
}

/** Abre el popup (si ya está abierto no hace nada). */
export function openAuthGate() {
    if (!dialog) build();
    if (open) return;
    open = true;
    setMode('login');
    q('#authPassword').value = '';
    document.documentElement.classList.add('is-gated');
    dialog.showModal();
    q('#authEmail').focus();
}

/** Cierra el popup después de ingresar. */
export function closeAuthGate() {
    if (!dialog || !open) return;
    open = false;
    document.documentElement.classList.remove('is-gated');
    dialog.close();
}

// =========================================================
// PÁGINA: Simulaciones guardadas del usuario.
// =========================================================
import { mountLayout, siteUrl } from '../core/layout.js';
import { $, escapeHTML, showToast } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { api } from '../core/api.js';
import { whenUser } from '../core/session.js';
import { SIMULATORS, simulatorById } from '../config/site.js';

const list = () => $('#savedList');

/** "27/09/2026, 16:45" en hora local. */
function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderEmpty(message, action = '') {
    list().innerHTML = `<section class="card saved-empty"><p>${message}</p>${action}</section>`;
}

function render(items) {
    if (!items.length) {
        renderEmpty('Todavía no guardaste simulaciones. Usá cualquier simulador y tocá <strong>Guardar simulación</strong>.',
            `<a class="btn btn--primary" href="${siteUrl()}">Ir a los simuladores</a>`);
        return;
    }
    list().innerHTML = `<div class="saved-list">${items.map((s) => {
        const sim = simulatorById(s.simulator) ?? { name: s.simulator, path: '', icon: SIMULATORS[0].icon };
        return `<div class="saved-item" data-id="${s.id}">
            <a class="saved-item__open" href="${siteUrl(sim.path)}?sim=${encodeURIComponent(s.id)}">
                <span class="saved-item__tile" aria-hidden="true"><span class="saved-item__icon" style="--icon: url('${siteUrl(sim.icon)}')"></span></span>
                <span class="saved-item__text">
                    <span class="saved-item__name">${escapeHTML(s.name)}</span>
                    <span class="saved-item__meta">${escapeHTML(sim.name)}, ${escapeHTML(formatDate(s.createdAt))}</span>
                </span>
                <span class="saved-item__go">${icon('chevronRight', 18)}</span>
            </a>
            <button type="button" class="icon-btn saved-item__delete" data-delete aria-label="Borrar ${escapeHTML(s.name)}">${icon('trash', 18)}</button>
        </div>`;
    }).join('')}</div>`;
}

async function init() {
    mountLayout();
    list().innerHTML = '<p class="empty-state">Cargando…</p>';
    // Sin sesión, la lista se carga después de ingresar en el popup.
    await whenUser();
    let items = [];
    try {
        ({ simulations: items } = await api.listSimulations());
        render(items);
    } catch (err) {
        renderEmpty(escapeHTML(err.message));
    }

    list().addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-delete]');
        if (!btn) return;
        const row = btn.closest('[data-id]');
        const item = items.find((s) => String(s.id) === row.dataset.id);
        if (!item || !confirm(`¿Borrar "${item.name}"?`)) return;
        btn.disabled = true;
        try {
            await api.deleteSimulation(item.id);
            items = items.filter((s) => s !== item);
            render(items);
            showToast('Simulación borrada');
        } catch (err) {
            btn.disabled = false;
            showToast(err.message);
        }
    });
}

init();

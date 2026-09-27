// =========================================================
// Guardar y abrir simulaciones.
// Cada simulador indica cómo leer sus valores (getParams), cómo
// cargarlos (applyParams) y si ya hay algo para guardar (canSave).
// - Botón "Guardar simulación" junto al título (se habilita cuando
//   el simulador ya se usó). Pide un nombre único.
// - Si la URL trae ?sim=<id>, carga esa simulación guardada.
// =========================================================
import { api } from '../core/api.js';
import { getUser, loginUrl } from '../core/session.js';
import { $, showToast } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { ROOT_URL } from '../core/layout.js';

function dialogHTML() {
    return `<dialog class="dialog" id="saveDialog" aria-labelledby="saveDialogTitle">
        <form class="dialog__body" method="dialog" novalidate>
            <h2 class="dialog__title" id="saveDialogTitle">Guardar simulación</h2>
            <p class="dialog__text">Ponele un nombre para encontrarla después. Tiene que ser distinto al de tus otras simulaciones.</p>
            <div class="field">
                <label class="field__label" for="saveName">Nombre</label>
                <input class="input" id="saveName" type="text" maxlength="60" autocomplete="off" placeholder="Ej: Compra heladera">
            </div>
            <p class="dialog__error" id="saveError" role="alert"></p>
            <div class="dialog__actions">
                <button type="button" class="btn btn--ghost" data-dialog-cancel>Cancelar</button>
                <button type="submit" class="btn btn--primary" id="saveSubmit">Guardar</button>
            </div>
        </form>
    </dialog>`;
}

/**
 * @param {object} cfg
 * @param {string} cfg.simulator            id del simulador (config/site.js)
 * @param {() => object} cfg.getParams      valores de entrada actuales
 * @param {(p: object) => void} cfg.applyParams  carga valores guardados y recalcula
 * @param {() => boolean} cfg.canSave       true cuando el simulador ya tiene un resultado
 */
export function mountSaveSimulation({ simulator, getParams, applyParams, canSave }) {
    const head = $('.page-head');
    head.classList.add('page-head--actions');
    head.insertAdjacentHTML('beforeend', `<div class="page-head__actions">
        <span class="page-head__loaded hidden" id="loadedSim"></span>
        <button type="button" class="btn btn--ghost btn--sm" id="saveSimBtn" disabled>${icon('bookmark', 16)}Guardar simulación</button>
    </div>`);
    document.body.insertAdjacentHTML('beforeend', dialogHTML());

    const btn = $('#saveSimBtn');
    const dialog = $('#saveDialog');
    const nameInput = $('#saveName');
    const error = $('#saveError');
    const submit = $('#saveSubmit');

    // El botón se habilita cuando el simulador ya se usó.
    let scheduled = false;
    const refresh = () => {
        scheduled = false;
        btn.disabled = !canSave();
    };
    const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(refresh);
    };
    ['input', 'change', 'click', 'submit', 'reset'].forEach((type) => document.addEventListener(type, schedule, true));
    refresh();

    btn.addEventListener('click', async () => {
        const user = await getUser();
        if (!user) {
            location.href = loginUrl(ROOT_URL.href);
            return;
        }
        error.textContent = '';
        nameInput.value = '';
        dialog.showModal();
        nameInput.focus();
    });

    dialog.querySelector('[data-dialog-cancel]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        if (!name) {
            error.textContent = 'Ponele un nombre a la simulación';
            nameInput.focus();
            return;
        }
        submit.disabled = true;
        submit.textContent = 'Guardando…';
        try {
            await api.saveSimulation(simulator, name, getParams());
            dialog.close();
            showLoaded(name);
            showToast('Simulación guardada');
        } catch (err) {
            error.textContent = err.message;
            nameInput.focus();
        } finally {
            submit.disabled = false;
            submit.textContent = 'Guardar';
        }
    });

    function showLoaded(name) {
        const label = $('#loadedSim');
        label.textContent = name;
        label.title = `Simulación guardada: ${name}`;
        label.classList.remove('hidden');
    }

    // Abrir una simulación guardada: ?sim=<id>
    const id = new URLSearchParams(location.search).get('sim');
    if (id) {
        (async () => {
            const user = await getUser();
            if (!user) {
                location.href = loginUrl(ROOT_URL.href);
                return;
            }
            try {
                const sim = await api.getSimulation(id);
                if (sim.simulator !== simulator) throw new Error('Esa simulación es de otro simulador');
                applyParams(sim.params);
                showLoaded(sim.name);
                refresh();
                showToast(`Abriste "${sim.name}"`);
            } catch (err) {
                showToast(err.message || 'No se pudo abrir la simulación');
            }
        })();
    }
}

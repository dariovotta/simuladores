// =========================================================
// Popup de confirmación con el diseño del sitio (reemplaza al
// confirm() del navegador). Devuelve una promesa: true si se
// confirma, false si se cancela o se cierra.
// =========================================================
import { escapeHTML } from '../core/dom.js';

/**
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.text]
 * @param {string} [opts.confirmLabel]
 * @param {boolean} [opts.danger]   botón de confirmar en rojo
 */
export function confirmDialog({ title, text = '', confirmLabel = 'Aceptar', danger = false }) {
    document.body.insertAdjacentHTML('beforeend', `<dialog class="dialog" aria-labelledby="confirmTitle" data-confirm-dialog>
        <div class="dialog__body">
            <h2 class="dialog__title" id="confirmTitle">${escapeHTML(title)}</h2>
            ${text ? `<p class="dialog__text">${escapeHTML(text)}</p>` : ''}
            <div class="dialog__actions">
                <button type="button" class="btn btn--ghost" data-confirm-cancel>Cancelar</button>
                <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-confirm-ok>${escapeHTML(confirmLabel)}</button>
            </div>
        </div>
    </dialog>`);
    const dialog = document.body.lastElementChild;

    return new Promise((resolve) => {
        let result = false;
        dialog.querySelector('[data-confirm-ok]').addEventListener('click', () => { result = true; dialog.close(); });
        dialog.querySelector('[data-confirm-cancel]').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
        dialog.addEventListener('close', () => {
            dialog.remove();
            resolve(result);
        });
        dialog.showModal();
        dialog.querySelector('[data-confirm-cancel]').focus();
    });
}

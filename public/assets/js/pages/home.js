// =========================================================
// HOME: genera las tarjetas de simuladores desde la config.
// =========================================================
import { SIMULATORS } from '../config/site.js';
import { mountLayout } from '../core/layout.js';
import { escapeHTML } from '../core/dom.js';

mountLayout();

document.getElementById('simGrid').innerHTML = SIMULATORS.map((sim, i) => `
    <a class="sim-card animate-in" href="${sim.path}" style="animation-delay:${i * 60}ms">
        <div class="sim-card__icon icon-${sim.iconTone}" aria-hidden="true">${sim.icon}</div>
        <div class="sim-card__body">
            <h3 class="sim-card__name">${escapeHTML(sim.name)}</h3>
            <p class="sim-card__desc">${escapeHTML(sim.description)}</p>
        </div>
        <span class="sim-card__arrow" aria-hidden="true">→</span>
    </a>`).join('');

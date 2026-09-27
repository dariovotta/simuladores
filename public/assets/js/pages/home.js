// =========================================================
// HOME: genera las tarjetas de simuladores desde la config.
// =========================================================
import { SIMULATORS } from '../config/site.js';
import { mountLayout, siteUrl } from '../core/layout.js';
import { escapeHTML } from '../core/dom.js';
import { icon } from '../core/icons.js';

mountLayout();

document.getElementById('simGrid').innerHTML = SIMULATORS.map((sim) => `
    <a class="sim-card" href="${sim.path}">
        <span class="sim-card__tile" aria-hidden="true">
            <span class="sim-card__icon" style="--icon: url('${siteUrl(sim.icon)}')"></span>
        </span>
        <span class="sim-card__name">${escapeHTML(sim.name)}</span>
        <span class="sim-card__go"><span class="sim-card__ver">Ver</span>${icon('chevronRight', 20)}</span>
    </a>`).join('');

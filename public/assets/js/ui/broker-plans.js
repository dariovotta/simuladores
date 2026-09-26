// =========================================================
// Tarjetas informativas de planes diferenciales de brokers.
// =========================================================
import { BROKER_PLANS } from '../data/brokers.js';
import { siteUrl } from '../core/layout.js';
import { escapeHTML } from '../core/dom.js';

function tierHTML(tier) {
    const suffix = tier.priceSuffix ? ` <small>${escapeHTML(tier.priceSuffix)}</small>` : '';
    return `<div class="plan-tier">
        <div class="plan-tier__name">${escapeHTML(tier.name)}</div>
        <div class="plan-tier__price">${escapeHTML(tier.price)}${suffix}</div>
        <div class="plan-tier__desc">${escapeHTML(tier.desc)}</div>
    </div>`;
}

/**
 * Renderiza las tarjetas de planes dentro de `container`.
 * `context` elige el texto descriptivo ('comisiones' | 'rotacion').
 */
export function renderBrokerPlans(container, context) {
    container.innerHTML = BROKER_PLANS.map((plan) => `
        <article class="plan-card">
            <div class="plan-card__head">
                <img class="plan-card__logo" src="${siteUrl(plan.logo)}" alt="" width="40" height="40" loading="lazy">
                <h3 class="plan-card__name">${escapeHTML(plan.name)}</h3>
                <span class="plan-card__badge">${escapeHTML(plan.badge)}</span>
            </div>
            <p class="plan-card__desc">${plan.note[context] ?? plan.note.default}</p>
            <div class="plan-card__tiers">${plan.tiers.map(tierHTML).join('')}</div>
        </article>`).join('');
}

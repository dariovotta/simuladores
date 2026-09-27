/**
 * Worker de Simuladores: sirve la API /api/* (los estáticos los sirve [assets]).
 * Misma arquitectura que MisInversiones: sesiones con cookie y datos en D1.
 */
import { json, HttpError, assertSameOrigin } from './http.js';
import { requireUser } from './auth.js';
import { register, login, logout, me } from './routes/auth.js';
import { listSimulations, getSimulation, createSimulation, deleteSimulation } from './routes/simulations.js';

/** [método, patrón, handler, requiere sesión] */
const ROUTES = [
  ['POST', /^\/api\/auth\/register$/, register, false],
  ['POST', /^\/api\/auth\/login$/, login, false],
  ['POST', /^\/api\/auth\/logout$/, logout, false],
  ['GET', /^\/api\/auth\/me$/, me, false],
  ['GET', /^\/api\/simulations$/, listSimulations, true],
  ['POST', /^\/api\/simulations$/, createSimulation, true],
  ['GET', /^\/api\/simulations\/(\d{1,12})$/, getSimulation, true],
  ['DELETE', /^\/api\/simulations\/(\d{1,12})$/, deleteSimulation, true],
];

async function handleApi(request, env) {
  const { pathname } = new URL(request.url);
  const path = decodeURIComponent(pathname);
  for (const [method, re, handler, auth] of ROUTES) {
    const m = path.match(re);
    if (!m || request.method !== method) continue;
    assertSameOrigin(request);
    const user = auth ? await requireUser(env, request) : null;
    return auth ? handler(request, env, user, ...m.slice(1)) : handler(request, env);
  }
  throw new HttpError(404, 'Ruta inexistente');
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await handleApi(request, env);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'Error inesperado, probá de nuevo' }, 500);
    }
  },

  // Limpieza diaria de sesiones vencidas.
  async scheduled(event, env) {
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(Date.now()).run();
  },
};

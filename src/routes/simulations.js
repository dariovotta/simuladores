/** Simulaciones guardadas: cada usuario guarda los valores de entrada de un simulador con un nombre único. */
import { json, readJson, HttpError } from '../http.js';

export const SIMULATORS = ['comisiones', 'rotacion-ons', 'duration', 'lecap', 'carry-trade', 'cuotas'];
const MAX_NAME = 60;
const MAX_PARAMS = 10000; // bytes del JSON de parámetros

function parseBody(body) {
  const simulator = String(body.simulator || '');
  const name = String(body.name || '').trim().replace(/\s+/g, ' ');
  const params = body.params;
  if (!SIMULATORS.includes(simulator)) throw new HttpError(400, 'Simulador desconocido');
  if (!name) throw new HttpError(400, 'Ponele un nombre a la simulación');
  if (name.length > MAX_NAME) throw new HttpError(400, `El nombre puede tener hasta ${MAX_NAME} caracteres`);
  if (!params || typeof params !== 'object' || Array.isArray(params)) throw new HttpError(400, 'Faltan los datos de la simulación');
  const text = JSON.stringify(params);
  if (text.length > MAX_PARAMS) throw new HttpError(400, 'La simulación tiene demasiados datos');
  return { simulator, name, params: text };
}

const toItem = (row) => ({
  id: row.id,
  simulator: row.simulator,
  name: row.name,
  createdAt: row.created_at.replace(' ', 'T') + 'Z',
  ...(row.params !== undefined ? { params: JSON.parse(row.params) } : {}),
});

export async function listSimulations(request, env, user) {
  const { results } = await env.DB.prepare(
    'SELECT id, simulator, name, created_at FROM simulations WHERE user_id = ? ORDER BY created_at DESC, id DESC'
  ).bind(user.id).all();
  return json({ simulations: results.map(toItem) });
}

export async function getSimulation(request, env, user, id) {
  const row = await env.DB.prepare(
    'SELECT id, simulator, name, params, created_at FROM simulations WHERE id = ? AND user_id = ?'
  ).bind(Number(id), user.id).first();
  if (!row) throw new HttpError(404, 'No encontramos esa simulación');
  return json(toItem(row));
}

export async function createSimulation(request, env, user) {
  const { simulator, name, params } = parseBody(await readJson(request));
  const taken = await env.DB.prepare('SELECT id FROM simulations WHERE user_id = ? AND name = ? COLLATE NOCASE')
    .bind(user.id, name).first();
  if (taken) throw new HttpError(409, 'Ya tenés una simulación con ese nombre. Elegí otro.');
  let res;
  try {
    res = await env.DB.prepare('INSERT INTO simulations (user_id, simulator, name, params) VALUES (?, ?, ?, ?)')
      .bind(user.id, simulator, name, params).run();
  } catch (err) {
    // Dos guardados simultáneos con el mismo nombre: lo frena la restricción UNIQUE.
    if (String(err.message).includes('UNIQUE')) throw new HttpError(409, 'Ya tenés una simulación con ese nombre. Elegí otro.');
    throw err;
  }
  const row = await env.DB.prepare('SELECT id, simulator, name, created_at FROM simulations WHERE id = ?')
    .bind(res.meta.last_row_id).first();
  return json(toItem(row), 201);
}

export async function deleteSimulation(request, env, user, id) {
  const res = await env.DB.prepare('DELETE FROM simulations WHERE id = ? AND user_id = ?').bind(Number(id), user.id).run();
  if (!res.meta.changes) throw new HttpError(404, 'No encontramos esa simulación');
  return json({ ok: true });
}

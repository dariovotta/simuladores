import { json, readJson, HttpError } from '../http.js';
import { hashPassword, verifyPassword, createSession, sessionCookie, currentUser, destroySession } from '../auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function credentials(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!EMAIL_RE.test(email) || email.length > 200) throw new HttpError(400, 'Ingresá un email válido');
  if (password.length < 8) throw new HttpError(400, 'La contraseña tiene que tener al menos 8 caracteres');
  if (password.length > 200) throw new HttpError(400, 'La contraseña es demasiado larga');
  return { email, password };
}

function withSession(request, token, data) {
  return json(data, 200, { 'set-cookie': sessionCookie(request, token) });
}

export async function register(request, env) {
  const { email, password } = credentials(await readJson(request));
  const exists = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (exists) throw new HttpError(409, 'Ya existe una cuenta con ese email');
  const { hash, salt } = await hashPassword(password);
  const res = await env.DB.prepare('INSERT INTO users (email, pass_hash, salt) VALUES (?, ?, ?)').bind(email, hash, salt).run();
  const token = await createSession(env, res.meta.last_row_id);
  return withSession(request, token, { email });
}

export async function login(request, env) {
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const user = await env.DB.prepare('SELECT id, email, pass_hash, salt FROM users WHERE email = ?').bind(email).first();
  // Si el usuario no existe igual se calcula un hash para no revelar qué emails están registrados.
  const ok = user ? await verifyPassword(password, user.pass_hash, user.salt) : (await hashPassword(password), false);
  if (!ok) throw new HttpError(401, 'Email o contraseña incorrectos');
  const token = await createSession(env, user.id);
  return withSession(request, token, { email: user.email });
}

export async function logout(request, env) {
  await destroySession(env, request);
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request, null) });
}

/** Sesión actual. Sin sesión responde { email: null } (no es un error: el sitio se usa sin cuenta). */
export async function me(request, env) {
  const user = await currentUser(env, request);
  return json({ email: user ? user.email : null });
}

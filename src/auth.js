/**
 * Autenticación (igual que MisInversiones): contraseñas con PBKDF2-SHA256 (WebCrypto) y sesiones en D1.
 * La cookie guarda un token aleatorio; en la base solo queda su SHA-256.
 */
import { HttpError } from './http.js';

const ITERATIONS = 100000; // máximo que admite PBKDF2 en Workers
const SESSION_DAYS = 30;
const COOKIE = 'sid';

const enc = new TextEncoder();

export function toHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  return new Uint8Array(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function hashPassword(password, saltHex) {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return { hash: toHex(bits), salt: toHex(salt) };
}

/** Comparación en tiempo constante de dos strings hex del mismo largo. */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password, hash, salt) {
  const res = await hashPassword(password, salt);
  return safeEqual(res.hash, hash);
}

async function sha256(text) {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

export async function createSession(env, userId) {
  const token = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const expires = Date.now() + SESSION_DAYS * 86400e3;
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, expires).run();
  return token;
}

export function sessionCookie(request, token) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  const maxAge = token ? SESSION_DAYS * 86400 : 0;
  return `${COOKIE}=${token || ''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function readToken(request) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}

/** Usuario de la sesión actual o null. */
export async function currentUser(env, request) {
  const token = readToken(request);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`
  ).bind(await sha256(token), Date.now()).first();
  return row || null;
}

export async function requireUser(env, request) {
  const user = await currentUser(env, request);
  if (!user) throw new HttpError(401, 'Tenés que iniciar sesión');
  return user;
}

export async function destroySession(env, request) {
  const token = readToken(request);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
}

export async function purgeExpiredSessions(env) {
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(Date.now()).run();
}

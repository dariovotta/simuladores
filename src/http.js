/** Helpers HTTP comunes del Worker. */

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'El cuerpo del pedido no es JSON válido');
  }
}

/**
 * Protección CSRF: los pedidos que modifican datos tienen que venir del mismo origen
 * y con content-type JSON (un formulario de otro sitio no puede mandar ninguna de las dos cosas).
 */
export function assertSameOrigin(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return;
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, 'Origen no permitido');
  const type = request.headers.get('content-type') || '';
  if (request.method !== 'DELETE' && !type.includes('application/json')) {
    throw new HttpError(415, 'Se espera application/json');
  }
}

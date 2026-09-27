// =========================================================
// Cliente de la API del Worker (mismo origen, cookie de sesión).
// =========================================================

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

async function request(method, path, body) {
    const opts = { method, headers: {}, credentials: 'same-origin' };
    if (body !== undefined) {
        opts.headers['content-type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    let res;
    try {
        res = await fetch(path, opts);
    } catch {
        throw new ApiError(0, 'No hay conexión. Probá de nuevo.');
    }
    const data = await res.json().catch(() => ({}));
    // Sesión vencida: el layout vuelve a pedir el ingreso.
    if (res.status === 401 && !path.startsWith('/api/auth/')) window.dispatchEvent(new Event('mf:unauthorized'));
    if (!res.ok) throw new ApiError(res.status, data.error || 'Error inesperado');
    return data;
}

export const api = {
    me: () => request('GET', '/api/auth/me'),
    login: (email, password) => request('POST', '/api/auth/login', { email, password }),
    register: (email, password) => request('POST', '/api/auth/register', { email, password }),
    logout: () => request('POST', '/api/auth/logout', {}),
    listSimulations: () => request('GET', '/api/simulations'),
    getSimulation: (id) => request('GET', `/api/simulations/${encodeURIComponent(id)}`),
    saveSimulation: (simulator, name, params) => request('POST', '/api/simulations', { simulator, name, params }),
    deleteSimulation: (id) => request('DELETE', `/api/simulations/${encodeURIComponent(id)}`),
};

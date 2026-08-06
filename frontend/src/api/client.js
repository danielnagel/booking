import router from '../router';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * fetch wrapper with `credentials: 'include'` (httpOnly JWT cookie) and
 * centralized 401 handling: on an expired/missing session, redirects to
 * `/login`.
 */
async function request(path, { method = 'GET', body, params, headers } = {}) {
  let url = `${API_BASE}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, value);
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    // `/auth/me` is used to check whether a session already exists (e.g. on
    // every navigation, see router/index.js); a 401 there just means "not
    // logged in yet" and is handled by the caller (authStore.fetchCurrentUser),
    // not a session that expired mid-use, so it must not force a redirect -
    // otherwise visiting a public route like /login, /registrieren or
    // /passwort-zuruecksetzen without a session cookie would race with the
    // navigation that's already in progress.
    if (path !== '/auth/me' && router.currentRoute.value.path !== '/login') {
      router.push('/login');
    }
    throw new ApiError('Nicht angemeldet', 401, null);
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    throw new ApiError(data?.error || data?.message || 'Unbekannter Fehler', response.status, data);
  }

  return data;
}

export const apiClient = {
  get: (path, params) => request(path, { method: 'GET', params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export { ApiError };

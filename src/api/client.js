import { env } from '../config/env';
import { ApiError, SESSION_EXPIRED_CODES } from './errors';
import { session } from './session';

let onSessionExpired = () => {};
/** AuthContext registers a callback here so the client can end the session on a 401. */
export function setSessionExpiredHandler(fn) { onSessionExpired = fn; }

function buildUrl(path, params) {
  const url = new URL(env.apiUrl + (path.startsWith('/') ? path : `/${path}`));
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

async function parse(res) {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

async function send(path, { method = 'GET', body, params, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && session.token) headers.Authorization = `Bearer ${session.token}`;

  let res;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new ApiError({ code: 'NETWORK_ERROR', message: 'Network request failed' });
  }

  const data = await parse(res);
  if (res.ok) return data;

  const err = data?.error || {};
  throw new ApiError({
    status: res.status,
    code: err.code || (res.status === 401 ? 'UNAUTHENTICATED' : 'UNKNOWN'),
    message: err.message || res.statusText,
    details: err.details || [],
  });
}

// Optional refresh support. Only active when VITE_AUTH_REFRESH_PATH is set AND the
// login response included a refreshToken. Concurrent 401s share one refresh call.
let refreshing = null;
async function tryRefresh() {
  const rt = session.refreshToken;
  if (!env.refreshPath || !rt) return false;
  if (!refreshing) {
    refreshing = send(env.refreshPath, { method: 'POST', body: { refreshToken: rt }, auth: false })
      .then((data) => {
        if (!data?.token) return false;
        session.write({ token: data.token, refreshToken: data.refreshToken || rt });
        return true;
      })
      .catch(() => false)
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

export async function request(path, options = {}) {
  try {
    return await send(path, options);
  } catch (err) {
    const expired = err instanceof ApiError && err.status === 401 && SESSION_EXPIRED_CODES.includes(err.code);
    if (expired && options.auth !== false) {
      if (!options._retried && (await tryRefresh())) {
        return request(path, { ...options, _retried: true });
      }
      onSessionExpired();
    }
    throw err;
  }
}

export const api = {
  get: (path, params, opts) => request(path, { ...opts, params }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

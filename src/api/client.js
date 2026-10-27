import { env } from '../config/env';
import { ApiError, SESSION_EXPIRED_CODES } from './errors';
import { session } from './session';

let onSessionExpired = () => {};
/** AuthContext registers a callback here so the client can end the session on a 401. */
export function setSessionExpiredHandler(fn) { onSessionExpired = fn; }

// The backend keeps the refresh token in an httpOnly cookie. It requires this header on the
// cookie-based endpoints (/auth/refresh, /auth/logout) to block cross-site request forgery.
export const CLIENT_HEADER = { 'X-BizPulse-Client': 'web' };

/** A fresh key per attempt to create a sale. Reuse the SAME key only when retrying the same request. */
export const newIdempotencyKey = () =>
  (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`);

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

async function send(path, { method = 'GET', body, params, auth = true, signal, headers: extraHeaders, idempotencyKey } = {}) {
  const headers = { Accept: 'application/json', ...extraHeaders };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && session.token) headers.Authorization = `Bearer ${session.token}`;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let res;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      // Needed so the browser stores and sends the refresh-token cookie
      credentials: 'include',
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

// Silent refresh. Concurrent callers share one request, and the Web Locks API (where available)
// stops two browser tabs from refreshing at the same moment. The server rotates the refresh
// token on every call, so two parallel refreshes could otherwise look like token theft.
let refreshing = null;
const withLock = (fn) => (typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('bizpulse-refresh', fn) : fn());

/** POST /auth/refresh -> { token, user, business }. Stores the new access token in memory. */
export function refreshSession() {
  if (!refreshing) {
    refreshing = withLock(() => send('/auth/refresh', { method: 'POST', auth: false, headers: CLIENT_HEADER }))
      .then((data) => {
        if (!data?.token) {
          throw new ApiError({ status: 401, code: 'INVALID_REFRESH_TOKEN', message: 'No token returned' });
        }
        session.setToken(data.token);
        return data;
      })
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
      // The 15-minute access token ran out: get a new one and repeat the request once.
      // A retried sale keeps its Idempotency-Key, so it cannot be recorded twice.
      if (!options._retried) {
        const refreshed = await refreshSession().then(() => true, () => false);
        if (refreshed) return request(path, { ...options, _retried: true });
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

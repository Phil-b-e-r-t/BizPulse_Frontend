import { api, refreshSession, CLIENT_HEADER } from './client';

// POST /auth/register -> 201 { token, user, business } (+ refresh cookie)
export const register = (payload) => api.post('/auth/register', payload, { auth: false });
// POST /auth/login -> { token, user, business } (+ refresh cookie)
export const login = (payload) => api.post('/auth/login', payload, { auth: false });
// POST /auth/refresh -> { token, user, business }. Uses the httpOnly cookie. Restores a session after a reload.
export const refresh = refreshSession;
// POST /auth/logout -> 204. Ends this device's login on the server and clears the cookie.
export const logout = () => api.post('/auth/logout', undefined, { auth: false, headers: CLIENT_HEADER });
// POST /auth/logout-all -> 204. Ends every device's login.
export const logoutAll = () => api.post('/auth/logout-all');
// GET /auth/me -> { user, business }
export const getMe = () => api.get('/auth/me');

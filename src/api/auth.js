import { api } from './client';

// POST /auth/register -> 201 { token, user, business }
export const register = (payload) => api.post('/auth/register', payload, { auth: false });
// POST /auth/login -> { token, user, business }
export const login = (payload) => api.post('/auth/login', payload, { auth: false });
// GET /auth/me -> { user, business }
export const getMe = () => api.get('/auth/me');

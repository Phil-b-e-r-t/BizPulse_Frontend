import { api } from './client';

export const getInviteDetails = (token, options) => api.get('/invites/token', { token }, { ...options, auth: false });
export const acceptInvite = (payload) => api.post('/invites/accept', payload, { auth: false });
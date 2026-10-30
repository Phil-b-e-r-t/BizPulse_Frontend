import { api } from './client';

export const listTeamMembers = () => api.get('/team/members');
export const listTeamInvites = () => api.get('/team/invites');
export const updateTeamMember = (id, changes) => api.patch(`/team/members/${id}`, changes);
export const createTeamInvite = (invite) => api.post('/team/invites', invite);
export const resendTeamInvite = (id) => api.post(`/team/invites/${id}/resend`);
export const cancelTeamInvite = (id) => api.delete(`/team/invites/${id}`);
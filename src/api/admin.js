import { api } from './client';

// Super admin API. THESE ENDPOINTS DO NOT EXIST IN THE BACKEND YET: this file is the contract the backend must implement.
// Every route is under /admin and must be enforced server-side for role "superadmin" (never trust the UI).
// List endpoints take page, limit, search + filters and return { items, pagination: { page, limit, total, totalPages } }.

// Overview
export const getOverview = () => api.get('/admin/overview');

// Sessions
export const listSessions = (p) => api.get('/admin/sessions', p);
export const terminateSession = (id, reason) => api.post(`/admin/sessions/${id}/terminate`, { reason });
export const terminateUserSessions = (userId, reason) => api.post(`/admin/users/${userId}/sessions/terminate`, { reason });
export const terminateClientSessions = (clientId, reason) => api.post(`/admin/clients/${clientId}/sessions/terminate`, { reason });

// Accounts. kind = 'client' (business) | 'user' (individual person)
export const listAccounts = (kind, p) => api.get(`/admin/${kind}s`, p);
export const getAccount = (kind, id) => api.get(`/admin/${kind}s/${id}`);
export const setAccountStatus = (kind, id, action, reason) => api.post(`/admin/${kind}s/${id}/${action}`, { reason }); // suspend | restore | lock | unlock

// Subscription plans and subscriptions
export const listPlans = () => api.get('/admin/plans');
export const savePlan = (plan) => (plan.id ? api.patch(`/admin/plans/${plan.id}`, plan) : api.post('/admin/plans', plan));
export const listSubscriptions = (p) => api.get('/admin/subscriptions', p);
export const saveSubscription = (sub) => (sub.id ? api.patch(`/admin/subscriptions/${sub.id}`, sub) : api.post('/admin/subscriptions', sub));

// Invoices
export const listInvoices = (p) => api.get('/admin/invoices', p);
export const createInvoice = (inv) => api.post('/admin/invoices', inv);
export const markInvoicePaid = (id, body) => api.post(`/admin/invoices/${id}/pay`, body);
export const voidInvoice = (id, reason) => api.post(`/admin/invoices/${id}/void`, { reason });

// Audit log (read-only: there is deliberately no update or delete endpoint)
export const listAudit = (p) => api.get('/admin/audit-log', p);
export const listAuditActions = () => api.get('/admin/audit-log/actions');

// System settings
export const getSettings = () => api.get('/admin/settings');
export const updateSettings = (body) => api.patch('/admin/settings', body);

// Financial reports and report center. All figures come from database records on the server.
export const getFinancials = (p) => api.get('/admin/finance/summary', p);
export const generateReport = (category, p) => api.get(`/admin/reports/${category}`, p);

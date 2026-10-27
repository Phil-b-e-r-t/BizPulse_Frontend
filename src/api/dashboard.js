import { api } from './client';

// GET /dashboard/summary?range=day|week|month
export const getDashboardSummary = (range = 'week') => api.get('/dashboard/summary', { range });

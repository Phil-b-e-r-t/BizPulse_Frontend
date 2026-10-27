import { api } from './client';

// GET /transactions?type=&channel=&status=&from=&to=&page=&limit=  -> { items, pagination }
export const listTransactions = (params = {}) => api.get('/transactions', params);

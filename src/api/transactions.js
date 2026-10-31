import { api } from './client';

// GET /transactions?type=&channel=&status=&from=&to=&page=&limit=  -> { items, pagination }
export const listTransactions = (params = {}) => api.get('/transactions', params);

export const voidTransaction = (id) => api.post(`/transactions/${id}/void`);

// Reuse the same idempotency key when retrying an unchanged sale.
export const createTransaction = (sale, idempotencyKey) => api.post('/transactions', sale, { idempotencyKey });

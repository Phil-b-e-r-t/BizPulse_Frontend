import { api } from './client';

// GET /products?search=&lowStock=true&page=&limit=  -> { items, pagination }
export const listProducts = (params = {}) => api.get('/products', params);

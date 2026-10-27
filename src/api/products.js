import { api } from './client';

// GET /products?search=&lowStock=true&page=&limit=  -> { items, pagination }
export const listProducts = (params = {}) => api.get('/products', params);
export const createProduct = (product) => api.post('/products', product);
export const updateProduct = (id, product) => api.patch(`/products/${id}`, product);
export const adjustProductStock = (id, adjustment, reason) => api.post(`/products/${id}/stock`, { adjustment, reason });

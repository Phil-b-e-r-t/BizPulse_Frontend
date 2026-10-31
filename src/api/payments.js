import { api } from './client';

export const getSubscription = () => api.get('/payments/subscription');
export const initializePayment = (plan) => api.post('/payments/initialize', { plan });
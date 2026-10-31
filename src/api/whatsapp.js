import { api } from './client';

// GET /whatsapp/status -> { connected, account }
export const getWhatsAppStatus = () => api.get('/whatsapp/status');
// GET /whatsapp/senders -> { items: [{ id, phone, role, label, userId, createdAt }] }
export const listSenders = () => api.get('/whatsapp/senders');
export const connectWhatsApp = (credentials) => api.post('/whatsapp/connect', credentials);
export const addSender = (sender) => api.post('/whatsapp/senders', sender);
export const removeSender = (id) => api.delete(`/whatsapp/senders/${id}`);

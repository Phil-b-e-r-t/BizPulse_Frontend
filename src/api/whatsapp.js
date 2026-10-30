import { api } from './client';

// GET /whatsapp/status -> { connected, account }
export const getWhatsAppStatus = () => api.get('/whatsapp/status');
// GET /whatsapp/senders -> { items: [{ id, phone, role, label, userId, createdAt }] }
export const listSenders = () => api.get('/whatsapp/senders');
// GET /whatsapp/messages?page=&limit= -> { items, pagination }
export const listWhatsAppMessages = (params = {}) => api.get('/whatsapp/messages', params);

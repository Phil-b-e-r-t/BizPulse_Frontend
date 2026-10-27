import { api } from './client';

// GET /whatsapp/status -> { connected, account }
export const getWhatsAppStatus = () => api.get('/whatsapp/status');
// GET /whatsapp/senders -> { items: [{ id, phone, role, label, userId, createdAt }] }
export const listSenders = () => api.get('/whatsapp/senders');

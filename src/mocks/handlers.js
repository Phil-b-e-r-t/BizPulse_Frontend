import { http, HttpResponse } from 'msw';
import { env } from '../config/env';
import { DEMO_LOGIN, demoBusiness, demoUser, products, sampleSummary, sampleTransactions } from './sampleData';

// SAMPLE DATA ONLY. Demo login: demo@bizpulse.test / demo12345 (populated business).
// Any new registration gets an EMPTY business so you can see the empty states and onboarding checklist.
const base = env.apiUrl;
const err = (status, code, message, details = []) => HttpResponse.json({ error: { code, message, details } }, { status });

// Stands in for the httpOnly refresh cookie: who is "logged in" survives a reload (until sign out or the tab closes).
const MOCK_KEY = 'bizpulse.mock.session';
const MOCK_INVITE_TOKEN = 'demo-invite-token';
const loadSaved = () => { try { return JSON.parse(sessionStorage.getItem(MOCK_KEY)); } catch { return null; } };
const save = (value) => {
  try {
    if (value) sessionStorage.setItem(MOCK_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(MOCK_KEY);
  } catch { /* storage unavailable */ }
};

let current = loadSaved() ?? { user: demoUser, business: demoBusiness, empty: false };
const tokenFor = (u) => `mock.${u.id}`;

const authed = (request) => request.headers.get('Authorization') === `Bearer ${tokenFor(current.user)}`;
const guard = (fn) => (ctx) => (authed(ctx.request) ? fn(ctx) : err(401, 'INVALID_TOKEN', 'Invalid or expired token'));

export const handlers = [
  http.post(`${base}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json();
    if (email === DEMO_LOGIN.email && password === DEMO_LOGIN.password) {
      current = { user: demoUser, business: demoBusiness, empty: false };
      save(current);
      return HttpResponse.json({ token: tokenFor(demoUser), user: demoUser, business: demoBusiness });
    }
    return err(401, 'INVALID_CREDENTIALS', 'Wrong email or password');
  }),

  http.post(`${base}/auth/register`, async ({ request }) => {
    const b = await request.json();
    if (b.email === DEMO_LOGIN.email) return err(409, 'EMAIL_TAKEN', 'Email already registered');
    if (!b.password || b.password.length < 8) return err(422, 'VALIDATION_ERROR', 'Invalid input', [{ path: 'password', message: 'Password must be at least 8 characters' }]);
    const business = { id: 'biz_new', name: b.businessName, phone: b.phone || null, currency: 'UGX', timezone: 'Africa/Kampala', plan: 'free' };
    const user = { id: 'usr_new', name: b.ownerName, email: b.email, role: 'owner', businessId: 'biz_new', emailVerified: false };
    current = { user, business, empty: true };
    save(current);
    return HttpResponse.json({ token: tokenFor(user), user, business }, { status: 201 });
  }),

  // Silent refresh: succeeds while the "cookie" (saved session) exists
  http.post(`${base}/auth/refresh`, () => {
    const saved = loadSaved();
    if (!saved) return err(401, 'INVALID_REFRESH_TOKEN', 'Session expired, please log in again');
    current = saved;
    return HttpResponse.json({ token: tokenFor(current.user), user: current.user, business: current.business });
  }),

  http.post(`${base}/auth/logout`, () => {
    save(null);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${base}/auth/logout-all`, () => {
    save(null);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${base}/auth/me`, guard(() => HttpResponse.json({ user: current.user, business: current.business }))),

  http.get(`${base}/invites/token`, ({ request }) => {
    const token = new URL(request.url).searchParams.get('token');
    if (token !== MOCK_INVITE_TOKEN) return err(400, 'INVITE_INVALID', 'Invitation is invalid');
    return HttpResponse.json({ email: 'newstaff@bizpulse.test', role: 'staff', businessName: demoBusiness.name });
  }),

  http.post(`${base}/invites/accept`, async ({ request }) => {
    const payload = await request.json();
    if (payload.token !== MOCK_INVITE_TOKEN) return err(400, 'INVITE_INVALID', 'Invitation is invalid');
    if (payload.email === DEMO_LOGIN.email) return err(409, 'EMAIL_TAKEN', 'An account already exists with this email');
    const user = {
      id: 'usr_invited',
      name: payload.name || 'New team member',
      email: 'newstaff@bizpulse.test',
      role: 'staff',
      businessId: demoBusiness.id,
      emailVerified: false,
    };
    current = { user, business: demoBusiness, empty: false };
    save(current);
    return HttpResponse.json({ token: tokenFor(user), user, business: demoBusiness });
  }),

  http.get(`${base}/dashboard/summary`, guard(({ request }) => {
    const range = new URL(request.url).searchParams.get('range') || 'week';
    return HttpResponse.json(sampleSummary(range, current.empty));
  })),

  http.get(`${base}/transactions`, guard(({ request }) => {
    const limit = Number(new URL(request.url).searchParams.get('limit')) || 20;
    const all = sampleTransactions(current.empty);
    return HttpResponse.json({ items: all.slice(0, limit), pagination: { page: 1, limit, total: all.length, totalPages: 1 } });
  })),

  http.get(`${base}/products`, guard(({ request }) => {
    const q = new URL(request.url).searchParams;
    let items = current.empty ? [] : products;
    if (q.get('lowStock') === 'true') items = items.filter((p) => p.lowStock);
    const limit = Number(q.get('limit')) || 20;
    return HttpResponse.json({ items: items.slice(0, limit), pagination: { page: 1, limit, total: items.length, totalPages: 1 } });
  })),

  http.get(`${base}/whatsapp/status`, guard(() => HttpResponse.json({ connected: false, account: null }))),
  http.get(`${base}/whatsapp/senders`, guard(() => HttpResponse.json({ items: [] }))),
];

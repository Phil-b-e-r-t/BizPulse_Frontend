import { http, HttpResponse } from 'msw';
import { env } from '../config/env';
import { audit, clients, invoices, plans, sessions, settings, subscriptions, users } from './adminData';

// SAMPLE BEHAVIOUR ONLY. The real server must enforce all of this (role checks, validation, transactions, audit writes).
const base = `${env.apiUrl}/admin`;
const err = (status, code, message, details = []) => HttpResponse.json({ error: { code, message, details } }, { status });
const isAdmin = (req) => req.headers.get('Authorization') === 'Bearer mock.usr_admin';
const guard = (fn) => (ctx) => (isAdmin(ctx.request) ? fn(ctx) : err(401, 'INVALID_TOKEN', 'Invalid or expired token'));
const q = (req) => Object.fromEntries(new URL(req.url).searchParams);
const page = (all, p) => {
  const limit = Math.min(Number(p.limit) || 15, 100); const pg = Math.max(Number(p.page) || 1, 1);
  return { items: all.slice((pg - 1) * limit, pg * limit), pagination: { page: pg, limit, total: all.length, totalPages: Math.max(Math.ceil(all.length / limit), 1) } };
};
const has = (text, s) => !s || String(text || '').toLowerCase().includes(String(s).toLowerCase());
const inRange = (iso, from, to) => (!from || iso >= from) && (!to || iso <= `${to}T23:59:59.999Z`);
const logAudit = (action, resource, accountId, details) => {
  const c = clients.find((x) => x.id === accountId);
  audit.unshift({ id: `aud_${Date.now()}_${audit.length}`, at: new Date().toISOString(), action, actor: 'Super Admin', actorId: 'usr_admin', accountId: accountId || null, accountName: c?.name || '—', resource, details: details || '—', ip: '127.0.0.1' });
};
const refreshOverdue = () => invoices.forEach((i) => { if (i.status === 'unpaid' && new Date(i.dueDate) < new Date()) i.status = 'overdue'; });

const sum = (a, f = (x) => x) => a.reduce((t, x) => t + f(x), 0);
function financials(p) {
  refreshOverdue();
  const paid = invoices.filter((i) => i.status === 'paid' && inRange(i.paidAt, p.from, p.to));
  const issued = invoices.filter((i) => i.status !== 'void' && inRange(i.issuedAt, p.from, p.to));
  const open = invoices.filter((i) => ['unpaid', 'overdue'].includes(i.status));
  const byMonth = {}; paid.forEach((i) => { const k = i.paidAt.slice(0, 7); byMonth[k] = (byMonth[k] || 0) + i.amount; });
  const byPlan = {}; paid.forEach((i) => { byPlan[i.planName] = (byPlan[i.planName] || 0) + i.amount; });
  const count = (s) => subscriptions.filter((x) => x.status === s).length;
  return {
    totals: { revenue: sum(paid, (i) => i.amount), paymentsReceived: paid.length, billed: sum(issued, (i) => i.amount), outstanding: sum(open, (i) => i.amount), outstandingCount: open.length,
      paidInvoices: invoices.filter((i) => i.status === 'paid').length, unpaidInvoices: open.length, overdueInvoices: invoices.filter((i) => i.status === 'overdue').length },
    subscriptions: { active: count('active'), expired: count('expired'), pending: count('pending'), cancelled: count('cancelled') },
    revenueByMonth: Object.keys(byMonth).sort().map((month) => ({ month, revenue: byMonth[month] })),
    revenueByPlan: Object.keys(byPlan).map((plan) => ({ plan, revenue: byPlan[plan] })),
  };
}

const accountList = (kind) => guard(({ request }) => {
  const p = q(request); const src = kind === 'client' ? clients : users;
  const all = src.filter((a) => (!p.status || a.status === p.status) && (has(a.name, p.search) || has(a.email, p.search) || has(a.clientName, p.search)) && (!p.role || a.role === p.role));
  return HttpResponse.json(page(all, p));
});

export const adminHandlers = [
  http.get(`${base}/overview`, guard(() => {
    refreshOverdue(); const f = financials({});
    const sixMonths = f.revenueByMonth.slice(-6);
    return HttpResponse.json({
      activeSessions: sessions.length, activeClients: clients.filter((c) => c.status === 'active').length, suspendedAccounts: clients.filter((c) => c.status === 'suspended').length + users.filter((u) => u.status === 'suspended').length,
      lockedAccounts: users.filter((u) => u.status === 'locked').length, failedLogins24h: audit.filter((a) => a.action === 'auth.login_failed' && Date.now() - new Date(a.at) < 86_400_000).length,
      revenue: f.totals.revenue, outstanding: f.totals.outstanding, overdueInvoices: f.totals.overdueInvoices,
      expiringSoon: subscriptions.filter((s) => s.status === 'active' && new Date(s.endDate) - Date.now() < 7 * 86_400_000).map((s) => ({ id: s.id, clientName: s.clientName, planName: s.planName, endDate: s.endDate })),
      revenueByMonth: sixMonths, recentSecurity: audit.filter((a) => /login_failed|suspend|lock|terminate|settings/.test(a.action)).slice(0, 6),
    });
  })),

  http.get(`${base}/sessions`, guard(({ request }) => {
    const p = q(request);
    const all = sessions.filter((s) => has(s.username, p.search) || has(s.clientName, p.search) || has(s.email, p.search))
      .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
    return HttpResponse.json(page(all, p));
  })),
  http.post(`${base}/sessions/:id/terminate`, guard(async ({ params, request }) => {
    const { reason } = await request.json(); const i = sessions.findIndex((s) => s.id === params.id);
    if (i < 0) return err(404, 'NOT_FOUND', 'Session not found');
    if (sessions[i].current) return err(409, 'CONFLICT', 'You cannot end your own current session here. Use Sign out');
    const [s] = sessions.splice(i, 1); logAudit('session.terminate', s.email, s.clientId, `Reason: ${reason}`);
    return HttpResponse.json({ terminated: 1 });
  })),
  http.post(`${base}/users/:id/sessions/terminate`, guard(async ({ params, request }) => {
    const { reason } = await request.json(); const u = users.find((x) => x.id === params.id); if (!u) return err(404, 'NOT_FOUND', 'User not found');
    let n = 0; for (let i = sessions.length - 1; i >= 0; i -= 1) if (sessions[i].userId === u.id && !sessions[i].current) { sessions.splice(i, 1); n += 1; }
    logAudit('session.terminate', u.email, u.clientId, `Forced logout. Reason: ${reason}`); return HttpResponse.json({ terminated: n });
  })),
  http.post(`${base}/clients/:id/sessions/terminate`, guard(async ({ params, request }) => {
    const { reason } = await request.json(); const c = clients.find((x) => x.id === params.id); if (!c) return err(404, 'NOT_FOUND', 'Client not found');
    let n = 0; for (let i = sessions.length - 1; i >= 0; i -= 1) if (sessions[i].clientId === c.id) { sessions.splice(i, 1); n += 1; }
    logAudit('session.terminate', c.name, c.id, `All sessions ended. Reason: ${reason}`); return HttpResponse.json({ terminated: n });
  })),

  http.get(`${base}/clients`, accountList('client')),
  http.get(`${base}/users`, accountList('user')),
  ...['client', 'user'].flatMap((kind) => {
    const src = () => (kind === 'client' ? clients : users);
    return [
      http.get(`${base}/${kind}s/:id`, guard(({ params }) => {
        const a = src().find((x) => x.id === params.id); if (!a) return err(404, 'NOT_FOUND', 'Account not found');
        const cid = kind === 'client' ? a.id : a.clientId;
        return HttpResponse.json({
          account: a, subscription: subscriptions.find((s) => s.clientId === cid) || null,
          invoices: invoices.filter((i) => i.clientId === cid).sort((x, y) => new Date(y.issuedAt) - new Date(x.issuedAt)).slice(0, 8),
          users: kind === 'client' ? users.filter((u) => u.clientId === a.id) : undefined,
          sessions: sessions.filter((s) => (kind === 'client' ? s.clientId === a.id : s.userId === a.id)),
          activity: audit.filter((e) => (kind === 'client' ? e.accountId === a.id : e.resource === a.email || e.actorId === a.id)).slice(0, 10),
        });
      })),
      http.post(`${base}/${kind}s/:id/:action`, guard(async ({ params, request }) => {
        if (!['suspend', 'restore', 'lock', 'unlock'].includes(params.action)) return err(404, 'NOT_FOUND', 'Unknown action');
        const { reason } = await request.json(); const a = src().find((x) => x.id === params.id); if (!a) return err(404, 'NOT_FOUND', 'Account not found');
        if (a.role === 'superadmin') return err(409, 'CONFLICT', 'The super admin account cannot be changed here');
        const next = { suspend: 'suspended', lock: 'locked', restore: 'active', unlock: 'active' }[params.action];
        if (a.status === next) return err(409, 'CONFLICT', `Account is already ${next}`);
        a.status = next; a.statusChange = { by: 'Super Admin', reason, at: new Date().toISOString() };
        if (kind === 'client') users.filter((u) => u.clientId === a.id).forEach((u) => { if (next === 'suspended' || next === 'active') u.status = next; });
        if (next === 'suspended') for (let i = sessions.length - 1; i >= 0; i -= 1) if (kind === 'client' ? sessions[i].clientId === a.id : sessions[i].userId === a.id) sessions.splice(i, 1);
        logAudit(`account.${params.action}`, a.email || a.name, kind === 'client' ? a.id : a.clientId, `Reason: ${reason}`);
        return HttpResponse.json(a);
      })),
    ];
  }),

  http.get(`${base}/plans`, guard(() => HttpResponse.json({ items: plans }))),
  http.post(`${base}/plans`, guard(async ({ request }) => {
    const b = await request.json(); if (plans.some((p) => p.name.toLowerCase() === b.name.toLowerCase())) return err(422, 'VALIDATION_ERROR', 'Invalid input', [{ path: 'name', message: 'A plan with this name exists' }]);
    const plan = { ...b, id: `plan_${Date.now()}` }; plans.push(plan); logAudit('plan.create', plan.name, null, `Price ${plan.price}`); return HttpResponse.json(plan, { status: 201 });
  })),
  http.patch(`${base}/plans/:id`, guard(async ({ params, request }) => {
    const b = await request.json(); const p = plans.find((x) => x.id === params.id); if (!p) return err(404, 'NOT_FOUND', 'Plan not found');
    Object.assign(p, b); subscriptions.forEach((s) => { if (s.planId === p.id) s.planName = p.name; }); logAudit('plan.update', p.name, null, 'Plan changed'); return HttpResponse.json(p);
  })),

  http.get(`${base}/subscriptions`, guard(({ request }) => {
    const p = q(request);
    const all = subscriptions.filter((s) => (!p.status || s.status === p.status) && (!p.planId || s.planId === p.planId) && has(s.clientName, p.search));
    return HttpResponse.json(page(all, p));
  })),
  http.post(`${base}/subscriptions`, guard(async ({ request }) => {
    const b = await request.json(); const c = clients.find((x) => x.id === b.clientId); const plan = plans.find((x) => x.id === b.planId);
    if (!c || !plan) return err(422, 'VALIDATION_ERROR', 'Choose a client and a plan');
    if (subscriptions.some((s) => s.clientId === c.id && ['active', 'pending'].includes(s.status) && ['active', 'pending'].includes(b.status))) return err(409, 'CONFLICT', 'This client already has a live subscription. Edit or cancel it first');
    const sub = { id: `sub_${Date.now()}`, clientId: c.id, clientName: c.name, planId: plan.id, planName: plan.name, price: plan.price, startDate: b.startDate, endDate: b.endDate, status: b.status };
    subscriptions.unshift(sub); logAudit('subscription.create', sub.id, c.id, `${plan.name} plan`); return HttpResponse.json(sub, { status: 201 });
  })),
  http.patch(`${base}/subscriptions/:id`, guard(async ({ params, request }) => {
    const b = await request.json(); const s = subscriptions.find((x) => x.id === params.id); if (!s) return err(404, 'NOT_FOUND', 'Subscription not found');
    const plan = plans.find((x) => x.id === b.planId) || plans.find((x) => x.id === s.planId);
    Object.assign(s, { planId: plan.id, planName: plan.name, price: plan.price, startDate: b.startDate ?? s.startDate, endDate: b.endDate ?? s.endDate, status: b.status ?? s.status });
    logAudit('subscription.update', s.id, s.clientId, `Status ${s.status}, plan ${s.planName}`); return HttpResponse.json(s);
  })),

  http.get(`${base}/invoices`, guard(({ request }) => {
    refreshOverdue(); const p = q(request);
    const all = invoices.filter((i) => (!p.status || i.status === p.status) && (!p.clientId || i.clientId === p.clientId) && (has(i.number, p.search) || has(i.clientName, p.search)) && inRange(i.dueDate, p.from, p.to))
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
    return HttpResponse.json({ ...page(all, p), totals: { amount: sum(all, (i) => i.amount) } });
  })),
  http.post(`${base}/invoices`, guard(async ({ request }) => {
    const b = await request.json(); const c = clients.find((x) => x.id === b.clientId); const amount = Number(b.amount);
    if (!c) return err(422, 'VALIDATION_ERROR', 'Invalid input', [{ path: 'clientId', message: 'Choose a client' }]);
    if (!(amount > 0)) return err(422, 'VALIDATION_ERROR', 'Invalid input', [{ path: 'amount', message: 'Enter an amount above zero' }]);
    const sub = subscriptions.find((s) => s.clientId === c.id);
    const n = 1000 + invoices.length + 1; const inv = { id: `inv_${Date.now()}`, number: `INV-${n}`, clientId: c.id, clientName: c.name, subscriptionId: sub?.id || null, planName: sub?.planName || '—', description: b.description, amount,
      status: 'unpaid', issuedAt: new Date().toISOString(), dueDate: new Date(b.dueDate).toISOString(), paidAt: null, paymentMethod: null };
    invoices.unshift(inv); logAudit('invoice.create', inv.number, c.id, `Amount ${amount}`); return HttpResponse.json(inv, { status: 201 });
  })),
  http.post(`${base}/invoices/:id/pay`, guard(async ({ params, request }) => {
    const b = await request.json(); const i = invoices.find((x) => x.id === params.id); if (!i) return err(404, 'NOT_FOUND', 'Invoice not found');
    if (!['unpaid', 'overdue'].includes(i.status)) return err(409, 'CONFLICT', `Invoice is already ${i.status}`);
    Object.assign(i, { status: 'paid', paidAt: new Date(b.paidAt).toISOString(), paymentMethod: b.method }); logAudit('invoice.payment', i.number, i.clientId, `Paid via ${b.method}`); return HttpResponse.json(i);
  })),
  http.post(`${base}/invoices/:id/void`, guard(async ({ params, request }) => {
    const { reason } = await request.json(); const i = invoices.find((x) => x.id === params.id); if (!i) return err(404, 'NOT_FOUND', 'Invoice not found');
    if (i.status === 'paid') return err(409, 'CONFLICT', 'A paid invoice cannot be voided'); i.status = 'void'; logAudit('invoice.update', i.number, i.clientId, `Voided. Reason: ${reason}`); return HttpResponse.json(i);
  })),

  http.get(`${base}/audit-log/actions`, guard(() => HttpResponse.json({ items: [...new Set(audit.map((a) => a.action))].sort() }))),
  http.get(`${base}/audit-log`, guard(({ request }) => {
    const p = q(request);
    const all = audit.filter((a) => (!p.action || a.action === p.action) && (!p.accountId || a.accountId === p.accountId) && (has(a.actor, p.user)) && inRange(a.at, p.from, p.to));
    return HttpResponse.json(page(all, p));
  })),

  http.get(`${base}/settings`, guard(() => HttpResponse.json(settings))),
  http.patch(`${base}/settings`, guard(async ({ request }) => {
    const b = await request.json(); const bad = [];
    const num = (path, v, min, max) => { if (!Number.isInteger(v) || v < min || v > max) bad.push({ path, message: `Enter a whole number from ${min} to ${max}` }); };
    num('session.inactivityTimeoutHours', b.session?.inactivityTimeoutHours, 1, 168);
    num('security.maxFailedLogins', b.security?.maxFailedLogins, 3, 10);
    num('security.lockoutMinutes', b.security?.lockoutMinutes, 1, 1440);
    num('notifications.expiryReminderDays', b.notifications?.expiryReminderDays, 1, 60);
    if (!/^\S+@\S+\.\S+$/.test(b.application?.supportEmail || '')) bad.push({ path: 'application.supportEmail', message: 'Enter a valid email' });
    if (bad.length) return err(422, 'VALIDATION_ERROR', 'Invalid input', bad);
    const changed = []; ['session', 'security', 'application', 'notifications'].forEach((g) => Object.keys(b[g]).forEach((k) => { if (settings[g][k] !== b[g][k]) changed.push(`${g}.${k}: ${settings[g][k]} → ${b[g][k]}`); }));
    ['session', 'security', 'application', 'notifications'].forEach((g) => Object.assign(settings[g], b[g]));
    settings.updatedAt = new Date().toISOString(); settings.updatedBy = 'Super Admin';
    if (changed.length) logAudit('settings.update', 'System settings', null, changed.join('; '));
    return HttpResponse.json(settings);
  })),

  http.get(`${base}/finance/summary`, guard(({ request }) => HttpResponse.json(financials(q(request))))),

  http.get(`${base}/reports/:category`, guard(({ params, request }) => {
    refreshOverdue(); const p = q(request); const f = (iso) => (iso ? iso.slice(0, 10) : '');
    const money = (n) => `UGX ${Number(n).toLocaleString('en-UG')}`;
    const spec = {
      users: () => { const rows = users.filter((u) => (!p.status || u.status === p.status) && inRange(u.createdAt, p.from, p.to)).map((u) => ({ name: u.name, email: u.email, role: u.role, client: u.clientName, status: u.status, created: f(u.createdAt), lastLogin: f(u.lastLoginAt) }));
        return { columns: [['name', 'Name'], ['email', 'Email'], ['role', 'Role'], ['client', 'Client'], ['status', 'Status'], ['created', 'Created'], ['lastLogin', 'Last login']], rows, summary: [['Users', rows.length], ['Suspended', rows.filter((r) => r.status === 'suspended').length]] }; },
      subscriptions: () => { const rows = subscriptions.filter((s) => (!p.status || s.status === p.status) && inRange(s.startDate, p.from, p.to)).map((s) => ({ client: s.clientName, plan: s.planName, status: s.status, start: f(s.startDate), end: f(s.endDate), price: s.price }));
        return { columns: [['client', 'Client'], ['plan', 'Plan'], ['status', 'Status'], ['start', 'Start'], ['end', 'Expiry'], ['price', 'Monthly price (UGX)']], rows, summary: [['Subscriptions', rows.length], ['Active', rows.filter((r) => r.status === 'active').length]] }; },
      invoices: () => { const rows = invoices.filter((i) => (!p.status || i.status === p.status) && inRange(i.issuedAt, p.from, p.to)).map((i) => ({ number: i.number, client: i.clientName, plan: i.planName, amount: i.amount, status: i.status, issued: f(i.issuedAt), due: f(i.dueDate), paid: f(i.paidAt) }));
        return { columns: [['number', 'Invoice'], ['client', 'Client'], ['plan', 'Plan'], ['amount', 'Amount (UGX)'], ['status', 'Status'], ['issued', 'Issued'], ['due', 'Due'], ['paid', 'Paid']], rows, summary: [['Invoices', rows.length], ['Total', money(sum(rows, (r) => r.amount))]] }; },
      financial: () => { const rows = invoices.filter((i) => i.status === 'paid' && inRange(i.paidAt, p.from, p.to)).map((i) => ({ paid: f(i.paidAt), number: i.number, client: i.clientName, plan: i.planName, method: i.paymentMethod, amount: i.amount }));
        return { columns: [['paid', 'Payment date'], ['number', 'Invoice'], ['client', 'Client'], ['plan', 'Plan'], ['method', 'Method'], ['amount', 'Amount (UGX)']], rows, summary: [['Payments', rows.length], ['Revenue', money(sum(rows, (r) => r.amount))]] }; },
      security: () => { const rows = audit.filter((a) => (!p.status || a.action === p.status) && /^(auth|session|account|settings)/.test(a.action) && inRange(a.at, p.from, p.to)).map((a) => ({ at: a.at.replace('T', ' ').slice(0, 16), actor: a.actor, action: a.action, resource: a.resource, account: a.accountName, details: a.details }));
        return { columns: [['at', 'Time'], ['actor', 'Actor'], ['action', 'Action'], ['resource', 'Resource'], ['account', 'Account'], ['details', 'Details']], rows, summary: [['Events', rows.length], ['Failed logins', rows.filter((r) => r.action === 'auth.login_failed').length]] }; },
    }[params.category];
    if (!spec) return err(404, 'NOT_FOUND', 'Unknown report');
    const r = spec(); return HttpResponse.json({ columns: r.columns.map(([key, label]) => ({ key, label })), rows: r.rows, summary: r.summary.map(([label, value]) => ({ label, value: String(value) })), generatedAt: new Date().toISOString() });
  })),
];

// SAMPLE DATA FOR DEVELOPMENT ONLY. Stands in for the database until the /admin backend exists.
// Money is derived from the invoice records below, the way the real server must do it.
export const ADMIN_LOGIN = { email: 'admin@bizpulse.test', password: 'admin12345' };
export const adminUser = { id: 'usr_admin', name: 'Super Admin', email: ADMIN_LOGIN.email, role: 'superadmin', businessId: null, emailVerified: true, sessionTimeoutHours: 24 };

let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const DAY = 86_400_000;
const ago = (d, h = 0) => new Date(Date.now() - d * DAY - h * 3_600_000).toISOString();
const ahead = (d) => new Date(Date.now() + d * DAY).toISOString();

export const plans = [
  { id: 'plan_free', name: 'Free', price: 0, period: 'monthly', maxUsers: 1, features: ['1 user', 'Basic dashboard'], active: true },
  { id: 'plan_growth', name: 'Growth', price: 50000, period: 'monthly', maxUsers: 5, features: ['5 users', 'WhatsApp sales capture', 'Reports'], active: true },
  { id: 'plan_pro', name: 'Pro', price: 120000, period: 'monthly', maxUsers: 20, features: ['20 users', 'Everything in Growth', 'Priority support'], active: true },
];

const NAMES = ['Sample Provisions', 'Kampala Fresh Mart', 'Nakato Hardware', 'Lakeview Pharmacy', 'Mukwano Traders', 'Entebbe Bakery', 'Jinja Auto Parts', 'Gulu Grain Store', 'Mbale Coffee Co', 'Fort Portal Tea Shop', 'Masaka Electronics', 'Arua Stationers', 'Mbarara Dairy', 'Soroti Boutique'];
const PEOPLE = ['Ama Nakato', 'John Okello', 'Grace Atim', 'Moses Kato', 'Sarah Namuli', 'Peter Ssemwogerere', 'Rose Akello', 'David Mugisha', 'Esther Nabirye', 'Isaac Opio', 'Joan Nankya', 'Samuel Byaruhanga'];

export const clients = NAMES.map((name, i) => ({
  id: `cli_${i + 1}`, name, email: `owner@${name.toLowerCase().replace(/[^a-z]/g, '')}.test`, phone: `+2567${70000000 + i * 137}`,
  status: i === 3 ? 'suspended' : i === 9 ? 'locked' : 'active', createdAt: ago(40 + i * 23), industry: pick(['Retail', 'Wholesale', 'Services', 'Food']),
  statusChange: i === 3 ? { by: 'Super Admin', reason: 'Repeated chargebacks under review', at: ago(6) } : i === 9 ? { by: 'System', reason: 'Automatic lockout: 5 failed logins', at: ago(0, 2) } : null,
}));

export const users = [];
clients.forEach((c, i) => {
  const n = 1 + (i % 3);
  for (let k = 0; k < n; k += 1) {
    const name = PEOPLE[(i + k * 5) % PEOPLE.length];
    users.push({ id: `usr_${c.id}_${k}`, name, email: `${name.split(' ')[0].toLowerCase()}${i}${k}@${c.email.split('@')[1]}`, role: k === 0 ? 'owner' : pick(['staff', 'accountant']), clientId: c.id, clientName: c.name,
      status: c.status === 'suspended' ? 'suspended' : (i === 9 && k === 0 ? 'locked' : 'active'), createdAt: c.createdAt, lastLoginAt: ago(rnd() * 10, rnd() * 20), statusChange: null });
  }
});
users.unshift({ ...adminUser, clientId: null, clientName: '—', status: 'active', role: 'superadmin', createdAt: ago(300), lastLoginAt: ago(0, 1), statusChange: null });

const planFor = (i) => (i % 5 === 0 ? plans[0] : i % 3 === 0 ? plans[2] : plans[1]);
export const subscriptions = clients.map((c, i) => {
  const plan = planFor(i);
  const expired = i === 5 || i === 11; const pending = i === 12; const cancelled = i === 7;
  const start = ago(expired ? 80 : 20 + i * 4);
  const end = expired ? ago(12 + i) : ahead(30 - ((i * 4) % 25));
  return { id: `sub_${i + 1}`, clientId: c.id, clientName: c.name, planId: plan.id, planName: plan.name, price: plan.price, startDate: start, endDate: end,
    status: cancelled ? 'cancelled' : pending ? 'pending' : expired ? 'expired' : 'active' };
});

export const invoices = [];
let invNo = 1000;
subscriptions.forEach((s, i) => {
  if (s.price === 0) return;
  const months = 4 + (i % 4);
  for (let m = months; m >= 0; m -= 1) {
    const issued = ago(m * 30 + 3); const due = new Date(new Date(issued).getTime() + 14 * DAY).toISOString();
    let status = 'paid'; let paidAt = new Date(new Date(issued).getTime() + (3 + (i % 5)) * DAY).toISOString();
    if (m === 0 && i % 2 === 0) { status = 'unpaid'; paidAt = null; }
    if (m === 1 && i % 4 === 0) { status = 'unpaid'; paidAt = null; }
    if (s.status === 'cancelled' && m === 0) { status = 'void'; paidAt = null; }
    if (status === 'unpaid' && new Date(due) < new Date()) status = 'overdue';
    invNo += 1;
    invoices.push({ id: `inv_${invNo}`, number: `INV-${invNo}`, clientId: s.clientId, clientName: s.clientName, subscriptionId: s.id, planName: s.planName, description: `${s.planName} plan: monthly subscription`,
      amount: s.price, status, issuedAt: issued, dueDate: due, paidAt, paymentMethod: paidAt ? pick(['Mobile money', 'Card', 'Bank transfer']) : null });
  }
});

export const sessions = [];
users.filter((u) => u.status !== 'suspended').slice(0, 14).forEach((u, i) => {
  sessions.push({ id: `ses_${i + 1}`, userId: u.id, username: u.name, email: u.email, clientId: u.clientId, clientName: u.clientName, role: u.role,
    loginAt: ago(0, 2 + i * 3), lastActivityAt: ago(0, i % 4 === 0 ? 0.1 * i : 0.5 * i), device: pick(['Chrome on Windows', 'Safari on iPhone', 'Chrome on Android', 'Firefox on Linux', 'Edge on Windows']), ip: `197.157.${10 + i}.${20 + i * 7}`, current: u.id === adminUser.id });
});

export const audit = [];
const ACTIONS = ['auth.login', 'auth.logout', 'auth.login_failed', 'account.suspend', 'account.restore', 'session.terminate', 'subscription.create', 'subscription.update', 'invoice.create', 'invoice.payment', 'settings.update', 'account.lock'];
for (let i = 0; i < 90; i += 1) {
  const action = ACTIONS[Math.floor(rnd() * ACTIONS.length)];
  const c = pick(clients); const u = users.find((x) => x.clientId === c.id) || users[1];
  const admin = action.startsWith('auth.') ? false : true;
  audit.push({ id: `aud_${i + 1}`, at: ago(rnd() * 20, rnd() * 24), action, actor: admin ? 'Super Admin' : u.name, actorId: admin ? adminUser.id : u.id, accountId: c.id, accountName: c.name, resource: action.startsWith('invoice') ? `INV-${1001 + (i % 40)}` : action.startsWith('subscription') ? `sub_${(i % 14) + 1}` : action.startsWith('settings') ? 'System settings' : u.email,
    details: action === 'auth.login_failed' ? 'Wrong password' : action === 'account.suspend' ? 'Reason: Payment dispute' : action === 'session.terminate' ? 'Reason: Suspicious device' : action === 'settings.update' ? 'Login attempt limit changed' : '—', ip: `197.157.${i % 200}.${(i * 7) % 250}` });
}
audit.sort((a, b) => new Date(b.at) - new Date(a.at));

export const settings = {
  session: { inactivityTimeoutHours: 24 },
  security: { maxFailedLogins: 5, lockoutMinutes: 15, notifyOnLockout: true, notifyOnSuspension: true },
  application: { supportEmail: 'support@bizpulse.test', defaultCurrency: 'UGX', defaultTimezone: 'Africa/Kampala', maintenanceMode: false },
  notifications: { securityDigest: true, overdueInvoiceReminders: true, expiryReminderDays: 7 },
  updatedAt: ago(14), updatedBy: 'Super Admin',
};

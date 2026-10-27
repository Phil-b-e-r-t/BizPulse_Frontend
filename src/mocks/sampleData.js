// SAMPLE DATA FOR DEVELOPMENT ONLY. Not real records. Used only when VITE_USE_MOCKS=true.
// Shapes follow the handoff PDF, section 4.
const TZ = 'Africa/Kampala';
const dayStr = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const shift = (day, n) => { const [y, m, d] = day.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };

export const DEMO_LOGIN = { email: 'demo@bizpulse.test', password: 'demo12345' };

export const demoBusiness = { id: 'biz_demo', name: 'Sample Provisions (demo)', phone: null, currency: 'UGX', timezone: TZ, plan: 'free' };
export const demoUser = { id: 'usr_demo', name: 'Ama Nakato', email: DEMO_LOGIN.email, role: 'owner', businessId: 'biz_demo', emailVerified: false };

export const products = [
  { id: 'p1', name: 'Rice (50kg)', sku: 'RICE-50', unit: 'bag', costPrice: 40000, unitPrice: 45000, stockQty: 2, reorderLevel: 5, lowStock: true },
  { id: 'p2', name: 'Cooking oil 3L', sku: 'OIL-3', unit: 'jerrycan', costPrice: 18000, unitPrice: 21000, stockQty: 14, reorderLevel: 6, lowStock: false },
  { id: 'p3', name: 'Sugar', sku: 'SUG-1', unit: 'kg', costPrice: 3800, unitPrice: 4500, stockQty: 6.5, reorderLevel: 10, lowStock: true },
  { id: 'p4', name: 'Bar soap', sku: 'SOAP', unit: 'piece', costPrice: 1200, unitPrice: 1800, stockQty: 80, reorderLevel: 20, lowStock: false },
];

function daysFor(range) {
  const today = dayStr(new Date());
  if (range === 'day') return [today];
  if (range === 'month') return Array.from({ length: Number(today.slice(8)) }, (_, i) => shift(today, i - Number(today.slice(8)) + 1));
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  return Array.from({ length: dow + 1 }, (_, i) => shift(today, i - dow));
}

export function sampleSummary(range, empty) {
  const days = daysFor(range);
  const first = days[0];
  const daily = empty ? [] : days
    .map((day, i) => ({ day, revenue: 60000 + ((i * 47000) % 190000), expenses: (i * 13000) % 70000 }))
    .filter((_, i) => i % 4 !== 3); // skip some days so chart gap-filling is exercised
  const revenue = daily.reduce((s, d) => s + d.revenue, 0);
  const expenses = daily.reduce((s, d) => s + d.expenses, 0);
  const salesCount = empty ? 0 : daily.length * 6;
  const pos = Math.round(revenue * 0.7);
  return {
    range: { label: range, start: `${first}T00:00:00+03:00`, end: `${shift(days[days.length - 1], 1)}T00:00:00+03:00`, timezone: TZ },
    currency: 'UGX',
    totals: { revenue, expenses, profit: revenue - expenses, salesCount, expenseCount: empty ? 0 : daily.length, averageSale: salesCount ? revenue / salesCount : 0 },
    salesByChannel: empty ? [] : [{ channel: 'pos', revenue: pos, count: Math.round(salesCount * 0.7) }, { channel: 'whatsapp', revenue: revenue - pos, count: salesCount - Math.round(salesCount * 0.7) }],
    topProducts: empty ? [] : [
      { productId: 'p1', name: 'Rice (50kg)', quantity: 9, revenue: 405000, grossProfit: 45000 },
      { productId: 'p2', name: 'Cooking oil 3L', quantity: 12, revenue: 252000, grossProfit: 36000 },
      { productId: 'p4', name: 'Bar soap', quantity: 60, revenue: 108000, grossProfit: 36000 },
    ],
    daily,
    lowStockCount: empty ? 0 : products.filter((p) => p.lowStock).length,
  };
}

export function sampleTransactions(empty) {
  if (empty) return [];
  const now = Date.now();
  const at = (h) => new Date(now - h * 3600_000).toISOString();
  return [
    { id: 't1', type: 'sale', channel: 'whatsapp', amount: 45000, paymentMethod: 'mobile_money', category: null, description: null, customerName: 'Moses', status: 'confirmed', occurredAt: at(1), createdAt: at(1) },
    { id: 't2', type: 'sale', channel: 'pos', amount: 63000, paymentMethod: 'cash', category: null, description: null, customerName: null, status: 'confirmed', occurredAt: at(3), createdAt: at(3) },
    { id: 't3', type: 'expense', channel: 'pos', amount: 25000, paymentMethod: 'cash', category: 'Transport', description: 'Boda to wholesaler', customerName: null, status: 'confirmed', occurredAt: at(5), createdAt: at(5) },
    { id: 't4', type: 'sale', channel: 'whatsapp', amount: 18000, paymentMethod: 'mobile_money', category: null, description: null, customerName: 'Grace', status: 'needs_review', occurredAt: at(8), createdAt: at(8) },
    { id: 't5', type: 'sale', channel: 'pos', amount: 21000, paymentMethod: 'cash', category: null, description: null, customerName: null, status: 'voided', occurredAt: at(20), createdAt: at(20) },
  ];
}

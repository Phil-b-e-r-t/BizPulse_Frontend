// Display helpers. Totals are calculated by the server; these only format values.
export function formatMoney(amount, currency = 'UGX') {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-UG', { style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${Math.round(n).toLocaleString('en-UG')}`;
  }
}

export function formatCompact(amount) {
  return new Intl.NumberFormat('en-UG', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(amount) || 0);
}

export function formatNumber(n, max = 2) {
  return new Intl.NumberFormat('en-UG', { maximumFractionDigits: max }).format(Number(n) || 0);
}

export function formatUnit(quantity, unit = '') {
  if (!unit || Math.abs(Number(quantity)) === 1 || /^(kg|g|l|ml)$/i.test(unit) || unit.endsWith('s')) return unit;
  return `${unit}s`;
}

export function formatDateTime(iso, timeZone) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(iso));
}

export function formatDay(day) {
  // day is YYYY-MM-DD
  const [y, m, d] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatWeekday(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('en-UG', { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function greeting(timeZone) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone }).format(new Date()));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const CHANNEL_LABELS = { pos: 'Shop counter', whatsapp: 'WhatsApp', web: 'Online', import: 'Imported' };
export const channelLabel = (c) => CHANNEL_LABELS[c] || c;

export const PAYMENT_LABELS = { cash: 'Cash', mobile_money: 'Mobile money', card: 'Card', bank: 'Bank', credit: 'Credit' };
export const paymentLabel = (p) => PAYMENT_LABELS[p] || p;

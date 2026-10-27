import { formatDay, formatWeekday } from './format';

const dayIn = (date, timeZone) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); // YYYY-MM-DD

const addDays = (day, n) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/**
 * The API's `daily` array only has days with activity (handoff section 4).
 * Fill the gaps with zeros from the range start up to today (or range end) so charts are continuous.
 */
export function fillDailySeries(summary, range) {
  if (!summary?.range) return [];
  const tz = summary.range.timezone || 'Africa/Kampala';
  const byDay = new Map((summary.daily || []).map((d) => [d.day, d]));
  const start = dayIn(new Date(summary.range.start), tz);
  const end = dayIn(new Date(Math.min(new Date(summary.range.end).getTime(), Date.now())), tz);

  const out = [];
  for (let day = start, guard = 0; day <= end && guard < 62; day = addDays(day, 1), guard += 1) {
    const row = byDay.get(day);
    out.push({
      day,
      label: range === 'month' ? formatDay(day).replace(/\s\w+$/, '') : formatWeekday(day),
      fullLabel: formatDay(day),
      revenue: row?.revenue || 0,
      expenses: row?.expenses || 0,
    });
  }
  return out;
}

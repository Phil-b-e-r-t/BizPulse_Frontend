import { Lightbulb } from 'lucide-react';
import { channelLabel, formatMoney } from '../../utils/format';

// Plain-language readouts derived only from the server's response. Nothing is invented.
export default function Insights({ summary, periodLabel }) {
  const lines = [];
  const top = summary.topProducts?.[0];
  if (top) lines.push(`${top.name} is your best seller ${periodLabel}, bringing in ${formatMoney(top.revenue, summary.currency)}.`);

  const channels = summary.salesByChannel || [];
  const total = channels.reduce((s, c) => s + c.revenue, 0);
  const lead = [...channels].sort((a, b) => b.revenue - a.revenue)[0];
  if (lead && total > 0 && channels.length > 1) {
    lines.push(`Most of your sales (${Math.round((lead.revenue / total) * 100)}%) came through ${channelLabel(lead.channel)}.`);
  }
  if (summary.lowStockCount > 0) {
    lines.push(`${summary.lowStockCount} ${summary.lowStockCount === 1 ? 'product needs' : 'products need'} restocking soon.`);
  }
  if (summary.totals.profit < 0) {
    lines.push('Your expenses are higher than your sales for this period.');
  }
  if (lines.length === 0) return null;

  return (
    <section className="card p-4 lg:p-5" aria-labelledby="insight-title">
      <h2 id="insight-title" className="flex items-center gap-2 text-base font-semibold">
        <Lightbulb className="h-4 w-4 text-ochre" aria-hidden="true" /> At a glance
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-ink-700">
        {lines.map((l) => <li key={l} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" aria-hidden="true" />{l}</li>)}
      </ul>
    </section>
  );
}

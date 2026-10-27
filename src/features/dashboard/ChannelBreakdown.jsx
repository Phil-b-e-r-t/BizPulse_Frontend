import { Store } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import { channelLabel, formatMoney, formatNumber } from '../../utils/format';

export default function ChannelBreakdown({ channels, currency }) {
  const total = channels.reduce((s, c) => s + c.revenue, 0); // only used to size the bars
  return (
    <section className="card p-4 lg:p-5" aria-labelledby="channel-title">
      <h2 id="channel-title" className="text-base font-semibold">Where sales come from</h2>
      {channels.length === 0 ? (
        <EmptyState compact icon={Store} title="No sales yet" message="Sales from the shop counter and WhatsApp will be split out here." />
      ) : (
        <ul className="mt-4 space-y-4">
          {channels.map((c) => {
            const pct = total > 0 ? Math.round((c.revenue / total) * 100) : 0;
            return (
              <li key={c.channel}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{channelLabel(c.channel)}</span>
                  <span className="num text-ink-500">{formatMoney(c.revenue, currency)} · {pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-ink-400">{formatNumber(c.count, 0)} {c.count === 1 ? 'sale' : 'sales'}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import { fillDailySeries } from '../../utils/dailySeries';
import { formatCompact, formatMoney } from '../../utils/format';

function ChartTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-ink-200 bg-white px-3 py-2 text-sm shadow-pop">
      <p className="mb-1 font-semibold">{row.fullLabel}</p>
      <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-brand" />Money in: <b className="num">{formatMoney(row.revenue, currency)}</b></p>
      <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-ochre" />Money out: <b className="num">{formatMoney(row.expenses, currency)}</b></p>
    </div>
  );
}

export default function RevenueChart({ summary, range }) {
  const data = fillDailySeries(summary, range);
  const hasActivity = data.some((d) => d.revenue > 0 || d.expenses > 0);

  return (
    <section className="card p-4 lg:p-5" aria-labelledby="chart-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="chart-title" className="text-base font-semibold">Money in and out, day by day</h2>
        <div className="flex items-center gap-4 text-xs text-ink-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand" />Money in</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ochre" />Money out</span>
        </div>
      </div>
      {hasActivity ? (
        <div className="mt-4 h-64" role="img" aria-label="Bar chart of daily money in and money out">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke="#ECEFEA" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#5A6B62', fontSize: 12 }} interval="preserveStartEnd" minTickGap={12} />
              <YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: '#5A6B62', fontSize: 12 }} tickFormatter={formatCompact} />
              <Tooltip cursor={{ fill: '#F5F6F2' }} content={<ChartTooltip currency={summary.currency} />} />
              <Bar isAnimationActive={false} dataKey="revenue" fill="#0F6B4F" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar isAnimationActive={false} dataKey="expenses" fill="#D99A00" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState compact icon={BarChart3} title="Nothing recorded in this period" message="Sales and expenses will appear here as you record them." />
      )}
    </section>
  );
}

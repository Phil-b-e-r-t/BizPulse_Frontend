import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Banknote, CheckCircle2, CircleDollarSign, Clock, FileWarning, Receipt } from 'lucide-react';
import { getFinancials } from '../../api/admin';
import { friendlyError } from '../../api/errors';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import { DateRange, PageIntro, StatCard } from '../../components/admin/ui';
import { formatCompact, formatMonth, formatMoney, formatNumber } from '../../utils/format';

const COLORS = ['#0F6B4F', '#D99A00', '#2A3B32', '#7C8B83', '#B4301F'];

export default function AdminFinance() {
  useEffect(() => { document.title = 'Financial reports · BizPulse'; }, []);
  const [range, setRange] = useState({ from: '', to: '' });
  const q = useQuery({ queryKey: ['admin', 'finance', range], queryFn: () => getFinancials(range) });
  const d = q.data;
  const subs = d ? [{ name: 'Active', value: d.subscriptions.active }, { name: 'Expired', value: d.subscriptions.expired }, { name: 'Pending', value: d.subscriptions.pending }, { name: 'Cancelled', value: d.subscriptions.cancelled }] : [];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageIntro>Revenue and payments for the selected period, calculated from invoice and payment records. Leave dates empty for all time.</PageIntro>
      <DateRange {...range} onChange={setRange} />
      {q.isPending ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
        : q.isError ? <ErrorState title="Could not load financial figures" message={friendlyError(q.error)} onRetry={() => q.refetch()} /> : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Total revenue" value={formatMoney(d.totals.revenue)} icon={Banknote} hint="Paid invoices in this period" />
              <StatCard label="Payments received" value={formatNumber(d.totals.paymentsReceived)} icon={CheckCircle2} hint={`Billed ${formatMoney(d.totals.billed)}`} />
              <StatCard label="Outstanding invoices" value={formatMoney(d.totals.outstanding)} icon={Clock} tone="amber" hint={`${d.totals.outstandingCount} unpaid`} />
              <StatCard label="Paid invoices" value={formatNumber(d.totals.paidInvoices)} icon={Receipt} />
              <StatCard label="Unpaid invoices" value={formatNumber(d.totals.unpaidInvoices)} icon={CircleDollarSign} tone="amber" />
              <StatCard label="Overdue invoices" value={formatNumber(d.totals.overdueInvoices)} icon={FileWarning} tone={d.totals.overdueInvoices ? 'red' : 'neutral'} />
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              <section className="card p-4 lg:col-span-2" aria-label="Revenue by month">
                <h2 className="mb-3 text-base font-semibold">Revenue by month</h2>
                {d.revenueByMonth.length === 0 ? <p className="py-10 text-center text-sm text-ink-500">No payments in this period.</p> : (
                  <div className="h-64" role="img" aria-label="Bar chart of revenue per month"><ResponsiveContainer width="100%" height="100%"><BarChart data={d.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE2DD" /><XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 12, fill: '#5A6B62' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: '#5A6B62' }} tickLine={false} axisLine={false} width={48} /><Tooltip labelFormatter={formatMonth} formatter={(v) => formatMoney(v)} cursor={{ fill: '#ECEFEA' }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#0F6B4F" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>)}
              </section>
              <section className="card p-4" aria-label="Subscriptions by status">
                <h2 className="mb-3 text-base font-semibold">Subscriptions</h2>
                <div className="h-64" role="img" aria-label="Donut chart of subscriptions by status"><ResponsiveContainer width="100%" height="100%"><PieChart>
                  <Pie data={subs} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>{subs.map((s, i) => <Cell key={s.name} fill={COLORS[i]} />)}</Pie>
                  <Tooltip /><Legend iconType="circle" /></PieChart></ResponsiveContainer></div>
              </section>
            </div>
            <section className="card p-4" aria-label="Revenue by plan">
              <h2 className="mb-3 text-base font-semibold">Revenue by subscription plan</h2>
              {d.revenueByPlan.length === 0 ? <p className="py-6 text-center text-sm text-ink-500">No payments in this period.</p> : (
                <ul className="space-y-3">{d.revenueByPlan.map((p) => { const pct = d.totals.revenue ? Math.round((p.revenue / d.totals.revenue) * 100) : 0; return (
                  <li key={p.plan}><div className="mb-1 flex justify-between text-sm"><span className="font-medium">{p.plan}</span><span className="num">{formatMoney(p.revenue)} · {pct}%</span></div>
                    <div className="h-2 rounded-full bg-ink-100"><div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} /></div></li>); })}</ul>)}
            </section>
          </>
        )}
    </div>
  );
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Banknote, Building2, Lock, MonitorSmartphone, ShieldAlert, Ban, ReceiptText } from 'lucide-react';
import { getOverview } from '../../api/admin';
import { friendlyError } from '../../api/errors';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import { StatCard, PageIntro, fmtDate, fmtStamp } from '../../components/admin/ui';
import { formatCompact, formatMonth, formatMoney, formatNumber } from '../../utils/format';

export default function AdminOverview() {
  useEffect(() => { document.title = 'Admin overview · BizPulse'; }, []);
  const q = useQuery({ queryKey: ['admin', 'overview'], queryFn: getOverview, refetchInterval: 30_000 });

  if (q.isPending) return <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (q.isError) return <ErrorState title="Could not load the overview" message={friendlyError(q.error)} onRetry={() => q.refetch()} />;
  const d = q.data;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageIntro>Platform health across all client accounts. Figures are calculated from live records.</PageIntro>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active sessions" value={formatNumber(d.activeSessions)} icon={MonitorSmartphone} hint="Signed in right now" />
        <StatCard label="Active clients" value={formatNumber(d.activeClients)} icon={Building2} />
        <StatCard label="Suspended accounts" value={formatNumber(d.suspendedAccounts)} icon={Ban} tone={d.suspendedAccounts ? 'red' : 'neutral'} />
        <StatCard label="Locked accounts" value={formatNumber(d.lockedAccounts)} icon={Lock} tone={d.lockedAccounts ? 'amber' : 'neutral'} hint={`${d.failedLogins24h} failed logins in 24 h`} />
        <StatCard label="Revenue received" value={formatMoney(d.revenue)} icon={Banknote} />
        <StatCard label="Outstanding" value={formatMoney(d.outstanding)} icon={ReceiptText} tone="amber" />
        <StatCard label="Overdue invoices" value={formatNumber(d.overdueInvoices)} icon={AlertTriangle} tone={d.overdueInvoices ? 'red' : 'neutral'} />
        <StatCard label="Expiring in 7 days" value={formatNumber(d.expiringSoon.length)} icon={ShieldAlert} tone={d.expiringSoon.length ? 'amber' : 'neutral'} hint="Active subscriptions" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card p-4 lg:col-span-2" aria-labelledby="rev-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="rev-title" className="text-base font-semibold">Revenue, last 6 months</h2>
            <Link to="/admin/finance" className="text-sm font-semibold text-brand hover:underline">Financial reports</Link>
          </div>
          <div className="h-64" role="img" aria-label="Bar chart of monthly revenue">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.revenueByMonth} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE2DD" />
                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 12, fill: '#5A6B62' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: '#5A6B62' }} tickLine={false} axisLine={false} width={48} />
                <Tooltip labelFormatter={formatMonth} formatter={(v) => formatMoney(v)} cursor={{ fill: '#ECEFEA' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#0F6B4F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-4" aria-labelledby="exp-title">
          <h2 id="exp-title" className="mb-3 text-base font-semibold">Subscriptions ending soon</h2>
          {d.expiringSoon.length === 0 ? <p className="text-sm text-ink-500">None in the next 7 days.</p> : (
            <ul className="divide-y divide-ink-100">
              {d.expiringSoon.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0"><span className="block truncate font-medium">{s.clientName}</span><span className="text-xs text-ink-500">{s.planName}</span></span>
                  <span className="shrink-0 text-xs font-semibold text-ochre-dark">{fmtDate(s.endDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-4" aria-labelledby="sec-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="sec-title" className="text-base font-semibold">Recent security events</h2>
          <Link to="/admin/audit" className="text-sm font-semibold text-brand hover:underline">Audit log</Link>
        </div>
        <ul className="divide-y divide-ink-100">
          {d.recentSecurity.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <span className="min-w-0"><span className="font-medium">{e.action}</span> <span className="text-ink-500">· {e.actor} · {e.resource}</span></span>
              <span className="text-xs text-ink-500">{fmtStamp(e.at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

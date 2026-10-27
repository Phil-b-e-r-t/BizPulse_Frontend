import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { channelLabel, formatDateTime, formatMoney, paymentLabel } from '../../utils/format';

function describe(t) {
  if (t.type === 'sale') return t.customerName ? `Sale to ${t.customerName}` : 'Sale';
  return t.description || t.category || 'Expense';
}

export default function RecentTransactions({ query, currency, timeZone }) {
  const items = query.data?.items || [];
  return (
    <section className="card p-4 lg:p-5" aria-labelledby="tx-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="tx-title" className="text-base font-semibold">Recent activity</h2>
        <Link to="/transactions" className="rounded text-sm font-medium text-brand hover:underline">See all</Link>
      </div>

      {query.isPending ? (
        <div className="mt-4 space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : query.isError ? (
        <ErrorState compact title="Could not load activity" onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact icon={ReceiptText} title="No activity yet" message="Sales and expenses you record will be listed here." />
      ) : (
        <ul className="mt-2 divide-y divide-ink-100">
          {items.map((t) => {
            const isSale = t.type === 'sale';
            const voided = t.status === 'voided';
            const Icon = isSale ? ArrowDownLeft : ArrowUpRight;
            return (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isSale ? 'bg-brand-soft text-brand' : 'bg-ochre-soft text-ochre-dark'}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${voided ? 'text-ink-400 line-through' : ''}`}>{describe(t)}</p>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
                    <span>{formatDateTime(t.occurredAt, timeZone)}</span>
                    <span>{channelLabel(t.channel)}</span>
                    {t.paymentMethod && <span>{paymentLabel(t.paymentMethod)}</span>}
                    {t.status === 'needs_review' && <Badge tone="amber">Needs review</Badge>}
                    {voided && <Badge tone="red">Voided</Badge>}
                  </p>
                </div>
                <p className={`num shrink-0 text-sm font-semibold ${voided ? 'text-ink-400 line-through' : isSale ? 'text-brand' : 'text-ink'}`}>
                  {isSale ? '+' : '−'}{formatMoney(t.amount, currency)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import { formatNumber } from '../../utils/format';

// `count` is the server's lowStockCount from the dashboard summary; `query` is GET /products?lowStock=true.
export default function LowStockCard({ count, query }) {
  const items = query.data?.items || [];
  return (
    <section className="card p-4 lg:p-5" aria-labelledby="stock-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="stock-title" className="flex items-center gap-2 text-base font-semibold">
          Running low
          {count > 0 && <Badge tone="amber">{count}</Badge>}
        </h2>
        <Link to="/inventory" className="rounded text-sm font-medium text-brand hover:underline">View stock</Link>
      </div>

      {query.isPending ? (
        <div className="mt-4 space-y-3"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
      ) : query.isError ? (
        <ErrorState compact title="Could not load stock" onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle2 className="h-6 w-6 text-brand" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium">Stock levels look fine</p>
          <p className="text-sm text-ink-500">Nothing is at or below its reorder level.</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-ink-100">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-ochre" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-ink-500">Reorder at {formatNumber(p.reorderLevel)} {p.unit}</p>
              </div>
              <p className="num text-sm font-semibold text-brick">{formatNumber(p.stockQty)} <span className="font-normal text-ink-500">{p.unit} left</span></p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

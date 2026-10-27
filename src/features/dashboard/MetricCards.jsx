import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import { formatMoney, formatNumber } from '../../utils/format';

// Currency code small, figure large, so long UGX amounts never get cut off on a phone.
function Money({ amount, currency, negative }) {
  return (
    <>
      <span className="mr-1 text-xs font-semibold text-ink-500 lg:text-sm">{negative ? '−' : ''}{currency}</span>
      {formatNumber(Math.abs(amount), 0)}
    </>
  );
}

function Card({ label, value, sub, children }) {
  return (
    <div className="card p-4 lg:p-5">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className="num mt-2 break-words text-[22px] font-bold leading-tight tracking-tight lg:text-[28px]">{value}</p>
      <div className="mt-1.5 min-h-5 text-sm text-ink-500">{sub}</div>
      {children}
    </div>
  );
}

export function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card p-4 lg:p-5">
          <Skeleton className="h-4 w-20" /><Skeleton className="mt-3 h-8 w-32" /><Skeleton className="mt-3 h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// All figures come from the server's `totals`. Nothing is summed in the browser.
export default function MetricCards({ totals, currency }) {
  const profit = totals.profit;
  const ProfitIcon = profit > 0 ? ArrowUpRight : profit < 0 ? ArrowDownRight : Minus;
  const profitTone = profit > 0 ? 'text-brand' : profit < 0 ? 'text-brick' : 'text-ink-500';
  const profitWord = profit > 0 ? 'Profit' : profit < 0 ? 'Loss' : 'Break-even';

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Card label="Money in" value={<Money amount={totals.revenue} currency={currency} />} sub="Total sales" />
      <Card
        label="Money out"
        value={<Money amount={totals.expenses} currency={currency} />}
        sub={`${formatNumber(totals.expenseCount, 0)} ${totals.expenseCount === 1 ? 'expense' : 'expenses'}`}
      />
      <Card
        label="Profit"
        value={<Money amount={profit} currency={currency} negative={profit < 0} />}
        sub={<span className={`inline-flex items-center gap-1 font-medium ${profitTone}`}><ProfitIcon className="h-4 w-4" aria-hidden="true" />{profitWord}</span>}
      />
      <Card
        label="Sales made"
        value={formatNumber(totals.salesCount, 0)}
        sub={totals.salesCount > 0 ? `About ${formatMoney(totals.averageSale, currency)} each` : 'No sales yet'}
      />
    </div>
  );
}

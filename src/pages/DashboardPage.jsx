import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { friendlyError } from '../api/errors';
import { useDashboardSummary, useLowStockProducts, useRecentTransactions } from '../hooks/useDashboardData';
import { greeting } from '../utils/format';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import RangeTabs from '../features/dashboard/RangeTabs';
import MetricCards, { MetricCardsSkeleton } from '../features/dashboard/MetricCards';
import RevenueChart from '../features/dashboard/RevenueChart';
import ChannelBreakdown from '../features/dashboard/ChannelBreakdown';
import TopProducts from '../features/dashboard/TopProducts';
import LowStockCard from '../features/dashboard/LowStockCard';
import RecentTransactions from '../features/dashboard/RecentTransactions';
import QuickActions from '../features/dashboard/QuickActions';
import Insights from '../features/dashboard/Insights';
import OnboardingChecklist from '../features/dashboard/OnboardingChecklist';

const PERIOD_WORDS = { day: 'today', week: 'this week', month: 'this month' };

export default function DashboardPage() {
  const { user, business } = useAuth();
  const [range, setRange] = useState('week');
  const summary = useDashboardSummary(range);
  const recent = useRecentTransactions(6);
  const lowStock = useLowStockProducts(5);

  useEffect(() => { document.title = 'Dashboard · BizPulse'; }, []);

  const data = summary.data;
  const tz = data?.range?.timezone || business?.timezone;
  const currency = data?.currency || business?.currency || 'UGX';
  // "New business" = we know for sure there are no transactions at all.
  const hasTransactions = recent.isSuccess ? (recent.data.pagination?.total ?? recent.data.items.length) > 0 : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-5 lg:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink-500">{business?.name}</p>
          <h2 className="text-xl font-bold tracking-tight lg:text-2xl">{greeting(tz)}, {user?.name?.split(' ')[0]}</h2>
        </div>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      <QuickActions />

      {hasTransactions === false && <OnboardingChecklist hasTransactions={false} />}

      {summary.isPending ? (
        <>
          <MetricCardsSkeleton />
          <Skeleton className="h-80" />
        </>
      ) : summary.isError ? (
        <div className="card"><ErrorState title="Could not load your dashboard" message={friendlyError(summary.error)} onRetry={() => summary.refetch()} /></div>
      ) : (
        <>
          <MetricCards totals={data.totals} currency={currency} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3 lg:gap-6">
            <div className="space-y-5 lg:col-span-2 lg:space-y-6">
              <RevenueChart summary={data} range={range} />
              <TopProducts products={data.topProducts || []} currency={currency} />
              <RecentTransactions query={recent} currency={currency} timeZone={tz} />
            </div>
            <div className="space-y-5 lg:space-y-6">
              <LowStockCard count={data.lowStockCount} query={lowStock} />
              <ChannelBreakdown channels={data.salesByChannel || []} currency={currency} />
              <Insights summary={data} periodLabel={PERIOD_WORDS[range]} />
            </div>
          </div>
          {summary.isFetching && <span className="sr-only" role="status">Refreshing</span>}
        </>
      )}
    </div>
  );
}

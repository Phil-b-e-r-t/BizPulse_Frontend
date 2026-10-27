import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/dashboard';
import { listTransactions } from '../api/transactions';
import { listProducts } from '../api/products';

// No live updates yet (SSE arrives in P7), so the handoff says: refetch every 30-60s and on tab focus.
const POLL_MS = 45_000;

export function useDashboardSummary(range) {
  return useQuery({
    queryKey: ['dashboard', 'summary', range],
    queryFn: () => getDashboardSummary(range),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function useRecentTransactions(limit = 6) {
  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: () => listTransactions({ limit }),
    refetchInterval: POLL_MS,
  });
}

export function useLowStockProducts(limit = 5) {
  return useQuery({
    queryKey: ['products', 'low-stock', limit],
    queryFn: () => listProducts({ lowStock: true, limit }),
    refetchInterval: POLL_MS,
  });
}

// For the onboarding checklist: do any products exist?
export function useProductCount() {
  return useQuery({
    queryKey: ['products', 'count'],
    queryFn: () => listProducts({ limit: 1 }),
    select: (d) => d?.pagination?.total ?? d?.items?.length ?? 0,
  });
}

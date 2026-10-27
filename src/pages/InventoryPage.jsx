import { useDeferredValue, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, PackageOpen, PackageSearch, Plus, Search } from 'lucide-react';
import useProducts from '../hooks/useProducts';
import { useProductCount } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import InventoryTable from '../features/inventory/InventoryTable';
import ProductFormDialog from '../features/inventory/ProductFormDialog';
import StockAdjustmentDialog from '../features/inventory/StockAdjustmentDialog';

const PAGE_SIZE = 12;

export default function InventoryPage() {
  const { user, business } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState({ type: null, product: null });
  const canEdit = user?.role !== 'accountant';
  const currency = business?.currency || 'UGX';

  const query = useProducts({ search: deferredSearch, lowStock: lowOnly, page, limit: PAGE_SIZE });
  const totalQuery = useProductCount();
  const lowStockQuery = useProducts({ lowStock: true, page: 1, limit: 1 });
  const products = query.data?.items || [];
  const pagination = query.data?.pagination;
  const totalProducts = totalQuery.data ?? 0;
  const lowStockCount = lowStockQuery.data?.pagination?.total ?? 0;

  useEffect(() => { document.title = 'Stock · BizPulse'; }, []);
  useEffect(() => { setPage(1); }, [deferredSearch, lowOnly]);

  const closeDialog = () => setDialog({ type: null, product: null });
  const onSaved = (message) => {
    push(message, 'success');
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const clearFilters = () => { setSearch(''); setLowOnly(false); };

  const start = pagination?.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(page * PAGE_SIZE, pagination?.total ?? products.length);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Products</h2>
          <p className="mt-1 text-sm text-ink-500">
            {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
            {lowStockCount > 0 && <span className="text-ochre-dark"> · {lowStockCount} need attention</span>}
          </p>
        </div>
        {canEdit ? (
          <Button onClick={() => setDialog({ type: 'product', product: null })}><Plus className="h-4 w-4" aria-hidden="true" /> Add product</Button>
        ) : <span className="text-sm text-ink-500">Read-only access</span>}
      </div>

      <div className="card mt-5 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative min-w-0 flex-1 md:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product or stock code"
              aria-label="Search inventory"
              className="h-11 w-full rounded-md border border-ink-300 bg-white pl-11 pr-3 text-base text-ink placeholder:text-ink-400 hover:border-ink-400"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md bg-ink-100 p-1" aria-label="Stock filters">
            <button type="button" aria-pressed={!lowOnly} onClick={() => setLowOnly(false)} className={`min-h-11 flex-1 rounded px-4 text-sm font-semibold md:flex-none ${!lowOnly ? 'bg-white text-ink shadow-card' : 'text-ink-500 hover:text-ink'}`}>All products</button>
            <button type="button" aria-pressed={lowOnly} onClick={() => setLowOnly(true)} className={`min-h-11 flex-1 rounded px-4 text-sm font-semibold md:flex-none ${lowOnly ? 'bg-white text-ink shadow-card' : 'text-ink-500 hover:text-ink'}`}>Low stock{lowStockCount > 0 ? ` (${lowStockCount})` : ''}</button>
          </div>
        </div>
      </div>

      <div className="card mt-4 overflow-hidden">
        {query.isPending ? (
          <div className="space-y-4 p-5" aria-label="Loading products">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-14" />)}
          </div>
        ) : query.isError ? (
          <ErrorState title="Could not load inventory" message="Check your connection and try again." onRetry={() => query.refetch()} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={search || lowOnly ? PackageSearch : PackageOpen}
            title={search || lowOnly ? 'No products found' : 'Your inventory is empty'}
            message={search || lowOnly ? 'Try changing the search or stock filter.' : 'Add your first product to start tracking stock and making sales.'}
            action={search || lowOnly
              ? <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
              : canEdit ? <Button size="sm" onClick={() => setDialog({ type: 'product', product: null })}><Plus className="h-4 w-4" /> Add product</Button> : undefined}
          />
        ) : (
          <InventoryTable products={products} currency={currency} canEdit={canEdit} onEdit={(product) => setDialog({ type: 'product', product })} onAdjust={(product) => setDialog({ type: 'stock', product })} />
        )}
      </div>

      {query.isSuccess && pagination?.total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-ink-500">
            Showing {start}–{end} of {pagination.total}
            {query.isFetching && <Loader2 className="h-4 w-4 animate-spin" aria-label="Updating" />}
          </p>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="h-11" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <span className="px-2 text-sm text-ink-500">Page {page} of {pagination.totalPages}</span>
              <Button variant="secondary" size="sm" className="h-11" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      <ProductFormDialog open={dialog.type === 'product'} onClose={closeDialog} product={dialog.product} onSaved={onSaved} />
      <StockAdjustmentDialog open={dialog.type === 'stock'} onClose={closeDialog} product={dialog.product} onSaved={onSaved} />
    </div>
  );
}

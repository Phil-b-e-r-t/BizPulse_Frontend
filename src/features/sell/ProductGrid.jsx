import { useEffect, useRef } from 'react';
import { PackageSearch, Plus, Search } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import { formatMoney, formatNumber } from '../../utils/format';

export default function ProductGrid({ query, search, onSearch, onAdd, currency }) {
  const searchRef = useRef(null);
  const products = query.data?.items || [];

  useEffect(() => {
    const focusSearch = (event) => {
      const tag = document.activeElement?.tagName;
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', focusSearch);
    return () => document.removeEventListener('keydown', focusSearch);
  }, []);

  return (
    <section aria-label="Products for sale" className="min-w-0">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search products or stock code"
          aria-label="Search products"
          className="h-12 w-full rounded-lg border border-ink-300 bg-white pl-11 pr-16 text-base text-ink placeholder:text-ink-400 hover:border-ink-400"
        />
        <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded border border-ink-200 bg-paper px-2 py-0.5 text-xs text-ink-400 sm:block">/</kbd>
      </div>

      <div className="mb-3 mt-5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-800">Choose products</h2>
        {query.isSuccess && <p className="text-xs text-ink-500">{query.data.pagination?.total ?? products.length} items</p>}
      </div>

      {query.isPending ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-36" />)}
        </div>
      ) : query.isError ? (
        <div className="card"><ErrorState title="Could not load products" onRetry={() => query.refetch()} /></div>
      ) : products.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={PackageSearch}
            title={search ? 'No matching products' : 'No products yet'}
            message={search ? 'Try a different product name or stock code.' : 'Add products in Stock before recording a sale.'}
            action={search ? <Button variant="secondary" size="sm" onClick={() => onSearch('')}>Clear search</Button> : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
          {products.map((product) => {
            const unavailable = Number(product.stockQty) <= 0;
            return (
              <button
                key={product.id}
                type="button"
                disabled={unavailable}
                onClick={() => onAdd(product)}
                aria-label={unavailable ? `${product.name} is out of stock` : `Add ${product.name} to sale`}
                className="group flex min-h-36 w-full flex-col rounded-lg border border-ink-200 bg-white p-4 text-left shadow-card transition-colors hover:border-brand hover:bg-brand-soft/20 disabled:cursor-not-allowed disabled:bg-ink-100/45 disabled:text-ink-400 disabled:shadow-none"
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-semibold leading-5 text-ink group-disabled:text-ink-400">{product.name}</span>
                    <span className="mt-1 block text-xs uppercase tracking-wide text-ink-400">{product.sku}</span>
                  </span>
                  {!unavailable && <Plus className="h-5 w-5 shrink-0 text-ink-300 transition-colors group-hover:text-brand" aria-hidden="true" />}
                </span>
                <span className="mt-auto flex w-full items-end justify-between gap-2 pt-4">
                  <span>
                    <span className="block font-semibold text-ink group-disabled:text-ink-400">{formatMoney(product.unitPrice, currency)}</span>
                    <span className="text-xs text-ink-400">per {product.unit}</span>
                  </span>
                  {unavailable ? <Badge tone="red">Out of stock</Badge> : product.lowStock ? <Badge tone="amber">{formatNumber(product.stockQty)} left</Badge> : <span className="text-xs text-ink-500">{formatNumber(product.stockQty)} in stock</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

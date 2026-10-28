import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Minus, Package, Plus, Search, ShoppingBasket } from 'lucide-react';
import { listProducts } from '../api/products';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { formatMoney, formatNumber } from '../utils/format';

export default function Sell() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const { push } = useToast();
  const productsQuery = useQuery({
    queryKey: ['products', 'sell', 100],
    queryFn: () => listProducts({ limit: 100 }),
  });

  const products = productsQuery.data?.items || [];
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const cartItems = Object.values(cart);
  const total = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  function addProduct(product) {
    const stockQty = Number(product.stockQty) || 0;
    if (stockQty <= 0) return;
    setCart((current) => {
      const item = current[product.id];
      const quantity = (item?.quantity || 0) + 1;
      if (quantity > stockQty) return current;
      return {
        ...current,
        [product.id]: {
          id: product.id,
          name: product.name,
          unitPrice: Number(product.unitPrice) || 0,
          stockQty,
          quantity,
        },
      };
    });
  }

  function changeQuantity(id, amount) {
    setCart((current) => {
      const item = current[id];
      if (!item) return current;
      const quantity = item.quantity + amount;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      if (quantity > item.stockQty) return current;
      return { ...current, [id]: { ...item, quantity } };
    });
  }

  function confirmSale() {
    push('Sale submission is not connected yet.', 'info');
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby="products-title">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="products-title" className="text-base font-semibold">Products</h2>
            <p className="mt-0.5 text-sm text-ink-500">Select products to add them to the sale.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <span className="sr-only">Search products</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              className="field w-full pl-9"
            />
          </label>
        </div>

        {productsQuery.isPending ? (
          <div role="status" className="flex min-h-48 items-center justify-center gap-3 text-sm text-ink-500">
            <Spinner />
            <span>Loading products</span>
          </div>
        ) : productsQuery.isError ? (
          <ErrorState message={productsQuery.error?.message} onRetry={() => productsQuery.refetch()} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            compact
            icon={Package}
            title={search ? 'No matching products' : 'No products yet'}
            message={search ? 'Try another product name.' : 'Add products to your inventory to start a sale.'}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const stockQty = Number(product.stockQty) || 0;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  disabled={stockQty <= 0}
                  className="group flex min-h-36 flex-col rounded-md border border-ink-200 bg-white p-3 text-left transition-colors hover:border-brand hover:bg-brand-soft/30 disabled:cursor-not-allowed disabled:opacity-55 sm:min-h-40 sm:p-4"
                >
                  <span className="line-clamp-2 text-sm font-semibold text-ink">{product.name}</span>
                  <span className="num mt-2 text-base font-bold text-brand">{formatMoney(product.unitPrice, 'UGX')}</span>
                  <span className="mt-auto pt-3 text-xs text-ink-500">
                    Stock: <span className="num font-medium text-ink-700">{formatNumber(stockQty)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <aside className="rounded-md border border-ink-200 bg-white lg:sticky lg:top-24" aria-labelledby="cart-title">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
          <h2 id="cart-title" className="font-semibold">Current sale</h2>
          <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
          </span>
        </div>
        {cartItems.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center px-4 py-6 text-center text-ink-500">
            <ShoppingBasket className="mb-2 h-6 w-6 text-ink-300" aria-hidden="true" />
            <p className="text-sm">Your cart is empty</p>
          </div>
        ) : (
          <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto px-4">
            {cartItems.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="num mt-0.5 text-xs text-ink-500">{formatMoney(item.unitPrice, 'UGX')} each</p>
                  </div>
                  <p className="num shrink-0 text-sm font-semibold">{formatMoney(item.unitPrice * item.quantity, 'UGX')}</p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.id, -1)}
                    aria-label={`Decrease ${item.name} quantity`}
                    className="flex h-8 w-8 items-center justify-center rounded border border-ink-200 text-ink-600 hover:bg-ink-100"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="num min-w-8 text-center text-sm font-medium" aria-live="polite">{formatNumber(item.quantity)}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.id, 1)}
                    disabled={item.quantity >= item.stockQty}
                    aria-label={`Increase ${item.name} quantity`}
                    className="flex h-8 w-8 items-center justify-center rounded border border-ink-200 text-ink-600 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  {item.quantity >= item.stockQty && <span className="text-xs text-ochre-dark">All available stock</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-ink-100 px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-600">Total</span>
            <span className="num text-lg font-bold">{formatMoney(total, 'UGX')}</span>
          </div>
          <Button className="w-full" size="lg" disabled={cartItems.length === 0} onClick={confirmSale}>
            Confirm Sale
          </Button>
        </div>
      </aside>
    </div>
  );
}
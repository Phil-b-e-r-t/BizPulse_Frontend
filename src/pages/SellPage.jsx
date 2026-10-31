import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag } from 'lucide-react';
import { listProducts } from '../api/products';
import { createTransaction } from '../api/transactions';
import { newIdempotencyKey } from '../api/client';
import { friendlyError } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import ProductGrid from '../features/sell/ProductGrid';
import CartPanel from '../features/sell/CartPanel';
import { formatMoney } from '../utils/format';

export default function SellPage() {
  const { business } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const idempotencyRef = useRef({ signature: '', key: '' });
  const currency = business?.currency || 'UGX';

  const productQuery = useQuery({
    queryKey: ['products', 'sell', deferredSearch],
    queryFn: () => listProducts({ search: deferredSearch || undefined, limit: 100 }),
  });

  useEffect(() => { document.title = 'Sell · BizPulse'; }, []);

  const saleMutation = useMutation({
    mutationFn: ({ payload, key }) => createTransaction(payload, key),
    onSuccess: (transaction, { payload }) => {
      setCart([]);
      setCustomerName('');
      setPaymentMethod('cash');
      idempotencyRef.current = { signature: '', key: '' };
      push(`Sale recorded · ${formatMoney(transaction?.amount ?? payload.amount, currency)}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => push(friendlyError(error), 'error'),
  });

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) => item.product.id === product.id
          ? { ...item, product, quantity: Math.min(item.quantity + 1, product.stockQty) }
          : item);
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const changeQuantity = (productId, amount) => {
    setCart((current) => current.map((item) => item.product.id === productId
      ? { ...item, quantity: Math.max(1, Math.min(item.quantity + amount, item.product.stockQty)) }
      : item));
  };

  const total = cart.reduce((sum, item) => sum + item.product.unitPrice * item.quantity, 0);
  const saleSignature = useMemo(() => JSON.stringify({
    items: cart.map(({ product, quantity }) => [product.id, quantity, product.unitPrice]),
    paymentMethod,
    customerName: customerName.trim(),
  }), [cart, paymentMethod, customerName]);

  const submitSale = (event) => {
    event.preventDefault();
    if (!cart.length || saleMutation.isPending) return;

    if (idempotencyRef.current.signature !== saleSignature) {
      idempotencyRef.current = { signature: saleSignature, key: newIdempotencyKey() };
    }

    const payload = {
      type: 'sale',
      channel: 'pos',
      amount: total,
      paymentMethod,
      customerName: customerName.trim() || undefined,
      items: cart.map(({ product, quantity }) => ({
        productId: product.id,
        quantity,
        unitPrice: product.unitPrice,
      })),
    };
    saleMutation.mutate({ payload, key: idempotencyRef.current.key });
  };

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">New sale</h2>
          <p className="mt-1 text-sm text-ink-500">Shop counter · {business?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-6">
        <ProductGrid query={productQuery} search={search} onSearch={setSearch} onAdd={addToCart} currency={currency} />
        <CartPanel
          cart={cart}
          currency={currency}
          paymentMethod={paymentMethod}
          onPaymentMethod={setPaymentMethod}
          customerName={customerName}
          onCustomerName={setCustomerName}
          onQuantity={changeQuantity}
          onRemove={(productId) => setCart((current) => current.filter((item) => item.product.id !== productId))}
          onClear={() => setCart([])}
          onSubmit={submitSale}
          submitting={saleMutation.isPending}
        />
      </div>

      {cart.length > 0 && (
        <button
          type="button"
          onClick={() => document.getElementById('current-sale')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="fixed bottom-20 right-4 z-20 flex min-h-12 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white shadow-pop lg:hidden"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          View sale · {formatMoney(total, currency)}
        </button>
      )}
    </div>
  );
}

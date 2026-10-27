import { Banknote, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import { formatMoney } from '../../utils/format';

const PAYMENTS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Card' },
];

export default function CartPanel({
  cart,
  currency,
  paymentMethod,
  onPaymentMethod,
  customerName,
  onCustomerName,
  onQuantity,
  onRemove,
  onClear,
  onSubmit,
  submitting,
}) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.product.unitPrice * item.quantity, 0);

  return (
    <aside id="current-sale" aria-label="Current sale" className="scroll-mt-24 self-start lg:sticky lg:top-24">
      <form onSubmit={onSubmit} className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="font-semibold text-ink">Current sale</h2>
            <p className="mt-0.5 text-xs text-ink-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
          </div>
          {cart.length > 0 && (
            <button type="button" onClick={onClear} className="min-h-11 rounded-md px-2 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-brick">Clear</button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
            <ShoppingBag className="h-7 w-7 text-ink-300" strokeWidth={1.5} aria-hidden="true" />
            <p className="mt-3 font-medium text-ink-700">Your sale is empty</p>
            <p className="mt-1 max-w-56 text-sm leading-6 text-ink-500">Select a product to start a new sale.</p>
          </div>
        ) : (
          <ul className="max-h-[340px] divide-y divide-ink-100 overflow-y-auto px-4 sm:px-5">
            {cart.map(({ product, quantity }) => (
              <li key={product.id} className="py-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{formatMoney(product.unitPrice, currency)} / {product.unit}</p>
                  </div>
                  <button type="button" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name}`} className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md text-ink-400 hover:bg-brick-soft hover:text-brick">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-md border border-ink-200">
                    <button type="button" onClick={() => onQuantity(product.id, -1)} aria-label={`Decrease ${product.name} quantity`} className="flex h-10 w-10 items-center justify-center rounded-l-md text-ink-500 hover:bg-ink-100 disabled:text-ink-300" disabled={quantity <= 1}>
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-9 text-center text-sm font-semibold" aria-label={`Quantity ${quantity}`}>{quantity}</span>
                    <button type="button" onClick={() => onQuantity(product.id, 1)} aria-label={`Increase ${product.name} quantity`} className="flex h-10 w-10 items-center justify-center rounded-r-md text-ink-500 hover:bg-ink-100 disabled:text-ink-300" disabled={quantity >= product.stockQty}>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-ink">{formatMoney(product.unitPrice * quantity, currency)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-ink-100 bg-paper/55 px-4 py-4 sm:px-5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium text-ink-700">Total</span>
            <span className="text-xl font-bold tracking-tight text-ink">{formatMoney(total, currency)}</span>
          </div>

          <div className="mt-5">
            <label htmlFor="customer-name" className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink-800">
              Customer <span className="text-xs font-normal text-ink-400">Optional</span>
            </label>
            <input
              id="customer-name"
              value={customerName}
              onChange={(event) => onCustomerName(event.target.value)}
              placeholder="Customer name"
              autoComplete="off"
              className="h-11 w-full rounded-md border border-ink-300 bg-white px-3 text-base text-ink placeholder:text-ink-400 hover:border-ink-400"
            />
          </div>

          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium text-ink-800">Payment method</legend>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENTS.map((payment) => (
                <button
                  key={payment.value}
                  type="button"
                  aria-pressed={paymentMethod === payment.value}
                  onClick={() => onPaymentMethod(payment.value)}
                  className={`min-h-11 rounded-md border px-2 text-xs font-semibold transition-colors sm:text-sm ${paymentMethod === payment.value ? 'border-brand bg-brand-soft text-brand-dark' : 'border-ink-300 bg-white text-ink-500 hover:border-ink-400 hover:text-ink'}`}
                >
                  {payment.label}
                </button>
              ))}
            </div>
          </fieldset>

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={!cart.length} loading={submitting}>
            <Banknote className="h-5 w-5" aria-hidden="true" />
            {submitting ? 'Recording sale' : 'Complete sale'}
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-ink-400">Stock levels update after the sale is recorded.</p>
        </div>
      </form>
    </aside>
  );
}

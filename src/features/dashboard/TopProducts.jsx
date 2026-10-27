import { Package } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import { formatMoney, formatNumber } from '../../utils/format';

export default function TopProducts({ products, currency }) {
  return (
    <section className="card p-4 lg:p-5" aria-labelledby="top-title">
      <h2 id="top-title" className="text-base font-semibold">Best sellers</h2>
      {products.length === 0 ? (
        <EmptyState compact icon={Package} title="No product sales yet" message="Your best sellers will show here after your first sale with products." />
      ) : (
        <div className="-mx-1 mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-500">
                <th scope="col" className="px-1 pb-2 font-medium">Product</th>
                <th scope="col" className="px-1 pb-2 text-right font-medium">Sold</th>
                <th scope="col" className="px-1 pb-2 text-right font-medium">Money in</th>
                <th scope="col" className="px-1 pb-2 text-right font-medium">Gross profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {products.map((p) => (
                <tr key={p.productId}>
                  <td className="px-1 py-2.5 font-medium">{p.name}</td>
                  <td className="num px-1 py-2.5 text-right">{formatNumber(p.quantity)}</td>
                  <td className="num px-1 py-2.5 text-right">{formatMoney(p.revenue, currency)}</td>
                  <td className="num px-1 py-2.5 text-right text-ink-500">{formatMoney(p.grossProfit, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

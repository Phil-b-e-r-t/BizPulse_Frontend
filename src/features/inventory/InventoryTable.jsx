import { ArrowDownUp, Pencil } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { formatMoney, formatNumber, formatUnit } from '../../utils/format';

function StockStatus({ product }) {
  if (Number(product.stockQty) <= 0) return <Badge tone="red">Out of stock</Badge>;
  if (product.lowStock) return <Badge tone="amber">Low stock</Badge>;
  return <Badge tone="green">In stock</Badge>;
}

function Actions({ product, onEdit, onAdjust, mobile = false }) {
  return (
    <div className={`flex items-center gap-2 ${mobile ? 'mt-4' : 'justify-end'}`}>
      <Button type="button" variant="secondary" size="sm" className={mobile ? 'h-11 flex-1' : ''} onClick={() => onAdjust(product)}>
        <ArrowDownUp className="h-4 w-4" aria-hidden="true" /> Adjust
      </Button>
      <Button type="button" variant="ghost" size="sm" className={mobile ? 'h-11 flex-1' : ''} onClick={() => onEdit(product)}>
        <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
      </Button>
    </div>
  );
}

export default function InventoryTable({ products, currency, canEdit, onEdit, onAdjust }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ink-200 bg-paper/60 text-xs font-semibold uppercase tracking-wide text-ink-500">
              <th scope="col" className="px-5 py-3">Product</th>
              <th scope="col" className="px-4 py-3">Selling price</th>
              <th scope="col" className="px-4 py-3 text-right">On hand</th>
              <th scope="col" className="hidden px-4 py-3 text-right xl:table-cell">Stock value</th>
              <th scope="col" className="px-4 py-3">Status</th>
              {canEdit && <th scope="col" className="px-5 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {products.map((product) => (
              <tr key={product.id} className="bg-white transition-colors hover:bg-paper/45">
                <td className="px-5 py-4">
                  <p className="font-semibold text-ink">{product.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-ink-400">{product.sku}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-ink">{formatMoney(product.unitPrice, currency)}</p>
                  <p className="mt-1 text-xs text-ink-400">per {product.unit}</p>
                </td>
                <td className="px-4 py-4 text-right">
                  <p className="font-semibold text-ink">{formatNumber(product.stockQty)}</p>
                  <p className="mt-1 text-xs text-ink-400">{formatUnit(product.stockQty, product.unit)}</p>
                </td>
                <td className="hidden px-4 py-4 text-right text-sm font-medium text-ink-700 xl:table-cell">{formatMoney(product.stockQty * product.costPrice, currency)}</td>
                <td className="px-4 py-4"><StockStatus product={product} /></td>
                {canEdit && <td className="px-5 py-4"><Actions product={product} onEdit={onEdit} onAdjust={onAdjust} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-ink-100 md:hidden">
        {products.map((product) => (
          <li key={product.id} className="bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-ink">{product.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-ink-400">{product.sku}</p>
              </div>
              <StockStatus product={product} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-ink-500">On hand</dt>
                <dd className="mt-1 font-semibold text-ink">{formatNumber(product.stockQty)} {formatUnit(product.stockQty, product.unit)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Selling price</dt>
                <dd className="mt-1 font-semibold text-ink">{formatMoney(product.unitPrice, currency)}</dd>
              </div>
            </dl>
            {canEdit && <Actions product={product} onEdit={onEdit} onAdjust={onAdjust} mobile />}
          </li>
        ))}
      </ul>
    </>
  );
}

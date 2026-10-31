import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Dialog from '../../components/ui/Dialog';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import FormAlert from '../../components/FormAlert';
import { adjustProductStock } from '../../api/products';
import { applyServerError } from '../../utils/forms';
import { formatNumber, formatUnit } from '../../utils/format';

export default function StockAdjustmentDialog({ open, onClose, product, onSaved }) {
  const [direction, setDirection] = useState('add');
  const { register, handleSubmit, reset, watch, setError, clearErrors, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { quantity: 1, reason: '' },
  });
  const quantity = Number(watch('quantity')) || 0;

  useEffect(() => {
    if (open) {
      setDirection('add');
      reset({ quantity: 1, reason: '' });
    }
  }, [open, product, reset]);

  const onSubmit = async (values) => {
    clearErrors('root.server');
    const adjustment = direction === 'add' ? values.quantity : -values.quantity;
    if (Number(product.stockQty) + adjustment < 0) {
      setError('quantity', { type: 'validate', message: 'This would leave stock below zero' });
      return;
    }
    try {
      await adjustProductStock(product.id, adjustment, values.reason.trim());
      onSaved(`Stock updated for ${product.name}`);
      onClose();
    } catch (error) {
      applyServerError(error, setError, ['quantity', 'reason']);
    }
  };

  if (!product) return null;
  const nextStock = Number(product.stockQty) + (direction === 'add' ? quantity : -quantity);

  return (
    <Dialog open={open} onClose={onClose} title="Adjust stock" description={`${product.name} · ${formatNumber(product.stockQty)} ${formatUnit(product.stockQty, product.unit)} currently on hand`}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 p-5 sm:p-6">
        <FormAlert>{errors.root?.server?.message}</FormAlert>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-800">Adjustment type</legend>
          <div className="grid grid-cols-2 gap-2">
            {[{ value: 'add', label: 'Stock in' }, { value: 'remove', label: 'Stock out' }].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={direction === option.value}
                onClick={() => setDirection(option.value)}
                className={`min-h-11 rounded-md border px-3 text-sm font-semibold ${direction === option.value ? 'border-brand bg-brand-soft text-brand-dark' : 'border-ink-300 bg-white text-ink-500 hover:border-ink-400'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <Field label={`Quantity (${product.unit})`} type="number" min="0.0001" step="any" inputMode="decimal" error={errors.quantity?.message} {...register('quantity', { required: 'Enter a quantity', min: { value: 0.0001, message: 'Quantity must be greater than zero' }, valueAsNumber: true })} />
        <Field label="Reason" placeholder={direction === 'add' ? 'e.g. New stock received' : 'e.g. Damaged items'} error={errors.reason?.message} {...register('reason', { required: 'Enter a reason for this adjustment' })} />
        <div className="rounded-md bg-paper px-4 py-3 text-sm text-ink-700">
          Stock after adjustment: <strong className="text-ink">{formatNumber(Math.max(0, nextStock))} {formatUnit(nextStock, product.unit)}</strong>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isSubmitting ? 'Updating stock' : 'Update stock'}</Button>
        </div>
      </form>
    </Dialog>
  );
}

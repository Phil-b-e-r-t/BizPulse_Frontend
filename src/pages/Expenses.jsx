import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { createTransaction } from '../api/transactions';
import { newIdempotencyKey } from '../api/client';
import { friendlyError } from '../api/errors';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import FormAlert from '../components/FormAlert';
import { useToast } from '../components/ui/Toast';

const PAYMENT_METHODS = [
  ['cash', 'Cash'],
  ['mobile_money', 'Mobile money'],
  ['card', 'Card'],
  ['bank', 'Bank'],
  ['credit', 'Credit'],
];

export default function ExpensesPage() {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setError, clearErrors, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { amount: '', category: '', description: '', paymentMethod: 'cash' },
  });

  useEffect(() => { document.title = 'Expenses · BizPulse'; }, []);

  const onSubmit = async (values) => {
    clearErrors('root.server');
    const payload = {
      type: 'expense',
      amount: values.amount,
      category: values.category.trim() || undefined,
      description: values.description.trim() || undefined,
      paymentMethod: values.paymentMethod,
    };

    try {
      await createTransaction(payload, newIdempotencyKey());
      reset({ amount: '', category: '', description: '', paymentMethod: 'cash' });
      push('Expense recorded', 'success');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (error) {
      setError('root.server', {
        type: 'server',
        message: error?.code === 'NETWORK_ERROR' ? friendlyError(error) : error?.message || friendlyError(error),
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Quick Add</h2>
        <p className="mt-1 text-sm text-ink-500">Record a business expense.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card mt-5 space-y-5 p-5 sm:p-6">
        <FormAlert>{errors.root?.server?.message}</FormAlert>
        <Field
          label="Amount"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          error={errors.amount?.message}
          {...register('amount', {
            required: 'Enter an amount',
            min: { value: 0, message: 'Amount cannot be below zero' },
            valueAsNumber: true,
          })}
        />
        <Field label="Category" optional placeholder="e.g. Transport" error={errors.category?.message} {...register('category')} />
        <Field label="Description / Note" optional placeholder="What was this expense for?" error={errors.description?.message} {...register('description')} />
        <div>
          <label htmlFor="expense-payment-method" className="mb-1.5 block text-sm font-medium text-ink-800">Payment method</label>
          <select
            id="expense-payment-method"
            className="block h-11 w-full rounded-md border border-ink-300 bg-white px-3 text-base text-ink hover:border-ink-400"
            {...register('paymentMethod')}
          >
            {PAYMENT_METHODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="flex justify-end border-t border-ink-100 pt-5">
          <Button type="submit" loading={isSubmitting}>{isSubmitting ? 'Recording expense' : 'Record expense'}</Button>
        </div>
      </form>
    </div>
  );
}
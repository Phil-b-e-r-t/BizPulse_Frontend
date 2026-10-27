import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Dialog from '../../components/ui/Dialog';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import FormAlert from '../../components/FormAlert';
import { createProduct, updateProduct } from '../../api/products';
import { applyServerError } from '../../utils/forms';
import { useAuth } from '../../context/AuthContext';

const FIELDS = ['name', 'sku', 'unit', 'costPrice', 'unitPrice', 'stockQty', 'reorderLevel'];

export default function ProductFormDialog({ open, onClose, product, onSaved }) {
  const { business } = useAuth();
  const editing = Boolean(product);
  const currency = business?.currency || 'UGX';
  const { register, handleSubmit, reset, setError, clearErrors, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (!open) return;
    reset({
      name: product?.name || '',
      sku: product?.sku || '',
      unit: product?.unit || '',
      costPrice: product?.costPrice ?? 0,
      unitPrice: product?.unitPrice ?? 0,
      stockQty: product?.stockQty ?? 0,
      reorderLevel: product?.reorderLevel ?? 0,
    });
  }, [open, product, reset]);

  const onSubmit = async (values) => {
    clearErrors('root.server');
    const payload = {
      name: values.name.trim(),
      sku: values.sku.trim().toUpperCase(),
      unit: values.unit.trim(),
      costPrice: values.costPrice,
      unitPrice: values.unitPrice,
      reorderLevel: values.reorderLevel,
    };
    if (!editing) payload.stockQty = values.stockQty;

    try {
      if (editing) await updateProduct(product.id, payload);
      else await createProduct(payload);
      onSaved(editing ? 'Product details updated' : 'Product added to inventory');
      onClose();
    } catch (error) {
      applyServerError(error, setError, FIELDS);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit product' : 'Add a product'}
      description={editing ? 'Update product details and pricing. Stock is changed separately.' : 'Create a product and set its opening stock level.'}
      wide
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 sm:p-6">
        <FormAlert>{errors.root?.server?.message}</FormAlert>
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <Field label="Product name" placeholder="e.g. Rice (50kg)" error={errors.name?.message} {...register('name', { required: 'Enter the product name' })} />
          <Field label="Stock code (SKU)" placeholder="e.g. RICE-50" autoCapitalize="characters" error={errors.sku?.message} {...register('sku', { required: 'Enter a stock code' })} />
          <Field label="Unit" placeholder="piece, kg, bag" hint="What one selling unit is called" error={errors.unit?.message} {...register('unit', { required: 'Enter a unit' })} />
          <Field label="Low-stock alert at" type="number" min="0" step="any" inputMode="decimal" error={errors.reorderLevel?.message} {...register('reorderLevel', { required: 'Enter a reorder level', min: { value: 0, message: 'Cannot be below zero' }, valueAsNumber: true })} />
          <Field label={`Cost price (${currency})`} type="number" min="0" step="any" inputMode="decimal" error={errors.costPrice?.message} {...register('costPrice', { required: 'Enter the cost price', min: { value: 0, message: 'Cannot be below zero' }, valueAsNumber: true })} />
          <Field label={`Selling price (${currency})`} type="number" min="0" step="any" inputMode="decimal" error={errors.unitPrice?.message} {...register('unitPrice', { required: 'Enter the selling price', min: { value: 0, message: 'Cannot be below zero' }, valueAsNumber: true })} />
          {!editing && <Field label="Opening stock" type="number" min="0" step="any" inputMode="decimal" hint="Leave as zero if stock has not arrived" error={errors.stockQty?.message} {...register('stockQty', { required: 'Enter the opening stock', min: { value: 0, message: 'Cannot be below zero' }, valueAsNumber: true })} />}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-ink-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isSubmitting ? 'Saving product' : editing ? 'Save changes' : 'Add product'}</Button>
        </div>
      </form>
    </Dialog>
  );
}

import { useForm } from 'react-hook-form';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';

export default function AddSenderForm({ onAdd, isSubmitting }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting: isFormSubmitting } } = useForm({ defaultValues: { role: 'staff' } });

  const submit = async (values) => {
    const payload = { ...values, phone: values.phone.trim(), label: values.label.trim() || undefined };
    try {
      await onAdd(payload);
      reset({ role: 'staff', phone: '', label: '' });
    } catch {
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_10rem_minmax(12rem,1fr)_auto]">
      <Field label="Phone number" placeholder="+256 772 123 456" error={errors.phone?.message} {...register('phone', { required: 'Enter a phone number' })} />
      <div>
        <label htmlFor="sender-role" className="mb-1.5 block text-sm font-medium text-ink-800">Role</label>
        <select
          id="sender-role"
          className="h-11 w-full rounded-md border border-ink-300 bg-white px-3 text-base text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          {...register('role', { required: 'Choose a role' })}
        >
          <option value="owner">Owner</option>
          <option value="staff">Staff</option>
        </select>
        {errors.role?.message && <p role="alert" className="mt-1.5 text-sm text-brick">{errors.role.message}</p>}
      </div>
      <Field label="Label" optional placeholder="e.g. Main shop" error={errors.label?.message} {...register('label')} />
      <div className="sm:col-span-2 lg:col-span-1 lg:pt-[1.65rem]">
        <Button type="submit" loading={isSubmitting || isFormSubmitting} className="w-full">
          {isSubmitting || isFormSubmitting ? 'Adding' : 'Add number'}
        </Button>
      </div>
    </form>
  );
}
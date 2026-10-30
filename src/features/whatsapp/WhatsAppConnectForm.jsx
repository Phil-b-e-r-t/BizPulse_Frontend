import { useForm } from 'react-hook-form';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';

export default function WhatsAppConnectForm({ onConnect, isSubmitting }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting: isFormSubmitting } } = useForm();

  const submit = async (values) => {
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value),
    );
    try {
      await onConnect(payload);
      reset();
    } catch {
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone number ID" placeholder="Meta phone number ID" error={errors.phoneNumberId?.message} {...register('phoneNumberId', { required: 'Enter the phone number ID' })} />
        <Field label="Access token" type="password" placeholder="Meta access token" error={errors.accessToken?.message} {...register('accessToken', { required: 'Enter the access token' })} />
        <Field label="WhatsApp Business Account ID" optional placeholder="WABA ID" error={errors.wabaId?.message} {...register('wabaId')} />
        <Field label="Display phone number" optional placeholder="+256 772 123 456" error={errors.displayPhoneNumber?.message} {...register('displayPhoneNumber')} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting || isFormSubmitting}>
          {isSubmitting || isFormSubmitting ? 'Connecting' : 'Connect WhatsApp'}
        </Button>
      </div>
    </form>
  );
}
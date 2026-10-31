import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { applyServerError } from '../utils/forms';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import FormAlert from '../components/FormAlert';

const FIELDS = ['businessName', 'ownerName', 'email', 'phone', 'password'];

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, clearErrors, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { businessName: '', ownerName: '', email: '', phone: '', password: '' },
  });

  // The button stays faint and disabled until every required field has a value (phone is optional).
  const [businessName, ownerName, email, password] = watch(['businessName', 'ownerName', 'email', 'password']);
  const canSubmit = Boolean(businessName.trim() && ownerName.trim() && email.trim() && password);

  useEffect(() => { document.title = 'Create account · BizPulse'; }, []);

  const onSubmit = async (values) => {
    clearErrors('root.server');
    const payload = {
      businessName: values.businessName.trim(),
      ownerName: values.ownerName.trim(),
      email: values.email.trim(),
      password: values.password,
    };
    if (values.phone.trim()) payload.phone = values.phone.trim(); // optional; the server accepts 0772 123 456 or +256 772 123456
    try {
      await registerAccount(payload);
      push(`Welcome to BizPulse, ${payload.ownerName.split(' ')[0]}`, 'success');
      navigate('/', { replace: true });
    } catch (err) {
      applyServerError(err, setError, FIELDS);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Create your business account</h1>
      <p className="mt-1.5 text-ink-500">It takes about a minute. You can add products and staff afterwards.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        <FormAlert>{errors.root?.server?.message}</FormAlert>

        <Field
          label="Business name"
          required
          autoComplete="organization"
          placeholder="Ama Provisions"
          error={errors.businessName?.message}
          {...register('businessName', { required: 'Enter your business name', maxLength: { value: 120, message: 'Use 120 characters or fewer' } })}
        />
        <Field
          label="Your name"
          required
          autoComplete="name"
          error={errors.ownerName?.message}
          {...register('ownerName', { required: 'Enter your name' })}
        />
        <Field
          label="Email"
          required
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'Enter your email',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email, like ama@example.com' },
          })}
        />
        <Field
          label="Phone number"
          optional
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="0772 123 456"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Field
          label="Password"
          required
          type="password"
          autoComplete="new-password"
          hint="8 to 72 characters"
          error={errors.password?.message}
          {...register('password', {
            required: 'Choose a password',
            minLength: { value: 8, message: 'Use at least 8 characters' },
            maxLength: { value: 72, message: 'Use 72 characters or fewer' },
          })}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full disabled:opacity-60"
          loading={isSubmitting}
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Creating account' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="rounded font-semibold text-brand hover:underline">Log in</Link>
      </p>
    </>
  );
}

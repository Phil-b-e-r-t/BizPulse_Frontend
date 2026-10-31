import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { applyServerError } from '../utils/forms';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import FormAlert from '../components/FormAlert';

const FIELDS = ['email', 'password'];

export default function LoginPage() {
  const { login, sessionExpired, clearExpiredNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, setError, clearErrors, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  // The button stays faint and disabled until every required field has a value.
  const [email, password] = watch(['email', 'password']);
  const canSubmit = Boolean(email.trim() && password);

  useEffect(() => { document.title = 'Log in · BizPulse'; }, []);

  const onSubmit = async (values) => {
    clearErrors('root.server');
    clearExpiredNotice();
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      applyServerError(err, setError, FIELDS);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Log in to BizPulse</h1>
      <p className="mt-1.5 text-ink-500">See how your business is doing today.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {sessionExpired && !errors.root?.server && <FormAlert tone="info">Your session expired. Log in again to continue.</FormAlert>}
        <FormAlert>{errors.root?.server?.message}</FormAlert>

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
          label="Password"
          required
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', { required: 'Enter your password' })}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full disabled:opacity-60"
          loading={isSubmitting}
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Logging in' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-500">
        New to BizPulse?{' '}
        <Link to="/register" className="rounded font-semibold text-brand hover:underline">Create a business account</Link>
      </p>
    </>
  );
}

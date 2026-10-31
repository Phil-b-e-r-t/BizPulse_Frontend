import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { acceptInvite, getInviteDetails } from '../api/invites';
import { friendlyError } from '../api/errors';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import Field from '../components/ui/Field';
import FormAlert from '../components/FormAlert';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

function InvalidInvite({ expired = false }) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold tracking-tight">{expired ? 'Invitation expired' : 'Invitation link is invalid'}</h1>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        {expired
          ? 'This invitation has expired. Ask the business owner to send you a new one.'
          : 'This invitation link is not valid. Check the link or ask the business owner to resend it.'}
      </p>
      <Link to="/login" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
        Go to login
      </Link>
    </div>
  );
}

function AcceptInviteForm({ invite, token }) {
  const { applyAuthResponse } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: invite.email, name: '', password: '' },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: (data) => {
      applyAuthResponse(data);
      push(`Welcome to ${data.business?.name || invite.businessName}`, 'success');
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => {
      setError('root.server', {
        type: error.code || 'server',
        message: error.code === 'EMAIL_TAKEN'
          ? 'An account already exists with this email. Log in to continue.'
          : friendlyError(error),
      });
    },
  });

  const submit = async ({ name, password }) => {
    try {
      await acceptMutation.mutateAsync({ token, password, name: name.trim() });
    } catch {
      return;
    }
  };

  useEffect(() => { document.title = `Join ${invite.businessName} · BizPulse`; }, [invite.businessName]);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Join {invite.businessName} as {invite.role}</h1>
      <p className="mt-1.5 text-ink-500">Create your password to accept the invitation.</p>

      <form onSubmit={handleSubmit(submit)} noValidate className="mt-8 space-y-5">
        <FormAlert>
          {errors.root?.server?.message}
          {errors.root?.server?.type === 'EMAIL_TAKEN' && <> <Link to="/login" className="font-semibold underline">Log in</Link></>}
        </FormAlert>

        <Field label="Email" type="email" autoComplete="email" readOnly {...register('email')} />
        <Field label="Name" autoComplete="name" optional {...register('name')} />
        <Field
          label="Password"
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
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {isSubmitting ? 'Joining business' : 'Accept invitation'}
        </Button>
      </form>
    </>
  );
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const inviteQuery = useQuery({
    queryKey: ['invite', 'details', token],
    queryFn: ({ signal }) => getInviteDetails(token, { signal }),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => { document.title = 'Accept invitation · BizPulse'; }, []);

  if (!token) return <InvalidInvite />;
  if (inviteQuery.isPending) {
    return (
      <div role="status" aria-label="Loading invitation" className="space-y-4">
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="mt-8 h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (inviteQuery.isError) {
    if (inviteQuery.error.code === 'INVITE_INVALID') return <InvalidInvite />;
    if (inviteQuery.error.code === 'INVITE_EXPIRED') return <InvalidInvite expired />;
    return <ErrorState title="Could not load invitation" message={friendlyError(inviteQuery.error)} onRetry={() => inviteQuery.refetch()} />;
  }

  return <AcceptInviteForm invite={inviteQuery.data} token={token} />;
}
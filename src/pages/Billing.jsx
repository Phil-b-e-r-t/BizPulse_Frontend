import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { getSubscription, initializePayment } from '../api/payments';
import { friendlyError } from '../api/errors';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const PLANS = [
  { id: 'growth', name: 'Growth', description: 'More room to grow your business.' },
  { id: 'pro', name: 'Pro', description: 'Advanced tools for your team.' },
];

function displayDate(value) {
  if (!value) return 'No renewal scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export default function Billing() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const subscriptionQuery = useQuery({
    queryKey: ['payments', 'subscription'],
    queryFn: getSubscription,
  });

  const checkoutMutation = useMutation({
    mutationFn: initializePayment,
    onSuccess: (result) => {
      if (!result?.paymentLink) {
        push('Could not start checkout. Please try again.', 'error');
        return;
      }
      window.location.assign(result.paymentLink);
    },
    onError: (error) => push(friendlyError(error), 'error'),
  });

  useEffect(() => { document.title = 'Billing · BizPulse'; }, []);

  const subscription = subscriptionQuery.data?.subscription || subscriptionQuery.data;
  const plan = subscription?.plan || 'Free';
  const status = subscription?.status || 'unknown';
  const renewalDate = subscription?.renewalDate
    || subscription?.renewsAt
    || subscription?.nextRenewalAt
    || subscription?.currentPeriodEnd;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="card p-4 sm:p-5" aria-labelledby="current-plan-title">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="current-plan-title" className="text-base font-semibold">Current plan</h2>
            {subscriptionQuery.isPending ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-56" />
              </div>
            ) : subscriptionQuery.isError ? (
              <ErrorState compact title="Could not load your subscription" message={friendlyError(subscriptionQuery.error)} onRetry={() => subscriptionQuery.refetch()} />
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-xl font-bold capitalize text-ink">{plan}</p>
                <Badge tone={status === 'active' ? 'green' : status === 'past_due' || status === 'failed' ? 'red' : 'amber'}>
                  {status.replaceAll('_', ' ')}
                </Badge>
                <p className="w-full text-sm text-ink-500">Renews {displayDate(renewalDate)}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="upgrade-title">
        <div className="mb-3">
          <h2 id="upgrade-title" className="text-base font-semibold">Choose a plan</h2>
          <p className="mt-1 text-sm text-ink-500">Select a plan to continue to secure checkout.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLANS.map((option) => (
            <article key={option.id} className="card flex flex-col gap-4 p-4 sm:p-5">
              <div>
                <h3 className="text-lg font-semibold capitalize">{option.name}</h3>
                <p className="mt-1 text-sm text-ink-500">{option.description}</p>
              </div>
              <Button
                type="button"
                disabled={subscriptionQuery.isPending || subscriptionQuery.isError || checkoutMutation.isPending}
                loading={checkoutMutation.isPending && checkoutMutation.variables === option.id}
                onClick={() => checkoutMutation.mutate(option.id)}
                className="mt-auto w-full"
              >
                Upgrade to {option.name}
              </Button>
            </article>
          ))}
        </div>
      </section>
      {subscription?.status === 'active' && (
        <p className="flex items-center gap-2 text-sm text-brand-dark">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Your subscription is active.
        </p>
      )}
    </div>
  );
}
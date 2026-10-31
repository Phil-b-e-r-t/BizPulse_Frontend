import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { getSubscription } from '../api/payments';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 60_000;

export default function BillingComplete() {
  const [timedOut, setTimedOut] = useState(false);
  const subscriptionQuery = useQuery({
    queryKey: ['payments', 'subscription'],
    queryFn: getSubscription,
    refetchInterval: (query) => {
      const subscription = query.state.data?.subscription || query.state.data;
      return timedOut || subscription?.status === 'active' ? false : POLL_INTERVAL;
    },
  });

  const subscription = subscriptionQuery.data?.subscription || subscriptionQuery.data;
  const active = subscription?.status === 'active';

  useEffect(() => {
    if (active) return undefined;
    const timer = window.setTimeout(() => setTimedOut(true), POLL_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [active]);

  useEffect(() => { document.title = 'Confirming payment · BizPulse'; }, []);

  if (active) {
    return (
      <section className="card mx-auto max-w-xl p-6 text-center sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-bold">Payment confirmed</h1>
        <p className="mt-2 text-sm text-ink-500">Your {subscription.plan || 'subscription'} plan is active.</p>
        <Link to="/" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          Back to dashboard
        </Link>
      </section>
    );
  }

  if (timedOut) {
    return (
      <section className="card mx-auto max-w-xl p-6 text-center sm:p-8" role="alert">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brick-soft text-brick">
          <CircleAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-bold">We couldn’t confirm your payment</h1>
        <p className="mt-2 text-sm text-ink-500">Your payment may still be processing. Check your billing page or try again later.</p>
        <Link to="/settings/billing" className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-ink-300 bg-white px-4 text-sm font-semibold text-ink hover:bg-ink-100">
          Return to billing
        </Link>
      </section>
    );
  }

  return (
    <section className="card mx-auto max-w-xl p-6 text-center sm:p-8" aria-live="polite">
      {subscriptionQuery.isError ? (
        <ErrorState compact title="Still checking your payment" message="We’ll keep checking and update this page when your subscription is active." />
      ) : (
        <>
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <h1 className="mt-4 text-xl font-bold">Confirming your payment...</h1>
          <p className="mt-2 text-sm text-ink-500">This can take a few moments. Keep this page open.</p>
        </>
      )}
    </section>
  );
}
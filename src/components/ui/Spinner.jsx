import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin text-brand ${className}`} aria-hidden="true" />;
}

export function FullPageSpinner({ label = 'Loading' }) {
  return (
    <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper text-ink-500">
      <Spinner className="h-7 w-7" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

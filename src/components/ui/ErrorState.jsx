import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ title = 'Something went wrong', message, onRetry, compact = false }) {
  return (
    <div role="alert" className={`flex flex-col items-center text-center ${compact ? 'py-8' : 'py-14'}`}>
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brick-soft text-brick">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>}
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

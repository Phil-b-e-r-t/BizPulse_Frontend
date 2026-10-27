import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Labelled input with hint and error text, wired for screen readers. Works with react-hook-form's register(). */
const Field = forwardRef(function Field({ label, error, hint, type = 'text', optional, className = '', ...props }, ref) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink-800">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-ink-400">Optional</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={isPassword && show ? 'text' : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`block h-11 w-full rounded-md border bg-white px-3 text-base text-ink placeholder:text-ink-400 ${
            error ? 'border-brick' : 'border-ink-300 hover:border-ink-400'
          } ${isPassword ? 'pr-11' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-ink-500 hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-brick">{error}</p>}
    </div>
  );
});
export default Field;

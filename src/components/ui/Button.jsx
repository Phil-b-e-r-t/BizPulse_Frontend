import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-brand/50',
  secondary: 'border border-ink-300 bg-white text-ink hover:bg-ink-100 disabled:text-ink-400',
  ghost: 'text-ink-700 hover:bg-ink-100 disabled:text-ink-400',
  danger: 'bg-brick text-white hover:bg-brick/90 disabled:bg-brick/50',
};
const SIZES = { md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-base', sm: 'h-8 px-3 text-sm' };

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
export default Button;

import { AlertCircle, Info } from 'lucide-react';

export default function FormAlert({ tone = 'error', children }) {
  if (!children) return null;
  const isError = tone === 'error';
  const Icon = isError ? AlertCircle : Info;
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`mb-5 flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm ${
        isError ? 'border-brick/30 bg-brick-soft text-brick' : 'border-ochre/40 bg-ochre-soft text-ochre-dark'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

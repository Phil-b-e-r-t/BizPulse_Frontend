const TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  green: 'bg-brand-soft text-brand-dark',
  amber: 'bg-ochre-soft text-ochre-dark',
  red: 'bg-brick-soft text-brick',
};
export default function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}>{children}</span>;
}

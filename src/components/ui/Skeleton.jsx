export default function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-ink-100 ${className}`} />;
}

export default function EmptyState({ icon: Icon, title, message, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'py-8' : 'py-14'}`}>
      {Icon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-500">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

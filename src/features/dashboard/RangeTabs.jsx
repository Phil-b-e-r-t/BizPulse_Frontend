const OPTIONS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

export default function RangeTabs({ value, onChange }) {
  return (
    <div role="tablist" aria-label="Time period" className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 rounded-md px-3.5 text-sm font-medium transition-colors ${
            value === o.value ? 'bg-ink text-white' : 'text-ink-500 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
export { OPTIONS as RANGE_OPTIONS };

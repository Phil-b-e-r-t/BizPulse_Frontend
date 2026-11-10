import { useEffect, useId, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import Skeleton from '../ui/Skeleton';
import { friendlyError } from '../../api/errors';

export const inputCls = 'h-10 w-full rounded-md border border-ink-300 bg-white px-3 text-sm text-ink placeholder:text-ink-400 hover:border-ink-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

const STATUS = {
  active: ['green', 'Active'], suspended: ['red', 'Suspended'], locked: ['amber', 'Locked'],
  expired: ['neutral', 'Expired'], pending: ['amber', 'Pending'], cancelled: ['neutral', 'Cancelled'],
  paid: ['green', 'Paid'], unpaid: ['amber', 'Unpaid'], overdue: ['red', 'Overdue'], void: ['neutral', 'Void'],
  terminated: ['red', 'Ended'], success: ['green', 'Success'], failed: ['red', 'Failed'],
};
export function StatusBadge({ status }) {
  const [tone, label] = STATUS[status] || ['neutral', status || 'Unknown'];
  return <Badge tone={tone}>{label}</Badge>;
}

export function PageIntro({ children, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <p className="max-w-2xl text-sm text-ink-500">{children}</p>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand' }) {
  const tones = { brand: 'bg-brand-soft text-brand', amber: 'bg-ochre-soft text-ochre-dark', red: 'bg-brick-soft text-brick', neutral: 'bg-ink-100 text-ink-500' };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {Icon && <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tones[tone]}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>}
      </div>
      <p className="num mt-2 break-words text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search', label = 'Search' }) {
  return (
    <label className="relative block min-w-[220px] flex-1 sm:max-w-xs">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} pl-9`} />
    </label>
  );
}

export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <label className={`flex items-center gap-2 text-sm font-medium text-ink-600 ${className}`}>
      <span className="whitespace-nowrap">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} w-auto min-w-[110px]`}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function DateRange({ from, to, onChange }) {
  const preset = (days) => {
    const end = new Date(); const start = new Date(Date.now() - days * 86_400_000);
    onChange({ from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm font-medium text-ink-600">From
        <input type="date" value={from} max={to || undefined} onChange={(e) => onChange({ from: e.target.value, to })} className={`${inputCls} w-auto`} />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-ink-600">To
        <input type="date" value={to} min={from || undefined} onChange={(e) => onChange({ from, to: e.target.value })} className={`${inputCls} w-auto`} />
      </label>
      {[[7, '7d'], [30, '30d'], [90, '90d'], [365, '1y']].map(([d, l]) => (
        <button key={l} type="button" onClick={() => preset(d)} className="h-8 rounded-md border border-ink-300 bg-white px-2.5 text-xs font-semibold text-ink-700 hover:bg-ink-100">{l}</button>
      ))}
      {(from || to) && <button type="button" onClick={() => onChange({ from: '', to: '' })} className="text-xs font-semibold text-brand hover:underline">Clear</button>}
    </div>
  );
}

export function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.total === 0) return null;
  const { page, totalPages, total, limit } = pagination;
  const start = (page - 1) * limit + 1; const end = Math.min(page * limit, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 text-sm text-ink-500">
      <span className="num">{start}–{end} of {total}</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
        <span className="num text-xs">Page {page} of {totalPages}</span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/** Table card with loading, error and empty states. `columns`: [{ key, label, align, render }] */
export function DataTable({ query, columns, rowKey = 'id', emptyIcon, emptyTitle = 'Nothing found', emptyMessage = 'Try changing the filters.', onPage, onRowClick, minWidth = 760, label }) {
  const items = query.data?.items || [];
  return (
    <section className="card overflow-hidden" aria-label={label}>
      {query.isPending ? (
        <div className="space-y-3 p-4" role="status" aria-label="Loading">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : query.isError ? (
        <ErrorState title="Could not load this list" message={friendlyError(query.error)} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
      ) : (
        <>
          {/* Phones: one card per row, so nothing is hidden off-screen. */}
          <ul className="divide-y divide-ink-100 md:hidden">
            {items.map((row) => {
              const [first, ...rest] = columns;
              const body = rest.filter((c) => c.key !== 'actions');
              const actions = rest.find((c) => c.key === 'actions');
              return (
                <li key={row[rowKey]} className={`space-y-2.5 p-4 ${onRowClick ? 'cursor-pointer active:bg-ink-100/50' : ''}`} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                  <div className="text-sm">{first.render ? first.render(row) : row[first.key]}</div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                    {body.map((c) => (
                      <div key={c.key} className="contents">
                        <dt className="text-xs font-semibold uppercase text-ink-500">{c.label}</dt>
                        <dd className="min-w-0 break-words text-right">{c.render ? c.render(row) : row[c.key]}</dd>
                      </div>
                    ))}
                  </dl>
                  {actions && <div onClick={(e) => e.stopPropagation()}>{actions.render(row)}</div>}
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm" style={{ minWidth }}>
              <thead className="border-b border-ink-200 bg-ink-100/50 text-xs font-semibold uppercase text-ink-500">
                <tr>{columns.map((c) => <th key={c.key} scope="col" className={`px-4 py-3 ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {items.map((row) => (
                  <tr key={row[rowKey]} onClick={onRowClick ? () => onRowClick(row) : undefined} className={onRowClick ? 'cursor-pointer hover:bg-ink-100/40' : ''}>
                    {columns.map((c) => <td key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'num text-right' : ''} ${c.nowrap ? 'whitespace-nowrap' : ''}`}>{c.render ? c.render(row) : row[c.key]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={query.data?.pagination} onPage={onPage} />
        </>
      )}
    </section>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="inline-flex rounded-md border border-ink-200 bg-white p-0.5">
      {tabs.map((t) => (
        <button key={t.value} role="tab" type="button" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={`h-9 rounded px-4 text-sm font-semibold ${value === t.value ? 'bg-brand text-white' : 'text-ink-600 hover:bg-ink-100'}`}>{t.label}</button>
      ))}
    </div>
  );
}

/** Confirmation dialog that can require a written reason (kept in the audit log). */
export function ReasonDialog({ open, onClose, title, description, confirmLabel, danger = true, requireReason = true, loading, error, onConfirm }) {
  const [reason, setReason] = useState('');
  const id = useId();
  useEffect(() => { if (open) setReason(''); }, [open]);
  const tooShort = requireReason && reason.trim().length < 5;
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <form className="space-y-4 px-5 py-5 sm:px-6" onSubmit={(e) => { e.preventDefault(); if (!tooShort) onConfirm(reason.trim()); }}>
        {requireReason && (
          <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">Reason <span className="font-bold text-red-600" aria-hidden="true">*</span></label>
            <textarea id={id} rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} h-auto py-2`} placeholder="Why is this being done? Saved in the audit log." />
            <p className="mt-1 text-xs text-ink-500">At least 5 characters.</p>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-brick">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={danger ? 'danger' : 'primary'} loading={loading} disabled={tooShort}>{confirmLabel}</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function FieldRow({ label, children, hint, error }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">{label}</label>
      {children(id)}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs text-brick">{error}</p>}
    </div>
  );
}

export const fmtDate = (iso) => (iso ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—');
export const fmtStamp = (iso) => (iso ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) : '—');
export function timeAgo(iso) {
  if (!iso) return '—';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Just now'; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

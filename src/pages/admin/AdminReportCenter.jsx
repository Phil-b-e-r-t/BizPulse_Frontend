import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, CreditCard, Download, FileSpreadsheet, FileText, Printer, ScrollText, Users } from 'lucide-react';
import { generateReport } from '../../api/admin';
import { friendlyError } from '../../api/errors';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import { DateRange, PageIntro, Pagination, Select, fmtStamp } from '../../components/admin/ui';
import { downloadCsv, printDocument, reportToHtml } from '../../utils/export';

const CATEGORIES = [
  { id: 'users', label: 'User accounts', icon: Users, filter: ['status', 'Status', ['active', 'suspended', 'locked']] },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, filter: ['status', 'Status', ['active', 'pending', 'expired', 'cancelled']] },
  { id: 'invoices', label: 'Invoices', icon: FileText, filter: ['status', 'Status', ['paid', 'unpaid', 'overdue', 'void']] },
  { id: 'financial', label: 'Financial', icon: Banknote },
  { id: 'security', label: 'Security and audit', icon: ScrollText },
];
const PAGE = 15;

export default function AdminReportCenter() {
  useEffect(() => { document.title = 'Report center · BizPulse'; }, []);
  const [cat, setCat] = useState('invoices'); const [range, setRange] = useState({ from: '', to: '' }); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const [params, setParams] = useState(null); const [blocked, setBlocked] = useState(false);
  const meta = CATEGORIES.find((c) => c.id === cat);
  useEffect(() => { setStatus(''); setParams(null); }, [cat]);
  useEffect(() => { setPage(1); }, [params]);

  const q = useQuery({ queryKey: ['admin', 'report', params], queryFn: () => generateReport(params.cat, { from: params.from, to: params.to, status: params.status }), enabled: !!params, staleTime: 0 });
  const r = q.data;
  const pagination = useMemo(() => (r ? { page, limit: PAGE, total: r.rows.length, totalPages: Math.max(Math.ceil(r.rows.length / PAGE), 1) } : null), [r, page]);
  const stamp = new Date().toISOString().slice(0, 10);
  const subtitle = r ? `${meta.label} report · ${range.from || 'start'} to ${range.to || 'today'} · generated ${fmtStamp(r.generatedAt)}` : '';

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageIntro>Generate a report, review it on screen, then export it as CSV or PDF.</PageIntro>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" role="radiogroup" aria-label="Report category">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={cat === c.id} onClick={() => setCat(c.id)}
            className={`card flex items-center gap-3 p-3 text-left ${cat === c.id ? 'border-brand ring-2 ring-brand/20' : 'hover:bg-ink-100/40'}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${cat === c.id ? 'bg-brand text-white' : 'bg-ink-100 text-ink-500'}`}><c.icon className="h-4 w-4" aria-hidden="true" /></span>
            <span className="text-sm font-semibold">{c.label}</span>
          </button>
        ))}
      </div>
      <section className="card space-y-3 p-4" aria-label="Report filters">
        <DateRange {...range} onChange={setRange} />
        <div className="flex flex-wrap items-center gap-3">
          {meta.filter && <Select label={meta.filter[1]} value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, ...meta.filter[2].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]} />}
          <Button onClick={() => setParams({ cat, ...range, status })} loading={q.isFetching}><FileSpreadsheet className="h-4 w-4" aria-hidden="true" />Generate report</Button>
        </div>
      </section>

      {!params ? <section className="card"><EmptyState icon={FileSpreadsheet} title="No report yet" message="Choose a category and dates, then generate." /></section>
        : q.isPending ? <Skeleton className="h-64" />
          : q.isError ? <ErrorState title="Could not generate the report" message={friendlyError(q.error)} onRetry={() => q.refetch()} /> : (
            <section className="card overflow-hidden" aria-label="Report preview">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 p-4">
                <div><h2 className="text-base font-semibold">{meta.label} report</h2><p className="text-xs text-ink-500">{subtitle}</p>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">{r.summary.map((s) => <span key={s.label} className="text-sm"><span className="text-ink-500">{s.label}: </span><b className="num">{s.value}</b></span>)}</div></div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={!r.rows.length} onClick={() => downloadCsv(`bizpulse-${params.cat}-${stamp}.csv`, r.columns, r.rows)}><Download className="h-4 w-4" aria-hidden="true" />CSV</Button>
                  <Button variant="secondary" size="sm" disabled={!r.rows.length} onClick={() => setBlocked(!printDocument(`BizPulse ${meta.label} report`, reportToHtml({ title: `${meta.label} report`, subtitle, columns: r.columns, rows: r.rows, summary: r.summary })))}><Printer className="h-4 w-4" aria-hidden="true" />PDF</Button>
                </div>
              </div>
              {blocked && <p role="alert" className="px-4 pt-3 text-sm text-brick">Allow pop-ups for this site to export the PDF.</p>}
              {r.rows.length === 0 ? <EmptyState icon={FileSpreadsheet} title="No records match" message="Widen the dates or clear the status filter." /> : (
                <>
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm" style={{ minWidth: 720 }}>
                    <thead className="border-b border-ink-200 bg-ink-100/50 text-xs font-semibold uppercase text-ink-500"><tr>{r.columns.map((c) => <th key={c.key} scope="col" className="px-4 py-3">{c.label}</th>)}</tr></thead>
                    <tbody className="divide-y divide-ink-100">{r.rows.slice((page - 1) * PAGE, page * PAGE).map((row, i) => <tr key={i}>{r.columns.map((c) => <td key={c.key} className="px-4 py-2.5">{String(row[c.key] ?? '')}</td>)}</tr>)}</tbody>
                  </table></div>
                  <Pagination pagination={pagination} onPage={setPage} />
                </>)}
            </section>
          )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, FileText, Plus } from 'lucide-react';
import { createInvoice, listAccounts, listInvoices, markInvoicePaid } from '../../api/admin';
import { friendlyError } from '../../api/errors';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import { DataTable, DateRange, FieldRow, PageIntro, SearchInput, Select, StatusBadge, fmtDate, inputCls } from '../../components/admin/ui';
import { useDebounced } from '../../hooks/useDebounced';
import { invoiceToHtml, printDocument } from '../../utils/export';
import { applyServerError } from '../../utils/forms';
import { formatMoney } from '../../utils/format';

const today = () => new Date().toISOString().slice(0, 10);
const plus = (d) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);

function CreateDialog({ onClose }) {
  const qc = useQueryClient(); const { push } = useToast();
  const clients = useQuery({ queryKey: ['admin', 'accounts', 'client', 'all'], queryFn: () => listAccounts('client', { limit: 100 }) });
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ defaultValues: { clientId: '', amount: '', dueDate: plus(14), description: '' } });
  const m = useMutation({ mutationFn: (v) => createInvoice({ ...v, amount: Number(v.amount), description: v.description.trim() }), onSuccess: (i) => { push(`Invoice ${i.number} created`, 'success'); qc.invalidateQueries({ queryKey: ['admin'] }); onClose(); }, onError: (e) => applyServerError(e, setError, ['clientId', 'amount', 'dueDate', 'description']) });
  return (
    <Dialog open onClose={onClose} title="Create invoice" description="Linked to the client's account and subscription.">
      <form onSubmit={handleSubmit((v) => m.mutate(v))} noValidate className="space-y-4 px-5 py-5 sm:px-6">
        {errors.root?.server && <p role="alert" className="text-sm text-brick">{errors.root.server.message}</p>}
        <FieldRow label="Client" error={errors.clientId?.message}>{(id) => <select id={id} className={inputCls} {...register('clientId', { required: 'Choose a client' })}><option value="">Choose a client</option>{(clients.data?.items || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}</FieldRow>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Amount (UGX)" error={errors.amount?.message}>{(id) => <input id={id} type="number" min="1" step="1" inputMode="numeric" className={inputCls} {...register('amount', { required: 'Enter an amount', min: { value: 1, message: 'Must be above zero' } })} />}</FieldRow>
          <FieldRow label="Due date" error={errors.dueDate?.message}>{(id) => <input id={id} type="date" min={today()} className={inputCls} {...register('dueDate', { required: 'Enter a due date' })} />}</FieldRow>
        </div>
        <FieldRow label="Description" error={errors.description?.message}>{(id) => <input id={id} maxLength={200} className={inputCls} placeholder="Growth plan: monthly subscription" {...register('description', { required: 'Enter a description' })} />}</FieldRow>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={m.isPending}>Create invoice</Button></div>
      </form>
    </Dialog>
  );
}

function PayDialog({ invoice, onClose }) {
  const qc = useQueryClient(); const { push } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { paidAt: today(), method: 'Mobile money' } });
  const m = useMutation({ mutationFn: (v) => markInvoicePaid(invoice.id, v), onSuccess: () => { push('Payment recorded', 'success'); qc.invalidateQueries({ queryKey: ['admin'] }); onClose(); } });
  return (
    <Dialog open onClose={onClose} title={`Record payment: ${invoice.number}`} description={`${invoice.clientName} · ${formatMoney(invoice.amount)}`}>
      <form onSubmit={handleSubmit((v) => m.mutate(v))} noValidate className="space-y-4 px-5 py-5 sm:px-6">
        {m.isError && <p role="alert" className="text-sm text-brick">{friendlyError(m.error)}</p>}
        <FieldRow label="Payment date" error={errors.paidAt?.message}>{(id) => <input id={id} type="date" max={today()} className={inputCls} {...register('paidAt', { required: 'Enter the payment date' })} />}</FieldRow>
        <FieldRow label="Method">{(id) => <select id={id} className={inputCls} {...register('method')}><option>Mobile money</option><option>Card</option><option>Bank transfer</option><option>Cash</option></select>}</FieldRow>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={m.isPending}>Mark as paid</Button></div>
      </form>
    </Dialog>
  );
}

function ViewDialog({ invoice: i, onClose }) {
  const [blocked, setBlocked] = useState(false);
  const Row = ({ k, v }) => <div className="flex justify-between gap-4 py-2 text-sm"><dt className="text-ink-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
  return (
    <Dialog open onClose={onClose} title={`Invoice ${i.number}`} description={i.clientName}>
      <div className="px-5 py-5 sm:px-6">
        <dl className="divide-y divide-ink-100">
          <Row k="Status" v={<StatusBadge status={i.status} />} /><Row k="Description" v={i.description} /><Row k="Plan" v={i.planName} />
          <Row k="Amount" v={formatMoney(i.amount)} /><Row k="Issued" v={fmtDate(i.issuedAt)} /><Row k="Due" v={fmtDate(i.dueDate)} />
          <Row k="Paid" v={i.paidAt ? `${fmtDate(i.paidAt)} · ${i.paymentMethod}` : '—'} />
        </dl>
        {blocked && <p role="alert" className="mt-3 text-sm text-brick">Allow pop-ups for this site to download the PDF.</p>}
        <div className="mt-5 flex justify-end"><Button onClick={() => setBlocked(!printDocument(`Invoice ${i.number}`, invoiceToHtml(i, formatMoney)))}><Download className="h-4 w-4" aria-hidden="true" />Download PDF</Button></div>
      </div>
    </Dialog>
  );
}

export default function AdminInvoices() {
  useEffect(() => { document.title = 'Invoices · BizPulse'; }, []);
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [clientId, setClientId] = useState(''); const [range, setRange] = useState({ from: '', to: '' }); const [page, setPage] = useState(1);
  const [dlg, setDlg] = useState(null);
  const term = useDebounced(search);
  useEffect(() => { setPage(1); }, [term, status, clientId, range.from, range.to]);
  const clients = useQuery({ queryKey: ['admin', 'accounts', 'client', 'all'], queryFn: () => listAccounts('client', { limit: 100 }) });
  const query = useQuery({ queryKey: ['admin', 'invoices', term, status, clientId, range, page], queryFn: () => listInvoices({ search: term, status, clientId, ...range, page, limit: 15 }) });

  const columns = [
    { key: 'number', label: 'Invoice', nowrap: true, render: (i) => <span className="font-semibold">{i.number}</span> },
    { key: 'client', label: 'Client', render: (i) => i.clientName },
    { key: 'amount', label: 'Amount', align: 'right', nowrap: true, render: (i) => <span className="font-semibold">{formatMoney(i.amount)}</span> },
    { key: 'status', label: 'Status', render: (i) => <StatusBadge status={i.status} /> },
    { key: 'due', label: 'Due', nowrap: true, render: (i) => fmtDate(i.dueDate) }, { key: 'paid', label: 'Paid', nowrap: true, render: (i) => fmtDate(i.paidAt) },
    { key: 'actions', label: 'Actions', render: (i) => (
      <div className="flex gap-1.5"><Button size="sm" variant="secondary" onClick={() => setDlg({ type: 'view', invoice: i })}><Eye className="h-3.5 w-3.5" aria-hidden="true" />View</Button>
        {['unpaid', 'overdue'].includes(i.status) && <Button size="sm" onClick={() => setDlg({ type: 'pay', invoice: i })}>Record payment</Button>}</div>) },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageIntro actions={<Button onClick={() => setDlg({ type: 'create' })}><Plus className="h-4 w-4" aria-hidden="true" />Create invoice</Button>}>
        Every invoice belongs to a client account. Filter by status, client or due date, then view or download.
      </PageIntro>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Invoice number or client" />
        <Select label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, { value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' }, { value: 'overdue', label: 'Overdue' }, { value: 'void', label: 'Void' }]} />
        <Select label="Client" value={clientId} onChange={setClientId} options={[{ value: '', label: 'All' }, ...(clients.data?.items || []).map((c) => ({ value: c.id, label: c.name }))]} />
      </div>
      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-ink-600">Due date</span><DateRange {...range} onChange={setRange} /></div>
      <DataTable query={query} columns={columns} label="Invoices" emptyIcon={FileText} emptyTitle="No invoices found" onPage={setPage} minWidth={860} />
      {query.data && <p className="num text-right text-sm text-ink-500">Total of {query.data.pagination.total} matching invoices: <b className="text-ink">{formatMoney(query.data.totals?.amount)}</b></p>}
      {dlg?.type === 'create' && <CreateDialog onClose={() => setDlg(null)} />}
      {dlg?.type === 'pay' && <PayDialog invoice={dlg.invoice} onClose={() => setDlg(null)} />}
      {dlg?.type === 'view' && <ViewDialog invoice={dlg.invoice} onClose={() => setDlg(null)} />}
    </div>
  );
}

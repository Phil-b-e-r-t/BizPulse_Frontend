import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Pencil, Plus } from 'lucide-react';
import { listAccounts, listPlans, listSubscriptions, savePlan, saveSubscription } from '../../api/admin';
import { friendlyError } from '../../api/errors';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { DataTable, FieldRow, PageIntro, SearchInput, Select, StatusBadge, Tabs, fmtDate, inputCls } from '../../components/admin/ui';
import { useDebounced } from '../../hooks/useDebounced';
import { applyServerError } from '../../utils/forms';
import { formatMoney } from '../../utils/format';

const day = (iso) => (iso ? iso.slice(0, 10) : '');
const STATUSES = ['active', 'pending', 'expired', 'cancelled'];

function SubscriptionDialog({ sub, plans, onClose }) {
  const qc = useQueryClient(); const { push } = useToast();
  const clients = useQuery({ queryKey: ['admin', 'accounts', 'client', 'all'], queryFn: () => listAccounts('client', { limit: 100 }), enabled: !sub?.id });
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    defaultValues: { clientId: sub?.clientId || '', planId: sub?.planId || plans[0]?.id || '', startDate: day(sub?.startDate) || new Date().toISOString().slice(0, 10), endDate: day(sub?.endDate) || '', status: sub?.status || 'active' },
  });
  const m = useMutation({
    mutationFn: (v) => saveSubscription({ ...v, id: sub?.id }),
    onSuccess: () => { push(sub?.id ? 'Subscription updated' : 'Subscription created', 'success'); qc.invalidateQueries({ queryKey: ['admin'] }); onClose(); },
    onError: (e) => applyServerError(e, setError, ['clientId', 'planId', 'startDate', 'endDate']),
  });
  return (
    <Dialog open onClose={onClose} title={sub?.id ? `Edit subscription: ${sub.clientName}` : 'New subscription'} description="Changes are recorded in the audit log.">
      <form onSubmit={handleSubmit((v) => m.mutate(v))} noValidate className="space-y-4 px-5 py-5 sm:px-6">
        {errors.root?.server && <p role="alert" className="text-sm text-brick">{errors.root.server.message}</p>}
        {!sub?.id && <FieldRow label="Client" error={errors.clientId?.message}>{(id) => (
          <select id={id} className={inputCls} {...register('clientId', { required: 'Choose a client' })}>
            <option value="">{clients.isPending ? 'Loading clients' : 'Choose a client'}</option>
            {(clients.data?.items || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>)}</FieldRow>}
        <FieldRow label="Plan" error={errors.planId?.message}>{(id) => <select id={id} className={inputCls} {...register('planId', { required: 'Choose a plan' })}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name} ({formatMoney(p.price)}/{p.period === 'yearly' ? 'yr' : 'mo'})</option>)}</select>}</FieldRow>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Start date" error={errors.startDate?.message}>{(id) => <input id={id} type="date" className={inputCls} {...register('startDate', { required: 'Enter a start date' })} />}</FieldRow>
          <FieldRow label="Expiry date" error={errors.endDate?.message}>{(id) => <input id={id} type="date" className={inputCls} {...register('endDate', { required: 'Enter an expiry date', validate: (v, f) => v > f.startDate || 'Expiry must be after the start date' })} />}</FieldRow>
        </div>
        <FieldRow label="Status">{(id) => <select id={id} className={inputCls} {...register('status')}>{STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>}</FieldRow>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={m.isPending}>Save</Button></div>
      </form>
    </Dialog>
  );
}

function PlanDialog({ plan, onClose }) {
  const qc = useQueryClient(); const { push } = useToast();
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    defaultValues: { name: plan?.name || '', price: plan?.price ?? 0, period: plan?.period || 'monthly', maxUsers: plan?.maxUsers || 1, features: (plan?.features || []).join('\n'), active: plan?.active ?? true },
  });
  const m = useMutation({
    mutationFn: (v) => savePlan({ id: plan?.id, name: v.name.trim(), price: Number(v.price), period: v.period, maxUsers: Number(v.maxUsers), active: v.active, features: v.features.split('\n').map((f) => f.trim()).filter(Boolean) }),
    onSuccess: () => { push('Plan saved', 'success'); qc.invalidateQueries({ queryKey: ['admin'] }); onClose(); },
    onError: (e) => applyServerError(e, setError, ['name', 'price']),
  });
  return (
    <Dialog open onClose={onClose} title={plan?.id ? `Edit plan: ${plan.name}` : 'New plan'} description="Price changes apply to future invoices only.">
      <form onSubmit={handleSubmit((v) => m.mutate(v))} noValidate className="space-y-4 px-5 py-5 sm:px-6">
        {errors.root?.server && <p role="alert" className="text-sm text-brick">{errors.root.server.message}</p>}
        <FieldRow label="Plan name" error={errors.name?.message}>{(id) => <input id={id} className={inputCls} {...register('name', { required: 'Enter a name', maxLength: { value: 40, message: 'Keep it under 40 characters' } })} />}</FieldRow>
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldRow label="Price (UGX)" error={errors.price?.message}>{(id) => <input id={id} type="number" min="0" step="1000" className={inputCls} {...register('price', { required: 'Enter a price', min: { value: 0, message: 'Cannot be negative' } })} />}</FieldRow>
          <FieldRow label="Billing">{(id) => <select id={id} className={inputCls} {...register('period')}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>}</FieldRow>
          <FieldRow label="Max users" error={errors.maxUsers?.message}>{(id) => <input id={id} type="number" min="1" className={inputCls} {...register('maxUsers', { required: 'Required', min: { value: 1, message: 'At least 1' } })} />}</FieldRow>
        </div>
        <FieldRow label="Features" hint="One per line">{(id) => <textarea id={id} rows={4} className={`${inputCls} h-auto py-2`} {...register('features')} />}</FieldRow>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-brand" {...register('active')} /> Available to assign</label>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={m.isPending}>Save plan</Button></div>
      </form>
    </Dialog>
  );
}

export default function AdminSubscriptions() {
  useEffect(() => { document.title = 'Subscriptions · BizPulse'; }, []);
  const qc = useQueryClient(); const { push } = useToast();
  const [tab, setTab] = useState('subs'); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [planId, setPlanId] = useState(''); const [page, setPage] = useState(1);
  const [subDialog, setSubDialog] = useState(null); const [planDialog, setPlanDialog] = useState(null);
  const term = useDebounced(search);
  useEffect(() => { setPage(1); }, [term, status, planId]);
  const plansQ = useQuery({ queryKey: ['admin', 'plans'], queryFn: listPlans });
  const plans = plansQ.data?.items || [];
  const query = useQuery({ queryKey: ['admin', 'subscriptions', term, status, planId, page], queryFn: () => listSubscriptions({ search: term, status, planId, page, limit: 15 }) });
  const cancel = useMutation({ mutationFn: (s) => saveSubscription({ id: s.id, status: 'cancelled' }), onSuccess: () => { push('Subscription cancelled', 'success'); qc.invalidateQueries({ queryKey: ['admin'] }); }, onError: (e) => push(friendlyError(e), 'error') });

  const columns = [
    { key: 'client', label: 'Client', render: (s) => <span className="font-medium">{s.clientName}</span> },
    { key: 'plan', label: 'Plan', render: (s) => s.planName }, { key: 'start', label: 'Start', nowrap: true, render: (s) => fmtDate(s.startDate) }, { key: 'end', label: 'Expires', nowrap: true, render: (s) => fmtDate(s.endDate) },
    { key: 'status', label: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'actions', label: 'Actions', render: (s) => (
      <div className="flex gap-1.5"><Button size="sm" variant="secondary" onClick={() => setSubDialog(s)}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit</Button>
        {['active', 'pending'].includes(s.status) && <Button size="sm" variant="ghost" loading={cancel.isPending && cancel.variables?.id === s.id} onClick={() => cancel.mutate(s)}>Cancel</Button>}</div>) },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageIntro actions={tab === 'subs' ? <Button onClick={() => setSubDialog({})} disabled={!plans.length}><Plus className="h-4 w-4" aria-hidden="true" />New subscription</Button> : <Button onClick={() => setPlanDialog({})}><Plus className="h-4 w-4" aria-hidden="true" />New plan</Button>}>
        Assign plans to client accounts, track start and expiry dates, and manage the plans on offer.
      </PageIntro>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'subs', label: 'Subscriptions' }, { value: 'plans', label: 'Plans' }]} />
      {tab === 'subs' ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search client" />
            <Select label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]} />
            <Select label="Plan" value={planId} onChange={setPlanId} options={[{ value: '', label: 'All' }, ...plans.map((p) => ({ value: p.id, label: p.name }))]} />
          </div>
          <DataTable query={query} columns={columns} label="Subscriptions" emptyIcon={CreditCard} emptyTitle="No subscriptions found" onPage={setPage} />
        </>
      ) : plansQ.isPending ? <Skeleton className="h-40" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <article key={p.id} className="card flex flex-col p-4">
              <div className="flex items-start justify-between gap-2"><h3 className="text-base font-bold">{p.name}</h3>{!p.active && <span className="text-xs font-semibold text-ink-500">Hidden</span>}</div>
              <p className="num mt-1 text-xl font-bold">{formatMoney(p.price)}<span className="text-sm font-medium text-ink-500"> / {p.period === 'yearly' ? 'year' : 'month'}</span></p>
              <ul className="mt-3 flex-1 space-y-1 text-sm text-ink-600">{p.features.map((f) => <li key={f}>• {f}</li>)}</ul>
              <Button variant="secondary" size="sm" className="mt-4 self-start" onClick={() => setPlanDialog(p)}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit plan</Button>
            </article>
          ))}
        </div>
      )}
      {subDialog && <SubscriptionDialog sub={subDialog} plans={plans} onClose={() => setSubDialog(null)} />}
      {planDialog && <PlanDialog plan={planDialog} onClose={() => setPlanDialog(null)} />}
    </div>
  );
}

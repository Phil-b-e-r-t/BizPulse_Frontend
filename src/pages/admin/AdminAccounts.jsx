import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Lock, LockOpen, ShieldCheck, ShieldOff, UserRound } from 'lucide-react';
import { getAccount, listAccounts, setAccountStatus, terminateClientSessions, terminateUserSessions } from '../../api/admin';
import { friendlyError } from '../../api/errors';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { DataTable, PageIntro, ReasonDialog, SearchInput, Select, StatusBadge, Tabs, fmtDate, fmtStamp } from '../../components/admin/ui';
import { useDebounced } from '../../hooks/useDebounced';
import { formatMoney } from '../../utils/format';

const COPY = {
  suspend: { title: 'Suspend this account?', description: 'It cannot log in or use any protected page until restored. Active sessions end now.', label: 'Suspend', danger: true, done: 'Account suspended' },
  restore: { title: 'Restore this account?', description: 'Access is restored and the person can log in again.', label: 'Restore', danger: false, done: 'Account restored' },
  lock: { title: 'Lock this account?', description: 'Login is blocked until an administrator unlocks it.', label: 'Lock', danger: true, done: 'Account locked' },
  unlock: { title: 'Unlock this account?', description: 'Failed login attempts are cleared and login works again.', label: 'Unlock', danger: false, done: 'Account unlocked' },
  sessions: { title: 'End all sessions?', description: 'Signs the account out everywhere, immediately.', label: 'End sessions', danger: true, done: 'Sessions ended' },
};

function Detail({ kind, id, onAction }) {
  const q = useQuery({ queryKey: ['admin', 'account', kind, id], queryFn: () => getAccount(kind, id) });
  if (q.isPending) return <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  if (q.isError) return <ErrorState compact title="Could not load this account" message={friendlyError(q.error)} onRetry={() => q.refetch()} />;
  const { account: a, subscription: s, invoices = [], users = [], sessions = [], activity = [] } = q.data;
  const isAdminUser = a.role === 'superadmin';
  const Row = ({ k, v }) => <div className="flex justify-between gap-4 py-1.5 text-sm"><dt className="text-ink-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
  return (
    <div className="space-y-5 px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-2"><StatusBadge status={a.status} />
        {a.statusChange && <span className="text-xs text-ink-500">{a.statusChange.by} · {fmtStamp(a.statusChange.at)} · “{a.statusChange.reason}”</span>}</div>
      {!isAdminUser && (
        <div className="flex flex-wrap gap-2">
          {a.status === 'suspended' ? <Button size="sm" onClick={() => onAction('restore', a)}><ShieldCheck className="h-4 w-4" aria-hidden="true" />Restore</Button>
            : <Button size="sm" variant="danger" onClick={() => onAction('suspend', a)}><ShieldOff className="h-4 w-4" aria-hidden="true" />Suspend</Button>}
          {a.status === 'locked' ? <Button size="sm" variant="secondary" onClick={() => onAction('unlock', a)}><LockOpen className="h-4 w-4" aria-hidden="true" />Unlock</Button>
            : a.status === 'active' && <Button size="sm" variant="secondary" onClick={() => onAction('lock', a)}><Lock className="h-4 w-4" aria-hidden="true" />Lock</Button>}
          {sessions.length > 0 && <Button size="sm" variant="secondary" onClick={() => onAction('sessions', a)}>End {sessions.length} session{sessions.length === 1 ? '' : 's'}</Button>}
        </div>
      )}
      <dl className="divide-y divide-ink-100 rounded-md border border-ink-200 px-3">
        <Row k="Name" v={a.name} /><Row k="Email" v={a.email} />
        {kind === 'client' ? <><Row k="Phone" v={a.phone} /><Row k="Industry" v={a.industry} /></> : <><Row k="Role" v={<span className="capitalize">{a.role}</span>} /><Row k="Client account" v={a.clientName} /><Row k="Last login" v={fmtStamp(a.lastLoginAt)} /></>}
        <Row k="Created" v={fmtDate(a.createdAt)} />
      </dl>
      {kind === 'client' && (
        <section><h3 className="mb-2 text-sm font-semibold">People in this business ({users.length})</h3>
          <ul className="divide-y divide-ink-100 rounded-md border border-ink-200">{users.map((u) => <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm"><span className="min-w-0 truncate">{u.name} <span className="capitalize text-ink-500">· {u.role}</span></span><StatusBadge status={u.status} /></li>)}</ul></section>
      )}
      <section><h3 className="mb-2 text-sm font-semibold">Subscription</h3>
        {s ? <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink-200 px-3 py-2.5 text-sm"><span><b>{s.planName}</b> · {fmtDate(s.startDate)} to {fmtDate(s.endDate)}</span><StatusBadge status={s.status} /></div> : <p className="text-sm text-ink-500">No subscription.</p>}</section>
      <section><h3 className="mb-2 text-sm font-semibold">Recent invoices</h3>
        {invoices.length === 0 ? <p className="text-sm text-ink-500">No invoices.</p> : <ul className="divide-y divide-ink-100 rounded-md border border-ink-200">
          {invoices.map((i) => <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm"><span>{i.number} <span className="text-ink-500">· due {fmtDate(i.dueDate)}</span></span><span className="flex items-center gap-2"><span className="num font-medium">{formatMoney(i.amount)}</span><StatusBadge status={i.status} /></span></li>)}</ul>}</section>
      <section><h3 className="mb-2 text-sm font-semibold">Recent activity</h3>
        {activity.length === 0 ? <p className="text-sm text-ink-500">No recorded activity.</p> : <ul className="divide-y divide-ink-100 rounded-md border border-ink-200">
          {activity.map((e) => <li key={e.id} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm"><span><b>{e.action}</b> <span className="text-ink-500">· {e.actor}</span></span><span className="text-xs text-ink-500">{fmtStamp(e.at)}</span></li>)}</ul>}</section>
    </div>
  );
}

export default function AdminAccounts() {
  useEffect(() => { document.title = 'Accounts · BizPulse'; }, []);
  const qc = useQueryClient(); const { push } = useToast();
  const [kind, setKind] = useState('client'); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null); const [action, setAction] = useState(null);
  const term = useDebounced(search);
  useEffect(() => { setPage(1); }, [term, status, kind]);

  const query = useQuery({ queryKey: ['admin', 'accounts', kind, term, status, page], queryFn: () => listAccounts(kind, { search: term, status, page, limit: 15 }) });
  const mutation = useMutation({
    mutationFn: ({ type, account, reason }) => (type === 'sessions' ? (kind === 'client' ? terminateClientSessions(account.id, reason) : terminateUserSessions(account.id, reason)) : setAccountStatus(kind, account.id, type, reason)),
    onSuccess: (_, v) => { push(COPY[v.type].done, 'success'); setAction(null); qc.invalidateQueries({ queryKey: ['admin'] }); },
  });
  const cfg = COPY[action?.type] || COPY.suspend;

  const columns = kind === 'client' ? [
    { key: 'name', label: 'Business', render: (a) => <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-ink-400" aria-hidden="true" /><span><span className="block font-medium">{a.name}</span><span className="text-xs text-ink-500">{a.email}</span></span></span> },
    { key: 'industry', label: 'Industry' }, { key: 'created', label: 'Joined', nowrap: true, render: (a) => fmtDate(a.createdAt) }, { key: 'status', label: 'Status', render: (a) => <StatusBadge status={a.status} /> },
  ] : [
    { key: 'name', label: 'Person', render: (a) => <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-ink-400" aria-hidden="true" /><span><span className="block font-medium">{a.name}</span><span className="text-xs text-ink-500">{a.email}</span></span></span> },
    { key: 'role', label: 'Role', render: (a) => <span className="capitalize">{a.role}</span> }, { key: 'client', label: 'Client account', render: (a) => a.clientName },
    { key: 'last', label: 'Last login', nowrap: true, render: (a) => fmtDate(a.lastLoginAt) }, { key: 'status', label: 'Status', render: (a) => <StatusBadge status={a.status} /> },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageIntro>Client accounts are businesses. User accounts are the individual people who sign in to them. Open a row for details.</PageIntro>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={kind} onChange={setKind} tabs={[{ value: 'client', label: 'Clients' }, { value: 'user', label: 'Users' }]} />
        <SearchInput value={search} onChange={setSearch} placeholder={kind === 'client' ? 'Search business or email' : 'Search name, email or client'} />
        <Select label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }, { value: 'locked', label: 'Locked' }]} />
      </div>
      <DataTable query={query} columns={columns} label="Accounts" emptyIcon={Building2} emptyTitle="No accounts found" onPage={setPage} onRowClick={setOpen} />
      <Dialog open={!!open && !action} onClose={() => setOpen(null)} wide title={open?.name || 'Account'} description={kind === 'client' ? 'Client business account' : 'Individual user account'}>
        {open && <Detail kind={kind} id={open.id} onAction={(type, account) => setAction({ type, account })} />}
      </Dialog>
      <ReasonDialog open={!!action} onClose={() => { setAction(null); mutation.reset(); }} title={cfg.title} description={cfg.description} confirmLabel={cfg.label} danger={cfg.danger}
        loading={mutation.isPending} error={mutation.isError ? friendlyError(mutation.error) : null} onConfirm={(reason) => mutation.mutate({ ...action, reason })} />
    </div>
  );
}

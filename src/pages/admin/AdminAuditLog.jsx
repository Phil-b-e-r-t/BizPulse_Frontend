import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, ScrollText } from 'lucide-react';
import { listAccounts, listAudit, listAuditActions } from '../../api/admin';
import { DataTable, DateRange, PageIntro, SearchInput, Select, fmtStamp } from '../../components/admin/ui';
import { useDebounced } from '../../hooks/useDebounced';

const label = (a) => a.replace('.', ' · ').replace(/_/g, ' ');

export default function AdminAuditLog() {
  useEffect(() => { document.title = 'Audit log · BizPulse'; }, []);
  const [user, setUser] = useState(''); const [action, setAction] = useState(''); const [accountId, setAccountId] = useState(''); const [range, setRange] = useState({ from: '', to: '' }); const [page, setPage] = useState(1);
  const term = useDebounced(user);
  useEffect(() => { setPage(1); }, [term, action, accountId, range.from, range.to]);
  const actions = useQuery({ queryKey: ['admin', 'audit-actions'], queryFn: listAuditActions });
  const clients = useQuery({ queryKey: ['admin', 'accounts', 'client', 'all'], queryFn: () => listAccounts('client', { limit: 100 }) });
  const query = useQuery({ queryKey: ['admin', 'audit', term, action, accountId, range, page], queryFn: () => listAudit({ user: term, action, accountId, ...range, page, limit: 20 }) });

  const columns = [
    { key: 'at', label: 'Time', nowrap: true, render: (e) => fmtStamp(e.at) },
    { key: 'actor', label: 'Performed by', render: (e) => <span className="font-medium">{e.actor}</span> },
    { key: 'action', label: 'Action', nowrap: true, render: (e) => <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">{e.action}</code> },
    { key: 'resource', label: 'Affected', render: (e) => <span className="break-all">{e.resource}</span> },
    { key: 'account', label: 'Account', render: (e) => e.accountName },
    { key: 'details', label: 'Details', render: (e) => <span className="text-ink-600">{e.details}</span> },
    { key: 'ip', label: 'IP', nowrap: true, render: (e) => <span className="text-xs text-ink-500">{e.ip}</span> },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageIntro actions={<span className="inline-flex items-center gap-1.5 rounded-md bg-ink-100 px-2.5 py-1.5 text-xs font-semibold text-ink-600"><Lock className="h-3.5 w-3.5" aria-hidden="true" />Read-only. Entries cannot be edited or deleted.</span>}>
        A permanent record of sign-ins, security actions, billing changes and settings changes.
      </PageIntro>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={user} onChange={setUser} placeholder="Filter by user" label="Filter by user" />
        <Select label="Action" value={action} onChange={setAction} options={[{ value: '', label: 'All' }, ...(actions.data?.items || []).map((a) => ({ value: a, label: label(a) }))]} />
        <Select label="Account" value={accountId} onChange={setAccountId} options={[{ value: '', label: 'All' }, ...(clients.data?.items || []).map((c) => ({ value: c.id, label: c.name }))]} />
      </div>
      <DateRange {...range} onChange={setRange} />
      <DataTable query={query} columns={columns} label="Audit log" emptyIcon={ScrollText} emptyTitle="No matching entries" onPage={setPage} minWidth={980} />
    </div>
  );
}

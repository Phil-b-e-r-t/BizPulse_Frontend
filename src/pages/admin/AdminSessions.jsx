import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, MonitorSmartphone, Users } from 'lucide-react';
import { listSessions, terminateClientSessions, terminateSession, terminateUserSessions } from '../../api/admin';
import { friendlyError } from '../../api/errors';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { DataTable, PageIntro, ReasonDialog, SearchInput, fmtStamp, timeAgo } from '../../components/admin/ui';
import { useDebounced } from '../../hooks/useDebounced';

const ACTIONS = {
  session: { title: 'End this session?', description: 'This device is signed out immediately and loses access to protected pages.', label: 'End session' },
  user: { title: 'Force log out this user?', description: 'Every session for this user, on every device, is ended immediately.', label: 'Log out user' },
  client: { title: 'End all sessions for this client account?', description: 'Everyone signed in to this business is signed out immediately.', label: 'End all sessions' },
};

export default function AdminSessions() {
  useEffect(() => { document.title = 'Sessions · BizPulse'; }, []);
  const qc = useQueryClient();
  const { push } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null); // { scope, row }
  const term = useDebounced(search);
  useEffect(() => { setPage(1); }, [term]);

  const query = useQuery({ queryKey: ['admin', 'sessions', term, page], queryFn: () => listSessions({ search: term, page, limit: 15 }), refetchInterval: 20_000 });
  const mutation = useMutation({
    mutationFn: ({ scope, row, reason }) => (scope === 'session' ? terminateSession(row.id, reason) : scope === 'user' ? terminateUserSessions(row.userId, reason) : terminateClientSessions(row.clientId, reason)),
    onSuccess: (r) => { push(`${r.terminated} session${r.terminated === 1 ? '' : 's'} ended`, 'success'); setTarget(null); qc.invalidateQueries({ queryKey: ['admin'] }); },
  });

  const columns = [
    { key: 'user', label: 'User', render: (s) => <span><span className="block font-medium">{s.username}</span><span className="text-xs text-ink-500">{s.email}</span></span> },
    { key: 'client', label: 'Client account', render: (s) => s.clientName },
    { key: 'login', label: 'Login time', nowrap: true, render: (s) => fmtStamp(s.loginAt) },
    { key: 'last', label: 'Last activity', nowrap: true, render: (s) => timeAgo(s.lastActivityAt) },
    { key: 'device', label: 'Device', render: (s) => <span><span className="block">{s.device}</span><span className="text-xs text-ink-500">{s.ip}</span></span> },
    { key: 'actions', label: 'Actions', render: (s) => (s.current ? <Badge tone="green">This session</Badge> : (
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="secondary" onClick={() => setTarget({ scope: 'session', row: s })}>End</Button>
        <Button size="sm" variant="secondary" onClick={() => setTarget({ scope: 'user', row: s })}><LogOut className="h-3.5 w-3.5" aria-hidden="true" />User</Button>
        <Button size="sm" variant="secondary" onClick={() => setTarget({ scope: 'client', row: s })}><Users className="h-3.5 w-3.5" aria-hidden="true" />Account</Button>
      </div>
    )) },
  ];
  const cfg = ACTIONS[target?.scope] || ACTIONS.session;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageIntro actions={<SearchInput value={search} onChange={setSearch} placeholder="Search user or client" />}>
        Everyone signed in right now. Ended sessions lose access immediately. Refreshes every 20 seconds.
      </PageIntro>
      <DataTable query={query} columns={columns} label="Active sessions" emptyIcon={MonitorSmartphone} emptyTitle="No active sessions" emptyMessage="Nobody matches this search." onPage={setPage} minWidth={900} />
      <ReasonDialog open={!!target} onClose={() => setTarget(null)} title={cfg.title} description={target ? `${cfg.description} (${target.scope === 'client' ? target.row.clientName : target.row.username})` : ''} confirmLabel={cfg.label}
        loading={mutation.isPending} error={mutation.isError ? friendlyError(mutation.error) : null} onConfirm={(reason) => mutation.mutate({ ...target, reason })} />
    </div>
  );
}
